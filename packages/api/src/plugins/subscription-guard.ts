import type { FastifyInstance } from "fastify";
import { db, brands } from "../db/index.js";
import { eq } from "drizzle-orm";

// ─── Subscription Guard Plugin ────────────────────────────────────────────────
// Checks that the user's brand has an active subscription before allowing access.
// Free tier brands are always allowed but have feature limits enforced elsewhere.

export async function subscriptionGuardPlugin(server: FastifyInstance) {
  server.decorateRequest("brandId", null);
  server.decorateRequest("subscriptionStatus", null);
  server.decorateRequest("subscriptionPlan", null);

  // Add a preHandler that checks subscription status
  // This is opt-in per route — routes that need it call:
  //   server.route({ ..., preHandler: [server.requireActiveSubscription], ... })
  server.decorate("requireActiveSubscription", async (request: any, reply: any) => {
    const brandId = request.brandId || request.query?.brand_id || request.body?.brand_id;

    if (!brandId) {
      // No brand context — allow through (other middleware handles auth)
      return;
    }

    try {
      const [brand] = await db.select({
        subscriptionStatus: brands.subscriptionStatus,
        subscriptionPlan: brands.subscriptionPlan,
      }).from(brands).where(eq(brands.id, brandId)).limit(1);

      if (!brand) {
        return reply.status(404).send({
          error: { code: "brand_not_found", message: "Brand not found" },
        });
      }

      // Store on request for downstream use
      request.subscriptionStatus = brand.subscriptionStatus;
      request.subscriptionPlan = brand.subscriptionPlan;

      // Block inactive/canceled brands
      if (brand.subscriptionStatus === "inactive" || brand.subscriptionStatus === "canceled") {
        // Free tier is allowed — only block if they had a paid plan that got canceled
        if (brand.subscriptionPlan && brand.subscriptionPlan !== "free") {
          return reply.status(402).send({
            error: {
              code: "subscription_required",
              message: "Your subscription is no longer active. Please update your billing to continue.",
              subscription_status: brand.subscriptionStatus,
            },
          });
        }
      }

      // Past due — allow with warning header
      if (brand.subscriptionStatus === "past_due") {
        reply.header("X-Subscription-Warning", "payment_overdue");
      }
    } catch (err: any) {
      // DB error — allow through to avoid blocking all access
      console.error("[subscription-guard] Error checking subscription:", err.message);
    }
  });
}

// ─── TypeScript declarations ──────────────────────────────────────────────────

declare module "fastify" {
  interface FastifyRequest {
    brandId: string | null;
    subscriptionStatus: string | null;
    subscriptionPlan: string | null;
  }
  interface FastifyInstance {
    requireActiveSubscription: (request: any, reply: any) => Promise<void>;
  }
}