/**
 * Composio Service — managed OAuth + social API execution
 *
 * Replaces the need for 6 custom social connectors (Twitter, LinkedIn, Facebook,
 * Instagram, TikTok, GBP) by delegating auth and API calls to Composio.
 *
 * Mapping: our `brand_id` → Composio `userId` (v3 API, @composio/core)
 */

import { Composio } from "@composio/core";

// ─── Singleton client ────────────────────────────────────────────────────────

let _composio: Composio | null = null;

function getComposio(): Composio {
  if (!_composio) {
    const apiKey = process.env.COMPOSIO_API_KEY;
    if (!apiKey) {
      throw new Error("COMPOSIO_API_KEY is not set in environment");
    }
    _composio = new Composio({ apiKey });
  }
  return _composio;
}

// ─── Supported toolkits ──────────────────────────────────────────────────────

/** Maps our platform names to Composio app keys */
export const PLATFORM_TO_TOOLKIT: Record<string, string> = {
  twitter: "twitter",
  linkedin: "linkedin",
  facebook: "facebook",
  instagram: "instagram",
  tiktok: "tiktok",
  youtube: "youtube",
  // gbp is not a Composio toolkit; it publishes through Zernio
};

export const SUPPORTED_TOOLKITS = Object.values(PLATFORM_TO_TOOLKIT);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConnectedAccountInfo {
  id: string;
  entity_id: string;
  app_name: string;
  app_unique_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  is_disabled: boolean;
}

export interface ConnectionLinkResult {
  redirect_url: string | null;
  connected_account_id: string;
  connection_status: string;
}

export interface ActionResult {
  success: boolean;
  data: Record<string, unknown>;
  error?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toAccountInfo(conn: any, fallbackUser = ""): ConnectedAccountInfo {
  const slug = conn.toolkit?.slug ?? "";
  return {
    id: conn.id ?? "",
    entity_id: conn.userId ?? conn.user_id ?? fallbackUser,
    app_name: slug,
    app_unique_id: slug,
    status: conn.status ?? "UNKNOWN",
    created_at: conn.createdAt ?? new Date().toISOString(),
    updated_at: conn.updatedAt ?? new Date().toISOString(),
    is_disabled: conn.isDisabled ?? conn.status === "DISABLED",
  };
}

/** The Composio project has no auth config for this toolkit, so it can't be connected. */
export class ToolkitNotConfiguredError extends Error {
  constructor(public toolkit: string) {
    super(`No Composio auth config for "${toolkit}" — add one in the Composio dashboard (Auth Configs) to enable it`);
  }
}

async function resolveAuthConfigId(toolkit: string): Promise<string> {
  const composio = getComposio();
  const res: any = await composio.authConfigs.list({ toolkit } as any);
  // Composio ignores an unknown toolkit filter and returns every config, so match the slug
  const items: any[] = (res?.items ?? []).filter((c: any) => c.toolkit?.slug === toolkit);
  const cfg = items.find((c) => c.status === "ENABLED") ?? items[0];
  if (!cfg?.id) throw new ToolkitNotConfiguredError(toolkit);
  return cfg.id;
}

// ─── Methods ─────────────────────────────────────────────────────────────────

/** List all connected accounts for a given brand (mapped as Composio userId). */
export async function getConnectedAccounts(brandId: string): Promise<ConnectedAccountInfo[]> {
  const res: any = await getComposio().connectedAccounts.list({ userIds: [brandId] });
  return (res?.items ?? []).map((c: any) => toAccountInfo(c, brandId));
}

/**
 * Generate an OAuth connection link for a toolkit so the user can
 * authorize their social account via Composio's hosted flow.
 */
export async function getConnectionLink(
  brandId: string,
  toolkit: string,
  redirectUrl?: string,
): Promise<ConnectionLinkResult> {
  const authConfigId = await resolveAuthConfigId(toolkit);
  // allowMultiple: without it Composio rejects a second link for the same brand + toolkit
  const req: any = await getComposio().connectedAccounts.link(brandId, authConfigId, {
    allowMultiple: true,
    ...(redirectUrl ? { callbackUrl: redirectUrl } : {}),
  });
  return {
    redirect_url: req.redirectUrl ?? null,
    connected_account_id: req.id ?? "",
    connection_status: req.status ?? "INITIATED",
  };
}

/** Delete a connected account in Composio. */
export async function deleteConnectedAccount(connectedAccountId: string): Promise<void> {
  await getComposio().connectedAccounts.delete(connectedAccountId);
}

/**
 * Execute a Composio action (e.g. "INSTAGRAM_CREATE_POST").
 */
export async function executeAction(
  brandId: string,
  actionName: string,
  params: Record<string, unknown>,
  connectedAccountId?: string,
): Promise<ActionResult> {
  const result: any = await getComposio().tools.execute(actionName, {
    userId: brandId,
    arguments: params,
    ...(process.env.COMPOSIO_TOOLKIT_VERSION
      ? { version: process.env.COMPOSIO_TOOLKIT_VERSION }
      : { dangerouslySkipVersionCheck: true }),
    ...(connectedAccountId ? { connectedAccountId } : {}),
  } as any);
  return {
    success: result?.successful ?? false,
    data: (result?.data ?? {}) as Record<string, unknown>,
    error: result?.error ?? undefined,
  };
}

/** List all connected accounts across all users (admin-level), optionally for one user. */
export async function listAllConnectedAccounts(
  entityId?: string,
): Promise<ConnectedAccountInfo[]> {
  const res: any = await getComposio().connectedAccounts.list(
    entityId ? { userIds: [entityId] } : {},
  );
  return (res?.items ?? []).map((c: any) => toAccountInfo(c, entityId ?? ""));
}

/** Wait for a pending connection to become active (useful after OAuth redirect). */
export async function waitForConnectionActive(
  connectedAccountId: string,
  timeoutMs = 60000,
): Promise<ConnectedAccountInfo | null> {
  try {
    const acct: any = await getComposio().connectedAccounts.waitForConnection(connectedAccountId, timeoutMs);
    return toAccountInfo(acct);
  } catch {
    return null;
  }
}
