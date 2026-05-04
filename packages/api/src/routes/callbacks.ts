import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db, channels } from "../db/index.js";
import { exchangeTwitterCode } from "../connectors/twitter.js";
import { exchangeLinkedInCode } from "../connectors/linkedin.js";
import { exchangeInstagramCode } from "../connectors/instagram.js";
import { encryptToken } from "../connectors/token-store.js";

function makeState(brandId: string): string {
  return `${brandId}:${Date.now()}`;
}

function parseState(state: string): string {
  return state.split(":")[0];
}

async function upsertChannel(
  brandId: string,
  platform: "twitter" | "linkedin" | "instagram",
  accountId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
) {
  const existing = await db
    .select()
    .from(channels)
    .where(eq(channels.brandId, brandId))
    .limit(1);

  const channelData = {
    brandId,
    platform: platform as "twitter" | "linkedin" | "instagram",
    name: platform.charAt(0).toUpperCase() + platform.slice(1),
    accountId,
    status: "active" as const,
    accessTokenEncrypted: encryptToken(accessToken),
    refreshTokenEncrypted: encryptToken(refreshToken),
    tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
    updatedAt: new Date(),
  };

  if (existing.length > 0) {
    await db.update(channels).set(channelData).where(eq(channels.id, existing[0].id));
    return existing[0].id;
  } else {
    const [inserted] = await db.insert(channels).values(channelData).returning();
    return inserted.id;
  }
}

export const callbackRoutes = async (server: FastifyInstance) => {
  // ─── Twitter OAuth Callback ─────────────────────────────────────────────────
  server.get("/channels/callback/twitter", async (request, reply) => {
    const { code, state, error, error_description } = request.query as Record<string, string>;

    if (error) {
      server.log.warn(`[oauth/twitter] OAuth error: ${error} — ${error_description}`);
      return reply.redirect(`${process.env.APP_URL}/settings?error=oauth_denied&platform=twitter`);
    }

    if (!code || !state) {
      return reply.redirect(`${process.env.APP_URL}/settings?error=missing_params`);
    }

    const brandId = parseState(state);
    if (!brandId) {
      return reply.redirect(`${process.env.APP_URL}/settings?error=invalid_state`);
    }

    try {
      const tokens = await exchangeTwitterCode(code);
      const accountId = `twitter_${tokens.accessToken.slice(0, 16)}`;
      await upsertChannel(brandId, "twitter", accountId, tokens.accessToken, tokens.refreshToken, tokens.expiresIn);
      return reply.redirect(`${process.env.APP_URL}/settings?connected=twitter`);
    } catch (err) {
      server.log.error(`[oauth/twitter] Callback error: ${err}`);
      return reply.redirect(`${process.env.APP_URL}/settings?error=twitter_failed`);
    }
  });

  // ─── LinkedIn OAuth Callback ─────────────────────────────────────────────────
  server.get("/channels/callback/linkedin", async (request, reply) => {
    const { code, state, error, error_description } = request.query as Record<string, string>;

    if (error) {
      server.log.warn(`[oauth/linkedin] OAuth error: ${error} — ${error_description}`);
      return reply.redirect(`${process.env.APP_URL}/settings?error=oauth_denied&platform=linkedin`);
    }

    if (!code || !state) {
      return reply.redirect(`${process.env.APP_URL}/settings?error=missing_params`);
    }

    const brandId = parseState(state);
    if (!brandId) {
      return reply.redirect(`${process.env.APP_URL}/settings?error=invalid_state`);
    }

    try {
      const tokens = await exchangeLinkedInCode(code);
      const accountId = `linkedin_${tokens.accessToken.slice(0, 16)}`;
      await upsertChannel(brandId, "linkedin", accountId, tokens.accessToken, tokens.refreshToken, tokens.expiresIn);
      return reply.redirect(`${process.env.APP_URL}/settings?connected=linkedin`);
    } catch (err) {
      server.log.error(`[oauth/linkedin] Callback error: ${err}`);
      return reply.redirect(`${process.env.APP_URL}/settings?error=linkedin_failed`);
    }
  });

  // ─── Instagram OAuth Callback ────────────────────────────────────────────────
  server.get("/channels/callback/instagram", async (request, reply) => {
    const { code, state, error, error_description } = request.query as Record<string, string>;

    if (error) {
      server.log.warn(`[oauth/instagram] OAuth error: ${error} — ${error_description}`);
      return reply.redirect(`${process.env.APP_URL}/settings?error=oauth_denied&platform=instagram`);
    }

    if (!code || !state) {
      return reply.redirect(`${process.env.APP_URL}/settings?error=missing_params`);
    }

    const brandId = parseState(state);
    if (!brandId) {
      return reply.redirect(`${process.env.APP_URL}/settings?error=invalid_state`);
    }

    try {
      const tokens = await exchangeInstagramCode(code);
      const accountId = `instagram_${tokens.accessToken.slice(0, 16)}`;
      await upsertChannel(brandId, "instagram", accountId, tokens.accessToken, tokens.refreshToken, tokens.expiresIn);
      return reply.redirect(`${process.env.APP_URL}/settings?connected=instagram`);
    } catch (err) {
      server.log.error(`[oauth/instagram] Callback error: ${err}`);
      return reply.redirect(`${process.env.APP_URL}/settings?error=instagram_failed`);
    }
  });
};
