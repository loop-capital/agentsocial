import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { eq, and, desc, inArray, gte, lte } from "drizzle-orm";
import { createPostSchema, updatePostSchema } from "@agentsocial/shared";
import { db, posts, postChannels, brands, channels, postMedia, mediaAssets } from "../db/index.js";
import { enqueuePostPublish } from "../queues/index.js";

export const postsRoutes = async (server: FastifyInstance) => {
  // POST /posts
  server.post("/", {
    onRequest: [server.authenticate],
    schema: { body: createPostSchema },
  }, async (request, reply) => {
    const {
      brand_id,
      content,
      content_html,
      channels: channelIds,
      media,
      scheduled_at,
      tags,
    } = request.body as {
      brand_id: string;
      content: string;
      content_html?: string;
      channels: string[];
      media?: Array<{ type: string; url: string; alt_text?: string }>;
      scheduled_at?: string;
      tags?: string[];
    };

    // Validate brand belongs to user
    const [brand] = await db
      .select()
      .from(brands)
      .where(and(eq(brands.id, brand_id), eq(brands.userId, request.userId!)))
      .limit(1);

    if (!brand) {
      return reply.status(404).send({
        error: { code: "resource_not_found", message: "Brand not found", request_id: request.id },
      });
    }

    const status = scheduled_at ? "scheduled" : "draft";

    const [post] = await db.insert(posts).values({
      brandId: brand_id,
      content,
      contentHtml: content_html || null,
      status,
      scheduledAt: scheduled_at ? new Date(scheduled_at) : null,
      publishedAt: null,
      createdByUserId: request.userId!,
    }).returning();

    let relatedChannels: typeof postChannels.$inferSelect[] = [];

    if (channelIds.length > 0) {
      // Validate channels belong to brand
      const channelRecords = await db
        .select({ id: channels.id, platform: channels.platform })
        .from(channels)
        .where(and(eq(channels.brandId, brand_id), inArray(channels.id, channelIds)));

      if (channelRecords.length !== channelIds.length) {
        // Clean up post on error
        await db.delete(posts).where(eq(posts.id, post.id));
        return reply.status(400).send({
          error: { code: "validation_error", message: "One or more channels not found for this brand", request_id: request.id },
        });
      }

      const platformMap = new Map(channelRecords.map((c) => [c.id, c.platform]));

      const channelEntries = channelIds.map((channelId: string) => ({
        postId: post.id,
        channelId,
        platform: platformMap.get(channelId)!,
        status: "pending" as const,
      }));

      await db.insert(postChannels).values(channelEntries);
      relatedChannels = await db
        .select()
        .from(postChannels)
        .where(eq(postChannels.postId, post.id));
    }

    // Handle media attachments if provided
    if (media && media.length > 0) {
      const mediaEntries = media.map((m) => ({
        brandId: brand_id,
        uploaderUserId: request.userId!,
        type: m.type === "video" ? "video" : "image",
        url: m.url,
        filename: m.url.split("/").pop() || "unknown",
        mimeType: m.type === "video" ? "video/mp4" : "image/jpeg",
        fileSizeBytes: 0,
      }));

      const insertedMedia = await db.insert(mediaAssets).values(mediaEntries).returning();

      const postMediaEntries = insertedMedia.map((m) => ({
        postId: post.id,
        assetId: m.id,
      }));

      await db.insert(postMedia).values(postMediaEntries);
    }

    // Enqueue for publishing if scheduled
    if (scheduled_at) {
      await Promise.all(
        relatedChannels.map((pc) =>
          enqueuePostPublish({
            postId: post.id,
            channelId: pc.channelId,
            content,
            scheduledFor: scheduled_at,
          })
        )
      );
    }

    return reply.status(201).send({
      id: post.id,
      brand_id: post.brandId,
      content: post.content,
      content_html: post.contentHtml,
      status: post.status,
      scheduled_at: post.scheduledAt,
      channels: relatedChannels.map((pc) => ({
        channel_id: pc.channelId,
        platform: pc.platform,
        status: pc.status,
        platform_post_id: pc.platformPostId,
        platform_post_url: pc.platformPostUrl,
      })),
      media: media || [],
      tags: tags || [],
      created_at: post.createdAt,
      updated_at: post.updatedAt,
    });
  });

  // GET /posts — list posts for current user's brands
  server.get("/", {
    onRequest: [server.authenticate],
    schema: {
      querystring: z.object({
        brand_id: z.string().optional(),
        status: z.enum(["draft", "scheduled", "published", "failed"]).optional(),
        platform: z.string().optional(),
        date_from: z.string().optional(),
        date_to: z.string().optional(),
        limit: z.coerce.number().int().default(20),
        offset: z.coerce.number().int().default(0),
      }),
    },
  }, async (request, reply) => {
    const {
      brand_id,
      status,
      platform,
      date_from,
      date_to,
      limit = 20,
      offset = 0,
    } = request.query as {
      brand_id?: string;
      status?: "draft" | "scheduled" | "published" | "failed";
      platform?: string;
      date_from?: string;
      date_to?: string;
      limit?: number;
      offset?: number;
    };

    // Get user's brands to enforce ownership
    const userBrands = await db
      .select({ id: brands.id })
      .from(brands)
      .where(eq(brands.userId, request.userId!));

    const brandIds = userBrands.map((b) => b.id);
    if (brandIds.length === 0) {
      return reply.send({
        data: [],
        pagination: { limit, offset, total: 0, has_more: false },
      });
    }

    // Build conditions
    const conditions: Array<ReturnType<typeof eq>> = [inArray(posts.brandId, brandIds)];

    if (brand_id) {
      if (!brandIds.includes(brand_id)) {
        return reply.status(403).send({
          error: { code: "forbidden", message: "Brand does not belong to user", request_id: request.id },
        });
      }
      conditions.push(eq(posts.brandId, brand_id));
    }
    if (status) conditions.push(eq(posts.status, status));
    if (date_from) conditions.push(gte(posts.createdAt, new Date(date_from)));
    if (date_to) conditions.push(lte(posts.createdAt, new Date(date_to)));

    const allPosts = await db
      .select()
      .from(posts)
      .where(and(...conditions))
      .orderBy(desc(posts.createdAt))
      .limit(Math.min(parseInt(String(limit)), 100))
      .offset(parseInt(String(offset)));

    // Fetch post channels for each post
    const postIds = allPosts.map((p) => p.id);
    let channelsByPostId: Map<string, typeof postChannels.$inferSelect[]> = new Map();

    if (postIds.length > 0) {
      const allPostChannels = await db
        .select()
        .from(postChannels)
        .where(inArray(postChannels.postId, postIds));

      for (const pc of allPostChannels) {
        if (!channelsByPostId.has(pc.postId)) {
          channelsByPostId.set(pc.postId, []);
        }
        channelsByPostId.get(pc.postId)!.push(pc);
      }
    }

    // Optionally filter by platform at post-channel level
    let resultPosts = allPosts;
    if (platform) {
      resultPosts = allPosts.filter((p) => {
        const pcs = channelsByPostId.get(p.id) || [];
        return pcs.some((pc) => pc.platform === platform);
      });
    }

    return reply.send({
      data: resultPosts.map((post) => ({
        id: post.id,
        brand_id: post.brandId,
        content: post.content,
        content_html: post.contentHtml,
        status: post.status,
        scheduled_at: post.scheduledAt,
        published_at: post.publishedAt,
        channels: (channelsByPostId.get(post.id) || []).map((pc) => ({
          channel_id: pc.channelId,
          platform: pc.platform,
          status: pc.status,
          platform_post_id: pc.platformPostId,
          platform_post_url: pc.platformPostUrl,
          published_at: pc.publishedAt,
        })),
        created_at: post.createdAt,
        updated_at: post.updatedAt,
      })),
      pagination: {
        limit: parseInt(String(limit)),
        offset: parseInt(String(offset)),
        total: resultPosts.length,
        has_more: resultPosts.length === parseInt(String(limit)),
      },
    });
  });

  // GET /posts/:id
  server.get("/:id", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);

    if (!post) {
      return reply.status(404).send({
        error: { code: "resource_not_found", message: "Post not found", request_id: request.id },
      });
    }

    // Verify ownership via brand
    const [brand] = await db
      .select()
      .from(brands)
      .where(and(eq(brands.id, post.brandId), eq(brands.userId, request.userId!)))
      .limit(1);

    if (!brand) {
      return reply.status(403).send({
        error: { code: "forbidden", message: "Post does not belong to user", request_id: request.id },
      });
    }

    const relatedChannels = await db
      .select()
      .from(postChannels)
      .where(eq(postChannels.postId, post.id));

    const postMediaRecords = await db
      .select()
      .from(postMedia)
      .where(eq(postMedia.postId, post.id));

    const mediaAssetIds = postMediaRecords.map((pm) => pm.assetId);
    let mediaList: typeof mediaAssets.$inferSelect[] = [];
    if (mediaAssetIds.length > 0) {
      mediaList = await db
        .select()
        .from(mediaAssets)
        .where(inArray(mediaAssets.id, mediaAssetIds));
    }

    return reply.send({
      id: post.id,
      brand_id: post.brandId,
      content: post.content,
      content_html: post.contentHtml,
      status: post.status,
      channels: relatedChannels.map((pc) => ({
        channel_id: pc.channelId,
        platform: pc.platform,
        status: pc.status,
        platform_post_id: pc.platformPostId,
        platform_post_url: pc.platformPostUrl,
        published_at: pc.publishedAt,
        error_message: pc.errorMessage,
      })),
      media: mediaList.map((m) => ({
        id: m.id,
        type: m.type,
        url: m.url,
        thumbnail_url: m.thumbnailUrl,
        filename: m.filename,
        width: m.width,
        height: m.height,
      })),
      scheduled_at: post.scheduledAt,
      published_at: post.publishedAt,
      created_at: post.createdAt,
      updated_at: post.updatedAt,
    });
  });

  // PATCH /posts/:id
  server.patch("/:id", {
    onRequest: [server.authenticate],
    schema: { body: updatePostSchema },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const {
      content,
      content_html,
      scheduled_at,
      channels: channelIds,
    } = request.body as {
      content?: string;
      content_html?: string;
      scheduled_at?: string;
      channels?: string[];
    };

    const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    if (!post) {
      return reply.status(404).send({
        error: { code: "resource_not_found", message: "Post not found", request_id: request.id },
      });
    }

    // Verify ownership
    const [brand] = await db
      .select()
      .from(brands)
      .where(and(eq(brands.id, post.brandId), eq(brands.userId, request.userId!)))
      .limit(1);

    if (!brand) {
      return reply.status(403).send({
        error: { code: "forbidden", message: "Post does not belong to user", request_id: request.id },
      });
    }

    if (!["draft", "scheduled"].includes(post.status)) {
      return reply.status(400).send({
        error: { code: "validation_error", message: "Only draft or scheduled posts can be updated", request_id: request.id },
      });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (content !== undefined) updateData.content = content;
    if (content_html !== undefined) updateData.contentHtml = content_html;
    if (scheduled_at !== undefined) {
      updateData.scheduledAt = scheduled_at ? new Date(scheduled_at) : null;
      // If moving from draft to scheduled, update status
      if (post.status === "draft" && scheduled_at) {
        updateData.status = "scheduled";
      }
      // If removing schedule from scheduled post, revert to draft
      if (post.status === "scheduled" && !scheduled_at) {
        updateData.status = "draft";
      }
    }

    const [updated] = await db
      .update(posts)
      .set(updateData)
      .where(eq(posts.id, id))
      .returning();

    // Update channels if provided
    if (channelIds !== undefined) {
      // Delete existing channels
      await db.delete(postChannels).where(eq(postChannels.postId, id));

      if (channelIds.length > 0) {
        const channelRecords = await db
          .select({ id: channels.id, platform: channels.platform })
          .from(channels)
          .where(and(eq(channels.brandId, post.brandId), inArray(channels.id, channelIds)));

        const platformMap = new Map(channelRecords.map((c) => [c.id, c.platform]));
        const newEntries = channelIds.map((cid) => ({
          postId: id,
          channelId: cid,
          platform: platformMap.get(cid) || "twitter",
          status: "pending" as const,
        }));
        await db.insert(postChannels).values(newEntries);
      }
    }

    const updatedChannels = await db
      .select()
      .from(postChannels)
      .where(eq(postChannels.postId, id));

    return reply.send({
      id: updated.id,
      brand_id: updated.brandId,
      content: updated.content,
      status: updated.status,
      scheduled_at: updated.scheduledAt,
      channels: updatedChannels.map((pc) => ({
        channel_id: pc.channelId,
        platform: pc.platform,
        status: pc.status,
      })),
      updated_at: updated.updatedAt,
    });
  });

  // DELETE /posts/:id — soft delete (status → 'cancelled')
  server.delete("/:id", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    if (!post) {
      return reply.status(404).send({
        error: { code: "resource_not_found", message: "Post not found", request_id: request.id },
      });
    }

    // Verify ownership
    const [brand] = await db
      .select()
      .from(brands)
      .where(and(eq(brands.id, post.brandId), eq(brands.userId, request.userId!)))
      .limit(1);

    if (!brand) {
      return reply.status(403).send({
        error: { code: "forbidden", message: "Post does not belong to user", request_id: request.id },
      });
    }

    // Soft delete: set status to cancelled instead of hard delete
    const [updated] = await db
      .update(posts)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();

    return reply.send({
      id: updated.id,
      status: updated.status,
      message: "Post deleted successfully",
    });
  });

  // POST /posts/:id/publish — immediate publish
  server.post("/:id/publish", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    if (!post) {
      return reply.status(404).send({
        error: { code: "resource_not_found", message: "Post not found", request_id: request.id },
      });
    }

    // Verify ownership
    const [brand] = await db
      .select()
      .from(brands)
      .where(and(eq(brands.id, post.brandId), eq(brands.userId, request.userId!)))
      .limit(1);

    if (!brand) {
      return reply.status(403).send({
        error: { code: "forbidden", message: "Post does not belong to user", request_id: request.id },
      });
    }

    const [updated] = await db
      .update(posts)
      .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();

    // Enqueue all pending channels for this post
    const pendingChannels = await db
      .select()
      .from(postChannels)
      .where(eq(postChannels.postId, id));

    await Promise.all(
      pendingChannels
        .filter((pc) => pc.status === "pending")
        .map((pc) =>
          enqueuePostPublish({
            postId: id,
            channelId: pc.channelId,
            content: post.content,
          })
        )
    );

    return reply.send({ id: updated.id, status: updated.status, published_at: updated.publishedAt });
  });

  // POST /posts/:id/cancel
  server.post("/:id/cancel", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    if (!post || post.status !== "scheduled") {
      return reply.status(400).send({
        error: { code: "validation_error", message: "Only scheduled posts can be cancelled", request_id: request.id },
      });
    }

    // Verify ownership
    const [brand] = await db
      .select()
      .from(brands)
      .where(and(eq(brands.id, post.brandId), eq(brands.userId, request.userId!)))
      .limit(1);

    if (!brand) {
      return reply.status(403).send({
        error: { code: "forbidden", message: "Post does not belong to user", request_id: request.id },
      });
    }

    const [updated] = await db
      .update(posts)
      .set({ status: "draft", scheduledAt: null, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();

    return reply.send({ id: updated.id, status: updated.status });
  });

  // POST /posts/:id/duplicate
  server.post("/:id/duplicate", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    if (!post) {
      return reply.status(404).send({
        error: { code: "resource_not_found", message: "Post not found", request_id: request.id },
      });
    }

    // Verify ownership
    const [brand] = await db
      .select()
      .from(brands)
      .where(and(eq(brands.id, post.brandId), eq(brands.userId, request.userId!)))
      .limit(1);

    if (!brand) {
      return reply.status(403).send({
        error: { code: "forbidden", message: "Post does not belong to user", request_id: request.id },
      });
    }

    const [newPost] = await db.insert(posts).values({
      brandId: post.brandId,
      content: post.content,
      contentHtml: post.contentHtml,
      status: "draft",
      createdByUserId: request.userId!,
    }).returning();

    // Copy channels
    const originalChannels = await db
      .select()
      .from(postChannels)
      .where(eq(postChannels.postId, id));

    if (originalChannels.length > 0) {
      await db.insert(postChannels).values(
        originalChannels.map((pc) => ({
          postId: newPost.id,
          channelId: pc.channelId,
          platform: pc.platform,
          status: "pending" as const,
        }))
      );
    }

    return reply.status(201).send({
      id: newPost.id,
      brand_id: newPost.brandId,
      content: newPost.content,
      status: newPost.status,
      created_at: newPost.createdAt,
    });
  });
};
