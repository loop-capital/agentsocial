import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  addCompetitor,
  refreshCompetitor,
  listCompetitors,
  getCompetitorPosts,
  removeCompetitor,
  refreshAllCompetitors,
} from "../services/competitor-monitor.js";

const addCompetitorSchema = z.object({
  platform: z.enum(["twitter", "instagram", "facebook", "tiktok", "linkedin"]),
  handle: z.string().min(1).max(100),
});

export const competitorsRoutes = async (server: FastifyInstance) => {
  // ─── List competitors for a brand ──────────────────────────────────────────

  server.get("/", {
    schema: {
      querystring: z.object({ brand_id: z.string().uuid() }),
    },
  }, async (request, reply) => {
    const { brand_id } = request.query as { brand_id: string };
    const competitors = await listCompetitors(brand_id);
    return reply.send({ competitors });
  });

  // ─── Add a competitor to track ────────────────────────────────────────────

  server.post("/", {
    schema: {
      body: z.object({
        brand_id: z.string().uuid(),
        platform: z.enum(["twitter", "instagram", "facebook", "tiktok", "linkedin"]),
        handle: z.string().min(1).max(100),
      }),
    },
  }, async (request, reply) => {
    const { brand_id, platform, handle } = request.body as { brand_id: string; platform: string; handle: string };
    const result = await addCompetitor(brand_id, platform, handle);
    return reply.status(result.status === "created" ? 201 : 200).send(result);
  });

  // ─── Get competitor profile details ───────────────────────────────────────

  server.get("/:profileId", async (request, reply) => {
    const { profileId } = request.params as { profileId: string };
    const profiles = await listCompetitors(""); // We'll filter in the service
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) {
      return reply.status(404).send({ error: { code: "resource_not_found", message: "Competitor profile not found" } });
    }
    return reply.send({ competitor: profile });
  });

  // ─── Refresh a single competitor ───────────────────────────────────────────

  server.post("/:profileId/refresh", async (request, reply) => {
    const { profileId } = request.params as { profileId: string };
    try {
      const result = await refreshCompetitor(profileId);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: { code: "refresh_failed", message: err.message } });
    }
  });

  // ─── Refresh all competitors for a brand ──────────────────────────────────

  server.post("/refresh-all", {
    schema: {
      body: z.object({ brand_id: z.string().uuid() }),
    },
  }, async (request, reply) => {
    const { brand_id } = request.body as { brand_id: string };
    const results = await refreshAllCompetitors(brand_id);
    return reply.send({ results });
  });

  // ─── Get competitor posts ─────────────────────────────────────────────────

  server.get("/:profileId/posts", {
    schema: {
      querystring: z.object({ limit: z.coerce.number().min(1).max(100).optional() }),
    },
  }, async (request, reply) => {
    const { profileId } = request.params as { profileId: string };
    const { limit = 20 } = request.query as { limit?: number };
    const posts = await getCompetitorPosts(profileId, limit);
    return reply.send({ posts });
  });

  // ─── Remove a competitor ──────────────────────────────────────────────────

  server.delete("/:profileId", async (request, reply) => {
    const { profileId } = request.params as { profileId: string };
    await removeCompetitor(profileId);
    return reply.send({ deleted: true });
  });
};