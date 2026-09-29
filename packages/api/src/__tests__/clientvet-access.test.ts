import { describe, it, expect, vi, beforeEach } from "vitest";
import Fastify from "fastify";
import { validatorCompiler, serializerCompiler } from "fastify-type-provider-zod";
import { createHmac } from "node:crypto";
import * as schema from "../db/schema.js";

const BRAND_A = "11111111-1111-4111-8111-111111111111"; // owned by user-1
const BRAND_B = "22222222-2222-4222-8222-222222222222"; // owned by someone else
const FLAG_B = "33333333-3333-4333-8333-333333333333"; // belongs to brand B
const rows: Record<string, unknown[]> = {};

vi.mock("../db/index.js", () => ({
  db: {
    select: () => ({
      from: (t: unknown) => {
        const chain: any = {
          where: () => chain,
          limit: async () => rowsFor(t),
          orderBy: () => chain,
          offset: async () => rowsFor(t),
          then: (res: (v: unknown) => void) => res(rowsFor(t)),
        };
        return chain;
      },
    }),
  },
}));
vi.mock("../services/risk-calculator.js", () => ({
  calculateRiskLevel: () => "low", assessClientRisk: async () => ({}), recalculateRisk: async () => ({}), DEFAULT_DEPOSIT_POLICY: {},
}));
vi.mock("../services/square-deposit.js", () => ({
  createDepositPayment: async () => null, verifyDepositPayment: async () => null, convertDepositToCredit: async () => null,
  forfeitDeposit: async () => null, processDepositWebhook: async () => null,
}));

function rowsFor(t: unknown): unknown[] {
  // Ownership lookup only returns a brand row for the brand the caller owns
  if (t === schema.brands) return rows.ownedBrand ?? [];
  if (t === schema.clientRiskFlags) return rows.flag ?? [];
  return [];
}

async function app() {
  const { clientvetRoutes } = await import("../routes/clientvet.js");
  const server = Fastify();
  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);
  server.decorate("authenticate", async (request: any, reply: any) => {
    if (!request.headers["x-user"]) return reply.status(401).send({ error: "auth" });
    request.userId = request.headers["x-user"];
  });
  await server.register(clientvetRoutes, { prefix: "/cv" });
  return server;
}

beforeEach(() => { for (const k of Object.keys(rows)) delete rows[k]; });

describe("ClientVet brand access control", () => {
  it("rejects requests without login", async () => {
    const s = await app();
    const r = await s.inject({ method: "GET", url: `/cv/clients?brandId=${BRAND_A}` });
    expect(r.statusCode).toBe(401);
  });

  it("rejects a missing or malformed brandId", async () => {
    const s = await app();
    expect((await s.inject({ method: "GET", url: "/cv/clients", headers: { "x-user": "u1" } })).statusCode).toBe(400);
    expect((await s.inject({ method: "GET", url: "/cv/clients?brandId=not-a-uuid", headers: { "x-user": "u1" } })).statusCode).toBe(400);
  });

  it("rejects a brand the caller does not own", async () => {
    const s = await app(); // ownedBrand lookup returns nothing
    const r = await s.inject({ method: "GET", url: `/cv/clients?brandId=${BRAND_B}`, headers: { "x-user": "u1" } });
    expect(r.statusCode).toBe(403);
  });

  it("rejects a record id that belongs to a different brand than the one supplied", async () => {
    rows.ownedBrand = [{ id: BRAND_A }];
    rows.flag = [{ brandId: BRAND_B }];
    const s = await app();
    const r = await s.inject({ method: "GET", url: `/cv/clients/${FLAG_B}/notes?brandId=${BRAND_A}`, headers: { "x-user": "u1" } });
    expect(r.statusCode).toBe(403);
  });

  it("rejects a record-by-id request that supplies no brand of its own when the record's brand isn't owned", async () => {
    rows.flag = [{ brandId: BRAND_B }]; // ownedBrand lookup empty -> not owned
    const s = await app();
    const r = await s.inject({ method: "GET", url: `/cv/clients/${FLAG_B}/notes`, headers: { "x-user": "u1" } });
    expect(r.statusCode).toBe(403);
  });

  it("lets an owner through to the handler", async () => {
    rows.ownedBrand = [{ id: BRAND_A }];
    const s = await app();
    const r = await s.inject({ method: "GET", url: `/cv/clients?brandId=${BRAND_A}`, headers: { "x-user": "u1" } });
    expect(r.statusCode).not.toBe(401);
    expect(r.statusCode).not.toBe(403);
    expect(r.statusCode).not.toBe(400);
  });
});


describe("Square deposit webhook", () => {
  const url = "https://api.example.com/api/v1/clientvet/deposits/webhook";
  const key = "wh-test-key";
  const payload = JSON.stringify({ type: "payment.updated", data: { id: "p1" } });
  const sig = createHmac("sha256", key).update(url + payload).digest("base64");
  const post = async (headers: Record<string, string>) => {
    const s = await app();
    return s.inject({ method: "POST", url: "/cv/deposits/webhook", payload, headers: { "content-type": "application/json", ...headers } });
  };

  it("is closed until the signature key and URL are configured (503)", async () => {
    delete process.env.SQUARE_DEPOSIT_WEBHOOK_SIGNATURE_KEY; delete process.env.SQUARE_DEPOSIT_WEBHOOK_URL;
    expect((await post({ "x-square-hmacsha256-signature": sig })).statusCode).toBe(503);
  });

  it("rejects missing or wrong signatures without needing a login (401)", async () => {
    process.env.SQUARE_DEPOSIT_WEBHOOK_SIGNATURE_KEY = key; process.env.SQUARE_DEPOSIT_WEBHOOK_URL = url;
    expect((await post({})).statusCode).toBe(401);
    expect((await post({ "x-square-hmacsha256-signature": "nope" })).statusCode).toBe(401);
  });

  it("accepts a correctly signed request", async () => {
    process.env.SQUARE_DEPOSIT_WEBHOOK_SIGNATURE_KEY = key; process.env.SQUARE_DEPOSIT_WEBHOOK_URL = url;
    const r = await post({ "x-square-hmacsha256-signature": sig });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toEqual({ received: true });
  });
});
