# AgentSocial — Platform Connector Specification

## Overview

Platform connectors abstract the complexity of social media APIs, providing a unified interface for publishing content, managing engagement, and retrieving analytics across all supported platforms.

---

## Connector Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Platform Connector Service                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│   │   Unified   │───▶│  Platform   │───▶│   OAuth     │───▶│   Rate      │   │
│   │   Interface │    │  Adapters   │    │   Manager   │    │   Limiter   │   │
│   └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘   │
│          │                  │                  │                  │           │
│          ▼                  ▼                  ▼                  ▼           │
│   ┌─────────────────────────────────────────────────────────────────────────┐ │
│   │                      Platform APIs                                       │ │
│   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │ │
│   │  │Facebook │ │Instagram│ │ YouTube │ │ Twitter │ │LinkedIn │         │ │
│   │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘         │ │
│   │  ┌─────────┐ ┌─────────┐ ┌─────────┐                                 │ │
│   │  │ TikTok  │ │WordPress│ │ Bluesky │                                 │ │
│   │  └─────────┘ └─────────┘ └─────────┘                                 │ │
│   └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Unified Interface

All connectors implement the following TypeScript interface:

```typescript
interface PlatformConnector {
  readonly name: PlatformName;
  readonly version: string;
  readonly capabilities: PlatformCapabilities;
  
  // ========== AUTHENTICATION ==========
  
  /**
   * Generate OAuth authorization URL
   */
  initiateOAuth(state: string, scopes: string[]): OAuthInitResponse;
  
  /**
   * Exchange authorization code for tokens
   */
  exchangeCode(code: string): Promise<OAuthTokens>;
  
  /**
   * Refresh access token using refresh token
   */
  refreshTokens(tokens: OAuthTokens): Promise<OAuthTokens>;
  
  /**
   * Validate stored credentials are still valid
   */
  validateCredentials(tokens: OAuthTokens): Promise<boolean>;
  
  /**
   * Revoke/deauthorize the connection
   */
  revokeAccess(tokens: OAuthTokens): Promise<void>;
  
  // ========== CONTENT OPERATIONS ==========
  
  /**
   * Publish a post to the platform
   */
  publishPost(post: PostContent, tokens: OAuthTokens): Promise<PublishResult>;
  
  /**
   * Update an existing post (if platform supports)
   */
  updatePost?(postId: string, updates: PostUpdate, tokens: OAuthTokens): Promise<UpdateResult>;
  
  /**
   * Delete a post from the platform
   */
  deletePost(postId: string, tokens: OAuthTokens): Promise<void>;
  
  /**
   * Get post details from platform
   */
  getPost(postId: string, tokens: OAuthTokens): Promise<PlatformPost>;
  
  /**
   * Get user's scheduled posts (if platform supports)
   */
  getScheduledPosts?(tokens: OAuthTokens): Promise<PlatformPost[]>;
  
  // ========== MEDIA ==========
  
  /**
   * Upload media to platform (returns platform media ID)
   */
  uploadMedia(media: MediaFile, tokens: OAuthTokens): Promise<MediaUploadResult>;
  
  /**
   * Get media upload status (for async uploads)
   */
  getMediaStatus?(mediaId: string, tokens: OAuthTokens): Promise<MediaStatus>;
  
  // ========== ENGAGEMENT ==========
  
  /**
   * Get comments on a post
   */
  getComments(postId: string, options: CommentOptions, tokens: OAuthTokens): Promise<Comment[]>;
  
  /**
   * Reply to a comment
   */
  replyToComment(commentId: string, reply: string, tokens: OAuthTokens): Promise<ReplyResult>;
  
  /**
   * Get post mentions/tags
   */
  getMentions?(options: MentionOptions, tokens: OAuthTokens): Promise<Mention[]>;
  
  /**
   * Get direct messages (if platform supports API access)
   */
  getMessages?(options: MessageOptions, tokens: OAuthTokens): Promise<Message[]>;
  
  /**
   * Send direct message (if platform supports)
   */
  sendMessage?(recipientId: string, message: string, tokens: OAuthTokens): Promise<MessageResult>;
  
  // ========== ANALYTICS ==========
  
  /**
   * Get analytics for a specific post
   */
  getPostAnalytics(postId: string, tokens: OAuthTokens): Promise<PostAnalytics>;
  
  /**
   * Get account/channel analytics
   */
  getAccountAnalytics(period: AnalyticsPeriod, tokens: OAuthTokens): Promise<AccountAnalytics>;
  
  /**
   * Get follower count and demographics
   */
  getFollowerStats(tokens: OAuthTokens): Promise<FollowerStats>;
  
  // ========== WEBHOOKS ==========
  
  /**
   * Register webhook for real-time events (if platform supports)
   */
  subscribeWebhook?(callbackUrl: string, events: string[], tokens: OAuthTokens): Promise<WebhookSubscription>;
  
  /**
   * Verify webhook signature
   */
  verifyWebhookSignature?(payload: unknown, signature: string, secret: string): boolean;
  
  // ========== RATE LIMITING ==========
  
  /**
   * Get current rate limit status
   */
  getRateLimitStatus(tokens: OAuthTokens): Promise<RateLimitStatus>;
  
  /**
   * Calculate backoff time based on rate limit headers
   */
  calculateBackoff(headers: Record<string, string>): number;
}

// Supporting types
interface PlatformCapabilities {
  maxCharacters?: number;
  supportsImages: boolean;
  supportsVideos: boolean;
  supportsStories: boolean;
  supportsThreads: boolean;
  supportsScheduling: boolean;
  supportsEditing: boolean;
  supportsComments: boolean;
  supportsDMs: boolean;
  supportsAnalytics: boolean;
  supportsWebhooks: boolean;
  videoMaxDuration?: number; // seconds
  videoMaxSize?: number; // bytes
  imageMaxSize?: number; // bytes
  supportedAspectRatios: string[]; // e.g., ['1:1', '16:9', '4:5']
}

interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  tokenType: string;
  scope: string[];
}

interface PublishResult {
  platformPostId: string;
  platformPostUrl: string;
  publishedAt: Date;
  metadata?: Record<string, unknown>;
}
```

