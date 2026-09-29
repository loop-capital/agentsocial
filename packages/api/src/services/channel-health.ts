/**
 * Channel health check — keeps channel status honest.
 *
 * - Composio channels: status re-synced from Composio (expired → error).
 * - Direct Facebook/Instagram channels: the stored token is tested against the
 *   Graph API; an invalid-token answer (OAuthException / code 190) marks the
 *   channel error. Network or other API errors never change status.
 * - Other direct channels: marked error once token_expires_at has passed.
 *
 * Error details go in settings.health_error so the dashboard can say why.
 */

import { pool } from "../db/index.js";
import { decryptToken } from "../connectors/token-store.js";
import { syncBrandComposioChannels } from "./composio-channels.js";

export interface ChannelHealthResult {
  composioBrandsSynced: number;
  directChecked: number;
  markedError: string[];
}

async function markError(channelId: string, reason: string): Promise<void> {
  await pool.query(
    `UPDATE channels SET status = 'error',
       settings = settings || jsonb_build_object('health_error', $2::text, 'health_checked_at', now()::text),
       updated_at = now()
     WHERE id = $1`,
    [channelId, reason],
  );
}

/** true = token works, false = token rejected, null = couldn't tell. */
async function facebookTokenValid(token: string): Promise<boolean | null> {
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/me?fields=id&access_token=${encodeURIComponent(token)}`, {
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) return true;
    const body: any = await res.json().catch(() => ({}));
    const err = body?.error;
    return err?.code === 190 || err?.type === "OAuthException" ? false : null;
  } catch {
    return null;
  }
}

export async function checkChannelHealth(log: (msg: string) => void = console.log): Promise<ChannelHealthResult> {
  const result: ChannelHealthResult = { composioBrandsSynced: 0, directChecked: 0, markedError: [] };

  // Composio-managed channels, one sync per brand
  const { rows: composioBrands } = await pool.query(
    `SELECT DISTINCT brand_id FROM channels
     WHERE settings ? 'composio_account_id' OR settings ? 'composio_pending_account_id'`,
  );
  for (const { brand_id } of composioBrands) {
    try {
      const updated = await syncBrandComposioChannels(brand_id);
      result.markedError.push(...updated.filter((c) => c.status === "error").map((c) => c.id));
      result.composioBrandsSynced++;
    } catch (err) {
      log(`channel health: Composio sync failed for brand ${brand_id}: ${(err as Error).message}`);
    }
  }

  // Direct-OAuth channels that currently claim to be active
  const { rows: direct } = await pool.query(
    `SELECT id, platform, access_token_encrypted, token_expires_at FROM channels
     WHERE status = 'active' AND access_token_encrypted IS NOT NULL
       AND NOT (settings ? 'composio_account_id')`,
  );
  for (const ch of direct) {
    result.directChecked++;
    if (ch.token_expires_at && new Date(ch.token_expires_at).getTime() < Date.now()) {
      await markError(ch.id, "Access token expired; reconnect this channel");
      result.markedError.push(ch.id);
      continue;
    }
    if (ch.platform === "facebook" || ch.platform === "instagram") {
      let token: string;
      try {
        token = decryptToken(ch.access_token_encrypted);
      } catch {
        continue;
      }
      if ((await facebookTokenValid(token)) === false) {
        await markError(ch.id, "Facebook rejected the access token (revoked or password changed); reconnect this channel");
        result.markedError.push(ch.id);
      }
    }
  }

  log(
    `channel health: synced ${result.composioBrandsSynced} Composio brand(s), checked ${result.directChecked} direct channel(s), ` +
      `${result.markedError.length} marked error`,
  );
  return result;
}
