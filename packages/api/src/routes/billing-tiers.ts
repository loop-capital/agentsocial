import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  getTiers,
  getSubscription,
  upgradeTier,
  downgradeTier,
  cancelSubscription,
  getBillingHistory,
} from "../services/billing-tiers.js";

export const billingTiersRoutes = async (server: FastifyInstance) => {

  // ─── List all tiers (public, no auth) ──────────────────────────────────────

  server.get("/tiers", async (_request, reply) => {
    const tiers = getTiers();
    return reply.send({ tiers });
  });

  // ─── Get current subscription (auth required) ──────────────────────────────

  server.get("/subscription", {
    schema: {
      querystring: z.object({ brand_id: z.string().uuid() }),
    },
  }, async (request, reply) => {
    const { brand_id } = request.query as { brand_id: string };

    try {
      const subscription = await getSubscription(brand_id);
      if (!subscription) {
        return reply.status(404).send({
          error: { code: "not_found", message: "No subscription found for this brand" },
        });
      }
      return reply.send({ subscription });
    } catch (err: any) {
      return reply.status(500).send({
        error: { code: "internal_error", message: err.message },
      });
    }
  });

  // ─── Upgrade tier ──────────────────────────────────────────────────────────

  server.post("/subscription/upgrade", {
    schema: {
      body: z.object({
        brand_id: z.string().uuid(),
        target_tier_id: z.enum(["core", "pro", "elite"]),
      }),
    },
  }, async (request, reply) => {
    const { brand_id, target_tier_id } = request.body as {
      brand_id: string;
      target_tier_id: "core" | "pro" | "elite";
    };

    try {
      const result = await upgradeTier(brand_id, target_tier_id);
      return reply.send(result);
    } catch (err: any) {
      const status = err.message.includes("Cannot upgrade") ? 400 : 500;
      return reply.status(status).send({
        error: { code: status === 400 ? "invalid_tier_change" : "internal_error", message: err.message },
      });
    }
  });

  // ─── Downgrade tier ───────────────────────────────────────────────────────

  server.post("/subscription/downgrade", {
    schema: {
      body: z.object({
        brand_id: z.string().uuid(),
        target_tier_id: z.enum(["core", "pro", "elite"]),
      }),
    },
  }, async (request, reply) => {
    const { brand_id, target_tier_id } = request.body as {
      brand_id: string;
      target_tier_id: "core" | "pro" | "elite";
    };

    try {
      const result = await downgradeTier(brand_id, target_tier_id);
      return reply.send(result);
    } catch (err: any) {
      const status = err.message.includes("Cannot downgrade") ? 400 : 500;
      return reply.status(status).send({
        error: { code: status === 400 ? "invalid_tier_change" : "internal_error", message: err.message },
      });
    }
  });

  // ─── Cancel subscription ────────────────────────────────────────────────────

  server.post("/subscription/cancel", {
    schema: {
      body: z.object({
        brand_id: z.string().uuid(),
        reason: z.string().optional(),
      }),
    },
  }, async (request, reply) => {
    const { brand_id, reason } = request.body as {
      brand_id: string;
      reason?: string;
    };

    try {
      const result = await cancelSubscription(brand_id, reason);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(500).send({
        error: { code: "cancel_failed", message: err.message },
      });
    }
  });

  // ─── Billing history ────────────────────────────────────────────────────────

  server.get("/history", {
    schema: {
      querystring: z.object({ brand_id: z.string().uuid() }),
    },
  }, async (request, reply) => {
    const { brand_id } = request.query as { brand_id: string };
    const items = getBillingHistory(brand_id);
    return reply.send({
      items,
      pagination: { total: items.length, hasMore: false },
    });
  });
};