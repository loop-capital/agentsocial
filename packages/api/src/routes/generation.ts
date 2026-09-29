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
import { and, eq } from "drizzle-orm";
import { db, brands } from "../db/index.js";
import {
  getGenerationService,
  MuapiError,
  SALON_MODEL_RECOMMENDATIONS,
  PROVIDER_COST_ESTIMATES,
  type GenerationProvider,
} from "../services/generation.js";
import {
  assertWithinBudget,
  BudgetExceededError,
  createJob,
  getBrandSpend,
  getJobForUser,
  listJobs,
  refreshJob,
  serializeJob,
  setBrandCap,
  submitJob,
  waitForJob,
  type JobKind,
} from "../services/generation-jobs.js";

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const providerEnum = z.enum(["muapi", "gemini"]).optional();

const brandIdField = z.string().uuid().optional()
  .describe("Brand to generate for. Alternative to the x-brand-id header.");

const brandHeaders = z.object({
  "x-brand-id": z.string().uuid().optional()
    .describe("Brand to generate for (required unless brand_id is given). Must be a brand you own."),
}).passthrough();

const errorResponse = z.object({
  error: z.object({
    code: z.string().describe("e.g. brand_required, brand_not_found, brand_budget_exceeded, provider_insufficient_credits, invalid_generation_params, provider_rate_limited, provider_auth_error, model_not_found, provider_upstream_error"),
    message: z.string(),
    provider: z.string().optional(),
    upstream_status: z.number().optional().describe("HTTP status muapi returned"),
    upstream_error: z.any().optional().describe("muapi's error body, verbatim"),
    spend: z.any().optional(),
    job: z.any().optional(),
  }).passthrough(),
});

const jobResponse = z.object({
  id: z.string().uuid(),
  jobId: z.string().uuid().describe("Same as id (kept for older clients)"),
  kind: z.enum(["image", "video", "video_edit"]),
  status: z.enum(["queued", "processing", "completed", "failed"]),
  brand_id: z.string().uuid(),
  provider: z.string(),
  model: z.string(),
  provider_job_id: z.string().nullable(),
  outputs: z.array(z.object({ url: z.string(), mimeType: z.string() })),
  result: z.object({ url: z.string() }).nullable().describe("First output, for convenience"),
  error: z.string().nullable(),
  error_details: z.any().nullable(),
  cost: z.object({
    currency: z.literal("USD"),
    estimated_usd: z.number().nullable(),
    actual_usd: z.number().nullable().describe("Cost reported by muapi; 0 for failed jobs"),
  }),
  created_at: z.string(),
  updated_at: z.string(),
  completed_at: z.string().nullable(),
});

const spendResponse = z.object({
  brand_id: z.string().uuid(),
  month: z.string(),
  actual_usd: z.number(),
  pending_estimated_usd: z.number(),
  jobs_completed: z.number(),
  jobs_failed: z.number(),
  jobs_in_progress: z.number(),
  monthly_cap_usd: z.number().nullable(),
  remaining_usd: z.number().nullable(),
});

const imageGenerationSchema = z.object({
  prompt: z.string().min(1).max(8000),
  model: z.string().optional(),
  provider: providerEnum,
  aspectRatio: z.enum(["1:1", "3:4", "4:3", "9:16", "16:9"]).optional(),
  numberOfImages: z.number().min(1).max(4).optional(),
  referenceImages: z.array(z.string().url()).max(14).optional(),
  negativePrompt: z.string().max(1000).optional(),
  brand_id: brandIdField,
});

const videoGenerationSchema = z.object({
  prompt: z.string().min(1).max(8000),
  model: z.string().optional(),
  provider: providerEnum,
  aspectRatio: z.enum(["16:9", "9:16", "1:1", "4:5"]).optional(),
  duration: z.number().min(1).max(120).optional(),
  resolution: z.enum(["720p", "1080p", "4K", "4k"]).optional(),
  negativePrompt: z.string().max(1000).optional(),
  referenceImageUrl: z.string().url().optional(),
  numberOfVideos: z.number().min(1).max(4).optional(),
  personGeneration: z.enum(["allow_all", "allow_adult"]).optional(),
  withAudio: z.boolean().optional(),
  style: z.enum(["social-short", "cinematic", "promotional", "tutorial"]).optional(),
  mood: z.enum(["upbeat", "professional", "cozy", "exciting"]).optional(),
  brand_id: brandIdField,
});

const videoEditSchema = z.object({
  videoUrl: z.string().url(),
  prompt: z.string().min(1).max(4000),
  model: z.string().optional(),
  provider: providerEnum,
  negativePrompt: z.string().max(1000).optional(),
  brand_id: brandIdField,
});

