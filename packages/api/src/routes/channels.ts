import type { FastifyInstance } from "fastify";
import { eq, and } from "drizzle-orm";
import { connectChannelSchema, updateChannelSchema } from "@agentsocial/shared";
import { db, channels, brands } from "../db/index.js";

const OAUTH_URLS: Record<string, (brandId: string) => string> = {
  twitter: (brandId) =>
    `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.TWITTER_CLIENT_ID}&redirect_uri=${process.env.API_URL || "http://localhost:3001"}/channels/callback/twitter&state=${brandId}&scope=tweet.read%20tweet.write%20users.read`,
  linkedin: (brandId) =>
    `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${process.env.API_URL || "http://localhost:3001"}/channels/callback/linkedin&state=${brandId}&scope=r_liteprofile%20w_member_social`,
  instagram: (brandId) =>
    `https://www.facebook.com/v18.0/dialog/oauth?response_type=code&client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${process.env.API_URL || "http://localhost:3001"}/channels/callback/instagram&state=${brandId}&scope=instagram_basic%20instagram_content_publish%20instagram_manage_comments%20instagram_manage_insights`,
  facebook: (brandId) =>
    `https://www.facebook.com/v18.0/dialog/oauth?response_type=code&client_id=${process.env.FACEBOOK_CLIENT_ID}&redirect_uri=${process.env.API_URL || "http://localhost:3001"}/channels/callback/facebook&state=${brandId}&scope=pages_read_engagement%20pages_manage_posts%20publish_to_groups`,
  tiktok: (brandId) =>
    `https://www.tiktok.com/auth/authorize?response_type=code&client_key=${process.env.TIKTOK_CLIENT_KEY}&redirect_uri=${process.env.API_URL || "http://localhost:3001"}/channels/callback/tiktok&state=${brandId}&scope=user.info.basic%20video.publish`,
};

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

  // POST /channels/connect
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

    const oauthUrl = OAUTH_URLS[platform];
    if (!oauthUrl) {
      return reply.status(400).send({
        error: { code: "validation_error", message: `OAuth not supported for platform: ${platform}`, request_id: request.id },
      });
    }

    const state = `${brand_id}:${Date.now()}`;
    const authorizationUrl = oauthUrl(brand_id);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    return reply.send({ authorization_url: authorizationUrl, state, expires_at: expiresAt });
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

  // POST /channels/:id/disconnect
  server.post("/:id/disconnect", {
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