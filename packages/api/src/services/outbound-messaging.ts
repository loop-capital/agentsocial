/**
 * Outbound messaging — proactive SMS and voice calls (reminders, follow-ups).
 *
 * Every message is a row in outbound_messages. It is sent immediately when due,
 * otherwise a sweeper sends it at scheduled_at. Safeguards, checked when the
 * message is created and again when it is sent:
 * - opt-outs (sms_opt_outs; STOP replies are recorded there)
 * - quiet hours in the brand's timezone (default 9pm–8am): sends are deferred
 * - a per-recipient daily cap per brand
 * - each brand sends only from its own number (messaging_settings.from_number)
 *
 * Twilio reports delivery / call completion to /twilio/sms-status and
 * /twilio/call-status, which update the row and emit webhooks
 * (message.delivered, message.failed, call.completed).
 */

import twilio from "twilio";
import { pool } from "../db/index.js";
import { deliverWebhookEvent } from "./webhook-delivery.js";

export type MessageKind = "sms" | "call";
export type MessagePurpose = "reminder" | "follow_up" | "transactional";
export type MessageStatus =
  | "scheduled" | "sending" | "queued" | "sent" | "delivered" | "failed" | "canceled"
  | "ringing" | "in_progress" | "completed" | "no_answer" | "busy";

export class MessagingError extends Error {
  constructor(public code: string, message: string, public status = 422, public details?: unknown) {
    super(message);
  }
}

// ─── Phone numbers ──────────────────────────────────────────────────────────

/** Normalize to E.164; bare 10-digit numbers are treated as US. Null if invalid. */
export function normalizePhone(input: string): string | null {
  const trimmed = input.trim();
  const digits = trimmed.replace(/[^\d]/g, "");
  if (trimmed.startsWith("+")) return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

// ─── Quiet hours ────────────────────────────────────────────────────────────

function localHour(date: Date, timeZone: string): number {
  const hour = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hourCycle: "h23" }).format(date);
  return Number(hour);
}

/** Whether `date` falls in quiet hours [start, end) local time; the window may wrap midnight. */
export function inQuietHours(date: Date, timeZone: string, start: number, end: number): boolean {
  if (start === end) return false;
  const h = localHour(date, timeZone);
  return start < end ? h >= start && h < end : h >= start || h < end;
}

/** The first moment at or after `date` outside quiet hours (to 15-minute precision). */
export function nextAllowedTime(date: Date, timeZone: string, start: number, end: number): Date {
  let t = new Date(date);
  for (let i = 0; i < 24 * 4 + 1 && inQuietHours(t, timeZone, start, end); i++) {
    t = new Date(Math.ceil((t.getTime() + 1) / 900_000) * 900_000);
  }
  return t;
}

// ─── Settings & opt-outs ────────────────────────────────────────────────────

export interface MessagingSettings {
  fromNumber: string | null;
  quietHoursStart: number;
  quietHoursEnd: number;
  dailyLimitPerRecipient: number;
  timeZone: string;
}

export async function getMessagingSettings(brandId: string): Promise<MessagingSettings> {
  const { rows } = await pool.query(
    `SELECT b.timezone, s.from_number, s.quiet_hours_start, s.quiet_hours_end, s.daily_limit_per_recipient
     FROM brands b LEFT JOIN messaging_settings s ON s.brand_id = b.id WHERE b.id = $1`,
    [brandId],
  );
  const r = rows[0] ?? {};
  return {
    // No shared fallback: a brand texts/calls only from a number assigned to it
    fromNumber: r.from_number ?? null,
    quietHoursStart: r.quiet_hours_start ?? 21,
    quietHoursEnd: r.quiet_hours_end ?? 8,
    dailyLimitPerRecipient: r.daily_limit_per_recipient ?? 3,
    timeZone: r.timezone || "America/New_York",
  };
}

