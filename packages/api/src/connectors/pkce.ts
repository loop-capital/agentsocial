import crypto from "crypto";

/**
 * Generates PKCE parameters for OAuth 2.0 flows.
 * Returns code_verifier and code_challenge (S256 method).
 */
export function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  // Generate a 128-character random code_verifier (RFC 7636 recommends 43-128 chars)
  const codeVerifier = crypto
    .randomBytes(96)
    .toString("base64url")
    .slice(0, 128);

  // Create code_challenge using S256 method
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  return { codeVerifier, codeChallenge };
}
