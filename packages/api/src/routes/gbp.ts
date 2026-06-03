import type { FastifyInstance } from "fastify";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { db, gbpAccounts, gbpReviews, gbpPosts, gbpQuestions, reviewSolicitations } from "../db/index.js";
import * as gbpService from "../services/gbp.js";
import * as solicitationService from "../services/review-solicitation.js";
import * as adsService from "../services/ads.js";
import * as bookingService from "../services/booking.js";
import * as chatWidgetService from "../services/chat-widget.js";
import * as conversionTrackingService from "../services/conversion-tracking.js";

export const gbpRoutes = async (server: FastifyInstance) => {

  // ─── Accounts ───────────────────────────────────────────────────────────────

  // GET /api/v1/gbp/accounts — List connected accounts
  server.get("/", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const query = request.query as Record<string, string | undefined>;
    const brandId = query.brandId;
    if (!brandId) {
      return reply.status(400).send({ error: { code: "brand_required", message: "brandId query param required" } });
    }

    const rows = await db.select().from(gbpAccounts).where(eq(gbpAccounts.brandId, brandId));
    return reply.send({ data: rows });
  });

  // POST /api/v1/gbp/accounts — Connect a GBP account
  server.post("/", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const body = request.body as Record<string, unknown>;
    const {
      brandId,
      accountId,
      accessToken,
      refreshToken,
      locationId,
      displayName,
      locationName,
      phone,
      websiteUrl,
      primaryCategory,
      address,
    } = body;

    if (!brandId || !accountId || !accessToken || !refreshToken || !locationId) {
      return reply.status(400).send({ error: { code: "missing_fields", message: "brandId, accountId, accessToken, refreshToken, locationId required" } });
    }

    const result = await gbpService.connectGbpAccount({
      brandId: brandId as string,
      accountId: accountId as string,
      accessToken: accessToken as string,
      refreshToken: refreshToken as string,
      locationId: locationId as string,
      displayName: displayName as string | undefined,
      locationName: locationName as string | undefined,
      phone: phone as string | undefined,
      websiteUrl: websiteUrl as string | undefined,
      primaryCategory: primaryCategory as string | undefined,
      address: address as Record<string, unknown> | undefined,
    });

    return reply.status(201).send({ data: result });
  });

  // ─── Chat Widget ────────────────────────────────────────────────────────────

  // GET /api/v1/gbp/widget — Get widget config
  server.get("/widget", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const brandId = (request.query as any)?.brandId as string | undefined;
    if (!brandId) {
      return reply.status(400).send({ error: { code: "brand_required", message: "brandId query param required" } });
    }
    const config = await chatWidgetService.getWidgetConfig(brandId);
    return reply.send({ data: config });
  });

  // PUT /api/v1/gbp/widget — Update widget config
  server.put("/widget", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const body = request.body as Record<string, unknown>;
    const brandId = body.brandId as string | undefined;
    if (!brandId) {
      return reply.status(400).send({ error: { code: "brand_required", message: "brandId required in body" } });
    }
    const { brandId: _b, id: _i, created_at: _c, ...updates } = body as any;
    const config = await chatWidgetService.updateWidgetConfig(brandId, updates);
    return reply.send({ data: config });
  });

  // GET /api/v1/gbp/widget/sessions — List chat sessions (with optional filters & pagination)
  server.get("/widget/sessions", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const query = request.query as Record<string, string | undefined>;
    const brandId = query.brandId;
    if (!brandId) {
      return reply.status(400).send({ error: { code: "brand_required", message: "brandId query param required" } });
    }

    // If no extra filters, use simple list
    if (!query.status && !query.dateFrom && !query.dateTo && !query.limit && !query.offset) {
      const sessions = await chatWidgetService.listChatSessions(brandId);
      return reply.send({ data: sessions });
    }

    // With filters or pagination, use filtered list
    const result = await chatWidgetService.listChatSessionsFiltered({
      brandId,
      status: query.status,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      limit: Math.min(100, parseInt(query.limit ?? "50", 10)),
      offset: parseInt(query.offset ?? "0", 10),
    });
    return reply.send({ data: result.data, pagination: { total: result.total, limit: Math.min(100, parseInt(query.limit ?? "50", 10)), offset: parseInt(query.offset ?? "0", 10) } });
  });

  // GET /api/v1/gbp/widget/sessions/:sessionId/messages — Get messages for a session (paginated)
  server.get("/widget/sessions/:sessionId/messages", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    const query = request.query as Record<string, string | undefined>;
    const limit = Math.min(100, parseInt(query.limit ?? "50", 10));
    const offset = parseInt(query.offset ?? "0", 10);

    const result = await chatWidgetService.getSessionMessages(sessionId, limit, offset);
    return reply.send({ data: result.data, pagination: { total: result.total, limit: result.limit, offset: result.offset, hasMore: result.hasMore } });
  });

  // POST /api/v1/gbp/widget/sessions/:sessionId/end — Close a chat session
  server.post("/widget/sessions/:sessionId/end", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };

    const session = await chatWidgetService.closeChatSession(sessionId);
    if (!session) {
      return reply.status(404).send({ error: { code: "not_found", message: "Session not found" } });
    }
    return reply.send({ data: session });
  });

  // GET /api/v1/gbp/widget/analytics — Get widget analytics
  server.get("/widget/analytics", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const brandId = (request.query as any)?.brandId as string | undefined;
    if (!brandId) {
      return reply.status(400).send({ error: { code: "brand_required", message: "brandId query param required" } });
    }
    const analytics = await chatWidgetService.getWidgetAnalytics(brandId);
    return reply.send({ data: analytics });
  });

  // ─── SMS Follow-ups ───────────────────────────────────────────────────────

  // GET /api/v1/gbp/widget/followups — List follow-ups
  server.get("/widget/followups", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const query = request.query as Record<string, string | undefined>;
    const brandId = query.brandId;
    if (!brandId) {
      return reply.status(400).send({ error: { code: "brand_required", message: "brandId query param required" } });
    }
    const status = query.status;
    const followups = await chatWidgetService.listFollowups(brandId, status);
    return reply.send({ data: followups });
  });

  // POST /api/v1/gbp/widget/followups/:id/retry — Retry a failed follow-up
  server.post("/widget/followups/:id/retry", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await chatWidgetService.retryFollowup(id);
    if (!result) {
      return reply.status(404).send({ error: { code: "not_found", message: "Follow-up not found" } });
    }
    return reply.send({ data: result });
  });

  // GET /api/v1/gbp/accounts/:id — Get account details
  server.get("/:id", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const [account] = await db
      .select()
      .from(gbpAccounts)
      .where(eq(gbpAccounts.id, id))
      .limit(1);

    if (!account) {
      return reply.status(404).send({ error: { code: "not_found", message: "Account not found" } });
    }

    return reply.send({ data: account });
  });

  // DELETE /api/v1/gbp/accounts/:id — Disconnect account
  server.delete("/:id", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const [account] = await db
      .select()
      .from(gbpAccounts)
      .where(eq(gbpAccounts.id, id))
      .limit(1);

    if (!account) {
      return reply.status(404).send({ error: { code: "not_found", message: "Account not found" } });
    }

    await gbpService.disconnectGbpAccount(account.brandId);
    return reply.send({ success: true });
  });

  // ─── Reviews ──────────────────────────────────────────────────────────────────

  // GET /api/v1/gbp/accounts/:id/reviews — List reviews
  server.get("/:id/reviews", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const limit = Math.min(100, parseInt((request.query as any)?.limit ?? "20", 10));
    const offset = parseInt((request.query as any)?.offset ?? "0", 10);

    const reviews = await gbpService.fetchReviews(id, limit, offset);
    return reply.send({ data: reviews });
  });

  // POST /api/v1/gbp/accounts/:id/reviews/:reviewId/respond — Respond to review
  server.post("/:id/reviews/:reviewId/respond", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id, reviewId } = request.params as { id: string; reviewId: string };
    const { response } = request.body as { response: string };

    if (!response?.trim()) {
      return reply.status(400).send({ error: { code: "missing_field", message: "response body required" } });
    }

    const result = await gbpService.respondToReview(id, reviewId, response);
    return reply.send({ data: result });
  });

  // POST /api/v1/gbp/accounts/:id/reviews/:reviewId/ai-suggest — AI suggest response
  server.post("/:id/reviews/:reviewId/ai-suggest", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id, reviewId } = request.params as { id: string; reviewId: string };

    const result = await gbpService.suggestAiResponse(id, reviewId);
    return reply.send({ data: result });
  });

  // POST /api/v1/gbp/accounts/:id/reviews/:reviewId/flag — Flag review for removal
  server.post("/:id/reviews/:reviewId/flag", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id, reviewId } = request.params as { id: string; reviewId: string };
    const { reason, details } = request.body as { reason: string; details: string };

    const validReasons = ["fake_spam", "conflict_of_interest", "off_topic", "profanity", "personal_info", "legal_issue", "other"];
    if (!validReasons.includes(reason)) {
      return reply.status(400).send({ error: { code: "invalid_reason", message: `reason must be one of: ${validReasons.join(", ")}` } });
    }
    if (!details?.trim()) {
      return reply.status(400).send({ error: { code: "missing_field", message: "details required — explain why this review should be removed" } });
    }

    const result = await gbpService.flagReviewForRemoval({
      brandId: id,
      reviewId,
      reason: reason as gbpService.ReviewFlagInput["reason"],
      details,
    });
    return reply.send({ data: result });
  });

  // POST /api/v1/gbp/accounts/:id/reviews/:reviewId/escalate — Escalate flagged review
  server.post("/:id/reviews/:reviewId/escalate", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id, reviewId } = request.params as { id: string; reviewId: string };
    const { supportTicketId } = request.body as { supportTicketId: string };

    if (!supportTicketId?.trim()) {
      return reply.status(400).send({ error: { code: "missing_field", message: "supportTicketId required" } });
    }

    const result = await gbpService.escalateReviewFlag(id, reviewId, supportTicketId);
    return reply.send({ data: result });
  });

  // GET /api/v1/gbp/accounts/:id/reviews/flagged — Get all flagged reviews
  server.get("/:id/reviews/flagged", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const result = await gbpService.getFlaggedReviews(id);
    return reply.send({ data: result });
  });

  // POST /api/v1/gbp/accounts/:id/reviews/bulk-ai-suggest — Bulk AI respond
  server.post("/:id/reviews/bulk-ai-suggest", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { minRating } = request.body as { minRating?: number };

    const result = await gbpService.bulkSuggestResponses(id, minRating);
    return reply.send({ data: result });
  });

  // ─── Posts ────────────────────────────────────────────────────────────────────

  // GET /api/v1/gbp/accounts/:id/posts — List posts
  server.get("/:id/posts", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const limit = Math.min(100, parseInt((request.query as any)?.limit ?? "20", 10));
    const offset = parseInt((request.query as any)?.offset ?? "0", 10);

    const posts = await gbpService.fetchPosts(id, limit, offset);
    return reply.send({ data: posts });
  });

  // POST /api/v1/gbp/accounts/:id/posts — Create post
  server.post("/:id/posts", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const postData = request.body as gbpService.GbpPostInput;

    if (!postData.summary?.trim()) {
      return reply.status(400).send({ error: { code: "missing_field", message: "summary is required" } });
    }

    const result = await gbpService.createPost(id, postData);
    return reply.status(201).send({ data: result });
  });

  // DELETE /api/v1/gbp/accounts/:id/posts/:postId — Delete post
  server.delete("/:id/posts/:postId", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id, postId } = request.params as { id: string; postId: string };

    await gbpService.deletePost(id, postId);
    return reply.send({ success: true });
  });

  // ─── Questions ──────────────────────────────────────────────────────────────────

  // GET /api/v1/gbp/accounts/:id/questions — List Q&A
  server.get("/:id/questions", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const questions = await gbpService.fetchQuestions(id);
    return reply.send({ data: questions });
  });

  // POST /api/v1/gbp/accounts/:id/questions/:questionId/answer — Answer question
  server.post("/:id/questions/:questionId/answer", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id, questionId } = request.params as { id: string; questionId: string };
    const { answer } = request.body as { answer: string };

    if (!answer?.trim()) {
      return reply.status(400).send({ error: { code: "missing_field", message: "answer body required" } });
    }

    const result = await gbpService.answerQuestion(id, questionId, answer);
    return reply.send({ data: result });
  });

  // POST /api/v1/gbp/accounts/:id/questions/:questionId/ai-suggest — AI suggest answer
  server.post("/:id/questions/:questionId/ai-suggest", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id, questionId } = request.params as { id: string; questionId: string };

    const result = await gbpService.suggestAiAnswer(id, questionId);
    return reply.send({ data: result });
  });

  // ─── Solicitations ────────────────────────────────────────────────────────────

  // POST /api/v1/gbp/solicitations — Create review solicitation
  server.post("/solicitations", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const body = request.body as Record<string, unknown>;
    const {
      brandId,
      gbpAccountId,
      clientName,
      clientPhone,
      clientEmail,
      messageTemplate,
    } = body;

    if (!brandId || !gbpAccountId || !clientName || !clientPhone) {
      return reply.status(400).send({
        error: { code: "missing_fields", message: "brandId, gbpAccountId, clientName, clientPhone required" },
      });
    }

    const result = await solicitationService.createSolicitation({
      brandId: brandId as string,
      gbpAccountId: gbpAccountId as string,
      clientName: clientName as string,
      clientPhone: clientPhone as string,
      clientEmail: clientEmail as string | undefined,
      messageTemplate: messageTemplate as string | undefined,
      createdByUserId: request.userId,
    });

    return reply.status(201).send({ data: result });
  });

  // POST /api/v1/gbp/solicitations/:id/send — Send solicitation
  server.post("/solicitations/:id/send", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const result = await solicitationService.sendSolicitation(id);
    return reply.send({ data: result });
  });

  // GET /api/v1/gbp/solicitations/:id/track — Track open/click (public, no auth - used by email/SMS links)
  server.get("/solicitations/:id/track", async (request, reply) => {
    const { id } = request.params as { id: string };
    const type = (request.query as any)?.type as string | undefined;

    if (type === "open") {
      const result = await solicitationService.trackOpen(id);
      return reply.send({ data: result });
    }
    if (type === "click") {
      const result = await solicitationService.trackClick(id);
      return reply.send({ data: result });
    }

    return reply.status(400).send({ error: { code: "invalid_type", message: "type must be 'open' or 'click'" } });
  });

  // GET /api/v1/gbp/solicitations — List solicitations
  server.get("/solicitations", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const brandId = (request.query as any)?.brandId as string | undefined;
    const status = (request.query as any)?.status as string | undefined;
    const limit = Math.min(100, parseInt((request.query as any)?.limit ?? "50", 10));
    const offset = parseInt((request.query as any)?.offset ?? "0", 10);

    if (!brandId) {
      return reply.status(400).send({ error: { code: "brand_required", message: "brandId query param required" } });
    }

    const rows = await solicitationService.getSolicitations(brandId, status, limit, offset);
    return reply.send({ data: rows });
  });

  // GET /api/v1/gbp/solicitations/stats — Get solicitation stats
  server.get("/solicitations/stats", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const brandId = (request.query as any)?.brandId as string | undefined;

    if (!brandId) {
      return reply.status(400).send({ error: { code: "brand_required", message: "brandId query param required" } });
    }

    const stats = await solicitationService.getSolicitationStats(brandId);
    return reply.send({ data: stats });
  });

  // ─── Booking CTA & Conversion Tracking ────────────────────────────────────────

  // GET /api/v1/gbp/booking/config — Get booking CTA configuration
  server.get("/booking/config", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const brandId = (request.query as any)?.brandId as string | undefined;

    if (!brandId) {
      return reply.status(400).send({ error: { code: "brand_required", message: "brandId query param required" } });
    }

    const config = await bookingService.getBookingConfig(brandId);
    return reply.send({ data: config });
  });

  // PUT /api/v1/gbp/booking/config — Update booking CTA configuration
  server.put("/booking/config", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const body = request.body as Record<string, unknown>;
    const brandId = body.brandId as string | undefined;

    if (!brandId) {
      return reply.status(400).send({ error: { code: "brand_required", message: "brandId is required" } });
    }

    const updates: Partial<bookingService.BookingConfig> = {};
    if (body.ctaText !== undefined) updates.ctaText = body.ctaText as string;
    if (body.ctaColor !== undefined) updates.ctaColor = body.ctaColor as string;
    if (body.ctaLinkUrl !== undefined) updates.ctaLinkUrl = body.ctaLinkUrl as string;
    if (body.enabledSources !== undefined) updates.enabledSources = body.enabledSources as ("gbp" | "website_widget" | "direct_link")[];
    if (body.widgetPosition !== undefined) updates.widgetPosition = body.widgetPosition as "bottom_right" | "bottom_left" | "center" | "inline";
    if (body.showOnPages !== undefined) updates.showOnPages = body.showOnPages as "all" | string[];
    if (body.autoOpenDelay !== undefined) updates.autoOpenDelay = body.autoOpenDelay as number;

    const config = await bookingService.updateBookingConfig(brandId, updates);
    return reply.send({ data: config });
  });

  // GET /api/v1/gbp/booking/stats — Get conversion funnel stats
  server.get("/booking/stats", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const brandId = (request.query as any)?.brandId as string | undefined;
    const period = (request.query as any)?.period as string | undefined;

    if (!brandId) {
      return reply.status(400).send({ error: { code: "brand_required", message: "brandId query param required" } });
    }

    const stats = await bookingService.getConversionStats(brandId, period);
    return reply.send({ data: stats });
  });

  // GET /api/v1/gbp/booking/recent — Get recent bookings
  server.get("/booking/recent", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const brandId = (request.query as any)?.brandId as string | undefined;
    const limit = Math.min(50, parseInt((request.query as any)?.limit ?? "10", 10));

    if (!brandId) {
      return reply.status(400).send({ error: { code: "brand_required", message: "brandId query param required" } });
    }

    const bookings = await bookingService.getRecentBookings(brandId, limit);
    return reply.send({ data: bookings });
  });

  // ─── Ads Integrations ────────────────────────────────────────────────────────

  // GET /api/v1/gbp/ads/accounts — List connected ad accounts
  server.get("/ads/accounts", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const brandId = (request.query as any)?.brandId as string | undefined;
    if (!brandId) {
      return reply.status(400).send({ error: { code: "brand_required", message: "brandId query param required" } });
    }
    const accounts = await adsService.listAdAccounts(brandId);
    return reply.send({ data: accounts });
  });

  // POST /api/v1/gbp/ads/accounts — Connect ad account
  server.post("/ads/accounts", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const body = request.body as Record<string, unknown>;
    const { brandId, platform, accountId, accountName, accessToken, refreshToken } = body;

    if (!brandId || !platform || !accountId) {
      return reply.status(400).send({
        error: { code: "missing_fields", message: "brandId, platform, and accountId are required" },
      });
    }

    if (platform !== "google_ads" && platform !== "meta_ads") {
      return reply.status(400).send({
        error: { code: "invalid_platform", message: "platform must be 'google_ads' or 'meta_ads'" },
      });
    }

    const result = await adsService.connectAdAccount({
      brandId: brandId as string,
      platform: platform as "google_ads" | "meta_ads",
      accountId: accountId as string,
      accountName: accountName as string | undefined,
      accessToken: accessToken as string | undefined,
      refreshToken: refreshToken as string | undefined,
    });

    return reply.status(201).send({ data: result });
  });

  // DELETE /api/v1/gbp/ads/accounts/:accountId — Disconnect ad account
  server.delete("/ads/accounts/:accountId", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { accountId } = request.params as { accountId: string };

    try {
      const result = await adsService.disconnectAdAccount(accountId);
      return reply.send({ data: result });
    } catch (err: any) {
      return reply.status(404).send({ error: { code: "not_found", message: err.message } });
    }
  });

  // GET /api/v1/gbp/ads/campaigns — List campaigns
  server.get("/ads/campaigns", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const brandId = (request.query as any)?.brandId as string | undefined;
    if (!brandId) {
      return reply.status(400).send({ error: { code: "brand_required", message: "brandId query param required" } });
    }
    const campaigns = await adsService.listCampaigns(brandId);
    return reply.send({ data: campaigns });
  });

  // GET /api/v1/gbp/ads/stats — Get aggregated ad stats
  server.get("/ads/stats", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const brandId = (request.query as any)?.brandId as string | undefined;
    if (!brandId) {
      return reply.status(400).send({ error: { code: "brand_required", message: "brandId query param required" } });
    }
    const stats = await adsService.getAdStats(brandId);
    return reply.send({ data: stats });
  });

  // ─── Conversion Tracking ────────────────────────────────────────────────────────

  // POST /api/v1/gbp/conversion/track — Record a conversion event (called from widget JS)
  server.post("/conversion/track", async (request, reply) => {
    const body = request.body as Record<string, unknown>;
    const { brandId, sessionId, eventType, source, metadata } = body;

    if (!brandId || !eventType) {
      return reply.status(400).send({
        error: { code: "missing_fields", message: "brandId and eventType are required" },
      });
    }

    const validEventTypes = [
      "booking_cta_impression",
      "booking_cta_click",
      "booking_form_start",
      "booking_completed",
    ];
    if (!validEventTypes.includes(eventType as string)) {
      return reply.status(400).send({
        error: {
          code: "invalid_event_type",
          message: `eventType must be one of: ${validEventTypes.join(", ")}`,
        },
      });
    }

    const validSources = ["organic", "chat_widget", "gbp", "ad", "referral"];
    if (source && !validSources.includes(source as string)) {
      return reply.status(400).send({
        error: {
          code: "invalid_source",
          message: `source must be one of: ${validSources.join(", ")}`,
        },
      });
    }

    const event = await conversionTrackingService.trackEvent({
      brandId: brandId as string,
      sessionId: sessionId as string | undefined,
      eventType: eventType as conversionTrackingService.ConversionEventType,
      source: (source as conversionTrackingService.ConversionSource) ?? "organic",
      metadata: metadata as Record<string, unknown> | undefined,
    });

    return reply.status(201).send({ data: event });
  });

  // GET /api/v1/gbp/conversion/stats — Aggregated funnel stats
  server.get("/conversion/stats", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const brandId = (request.query as any)?.brandId as string | undefined;
    const period = (request.query as any)?.period as string | undefined;

    if (!brandId) {
      return reply.status(400).send({ error: { code: "brand_required", message: "brandId query param required" } });
    }

    const stats = await conversionTrackingService.getConversionStats(brandId, period);
    return reply.send({ data: stats });
  });

  // GET /api/v1/gbp/conversion/trend — Daily/weekly trend data
  server.get("/conversion/trend", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const brandId = (request.query as any)?.brandId as string | undefined;
    const period = (request.query as any)?.period as string | undefined;

    if (!brandId) {
      return reply.status(400).send({ error: { code: "brand_required", message: "brandId query param required" } });
    }

    const trend = await conversionTrackingService.getTrendData(brandId, period);
    return reply.send({ data: trend });
  });
};