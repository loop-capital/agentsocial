/**
 * Generate Post Assets Routes
 *
 * Post-creation-friendly wrappers over GenerationService.
 *   POST /api/generate/image-from-caption
 *   POST /api/generate/video-from-caption
 *   GET  /api/generate/video-from-caption/:jobId
 *   POST /api/generate/related-posts
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { getGenerationService, type GenerationProvider } from "../services/generation.js";
import { persistGeneratedMedia, isCloudinaryConfigured } from "../services/cloudinary.js";
import { db, posts, brands } from "../db/index.js";

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const imageFromCaptionSchema = z.object({
  caption: z.string().min(1).max(2000),
  aspectRatio: z.enum(["1:1", "3:4", "4:3", "9:16", "16:9"]).optional(),
  model: z.string().optional(),
});

const videoFromCaptionSchema = z.object({
  caption: z.string().min(1).max(4000),
  imageUrl: z.string().url().nullable().optional(),
  aspectRatio: z.enum(["16:9", "9:16", "1:1", "4:5"]).optional(),
  model: z.string().optional(),
});

const relatedPostsSchema = z.object({
  postId: z.string().uuid(),
  targetPlatforms: z.array(z.enum(["twitter", "linkedin", "facebook", "instagram", "tiktok"])).min(1).max(5),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getBrandId(request: any): string | null {
  return (request.headers["x-brand-id"] as string) || null;
}

function ensureUserAndBrand(request: any, reply: any): { userId: string; brandId: string } | null {
  const userId = request.userId as string | undefined;
  if (!userId) {
    reply.status(401).send({ error: { code: "authentication_required", message: "Authentication required" } });
    return null;
  }

  const brandId = getBrandId(request);
  if (!brandId) {
    reply.status(400).send({ error: { code: "brand_required", message: "x-brand-id header is required" } });
    return null;
  }

  return { userId, brandId };
}

async function verifyBrandOwnership(brandId: string, userId: string) {
  const [brand] = await db
    .select()
    .from(brands)
    .where(and(eq(brands.id, brandId), eq(brands.userId, userId)))
    .limit(1);
  return brand;
}

const PLATFORM_PROMPTS: Record<string, string> = {
  twitter:
    "Rewrite the following post for Twitter/X. Keep it concise, punchy, and under 280 characters when possible. Include 2-4 relevant hashtags at the end. Return ONLY valid JSON with keys: caption, hashtags (array of strings including the #), suggestedImagePrompt (string).",
  linkedin:
    "Rewrite the following post for LinkedIn. Make it professional, insightful, and slightly longer with a clear takeaway. Include 3-5 relevant hashtags at the end. Return ONLY valid JSON with keys: caption, hashtags (array of strings including the #), suggestedImagePrompt (string).",
  facebook:
    "Rewrite the following post for Facebook. Make it conversational, friendly, and engaging with a light call to action. Include 2-4 relevant hashtags at the end. Return ONLY valid JSON with keys: caption, hashtags (array of strings including the #), suggestedImagePrompt (string).",
  instagram:
    "Rewrite the following post for Instagram. Make it visual, lifestyle-oriented, and engaging with emojis where natural. Include 5-10 relevant hashtags at the end. Return ONLY valid JSON with keys: caption, hashtags (array of strings including the #), suggestedImagePrompt (string).",
  tiktok:
    "Rewrite the following post for TikTok. Make it short, energetic, trend-aware, and hook-driven. Include 3-5 relevant hashtags at the end. Return ONLY valid JSON with keys: caption, hashtags (array of strings including the #), suggestedImagePrompt (string).",
};

function stripJsonFences(text: string): string {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function parseGeneratedJson(text: string): { caption: string; hashtags: string[]; suggestedImagePrompt: string } {
  const cleaned = stripJsonFences(text);
  try {
    const parsed = JSON.parse(cleaned);
    return {
      caption: String(parsed.caption || "").trim(),
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.map((h: any) => String(h).trim()) : [],
      suggestedImagePrompt: String(parsed.suggestedImagePrompt || "").trim(),
    };
  } catch {
    // Fallback: extract caption and hashtags heuristically
    const lines = cleaned.split("\n");
    const captionLines: string[] = [];
    const hashtags: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith("#")) {
        hashtags.push(...trimmed.split(/\s+/).filter((t) => t.startsWith("#")));
      } else {
        captionLines.push(trimmed);
      }
    }
    return {
      caption: captionLines.join("\n").trim() || cleaned.slice(0, 500),
      hashtags,
      suggestedImagePrompt: "",
    };
  }
}

// ─── Route Registration ──────────────────────────────────────────────────────

export async function generatePostAssetsRoutes(server: FastifyInstance) {
  const service = getGenerationService();

  // ─── POST /generate/image-from-caption ───────────────────────────────────
  server.post("/image-from-caption", {
    schema: {
      tags: ["Generation"],
      description: "Generate an image from a caption, store it in Cloudinary, and return the public URL.",
      body: imageFromCaptionSchema,
    },
  }, async (request, reply) => {
    const auth = ensureUserAndBrand(request, reply);
    if (!auth) return;
    const { userId, brandId } = auth;

    const body = imageFromCaptionSchema.parse(request.body);

    const brand = await verifyBrandOwnership(brandId, userId);
    if (!brand) {
      return reply.status(403).send({ error: { code: "forbidden", message: "Brand does not belong to user" } });
    }

    try {
      const result = await service.generateImage({
        prompt: body.caption,
        model: body.model || "nano-banana",
        aspectRatio: body.aspectRatio,
        numberOfImages: 1,
        brandId,
        userId,
        provider: "muapi",
      });

      const firstImage = result.images[0];
      if (!firstImage) {
        throw new Error("No image was generated");
      }

      const imageUrl = await persistGeneratedMedia(
        { data: firstImage.data, mimeType: firstImage.mimeType, url: firstImage.url },
        "agentsocial/posts/images",
        "image"
      );

      return reply.status(200).send({
        imageUrl,
        model: result.model,
        provider: result.provider,
        cloudinaryStored: isCloudinaryConfigured(),
        cost: result.cost,
      });
    } catch (err: any) {
      request.log.error({ err, brandId }, "image-from-caption failed");
      if (err?.message?.includes("not configured")) {
        return reply.status(503).send({ error: { code: "provider_not_configured", message: err.message } });
      }
      return reply.status(502).send({ error: { code: "generation_error", message: err?.message ?? "Image generation failed" } });
    }
  });

  // ─── POST /generate/video-from-caption ───────────────────────────────────
  server.post("/video-from-caption", {
    schema: {
      tags: ["Generation"],
      description: "Generate a video from a caption and optional reference image. Async — returns jobId.",
      body: videoFromCaptionSchema,
    },
  }, async (request, reply) => {
    const auth = ensureUserAndBrand(request, reply);
    if (!auth) return;
    const { userId, brandId } = auth;

    const body = videoFromCaptionSchema.parse(request.body);

    const brand = await verifyBrandOwnership(brandId, userId);
    if (!brand) {
      return reply.status(403).send({ error: { code: "forbidden", message: "Brand does not belong to user" } });
    }

    const model = body.model || "seedance-2.0";

    try {
      const result = await service.generateVideo({
        prompt: body.caption,
        model,
        aspectRatio: body.aspectRatio || "9:16",
        referenceImageUrl: body.imageUrl || undefined,
        brandId,
        userId,
        provider: "muapi",
      });

      return reply.status(202).send({
        jobId: result.jobId,
        status: result.status,
        model: result.model,
        provider: result.provider,
        cost: result.cost,
      });
    } catch (err: any) {
      request.log.error({ err, brandId }, "video-from-caption failed");
      if (err?.message?.includes("not configured")) {
        return reply.status(503).send({ error: { code: "provider_not_configured", message: err.message } });
      }
      return reply.status(502).send({ error: { code: "generation_error", message: err?.message ?? "Video generation failed" } });
    }
  });

  // ─── GET /generate/video-from-caption/:jobId ────────────────────────────
  server.get("/video-from-caption/:jobId", {
    schema: {
      tags: ["Generation"],
      description: "Poll the status of a video-from-caption job. Returns video URL when complete.",
      params: z.object({ jobId: z.string() }),
    },
  }, async (request, reply) => {
    const auth = ensureUserAndBrand(request, reply);
    if (!auth) return;
    const { brandId } = auth;
    const { jobId } = request.params as { jobId: string };

    try {
      const status = await service.getVideoJobStatus(jobId, brandId, "muapi");

      if (status.status === "complete") {
        const firstVideo = status.videos?.[0];
        if (!firstVideo?.url) {
          return reply.status(502).send({ error: { code: "video_missing", message: "Job complete but no video URL returned" } });
        }

        let videoUrl = firstVideo.url;
        try {
          videoUrl = await persistGeneratedMedia(
            { url: firstVideo.url, mimeType: firstVideo.mimeType },
            "agentsocial/posts/videos",
            "video"
          );
        } catch (uploadErr: any) {
          request.log.warn({ err: uploadErr, jobId }, "Cloudinary video upload failed; returning source URL");
        }

        return reply.status(200).send({
          videoUrl,
          status: status.status,
          model: status.model,
          provider: status.provider,
          cloudinaryStored: isCloudinaryConfigured(),
          cost: status.cost,
        });
      }

      if (status.status === "failed") {
        return reply.status(200).send({
          status: status.status,
          error: status.error || "Video generation failed",
          model: status.model,
          provider: status.provider,
        });
      }

      return reply.status(200).send({
        jobId,
        status: status.status,
        model: status.model,
        provider: status.provider,
      });
    } catch (err: any) {
      request.log.error({ err, brandId, jobId }, "video-from-caption poll failed");
      return reply.status(502).send({ error: { code: "poll_error", message: err?.message ?? "Failed to poll video status" } });
    }
  });

  // ─── POST /generate/related-posts ─────────────────────────────────────────
  server.post("/related-posts", {
    schema: {
      tags: ["Generation"],
      description: "Given an existing post, generate platform-tailored variations with hashtags.",
      body: relatedPostsSchema,
    },
  }, async (request, reply) => {
    const auth = ensureUserAndBrand(request, reply);
    if (!auth) return;
    const { userId, brandId } = auth;

    const body = relatedPostsSchema.parse(request.body);

    const brand = await verifyBrandOwnership(brandId, userId);
    if (!brand) {
      return reply.status(403).send({ error: { code: "forbidden", message: "Brand does not belong to user" } });
    }

    const [post] = await db.select().from(posts).where(eq(posts.id, body.postId)).limit(1);
    if (!post || post.brandId !== brandId) {
      return reply.status(404).send({ error: { code: "resource_not_found", message: "Post not found" } });
    }

    try {
      const relatedPosts = await Promise.all(
        body.targetPlatforms.map(async (platform) => {
          const systemInstruction = PLATFORM_PROMPTS[platform];
          const prompt = `Original post:\n${post.content}\n\nRewrite this for ${platform}.`;

          const result = await service.generateText({
            prompt,
            systemInstruction,
            model: "gemini-3.6-flash",
            brandId,
            userId,
            provider: "muapi",
          });

          const parsed = parseGeneratedJson(result.text);

          return {
            platform,
            caption: parsed.caption,
            hashtags: parsed.hashtags,
            suggestedImagePrompt: parsed.suggestedImagePrompt,
            sourcePostId: post.id,
          };
        })
      );

      return reply.status(200).send({
        sourcePostId: post.id,
        relatedPosts,
      });
    } catch (err: any) {
      request.log.error({ err, brandId, postId: body.postId }, "related-posts generation failed");
      if (err?.message?.includes("not configured")) {
        return reply.status(503).send({ error: { code: "provider_not_configured", message: err.message } });
      }
      return reply.status(502).send({ error: { code: "generation_error", message: err?.message ?? "Related posts generation failed" } });
    }
  });
}
