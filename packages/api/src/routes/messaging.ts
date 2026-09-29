/**
 * Messaging Routes — proactive SMS and voice calls
 *
 *   POST   /messaging/sms              — send (or schedule) a text
 *   POST   /messaging/calls            — place (or schedule) a call that speaks a script
 *   GET    /messaging/messages         — list a brand's outbound messages
 *   GET    /messaging/messages/:id     — one message (status, SID, error)
 *   DELETE /messaging/messages/:id     — cancel a scheduled message
 *   GET    /messaging/settings         — brand sending number, quiet hours, daily cap
 *   PUT    /messaging/settings
 *
 * Brand via x-brand-id header or brand_id; ownership is enforced globally.
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  cancelMessage,
  createMessage,
  getMessage,
  getMessagingSettings,
  listMessages,
  MessagingError,
  updateMessagingSettings,
} from "../services/outbound-messaging.js";

const brandHeaders = z.object({
  "x-brand-id": z.string().uuid().optional().describe("Brand sending the message (or pass brand_id)"),
}).passthrough();

const brandIdField = z.string().uuid().optional().describe("Alternative to the x-brand-id header");
const purpose = z.enum(["reminder", "follow_up", "transactional"]).optional()
  .describe("What the message is for. Marketing messages are not supported here.");
const sendAt = z.string().datetime({ offset: true }).optional()
  .describe("ISO time to send; omit to send now. Sends inside quiet hours are deferred to the next allowed time.");

const smsBody = z.object({
  brand_id: brandIdField,
  to: z.string().min(7).describe("Recipient phone, E.164 preferred (+16145551234); 10-digit US numbers accepted"),
  body: z.string().min(1).max(1600),
  purpose,
  send_at: sendAt,
  metadata: z.record(z.any()).optional().describe("Your own reference data (e.g. appointment_id), returned as-is"),
});

const callBody = z.object({
  brand_id: brandIdField,
  to: z.string().min(7),
  script: z.string().min(1).max(3000).describe("What the call says when answered (text-to-speech)"),
  voice: z.string().max(40).optional().describe("Twilio TTS voice, default Polly.Joanna"),
  purpose,
  send_at: sendAt,
  metadata: z.record(z.any()).optional(),
});

const messageResponse = z.object({
  id: z.string().uuid(),
  brand_id: z.string().uuid(),
  kind: z.enum(["sms", "call"]),
  purpose: z.string(),
  to: z.string(),
  from: z.string(),
  body: z.string().describe("SMS text, or the call script"),
  voice: z.string().nullable(),
  status: z.string().describe("scheduled, sending, queued, sent, delivered, failed, canceled; calls: ringing, in_progress, completed, busy, no_answer"),
  scheduled_at: z.string(),
  deferred_reason: z.string().nullable(),
  sent_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  provider_sid: z.string().nullable(),
  error: z.object({ code: z.string(), message: z.string() }).nullable(),
  metadata: z.record(z.any()),
  created_at: z.string(),
});

const errorResponse = z.object({
  error: z.object({
    code: z.string().describe("brand_required, invalid_phone, recipient_opted_out, no_sending_number, number_not_owned, twilio_not_configured, not_found, not_cancelable"),
    message: z.string(),
  }).passthrough(),
});

const settingsResponse = z.object({
  brand_id: z.string().uuid(),
  from_number: z.string().nullable(),
  quiet_hours_start: z.number(),
  quiet_hours_end: z.number(),
  daily_limit_per_recipient: z.number(),
  timezone: z.string(),
});

export async function messagingRoutes(server: FastifyInstance) {
  const brandOf = (request: any): string | undefined =>
    (request.headers["x-brand-id"] as string | undefined) ?? request.body?.brand_id ?? request.query?.brand_id;

  const requireBrand = (request: any, reply: any): string | null => {
    const brandId = brandOf(request);
    if (!brandId) {
      reply.status(400).send({ error: { code: "brand_required", message: "Provide the brand via the x-brand-id header or brand_id" } });
      return null;
    }
    return brandId;
  };

  const sendError = (reply: any, err: unknown) => {
    if (err instanceof MessagingError) {
      return reply.status(err.status).send({ error: { code: err.code, message: err.message, details: err.details } });
    }
    throw err;
  };

  const settingsJson = (brandId: string, s: Awaited<ReturnType<typeof getMessagingSettings>>) => ({
    brand_id: brandId,
    from_number: s.fromNumber,
    quiet_hours_start: s.quietHoursStart,
    quiet_hours_end: s.quietHoursEnd,
    daily_limit_per_recipient: s.dailyLimitPerRecipient,
    timezone: s.timeZone,
  });

  server.post("/sms", {
    schema: {
      tags: ["Messaging"],
      summary: "Send or schedule an SMS",
      description: "Sends a text from the brand's number. Refused if the recipient replied STOP; deferred during quiet hours; capped per recipient per day. Delivery is tracked (GET /messaging/messages/{id}, message.delivered / message.failed webhooks).",
      headers: brandHeaders,
      body: smsBody,
      response: { 201: messageResponse, 400: errorResponse, 404: errorResponse, 409: errorResponse, 422: errorResponse, 503: errorResponse },
    },
  }, async (request, reply) => {
    const brandId = requireBrand(request, reply);
    if (!brandId) return reply;
    const b = request.body as z.infer<typeof smsBody>;
    try {
      const message = await createMessage({
        brandId, userId: request.userId!, kind: "sms", to: b.to, body: b.body,
        purpose: b.purpose, sendAt: b.send_at ? new Date(b.send_at) : undefined, metadata: b.metadata,
      });
      return reply.status(201).send(message);
    } catch (err) {
      return sendError(reply, err);
    }
  });

  server.post("/calls", {
    schema: {
      tags: ["Messaging"],
      summary: "Place or schedule an outbound call",
      description: "Calls the recipient from the brand's number and speaks the script (text-to-speech). Same opt-out, quiet-hours and daily-cap rules as SMS. Completion is tracked (call.completed webhook, duration in metadata).",
      headers: brandHeaders,
      body: callBody,
      response: { 201: messageResponse, 400: errorResponse, 404: errorResponse, 409: errorResponse, 422: errorResponse, 503: errorResponse },
    },
  }, async (request, reply) => {
    const brandId = requireBrand(request, reply);
    if (!brandId) return reply;
    const b = request.body as z.infer<typeof callBody>;
    try {
      const message = await createMessage({
        brandId, userId: request.userId!, kind: "call", to: b.to, body: b.script, voice: b.voice,
        purpose: b.purpose, sendAt: b.send_at ? new Date(b.send_at) : undefined, metadata: b.metadata,
      });
      return reply.status(201).send(message);
    } catch (err) {
      return sendError(reply, err);
    }
  });

  server.get("/messages", {
    schema: {
      tags: ["Messaging"],
      summary: "List outbound messages",
      headers: brandHeaders,
      querystring: z.object({
        brand_id: brandIdField,
        kind: z.enum(["sms", "call"]).optional(),
        status: z.string().optional(),
        limit: z.coerce.number().min(1).max(200).optional(),
      }),
      response: { 200: z.object({ data: z.array(messageResponse) }), 400: errorResponse },
    },
  }, async (request, reply) => {
    const brandId = requireBrand(request, reply);
    if (!brandId) return reply;
    const q = request.query as { kind?: "sms" | "call"; status?: any; limit?: number };
    return { data: await listMessages(brandId, q) };
  });

  server.get("/messages/:id", {
    schema: {
      tags: ["Messaging"],
      summary: "Get an outbound message",
      params: z.object({ id: z.string().uuid() }),
      response: { 200: messageResponse, 404: errorResponse },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const message = await getMessage(id);
    if (!message) return reply.status(404).send({ error: { code: "not_found", message: "Message not found" } });
    return message;
  });

  server.delete("/messages/:id", {
    schema: {
      tags: ["Messaging"],
      summary: "Cancel a scheduled message",
      description: "Only messages still in status scheduled can be canceled.",
      params: z.object({ id: z.string().uuid() }),
      response: { 200: messageResponse, 404: errorResponse, 409: errorResponse },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await getMessage(id);
    if (!existing) return reply.status(404).send({ error: { code: "not_found", message: "Message not found" } });
    const canceled = await cancelMessage(id);
    if (!canceled) {
      return reply.status(409).send({ error: { code: "not_cancelable", message: `Message is ${existing.status}; only scheduled messages can be canceled` } });
    }
    return canceled;
  });

  server.get("/settings", {
    schema: {
      tags: ["Messaging"],
      summary: "Get a brand's messaging settings",
      headers: brandHeaders,
      querystring: z.object({ brand_id: brandIdField }),
      response: { 200: settingsResponse, 400: errorResponse },
    },
  }, async (request, reply) => {
    const brandId = requireBrand(request, reply);
    if (!brandId) return reply;
    return settingsJson(brandId, await getMessagingSettings(brandId));
  });

  server.put("/settings", {
    schema: {
      tags: ["Messaging"],
      summary: "Update a brand's messaging settings",
      description: "from_number must be a number on the AgentSocial Twilio account; a brand can't send until it has one (null removes it). Quiet hours are local hours in the brand's timezone.",
      headers: brandHeaders,
      body: z.object({
        brand_id: brandIdField,
        from_number: z.string().nullable().optional(),
        quiet_hours_start: z.number().int().min(0).max(23).optional(),
        quiet_hours_end: z.number().int().min(0).max(23).optional(),
        daily_limit_per_recipient: z.number().int().min(1).max(20).optional(),
      }),
      response: { 200: settingsResponse, 400: errorResponse, 422: errorResponse, 503: errorResponse },
    },
  }, async (request, reply) => {
    const brandId = requireBrand(request, reply);
    if (!brandId) return reply;
    const b = request.body as any;
    try {
      const s = await updateMessagingSettings(brandId, {
        fromNumber: b.from_number,
        quietHoursStart: b.quiet_hours_start,
        quietHoursEnd: b.quiet_hours_end,
        dailyLimitPerRecipient: b.daily_limit_per_recipient,
      });
      return settingsJson(brandId, s);
    } catch (err) {
      return sendError(reply, err);
    }
  });
}
