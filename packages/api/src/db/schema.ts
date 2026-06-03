import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { nanoid } from "nanoid";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const platformEnum = pgEnum("platform", [
  "twitter", "linkedin", "facebook", "instagram",
  "youtube", "tiktok", "wordpress", "bluesky",
]);

export const postStatusEnum = pgEnum("post_status", [
  "draft", "scheduled", "published", "failed", "cancelled",
]);

export const channelStatusEnum = pgEnum("channel_status", [
  "active", "disconnected", "error",
]);

export const commentStatusEnum = pgEnum("comment_status", [
  "unread", "read", "replied", "archived",
]);

export const commentPriorityEnum = pgEnum("comment_priority", [
  "low", "medium", "high", "urgent",
]);

export const commentSentimentEnum = pgEnum("comment_sentiment", [
  "positive", "neutral", "negative", "spam",
]);

export const mediaProcessingStatusEnum = pgEnum("media_processing_status", [
  "processing", "complete", "failed",
]);

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── API Keys ────────────────────────────────────────────────────────────────

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull(),
  prefix: text("prefix").notNull(),
  permissions: text("permissions").array().notNull().$type<string[]>().default(["read"]),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Organizations ──────────────────────────────────────────────────────────

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Organization Memberships ──────────────────────────────────────────────

export const organizationMemberships = pgTable("organization_memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"), // admin, member, viewer
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Brands ────────────────────────────────────────────────────────────────

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing", "active", "past_due", "canceled", "inactive",
]);

export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "set null" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  timezone: text("timezone").notNull().default("UTC"),
  // ── Billing ──
  subscriptionStatus: subscriptionStatusEnum("subscription_status").notNull().default("inactive"),
  subscriptionPlan: text("subscription_plan"), // free, pro, agency
  squareCustomerId: text("square_customer_id"),
  squareSubscriptionId: text("square_subscription_id"),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Channels ──────────────────────────────────────────────────────────────

