/**
 * Zernio Routes — Full social management (ADR-013)
 *
 * Publishing + Inbox + CRM + Analytics across 14 platforms.
 *
 * Endpoints:
 *   Profile Management:
 *     GET    /social/profiles              — list profiles
 *     POST   /social/profiles              — create profile
 *     DELETE /social/profiles/:id          — delete profile
 *
 *   Account Management:
 *     GET    /social/accounts              — list connected accounts
 *     GET    /social/accounts/:id/health   — account health check
 *     DELETE /social/accounts/:id          — disconnect account
 *
 *   OAuth Connection:
 *     GET    /social/connect/:platform     — get OAuth link
 *     POST   /social/connect/:platform     — complete OAuth
 *
 *   Posts:
 *     GET    /social/posts                 — list posts
 *     POST   /social/posts                 — create/schedule post
 *     GET    /social/posts/:id             — get post
 *     PUT    /social/posts/:id             — update post
 *     DELETE /social/posts/:id             — delete post
 *     POST   /social/posts/:id/retry      — retry failed post
 *
 *   Inbox:
 *     GET    /social/inbox/conversations   — list DM conversations
 *     GET    /social/inbox/conversations/:id — get conversation
 *     GET    /social/inbox/conversations/:id/messages — list messages
 *     POST   /social/inbox/conversations/:id/send — send DM
 *     GET    /social/inbox/comments        — list comments
 *     GET    /social/inbox/posts/:id/comments — post comments
 *     POST   /social/inbox/posts/:id/reply — reply to comment
 *     GET    /social/inbox/reviews         — list reviews (GBP + FB)
 *     POST   /social/inbox/reviews/:id/reply — reply to review
 *
 *   Contacts:
 *     GET    /social/contacts              — list contacts
 *     POST   /social/contacts              — create contact
 *     GET    /social/contacts/:id          — get contact
 *     PUT    /social/contacts/:id          — update contact
 *     DELETE /social/contacts/:id          — delete contact
 *     POST   /social/contacts/bulk         — bulk create contacts
 *
 *   Broadcasts:
 *     GET    /social/broadcasts           — list broadcasts
 *     POST   /social/broadcasts            — create broadcast
 *     POST   /social/broadcasts/:id/send   — send immediately
 *     POST   /social/broadcasts/:id/schedule — schedule
 *     POST   /social/broadcasts/:id/recipients — add recipients
 *
 *   Sequences:
 *     GET    /social/sequences             — list sequences
 *     POST   /social/sequences             — create sequence
 *     POST   /social/sequences/:id/activate — activate
 *     POST   /social/sequences/:id/enroll   — enroll contacts
 *
 *   Automations:
 *     GET    /social/automations           — list automations
 *     POST   /social/automations           — create automation
 *     PUT    /social/automations/:id       — update automation
 *
 *   Analytics:
 *     GET    /social/analytics/posts       — post metrics
 *     GET    /social/analytics/daily        — daily engagement
 *     GET    /social/analytics/best-time    — best posting times
 *
 *   Media:
 *     POST   /social/media/presign         — upload media
 *
 *   Usage:
 *     GET    /social/usage                  — usage stats
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db, brands } from "../db/index.js";
import * as zernio from "../services/zernio.js";
import { PLATFORM_TO_ZERNIO, ZERNIO_PLATFORMS, type ZernioPlatform } from "../services/zernio.js";

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const createProfileSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

const connectSchema = z.object({
  brand_id: z.string().min(1),
  platform: z.enum(ZERNIO_PLATFORMS as unknown as [string, ...string[]]),
  redirect_url: z.string().url().optional(),
});

const completeOAuthSchema = z.object({
  brand_id: z.string().min(1),
  platform: z.enum(ZERNIO_PLATFORMS as unknown as [string, ...string[]]),
  code: z.string().min(1),
  state: z.string().min(1),
  profile_id: z.string().min(1),
});

const createPostSchema = z.object({
  content: z.string().min(1).max(10000),
  platforms: z.array(z.object({
    platform: z.string(),
    accountId: z.string(),
    customContent: z.string().optional(),
    platformSpecificData: z.record(z.unknown()).optional(),
  })).min(1),
  profileId: z.string().optional(),
  scheduledFor: z.string().optional(),
  publishNow: z.boolean().optional(),
  isDraft: z.boolean().optional(),
  timezone: z.string().optional(),
  mediaItems: z.array(z.object({
    type: z.enum(["image", "video"]),
    url: z.string().url(),
  })).optional(),
  title: z.string().max(200).optional(),
  tags: z.array(z.string()).optional(),
  hashtags: z.array(z.string()).optional(),
  visibility: z.enum(["public", "private", "connections"]).optional(),
});

const presignSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
});

const sendMessageSchema = z.object({
  accountId: z.string().min(1),
  message: z.string().min(1),
});

const replyToCommentSchema = z.object({
  accountId: z.string().min(1),
  message: z.string().min(1),
  commentId: z.string().optional(),
});

const replyToReviewSchema = z.object({
  accountId: z.string().min(1),
  message: z.string().min(1),
});

const createContactSchema = z.object({
  profileId: z.string().min(1),
  name: z.string().min(1),
  accountId: z.string().optional(),
  platform: z.string().optional(),
  platformIdentifier: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.unknown()).optional(),
});

const bulkCreateContactsSchema = z.object({
  profileId: z.string().min(1),
  accountId: z.string().min(1),
  platform: z.string().min(1),
  contacts: z.array(z.object({
    name: z.string(),
    platformIdentifier: z.string(),
  })).min(1).max(1000),
});

const createBroadcastSchema = z.object({
  profileId: z.string().min(1),
  accountId: z.string().min(1),
  platform: z.string().min(1),
  name: z.string().min(1),
  message: z.string().min(1),
  templateName: z.string().optional(),
});

const addRecipientsSchema = z.object({
  contactIds: z.array(z.string()).optional(),
  useSegment: z.boolean().optional(),
});

const scheduleBroadcastSchema = z.object({
  scheduledAt: z.string().min(1),
});

const createSequenceSchema = z.object({
  profileId: z.string().min(1),
  accountId: z.string().min(1),
  platform: z.string().min(1),
  name: z.string().min(1),
  steps: z.array(z.object({
    order: z.number().int(),
    delayMinutes: z.number().int().min(0),
    message: z.object({ text: z.string() }),
  })).min(1),
});

const enrollSequenceSchema = z.object({
  contactIds: z.array(z.string().min(1)).min(1),
});

const createAutomationSchema = z.object({
  profileId: z.string().min(1),
  accountId: z.string().min(1),
  platformPostId: z.string().min(1),
  name: z.string().min(1),
  keywords: z.array(z.string()).optional(),
  dmMessage: z.string().min(1),
  commentReply: z.string().optional(),
});

// ─── Helper ────────────────────────────────────────────────────────────────────

async function verifyBrandOwnership(brandId: string, userId: string) {
  const [brand] = await db
    .select()
    .from(brands)
    .where(and(eq(brands.id, brandId), eq(brands.userId, userId)))
    .limit(1);

  if (!brand) {
    throw { status: 404, code: "resource_not_found", message: "Brand not found" };
  }
  return brand;
}

// ─── Routes ────────────────────────────────────────────────────────────────────

export const socialRoutes = async (server: FastifyInstance) => {

  // ── Profile Management ──────────────────────────────────────────────────

  server.get("/profiles", {
    onRequest: [server.authenticate],
  }, async (_request, reply) => {
    const profiles = await zernio.listProfiles();
    return reply.send({ data: profiles });
  });

  server.post("/profiles", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const parsed = createProfileSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: "validation_error", message: parsed.error.message, request_id: request.id },
      });
    }
    const profile = await zernio.createProfile(parsed.data);
    return reply.status(201).send({ data: profile });
  });

  server.delete("/profiles/:profileId", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { profileId } = request.params as { profileId: string };
    await zernio.deleteProfile(profileId);
    return reply.status(204).send();
  });

  // ── Account Management ──────────────────────────────────────────────────

  server.get("/accounts", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { profileId } = request.query as { profileId?: string };
    const accounts = await zernio.listAccounts(profileId);
    return reply.send({ data: accounts });
  });

  server.get("/accounts/:accountId/health", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { accountId } = request.params as { accountId: string };
    const health = await zernio.accountHealth(accountId);
    return reply.send({ data: health });
  });

  server.delete("/accounts/:accountId", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { accountId } = request.params as { accountId: string };
    await zernio.disconnectAccount(accountId);
    return reply.status(204).send();
  });

  // ── OAuth Connect ───────────────────────────────────────────────────────

  server.get("/connect/:platform", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { platform } = request.params as { platform: string };
    const { brand_id, redirect_url } = request.query as { brand_id?: string; redirect_url?: string };

    if (!brand_id) {
      return reply.status(400).send({
        error: { code: "validation_error", message: "Missing brand_id query parameter", request_id: request.id },
      });
    }

    try {
      await verifyBrandOwnership(brand_id, request.userId!);
    } catch (err: any) {
      return reply.status(err.status || 500).send({
        error: { code: err.code || "error", message: err.message, request_id: request.id },
      });
    }

    const profiles = await zernio.listProfiles();
    let profile = profiles.find((p) => p.name === brand_id);
    if (!profile) {
      profile = await zernio.createProfile({ name: brand_id });
    }

    const zernioPlatform = PLATFORM_TO_ZERNIO[platform] || platform;

    try {
      const result = await zernio.getConnectLink(zernioPlatform as ZernioPlatform, profile._id, redirect_url);
      return reply.send({ data: result });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Zernio connect failed");
      return reply.status(502).send({
        error: { code: "zernio_error", message: err.message, request_id: request.id },
      });
    }
  });

  server.post("/connect/:platform", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const parsed = completeOAuthSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: "validation_error", message: parsed.error.message, request_id: request.id },
      });
    }

    const { brand_id, platform, code, state, profile_id } = parsed.data;

    try {
      await verifyBrandOwnership(brand_id, request.userId!);
    } catch (err: any) {
      return reply.status(err.status || 500).send({
        error: { code: err.code || "error", message: err.message, request_id: request.id },
      });
    }

    const zernioPlatform = PLATFORM_TO_ZERNIO[platform] || platform;

    try {
      const account = await zernio.completeOAuth(zernioPlatform as ZernioPlatform, code, state, profile_id);
      return reply.status(201).send({ data: account });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Zernio OAuth complete failed");
      return reply.status(502).send({
        error: { code: "zernio_error", message: err.message, request_id: request.id },
      });
    }
  });

  // ── Posts ────────────────────────────────────────────────────────────────

  server.get("/posts", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { page, limit, status, platform, profileId } = request.query as {
      page?: string; limit?: string; status?: string; platform?: string; profileId?: string;
    };
    const result = await zernio.listPosts({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status, platform, profileId,
    });
    return reply.send({ data: result.posts, pagination: result.pagination });
  });

  server.post("/posts", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const parsed = createPostSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: "validation_error", message: parsed.error.message, request_id: request.id },
      });
    }

    const mappedPlatforms = parsed.data.platforms.map((p) => ({
      ...p,
      platform: PLATFORM_TO_ZERNIO[p.platform] || p.platform,
    }));

    try {
      const post = await zernio.createPost({ ...parsed.data, platforms: mappedPlatforms });
      return reply.status(201).send({ data: post });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Zernio createPost failed");
      return reply.status(502).send({
        error: { code: "zernio_error", message: err.message, request_id: request.id },
      });
    }
  });

  server.get("/posts/:postId", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { postId } = request.params as { postId: string };
    try {
      const post = await zernio.getPost(postId);
      return reply.send({ data: post });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Zernio getPost failed");
      return reply.status(502).send({
        error: { code: "zernio_error", message: err.message, request_id: request.id },
      });
    }
  });

  server.put("/posts/:postId", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { postId } = request.params as { postId: string };
    const body = request.body as Record<string, unknown>;

    if (body.platforms && Array.isArray(body.platforms)) {
      body.platforms = (body.platforms as Array<Record<string, unknown>>).map((p) => ({
        ...p,
        platform: PLATFORM_TO_ZERNIO[p.platform as string] || p.platform,
      }));
    }

    try {
      const post = await zernio.updatePost(postId, body as any);
      return reply.send({ data: post });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Zernio updatePost failed");
      return reply.status(502).send({
        error: { code: "zernio_error", message: err.message, request_id: request.id },
      });
    }
  });

  server.delete("/posts/:postId", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { postId } = request.params as { postId: string };
    try {
      await zernio.deletePost(postId);
      return reply.status(204).send();
    } catch (err: any) {
      request.log.error({ err: err.message }, "Zernio deletePost failed");
      return reply.status(502).send({
        error: { code: "zernio_error", message: err.message, request_id: request.id },
      });
    }
  });

  server.post("/posts/:postId/retry", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { postId } = request.params as { postId: string };
    try {
      const post = await zernio.retryPost(postId);
      return reply.send({ data: post });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Zernio retryPost failed");
      return reply.status(502).send({
        error: { code: "zernio_error", message: err.message, request_id: request.id },
      });
    }
  });

  // ── Inbox ───────────────────────────────────────────────────────────────

  server.get("/inbox/conversations", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { platform, accountId, page, limit } = request.query as {
      platform?: string; accountId?: string; page?: string; limit?: string;
    };
    const result = await zernio.listConversations({
      platform, accountId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return reply.send({ data: result.conversations, pagination: result.pagination });
  });

  server.get("/inbox/conversations/:conversationId", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { conversationId } = request.params as { conversationId: string };
    try {
      const conversation = await zernio.getConversation(conversationId);
      return reply.send({ data: conversation });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Zernio getConversation failed");
      return reply.status(502).send({
        error: { code: "zernio_error", message: err.message, request_id: request.id },
      });
    }
  });

  server.get("/inbox/conversations/:conversationId/messages", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { conversationId } = request.params as { conversationId: string };
    const { page, limit } = request.query as { page?: string; limit?: string };
    const result = await zernio.listMessages(conversationId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return reply.send({ data: result.messages, pagination: result.pagination });
  });

  server.post("/inbox/conversations/:conversationId/send", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { conversationId } = request.params as { conversationId: string };
    const parsed = sendMessageSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: "validation_error", message: parsed.error.message, request_id: request.id },
      });
    }
    try {
      const message = await zernio.sendMessage(conversationId, parsed.data);
      return reply.status(201).send({ data: message });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Zernio sendMessage failed");
      return reply.status(502).send({
        error: { code: "zernio_error", message: err.message, request_id: request.id },
      });
    }
  });

  server.get("/inbox/comments", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { platform, accountId, page, limit } = request.query as {
      platform?: string; accountId?: string; page?: string; limit?: string;
    };
    const result = await zernio.listComments({
      platform, accountId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return reply.send({ data: result.comments, pagination: result.pagination });
  });

  server.get("/inbox/posts/:postId/comments", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { postId } = request.params as { postId: string };
    try {
      const result = await zernio.getPostComments(postId);
      return reply.send({ data: result.comments });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Zernio getPostComments failed");
      return reply.status(502).send({
        error: { code: "zernio_error", message: err.message, request_id: request.id },
      });
    }
  });

  server.post("/inbox/posts/:postId/reply", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { postId } = request.params as { postId: string };
    const parsed = replyToCommentSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: "validation_error", message: parsed.error.message, request_id: request.id },
      });
    }
    try {
      const comment = await zernio.replyToComment(postId, parsed.data);
      return reply.status(201).send({ data: comment });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Zernio replyToComment failed");
      return reply.status(502).send({
        error: { code: "zernio_error", message: err.message, request_id: request.id },
      });
    }
  });

  server.get("/inbox/reviews", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { platform, accountId, page, limit } = request.query as {
      platform?: string; accountId?: string; page?: string; limit?: string;
    };
    const result = await zernio.listReviews({
      platform, accountId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return reply.send({ data: result.reviews, pagination: result.pagination });
  });

  server.post("/inbox/reviews/:reviewId/reply", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { reviewId } = request.params as { reviewId: string };
    const parsed = replyToReviewSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: "validation_error", message: parsed.error.message, request_id: request.id },
      });
    }
    try {
      const review = await zernio.replyToReview(reviewId, parsed.data);
      return reply.status(201).send({ data: review });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Zernio replyToReview failed");
      return reply.status(502).send({
        error: { code: "zernio_error", message: err.message, request_id: request.id },
      });
    }
  });

  // ── Contacts ────────────────────────────────────────────────────────────

  server.get("/contacts", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { profileId, search, tag, page, limit } = request.query as {
      profileId?: string; search?: string; tag?: string; page?: string; limit?: string;
    };
    const result = await zernio.listContacts({
      profileId, search, tag,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return reply.send({ data: result.contacts, pagination: result.pagination });
  });

  server.post("/contacts", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const parsed = createContactSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: "validation_error", message: parsed.error.message, request_id: request.id },
      });
    }
    try {
      const contact = await zernio.createContact(parsed.data);
      return reply.status(201).send({ data: contact });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Zernio createContact failed");
      return reply.status(502).send({
        error: { code: "zernio_error", message: err.message, request_id: request.id },
      });
    }
  });

  server.get("/contacts/:contactId", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { contactId } = request.params as { contactId: string };
    try {
      const contact = await zernio.getContact(contactId);
      return reply.send({ data: contact });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Zernio getContact failed");
      return reply.status(502).send({
        error: { code: "zernio_error", message: err.message, request_id: request.id },
      });
    }
  });

  server.put("/contacts/:contactId", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { contactId } = request.params as { contactId: string };
    const body = request.body as Record<string, unknown>;
    try {
      const contact = await zernio.updateContact(contactId, body);
      return reply.send({ data: contact });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Zernio updateContact failed");
      return reply.status(502).send({
        error: { code: "zernio_error", message: err.message, request_id: request.id },
      });
    }
  });

  server.delete("/contacts/:contactId", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { contactId } = request.params as { contactId: string };
    try {
      await zernio.deleteContact(contactId);
      return reply.status(204).send();
    } catch (err: any) {
      request.log.error({ err: err.message }, "Zernio deleteContact failed");
      return reply.status(502).send({
        error: { code: "zernio_error", message: err.message, request_id: request.id },
      });
    }
  });

  server.post("/contacts/bulk", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const parsed = bulkCreateContactsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: "validation_error", message: parsed.error.message, request_id: request.id },
      });
    }
    try {
      const result = await zernio.bulkCreateContacts(parsed.data);
      return reply.status(201).send({ data: result });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Zernio bulkCreateContacts failed");
      return reply.status(502).send({
        error: { code: "zernio_error", message: err.message, request_id: request.id },
      });
    }
  });

  // ── Broadcasts ──────────────────────────────────────────────────────────

  server.get("/broadcasts", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { profileId, page, limit } = request.query as {
      profileId?: string; page?: string; limit?: string;
    };
    const result = await zernio.listBroadcasts({
      profileId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return reply.send({ data: result.broadcasts, pagination: result.pagination });
  });

  server.post("/broadcasts", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const parsed = createBroadcastSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: "validation_error", message: parsed.error.message, request_id: request.id },
      });
    }
    try {
      const broadcast = await zernio.createBroadcast(parsed.data);
      return reply.status(201).send({ data: broadcast });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Zernio createBroadcast failed");
      return reply.status(502).send({
        error: { code: "zernio_error", message: err.message, request_id: request.id },
      });
    }
  });

  server.post("/broadcasts/:broadcastId/send", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { broadcastId } = request.params as { broadcastId: string };
    try {
      const broadcast = await zernio.sendBroadcast(broadcastId);
      return reply.send({ data: broadcast });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Zernio sendBroadcast failed");
      return reply.status(502).send({
        error: { code: "zernio_error", message: err.message, request_id: request.id },
      });
    }
  });

  server.post("/broadcasts/:broadcastId/schedule", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { broadcastId } = request.params as { broadcastId: string };
    const parsed = scheduleBroadcastSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: "validation_error", message: parsed.error.message, request_id: request.id },
      });
    }
    try {
      const broadcast = await zernio.scheduleBroadcast(broadcastId, parsed.data.scheduledAt);
      return reply.send({ data: broadcast });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Zernio scheduleBroadcast failed");
      return reply.status(502).send({
        error: { code: "zernio_error", message: err.message, request_id: request.id },
      });
    }
  });

  server.post("/broadcasts/:broadcastId/recipients", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { broadcastId } = request.params as { broadcastId: string };
    const parsed = addRecipientsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: "validation_error", message: parsed.error.message, request_id: request.id },
      });
    }
    try {
      const result = await zernio.addBroadcastRecipients(broadcastId, parsed.data);
      return reply.send({ data: result });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Zernio addBroadcastRecipients failed");
      return reply.status(502).send({
        error: { code: "zernio_error", message: err.message, request_id: request.id },
      });
    }
  });

  // ── Sequences ───────────────────────────────────────────────────────────

  server.get("/sequences", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { profileId } = request.query as { profileId?: string };
    const result = await zernio.listSequences(profileId);
    return reply.send({ data: result.sequences });
  });

  server.post("/sequences", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const parsed = createSequenceSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: "validation_error", message: parsed.error.message, request_id: request.id },
      });
    }
    try {
      const sequence = await zernio.createSequence(parsed.data);
      return reply.status(201).send({ data: sequence });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Zernio createSequence failed");
      return reply.status(502).send({
        error: { code: "zernio_error", message: err.message, request_id: request.id },
      });
    }
  });

  server.post("/sequences/:sequenceId/activate", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { sequenceId } = request.params as { sequenceId: string };
    try {
      const sequence = await zernio.activateSequence(sequenceId);
      return reply.send({ data: sequence });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Zernio activateSequence failed");
      return reply.status(502).send({
        error: { code: "zernio_error", message: err.message, request_id: request.id },
      });
    }
  });

  server.post("/sequences/:sequenceId/enroll", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { sequenceId } = request.params as { sequenceId: string };
    const parsed = enrollSequenceSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: "validation_error", message: parsed.error.message, request_id: request.id },
      });
    }
    try {
      const result = await zernio.enrollInSequence(sequenceId, parsed.data.contactIds);
      return reply.send({ data: result });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Zernio enrollInSequence failed");
      return reply.status(502).send({
        error: { code: "zernio_error", message: err.message, request_id: request.id },
      });
    }
  });

  // ── Automations ─────────────────────────────────────────────────────────

  server.get("/automations", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { profileId, page, limit } = request.query as {
      profileId?: string; page?: string; limit?: string;
    };
    const result = await zernio.listAutomations({
      profileId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return reply.send({ data: result.automations, pagination: result.pagination });
  });

  server.post("/automations", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const parsed = createAutomationSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: "validation_error", message: parsed.error.message, request_id: request.id },
      });
    }
    try {
      const automation = await zernio.createAutomation(parsed.data);
      return reply.status(201).send({ data: automation });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Zernio createAutomation failed");
      return reply.status(502).send({
        error: { code: "zernio_error", message: err.message, request_id: request.id },
      });
    }
  });

  server.put("/automations/:automationId", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { automationId } = request.params as { automationId: string };
    const body = request.body as Record<string, unknown>;
    try {
      const automation = await zernio.updateAutomation(automationId, body);
      return reply.send({ data: automation });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Zernio updateAutomation failed");
      return reply.status(502).send({
        error: { code: "zernio_error", message: err.message, request_id: request.id },
      });
    }
  });

  // ── Analytics ───────────────────────────────────────────────────────────

  server.get("/analytics/posts", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { profileId, accountId, startDate, endDate } = request.query as {
      profileId?: string; accountId?: string; startDate?: string; endDate?: string;
    };
    const result = await zernio.getPostAnalytics({ profileId, accountId, startDate, endDate });
    return reply.send({ data: result.analytics });
  });

  server.get("/analytics/daily", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { profileId, accountId, startDate, endDate } = request.query as {
      profileId?: string; accountId?: string; startDate?: string; endDate?: string;
    };
    const result = await zernio.getDailyAnalytics({ profileId, accountId, startDate, endDate });
    return reply.send({ data: result.analytics });
  });

  server.get("/analytics/best-time", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { profileId, accountId } = request.query as { profileId?: string; accountId?: string };
    const result = await zernio.getBestTimes(profileId, accountId);
    return reply.send({ data: result.bestTimes });
  });

  // ── Media ────────────────────────────────────────────────────────────────

  server.post("/media/presign", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const parsed = presignSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: "validation_error", message: parsed.error.message, request_id: request.id },
      });
    }
    try {
      const result = await zernio.presignMedia(parsed.data.filename, parsed.data.contentType);
      return reply.send({ data: result });
    } catch (err: any) {
      request.log.error({ err: err.message }, "Zernio presignMedia failed");
      return reply.status(502).send({
        error: { code: "zernio_error", message: err.message, request_id: request.id },
      });
    }
  });

  // ── Usage ────────────────────────────────────────────────────────────────

  server.get("/usage", {
    onRequest: [server.authenticate],
  }, async (_request, reply) => {
    const stats = await zernio.getUsageStats();
    return reply.send({ data: stats });
  });
};