/**
 * Generation Routes — Unified AI generation endpoints
 *
 * Provider-agnostic routes that wrap the GenerationService.
 * Supports muapi (200+ models), Gemini (free tier), and future Omni.
 *
 * Endpoints:
 *   POST /generate/image         — Generate image (any provider/model)
 *   POST /generate/video         — Generate video (async, returns jobId)
 *   POST /generate/video/edit    — Edit video (async, returns jobId)
 *   GET  /generate/video/:jobId  — Poll video job status
 *   GET  /generate/models        — List available models
 *   GET  /generate/models/:category — List models by category
 *   POST /generate/estimate-cost — Estimate cost before generation
 *   GET  /generate/recommendations — Get salon-optimized model recommendations
 *   GET  /generate/status        — Service health + provider status
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  getGenerationService,
  SALON_MODEL_RECOMMENDATIONS,
  PROVIDER_COST_ESTIMATES,
  type GenerationProvider,
} from "../services/generation.js";

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const providerEnum = z.enum(["muapi", "gemini"]).optional();

const imageGenerationSchema = z.object({
  prompt: z.string().min(1).max(8000),
  model: z.string().optional(),
  provider: providerEnum,
  aspectRatio: z.enum(["1:1", "3:4", "4:3", "9:16", "16:9"]).optional(),
  numberOfImages: z.number().min(1).max(4).optional(),
  referenceImages: z.array(z.string().url()).max(14).optional(),
  negativePrompt: z.string().max(1000).optional(),
});

const videoGenerationSchema = z.object({
  prompt: z.string().min(1).max(8000),
  model: z.string().optional(),
  provider: providerEnum,
  aspectRatio: z.enum(["16:9", "9:16", "1:1", "4:5"]).optional(),
  duration: z.number().min(1).max(120).optional(),
  resolution: z.enum(["720p", "1080p", "4K"]).optional(),
  negativePrompt: z.string().max(1000).optional(),
  referenceImageUrl: z.string().url().optional(),
  numberOfVideos: z.number().min(1).max(4).optional(),
  personGeneration: z.enum(["allow_all", "allow_adult"]).optional(),
  withAudio: z.boolean().optional(),
  style: z.enum(["social-short", "cinematic", "promotional", "tutorial"]).optional(),
  mood: z.enum(["upbeat", "professional", "cozy", "exciting"]).optional(),
});

const videoEditSchema = z.object({
  videoUrl: z.string().url(),
  prompt: z.string().min(1).max(4000),
  model: z.string().optional(),
  provider: providerEnum,
  negativePrompt: z.string().max(1000).optional(),
});

const costEstimateSchema = z.object({
  model: z.string().min(1),
  provider: providerEnum,
  params: z.record(z.any()).optional(),
});

// ─── Route Registration ────────────────────────────────────────────────────

export async function generationRoutes(server: FastifyInstance) {
  const service = getGenerationService();

  // ─── POST /generate/image ────────────────────────────────────────────────
  server.post("/image", {
    schema: {
      tags: ["Generation"],
      description: "Generate an image using any provider/model. Defaults to muapi nano-banana.",
      body: imageGenerationSchema,
    },
  }, async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.status(401).send({ error: { code: "authentication_required", message: "Authentication required" } });

    const brandId = request.headers["x-brand-id"] as string;
    if (!brandId) return reply.status(400).send({ error: { code: "brand_required", message: "x-brand-id header is required" } });

    const body = imageGenerationSchema.parse(request.body);

    try {
      const result = await service.generateImage({
        prompt: body.prompt,
        model: body.model,
        provider: body.provider as GenerationProvider | undefined,
        aspectRatio: body.aspectRatio,
        numberOfImages: body.numberOfImages,
        referenceImages: body.referenceImages,
        negativePrompt: body.negativePrompt,
        brandId,
        userId,
      });

      return reply.status(200).send({
        provider: result.provider,
        model: result.model,
        images: result.images,
        cost: result.cost,
      });
    } catch (err: any) {
      request.log.error({ err, brandId, provider: body.provider }, "Image generation failed");
      if (err?.message?.includes("not configured")) {
        return reply.status(503).send({ error: { code: "provider_not_configured", message: err.message } });
      }
      if (err?.message?.includes("Rate limit")) {
        return reply.status(429).send({ error: { code: "rate_limit_exceeded", message: err.message } });
      }
      return reply.status(502).send({ error: { code: "generation_error", message: err?.message ?? "Image generation failed" } });
    }
  });

  // ─── POST /generate/video ────────────────────────────────────────────────
  server.post("/video", {
    schema: {
      tags: ["Generation"],
      description: "Generate video using any provider/model. Async — returns jobId for polling.",
      body: videoGenerationSchema,
    },
  }, async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.status(401).send({ error: { code: "authentication_required", message: "Authentication required" } });

    const brandId = request.headers["x-brand-id"] as string;
    if (!brandId) return reply.status(400).send({ error: { code: "brand_required", message: "x-brand-id header is required" } });

    const body = videoGenerationSchema.parse(request.body);

    // Estimate cost before generation
    const estimatedCost = await service.estimateCost(body.model || "seedance-2.0");

    try {
      const result = await service.generateVideo({
        prompt: body.prompt,
        model: body.model,
        provider: body.provider as GenerationProvider | undefined,
        aspectRatio: body.aspectRatio,
        duration: body.duration,
        resolution: body.resolution,
        negativePrompt: body.negativePrompt,
        referenceImageUrl: body.referenceImageUrl,
        numberOfVideos: body.numberOfVideos,
        personGeneration: body.personGeneration,
        withAudio: body.withAudio,
        style: body.style,
        mood: body.mood,
        brandId,
        userId,
      });

      return reply.status(202).send({
        jobId: result.jobId,
        status: result.status,
        model: result.model,
        provider: result.provider,
        cost: result.cost || estimatedCost,
        message: "Video generation started. Poll GET /generate/video/:jobId for status.",
      });
    } catch (err: any) {
      request.log.error({ err, brandId, provider: body.provider }, "Video generation failed");
      if (err?.message?.includes("not configured")) {
        return reply.status(503).send({ error: { code: "provider_not_configured", message: err.message } });
      }
      if (err?.message?.includes("Rate limit")) {
        return reply.status(429).send({ error: { code: "rate_limit_exceeded", message: err.message } });
      }
      return reply.status(502).send({ error: { code: "generation_error", message: err?.message ?? "Video generation failed" } });
    }
  });

  // ─── POST /generate/video/edit ────────────────────────────────────────────
  server.post("/video/edit", {
    schema: {
      tags: ["Generation"],
      description: "Edit an existing video. Async — returns jobId for polling.",
      body: videoEditSchema,
    },
  }, async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.status(401).send({ error: { code: "authentication_required", message: "Authentication required" } });

    const brandId = request.headers["x-brand-id"] as string;
    if (!brandId) return reply.status(400).send({ error: { code: "brand_required", message: "x-brand-id header is required" } });

    const body = videoEditSchema.parse(request.body);

    try {
      const result = await service.editVideo({
        videoUrl: body.videoUrl,
        prompt: body.prompt,
        model: body.model,
        provider: body.provider as GenerationProvider | undefined,
        negativePrompt: body.negativePrompt,
        brandId,
        userId,
      });

      return reply.status(202).send({
        jobId: result.jobId,
        status: result.status,
        model: result.model,
        provider: result.provider,
        cost: result.cost,
        message: "Video edit started. Poll GET /generate/video/:jobId for status.",
      });
    } catch (err: any) {
      request.log.error({ err, brandId, provider: body.provider }, "Video edit failed");
      return reply.status(502).send({ error: { code: "generation_error", message: err?.message ?? "Video edit failed" } });
    }
  });

  // ─── GET /generate/video/:jobId ───────────────────────────────────────────
  server.get("/video/:jobId", {
    schema: {
      tags: ["Generation"],
      description: "Poll video generation/edit job status",
      params: z.object({ jobId: z.string() }),
    },
  }, async (request, reply) => {
    const brandId = request.headers["x-brand-id"] as string;
    if (!brandId) return reply.status(400).send({ error: { code: "brand_required", message: "x-brand-id header is required" } });

    const { jobId } = request.params as { jobId: string };
    const provider = (request.query as any)?.provider as GenerationProvider | undefined;

    try {
      const result = await service.getVideoJobStatus(jobId, brandId, provider);
      return result;
    } catch (err: any) {
      return reply.status(404).send({ error: { code: "job_not_found", message: err?.message ?? "Job not found" } });
    }
  });

  // ─── GET /generate/models ────────────────────────────────────────────────
  server.get("/models", {
    schema: {
      tags: ["Generation"],
      description: "List all available generation models (from muapi catalog + Gemini)",
    },
  }, async (request, reply) => {
    const category = (request.query as any)?.category as string | undefined;
    const models = await service.listModels(category);
    return { models, total: models.length };
  });

  // ─── GET /generate/models/:category ───────────────────────────────────────
  server.get("/models/:category", {
    schema: {
      tags: ["Generation"],
      description: "List models by category (text-to-image, text-to-video, image-to-video, etc.)",
      params: z.object({ category: z.string() }),
    },
  }, async (request, reply) => {
    const { category } = request.params as { category: string };
    const models = await service.listModels(category);
    return { category, models, total: models.length };
  });

  // ─── POST /generate/estimate-cost ─────────────────────────────────────────
  server.post("/estimate-cost", {
    schema: {
      tags: ["Generation"],
      description: "Estimate the cost of a generation before running it",
      body: costEstimateSchema,
    },
  }, async (request, reply) => {
    const body = costEstimateSchema.parse(request.body);
    const estimate = await service.estimateCost(body.model, body.params);
    return {
      model: body.model,
      estimatedCostUsd: estimate.amountUsd,
      dynamicPricing: estimate.dynamic,
    };
  });

  // ─── GET /generate/recommendations ────────────────────────────────────────
  server.get("/recommendations", {
    schema: {
      tags: ["Generation"],
      description: "Get salon-optimized model recommendations by use case",
    },
  }, async (request, reply) => {
    return {
      recommendations: SALON_MODEL_RECOMMENDATIONS,
      pricing: Object.fromEntries(
        Object.entries(PROVIDER_COST_ESTIMATES).map(([model, cost]) => [
          model,
          { min: cost.min, max: cost.max, unit: cost.unit },
        ])
      ),
    };
  });

  // ─── GET /generate/status ────────────────────────────────────────────────
  server.get("/status", {
    schema: {
      tags: ["Generation"],
      description: "Check generation service health and provider status",
    },
  }, async (request, reply) => {
    const muapiKey = process.env.MUAPI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const defaultProvider = process.env.GENERATION_DEFAULT_PROVIDER || "muapi";

    return {
      defaultProvider,
      providers: {
        muapi: {
          configured: !!muapiKey,
          baseUrl: process.env.MUAPI_BASE_URL || "https://api.muapi.ai",
          modelsAvailable: "200+",
        },
        gemini: {
          configured: !!geminiKey,
          note: "Free tier with rate limits. Use for fallback only.",
        },
        omni: {
          note: "Omni models (gemini-omni-*, kling-v3.0-omni-*) are accessed via the muapi provider.",
        },
      },
    };
  });

  // ─── POST /generate/character ──────────────────────────────────────────────
  server.post("/character", {
    schema: {
      tags: ["Generation"],
      description: "Create a reusable character (Gemini Omni). Upload a reference photo, get a character_id for consistent video generation.",
      body: z.object({
        description: z.string().min(1).max(20000),
        imageUrl: z.string().url(),
        characterName: z.string().max(200).optional(),
        audioIds: z.array(z.string()).max(3).optional(),
      }),
    },
  }, async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.status(401).send({ error: { code: "authentication_required", message: "Authentication required" } });

    const brandId = request.headers["x-brand-id"] as string;
    if (!brandId) return reply.status(400).send({ error: { code: "brand_required", message: "x-brand-id header is required" } });

    const body = request.body as any;

    try {
      const result = await service.createCharacter({
        description: body.description,
        imageUrl: body.imageUrl,
        characterName: body.characterName,
        audioIds: body.audioIds,
        brandId,
        userId,
      });

      return reply.status(201).send({
        characterId: result.characterId,
        characterName: result.characterName,
        images: result.images,
        cost: result.cost,
      });
    } catch (err: any) {
      request.log.error({ err, brandId }, "Character creation failed");
      return reply.status(502).send({ error: { code: "generation_error", message: err?.message ?? "Character creation failed" } });
    }
  });

  // ─── POST /generate/voice-profile ─────────────────────────────────────────
  server.post("/voice-profile", {
    schema: {
      tags: ["Generation"],
      description: "Create a voice profile (Gemini Omni Audio). Returns an audio_id usable with characters and video generation.",
      body: z.object({
        name: z.string().min(1).max(210),
        presetVoice: z.string().min(1),
        voiceDescription: z.string().max(20000).optional(),
        exampleDialogue: z.string().max(120).optional(),
      }),
    },
  }, async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.status(401).send({ error: { code: "authentication_required", message: "Authentication required" } });

    const brandId = request.headers["x-brand-id"] as string;
    if (!brandId) return reply.status(400).send({ error: { code: "brand_required", message: "x-brand-id header is required" } });

    const body = request.body as any;

    try {
      const result = await service.createVoiceProfile({
        name: body.name,
        presetVoice: body.presetVoice,
        voiceDescription: body.voiceDescription,
        exampleDialogue: body.exampleDialogue,
        brandId,
        userId,
      });

      return reply.status(201).send({
        audioId: result.audioId,
        name: result.name,
        cost: result.cost,
      });
    } catch (err: any) {
      request.log.error({ err, brandId }, "Voice profile creation failed");
      return reply.status(502).send({ error: { code: "generation_error", message: err?.message ?? "Voice profile creation failed" } });
    }
  });

  // ─── POST /generate/character-video ────────────────────────────────────────
  server.post("/character-video", {
    schema: {
      tags: ["Generation"],
      description: "Generate video with reusable characters (Gemini Omni). Pass character_ids and optional audio_ids for consistent talking-head content.",
      body: z.object({
        prompt: z.string().min(1).max(8000),
        characterIds: z.array(z.string()).min(1).max(3),
        audioIds: z.array(z.string()).max(3).optional(),
        imageUrl: z.string().url().optional(),
        model: z.string().optional(),
        duration: z.number().min(1).max(60).optional(),
        resolution: z.enum(["720p", "1080p", "4K"]).optional(),
        aspectRatio: z.enum(["16:9", "9:16", "1:1", "4:5"]).optional(),
      }),
    },
  }, async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.status(401).send({ error: { code: "authentication_required", message: "Authentication required" } });

    const brandId = request.headers["x-brand-id"] as string;
    if (!brandId) return reply.status(400).send({ error: { code: "brand_required", message: "x-brand-id header is required" } });

    const body = request.body as any;

    // Estimate cost before generation
    const model = body.model || (body.imageUrl ? "gemini-omni-image-to-video" : "gemini-omni-text-to-video");
    const estimatedCost = await service.estimateCost(model);

    try {
      const result = await service.generateCharacterVideo({
        prompt: body.prompt,
        characterIds: body.characterIds,
        audioIds: body.audioIds,
        imageUrl: body.imageUrl,
        model: body.model,
        duration: body.duration,
        resolution: body.resolution,
        aspectRatio: body.aspectRatio,
        brandId,
        userId,
      });

      return reply.status(202).send({
        jobId: result.jobId,
        status: result.status,
        model: result.model,
        provider: result.provider,
        cost: result.cost || estimatedCost,
        message: "Character video generation started. Poll GET /generate/video/:jobId for status.",
      });
    } catch (err: any) {
      request.log.error({ err, brandId, model }, "Character video generation failed");
      return reply.status(502).send({ error: { code: "generation_error", message: err?.message ?? "Character video generation failed" } });
    }
  });
}