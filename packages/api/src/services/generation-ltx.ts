/**
 * LTX Video + ID-LoRA Provider — RunPod serverless GPU for identity-preserving video
 *
 * Provides:
 *   - Text-to-video and image-to-video via LTX-2.3-distilled
 *   - Lipsync video via LTX-2.3-lipsync
 *   - Avatar video with identity + voice preservation via ID-LoRA
 *   - IC-LoRA training per person (one-time, reusable)
 *
 * All inference runs on RunPod serverless A100 GPUs ($0.99/hr).
 * Job polling uses RunPod's async job ID system.
 *
 * Environment:
 *   RUNPOD_API_KEY       — RunPod API key (required)
 *   RUNPOD_LTX_ENDPOINT — Custom RunPod serverless endpoint URL (optional)
 */

// ─── Configuration ──────────────────────────────────────────────────────────

const RUNPOD_API_KEY = () => process.env.RUNPOD_API_KEY || "";
const RUNPOD_LTX_ENDPOINT = () =>
  process.env.RUNPOD_LTX_ENDPOINT ||
  "https://api.runpod.ai/v2/ltx-video";

const DEFAULT_GPU = "A100";
const DEFAULT_MODEL = "ltx-2.3-distilled";
const LIPSYNC_MODEL = "ltx-2.3-lipsync";
const AVATAR_MODEL = "ltx-avatar-id-lora";
const TRAIN_MODEL = "ltx-avatar-train";

// Cost per second of GPU time on A100 ($0.99/hr ≈ $0.000275/sec)
const A100_COST_PER_SEC = 0.99 / 3600;

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LTXVideoRequest {
  prompt: string;
  model?: string;                // default: "ltx-2.3-distilled"
  aspectRatio?: string;          // "16:9" | "9:16" | "1:1" | "4:5"
  duration?: number;              // seconds (1-10)
  resolution?: string;           // "720p" | "1080p"
  referenceImageUrl?: string;    // for image-to-video
  negativePrompt?: string;
  brandId: string;
  userId: string;
}

export interface LTXAvatarRequest {
  referenceImages: string[];      // 3-5 photos of the person
  referenceAudio: string;         // 5+ second voice clip URL
  prompt: string;                 // what they should say/do
  icLoraId?: string;              // pre-trained IC-LoRA for the person
  voiceIdentity?: boolean;        // whether to use ID-LoRA for voice matching (default true)
  aspectRatio?: string;           // "16:9" | "9:16" | "1:1" | "4:5"
  duration?: number;              // seconds
  resolution?: string;            // "720p" | "1080p"
  model?: string;                 // default: "ltx-avatar-id-lora"
  brandId: string;
  userId: string;
}

export interface LTXAvatarTrainRequest {
  referenceImages: string[];      // 3-10 photos of the person
  referenceAudio?: string;        // voice sample URL (optional, for voice LoRA)
  personName: string;
  personDescription?: string;    // e.g. "female, 30s, shoulder-length brown hair"
  brandId: string;
  userId: string;
}

export interface LTXAvatarTrainResponse {
  avatarId: string;               // reusable IC-LoRA ID for future generations
  status: "training" | "complete" | "failed";
  model: string;
  cost: { amountUsd: number };
}

export interface LTXJobStatus {
  jobId: string;
  status: "processing" | "complete" | "failed";
  model: string;
  provider: "ltx";
  videos?: Array<{ url: string; mimeType: string }>;
  error?: string;
  cost?: { amountUsd: number };
  avatarId?: string;              // present for training jobs
}

// ─── Cost Estimation ────────────────────────────────────────────────────────

/** Estimate GPU time and cost for a given LTX model + params */
export function estimateLTXCost(
  model: string,
  params?: { duration?: number; resolution?: string }
): { amountUsd: number; gpuSeconds: number } {
  // Approximate generation times based on model and settings
  const duration = params?.duration || 5;

  // Base GPU seconds by model
  const gpuTimeMap: Record<string, number> = {
    "ltx-2.3-distilled": 30,       // ~30s GPU for 5s video
    "ltx-2.3-lipsync": 60,         // ~60s GPU for lipsync
    "ltx-avatar-id-lora": 90,       // ~90s GPU for avatar+voice
    "ltx-avatar-train": 600,       // ~10min GPU for training
  };

  let gpuSeconds = gpuTimeMap[model] || 30;

  // Scale with requested duration
  if (model !== "ltx-avatar-train") {
    gpuSeconds = Math.round(gpuSeconds * (duration / 5));
  }

  // Higher resolution costs more
  if (params?.resolution === "1080p") {
    gpuSeconds = Math.round(gpuSeconds * 1.5);
  }

  const amountUsd = Math.round(gpuSeconds * A100_COST_PER_SEC * 100) / 100;

  return { amountUsd, gpuSeconds };
}

// ─── RunPod Job Management ──────────────────────────────────────────────────

