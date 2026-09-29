// ─── Rebooking Campaigns Service ──────────────────────────────────────────────
//
// Campaign definitions and their message log, stored in `campaigns` and
// `campaign_messages`. Stats are computed from the message log.
//
// Note: nothing sends campaign messages yet; campaigns are definitions only
// until a sender writes rows to campaign_messages.

import type {
  Campaign,
  CampaignMessage,
  CampaignMessageStatus,
  CampaignStats,
  CampaignStatus,
  CampaignType,
  CreateCampaignInput,
  UpdateCampaignInput,
} from "@agentsocial/shared";
import { pool } from "../db/index.js";

/** Estimated cost per message in cents, used for ROI. */
const COST_PER_MESSAGE_CENTS = 1;

const iso = (v: unknown): string | null => (v ? new Date(v as string).toISOString() : null);

function toCampaign(r: any, stats: CampaignStats): Campaign {
  return {
    id: r.id,
    brandId: r.brand_id,
    name: r.name,
    type: r.type,
    status: r.status,
    template: r.template,
    subject: r.subject ?? undefined,
    channel: r.channel,
    triggers: r.triggers ?? [],
    stats,
    createdAt: iso(r.created_at)!,
    updatedAt: iso(r.updated_at)!,
  };
}

function toMessage(r: any): CampaignMessage {
  return {
    id: r.id,
    campaignId: r.campaign_id,
    brandId: r.brand_id,
    recipientName: r.recipient_name ?? "",
    recipientPhone: r.recipient_phone,
    recipientEmail: r.recipient_email,
    channel: r.channel,
    status: r.status,
    sentAt: iso(r.sent_at),
    deliveredAt: iso(r.delivered_at),
    openedAt: iso(r.opened_at),
    clickedAt: iso(r.clicked_at),
    bookedAt: iso(r.booked_at),
    content: r.content,
    errorMessage: r.error_message,
    createdAt: iso(r.created_at)!,
  };
}

/** Stats for each campaign id, computed from campaign_messages. */
async function statsFor(campaignIds: string[]): Promise<Map<string, CampaignStats>> {
  const result = new Map<string, CampaignStats>();
  if (campaignIds.length === 0) return result;
  const { rows } = await pool.query(
    `SELECT campaign_id,
       count(*) FILTER (WHERE sent_at IS NOT NULL)::int      AS sent,
       count(*) FILTER (WHERE delivered_at IS NOT NULL)::int AS delivered,
       count(*) FILTER (WHERE opened_at IS NOT NULL)::int    AS opened,
       count(*) FILTER (WHERE clicked_at IS NOT NULL)::int   AS clicked,
       count(*) FILTER (WHERE booked_at IS NOT NULL)::int    AS booked,
       count(*) FILTER (WHERE status = 'failed')::int        AS failed,
       count(*) FILTER (WHERE status = 'opted_out')::int     AS opted_out,
       coalesce(sum(revenue_cents), 0)::bigint               AS revenue_cents
     FROM campaign_messages WHERE campaign_id::text = ANY($1) GROUP BY campaign_id`,
    [campaignIds],
  );
  for (const id of campaignIds) {
    const r = rows.find((x) => x.campaign_id === id);
    const sent = r?.sent ?? 0;
    const revenueCents = Number(r?.revenue_cents ?? 0);
    const cost = sent * COST_PER_MESSAGE_CENTS;
    const rate = (n: number) => (sent > 0 ? n / sent : 0);
    result.set(id, {
      sent,
      delivered: r?.delivered ?? 0,
      opened: r?.opened ?? 0,
      clicked: r?.clicked ?? 0,
      booked: r?.booked ?? 0,
      failed: r?.failed ?? 0,
      optedOut: r?.opted_out ?? 0,
      openRate: rate(r?.opened ?? 0),
      clickRate: rate(r?.clicked ?? 0),
      bookRate: rate(r?.booked ?? 0),
      revenue: revenueCents / 100,
      roi: cost > 0 ? revenueCents / cost : 0,
    });
  }
  return result;
}

// ─── Service Functions ───────────────────────────────────────────────────────

/** List all non-archived campaigns for a brand. */
export async function listCampaigns(brandId: string, status?: CampaignStatus, type?: CampaignType): Promise<Campaign[]> {
  const { rows } = await pool.query(
    `SELECT * FROM campaigns
     WHERE brand_id::text = $1 AND status <> 'archived'
       AND ($2::text IS NULL OR status = $2) AND ($3::text IS NULL OR type = $3)
     ORDER BY updated_at DESC`,
    [brandId, status ?? null, type ?? null],
  );
  const stats = await statsFor(rows.map((r) => r.id));
  return rows.map((r) => toCampaign(r, stats.get(r.id)!));
}

/** Get a single campaign by ID. */
export async function getCampaign(campaignId: string): Promise<Campaign | null> {
  const { rows } = await pool.query(`SELECT * FROM campaigns WHERE id::text = $1`, [campaignId]);
  if (!rows[0]) return null;
  const stats = await statsFor([rows[0].id]);
  return toCampaign(rows[0], stats.get(rows[0].id)!);
}

/** Create a new campaign (starts as a draft). */
export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  const { rows } = await pool.query(
    `INSERT INTO campaigns (brand_id, name, type, template, subject, channel, triggers)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [input.brandId, input.name, input.type, input.template, input.subject ?? null, input.channel, JSON.stringify(input.triggers ?? [])],
  );
  const stats = await statsFor([rows[0].id]);
  return toCampaign(rows[0], stats.get(rows[0].id)!);
}

/** Update a campaign's editable fields. */
export async function updateCampaign(campaignId: string, updates: UpdateCampaignInput): Promise<Campaign | null> {
  const columns: Record<string, unknown> = {
    name: updates.name,
    type: updates.type,
    status: updates.status,
    template: updates.template,
    subject: updates.subject,
    channel: updates.channel,
    triggers: updates.triggers === undefined ? undefined : JSON.stringify(updates.triggers),
  };
  const keys = Object.keys(columns).filter((k) => columns[k] !== undefined);
  if (keys.length === 0) return getCampaign(campaignId);

  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
  const { rowCount } = await pool.query(
    `UPDATE campaigns SET ${sets}, updated_at = now() WHERE id::text = $1`,
    [campaignId, ...keys.map((k) => columns[k])],
  );
  return rowCount ? getCampaign(campaignId) : null;
}

/** Get aggregated stats for a campaign. */
export async function getCampaignStats(campaignId: string): Promise<CampaignStats | null> {
  const campaign = await getCampaign(campaignId);
  return campaign?.stats ?? null;
}

/** List messages sent for a campaign, newest first. */
export async function getCampaignMessages(
  campaignId: string,
  status?: CampaignMessageStatus,
  limit: number = 50,
  offset: number = 0
): Promise<CampaignMessage[]> {
  const { rows } = await pool.query(
    `SELECT * FROM campaign_messages
     WHERE campaign_id::text = $1 AND ($2::text IS NULL OR status = $2)
     ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
    [campaignId, status ?? null, limit, offset],
  );
  return rows.map(toMessage);
}
