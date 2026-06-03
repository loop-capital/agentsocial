/**
 * Composio Routes — managed OAuth connections + action execution
 *
 * Endpoints:
 *   GET  /composio/accounts   — list connected accounts for a brand
 *   POST /composio/connect     — generate OAuth connection link for a toolkit
 *   POST /composio/execute     — execute a Composio action (post, comment, etc.)
 *
 * All routes require auth middleware.
 * Brand ownership is verified before any Composio call.
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db, brands, channels } from "../db/index.js";
import {
  getConnectedAccounts,
  getConnectionLink,
  executeAction,
  PLATFORM_TO_TOOLKIT,
  SUPPORTED_TOOLKITS,
} from "../services/composio.js";

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const connectSchema = z.object({
  brand_id: z.string().min(1),
  toolkit: z.enum(SUPPORTED_TOOLKITS as unknown as [string, ...string[]]),
  redirect_url: z.string().url().optional(),
});

const executeSchema = z.object({
  brand_id: z.string().min(1),
  action_name: z.string().min(1),
  params: z.record(z.unknown()).default({}),
  connected_account_id: z.string().optional(),
});

// ─── Routes ──────────────────────────────────────────────────────────────────

export const composioRoutes = async (server: FastifyInstance) => {
  // GET /composio/accounts — list connected accounts for a brand
  server.get("/accounts", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { brand_id } = request.query as { brand_id?: string };

    if (!brand_id) {
      return reply.status(400).send({
        error: { code: "validation_error", message: "Missing brand_id query parameter", request_id: request.id },
      });
    }

    // Verify brand ownership
    const [brand] = await db
      .select()
      .from(brands)
      .where(and(eq(brands.id, brand_id), eq(brands.userId, request.userId!)))
      .limit(1);

    if (!brand) {
      return reply.status(404).send({
        error: { code: "resource_not_found", message: "Brand not found", request_id: request.id },
      });
    }

    try {
      // Use brand_id as Composio entityId
      const accounts = await getConnectedAccounts(brand_id);

      return reply.send({
        data: accounts,
        brand_id,
      });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Composio getConnectedAccounts failed");
      return reply.status(502).send({
        error: {
          code: "composio_error",
          message: err.message || "Failed to fetch connected accounts from Composio",
          request_id: request.id,
        },
      });
    }
  });

  // POST /composio/connect — generate OAuth connection link
  server.post("/connect", {
    onRequest: [server.authenticate],
    schema: { body: connectSchema },
  }, async (request, reply) => {
    const { brand_id, toolkit, redirect_url } = request.body as z.infer<typeof connectSchema>;

    // Verify brand ownership
    const [brand] = await db
      .select()
      .from(brands)
      .where(and(eq(brands.id, brand_id), eq(brands.userId, request.userId!)))
      .limit(1);

    if (!brand) {
      return reply.status(404).send({
        error: { code: "resource_not_found", message: "Brand not found", request_id: request.id },
      });
    }

    try {
      const result = await getConnectionLink(brand_id, toolkit, redirect_url);

      // Also create/update a channel record in our DB to track this
      // The channel will be marked active once the OAuth flow completes
      const existingChannel = await db
        .select()
        .from(channels)
        .where(and(eq(channels.brandId, brand_id), eq(channels.platform, toolkit as any)))
        .limit(1);

      if (existingChannel.length === 0) {
        await db.insert(channels).values({
          brandId: brand_id,
          platform: toolkit as any,
          name: `${toolkit} (Composio)`,
          accountId: result.connected_account_id,
          status: "active",
          authMethod: "oauth",
          settings: { composio_account_id: result.connected_account_id },
        });
      } else {
        await db.update(channels)
          .set({
            accountId: result.connected_account_id,
            status: "active",
            authMethod: "oauth",
            settings: { composio_account_id: result.connected_account_id },
            updatedAt: new Date(),
          })
          .where(eq(channels.id, existingChannel[0].id));
      }

      return reply.send({
        redirect_url: result.redirect_url,
        connected_account_id: result.connected_account_id,
        connection_status: result.connection_status,
        brand_id,
        toolkit,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Composio getConnectionLink failed");
      return reply.status(502).send({
        error: {
          code: "composio_error",
          message: err.message || "Failed to generate connection link from Composio",
          request_id: request.id,
        },
      });
    }
  });

  // POST /composio/execute — execute a Composio action
  server.post("/execute", {
    onRequest: [server.authenticate],
    schema: { body: executeSchema },
  }, async (request, reply) => {
    const { brand_id, action_name, params, connected_account_id } = request.body as z.infer<typeof executeSchema>;

    // Verify brand ownership
    const [brand] = await db
      .select()
      .from(brands)
      .where(and(eq(brands.id, brand_id), eq(brands.userId, request.userId!)))
      .limit(1);

    if (!brand) {
      return reply.status(404).send({
        error: { code: "resource_not_found", message: "Brand not found", request_id: request.id },
      });
    }

    try {
      const result = await executeAction(brand_id, action_name, params, connected_account_id);

      if (!result.success) {
        return reply.status(422).send({
          error: {
            code: "action_execution_failed",
            message: result.error || "Action execution failed",
            request_id: request.id,
          },
        });
      }

      return reply.send({
        success: true,
        data: result.data,
        action_name,
        brand_id,
      });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Composio executeAction failed");
      return reply.status(502).send({
        error: {
          code: "composio_error",
          message: err.message || "Failed to execute action via Composio",
          request_id: request.id,
        },
      });
    }
  });
};