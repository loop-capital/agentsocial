/**
 * Publishing router.
 *
 * Decides which provider publishes a channel's post. Defaults keep Zernio to
 * Google Business Profile only (Zernio bills per account past the free 2).
 *
 * Overrides, most specific first:
 *   1. channel.settings.provider         ("composio" | "zernio")
 *   2. env PUBLISH_PROVIDER_<PLATFORM>   e.g. PUBLISH_PROVIDER_TIKTOK=zernio
 *   3. DEFAULT_PROVIDER below
 */

import { publishViaComposio } from "./composio-publisher.js";
import { publishViaZernio } from "./zernio-publisher.js";
import {
  PLATFORM_LIMITS,
  PublishValidationError,
  type PublishInput,
  type PublishProvider,
  type PublishResult,
} from "./types.js";

export * from "./types.js";

export const DEFAULT_PROVIDER: Record<string, PublishProvider> = {
  instagram: "composio",
  facebook: "composio",
  linkedin: "composio",
  twitter: "composio",
  tiktok: "composio",
  pinterest: "composio",
  youtube: "composio",
  gbp: "zernio",
};

export function providerFor(platform: string, settings: Record<string, unknown> = {}): PublishProvider {
  const fromChannel = settings.provider;
  if (fromChannel === "composio" || fromChannel === "zernio") return fromChannel;

  const fromEnv = process.env[`PUBLISH_PROVIDER_${platform.toUpperCase()}`];
  if (fromEnv === "composio" || fromEnv === "zernio") return fromEnv;

  return DEFAULT_PROVIDER[platform] ?? "composio";
}

/** True when the channel has credentials for the provider router (vs. legacy tokens). */
export function usesProviderRouter(platform: string, settings: Record<string, unknown> = {}): boolean {
  const provider = providerFor(platform, settings);
  return provider === "composio"
    ? Boolean(settings.composio_account_id)
    : Boolean(settings.zernio_account_id);
}

/** Validate content against platform limits before scheduling. Returns error strings. */
export function validateForPlatform(platform: string, content: string, mediaCount: number): string[] {
  const limits = PLATFORM_LIMITS[platform];
  if (!limits) return [];
  const errors: string[] = [];
  if (content.length > limits.text) {
    errors.push(`${platform}: text is ${content.length} characters (max ${limits.text})`);
  }
  if (limits.media === "required" && mediaCount === 0) {
    errors.push(`${platform}: requires an image or video`);
  }
  return errors;
}

export async function publishToChannel(input: PublishInput): Promise<PublishResult & { provider: PublishProvider }> {
  const errs = validateForPlatform(input.channel.platform, input.content, input.media.length);
  if (errs.length) throw new PublishValidationError(errs.join("; "));

  const provider = providerFor(input.channel.platform, input.channel.settings);
  const result =
    provider === "zernio" ? await publishViaZernio(input) : await publishViaComposio(input);
  return { ...result, provider };
}
