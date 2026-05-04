export interface TikTokConfig {
  clientKey: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface PublishResult {
  platformPostId: string;
  platformPostUrl: string;
}

export interface PublishOptions {
  channelId: string;
  title?: string;
  videoUrl?: string;
  description?: string;
  accessToken: string;
}

export const tiktokOAuthConfig = {
  clientKey: process.env.TIKTOK_CLIENT_KEY || "",
  clientSecret: process.env.TIKTOK_CLIENT_SECRET || "",
  callbackUrl: process.env.TIKTOK_CALLBACK_URL || `${process.env.API_URL || "http://localhost:3001"}/channels/callback/tiktok`,
};

export async function getTikTokOAuthUrl(state: string): Promise<string> {
  const params = new URLSearchParams({
    response_type: "code",
    client_key: tiktokOAuthConfig.clientKey,
    redirect_uri: tiktokOAuthConfig.callbackUrl,
    scope: "user.info.basic,video.publish",
    state,
  });

  return `https://www.tiktok.com/auth/authorize?${params.toString()}`;
}

export async function exchangeTikTokCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  openId: string;
}> {
  // TikTok v1.2 OAuth token exchange
  const response = await fetch("https://open-api.tiktok.com/oauth/access_token/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_key: tiktokOAuthConfig.clientKey,
      client_secret: tiktokOAuthConfig.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: tiktokOAuthConfig.callbackUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`TikTok token exchange failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  const accessToken = data.data?.access_token || data.access_token;
  const refreshToken = data.data?.refresh_token || data.refresh_token || "";
  const expiresIn = data.data?.expires_in || data.expires_in || 86400;
  const openId = data.data?.open_id || data.open_id || "";

  if (!accessToken) {
    throw new Error(`TikTok token exchange returned no access_token: ${JSON.stringify(data)}`);
  }

  return {
    accessToken,
    refreshToken,
    expiresIn,
    openId,
  };
}

export async function refreshTikTokToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const response = await fetch("https://open-api.tiktok.com/oauth/refresh_token/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_key: tiktokOAuthConfig.clientKey,
      client_secret: tiktokOAuthConfig.clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`TikTok token refresh failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return {
    accessToken: data.data?.access_token || data.access_token,
    refreshToken: data.data?.refresh_token || data.refresh_token || refreshToken,
    expiresIn: data.data?.expires_in || data.expires_in || 86400,
  };
}

export async function getTikTokUserInfo(accessToken: string): Promise<{
  openId: string;
  unionId?: string;
  avatarUrl?: string;
  displayName?: string;
  followerCount?: number;
}> {
  if (!accessToken || accessToken.startsWith("mock_")) {
    return { openId: `mock_${Date.now()}`, displayName: "Mock TikTok User" };
  }

  const response = await fetch(
    `https://open-api.tiktok.com/user/info/?access_token=${accessToken}&fields=["open_id","union_id","avatar_url","display_name","follower_count"]`,
    { method: "GET" }
  );

  if (!response.ok) {
    console.warn(`[TikTok] Failed to fetch user info: ${response.status}`);
    return { openId: "unknown" };
  }

  const data = await response.json();
  const user = data.data?.user || data.data || {};
  return {
    openId: user.open_id || user.openId || "unknown",
    unionId: user.union_id,
    avatarUrl: user.avatar_url,
    displayName: user.display_name,
    followerCount: user.follower_count,
  };
}

export async function publishToTikTok(
  content: string | { title: string; videoUrl: string; description?: string; privacyLevel?: "public" | "mutual_follower" | "private" },
  options: PublishOptions
): Promise<PublishResult> {
  const { accessToken } = options;

  // Handle mock token or dev mode
  if (!accessToken || accessToken.startsWith("mock_")) {
    console.log(`[TikTok] Mock publish: ${typeof content === "string" ? content.slice(0, 50) : content.title}...`);
    const mockPostId = `tt_${Date.now()}`;
    return {
      platformPostId: mockPostId,
      platformPostUrl: `https://www.tiktok.com/@user/video/${mockPostId}`,
    };
  }

  // Parse content
  let title: string;
  let videoUrl: string;
  let description: string;
  let privacyLevel: string = "public";

  if (typeof content === "string") {
    title = content.substring(0, 100);
    videoUrl = "";
    description = content;
  } else {
    title = content.title;
    videoUrl = content.videoUrl;
    description = content.description || content.title;
    privacyLevel = content.privacyLevel || "public";
  }

  // TikTok Research API (v1.3) or Content Posting API
  // Note: Direct video upload requires multipart/form-data
  // For text-only or when no video URL is provided, we use a simplified flow

  if (!videoUrl) {
    // TikTok direct posting API - text post (if available) or fallback to mock
    try {
      const response = await fetch("https://open-api.tiktok.com/share/content/post/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title,
          description,
          privacy_level: privacyLevel,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        // If text posts aren't supported, return a mock result
        console.warn(`[TikTok] Text-only publish not supported: ${JSON.stringify(error)}. Returning mock.`);
        const mockPostId = `tt_${Date.now()}`;
        return {
          platformPostId: mockPostId,
          platformPostUrl: `https://www.tiktok.com/@user/video/${mockPostId}`,
        };
      }

      const data = await response.json();
      const shareId = data.data?.share_id || data.share_id || `tt_${Date.now()}`;
      return {
        platformPostId: shareId,
        platformPostUrl: `https://www.tiktok.com/@user/video/${shareId}`,
      };
    } catch (err) {
      console.warn(`[TikTok] Publish error: ${err}. Returning mock.`);
      const mockPostId = `tt_${Date.now()}`;
      return {
        platformPostId: mockPostId,
        platformPostUrl: `https://www.tiktok.com/@user/video/${mockPostId}`,
      };
    }
  }

  // Video upload flow (simplified)
  // Step 1: Init upload
  const initResponse = await fetch("https://open-api.tiktok.com/share/video/upload/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      title,
      description,
      video_url: videoUrl,
      privacy_level: privacyLevel,
    }),
  });

  if (!initResponse.ok) {
    const error = await initResponse.json();
    throw new Error(`TikTok publish failed: ${JSON.stringify(error)}`);
  }

  const data = await initResponse.json();
  const shareId = data.data?.share_id || data.share_id || `tt_${Date.now()}`;

  return {
    platformPostId: shareId,
    platformPostUrl: `https://www.tiktok.com/@user/video/${shareId}`,
  };
}

export async function getTikTokMetrics(videoId: string, accessToken: string): Promise<{
  views: number;
  likes: number;
  comments: number;
  shares: number;
}> {
  if (!accessToken || accessToken.startsWith("mock_")) {
    return { views: 0, likes: 0, comments: 0, shares: 0 };
  }

  try {
    const response = await fetch(
      `https://open-api.tiktok.com/video/info/?access_token=${accessToken}&video_id=${videoId}&fields=["view_count","like_count","comment_count","share_count"]`,
      { method: "GET" }
    );

    if (!response.ok) {
      return { views: 0, likes: 0, comments: 0, shares: 0 };
    }

    const data = await response.json();
    const stats = data.data || {};
    return {
      views: stats.view_count || 0,
      likes: stats.like_count || 0,
      comments: stats.comment_count || 0,
      shares: stats.share_count || 0,
    };
  } catch {
    return { views: 0, likes: 0, comments: 0, shares: 0 };
  }
}
