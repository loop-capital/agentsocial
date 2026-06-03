/**
 * Gemini Omni Service — Google DeepMind multimodal AI
 *
 * Powers text, image, and video generation from a single prompt via the
 * Gemini API. Video generation is async (long-running operation) and uses
 * a polling pattern until the operation completes.
 *
 * Uses @google/generative-ai SDK (v0.24+) with GEMINI_API_KEY from environment.
 * Video generation uses Google's REST API directly since the SDK doesn't
 * yet support Veo/generateVideos.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GenerativeModel, GenerationConfig, GenerateContentResult } from "@google/generative-ai";
import { db } from "../db/index.js";
import { geminiJobs, mediaAssets } from "../db/schema.js";
import { eq, and } from "drizzle-orm";

// ─── Client Initialization ─────────────────────────────────────────────────

let _genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured. Set it in your .env file.");
    }
    _genAI = new GoogleGenerativeAI(apiKey);
  }
  return _genAI;
}

/** Reset client (useful for tests / key rotation) */
export function resetClient(): void {
  _genAI = null;
}

/** Get model instance */
function getModel(modelName: string, config?: GenerationConfig, systemInstruction?: string): GenerativeModel {
  const genAI = getGenAI();
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: config,
    systemInstruction,
  });
}

// ─── Rate Limiting ────────────────────────────────────────────────────────

const brandCallCounts = new Map<string, { count: number; windowStart: number }>();

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_CALLS = 15; // per brand per minute (Google free-tier friendly)

function checkRateLimit(brandId: string): void {
  const now = Date.now();
  const entry = brandCallCounts.get(brandId);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    brandCallCounts.set(brandId, { count: 1, windowStart: now });
    return;
  }

  if (entry.count >= RATE_LIMIT_MAX_CALLS) {
    throw new Error(
      `Rate limit exceeded for brand ${brandId}. Max ${RATE_LIMIT_MAX_CALLS} calls per minute.`
    );
  }

  entry.count++;
}

// ─── Types ────────────────────────────────────────────────────────────────

export interface TextGenerationOptions {
  model?: string;            // e.g. "gemini-2.0-flash" (default)
  maxTokens?: number;
  temperature?: number;      // 0.0 – 2.0
  topP?: number;
  systemInstruction?: string;
}

export interface ImageGenerationOptions {
  model?: string;            // e.g. "gemini-2.0-flash-preview-image-generation"
  numberOfImages?: number;   // 1–4
  aspectRatio?: string;      // "1:1" | "3:4" | "4:3" | "9:16" | "16:9"
}

export interface VideoGenerationOptions {
  model?: string;            // e.g. "veo-2.0-generate-001"
  aspectRatio?: string;      // "16:9" | "9:16"
  negativePrompt?: string;
  numberOfVideos?: number;    // 1–4
  personGeneration?: string; // "allow_all" | "allow_adult"
}

export interface VideoEditOptions {
  model?: string;
  negativePrompt?: string;
}

