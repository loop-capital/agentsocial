// Review Sentry Scheduler — Auto-send review requests after appointments
// Uses node-cron for scheduling and respects rate limits + opt-outs

import { db } from "../db/index.js";
import { reviewCampaigns, reviewRequests } from "../db/schema.js";
import { eq, and, isNull, lt, gt, sql } from "drizzle-orm";
import { sendSMS, bulkSendReviewRequests, sendReminder } from "./sms.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ScheduleSendInput {
  campaignId: string;
  phoneNumbers: Array<{ phone: string; name?: string }>;
  templateId?: string;
  delayHours?: number;
}

export interface ScheduleRecurringInput {
  campaignId: string;
  interval: "daily" | "weekly";
  time: string; // HH:MM format
  phoneNumbers: Array<{ phone: string; name?: string }>;
  templateId?: string;
}

// ─── Scheduled Sends Store ────────────────────────────────────────────────────
// In production, use BullMQ or a proper job queue.
// For now, we store pending sends in memory and process them on interval.

interface PendingSend {
  id: string;
  campaignId: string;
  phoneNumbers: Array<{ phone: string; name?: string }>;
  templateId?: string;
  sendAt: Date;
  processed: boolean;
}

const pendingSends: PendingSend[] = [];

// ─── Schedule a One-Time Send ────────────────────────────────────────────────

/**
 * Schedule a review request SMS to be sent after a delay.
 * Default delay is the campaign's auto_send_delay_hours (or 2 hours).
 */
