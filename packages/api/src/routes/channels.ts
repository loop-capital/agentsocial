import type { FastifyInstance } from "fastify";
import { eq, and } from "drizzle-orm";
import { connectChannelSchema, updateChannelSchema } from "@agentsocial/shared";
import { db, channels, brands } from "../db/index.js";
import { getTwitterOAuthUrl } from "../connectors/twitter.js";
import { getLinkedInOAuthUrl } from "../connectors/linkedin.js";
import { getFacebookOAuthUrl } from "../connectors/facebook.js";
import { getInstagramOAuthUrl } from "../connectors/instagram.js";
import { getTikTokOAuthUrl } from "../connectors/tiktok.js";
import { generatePKCE } from "../connectors/pkce.js";

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
  server.get("/facebook/auth", {
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
    const authorizationUrl = await getFacebookOAuthUrl(state);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    return reply.send({ authorization_url: authorizationUrl, state, expires_at: expiresAt });
  });

  // GET /channels/instagram/auth — redirect to Instagram (Facebook) OAuth
  server.get("/instagram/auth", {
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
    const authorizationUrl = await getTikTokOAuthUrl(state);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    return reply.send({ authorization_url: authorizationUrl, state, expires_at: expiresAt });
  });

  // POST /channels/connect — generic connect endpoint
  server.post("/connect", {
    onRequest: [server.authenticate],
    schema: { body: connectChannelSchema },
  }, async (request, reply) => {
    const { brand_id, platform } = request.body as { brand_id: string; platform: string };

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

    if (platform === "twitter") {
      const { codeVerifier, codeChallenge } = generatePKCE();
      pkceStore.set(state, codeVerifier);
      const authorizationUrl = await getTwitterOAuthUrl(state, codeChallenge);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      return reply.send({ authorization_url: authorizationUrl, state, expires_at: expiresAt });
    }

    if (platform === "linkedin") {
      const { codeVerifier, codeChallenge } = generatePKCE();
      pkceStore.set(state, codeVerifier);
      const authorizationUrl = await getLinkedInOAuthUrl(state, codeChallenge);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      return reply.send({ authorization_url: authorizationUrl, state, expires_at: expiresAt });
    }

    if (platform === "facebook") {
      const authorizationUrl = await getFacebookOAuthUrl(state);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      return reply.send({ authorization_url: authorizationUrl, state, expires_at: expiresAt });
    }

    if (platform === "instagram") {
      const authorizationUrl = await getInstagramOAuthUrl(state);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      return reply.send({ authorization_url: authorizationUrl, state, expires_at: expiresAt });
    }

    if (platform === "tiktok") {
      const authorizationUrl = await getTikTokOAuthUrl(state);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      return reply.send({ authorization_url: authorizationUrl, state, expires_at: expiresAt });
    }

    return reply.status(400).send({
      error: { code: "validation_error", message: `OAuth not supported for platform: ${platform}`, request_id: request.id },
    });
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