---

## Platform-Specific Details

### Facebook (Graph API v19.0+)

#### OAuth Configuration
```typescript
const facebookConfig = {
  authorizationEndpoint: 'https://www.facebook.com/v19.0/dialog/oauth',
  tokenEndpoint: 'https://graph.facebook.com/v19.0/oauth/access_token',
  scopes: [
    'pages_read_engagement',
    'pages_manage_posts',
    'pages_read_user_content',
    'pages_manage_engagement',
    'pages_manage_metadata'
  ],
  
  // Exchange short-lived token for long-lived
  exchangeForLongLived: true,
  
  // Token refresh strategy
  refreshStrategy: 'auto', // Facebook tokens are 60 days, auto-refresh at 50
};
```

#### Publishing
- **Pages Only:** Personal profiles not supported via API
- **Content Types:** Text, images, videos, links, carousels
- **Reels:** Via `/page-id/video_reels`
- **Stories:** Limited API support (reminder notifications recommended)

#### Rate Limits
- **User Token:** 200 calls/hour/user
- **Page Token:** Depends on page activity (varies)
- **Error Code 4:** Application request limit reached
- **Error Code 32:** Page request limit reached

```typescript
class FacebookConnector implements PlatformConnector {
  readonly name = 'facebook';
  readonly version = '19.0';
  readonly capabilities = {
    maxCharacters: 63206,
    supportsImages: true,
    supportsVideos: true,
    supportsStories: false, // Limited
    supportsThreads: false,
    supportsScheduling: false, // Via API only with scheduled_publish_time
    supportsEditing: true,
    supportsComments: true,
    supportsDMs: false,
    supportsAnalytics: true,
    supportsWebhooks: true,
    videoMaxDuration: 240 * 60, // 4 hours
    videoMaxSize: 10 * 1024 * 1024 * 1024, // 10GB
    imageMaxSize: 8 * 1024 * 1024, // 8MB
    supportedAspectRatios: ['1:1', '1.91:1', '4:5']
  };

  async publishPost(post: PostContent, tokens: OAuthTokens): Promise<PublishResult> {
    const endpoint = `/${post.targetPageId}/feed`;
    
    const params: any = {
      message: post.content,
      access_token: tokens.accessToken
    };
    
    if (post.media?.length > 0) {
      if (post.media.length === 1) {
        params.url = post.media[0].url; // Single image/video
      } else {
        params.attached_media = post.media.map(m => ({ media_fbid: m.platformMediaId }));
      }
    }
    
    if (post.scheduledAt) {
      params.scheduled_publish_time = Math.floor(post.scheduledAt.getTime() / 1000);
      params.published = false;
    }
    
    const response = await this.graphApi.post(endpoint, params);
    
    return {
      platformPostId: response.id,
      platformPostUrl: `https://facebook.com/${response.id}`,
      publishedAt: new Date()
    };
  }
  
  async getComments(postId: string, options: CommentOptions, tokens: OAuthTokens): Promise<Comment[]> {
    const response = await this.graphApi.get(`/${postId}/comments`, {
      access_token: tokens.accessToken,
      fields: 'id,message,from,created_time,like_count,comment_count',
      limit: options.limit || 25
    });
    
    return response.data.map(c => ({
      id: c.id,
      content: c.message,
      author: {
        name: c.from?.name,
        id: c.from?.id
      },
      createdAt: new Date(c.created_time),
      likeCount: c.like_count
    }));
  }
}
```

---

### Instagram (Graph API v19.0+)

#### OAuth Configuration
```typescript
const instagramConfig = {
  authorizationEndpoint: 'https://www.facebook.com/v19.0/dialog/oauth',
  tokenEndpoint: 'https://graph.facebook.com/v19.0/oauth/access_token',
  scopes: [
    'instagram_basic',
    'instagram_content_publish',
    'instagram_manage_comments',
    'instagram_manage_insights',
    'pages_read_engagement'
  ],
  
  // Instagram requires Facebook Page connection
  requiresFacebookPage: true,
  
  // Account types supported
  supportedAccountTypes: ['BUSINESS', 'CREATOR']
};
```

#### Publishing Flow
```
1. Upload media container
   POST /{ig-user-id}/media
   → Returns container ID

