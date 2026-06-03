import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  getManagerDashboard,
  getClients,
  getClientDetail,
  assignClient,
  updateClientNotes,
} from "../services/account-manager.js";

export const accountManagerRoutes = async (server: FastifyInstance) => {

  // ─── GET /dashboard — Manager dashboard stats ────────────────────────────

  server.get("/dashboard", async (_request, reply) => {
    // In production, get managerId from auth context
    const managerId = "mgr-001";

    try {
      const dashboard = await getManagerDashboard(managerId);
      return reply.send(dashboard);
    } catch (err: any) {
      return reply.status(500).send({
        error: { code: "internal_error", message: err.message },
      });
    }
  });

  // ─── GET /clients — Client list with optional filters ─────────────────────

  server.get("/clients", {
    schema: {
      querystring: z.object({
        tier: z.enum(["starter", "growth", "pro", "enterprise"]).optional(),
        status: z.enum(["active", "onboarding", "at_risk", "churned", "paused"]).optional(),
        search: z.string().optional(),
      }),
    },
  }, async (request, reply) => {
    const managerId = "mgr-001";
    const query = request.query as {
      tier?: "starter" | "growth" | "pro" | "enterprise";
      status?: "active" | "onboarding" | "at_risk" | "churned" | "paused";
      search?: string;
    };

    try {
      const clients = await getClients(managerId, query);
      return reply.send({ data: clients });
    } catch (err: any) {
      return reply.status(500).send({
        error: { code: "internal_error", message: err.message },
      });
    }
  });

  // ─── GET /clients/:brandId — Client detail ──────────────────────────────

  server.get("/clients/:brandId", {
    schema: {
      params: z.object({ brandId: z.string() }),
    },
  }, async (request, reply) => {
    const { brandId } = request.params as { brandId: string };

    try {
      const client = await getClientDetail(brandId);
      return reply.send({ data: client });
    } catch (err: any) {
      if (err.message.startsWith("Client not found")) {
        return reply.status(404).send({
          error: { code: "not_found", message: err.message },
        });
      }
      return reply.status(500).send({
        error: { code: "internal_error", message: err.message },
      });
    }
  });

  // ─── POST /clients/:brandId/assign — Assign manager to client ─────────────

  server.post("/clients/:brandId/assign", {
    schema: {
      params: z.object({ brandId: z.string() }),
      body: z.object({ managerId: z.string() }),
    },
  }, async (request, reply) => {
    const { brandId } = request.params as { brandId: string };
    const { managerId } = request.body as { managerId: string };

    try {
      const client = await assignClient(brandId, managerId);
      return reply.send({ data: client });
    } catch (err: any) {
      if (err.message.startsWith("Client not found")) {
        return reply.status(404).send({
          error: { code: "not_found", message: err.message },
        });
      }
      return reply.status(500).send({
        error: { code: "internal_error", message: err.message },
      });
    }
  });

  // ─── PUT /clients/:brandId/notes — Update manager notes ────────────────────

  server.put("/clients/:brandId/notes", {
    schema: {
      params: z.object({ brandId: z.string() }),
      body: z.object({ notes: z.string() }),
    },
  }, async (request, reply) => {
    const { brandId } = request.params as { brandId: string };
    const { notes } = request.body as { notes: string };

    try {
      const client = await updateClientNotes(brandId, notes);
      return reply.send({ data: client });
    } catch (err: any) {
      if (err.message.startsWith("Client not found")) {
        return reply.status(404).send({
          error: { code: "not_found", message: err.message },
        });
      }
      return reply.status(500).send({
        error: { code: "internal_error", message: err.message },
      });
    }
  });
};