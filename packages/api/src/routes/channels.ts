import type { FastifyInstance } from "fastify";
import { eq, and } from "drizzle-orm";
import { connectChannelSchema, updateChannelSchema } from "@agentsocial/shared";
import { db, channels, brands } from "../db/index.js";
import { getTwitterOAuthUrl } from "../connectors/twitter.js";
import { getLinkedInOAuthUrl } from "../connectors/linkedin.js";
import { getFacebookOAuthUrl } from "../connectors/facebook.js";
import { getInstagramOAuthUrl } from "../connectors/instagram.js";
import { getTikTokOAuthUrl, setTikTokPkceStore } from "../connectors/tiktok.js";
import { generatePKCE } from "../connectors/pkce.js";
import { getConnectionLink, getConnectedAccounts, PLATFORM_TO_TOOLKIT } from "../services/composio.js";

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
      const toolkit = PLATFORM_TO_TOOLKIT[channel.platform];
      const matching = accounts.find((a) => a.app_name === toolkit || a.app_unique_id === toolkit);

      if (matching) {
        const newStatus = matching.status === "ACTIVE" ? "active" : matching.status === "FAILED" ? "error" : "disconnected";
        const [updated] = await db.update(channels)
          .set({
            status: newStatus as any,
            accountId: matching.id,
            settings: { ...(Object(channel.settings) as Record<string, unknown>), composio_account_id: matching.id },
            updatedAt: new Date(),
          })
          .where(eq(channels.id, id))
          .returning();

        return reply.send({
          id: updated.id,
          brand_id: updated.brandId,
          platform: updated.platform,
          status: updated.status,
          composio_status: matching.status,
          synced_at: updated.updatedAt,
        });
      }

      // No matching Composio account found
      return reply.send({
        id: channel.id,
        brand_id: channel.brandId,
        platform: channel.platform,
        status: channel.status,
        composio_status: "NOT_CONNECTED",
        synced_at: new Date().toISOString(),
      });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Composio sync failed");
      return reply.status(502).send({
        error: { code: "composio_error", message: err.message || "Failed to sync from Composio", request_id: request.id },
      });
    }
  });

  // PATCH /channels/:id
  server.patch("/:id", {
    onRequest: [server.authenticate],
    schema: { body: updateChannelSchema },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { settings } = request.body as { settings?: Record<string, unknown> };

    const [channel] = await db.select().from(channels).where(eq(channels.id, id)).limit(1);
    if (!channel) {
      return reply.status(404).send({
        error: { code: "resource_not_found", message: "Channel not found", request_id: request.id },
      });
    }

    const mergedSettings = settings ? { ...(Object(channel.settings) as Record<string, unknown>), ...settings } : channel.settings as Record<string, unknown>;

    const [updated] = await db.update(channels)
      .set({ settings: mergedSettings, updatedAt: new Date() })
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