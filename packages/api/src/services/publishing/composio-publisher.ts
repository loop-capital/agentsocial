/**
 * Composio publisher — Instagram, Facebook, LinkedIn, X, TikTok.
 *
 * Composio tools are low-level (e.g. Instagram = create container, then
 * publish), so each platform's flow lives here. Identifiers Composio needs
 * (IG business id, FB page id, LinkedIn URN) are discovered on first use and
 * returned via `settingsPatch` so the worker caches them on the channel.
 *
 * NOTE: response shapes are read defensively via dig(); they have been
 * verified against the live API only for INSTAGRAM_GET_USER_INFO.
 */

import { executeAction } from "../composio.js";
import {
  PublishValidationError,
  type PublishInput,
  type PublishResult,
} from "./types.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Return the first non-empty string/number found at any of the given dotted paths. */
export function dig(obj: unknown, ...paths: string[]): string | undefined {
  for (const path of paths) {
    let cur: any = obj;
    for (const key of path.split(".")) {
      if (cur == null) break;
      cur = /^\d+$/.test(key) ? cur[Number(key)] : cur[key];
    }
    if (typeof cur === "string" && cur) return cur;
    if (typeof cur === "number") return String(cur);
  }
  return undefined;
}

async function run(
  userId: string,
  action: string,
  params: Record<string, unknown>,
  connectedAccountId: string | undefined,
) {
  const res = await executeAction(userId, action, params, connectedAccountId);
  if (!res.success) {
    throw new Error(`${action} failed: ${res.error ?? "unknown Composio error"}`);
  }
  return res.data;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Per-platform flows ──────────────────────────────────────────────────────

async function publishInstagram(input: PublishInput, acct: string | undefined): Promise<PublishResult> {
  const { brandId, channel, content, media } = input;
  const first = media[0];
  if (!first) throw new PublishValidationError("Instagram requires an image or video");

  const patch: Record<string, unknown> = {};
  let igUserId = channel.settings.ig_user_id as string | undefined;
  if (!igUserId) {
    const info = await run(brandId, "INSTAGRAM_GET_USER_INFO", {}, acct);
    igUserId = dig(info, "id", "data.id");
    if (!igUserId) throw new Error("Could not resolve Instagram business account id");
    patch.ig_user_id = igUserId;
  }

  const container = await run(
    brandId,
    "INSTAGRAM_CREATE_MEDIA_CONTAINER",
    {
      ig_user_id: igUserId,
      caption: content,
      content_type: first.type === "video" ? "reel" : "photo",
      ...(first.type === "video" ? { video_url: first.url } : { image_url: first.url }),
    },
    acct,
  );
  const creationId = dig(container, "id", "creation_id", "data.id");
  if (!creationId) throw new Error("Instagram did not return a media container id");

  // Videos/reels are processed asynchronously — wait until FINISHED.
  if (first.type === "video") {
    let done = false;
    for (let i = 0; i < 24 && !done; i++) {
      const st = await run(brandId, "INSTAGRAM_GET_POST_STATUS", { creation_id: creationId }, acct);
      const code = dig(st, "status_code", "status");
      if (code === "FINISHED") done = true;
      else if (code === "ERROR" || code === "EXPIRED") {
        throw new PublishValidationError(`Instagram rejected the video (${code})`);
      } else await sleep(5000);
    }
    if (!done) throw new Error("Instagram video processing timed out");
  }

  const posted = await run(brandId, "INSTAGRAM_CREATE_POST", { ig_user_id: igUserId, creation_id: creationId }, acct);
  const id = dig(posted, "id", "data.id");
  if (!id) throw new Error("Instagram publish returned no post id");
  return {
    platformPostId: id,
    platformPostUrl: dig(posted, "permalink", "data.permalink") ?? "",
    settingsPatch: Object.keys(patch).length ? patch : undefined,
  };
}

async function publishFacebook(input: PublishInput, acct: string | undefined): Promise<PublishResult> {
  const { brandId, channel, content, media } = input;
  const patch: Record<string, unknown> = {};

  let pageId = channel.settings.page_id as string | undefined;
  if (!pageId) {
    const pages = await run(brandId, "FACEBOOK_GET_USER_PAGES", {}, acct);
    const list: any[] = (pages as any)?.data ?? (pages as any)?.pages ?? (Array.isArray(pages) ? pages : []);
    const match = list.find((p) => p?.id === channel.accountId) ?? list[0];
    pageId = match?.id;
    if (!pageId) throw new PublishValidationError("No Facebook Page found for this connection");
    patch.page_id = pageId;
  }

  const photo = media.find((m) => m.type === "image");
  if (media.some((m) => m.type === "video")) {
    throw new PublishValidationError("Facebook video publishing is not supported yet");
  }
  const data = photo
    ? await run(brandId, "FACEBOOK_CREATE_PHOTO_POST", { page_id: pageId, url: photo.url, message: content, published: true }, acct)
    : await run(brandId, "FACEBOOK_CREATE_POST", { page_id: pageId, message: content, published: true }, acct);

  const id = dig(data, "id", "post_id", "data.id");
  if (!id) throw new Error("Facebook publish returned no post id");
  return {
    platformPostId: id,
    platformPostUrl: `https://www.facebook.com/${id}`,
    settingsPatch: Object.keys(patch).length ? patch : undefined,
  };
}

async function publishLinkedIn(input: PublishInput, acct: string | undefined): Promise<PublishResult> {
  const { brandId, channel, content, media } = input;
  if (media.length) throw new PublishValidationError("LinkedIn media posts are not supported yet");

  const patch: Record<string, unknown> = {};
  let author = channel.settings.linkedin_author as string | undefined;
  if (!author) {
    const me = await run(brandId, "LINKEDIN_GET_MY_INFO", {}, acct);
    const sub = dig(me, "sub", "id", "data.sub", "data.id", "response_dict.sub", "response_dict.id");
    if (!sub) throw new Error("Could not resolve LinkedIn member id");
    author = `urn:li:person:${sub}`;
    patch.linkedin_author = author;
  }

  const data = await run(
    brandId,
    "LINKEDIN_CREATE_LINKED_IN_POST",
    { author, commentary: content, visibility: "PUBLIC", lifecycleState: "PUBLISHED" },
    acct,
  );
  const id = dig(data, "id", "data.id", "x-restli-id", "response_dict.id") ?? "";
  return {
    platformPostId: id || "linkedin",
    platformPostUrl: id ? `https://www.linkedin.com/feed/update/${id}` : "",
    settingsPatch: Object.keys(patch).length ? patch : undefined,
  };
}

async function publishTwitter(input: PublishInput, acct: string | undefined): Promise<PublishResult> {
  const { brandId, content, media } = input;
  if (media.length) throw new PublishValidationError("X media posts are not supported yet");
  const data = await run(brandId, "TWITTER_CREATION_OF_A_POST", { text: content }, acct);
  const id = dig(data, "data.id", "id");
  if (!id) throw new Error("X publish returned no post id");
  return { platformPostId: id, platformPostUrl: `https://x.com/i/status/${id}` };
}

async function publishTikTok(input: PublishInput, acct: string | undefined): Promise<PublishResult> {
  const { brandId, channel, content, media } = input;
  if (media.some((m) => m.type === "video")) {
    throw new PublishValidationError("TikTok video publishing is not supported yet (photo posts only)");
  }
  const images = media.filter((m) => m.type === "image").map((m) => m.url);
  if (!images.length) throw new PublishValidationError("TikTok requires media");

  // SELF_ONLY is the safe default: unaudited TikTok apps can only post privately.
  const privacy = (channel.settings.tiktok_privacy as string | undefined) ?? "SELF_ONLY";
  const data = await run(
    brandId,
    "TIKTOK_POST_PHOTO",
    {
      photo_images: images,
      photo_cover_index: 0,
      title: content.slice(0, 90),
      description: content,
      post_mode: "DIRECT_POST",
      privacy_level: privacy,
    },
    acct,
  );
  const id = dig(data, "publish_id", "data.publish_id", "id") ?? "";
  return { platformPostId: id || "tiktok", platformPostUrl: "" };
}

// ─── Entry point ─────────────────────────────────────────────────────────────

const FLOWS: Record<string, (i: PublishInput, acct: string | undefined) => Promise<PublishResult>> = {
  instagram: publishInstagram,
  facebook: publishFacebook,
  linkedin: publishLinkedIn,
  twitter: publishTwitter,
  tiktok: publishTikTok,
};

export async function publishViaComposio(input: PublishInput): Promise<PublishResult> {
  // Connections made outside the app live under a custom Composio user id (e.g. "pleij-salon").
  const composioUser = input.channel.settings.composio_user_id as string | undefined;
  if (composioUser) input = { ...input, brandId: composioUser };
  const flow = FLOWS[input.channel.platform];
  if (!flow) {
    throw new PublishValidationError(`Publishing to ${input.channel.platform} via Composio is not supported yet`);
  }
  const acct = input.channel.settings.composio_account_id as string | undefined;
  return flow(input, acct);
}
