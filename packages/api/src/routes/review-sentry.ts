// Review Sentry API Routes
// Review gating, solicitation, feedback capture, SMS dispatch, and review removal workflow

import { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/index.js";
import {
  reviewCampaigns,
  reviewRequests,
  reviewRemovalCases,
} from "../db/schema.js";
import { eq, and, inArray, desc } from "drizzle-orm";
import {
  bulkSendReviewRequests,
  sendSMS,
  processDeliveryStatus,
  optOutPhone,
  optInPhone,
  isOptOutKeyword,
  isOptInKeyword,
} from "../services/sms.js";
import { listTemplates, previewTemplate } from "../services/sms-templates.js";
import {
  scheduleReviewRequest,
  sendAfterAppointment,
  scheduleRecurring,
} from "../services/review-sentry-scheduler.js";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createCampaignSchema = z.object({
  brand_id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  google_place_id: z.string().min(1),
  google_review_url: z.string().url().optional(),
  primary_color: z.string().optional(),
  logo_url: z.string().url().optional(),
});

const rateSchema = z.object({
  slug: z.string().min(1),
  rating: z.number().int().min(1).max(5),
});

const feedbackSchema = z.object({
  slug: z.string().min(1),
  rating: z.number().int().min(1).max(5).optional(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  details: z.string().optional(),
});

const flagReviewSchema = z.object({
  brand_id: z.string().uuid(),
  review_url: z.string().url(),
  review_text: z.string().optional(),
  review_author: z.string().optional(),
  review_rating: z.number().int().min(1).max(5).optional(),
  violation_type: z.enum([
    "spam", "fake", "conflict_of_interest", "off_topic",
    "harassment", "hate_speech", "personal_info", "defamation", "other",
  ]),
  evidence_notes: z.string().optional(),
});

// ─── Route Registration ──────────────────────────────────────────────────────

export async function reviewSentryRoutes(server: FastifyInstance) {
  // Register content type parser for Twilio webhook callbacks (form-urlencoded)
  server.addContentTypeParser(
    "application/x-www-form-urlencoded",
    { parseAs: "string" },
    (req, body, done) => {
      try {
        const raw = typeof body === "string" ? body : body.toString();
        const params = new URLSearchParams(raw);
        const obj: Record<string, string> = {};
        for (const [key, value] of params.entries()) {
          obj[key] = value;
        }
        done(null, obj);
      } catch (err: any) {
        done(err);
      }
    },
  );
  // ─── GET /business/:slug — Public: business info for review page ──────────

  server.get("/business/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const campaign = await db.query.reviewCampaigns.findFirst({
      where: (c, { eq, and }) => and(eq(c.slug, slug), eq(c.active, true)),
    });

    if (!campaign) {
      return reply.status(404).send({ error: "Business not found" });
    }

    const googleReviewUrl =
      campaign.googleReviewUrl ||
      `https://search.google.com/local/writereview?placeid=${campaign.googlePlaceId}`;

    return reply.send({
      name: campaign.name,
      slug: campaign.slug,
      logo: campaign.logoUrl,
      googlePlaceId: campaign.googlePlaceId,
      googleReviewUrl: googleReviewUrl,
      primaryColor: campaign.primaryColor || "#4F46E5",
    });
  });

  // ─── POST /rate — Customer rates 1-5 stars ────────────────────────────────

  server.post("/rate", async (request, reply) => {
    const body = rateSchema.parse(request.body);
    const { slug, rating } = body;

    const campaign = await db.query.reviewCampaigns.findFirst({
      where: (c, { eq }) => eq(c.slug, slug),
    });

    if (!campaign) {
      return reply.status(404).send({ error: "Business not found" });
    }

    // Create review request record
    const [reviewRequest] = await db.insert(reviewRequests).values({
      campaignId: campaign.id,
      rating,
      status: "rated",
      ratedAt: new Date(),
    }).returning();

    let redirectUrl: string | null = null;
    if (rating >= 4) {
      redirectUrl =
        campaign.googleReviewUrl ||
        `https://search.google.com/local/writereview?placeid=${campaign.googlePlaceId}`;

      await db
        .update(reviewRequests)
        .set({ status: "redirected", redirectedTo: "google" })
        .where(eq(reviewRequests.id, reviewRequest.id));
    }

    return reply.send({
      success: true,
      rating,
      feedbackId: reviewRequest.id,
      redirectUrl,
      message:
        rating >= 4
          ? "Thank you! Please share your experience on Google."
          : "We're sorry to hear that. Please tell us more so we can improve.",
    });
  });

  // ─── POST /feedback — Customer submits negative feedback ──────────────────

  server.post("/feedback", async (request, reply) => {
    const body = feedbackSchema.parse(request.body);
    const { slug, rating, name, email, details } = body;

    const campaign = await db.query.reviewCampaigns.findFirst({
      where: (c, { eq }) => eq(c.slug, slug),
    });

    if (!campaign) {
      return reply.status(404).send({ error: "Business not found" });
    }

    const [feedback] = await db.insert(reviewRequests).values({
      campaignId: campaign.id,
      rating: rating || null,
      status: "feedback_submitted",
      feedbackStatus: "new",
      feedbackName: name || null,
      feedbackEmail: email || null,
      feedbackPhone: (request.body as any).phone || null,
      feedback: details || null,
    }).returning();

    // TODO: Send notification email/SMS to business owner
    // TODO: Auto-respond with apology + discount/rebooking offer
    // TODO: Create review response draft for AI processing

    return reply.send({
      success: true,
      feedbackId: feedback.id,
      message: "Feedback received. We'll follow up within 24 hours.",
    });
  });

  // ─── POST /campaigns — Create a review campaign ────────────────────────────

  server.post("/campaigns", async (request, reply) => {
    const body = createCampaignSchema.parse(request.body);

    const [campaign] = await db
      .insert(reviewCampaigns)
      .values({
        brandId: body.brand_id,
        name: body.name,
        slug: body.slug,
        googlePlaceId: body.google_place_id,
        googleReviewUrl: body.google_review_url || null,
        primaryColor: body.primary_color || "#4F46E5",
        logoUrl: body.logo_url || null,
        active: true,
      })
      .returning();

    return reply.status(201).send(campaign);
  });

  // ─── GET /campaigns/:id — Get campaign details ────────────────────────────

  server.get("/campaigns/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const campaign = await db.query.reviewCampaigns.findFirst({
      where: (c, { eq }) => eq(c.id, id),
    });

    if (!campaign) {
      return reply.status(404).send({ error: "Campaign not found" });
    }

    return reply.send(campaign);
  });

  // ─── GET /dashboard/:brandId — Dashboard analytics ────────────────────────

  server.get("/dashboard/:brandId", async (request, reply) => {
    const { brandId } = request.params as { brandId: string };
    const { period = "30d" } = request.query as { period?: string };

    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get campaigns for this brand
    const campaigns = await db.query.reviewCampaigns.findMany({
      where: (c, { eq }) => eq(c.brandId, brandId),
    });

    const campaignIds = campaigns.map((c: any) => c.id);

    if (campaignIds.length === 0) {
      return reply.send({
        period: `${days}d`,
        campaigns: 0,
        funnel: { sent: 0, opened: 0, rated: 0, redirected: 0, feedbackSubmitted: 0 },
        conversionRate: "0",
        avgRating: "0",
        ratingDistribution: [1, 2, 3, 4, 5].map((s) => ({ stars: s, count: 0 })),
        recentFeedback: [],
      });
    }

    const requests = await db.query.reviewRequests.findMany({
      where: (r, { inArray }) => inArray(r.campaignId, campaignIds),
    });

    const recentRequests = requests.filter(
      (r: any) => new Date(r.createdAt) >= since
    );

    const sent = recentRequests.length;
    const rated = recentRequests.filter((r: any) => r.status !== "sent").length;
    const redirected = recentRequests.filter((r: any) => r.status === "redirected").length;
    const feedbackSubmitted = recentRequests.filter((r: any) => r.status === "feedback_submitted").length;

    const ratings = recentRequests
      .filter((r: any) => r.rating !== null)
      .map((r: any) => r.rating);
    const avgRating =
      ratings.length > 0
        ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1)
        : "0";

    const ratingDist = [1, 2, 3, 4, 5].map((star) => ({
      stars: star,
      count: ratings.filter((r: number) => r === star).length,
    }));

    return reply.send({
      period: `${days}d`,
      campaigns: campaigns.length,
      funnel: { sent, opened: rated, rated, redirected, feedbackSubmitted },
      conversionRate: sent > 0 ? ((redirected / sent) * 100).toFixed(1) : "0",
      avgRating,
      ratingDistribution: ratingDist,
      recentFeedback: recentRequests
        .filter((r: any) => r.status === "feedback_submitted")
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10),
    });
  });

  // ─── POST /removal/flag — Flag a review for removal ───────────────────────

  server.post("/removal/flag", async (request, reply) => {
    const body = flagReviewSchema.parse(request.body);

    const [removalCase] = await db
      .insert(reviewRemovalCases)
      .values({
        brandId: body.brand_id,
        reviewUrl: body.review_url,
        reviewText: body.review_text || null,
        reviewAuthor: body.review_author || null,
        reviewRating: body.review_rating || null,
        violationType: body.violation_type,
        evidenceNotes: body.evidence_notes || null,
        status: "flagged",
      })
      .returning();

    return reply.status(201).send({
      success: true,
      case: removalCase,
      nextSteps: [
        "1. Log into GBP Manager → Find the review → Flag as inappropriate",
        `2. Select violation: ${body.violation_type}`,
        "3. Wait 3-7 business days for Google's review",
        "4. If denied, escalate with additional evidence",
      ],
    });
  });

  // ─── GET /removal/cases — List removal cases ──────────────────────────────

  server.get("/removal/cases", async (request, reply) => {
    const { brand_id, status } = request.query as { brand_id?: string; status?: "flagged" | "escalated" | "removed" | "denied" | "closed" };

    const conditions = [];
    if (brand_id) conditions.push(eq(reviewRemovalCases.brandId, brand_id));
    if (status) conditions.push(eq(reviewRemovalCases.status, status));

    const cases = await db.query.reviewRemovalCases.findMany({
      where: conditions.length > 0 ? and(...conditions as any) : undefined,
      orderBy: [desc(reviewRemovalCases.createdAt)],
    });

    return reply.send(cases);
  });

  // ─── POST /removal/cases/:id/evidence — Add evidence ─────────────────────

  server.post("/removal/cases/:id/evidence", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { evidence_type, evidence_url, evidence_notes } = request.body as any;

    const removalCase = await db.query.reviewRemovalCases.findFirst({
      where: (c, { eq }) => eq(c.id, id),
    });

    if (!removalCase) {
      return reply.status(404).send({ error: "Removal case not found" });
    }

    const existingNotes = (removalCase as any).evidenceNotes || "";
    const newNotes = `${existingNotes}\n[${new Date().toISOString()}] ${evidence_type}: ${evidence_notes}${evidence_url ? ` URL: ${evidence_url}` : ""}`;

    await db
      .update(reviewRemovalCases)
      .set({ evidenceNotes: newNotes })
      .where(eq(reviewRemovalCases.id, id));

    return reply.send({ success: true, message: "Evidence added to case" });
  });

  // ─── POST /removal/cases/:id/escalate — Escalate to GBP Support ─────────

  server.post("/removal/cases/:id/escalate", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { escalation_notes } = request.body as any;

    const removalCase = await db.query.reviewRemovalCases.findFirst({
      where: (c, { eq }) => eq(c.id, id),
    });

    if (!removalCase) {
      return reply.status(404).send({ error: "Removal case not found" });
    }

    await db
      .update(reviewRemovalCases)
      .set({
        status: "escalated",
        escalatedAt: new Date(),
        escalationNotes: escalation_notes || null,
      })
      .where(eq(reviewRemovalCases.id, id));

    return reply.send({
      success: true,
      message: "Case escalated to GBP Support",
      nextSteps: [
        "1. Contact support.google.com/business/gethelp",
        "2. Reference the review and your case ID",
        "3. Attach your evidence file with specific policy section citations",
        "4. Request escalation to a human reviewer",
        "5. Follow up weekly if no response",
      ],
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SMS DISPATCH ROUTES
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── POST /campaigns/:id/send — Send review requests to phone numbers ───

  server.post("/campaigns/:id/send", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      phoneNumbers: Array<{ phone: string; name?: string }>;
      templateId?: string;
    };

    if (!body.phoneNumbers || !Array.isArray(body.phoneNumbers) || body.phoneNumbers.length === 0) {
      return reply.status(400).send({ error: "phoneNumbers array is required" });
    }

    // Validate phone numbers
    const phoneRegex = /^\+?[1-9]\d{6,14}$/;
    const invalidPhones = body.phoneNumbers.filter(
      (p) => !phoneRegex.test(p.phone.replace(/[\s\-()]/g, ""))
    );
    if (invalidPhones.length > 0) {
      return reply.status(400).send({
        error: "Invalid phone numbers",
        invalid: invalidPhones.map((p) => p.phone),
      });
    }

    try {
      const result = await bulkSendReviewRequests(
        id,
        body.phoneNumbers,
        body.templateId,
      );

      return reply.send({
        success: true,
        sent: result.sent,
        queued: result.queued,
        total: body.phoneNumbers.length,
        errors: result.errors.length > 0 ? result.errors : undefined,
      });
    } catch (error: any) {
      return reply.status(500).send({
        error: "Failed to send review requests",
        message: error.message,
      });
    }
  });

  // ─── POST /sms/webhook — Twilio delivery status + opt-out handling ────────

  server.post("/sms/webhook", async (request, reply) => {
    const body = request.body as Record<string, string>;
    const messageSid = body.MessageSid;
    const messageStatus = body.MessageStatus;
    const errorCode = body.ErrorCode;
    const fromNumber = body.From;
    const messageBody = body.Body?.toLowerCase().trim() ?? "";

    // Handle opt-out from incoming SMS replies
    if (fromNumber && messageBody && isOptOutKeyword(messageBody)) {
      console.log(`[SMS Webhook] Opt-out from ${fromNumber}`);
      await optOutPhone(fromNumber);
      return reply
        .header("Content-Type", "text/xml")
        .send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }

    // Handle opt-in (UNSTOP/START)
    if (fromNumber && messageBody && isOptInKeyword(messageBody)) {
      console.log(`[SMS Webhook] Opt-in from ${fromNumber}`);
      await optInPhone(fromNumber);
      return reply
        .header("Content-Type", "text/xml")
        .send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }

    // Handle delivery status callback
    if (messageSid && messageStatus) {
      await processDeliveryStatus(messageSid, messageStatus, errorCode);
    }

    return reply
      .header("Content-Type", "text/xml")
      .send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  });

  // ─── POST /campaigns/:id/schedule — Schedule recurring sends ────────────

  server.post("/campaigns/:id/schedule", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      interval: "daily" | "weekly";
      time: string;
      phoneNumbers: Array<{ phone: string; name?: string }>;
      templateId?: string;
    };

    if (!["daily", "weekly"].includes(body.interval)) {
      return reply.status(400).send({ error: "interval must be 'daily' or 'weekly'" });
    }

    // Validate time format (HH:MM)
    if (!/^\d{2}:\d{2}$/.test(body.time)) {
      return reply.status(400).send({ error: "time must be in HH:MM format" });
    }

    try {
      const result = await scheduleRecurring({
        campaignId: id,
        interval: body.interval,
        time: body.time,
        phoneNumbers: body.phoneNumbers,
        templateId: body.templateId,
      });

      return reply.send({
        success: true,
        scheduled: result.scheduled,
        message: result.message,
      });
    } catch (error: any) {
      return reply.status(500).send({
        error: "Failed to schedule recurring sends",
        message: error.message,
      });
    }
  });

  // ─── POST /campaigns/:id/appointment — Send after appointment ──────────

  server.post("/campaigns/:id/appointment", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      customerPhone: string;
      customerName?: string;
      appointmentDate?: string;
    };

    if (!body.customerPhone) {
      return reply.status(400).send({ error: "customerPhone is required" });
    }

    try {
      const result = await sendAfterAppointment(
        id,
        body.customerPhone,
        body.customerName,
        body.appointmentDate ? new Date(body.appointmentDate) : undefined,
      );

      if (result.success) {
        return reply.send({
          success: true,
          requestId: result.requestId,
          message: result.message,
        });
      } else {
        return reply.status(400).send({
          success: false,
          message: result.message,
        });
      }
    } catch (error: any) {
      return reply.status(500).send({
        error: "Failed to send review request",
        message: error.message,
      });
    }
  });

  // ─── GET /templates — List available SMS templates ──────────────────────

  server.get("/templates", async (request, reply) => {
    const templates = listTemplates();
    return reply.send({ templates });
  });

  // ─── GET /templates/:id/preview — Preview an SMS template ───────────────

  server.get("/templates/:id/preview", async (request, reply) => {
    const { id } = request.params as { id: string };
    const preview = previewTemplate(id);
    return reply.send({ templateId: id, preview });
  });

  // ─── GET /opt-out/:phone — Check opt-out status ──────────────────────────

  server.get("/opt-out/:phone", async (request, reply) => {
    const { phone } = request.params as { phone: string };
    const { isPhoneOptedOut } = await import("../services/sms.js");
    const optedOut = await isPhoneOptedOut(phone);
    return reply.send({ phone, optedOut });
  });

  // ─── DELETE /opt-out/:phone — Remove opt-out (re-subscribe) ──────────────

  server.delete("/opt-out/:phone", async (request, reply) => {
    const { phone } = request.params as { phone: string };
    await optInPhone(phone);
    return reply.send({ success: true, message: "Opt-out removed" });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FEEDBACK DASHBOARD ROUTES
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── GET /feedback/:brandId — List feedback with filters ────────────────────

  server.get("/feedback/:brandId", async (request, reply) => {
    const { brandId } = request.params as { brandId: string };
    const query = request.query as {
      status?: string;
      rating?: string;
      campaign_id?: string;
      date_from?: string;
      date_to?: string;
      sort?: string;
      page?: string;
      limit?: string;
    };

    // Get campaigns for this brand
    const campaigns = await db.query.reviewCampaigns.findMany({
      where: (c, { eq }) => eq(c.brandId, brandId),
    });
    const campaignIds = campaigns.map((c: any) => c.id);

    if (campaignIds.length === 0) {
      return reply.send({
        feedback: [],
        total: 0,
        page: 1,
        limit: parseInt(query.limit || "20"),
        analytics: {
          totalFeedback: 0,
          avgRating: "0",
          responseRate: 0,
          thisMonth: 0,
          lastMonth: 0,
          trend: 0,
        },
        campaigns: [],
      });
    }

    // Build conditions
    const conditions: any[] = [
      inArray(reviewRequests.campaignId, campaignIds),
      eq(reviewRequests.status, "feedback_submitted"),
    ];

    if (query.status && ["new", "read", "replied", "archived"].includes(query.status)) {
      conditions.push(eq(reviewRequests.feedbackStatus, query.status as any));
    }
    if (query.rating) {
      const ratingNum = parseInt(query.rating);
      if (ratingNum >= 1 && ratingNum <= 5) {
        conditions.push(eq(reviewRequests.rating, ratingNum));
      }
    }
    if (query.campaign_id) {
      conditions.push(eq(reviewRequests.campaignId, query.campaign_id));
    }

    const page = parseInt(query.page || "1");
    const limit = Math.min(parseInt(query.limit || "20"), 100);
    const offset = (page - 1) * limit;

    // Fetch feedback items
    const allFeedback = await db.query.reviewRequests.findMany({
      where: and(...conditions),
      orderBy: [desc(reviewRequests.createdAt)],
    });

    // Date filtering in JS (since Drizzle date comparisons can be tricky)
    let filtered = allFeedback;
    if (query.date_from) {
      const fromDate = new Date(query.date_from);
      filtered = filtered.filter((r: any) => new Date(r.createdAt) >= fromDate);
    }
    if (query.date_to) {
      const toDate = new Date(query.date_to);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((r: any) => new Date(r.createdAt) <= toDate);
    }

    // Sorting
    const sortBy = query.sort || "date_desc";
    if (sortBy === "rating_asc") {
      filtered.sort((a: any, b: any) => (a.rating || 0) - (b.rating || 0));
    } else if (sortBy === "rating_desc") {
      filtered.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "date_asc") {
      filtered.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    // default: date_desc (already sorted)

    const total = filtered.length;
    const paged = filtered.slice(offset, offset + limit);

    // Enrich with campaign names
    const campaignMap = new Map(campaigns.map((c: any) => [c.id, c.name]));
    const enriched = paged.map((item: any) => ({
      ...item,
      campaignName: campaignMap.get(item.campaignId) || "Unknown",
    }));

    // Compute analytics
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const allFeedbackItems = await db.query.reviewRequests.findMany({
      where: and(
        inArray(reviewRequests.campaignId, campaignIds),
        eq(reviewRequests.status, "feedback_submitted"),
      ),
    });

    const thisMonthItems = allFeedbackItems.filter((r: any) => new Date(r.createdAt) >= thisMonthStart);
    const lastMonthItems = allFeedbackItems.filter(
      (r: any) => new Date(r.createdAt) >= lastMonthStart && new Date(r.createdAt) < thisMonthStart,
    );

    const ratingsAll = allFeedbackItems
      .filter((r: any) => r.rating !== null)
      .map((r: any) => r.rating);
    const avgRating =
      ratingsAll.length > 0
        ? (ratingsAll.reduce((a: number, b: number) => a + b, 0) / ratingsAll.length).toFixed(1)
        : "0";

    const repliedCount = allFeedbackItems.filter((r: any) => r.feedbackStatus === "replied").length;
    const responseRate = allFeedbackItems.length > 0 ? Math.round((repliedCount / allFeedbackItems.length) * 100) : 0;

    const thisMonthCount = thisMonthItems.length;
    const lastMonthCount = lastMonthItems.length;
    const trend =
      lastMonthCount > 0
        ? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100)
        : thisMonthCount > 0 ? 100 : 0;

    return reply.send({
      feedback: enriched,
      total,
      page,
      limit,
      analytics: {
        totalFeedback: allFeedbackItems.length,
        avgRating,
        responseRate,
        thisMonth: thisMonthCount,
        lastMonth: lastMonthCount,
        trend,
      },
      campaigns: campaigns.map((c: any) => ({ id: c.id, name: c.name })),
    });
  });

  // ─── PATCH /feedback/:id/status — Update feedback status ─────────────────

  server.patch("/feedback/:id/status", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { status: "new" | "read" | "replied" | "archived" };

    if (!["new", "read", "replied", "archived"].includes(body.status)) {
      return reply.status(400).send({ error: "Status must be one of: new, read, replied, archived" });
    }

    const existing = await db.query.reviewRequests.findFirst({
      where: (r, { eq }) => eq(r.id, id),
    });

    if (!existing) {
      return reply.status(404).send({ error: "Feedback not found" });
    }

    const updateData: any = { feedbackStatus: body.status };
    if (body.status === "read") {
      // Mark as read — no timestamp needed, just status change
    }
    if (body.status === "replied") {
      updateData.respondedAt = new Date();
    }

    await db
      .update(reviewRequests)
      .set(updateData)
      .where(eq(reviewRequests.id, id));

    return reply.send({ success: true, id, status: body.status });
  });

  // ─── POST /feedback/:id/reply — Reply to feedback ──────────────────────────

  server.post("/feedback/:id/reply", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { reply_text: string };

    if (!body.reply_text || !body.reply_text.trim()) {
      return reply.status(400).send({ error: "reply_text is required" });
    }

    const existing = await db.query.reviewRequests.findFirst({
      where: (r, { eq }) => eq(r.id, id),
    });

    if (!existing) {
      return reply.status(404).send({ error: "Feedback not found" });
    }

    await db
      .update(reviewRequests)
      .set({
        replyText: body.reply_text.trim(),
        feedbackStatus: "replied",
        respondedAt: new Date(),
      })
      .where(eq(reviewRequests.id, id));

    // TODO: Send reply via email/SMS to the customer
    // if (existing.feedbackEmail) { sendEmailReply(existing.feedbackEmail, body.reply_text); }
    // if (existing.feedbackPhone) { sendSMSReply(existing.feedbackPhone, body.reply_text); }

    return reply.send({
      success: true,
      id,
      status: "replied",
      reply_text: body.reply_text.trim(),
      replied_at: new Date().toISOString(),
    });
  });
}