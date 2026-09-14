/**
 * PLEIJ Stylist Avatar Pipeline — Staff-specific video generation with identity + voice
 *
 * Maps PLEIJ salon staff to their trained IC-LoRA IDs and reference media.
 * Provides high-level functions for:
 *   - Creating stylist reference profiles (photos + voice)
 *   - Generating staff-specific avatar videos
 *   - Listing available stylist profiles
 *
 * This module sits above the LTX generation provider and manages the
 * person-to-avatar mapping for PLEIJ salon content creation.
 */

import {
  trainLTXAvatar,
  generateLTXAvatarVideo,
  getLTXJobStatus,
  type LTXAvatarTrainResponse,
  type LTXJobStatus,
} from "./generation-ltx.js";

// ─── Stylist Map ──────────────────────────────────────────────────────────────

export interface StylistProfile {
  /** Unique avatar ID (IC-LoRA ID after training) */
  avatarId?: string;
  /** Display name */
  name: string;
  /** Role at the salon */
  role: string;
  /** Description for prompts */
  description?: string;
  /** Reference photo URLs (stored in S3/R2) */
  referenceImages: string[];
  /** Voice sample URL (5+ seconds) */
  referenceAudio?: string;
  /** Training status */
  trainingStatus: "untrained" | "training" | "trained" | "failed";
  /** Training job ID (if currently training) */
  trainingJobId?: string;
  /** When the profile was created */
  createdAt: string;
  /** Last time a video was generated */
  lastGeneratedAt?: string;
}

/**
 * PLEIJ STYLIST_MAP — maps stylist names to their avatar IDs and reference media.
 *
 * Initially populated with placeholder entries. As stylists go through the
 * training pipeline, their avatarId and trainingStatus get updated.
 *
 * In production, this would be stored in the database (stylist_profiles table).
 * For now, we use an in-memory map that can be seeded from env/config.
 */
const stylistProfiles = new Map<string, StylistProfile>();

/** Seed initial PLEIJ stylist data */
function seedStylists(): void {
  const defaults: StylistProfile[] = [
    {
      name: "Jessica",
      role: "Senior Stylist & Color Specialist",
      description: "Female, 30s, shoulder-length brown hair, warm smile, professional salon attire",
      referenceImages: [],
      trainingStatus: "untrained",
      createdAt: new Date().toISOString(),
    },
    {
      name: "Marcus",
      role: "Master Barber",
      description: "Male, 40s, short cropped hair, beard, friendly demeanor",
      referenceImages: [],
      trainingStatus: "untrained",
      createdAt: new Date().toISOString(),
    },
    {
      name: "Aisha",
      role: "Nail Technician & Esthetician",
      description: "Female, 20s, long black hair, expressive, skilled hands",
      referenceImages: [],
      trainingStatus: "untrained",
      createdAt: new Date().toISOString(),
    },
    {
      name: "Carlos",
      role: "Salon Manager & Stylist",
      description: "Male, 35, neat fade, professional, welcoming presence",
      referenceImages: [],
      trainingStatus: "untrained",
      createdAt: new Date().toISOString(),
    },
  ];

  for (const stylist of defaults) {
    stylistProfiles.set(stylist.name.toLowerCase(), stylist);
  }
}

// Auto-seed on module load
seedStylists();

// ─── Stylist Profile Management ──────────────────────────────────────────────

/** Create a new stylist profile with reference photos + voice */
export async function createStylistProfile(params: {
  name: string;
  role: string;
  description?: string;
  referenceImages: string[];
  referenceAudio?: string;
  brandId: string;
  userId: string;
}): Promise<StylistProfile> {
  const key = params.name.toLowerCase().replace(/\s+/g, "-");

  const profile: StylistProfile = {
    name: params.name,
    role: params.role,
    description: params.description,
    referenceImages: params.referenceImages,
    referenceAudio: params.referenceAudio,
    trainingStatus: "untrained",
    createdAt: new Date().toISOString(),
  };

  stylistProfiles.set(key, profile);

  // If we have reference images + audio, auto-train the IC-LoRA
  if (params.referenceImages.length >= 3 && params.referenceAudio) {
    try {
      const trainResult = await trainLTXAvatar({
        referenceImages: params.referenceImages,
        referenceAudio: params.referenceAudio,
        personName: params.name,
        personDescription: params.description,
        brandId: params.brandId,
        userId: params.userId,
      });

      profile.trainingStatus = "training";
      profile.trainingJobId = trainResult.avatarId;
      profile.avatarId = trainResult.avatarId;

      stylistProfiles.set(key, profile);
    } catch (err: any) {
      // Training failed — profile still created but marked as untrained
      profile.trainingStatus = "failed";
      stylistProfiles.set(key, profile);
    }
  }

  return profile;
}

