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
  callbackUrl: process.env.TIKTOK_CALLBACK_URL || "http://100.73.101.62:4000/v1/auth/callback/tiktok",
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
}> {
  const response = await fetch("https://open-api.tiktok.com/oauth/access_token/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
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
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || "",
    expiresIn: data.expires_in || 3600,
  };
}

export async function publishToTikTok(
  content: string | { title: string; videoUrl: string; description?: string },
  options: PublishOptions
): Promise<PublishResult> {
  const { accessToken, channelId } = options;
  
  // Handle string content
  let title: string;
  let videoUrl: string;
  let description: string | undefined;
  
  if (typeof content === 'string') {
    title = content.substring(0, 100);
    videoUrl = '';
  } else {
    title = content.title;
    videoUrl = content.videoUrl;
    description = content.description;
  }

  // TikTok requires video upload via their API
  // This is a simplified version - full implementation requires video upload flow

  const response = await fetch("https://open-api.tiktok.com/share/video/upload/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      title,
      description: description || title,
      video_url: videoUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`TikTok publish failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return {
    platformPostId: data.data.share_id,
    platformPostUrl: `https://www.tiktok.com/@user/video/${data.data.share_id}`,
  };
}
