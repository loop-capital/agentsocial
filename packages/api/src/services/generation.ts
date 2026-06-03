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
  "gemini-2.0-flash":  { min: 0, max: 0, unit: "text" },
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

    // Query muapi pricing API for dynamic models
    try {
      const apiKey = config.muapiApiKey || process.env.MUAPI_API_KEY;
      const baseUrl = config.muapiBaseUrl || "https://api.muapi.ai";

      const res = await fetch(`${baseUrl}/api/v1/models/${model}`);
      if (res.ok) {
        const data = await res.json();
        if (data.cost !== undefined) {
          return { amountUsd: data.cost, dynamic: data.dynamic_pricing || false };
        }
      }
    } catch {
      // Fall through to estimate
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

  // ─── muapi Provider Implementation ─────────────────────────────────────

  async function generateImageMuapi(req: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const apiKey = config.muapiApiKey || process.env.MUAPI_API_KEY;
    if (!apiKey) throw new Error("MUAPI_API_KEY is not configured");

    const baseUrl = config.muapiBaseUrl || "https://api.muapi.ai";
    const model = req.model || "nano-banana";

    const body: Record<string, any> = {
      prompt: req.prompt,
    };
    if (req.aspectRatio) body.aspect_ratio = req.aspectRatio;
    if (req.negativePrompt) body.negative_prompt = req.negativePrompt;
    if (req.numberOfImages) body.num_images = req.numberOfImages;
    if (req.referenceImages?.length) {
      body.reference_images = req.referenceImages;
    }

    // Image-to-image models use different endpoint
    const isEdit = req.referenceImages && req.referenceImages.length > 0;
    const endpoint = isEdit ? `/api/v1/${model}` : `/api/v1/${model}`;

    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`muapi image generation failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const costUsd = parseFloat(res.headers.get("X-MuAPI-Cost-USD") || "0");

    const images: ImageGenerationResponse["images"] = [];

    // muapi returns either base64 data or URLs
    if (data.data) {
      // Single image response
      if (data.data.url) {
        images.push({ data: "", mimeType: data.data.mime_type || "image/png", url: data.data.url });
      } else if (data.data.image) {
        images.push({ data: data.data.image, mimeType: data.data.mime_type || "image/png" });
      }
    }
    // Multiple images
    if (data.images && Array.isArray(data.images)) {
      for (const img of data.images) {
        if (img.url) {
          images.push({ data: "", mimeType: img.mime_type || "image/png", url: img.url });
        } else if (img.image || img.data) {
          images.push({ data: img.image || img.data, mimeType: img.mime_type || "image/png" });
        }
      }
    }
    // Fallback: check for output field
    if (images.length === 0 && data.output) {
      if (Array.isArray(data.output)) {
        for (const out of data.output) {
          if (typeof out === "string") {
            images.push({ data: "", mimeType: "image/png", url: out });
          } else if (out.url) {
            images.push({ data: "", mimeType: out.mime_type || "image/png", url: out.url });
          }
        }
      } else if (typeof data.output === "string") {
        images.push({ data: "", mimeType: "image/png", url: data.output });
      }
    }

    if (images.length === 0) {
      throw new Error(`muapi returned no images. Response: ${JSON.stringify(data).slice(0, 500)}`);
    }

    return {
      images,
      model,
      provider: "muapi",
      cost: costUsd > 0 ? { amountUsd: costUsd } : undefined,
    };
  }

  async function generateVideoMuapi(req: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    const apiKey = config.muapiApiKey || process.env.MUAPI_API_KEY;
    if (!apiKey) throw new Error("MUAPI_API_KEY is not configured");

    const baseUrl = config.muapiBaseUrl || "https://api.muapi.ai";
    const model = req.model || "seedance-2.0";

    const body: Record<string, any> = {
      prompt: req.prompt,
    };
    if (req.aspectRatio) body.aspect_ratio = req.aspectRatio;
    if (req.duration) body.duration = req.duration;
    if (req.negativePrompt) body.negative_prompt = req.negativePrompt;
    if (req.numberOfVideos) body.num_videos = req.numberOfVideos;
    if (req.resolution) body.resolution = req.resolution;
    if (req.referenceImageUrl) body.image_url = req.referenceImageUrl;

    // Estimate cost before generation
    const estimatedCost = await estimateCost(model, body);

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
      throw new Error(`muapi video generation failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const costUsd = parseFloat(res.headers.get("X-MuAPI-Cost-USD") || "0");

    // muapi video generation is async — returns a task/job ID
    const taskId = data.id || data.task_id || data.request_id || data.job_id;

    if (!taskId) {
      // Some models return video directly (synchronous)
      if (data.data?.url || data.output) {
        return {
          jobId: `muapi-sync-${Date.now()}`,
          status: "complete",
          model,
          provider: "muapi",
          cost: costUsd > 0 ? { amountUsd: costUsd } : { amountUsd: estimatedCost.amountUsd },
        };
      }
      throw new Error(`muapi video generation returned no task ID. Response: ${JSON.stringify(data).slice(0, 500)}`);
    }

    return {
      jobId: `muapi-${taskId}`,
      status: "processing",
      model,
      provider: "muapi",
      cost: costUsd > 0 ? { amountUsd: costUsd } : { amountUsd: estimatedCost.amountUsd },
    };
  }

  async function editVideoMuapi(req: VideoEditRequest): Promise<VideoGenerationResponse> {
    const apiKey = config.muapiApiKey || process.env.MUAPI_API_KEY;
    if (!apiKey) throw new Error("MUAPI_API_KEY is not configured");

    const baseUrl = config.muapiBaseUrl || "https://api.muapi.ai";
    const model = req.model || "wan2.2-edit-video";

    const body: Record<string, any> = {
      video_url: req.videoUrl,
      prompt: req.prompt,
    };
    if (req.negativePrompt) body.negative_prompt = req.negativePrompt;

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
      throw new Error(`muapi video edit failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const costUsd = parseFloat(res.headers.get("X-MuAPI-Cost-USD") || "0");
    const taskId = data.id || data.task_id || data.request_id;

    return {
      jobId: taskId ? `muapi-${taskId}` : `muapi-sync-${Date.now()}`,
      status: taskId ? "processing" : "complete",
      model,
      provider: "muapi",
      cost: costUsd > 0 ? { amountUsd: costUsd } : undefined,
    };
  }

  async function pollMuapiJob(jobId: string): Promise<VideoJobStatus> {
    const apiKey = config.muapiApiKey || process.env.MUAPI_API_KEY;
    if (!apiKey) throw new Error("MUAPI_API_KEY is not configured");

    const baseUrl = config.muapiBaseUrl || "https://api.muapi.ai";

    // Extract the muapi task ID from our composite jobId
    const taskId = jobId.replace(/^muapi-/, "");

    const res = await fetch(`${baseUrl}/api/v1/status/${taskId}`, {
      headers: {
        "x-api-key": apiKey,
      },
    });

    if (!res.ok) {
      throw new Error(`muapi job poll failed (${res.status}): ${await res.text()}`);
    }

    const data = await res.json();
    const costUsd = parseFloat(res.headers.get("X-MuAPI-Cost-USD") || "0");

    const status = data.status === "completed" ? "complete" :
                   data.status === "failed" ? "failed" :
                   "processing";

    const videos: Array<{ url: string; mimeType: string }> = [];

    if (status === "complete") {
      if (data.data?.url) {
        videos.push({ url: data.data.url, mimeType: data.data.mime_type || "video/mp4" });
      } else if (data.output) {
        const outputs = Array.isArray(data.output) ? data.output : [data.output];
        for (const out of outputs) {
          if (typeof out === "string") {
            videos.push({ url: out, mimeType: "video/mp4" });
          } else if (out.url) {
            videos.push({ url: out.url, mimeType: out.mime_type || "video/mp4" });
          }
        }
      }
    }

    return {
      jobId,
      status,
      model: data.model || "unknown",
      provider: "muapi",
      videos: videos.length > 0 ? videos : undefined,
      error: data.error || data.message,
      cost: costUsd > 0 ? { amountUsd: costUsd } : undefined,
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

  // ─── Return public API ──────────────────────────────────────────────────

  return {
    generateImage,
    generateVideo,
    editVideo,
    getVideoJobStatus,
    listModels,
    estimateCost,
    resolveProvider,
    createCharacter,
    createVoiceProfile,
    generateCharacterVideo,
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