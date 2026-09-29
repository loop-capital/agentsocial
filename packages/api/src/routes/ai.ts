/**
 * AI content routes.
 *
 *   GET  /ai/status           — whether an LLM key is configured
 *   GET  /ai/voice            — brand voice profile
 *   PUT  /ai/voice            — set brand voice profile (markdown)
 *   GET  /ai/best-times       — suggested posting slots (defaults, not analytics-based yet)
 *   POST /ai/captions         — caption variants for one idea
 *   POST /ai/plan             — generate a multi-day content plan (does not save anything)
 *   POST /ai/plan/apply       — save chosen plan items as drafts/scheduled posts
 */

import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { and, eq, gte, inArray } from "drizzle-orm";
import { db, brands, channels, posts, postChannels } from "../db/index.js";
import { enqueuePostPublish } from "../queues/index.js";
import { validateForPlatform } from "../services/publishing/index.js";
import { AiNotConfiguredError, aiConfigured } from "../services/ai/llm.js";
import { generateCaptions, generatePlan } from "../services/ai/planner.js";
import { pickSlots } from "../services/ai/schedule.js";
import { composeBrandContext } from "../services/brand-hub.js";

const PLATFORMS = ["instagram", "facebook", "linkedin", "twitter", "tiktok", "gbp", "youtube", "pinterest"] as const;
const platformList = z.array(z.enum(PLATFORMS)).min(1).max(8);

const captionsSchema = z.object({
  brand_id: z.string().uuid(),
  brief: z.string().min(3).max(1000),
  platforms: platformList,
  variants: z.number().int().min(1).max(5).optional(),
});

const planSchema = z.object({
  brand_id: z.string().uuid(),
  platforms: platformList,
  days: z.number().int().min(1).max(31).default(7),
  posts_per_platform: z.number().int().min(1).max(14).default(3),
  theme: z.string().max(500).optional(),
});

const applySchema = z.object({
  brand_id: z.string().uuid(),
  items: z.array(z.object({
    platform: z.enum(PLATFORMS),
    caption: z.string().min(1),
    scheduled_at: z.string().datetime().optional(),
  })).min(1).max(100),
  /** true = queue for publishing (needs media on media-required platforms); false = save as drafts */
  schedule: z.boolean().default(false),
});

async function ownedBrand(brandId: string, userId: string) {
  const [brand] = await db
    .select()
    .from(brands)
    .where(and(eq(brands.id, brandId), eq(brands.userId, userId)))
    .limit(1);
  return brand;
}

const notFound = (id: string) => ({ error: { code: "resource_not_found", message: "Brand not found", request_id: id } });

