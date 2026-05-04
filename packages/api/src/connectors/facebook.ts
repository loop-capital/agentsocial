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

export const facebookOAuthConfig = {
  clientId: process.env.FACEBOOK_CLIENT_ID || process.env.FACEBOOK_APP_ID || "",
  clientSecret: process.env.FACEBOOK_CLIENT_SECRET || process.env.FACEBOOK_APP_SECRET || "",
  callbackUrl: process.env.FACEBOOK_CALLBACK_URL || "http://100.73.101.62:4000/v1/auth/callback/facebook",
};

export async function getFacebookOAuthUrl(state: string): Promise<string> {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: facebookOAuthConfig.clientId,
    redirect_uri: facebookOAuthConfig.callbackUrl,
    scope: "pages_read_engagement,pages_manage_posts,publish_to_groups",
    state,
  });

  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}

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

export async function publishToFacebook(
  content: string | { text: string; mediaUrls?: string[] },
  options: PublishOptions
): Promise<PublishResult> {
  const { accessToken, channelId } = options;
  
  // Handle string content
  let text: string;
  let mediaUrls: string[] | undefined;
  
  if (typeof content === 'string') {
    text = content;
  } else {
    text = content.text;
    mediaUrls = content.mediaUrls;
  }

  // For now, support text-only posts
  // Media posts would require uploading images first

  const response = await fetch("https://graph.facebook.com/v18.0/me/feed", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: text,
      access_token: accessToken,
    }),
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

// Get user's Facebook pages
export async function getFacebookPages(accessToken: string): Promise<Array<{
  id: string;
  name: string;
  access_token: string;
}>> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get Facebook pages: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.data || [];
}