export async function updateMessagingSettings(
  brandId: string,
  input: { fromNumber?: string | null; quietHoursStart?: number; quietHoursEnd?: number; dailyLimitPerRecipient?: number },
): Promise<MessagingSettings> {
  let fromNumber = input.fromNumber;
  if (fromNumber) {
    const normalized = normalizePhone(fromNumber);
    if (!normalized) throw new MessagingError("invalid_phone", `Invalid from_number: ${fromNumber}`);
    const owned = await twilioClient().incomingPhoneNumbers.list({ phoneNumber: normalized, limit: 1 });
    if (owned.length === 0) {
      throw new MessagingError("number_not_owned", `${normalized} is not a phone number on this Twilio account`);
    }
    fromNumber = normalized;
  }
  await pool.query(
    `INSERT INTO messaging_settings (brand_id, from_number, quiet_hours_start, quiet_hours_end, daily_limit_per_recipient)
     VALUES ($1, $2, coalesce($3, 21), coalesce($4, 8), coalesce($5, 3))
     ON CONFLICT (brand_id) DO UPDATE SET
       from_number = CASE WHEN $6 THEN EXCLUDED.from_number ELSE messaging_settings.from_number END,
       quiet_hours_start = coalesce($3, messaging_settings.quiet_hours_start),
       quiet_hours_end = coalesce($4, messaging_settings.quiet_hours_end),
       daily_limit_per_recipient = coalesce($5, messaging_settings.daily_limit_per_recipient),
       updated_at = now()`,
    [brandId, fromNumber ?? null, input.quietHoursStart ?? null, input.quietHoursEnd ?? null,
      input.dailyLimitPerRecipient ?? null, input.fromNumber !== undefined],
  );
  return getMessagingSettings(brandId);
}

export async function isOptedOut(phone: string): Promise<boolean> {
  const { rows } = await pool.query(`SELECT 1 FROM sms_opt_outs WHERE phone = $1`, [phone]);
  return rows.length > 0;
}

export async function recordOptOut(phone: string, source = "inbound_keyword"): Promise<void> {
  const normalized = normalizePhone(phone) ?? phone;
  await pool.query(
    `INSERT INTO sms_opt_outs (phone, source) VALUES ($1, $2) ON CONFLICT (phone) DO NOTHING`,
    [normalized, source],
  );
}

export async function removeOptOut(phone: string): Promise<void> {
  await pool.query(`DELETE FROM sms_opt_outs WHERE phone = $1`, [normalizePhone(phone) ?? phone]);
}

// ─── Messages ───────────────────────────────────────────────────────────────

