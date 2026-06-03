import type { FastifyInstance } from "fastify";
import { db, gbpAccounts } from "../db/index.js";
import { eq } from "drizzle-orm";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_MY_BUSINESS_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_MY_BUSINESS_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_MY_BUSINESS_REDIRECT_URI || "http://localhost:3002/auth/google/callback";
const GOOGLE_REDIRECT_MODE = process.env.GOOGLE_MY_BUSINESS_REDIRECT_MODE || "callback"; // "callback" or "manual"
const GOOGLE_SCOPES = process.env.GOOGLE_MY_BUSINESS_SCOPES || "https://www.googleapis.com/auth/business.manage";

// In-memory state store (production: use Redis or DB)
const pendingStates = new Map<string, { brandId: string; createdAt: number }>();

// Clean up expired states every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of pendingStates.entries()) {
    if (now - data.createdAt > 10 * 60 * 1000) {
      pendingStates.delete(state);
    }
  }
}, 10 * 60 * 1000);

export const googleOAuthRoutes = async (server: FastifyInstance) => {

  // GET /auth/google/connect — Initiate Google OAuth flow
  // Requires: ?brandId=<brand_id>
  server.get("/auth/google/connect", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { brandId } = request.query as { brandId?: string };
    if (!brandId) {
      return reply.status(400).send({ error: { code: "brand_required", message: "brandId query param required" } });
    }

    // Generate state for CSRF protection
    const state = crypto.randomUUID();
    pendingStates.set(state, { brandId, createdAt: Date.now() });

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", GOOGLE_SCOPES);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("state", state);

    return reply.send({ authUrl: authUrl.toString(), state });
  });

  // GET /auth/google/callback — Handle OAuth callback from Google
  // This is the redirect URI that Google calls after user authorizes
  server.get("/auth/google/callback", async (request, reply) => {
    const { code, state, error } = request.query as { code?: string; state?: string; error?: string };

    if (error) {
      return reply.status(400).send({
        error: { code: "oauth_error", message: `Google OAuth error: ${error}` },
      });
    }

    if (!code || !state) {
      return reply.status(400).send({
        error: { code: "missing_params", message: "Missing code or state parameter" },
      });
    }

    const stateData = pendingStates.get(state);
    if (!stateData) {
      return reply.status(400).send({
        error: { code: "invalid_state", message: "Invalid or expired state parameter. Try connecting again." },
      });
    }

    pendingStates.delete(state);
    const { brandId } = stateData;

    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error("[Google OAuth] Token exchange failed:", errorBody);
      return reply.status(502).send({
        error: { code: "token_exchange_failed", message: "Failed to exchange authorization code for tokens" },
      });
    }

    const tokenData = await tokenResponse.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      token_type: string;
      scope: string;
    };

    // Fetch user info to get their Google account ID and email
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoResponse.ok) {
      console.error("[Google OAuth] Failed to fetch user info");
      return reply.status(502).send({
        error: { code: "userinfo_failed", message: "Failed to fetch Google user info" },
      });
    }

    const userInfo = await userInfoResponse.json() as {
      id: string;
      email: string;
      name: string;
      picture?: string;
    };

    // Fetch their Business Profile accounts (locations)
    const accountsResponse = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );

    let accountsData: { accounts?: Array<{ name: string; accountName?: string; type?: string }> } = {};
    if (accountsResponse.ok) {
      accountsData = await accountsResponse.json() as typeof accountsData;
    }

    // Get the first account (most users have one)
    const account = accountsData.accounts?.[0];
    const accountId = account?.name?.replace("accounts/", "") || userInfo.id;
    const accountName = account?.accountName || userInfo.name;

    // Fetch locations for this account
    let locationName = "";
    let locationId = "";
    let locationPhone = "";
    let locationWebsite = "";
    let locationAddress: Record<string, unknown> | undefined;
    let primaryCategory = "";

    if (accountId) {
      try {
        const locationsResponse = await fetch(
          `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${accountId}/locations?readMask=title,phoneNumbers,websiteUri,storefrontAddress,primaryCategory`,
          {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          }
        );

        if (locationsResponse.ok) {
          const locationsData = await locationsResponse.json() as {
            locations?: Array<{
              name: string;
              title?: string;
              phoneNumbers?: { phones?: Array<{ number?: string }> };
              websiteUri?: string;
              storefrontAddress?: Record<string, unknown>;
              primaryCategory?: { displayName?: string };
            }>;
          };

          const location = locationsData.locations?.[0];
          if (location) {
            locationName = location.title || "";
            locationId = location.name || "";
            locationPhone = location.phoneNumbers?.phones?.[0]?.number || "";
            locationWebsite = location.websiteUri || "";
            locationAddress = location.storefrontAddress;
            primaryCategory = location.primaryCategory?.displayName || "";
          }
        }
      } catch (err) {
        console.error("[Google OAuth] Failed to fetch locations:", err);
      }
    }

    // Store the connection in our DB
    const [existingAccount] = await db
      .select()
      .from(gbpAccounts)
      .where(eq(gbpAccounts.brandId, brandId))
      .limit(1);

    const accountData = {
      brandId,
      googleAccountId: accountId,
      accessTokenEncrypted: tokenData.access_token,
      refreshTokenEncrypted: tokenData.refresh_token,
      locationId: locationId,
      displayName: accountName || userInfo.name,
      locationName: locationName || undefined,
      phone: locationPhone || undefined,
      websiteUrl: locationWebsite || undefined,
      primaryCategory: primaryCategory || undefined,
      address: locationAddress ? JSON.stringify(locationAddress) : undefined,
      status: "active" as const,
      lastSyncedAt: new Date(),
      updatedAt: new Date(),
    };

    let savedAccount;
    if (existingAccount) {
      const [updated] = await db
        .update(gbpAccounts)
        .set(accountData)
        .where(eq(gbpAccounts.id, existingAccount.id))
        .returning();
      savedAccount = updated;
    } else {
      const [created] = await db
        .insert(gbpAccounts)
        .values(accountData)
        .returning();
      savedAccount = created;
    }

    console.log(`[Google OAuth] Connected GBP account for brand ${brandId}: ${locationName || accountName}`);

    // Return success HTML page
    return reply.type("text/html").send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>AgentSocial - Google Connected</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0f172a; color: #e2e8f0; }
          .card { background: #1e293b; border-radius: 12px; padding: 40px; text-align: center; max-width: 400px; }
          .icon { font-size: 64px; margin-bottom: 16px; }
          h1 { color: #10b981; margin: 0 0 8px; font-size: 24px; }
          p { color: #94a3b8; margin: 0 0 24px; }
          .detail { background: #334155; border-radius: 8px; padding: 12px; margin: 8px 0; font-size: 14px; text-align: left; }
          .detail strong { color: #e2e8f0; }
          .btn { background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; margin-top: 16px; }
          .btn:hover { background: #059669; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✅</div>
          <h1>Google Connected!</h1>
          <p>Your Google Business Profile is now connected to AgentSocial.</p>
          <div class="detail"><strong>Account:</strong> ${accountName || userInfo.email}</div>
          ${locationName ? `<div class="detail"><strong>Location:</strong> ${locationName}</div>` : ''}
          <button class="btn" onclick="window.close()">Close Window</button>
        </div>
      </body>
      </html>
    `);
  });

  // GET /auth/google/status — Check if a brand has Google connected
  server.get("/auth/google/status", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { brandId } = request.query as { brandId?: string };
    if (!brandId) {
      return reply.status(400).send({ error: { code: "brand_required", message: "brandId query param required" } });
    }

    const [account] = await db
      .select()
      .from(gbpAccounts)
      .where(eq(gbpAccounts.brandId, brandId))
      .limit(1);

    if (!account) {
      return reply.send({ connected: false, account: null });
    }

    // Don't expose tokens
    const { accessTokenEncrypted, refreshTokenEncrypted, ...safeAccount } = account as any;
    return reply.send({
      connected: account.status === "active",
      account: {
        ...safeAccount,
        // Show last 4 chars of token to confirm it exists
        hasAccessToken: !!accessTokenEncrypted,
        hasRefreshToken: !!refreshTokenEncrypted,
      },
    });
  });

  // POST /auth/google/disconnect — Disconnect Google account
  server.post("/auth/google/disconnect", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { brandId } = request.body as { brandId?: string };
    if (!brandId) {
      return reply.status(400).send({ error: { code: "brand_required", message: "brandId required" } });
    }

    const result = await gbpService.disconnectGbpAccount(brandId);
    if (!result) {
      return reply.status(404).send({ error: { code: "not_found", message: "No Google account found for this brand" } });
    }

    return reply.send({ success: true, disconnected: result });
  });
};

import * as gbpService from "../services/gbp.js";
import crypto from "crypto";