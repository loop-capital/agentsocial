import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import multipart from "@fastify/multipart";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod";
import authPlugin from "./plugins/auth.js";
import { healthRoutes } from "./routes/health.js";
import { legalRoutes } from "./routes/legal.js";
import { authRoutes } from "./routes/auth.js";
import { brandsRoutes } from "./routes/brands.js";
import { channelsRoutes } from "./routes/channels.js";
import { postsRoutes } from "./routes/posts.js";
import { apiKeysRoutes } from "./routes/api-keys.js";
import { commentsRoutes } from "./routes/comments.js";
import { mediaRoutes } from "./routes/media.js";
import { analyticsRoutes } from "./routes/analytics.js";
import { webhooksRoutes } from "./routes/webhooks.js";
import { callbackRoutes } from "./routes/callbacks.js";
import { syncRoutes } from "./routes/sync.js";
import { browserAuthRoutes } from "./routes/browser-auth.js";
import { startWorkers, stopWorkers } from "./workers/index.js";

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
    transport: process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
  },
}).withTypeProvider<ZodTypeProvider>();

// Register Zod-based validation and serialization
server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);

// ─── Plugins ─────────────────────────────────────────────────────────────────

await server.register(cors, {
  origin: process.env.APP_URL || "http://localhost:3000",
  credentials: true,
});

await server.register(helmet, {
  contentSecurityPolicy: false,
});

await server.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
});

await server.register(multipart, {
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

await server.register(swagger, {
  openapi: {
    info: {
      title: "AgentSocial API",
      version: "1.0.0",
      description: "Agent-first social media management API",
    },
    servers: [{ url: "/api/v1", description: "API v1" }],
    tags: [
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Brands", description: "Brand management" },
      { name: "Channels", description: "Channel management" },
      { name: "Posts", description: "Post management" },
      { name: "Comments", description: "Comment inbox" },
      { name: "Media", description: "Media uploads" },
      { name: "Analytics", description: "Analytics" },
      { name: "Webhooks", description: "Webhook management" },
    ],
  },
});

await server.register(swaggerUi, {
  routePrefix: "/docs",
});

await server.register(authPlugin);

// ─── Global Auth Guard ──────────────────────────────────────────────────────
// Protect all routes except explicitly public ones
const PUBLIC_PREFIXES = [
  "/auth/register",
  "/auth/login",
  "/health",
  "/webhooks",
  "/browser-auth",
  "/docs",
  "/legal",
];

server.addHook("onRequest", async (request, reply) => {
  const fullUrl = request.url.split("?")[0]; // strip query string
  // Normalize: strip /api/v1 prefix for matching
  const path = fullUrl.startsWith("/api/v1") ? fullUrl.slice("/api/v1".length) || "/" : fullUrl;
  const isPublic = PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix));
  if (isPublic) return;
  // Also allow root / and favicon
  if (path === "/" || path === "/favicon.ico") return;
  // For all other routes, require authentication
  await server.authenticate(request, reply);
});

// ─── Routes ──────────────────────────────────────────────────────────────────

await server.register(legalRoutes);
await server.register(healthRoutes, { prefix: "/api/v1" });
await server.register(authRoutes, { prefix: "/api/v1/auth" });
await server.register(brandsRoutes, { prefix: "/api/v1/brands" });
await server.register(channelsRoutes, { prefix: "/api/v1/channels" });
await server.register(postsRoutes, { prefix: "/api/v1/posts" });
await server.register(apiKeysRoutes, { prefix: "/api/v1/api-keys" });
await server.register(commentsRoutes, { prefix: "/api/v1/comments" });
await server.register(mediaRoutes, { prefix: "/api/v1/media" });
await server.register(analyticsRoutes, { prefix: "/api/v1/analytics" });
await server.register(webhooksRoutes, { prefix: "/api/v1/webhooks" });
await server.register(callbackRoutes);
await server.register(syncRoutes, { prefix: "/api/v1/sync" });
await server.register(browserAuthRoutes, { prefix: "/api/v1/channels" });

// ─── Global Error Handler ───────────────────────────────────────────────────

server.setErrorHandler((error, request, reply) => {
  request.log.error(error);

  if (error.validation) {
    return reply.status(400).send({
      error: {
        code: "validation_error",
        message: "The request failed validation",
        details: error.validation.map((v) => ({
          field: String(v.instancePath || v.params?.missingProperty || "unknown"),
          message: v.message || "Invalid value",
        })),
        request_id: request.id,
      },
    });
  }

  if (error.statusCode) {
    return reply.status(error.statusCode).send({
      error: {
        code: error.code || "request_error",
        message: error.message,
        request_id: request.id,
      },
    });
  }

  return reply.status(500).send({
    error: {
      code: "internal_error",
      message: "Internal server error",
      request_id: request.id,
    },
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "3001", 10);
    const host = process.env.HOST || "0.0.0.0";
    await server.listen({ port, host });
    server.log.info(`🚀 AgentSocial API running at http://${host}:${port}`);
    server.log.info(`📖 API docs at http://localhost:${port}/docs`);

    // Start BullMQ workers
    startWorkers();

    server.log.info(`✅ BullMQ workers started`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  server.log.info("Shutting down...");
  await stopWorkers();
  await server.close();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

start();

export type App = typeof server;
