/**
 * Access control applied to every authenticated request (preHandler, after auth).
 *
 * - Brand ownership: every brand id a request names — params.brandId, query
 *   brand_id/brandId, the x-brand-id header, body brand_id/brandId — and the
 *   brand owning any resource addressed by id in the path (RESOURCE_BRAND) must
 *   belong to the caller, otherwise 404 brand_not_found.
 * - Admin-only areas: cross-tenant routes (account manager, the shared Zernio
 *   account under /social, plan setup) require users.is_admin.
 *
 * - API key permissions: keys without "write" or "admin" are read-only.
 *
 * Admins bypass the brand check so account managers can work across clients.
 */

import type { FastifyReply, FastifyRequest } from "fastify";
import { pool } from "../db/index.js";

const ADMIN_ONLY_PREFIXES = ["/manager", "/social", "/billing/init-plans"];

const adminCache = new Map<string, { admin: boolean; at: number }>();
const ADMIN_CACHE_MS = 60_000;

/** Admins are users with users.is_admin = true. */
export async function isAdmin(userId: string): Promise<boolean> {
  const cached = adminCache.get(userId);
  if (cached && Date.now() - cached.at < ADMIN_CACHE_MS) return cached.admin;
  const { rows } = await pool.query(`SELECT is_admin FROM users WHERE id = $1`, [userId]);
  const admin = rows[0]?.is_admin === true;
  adminCache.set(userId, { admin, at: Date.now() });
  return admin;
}

/** Brand ids named anywhere in the request. */
function requestedBrandIds(request: FastifyRequest): string[] {
  const ids = new Set<string>();
  const add = (v: unknown) => {
    if (typeof v === "string" && v.trim()) ids.add(v.trim());
  };
  const params = (request.params ?? {}) as Record<string, unknown>;
  const query = (request.query ?? {}) as Record<string, unknown>;
  const body = request.body && typeof request.body === "object" && !Array.isArray(request.body)
    ? (request.body as Record<string, unknown>)
    : {};
  add(params.brandId);
  add(params.brand_id);
  add(query.brand_id);
  add(query.brandId);
  add(request.headers["x-brand-id"]);
  add(body.brand_id);
  add(body.brandId);
  return [...ids];
}

const UUID = "([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})";

/**
 * Resources addressed by id in the path, and how to find the brand that owns
 * each. A resource that doesn't exist is left to the handler's own 404.
 */
const RESOURCE_BRAND: Array<{ pattern: RegExp; methods?: string[]; brandOf: (id: string) => Promise<string | null> }> = [];

function sqlBrand(pattern: string, sql: string, methods?: string[]) {
  RESOURCE_BRAND.push({
    pattern: new RegExp(`^${pattern.replace("{id}", UUID)}(/|$)`),
    methods,
    brandOf: async (id) => (await pool.query(sql, [id])).rows[0]?.brand_id ?? null,
  });
}

sqlBrand("/posts/{id}", "SELECT brand_id FROM posts WHERE id::text = $1");
sqlBrand("/analytics/posts/{id}", "SELECT brand_id FROM posts WHERE id::text = $1");
sqlBrand("/analytics/exports/{id}", "SELECT brand_id FROM export_jobs WHERE id::text = $1");
sqlBrand("/channels/{id}", "SELECT brand_id FROM channels WHERE id::text = $1");
sqlBrand("/comments/{id}", "SELECT ch.brand_id FROM comments c JOIN channels ch ON ch.id = c.channel_id WHERE c.id::text = $1");
sqlBrand("/media/{id}", "SELECT brand_id FROM media_assets WHERE id::text = $1");
sqlBrand("/clipify/sources/{id}", "SELECT brand_id FROM video_sources WHERE id::text = $1");
sqlBrand("/clipify/clips/{id}", "SELECT brand_id FROM clips WHERE id::text = $1");
sqlBrand("/competitors/{id}", "SELECT brand_id FROM competitor_profiles WHERE id::text = $1");
sqlBrand("/crm/crm/providers/{id}", "SELECT brand_id FROM crm_providers WHERE id::text = $1");
sqlBrand("/gbp/widget/sessions/{id}", "SELECT brand_id FROM chat_sessions WHERE id::text = $1");
sqlBrand("/gbp/widget/followups/{id}", "SELECT brand_id FROM chat_followups WHERE id::text = $1");
sqlBrand("/gbp/solicitations/{id}", "SELECT brand_id FROM review_solicitations WHERE id::text = $1");
sqlBrand("/gbp/{id}", "SELECT brand_id FROM gbp_accounts WHERE id::text = $1");
sqlBrand("/gemini/video/{id}", "SELECT brand_id FROM gemini_jobs WHERE id::text = $1");
sqlBrand("/review-sentry/feedback/{id}",
  "SELECT rc.brand_id FROM review_requests r JOIN review_campaigns rc ON rc.id = r.campaign_id WHERE r.id::text = $1",
  ["PATCH", "POST", "PUT", "DELETE"]);
