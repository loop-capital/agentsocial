// Adobe Creative Cloud Toolkit for AgentSocial
// Aligned with official Adobe Firefly Services & Stock API docs (May 2026)

// Firefly — image generation, fill, expand, composite
export { FireflyClient } from './firefly/client';
export * from './firefly/types';

// Stock — search, license, download stock assets
export { StockClient } from './stock/client';
export * from './stock/types';

// ── Convenience factory ─────────────────────────────────────────────

import { FireflyClient } from './firefly/client';
import { StockClient } from './stock/client';
import type { FireflyConfig } from './firefly/types';
import type { StockConfig } from './stock/types';

/**
 * Quick-setup: create both clients from environment variables.
 *
 * Required env vars:
 *   FIREFLY_SERVICES_CLIENT_ID     — Adobe Developer Console Client ID
 *   FIREFLY_SERVICES_CLIENT_SECRET — Adobe Developer Console Client Secret
 *   ADOBE_STOCK_API_KEY           — Stock API key (same Client ID works)
 *   ADOBE_STOCK_ACCESS_TOKEN      — (optional) Bearer token for licensing
 */
export function createClientsFromEnv() {
  const firefly = new FireflyClient({
    clientId: process.env.FIREFLY_SERVICES_CLIENT_ID!,
    clientSecret: process.env.FIREFLY_SERVICES_CLIENT_SECRET!,
  });

  const stock = new StockClient({
    apiKey: process.env.ADOBE_STOCK_API_KEY || process.env.FIREFLY_SERVICES_CLIENT_ID!,
    accessToken: process.env.ADOBE_STOCK_ACCESS_TOKEN,
  });

  return { firefly, stock };
}