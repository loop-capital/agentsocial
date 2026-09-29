/**
 * Routes reachable without authentication.
 *
 * Entries are path prefixes (after /api/v1), optionally limited to one method
 * ("GET /profiles"); a trailing "$" means an exact path match.
 */

export const PUBLIC_ROUTES = [
  "/auth/register",
  "/auth/login",
  "/health",
  "/clientvet/deposits/webhook", // Square-signed; verified in the handler (fails closed)
  "/webhooks",
  "/browser-auth",
  "/channels/callback",
  "/channels/facebook/callback",
  "/channels/facebook/pages",
  "/channels/facebook/connect-pages",
  "/channels/instagram/callback",
  "/billing/plans",
  "/billing/tiers",
  "/billing/webhook",
  "/docs",
  "/legal",
  "GET /landing-pages/",
  "GET /profiles",
  "GET /review-sentry/business/",
  "POST /review-sentry/rate$",
  "POST /review-sentry/feedback$",
  "/review-sentry/sms/webhook",
  "GET /review-sentry/templates",
  "/twilio/sms",
  "/twilio/sms-status",
  "/twilio/call-status",
  "/twilio/voice-status",
  "/twilio/voice",
];

/** Whether a request (method + path without /api/v1) may skip authentication. */
export function isPublicRoute(method: string, path: string): boolean {
  if (path === "/" || path === "/favicon.ico") return true;
  return PUBLIC_ROUTES.some((entry) => {
    const [m, pattern] = entry.includes(" ") ? entry.split(" ") : [null, entry];
    if (m && m !== method) return false;
    return pattern.endsWith("$") ? path === pattern.slice(0, -1) : path.startsWith(pattern);
  });
}
