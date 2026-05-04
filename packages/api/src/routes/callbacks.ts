import type { FastifyInstance } from "fastify";
import { eq, and } from "drizzle-orm";
import { db, channels } from "../db/index.js";
import { exchangeTwitterCode, fetchTwitterProfile } from "../connectors/twitter.js";
import { exchangeLinkedInCode, fetchLinkedInProfile } from "../connectors/linkedin.js";
import { exchangeInstagramCode } from "../connectors/instagram.js";
import { exchangeFacebookCode, exchangeLongLivedToken, getFacebookPages } from "../connectors/facebook.js";
import { exchangeTikTokCode, getTikTokUserInfo } from "../connectors/tiktok.js";
import { encryptToken } from "../connectors/token-store.js";
import { pkceStore } from "./channels.js";

function parseState(state: string): string {
  return state.split(":")[0];
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
      const codeVerifier = pkceStore.get(state);
      const tokens = await exchangeTwitterCode(code, codeVerifier);

      // Fetch Twitter user profile
      const profile = await fetchTwitterProfile(tokens.accessToken);

      const channelData = {
        brandId,
        platform: "twitter" as const,
        name: profile.username || profile.name || "Twitter",
        accountId: profile.id,
        status: "active" as const,
        followerCount: profile.follower_count || 0,
        accessTokenEncrypted: encryptToken(tokens.accessToken),
        refreshTokenEncrypted: tokens.refreshToken ? encryptToken(tokens.refreshToken) : null,
        tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
        updatedAt: new Date(),
      };

      // Update existing channel if same brand+platform+accountId, else insert new
      const existing = await db
        .select()
        .from(channels)
        .where(
          and(
            eq(channels.brandId, brandId),
            eq(channels.platform, "twitter"),
            eq(channels.accountId, profile.id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db.update(channels)
          .set(channelData)
          .where(eq(channels.id, existing[0].id));
      } else {
        await db.insert(channels).values(channelData);
      }

      pkceStore.delete(state);
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
      const codeVerifier = pkceStore.get(state);
      const tokens = await exchangeLinkedInCode(code, codeVerifier);

      // Fetch LinkedIn user profile
      const profile = await fetchLinkedInProfile(tokens.accessToken);

      const channelData = {
        brandId,
        platform: "linkedin" as const,
        name: profile.vanity_name || "LinkedIn",
        accountId: profile.id,
        status: "active" as const,
        followerCount: profile.follower_count || 0,
        accessTokenEncrypted: encryptToken(tokens.accessToken),
        refreshTokenEncrypted: tokens.refreshToken ? encryptToken(tokens.refreshToken) : null,
        tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
        updatedAt: new Date(),
      };

      // Update existing channel if same brand+platform+accountId, else insert new
      const existing = await db
        .select()
        .from(channels)
        .where(
          and(
            eq(channels.brandId, brandId),
            eq(channels.platform, "linkedin"),
            eq(channels.accountId, profile.id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db.update(channels)
          .set(channelData)
          .where(eq(channels.id, existing[0].id));
      } else {
        await db.insert(channels).values(channelData);
      }

      pkceStore.delete(state);
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

      const channelData = {
        brandId,
        platform: "instagram" as const,
        name: "Instagram",
        accountId,
        status: "active" as const,
        followerCount: 0,
        accessTokenEncrypted: encryptToken(tokens.accessToken),
        refreshTokenEncrypted: tokens.refreshToken ? encryptToken(tokens.refreshToken) : null,
        tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
        updatedAt: new Date(),
      };

      const existing = await db
        .select()
        .from(channels)
        .where(
          and(
            eq(channels.brandId, brandId),
            eq(channels.platform, "instagram"),
            eq(channels.accountId, accountId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db.update(channels)
          .set(channelData)
          .where(eq(channels.id, existing[0].id));
      } else {
        await db.insert(channels).values(channelData);
      }

      return reply.redirect(`${process.env.APP_URL}/settings?connected=instagram`);
    } catch (err) {
      server.log.error(`[oauth/instagram] Callback error: ${err}`);
      return reply.redirect(`${process.env.APP_URL}/settings?error=instagram_failed`);
    }
  });

  // ─── Facebook OAuth Callback ─────────────────────────────────────────────────
  server.get("/channels/callback/facebook", async (request, reply) => {
    const { code, state, error, error_description } = request.query as Record<string, string>;

    if (error) {
      server.log.warn(`[oauth/facebook] OAuth error: ${error} — ${error_description}`);
      return reply.redirect(`${process.env.APP_URL}/settings?error=oauth_denied&platform=facebook`);
    }

    if (!code || !state) {
      return reply.redirect(`${process.env.APP_URL}/settings?error=missing_params`);
    }

    const brandId = parseState(state);
    if (!brandId) {
      return reply.redirect(`${process.env.APP_URL}/settings?error=invalid_state`);
    }

    try {
      // 1. Exchange code for short-lived user token
      const tokens = await exchangeFacebookCode(code);

      // 2. Exchange for long-lived token
      const longLived = await exchangeLongLivedToken(tokens.accessToken);

      // 3. Get pages user manages
      const pages = await getFacebookPages(longLived.accessToken);

      if (pages.length === 0) {
        return reply.redirect(`${process.env.APP_URL}/settings?error=facebook_no_pages`);
      }

      // 4. Store each page as a channel
      for (const page of pages) {
        const channelData = {
          brandId,
          platform: "facebook" as const,
          name: page.name,
          accountId: page.id,
          status: "active" as const,
          followerCount: 0,
          accessTokenEncrypted: encryptToken(page.access_token),
          refreshTokenEncrypted: encryptToken(longLived.accessToken), // store user LL token as refresh
          tokenExpiresAt: new Date(Date.now() + longLived.expiresIn * 1000),
          updatedAt: new Date(),
        };

        const existing = await db
          .select()
          .from(channels)
          .where(
            and(
              eq(channels.brandId, brandId),
              eq(channels.platform, "facebook"),
              eq(channels.accountId, page.id)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          await db.update(channels)
            .set(channelData)
            .where(eq(channels.id, existing[0].id));
        } else {
          await db.insert(channels).values(channelData);
        }
      }

      return reply.redirect(`${process.env.APP_URL}/settings?connected=facebook`);
    } catch (err) {
      server.log.error(`[oauth/facebook] Callback error: ${err}`);
      return reply.redirect(`${process.env.APP_URL}/settings?error=facebook_failed`);
    }
  });

  // ─── TikTok OAuth Callback ─────────────────────────────────────────────────
  server.get("/channels/callback/tiktok", async (request, reply) => {
    const { code, state, error, error_description } = request.query as Record<string, string>;

    if (error) {
      server.log.warn(`[oauth/tiktok] OAuth error: ${error} — ${error_description}`);
      return reply.redirect(`${process.env.APP_URL}/settings?error=oauth_denied&platform=tiktok`);
    }

    if (!code || !state) {
      return reply.redirect(`${process.env.APP_URL}/settings?error=missing_params`);
    }

    const brandId = parseState(state);
    if (!brandId) {
      return reply.redirect(`${process.env.APP_URL}/settings?error=invalid_state`);
    }

    try {
      const tokens = await exchangeTikTokCode(code);

      // Fetch TikTok user info for display name
      const userInfo = await getTikTokUserInfo(tokens.accessToken);

      const channelData = {
        brandId,
        platform: "tiktok" as const,
        name: userInfo.displayName || "TikTok",
        accountId: userInfo.openId || `tiktok_${tokens.accessToken.slice(0, 16)}`,
        status: "active" as const,
        followerCount: userInfo.followerCount || 0,
        accessTokenEncrypted: encryptToken(tokens.accessToken),
        refreshTokenEncrypted: tokens.refreshToken ? encryptToken(tokens.refreshToken) : null,
        tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
        updatedAt: new Date(),
      };

      const existing = await db
        .select()
        .from(channels)
        .where(
          and(
            eq(channels.brandId, brandId),
            eq(channels.platform, "tiktok"),
            eq(channels.accountId, channelData.accountId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db.update(channels)
          .set(channelData)
          .where(eq(channels.id, existing[0].id));
      } else {
        await db.insert(channels).values(channelData);
      }

      return reply.redirect(`${process.env.APP_URL}/settings?connected=tiktok`);
    } catch (err) {
      server.log.error(`[oauth/tiktok] Callback error: ${err}`);
      return reply.redirect(`${process.env.APP_URL}/settings?error=tiktok_failed`);
    }
  });
};
