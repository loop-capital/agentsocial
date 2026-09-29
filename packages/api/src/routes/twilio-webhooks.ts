import type { FastifyInstance } from "fastify";
import { eq, and, sql } from "drizzle-orm";
import { db, reviewSolicitations } from "../db/index.js";
import { registerTwilioFormParser, verifyTwilioSignature } from "../plugins/twilio-webhook.js";
import { optInPhone, optOutPhone } from "../services/sms.js";
import { applyStatusCallback } from "../services/outbound-messaging.js";

// ─── Twilio Webhook Routes ─────────────────────────────────────────────────────
// Handles incoming SMS replies, delivery receipts, and voice calls from Twilio.

export const twilioWebhookRoutes = async (server: FastifyInstance) => {
  // Twilio posts form bodies and signs every request
  registerTwilioFormParser(server);
  server.addHook("preHandler", verifyTwilioSignature);

  // ─── POST /api/v1/twilio/sms — Incoming SMS Reply ──────────────────────────

  server.post("/sms", async (request, reply) => {
    const body = request.body as Record<string, string>;
    const fromNumber = body.From; // The phone number that replied
    const messageBody = body.Body?.toLowerCase().trim() ?? "";
    const messageSid = body.MessageSid;

    console.log(`[Twilio SMS] From: ${fromNumber}, Body: "${messageBody}", SID: ${messageSid}`);

    // Handle opt-out keywords (required for compliance)
    const optOutKeywords = ["stop", "unsubscribe", "cancel", "end", "quit"];
    const optInKeywords = ["start", "yes", "unstop"];

    if (optOutKeywords.includes(messageBody)) {
      // Mark the phone number as opted out in our system
      console.log(`[Twilio SMS] Opt-out received from ${fromNumber}`);
      await optOutPhone(fromNumber);
      // Twilio automatically handles STOP/UNSUBSCRIBE on shared short codes
      // We should respect this and not send further messages
      return reply
        .header("Content-Type", "text/xml")
        .send("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>");
    }

    if (optInKeywords.includes(messageBody)) {
      console.log(`[Twilio SMS] Opt-in received from ${fromNumber}`);
      await optInPhone(fromNumber);
      return reply
        .header("Content-Type", "text/xml")
        .send("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>");
    }

    // Try to find an active solicitation for this phone number
    // This lets us track which solicitation the reply belongs to
    try {
      const [solicitation] = await db
        .select()
        .from(reviewSolicitations)
        .where(
          and(
            eq(reviewSolicitations.clientPhone, fromNumber),
            sql`${reviewSolicitations.status} IN ('sent', 'opened', 'clicked')`
          )
        )
        .limit(1);

      if (solicitation) {
        console.log(`[Twilio SMS] Reply for solicitation ${solicitation.id}: "${messageBody}"`);
        // Could trigger a notification to the brand owner here
      }
    } catch (err) {
      console.error("[Twilio SMS] Error looking up solicitation:", err);
    }

    // Auto-reply for common responses
    const thankYouKeywords = ["thanks", "thank you", "thx", "ty"];
    const yesKeywords = ["yes", "yeah", "yep", "sure", "ok"];

    let replyMessage: string | null = null;

    if (thankYouKeywords.some((k) => messageBody.includes(k))) {
      replyMessage = "You're welcome! We appreciate you. 😊";
    } else if (yesKeywords.some((k) => messageBody === k)) {
      replyMessage = "Great! Here's that review link again — we'd love your feedback: https://search.google.com/local/writereview";
    }

    if (replyMessage) {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${replyMessage}</Message>
</Response>`;
      return reply.header("Content-Type", "text/xml").send(twiml);
    }

    // Default: no auto-reply, just acknowledge
    return reply
      .header("Content-Type", "text/xml")
      .send("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>");
  });

  // ─── POST /api/v1/twilio/sms-status — Delivery Status Callback ─────────────

  server.post("/sms-status", async (request, reply) => {
    const body = request.body as Record<string, string>;
    const messageSid = body.MessageSid;
    const messageStatus = body.MessageStatus; // queued, sent, delivered, undelivered, failed
    const errorCode = body.ErrorCode;

    console.log(`[Twilio SMS Status] SID: ${messageSid}, Status: ${messageStatus}${errorCode ? `, Error: ${errorCode}` : ""}`);

    // Outbound messages sent through /messaging
    await applyStatusCallback("sms", messageSid, messageStatus, { errorCode });

    // Update solicitation status based on delivery
    if (messageStatus === "delivered") {
      // Message was delivered — we could update a delivery tracking field here
      console.log(`[Twilio SMS] Message ${messageSid} delivered successfully`);
    } else if (messageStatus === "failed" || messageStatus === "undelivered") {
      console.error(`[Twilio SMS] Message ${messageSid} failed: status=${messageStatus}, error=${errorCode}`);
    }

    return reply
      .header("Content-Type", "text/xml")
      .send("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>");
  });

  // ─── POST /api/v1/twilio/voice — Incoming Voice Call ───────────────────────

  // ─── POST /api/v1/twilio/voice-status — Inbound call status ───────────────
  // The voice agent (voice.getagentsocial.com) asks Twilio to report here

  server.post("/voice-status", async (request, reply) => {
    const body = request.body as Record<string, string>;
    request.log.info(
      { callSid: body.CallSid, status: body.CallStatus, duration: body.CallDuration, direction: body.Direction },
      "Twilio voice status",
    );
    return reply.header("Content-Type", "text/xml").send("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>");
  });

  // ─── POST /api/v1/twilio/call-status — Outbound call completion ────────────

  server.post("/call-status", async (request, reply) => {
    const body = request.body as Record<string, string>;
    await applyStatusCallback("call", body.CallSid, body.CallStatus, { errorCode: body.ErrorCode, duration: body.CallDuration });
    return reply.header("Content-Type", "text/xml").send("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>");
  });

  server.post("/voice", async (request, reply) => {
    console.log("[Twilio Voice] Incoming call received");

    // For now, play a message and redirect to the business
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you for calling. We will connect you to our team shortly.</Say>
  <Pause length="1"/>
  <Say voice="alice">If you would like to leave a review, please text us at this number after the call.</Say>
</Response>`;

    return reply.header("Content-Type", "text/xml").send(twiml);
  });
};