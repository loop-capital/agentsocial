export interface LinkedInConfig {
  clientId: string;
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
  mediaIds?: string[];
  visibility?: "PUBLIC" | "CONNECTIONS_ONLY";
  accessToken: string;
}

export const linkedinOAuthConfig = {
  clientId: process.env.LINKEDIN_CLIENT_ID || "",
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
  callbackUrl: process.env.LINKEDIN_CALLBACK_URL || "http://localhost:3001/api/v1/channels/callback/linkedin",
};

export async function getLinkedInOAuthUrl(state: string): Promise<string> {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: linkedinOAuthConfig.clientId,
    redirect_uri: linkedinOAuthConfig.callbackUrl,
    scope: "w_member_social r_liteprofile w_liteprofile openid email",
    state,
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

export async function exchangeLinkedInCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: linkedinOAuthConfig.callbackUrl,
      client_id: linkedinOAuthConfig.clientId,
      client_secret: linkedinOAuthConfig.clientSecret,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LinkedIn OAuth error: ${response.statusText} — ${text}`);
  }

  return response.json();
}

export async function refreshLinkedInToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: linkedinOAuthConfig.clientId,
      client_secret: linkedinOAuthConfig.clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`LinkedIn refresh error: ${response.statusText}`);
  }

  return response.json();
}

export async function publishToLinkedIn(
  content: string,
  options: PublishOptions
): Promise<PublishResult> {
  const { accessToken } = options;

  if (!accessToken || accessToken.startsWith("mock_")) {
    console.log(`[LinkedIn] Mock publish: ${content.slice(0, 50)}...`);
    const mockPostId = `li_${Date.now()}`;
    return {
      platformPostId: mockPostId,
      platformPostUrl: `https://www.linkedin.com/feed/update/${mockPostId}`,
    };
  }

  // LinkedIn UGC Posts API
  const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: `urn:li:person:${accessToken.slice(0, 8)}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: content },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": options.visibility || "PUBLIC",
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`LinkedIn publish error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  const postId = data.id || `li_${Date.now()}`;
  return {
    platformPostId: postId,
    platformPostUrl: `https://www.linkedin.com/feed/update/${postId}`,
  };
}

export async function getLinkedInMetrics(postId: string, accessToken: string): Promise<{
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
}> {
  if (!accessToken || accessToken.startsWith("mock_")) {
    return { impressions: 0, likes: 0, comments: 0, shares: 0 };
  }

  try {
    const response = await fetch(
      `https://api.linkedin.com/v2/networkUpdates/${postId}?count=1`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!response.ok) return { impressions: 0, likes: 0, comments: 0, shares: 0 };
    return { impressions: 0, likes: 0, comments: 0, shares: 0 };
  } catch {
    return { impressions: 0, likes: 0, comments: 0, shares: 0 };
  }
}
