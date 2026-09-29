/**
 * Webhook delivery — POSTs `{ id, type, created_at, data }` to each of the
 * user's active webhooks subscribed to the event.
 *
 * Signature (when the webhook has a stored secret):
 *   X-AgentSocial-Signature: t=<unix seconds>,v1=<hex HMAC-SHA256 of "<t>.<raw body>">
 */

import { createHmac, randomUUID } from "crypto";
import { and, eq, arrayContains } from "drizzle-orm";
import { db, webhooks } from "../db/index.js";
import { decryptToken } from "../connectors/token-store.js";

const ATTEMPTS = 3;
const TIMEOUT_MS = 10_000;

export async function deliverWebhookEvent(userId: string, type: string, data: unknown): Promise<void> {
  try {
    const targets = await db
      .select()
      .from(webhooks)
      .where(and(eq(webhooks.userId, userId), eq(webhooks.active, true), arrayContains(webhooks.events, [type])));

    const body = JSON.stringify({ id: `evt_${randomUUID()}`, type, created_at: new Date().toISOString(), data });
    await Promise.all(targets.map((wh) => deliver(wh.url, wh.secretEncrypted, type, body)));
  } catch (err) {
    console.error(`[webhooks] ${type} delivery lookup failed:`, (err as Error).message);
  }
}

async function deliver(url: string, secretEncrypted: string | null, type: string, body: string): Promise<void> {
  const headers: Record<string, string> = { "Content-Type": "application/json", "X-AgentSocial-Event": type };
  if (secretEncrypted) {
    const t = Math.floor(Date.now() / 1000);
    const sig = createHmac("sha256", decryptToken(secretEncrypted)).update(`${t}.${body}`).digest("hex");
    headers["X-AgentSocial-Signature"] = `t=${t},v1=${sig}`;
  }

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { method: "POST", headers, body, signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (res.ok) return;
      if (res.status < 500 && res.status !== 429) {
        console.error(`[webhooks] ${type} → ${url} rejected with ${res.status}`);
        return;
      }
    } catch (err) {
      if (attempt === ATTEMPTS) console.error(`[webhooks] ${type} → ${url} failed:`, (err as Error).message);
    }
    if (attempt < ATTEMPTS) await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
  }
}
