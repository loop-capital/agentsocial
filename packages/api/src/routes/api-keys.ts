import type { FastifyInstance } from "fastify";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { db, apiKeys } from "../db/index.js";
import { apiKeyAuth } from "../middleware/api-key-auth.js";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const API_KEY_PREFIX = process.env.NODE_ENV === "production" ? "as_live_" : "as_dev_";
const SALT_ROUNDS = 10;

function generateApiKey(): string {
  const suffix = randomBytes(24).toString("base64url").slice(0, 24);
  return `${API_KEY_PREFIX}${suffix}`;
}

function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return key.slice(0, 4) + "..." + key.slice(-4);
}

const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.enum(["read", "write", "admin"])).optional(),
  expires_in_days: z.number().min(1).max(365).optional(),
});

export const apiKeysRoutes = async (server: FastifyInstance) => {
  // POST /api-keys — generate new key (JWT auth required)
  server.post("/", {
    onRequest: [server.authenticate],
    schema: { body: createApiKeySchema },
  }, async (request, reply) => {
    const { name, permissions, expires_in_days } = request.body as {
      name: string;
      permissions?: ("read" | "write" | "admin")[];
      expires_in_days?: number;
    };

    const plaintextKey = generateApiKey();
    const prefix = plaintextKey.slice(0, 12);
    const keyHash = await bcrypt.hash(plaintextKey, SALT_ROUNDS);

    const expiresAt = expires_in_days
      ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000)
      : null;

    const [record] = await db
      .insert(apiKeys)
      .values({
        userId: request.userId!,
        name,
        keyHash,
        prefix,
        permissions: permissions ?? ["read"],
        expiresAt,
      })
      .returning();

    return reply.status(201).send({
      id: record.id,
      name: record.name,
      key: plaintextKey, // RETURNED ONCE ONLY
      prefix: record.prefix,
      permissions: record.permissions,
      expires_at: record.expiresAt,
      created_at: record.createdAt,
    });
  });

  // GET /api-keys — list keys (JWT auth required)
  server.get("/", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const keys = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.userId, request.userId!))
      .orderBy(desc(apiKeys.createdAt));

    return reply.send({
      data: keys.map((k) => ({
        id: k.id,
        name: k.name,
        prefix: k.prefix,
        last_four: k.prefix.slice(-4), // last 4 of prefix = effectively last 4 of key since prefix includes start
        permissions: k.permissions,
        last_used_at: k.lastUsedAt,
        expires_at: k.expiresAt,
        created_at: k.createdAt,
      })),
    });
  });

  // DELETE /api-keys/:id — revoke key (JWT auth required)
  server.delete("/:id", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const [keyRecord] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.id, id))
      .limit(1);

    if (!keyRecord || keyRecord.userId !== request.userId) {
      return reply.status(404).send({
        error: { code: "resource_not_found", message: "API key not found", request_id: request.id },
      });
    }

    await db.delete(apiKeys).where(eq(apiKeys.id, id));
    return reply.status(204).send();
  });

  // GET /api-keys/me — get current user via API key auth (for programmatic clients)
  server.get("/me", {
    onRequest: [apiKeyAuth],
  }, async (request, reply) => {
    return reply.send({
      user_id: request.userId,
      permissions: request.apiKeyPermissions,
    });
  });
};
