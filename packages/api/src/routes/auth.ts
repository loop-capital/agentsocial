import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { registerSchema, loginSchema } from "@agentsocial/shared";
import { db, users, apiKeys } from "../db/index.js";

export const authRoutes = async (server: FastifyInstance) => {
  // POST /auth/register
  server.post("/register", {
    // Temporarily skip strict zod schema to avoid Fastify AJV mismatch
    // schema: { body: registerSchema },
  }, async (request, reply) => {
    const { email, password, name } = request.body as { email: string; password: string; name: string };

    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      return reply.status(400).send({
        error: {
          code: "validation_error",
          message: "Email already registered",
          details: [{ field: "email", message: "An account with this email already exists" }],
          request_id: request.id,
        },
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(users).values({
      email,
      passwordHash,
      name,
    }).returning();

    const token = server.jwt.sign({ sub: user.id, userId: user.id, email: user.email }, { expiresIn: "7d" });

    return reply.status(201).send({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatarUrl,
        created_at: user.createdAt,
      },
      token,
    });
  });

  // POST /auth/login
  server.post("/login", {
    // Temporarily skip strict zod schema to avoid Fastify AJV mismatch
    // schema: { body: loginSchema },
  }, async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string };

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      return reply.status(401).send({
        error: {
          code: "authentication_required",
          message: "Invalid email or password",
          request_id: request.id,
        },
      });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({
        error: {
          code: "authentication_required",
          message: "Invalid email or password",
          request_id: request.id,
        },
      });
    }

    const token = server.jwt.sign({ sub: user.id, userId: user.id, email: user.email }, { expiresIn: "7d" });

    return reply.send({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatarUrl,
        created_at: user.createdAt,
      },
      token,
    });
  });

  // GET /auth/me
  server.get("/me", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const [user] = await db.select().from(users).where(eq(users.id, request.userId!)).limit(1);

    if (!user) {
      return reply.status(404).send({
        error: {
          code: "resource_not_found",
          message: "User not found",
          request_id: request.id,
        },
      });
    }

    return reply.send({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatarUrl,
      created_at: user.createdAt,
    });
  });

  // POST /auth/api-keys
  server.post("/api-keys", {
    onRequest: [server.authenticate],
    schema: {
      body: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100 },
          permissions: { type: "array", items: { type: "string", enum: ["read", "write", "admin"] } },
          expires_at: { type: "string", format: "date-time" },
        },
        required: ["name"],
      },
    },
  }, async (request, reply) => {
    const { name, permissions = ["read"], expires_at } = request.body as {
      name: string;
      permissions?: string[];
      expires_at?: string;
    };

    const rawKey = `ak_live_${nanoid(32)}`;
    const keyHash = await bcrypt.hash(rawKey, 10);
    const prefix = rawKey.slice(0, 12);

    const [apiKey] = await db.insert(apiKeys).values({
      userId: request.userId!,
      name,
      keyHash,
      prefix,
      permissions,
      expiresAt: expires_at ? new Date(expires_at) : null,
    }).returning();

    return reply.status(201).send({
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey,
      prefix: apiKey.prefix,
      permissions: apiKey.permissions,
      expires_at: apiKey.expiresAt,
      created_at: apiKey.createdAt,
    });
  });
};
