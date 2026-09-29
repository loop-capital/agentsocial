/**
 * Publishing layer — shared types.
 *
 * Platform → provider routing lives in ./index.ts. Composio handles most
 * platforms; Zernio handles Google Business Profile (no Composio toolkit).
 */

export type PublishProvider = "composio" | "zernio";

export interface PublishMedia {
  type: "image" | "video";
  url: string;
}

export interface PublishChannel {
  id: string;
  platform: string;
  name: string;
  accountId: string;
  settings: Record<string, unknown>;
}

export interface PublishInput {
  brandId: string;
  channel: PublishChannel;
  content: string;
  media: PublishMedia[];
}

export interface PublishResult {
  platformPostId: string;
  platformPostUrl: string;
  /** Values discovered during publishing that should be cached on channel.settings. */
  settingsPatch?: Record<string, unknown>;
}

/**
 * Thrown for problems retrying can't fix (unsupported media, missing config,
 * over character limit). The worker fails the channel immediately instead of
 * burning retries.
 */
export class PublishValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublishValidationError";
  }
}

/** Per-platform text limits used for pre-schedule validation. */
export const PLATFORM_LIMITS: Record<string, { text: number; media: "optional" | "required" | "none" }> = {
  twitter: { text: 280, media: "optional" },
  linkedin: { text: 3000, media: "optional" },
  facebook: { text: 63206, media: "optional" },
  instagram: { text: 2200, media: "required" },
  tiktok: { text: 2200, media: "required" },
  youtube: { text: 5000, media: "required" },
  pinterest: { text: 800, media: "required" },
  gbp: { text: 1500, media: "optional" },
};
