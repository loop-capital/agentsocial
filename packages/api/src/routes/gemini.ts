/**
 * Gemini Routes — multimodal AI generation endpoints
 *
 * Endpoints:
 *   POST /gemini/text       — generate text content (social posts, captions, etc.)
 *   POST /gemini/image      — generate images
 *   POST /gemini/video      — generate video (async, returns jobId)
 *   POST /gemini/video/edit — edit existing video (async, returns jobId)
 *   GET  /gemini/video/:jobId — poll video job status
 *   GET  /gemini/status     — check API key status + brand usage
 *
 * All routes require auth middleware (enforced by global guard in server.ts).
 * Brand ID is passed via x-brand-id header.
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db, geminiJobs } from "../db/index.js";
import {
  generateText,
  generateImage,
  generateVideo,
  editVideo,
  pollVideoJob,
  getApiKeyStatus,
  getBrandUsage,
  generateOmniFlashVideo,
  editOmniFlashVideo,
  getSalonTemplates,
  generateFromTemplate,
  SALON_TEMPLATES,
} from "../services/gemini.js";
import type { SalonTemplateId } from "../services/gemini.js";

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const textGenerationSchema = z.object({
  prompt: z.string().min(1).max(10000),
  model: z.string().optional(),
  maxTokens: z.number().min(1).max(8192).optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  systemInstruction: z.string().max(4000).optional(),
});

const imageGenerationSchema = z.object({
  prompt: z.string().min(1).max(4000),
  model: z.string().optional(),
  numberOfImages: z.number().min(1).max(4).optional(),
  aspectRatio: z.enum(["1:1", "3:4", "4:3", "9:16", "16:9"]).optional(),
});

const videoGenerationSchema = z.object({
  prompt: z.string().min(1).max(4000),
  model: z.string().optional(),
  aspectRatio: z.enum(["16:9", "9:16"]).optional(),
  negativePrompt: z.string().max(1000).optional(),
  numberOfVideos: z.number().min(1).max(4).optional(),
  personGeneration: z.enum(["allow_all", "allow_adult"]).optional(),
});

const videoEditSchema = z.object({
  videoUrl: z.string().url(),
  prompt: z.string().min(1).max(4000),
  model: z.string().optional(),
  negativePrompt: z.string().max(1000).optional(),
});

// ─── Route Registration ────────────────────────────────────────────────────

export async function geminiRoutes(server: FastifyInstance) {
  // ─── POST /gemini/text ────────────────────────────────────────────────────
  server.post("/text", {
    schema: {
      tags: ["Gemini"],
      description: "Generate text content using Gemini (social posts, captions, ad copy)",
      body: textGenerationSchema,
      response: {
        200: z.object({
          text: z.string(),
          model: z.string(),
          usage: z.object({
            promptTokens: z.number(),
            completionTokens: z.number(),
            totalTokens: z.number(),
          }).optional(),
        }),
      },
    },
  }, async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.status(401).send({ error: { code: "authentication_required", message: "Authentication required" } });

    const brandId = request.headers["x-brand-id"] as string;
    if (!brandId) return reply.status(400).send({ error: { code: "brand_required", message: "x-brand-id header is required" } });

    const body = textGenerationSchema.parse(request.body);

    try {
      const result = await generateText(body.prompt, {
        model: body.model,
        maxTokens: body.maxTokens,
        temperature: body.temperature,
        topP: body.topP,
        systemInstruction: body.systemInstruction,
      });

      // Track usage
      await db.insert(geminiJobs).values({
        brandId,
        userId,
        jobType: "text_generate",
        model: result.model,
        prompt: body.prompt,
        status: "complete",
        result: { text: result.text, usage: result.usage },
      });

      return result;
    } catch (err: any) {
      request.log.error({ err, brandId }, "Gemini text generation failed");
      return reply.status(502).send({
        error: {
          code: "gemini_error",
          message: err?.message ?? "Text generation failed",
        },
      });
    }
  });

  // ─── POST /gemini/image ──────────────────────────────────────────────────
  server.post("/image", {
    schema: {
      tags: ["Gemini"],
      description: "Generate images using Gemini Omni",
      body: imageGenerationSchema,
      response: {
        200: z.object({
          images: z.array(z.object({
            data: z.string(),
            mimeType: z.string(),
          })),
          model: z.string(),
        }),
      },
    },
  }, async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.status(401).send({ error: { code: "authentication_required", message: "Authentication required" } });

    const brandId = request.headers["x-brand-id"] as string;
    if (!brandId) return reply.status(400).send({ error: { code: "brand_required", message: "x-brand-id header is required" } });

    const body = imageGenerationSchema.parse(request.body);

    try {
      const result = await generateImage(body.prompt, {
        model: body.model,
        numberOfImages: body.numberOfImages,
        aspectRatio: body.aspectRatio,
      });

      // Track usage
      await db.insert(geminiJobs).values({
        brandId,
        userId,
        jobType: "image_generate",
        model: result.model,
        prompt: body.prompt,
        status: "complete",
        result: { imageCount: result.images.length },
      });

      return result;
    } catch (err: any) {
      request.log.error({ err, brandId }, "Gemini image generation failed");
      return reply.status(502).send({
        error: {
          code: "gemini_error",
          message: err?.message ?? "Image generation failed",
        },
      });
    }
  });

  // ─── POST /gemini/video ──────────────────────────────────────────────────
  server.post("/video", {
    schema: {
      tags: ["Gemini"],
      description: "Generate video using Gemini Omni (async — returns jobId for polling)",
      body: videoGenerationSchema,
      response: {
        202: z.object({
          jobId: z.string(),
          status: z.string(),
          model: z.string(),
          message: z.string(),
        }),
      },
    },
  }, async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.status(401).send({ error: { code: "authentication_required", message: "Authentication required" } });

    const brandId = request.headers["x-brand-id"] as string;
    if (!brandId) return reply.status(400).send({ error: { code: "brand_required", message: "x-brand-id header is required" } });

    const body = videoGenerationSchema.parse(request.body);

    try {
      const result = await generateVideo(body.prompt, brandId, userId, {
        model: body.model,
        aspectRatio: body.aspectRatio,
        negativePrompt: body.negativePrompt,
        numberOfVideos: body.numberOfVideos,
        personGeneration: body.personGeneration,
      });

      return reply.status(202).send({
        jobId: result.jobId,
        status: result.status,
        model: result.model,
        message: "Video generation started. Poll GET /gemini/video/:jobId for status.",
      });
    } catch (err: any) {
      request.log.error({ err, brandId }, "Gemini video generation failed");

      if (err?.message?.includes("Rate limit")) {
        return reply.status(429).send({
          error: {
            code: "rate_limit_exceeded",
            message: err.message,
          },
        });
      }

      return reply.status(502).send({
        error: {
          code: "gemini_error",
          message: err?.message ?? "Video generation failed",
        },
      });
    }
  });

  // ─── POST /gemini/video/edit ─────────────────────────────────────────────
  server.post("/video/edit", {
    schema: {
      tags: ["Gemini"],
      description: "Edit existing video using Gemini Omni (async — returns jobId for polling)",
      body: videoEditSchema,
      response: {
        202: z.object({
          jobId: z.string(),
          status: z.string(),
          model: z.string(),
          message: z.string(),
        }),
      },
    },
  }, async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.status(401).send({ error: { code: "authentication_required", message: "Authentication required" } });

    const brandId = request.headers["x-brand-id"] as string;
    if (!brandId) return reply.status(400).send({ error: { code: "brand_required", message: "x-brand-id header is required" } });

    const body = videoEditSchema.parse(request.body);

    try {
      const result = await editVideo(body.videoUrl, body.prompt, brandId, userId, {
        model: body.model,
        negativePrompt: body.negativePrompt,
      });

      return reply.status(202).send({
        jobId: result.jobId,
        status: result.status,
        model: result.model,
        message: "Video edit started. Poll GET /gemini/video/:jobId for status.",
      });
    } catch (err: any) {
      request.log.error({ err, brandId }, "Gemini video edit failed");

      if (err?.message?.includes("Rate limit")) {
        return reply.status(429).send({
          error: {
            code: "rate_limit_exceeded",
            message: err.message,
          },
        });
      }

      return reply.status(502).send({
        error: {
          code: "gemini_error",
          message: err?.message ?? "Video edit failed",
        },
      });
    }
  });

  // ─── GET /gemini/video/:jobId ─────────────────────────────────────────────
  server.get("/video/:jobId", {
    schema: {
      tags: ["Gemini"],
      description: "Poll video generation/edit job status",
      params: z.object({ jobId: z.string().uuid() }),
      response: {
        200: z.object({
          jobId: z.string(),
          jobType: z.string(),
          status: z.string(),
          model: z.string().optional(),
          prompt: z.string().optional(),
          videos: z.array(z.object({
            url: z.string(),
            mimeType: z.string(),
          })).optional(),
          error: z.string().optional(),
          createdAt: z.string().optional(),
        }),
      },
    },
  }, async (request, reply) => {
    const brandId = request.headers["x-brand-id"] as string;
    if (!brandId) return reply.status(400).send({ error: { code: "brand_required", message: "x-brand-id header is required" } });

    const { jobId } = request.params as { jobId: string };

    try {
      const result = await pollVideoJob(jobId, brandId);

      // Fetch the job record for metadata
      const [job] = await db.select().from(geminiJobs)
        .where(and(eq(geminiJobs.id, jobId), eq(geminiJobs.brandId, brandId)))
        .limit(1);

      return {
        jobId,
        jobType: job?.jobType ?? "unknown",
        status: result.status,
        model: job?.model,
        prompt: job?.prompt,
        videos: result.videos,
        error: result.error,
        createdAt: job?.createdAt?.toISOString(),
      };
    } catch (err: any) {
      return reply.status(404).send({
        error: {
          code: "job_not_found",
          message: err?.message ?? "Job not found",
        },
      });
    }
  });

  // ─── GET /gemini/status ──────────────────────────────────────────────────
  server.get("/status", {
    schema: {
      tags: ["Gemini"],
      description: "Check Gemini API key status and brand usage metrics",
      response: {
        200: z.object({
          apiKey: z.object({
            configured: z.boolean(),
            model: z.string().optional(),
            error: z.string().optional(),
          }),
          usage: z.object({
            textCalls: z.number(),
            imageCalls: z.number(),
            videoCalls: z.number(),
            videoEdits: z.number(),
            totalCalls: z.number(),
          }).optional(),
        }),
      },
    },
  }, async (request, reply) => {
    const brandId = request.headers["x-brand-id"] as string;

    const [keyStatus, usage] = await Promise.all([
      getApiKeyStatus(),
      brandId ? getBrandUsage(brandId) : Promise.resolve(undefined),
    ]);

    return {
      apiKey: keyStatus,
      usage,
    };
  });

  // ─── GET /gemini/jobs ────────────────────────────────────────────────────
  server.get("/jobs", {
    schema: {
      tags: ["Gemini"],
      description: "List Gemini generation jobs for brand",
    },
  }, async (request, reply) => {
    const brandId = request.headers["x-brand-id"] as string;
    if (!brandId) return reply.status(400).send({ error: { code: "brand_required", message: "x-brand-id header is required" } });

    const jobs = await db.select().from(geminiJobs)
      .where(eq(geminiJobs.brandId, brandId))
      .orderBy(desc(geminiJobs.createdAt))
      .limit(50);

    return jobs.map((j) => ({
      id: j.id,
      jobType: j.jobType,
      model: j.model,
      prompt: j.prompt?.slice(0, 200),
      status: j.status,
      result: j.result,
      createdAt: j.createdAt.toISOString(),
    }));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Gemini Omni Flash — Next-gen video generation + conversational editing
  // ═══════════════════════════════════════════════════════════════════════════

  const omniFlashVideoSchema = z.object({
    prompt: z.string().min(1).max(8000),
    model: z.string().optional(),
    aspectRatio: z.enum(["16:9", "9:16", "1:1", "4:5"]).optional(),
    duration: z.number().min(1).max(120).optional(),
    resolution: z.enum(["720p", "1080p", "4K"]).optional(),
    withAudio: z.boolean().optional(),
    negativePrompt: z.string().max(1000).optional(),
    numberOfVideos: z.number().min(1).max(4).optional(),
    personGeneration: z.enum(["allow_all", "allow_adult"]).optional(),
    style: z.enum(["social-short", "cinematic", "promotional", "tutorial"]).optional(),
    mood: z.enum(["upbeat", "professional", "cozy", "exciting"]).optional(),
    voiceover: z.boolean().optional(),
    music: z.boolean().optional(),
    referenceImageUrl: z.string().url().optional(),
  });

  const omniFlashEditSchema = z.object({
    videoJobId: z.string().uuid(),
    instruction: z.string().min(1).max(4000),
    targetSegmentStartMs: z.number().optional(),
    targetSegmentEndMs: z.number().optional(),
    preserveElements: z.array(z.string()).optional(),
    withAudio: z.boolean().optional(),
    negativePrompt: z.string().max(1000).optional(),
    model: z.string().optional(),
  });

  const templateGenerateSchema = z.object({
    templateId: z.enum(Object.keys(SALON_TEMPLATES) as [SalonTemplateId, ...SalonTemplateId[]]),
    customPrompt: z.string().max(4000).optional(),
    overrides: z.object({
      aspectRatio: z.enum(["16:9", "9:16", "1:1", "4:5"]).optional(),
      duration: z.number().min(1).max(120).optional(),
      resolution: z.enum(["720p", "1080p", "4K"]).optional(),
      withAudio: z.boolean().optional(),
      style: z.enum(["social-short", "cinematic", "promotional", "tutorial"]).optional(),
      mood: z.enum(["upbeat", "professional", "cozy", "exciting"]).optional(),
    }).optional(),
  });

  // ─── POST /gemini/omni/video ─────────────────────────────────────────────
  server.post("/omni/video", {
    schema: {
      tags: ["Gemini Omni Flash"],
      description: "Generate video using Gemini Omni Flash (text-to-video or image-to-video). Async — returns jobId.",
      body: omniFlashVideoSchema,
    },
  }, async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.status(401).send({ error: { code: "authentication_required", message: "Authentication required" } });
    const brandId = request.headers["x-brand-id"] as string;
    if (!brandId) return reply.status(400).send({ error: { code: "brand_required", message: "x-brand-id header is required" } });

    const body = omniFlashVideoSchema.parse(request.body);

    try {
      const result = await generateOmniFlashVideo(body.prompt, brandId, userId, body);
      return reply.status(202).send({
        jobId: result.jobId,
        status: result.status,
        model: result.model,
        message: "Omni Flash video generation started. Poll GET /gemini/video/:jobId for status.",
      });
    } catch (err: any) {
      request.log.error({ err, brandId }, "Omni Flash video generation failed");
      if (err?.message?.includes("Rate limit")) {
        return reply.status(429).send({ error: { code: "rate_limit_exceeded", message: err.message } });
      }
      return reply.status(502).send({ error: { code: "omni_flash_error", message: err?.message ?? "Omni Flash video generation failed" } });
    }
  });

  // ─── POST /gemini/omni/video/edit ────────────────────────────────────────
  server.post("/omni/video/edit", {
    schema: {
      tags: ["Gemini Omni Flash"],
      description: "Edit existing video using Gemini Omni Flash conversational editing. Async — returns jobId.",
      body: omniFlashEditSchema,
    },
  }, async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.status(401).send({ error: { code: "authentication_required", message: "Authentication required" } });
    const brandId = request.headers["x-brand-id"] as string;
    if (!brandId) return reply.status(400).send({ error: { code: "brand_required", message: "x-brand-id header is required" } });

    const body = omniFlashEditSchema.parse(request.body);

    try {
      const result = await editOmniFlashVideo(body.videoJobId, brandId, userId, {
        instruction: body.instruction,
        targetSegmentStartMs: body.targetSegmentStartMs,
        targetSegmentEndMs: body.targetSegmentEndMs,
        preserveElements: body.preserveElements,
        withAudio: body.withAudio,
        negativePrompt: body.negativePrompt,
        model: body.model,
      });
      return reply.status(202).send({
        jobId: result.jobId,
        status: result.status,
        model: result.model,
        message: "Omni Flash video edit started. Poll GET /gemini/video/:jobId for status.",
      });
    } catch (err: any) {
      request.log.error({ err, brandId }, "Omni Flash video edit failed");
      if (err?.message?.includes("not found")) {
        return reply.status(404).send({ error: { code: "job_not_found", message: err.message } });
      }
      if (err?.message?.includes("no completed video")) {
        return reply.status(400).send({ error: { code: "video_not_ready", message: err.message } });
      }
      return reply.status(502).send({ error: { code: "omni_flash_error", message: err?.message ?? "Omni Flash video edit failed" } });
    }
  });

  // ─── GET /gemini/omni/templates ──────────────────────────────────────────
  server.get("/omni/templates", {
    schema: {
      tags: ["Gemini Omni Flash"],
      description: "List available salon video templates for quick generation",
    },
  }, async (request, reply) => {
    const templates = getSalonTemplates();
    return Object.entries(templates).map(([id, t]) => ({
      id,
      name: t.name,
      description: t.description,
      prompt: t.prompt,
      options: t.options,
      estimatedCost: t.estimatedCost,
      platforms: t.platforms,
    }));
  });

  // ─── POST /gemini/omni/templates/:templateId ────────────────────────────
  server.post("/omni/templates/:templateId", {
    schema: {
      tags: ["Gemini Omni Flash"],
      description: "Generate video from a pre-built salon template",
      body: templateGenerateSchema,
    },
  }, async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.status(401).send({ error: { code: "authentication_required", message: "Authentication required" } });
    const brandId = request.headers["x-brand-id"] as string;
    if (!brandId) return reply.status(400).send({ error: { code: "brand_required", message: "x-brand-id header is required" } });

    const { templateId, customPrompt, overrides } = templateGenerateSchema.parse(request.body);

    try {
      const result = await generateFromTemplate(
        templateId as SalonTemplateId,
        customPrompt,
        brandId,
        userId,
        overrides
      );
      return reply.status(202).send({
        jobId: result.jobId,
        status: result.status,
        model: result.model,
        templateId,
        message: `Video generation from template '${templateId}' started. Poll GET /gemini/video/:jobId for status.`,
      });
    } catch (err: any) {
      request.log.error({ err, brandId }, "Omni Flash template generation failed");
      if (err?.message?.includes("not found")) {
        return reply.status(404).send({ error: { code: "template_not_found", message: err.message } });
      }
      return reply.status(502).send({ error: { code: "omni_flash_error", message: err?.message ?? "Template video generation failed" } });
    }
  });
}