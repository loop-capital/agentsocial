/**
 * TikTok Connector — Content Posting API v2 + OAuth v2
 *
 * Endpoints:
 *   OAuth:
 *     Authorize: https://www.tiktok.com/v2/auth/authorize/
 *     Token:     POST https://open.tiktokapis.com/v2/oauth/token/
 *     Revoke:    POST https://open.tiktokapis.com/v2/oauth/revoke/
 *   Content Posting API (requires scope: video.publish):
 *     Creator Info: POST /v2/post/publish/creator_info/query/
 *     Video Init:   POST /v2/post/publish/video/init/
 *     Photo Init:   POST /v2/post/publish/content/init/
 *     Status Fetch: POST /v2/post/publish/status/fetch/
 *     File Upload:  PUT  <upload_url> (returned by video init)
 *   User Info (scope: user.info.basic):
 *     User Info:    POST /v2/user/info/
 *
 * Rate Limits:
 *   Creator Info: 20 req/min per access_token
 *   Video Init:   6  req/min per access_token
 *   Status Fetch: 30 req/min per access_token
 *
 * Note: All unaudited-client content is posted as private. To go public,
 *       the app must undergo audit via https://developers.tiktok.com/application/content-posting-api
 */

export interface TikTokConfig {
  clientKey: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface PublishResult {
  platformPostId: string;
  platformPostUrl: string;
  publishId?: string;
  uploadUrl?: string;
}

export interface PublishOptions {
  channelId: string;
  title?: string;
  videoUrl?: string;
  description?: string;
  photoUrls?: string[];
  photoCoverIndex?: number;
  autoAddMusic?: boolean;
  accessToken: string;
}

// ── OAuth Config ────────────────────────────────────────────────────────────

export const tiktokOAuthConfig = {
  clientKey: process.env.TIKTOK_CLIENT_KEY || "",
  clientSecret: process.env.TIKTOK_CLIENT_SECRET || "",
  callbackUrl: process.env.TIKTOK_CALLBACK_URL || `${process.env.API_URL || "http://localhost:3001"}/api/v1/channels/callback/tiktok`,
};

const BASE_URL = "https://open.tiktokapis.com/v2";
const AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/";

// ── PKCE Store (set by routes handler) ───────────────────────────────────────

let pkceStore: Map<string, string> | undefined;

export function setTikTokPkceStore(store: Map<string, string>) {
  pkceStore = store;
}

// ── OAuth v2: Build Authorize URL ───────────────────────────────────────────

export function getTikTokOAuthUrl({
  state,
  scopes = ["user.info.basic", "video.publish"],
  codeChallenge,
}: {
  state: string;
  scopes?: string[];
  codeChallenge?: string;
}): string {
  const params = new URLSearchParams({
    client_key: tiktokOAuthConfig.clientKey,
    response_type: "code",
    scope: scopes.join(","),
    redirect_uri: tiktokOAuthConfig.callbackUrl,
    state,
  });

  if (codeChallenge) {
    params.set("code_challenge", codeChallenge);
    params.set("code_challenge_method", "S256");
  }

  return `${AUTH_URL}?${params.toString()}`;
}

// ── OAuth v2: Exchange Code ─────────────────────────────────────────────────

export async function exchangeTikTokCode(
  code: string,
  options: {
    redirectUri?: string;
    codeVerifier?: string;
  } = {}
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
  openId: string;
  scope: string;
}> {
  const body = new URLSearchParams({
    client_key: tiktokOAuthConfig.clientKey,
    client_secret: tiktokOAuthConfig.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: options.redirectUri || tiktokOAuthConfig.callbackUrl,
  });

  if (options.codeVerifier) {
    body.set("code_verifier", options.codeVerifier);
  }

  const response = await fetch(`${BASE_URL}/oauth/token/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body,
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(`TikTok token exchange failed: ${JSON.stringify(data.error || data)}`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    refreshExpiresIn: data.refresh_expires_in,
    openId: data.open_id,
    scope: data.scope,
  };
}

// ── OAuth v2: Refresh Token ─────────────────────────────────────────────────

export async function refreshTikTokToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
  openId: string;
  scope: string;
}> {
  const response = await fetch(`${BASE_URL}/oauth/token/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: new URLSearchParams({
      client_key: tiktokOAuthConfig.clientKey,
      client_secret: tiktokOAuthConfig.clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(`TikTok token refresh failed: ${JSON.stringify(data.error || data)}`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresIn: data.expires_in,
    refreshExpiresIn: data.refresh_expires_in,
    openId: data.open_id,
    scope: data.scope,
  };
}

// ── OAuth v2: Revoke Token ──────────────────────────────────────────────────

export async function revokeTikTokToken(accessToken: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/oauth/revoke/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: new URLSearchParams({
      client_key: tiktokOAuthConfig.clientKey,
      client_secret: tiktokOAuthConfig.clientSecret,
      token: accessToken,
    }),
  });

  // Success returns empty body; only throw on clear errors
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`TikTok token revoke failed (${response.status}): ${text}`);
  }
}

