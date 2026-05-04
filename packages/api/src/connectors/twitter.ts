export interface PublishResult {
  platformPostId: string;
  platformPostUrl: string;
}

export interface TwitterConfig {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  accessTokenSecret?: string;
  refreshToken?: string;
}

export interface PublishOptions {
  channelId: string;
  mediaIds?: string[];
  replyToId?: string;
  accessToken: string;
}

export const twitterOAuthConfig = {
  clientId: process.env.TWITTER_CLIENT_ID || "",
  clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
  callbackUrl: process.env.TWITTER_CALLBACK_URL || "http://localhost:3001/api/v1/channels/callback/twitter",
};

export async function getTwitterOAuthUrl(state: string): Promise<string> {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: twitterOAuthConfig.clientId,
    redirect_uri: twitterOAuthConfig.callbackUrl,
    scope: "tweet.read tweet.write users.read offline.access",
    state,
  });

  return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
}

export async function exchangeTwitterCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const response = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      client_id: twitterOAuthConfig.clientId,
      client_secret: twitterOAuthConfig.clientSecret,
      redirect_uri: twitterOAuthConfig.callbackUrl,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Twitter OAuth error: ${response.statusText} — ${text}`);
  }

  return response.json();
}

export async function refreshTwitterToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const response = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: twitterOAuthConfig.clientId,
      client_secret: twitterOAuthConfig.clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Twitter refresh error: ${response.statusText}`);
  }

  return response.json();
}

export async function publishToTwitter(
  content: string,
  options: PublishOptions
): Promise<PublishResult> {
  const { accessToken } = options;

  // If no real token (mock credentials), return a mock result
  if (!accessToken || accessToken.startsWith("mock_")) {
    console.log(`[Twitter] Mock publish: ${content.slice(0, 50)}...`);
    const mockPostId = `tw_${Date.now()}`;
    return {
      platformPostId: mockPostId,
      platformPostUrl: `https://twitter.com/i/status/${mockPostId}`,
    };
  }

  const response = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: content,
      ...(options.replyToId ? { reply: { in_reply_to_tweet_id: options.replyToId } } : {}),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Twitter publish error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  const tweetId = data.data?.id;
  return {
    platformPostId: tweetId || `tw_${Date.now()}`,
    platformPostUrl: tweetId ? `https://twitter.com/i/status/${tweetId}` : `https://twitter.com/i/status/tw_${Date.now()}`,
  };
}

export async function getTwitterMetrics(postId: string, accessToken: string): Promise<{
  impressions: number;
  likes: number;
  retweets: number;
  replies: number;
}> {
  if (!accessToken || accessToken.startsWith("mock_")) {
    return { impressions: 0, likes: 0, retweets: 0, replies: 0 };
  }

  try {
    const response = await fetch(
      `https://api.twitter.com/2/tweets/${postId}?tweet.fields=public_metrics`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!response.ok) return { impressions: 0, likes: 0, retweets: 0, replies: 0 };
    const data = await response.json();
    const m = data.data?.public_metrics || {};
    return {
      impressions: 0,
      likes: m.like_count || 0,
      retweets: m.retweet_count || 0,
      replies: m.reply_count || 0,
    };
  } catch {
    return { impressions: 0, likes: 0, retweets: 0, replies: 0 };
  }
}