2. Check container status
   GET /{container-id}?fields=status_code
   → Wait for "FINISHED"

3. Publish container
   POST /{ig-user-id}/media_publish
   → Returns media ID
```

#### Content Constraints
| Type | Requirements |
|------|--------------|
| Image | JPG/PNG, 8MB max, aspect ratio 4:5 to 1.91:1 |
| Video | MP4/MOV, 100MB max (feed), 1GB max (reels), 60s max (feed), 90m max (reels) |
| Stories | 1080x1920, 24h duration |
| Carousel | 2-10 images/videos |
| Reels | Must be between 15s-90m, aspect ratio 9:16 |

#### Rate Limits
- **Publishing:** 25 posts/24h per account
- **API Calls:** 200/hour per user

```typescript
class InstagramConnector implements PlatformConnector {
  readonly name = 'instagram';
  readonly version = '19.0';
  
  async uploadMedia(media: MediaFile, tokens: OAuthTokens): Promise<MediaUploadResult> {
    // Step 1: Create media container
    const container = await this.graphApi.post(`/${tokens.igUserId}/media`, {
      image_url: media.type === 'image' ? media.url : undefined,
      video_url: media.type === 'video' ? media.url : undefined,
      media_type: media.type === 'video' ? 'REELS' : undefined,
      caption: media.caption || '',
      access_token: tokens.accessToken
    });
    
    // Step 2: Poll for completion (async for videos)
    if (media.type === 'video') {
      await this.pollForContainerStatus(container.id, tokens);
    }
    
    return {
      platformMediaId: container.id,
      status: 'ready'
    };
  }
  
