/**
 * Generation MCP Server — MCP adapter for AgentSocial Generation Service
 *
 * Exposes image, video, voice, avatar, and cost estimation as MCP tools
 * so SiteFlow and other MCP clients can call generation without knowing
 * REST endpoints, API keys, or provider details.
 *
 * Architecture:
 *   SiteFlow agent → mcporter → this server (stdio) → GenerationService → muapi/ltx/gemini
 *
 * The server reads from the same env vars as the main API:
 *   - MUAPI_API_KEY
 *   - MUAPI_BASE_URL (default: https://api.muapi.ai)
 *   - GEMINI_API_KEY
 *   - RUNPOD_API_KEY
 *   - RUNPOD_LTX_ENDPOINT
 *   - GENERATION_DEFAULT_PROVIDER (default: muapi)
 *
 * Usage:
 *   npx tsx packages/api/src/mcp/generation-mcp-server.ts
 *
 * Or add to mcporter.json:
 *   {
 *     "mcpServers": {
 *       "agentsocial-generation": {
 *         "command": "npx",
 *         "args": ["tsx", "packages/api/src/mcp/generation-mcp-server.ts"],
 *         "cwd": "/home/jason/.openclaw/workspaces/agentsocial"
 *       }
 *     }
 *   }
 */

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");

import {
  createGenerationService,
  SALON_MODEL_RECOMMENDATIONS,
  PROVIDER_COST_ESTIMATES,
  type GenerationProvider,
  type GenerationService,
} from "../services/generation.js";

// ─── Tool Definitions ─────────────────────────────────────────────────────

const GENERATE_IMAGE_TOOL = {
  name: "generate_image",
  description:
    "Generate an image from a text prompt. Supports muapi (200+ models) and Gemini providers. " +
    "Returns image URLs or base64 data. Default model: nano-banana (fast, cheap). " +
    "Use 'salon-photo' style for PLEIJ brand content.",
  inputSchema: {
    type: "object" as const,
    properties: {
      prompt: { type: "string", description: "Text description of the image to generate (max 8000 chars)" },
      model: { type: "string", description: "Model ID. Defaults to nano-banana. See list_models for options." },
      provider: { type: "string", enum: ["muapi", "gemini", "ltx"], description: "Provider. Defaults to muapi." },
      aspectRatio: { type: "string", enum: ["1:1", "3:4", "4:3", "9:16", "16:9"], description: "Image aspect ratio. Default: 1:1" },
      numberOfImages: { type: "number", minimum: 1, maximum: 4, description: "Number of images to generate (1-4). Default: 1" },
      negativePrompt: { type: "string", description: "What to avoid in the image (max 1000 chars)" },
      brandId: { type: "string", description: "Brand ID for tracking. Required." },
    },
    required: ["prompt", "brandId"],
  },
};

const GENERATE_VIDEO_TOOL = {
  name: "generate_video",
  description:
    "Generate a video from a text prompt. Async — returns a jobId for polling. " +
    "Supports muapi (seedance, kling, etc.) and LTX (ID-LoRA avatar videos). " +
    "Use '9:16' for Reels/TikTok, '16:9' for YouTube, '1:1' for grid posts.",
  inputSchema: {
    type: "object" as const,
    properties: {
      prompt: { type: "string", description: "Text description of the video (max 8000 chars)" },
      model: { type: "string", description: "Model ID. Defaults to seedance-2.0 for muapi, ltx-2.3 for LTX." },
      provider: { type: "string", enum: ["muapi", "gemini", "ltx"], description: "Provider. Defaults to muapi." },
      aspectRatio: { type: "string", enum: ["16:9", "9:16", "1:1", "4:5"], description: "Video aspect ratio. Default: 9:16" },
      duration: { type: "number", minimum: 1, maximum: 120, description: "Video duration in seconds" },
      resolution: { type: "string", enum: ["720p", "1080p", "4K"], description: "Resolution. Default: 720p" },
      negativePrompt: { type: "string", description: "What to avoid in the video" },
      referenceImageUrl: { type: "string", description: "URL of reference image for image-to-video" },
      personGeneration: { type: "string", enum: ["allow_all", "allow_adult"], description: "Person generation policy" },
      style: { type: "string", enum: ["social-short", "cinematic", "promotional", "tutorial"], description: "Pre-defined style preset" },
      mood: { type: "string", enum: ["upbeat", "professional", "cozy", "exciting"], description: "Mood preset" },
      brandId: { type: "string", description: "Brand ID. Required." },
    },
    required: ["prompt", "brandId"],
  },
};

