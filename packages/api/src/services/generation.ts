/**
 * Generation Service — Provider-adapter pattern for AI image/video generation
 *
 * Routes all generation requests through a provider interface so we can swap
 * between Gemini (current), muapi (now), and Omni (future) without touching
 * business logic or API routes.
 *
 * Providers:
 *   - gemini   — Google Gemini / Veo (existing, free-tier limited)
 *   - muapi    — 200+ models via muapi.ai (pay-per-use, cheap)
 *   - omni models (gemini-omni-*, kling-v3.0-omni-*) accessed via muapi provider
 *
 * Usage:
 *   const service = createGenerationService({ defaultProvider: 'muapi' });
 *   const img = await service.generateImage({ prompt, provider: 'muapi', model: 'nano-banana' });
 *   const vid = await service.generateVideo({ prompt, provider: 'muapi', model: 'seedance-2.0' });
 */

import { z } from "zod";

// ─── Provider Interface ────────────────────────────────────────────────────

export type GenerationProvider = "gemini" | "muapi" ;

export interface ImageGenerationRequest {
  prompt: string;
  model?: string;
  aspectRatio?: string;       // "1:1" | "3:4" | "4:3" | "9:16" | "16:9"
  numberOfImages?: number;     // 1-4
  referenceImages?: string[];  // URLs for image-to-image
  negativePrompt?: string;
  brandId: string;
  userId: string;
  provider?: GenerationProvider;
}

export interface ImageGenerationResponse {
  images: Array<{
    data: string;       // base64 or URL
    mimeType: string;
    url?: string;       // if hosted externally
  }>;
  model: string;
  provider: GenerationProvider;
  cost?: {
    amountUsd: number;
    amountCredits?: number;
  };
}

export interface VideoGenerationRequest {
  prompt: string;
  model?: string;
  aspectRatio?: string;       // "16:9" | "9:16" | "1:1" | "4:5"
  duration?: number;          // seconds
  resolution?: string;        // "720p" | "1080p" | "4K"
  negativePrompt?: string;
  referenceImageUrl?: string;  // for image-to-video
  numberOfVideos?: number;
  personGeneration?: string;
  withAudio?: boolean;
  style?: string;
  mood?: string;
  brandId: string;
  userId: string;
  provider?: GenerationProvider;
}

export interface VideoGenerationResponse {
  jobId: string;
  status: "processing" | "complete" | "failed";
  model: string;
  provider: GenerationProvider;
  cost?: {
    amountUsd: number;
    amountCredits?: number;
  };
}

export interface VideoEditRequest {
  videoUrl: string;
  prompt: string;
  model?: string;
  negativePrompt?: string;
  brandId: string;
  userId: string;
  provider?: GenerationProvider;
}

export interface VideoJobStatus {
  jobId: string;
  status: "processing" | "complete" | "failed";
  model: string;
  provider: GenerationProvider;
  videos?: Array<{ url: string; mimeType: string }>;
  error?: string;
  cost?: {
    amountUsd: number;
    amountCredits?: number;
  };
}

export interface TextGenerationRequest {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  systemInstruction?: string;
  brandId: string;
  userId: string;
  provider?: GenerationProvider;
}

export interface TextGenerationResponse {
  text: string;
  model: string;
  provider: GenerationProvider;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  cost?: {
    amountUsd: number;
    amountCredits?: number;
  };
}

export interface ModelInfo {
  id: string;
  name: string;
  category: string;      // "text-to-image" | "image-to-image" | "text-to-video" | etc.
  provider: GenerationProvider;
  cost?: number;          // USD per generation (fixed) or undefined (dynamic)
  dynamicPricing?: boolean;
  description?: string;
}

// ─── Character & Voice Profile Types (Gemini Omni) ──────────────────────────

export interface CharacterCreationRequest {
  description: string;        // Text description of the character's appearance, style, personality
  imageUrl: string;           // Reference photo URL (1 image, max 20MB)
  characterName?: string;    // Optional display name
  audioIds?: string[];        // Voice profile IDs from gemini-omni-audio
  brandId: string;
  userId: string;
}