export const aiRoutes = async (server: FastifyInstance) => {
  const handleAiError = (err: unknown, reply: any, requestId: string) => {
    if (err instanceof AiNotConfiguredError) {
      return reply.status(503).send({ error: { code: "ai_not_configured", message: err.message, request_id: requestId } });
    }
    const message = err instanceof Error ? err.message : "AI generation failed";
    return reply.status(502).send({ error: { code: "ai_error", message, request_id: requestId } });
  };

  server.get("/status", { onRequest: [server.authenticate] }, async () => ({ configured: aiConfigured() }));

  server.get("/voice", { onRequest: [server.authenticate] }, async (request, reply) => {
    const { brand_id } = request.query as { brand_id?: string };
    if (!brand_id) return reply.status(400).send({ error: { code: "validation_error", message: "brand_id required", request_id: request.id } });
    const brand = await ownedBrand(brand_id, request.userId!);
    if (!brand) return reply.status(404).send(notFound(request.id));
    return { brand_id, voice_profile: (brand as any).voiceProfile ?? "" };
  });

  server.put("/voice", { onRequest: [server.authenticate] }, async (request, reply) => {
    const body = z.object({ brand_id: z.string().uuid(), voice_profile: z.string().max(20000) }).parse(request.body);
    const brand = await ownedBrand(body.brand_id, request.userId!);
    if (!brand) return reply.status(404).send(notFound(request.id));
    await db.update(brands).set({ voiceProfile: body.voice_profile, updatedAt: new Date() }).where(eq(brands.id, body.brand_id));
    return { brand_id: body.brand_id, voice_profile: body.voice_profile };
  });

  server.get("/best-times", { onRequest: [server.authenticate] }, async (request, reply) => {
    const q = z.object({
      brand_id: z.string().uuid(),
      platform: z.enum(PLATFORMS),
      count: z.coerce.number().int().min(1).max(10).default(3),
    }).parse(request.query);
    const brand = await ownedBrand(q.brand_id, request.userId!);
    if (!brand) return reply.status(404).send(notFound(request.id));
    const slots = pickSlots(q.platform, q.count, { tz: brand.timezone, days: 7 });
    return { platform: q.platform, timezone: brand.timezone, basis: "default", slots: slots.map((s) => s.toISOString()) };
  });

  server.post("/captions", { onRequest: [server.authenticate] }, async (request, reply) => {
    const body = captionsSchema.parse(request.body);
    const brand = await ownedBrand(body.brand_id, request.userId!);
    if (!brand) return reply.status(404).send(notFound(request.id));
    try {
      const captions = await generateCaptions({
        brandName: brand.name,
        voiceProfile: composeBrandContext(brand),
        brief: body.brief,
        platforms: body.platforms,
        variants: body.variants,
      });
      return { brand_id: body.brand_id, captions };
    } catch (err) {
      return handleAiError(err, reply, request.id);
    }
  });

  server.post("/plan", { onRequest: [server.authenticate] }, async (request, reply) => {
    const body = planSchema.parse(request.body);
    const brand = await ownedBrand(body.brand_id, request.userId!);
    if (!brand) return reply.status(404).send(notFound(request.id));

    // Avoid slots already used by this brand's scheduled posts
    const existing = await db
      .select({ scheduledAt: posts.scheduledAt })
      .from(posts)
      .where(and(eq(posts.brandId, body.brand_id), eq(posts.status, "scheduled"), gte(posts.scheduledAt, new Date())));
    const taken = new Set(existing.flatMap((p) => (p.scheduledAt ? [p.scheduledAt.toISOString()] : [])));

    try {
      const items = await generatePlan({
        brandName: brand.name,
        voiceProfile: composeBrandContext(brand),
        timezone: brand.timezone,
        platforms: body.platforms,
        days: body.days,
        postsPerPlatform: body.posts_per_platform,
        theme: body.theme,
        takenSlots: taken,
      });
      return { brand_id: body.brand_id, timezone: brand.timezone, times_basis: "default", items };
    } catch (err) {
      return handleAiError(err, reply, request.id);
    }
  });

  server.post("/plan/apply", { onRequest: [server.authenticate] }, async (request, reply) => {
    const body = applySchema.parse(request.body);
    const brand = await ownedBrand(body.brand_id, request.userId!);
    if (!brand) return reply.status(404).send(notFound(request.id));

    const brandChannels = await db
      .select()
      .from(channels)
      .where(and(eq(channels.brandId, body.brand_id), eq(channels.status, "active"), inArray(channels.platform, [...new Set(body.items.map((i) => i.platform))])));

    const created: Array<{ post_id: string; platform: string; status: string }> = [];
    const skipped: Array<{ platform: string; reason: string }> = [];

    for (const item of body.items) {
      const targets = brandChannels.filter((c) => c.platform === item.platform);
      if (!targets.length) {
        skipped.push({ platform: item.platform, reason: `No connected ${item.platform} channel` });
        continue;
      }
      const wantSchedule = body.schedule && Boolean(item.scheduled_at);
      // Media isn't attached by the planner, so media-required platforms can only be saved as drafts.
      if (wantSchedule) {
        const problems = validateForPlatform(item.platform, item.caption, 0);
        if (problems.length) {
          skipped.push({ platform: item.platform, reason: `${problems.join("; ")} — saved as draft instead` });
        }
      }
      const canSchedule = wantSchedule && validateForPlatform(item.platform, item.caption, 0).length === 0;

      const [post] = await db.insert(posts).values({
        brandId: body.brand_id,
        content: item.caption,
        status: canSchedule ? "scheduled" : "draft",
        scheduledAt: item.scheduled_at ? new Date(item.scheduled_at) : null,
        createdByUserId: request.userId!,
      }).returning();

      await db.insert(postChannels).values(
        targets.map((c) => ({ postId: post.id, channelId: c.id, platform: c.platform, status: "pending" as const })),
      );

      if (canSchedule) {
        await Promise.all(targets.map((c) =>
          enqueuePostPublish({ postId: post.id, channelId: c.id, content: item.caption, scheduledFor: item.scheduled_at }),
        ));
      }
      created.push({ post_id: post.id, platform: item.platform, status: post.status });
    }

    return reply.status(201).send({ created, skipped });
  });
};
