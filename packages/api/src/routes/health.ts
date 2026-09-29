import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { pool } from "../db/index.js";
import { redis } from "../queues/redis.js";

export const healthRoutes = async (server: FastifyInstance) => {
  server.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

  server.get("/ready", {
    schema: {
      response: {
        200: z.object({
          status: z.string(),
          postgres: z.string(),
          redis: z.string().optional(),
        }),
        503: z.object({
          status: z.string(),
          postgres: z.string(),
          redis: z.string().optional(),
        }),
      },
    },
  }, async (_request, reply) => {
    let postgresStatus = "unknown";

    try {
      await pool.query("SELECT 1");
      postgresStatus = "connected";
    } catch {
      postgresStatus = "disconnected";
    }

    let redisStatus = "disconnected";
    try {
      const pong = await Promise.race([
        redis.ping(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 2000)),
      ]);
      if (pong === "PONG") redisStatus = "connected";
    } catch {
      // stays disconnected
    }

    const ready = postgresStatus === "connected" && redisStatus === "connected";
    return reply.status(ready ? 200 : 503).send({
      status: ready ? "ready" : "degraded",
      postgres: postgresStatus,
      redis: redisStatus,
    });
  });
};