export interface CharacterCreationResponse {
  characterId: string;        // Reusable character ID (e.g. "chr_abc123")
  characterName?: string;
  images: Array<{ url: string; mimeType: string }>;
  cost: { amountUsd: number };
}

export interface VoiceProfileRequest {
  name: string;               // Name for this voice profile (max 210 chars)
  presetVoice: string;        // Preset voice ID to use as base
  voiceDescription?: string;  // Describe timbre, style, emotion (max 20,000 chars)
  exampleDialogue?: string;   // Short sample sentence the voice would say (max 120 chars)
  brandId: string;
  userId: string;
}

export interface VoiceProfileResponse {
  audioId: string;            // Reusable voice profile ID
  name: string;
  cost: { amountUsd: number };
}

export interface CharacterVideoRequest {
  prompt: string;
  model?: string;                // Default: gemini-omni-text-to-video or gemini-omni-image-to-video
  characterIds: string[];       // Up to 3 character IDs from gemini-omni-character
  audioIds?: string[];           // Up to 3 voice profile IDs
  imageUrl?: string;              // For image-to-video: reference image
  duration?: number;             // Seconds
  resolution?: string;          // "720p" | "1080p" | "4K"
  aspectRatio?: string;         // "16:9" | "9:16" | "1:1"
  brandId: string;
  userId: string;
}

// ─── Provider Cost Estimates (for display/pricing) ─────────────────────────

export const PROVIDER_COST_ESTIMATES: Record<string, { min: number; max: number; unit: string }> = {
  // muapi models
  "nano-banana":       { min: 0.03, max: 0.03, unit: "image" },
  "nano-banana-2":     { min: 0.03, max: 0.05, unit: "image" },
  "flux-dev":          { min: 0.025, max: 0.025, unit: "image" },
  "flux-schnell":      { min: 0.01, max: 0.01, unit: "image" },
  "google-imagen4-fast": { min: 0.02, max: 0.05, unit: "image" },
  "kling-v2.1-standard-i2v": { min: 0.10, max: 0.15, unit: "video" },
  "kling-v2.1-pro-i2v":      { min: 0.15, max: 0.30, unit: "video" },
  "kling-v2.5-turbo-pro-i2v": { min: 0.20, max: 0.40, unit: "video" },
  "seedance-2.0":      { min: 0.40, max: 0.60, unit: "video" },
  "seedance-pro-i2v-fast": { min: 0.30, max: 0.50, unit: "video" },
  "veo3-fast":          { min: 0.40, max: 0.60, unit: "video" },
  "veo3.1-fast":        { min: 0.40, max: 0.60, unit: "video" },
  "openai-sora-2":     { min: 0.25, max: 0.50, unit: "video" },
  "minimax-hailuo-2.3-pro-t2v": { min: 0.15, max: 0.30, unit: "video" },
  "kling-v1-avatar-standard": { min: 0.05, max: 0.10, unit: "video" },
  "creatify-lipsync":   { min: 0.05, max: 0.10, unit: "video" },
  "latent-sync":        { min: 0.05, max: 0.10, unit: "video" },
  "ai-product-shot":    { min: 0.05, max: 0.10, unit: "image" },
  "ai-background-remover": { min: 0.02, max: 0.05, unit: "image" },
  "flux-kontext-pro-i2i": { min: 0.05, max: 0.10, unit: "image" },
  // Gemini Omni models (accessed via muapi)
  "gemini-omni-character":       { min: 0.00, max: 0.00, unit: "image" },
  "gemini-omni-text-to-video":   { min: 1.50, max: 1.50, unit: "video" },
  "gemini-omni-image-to-video":  { min: 1.50, max: 1.50, unit: "video" },
  "gemini-omni-video-edit":      { min: 2.40, max: 2.40, unit: "video" },
  "gemini-omni-audio":           { min: 0.00, max: 0.00, unit: "audio" },
  // Kling Omni models (accessed via muapi)
  "kling-v3.0-omni-standard-image-to-video": { min: 0.42, max: 0.42, unit: "video" },
  "kling-v3.0-omni-standard-text-to-video":  { min: 0.42, max: 0.42, unit: "video" },
  "kling-v3.0-omni-pro-image-to-video":      { min: 0.56, max: 0.56, unit: "video" },
  "kling-v3.0-omni-pro-text-to-video":       { min: 0.56, max: 0.56, unit: "video" },
  "kling-v3.0-omni-4k-image-to-video":       { min: 2.68, max: 2.68, unit: "video" },
  "kling-v3.0-omni-4k-text-to-video":        { min: 2.68, max: 2.68, unit: "video" },
  // Gemini models (free tier, limited)
  "gemini-3.6-flash":  { min: 0, max: 0, unit: "text" },
  "gemini-2.0-flash-preview-image-generation": { min: 0, max: 0, unit: "image" },
  "veo-2.0-generate-001": { min: 0, max: 0, unit: "video" },
};

