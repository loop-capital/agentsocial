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

export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "set null" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  timezone: text("timezone").notNull().default("UTC"),
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

export const exportJobsRelations = relations(exportJobs, ({ one }) => ({
  user: one(users, { fields: [exportJobs.userId], references: [users.id] }),
  brand: one(brands, { fields: [exportJobs.brandId], references: [brands.id] }),
}));

// ─── Competitor Profile Relations ────────────────────────────────────────────

export const competitorProfilesRelations = relations(competitorProfiles, ({ one, many }) => ({
  brand: one(brands, { fields: [competitorProfiles.brandId], references: [brands.id] }),
  posts: many(competitorPosts),
}));

export const competitorPostsRelations = relations(competitorPosts, ({ one }) => ({
  profile: one(competitorProfiles, { fields: [competitorPosts.profileId], references: [competitorProfiles.id] }),
}));