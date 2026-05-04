import type { FastifyInstance, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import { eq } from "drizzle-orm";
import { db, apiKeys, users } from "../db/index.js";

// Augment @fastify/jwt types
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub?: string; userId?: string; email?: string; permissions?: string[] };
    user: { id: string; permissions?: string[] };
  }
}

// Augment FastifyInstance with our decorators
declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: import("fastify").FastifyReply) => Promise<void>;
    optionalAuth: (request: FastifyRequest, reply: import("fastify").FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    userId?: string;
    apiKeyPermissions?: string[];
  }
}

async function authenticate(
  this: FastifyInstance,
  request: FastifyRequest,
  _reply: import("fastify").FastifyReply
): Promise<void> {
  try {
    const decoded = await request.jwtVerify<{ sub: string; permissions?: string[] }>();
    request.userId = decoded.sub;
    request.apiKeyPermissions = decoded.permissions;
  } catch (err) {
    // Try API key auth
    const apiKey = request.headers["x-api-key"] as string | undefined;
    if (apiKey) {
      const isDev = process.env.NODE_ENV !== "production";
      const validPrefix = isDev ? apiKey.startsWith("ak_") : apiKey.startsWith("ak_live_");

      if (validPrefix) {
        const prefix = apiKey.slice(0, 12);
        const [keyRecord] = await db
          .select()
          .from(apiKeys)
          .where(eq(apiKeys.prefix, prefix))
          .limit(1);

        if (keyRecord && (!keyRecord.expiresAt || keyRecord.expiresAt > new Date())) {
          request.userId = keyRecord.userId;
          request.apiKeyPermissions = keyRecord.permissions ?? [];
          return;
        }
      }
    }
    throw err;
  }
}

async function optionalAuth(
  this: FastifyInstance,
  request: FastifyRequest,
  _reply: import("fastify").FastifyReply
): Promise<void> {
  try {
    await authenticate.call(this, request, _reply);
  } catch {
    // Ignore auth failures for optional auth
  }
}

export default fp(async function authPlugin(server: FastifyInstance) {
  await server.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || "dev-secret-change-in-production",
    sign: { expiresIn: "7d" },
  });

  server.decorate("authenticate", authenticate);
  server.decorate("optionalAuth", optionalAuth);
}, {
  name: "auth",
});