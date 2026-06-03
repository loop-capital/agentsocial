import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import * as landingPagesService from "../services/landing-pages.js";
import * as conversionTrackingService from "../services/conversion-tracking.js";
import type { TemplateType, UrgencyType } from "../services/landing-pages.js";

export const landingPagesRoutes = async (server: FastifyInstance) => {

  // ─── GET /api/v1/landing-pages — List landing pages for brand (auth required) ─
  server.get("/", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const query = request.query as Record<string, string | undefined>;
    const brandId = query.brandId;
    if (!brandId) {
      return reply.status(400).send({ error: { code: "brand_required", message: "brandId query param required" } });
    }
    const pages = await landingPagesService.listLandingPages(brandId);
    return reply.send({ data: pages });
  });

  // ─── POST /api/v1/landing-pages — Create landing page (auth required) ──────
  server.post("/", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const body = request.body as Record<string, unknown>;
    const {
      brandId, title, templateType, headline, subheadline,
      offerText, originalPrice, salePrice, ctaText, ctaUrl,
      businessName, businessCategory, phone, address,
      reviews, features, urgencyType, urgencyConfig,
      conversionTrackingEnabled,
    } = body;

    if (!brandId || !title || !headline || !businessName) {
      return reply.status(400).send({
        error: { code: "missing_fields", message: "brandId, title, headline, and businessName are required" },
      });
    }

    const page = await landingPagesService.createLandingPage({
      brandId: brandId as string,
      title: title as string,
      templateType: (templateType as TemplateType) ?? "salon_promo",
      headline: headline as string,
      subheadline: subheadline as string | undefined,
      offerText: offerText as string | undefined,
      originalPrice: originalPrice as string | undefined,
      salePrice: salePrice as string | undefined,
      ctaText: ctaText as string | undefined,
      ctaUrl: ctaUrl as string | undefined,
      businessName: businessName as string,
      businessCategory: businessCategory as string | undefined,
      phone: phone as string | undefined,
      address: address as string | undefined,
      reviews: reviews as landingPagesService.ReviewItem[] | undefined,
      features: features as landingPagesService.FeatureItem[] | undefined,
      urgencyType: urgencyType as UrgencyType | undefined,
      urgencyConfig: urgencyConfig as landingPagesService.UrgencyConfig | undefined,
      conversionTrackingEnabled: conversionTrackingEnabled as boolean | undefined,
    });

    return reply.status(201).send({ data: page });
  });

  // ─── GET /api/v1/landing-pages/:slug — Get landing page (PUBLIC, no auth) ──
  server.get("/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const page = await landingPagesService.getLandingPage(slug);
    if (!page) {
      return reply.status(404).send({ error: { code: "not_found", message: "Landing page not found" } });
    }
    // Only return published pages to the public (unless authenticated)
    if (!page.isPublished) {
      // Check if authenticated
      try {
        await server.authenticate(request, reply);
      } catch {
        return reply.status(404).send({ error: { code: "not_found", message: "Landing page not found" } });
      }
    }
    return reply.send({ data: page });
  });

  // ─── PUT /api/v1/landing-pages/:slug — Update landing page (auth required) ─
  server.put("/:slug", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const body = request.body as Record<string, unknown>;
    const updates: Record<string, unknown> = {};

    // Build updates from provided fields
    for (const key of [
      "title", "templateType", "headline", "subheadline", "offerText",
      "originalPrice", "salePrice", "ctaText", "ctaUrl",
      "businessName", "businessCategory", "phone", "address",
      "reviews", "features", "urgencyType", "urgencyConfig",
      "conversionTrackingEnabled",
    ]) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const page = await landingPagesService.updateLandingPage(slug, updates);
    if (!page) {
      return reply.status(404).send({ error: { code: "not_found", message: "Landing page not found" } });
    }
    return reply.send({ data: page });
  });

  // ─── DELETE /api/v1/landing-pages/:slug — Delete landing page (auth) ──────
  server.delete("/:slug", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const page = await landingPagesService.deleteLandingPage(slug);
    if (!page) {
      return reply.status(404).send({ error: { code: "not_found", message: "Landing page not found" } });
    }
    return reply.send({ data: { deleted: true, slug } });
  });

  // ─── POST /api/v1/landing-pages/:slug/publish — Publish ────────────────────
  server.post("/:slug/publish", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const page = await landingPagesService.publishLandingPage(slug);
    if (!page) {
      return reply.status(404).send({ error: { code: "not_found", message: "Landing page not found" } });
    }
    return reply.send({ data: page });
  });

  // ─── POST /api/v1/landing-pages/:slug/unpublish — Unpublish ───────────────
  server.post("/:slug/unpublish", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const page = await landingPagesService.unpublishLandingPage(slug);
    if (!page) {
      return reply.status(404).send({ error: { code: "not_found", message: "Landing page not found" } });
    }
    return reply.send({ data: page });
  });
};