interface RunPodRequest {
  input: Record<string, any>;
  model?: string;
}

/** Submit a job to RunPod serverless endpoint */
async function submitRunPodJob(request: RunPodRequest): Promise<string> {
  const apiKey = RUNPOD_API_KEY();
  if (!apiKey) throw new Error("RUNPOD_API_KEY is not configured");

  const endpoint = RUNPOD_LTX_ENDPOINT();

  const res = await fetch(`${endpoint}/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`RunPod job submission failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const jobId = data.id || data.jobId;

  if (!jobId) {
    throw new Error(`RunPod returned no job ID: ${JSON.stringify(data).slice(0, 500)}`);
  }

  return jobId;
}

/** Poll a RunPod job for status */
async function pollRunPodJob(jobId: string): Promise<{
  status: "processing" | "complete" | "failed";
  output?: any;
  error?: string;
}> {
  const apiKey = RUNPOD_API_KEY();
  if (!apiKey) throw new Error("RUNPOD_API_KEY is not configured");

  const endpoint = RUNPOD_LTX_ENDPOINT();

  const res = await fetch(`${endpoint}/status/${jobId}`, {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
  });

  if (!res.ok) {
    throw new Error(`RunPod job poll failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();

  // RunPod status: IN_QUEUE, RUNNING, COMPLETED, FAILED, CANCELLED
  const status = data.status;
  if (status === "COMPLETED") {
    return { status: "complete", output: data.output };
  }
  if (status === "FAILED" || status === "CANCELLED") {
    return { status: "failed", error: data.error || data.message || "RunPod job failed" };
  }
  // IN_QUEUE or RUNNING
  return { status: "processing" };
}

// ─── LTX Video Generation ────────────────────────────────────────────────────

/** Generate video using LTX-2.3 (text-to-video or image-to-video) */
export async function generateLTXVideo(req: LTXVideoRequest): Promise<{
  jobId: string;
  status: "processing" | "complete" | "failed";
  model: string;
  provider: "ltx";
  cost: { amountUsd: number };
}> {
  const model = req.model || DEFAULT_MODEL;
  const costEstimate = estimateLTXCost(model, {
    duration: req.duration,
    resolution: req.resolution,
  });

  const input: Record<string, any> = {
    prompt: req.prompt,
    model,
    gpu: DEFAULT_GPU,
  };

  if (req.aspectRatio) input.aspect_ratio = req.aspectRatio;
  if (req.duration) input.duration = req.duration;
  if (req.resolution) input.resolution = req.resolution;
  if (req.referenceImageUrl) input.image_url = req.referenceImageUrl;
  if (req.negativePrompt) input.negative_prompt = req.negativePrompt;

  const runpodJobId = await submitRunPodJob({ input });

  return {
    jobId: `ltx-${runpodJobId}`,
    status: "processing",
    model,
    provider: "ltx",
    cost: { amountUsd: costEstimate.amountUsd },
  };
}

// ─── LTX Avatar Video Generation ─────────────────────────────────────────────

/** Generate avatar video with identity + voice preservation */
export async function generateLTXAvatarVideo(req: LTXAvatarRequest): Promise<{
  jobId: string;
  status: "processing" | "complete" | "failed";
  model: string;
  provider: "ltx";
  cost: { amountUsd: number };
}> {
  const model = req.model || AVATAR_MODEL;
  const costEstimate = estimateLTXCost(model, {
    duration: req.duration,
    resolution: req.resolution,
  });

  if (!req.referenceImages || req.referenceImages.length < 3) {
    throw new Error("At least 3 reference images are required for avatar video generation");
  }
  if (!req.referenceAudio) {
    throw new Error("Reference audio is required for avatar video generation");
  }

  const input: Record<string, any> = {
    task: "avatar_generate",
    model,
    gpu: DEFAULT_GPU,
    reference_images: req.referenceImages,
    reference_audio: req.referenceAudio,
    prompt: req.prompt,
    voice_identity: req.voiceIdentity !== false, // default true
  };

  if (req.icLoraId) input.ic_lora_id = req.icLoraId;
  if (req.aspectRatio) input.aspect_ratio = req.aspectRatio;
  if (req.duration) input.duration = req.duration;
  if (req.resolution) input.resolution = req.resolution;

  const runpodJobId = await submitRunPodJob({ input });

  return {
    jobId: `ltx-${runpodJobId}`,
    status: "processing",
    model,
    provider: "ltx",
    cost: { amountUsd: costEstimate.amountUsd },
  };
}

// ─── LTX IC-LoRA Training ─────────────────────────────────────────────────────

/** Train an IC-LoRA for a specific person (one-time, reusable) */
export async function trainLTXAvatar(req: LTXAvatarTrainRequest): Promise<LTXAvatarTrainResponse> {
  const costEstimate = estimateLTXCost(TRAIN_MODEL);

  if (!req.referenceImages || req.referenceImages.length < 3) {
    throw new Error("At least 3 reference images are required for avatar training");
  }
  if (!req.personName) {
    throw new Error("Person name is required for avatar training");
  }

  const input: Record<string, any> = {
    task: "avatar_train",
    model: TRAIN_MODEL,
    gpu: DEFAULT_GPU,
    reference_images: req.referenceImages,
    person_name: req.personName,
  };

  if (req.referenceAudio) input.reference_audio = req.referenceAudio;
  if (req.personDescription) input.person_description = req.personDescription;

  const runpodJobId = await submitRunPodJob({ input });

  // The avatarId is derived from the job — user will poll for the final IC-LoRA ID
  const avatarId = `ic-lora-${req.personName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

  return {
    avatarId,
    status: "training",
    model: TRAIN_MODEL,
    cost: { amountUsd: costEstimate.amountUsd },
  };
}

// ─── LTX Job Status Polling ───────────────────────────────────────────────────

/** Poll an LTX job for status (works for both generation and training) */
export async function getLTXJobStatus(jobId: string): Promise<LTXJobStatus> {
  // Extract RunPod job ID from composite jobId
  const runpodJobId = jobId.replace(/^ltx-/, "");

  const result = await pollRunPodJob(runpodJobId);

  const costEstimate = estimateLTXCost("ltx-2.3-distilled"); // rough estimate for polling

  if (result.status === "complete") {
    const output = result.output || {};
    const videos: Array<{ url: string; mimeType: string }> = [];

    // Extract video URLs from RunPod output
    if (output.video_url) {
      videos.push({ url: output.video_url, mimeType: "video/mp4" });
    } else if (output.videos) {
      for (const v of output.videos) {
        videos.push({
          url: typeof v === "string" ? v : v.url,
          mimeType: typeof v === "string" ? "video/mp4" : (v.mime_type || "video/mp4"),
        });
      }
    } else if (output.url) {
      videos.push({ url: output.url, mimeType: "video/mp4" });
    }

    // Training jobs return an IC-LoRA ID
    const avatarId = output.ic_lora_id || output.avatar_id;

    return {
      jobId,
      status: "complete",
      model: output.model || "ltx-2.3-distilled",
      provider: "ltx",
      videos: videos.length > 0 ? videos : undefined,
      avatarId,
      cost: { amountUsd: costEstimate.amountUsd },
    };
  }

  if (result.status === "failed") {
    return {
      jobId,
      status: "failed",
      model: "ltx",
      provider: "ltx",
      error: result.error || "LTX generation failed",
    };
  }

  return {
    jobId,
    status: "processing",
    model: "ltx",
    provider: "ltx",
  };
}

// ─── LTX Video Edit (via RunPod) ──────────────────────────────────────────────

/** Edit video using LTX on RunPod */
export async function editLTXVideo(req: {
  videoUrl: string;
  prompt: string;
  model?: string;
  negativePrompt?: string;
  brandId: string;
  userId: string;
}): Promise<{
  jobId: string;
  status: "processing" | "complete" | "failed";
  model: string;
  provider: "ltx";
  cost: { amountUsd: number };
}> {
  const model = req.model || DEFAULT_MODEL;
  const costEstimate = estimateLTXCost(model);

  const input: Record<string, any> = {
    task: "video_edit",
    model,
    gpu: DEFAULT_GPU,
    video_url: req.videoUrl,
    prompt: req.prompt,
  };

  if (req.negativePrompt) input.negative_prompt = req.negativePrompt;

  const runpodJobId = await submitRunPodJob({ input });

  return {
    jobId: `ltx-${runpodJobId}`,
    status: "processing",
    model,
    provider: "ltx",
    cost: { amountUsd: costEstimate.amountUsd },
  };
}

// ─── LTX Model Catalog ────────────────────────────────────────────────────────

/** LTX-specific model info for catalog listing */
export const LTX_MODELS = [
  {
    id: "ltx-2.3-distilled",
    name: "LTX Video 2.3 Distilled",
    category: "text-to-video",
    provider: "ltx" as const,
    description: "Fast text-to-video and image-to-video generation. Distilled for quick inference.",
  },
  {
    id: "ltx-2.3-lipsync",
    name: "LTX Video 2.3 Lipsync",
    category: "lipsync",
    provider: "ltx" as const,
    description: "Lipsync video generation from face image + audio.",
  },
  {
    id: "ltx-avatar-id-lora",
    name: "LTX Avatar ID-LoRA",
    category: "avatar-video",
    provider: "ltx" as const,
    description: "Identity-preserving avatar video with voice matching. Requires reference photos + audio.",
  },
  {
    id: "ltx-avatar-train",
    name: "LTX Avatar IC-LoRA Training",
    category: "avatar-training",
    provider: "ltx" as const,
    description: "Train an IC-LoRA for a specific person. One-time training, reusable across videos.",
  },
];