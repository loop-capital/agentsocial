import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verify a Square webhook. Square signs (notificationUrl + rawBody) with the
 * subscription's signature key using HMAC-SHA256 and sends it base64-encoded
 * in the `x-square-hmacsha256-signature` header.
 *
 * Fails closed: any missing input returns false.
 */
export function verifySquareSignature(opts: {
  rawBody: string | undefined;
  signature: string | undefined;
  notificationUrl: string | undefined;
  signatureKey: string | undefined;
}): boolean {
  const { rawBody, signature, notificationUrl, signatureKey } = opts;
  if (rawBody === undefined || !signature || !notificationUrl || !signatureKey) return false;

  const expected = createHmac("sha256", signatureKey).update(notificationUrl + rawBody).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
