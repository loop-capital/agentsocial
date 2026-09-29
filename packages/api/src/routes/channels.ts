import type { FastifyInstance } from "fastify";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { connectChannelSchema, updateChannelSchema } from "@agentsocial/shared";
import { db, channels, brands } from "../db/index.js";
import { getTwitterOAuthUrl } from "../connectors/twitter.js";
import { getLinkedInOAuthUrl } from "../connectors/linkedin.js";
import { getFacebookOAuthUrl } from "../connectors/facebook.js";
import { getInstagramOAuthUrl } from "../connectors/instagram.js";
import { getTikTokOAuthUrl, setTikTokPkceStore } from "../connectors/tiktok.js";
import { generatePKCE } from "../connectors/pkce.js";
import { getConnectionLink, getConnectedAccounts, PLATFORM_TO_TOOLKIT } from "../services/composio.js";
import { syncBrandComposioChannels } from "../services/composio-channels.js";

// Simple in-memory store for PKCE code_verifiers (state -> codeVerifier)
// In production, use Redis or a database table
const pkceStore = new Map<string, string>();

export const channelsRoutes = async (server: FastifyInstance) => {
  // GET /channels
  server.get("/", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { brand_id } = request.query as { brand_id?: string };

    const conditions = brand_id
      ? eq(channels.brandId, brand_id)
      : undefined;

    const allChannels = conditions
      ? await db.select().from(channels).where(conditions)
      : await db.select().from(channels);

    return reply.send({
      data: allChannels.map((ch) => ({
        id: ch.id,
        brand_id: ch.brandId,
        platform: ch.platform,
        name: ch.name,
        account_id: ch.accountId,
        status: ch.status,
        follower_count: ch.followerCount,
        settings: ch.settings,
        auth_method: ch.authMethod,
        created_at: ch.createdAt,
      })),
    });
  });

  // GET /channels/:id
  server.get("/:id", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const [channel] = await db.select().from(channels).where(eq(channels.id, id)).limit(1);

    if (!channel) {
      return reply.status(404).send({
        error: { code: "resource_not_found", message: "Channel not found", request_id: request.id },
      });
    }

    return reply.send({
      id: channel.id,
      brand_id: channel.brandId,
      platform: channel.platform,
      name: channel.name,
      account_id: channel.accountId,
      status: channel.status,
      follower_count: channel.followerCount,
      settings: channel.settings,
      created_at: channel.createdAt,
    });
  });

  // GET /channels/facebook/auth — redirect to Facebook OAuth
  server.get("/facebook/auth", async (request, reply) => {
    const { brand_id } = request.query as { brand_id?: string };

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

    const state = `${brand_id}:${Date.now()}`;
    const authorizationUrl = await getFacebookOAuthUrl(state);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    return reply.send({ authorization_url: authorizationUrl, state, expires_at: expiresAt });
  });

  // GET /channels/instagram/auth — redirect to Instagram (Facebook) OAuth
  server.get("/instagram/auth", async (request, reply) => {
    const { brand_id } = request.query as { brand_id?: string };

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

    const state = `${brand_id}:${Date.now()}`;
    const authorizationUrl = await getInstagramOAuthUrl(state);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    return reply.send({ authorization_url: authorizationUrl, state, expires_at: expiresAt });
  });

  // GET /channels/twitter/auth — redirect to Twitter OAuth with PKCE
  server.get("/twitter/auth", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { brand_id } = request.query as { brand_id?: string };

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

    const state = `${brand_id}:${Date.now()}`;
    const { codeVerifier, codeChallenge } = generatePKCE();
    pkceStore.set(state, codeVerifier);

    const authorizationUrl = await getTwitterOAuthUrl(state, codeChallenge);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    return reply.send({ authorization_url: authorizationUrl, state, expires_at: expiresAt });
  });

  // GET /channels/linkedin/auth — redirect to LinkedIn OAuth with PKCE
  server.get("/linkedin/auth", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { brand_id } = request.query as { brand_id?: string };

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

    const state = `${brand_id}:${Date.now()}`;
    const { codeVerifier, codeChallenge } = generatePKCE();
    pkceStore.set(state, codeVerifier);

    const authorizationUrl = await getLinkedInOAuthUrl(state, codeChallenge);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    return reply.send({ authorization_url: authorizationUrl, state, expires_at: expiresAt });
  });

  // GET /channels/tiktok/auth — redirect to TikTok OAuth
  server.get("/tiktok/auth", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { brand_id } = request.query as { brand_id?: string };

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

    const state = `${brand_id}:${Date.now()}`;
    const { codeVerifier, codeChallenge } = generatePKCE();
    pkceStore.set(state, codeVerifier);
    const authorizationUrl = getTikTokOAuthUrl({ state, codeChallenge });
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    return reply.send({ authorization_url: authorizationUrl, state, expires_at: expiresAt });
  });

  // POST /channels/connect — generic connect endpoint
  // Supports both direct OAuth (legacy) and Composio-managed OAuth
  server.post("/connect", {
    onRequest: [server.authenticate],
    schema: { body: connectChannelSchema },
  }, async (request, reply) => {
    const { brand_id, platform } = request.body as { brand_id: string; platform: string };
    const body = request.body as Record<string, unknown>;
    const useComposio = body.use_composio === true;

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

    // ── Composio-managed OAuth path ───────────────────────────────────────────
    if (useComposio) {
      const toolkit = PLATFORM_TO_TOOLKIT[platform];
      if (!toolkit) {
        return reply.status(400).send({
          error: { code: "validation_error", message: `Composio does not support platform: ${platform}`, request_id: request.id },
        });
      }

      try {
        const result = await getConnectionLink(brand_id, toolkit);
        return reply.send({
          authorization_url: result.redirect_url,
          connected_account_id: result.connected_account_id,
          connection_status: result.connection_status,
          connector: "composio",
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        });
      } catch (err: any) {
        request.log.error({ err: err.message }, "Composio connection failed");
        return reply.status(502).send({
          error: { code: "composio_error", message: err.message || "Failed to generate Composio connection link", request_id: request.id },
        });
      }
    }

    // ── Legacy direct OAuth path ─────────────────────────────────────────────
    const state = `${brand_id}:${Date.now()}`;

    if (platform === "twitter") {
      const { codeVerifier, codeChallenge } = generatePKCE();
      pkceStore.set(state, codeVerifier);
      const authorizationUrl = await getTwitterOAuthUrl(state, codeChallenge);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      return reply.send({ authorization_url: authorizationUrl, state, expires_at: expiresAt, connector: "direct" });
    }

    if (platform === "linkedin") {
      const { codeVerifier, codeChallenge } = generatePKCE();
      pkceStore.set(state, codeVerifier);
      const authorizationUrl = await getLinkedInOAuthUrl(state, codeChallenge);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      return reply.send({ authorization_url: authorizationUrl, state, expires_at: expiresAt, connector: "direct" });
    }

    if (platform === "facebook") {
      const authorizationUrl = await getFacebookOAuthUrl(state);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      return reply.send({ authorization_url: authorizationUrl, state, expires_at: expiresAt, connector: "direct" });
    }

    if (platform === "instagram") {
      const authorizationUrl = await getInstagramOAuthUrl(state);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      return reply.send({ authorization_url: authorizationUrl, state, expires_at: expiresAt, connector: "direct" });
    }

    if (platform === "tiktok") {
      const { codeVerifier, codeChallenge } = generatePKCE();
      pkceStore.set(state, codeVerifier);
      const authorizationUrl = getTikTokOAuthUrl({ state, codeChallenge });
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      return reply.send({ authorization_url: authorizationUrl, state, expires_at: expiresAt, connector: "direct" });
    }

    return reply.status(400).send({
      error: { code: "validation_error", message: `OAuth not supported for platform: ${platform}`, request_id: request.id },
    });
  });

  // POST /channels/:id/composio-sync — sync a channel's status from Composio
  server.post("/:id/composio-sync", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const [channel] = await db.select().from(channels).where(eq(channels.id, id)).limit(1);
    if (!channel) {
      return reply.status(404).send({
        error: { code: "resource_not_found", message: "Channel not found", request_id: request.id },
      });
    }

    // Verify ownership
    const [brand] = await db
      .select()
      .from(brands)
      .where(and(eq(brands.id, channel.brandId), eq(brands.userId, request.userId!)))
      .limit(1);

    if (!brand) {
      return reply.status(404).send({
        error: { code: "resource_not_found", message: "Brand not found", request_id: request.id },
      });
    }

    try {
      const accounts = await getConnectedAccounts(channel.brandId);
      await syncBrandComposioChannels(channel.brandId, { accounts, includeChannelId: channel.id });
      const [synced] = await db.select().from(channels).where(eq(channels.id, id)).limit(1);
      const accountId = (Object(synced.settings) as Record<string, unknown>).composio_account_id;
      const account = accounts.find((a) => a.id === accountId);

      return reply.send({
        id: synced.id,
        brand_id: synced.brandId,
        platform: synced.platform,
        status: synced.status,
        composio_status: account?.status ?? "NOT_CONNECTED",
        synced_at: synced.updatedAt,
      });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Composio sync failed");
      return reply.status(502).send({
        error: { code: "composio_error", message: err.message || "Failed to sync from Composio", request_id: request.id },
      });
    }
  });

  // PATCH /channels/:id
  /** Load a channel only if it belongs to one of the caller's brands. */
  async function ownedChannel(id: string, userId: string) {
    const [row] = await db
      .select({ channel: channels })
      .from(channels)
      .innerJoin(brands, eq(brands.id, channels.brandId))
      .where(and(eq(channels.id, id), eq(brands.userId, userId)))
      .limit(1);
    return row?.channel ?? null;
  }

  // PATCH /channels/:id — rename and/or merge settings
  server.patch("/:id", {
    onRequest: [server.authenticate],
    schema: {
      tags: ["Channels"],
      summary: "Update a channel",
      description: "Rename a channel and/or merge settings (auto_reply_enabled, auto_reply_message, post_defaults). Omitted fields are unchanged.",
      params: z.object({ id: z.string().uuid() }),
      body: updateChannelSchema,
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { name, settings } = request.body as { name?: string; settings?: Record<string, unknown> };

    const channel = await ownedChannel(id, request.userId!);
    if (!channel) {
      return reply.status(404).send({
        error: { code: "resource_not_found", message: "Channel not found", request_id: request.id },
      });
    }

    const mergedSettings = settings ? { ...(Object(channel.settings) as Record<string, unknown>), ...settings } : channel.settings as Record<string, unknown>;

    const [updated] = await db.update(channels)
      .set({ ...(name ? { name } : {}), settings: mergedSettings, updatedAt: new Date() })
      .where(eq(channels.id, id))
      .returning();

    return reply.send({
      id: updated.id,
      brand_id: updated.brandId,
      platform: updated.platform,
      name: updated.name,
      settings: updated.settings,
      updated_at: updated.updatedAt,
    });
  });

  // DELETE /channels/:id/disconnect
  server.delete("/:id/disconnect", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const channel = await ownedChannel(id, request.userId!);
    if (!channel) {
      return reply.status(404).send({
        error: { code: "resource_not_found", message: "Channel not found", request_id: request.id },
      });
    }

    const [updated] = await db.update(channels)
      .set({ status: "disconnected", accessTokenEncrypted: null, refreshTokenEncrypted: null, updatedAt: new Date() })
      .where(eq(channels.id, id))
      .returning();

    return reply.send({ id: updated.id, status: updated.status });
  });
};

// Export for use by callback routes
export { pkceStore };

// Wire PKCE store into TikTok connector for code_verifier access during token exchange
setTikTokPkceStore(pkceStore);