// ─── Salon-optimized model recommendations ─────────────────────────────────

export const SALON_MODEL_RECOMMENDATIONS = {
  socialImage: {
    fast: "nano-banana",
    quality: "flux-dev",
    product: "ai-product-shot",
    edit: "flux-kontext-pro-i2i",
  },
  socialVideo: {
    fast: "kling-v2.1-standard-i2v",
    quality: "seedance-2.0",
    cinematic: "veo3-fast",
    ad: "openai-sora-2",
    omni: "gemini-omni-text-to-video",
  },
  talkingHead: {
    standard: "kling-v1-avatar-standard",
    lipsync: "creatify-lipsync",
    pro: "latent-sync",
    omni: "gemini-omni-character",
  },
  editing: {
    removeBg: "ai-background-remover",
    productShot: "ai-product-shot",
    restyle: "flux-kontext-pro-i2i",
    faceSwap: "ai-image-face-swap",
  },
} as const;

// ─── Generation Service ────────────────────────────────────────────────────

// ─── muapi errors ───────────────────────────────────────────────────────────

/** An error returned by muapi, carrying its HTTP status and body for callers. */
export class MuapiError extends Error {
  constructor(
    public upstreamStatus: number,
    public upstreamError: unknown,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "MuapiError";
  }
}

async function muapiError(res: Response, action: string): Promise<MuapiError> {
  const text = await res.text();
  let body: any = text;
  try { body = JSON.parse(text); } catch { /* keep text */ }

  const upstreamCode = body?.error?.code ?? body?.detail?.error?.code;
  const code =
    upstreamCode === "INSUFFICIENT_CREDITS" || res.status === 402 ? "provider_insufficient_credits" :
    res.status === 422 || res.status === 400 ? "invalid_generation_params" :
    res.status === 401 || res.status === 403 ? "provider_auth_error" :
    res.status === 404 ? "model_not_found" :
    res.status === 429 ? "provider_rate_limited" :
    "provider_upstream_error";

  // Prefer muapi's own message; for validation errors list each bad field
  const detail = Array.isArray(body?.detail)
    ? body.detail.map((d: any) => `${(d.loc ?? []).filter((l: string) => l !== "body").join(".")}: ${d.msg}`).join("; ")
    : body?.error?.message ?? body?.detail?.error?.message ?? (typeof body?.detail === "string" ? body.detail : undefined);

  return new MuapiError(res.status, body, code, `muapi ${action} failed (${res.status})${detail ? `: ${detail}` : ""}`);
}

export interface MuapiSubmitResult {
  requestId: string;
  costUsd: number | null;
  raw: unknown;
}

export interface MuapiPollResult {
  status: "processing" | "completed" | "failed";
  outputs: Array<{ url: string; mimeType: string }>;
  costUsd: number | null;
  error?: string;
  raw: unknown;
}

function muapiCost(data: any, res: Response): number | null {
  const fromBody = data?.cost?.amount_usd;
  if (typeof fromBody === "number") return fromBody;
  const fromHeader = res.headers.get("X-MuAPI-Cost-USD");
  return fromHeader !== null && fromHeader !== "" ? Number(fromHeader) : null;
}

