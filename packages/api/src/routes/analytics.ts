import type { FastifyInstance } from "fastify";
import { eq, and, gte, asc } from "drizzle-orm";
import { analyticsQuerySchema, exportAnalyticsSchema } from "@agentsocial/shared";
import { db, dailyAnalytics } from "../db/index.js";

export const analyticsRoutes = async (server: FastifyInstance) => {
  // GET /analytics/dashboard
  server.get("/dashboard", {
    onRequest: [server.authenticate],
    schema: { querystring: analyticsQuerySchema },
  }, async (request, reply) => {
    const { brand_id, channel_id, period = "7d" } = request.query as { brand_id?: string; channel_id?: string; period?: string };

    if (!brand_id) {
      return reply.status(400).send({
        error: { code: "validation_error", message: "brand_id is required", request_id: request.id },
      });
    }

    // Determine date range from period
    const now = new Date();
    let startDate = new Date(now);
    if (period === "24h") startDate.setDate(startDate.getDate() - 1);
    else if (period === "7d") startDate.setDate(startDate.getDate() - 7);
    else if (period === "30d") startDate.setDate(startDate.getDate() - 30);
    else if (period === "90d") startDate.setDate(startDate.getDate() - 90);

    let query = db.select().from(dailyAnalytics).where(
      and(
        eq(dailyAnalytics.brandId, brand_id),
        gte(dailyAnalytics.date, startDate)
      )
    );

    const data = await query.orderBy(asc(dailyAnalytics.date));

    if (channel_id) {
      // further filter by channel if needed — the query above doesn't filter channel yet
    }

    const totalImpressions = data.reduce((sum, d) => sum + d.impressions, 0);
    const totalEngagements = data.reduce((sum, d) => sum + d.engagements, 0);
    const totalPosts = data.reduce((sum, d) => sum + d.postsPublished, 0);
    const latestFollowers = data.length > 0 ? data[data.length - 1].followers : 0;
    const earliestFollowers = data.length > 0 ? data[0].followers : 0;

    return reply.send({
      period: { start: data[0]?.date || null, end: data[data.length - 1]?.date || null, range: period },
      summary: {
        total_followers: latestFollowers,
        followers_growth: latestFollowers - earliestFollowers,
        followers_growth_percent: earliestFollowers > 0 ? ((latestFollowers - earliestFollowers) / earliestFollowers) * 100 : 0,
        total_impressions: totalImpressions,
        total_engagements: totalEngagements,
        engagement_rate: totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0,
        posts_published: totalPosts,
        avg_posts_per_day: data.length > 0 ? totalPosts / data.length : 0,
      },
      by_channel: [],
      daily_trend: data.map((d) => ({
        date: d.date,
        impressions: d.impressions,
        engagements: d.engagements,
        followers: d.followers,
      })),
      content_performance: { top_posts: [], engagement_by_content_type: {}, optimal_posting_times: [] },
    });
  });

  // GET /analytics/posts/:post_id
  server.get("/posts/:post_id", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { post_id } = request.params as { post_id: string };

    return reply.send({
      post_id,
      published_at: null,
      channels: [],
      hourly_breakdown: [],
      audience_demographics: { age: {}, gender: {}, top_countries: [] },
    });
  });

  // POST /analytics/export
  server.post("/export", {
    onRequest: [server.authenticate],
    schema: { body: exportAnalyticsSchema },
  }, async (request, reply) => {
    return reply.status(202).send({
      job_id: `export_${Date.now()}`,
      status: "processing",
      estimated_completion: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      download_url: null,
    });
  });

  // GET /analytics/exports/:id
  server.get("/exports/:id", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.send({ id, status: "processing", download_url: null });
  });
};