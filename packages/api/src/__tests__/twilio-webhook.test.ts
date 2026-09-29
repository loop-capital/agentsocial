import { describe, it, expect, beforeAll } from "vitest";
import twilio from "twilio";
import { verifyTwilioSignature } from "../plugins/twilio-webhook.js";

const TOKEN = "test_auth_token_0123456789abcdef";
const URL_PATH = "/api/v1/twilio/sms";
const BODY = { From: "+15555550100", Body: "START", MessageSid: "SM1" };

beforeAll(() => {
  process.env.TWILIO_AUTH_TOKEN = TOKEN;
  process.env.PUBLIC_API_URL = "https://api.example.test";
});

async function call(signature?: string, body: Record<string, string> = BODY) {
  const sent: { status?: number } = {};
  const reply: any = {
    status(code: number) { sent.status = code; return reply; },
    send() { return reply; },
  };
  const request: any = {
    url: URL_PATH,
    body,
    headers: signature ? { "x-twilio-signature": signature } : {},
    log: { warn() {} },
  };
  await verifyTwilioSignature(request, reply);
  return sent.status;
}

describe("Twilio signature verification", () => {
  it("accepts a correctly signed request", async () => {
    const sig = twilio.getExpectedTwilioSignature(TOKEN, `https://api.example.test${URL_PATH}`, BODY);
    expect(await call(sig)).toBeUndefined();
  });

  it("rejects a forged signature", async () => {
    expect(await call("forged")).toBe(403);
  });

  it("rejects a missing signature", async () => {
    expect(await call()).toBe(403);
  });

  it("rejects a valid signature over different params", async () => {
    const sig = twilio.getExpectedTwilioSignature(TOKEN, `https://api.example.test${URL_PATH}`, BODY);
    expect(await call(sig, { ...BODY, Body: "STOP" })).toBe(403);
  });
});