// ── User Info ───────────────────────────────────────────────────────────────

export async function getTikTokUserInfo(accessToken: string): Promise<{
  openId: string;
  unionId?: string;
  avatarUrl?: string;
  displayName?: string;
  bioDescription?: string;
  followerCount?: number;
  followingCount?: number;
  likesCount?: number;
}> {
  if (!accessToken || accessToken.startsWith("mock_")) {
    return { openId: `mock_${Date.now()}`, displayName: "Mock TikTok User" };
  }

  const response = await fetch(`${BASE_URL}/user/info/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      fields: [
        "open_id",
        "union_id",
        "avatar_url",
        "display_name",
        "bio_description",
        "follower_count",
        "following_count",
        "likes_count",
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.warn(`[TikTok] User info failed: ${response.status}`, err);
    return { openId: "unknown" };
  }

  const result = await response.json();
  const user = result.data?.user || result.data || {};

  return {
    openId: user.open_id || "unknown",
    unionId: user.union_id,
    avatarUrl: user.avatar_url,
    displayName: user.display_name,
    bioDescription: user.bio_description,
    followerCount: user.follower_count,
    followingCount: user.following_count,
    likesCount: user.likes_count,
  };
}

// ── Creator Info (required before posting) ──────────────────────────────────

export async function queryCreatorInfo(accessToken: string): Promise<{
  creatorAvatarUrl: string;
  creatorUsername: string;
  creatorNickname: string;
  privacyLevelOptions: ("PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "FOLLOWER_OF_CREATOR" | "SELF_ONLY")[];
  commentDisabled: boolean;
  duetDisabled: boolean;
  stitchDisabled: boolean;
  maxVideoPostDurationSec: number;
}> {
  const response = await fetch(`${BASE_URL}/post/publish/creator_info/query/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
  });

  const result = await response.json();

  if (!response.ok || result.error?.code !== "ok") {
    throw new Error(
      `TikTok creator_info query failed: ${result.error?.message || JSON.stringify(result)}`
    );
  }

  const d = result.data;
  return {
    creatorAvatarUrl: d.creator_avatar_url,
    creatorUsername: d.creator_username,
    creatorNickname: d.creator_nickname,
    privacyLevelOptions: d.privacy_level_options,
    commentDisabled: d.comment_disabled,
    duetDisabled: d.duet_disabled,
    stitchDisabled: d.stitch_disabled,
    maxVideoPostDurationSec: d.max_video_post_duration_sec,
  };
}

// ── Post Status ─────────────────────────────────────────────────────────────

export type PostStatus =
  | "PROCESSING_UPLOAD"
  | "PROCESSING_DOWNLOAD"
  | "SEND_TO_USER_INBOX"
  | "PUBLISH_COMPLETE"
  | "FAILED";

