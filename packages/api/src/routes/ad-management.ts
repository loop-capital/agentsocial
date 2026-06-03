// ─── Ad Management Service Routes ──────────────────────────────────────────────
// Manages the paid ad management service offering (Pro add-on / Elite included).
// This is NOT the same as viewing ad campaign stats (that's in GBP routes).
// This route handles: service tier selection, onboarding, ad spend tracking, reporting.

import type { FastifyInstance } from "fastify";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { db } from "../db/index.js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdServiceConfig {
  brandId: string;
  tier: "starter" | "growth" | "scale";
  monthlyManagementFee: number;
  adSpendBudget: number;
  platforms: ("google_ads" | "meta_ads")[];
  targetRoas: number;
  targetCpa: number;
  targetArea: string; // e.g. "Columbus, OH - 15mi radius"
  businessCategories: string[];
  status: "active" | "paused" | "onboarding" | "cancelled";
  onboardedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AdServiceMetrics {
  brandId: string;
  period: string;
  totalManagementFees: number;
  totalAdSpend: number;
  totalRevenue: number;
  roas: number;
  cpc: number;
  cpa: number;
  conversions: number;
  clicks: number;
  impressions: number;
}

// ─── Pricing Tiers ─────────────────────────────────────────────────────────────

const AD_TIERS = {
  starter: {
    name: "Starter",
    managementFee: 149,
    description: "Google Ads management for local salons",
    platforms: ["google_ads"] as const,
    includes: [
      "Campaign setup & targeting",
      "Weekly optimization",
      "Monthly performance report",
      "Review Sentry keyword targeting",
      "ClientVet audience targeting",
    ],
  },
  growth: {
    name: "Growth",
    managementFee: 249,
    description: "Google + Meta Ads with advanced targeting",
    platforms: ["google_ads", "meta_ads"] as const,
    includes: [
      "Everything in Starter",
      "Meta/Instagram ads",
      "A/B creative testing",
      "Bi-weekly optimization",
      "Landing page optimization",
      "Review-gated ad copy",
    ],
  },
  scale: {
    name: "Scale",
    managementFee: 399,
    description: "Full-service ads with dedicated account manager",
    platforms: ["google_ads", "meta_ads"] as const,
    includes: [
      "Everything in Growth",
      "Dedicated account manager",
      "Custom creative production",
      "Daily optimization",
      "Competitor ad monitoring",
      "Multi-location campaigns",
      "Retargeting campaigns",
    ],
  },
} as const;

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_SERVICES: Map<string, AdServiceConfig> = new Map();
const MOCK_METRICS: Map<string, AdServiceMetrics[]> = new Map();

// ─── Routes ────────────────────────────────────────────────────────────────────

