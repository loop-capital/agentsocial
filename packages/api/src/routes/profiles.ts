import type { FastifyInstance } from "fastify";
import * as profileService from "../services/profile.js";
import { db, profiles, brands } from "../db/index.js";
import { eq } from "drizzle-orm";

export const profilesRoutes = async (server: FastifyInstance) => {
  // ─── GET /profiles/:slug — Public profile data (no auth required) ──────────

  server.get("/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const profile = await profileService.getProfileBySlug(slug);
    if (!profile) {
      return reply.status(404).send({
        error: { code: "not_found", message: "Profile not found", request_id: request.id },
      });
    }

    return reply.send({ data: profile });
  });

  // ─── GET /profiles/:slug/reviews — Paginated reviews (public) ──────────────

  server.get("/:slug/reviews", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const query = request.query as Record<string, string | undefined>;
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || "20", 10)));

    const result = await profileService.getProfileReviews(slug, page, limit);
    return reply.send({ data: result.reviews, total: result.total, page, limit });
  });

  // ─── GET /profiles/:slug/services — Services list (public) ────────────────

  server.get("/:slug/services", async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const services = await profileService.getProfileServices(slug);
    return reply.send({ data: services });
  });

  // ─── GET /profiles?category=... — Browse by category (public) ─────────────

  server.get("/", async (request, reply) => {
    const query = request.query as Record<string, string | undefined>;
    const category = query.category;
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || "20", 10)));

    if (!category) {
      return reply.status(400).send({
        error: { code: "category_required", message: "category query param required", request_id: request.id },
      });
    }

    const result = await profileService.getProfilesByCategory(category, page, limit);
    return reply.send({ data: result.profiles, total: result.total, page, limit });
  });

  // ─── PUT /profiles/:slug — Update profile (auth required, brand owner) ────

  server.put("/:slug", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const userId = request.userId!;
    const body = request.body as Record<string, unknown>;

    const updated = await profileService.updateProfile(slug, {
      businessName: body.businessName as string | undefined,
      category: body.category as string | undefined,
      description: body.description as string | undefined,
      phone: body.phone as string | undefined,
      email: body.email as string | undefined,
      websiteUrl: body.websiteUrl as string | undefined,
      address: body.address as string | undefined,
      city: body.city as string | undefined,
      state: body.state as string | undefined,
      zip: body.zip as string | undefined,
      latitude: body.latitude as number | undefined,
      longitude: body.longitude as number | undefined,
      hours: body.hours as Record<string, unknown> | undefined,
      photos: body.photos as string[] | undefined,
      services: body.services as profileService.ServiceItem[] | undefined,
      theme: body.theme as string | undefined,
      isPublished: body.isPublished as boolean | undefined,
    }, userId);

    if (!updated) {
      return reply.status(404).send({
        error: { code: "not_found_or_unauthorized", message: "Profile not found or you don't have permission", request_id: request.id },
      });
    }

    return reply.send({ data: updated });
  });
};