export const channels = pgTable("channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  platform: platformEnum("platform").notNull(),
  name: text("name").notNull(),
  accountId: text("account_id").notNull(),
  status: channelStatusEnum("status").notNull().default("active"),
  followerCount: integer("follower_count"),
  accessTokenEncrypted: text("access_token_encrypted"),
  refreshTokenEncrypted: text("refresh_token_encrypted"),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
  // Browser automation credentials (alternative to OAuth — for individual pros)
  usernameEncrypted: text("username_encrypted"),
  passwordEncrypted: text("password_encrypted"),
  authMethod: text("auth_method").notNull().default("oauth"), // "oauth" | "browser"
  settings: jsonb("settings").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Posts ─────────────────────────────────────────────────────────────────

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  contentHtml: text("content_html"),
  status: postStatusEnum("status").notNull().default("draft"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdByUserId: uuid("created_by_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Post Channels (join table) ────────────────────────────────────────────

export const postChannels = pgTable("post_channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  channelId: uuid("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  platform: platformEnum("platform").notNull(),
  status: text("status").notNull().default("pending"), // pending, published, failed
  platformPostId: text("platform_post_id"),
  platformPostUrl: text("platform_post_url"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Media Assets ──────────────────────────────────────────────────────────

export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  uploaderUserId: uuid("uploader_user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // image, video
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSizeBytes: integer("file_size_bytes").notNull(),
  width: integer("width"),
  height: integer("height"),
  processingStatus: mediaProcessingStatusEnum("processing_status").notNull().default("processing"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
// ─── Post Media ────────────────────────────────────────────────────────────

export const postMedia = pgTable("post_media", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  assetId: uuid("asset_id").notNull().references(() => mediaAssets.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});


// ─── Comments ─────────────────────────────────────────────────────────────

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  platformCommentId: text("platform_comment_id").notNull(),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "set null" }),
  authorName: text("author_name").notNull(),
  authorUsername: text("author_username").notNull(),
  authorAvatarUrl: text("author_avatar_url"),
  authorIsVerified: boolean("author_is_verified").notNull().default(false),
  authorFollowerCount: integer("author_follower_count"),
  content: text("content").notNull(),
  contentHtml: text("content_html"),
  sentiment: commentSentimentEnum("sentiment"),
  sentimentConfidence: integer("sentiment_confidence"),
  priority: commentPriorityEnum("priority").notNull().default("medium"),
  status: commentStatusEnum("status").notNull().default("unread"),
  platformUrl: text("platform_url"),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Comment Replies ───────────────────────────────────────────────────────

export const commentReplies = pgTable("comment_replies", {
  id: uuid("id").primaryKey().defaultRandom(),
  commentId: uuid("comment_id").notNull().references(() => comments.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  status: text("status").notNull().default("sending"), // sending, sent, failed
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Post Analytics ────────────────────────────────────────────────────────

export const postAnalytics = pgTable("post_analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  channelId: uuid("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  impressions: integer("impressions").notNull().default(0),
  reach: integer("reach"),
  engagements: integer("engagements").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  shares: integer("shares").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Daily Analytics ───────────────────────────────────────────────────────

export const dailyAnalytics = pgTable("daily_analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  channelId: uuid("channel_id").references(() => channels.id, { onDelete: "cascade" }),
  date: timestamp("date", { withTimezone: true }).notNull(),
  impressions: integer("impressions").notNull().default(0),
  engagements: integer("engagements").notNull().default(0),
  followers: integer("followers").notNull().default(0),
  postsPublished: integer("posts_published").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Webhooks ──────────────────────────────────────────────────────────────

export const webhooks = pgTable("webhooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  events: text("events").array().notNull(),
  secretHash: text("secret_hash").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Export Jobs ───────────────────────────────────────────────────────────

export const exportJobs = pgTable("export_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  brandId: uuid("brand_id").notNull().references(() => brands.id),
  status: text("status").notNull().default("processing"), // processing, completed, failed
  format: text("format").notNull(),
  downloadUrl: text("download_url"),
  estimatedCompletion: timestamp("estimated_completion", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Competitor Profiles ─────────────────────────────────────────────────────

export const competitorProfiles = pgTable("competitor_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(), // instagram, twitter, facebook, tiktok, linkedin
  handle: text("handle").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  followerCount: integer("follower_count").notNull().default(0),
  followingCount: integer("following_count").notNull().default(0),
  postCount: integer("post_count").notNull().default(0),
  engagementRate: integer("engagement_rate"), // basis points (0-10000)
  profileUrl: text("profile_url"),
  lastFetchedAt: timestamp("last_fetched_at", { withTimezone: true }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Competitor Posts ────────────────────────────────────────────────────────

// ─── Video Sources (for Clipify) ──────────────────────────────────────────────

export const clipStatusEnum = pgEnum("clip_status", [
  "pending", "transcribing", "finding_moments", "rendering", "complete", "failed",
]);

export const videoSources = pgTable("video_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),
  title: text("title"),
  description: text("description"),
  sourceUrl: text("source_url"), // YouTube, podcast URL, or uploaded file
  sourceType: text("source_type").notNull().default("upload"), // upload, youtube, podcast, url
  localPath: text("local_path"), // server-side path after download/upload
  durationSeconds: integer("duration_seconds"),
  transcript: jsonb("transcript"), // Whisper output
  status: clipStatusEnum("status").notNull().default("pending"),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Generated Clips ─────────────────────────────────────────────────────────

export const clips = pgTable("clips", {
  id: uuid("id").primaryKey().defaultRandom(),
  videoSourceId: uuid("video_source_id").notNull().references(() => videoSources.id, { onDelete: "cascade" }),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  title: text("title"),
  description: text("description"),
  startSeconds: integer("start_seconds").notNull(),
  endSeconds: integer("end_seconds").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  format: text("format").notNull().default("9:16"), // 9:16, 16:9, 1:1
  style: text("style").notNull().default("opus"), // opus, karaoke, minimal
  reframeMode: text("reframe_mode"), // pan, split-screen, center-crop
  outputUrl: text("output_url"),
  outputPath: text("output_path"),
  thumbnailUrl: text("thumbnail_url"),
  transcript: jsonb("transcript"), // Clip-level transcript
  captionsUrl: text("captions_url"),
  whyFunny: text("why_funny"), // AI description of why this moment works
  status: clipStatusEnum("status").notNull().default("pending"),
  renderProgress: integer("render_progress").default(0),
  errorMessage: text("error_message"),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  publishedToChannels: jsonb("published_to_channels").default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const competitorPosts = pgTable("competitor_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").notNull().references(() => competitorProfiles.id, { onDelete: "cascade" }),
  externalId: text("external_id").notNull(), // platform-native post ID
  content: text("content"),
  mediaUrls: text("media_urls").array(),
  postType: text("post_type").notNull().default("standard"), // standard, reel, story, thread, carousel
  publishedAt: timestamp("published_at", { withTimezone: true }),
  likes: integer("likes").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  shares: integer("shares").notNull().default(0),
  views: integer("views").notNull().default(0),
  engagementRate: integer("engagement_rate"), // basis points
  hashtags: text("hashtags").array(),
  mentions: text("mentions").array(),
  url: text("url"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Relations ─────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  apiKeys: many(apiKeys),
  organizationMemberships: many(organizationMemberships),
  brands: many(brands),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, { fields: [apiKeys.userId], references: [users.id] }),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMemberships),
  brands: many(brands),
}));

export const organizationMembershipsRelations = relations(organizationMemberships, ({ one }) => ({
  organization: one(organizations, { fields: [organizationMemberships.organizationId], references: [organizations.id] }),
  user: one(users, { fields: [organizationMemberships.userId], references: [users.id] }),
}));

export const brandsRelations = relations(brands, ({ one, many }) => ({
  user: one(users, { fields: [brands.userId], references: [users.id] }),
  organization: one(organizations, { fields: [brands.organizationId], references: [organizations.id] }),
  channels: many(channels),
  posts: many(posts),
  mediaAssets: many(mediaAssets),
  exportJobs: many(exportJobs),
}));

export const channelsRelations = relations(channels, ({ one, many }) => ({
  brand: one(brands, { fields: [channels.brandId], references: [brands.id] }),
  comments: many(comments),
  postChannels: many(postChannels),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  brand: one(brands, { fields: [posts.brandId], references: [brands.id] }),
  postChannels: many(postChannels),
  postMedia: many(postMedia),
  analytics: many(postAnalytics),
}));

export const postChannelsRelations = relations(postChannels, ({ one }) => ({
  post: one(posts, { fields: [postChannels.postId], references: [posts.id] }),
  channel: one(channels, { fields: [postChannels.channelId], references: [channels.id] }),
}));

export const postMediaRelations = relations(postMedia, ({ one }) => ({
  post: one(posts, { fields: [postMedia.postId], references: [posts.id] }),
  asset: one(mediaAssets, { fields: [postMedia.assetId], references: [mediaAssets.id] }),
}));

export const mediaAssetsRelations = relations(mediaAssets, ({ one, many }) => ({
  brand: one(brands, { fields: [mediaAssets.brandId], references: [brands.id] }),
  uploader: one(users, { fields: [mediaAssets.uploaderUserId], references: [users.id] }),
  postMedia: many(postMedia),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  channel: one(channels, { fields: [comments.channelId], references: [channels.id] }),
  replies: many(commentReplies),
}));

export const commentRepliesRelations = relations(commentReplies, ({ one }) => ({
  comment: one(comments, { fields: [commentReplies.commentId], references: [comments.id] }),
}));

export const postAnalyticsRelations = relations(postAnalytics, ({ one }) => ({
  post: one(posts, { fields: [postAnalytics.postId], references: [posts.id] }),
}));

export const webhooksRelations = relations(webhooks, ({ one }) => ({
  user: one(users, { fields: [webhooks.userId], references: [users.id] }),
}));

export const videoSourcesRelations = relations(videoSources, ({ one, many }) => ({
  brand: one(brands, { fields: [videoSources.brandId], references: [brands.id] }),
  user: one(users, { fields: [videoSources.userId], references: [users.id] }),
  clips: many(clips),
}));

export const clipsRelations = relations(clips, ({ one }) => ({
  videoSource: one(videoSources, { fields: [clips.videoSourceId], references: [videoSources.id] }),
  brand: one(brands, { fields: [clips.brandId], references: [brands.id] }),
}));

export const exportJobsRelations = relations(exportJobs, ({ one }) => ({
  user: one(users, { fields: [exportJobs.userId], references: [users.id] }),
  brand: one(brands, { fields: [exportJobs.brandId], references: [brands.id] }),
}));

export const gbpReviewStatusEnum = pgEnum("gbp_review_status", [
  "new", "replied", "archived",
]);

export const gbpPostStatusEnum = pgEnum("gbp_post_status", [
  "draft", "scheduled", "published", "failed", "cancelled",
]);

// ─── GBP Accounts ───────────────────────────────────────────────────────────

export const gbpAccounts = pgTable("gbp_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  googleAccountId: text("google_account_id").notNull(),
  displayName: text("display_name"),
  locationId: text("location_id").notNull(),
  locationName: text("location_name"),
  address: jsonb("address"),
  phone: text("phone"),
  websiteUrl: text("website_url"),
  primaryCategory: text("primary_category"),
  categories: text("categories").array(),
  hours: jsonb("hours"),
  photos: jsonb("photos"),
  accessTokenEncrypted: text("access_token_encrypted"),
  refreshTokenEncrypted: text("refresh_token_encrypted"),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
  status: text("status").notNull().default("active"), // active, disconnected, error
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── GBP Reviews ───────────────────────────────────────────────────────────

export const gbpReviews = pgTable("gbp_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  gbpAccountId: uuid("gbp_account_id").notNull().references(() => gbpAccounts.id, { onDelete: "cascade" }),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  externalReviewId: text("external_review_id").notNull(),
  reviewerName: text("reviewer_name"),
  reviewerPhotoUrl: text("reviewer_photo_url"),
  starRating: integer("star_rating"),
  comment: text("comment"),
  replyComment: text("reply_comment"),
  replyUpdatedAt: timestamp("reply_updated_at", { withTimezone: true }),
  status: gbpReviewStatusEnum("status").notNull().default("new"),
  aiSuggestedReply: text("ai_suggested_reply"),
  aiReplyGeneratedAt: timestamp("ai_reply_generated_at", { withTimezone: true }),
  flagReason: text("flag_reason"),
  flagDetails: text("flag_details"),
  flagStatus: text("flag_status"),
  flaggedAt: timestamp("flagged_at", { withTimezone: true }),
  escalatedToGoogle: boolean("escalated_to_google").default(false),
  escalationDate: timestamp("escalation_date", { withTimezone: true }),
  supportTicketId: text("support_ticket_id"),
  createTime: timestamp("create_time", { withTimezone: true }),
  updateTime: timestamp("update_time", { withTimezone: true }),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── GBP Posts ────────────────────────────────────────────────────────────

export const gbpPosts = pgTable("gbp_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  gbpAccountId: uuid("gbp_account_id").notNull().references(() => gbpAccounts.id, { onDelete: "cascade" }),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  externalPostId: text("external_post_id"),
  title: text("title"),
  summary: text("summary").notNull(),
  actionType: text("action_type"), // BOOK, ORDER, SHOP, LEARN_MORE, SIGN_UP, CALL
  actionUrl: text("action_url"),
  mediaUrls: text("media_urls").array(),
  postType: text("post_type").notNull().default("update"), // update, offer, event
  offerDetails: jsonb("offer_details"), // { couponCode, redeemOnlineUrl, termsConditions }
  eventDetails: jsonb("event_details"), // { startTime, endTime }
  status: gbpPostStatusEnum("status").notNull().default("draft"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  externalUrl: text("external_url"),
  errorMessage: text("error_message"),
  createdByUserId: uuid("created_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── GBP Q&A ───────────────────────────────────────────────────────────────

export const gbpQuestions = pgTable("gbp_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  gbpAccountId: uuid("gbp_account_id").notNull().references(() => gbpAccounts.id, { onDelete: "cascade" }),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  externalQuestionId: text("external_question_id").notNull(),
  authorName: text("author_name"),
  questionText: text("question_text").notNull(),
  answerText: text("answer_text"),
  aiSuggestedAnswer: text("ai_suggested_answer"),
  answerUpdatedAt: timestamp("answer_updated_at", { withTimezone: true }),
  upvoteCount: integer("upvote_count").default(0),
  status: text("status").notNull().default("unanswered"), // unanswered, answered, ai_answered
  createTime: timestamp("create_time", { withTimezone: true }),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Review Solicitations ─────────────────────────────────────────────────

export const reviewSolicitations = pgTable("review_solicitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  gbpAccountId: uuid("gbp_account_id").notNull().references(() => gbpAccounts.id, { onDelete: "cascade" }),
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone").notNull(),
  clientEmail: text("client_email"),
  messageTemplate: text("message_template"),
  status: text("status").notNull().default("pending"), // pending, sent, opened, clicked, reviewed, failed
  sentAt: timestamp("sent_at", { withTimezone: true }),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  clickedAt: timestamp("clicked_at", { withTimezone: true }),
  reviewReceivedAt: timestamp("review_received_at", { withTimezone: true }),
  errorMessage: text("error_message"),
  createdByUserId: uuid("created_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── GBP Relations ───────────────────────────────────────────────────────────

export const gbpAccountsRelations = relations(gbpAccounts, ({ one, many }) => ({
  brand: one(brands, { fields: [gbpAccounts.brandId], references: [brands.id] }),
  reviews: many(gbpReviews),
  posts: many(gbpPosts),
  questions: many(gbpQuestions),
  solicitations: many(reviewSolicitations),
}));

export const gbpReviewsRelations = relations(gbpReviews, ({ one }) => ({
  account: one(gbpAccounts, { fields: [gbpReviews.gbpAccountId], references: [gbpAccounts.id] }),
  brand: one(brands, { fields: [gbpReviews.brandId], references: [brands.id] }),
}));

export const gbpPostsRelations = relations(gbpPosts, ({ one }) => ({
  account: one(gbpAccounts, { fields: [gbpPosts.gbpAccountId], references: [gbpAccounts.id] }),
  brand: one(brands, { fields: [gbpPosts.brandId], references: [brands.id] }),
}));

export const gbpQuestionsRelations = relations(gbpQuestions, ({ one }) => ({
  account: one(gbpAccounts, { fields: [gbpQuestions.gbpAccountId], references: [gbpAccounts.id] }),
  brand: one(brands, { fields: [gbpQuestions.brandId], references: [brands.id] }),
}));

export const reviewSolicitationsRelations = relations(reviewSolicitations, ({ one }) => ({
  brand: one(brands, { fields: [reviewSolicitations.brandId], references: [brands.id] }),
  account: one(gbpAccounts, { fields: [reviewSolicitations.gbpAccountId], references: [gbpAccounts.id] }),
}));

// ─── Conversion Events ────────────────────────────────────────────────────────

export const conversionEventTypeEnum = pgEnum("conversion_event_type", [
  "booking_cta_impression",
  "booking_cta_click",
  "booking_form_start",
  "booking_completed",
]);

export const conversionSourceEnum = pgEnum("conversion_source", [
  "organic",
  "chat_widget",
  "gbp",
  "ad",
  "referral",
]);

export const conversionEvents = pgTable("conversion_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  sessionId: text("session_id"),
  eventType: conversionEventTypeEnum("event_type").notNull(),
  source: conversionSourceEnum("source").notNull().default("organic"),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const conversionEventsRelations = relations(conversionEvents, ({ one }) => ({
  brand: one(brands, { fields: [conversionEvents.brandId], references: [brands.id] }),
}));

// ─── Chat Widget Configs ────────────────────────────────────────────────────

export const chatWidgetConfigs = pgTable("chat_widget_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  brandColor: text("brand_color").notNull().default("#4F46E5"),
  greetingMessage: text("greeting_message").notNull().default("Hi there! 👋 How can we help you today?"),
  position: text("position").notNull().default("bottom-right"),
  enabled: boolean("enabled").notNull().default(true),
  autoResponseEnabled: boolean("auto_response_enabled").notNull().default(true),
  autoResponseMessage: text("auto_response_message").notNull().default(""),
  businessHoursStart: text("business_hours_start").notNull().default("09:00"),
  businessHoursEnd: text("business_hours_end").notNull().default("19:00"),
  timezone: text("timezone").notNull().default("America/New_York"),
  smsFollowupEnabled: boolean("sms_followup_enabled").notNull().default(false),
  smsFollowupDelayMinutes: integer("sms_followup_delay_minutes").notNull().default(30),
  smsFollowupTemplate: text("sms_followup_template").notNull().default(""),
  poweredByText: text("powered_by_text").notNull().default("Powered by GetUpLook"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Chat Sessions ────────────────────────────────────────────────────────

export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  widgetId: text("widget_id").notNull(),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  visitorName: text("visitor_name"),
  visitorPhone: text("visitor_phone"),
  visitorEmail: text("visitor_email"),
  status: text("status").notNull().default("active"),
  leadCaptured: boolean("lead_captured").notNull().default(false),
  source: text("source").notNull().default("web"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Chat Messages ──────────────────────────────────────────────────────

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => chatSessions.id, { onDelete: "cascade" }),
  sender: text("sender").notNull(),
  content: text("content").notNull(),
  messageType: text("message_type").notNull().default("text"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Chat Follow-ups ─────────────────────────────────────────────────────

export const chatFollowups = pgTable("chat_followups", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id").notNull().references(() => chatSessions.id, { onDelete: "cascade" }),
  phone: text("phone").notNull(),
  messageTemplate: text("message_template").notNull(),
  status: text("status").notNull().default("pending"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Chat Relations ───────────────────────────────────────────────────────

export const chatWidgetConfigsRelations = relations(chatWidgetConfigs, ({ one }) => ({
  brand: one(brands, { fields: [chatWidgetConfigs.brandId], references: [brands.id] }),
}));

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  brand: one(brands, { fields: [chatSessions.brandId], references: [brands.id] }),
  messages: many(chatMessages),
  followups: many(chatFollowups),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, { fields: [chatMessages.sessionId], references: [chatSessions.id] }),
}));

export const chatFollowupsRelations = relations(chatFollowups, ({ one }) => ({
  brand: one(brands, { fields: [chatFollowups.brandId], references: [brands.id] }),
  session: one(chatSessions, { fields: [chatFollowups.sessionId], references: [chatSessions.id] }),
}));

// ─── Profiles (GetUpLook Public Business Profiles) ────────────────────────────

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  businessName: text("business_name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  phone: text("phone"),
  email: text("email"),
  websiteUrl: text("website_url"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  latitude: integer("latitude"),
  longitude: integer("longitude"),
  hours: jsonb("hours").notNull().default({}),
  photos: jsonb("photos").notNull().default([]),
  services: jsonb("services").notNull().default([]),
  ratingAvg: integer("rating_avg").default(0),
  reviewCount: integer("review_count").default(0),
  theme: text("theme").notNull().default("modern"),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const profilesRelations = relations(profiles, ({ one }) => ({
  brand: one(brands, { fields: [profiles.brandId], references: [brands.id] }),
}));

// ─── Landing Pages ──────────────────────────────────────────────────────────

export const landingPageTemplateEnum = pgEnum("landing_page_template", [
  "salon_promo",
  "new_client",
  "service_highlight",
]);

export const landingPageUrgencyEnum = pgEnum("landing_page_urgency", [
  "countdown",
  "limited_spots",
  "seasonal",
]);

export const landingPages = pgTable("landing_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  templateType: landingPageTemplateEnum("template_type").notNull().default("salon_promo"),
  headline: text("headline").notNull(),
  subheadline: text("subheadline"),
  offerText: text("offer_text"),
  originalPrice: text("original_price"),
  salePrice: text("sale_price"),
  ctaText: text("cta_text").notNull().default("Book Now"),
  ctaUrl: text("cta_url"),
  businessName: text("business_name").notNull(),
  businessCategory: text("business_category"),
  phone: text("phone"),
  address: text("address"),
  reviews: jsonb("reviews").notNull().default([]),
  features: jsonb("features").notNull().default([]),
  urgencyType: landingPageUrgencyEnum("urgency_type"),
  urgencyConfig: jsonb("urgency_config").default({}),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  conversionTrackingEnabled: boolean("conversion_tracking_enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const landingPagesRelations = relations(landingPages, ({ one }) => ({
  brand: one(brands, { fields: [landingPages.brandId], references: [brands.id] }),
}));

// ─── Gemini AI Jobs ─────────────────────────────────────────────────────────

export const geminiJobStatusEnum = pgEnum("gemini_job_status", [
  "processing", "complete", "failed",
]);

export const geminiJobTypeEnum = pgEnum("gemini_job_type", [
  "text_generate", "image_generate", "video_generate", "video_edit",
  "omni_flash_generate", "omni_flash_edit",
]);

export const geminiJobs = pgTable("gemini_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),
  jobType: geminiJobTypeEnum("job_type").notNull(),
  model: text("model"),
  prompt: text("prompt"),
  operationName: text("operation_name"), // Google long-running operation name
  config: jsonb("config").default({}),
  result: jsonb("result").default({}),
  status: geminiJobStatusEnum("status").notNull().default("processing"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const geminiJobsRelations = relations(geminiJobs, ({ one }) => ({
  brand: one(brands, { fields: [geminiJobs.brandId], references: [brands.id] }),
  user: one(users, { fields: [geminiJobs.userId], references: [users.id] }),
}));

// ─── Review Sentry ────────────────────────────────────────────────────────────

export const reviewCampaignStatusEnum = pgEnum("review_campaign_status", [
  "active", "paused", "archived",
]);

export const reviewRequestStatusEnum = pgEnum("review_request_status", [
  "sent", "opened", "rated", "redirected", "feedback_submitted",
]);

export const reviewFeedbackStatusEnum = pgEnum("review_feedback_status", [
  "new", "read", "replied", "archived",
]);

export const reviewRemovalStatusEnum = pgEnum("review_removal_status", [
  "flagged", "escalated", "removed", "denied", "closed",
]);

export const reviewViolationEnum = pgEnum("review_violation_type", [
  "spam", "fake", "conflict_of_interest", "off_topic",
  "harassment", "hate_speech", "personal_info", "defamation", "other",
]);

export const reviewCampaigns = pgTable("review_campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  googlePlaceId: text("google_place_id").notNull(),
  googleReviewUrl: text("google_review_url"),
  primaryColor: text("primary_color").default("#4F46E5"),
  logoUrl: text("logo_url"),
  smsTemplateId: text("sms_template_id").default("thank_you"),
  autoSendDelayHours: integer("auto_send_delay_hours").default(2),
  maxReminders: integer("max_reminders").default(2),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const reviewCampaignsRelations = relations(reviewCampaigns, ({ one }) => ({
  brand: one(brands, { fields: [reviewCampaigns.brandId], references: [brands.id] }),
}));

export const reviewRequests = pgTable("review_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").notNull().references(() => reviewCampaigns.id, { onDelete: "cascade" }),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  customerEmail: text("customer_email"),
  appointmentDate: timestamp("appointment_date", { withTimezone: true }),
  token: text("token").$defaultFn(() => nanoid()),
  status: reviewRequestStatusEnum("status").default("sent").notNull(),
  rating: integer("rating"),
  redirectedTo: text("redirected_to"),
  feedback: text("feedback"),
  feedbackName: text("feedback_name"),
  feedbackEmail: text("feedback_email"),
  // SMS tracking fields
  smsStatus: text("sms_status"), // sent, delivered, failed, opted_out
  smsSentAt: timestamp("sms_sent_at", { withTimezone: true }),
  smsDeliveredAt: timestamp("sms_delivered_at", { withTimezone: true }),
  smsMessageSid: text("sms_message_sid"),
  reminderCount: integer("reminder_count").default(0),
  lastReminderAt: timestamp("last_reminder_at", { withTimezone: true }),
  // Opt-out tracking
  optedOut: boolean("opted_out").default(false),
  optedOutAt: timestamp("opted_out_at", { withTimezone: true }),
  // Feedback dashboard fields
  feedbackStatus: reviewFeedbackStatusEnum("feedback_status").default("new"),
  feedbackPhone: text("feedback_phone"),
  replyText: text("reply_text"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  ratedAt: timestamp("rated_at", { withTimezone: true }),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
});

export const reviewRequestsRelations = relations(reviewRequests, ({ one }) => ({
  campaign: one(reviewCampaigns, { fields: [reviewRequests.campaignId], references: [reviewCampaigns.id] }),
}));

export const reviewRemovalCases = pgTable("review_removal_cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  reviewUrl: text("review_url").notNull(),
  reviewText: text("review_text"),
  reviewAuthor: text("review_author"),
  reviewRating: integer("review_rating"),
  violationType: reviewViolationEnum("violation_type").notNull(),
  evidenceNotes: text("evidence_notes"),
  escalationNotes: text("escalation_notes"),
  status: reviewRemovalStatusEnum("status").default("flagged").notNull(),
  flaggedAt: timestamp("flagged_at", { withTimezone: true }).defaultNow().notNull(),
  escalatedAt: timestamp("escalated_at", { withTimezone: true }),
  removedAt: timestamp("removed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const reviewRemovalCasesRelations = relations(reviewRemovalCases, ({ one }) => ({
  brand: one(brands, { fields: [reviewRemovalCases.brandId], references: [brands.id] }),
}));

// ─── ClientVet — Client Risk Assessment & Deposit Flow ─────────────────────────

export const riskLevelEnum = pgEnum("risk_level", [
  "low", "medium", "high", "fraud",
]);

export const clientFlagTypeEnum = pgEnum("client_flag_type", [
  "no_show",
  "late_cancel",
  "negative_review",
  "review_extortion",
  "chargeback",
  "refund_abuse",
  "product_return_fraud",
  "free_service_extraction",
  "other",
]);

export const clientRiskFlags = pgTable("client_risk_flags", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  phone: text("phone"),
  email: text("email"),
  fullName: text("full_name"),
  riskLevel: riskLevelEnum("risk_level").notNull().default("low"),
  noShowCount: integer("no_show_count").notNull().default(0),
  negativeReviewCount: integer("negative_review_count").notNull().default(0),
  chargebackCount: integer("chargeback_count").notNull().default(0),
  refundCount: integer("refund_count").notNull().default(0),
  productReturnFraudCount: integer("product_return_fraud_count").notNull().default(0),
  reviewExtortionCount: integer("review_extortion_count").notNull().default(0),
  freeServiceExtractionCount: integer("free_service_extraction_count").notNull().default(0),
  notes: text("notes"),
  flaggedBy: uuid("flagged_by").references(() => users.id),
  lastFlagAt: timestamp("last_flag_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const depositRequirements = pgTable("deposit_requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  riskLevel: riskLevelEnum("risk_level").notNull(),
  depositPercent: integer("deposit_percent").notNull(),
  requirePrepayment: boolean("require_prepayment").notNull().default(false),
  allowBooking: boolean("allow_booking").notNull().default(true),
  creditOnly: boolean("credit_only").notNull().default(false),
  noProductSales: boolean("no_product_sales").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const clientFlagEvents = pgTable("client_flag_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientFlagId: uuid("client_flag_id").notNull().references(() => clientRiskFlags.id, { onDelete: "cascade" }),
  flagType: clientFlagTypeEnum("flag_type").notNull(),
  description: text("description"),
  evidence: jsonb("evidence").default({}),
  appointmentId: uuid("appointment_id"),
  flaggedBy: uuid("flagged_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const clientPrivateNotes = pgTable("client_private_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientFlagId: uuid("client_flag_id").notNull().references(() => clientRiskFlags.id, { onDelete: "cascade" }),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  note: text("note").notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const depositPayments = pgTable("deposit_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  clientFlagId: uuid("client_flag_id").references(() => clientRiskFlags.id),
  squarePaymentId: text("square_payment_id"),
  squareOrderId: text("square_order_id"),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("pending"), // pending, completed, refunded, forfeited, converted_to_credit
  riskLevelAtPayment: riskLevelEnum("risk_level_at_payment"),
  depositPercent: integer("deposit_percent"),
  convertedToCreditAt: timestamp("converted_to_credit_at", { withTimezone: true }),
  refundedAt: timestamp("refunded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── ClientVet Relations ───────────────────────────────────────────────────────

export const clientRiskFlagsRelations = relations(clientRiskFlags, ({ one, many }) => ({
  brand: one(brands, { fields: [clientRiskFlags.brandId], references: [brands.id] }),
  flagger: one(users, { fields: [clientRiskFlags.flaggedBy], references: [users.id] }),
  events: many(clientFlagEvents),
  notes: many(clientPrivateNotes),
  depositPayments: many(depositPayments),
}));

export const depositRequirementsRelations = relations(depositRequirements, ({ one }) => ({
  brand: one(brands, { fields: [depositRequirements.brandId], references: [brands.id] }),
}));

export const clientFlagEventsRelations = relations(clientFlagEvents, ({ one }) => ({
  clientFlag: one(clientRiskFlags, { fields: [clientFlagEvents.clientFlagId], references: [clientRiskFlags.id] }),
  flagger: one(users, { fields: [clientFlagEvents.flaggedBy], references: [users.id] }),
}));

export const clientPrivateNotesRelations = relations(clientPrivateNotes, ({ one }) => ({
  clientFlag: one(clientRiskFlags, { fields: [clientPrivateNotes.clientFlagId], references: [clientRiskFlags.id] }),
  brand: one(brands, { fields: [clientPrivateNotes.brandId], references: [brands.id] }),
  author: one(users, { fields: [clientPrivateNotes.createdBy], references: [users.id] }),
}));

export const depositPaymentsRelations = relations(depositPayments, ({ one }) => ({
  brand: one(brands, { fields: [depositPayments.brandId], references: [brands.id] }),
  clientFlag: one(clientRiskFlags, { fields: [depositPayments.clientFlagId], references: [clientRiskFlags.id] }),
}));
