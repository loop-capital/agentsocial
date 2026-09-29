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
  deleteConnectedAccount,
  executeAction,
  PLATFORM_TO_TOOLKIT,
  SUPPORTED_TOOLKITS,
} from "../services/composio.js";
import { syncBrandComposioChannels } from "../services/composio-channels.js";

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const connectSchema = z.object({
  brand_id: z.string().min(1),
  toolkit: z.enum(SUPPORTED_TOOLKITS as unknown as [string, ...string[]]),
  redirect_url: z.string().url().optional(),
  // Remove this brand's existing connections for the toolkit before linking a new one
  replace: z.boolean().optional(),
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
      await syncBrandComposioChannels(brand_id, { accounts });

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

  // DELETE /composio/accounts/:accountId — remove a connected account from a brand
  server.delete("/accounts/:accountId", {
    onRequest: [server.authenticate],
    schema: {
      tags: ["Channels"],
      summary: "Delete a Composio connected account",
      description:
        "Safe by default: if a channel that is not disconnected still uses this account, returns 409 account_in_use listing those channels. " +
        "Pass cascade=true to delete anyway and mark those channels disconnected (keeping their id, name and history) in the same operation; " +
        "reconnecting the platform later re-links the same channel.",
      params: z.object({ accountId: z.string() }),
      querystring: z.object({
        brand_id: z.string().describe("Brand that owns the connected account"),
        cascade: z.enum(["true", "false"]).optional().describe("Disconnect dependent channels instead of returning 409"),
      }),
    },
  }, async (request, reply) => {
    const { accountId } = request.params as { accountId: string };
    const { brand_id, cascade } = request.query as { brand_id?: string; cascade?: string };

    if (!brand_id) {
      return reply.status(400).send({
        error: { code: "validation_error", message: "Missing brand_id query parameter", request_id: request.id },
      });
    }

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
      // Only delete accounts that belong to this brand's Composio user
      const accounts = await getConnectedAccounts(brand_id);
      if (!accounts.some((a) => a.id === accountId)) {
        return reply.status(404).send({
          error: { code: "resource_not_found", message: "Connected account not found for this brand", request_id: request.id },
        });
      }

      const brandChannels = await db.select().from(channels).where(eq(channels.brandId, brand_id));
      const settingsOf = (c: typeof brandChannels[number]) => Object(c.settings) as Record<string, unknown>;
      const dependents = brandChannels.filter(
        (c) => c.status !== "disconnected" && (c.accountId === accountId || settingsOf(c).composio_account_id === accountId),
      );

      if (dependents.length && cascade !== "true") {
        return reply.status(409).send({
          error: {
            code: "account_in_use",
            message: `Connected account ${accountId} is used by ${dependents.length} channel(s). Retry with ?cascade=true to disconnect them.`,
            channels: dependents.map((c) => ({ id: c.id, name: c.name, platform: c.platform, status: c.status })),
            request_id: request.id,
          },
        });
      }

      await deleteConnectedAccount(accountId);

      // Detach every channel from the deleted account (pending links included)
      const detached: string[] = [];
      for (const c of brandChannels) {
        const cs = settingsOf(c);
        const usesAccount = c.accountId === accountId || cs.composio_account_id === accountId;
        if (!usesAccount && cs.composio_pending_account_id !== accountId) continue;
        const { composio_account_id, composio_pending_account_id, ...rest } = cs;
        const settings = {
          ...rest,
          ...(composio_account_id && composio_account_id !== accountId ? { composio_account_id } : {}),
          ...(composio_pending_account_id && composio_pending_account_id !== accountId ? { composio_pending_account_id } : {}),
        };
        await db.update(channels)
          .set({ settings, ...(usesAccount ? { status: "disconnected" as const } : {}), updatedAt: new Date() })
          .where(eq(channels.id, c.id));
        if (usesAccount) detached.push(c.id);
      }

      return reply.send({ deleted: true, id: accountId, brand_id, disconnected_channel_ids: detached });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Composio deleteConnectedAccount failed");
      return reply.status(502).send({
        error: { code: "composio_error", message: err.message || "Failed to delete connected account", request_id: request.id },
      });
    }
  });

  // POST /composio/connect — generate OAuth connection link
  server.post("/connect", {
    onRequest: [server.authenticate],
    schema: { body: connectSchema },
  }, async (request, reply) => {
    const { brand_id, toolkit, redirect_url, replace } = request.body as z.infer<typeof connectSchema>;

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
      const replaced: string[] = [];
      if (replace) {
        const existing = await getConnectedAccounts(brand_id);
        for (const acct of existing.filter((a) => a.app_name === toolkit)) {
          await deleteConnectedAccount(acct.id);
          replaced.push(acct.id);
        }
      }

      const result = await getConnectionLink(brand_id, toolkit, redirect_url);

      // Record the new account as pending; the channel keeps its current account
      // until this one finishes OAuth (promoted by syncBrandComposioChannels)
      // Reuse, in order: a Composio-managed channel, then an error/disconnected
      // channel for this platform, so reconnecting heals instead of duplicating.
      // Active direct-OAuth channels are never repointed.
      const platformChannels = await db
        .select()
        .from(channels)
        .where(and(eq(channels.brandId, brand_id), eq(channels.platform, toolkit as any)))
        .orderBy(channels.createdAt);
      const existingChannel =
        platformChannels.find((c) => {
          const cs = Object(c.settings) as Record<string, unknown>;
          return Boolean(cs.composio_account_id || cs.composio_pending_account_id);
        }) ??
        platformChannels.find((c) => c.status === "error") ??
        platformChannels.find((c) => c.status === "disconnected");

      if (!existingChannel) {
        await db.insert(channels).values({
          brandId: brand_id,
          platform: toolkit as any,
          name: `${toolkit} (Composio)`,
          accountId: result.connected_account_id,
          status: "disconnected",
          authMethod: "oauth",
          settings: { composio_pending_account_id: result.connected_account_id },
        });
      } else {
        await db.update(channels)
          .set({
            settings: {
              ...(Object(existingChannel.settings) as Record<string, unknown>),
              composio_pending_account_id: result.connected_account_id,
            },
            updatedAt: new Date(),
          })
          .where(eq(channels.id, existingChannel.id));
      }

      // Reflect any accounts removed by `replace` on the channel right away
      if (replaced.length) await syncBrandComposioChannels(brand_id);

      return reply.send({
        redirect_url: result.redirect_url,
        connected_account_id: result.connected_account_id,
        connection_status: result.connection_status,
        brand_id,
        toolkit,
        replaced_account_ids: replaced,
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