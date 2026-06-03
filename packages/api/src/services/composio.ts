/**
 * Composio Service — managed OAuth + social API execution
 *
 * Replaces the need for 6 custom social connectors (Twitter, LinkedIn, Facebook,
 * Instagram, TikTok, GBP) by delegating auth and API calls to Composio.
 *
 * Mapping: our `brand_id` → Composio `entityId` (called clientUniqueUserId in their API)
 */

import { Composio } from "composio-core";
import type {
  ConnectedAccountResponseDTO,
  ActionExecuteResponse,
  ConnectionRequest,
} from "composio-core";

// ─── Singleton client ────────────────────────────────────────────────────────

let _composio: Composio | null = null;

function getComposio(): Composio {
  if (!_composio) {
    const apiKey = process.env.COMPOSIO_API_KEY;
    if (!apiKey) {
      throw new Error("COMPOSIO_API_KEY is not set in environment");
    }
    const projectId = process.env.COMPOSIO_PROJECT_ID;
    _composio = new Composio({ apiKey, ...(projectId ? { projectId } : {}) });
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
  gbp: "google_business_profile",
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

// ─── Methods ─────────────────────────────────────────────────────────────────

/**
 * List all connected accounts for a given brand (mapped as entityId).
 */
export async function getConnectedAccounts(brandId: string): Promise<ConnectedAccountInfo[]> {
  const composio = getComposio();
  const entity = composio.getEntity(brandId);

  // Entity.getConnections() returns raw connection items
  const connections = await entity.getConnections();

  return connections.map((conn: any) => ({
    id: conn.id ?? conn.connectedAccountId ?? "",
    entity_id: conn.clientUniqueUserId ?? conn.entityId ?? brandId,
    app_name: conn.appName ?? conn.appUniqueId ?? "",
    app_unique_id: conn.appUniqueId ?? conn.appName ?? "",
    status: conn.status ?? "UNKNOWN",
    created_at: conn.createdAt ?? new Date().toISOString(),
    updated_at: conn.updatedAt ?? new Date().toISOString(),
    is_disabled: conn.isDisabled ?? conn.disabled ?? false,
  }));
}

/**
 * Generate an OAuth connection link for a toolkit so the user can
 * authorize their social account via Composio's hosted flow.
 *
 * @param brandId  — Our brand_id, used as Composio entityId
 * @param toolkit — Composio app key (e.g. "instagram", "twitter")
 * @param redirectUrl — Optional URL to redirect after OAuth completes
 */
export async function getConnectionLink(
  brandId: string,
  toolkit: string,
  redirectUrl?: string,
): Promise<ConnectionLinkResult> {
  const composio = getComposio();
  const entity = composio.getEntity(brandId);

  const connectionRequest: ConnectionRequest = await entity.initiateConnection({
    appName: toolkit,
    ...(redirectUrl ? { redirectUri: redirectUrl } : {}),
  });

  return {
    redirect_url: connectionRequest.redirectUrl,
    connected_account_id: connectionRequest.connectedAccountId,
    connection_status: connectionRequest.connectionStatus,
  };
}

/**
 * Execute a Composio action (e.g. post to social, respond to comment).
 *
 * @param brandId           — Our brand_id, used as Composio entityId
 * @param actionName        — Composio action enum (e.g. "INSTAGRAM_CREATE_MEDIA_POST")
 * @param params            — Action input parameters
 * @param connectedAccountId — Optional: specific connected account to use
 */
export async function executeAction(
  brandId: string,
  actionName: string,
  params: Record<string, unknown>,
  connectedAccountId?: string,
): Promise<ActionResult> {
  const composio = getComposio();
  const entity = composio.getEntity(brandId);

  const result: ActionExecuteResponse = await entity.execute({
    actionName,
    params,
    ...(connectedAccountId ? { connectedAccountId } : {}),
  });

  return {
    success: result.successful ?? false,
    data: result.data as Record<string, unknown>,
    error: result.error,
  };
}

/**
 * List all connected accounts across all entities (admin-level).
 * Uses the top-level connectedAccounts.list() method.
 */
export async function listAllConnectedAccounts(
  entityId?: string,
): Promise<ConnectedAccountInfo[]> {
  const composio = getComposio();

  const response = await composio.connectedAccounts.list({
    ...(entityId ? { entityId } : {}),
  });

  const items = (response as any).items ?? (Array.isArray(response) ? response : []);
  return items.map((conn: any) => ({
    id: conn.id ?? conn.connectedAccountId ?? "",
    entity_id: conn.clientUniqueUserId ?? conn.entityId ?? "",
    app_name: conn.appName ?? conn.appUniqueId ?? "",
    app_unique_id: conn.appUniqueId ?? conn.appName ?? "",
    status: conn.status ?? "UNKNOWN",
    created_at: conn.createdAt ?? new Date().toISOString(),
    updated_at: conn.updatedAt ?? new Date().toISOString(),
    is_disabled: conn.isDisabled ?? conn.disabled ?? false,
  }));
}

/**
 * Wait for a connection to become active (useful after OAuth redirect).
 */
export async function waitForConnectionActive(
  brandId: string,
  toolkit: string,
  timeoutMs = 60000,
): Promise<ConnectedAccountResponseDTO | null> {
  const composio = getComposio();
  const entity = composio.getEntity(brandId);

  const connectionRequest = await entity.initiateConnection({ appName: toolkit });
  try {
    const activeAccount = await connectionRequest.waitUntilActive(Math.floor(timeoutMs / 1000));
    return activeAccount;
  } catch {
    return null;
  }
}