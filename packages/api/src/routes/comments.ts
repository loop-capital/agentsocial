import type { FastifyInstance } from "fastify";
import { eq, asc } from "drizzle-orm";
import { replyToCommentSchema, bulkUpdateCommentsSchema, suggestReplySchema } from "@agentsocial/shared";
import { db, comments, commentReplies } from "../db/index.js";

export const commentsRoutes = async (server: FastifyInstance) => {
  // GET /comments
  server.get("/", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { status, limit = 50 } = request.query as {
      status?: "unread" | "read" | "replied" | "archived";
      limit?: number;
    };

    const allComments = await db
      .select()
      .from(comments)
      .where(status ? eq(comments.status, status) : undefined)
      .orderBy(asc(comments.receivedAt))
      .limit(parseInt(String(limit)));

    return reply.send({
      data: allComments.map((comment) => ({
        id: comment.id,
        channel_id: comment.channelId,
        platform_comment_id: comment.platformCommentId,
        post_id: comment.postId,
        author: {
          name: comment.authorName,
          username: comment.authorUsername,
          avatar_url: comment.authorAvatarUrl,
          is_verified: comment.authorIsVerified,
          follower_count: comment.authorFollowerCount,
        },
        content: comment.content,
        content_html: comment.contentHtml,
        sentiment: comment.sentiment,
        sentiment_confidence: comment.sentimentConfidence,
        priority: comment.priority,
        status: comment.status,
        platform_url: comment.platformUrl,
        received_at: comment.receivedAt,
        created_at: comment.createdAt,
      })),
      pagination: {
        has_more: allComments.length === parseInt(String(limit)),
        next_cursor: allComments.length > 0 ? allComments[allComments.length - 1].id : null,
        total: 0,
      },
      summary: {
        unread_count: allComments.filter((c) => c.status === "unread").length,
        high_priority_count: allComments.filter((c) => c.priority === "high" || c.priority === "urgent").length,
        avg_response_time_seconds: 3600,
      },
    });
  });

  // GET /comments/:id
  server.get("/:id", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const [comment] = await db.select().from(comments).where(eq(comments.id, id)).limit(1);

    if (!comment) {
      return reply.status(404).send({
        error: { code: "resource_not_found", message: "Comment not found", request_id: request.id },
      });
    }

    return reply.send({
      id: comment.id,
      channel_id: comment.channelId,
      platform_comment_id: comment.platformCommentId,
      post_id: comment.postId,
      author: {
        name: comment.authorName,
        username: comment.authorUsername,
        avatar_url: comment.authorAvatarUrl,
        is_verified: comment.authorIsVerified,
        follower_count: comment.authorFollowerCount,
      },
      content: comment.content,
      content_html: comment.contentHtml,
      sentiment: comment.sentiment,
      priority: comment.priority,
      status: comment.status,
      platform_url: comment.platformUrl,
      received_at: comment.receivedAt,
      created_at: comment.createdAt,
    });
  });

  // POST /comments/:id/reply
  server.post("/:id/reply", {
    onRequest: [server.authenticate],
    schema: { body: replyToCommentSchema },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { content } = request.body as { content: string };

    const [comment] = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
    if (!comment) {
      return reply.status(404).send({
        error: { code: "resource_not_found", message: "Comment not found", request_id: request.id },
      });
    }

    const [reply_] = await db.insert(commentReplies).values({
      commentId: id,
      userId: request.userId!,
      content,
      status: "sending",
    }).returning();

    await db.update(comments)
      .set({ status: "replied", updatedAt: new Date() })
      .where(eq(comments.id, id));

    return reply.status(201).send({
      id: reply_.id,
      comment_id: reply_.commentId,
      content: reply_.content,
      status: reply_.status,
      sent_at: reply_.sentAt,
      created_at: reply_.createdAt,
    });
  });

  // POST /comments/bulk
  server.post("/bulk", {
    onRequest: [server.authenticate],
    schema: { body: bulkUpdateCommentsSchema },
  }, async (request, reply) => {
    const { ids, action, priority } = request.body as {
      ids: string[]; action: "mark_read" | "mark_unread" | "archive" | "set_priority";
      priority?: "low" | "medium" | "high" | "urgent";
    };

    for (const id of ids) {
      if (action === "mark_read") {
        await db.update(comments).set({ status: "read", updatedAt: new Date() }).where(eq(comments.id, id));
      } else if (action === "mark_unread") {
        await db.update(comments).set({ status: "unread", updatedAt: new Date() }).where(eq(comments.id, id));
      } else if (action === "archive") {
        await db.update(comments).set({ status: "archived", updatedAt: new Date() }).where(eq(comments.id, id));
      } else if (action === "set_priority" && priority) {
        await db.update(comments).set({ priority, updatedAt: new Date() }).where(eq(comments.id, id));
      }
    }

    return reply.send({ updated: ids.length });
  });

  // POST /comments/:id/suggest-reply
  server.post("/:id/suggest-reply", {
    onRequest: [server.authenticate],
    schema: { body: suggestReplySchema },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { tone, include_cta } = request.body as { tone: "friendly" | "professional" | "humorous"; include_cta: boolean };

    const [comment] = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
    if (!comment) {
      return reply.status(404).send({
        error: { code: "resource_not_found", message: "Comment not found", request_id: request.id },
      });
    }

    const suggestions = [
      {
        content: `Thanks for your comment! We'd love to hear more. ${include_cta ? "Visit us at example.com!" : ""}`,
        confidence: 0.88,
        tone,
      },
      {
        content: "Appreciate your feedback! Stay tuned for exciting updates.",
        confidence: 0.82,
        tone,
      },
    ];

    return reply.send({ suggestions });
  });
};