function guessMimeType(url: string): string {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
  if (ext === "mp4" || ext === "mov" || ext === "webm") return `video/${ext === "mov" ? "quicktime" : ext}`;
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  return ext === "png" ? "image/png" : "application/octet-stream";
}

export interface GenerationServiceConfig {
  defaultProvider: GenerationProvider;
  muapiApiKey?: string;
  muapiBaseUrl?: string;
  geminiApiKey?: string;
}

export function createGenerationService(config: GenerationServiceConfig) {
  const defaultProvider = config.defaultProvider || "muapi";

  // ─── Provider Selection ─────────────────────────────────────────────────

  function resolveProvider(requested?: GenerationProvider): GenerationProvider {
    return requested || defaultProvider;
  }

  // ─── Image Generation ───────────────────────────────────────────────────

  async function generateImage(req: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const provider = resolveProvider(req.provider);

    switch (provider) {
      case "muapi":
        return generateImageMuapi(req);
      case "gemini":
        return generateImageGemini(req);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  // ─── Video Generation ───────────────────────────────────────────────────

  async function generateVideo(req: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    const provider = resolveProvider(req.provider);

    switch (provider) {
      case "muapi":
        return generateVideoMuapi(req);
      case "gemini":
        return generateVideoGemini(req);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  // ─── Video Edit ─────────────────────────────────────────────────────────

  async function editVideo(req: VideoEditRequest): Promise<VideoGenerationResponse> {
    const provider = resolveProvider(req.provider);

    switch (provider) {
      case "muapi":
        return editVideoMuapi(req);
      case "gemini":
        return editVideoGemini(req);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  // ─── Video Job Polling ──────────────────────────────────────────────────

  async function getVideoJobStatus(jobId: string, brandId: string, provider?: GenerationProvider): Promise<VideoJobStatus> {
    // Determine provider from job ID prefix or stored job
    const prov = provider || defaultProvider;

    switch (prov) {
      case "muapi":
        return pollMuapiJob(jobId);
      case "gemini":
        // Use existing Gemini polling
        const { pollVideoJob } = await import("./gemini.js");
        const result = await pollVideoJob(jobId, brandId);
        return {
          jobId,
          status: result.status as VideoJobStatus["status"],
          model: "gemini",
          provider: "gemini",
          videos: result.videos,
          error: result.error,
        };
      default:
        throw new Error(`Polling not supported for provider: ${prov}`);
    }
  }

  // ─── List Available Models ─────────────────────────────────────────────

  async function listModels(category?: string): Promise<ModelInfo[]> {
    const models = await fetchMuapiModels();
    if (category) {
      return models.filter(m => m.category.toLowerCase().includes(category.toLowerCase()));
    }
    return models;
  }

  // ─── Estimate Cost ──────────────────────────────────────────────────────

  async function estimateCost(model: string, params?: Record<string, any>): Promise<{ amountUsd: number; dynamic: boolean }> {
    // Check local estimates first
    const local = PROVIDER_COST_ESTIMATES[model];
    if (local) {
      return { amountUsd: local.min, dynamic: false };
    }

    // muapi catalog price (cached)
    const listed = (await fetchMuapiModels()).find((m) => m.id === model);
    if (listed?.cost !== undefined) {
      return { amountUsd: listed.cost, dynamic: listed.dynamicPricing ?? false };
    }

    // Rough estimates by category
    if (model.includes("image") || model.includes("flux") || model.includes("banana") || model.includes("imagen")) {
      return { amountUsd: 0.03, dynamic: true };
    }
    if (model.includes("video") || model.includes("veo") || model.includes("kling") || model.includes("seedance") || model.includes("sora")) {
      return { amountUsd: 0.30, dynamic: true };
    }
    return { amountUsd: 0.05, dynamic: true };
  }

  // ─── muapi transport ────────────────────────────────────────────────────

  function muapiAuth(): { apiKey: string; baseUrl: string } {
    const apiKey = config.muapiApiKey || process.env.MUAPI_API_KEY;
    if (!apiKey) throw new Error("MUAPI_API_KEY is not configured");
    return { apiKey, baseUrl: config.muapiBaseUrl || "https://api.muapi.ai" };
  }

  /** Submit a generation to muapi (all muapi generations are async). */
  async function submitMuapi(model: string, body: Record<string, unknown>): Promise<MuapiSubmitResult> {
    const { apiKey, baseUrl } = muapiAuth();
    const res = await fetch(`${baseUrl}/api/v1/${model}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) throw await muapiError(res, `${model} submit`);

    const data: any = await res.json();
    const requestId = data.request_id ?? data.id ?? data.task_id;
    if (!requestId) {
      throw new MuapiError(res.status, data, "provider_upstream_error", "muapi submit returned no request_id");
    }
    return { requestId, costUsd: muapiCost(data, res), raw: data };
  }

  /** Poll a muapi prediction once. */
  async function pollMuapi(requestId: string): Promise<MuapiPollResult> {
    const { apiKey, baseUrl } = muapiAuth();
    const res = await fetch(`${baseUrl}/api/v1/predictions/${requestId}/result`, {
      headers: { "x-api-key": apiKey },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw await muapiError(res, "result poll");

    const data: any = await res.json();
    const status =
      data.status === "completed" || data.status === "succeeded" ? "completed" :
      data.status === "failed" || data.status === "cancelled" || data.status === "canceled" ? "failed" :
      "processing";
    const urls: string[] = (Array.isArray(data.outputs) ? data.outputs : [])
      .map((o: any) => (typeof o === "string" ? o : o?.url))
      .filter(Boolean);
    return {
      status,
      outputs: urls.map((url) => ({ url, mimeType: guessMimeType(url) })),
      costUsd: muapiCost(data, res),
      error: status === "failed" ? (data.error ?? data.message ?? `muapi status: ${data.status}`) : undefined,
      raw: data,
    };
  }

  /** Map our request fields to muapi's (snake_case, lowercase resolution). */
  function muapiVideoBody(req: VideoGenerationRequest): Record<string, unknown> {
    const body: Record<string, unknown> = { prompt: req.prompt };
    if (req.aspectRatio) body.aspect_ratio = req.aspectRatio;
    if (req.duration) body.duration = req.duration;
    if (req.negativePrompt) body.negative_prompt = req.negativePrompt;
    if (req.numberOfVideos) body.num_videos = req.numberOfVideos;
    if (req.resolution) body.resolution = req.resolution.toLowerCase();
    if (req.referenceImageUrl) body.image_url = req.referenceImageUrl;
    return body;
  }

  function muapiImageBody(req: ImageGenerationRequest): Record<string, unknown> {
    const body: Record<string, unknown> = { prompt: req.prompt };
    if (req.aspectRatio) body.aspect_ratio = req.aspectRatio;
    if (req.negativePrompt) body.negative_prompt = req.negativePrompt;
    if (req.numberOfImages) body.num_images = req.numberOfImages;
    if (req.referenceImages?.length) body.images_list = req.referenceImages;
    return body;
  }

  // ─── muapi Provider Implementation ─────────────────────────────────────

  async function generateImageMuapi(req: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const model = req.model || "nano-banana";
    const submitted = await submitMuapi(model, muapiImageBody(req));

    // Image jobs usually finish in seconds; wait up to 90s
    const deadline = Date.now() + 90_000;
    let result = await pollMuapi(submitted.requestId);
    while (result.status === "processing" && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 2000));
      result = await pollMuapi(submitted.requestId);
    }
    if (result.status === "failed") {
      throw new MuapiError(200, result.raw, "generation_failed", `muapi ${model} failed: ${result.error}`);
    }
    if (result.status !== "completed") {
      throw new MuapiError(504, result.raw, "generation_timeout", `muapi ${model} did not finish within 90s (request ${submitted.requestId})`);
    }

    const costUsd = result.costUsd ?? submitted.costUsd;
    return {
      images: result.outputs.map((o) => ({ data: "", mimeType: o.mimeType, url: o.url })),
      model,
      provider: "muapi",
      cost: costUsd !== null ? { amountUsd: costUsd } : undefined,
    };
  }

  async function generateVideoMuapi(req: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    const model = req.model || "seedance-2.0";
    const submitted = await submitMuapi(model, muapiVideoBody(req));
    const cost = submitted.costUsd ?? (await estimateCost(model)).amountUsd;
    return {
      jobId: `muapi-${submitted.requestId}`,
      status: "processing",
      model,
      provider: "muapi",
      cost: { amountUsd: cost },
    };
  }

  async function editVideoMuapi(req: VideoEditRequest): Promise<VideoGenerationResponse> {
    const model = req.model || "wan2.2-edit-video";
    const body: Record<string, unknown> = { video_url: req.videoUrl, prompt: req.prompt };
    if (req.negativePrompt) body.negative_prompt = req.negativePrompt;
    const submitted = await submitMuapi(model, body);
    return {
      jobId: `muapi-${submitted.requestId}`,
      status: "processing",
      model,
      provider: "muapi",
      cost: submitted.costUsd !== null ? { amountUsd: submitted.costUsd } : undefined,
    };
  }

  async function pollMuapiJob(jobId: string): Promise<VideoJobStatus> {
    const result = await pollMuapi(jobId.replace(/^muapi-/, ""));
    return {
      jobId,
      status: result.status === "completed" ? "complete" : result.status,
      model: (result.raw as any)?.model || "unknown",
      provider: "muapi",
      videos: result.outputs.length > 0 ? result.outputs : undefined,
      error: result.error,
      cost: result.costUsd !== null ? { amountUsd: result.costUsd } : undefined,
    };
  }

  // ─── Gemini Provider Implementation (wraps existing service) ────────────

  async function generateImageGemini(req: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const { generateImage: geminiGenerate } = await import("./gemini.js");
    const result = await geminiGenerate(req.prompt, {
      model: req.model,
      numberOfImages: req.numberOfImages,
      aspectRatio: req.aspectRatio,
    });

    return {
      images: result.images.map(img => ({
        data: img.data,
        mimeType: img.mimeType,
      })),
      model: result.model,
      provider: "gemini",
      // Gemini free tier has no per-call cost
    };
  }

  async function generateVideoGemini(req: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    const { generateVideo: geminiGenerate } = await import("./gemini.js");
    const result = await geminiGenerate(req.prompt, req.brandId, req.userId, {
      model: req.model,
      aspectRatio: req.aspectRatio,
      negativePrompt: req.negativePrompt,
      numberOfVideos: req.numberOfVideos,
      personGeneration: req.personGeneration,
    });

    return {
      jobId: result.jobId,
      status: result.status as VideoGenerationResponse["status"],
      model: result.model,
      provider: "gemini",
    };
  }

  async function editVideoGemini(req: VideoEditRequest): Promise<VideoGenerationResponse> {
    const { editVideo: geminiEdit } = await import("./gemini.js");
    const result = await geminiEdit(req.videoUrl, req.prompt, req.brandId, req.userId, {
      model: req.model,
      negativePrompt: req.negativePrompt,
    });

    return {
      jobId: result.jobId,
      status: result.status as VideoGenerationResponse["status"],
      model: result.model,
      provider: "gemini",
    };
  }

  // ─── Model Catalog ─────────────────────────────────────────────────────

  let _modelCache: ModelInfo[] | null = null;
  let _modelCacheTime = 0;
  const MODEL_CACHE_TTL = 60 * 60 * 1000; // 1 hour

  async function fetchMuapiModels(): Promise<ModelInfo[]> {
    const now = Date.now();
    if (_modelCache && now - _modelCacheTime < MODEL_CACHE_TTL) {
      return _modelCache;
    }

    try {
      const baseUrl = config.muapiBaseUrl || "https://api.muapi.ai";
      const res = await fetch(`${baseUrl}/api/v1/models`);
      if (!res.ok) {
        throw new Error(`Failed to fetch muapi models: ${res.status}`);
      }
      const data = await res.json();

      const models: ModelInfo[] = (data.models || []).map((m: any) => ({
        id: m.name,
        name: m.name,
        category: m.category || m.group_of || "unknown",
        provider: "muapi" as GenerationProvider,
        cost: m.cost ?? undefined,
        dynamicPricing: m.dynamic_pricing ?? false,
        description: m.description,
      }));

      _modelCache = models;
      _modelCacheTime = now;
      return models;
    } catch {
      // Return empty list on error — don't block generation
      return [];
    }
  }

  // ─── Character Creation (Gemini Omni) ──────────────────────────────────

  async function createCharacter(req: CharacterCreationRequest): Promise<CharacterCreationResponse> {
    const apiKey = config.muapiApiKey || process.env.MUAPI_API_KEY;
    if (!apiKey) throw new Error("MUAPI_API_KEY is not configured");

    const baseUrl = config.muapiBaseUrl || "https://api.muapi.ai";

    const body: Record<string, any> = {
      descriptions: req.description,
      images_list: [req.imageUrl],
    };
    if (req.characterName) body.character_name = req.characterName;
    if (req.audioIds?.length) body.audio_ids = req.audioIds;

    const res = await fetch(`${baseUrl}/api/v1/gemini-omni-character`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Character creation failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const costUsd = parseFloat(res.headers.get("X-MuAPI-Cost-USD") || "0");

    // Response has output.character_id and output.outputs[]
    const output = data.output || data.data || data;
    const characterId = output.character_id || output.characterId || data.id;

    const images: Array<{ url: string; mimeType: string }> = [];
    if (output.outputs) {
      for (const url of output.outputs) {
        images.push({ url, mimeType: "image/png" });
      }
    }

    return {
      characterId,
      characterName: output.character_name || req.characterName,
      images,
      cost: { amountUsd: costUsd || 0 }, // gemini-omni-character is FREE
    };
  }

  // ─── Voice Profile Creation (Gemini Omni Audio) ──────────────────────────

  async function createVoiceProfile(req: VoiceProfileRequest): Promise<VoiceProfileResponse> {
    const apiKey = config.muapiApiKey || process.env.MUAPI_API_KEY;
    if (!apiKey) throw new Error("MUAPI_API_KEY is not configured");

    const baseUrl = config.muapiBaseUrl || "https://api.muapi.ai";

    const body: Record<string, any> = {
      name: req.name,
      audio_id: req.presetVoice,
    };
    if (req.voiceDescription) body.voice_description = req.voiceDescription;
    if (req.exampleDialogue) body.example_dialogue = req.exampleDialogue;

    const res = await fetch(`${baseUrl}/api/v1/gemini-omni-audio`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Voice profile creation failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const costUsd = parseFloat(res.headers.get("X-MuAPI-Cost-USD") || "0");

    const output = data.output || data.data || data;
    const audioId = output.audio_id || output.audioId || data.id;

    return {
      audioId,
      name: req.name,
      cost: { amountUsd: costUsd || 0 }, // gemini-omni-audio is FREE
    };
  }

  // ─── Character Video Generation ──────────────────────────────────────────

  async function generateCharacterVideo(req: CharacterVideoRequest): Promise<VideoGenerationResponse> {
    const apiKey = config.muapiApiKey || process.env.MUAPI_API_KEY;
    if (!apiKey) throw new Error("MUAPI_API_KEY is not configured");

    const baseUrl = config.muapiBaseUrl || "https://api.muapi.ai";

    // Determine model based on whether image reference is provided
    const model = req.model || (req.imageUrl ? "gemini-omni-image-to-video" : "gemini-omni-text-to-video");

    const body: Record<string, any> = {
      prompt: req.prompt,
      character_ids: req.characterIds,
    };
    if (req.audioIds?.length) body.audio_ids = req.audioIds;
    if (req.imageUrl) body.image_urls = [req.imageUrl];
    if (req.duration) body.duration = req.duration;
    if (req.resolution) body.resolution = req.resolution;
    if (req.aspectRatio) body.aspect_ratio = req.aspectRatio;

    // Estimate cost
    const estimatedCost = await estimateCost(model);

    const res = await fetch(`${baseUrl}/api/v1/${model}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Character video generation failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const costUsd = parseFloat(res.headers.get("X-MuAPI-Cost-USD") || "0");
    const taskId = data.id || data.task_id || data.request_id;

    return {
      jobId: taskId ? `muapi-${taskId}` : `muapi-sync-${Date.now()}`,
      status: taskId ? "processing" : "complete",
      model,
      provider: "muapi",
      cost: costUsd > 0 ? { amountUsd: costUsd } : { amountUsd: estimatedCost.amountUsd },
    };
  }

  // ─── Text Generation ───────────────────────────────────────────────────

  async function generateText(req: TextGenerationRequest): Promise<TextGenerationResponse> {
    const provider = resolveProvider(req.provider);

    switch (provider) {
      case "muapi":
        return generateTextMuapi(req);
      case "gemini":
        return generateTextGemini(req);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  async function generateTextMuapi(req: TextGenerationRequest): Promise<TextGenerationResponse> {
    const apiKey = config.muapiApiKey || process.env.MUAPI_API_KEY;
    if (!apiKey) throw new Error("MUAPI_API_KEY is not configured");

    const baseUrl = config.muapiBaseUrl || "https://api.muapi.ai";
    const model = req.model || "gemini-3.6-flash";

    const body: Record<string, any> = {
      prompt: req.prompt,
    };
    if (req.maxTokens) body.max_tokens = req.maxTokens;
    if (req.temperature !== undefined) body.temperature = req.temperature;
    if (req.topP !== undefined) body.top_p = req.topP;
    if (req.systemInstruction) body.system_instruction = req.systemInstruction;

    const res = await fetch(`${baseUrl}/api/v1/${model}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`muapi text generation failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const costUsd = parseFloat(res.headers.get("X-MuAPI-Cost-USD") || "0");

    const text =
      typeof data.text === "string"
        ? data.text
        : data.output?.text ?? data.output ?? data.response ?? "";

    if (!text) {
      throw new Error(`muapi returned no text. Response: ${JSON.stringify(data).slice(0, 500)}`);
    }

    return {
      text,
      model,
      provider: "muapi",
      usage: data.usage,
      cost: costUsd > 0 ? { amountUsd: costUsd } : undefined,
    };
  }

  async function generateTextGemini(req: TextGenerationRequest): Promise<TextGenerationResponse> {
    const { generateText: geminiGenerate } = await import("./gemini.js");
    const result = await geminiGenerate(req.prompt, {
      model: req.model,
      maxTokens: req.maxTokens,
      temperature: req.temperature,
      topP: req.topP,
      systemInstruction: req.systemInstruction,
    });

    return {
      text: result.text,
      model: result.model,
      provider: "gemini",
      usage: result.usage,
    };
  }

  // ─── Return public API ──────────────────────────────────────────────────

  return {
    generateImage,
    generateVideo,
    editVideo,
    getVideoJobStatus,
    submitMuapi,
    pollMuapi,
    muapiVideoBody,
    muapiImageBody,
    listModels,
    estimateCost,
    resolveProvider,
    createCharacter,
    createVoiceProfile,
    generateCharacterVideo,
    generateText,
    SALON_MODEL_RECOMMENDATIONS,
    PROVIDER_COST_ESTIMATES,
  };
}

// ─── Singleton ──────────────────────────────────────────────────────────────

let _service: ReturnType<typeof createGenerationService> | null = null;

export function getGenerationService(): ReturnType<typeof createGenerationService> {
  if (!_service) {
    _service = createGenerationService({
      defaultProvider: (process.env.GENERATION_DEFAULT_PROVIDER as GenerationProvider) || "muapi",
      muapiApiKey: process.env.MUAPI_API_KEY,
      muapiBaseUrl: process.env.MUAPI_BASE_URL || "https://api.muapi.ai",
      geminiApiKey: process.env.GEMINI_API_KEY,
    });
  }
  return _service;
}

export type GenerationService = ReturnType<typeof createGenerationService>;