const CHECK_VIDEO_JOB_TOOL = {
  name: "check_video_job",
  description:
    "Poll a video generation job for status. Returns processing/complete/failed with video URLs when done.",
  inputSchema: {
    type: "object" as const,
    properties: {
      jobId: { type: "string", description: "Job ID returned by generate_video or generate_lipsync" },
      provider: { type: "string", enum: ["muapi", "gemini", "ltx"], description: "Provider used for the job. Default: muapi." },
      brandId: { type: "string", description: "Brand ID. Required." },
    },
    required: ["jobId", "brandId"],
  },
};

const GENERATE_LIPSYNC_TOOL = {
  name: "generate_lipsync",
  description:
    "Generate a talking-head video from a face image + audio. " +
    "13 lipsync models available. Default: kling-v2-avatar-standard ($0.35). " +
    "Cheapest: sync-lipsync, latent-sync, creatify-lipsync ($0.04 each). " +
    "Best quality: kling-v2-avatar-pro ($0.75).",
  inputSchema: {
    type: "object" as const,
    properties: {
      imageUrl: { type: "string", description: "URL of the face image" },
      audioUrl: { type: "string", description: "URL of the audio file (WAV/MP3)" },
      prompt: { type: "string", description: "Optional additional prompt for expressions/motion" },
      model: { type: "string", description: "Lipsync model. Default: kling-v2-avatar-standard" },
      aspectRatio: { type: "string", enum: ["16:9", "9:16", "1:1", "4:5"], description: "Output aspect ratio" },
      brandId: { type: "string", description: "Brand ID. Required." },
    },
    required: ["imageUrl", "audioUrl", "brandId"],
  },
};

const GENERATE_TTS_TOOL = {
  name: "generate_tts",
  description:
    "Generate speech from text. Supports 200+ voices via muapi. " +
    "Use for salon voiceovers, IVR prompts, video narration.",
  inputSchema: {
    type: "object" as const,
    properties: {
      text: { type: "string", description: "Text to convert to speech (max 5000 chars)" },
      voice: { type: "string", description: "Voice ID or name. Default: alloy" },
      model: { type: "string", description: "TTS model. Default: minimax-tts" },
      speed: { type: "number", minimum: 0.5, maximum: 2.0, description: "Speech speed multiplier. Default: 1.0" },
      brandId: { type: "string", description: "Brand ID. Required." },
    },
    required: ["text", "brandId"],
  },
};

const TRAIN_AVATAR_TOOL = {
  name: "train_avatar",
  description:
    "Train an IC-LoRA identity model for a specific person (e.g., PLEIJ stylist). " +
    "One-time training (~$0.50-1.00) creates a reusable model for future avatar videos. " +
    "Requires 3-10 reference images of the person. Returns an avatarId for use in generate_avatar.",
  inputSchema: {
    type: "object" as const,
    properties: {
      referenceImages: {
        type: "array",
        items: { type: "string" },
        description: "URLs of reference photos (3-10 images, varied angles preferred)",
      },
      personName: { type: "string", description: "Name of the person (e.g., 'Jessica Morrison')" },
      personDescription: { type: "string", description: "Brief description (e.g., 'Female, mid-30s, auburn hair, warm smile')" },
      referenceAudio: { type: "string", description: "Optional URL of voice sample for lip sync" },
      brandId: { type: "string", description: "Brand ID. Required." },
    },
    required: ["referenceImages", "personName", "brandId"],
  },
};

const GENERATE_AVATAR_VIDEO_TOOL = {
  name: "generate_avatar_video",
  description:
    "Generate a video using a trained IC-LoRA avatar (from train_avatar). " +
    "Produces consistent identity-preserved videos of a specific person. " +
    "Cheaper than muapi character videos ($0.05-0.15/video vs $1.50/video).",
  inputSchema: {
    type: "object" as const,
    properties: {
      avatarId: { type: "string", description: "IC-LoRA avatar ID from train_avatar" },
      prompt: { type: "string", description: "Video description (e.g., 'Stylist with auburn hair demonstrating balayage technique')" },
      referenceImages: {
        type: "array",
        items: { type: "string" },
        description: "Optional additional reference image URLs",
      },
      referenceAudio: { type: "string", description: "Optional voice audio URL for lip sync" },
      aspectRatio: { type: "string", enum: ["16:9", "9:16", "1:1", "4:5"], description: "Default: 9:16" },
      duration: { type: "number", minimum: 1, maximum: 30, description: "Duration in seconds. Default: 5" },
      resolution: { type: "string", enum: ["720p", "1080p", "4K"], description: "Default: 720p" },
      model: { type: "string", description: "LTX model. Default: ltx-2.3" },
      brandId: { type: "string", description: "Brand ID. Required." },
    },
    required: ["avatarId", "prompt", "brandId"],
  },
};

