export interface InstagramConfig {
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
  caption?: string;
  accessToken: string;
}

export interface InstagramBusinessAccount {
  id: string;
  username?: string;
  name?: string;
  followers_count?: number;
  profile_picture_url?: string;
}

export const instagramOAuthConfig = {
  clientId: process.env.FACEBOOK_APP_ID || process.env.INSTAGRAM_CLIENT_ID || "",
  clientSecret: process.env.FACEBOOK_APP_SECRET || process.env.INSTAGRAM_CLIENT_SECRET || "",
  callbackUrl: process.env.INSTAGRAM_REDIRECT_URI || "http://localhost:3002/api/v1/channels/instagram/callback",
};

/**
 * Instagram uses the Facebook OAuth dialog with additional Instagram scopes.
 * The redirect goes through Facebook, then we exchange the code for a user token
 * and use it to look up the connected Instagram Business Account.
 */
export async function getInstagramOAuthUrl(state: string): Promise<string> {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: instagramOAuthConfig.clientId,
    redirect_uri: instagramOAuthConfig.callbackUrl,
    scope: "instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_insights,pages_show_list,pages_read_engagement",
    state,
  });

  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}

/**
 * Exchange an OAuth authorization code for a user access token (via Facebook Graph API).
 */
export async function exchangeInstagramCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const response = await fetch("https://graph.facebook.com/v18.0/oauth/access_token", {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: instagramOAuthConfig.callbackUrl,
      client_id: instagramOAuthConfig.clientId,
      client_secret: instagramOAuthConfig.clientSecret,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Instagram OAuth error: ${response.statusText} — ${text}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || "",
    expiresIn: data.expires_in || 3600,
  };
}

/**
 * Exchange a short-lived token for a long-lived token (~60 days).
 */
export async function exchangeInstagramLongLivedToken(shortLivedToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: instagramOAuthConfig.clientId,
    client_secret: instagramOAuthConfig.clientSecret,
    fb_exchange_token: shortLivedToken,
  });

  const response = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Instagram long-lived token exchange failed: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || 5184000,
  };
}

/**
 * Get the user's Facebook Pages (needed to find the IG Business Account).
 */
export async function getInstagramFacebookPages(userAccessToken: string): Promise<Array<{
  id: string;
  name: string;
  access_token: string;
}>> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token&access_token=${userAccessToken}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get Facebook pages for Instagram: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Given a Facebook Page, look up the connected Instagram Business Account.
 */
export async function getInstagramBusinessAccountFromPage(
  pageAccessToken: string,
  pageId: string
): Promise<InstagramBusinessAccount | null> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account{id,username,followers_count,profile_picture_url}&access_token=${pageAccessToken}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get Instagram business account from page: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  const igAccount = data.instagram_business_account;

  if (!igAccount) {
    return null;
  }

  return {
    id: igAccount.id,
    username: igAccount.username || undefined,
    followers_count: igAccount.followers_count || undefined,
    profile_picture_url: igAccount.profile_picture_url || undefined,
  };
}

export async function refreshInstagramToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&fb_exchange_token=${refreshToken}&client_id=${instagramOAuthConfig.clientId}&client_secret=${instagramOAuthConfig.clientSecret}`
  );

  if (!response.ok) {
    throw new Error(`Instagram refresh error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: refreshToken,
    expiresIn: data.expires_in || 5184000,
  };
}

export async function publishToInstagram(
  content: string,
  options: PublishOptions
): Promise<PublishResult> {
  const { accessToken } = options;

  if (!accessToken || accessToken.startsWith("mock_")) {
    console.log(`[Instagram] Mock publish: ${content.slice(0, 50)}...`);
    const mockPostId = `ig_${Date.now()}`;
    return {
      platformPostId: mockPostId,
      platformPostUrl: `https://www.instagram.com/p/${mockPostId}`,
    };
  }

  // Step 1: Create a media container
  const containerResponse = await fetch(
    `https://graph.facebook.com/v18.0/me/media?caption=${encodeURIComponent(content)}&access_token=${accessToken}`,
    { method: "POST" }
  );

  if (!containerResponse.ok) {
    const err = await containerResponse.text();
    throw new Error(`Instagram container error: ${containerResponse.status} — ${err}`);
  }

  const container = await containerResponse.json();
  const containerId = container.id;

  // Step 2: Publish the container
  const publishResponse = await fetch(
    `https://graph.facebook.com/v18.0/me/media_publish?creation_id=${containerId}&access_token=${accessToken}`,
    { method: "POST" }
  );

  if (!publishResponse.ok) {
    const err = await publishResponse.text();
    throw new Error(`Instagram publish error: ${publishResponse.status} — ${err}`);
  }

  const published = await publishResponse.json();
  const postId = published.id || `ig_${Date.now()}`;

  return {
    platformPostId: postId,
    platformPostUrl: `https://www.instagram.com/p/${postId}`,
  };
}

export async function getInstagramMetrics(postId: string, accessToken: string): Promise<{
  impressions: number;
  likes: number;
  comments: number;
  saves: number;
}> {
  if (!accessToken || accessToken.startsWith("mock_")) {
    return { impressions: 0, likes: 0, comments: 0, saves: 0 };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${postId}/insights?metric=impressions,likes,comments,saves&access_token=${accessToken}`
    );
    if (!response.ok) return { impressions: 0, likes: 0, comments: 0, saves: 0 };
    const data = await response.json();
    const values: Record<string, number> = {};
    (data.data || []).forEach((m: { name: string; values: number[] }) => {
      values[m.name] = m.values[0] || 0;
    });
    return {
      impressions: values.impressions || 0,
      likes: values.likes || 0,
      comments: values.comments || 0,
      saves: values.saves || 0,
    };
  } catch {
    return { impressions: 0, likes: 0, comments: 0, saves: 0 };
  }
}