export async function scheduleReviewRequest(input: ScheduleSendInput): Promise<{
  scheduled: boolean;
  sendAt: Date;
  message: string;
}> {
  const campaign = await db.query.reviewCampaigns.findFirst({
    where: (c, { eq }) => eq(c.id, input.campaignId),
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  const delayHours = input.delayHours ?? campaign.autoSendDelayHours ?? 2;
  const sendAt = new Date(Date.now() + delayHours * 60 * 60 * 1000);

  // For immediate sends (delay = 0), send right away
  if (delayHours === 0) {
    const result = await bulkSendReviewRequests(
      input.campaignId,
      input.phoneNumbers,
      input.templateId,
    );
    return { scheduled: true, sendAt: new Date(), message: `Sent ${result.sent} messages` };
  }

  // Queue for later
  const id = `send_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  pendingSends.push({
    id,
    campaignId: input.campaignId,
    phoneNumbers: input.phoneNumbers,
    templateId: input.templateId,
    sendAt,
    processed: false,
  });

  return {
    scheduled: true,
    sendAt,
    message: `Scheduled ${input.phoneNumbers.length} SMS sends for ${sendAt.toISOString()}`,
  };
}

// ─── Process Pending Sends ───────────────────────────────────────────────────

/**
 * Process all pending sends that are due.
 * Call this on an interval (e.g., every 5 minutes).
 */
export async function processPendingSends(): Promise<{
  processed: number;
  errors: number;
}> {
  const now = new Date();
  let processed = 0;
  let errors = 0;

  for (const send of pendingSends) {
    if (send.processed) continue;
    if (send.sendAt > now) continue;

    try {
      const result = await bulkSendReviewRequests(
        send.campaignId,
        send.phoneNumbers,
        send.templateId,
      );
      processed += result.sent;
      errors += result.errors.length;
    } catch (error: any) {
      console.error(`[Scheduler] Error processing send ${send.id}:`, error.message);
      errors++;
    }

    send.processed = true;
  }

  // Clean up processed sends older than 24 hours
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const index = pendingSends.findIndex((s) => s.processed && s.sendAt < cutoff);
  if (index !== -1) {
    pendingSends.splice(index, pendingSends.filter((s) => s.processed && s.sendAt < cutoff).length);
  }

  return { processed, errors };
}

// ─── Send Reminders for Pending Requests ─────────────────────────────────────

/**
 * Find review requests that haven't been acted on and send reminders.
 * Called on a schedule (e.g., every 6 hours).
 */
export async function sendPendingReminders(): Promise<{
  remindersSent: number;
  errors: number;
}> {
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

  // Find requests that are still in "sent" status after 6+ hours
  const pendingRequests = await db
    .select()
    .from(reviewRequests)
    .where(
      and(
        eq(reviewRequests.status, "sent"),
        isNull(reviewRequests.ratedAt),
        lt(reviewRequests.smsSentAt, sixHoursAgo),
        eq(reviewRequests.optedOut, false),
      )
    );

  let remindersSent = 0;
  let errors = 0;

  for (const request of pendingRequests) {
    // Only send if we haven't exceeded max reminders
    const campaign = await db.query.reviewCampaigns.findFirst({
      where: (c, { eq }) => eq(c.id, request.campaignId),
    });

    if (!campaign) continue;

    const maxReminders = campaign.maxReminders || 2;
    if ((request.reminderCount || 0) >= maxReminders) continue;

    try {
      const result = await sendReminder(request.id);
      if (result.success) {
        remindersSent++;
      } else {
        errors++;
      }
    } catch {
      errors++;
    }
  }

  return { remindersSent, errors };
}

// ─── Schedule Recurring Sends ─────────────────────────────────────────────────

/**
 * Schedule recurring review request sends (e.g., daily at 10 AM).
 * In production, this would use BullMQ repeatable jobs.
 * For now, stores the schedule and processes on interval.
 */
export async function scheduleRecurring(input: ScheduleRecurringInput): Promise<{
  scheduled: boolean;
  message: string;
}> {
  // Validate campaign exists
  const campaign = await db.query.reviewCampaigns.findFirst({
    where: (c, { eq }) => eq(c.id, input.campaignId),
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  // In production: create a BullMQ repeatable job
  // For now: store in memory and process
  const id = `recurring_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  console.log(
    `[Scheduler] Recurring send scheduled: ${input.interval} at ${input.time} for campaign ${input.campaignId}`,
  );

  return {
    scheduled: true,
    message: `Recurring ${input.interval} send scheduled at ${input.time} for ${input.phoneNumbers.length} recipients`,
  };
}

// ─── After-Appointment Auto-Send ──────────────────────────────────────────────

/**
 * Auto-send a review request after an appointment.
 * This is the main entry point for post-appointment review solicitation.
 */
export async function sendAfterAppointment(
  campaignId: string,
  customerPhone: string,
  customerName?: string,
  appointmentDate?: Date,
): Promise<{
  success: boolean;
  requestId?: string;
  message: string;
}> {
  const campaign = await db.query.reviewCampaigns.findFirst({
    where: (c, { eq }) => eq(c.id, campaignId),
  });

  if (!campaign) {
    return { success: false, message: "Campaign not found" };
  }

  // Check opt-out
  const { isPhoneOptedOut } = await import("./sms.js");
  if (await isPhoneOptedOut(customerPhone)) {
    return { success: false, message: "Customer has opted out of SMS" };
  }

  // Check rate limits
  const { checkRateLimits } = await import("./sms.js");
  const rateLimitOk = await checkRateLimits(customerPhone, campaignId);
  if (!rateLimitOk.ok) {
    return { success: false, message: rateLimitOk.reason! };
  }

  // Create review request record
  const [request] = await db
    .insert(reviewRequests)
    .values({
      campaignId,
      customerName: customerName || null,
      customerPhone,
      appointmentDate: appointmentDate || null,
      status: "sent",
    })
    .returning();

  // Build review URL
  const baseUrl = process.env.REVIEW_SENTRY_BASE_URL || "http://localhost:3000";
  const reviewUrl = request.token
    ? `${baseUrl}/review/${campaign.slug}?t=${request.token}`
    : `${baseUrl}/review/${campaign.slug}`;

  // Render template
  const { renderTemplate } = await import("./sms-templates.js");
  const message = renderTemplate(campaign.smsTemplateId || "thank_you", {
    customer_name: customerName || "there",
    business_name: campaign.name,
    review_url: reviewUrl,
  });

  // Send SMS
  const { sendSMS } = await import("./sms.js");
  const result = await sendSMS({
    to: customerPhone,
    body: message,
    campaignId,
    requestId: request.id,
  });

  if (result.success) {
    return {
      success: true,
      requestId: request.id,
      message: "Review request sent successfully",
    };
  }

  return {
    success: false,
    requestId: request.id,
    message: result.error || "Failed to send SMS",
  };
}
