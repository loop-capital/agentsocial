import { z } from "zod";

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Brands ──────────────────────────────────────────────────────────────────

export const createBrandSchema = z.object({
  name: z.string().min(1).max(100),
  organization_id: z.string().optional(),
  timezone: z.string().default("UTC"),
});

// ─── Channels ────────────────────────────────────────────────────────────────

export const connectChannelSchema = z.object({
  brand_id: z.string().min(1),
  platform: z.enum(["twitter", "linkedin", "facebook", "instagram", "youtube", "tiktok", "wordpress", "bluesky"]),
});

export const updateChannelSchema = z.object({
  settings: z.object({
    auto_reply_enabled: z.boolean().optional(),
    auto_reply_message: z.string().optional(),
    post_defaults: z.object({
      add_utm: z.boolean().optional(),
      utm_source: z.string().optional(),
    }).optional(),
  }).optional(),
});

// ─── Posts ────────────────────────────────────────────────────────────────────

export const createPostSchema = z.object({
  brand_id: z.string().min(1),
  content: z.string().min(1).max(2000),
  content_html: z.string().optional(),
  channels: z.array(z.string()).min(1),
  media: z.array(z.object({
    type: z.enum(["image", "video"]),
    url: z.string().url(),
    alt_text: z.string().optional(),
  })).optional(),
  scheduled_at: z.string().datetime().optional(),
  timezone: z.string().default("UTC"),
  tags: z.array(z.string()).optional(),
  platform_variants: z.record(z.string(), z.object({
    content: z.string().optional(),
  })).optional(),
});

export const updatePostSchema = z.object({
  content: z.string().min(1).max(2000).optional(),
  content_html: z.string().optional(),
  channels: z.array(z.string()).optional(),
  scheduled_at: z.string().datetime().optional(),
  timezone: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const postStatusSchema = z.enum(["draft", "scheduled", "published", "failed"]);

// ─── Comments ───────────────────────────────────────────────────────────────

export const replyToCommentSchema = z.object({
  content: z.string().min(1).max(1000),
  use_ai_suggestion: z.boolean().default(false),
});

export const bulkUpdateCommentsSchema = z.object({
  ids: z.array(z.string()).min(1),
  action: z.enum(["mark_read", "mark_unread", "archive", "set_priority"]),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
});

export const suggestReplySchema = z.object({
  tone: z.enum(["friendly", "professional", "humorous"]).default("friendly"),
  include_cta: z.boolean().default(false),
});

// ─── Analytics ──────────────────────────────────────────────────────────────

export const analyticsQuerySchema = z.object({
  brand_id: z.string().optional(),
  channel_id: z.string().optional(),
  period: z.enum(["24h", "7d", "30d", "90d", "custom"]).default("7d"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export const exportAnalyticsSchema = z.object({
  brand_id: z.string().min(1),
  period: z.enum(["24h", "7d", "30d", "90d", "custom"]),
  format: z.enum(["pdf", "csv", "xlsx"]).default("pdf"),
  include_charts: z.boolean().default(true),
  branded: z.boolean().default(true),
});

// ─── Media ───────────────────────────────────────────────────────────────────

export const uploadMediaSchema = z.object({
  brand_id: z.string().min(1),
  type: z.enum(["image", "video"]),
});

// ─── Webhooks ────────────────────────────────────────────────────────────────

export const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(["post.scheduled", "post.published", "post.failed", "comment.received"])),
  secret: z.string().min(16).optional(),
  active: z.boolean().default(true),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type ConnectChannelInput = z.infer<typeof connectChannelSchema>;
export type UpdateChannelInput = z.infer<typeof updateChannelSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type PostStatus = z.infer<typeof postStatusSchema>;
export type ReplyToCommentInput = z.infer<typeof replyToCommentSchema>;
export type BulkUpdateCommentsInput = z.infer<typeof bulkUpdateCommentsSchema>;
export type SuggestReplyInput = z.infer<typeof suggestReplySchema>;
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
export type ExportAnalyticsInput = z.infer<typeof exportAnalyticsSchema>;
export type UploadMediaInput = z.infer<typeof uploadMediaSchema>;
export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;