const CHECK_AVATAR_STATUS_TOOL = {
  name: "check_avatar_status",
  description: "Check IC-LoRA avatar training status. Returns training progress and IC-LoRA ID when complete.",
  inputSchema: {
    type: "object" as const,
    properties: {
      avatarId: { type: "string", description: "Avatar ID from train_avatar" },
    },
    required: ["avatarId"],
  },
};

const CLONE_VOICE_TOOL = {
  name: "clone_voice",
  description:
    "Clone a voice from an audio sample. Creates a reusable voice_id for TTS and lipsync. " +
    "Uses minimax-voice-clone ($0.65) or suno-voice-clone (free preview).",
  inputSchema: {
    type: "object" as const,
    properties: {
      name: { type: "string", description: "Display name for this voice (e.g., 'Jessica PLEIJ')" },
      audioUrl: { type: "string", description: "URL to reference audio (WAV/MP3, 10-30 seconds recommended)" },
      model: { type: "string", enum: ["minimax-voice-clone", "suno-voice-clone"], description: "Default: minimax-voice-clone" },
      description: { type: "string", description: "Optional description of voice characteristics" },
      brandId: { type: "string", description: "Brand ID. Required." },
    },
    required: ["name", "audioUrl", "brandId"],
  },
};

const LIST_MODELS_TOOL = {
  name: "list_models",
  description:
    "List available generation models. Optionally filter by category. " +
    "Categories: text-to-image, text-to-video, image-to-video, image-to-image, " +
    "audio, lipsync, tts, voice-clone, character, video-edit.",
  inputSchema: {
    type: "object" as const,
    properties: {
      category: { type: "string", description: "Filter by category (e.g., 'text-to-video', 'lipsync')" },
    },
  },
};

const ESTIMATE_COST_TOOL = {
  name: "estimate_cost",
  description:
    "Estimate the cost of a generation before running it. Returns USD amount. " +
    "Use this before generate_video or generate_image to preview costs.",
  inputSchema: {
    type: "object" as const,
    properties: {
      model: { type: "string", description: "Model ID (e.g., 'seedance-2.0', 'nano-banana', 'kling-v2-avatar-pro')" },
      provider: { type: "string", enum: ["muapi", "gemini", "ltx"], description: "Provider. Default: muapi." },
      params: { type: "object", description: "Optional params: duration, resolution, aspectRatio for video cost estimation" },
    },
    required: ["model"],
  },
};

const GET_STATUS_TOOL = {
  name: "get_status",
  description:
    "Check generation service health. Shows which providers are configured and available.",
  inputSchema: {
    type: "object" as const,
    properties: {},
  },
};

const GET_RECOMMENDATIONS_TOOL = {
  name: "get_recommendations",
  description:
    "Get salon-optimized model recommendations by use case. Returns the best model for: " +
    "before/after photos, stylist spotlights, tutorials, promotions, and avatar videos.",
  inputSchema: {
    type: "object" as const,
    properties: {},
  },
};

const ALL_TOOLS = [
  GENERATE_IMAGE_TOOL,
  GENERATE_VIDEO_TOOL,
  CHECK_VIDEO_JOB_TOOL,
  GENERATE_LIPSYNC_TOOL,
  GENERATE_TTS_TOOL,
  TRAIN_AVATAR_TOOL,
  GENERATE_AVATAR_VIDEO_TOOL,
  CHECK_AVATAR_STATUS_TOOL,
  CLONE_VOICE_TOOL,
  LIST_MODELS_TOOL,
  ESTIMATE_COST_TOOL,
  GET_STATUS_TOOL,
  GET_RECOMMENDATIONS_TOOL,
];

// ─── Helper ────────────────────────────────────────────────────────────────

function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return JSON.stringify(err);
}

const MCP_USER_ID = "mcp-client";

// ─── Server ────────────────────────────────────────────────────────────────

