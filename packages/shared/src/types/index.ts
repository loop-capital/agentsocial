// Shared domain types (plain TS interfaces, not Zod)
// These are used at runtime and for cross-package type references

export type Platform = "twitter" | "linkedin" | "facebook" | "instagram" | "youtube" | "tiktok" | "wordpress" | "bluesky";

export type PostStatusEnum = "draft" | "scheduled" | "published" | "failed";

export type CommentStatus = "unread" | "read" | "replied" | "archived";

export type CommentPriority = "low" | "medium" | "high" | "urgent";

export type CommentSentiment = "positive" | "neutral" | "negative" | "spam";

// ─── User / Auth ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  prefix: string;
  permissions: ("read" | "write" | "admin")[];
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

// ─── Organization / Brand / Channel ─────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  organization_id: string | null;
  name: string;
  logo_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Channel {
  id: string;
  brand_id: string;
  platform: Platform;
  name: string;
  account_id: string;
  status: "active" | "disconnected" | "error";
  follower_count: number | null;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  token_expires_at: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ─── Posts ───────────────────────────────────────────────────────────────────

export interface Post {
  id: string;
  brand_id: string;
  content: string;
  content_html: string | null;
  status: PostStatusEnum;
  scheduled_at: string | null;
  published_at: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface PostChannel {
  post_id: string;
  channel_id: string;
  platform: Platform;
  status: "pending" | "published" | "failed";
  platform_post_id: string | null;
  platform_post_url: string | null;
  published_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostMedia {
  id: string;
  post_id: string;
  asset_id: string;
  created_at: string;
}

export interface PostAnalytics {
  id: string;
  post_id: string;
  channel_id: string;
  impressions: number;
  reach: number | null;
  engagements: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  updated_at: string;
}

// ─── Comments ────────────────────────────────────────────────────────────────

export interface Comment {
  id: string;
  channel_id: string;
  platform_comment_id: string;
  post_id: string | null;
  author_name: string;
  author_username: string;
  author_avatar_url: string | null;
  author_is_verified: boolean;
  author_follower_count: number | null;
  content: string;
  content_html: string | null;
  sentiment: CommentSentiment | null;
  sentiment_confidence: number | null;
  priority: CommentPriority;
  status: CommentStatus;
  platform_url: string | null;
  received_at: string;
  created_at: string;
  updated_at: string;
}

export interface CommentReply {
  id: string;
  comment_id: string;
  user_id: string;
  content: string;
  status: "sending" | "sent" | "failed";
  sent_at: string | null;
  created_at: string;
}

export interface AISuggestedReply {
  content: string;
  confidence: number;
  tone: "friendly" | "professional" | "humorous";
}

// ─── Media ───────────────────────────────────────────────────────────────────

export interface MediaAsset {
  id: string;
  brand_id: string;
  uploader_user_id: string;
  type: "image" | "video";
  url: string;
  thumbnail_url: string | null;
  filename: string;
  mime_type: string;
  file_size_bytes: number;
  width: number | null;
  height: number | null;
  processing_status: "processing" | "complete" | "failed";
  created_at: string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface DailyAnalytics {
  date: string;
  impressions: number;
  engagements: number;
  followers: number;
  posts_published: number;
}

export interface ChannelAnalytics {
  channel_id: string;
  platform: Platform;
  name: string;
  followers: number;
  followers_growth: number;
  impressions: number;
  engagements: number;
  engagement_rate: number;
}

// ─── Webhooks ────────────────────────────────────────────────────────────────

export interface Webhook {
  id: string;
  user_id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  created_at: string;
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginationMeta {
  has_more: boolean;
  next_cursor: string | null;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ─── API Response Wrappers ──────────────────────────────────────────────────

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: { field: string; message: string }[];
    request_id: string;
  };
}