  async publishPost(post: PostContent, tokens: OAuthTokens): Promise<PublishResult> {
    const mediaIds = await Promise.all(
      post.media.map(m => this.uploadMedia(m, tokens).then(r => r.platformMediaId))
    );
    
    let creationId: string;
    
    if (mediaIds.length === 1) {
      creationId = mediaIds[0];
    } else {
      // Carousel
      const carousel = await this.graphApi.post(`/${tokens.igUserId}/media`, {
        media_type: 'CAROUSEL',
        children: mediaIds.join(','),
        caption: post.content,
        access_token: tokens.accessToken
      });
      creationId = carousel.id;
    }
    
    // Publish
    const publishResult = await this.graphApi.post(`/${tokens.igUserId}/media_publish`, {
      creation_id: creationId,
      access_token: tokens.accessToken
    });
    
    return {
      platformPostId: publishResult.id,
      platformPostUrl: `https://instagram.com/p/${publishResult.shortcode || publishResult.id}`,
      publishedAt: new Date()
    };
  }
}
```

---

### Twitter/X (API v2)

#### OAuth Configuration
```typescript
const twitterConfig = {
  // OAuth 2.0 (required for write access)
  authorizationEndpoint: 'https://twitter.com/i/oauth2/authorize',
  tokenEndpoint: 'https://api.twitter.com/2/oauth2/token',
  pkceRequired: true,
  
  scopes: [
    'tweet.read',
    'tweet.write',
    'users.read',
    'follows.read',
    'offline.access',
    'like.read',
    'like.write',
    'block.read',
    'mute.read'
  ],
  
  // Twitter uses OAuth 2.0 with PKCE
  pkce: {
    enabled: true,
    method: 'S256'
  }
};
```

#### API Tiers
| Tier | Price | Tweets/mo | Rate Limit |
|------|-------|-----------|------------|
| Free | $0 | 1,500 | 500/day |
| Basic | $100/mo | 3,000 | 3,000/day |
| Pro | $5,000/mo | 1M | 300/min |

#### Publishing
```typescript
class TwitterConnector implements PlatformConnector {
  readonly name = 'twitter';
  readonly version = '2';
  readonly capabilities = {
    maxCharacters: 4000, // For Twitter Blue, 280 otherwise
    supportsImages: true,
    supportsVideos: true,
    supportsThreads: true,
    supportsScheduling: false,
    supportsEditing: true, // Within 30 min
    supportsComments: true,
    videoMaxDuration: 140, // 2:20 for most accounts
    videoMaxSize: 512 * 1024 * 1024, // 512MB
    imageMaxSize: 5 * 1024 * 1024, // 5MB
    supportedAspectRatios: ['1:1', '16:9']
  };
  
  async publishPost(post: PostContent, tokens: OAuthTokens): Promise<PublishResult> {
    // Handle threads
    if (post.content.length > this.getMaxLength(tokens)) {
      return this.publishThread(post, tokens);
    }
    
    const mediaIds: string[] = [];
    if (post.media?.length) {
      for (const media of post.media) {
        const uploaded = await this.uploadMedia(media, tokens);
        mediaIds.push(uploaded.platformMediaId);
      }
    }
    
    const tweet = await this.api.v2.tweet(post.content, {
      media: mediaIds.length ? { media_ids: mediaIds } : undefined
    });
    
    return {
      platformPostId: tweet.data.id,
      platformPostUrl: `https://twitter.com/i/web/status/${tweet.data.id}`,
      publishedAt: new Date()
    };
  }
  
  async uploadMedia(media: MediaFile, tokens: OAuthTokens): Promise<MediaUploadResult> {
    // Twitter uses chunked upload for videos
    if (media.type === 'video') {
      return this.chunkedUpload(media, tokens);
    }
    
    const mediaData = await this.api.v1.uploadMedia(media.buffer, {
      mimeType: media.mimeType
    });
    
    return {
      platformMediaId: mediaData,
      status: 'ready'
    };
  }
  