export const adManagementRoutes = async (server: FastifyInstance) => {

  // ─── GET /api/v1/ad-management/tiers — Available service tiers ─────────────

  server.get("/tiers", {}, async (_request, reply) => {
    return reply.send({
      data: Object.entries(AD_TIERS).map(([key, value]) => ({
        id: key,
        ...value,
        platforms: [...value.platforms],
      })),
      note: "Ad management is included in Elite ($499/mo). Available as add-on for Pro ($199/mo).",
    });
  });

  // ─── GET /api/v1/ad-management/service — Get brand's ad service config ─────

  server.get("/service", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const query = request.query as Record<string, string | undefined>;
    const brandId = query.brandId;
    if (!brandId) {
      return reply.status(400).send({ error: { code: "brand_required", message: "brandId query param required" } });
    }

    const service = MOCK_SERVICES.get(brandId);
    if (!service) {
      return reply.send({ data: null, message: "No ad management service configured" });
    }

    return reply.send({ data: service });
  });

  // ─── POST /api/v1/ad-management/service — Enroll in ad management ─────────

  server.post("/service", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const body = request.body as {
      brandId: string;
      tier: "starter" | "growth" | "scale";
      adSpendBudget: number;
      targetArea: string;
      businessCategories?: string[];
    };

    if (!body.brandId || !body.tier || !body.adSpendBudget || !body.targetArea) {
      return reply.status(400).send({
        error: { code: "missing_fields", message: "brandId, tier, adSpendBudget, and targetArea are required" },
      });
    }

    if (!AD_TIERS[body.tier]) {
      return reply.status(400).send({
        error: { code: "invalid_tier", message: `Tier must be one of: ${Object.keys(AD_TIERS).join(", ")}` },
      });
    }

    const tierConfig = AD_TIERS[body.tier];
    const now = new Date().toISOString();

    const service: AdServiceConfig = {
      brandId: body.brandId,
      tier: body.tier,
      monthlyManagementFee: tierConfig.managementFee,
      adSpendBudget: body.adSpendBudget,
      platforms: [...tierConfig.platforms],
      targetRoas: 4.0,
      targetCpa: 15,
      targetArea: body.targetArea,
      businessCategories: body.businessCategories || ["beauty_salon"],
      status: "onboarding",
      onboardedAt: null,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    };

    MOCK_SERVICES.set(body.brandId, service);

    return reply.send({
      data: service,
      message: "Ad management service created. Status: onboarding. Our team will configure your campaigns within 48 hours.",
      nextSteps: [
        "Connect your Google Ads account (or we'll create one)",
        "Connect your Meta Business account",
        "Provide business photos and offers for ad creative",
        "Set your monthly ad spend budget (billed directly by Google/Meta)",
      ],
    });
  });

  // ─── PUT /api/v1/ad-management/service — Update service config ─────────────

  server.put("/service", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const body = request.body as {
      brandId: string;
      tier?: "starter" | "growth" | "scale";
      adSpendBudget?: number;
      targetArea?: string;
      businessCategories?: string[];
      status?: "active" | "paused";
    };

    if (!body.brandId) {
      return reply.status(400).send({ error: { code: "brand_required", message: "brandId required" } });
    }

    const service = MOCK_SERVICES.get(body.brandId);
    if (!service) {
      return reply.status(404).send({ error: { code: "not_found", message: "No ad management service found for this brand" } });
    }

    if (body.tier) {
      const tierConfig = AD_TIERS[body.tier];
      service.tier = body.tier;
      service.monthlyManagementFee = tierConfig.managementFee;
      service.platforms = [...tierConfig.platforms];
    }
    if (body.adSpendBudget !== undefined) service.adSpendBudget = body.adSpendBudget;
    if (body.targetArea) service.targetArea = body.targetArea;
    if (body.businessCategories) service.businessCategories = body.businessCategories;
    if (body.status) service.status = body.status;
    service.updatedAt = new Date().toISOString();

    return reply.send({ data: service });
  });

  // ─── POST /api/v1/ad-management/service/activate — Activate after onboarding ──

  server.post("/service/activate", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const body = request.body as { brandId: string };
    if (!body.brandId) {
      return reply.status(400).send({ error: { code: "brand_required", message: "brandId required" } });
    }

    const service = MOCK_SERVICES.get(body.brandId);
    if (!service) {
      return reply.status(404).send({ error: { code: "not_found", message: "No ad management service found" } });
    }

    service.status = "active";
    service.onboardedAt = new Date().toISOString();
    service.updatedAt = new Date().toISOString();

    return reply.send({
      data: service,
      message: "Ad management service activated. Campaigns are now live.",
    });
  });

  // ─── POST /api/v1/ad-management/service/cancel — Cancel service ───────────

  server.post("/service/cancel", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const body = request.body as { brandId: string };
    if (!body.brandId) {
      return reply.status(400).send({ error: { code: "brand_required", message: "brandId required" } });
    }

    const service = MOCK_SERVICES.get(body.brandId);
    if (!service) {
      return reply.status(404).send({ error: { code: "not_found", message: "No ad management service found" } });
    }

    service.status = "cancelled";
    service.cancelledAt = new Date().toISOString();
    service.updatedAt = new Date().toISOString();

    return reply.send({
      data: service,
      message: "Ad management service cancelled. Campaigns will be paused at end of billing period.",
    });
  });

  // ─── GET /api/v1/ad-management/metrics — Get ad service performance metrics ──

  server.get("/metrics", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const query = request.query as Record<string, string | undefined>;
    const brandId = query.brandId;
    const period = query.period || "30d";

    if (!brandId) {
      return reply.status(400).send({ error: { code: "brand_required", message: "brandId query param required" } });
    }

    const service = MOCK_SERVICES.get(brandId);
    if (!service) {
      return reply.status(404).send({ error: { code: "not_found", message: "No ad management service found" } });
    }

    // Generate mock metrics based on tier
    const managementFee = service.monthlyManagementFee;
    const adSpend = service.adSpendBudget;
    const roas = 3.5 + Math.random() * 2.5; // 3.5-6.0x ROAS
    const revenue = parseFloat((adSpend * roas).toFixed(2));
    const conversions = Math.round(adSpend / (8 + Math.random() * 10)); // CPA $8-18
    const clicks = Math.round(adSpend / (0.3 + Math.random() * 0.4)); // CPC $0.30-0.70
    const impressions = clicks * (20 + Math.round(Math.random() * 15)); // CTR ~4-7%

    const metrics: AdServiceMetrics = {
      brandId,
      period,
      totalManagementFees: managementFee,
      totalAdSpend: adSpend,
      totalRevenue: revenue,
      roas: parseFloat(roas.toFixed(2)),
      cpc: parseFloat((adSpend / clicks).toFixed(2)),
      cpa: parseFloat((adSpend / conversions).toFixed(2)),
      conversions,
      clicks,
      impressions,
    };

    return reply.send({ data: metrics });
  });

  // ─── GET /api/v1/ad-management/report — Generate ad performance report ────

  server.get("/report", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const query = request.query as Record<string, string | undefined>;
    const brandId = query.brandId;
    const period = query.period || "30d";

    if (!brandId) {
      return reply.status(400).send({ error: { code: "brand_required", message: "brandId query param required" } });
    }

    const service = MOCK_SERVICES.get(brandId);
    if (!service) {
      return reply.status(404).send({ error: { code: "not_found", message: "No ad management service found" } });
    }

    // Generate weekly trend data
    const weeks = period === "7d" ? 1 : period === "30d" ? 4 : period === "90d" ? 12 : 4;
    const trend = [];
    for (let i = weeks; i >= 1; i--) {
      const weekSpend = service.adSpendBudget / 4;
      const weekRoas = 3.5 + Math.random() * 2.5;
      trend.push({
        week: `Week ${weeks - i + 1}`,
        spend: parseFloat(weekSpend.toFixed(2)),
        revenue: parseFloat((weekSpend * weekRoas).toFixed(2)),
        conversions: Math.round(weekSpend / (10 + Math.random() * 8)),
        roas: parseFloat(weekRoas.toFixed(2)),
      });
    }

    return reply.send({
      data: {
        service: service,
        period,
        trend,
        summary: {
          totalAdSpend: service.adSpendBudget,
          totalRevenue: trend.reduce((s, t) => s + t.revenue, 0),
          averageRoas: parseFloat((trend.reduce((s, t) => s + t.roas, 0) / trend.length).toFixed(2)),
          managementFee: service.monthlyManagementFee,
          yourTotalCost: service.monthlyManagementFee + service.adSpendBudget,
          note: "Ad spend is billed directly by Google/Meta. Management fee is billed by AgentSocial.",
        },
      },
    });
  });

  // ─── GET /api/v1/ad-management/setup-checklist — Onboarding checklist ─────

  server.get("/setup-checklist", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const query = request.query as Record<string, string | undefined>;
    const brandId = query.brandId;
    if (!brandId) {
      return reply.status(400).send({ error: { code: "brand_required", message: "brandId query param required" } });
    }

    return reply.send({
      data: {
        steps: [
          { id: "connect_google", title: "Connect Google Ads account", status: "pending", description: "Link your Google Ads account or we'll create one for you." },
          { id: "connect_meta", title: "Connect Meta Business account", status: "pending", description: "Link your Facebook/Instagram Business account." },
          { id: "provide_creative", title: "Provide business photos & offers", status: "pending", description: "Upload photos of your salon, services, and any special offers for ad creative." },
          { id: "set_budget", title: "Set monthly ad spend budget", status: "pending", description: "Choose your monthly ad spend (billed directly by Google/Meta, no markup)." },
          { id: "target_area", title: "Define target area", status: "pending", description: "Set your geographic targeting (e.g., '10-mile radius around your salon')." },
          { id: "review_campaigns", title: "Review & approve campaigns", status: "pending", description: "We'll create campaigns using Review Sentry + ClientVet data. Approve before they go live." },
        ],
        note: "Ad management is included in Elite ($499/mo) and available as an add-on for Pro ($199/mo). Starter at $149/mo, Growth at $249/mo, Scale at $399/mo.",
      },
    });
  });
};