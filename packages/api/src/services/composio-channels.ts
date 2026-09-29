/**
 * Keeps channel rows in step with the brand's Composio connected accounts.
 *
 * A connect only records the new account as `composio_pending_account_id`;
 * the channel keeps publishing through its current account until the pending
 * one finishes OAuth (Composio status ACTIVE), and is then promoted here.
 */

import { eq } from "drizzle-orm";
import { db, channels } from "../db/index.js";
import { getConnectedAccounts, PLATFORM_TO_TOOLKIT, type ConnectedAccountInfo } from "./composio.js";

type ChannelRow = typeof channels.$inferSelect;
type ChannelStatus = "active" | "disconnected" | "error";

function statusFor(account: ConnectedAccountInfo | undefined): ChannelStatus {
  if (!account) return "disconnected";
  if (account.status === "ACTIVE" && !account.is_disabled) return "active";
  if (account.status === "INITIATED") return "disconnected";
  return "error"; // EXPIRED, FAILED, disabled
}

export interface ChannelSyncPlan {
  status: ChannelStatus;
  accountId: string;
  settings: Record<string, unknown>;
}

type SyncableChannel = Pick<ChannelRow, "id" | "platform" | "status" | "accountId" | "settings">;

/**
 * Decide a channel's new state from the brand's Composio accounts, or null when
 * nothing changes. Pure, so the rules are unit-testable.
 */
export function planChannelSync(
  channel: SyncableChannel,
  accounts: ConnectedAccountInfo[],
  includeChannelId?: string,
): ChannelSyncPlan | null {
  const toolkit = PLATFORM_TO_TOOLKIT[channel.platform];
  if (!toolkit) return null;

  const settings = { ...(Object(channel.settings) as Record<string, unknown>) };
  const current = settings.composio_account_id as string | undefined;
  const pending = settings.composio_pending_account_id as string | undefined;
  if (!current && !pending && channel.id !== includeChannelId) return null;

  const byId = (id?: string) => (id ? accounts.find((a) => a.id === id) : undefined);
  const pendingAccount = byId(pending);
  let currentId = current;

  if (pending && statusFor(pendingAccount) === "active") {
    currentId = pending;
    delete settings.composio_pending_account_id;
  } else if (pending && (!pendingAccount || statusFor(pendingAccount) === "error")) {
    delete settings.composio_pending_account_id; // abandoned, deleted or failed
  }

  if (!byId(currentId)) {
    const newestActive = accounts
      .filter((a) => a.app_name === toolkit && statusFor(a) === "active")
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    if (newestActive) currentId = newestActive.id;
  }

  // A channel whose only Composio link was an abandoned pending connect keeps
  // its own status; it is not Composio-managed
  if (!currentId) {
    return JSON.stringify(settings) !== JSON.stringify(channel.settings)
      ? { status: channel.status as ChannelStatus, accountId: channel.accountId, settings }
      : null;
  }

  const status = statusFor(byId(currentId));
  settings.composio_account_id = currentId;
  const changed =
    status !== channel.status ||
    currentId !== channel.accountId ||
    JSON.stringify(settings) !== JSON.stringify(channel.settings);
  return changed ? { status, accountId: currentId, settings } : null;
}

/**
 * Sync the brand's Composio-managed channels. `includeChannelId` also syncs a
 * channel that has no Composio ids yet, adopting the newest ACTIVE account.
 */
export async function syncBrandComposioChannels(
  brandId: string,
  opts: { accounts?: ConnectedAccountInfo[]; includeChannelId?: string } = {},
): Promise<ChannelRow[]> {
  const accounts = opts.accounts ?? (await getConnectedAccounts(brandId));
  const rows = await db.select().from(channels).where(eq(channels.brandId, brandId));
  const updated: ChannelRow[] = [];

  for (const channel of rows) {
    const plan = planChannelSync(channel, accounts, opts.includeChannelId);
    if (!plan) continue;
    const [row] = await db
      .update(channels)
      .set({ ...plan, updatedAt: new Date() })
      .where(eq(channels.id, channel.id))
      .returning();
    updated.push(row);
  }

  return updated;
}
