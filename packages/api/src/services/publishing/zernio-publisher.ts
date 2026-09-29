/**
 * Zernio publisher — Google Business Profile (no Composio toolkit).
 *
 * Kept deliberately small: only platforms Composio cannot reach should route
 * here, because Zernio bills per connected account beyond the free 2.
 */

import { createPost } from "../zernio.js";
import { PublishValidationError, type PublishInput, type PublishResult } from "./types.js";

const ZERNIO_PLATFORM: Record<string, string> = {
  gbp: "googlebusiness",
  tiktok: "tiktok", // only when a channel is overridden to provider "zernio"
};

export async function publishViaZernio(input: PublishInput): Promise<PublishResult> {
  const { channel, content, media } = input;
  const platform = ZERNIO_PLATFORM[channel.platform];
  if (!platform) {
    throw new PublishValidationError(`Publishing to ${channel.platform} via Zernio is not configured`);
  }
  const accountId = channel.settings.zernio_account_id as string | undefined;
  if (!accountId) {
    throw new PublishValidationError(`Channel ${channel.id} has no zernio_account_id`);
  }

  const post = await createPost({
    content,
    platforms: [{ platform, accountId }],
    publishNow: true,
    ...(media.length ? { mediaItems: media.map((m) => ({ type: m.type, url: m.url })) } : {}),
  });

  const id = post._id;
  if (!id) throw new Error("Zernio returned no post id");
  return { platformPostId: id, platformPostUrl: "" };
}
