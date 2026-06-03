import { eq, and, desc, sql } from "drizzle-orm";
import Twilio from "twilio";
import { db, reviewSolicitations, gbpAccounts } from "../db/index.js";

// ─── Env / Twilio Client ─────────────────────────────────────────────────────────

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const isMockMode = !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN;

let twilioClient: any = null;
function getTwilioClient(): any {
  if (!twilioClient) {
    // @ts-expect-error Twilio CJS default export
    twilioClient = new Twilio(TWILIO_ACCOUNT_SID!, TWILIO_AUTH_TOKEN!);
  }
  return twilioClient;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateSolicitationInput {
  brandId: string;
  gbpAccountId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  messageTemplate?: string;
  createdByUserId?: string;
}

export interface SolicitationStats {
  total: number;
  sent: number;
  opened: number;
  clicked: number;
  reviewed: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

// ─── Create Solicitation ──────────────────────────────────────────────────────

/**
 * Create a new review solicitation record.
 * The solicitation starts in "pending" status and must be sent separately.
 */
export async function createSolicitation(input: CreateSolicitationInput) {
  const [row] = await db
    .insert(reviewSolicitations)
    .values({
      brandId: input.brandId,
      gbpAccountId: input.gbpAccountId,
      clientName: input.clientName,
      clientPhone: input.clientPhone,
      clientEmail: input.clientEmail ?? null,
      messageTemplate: input.messageTemplate ?? null,
      createdByUserId: input.createdByUserId ?? null,
      status: "pending",
    })
    .returning();

  return row;
}

// ─── Send Solicitation ───────────────────────────────────────────────────────

/**
 * Send a review solicitation via SMS (or email as fallback).
 * Updates status to "sent" on success, "failed" on error.
 */
export async function sendSolicitation(solicitationId: string) {
  // Fetch the solicitation
  const [solicitation] = await db
    .select()
    .from(reviewSolicitations)
    .where(eq(reviewSolicitations.id, solicitationId));

  if (!solicitation) {
    throw new Error(`Solicitation ${solicitationId} not found`);
  }

  if (solicitation.status !== "pending") {
    throw new Error(`Solicitation ${solicitationId} is already ${solicitation.status}`);
  }

  // Fetch GBP account for the review link
  const [account] = await db
    .select()
    .from(gbpAccounts)
    .where(eq(gbpAccounts.id, solicitation.gbpAccountId));

  // Build review URL
  const reviewUrl = account?.locationId
    ? `https://search.google.com/local/writereview?placeid=${account.locationId}`
    : "https://search.google.com/local/writereview";

  // Build SMS message
  const message =
    solicitation.messageTemplate ??
    `Hi ${solicitation.clientName}! Thanks for visiting us. We'd love your feedback — would you take 30 seconds to leave a review? ${reviewUrl}`;

  if (isMockMode) {
    // Mock: simulate successful send
    console.log(`[MOCK SMS] To: ${solicitation.clientPhone}\nMessage: ${message}`);

    const [updated] = await db
      .update(reviewSolicitations)
      .set({ status: "sent", sentAt: new Date() })
      .where(eq(reviewSolicitations.id, solicitationId))
      .returning();

    return updated;
  }

  // Real Twilio SMS send
  try {
    const twilioResponse = await sendTwilioSms(solicitation.clientPhone, message);

    const [updated] = await db
      .update(reviewSolicitations)
      .set({
        status: "sent",
        sentAt: new Date(),
      })
      .where(eq(reviewSolicitations.id, solicitationId))
      .returning();

    return updated;
  } catch (error: any) {
    const [updated] = await db
      .update(reviewSolicitations)
      .set({
        status: "failed",
        errorMessage: error.message ?? "Failed to send SMS",
      })
      .where(eq(reviewSolicitations.id, solicitationId))
      .returning();

    return updated;
  }
}

// ─── Track Open ───────────────────────────────────────────────────────────────

/**
 * Track when a solicitation email/SMS is opened.
 * Updates status from "sent" to "opened".
 */
export async function trackOpen(solicitationId: string) {
  const [solicitation] = await db
    .select()
    .from(reviewSolicitations)
    .where(eq(reviewSolicitations.id, solicitationId));

  if (!solicitation) {
    throw new Error(`Solicitation ${solicitationId} not found`);
  }

  // Only track open from "sent" status
  if (solicitation.status === "sent" || solicitation.status === "clicked" || solicitation.status === "opened") {
    const [updated] = await db
      .update(reviewSolicitations)
      .set({
        status: "opened",
        openedAt: solicitation.openedAt ?? new Date(),
      })
      .where(eq(reviewSolicitations.id, solicitationId))
      .returning();

    return updated;
  }

  return solicitation;
}

// ─── Track Click ───────────────────────────────────────────────────────────────

/**
 * Track when the review link is clicked.
 * Updates status from "opened" (or "sent") to "clicked".
 */
export async function trackClick(solicitationId: string) {
  const [solicitation] = await db
    .select()
    .from(reviewSolicitations)
    .where(eq(reviewSolicitations.id, solicitationId));

  if (!solicitation) {
    throw new Error(`Solicitation ${solicitationId} not found`);
  }

  // Only track click from sent/opened/clicked status
  const validStatuses = ["sent", "opened", "clicked"];
  if (!validStatuses.includes(solicitation.status)) {
    return solicitation;
  }

  const [updated] = await db
    .update(reviewSolicitations)
    .set({
      status: "clicked",
      clickedAt: solicitation.clickedAt ?? new Date(),
      openedAt: solicitation.openedAt ?? new Date(),
    })
    .where(eq(reviewSolicitations.id, solicitationId))
    .returning();

  return updated;
}

// ─── Mark Reviewed ────────────────────────────────────────────────────────────

/**
 * Mark a solicitation as reviewed (called when a new review is detected from the client).
 * Updates status to "reviewed".
 */
export async function markReviewed(solicitationId: string) {
  const [updated] = await db
    .update(reviewSolicitations)
    .set({
      status: "reviewed",
      reviewReceivedAt: new Date(),
    })
    .where(eq(reviewSolicitations.id, solicitationId))
    .returning();

  if (!updated) {
    throw new Error(`Solicitation ${solicitationId} not found`);
  }

  return updated;
}

// ─── Get Solicitations ────────────────────────────────────────────────────────

/**
 * List solicitations with optional filters.
 */
export async function getSolicitations(
  brandId: string,
  status?: string,
  limit: number = 50,
  offset: number = 0
) {
  const conditions = [eq(reviewSolicitations.brandId, brandId)];
  if (status) {
    conditions.push(eq(reviewSolicitations.status, status));
  }

  return db
    .select()
    .from(reviewSolicitations)
    .where(and(...conditions))
    .orderBy(desc(reviewSolicitations.createdAt))
    .limit(limit)
    .offset(offset);
}

// ─── Get Solicitation Stats ───────────────────────────────────────────────────

/**
 * Get aggregated stats for a brand's review solicitation campaigns.
 */
export async function getSolicitationStats(brandId: string): Promise<SolicitationStats> {
  const rows = await db
    .select({
      status: reviewSolicitations.status,
      count: sql<number>`count(*)::int`,
    })
    .from(reviewSolicitations)
    .where(eq(reviewSolicitations.brandId, brandId))
    .groupBy(reviewSolicitations.status);

  const counts: Record<string, number> = {};
  let total = 0;
  for (const row of rows) {
    counts[row.status] = row.count;
    total += row.count;
  }

  const sent = counts["sent"] ?? 0;
  const opened = counts["opened"] ?? 0;
  const clicked = counts["clicked"] ?? 0;
  const reviewed = counts["reviewed"] ?? 0;

  // Add up all statuses that represent "sent or beyond"
  const sentOrBeyond =
    sent + opened + clicked + reviewed + (counts["failed"] ?? 0);

  return {
    total,
    sent: sentOrBeyond,
    opened: opened + clicked + reviewed, // opened includes those who clicked/reviewed
    clicked: clicked + reviewed, // clicked includes those who reviewed
    reviewed,
    openRate: sentOrBeyond > 0 ? (opened + clicked + reviewed) / sentOrBeyond : 0,
    clickRate: sentOrBeyond > 0 ? (clicked + reviewed) / sentOrBeyond : 0,
    conversionRate: sentOrBeyond > 0 ? reviewed / sentOrBeyond : 0,
  };
}

// ─── Twilio SMS Helper ────────────────────────────────────────────────────────

async function sendTwilioSms(to: string, body: string): Promise<any> {
  const client = getTwilioClient();
  const message = await client.messages.create({
    from: TWILIO_PHONE_NUMBER!,
    to,
    body,
    statusCallback: `${process.env.API_URL}/api/v1/twilio/sms-status`,
  });

  if (message.status === "failed" || message.status === "undelivered") {
    throw new Error(`Twilio SMS failed: ${message.errorCode} - ${message.errorMessage}`);
  }

  return message;
}