sqlBrand("/review-sentry/removal/cases/{id}", "SELECT brand_id FROM review_removal_cases WHERE id::text = $1");
sqlBrand("/clientvet/clients/{id}", "SELECT brand_id FROM client_risk_flags WHERE id::text = $1");
sqlBrand("/clientvet/deposits/{id}", "SELECT brand_id FROM deposit_payments WHERE id::text = $1");
sqlBrand("/campaigns/{id}", "SELECT brand_id FROM campaigns WHERE id::text = $1");
sqlBrand("/messaging/messages/{id}", "SELECT brand_id FROM outbound_messages WHERE id::text = $1");

// Landing pages are addressed by slug; only writes need an owner (GET is public)
RESOURCE_BRAND.push({
  pattern: /^\/landing-pages\/([^/]+)(\/|$)/,
  methods: ["PUT", "PATCH", "POST", "DELETE"],
  brandOf: async (slug) =>
    (await pool.query(`SELECT brand_id FROM landing_pages WHERE slug = $1`, [slug])).rows[0]?.brand_id ?? null,
});

/** Brands owning the resources addressed in the path (see RESOURCE_BRAND). */
async function resourceBrandIds(path: string, method: string): Promise<string[]> {
  const found: string[] = [];
  for (const r of RESOURCE_BRAND) {
    if (r.methods && !r.methods.includes(method)) continue;
    const m = path.match(r.pattern);
    if (!m) continue;
    const brandId = await r.brandOf(decodeURIComponent(m[1]));
    if (brandId) found.push(brandId);
    break; // first (most specific) match wins
  }
  return found;
}

function apiPath(request: FastifyRequest): string {
  const path = request.url.split("?")[0];
  return path.startsWith("/api/v1") ? path.slice("/api/v1".length) || "/" : path;
}

export async function accessControl(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const userId = request.userId;
  if (!userId) return; // public route; nothing to scope

  // API keys carry permissions; a key without write/admin may only read
  const perms = request.apiKeyPermissions;
  if (Array.isArray(perms) && !["GET", "HEAD", "OPTIONS"].includes(request.method)
      && !perms.includes("write") && !perms.includes("admin")) {
    return reply.status(403).send({
      error: { code: "insufficient_permissions", message: "This API key is read-only", request_id: request.id },
    });
  }

  const path = apiPath(request);
  const admin = await isAdmin(userId);

  if (ADMIN_ONLY_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
    if (!admin) {
      return reply.status(403).send({
        error: { code: "admin_only", message: "This endpoint is restricted to AgentSocial administrators", request_id: request.id },
      });
    }
    return;
  }

  if (admin) return;

  const brandIds = [...new Set([
    ...requestedBrandIds(request),
    ...(await resourceBrandIds(path, request.method)),
  ])];
  if (brandIds.length === 0) return;

  const { rows } = await pool.query(
    `SELECT count(*)::int AS owned FROM brands WHERE id::text = ANY($1) AND user_id = $2`,
    [brandIds, userId],
  );
  if (rows[0].owned !== brandIds.length) {
    return reply.status(404).send({
      error: { code: "brand_not_found", message: "Brand not found or not owned by this account", request_id: request.id },
    });
  }
}