/** List all PLEIJ stylist profiles */
export function listStylistProfiles(): StylistProfile[] {
  return Array.from(stylistProfiles.values());
}

/** Get a specific stylist profile by name */
export function getStylistProfile(name: string): StylistProfile | undefined {
  return stylistProfiles.get(name.toLowerCase());
}

/** Update a stylist profile (e.g., after training completes) */
export function updateStylistProfile(name: string, updates: Partial<StylistProfile>): StylistProfile | undefined {
  const key = name.toLowerCase();
  const profile = stylistProfiles.get(key);
  if (!profile) return undefined;

  Object.assign(profile, updates);
  stylistProfiles.set(key, profile);
  return profile;
}

// ─── Stylist Video Generation ─────────────────────────────────────────────────

/** Generate a video for a specific stylist using their trained avatar */
export async function generateStylistVideo(params: {
  stylistName: string;
  prompt: string;
  aspectRatio?: string;
  duration?: number;
  resolution?: string;
  brandId: string;
  userId: string;
}): Promise<{
  jobId: string;
  status: "processing" | "complete" | "failed";
  model: string;
  provider: "ltx";
  cost: { amountUsd: number };
  stylistName: string;
}> {
  const profile = stylistProfiles.get(params.stylistName.toLowerCase());

  if (!profile) {
    throw new Error(`Stylist "${params.stylistName}" not found. Available: ${Array.from(stylistProfiles.keys()).join(", ")}`);
  }

  if (profile.trainingStatus !== "trained" || !profile.avatarId) {
    throw new Error(
      `Stylist "${params.stylistName}" is not yet trained (status: ${profile.trainingStatus}). ` +
      `Train their avatar first using createStylistProfile or trainStylistAvatar.`
    );
  }

  if (!profile.referenceAudio) {
    throw new Error(`Stylist "${params.stylistName}" has no reference audio on file.`);
  }

  const result = await generateLTXAvatarVideo({
    referenceImages: profile.referenceImages,
    referenceAudio: profile.referenceAudio,
    prompt: params.prompt,
    icLoraId: profile.avatarId,
    voiceIdentity: true,
    aspectRatio: params.aspectRatio || "9:16",
    duration: params.duration || 15,
    resolution: params.resolution || "720p",
    brandId: params.brandId,
    userId: params.userId,
  });

  // Update last generated timestamp
  updateStylistProfile(params.stylistName, {
    lastGeneratedAt: new Date().toISOString(),
  });

  return {
    ...result,
    stylistName: profile.name,
  };
}

/** Check the training status of a stylist's avatar */
export async function checkStylistTrainingStatus(stylistName: string): Promise<{
  stylistName: string;
  trainingStatus: StylistProfile["trainingStatus"];
  avatarId?: string;
  jobStatus?: LTXJobStatus;
}> {
  const profile = stylistProfiles.get(stylistName.toLowerCase());

  if (!profile) {
    throw new Error(`Stylist "${stylistName}" not found.`);
  }

  const result: any = {
    stylistName: profile.name,
    trainingStatus: profile.trainingStatus,
    avatarId: profile.avatarId,
  };

  // If currently training, poll for the latest status
  if (profile.trainingStatus === "training" && profile.trainingJobId) {
    try {
      const jobStatus = await getLTXJobStatus(profile.trainingJobId);
      result.jobStatus = jobStatus;

      if (jobStatus.status === "complete" && jobStatus.avatarId) {
        // Training completed — update the profile
        profile.avatarId = jobStatus.avatarId;
        profile.trainingStatus = "trained";
        stylistProfiles.set(stylistName.toLowerCase(), profile);
        result.trainingStatus = "trained";
        result.avatarId = jobStatus.avatarId;
      } else if (jobStatus.status === "failed") {
        profile.trainingStatus = "failed";
        stylistProfiles.set(stylistName.toLowerCase(), profile);
        result.trainingStatus = "failed";
      }
    } catch {
      // Polling failed — return current status
    }
  }

  return result;
}

// ─── STYLIST_MAP Integration ─────────────────────────────────────────────────
//
// This connects to the existing STYLIST_MAP used by the voice agent.
// The voice agent references stylists by name for scheduling and call routing.
// This module extends that with avatar generation capabilities.
//
// Usage from voice agent:
//   import { getStylistProfile, generateStylistVideo } from "./pleij-avatars.js";
//   const jessica = getStylistProfile("jessica");
//   if (jessica?.trainingStatus === "trained") {
//     const video = await generateStylistVideo({ ... });
//   }