export interface FacebookConfig {
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
  message?: string;
  mediaUrls?: string[];
  accessToken: string;
}

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  picture?: { data: { url: string } };
}

export interface InstagramBusinessAccount {
  id: string;
  username?: string;
  name?: string;
  followers_count?: number;
  profile_picture_url?: string;
}

export const facebookOAuthConfig = {
  clientId: process.env.FACEBOOK_APP_ID || process.env.FACEBOOK_CLIENT_ID || "",
  clientSecret: process.env.FACEBOOK_APP_SECRET || process.env.FACEBOOK_CLIENT_SECRET || "",
  callbackUrl: process.env.FACEBOOK_REDIRECT_URI || "http://localhost:3002/api/v1/channels/facebook/callback",
};

export async function getFacebookOAuthUrl(state: string): Promise<string> {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: facebookOAuthConfig.clientId,
    redirect_uri: facebookOAuthConfig.callbackUrl,
    scope: "pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_metadata,publish_to_groups",
    state,
  });

  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}

/**
 * Exchange an OAuth authorization code for a short-lived user access token.
 */
export async function exchangeFacebookCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const response = await fetch("https://graph.facebook.com/v18.0/oauth/access_token", {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: facebookOAuthConfig.callbackUrl,
      client_id: facebookOAuthConfig.clientId,
      client_secret: facebookOAuthConfig.clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Facebook token exchange failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || "",
    expiresIn: data.expires_in || 3600,
  };
}

/**
 * Exchange a short-lived token for a long-lived token (valid ~60 days).
 */
export async function exchangeLongLivedToken(shortLivedToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: facebookOAuthConfig.clientId,
    client_secret: facebookOAuthConfig.clientSecret,
    fb_exchange_token: shortLivedToken,
  });

  const response = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Facebook long-lived token exchange failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || 5184000, // ~60 days default
  };
}

/**
 * Get the list of Facebook Pages the user manages.
 * Requires pages_show_list permission on the user token.
 */
export async function getFacebookPages(userAccessToken: string): Promise<FacebookPage[]> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,category,picture{url}&access_token=${userAccessToken}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get Facebook pages: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Get the Instagram Business Account connected to a Facebook Page.
 * Requires instagram_basic permission.
 */
export async function getInstagramBusinessAccount(
  pageAccessToken: string,
  pageId: string
): Promise<InstagramBusinessAccount | null> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account{id,username,name,followers_count,profile_picture_url}&access_token=${pageAccessToken}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get Instagram business account: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  const igAccount = data.instagram_business_account;

  if (!igAccount) {
    return null;
  }

  return {
    id: igAccount.id,
    username: igAccount.username || undefined,
    name: igAccount.name || undefined,
    followers_count: igAccount.followers_count || undefined,
    profile_picture_url: igAccount.profile_picture_url || undefined,
  };
}

export async function publishToFacebook(
  content: string | { text: string; mediaUrls?: string[] },
  options: PublishOptions
): Promise<PublishResult> {
  const { accessToken } = options;

  let text: string;
  if (typeof content === "string") {
    text = content;
  } else {
    text = content.text;
  }

  const response = await fetch("https://graph.facebook.com/v18.0/me/feed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text, access_token: accessToken }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Facebook publish failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return {
    platformPostId: data.id,
    platformPostUrl: `https://facebook.com/${data.id}`,
  };
}