export async function getPostStatus(accessToken: string, publishId: string): Promise<{
  status: PostStatus;
  failReason?: string;
  publicPostIds?: string[];
  uploadedBytes?: number;
  downloadedBytes?: number;
}> {
  const response = await fetch(`${BASE_URL}/post/publish/status/fetch/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({ publish_id: publishId }),
  });

  const result = await response.json();

  if (!response.ok || result.error?.code !== "ok") {
    throw new Error(
      `TikTok status fetch failed: ${result.error?.message || JSON.stringify(result)}`
    );
  }

  return {
    status: result.data.status,
    failReason: result.data.fail_reason,
    publicPostIds: result.data.publicaly_available_post_id,
    uploadedBytes: result.data.uploaded_bytes,
    downloadedBytes: result.data.downloaded_bytes,
  };
}

// ── Publish Video (Direct Post) ─────────────────────────────────────────────

interface VideoInitResult {
  publishId: string;
  uploadUrl?: string;
}

export async function initVideoPublish(
  accessToken: string,
  params: {
    title?: string;
    description?: string;
    privacyLevel?: "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "FOLLOWER_OF_CREATOR" | "SELF_ONLY";
    disableDuet?: boolean;
    disableComment?: boolean;
    disableStitch?: boolean;
    videoCoverTimestampMs?: number;
    brandContent?: boolean;
    brandOrganic?: boolean;
    isAIGC?: boolean;
    source: "FILE_UPLOAD" | "PULL_FROM_URL";
    videoUrl?: string;                // for PULL_FROM_URL
    videoSize?: number;               // for FILE_UPLOAD (bytes)
    chunkSize?: number;               // for FILE_UPLOAD (bytes)
    totalChunkCount?: number;          // for FILE_UPLOAD
  }
): Promise<VideoInitResult> {
  const body: Record<string, unknown> = {
    post_info: {
      title: params.title || params.description || "",
      privacy_level: params.privacyLevel || "SELF_ONLY",
      disable_duet: params.disableDuet ?? false,
      disable_comment: params.disableComment ?? false,
      disable_stitch: params.disableStitch ?? false,
      ...(params.videoCoverTimestampMs !== undefined && {
        video_cover_timestamp_ms: params.videoCoverTimestampMs,
      }),
      ...(params.brandContent !== undefined && { brand_content_toggle: params.brandContent }),
      ...(params.brandOrganic !== undefined && { brand_organic_toggle: params.brandOrganic }),
      ...(params.isAIGC !== undefined && { is_aigc: params.isAIGC }),
    },
    source_info:
      params.source === "PULL_FROM_URL"
        ? {
            source: "PULL_FROM_URL",
            video_url: params.videoUrl!,
          }
        : {
            source: "FILE_UPLOAD",
            video_size: params.videoSize!,
            chunk_size: params.chunkSize!,
            total_chunk_count: params.totalChunkCount!,
          },
  };

  const response = await fetch(`${BASE_URL}/post/publish/video/init/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(body),
  });

  const result = await response.json();

  if (!response.ok || result.error?.code !== "ok") {
    throw new Error(
      `TikTok video init failed: ${result.error?.message || JSON.stringify(result)}`
    );
  }

  return {
    publishId: result.data.publish_id,
    uploadUrl: result.data.upload_url,
  };
}

// ── Upload File Chunk ───────────────────────────────────────────────────────

export async function uploadVideoChunk(
  uploadUrl: string,
  chunk: Buffer | Uint8Array,
  rangeStart: number,
  rangeEnd: number,
  totalSize: number
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(chunk.length),
      "Content-Range": `bytes ${rangeStart}-${rangeEnd}/${totalSize}`,
    },
    body: chunk as unknown as BodyInit,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`TikTok chunk upload failed (${response.status}): ${text}`);
  }
}

// ── Publish Photos (Direct Post) ──────────────────────────────────────────────