export interface OutboundMessage {
  id: string;
  brand_id: string;
  kind: MessageKind;
  purpose: MessagePurpose;
  to: string;
  from: string;
  body: string;
  voice: string | null;
  status: MessageStatus;
  scheduled_at: string;
  deferred_reason: string | null;
  sent_at: string | null;
  completed_at: string | null;
  provider_sid: string | null;
  error: { code: string; message: string } | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const iso = (v: unknown): string | null => (v ? new Date(v as string).toISOString() : null);

function toMessage(r: any): OutboundMessage {
  return {
    id: r.id,
    brand_id: r.brand_id,
    kind: r.kind,
    purpose: r.purpose,
    to: r.to_number,
    from: r.from_number,
    body: r.body,
    voice: r.voice,
    status: r.status,
    scheduled_at: iso(r.scheduled_at)!,
    deferred_reason: r.deferred_reason,
    sent_at: iso(r.sent_at),
    completed_at: iso(r.completed_at),
    provider_sid: r.provider_sid,
    error: r.error,
    metadata: r.metadata ?? {},
    created_at: iso(r.created_at)!,
  };
}

async function update(id: string, fields: Record<string, unknown>): Promise<OutboundMessage> {
  const keys = Object.keys(fields);
  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
  const { rows } = await pool.query(
    `UPDATE outbound_messages SET ${sets}, updated_at = now() WHERE id = $1 RETURNING *`,
    [id, ...keys.map((k) => fields[k])],
  );
  return toMessage(rows[0]);
}

export interface CreateMessageInput {
  brandId: string;
  userId: string;
  kind: MessageKind;
  to: string;
  body: string;
  purpose?: MessagePurpose;
  sendAt?: Date;
  voice?: string;
  metadata?: Record<string, unknown>;
}

export async function createMessage(input: CreateMessageInput): Promise<OutboundMessage> {
  const to = normalizePhone(input.to);
  if (!to) throw new MessagingError("invalid_phone", `Invalid phone number: ${input.to}`);
  if (await isOptedOut(to)) throw new MessagingError("recipient_opted_out", `${to} has opted out (replied STOP)`, 409);

  const settings = await getMessagingSettings(input.brandId);
  if (!settings.fromNumber) {
    throw new MessagingError("no_sending_number", "This brand has no sending number; set one with PUT /messaging/settings", 422);
  }

  const requested = input.sendAt ?? new Date();
  const allowed = nextAllowedTime(requested, settings.timeZone, settings.quietHoursStart, settings.quietHoursEnd);
  const deferred = allowed.getTime() !== requested.getTime();

  const { rows } = await pool.query(
    `INSERT INTO outbound_messages
       (brand_id, user_id, kind, purpose, to_number, from_number, body, voice, scheduled_at, deferred_reason, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [input.brandId, input.userId, input.kind, input.purpose ?? "transactional", to, settings.fromNumber, input.body,
      input.voice ?? null, allowed,
      deferred ? `quiet hours (${settings.quietHoursStart}:00–${settings.quietHoursEnd}:00 ${settings.timeZone})` : null,
      input.metadata ?? {}],
  );
  const message = toMessage(rows[0]);
  return allowed.getTime() <= Date.now() ? dispatchMessage(message.id) : message;
}

export async function getMessage(id: string, brandId?: string): Promise<OutboundMessage | null> {
  const { rows } = await pool.query(
    `SELECT * FROM outbound_messages WHERE id::text = $1 AND ($2::text IS NULL OR brand_id::text = $2)`,
    [id, brandId ?? null],
  );
  return rows[0] ? toMessage(rows[0]) : null;
}

export async function listMessages(
  brandId: string,
  opts: { kind?: MessageKind; status?: MessageStatus; limit?: number } = {},
): Promise<OutboundMessage[]> {
  const { rows } = await pool.query(
    `SELECT * FROM outbound_messages
     WHERE brand_id = $1 AND ($2::text IS NULL OR kind = $2) AND ($3::text IS NULL OR status = $3)
     ORDER BY created_at DESC LIMIT $4`,
    [brandId, opts.kind ?? null, opts.status ?? null, Math.min(opts.limit ?? 50, 200)],
  );
  return rows.map(toMessage);
}

export async function cancelMessage(id: string): Promise<OutboundMessage | null> {
  const { rows } = await pool.query(
    `UPDATE outbound_messages SET status = 'canceled', updated_at = now()
     WHERE id::text = $1 AND status = 'scheduled' RETURNING *`,
    [id],
  );
  return rows[0] ? toMessage(rows[0]) : null;
}

// ─── Sending ────────────────────────────────────────────────────────────────

let client: ReturnType<typeof twilio> | null = null;
function twilioClient(): ReturnType<typeof twilio> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new MessagingError("twilio_not_configured", "Twilio credentials are not configured", 503);
  client ??= twilio(sid, token);
  return client;
}

function publicBase(): string {
  return (process.env.PUBLIC_API_URL || process.env.API_URL || "https://api.getagentsocial.com").replace(/\/$/, "");
}

const xmlEscape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export function callTwiml(script: string, voice = "Polly.Joanna"): string {
  return `<Response><Say voice="${xmlEscape(voice)}">${xmlEscape(script)}</Say></Response>`;
}

async function sentToday(brandId: string, to: string, excludeId: string): Promise<number> {
  const { rows } = await pool.query(
    `SELECT count(*)::int AS n FROM outbound_messages
     WHERE brand_id = $1 AND to_number = $2 AND id <> $3 AND sent_at > now() - interval '24 hours'`,
    [brandId, to, excludeId],
  );
  return rows[0].n;
}

/**
 * Send one message now. Claims it (scheduled → sending) so it can't be sent
 * twice, re-checks the safeguards, then hands it to Twilio.
 */
export async function dispatchMessage(id: string): Promise<OutboundMessage> {
  const { rows } = await pool.query(
    `UPDATE outbound_messages SET status = 'sending', updated_at = now()
     WHERE id = $1 AND status = 'scheduled' RETURNING *`,
    [id],
  );
  if (!rows[0]) return (await getMessage(id))!;
  const m = toMessage(rows[0]);

  const fail = (code: string, message: string) =>
    update(m.id, { status: "failed", error: JSON.stringify({ code, message }), completed_at: new Date() });

  if (await isOptedOut(m.to)) return fail("recipient_opted_out", `${m.to} has opted out`);

  const settings = await getMessagingSettings(m.brand_id);
  if (inQuietHours(new Date(), settings.timeZone, settings.quietHoursStart, settings.quietHoursEnd)) {
    const next = nextAllowedTime(new Date(), settings.timeZone, settings.quietHoursStart, settings.quietHoursEnd);
    return update(m.id, { status: "scheduled", scheduled_at: next, deferred_reason: "quiet hours" });
  }
  if ((await sentToday(m.brand_id, m.to, m.id)) >= settings.dailyLimitPerRecipient) {
    return fail("daily_limit_reached", `Already contacted ${m.to} ${settings.dailyLimitPerRecipient} times in 24h`);
  }

  try {
    const tw = twilioClient();
    const sid =
      m.kind === "sms"
        ? (await tw.messages.create({
            from: m.from, to: m.to, body: m.body,
            statusCallback: `${publicBase()}/api/v1/twilio/sms-status`,
          })).sid
        : (await tw.calls.create({
            from: m.from, to: m.to, twiml: callTwiml(m.body, m.voice ?? undefined),
            statusCallback: `${publicBase()}/api/v1/twilio/call-status`,
            statusCallbackEvent: ["completed"],
          })).sid;
    return await update(m.id, { status: m.kind === "sms" ? "queued" : "ringing", provider_sid: sid, sent_at: new Date(), error: null });
  } catch (err: any) {
    // 21610: recipient previously replied STOP to this number
    if (err?.code === 21610) await recordOptOut(m.to, "twilio_21610");
    const failed = await update(m.id, {
      status: "failed",
      completed_at: new Date(),
      error: JSON.stringify({ code: err?.code ? `twilio_${err.code}` : "send_failed", message: err?.message ?? String(err) }),
    });
    void notify(failed);
    return failed;
  }
}

let sweeping = false;

/** Send every scheduled message that is due. Runs on an interval. */
export async function sweepOutboundMessages(): Promise<number> {
  if (sweeping) return 0;
  sweeping = true;
  try {
    const { rows } = await pool.query(
      `SELECT id FROM outbound_messages WHERE status = 'scheduled' AND scheduled_at <= now() ORDER BY scheduled_at LIMIT 25`,
    );
    for (const { id } of rows) await dispatchMessage(id);
    return rows.length;
  } finally {
    sweeping = false;
  }
}

// ─── Twilio status callbacks ────────────────────────────────────────────────

const SMS_STATUS: Record<string, MessageStatus> = {
  queued: "queued", accepted: "queued", sending: "queued", sent: "sent",
  delivered: "delivered", undelivered: "failed", failed: "failed", canceled: "canceled",
};
const CALL_STATUS: Record<string, MessageStatus> = {
  queued: "ringing", initiated: "ringing", ringing: "ringing", "in-progress": "in_progress",
  completed: "completed", busy: "busy", "no-answer": "no_answer", failed: "failed", canceled: "canceled",
};
const TERMINAL: MessageStatus[] = ["delivered", "failed", "canceled", "completed", "busy", "no_answer"];

async function notify(m: OutboundMessage): Promise<void> {
  const event =
    m.kind === "call" ? (TERMINAL.includes(m.status) ? "call.completed" : null)
    : m.status === "delivered" ? "message.delivered"
    : m.status === "failed" ? "message.failed"
    : null;
  if (!event) return;
  const { rows } = await pool.query(`SELECT user_id FROM outbound_messages WHERE id = $1`, [m.id]);
  if (rows[0]) await deliverWebhookEvent(rows[0].user_id, event, m);
}

/** Apply a Twilio status callback. Returns false if the SID isn't one of ours. */
export async function applyStatusCallback(
  kind: MessageKind,
  sid: string,
  twilioStatus: string,
  extra: { errorCode?: string; duration?: string } = {},
): Promise<boolean> {
  const status = (kind === "sms" ? SMS_STATUS : CALL_STATUS)[twilioStatus];
  if (!status) return false;
  const { rows } = await pool.query(`SELECT * FROM outbound_messages WHERE provider_sid = $1`, [sid]);
  if (!rows[0]) return false;

  const fields: Record<string, unknown> = { status };
  if (TERMINAL.includes(status)) fields.completed_at = new Date();
  if (extra.errorCode) fields.error = JSON.stringify({ code: `twilio_${extra.errorCode}`, message: `Twilio error ${extra.errorCode}` });
  if (extra.duration) fields.metadata = JSON.stringify({ ...(rows[0].metadata ?? {}), duration_seconds: Number(extra.duration) });
  if (extra.errorCode === "21610") await recordOptOut(rows[0].to_number, "twilio_21610");

  const updated = await update(rows[0].id, fields);
  await notify(updated);
  return true;
}
