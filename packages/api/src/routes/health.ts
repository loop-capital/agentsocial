import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { pool } from "../db/index.js";

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

    return reply.send({
      status: postgresStatus === "connected" ? "ready" : "degraded",
      postgres: postgresStatus,
      redis: "connected",
    });
  });
};