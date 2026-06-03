import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  createSubscriptionPlans,
  createSubscription,
  cancelSubscription,
  getSubscriptionStatus,
  getPlanLimits,
  isWithinLimit,
  getOrCreateSquareCustomer,
  PLANS,
  processWebhookEvent,
} from "../services/square-billing.js";
import { db, brands } from "../db/index.js";
import { eq } from "drizzle-orm";

// ─── Webhook Signature Verification ──────────────────────────────────────────
// Square webhook signature verification using HMAC-SHA256
// In production, set SQUARE_WEBHOOK_SIGNATURE_KEY in .env

function verifyWebhookSignature(payload: string, signatureHeader: string): boolean {
  // In sandbox mode, skip verification if no signature key is configured
  if (process.env.SQUARE_ENVIRONMENT === "sandbox" && !process.env.SQUARE_WEBHOOK_SIGNATURE_KEY) {
    return true;
  }

  const crypto = require("crypto");
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!signatureKey) return false;

  const expectedSignature = crypto
    .createHmac("sha256", signatureKey)
    .update(payload)
    .digest("base64");

  return expectedSignature === signatureHeader;
}

export const billingRoutes = async (server: FastifyInstance) => {

  // ─── Get available plans ───────────────────────────────────────────────────

  server.get("/plans", async (_request, reply) => {
    const plans = Object.entries(PLANS).map(([key, plan]) => ({
      key,
      name: plan.name,
      price: plan.price,
      currency: plan.currency,
      interval: plan.interval,
      features: plan.features,
    }));

    return reply.send({ plans });
  });

  // ─── Get current subscription status ────────────────────────────────────────

  server.get("/status", {
    schema: {
      querystring: z.object({ brand_id: z.string().uuid() }),
    },
  }, async (request, reply) => {
    const { brand_id } = request.query as { brand_id: string };

    try {
      const status = await getSubscriptionStatus(brand_id);
      const limits = getPlanLimits(status.plan);

      return reply.send({
        ...status,
        limits: Object.fromEntries(
          Object.entries(limits).map(([k, v]) => [k, v === Infinity ? "unlimited" : v])
        ),
      });
    } catch (err: any) {
      return reply.status(404).send({ error: { code: "not_found", message: err.message } });
    }
  });

  // ─── Initialize plans in Square (admin only) ────────────────────────────────

  server.post("/init-plans", async (_request, reply) => {
    try {
      const createdIds = await createSubscriptionPlans();
      return reply.send({ created: createdIds });
    } catch (err: any) {
      return reply.status(500).send({ error: { code: "plan_creation_failed", message: err.message } });
    }
  });

  // ─── Create checkout link (public, redirects to Square) ──────────────────

  server.post("/checkout", {
    schema: {
      body: z.object({
        brand_id: z.string().uuid(),
        plan: z.enum(["pro", "agency"]),
      }),
    },
  }, async (request, reply) => {
    const { brand_id, plan } = request.body as { brand_id: string; plan: string };

    try {
      // Get brand + user info for customer creation
      const [brand] = await db.select().from(brands).where(eq(brands.id, brand_id)).limit(1);
      if (!brand) {
        return reply.status(404).send({ error: { code: "not_found", message: "Brand not found" } });
      }

      // Get user info (need email + name for Square customer)
      const { users } = await import("../db/index.js");
      const [user] = await db.select().from(users).where(eq(users.id, brand.userId)).limit(1);

      if (!user) {
        return reply.status(404).send({ error: { code: "not_found", message: "User not found" } });
      }

      // Create or get Square customer
      const customerId = await getOrCreateSquareCustomer(
        user.id, user.email, user.name, brand_id
      );

      // Create checkout link (redirects to Square payment page)
      const result = await createSubscription(brand_id, plan, customerId);

      return reply.status(201).send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: { code: "subscription_failed", message: err.message } });
    }
  });

  // ─── Cancel subscription ────────────────────────────────────────────────────

  server.post("/cancel", {
    schema: {
      body: z.object({ brand_id: z.string().uuid() }),
    },
  }, async (request, reply) => {
    const { brand_id } = request.body as { brand_id: string };

    try {
      const result = await cancelSubscription(brand_id);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: { code: "cancel_failed", message: err.message } });
    }
  });

  // ─── Check feature access ──────────────────────────────────────────────────

  server.get("/check-access", {
    schema: {
      querystring: z.object({
        brand_id: z.string().uuid(),
        feature: z.string(),
        current: z.coerce.number().optional().default(0),
      }),
    },
  }, async (request, reply) => {
    const { brand_id, feature, current } = request.query as { brand_id: string; feature: string; current: number };

    const [brand] = await db.select({
      subscriptionPlan: brands.subscriptionPlan,
      subscriptionStatus: brands.subscriptionStatus,
    }).from(brands).where(eq(brands.id, brand_id)).limit(1);

    if (!brand) {
      return reply.status(404).send({ error: { code: "not_found", message: "Brand not found" } });
    }

    const isActive = brand.subscriptionStatus === "active" || brand.subscriptionStatus === "trialing";
    const withinLimit = isWithinLimit(brand.subscriptionPlan, feature, current);

    return reply.send({
      allowed: isActive && withinLimit,
      active: isActive,
      withinLimit,
      plan: brand.subscriptionPlan || "free",
    });
  });

  // ─── Square Webhook ─────────────────────────────────────────────────────────

  server.post("/webhook", async (request, reply) => {
    const payload = JSON.stringify(request.body);
    const signature = request.headers["x-square-hmac-sha256"] as string || "";

    if (!verifyWebhookSignature(payload, signature)) {
      return reply.status(401).send({ error: "Invalid signature" });
    }

    const body = request.body as any;
    const eventType = body?.type || body?.event_type;

    if (!eventType) {
      return reply.status(400).send({ error: "Missing event type" });
    }

    // Process asynchronously
    processWebhookEvent(eventType, body?.data || body).catch((err) => {
      console.error("[billing] Webhook processing error:", err);
    });

    // Acknowledge immediately
    return reply.status(200).send({ received: true });
  });
};