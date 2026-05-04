import { z } from "zod";
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    name: string;
}, {
    email: string;
    password: string;
    name: string;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const createBrandSchema: z.ZodObject<{
    name: z.ZodString;
    organization_id: z.ZodOptional<z.ZodString>;
    timezone: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    timezone: string;
    organization_id?: string | undefined;
}, {
    name: string;
    organization_id?: string | undefined;
    timezone?: string | undefined;
}>;
export declare const connectChannelSchema: z.ZodObject<{
    brand_id: z.ZodString;
    platform: z.ZodEnum<["twitter", "linkedin", "facebook", "instagram", "youtube", "tiktok", "wordpress", "bluesky"]>;
}, "strip", z.ZodTypeAny, {
    brand_id: string;
    platform: "facebook" | "twitter" | "instagram" | "linkedin" | "youtube" | "tiktok" | "wordpress" | "bluesky";
}, {
    brand_id: string;
    platform: "facebook" | "twitter" | "instagram" | "linkedin" | "youtube" | "tiktok" | "wordpress" | "bluesky";
}>;
export declare const updateChannelSchema: z.ZodObject<{
    settings: z.ZodOptional<z.ZodObject<{
        auto_reply_enabled: z.ZodOptional<z.ZodBoolean>;
        auto_reply_message: z.ZodOptional<z.ZodString>;
        post_defaults: z.ZodOptional<z.ZodObject<{
            add_utm: z.ZodOptional<z.ZodBoolean>;
            utm_source: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            add_utm?: boolean | undefined;
            utm_source?: string | undefined;
        }, {
            add_utm?: boolean | undefined;
            utm_source?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        auto_reply_enabled?: boolean | undefined;
        auto_reply_message?: string | undefined;
        post_defaults?: {
            add_utm?: boolean | undefined;
            utm_source?: string | undefined;
        } | undefined;
    }, {
        auto_reply_enabled?: boolean | undefined;
        auto_reply_message?: string | undefined;
        post_defaults?: {
            add_utm?: boolean | undefined;
            utm_source?: string | undefined;
        } | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    settings?: {
        auto_reply_enabled?: boolean | undefined;
        auto_reply_message?: string | undefined;
        post_defaults?: {
            add_utm?: boolean | undefined;
            utm_source?: string | undefined;
        } | undefined;
    } | undefined;
}, {
    settings?: {
        auto_reply_enabled?: boolean | undefined;
        auto_reply_message?: string | undefined;
        post_defaults?: {
            add_utm?: boolean | undefined;
            utm_source?: string | undefined;
        } | undefined;
    } | undefined;
}>;
export declare const createPostSchema: z.ZodObject<{
    brand_id: z.ZodString;
    content: z.ZodString;
    content_html: z.ZodOptional<z.ZodString>;
    channels: z.ZodArray<z.ZodString, "many">;
    media: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["image", "video"]>;
        url: z.ZodString;
        alt_text: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "image" | "video";
        url: string;
        alt_text?: string | undefined;
    }, {
        type: "image" | "video";
        url: string;
        alt_text?: string | undefined;
    }>, "many">>;
    scheduled_at: z.ZodOptional<z.ZodString>;
    timezone: z.ZodDefault<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    platform_variants: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        content: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        content?: string | undefined;
    }, {
        content?: string | undefined;
    }>>>;
}, "strip", z.ZodTypeAny, {
    timezone: string;
    brand_id: string;
    content: string;
    channels: string[];
    content_html?: string | undefined;
    media?: {
        type: "image" | "video";
        url: string;
        alt_text?: string | undefined;
    }[] | undefined;
    scheduled_at?: string | undefined;
    tags?: string[] | undefined;
    platform_variants?: Record<string, {
        content?: string | undefined;
    }> | undefined;
}, {
    brand_id: string;
    content: string;
    channels: string[];
    timezone?: string | undefined;
    content_html?: string | undefined;
    media?: {
        type: "image" | "video";
        url: string;
        alt_text?: string | undefined;
    }[] | undefined;
    scheduled_at?: string | undefined;
    tags?: string[] | undefined;
    platform_variants?: Record<string, {
        content?: string | undefined;
    }> | undefined;
}>;
export declare const updatePostSchema: z.ZodObject<{
    content: z.ZodOptional<z.ZodString>;
    content_html: z.ZodOptional<z.ZodString>;
    channels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    scheduled_at: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    timezone?: string | undefined;
    content?: string | undefined;
    content_html?: string | undefined;
    channels?: string[] | undefined;
    scheduled_at?: string | undefined;
    tags?: string[] | undefined;
}, {
    timezone?: string | undefined;
    content?: string | undefined;
    content_html?: string | undefined;
    channels?: string[] | undefined;
    scheduled_at?: string | undefined;
    tags?: string[] | undefined;
}>;
export declare const postStatusSchema: z.ZodEnum<["draft", "scheduled", "published", "failed"]>;
export declare const replyToCommentSchema: z.ZodObject<{
    content: z.ZodString;
    use_ai_suggestion: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    content: string;
    use_ai_suggestion: boolean;
}, {
    content: string;
    use_ai_suggestion?: boolean | undefined;
}>;
export declare const bulkUpdateCommentsSchema: z.ZodObject<{
    ids: z.ZodArray<z.ZodString, "many">;
    action: z.ZodEnum<["mark_read", "mark_unread", "archive", "set_priority"]>;
    priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "urgent"]>>;
}, "strip", z.ZodTypeAny, {
    ids: string[];
    action: "mark_read" | "mark_unread" | "archive" | "set_priority";
    priority?: "low" | "medium" | "high" | "urgent" | undefined;
}, {
    ids: string[];
    action: "mark_read" | "mark_unread" | "archive" | "set_priority";
    priority?: "low" | "medium" | "high" | "urgent" | undefined;
}>;
export declare const suggestReplySchema: z.ZodObject<{
    tone: z.ZodDefault<z.ZodEnum<["friendly", "professional", "humorous"]>>;
    include_cta: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    tone: "friendly" | "professional" | "humorous";
    include_cta: boolean;
}, {
    tone?: "friendly" | "professional" | "humorous" | undefined;
    include_cta?: boolean | undefined;
}>;
export declare const analyticsQuerySchema: z.ZodObject<{
    brand_id: z.ZodOptional<z.ZodString>;
    channel_id: z.ZodOptional<z.ZodString>;
    period: z.ZodDefault<z.ZodEnum<["24h", "7d", "30d", "90d", "custom"]>>;
    start_date: z.ZodOptional<z.ZodString>;
    end_date: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    period: "custom" | "24h" | "7d" | "30d" | "90d";
    brand_id?: string | undefined;
    channel_id?: string | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
}, {
    brand_id?: string | undefined;
    channel_id?: string | undefined;
    period?: "custom" | "24h" | "7d" | "30d" | "90d" | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
}>;
export declare const exportAnalyticsSchema: z.ZodObject<{
    brand_id: z.ZodString;
    period: z.ZodEnum<["24h", "7d", "30d", "90d", "custom"]>;
    format: z.ZodDefault<z.ZodEnum<["pdf", "csv", "xlsx"]>>;
    include_charts: z.ZodDefault<z.ZodBoolean>;
    branded: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    brand_id: string;
    period: "custom" | "24h" | "7d" | "30d" | "90d";
    format: "pdf" | "csv" | "xlsx";
    include_charts: boolean;
    branded: boolean;
}, {
    brand_id: string;
    period: "custom" | "24h" | "7d" | "30d" | "90d";
    format?: "pdf" | "csv" | "xlsx" | undefined;
    include_charts?: boolean | undefined;
    branded?: boolean | undefined;
}>;
export declare const uploadMediaSchema: z.ZodObject<{
    brand_id: z.ZodString;
    type: z.ZodEnum<["image", "video"]>;
}, "strip", z.ZodTypeAny, {
    type: "image" | "video";
    brand_id: string;
}, {
    type: "image" | "video";
    brand_id: string;
}>;
export declare const createWebhookSchema: z.ZodObject<{
    url: z.ZodString;
    events: z.ZodArray<z.ZodEnum<["post.scheduled", "post.published", "post.failed", "comment.received"]>, "many">;
    secret: z.ZodOptional<z.ZodString>;
    active: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    active: boolean;
    url: string;
    events: ("post.scheduled" | "post.published" | "post.failed" | "comment.received")[];
    secret?: string | undefined;
}, {
    url: string;
    events: ("post.scheduled" | "post.published" | "post.failed" | "comment.received")[];
    active?: boolean | undefined;
    secret?: string | undefined;
}>;
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
//# sourceMappingURL=index.d.ts.map