import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { verifySquareSignature } from "../services/square-webhook.js";

const url = "https://api.example.com/api/v1/clientvet/deposits/webhook";
const key = "test-signature-key";
const body = JSON.stringify({ type: "payment.updated", data: { id: "p1" } });
const sign = (u: string, b: string, k = key) => createHmac("sha256", k).update(u + b).digest("base64");

describe("verifySquareSignature", () => {
  it("accepts a correct signature over url + raw body", () => {
    expect(verifySquareSignature({ rawBody: body, signature: sign(url, body), notificationUrl: url, signatureKey: key })).toBe(true);
  });
  it("rejects a tampered body, wrong url, wrong key", () => {
    const sig = sign(url, body);
    expect(verifySquareSignature({ rawBody: body + " ", signature: sig, notificationUrl: url, signatureKey: key })).toBe(false);
    expect(verifySquareSignature({ rawBody: body, signature: sig, notificationUrl: url + "/x", signatureKey: key })).toBe(false);
    expect(verifySquareSignature({ rawBody: body, signature: sig, notificationUrl: url, signatureKey: "other" })).toBe(false);
  });
  it("fails closed when anything is missing or the length differs", () => {
    const sig = sign(url, body);
    expect(verifySquareSignature({ rawBody: undefined, signature: sig, notificationUrl: url, signatureKey: key })).toBe(false);
    expect(verifySquareSignature({ rawBody: body, signature: undefined, notificationUrl: url, signatureKey: key })).toBe(false);
    expect(verifySquareSignature({ rawBody: body, signature: sig, notificationUrl: undefined, signatureKey: key })).toBe(false);
    expect(verifySquareSignature({ rawBody: body, signature: sig, notificationUrl: url, signatureKey: undefined })).toBe(false);
    expect(verifySquareSignature({ rawBody: body, signature: "short", notificationUrl: url, signatureKey: key })).toBe(false);
  });
});