  private async chunkedUpload(media: MediaFile, tokens: OAuthTokens): Promise<MediaUploadResult> {
    // INIT → APPEND (chunks) → FINALIZE → STATUS (wait for processing)
    const init = await this.api.v1.post('media/upload', {
      command: 'INIT',
      total_bytes: media.size,
      media_type: media.mimeType,
      media_category: 'tweet_video'
    });
    
    const mediaId = init.media_id_string;
    
    // Upload chunks
    const chunkSize = 5 * 1024 * 1024; // 5MB chunks
    const chunks = Math.ceil(media.size / chunkSize);
    
    for (let i = 0; i < chunks; i++) {
      await this.api.v1.post('media/upload', {
        command: 'APPEND',
        media_id: mediaId,
        segment_index: i,
        media_data: media.buffer.slice(i * chunkSize, (i + 1) * chunkSize).toString('base64')
      });
    }
    
    // Finalize
    await this.api.v1.post('media/upload', {
      command: 'FINALIZE',
      media_id: mediaId
    });
    
    // Wait for processing
    await this.waitForMediaProcessing(mediaId, tokens);
    
    return { platformMediaId: mediaId, status: 'ready' };
  }
}
```

---

### LinkedIn (API v2)

#### OAuth Configuration
```typescript
const linkedinConfig = {
  authorizationEndpoint: 'https://www.linkedin.com/oauth/v2/authorization',
  tokenEndpoint: 'https://www.linkedin.com/oauth/v2/accessToken',
  scopes: [
    'r_basicprofile',
    'r_organization_social',
    'rw_organization_admin',
    'w_member_social',
    'r_1st_connections_size'
  ],
  
  // LinkedIn has strict rate limits
  rateLimitTier: 'strict'
};
```

#### Publishing
```typescript
class LinkedInConnector implements PlatformConnector {
  readonly name = 'linkedin';
  readonly version = '2';
  
  async publishPost(post: PostContent, tokens: OAuthTokens): Promise<PublishResult> {
    const author = post.targetType === 'company' 
      ? `urn:li:organization:${post.targetId}`
      : `urn:li:person:${tokens.personId}`;
    
    const shareContent: any = {
      shareCommentary: { text: post.content },
      shareMediaCategory: 'NONE'
    };
    
    if (post.media?.length > 0) {
      const media = post.media[0];
      
      if (media.type === 'image') {
        shareContent.shareMediaCategory = 'IMAGE';
        shareContent.media = [{
          status: 'READY',
          description: { text: media.alt || '' },
          originalUrl: media.url,
          title: { text: media.title || '' }
        }];
      } else if (media.type === 'video') {
        shareContent.shareMediaCategory = 'VIDEO';
        // Video requires separate upload process
      }
    }
    
    const body = {
      author,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': shareContent
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };
    
    const response = await this.api.post('/v2/ugcPosts', body, {
      headers: { 'X-Restli-Protocol-Version': '2.0.0' }
    });
    
    return {
      platformPostId: response.id,
      platformPostUrl: `https://www.linkedin.com/feed/update/${response.id}`,
      publishedAt: new Date()
    };
  }
}
```

---

### YouTube (Data API v3)

#### OAuth Configuration
```typescript
const youtubeConfig = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  scopes: [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube.force-ssl'
  ],
  
  // YouTube has quota units (10,000/day default)
  quotaLimits: {
    videoUpload: 1600, // Per video
    search: 100,       // Per search
    mostOperations: 1  // Per call
  }
};
```

#### Publishing
```typescript
class YouTubeConnector implements PlatformConnector {
  readonly name = 'youtube';
  readonly version = '3';
  readonly capabilities = {
    supportsVideos: true,
    supportsImages: false, // Thumbnails only
    supportsComments: true,
    videoMaxDuration: 12 * 60 * 60, // 12 hours
    videoMaxSize: 256 * 1024 * 1024 * 1024, // 256GB
    supportedAspectRatios: ['16:9']
  };
  
  async publishPost(post: PostContent, tokens: OAuthTokens): Promise<PublishResult> {
    // YouTube videos require resumable upload
    const video = post.media?.find(m => m.type === 'video');
    if (!video) throw new Error('YouTube requires video content');
    
    const metadata = {
      snippet: {
        title: post.title || post.content.slice(0, 100),
        description: post.content,
        tags: post.tags,
        categoryId: post.category || '22' // People & Blogs default
      },
      status: {
        privacyStatus: post.scheduledAt ? 'private' : 'public',
        publishAt: post.scheduledAt?.toISOString()
      }
    };
    
    const uploadResult = await this.resumableUpload(video, metadata, tokens);
    
    return {
      platformPostId: uploadResult.id,
      platformPostUrl: `https://youtube.com/watch?v=${uploadResult.id}`,
      publishedAt: new Date()
    };
  }
  