const costEstimateSchema = z.object({
  model: z.string().min(1),
  provider: providerEnum,
  params: z.record(z.any()).optional(),
});

// ─── Route Registration ────────────────────────────────────────────────────

export async function generationRoutes(server: FastifyInstance) {
  const service = getGenerationService();

  /** Resolve the brand from x-brand-id or brand_id (body/query) and check the caller owns it. */
  async function resolveBrand(request: any, reply: any): Promise<string | null> {
    const brandId = (request.headers["x-brand-id"] as string | undefined)
      ?? (request.body as any)?.brand_id
      ?? (request.query as any)?.brand_id;
    if (!brandId) {
      reply.status(400).send({ error: { code: "brand_required", message: "Provide the brand via the x-brand-id header or brand_id" } });
      return null;
    }
    const [brand] = await db.select({ id: brands.id }).from(brands)
      .where(and(eq(brands.id, brandId), eq(brands.userId, request.userId!))).limit(1);
    if (!brand) {
      reply.status(404).send({ error: { code: "brand_not_found", message: "Brand not found or not owned by this account" } });
      return null;
    }
    return brand.id;
  }

  /** Map any generation error to a structured response — never a bare 502. */
  function sendGenerationError(request: any, reply: any, err: unknown) {
    if (err instanceof BudgetExceededError) {
      return reply.status(402).send({ error: { code: "brand_budget_exceeded", message: err.message, spend: err.spend } });
    }
    if (err instanceof MuapiError) {
      const status =
        err.code === "provider_insufficient_credits" ? 402 :
        err.code === "invalid_generation_params" ? 422 :
        err.code === "model_not_found" ? 404 :
        err.code === "provider_rate_limited" ? 429 :
        err.code === "provider_auth_error" ? 503 :
        err.code === "generation_timeout" ? 504 :
        502;
      request.log.error({ upstreamStatus: err.upstreamStatus, upstreamError: err.upstreamError, code: err.code }, err.message);
      return reply.status(status).send({
        error: { code: err.code, message: err.message, provider: "muapi", upstream_status: err.upstreamStatus, upstream_error: err.upstreamError },
      });
    }
    const message = err instanceof Error ? err.message : String(err);
    request.log.error({ err }, "Generation failed");
    if (message.includes("not configured")) {
      return reply.status(503).send({ error: { code: "provider_not_configured", message } });
    }
    return reply.status(500).send({ error: { code: "internal_error", message } });
  }

  /** Estimate, check the brand's budget, record the job, and submit it to muapi. */
  async function startMuapiJob(kind: JobKind, brandId: string, userId: string, model: string, muapiBody: Record<string, unknown>) {
    const estimate = await service.estimateCost(model, muapiBody);
    await assertWithinBudget(brandId, estimate.amountUsd);
    const job = await createJob({ kind, brandId, userId, provider: "muapi", model, request: muapiBody, estimatedCostUsd: estimate.amountUsd });
    return submitJob(job, muapiBody);
  }

  const acceptedResponse = z.object({
    jobId: z.string(),
    status: z.string(),
    model: z.string(),
    provider: z.string(),
    cost: z.number().nullable().describe("Actual cost if known, else the estimate (USD)"),
    message: z.string(),
    job: jobResponse.optional(),
  });

  const generationErrors = {
    400: errorResponse, 402: errorResponse, 404: errorResponse, 422: errorResponse,
    429: errorResponse, 500: errorResponse, 502: errorResponse, 503: errorResponse, 504: errorResponse,
  };

  // ─── POST /generate/image ────────────────────────────────────────────────
  server.post("/image", {
    schema: {
      tags: ["Generation"],
      summary: "Generate an image",
      description: "Generates an image (muapi default model: nano-banana). Waits up to 25s: returns 200 with images when done, otherwise 202 with a job to poll via GET /generate/jobs/{jobId}. Emits generate.completed / generate.failed webhooks.",
      headers: brandHeaders,
      body: imageGenerationSchema,
      response: {
        200: z.object({
          provider: z.string(),
          model: z.string(),
          images: z.array(z.object({ url: z.string().optional(), data: z.string().optional(), mimeType: z.string() })),
          cost: z.number().nullable(),
          job: jobResponse.optional(),
        }),
        202: z.object({ job: jobResponse, message: z.string() }),
        ...generationErrors,
      },
    },
  }, async (request, reply) => {
    const userId = request.userId!;
    const brandId = await resolveBrand(request, reply);
    if (!brandId) return reply;
    const body = request.body as z.infer<typeof imageGenerationSchema>;
    const provider = service.resolveProvider(body.provider as GenerationProvider | undefined);

    if (provider !== "muapi") {
      try {
        const result = await service.generateImage({ ...body, provider, brandId, userId });
        return reply.status(200).send({
          provider: result.provider, model: result.model,
          images: result.images, cost: result.cost?.amountUsd ?? null,
        });
      } catch (err) {
        return sendGenerationError(request, reply, err);
      }
    }

    const model = body.model || "nano-banana";
    let job;
    try {
      job = await startMuapiJob("image", brandId, userId, model, service.muapiImageBody({ ...body, brandId, userId }));
    } catch (err) {
      return sendGenerationError(request, reply, err);
    }

    job = await waitForJob(job, 25_000);
    if (job.status === "completed") {
      return reply.status(200).send({
        provider: "muapi", model,
        images: job.outputs.map((o) => ({ url: o.url, mimeType: o.mimeType })),
        cost: job.actualCostUsd ?? job.estimatedCostUsd,
        job: serializeJob(job),
      });
    }
    if (job.status === "failed") {
      return reply.status(502).send({
        error: {
          code: job.error?.code ?? "generation_failed",
          message: job.error?.message ?? "Image generation failed",
          provider: "muapi",
          job: serializeJob(job),
        },
      });
    }
    return reply.status(202).send({ job: serializeJob(job), message: `Still processing. Poll GET /api/v1/generate/jobs/${job.id}.` });
  });

  // ─── POST /generate/video ────────────────────────────────────────────────
  server.post("/video", {
    schema: {
      tags: ["Generation"],
      summary: "Generate a video (async)",
      description: "Starts a video job and returns 202 immediately. The server polls muapi; read progress via GET /generate/jobs/{jobId} (or GET /generate/video/{jobId}), or subscribe to generate.completed / generate.failed webhooks. Per-model limits come from muapi (e.g. veo3.1-lite-text-to-video only accepts duration 8) and are returned as 422 invalid_generation_params.",
      headers: brandHeaders,
      body: videoGenerationSchema,
      response: { 202: acceptedResponse, ...generationErrors },
    },
  }, async (request, reply) => {
    const userId = request.userId!;
    const brandId = await resolveBrand(request, reply);
    if (!brandId) return reply;
    const body = request.body as z.infer<typeof videoGenerationSchema>;
    const provider = service.resolveProvider(body.provider as GenerationProvider | undefined);

    try {
      if (provider !== "muapi") {
        const result = await service.generateVideo({ ...body, provider, brandId, userId });
        return reply.status(202).send({
          jobId: result.jobId, status: result.status, model: result.model, provider: result.provider,
          cost: result.cost?.amountUsd ?? null,
          message: "Video generation started. Poll GET /generate/video/:jobId?provider=gemini for status.",
        });
      }

      const model = body.model || "seedance-2.0";
      const job = await startMuapiJob("video", brandId, userId, model, service.muapiVideoBody({ ...body, brandId, userId }));
      return reply.status(202).send({
        jobId: job.id, status: job.status, model, provider: "muapi",
        cost: job.actualCostUsd ?? job.estimatedCostUsd,
        message: `Video generation started. Poll GET /api/v1/generate/jobs/${job.id}.`,
        job: serializeJob(job),
      });
    } catch (err) {
      return sendGenerationError(request, reply, err);
    }
  });

  // ─── POST /generate/video/edit ────────────────────────────────────────────
  server.post("/video/edit", {
    schema: {
      tags: ["Generation"],
      summary: "Edit a video (async)",
      description: "Starts a video edit job and returns 202. Poll GET /generate/jobs/{jobId}.",
      headers: brandHeaders,
      body: videoEditSchema,
      response: { 202: acceptedResponse, ...generationErrors },
    },
  }, async (request, reply) => {
    const userId = request.userId!;
    const brandId = await resolveBrand(request, reply);
    if (!brandId) return reply;
    const body = request.body as z.infer<typeof videoEditSchema>;
    const provider = service.resolveProvider(body.provider as GenerationProvider | undefined);

    try {
      if (provider !== "muapi") {
        const result = await service.editVideo({ ...body, provider, brandId, userId });
        return reply.status(202).send({
          jobId: result.jobId, status: result.status, model: result.model, provider: result.provider,
          cost: result.cost?.amountUsd ?? null,
          message: "Video edit started. Poll GET /generate/video/:jobId?provider=gemini for status.",
        });
      }

      const model = body.model || "wan2.2-edit-video";
      const muapiBody: Record<string, unknown> = { video_url: body.videoUrl, prompt: body.prompt };
      if (body.negativePrompt) muapiBody.negative_prompt = body.negativePrompt;
      const job = await startMuapiJob("video_edit", brandId, userId, model, muapiBody);
      return reply.status(202).send({
        jobId: job.id, status: job.status, model, provider: "muapi",
        cost: job.actualCostUsd ?? job.estimatedCostUsd,
        message: `Video edit started. Poll GET /api/v1/generate/jobs/${job.id}.`,
        job: serializeJob(job),
      });
    } catch (err) {
      return sendGenerationError(request, reply, err);
    }
  });

  // ─── GET /generate/jobs/:jobId (and legacy /generate/video/:jobId) ────────
  const getJobHandler = async (request: any, reply: any) => {
    const { jobId } = request.params as { jobId: string };
    let job = await getJobForUser(jobId, request.userId!);

    if (!job) {
      // Gemini jobs are tracked by the Gemini service, not generation_jobs
      const provider = (request.query as any)?.provider as GenerationProvider | undefined;
      const brandId = request.headers["x-brand-id"] as string | undefined;
      if (provider === "gemini" && brandId) {
        try {
          return await service.getVideoJobStatus(jobId, brandId, "gemini");
        } catch { /* fall through to 404 */ }
      }
      return reply.status(404).send({ error: { code: "job_not_found", message: `No generation job ${jobId} for this account` } });
    }

    // Refresh a stale in-flight job so a poll never returns state older than ~10s
    if (job.status === "processing" && Date.now() - job.updatedAt.getTime() > 10_000) {
      job = await refreshJob(job);
    }
    return serializeJob(job);
  };

  server.get("/jobs/:jobId", {
    schema: {
      tags: ["Generation"],
      summary: "Get a generation job",
      description: "Status, output URLs, error details and estimated vs actual cost for an image/video job. No brand header needed; access is checked through brand ownership.",
      params: z.object({ jobId: z.string() }),
      response: { 200: jobResponse, 404: errorResponse },
    },
  }, getJobHandler);

  server.get("/video/:jobId", {
    schema: {
      tags: ["Generation"],
      summary: "Get a video job (alias of GET /generate/jobs/{jobId})",
      params: z.object({ jobId: z.string() }),
    },
  }, getJobHandler);

  // ─── GET /generate/jobs ───────────────────────────────────────────────────
  server.get("/jobs", {
    schema: {
      tags: ["Generation"],
      summary: "List a brand's generation jobs",
      headers: brandHeaders,
      querystring: z.object({
        brand_id: brandIdField,
        status: z.enum(["queued", "processing", "completed", "failed"]).optional(),
        limit: z.coerce.number().min(1).max(200).optional(),
      }),
      response: { 200: z.object({ data: z.array(jobResponse) }), 400: errorResponse, 404: errorResponse },
    },
  }, async (request, reply) => {
    const brandId = await resolveBrand(request, reply);
    if (!brandId) return reply;
    const q = request.query as { status?: "queued" | "processing" | "completed" | "failed"; limit?: number };
    const jobs = await listJobs(brandId, { status: q.status, limit: q.limit });
    return { data: jobs.map(serializeJob) };
  });

  // ─── GET /generate/spend ──────────────────────────────────────────────────
  server.get("/spend", {
    schema: {
      tags: ["Generation"],
      summary: "Brand generation spend for a month",
      description: "Actual muapi spend (completed jobs), estimated spend still in flight, and the brand's monthly cap if set.",
      headers: brandHeaders,
      querystring: z.object({
        brand_id: brandIdField,
        month: z.string().regex(/^\d{4}-\d{2}$/).optional().describe("YYYY-MM (UTC). Defaults to the current month."),
      }),
      response: { 200: spendResponse, 400: errorResponse, 404: errorResponse },
    },
  }, async (request, reply) => {
    const brandId = await resolveBrand(request, reply);
    if (!brandId) return reply;
    const { month } = request.query as { month?: string };
    return { brand_id: brandId, ...(await getBrandSpend(brandId, month)) };
  });

  // ─── PUT /generate/budget ─────────────────────────────────────────────────
  server.put("/budget", {
    schema: {
      tags: ["Generation"],
      summary: "Set or clear a brand's monthly generation cap",
      description: "Jobs that would push this month's actual + in-flight spend past the cap are rejected with 402 brand_budget_exceeded. Pass null to remove the cap.",
      headers: brandHeaders,
      body: z.object({
        brand_id: brandIdField,
        monthly_cap_usd: z.number().min(0).nullable(),
      }),
      response: { 200: spendResponse, 400: errorResponse, 404: errorResponse },
    },
  }, async (request, reply) => {
    const brandId = await resolveBrand(request, reply);
    if (!brandId) return reply;
    const { monthly_cap_usd } = request.body as { monthly_cap_usd: number | null };
    await setBrandCap(brandId, monthly_cap_usd);
    return { brand_id: brandId, ...(await getBrandSpend(brandId)) };
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