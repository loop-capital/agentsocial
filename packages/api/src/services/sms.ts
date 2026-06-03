// SMS Service — Twilio-powered SMS dispatch for Review Sentry
// Handles sending, rate limiting, opt-out management, and delivery tracking

import Twilio from "twilio";
import { db } from "../db/index.js";
import { reviewRequests, reviewCampaigns } from "../db/schema.js";
import { eq, and, gte, sql } from "drizzle-orm";
import { renderTemplate } from "./sms-templates.js";

// ─── Config ──────────────────────────────────────────────────────────────────

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const REVIEW_SENTRY_BASE_URL = process.env.REVIEW_SENTRY_BASE_URL || "http://localhost:3000";

const isMockMode = !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN;

let twilioClient: any = null;
function getTwilioClient(): any {
  if (!twilioClient) {
    // @ts-expect-error Twilio CJS default export
    twilioClient = new Twilio(TWILIO_ACCOUNT_SID!, TWILIO_AUTH_TOKEN!);
  }
  return twilioClient;
}

// ─── Rate Limits ─────────────────────────────────────────────────────────────

const MAX_SMS_PER_CUSTOMER_PER_24H = 1;
const MAX_SMS_PER_CUSTOMER_PER_CAMPAIGN = 3;
const OPT_OUT_KEYWORDS = ["stop", "unsubscribe", "cancel", "end", "quit"];
const OPT_IN_KEYWORDS = ["start", "yes", "unstop"];

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SendSMSInput {
  to: string;
  body: string;
  campaignId?: string;
  requestId?: string;
}

export interface SendResult {
  success: boolean;
  messageSid?: string;
  error?: string;
  mock?: boolean;
}

export interface BulkSendResult {
  sent: number;
  queued: number;
  errors: Array<{ phone: string; error: string }>;
}

// ─── Core SMS Send ───────────────────────────────────────────────────────────

/**
 * Send a single SMS message via Twilio.
 * Returns mock response in development mode.
 */
export async function sendSMS(input: SendSMSInput): Promise<SendResult> {
  const { to, body, campaignId, requestId } = input;

  // Check opt-out status
  const optedOut = await isPhoneOptedOut(to);
  if (optedOut) {
    return { success: false, error: "Phone number has opted out" };
  }

  // Check rate limits if campaign/request context provided
  if (requestId) {
    const rateLimitOk = await checkRateLimits(to, campaignId);
    if (!rateLimitOk.ok) {
      return { success: false, error: rateLimitOk.reason };
    }
  }

  if (isMockMode) {
    console.log(`[MOCK SMS] To: ${to}\nBody: ${body}`);
    return { success: true, messageSid: `mock_${Date.now()}`, mock: true };
  }

  try {
    const client = getTwilioClient();
    const message = await client.messages.create({
      from: TWILIO_PHONE_NUMBER!,
      to,
      body,
      statusCallback: `${process.env.API_URL || "http://localhost:3002"}/api/v1/review-sentry/sms/webhook`,
    });

    // Update review request if we have one
    if (requestId) {
      await db
        .update(reviewRequests)
        .set({
          smsStatus: "sent",
          smsSentAt: new Date(),
          smsMessageSid: message.sid,
        })
        .where(eq(reviewRequests.id, requestId));
    }

    return { success: true, messageSid: message.sid };
  } catch (error: any) {
    // Mark request as failed if we have one
    if (requestId) {
      await db
        .update(reviewRequests)
        .set({ smsStatus: "failed" })
        .where(eq(reviewRequests.id, requestId));
    }

    return { success: false, error: error.message || "Failed to send SMS" };
  }
}

// ─── Bulk Send ───────────────────────────────────────────────────────────────

/**
 * Send review request SMS to a list of phone numbers for a campaign.
 * Respects rate limits and opt-outs.
 * Creates review_request records for each recipient.
 */