  private async resumableUpload(video: MediaFile, metadata: any, tokens: OAuthTokens) {
    // Step 1: Initialize upload
    const initResponse = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': video.mimeType,
        'X-Upload-Content-Length': video.size.toString()
      },
      body: JSON.stringify(metadata)
    });
    
    const uploadUrl = initResponse.headers.get('Location');
    
    // Step 2: Upload video content (resumable)
    const uploadResponse = await fetch(uploadUrl!, {
      method: 'PUT',
      headers: {
        'Content-Type': video.mimeType,
        'Content-Range': `bytes 0-${video.size - 1}/${video.size}`
      },
      body: video.buffer
    });
    
    return await uploadResponse.json();
  }
}
```

---

### TikTok (Content Posting API v2)

**Status:** ✅ Implemented

#### OAuth v2 Configuration
```typescript
const tiktokConfig = {
  authorizationEndpoint: 'https://www.tiktok.com/v2/auth/authorize/',
  tokenEndpoint: 'https://open.tiktokapis.com/v2/oauth/token/',
  revokeEndpoint: 'https://open.tiktokapis.com/v2/oauth/revoke/',
  scopes: [
    'user.info.basic',
    'video.publish',
    'video.upload',
  ],
  pkce: { enabled: true, method: 'S256' }, // Required for mobile/desktop
};
```

#### Token Response
```typescript
{
  access_token: "act.example12345Example",
  expires_in: 86400,           // 24 hours
  refresh_token: "rft.example12345Example",
  refresh_expires_in: 31536000, // 365 days
  open_id: "afd97af1-b87b-48b9-ac98-410aghda5344",
  scope: "user.info.basic,video.publish",
  token_type: "Bearer"
}
```

#### Content Posting API Flow
```
1. Query Creator Info (required before posting)
   POST /v2/post/publish/creator_info/query/
   → Returns: avatar, username, privacy options, max duration, feature flags

2. Initialize Post
   Video: POST /v2/post/publish/video/init/
   Photo: POST /v2/post/publish/content/init/
   → Returns: publish_id + upload_url (FILE_UPLOAD only)

3. Upload File (FILE_UPLOAD only)
   PUT <upload_url> with Content-Range header
   → Video processed asynchronously

4. Check Status
   POST /v2/post/publish/status/fetch/
   → Status: PROCESSING_UPLOAD → PUBLISH_COMPLETE | FAILED
```

#### Publishing Modes
| Mode | Endpoint | Scopes | Use Case |
|------|----------|--------|----------|
| **Direct Post** (video) | `/v2/post/publish/video/init/` | `video.publish` | Publish immediately to user's feed |
| **Direct Post** (photo) | `/v2/post/publish/content/init/` | `video.publish` | Post up to 35 photos |
| **Upload** (video) | `/v2/post/publish/inbox/video/init/` | `video.upload` | Send to user inbox for editing |
| **Upload** (photo) | `/v2/post/publish/content/init/` | `video.upload` | MEDIA_UPLOAD mode |

#### Rate Limits (per access_token)
| Endpoint | Limit |
|----------|-------|
| Creator Info | 20 req/min |
| Video Init | 6 req/min |
| Status Fetch | 30 req/min |

#### Error Codes
| Code | Meaning | Action |
|------|---------|--------|
| `access_token_invalid` | Token expired | Refresh token |
| `scope_not_authorized` | Missing scope | Re-authorize user |
| `rate_limit_exceeded` | Too many requests | Backoff + retry |
| `privacy_level_option_mismatch` | Invalid privacy | Use options from creator_info |
| `unaudited_client_can_only_post_to_private_accounts` | Need audit | Apply for audit |
| `url_ownership_unverified` | URL not verified | Verify domain in dev portal |
| `spam_risk_too_many_posts` | Daily cap reached | Wait 24h |

#### Implementation Notes
- **Unaudited clients**: All content posts as private (SELF_ONLY). Apply for audit at https://developers.tiktok.com/application/content-posting-api to enable public posting.
- **Photo URLs**: Must be from verified domain (verify via dev portal)
- **Video upload_url**: Valid for 1 hour after issuance
- **No text-only posts**: Content Posting API requires video or photo
- **No analytics**: Use Research API (separate product) for metrics

---

## Token Management

### Token Refresh Strategy

```typescript
class TokenManager {
  private refreshBuffer = 5 * 60 * 1000; // Refresh 5 min before expiry
  
