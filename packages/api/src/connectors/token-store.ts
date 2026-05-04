/**
 * Central token encryption/decryption utilities.
 * Production: replace with AES-256-GCM, key from env (KEK).
 * MVP: base64 + HMAC so tokens aren't plain-text.
 */

import crypto from "crypto";

const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || process.env.JWT_SECRET || "dev-key-32-chars-minimum!!";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export function encryptToken(plaintext: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:ciphertext (all base64)
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

export function decryptToken(ciphertext: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const [ivB64, authTagB64, encryptedB64] = ciphertext.split(":");

  if (!ivB64 || !authTagB64 || !encryptedB64) {
    throw new Error("Invalid ciphertext format");
  }

  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const encrypted = Buffer.from(encryptedB64, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export function maskToken(token: string): string {
  if (token.length <= 8) return "••••••••";
  return token.slice(0, 4) + "••••••••" + token.slice(-4);
}