export async function initPhotoPublish(
  accessToken: string,
  params: {
    title?: string;
    description?: string;
    privacyLevel?: "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "FOLLOWER_OF_CREATOR" | "SELF_ONLY";
    disableComment?: boolean;
    autoAddMusic?: boolean;
    brandContent?: boolean;
    brandOrganic?: boolean;
    photoCoverIndex: number;
    photoUrls: string[];
  }
): Promise<{ publishId: string }> {
  const body: Record<string, unknown> = {
    post_mode: "DIRECT_POST",
    media_type: "PHOTO",
    post_info: {
      title: params.title || "",
      description: params.description || "",
      privacy_level: params.privacyLevel || "SELF_ONLY",
      disable_comment: params.disableComment ?? false,
      ...(params.autoAddMusic !== undefined && { auto_add_music: params.autoAddMusic }),
      ...(params.brandContent !== undefined && { brand_content_toggle: params.brandContent }),
      ...(params.brandOrganic !== undefined && { brand_organic_toggle: params.brandOrganic }),
    },
    source_info: {
      source: "PULL_FROM_URL",
      photo_cover_index: params.photoCoverIndex,
      photo_images: params.photoUrls,
    },
  };

  const response = await fetch(`${BASE_URL}/post/publish/content/init/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(body),
  });

  const result = await response.json();

  if (!response.ok || result.error?.code !== "ok") {
    throw new Error(
      `TikTok photo init failed: ${result.error?.message || JSON.stringify(result)}`
    );
  }

  return { publishId: result.data.publish_id };
}

// ── High-level: Publish Video Wrapper ───────────────────────────────────────

export async function publishToTikTok(
  content: string | {
    title?: string;
    videoUrl?: string;
    photoUrls?: string[];
    photoCoverIndex?: number;
    description?: string;
    privacyLevel?: "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "FOLLOWER_OF_CREATOR" | "SELF_ONLY";
    autoAddMusic?: boolean;
  },
  options: PublishOptions
): Promise<PublishResult> {
  const { accessToken } = options;

  // ── Dev/Mock mode ───────────────────────────────────────────────────────
  if (!accessToken || accessToken.startsWith("mock_")) {
    const title = typeof content === "string"
      ? content.slice(0, 50)
      : (content.title || content.description || "Mock post").slice(0, 50);
    console.log(`[TikTok] Mock publish: ${title}...`);
    const mockId = `tt_${Date.now()}`;
    return {
      platformPostId: mockId,
      platformPostUrl: `https://www.tiktok.com/@user/video/${mockId}`,
      publishId: `v_pub_mock~v2.${mockId}`,
    };
  }

  // ── Parse content ──────────────────────────────────────────────────────
  let title: string;
  let videoUrl: string | undefined;
  let photoUrls: string[] | undefined;
  let photoCoverIndex: number | undefined;
  let description: string;
  let privacyLevel: "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "FOLLOWER_OF_CREATOR" | "SELF_ONLY" | undefined;
  let autoAddMusic: boolean | undefined;

  if (typeof content === "string") {
    title = content.substring(0, 2200); // TikTok max title length
    description = content;
  } else {
    title = content.title || "";
    videoUrl = content.videoUrl;
    photoUrls = content.photoUrls;
    photoCoverIndex = content.photoCoverIndex;
    description = content.description || title;
    privacyLevel = content.privacyLevel;
    autoAddMusic = content.autoAddMusic;
  }

  // ── Step 1: Query creator info (required per UX guidelines) ────────────
  const creatorInfo = await queryCreatorInfo(accessToken);

  // Validate privacy level against allowed options
  const effectivePrivacy = privacyLevel || creatorInfo.privacyLevelOptions[0] || "SELF_ONLY";
  if (!creatorInfo.privacyLevelOptions.includes(effectivePrivacy)) {
    console.warn(
      `[TikTok] Requested privacy level ${effectivePrivacy} not in allowed options: ${creatorInfo.privacyLevelOptions.join(", ")}. Using first available.`
    );
  }

  // ── Step 2: Initialize post ────────────────────────────────────────────
  if (photoUrls && photoUrls.length > 0) {
    // ── Photo post ────────────────────────────────────────────────────
    const result = await initPhotoPublish(accessToken, {
      title,
      description,
      privacyLevel: effectivePrivacy,
      photoCoverIndex: photoCoverIndex ?? 0,
      photoUrls,
      autoAddMusic,
    });

    return {
      platformPostId: result.publishId,
      platformPostUrl: `https://www.tiktok.com/@${creatorInfo.creatorUsername}`,
      publishId: result.publishId,
    };
  }

  if (videoUrl) {
    // ── PULL_FROM_URL video ───────────────────────────────────────────
    const result = await initVideoPublish(accessToken, {
      title,
      description,
      privacyLevel: effectivePrivacy,
      source: "PULL_FROM_URL",
      videoUrl,
    });

    return {
      platformPostId: result.publishId,
      platformPostUrl: `https://www.tiktok.com/@${creatorInfo.creatorUsername}`,
      publishId: result.publishId,
    };
  }

  // ── Text-only fallback ────────────────────────────────────────────────
  // TikTok does not support text-only posts via Content Posting API.
  // Return a mock result so callers don't crash, but log a warning.
  console.warn("[TikTok] Text-only posts are not supported. Returning mock post ID.");
  const mockId = `tt_text_${Date.now()}`;
  return {
    platformPostId: mockId,
    platformPostUrl: `https://www.tiktok.com/@${creatorInfo.creatorUsername}`,
    publishId: `v_pub_mock~v2.${mockId}`,
  };
}

// ── Metrics (not available via Content Posting API; stub) ───────────────────

export async function getTikTokMetrics(
  _publishId: string,
  _accessToken: string
): Promise<{
  views: number;
  likes: number;
  comments: number;
  shares: number;
}> {
  // TikTok Content Posting API does not provide analytics.
  // Use the Research API (separate product) for public video metrics,
  // or scrape the public page. Returning zeros here.
  return { views: 0, likes: 0, comments: 0, shares: 0 };
}