  async getValidToken(channelId: string): Promise<OAuthTokens> {
    const tokens = await this.db.getTokens(channelId);
    
    // Check if token needs refresh
    if (tokens.expiresAt && tokens.expiresAt.getTime() - Date.now() < this.refreshBuffer) {
      const connector = this.getConnector(channelId);
      const refreshed = await connector.refreshTokens(tokens);
      
      await this.db.updateTokens(channelId, refreshed);
      return refreshed;
    }
    
    return tokens;
  }
  
  async handleTokenRefreshFailure(channelId: string, error: Error) {
    // Mark channel as disconnected
    await this.db.updateChannelStatus(channelId, 'disconnected', error.message);
    
    // Notify user via webhook/email
    await this.notifications.sendTokenExpired(channelId);
  }
}
```

### Background Refresh Job

```typescript
// Runs every hour
async function refreshExpiringTokens() {
  const expiringTokens = await db.channels
    .where('token_expires_at', '<', new Date(Date.now() + 60 * 60 * 1000))
    .where('status', 'active')
    .select();
  
  for (const channel of expiringTokens) {
    try {
      const connector = getConnector(channel.platform);
      const refreshed = await connector.refreshTokens({
        accessToken: channel.access_token,
        refreshToken: channel.refresh_token
      });
      
      await db.channels.update(channel.id, {
        access_token: refreshed.accessToken,
        refresh_token: refreshed.refreshToken,
        token_expires_at: refreshed.expiresAt
      });
    } catch (error) {
      await tokenManager.handleTokenRefreshFailure(channel.id, error);
    }
  }
}
```

---

## Rate Limiting

### Distributed Rate Limiter

```typescript
class RateLimiter {
  constructor(private redis: Redis) {}
  
  async checkLimit(
    key: string,      // e.g., "twitter:user_123"
    limit: number,    // max requests
    window: number    // window in seconds
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const now = Date.now();
    const windowStart = Math.floor(now / 1000 / window) * window;
    const redisKey = `ratelimit:${key}:${windowStart}`;
    
    const current = await this.redis.incr(redisKey);
    
    if (current === 1) {
      await this.redis.expire(redisKey, window);
    }
    
    const remaining = Math.max(0, limit - current);
    const resetAt = (windowStart + window) * 1000;
    
    return {
      allowed: current <= limit,
      remaining,
      resetAt
    };
  }
}
```

### Platform-Specific Limits

```typescript
const platformRateLimits: Record<PlatformName, RateLimitConfig> = {
  facebook: {
    requestsPerHour: 200,
    window: 'hour',
    burstAllowance: 20
  },
  twitter: {
    requestsPerDay: 3000, // Basic tier
    window: 'day',
    burstAllowance: 100
  },
  instagram: {
    requestsPerHour: 200,
    publishPerDay: 25,
    window: 'hour'
  },
  // ... etc
};
```

---

## Error Handling

### Retry Strategy

```typescript
class RetryManager {
  private maxRetries = 3;
  private baseDelay = 1000;
  
  async execute<T>(
    operation: () => Promise<T>,
    platform: PlatformName
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (!this.isRetryable(error)) {
          throw error;
        }
        
        if (attempt < this.maxRetries) {
          const delay = this.calculateBackoff(attempt, error, platform);
          await sleep(delay);
        }
      }
    }
    
    throw lastError;
  }
  
  private isRetryable(error: any): boolean {
    // Network errors
    if (error.code === 'ECONNRESET') return true;
    if (error.code === 'ETIMEDOUT') return true;
    
    // HTTP status codes
    if (error.status === 429) return true; // Rate limited
    if (error.status >= 500) return true;  // Server error
    if (error.status === 503) return true;  // Service unavailable
    
    return false;
  }
  
  private calculateBackoff(attempt: number, error: any, platform: PlatformName): number {
    // Use platform's rate limit reset if available
    if (error.status === 429 && error.headers?.['x-rate-limit-reset']) {
      const resetTime = parseInt(error.headers['x-rate-limit-reset']) * 1000;
      return Math.max(0, resetTime - Date.now());
    }
    
    // Exponential backoff with jitter
    const base = this.baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 1000;
    return base + jitter;
  }
}
```

### Error Classification

```typescript
enum PlatformErrorCode {
  // Authentication
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_REVOKED = 'TOKEN_REVOKED',
  INSUFFICIENT_SCOPE = 'INSUFFICIENT_SCOPE',
  
