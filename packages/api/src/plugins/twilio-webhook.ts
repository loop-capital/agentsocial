/**
 * Twilio webhook helpers: form-body parsing and X-Twilio-Signature verification.
 *
 * Twilio signs each request with the account auth token over the exact public
 * URL it called plus the POSTed form params. Requests that fail verification get
 * 403, so nobody can forge inbound SMS (e.g. a fake START re-subscribing a number).
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import twilio from "twilio";

/** Parse application/x-www-form-urlencoded bodies (what Twilio posts). */
export function registerTwilioFormParser(server: FastifyInstance): void {
  if (server.hasContentTypeParser("application/x-www-form-urlencoded")) return;
  server.addContentTypeParser("application/x-www-form-urlencoded", { parseAs: "string" }, (_req, body, done) => {
    try {
      done(null, Object.fromEntries(new URLSearchParams(body as string)));
    } catch (err: any) {
      done(err);
    }
  });
}

/** preHandler: reject requests without a valid Twilio signature. */
export async function verifyTwilioSignature(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const signature = request.headers["x-twilio-signature"] as string | undefined;
  if (!authToken || !signature) {
    return reply.status(403).send({ error: { code: "invalid_signature", message: "Missing Twilio signature" } });
  }

  const publicBase = (process.env.PUBLIC_API_URL || "https://api.getagentsocial.com").replace(/\/$/, "");
  const url = `${publicBase}${request.url}`;
  const params = (request.body && typeof request.body === "object" ? request.body : {}) as Record<string, string>;

  if (!twilio.validateRequest(authToken, signature, url, params)) {
    request.log.warn({ url }, "Rejected Twilio webhook with invalid signature");
    return reply.status(403).send({ error: { code: "invalid_signature", message: "Invalid Twilio signature" } });
  }
}