async function main() {
  // Initialize the generation service (reads env vars)
  const service: GenerationService = createGenerationService({
    defaultProvider: (process.env.GENERATION_DEFAULT_PROVIDER as GenerationProvider) || "muapi",
    muapiApiKey: process.env.MUAPI_API_KEY,
    muapiBaseUrl: process.env.MUAPI_BASE_URL || "https://api.muapi.ai",
    geminiApiKey: process.env.GEMINI_API_KEY,
  });

  const server = new Server(
    {
      name: "agentsocial-generation",
      version: "1.0.0",
    },
    {
      capabilities: { tools: {} },
    },
  );

  // ─── List Tools ────────────────────────────────────────────────────────
  server.setRequestHandler("tools/list", async () => ({
    tools: ALL_TOOLS,
  }));

  // ─── Call Tool ──────────────────────────────────────────────────────────
  server.setRequestHandler("tools/call", async (request: any) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        // ─── Generate Image ──────────────────────────────────────────────
        case "generate_image": {
          const result = await service.generateImage({
            prompt: args!.prompt as string,
            model: args!.model as string | undefined,
            provider: args!.provider as GenerationProvider | undefined,
            aspectRatio: args!.aspectRatio as string | undefined,
            numberOfImages: args!.numberOfImages as number | undefined,
            referenceImages: args!.referenceImages as string[] | undefined,
            negativePrompt: args!.negativePrompt as string | undefined,
            brandId: args!.brandId as string,
            userId: MCP_USER_ID,
          });
          return {
            content: [
              { type: "text" as const, text: JSON.stringify({ provider: result.provider, model: result.model, images: result.images, cost: result.cost }, null, 2) },
            ],
          };
        }

        // ─── Generate Video ──────────────────────────────────────────────
        case "generate_video": {
          const result = await service.generateVideo({
            prompt: args!.prompt as string,
            model: args!.model as string | undefined,
            provider: args!.provider as GenerationProvider | undefined,
            aspectRatio: args!.aspectRatio as string | undefined,
            duration: args!.duration as number | undefined,
            resolution: args!.resolution as string | undefined,
            negativePrompt: args!.negativePrompt as string | undefined,
            referenceImageUrl: args!.referenceImageUrl as string | undefined,
            numberOfVideos: args!.numberOfVideos as number | undefined,
            personGeneration: args!.personGeneration as string | undefined,
            withAudio: args!.withAudio as boolean | undefined,
            style: args!.style as string | undefined,
            mood: args!.mood as string | undefined,
            brandId: args!.brandId as string,
            userId: MCP_USER_ID,
          });
          return {
            content: [
              { type: "text" as const, text: JSON.stringify({ jobId: result.jobId, status: result.status, model: result.model, provider: result.provider, cost: result.cost }, null, 2) },
            ],
          };
        }

        // ─── Check Video Job ─────────────────────────────────────────────
        case "check_video_job": {
          const result = await service.getVideoJobStatus(
            args!.jobId as string,
            args!.brandId as string,
            args!.provider as GenerationProvider | undefined,
          );
          return {
            content: [
              { type: "text" as const, text: JSON.stringify(result, null, 2) },
            ],
          };
        }

        // ─── Generate Lipsync ────────────────────────────────────────────
        case "generate_lipsync": {
          const model = (args!.model as string) || "kling-v2-avatar-standard";
          const result = await service.generateLipsyncVideo({
            imageUrl: args!.imageUrl as string,
            audioUrl: args!.audioUrl as string,
            prompt: args!.prompt as string | undefined,
            model,
            aspectRatio: args!.aspectRatio as string | undefined,
            brandId: args!.brandId as string,
            userId: MCP_USER_ID,
          });
          return {
            content: [
              { type: "text" as const, text: JSON.stringify({ jobId: result.jobId, status: result.status, model: result.model, provider: result.provider, cost: result.cost }, null, 2) },
            ],
          };
        }

        // ─── Generate TTS ────────────────────────────────────────────────
        case "generate_tts": {
          const result = await service.generateTTS({
            text: args!.text as string,
            voice: args!.voice as string | undefined,
            model: args!.model as string | undefined,
            speed: args!.speed as number | undefined,
            brandId: args!.brandId as string,
            userId: MCP_USER_ID,
          });
          return {
            content: [
              { type: "text" as const, text: JSON.stringify({ audioUrl: result.audioUrl, duration: result.duration, model: result.model, provider: result.provider, cost: result.cost }, null, 2) },
            ],
          };
        }

        // ─── Train Avatar ────────────────────────────────────────────────
        case "train_avatar": {
          const result = await service.trainAvatar({
            referenceImages: args!.referenceImages as string[],
            referenceAudio: args!.referenceAudio as string | undefined,
            personName: args!.personName as string,
            personDescription: args!.personDescription as string | undefined,
            brandId: args!.brandId as string,
            userId: MCP_USER_ID,
          });
          return {
            content: [
              { type: "text" as const, text: JSON.stringify({ avatarId: result.avatarId, status: result.status, model: result.model, cost: result.cost }, null, 2) },
            ],
          };
        }

        // ─── Generate Avatar Video ───────────────────────────────────────
        case "generate_avatar_video": {
          const result = await service.generateAvatarVideo({
            referenceImages: args!.referenceImages as string[] | undefined,
            referenceAudio: args!.referenceAudio as string | undefined,
            prompt: args!.prompt as string,
            icLoraId: args!.avatarId as string,
            voiceIdentity: args!.voiceIdentity as string | undefined,
            aspectRatio: args!.aspectRatio as string | undefined,
            duration: args!.duration as number | undefined,
            resolution: args!.resolution as string | undefined,
            model: args!.model as string | undefined,
            brandId: args!.brandId as string,
            userId: MCP_USER_ID,
          });
          return {
            content: [
              { type: "text" as const, text: JSON.stringify({ jobId: result.jobId, status: result.status, model: result.model, provider: "ltx", cost: result.cost }, null, 2) },
            ],
          };
        }

        // ─── Check Avatar Status ─────────────────────────────────────────
        case "check_avatar_status": {
          const result = await service.getAvatarTrainingStatus(args!.avatarId as string);
          return {
            content: [
              { type: "text" as const, text: JSON.stringify(result, null, 2) },
            ],
          };
        }

        // ─── Clone Voice ─────────────────────────────────────────────────
        case "clone_voice": {
          const result = await service.cloneVoice({
            name: args!.name as string,
            audioUrl: args!.audioUrl as string,
            model: args!.model as "minimax-voice-clone" | "suno-voice-clone" | undefined,
            description: args!.description as string | undefined,
            brandId: args!.brandId as string,
            userId: MCP_USER_ID,
          });
          return {
            content: [
              { type: "text" as const, text: JSON.stringify({ voiceId: result.voiceId, name: result.name, model: result.model, cost: result.cost }, null, 2) },
            ],
          };
        }

        // ─── List Models ─────────────────────────────────────────────────
        case "list_models": {
          const models = await service.listModels(args!.category as string | undefined);
          return {
            content: [
              { type: "text" as const, text: JSON.stringify({ models, total: models.length }, null, 2) },
            ],
          };
        }

        // ─── Estimate Cost ──────────────────────────────────────────────
        case "estimate_cost": {
          const estimate = await service.estimateCost(
            args!.model as string,
            args!.params as Record<string, unknown> | undefined,
          );
          return {
            content: [
              { type: "text" as const, text: JSON.stringify({ model: args!.model, estimatedCostUsd: estimate.amountUsd, dynamicPricing: estimate.dynamic }, null, 2) },
            ],
          };
        }

        // ─── Get Status ─────────────────────────────────────────────────
        case "get_status": {
          const muapiKey = process.env.MUAPI_API_KEY;
          const geminiKey = process.env.GEMINI_API_KEY;
          const runpodKey = process.env.RUNPOD_API_KEY;
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  defaultProvider: process.env.GENERATION_DEFAULT_PROVIDER || "muapi",
                  providers: {
                    muapi: { configured: !!muapiKey, baseUrl: process.env.MUAPI_BASE_URL || "https://api.muapi.ai", modelsAvailable: "200+" },
                    gemini: { configured: !!geminiKey, note: "Free tier with rate limits" },
                    ltx: { configured: !!runpodKey, endpoint: process.env.RUNPOD_LTX_ENDPOINT || "https://api.runpod.ai/v2/ltx-video", gpu: "A100", costPerHour: 0.99 },
                  },
                }, null, 2),
              },
            ],
          };
        }

        // ─── Get Recommendations ────────────────────────────────────────
        case "get_recommendations": {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  recommendations: SALON_MODEL_RECOMMENDATIONS,
                  pricing: Object.fromEntries(
                    Object.entries(PROVIDER_COST_ESTIMATES).map(([model, cost]) => [
                      model,
                      { min: cost.min, max: cost.max, unit: cost.unit },
                    ]),
                  ),
                }, null, 2),
              },
            ],
          };
        }

        default:
          return {
            content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
            isError: true,
          };
      }
    } catch (err: unknown) {
      const message = formatError(err);
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: message, tool: name }) }],
        isError: true,
      };
    }
  });

  // ─── Start ──────────────────────────────────────────────────────────────
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AgentSocial Generation MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});