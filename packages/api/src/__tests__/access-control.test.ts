import { describe, it, expect, vi, beforeEach } from "vitest";

// users / brands / resources the fake database knows about
const { query } = vi.hoisted(() => {
  const USERS: Record<string, { is_admin: boolean }> = {
    owner: { is_admin: false },
    other: { is_admin: false },
    admin: { is_admin: true },
  };
  const BRAND_OWNER: Record<string, string> = { "11111111-1111-4111-8111-111111111111": "owner" };
  const CHANNEL_BRAND: Record<string, string> = {
    "22222222-2222-4222-8222-222222222222": "11111111-1111-4111-8111-111111111111",
  };
  const query = vi.fn(async (sql: string, params: any[]) => {
    if (typeof sql !== "string") return { rows: [] }; // ignore calls without SQL
    if (sql.includes("FROM users")) return { rows: USERS[params[0]] ? [USERS[params[0]]] : [] };
    if (sql.includes("FROM channels")) {
      const b = CHANNEL_BRAND[params[0]];
      return { rows: b ? [{ brand_id: b }] : [] };
    }
    if (sql.includes("FROM brands")) {
      const [ids, userId] = params as [string[], string];
      return { rows: [{ owned: ids.filter((id) => BRAND_OWNER[id] === userId).length }] };
    }
    return { rows: [] };
  });
  return { query };
});
vi.mock("../db/index.js", () => ({ pool: { query } }));

const { accessControl } = await import("../plugins/access-control.js");

const BRAND = "11111111-1111-4111-8111-111111111111";
const CHANNEL = "22222222-2222-4222-8222-222222222222";

function run(req: Partial<{ userId: string; method: string; url: string; headers: any; query: any; params: any; body: any; apiKeyPermissions: string[] }>) {
  const sent: { status?: number; body?: any } = {};
  const reply: any = {
    status(code: number) { sent.status = code; return reply; },
    send(body: any) { sent.body = body; return reply; },
  };
  const request: any = { method: "GET", headers: {}, query: {}, params: {}, body: undefined, id: "req", ...req };
  return accessControl(request, reply).then(() => sent);
}

beforeEach(() => query.mockClear());

describe("brand ownership", () => {
  it("lets an owner through", async () => {
    const r = await run({ userId: "owner", url: `/api/v1/channels?brand_id=${BRAND}`, query: { brand_id: BRAND } });
    expect(r.status).toBeUndefined();
  });

  it("404s another user's brand from query, header, params or body", async () => {
    for (const req of [
      { query: { brand_id: BRAND } },
      { headers: { "x-brand-id": BRAND } },
      { params: { brandId: BRAND } },
      { method: "POST", body: { brand_id: BRAND } },
    ]) {
      const r = await run({ userId: "other", url: "/api/v1/anything", ...req });
      expect(r.status).toBe(404);
      expect(r.body.error.code).toBe("brand_not_found");
    }
  });

  it("404s another user's resource addressed by id in the path", async () => {
    const r = await run({ userId: "other", method: "PATCH", url: `/api/v1/channels/${CHANNEL}` });
    expect(r.status).toBe(404);
  });

  it("lets the owner reach their resource by id", async () => {
    const r = await run({ userId: "owner", url: `/api/v1/channels/${CHANNEL}` });
    expect(r.status).toBeUndefined();
  });

  it("lets admins reach any brand", async () => {
    const r = await run({ userId: "admin", url: "/api/v1/x", query: { brand_id: BRAND } });
    expect(r.status).toBeUndefined();
  });

  it("skips unauthenticated (public) requests", async () => {
    const r = await run({ url: "/api/v1/review-sentry/rate", method: "POST", body: { brand_id: BRAND } });
    expect(r.status).toBeUndefined();
    expect(query).not.toHaveBeenCalled();
  });
});

describe("admin-only areas", () => {
  it.each(["/api/v1/manager/clients", "/api/v1/social/profiles", "/api/v1/billing/init-plans"])("403s %s for non-admins", async (url) => {
    const r = await run({ userId: "owner", url });
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe("admin_only");
  });

  it("allows admins", async () => {
    const r = await run({ userId: "admin", url: "/api/v1/manager/clients" });
    expect(r.status).toBeUndefined();
  });
});

describe("API key permissions", () => {
  it("blocks writes with a read-only key", async () => {
    const r = await run({ userId: "owner", method: "POST", url: "/api/v1/brands", apiKeyPermissions: ["read"] });
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe("insufficient_permissions");
  });

  it("allows reads with a read-only key", async () => {
    const r = await run({ userId: "owner", url: "/api/v1/brands", apiKeyPermissions: ["read"] });
    expect(r.status).toBeUndefined();
  });

  it("allows writes with a write key", async () => {
    const r = await run({ userId: "owner", method: "POST", url: "/api/v1/brands", apiKeyPermissions: ["read", "write"] });
    expect(r.status).toBeUndefined();
  });
});