  // Rate limiting
  RATE_LIMITED = 'RATE_LIMITED',
  
  // Content
  CONTENT_VIOLATES_POLICY = 'CONTENT_VIOLATES_POLICY',
  MEDIA_PROCESSING_FAILED = 'MEDIA_PROCESSING_FAILED',
  UNSUPPORTED_MEDIA_TYPE = 'UNSUPPORTED_MEDIA_TYPE',
  
  // Account
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  PAGE_NOT_PUBLISHED = 'PAGE_NOT_PUBLISHED',
  
  // General
  PLATFORM_ERROR = 'PLATFORM_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT'
}

interface PlatformError {
  code: PlatformErrorCode;
  message: string;
  platform: PlatformName;
  retryable: boolean;
  originalError: any;
}
```

---

## Webhook Handling

### Webhook Receiver

```typescript
class WebhookHandler {
  async handleIncoming(platform: PlatformName, payload: unknown, signature: string) {
    const connector = this.getConnector(platform);
    
    // Verify signature
    if (!connector.verifyWebhookSignature(payload, signature, webhookSecret)) {
      throw new Error('Invalid webhook signature');
    }
    
    // Parse event
    const event = connector.parseWebhookEvent(payload);
    
    // Process event
    switch (event.type) {
      case 'comment.created':
        await this.handleCommentCreated(event);
        break;
      case 'post.updated':
        await this.handlePostUpdated(event);
        break;
      case 'media.finished_processing':
        await this.handleMediaProcessed(event);
        break;
    }
    
    return { received: true };
  }
  
  private async handleCommentCreated(event: WebhookEvent) {
    // Upsert comment to database
    await db.comments.upsert({
      platform_comment_id: event.data.commentId,
      platform: event.platform,
      channel_id: event.channelId,
      content: event.data.content,
      author: event.data.author,
      received_at: new Date()
    });
    
    // Broadcast to WebSocket
    await this.ws.broadcast(`brand:${event.brandId}`, {
      type: 'comment.received',
      data: event.data
    });
    
    // Trigger agent webhooks
    await this.webhookDispatcher.dispatch('comment.received', event);
  }
}
```

---

## Testing Strategy

### Mock Connectors

```typescript
class MockConnector implements PlatformConnector {
  readonly name = 'mock';
  private posts: Map<string, MockPost> = new Map();
  
  async publishPost(post: PostContent): Promise<PublishResult> {
    const id = `mock_${Date.now()}`;
    this.posts.set(id, {
      id,
      content: post.content,
      publishedAt: new Date()
    });
    
    return {
      platformPostId: id,
      platformPostUrl: `https://mock.platform/post/${id}`,
      publishedAt: new Date()
    };
  }
  
  // Implement all other methods with in-memory storage
}
```

### Integration Tests

```typescript
describe('Facebook Connector Integration', () => {
  let connector: FacebookConnector;
  let testTokens: OAuthTokens;
  
  beforeAll(async () => {
    testTokens = await getTestTokens('facebook');
    connector = new FacebookConnector();
  });
  
  test('publish and retrieve post', async () => {
    const post = await connector.publishPost({
      content: 'Test post from AgentSocial integration tests',
      targetPageId: TEST_PAGE_ID
    }, testTokens);
    
    expect(post.platformPostId).toBeDefined();
    
    const retrieved = await connector.getPost(post.platformPostId, testTokens);
    expect(retrieved.content).toContain('Test post');
    
    // Cleanup
    await connector.deletePost(post.platformPostId, testTokens);
  });
  
  test('handle rate limiting', async () => {
    // Simulate rate limit
    // ...
  });
});
```