export interface TextGenerationResult {
  text: string;
  model: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export interface ImageGenerationResult {
  images: Array<{
    data: string;   // base64-encoded
    mimeType: string;
  }>;
  model: string;
}

export interface VideoGenerationResult {
  jobId: string;
  status: string;
  model: string;
}

export interface VideoEditResult {
  jobId: string;
  status: string;
  model: string;
}

// ─── Text Generation ───────────────────────────────────────────────────────

export async function generateText(
  prompt: string,
  options: TextGenerationOptions = {}
): Promise<TextGenerationResult> {
  const modelName = options.model || "gemini-2.0-flash";

  const generationConfig: GenerationConfig = {};
  if (options.maxTokens) generationConfig.maxOutputTokens = options.maxTokens;
  if (options.temperature !== undefined) generationConfig.temperature = options.temperature;
  if (options.topP !== undefined) generationConfig.topP = options.topP;

  const model = getModel(modelName, generationConfig, options.systemInstruction);
  const result: GenerateContentResult = await model.generateContent(prompt);
  const response = result.response;

  const text = response.text();
  const usageMeta = response.usageMetadata;

  const usage = usageMeta
    ? {
        promptTokens: usageMeta.promptTokenCount ?? 0,
        completionTokens: usageMeta.candidatesTokenCount ?? 0,
        totalTokens: usageMeta.totalTokenCount ?? 0,
      }
    : undefined;

  return { text, model: modelName, usage };
}

// ─── Image Generation ──────────────────────────────────────────────────────

export async function generateImage(
  prompt: string,
  options: ImageGenerationOptions = {}
): Promise<ImageGenerationResult> {
  const modelName = options.model || "gemini-2.0-flash-preview-image-generation";

  const generationConfig: GenerationConfig = {
    responseMimeType: "image/png",
  };

  // Note: responseModalities is set via generationConfig for image generation
  // The SDK passes it through in generationConfig
  (generationConfig as any).responseModalities = ["IMAGE", "TEXT"];

  const model = getModel(modelName, generationConfig);
  const result: GenerateContentResult = await model.generateContent(prompt);
  const response = result.response;

  const images: ImageGenerationResult["images"] = [];

  if (response.candidates) {
    for (const candidate of response.candidates) {
      if (candidate.content?.parts) {
        for (const part of candidate.content.parts) {
          if ("inlineData" in part && part.inlineData) {
            images.push({
              data: part.inlineData.data ?? "",
              mimeType: part.inlineData.mimeType ?? "image/png",
            });
          }
        }
      }
    }
  }

  if (images.length === 0) {
    throw new Error("No images were generated. The prompt may not be supported for image generation with this model.");
  }

  return { images, model: modelName };
}

// ─── Video Generation (async — long-running operation via REST API) ────────
// The @google/generative-ai SDK (v0.24) does not yet expose video generation.
// We use the Google AI REST API directly for Veo models.

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

async function geminiRestApi(
  endpoint: string,
  body: Record<string, any>,
  method: "POST" = "POST"
): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const url = `${GEMINI_API_BASE}${endpoint}?key=${apiKey}`;
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errBody}`);
  }

  return res.json();
}

export async function generateVideo(
  prompt: string,
  brandId: string,
  userId: string,
  options: VideoGenerationOptions = {}
): Promise<VideoGenerationResult> {
  checkRateLimit(brandId);
  const modelName = options.model || "veo-2.0-generate-001";

  const body: Record<string, any> = {
    model: `models/${modelName}`,
    prompt,
  };
  if (options.aspectRatio) body.config = { ...body.config, aspectRatio: options.aspectRatio };
  if (options.negativePrompt) body.config = { ...body.config, negativePrompt: options.negativePrompt };
  if (options.numberOfVideos) body.config = { ...body.config, numberOfVideos: options.numberOfVideos };
  if (options.personGeneration) body.config = { ...body.config, personGeneration: options.personGeneration };

  // Submit the long-running operation
  const operation = await geminiRestApi(`/models/${modelName}:predict`, body);

  const operationName: string = operation.name ?? operation.operationId ?? "";

  // Create a job record for polling
  const [job] = await db.insert(geminiJobs).values({
    brandId,
    userId,
    jobType: "video_generate",
    model: modelName,
    prompt,
    operationName,
    status: "processing",
    config: {
      aspectRatio: options.aspectRatio,
      negativePrompt: options.negativePrompt,
      numberOfVideos: options.numberOfVideos,
      personGeneration: options.personGeneration,
    },
  }).returning();

  return {
    jobId: job.id,
    status: "processing",
    model: modelName,
  };
}

// ─── Video Editing (async — long-running operation) ───────────────────────

export async function editVideo(
  videoUrl: string,
  prompt: string,
  brandId: string,
  userId: string,
  options: VideoEditOptions = {}
): Promise<VideoEditResult> {
  checkRateLimit(brandId);
  const modelName = options.model || "veo-2.0-generate-001";

  const body: Record<string, any> = {
    model: `models/${modelName}`,
    prompt,
    config: {
      sourceVideoUrl: videoUrl,
    },
  };
  if (options.negativePrompt) body.config.negativePrompt = options.negativePrompt;

  const operation = await geminiRestApi(`/models/${modelName}:predict`, body);

  const operationName: string = operation.name ?? operation.operationId ?? "";

  const [job] = await db.insert(geminiJobs).values({
    brandId,
    userId,
    jobType: "video_edit",
    model: modelName,
    prompt,
    operationName,
    status: "processing",
    config: {
      videoUrl,
      negativePrompt: options.negativePrompt,
    },
  }).returning();

  return {
    jobId: job.id,
    status: "processing",
    model: modelName,
  };
}

// ─── Poll Video Job ──────────────────────────────────────────────────────

export async function pollVideoJob(jobId: string, brandId: string): Promise<{
  status: string;
  videos?: Array<{ url: string; mimeType: string }>;
  error?: string;
}> {
  const [job] = await db.select().from(geminiJobs)
    .where(and(eq(geminiJobs.id, jobId), eq(geminiJobs.brandId, brandId)))
    .limit(1);

  if (!job) {
    throw new Error("Job not found");
  }

  // If already terminal, return cached result
  if (job.status === "complete" || job.status === "failed") {
    return {
      status: job.status,
      videos: (job.result as any)?.videos,
      error: (job.result as any)?.error,
    };
  }

  // Poll the operation via REST API
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  try {
    const pollUrl = `${GEMINI_API_BASE}/${job.operationName}?key=${apiKey}`;
    const res = await fetch(pollUrl);
    const operation = await res.json();

    if (operation.done) {
      if (operation.error) {
        const errorMsg = operation.error.message ?? "Unknown error";
        await db.update(geminiJobs)
          .set({ status: "failed", result: { error: errorMsg } })
          .where(eq(geminiJobs.id, jobId));

        return { status: "failed", error: errorMsg };
      }

      const videos: Array<{ url: string; mimeType: string }> = [];

      if (operation.response?.generatedVideos) {
        for (const vid of operation.response.generatedVideos) {
          const videoUrl = vid.video?.uri ?? vid.video?.url ?? "";
          const mimeType = vid.video?.mimeType ?? "video/mp4";
          if (videoUrl) {
            videos.push({ url: videoUrl, mimeType });

            // Store in media_assets
            await db.insert(mediaAssets).values({
              brandId,
              uploaderUserId: job.userId,
              type: "video",
              url: videoUrl,
              filename: `gemini-${job.jobType}-${jobId}.mp4`,
              mimeType,
              fileSizeBytes: 0,
              processingStatus: "complete",
            });
          }
        }
      }

      await db.update(geminiJobs)
        .set({ status: "complete", result: { videos } })
        .where(eq(geminiJobs.id, jobId));

      return { status: "complete", videos };
    }

    // Still processing
    return { status: "processing" };
  } catch (err: any) {
    const errorMsg = err?.message ?? "Unknown polling error";
    await db.update(geminiJobs)
      .set({ status: "failed", result: { error: errorMsg } })
      .where(eq(geminiJobs.id, jobId));

    return { status: "failed", error: errorMsg };
  }
}

// ─── API Key Status Check ──────────────────────────────────────────────────

export async function getApiKeyStatus(): Promise<{
  configured: boolean;
  model?: string;
  error?: string;
}> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { configured: false, error: "GEMINI_API_KEY not set" };
  }

  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    await model.generateContent({
      contents: [{ role: "user", parts: [{ text: "Say OK" }] }],
      generationConfig: { maxOutputTokens: 3 },
    } as any);

    return { configured: true, model: "gemini-2.0-flash" };
  } catch (err: any) {
    return { configured: false, error: err?.message ?? "API key validation failed" };
  }
}

// ─── Gemini Omni Flash ───────────────────────────────────────────────────
//
// Gemini Omni Flash is the next-gen multimodal model for video generation
// with native audio, conversational editing, and image-to-video support.
// API rolling out "in the coming weeks" (announced May 2026).
//
// Until the official API endpoint is available, we route through the
// existing Veo generate endpoint. When Omni Flash API drops, we swap
// the model name and add Omni-specific features (conversational editing,
// native audio generation, image-to-video).

export interface OmniFlashVideoOptions {
  model?: string;             // "gemini-omni-flash" (when available), fallback "veo-2.0-generate-001"
  aspectRatio?: string;       // "16:9" | "9:16" | "1:1" | "4:5"
  duration?: number;          // Target duration in seconds (1-120)
  resolution?: string;        // "720p" | "1080p" | "4K"
  withAudio?: boolean;        // Generate with native audio (Omni Flash feature)
  negativePrompt?: string;
  numberOfVideos?: number;    // 1-4
  personGeneration?: string; // "allow_all" | "allow_adult"
  style?: string;             // "social-short" | "cinematic" | "promotional" | "tutorial"
  mood?: string;               // "upbeat" | "professional" | "cozy" | "exciting"
  voiceover?: boolean;        // Include AI narration
  music?: boolean;             // Include background music
  referenceImageUrl?: string;  // Image-to-video reference
}

export interface OmniFlashEditOptions {
  model?: string;
  instruction: string;       // Natural language edit instruction
  targetSegmentStartMs?: number;
  targetSegmentEndMs?: number;
  preserveElements?: string[]; // Elements to keep unchanged
  withAudio?: boolean;
  negativePrompt?: string;
}

/** Salon video templates for quick generation */
export const SALON_TEMPLATES = {
  "salon-promo-15": {
    name: "15s Salon Promo",
    description: "Short promotional reel showcasing salon services",
    prompt: "A modern salon with warm lighting, stylist working on client hair transformation, upbeat atmosphere, professional styling",
    options: {
      duration: 15,
      aspectRatio: "9:16",
      resolution: "1080p",
      withAudio: true,
      style: "social-short",
      mood: "upbeat",
      music: true,
      model: "veo-2.0-generate-001", // Swaps to gemini-omni-flash when API drops
    },
    estimatedCost: 0.60,
    platforms: ["instagram", "tiktok", "youtube", "facebook"],
  },
  "salon-before-after": {
    name: "Before & After",
    description: "Transformation showcase from before photo to styled result",
    prompt: "Hair transformation sequence showing before and after results, dramatic reveal",
    options: {
      duration: 20,
      aspectRatio: "9:16",
      resolution: "1080p",
      withAudio: true,
      style: "cinematic",
      mood: "professional",
      music: true,
      model: "veo-2.0-generate-001",
    },
    estimatedCost: 0.80,
    platforms: ["instagram", "tiktok", "facebook"],
  },
  "salon-seasonal": {
    name: "Seasonal Offer",
    description: "Seasonal promotion with text overlays and pricing",
    prompt: "Seasonal salon promotion with text overlay showing special offer, warm colors, inviting atmosphere",
    options: {
      duration: 30,
      aspectRatio: "9:16",
      resolution: "1080p",
      withAudio: true,
      style: "promotional",
      mood: "exciting",
      voiceover: true,
      music: true,
      model: "veo-2.0-generate-001",
    },
    estimatedCost: 1.20,
    platforms: ["instagram", "facebook", "youtube"],
  },
  "salon-ad-60": {
    name: "60s Google/Meta Ad",
    description: "Professional video ad for paid campaigns",
    prompt: "Professional salon advertisement showcasing services, ambiance, and booking call-to-action",
    options: {
      duration: 60,
      aspectRatio: "16:9",
      resolution: "1080p",
      withAudio: true,
      style: "cinematic",
      mood: "professional",
      voiceover: true,
      music: true,
      model: "veo-2.0-generate-001",
    },
    estimatedCost: 2.40,
    platforms: ["youtube", "facebook"],
  },
} as const;

export type SalonTemplateId = keyof typeof SALON_TEMPLATES;

/**
 * Generate video using Gemini Omni Flash (or Veo fallback).
 * Supports text-to-video and image-to-video (with referenceImageUrl).
 */
export async function generateOmniFlashVideo(
  prompt: string,
  brandId: string,
  userId: string,
  options: OmniFlashVideoOptions = {}
): Promise<VideoGenerationResult> {
  checkRateLimit(brandId);
  // Use Omni Flash model when API available, otherwise fall back to Veo 2.0
  const modelName = options.model || "veo-2.0-generate-001";

  // Build extended prompt with style/mood/voiceover context
  const enrichedPrompt = [
    prompt,
    options.style ? `Style: ${options.style}` : undefined,
    options.mood ? `Mood: ${options.mood}` : undefined,
    options.voiceover ? "Include voiceover narration" : undefined,
    options.music ? "Include background music" : undefined,
  ].filter(Boolean).join(". ");

  const body: Record<string, any> = {
    model: `models/${modelName}`,
    prompt: enrichedPrompt,
  };

  const config: Record<string, any> = {};
  if (options.aspectRatio) config.aspectRatio = options.aspectRatio;
  if (options.negativePrompt) config.negativePrompt = options.negativePrompt;
  if (options.numberOfVideos) config.numberOfVideos = options.numberOfVideos;
  if (options.personGeneration) config.personGeneration = options.personGeneration;
  if (options.duration) config.durationSeconds = options.duration;
  if (options.resolution) config.outputResolution = options.resolution;
  if (options.withAudio !== undefined) config.generateAudio = options.withAudio;
  if (options.referenceImageUrl) config.referenceImage = { url: options.referenceImageUrl };
  if (Object.keys(config).length > 0) body.config = config;

  // Submit the long-running operation
  const operation = await geminiRestApi(`/models/${modelName}:predict`, body);
  const operationName: string = operation.name ?? operation.operationId ?? "";

  const [job] = await db.insert(geminiJobs).values({
    brandId,
    userId,
    jobType: "omni_flash_generate",
    model: modelName,
    prompt: enrichedPrompt,
    operationName,
    status: "processing",
    config: {
      ...options,
      originalPrompt: prompt,
    },
  }).returning();

  return {
    jobId: job.id,
    status: "processing",
    model: modelName,
  };
}

/**
 * Edit video using Gemini Omni Flash conversational editing.
 * Uses natural language instructions to modify specific parts of a video.
 */
export async function editOmniFlashVideo(
  videoJobId: string,
  brandId: string,
  userId: string,
  options: OmniFlashEditOptions
): Promise<VideoEditResult> {
  checkRateLimit(brandId);
  const modelName = options.model || "veo-2.0-generate-001";

  // Look up the source job to get the video URL
  const [sourceJob] = await db.select().from(geminiJobs)
    .where(and(eq(geminiJobs.id, videoJobId), eq(geminiJobs.brandId, brandId)))
    .limit(1);

  if (!sourceJob) {
    throw new Error("Source video job not found");
  }

  const sourceResult = sourceJob.result as any;
  const videoUrl = sourceResult?.videos?.[0]?.url;
  if (!videoUrl) {
    throw new Error("Source video has no completed video to edit");
  }

  const body: Record<string, any> = {
    model: `models/${modelName}`,
    prompt: options.instruction,
    config: {
      sourceVideoUrl: videoUrl,
      ...(options.negativePrompt && { negativePrompt: options.negativePrompt }),
      ...(options.targetSegmentStartMs !== undefined && {
        timeRange: {
          startMs: options.targetSegmentStartMs,
          endMs: options.targetSegmentEndMs,
        },
      }),
      ...(options.preserveElements && { preserve: options.preserveElements }),
      ...(options.withAudio !== undefined && { generateAudio: options.withAudio }),
    },
  };

  const operation = await geminiRestApi(`/models/${modelName}:predict`, body);
  const operationName: string = operation.name ?? operation.operationId ?? "";

  const [job] = await db.insert(geminiJobs).values({
    brandId,
    userId,
    jobType: "omni_flash_edit",
    model: modelName,
    prompt: options.instruction,
    operationName,
    status: "processing",
    config: {
      sourceJobId: videoJobId,
      instruction: options.instruction,
      targetSegmentStartMs: options.targetSegmentStartMs,
      targetSegmentEndMs: options.targetSegmentEndMs,
      preserveElements: options.preserveElements,
      negativePrompt: options.negativePrompt,
    },
  }).returning();

  return {
    jobId: job.id,
    status: "processing",
    model: modelName,
  };
}

/** List available salon video templates */
export function getSalonTemplates(): typeof SALON_TEMPLATES {
  return SALON_TEMPLATES;
}

/** Generate video from a salon template */
export async function generateFromTemplate(
  templateId: SalonTemplateId,
  customPrompt: string | undefined,
  brandId: string,
  userId: string,
  overrides: Partial<OmniFlashVideoOptions> = {}
): Promise<VideoGenerationResult> {
  const template = SALON_TEMPLATES[templateId];
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  const prompt = customPrompt || template.prompt;
  const options: OmniFlashVideoOptions = {
    ...template.options,
    ...overrides,
  };

  return generateOmniFlashVideo(prompt, brandId, userId, options);
}

// ─── Brand Usage Tracking ─────────────────────────────────────────────────

export async function getBrandUsage(brandId: string, period: "day" | "month" = "month"): Promise<{
  textCalls: number;
  imageCalls: number;
  videoCalls: number;
  videoEdits: number;
  totalCalls: number;
}> {
  const since = new Date();
  if (period === "day") {
    since.setDate(since.getDate() - 1);
  } else {
    since.setMonth(since.getMonth() - 1);
  }

  const jobs = await db.select().from(geminiJobs)
    .where(eq(geminiJobs.brandId, brandId));

  const filtered = jobs.filter((j) => j.createdAt >= since);

  const textCalls = filtered.filter((j) => j.jobType === "text_generate").length;
  const imageCalls = filtered.filter((j) => j.jobType === "image_generate").length;
  const videoCalls = filtered.filter((j) => j.jobType === "video_generate").length;
  const videoEdits = filtered.filter((j) => j.jobType === "video_edit").length;

  return {
    textCalls,
    imageCalls,
    videoCalls,
    videoEdits,
    totalCalls: textCalls + imageCalls + videoCalls + videoEdits,
  };
}