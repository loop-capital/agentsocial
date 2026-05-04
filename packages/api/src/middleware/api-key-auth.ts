import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq } from "drizzle-orm";
import { db, apiKeys } from "../db/index.js";
import bcrypt from "bcryptjs";

/**
 * API Key auth middleware.
 * Looks for key in X-API-Key header or ?api_key query param.
 * Attaches user to request if valid.
 * Returns 401 on invalid key.
 */
export async function apiKeyAuth(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const key =
    (request.headers["x-api-key"] as string | undefined) ||
    ((request.query as Record<string, string>)?.api_key as string | undefined);

  if (!key) {
    return reply.status(401).send({
      error: {
        code: "unauthorized",
        message: "API key required. Provide via X-API-Key header or ?api_key query parameter.",
        request_id: request.id,
      },
    });
  }

  // Must match expected prefix format
  const isDev = process.env.NODE_ENV !== "production";
  const validPrefix = key.startsWith(isDev ? "as_dev_" : "as_live_");
  if (!validPrefix) {
    return reply.status(401).send({
      error: {
        code: "unauthorized",
        message: "Invalid API key format.",
        request_id: request.id,
      },
    });
  }

  // Extract prefix (e.g. first 12 chars) for index lookup
  const prefix = key.slice(0, 12);

  const [keyRecord] = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.prefix, prefix))
    .limit(1);

  if (!keyRecord) {
    return reply.status(401).send({
      error: {
        code: "unauthorized",
        message: "Invalid API key.",
        request_id: request.id,
      },
    });
  }

  // Check expiry
  if (keyRecord.expiresAt && keyRecord.expiresAt <= new Date()) {
    return reply.status(401).send({
      error: {
        code: "unauthorized",
        message: "API key expired.",
        request_id: request.id,
      },
    });
  }

  // Verify hash
  const valid = await bcrypt.compare(key, keyRecord.keyHash);
  if (!valid) {
    return reply.status(401).send({
      error: {
        code: "unauthorized",
        message: "Invalid API key.",
        request_id: request.id,
      },
    });
  }

  // Update last used
  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, keyRecord.id));

  // Attach to request
  request.userId = keyRecord.userId;
  request.apiKeyPermissions = keyRecord.permissions ?? [];
}