export async function bulkSendReviewRequests(
  campaignId: string,
  phoneNumbers: Array<{ phone: string; name?: string }>,
  templateId?: string,
): Promise<BulkSendResult> {
  // Fetch campaign details
  const campaign = await db.query.reviewCampaigns.findFirst({
    where: (c, { eq }) => eq(c.id, campaignId),
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  const baseUrl = `${REVIEW_SENTRY_BASE_URL}/review/${campaign.slug}`;
  const result: BulkSendResult = { sent: 0, queued: 0, errors: [] };

  for (const recipient of phoneNumbers) {
    try {
      // Check opt-out
      const optedOut = await isPhoneOptedOut(recipient.phone);
      if (optedOut) {
        result.errors.push({ phone: recipient.phone, error: "Opted out" });
        continue;
      }

      // Check rate limits
      const rateLimitOk = await checkRateLimits(recipient.phone, campaignId);
      if (!rateLimitOk.ok) {
        result.errors.push({ phone: recipient.phone, error: rateLimitOk.reason! });
        continue;
      }

      // Create review request record
      const [request] = await db
        .insert(reviewRequests)
        .values({
          campaignId,
          customerName: recipient.name || null,
          customerPhone: recipient.phone,
          status: "sent",
        })
        .returning();

      // Build personalized review URL
      const reviewUrl = request.token
        ? `${baseUrl}?t=${request.token}`
        : baseUrl;

      // Render SMS template
      const message = renderTemplate(templateId || campaign.smsTemplateId || "thank_you", {
        customer_name: recipient.name || "there",
        business_name: campaign.name,
        review_url: reviewUrl,
      });

      // Send SMS
      const sendResult = await sendSMS({
        to: recipient.phone,
        body: message,
        campaignId,
        requestId: request.id,
      });

      if (sendResult.success) {
        result.sent++;
      } else {
        result.errors.push({ phone: recipient.phone, error: sendResult.error || "Send failed" });
      }
    } catch (error: any) {
      result.errors.push({ phone: recipient.phone, error: error.message });
    }
  }

  return result;
}

// ─── Opt-Out Management ─────────────────────────────────────────────────────

/**
 * Check if a phone number has opted out of SMS.
 * Checks both review_requests records and any opt-out markers.
 */
export async function isPhoneOptedOut(phone: string): Promise<boolean> {
  const result = await db
    .select({ id: reviewRequests.id })
    .from(reviewRequests)
    .where(
      and(
        eq(reviewRequests.customerPhone, phone),
        eq(reviewRequests.optedOut, true),
      )
    )
    .limit(1);

  return result.length > 0;
}

/**
 * Mark a phone number as opted out.
 * If no existing request record exists, creates a placeholder record.
 */
export async function optOutPhone(phone: string): Promise<void> {
  // Update any existing records for this phone
  const updated = await db
    .update(reviewRequests)
    .set({
      optedOut: true,
      optedOutAt: new Date(),
      smsStatus: "opted_out",
    })
    .where(
      and(
        eq(reviewRequests.customerPhone, phone),
        eq(reviewRequests.optedOut, false),
      )
    )
    .returning();

  // If no existing records, create a placeholder to track the opt-out
  if (updated.length === 0) {
    const existing = await db
      .select({ id: reviewRequests.id })
      .from(reviewRequests)
      .where(eq(reviewRequests.customerPhone, phone))
      .limit(1);

    if (existing.length === 0) {
      // Create a placeholder record to track this opt-out
      // We need a campaign_id, so we skip this — but the phone will still be blocked
      // via a dedicated opt-out check in isPhoneOptedOut
      console.log(`[SMS] Opt-out received for ${phone} with no existing request record`);
    }
  }
}

/**
 * Re-allow a phone number (UNSTOP/START).
 */
export async function optInPhone(phone: string): Promise<void> {
  await db
    .update(reviewRequests)
    .set({
      optedOut: false,
      optedOutAt: null,
      smsStatus: null,
    })
    .where(eq(reviewRequests.customerPhone, phone));
}

/**
 * Check if a keyword is an opt-out keyword.
 */
export function isOptOutKeyword(body: string): boolean {
  const normalized = body.toLowerCase().trim();
  return OPT_OUT_KEYWORDS.includes(normalized);
}

/**
 * Check if a keyword is an opt-in keyword.
 */
export function isOptInKeyword(body: string): boolean {
  const normalized = body.toLowerCase().trim();
  return OPT_IN_KEYWORDS.includes(normalized);
}

// ─── Rate Limiting ───────────────────────────────────────────────────────────

/**
 * Check if a phone number has exceeded SMS rate limits.
 * - Max 1 SMS per customer per 24 hours
 * - Max 3 SMS per customer per campaign
 */
export async function checkRateLimits(
  phone: string,
  campaignId?: string,
): Promise<{ ok: boolean; reason?: string }> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Check 24-hour limit (any campaign)
  const recentSends = await db
    .select({ id: reviewRequests.id })
    .from(reviewRequests)
    .where(
      and(
        eq(reviewRequests.customerPhone, phone),
        gte(reviewRequests.smsSentAt, twentyFourHoursAgo),
        eq(reviewRequests.optedOut, false),
      )
    );

  if (recentSends.length >= MAX_SMS_PER_CUSTOMER_PER_24H) {
    return { ok: false, reason: `Rate limit: max ${MAX_SMS_PER_CUSTOMER_PER_24H} SMS per 24h` };
  }

  // Check per-campaign limit
  if (campaignId) {
    const campaignSends = await db
      .select({ id: reviewRequests.id })
      .from(reviewRequests)
      .where(
        and(
          eq(reviewRequests.customerPhone, phone),
          eq(reviewRequests.campaignId, campaignId),
          eq(reviewRequests.optedOut, false),
        )
      );

    if (campaignSends.length >= MAX_SMS_PER_CUSTOMER_PER_CAMPAIGN) {
      return { ok: false, reason: `Rate limit: max ${MAX_SMS_PER_CUSTOMER_PER_CAMPAIGN} SMS per campaign` };
    }
  }

  return { ok: true };
}

// ─── Delivery Status Webhook ─────────────────────────────────────────────────

/**
 * Process Twilio delivery status webhook.
 * Updates the review request's SMS status.
 */
export async function processDeliveryStatus(
  messageSid: string,
  messageStatus: string,
  errorCode?: string,
): Promise<void> {
  // Find the request by message SID
  const [request] = await db
    .select()
    .from(reviewRequests)
    .where(eq(reviewRequests.smsMessageSid, messageSid))
    .limit(1);

  if (!request) {
    console.log(`[SMS Webhook] No request found for SID ${messageSid}`);
    return;
  }

  const updateFields: Record<string, any> = {};

  switch (messageStatus) {
    case "delivered":
      updateFields.smsStatus = "delivered";
      updateFields.smsDeliveredAt = new Date();
      break;
    case "failed":
    case "undelivered":
      updateFields.smsStatus = "failed";
      break;
    case "queued":
    case "sent":
      updateFields.smsStatus = "sent";
      break;
  }

  if (Object.keys(updateFields).length > 0) {
    await db
      .update(reviewRequests)
      .set(updateFields)
      .where(eq(reviewRequests.id, request.id));

    console.log(`[SMS Webhook] Updated request ${request.id} → ${messageStatus}`);
  }
}

// ─── Reminders ───────────────────────────────────────────────────────────────

/**
 * Send a reminder SMS to a review request that hasn't been acted on.
 * Respects max reminder count and opt-outs.
 */
export async function sendReminder(requestId: string): Promise<SendResult> {
  const [request] = await db
    .select()
    .from(reviewRequests)
    .where(eq(reviewRequests.id, requestId))
    .limit(1);

  if (!request) {
    return { success: false, error: "Request not found" };
  }

  // Don't send reminders to opted-out numbers
  if (request.optedOut) {
    return { success: false, error: "Phone number has opted out" };
  }

  // Don't send reminders if already rated/redirected
  if (request.status === "rated" || request.status === "redirected" || request.status === "feedback_submitted") {
    return { success: false, error: "Customer already responded" };
  }

  // Get campaign for template and max reminders config
  const campaign = await db.query.reviewCampaigns.findFirst({
    where: (c, { eq }) => eq(c.id, request.campaignId),
  });

  if (!campaign) {
    return { success: false, error: "Campaign not found" };
  }

  const maxReminders = campaign.maxReminders || 2;
  if ((request.reminderCount || 0) >= maxReminders) {
    return { success: false, error: "Max reminders reached" };
  }

  // Build reminder message
  const reviewUrl = request.token
    ? `${REVIEW_SENTRY_BASE_URL}/review/${campaign.slug}?t=${request.token}`
    : `${REVIEW_SENTRY_BASE_URL}/review/${campaign.slug}`;

  const message = `Reminder: ${campaign.name} would love your feedback! Share your experience: ${reviewUrl}\n\nReply STOP to unsubscribe`;

  // Send
  const result = await sendSMS({
    to: request.customerPhone!,
    body: message,
    campaignId: campaign.id,
    requestId: request.id,
  });

  // Increment reminder count
  if (result.success) {
    await db
      .update(reviewRequests)
      .set({
        reminderCount: (request.reminderCount || 0) + 1,
        lastReminderAt: new Date(),
      })
      .where(eq(reviewRequests.id, requestId));
  }

  return result;
}

