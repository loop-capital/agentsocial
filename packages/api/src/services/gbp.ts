import { eq, and, desc, asc } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db, gbpAccounts, gbpReviews, gbpPosts, gbpQuestions } from "../db/index.js";
import type { GbpPostType } from "@agentsocial/shared";

// ─── Env / Mock Mode ──────────────────────────────────────────────────────────

const isMockMode = !(
  process.env.GOOGLE_MY_BUSINESS_CLIENT_ID &&
  process.env.GOOGLE_MY_BUSINESS_CLIENT_SECRET
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GbpConnectionInput {
  brandId: string;
  accountId: string;
  accessToken: string;
  refreshToken: string;
  locationId: string;
  displayName?: string;
  locationName?: string;
  phone?: string;
  websiteUrl?: string;
  primaryCategory?: string;
  address?: Record<string, unknown>;
}

export interface GbpPostInput {
  title?: string;
  summary: string;
  actionType?: "BOOK" | "ORDER" | "SHOP" | "LEARN_MORE" | "SIGN_UP" | "CALL";
  actionUrl?: string;
  mediaUrls?: string[];
  postType: GbpPostType;
  offerDetails?: Record<string, unknown>;
  eventDetails?: Record<string, unknown>;
  scheduledAt?: Date;
  createdByUserId?: string;
}

// ─── Mock Data Generators ─────────────────────────────────────────────────────

const MOCK_SALON_NAMES = [
  "Luxe Beauty Bar", "Glamour Studio", "Serene Spa & Salon",
  "Bella Hair Design", "The Polished Lounge",
];

const MOCK_REVIEWERS = [
  "Sarah M.", "Jessica T.", "Amanda K.", "Rachel L.", "Nicole B.",
  "Danielle R.", "Michelle W.", "Laura S.", "Emily H.", "Ashley P.",
];

const MOCK_REVIEW_COMMENTS = [
  "Absolutely loved my balayage! The color is exactly what I wanted. Maria was so attentive and really listened to what I was looking for. Will definitely be coming back!",
  "Great experience overall. The salon is beautiful and the staff is friendly. My haircut was good but took a bit longer than expected. Still recommend!",
  "The facial was relaxing and my skin feels amazing. However, the waiting area was a bit crowded and noisy. Service itself was top notch.",
  "Had a manicure and pedicure. The nail tech was professional and the polish lasted for weeks! Pricing is fair for the quality you get.",
  "Not impressed with my highlights this time. They came out way too brassy and I had to go somewhere else to fix them. Disappointed after being a loyal customer for 2 years.",
  "I was nervous about cutting my long hair but the stylist made me feel so comfortable. She gave me the perfect lob and I’ve gotten so many compliments!",
  "The deep conditioning treatment saved my damaged hair. I can actually run my fingers through it now! Thank you for the honest consultation too.",
  "Booked a makeup session for my wedding trial. The artist understood my vision immediately and the look was flawless in photos. Can’t wait for the big day!",
  "Mediocre experience. The massage was fine but nothing special. Felt a bit rushed at the end. Probably won’t return.",
  "Worst eyebrow wax ever! They were uneven and way too thin. I had to fill them in for weeks. The receptionist was also rude when I called to complain.",
];

const MOCK_QUESTIONS = [
  { q: "Do you guys do bridal hair and makeup?", a: "Yes! We specialize in bridal styling and offer both in-salon and on-location services for your big day. Call us to book a trial!" },
  { q: "What are your hours on Sunday?", a: "We're open Sunday 10am–5pm. It's a popular day so we recommend booking ahead!" },
  { q: "Do you use vegan / cruelty-free products?", a: "Absolutely. We carry a wide range of vegan and cruelty-free color and styling products. Just ask your stylist!" },
  { q: "Can I bring my own nail polish?", a: "Of course! We welcome clients who prefer their own polish. We also have a huge selection in-house if you'd like to browse." },
  { q: "Do you offer gift cards?", a: "Yes, gift cards are available in any denomination and can be purchased in-salon or online. They never expire!" },
  { q: "Is there parking available?", a: "We have complimentary parking in the lot behind the salon and free street parking on weekends." },
  { q: "How far in advance should I book a color appointment?", a: "For color services, we recommend booking 2–3 weeks in advance, especially for weekends." },
];

let mockReviewCounter = 0;
let mockPostCounter = 0;
let mockQuestionCounter = 0;
let mockSolicitationCounter = 0;

function nextMockId(prefix: string) {
  const counter =
    prefix === "rev" ? ++mockReviewCounter :
    prefix === "post" ? ++mockPostCounter :
    prefix === "q" ? ++mockQuestionCounter :
    ++mockSolicitationCounter;
  return `mock_${prefix}_${counter}_${Date.now().toString(36)}`;
}

// ─── connectGbpAccount ────────────────────────────────────────────────────────

/** Store OAuth credentials for a Google Business Profile connection. */
export async function connectGbpAccount(input: GbpConnectionInput) {
  const existing = await db
    .select()
    .from(gbpAccounts)
    .where(and(eq(gbpAccounts.brandId, input.brandId), eq(gbpAccounts.status, "active")))
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    const [updated] = await db
      .update(gbpAccounts)
      .set({
        googleAccountId: input.accountId,
        accessTokenEncrypted: input.accessToken,
        refreshTokenEncrypted: input.refreshToken,
        locationId: input.locationId,
        displayName: input.displayName ?? existing[0].displayName,
        locationName: input.locationName ?? existing[0].locationName,
        phone: input.phone ?? existing[0].phone,
        websiteUrl: input.websiteUrl ?? existing[0].websiteUrl,
        primaryCategory: input.primaryCategory ?? existing[0].primaryCategory,
        address: input.address ? JSON.stringify(input.address) : existing[0].address,
        status: "active",
        updatedAt: new Date(),
        lastSyncedAt: new Date(),
      })
      .where(eq(gbpAccounts.id, existing[0].id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(gbpAccounts)
    .values({
      brandId: input.brandId,
      googleAccountId: input.accountId,
      accessTokenEncrypted: input.accessToken,
      refreshTokenEncrypted: input.refreshToken,
      locationId: input.locationId,
      displayName: input.displayName ?? null,
      locationName: input.locationName ?? null,
      phone: input.phone ?? null,
      websiteUrl: input.websiteUrl ?? null,
      primaryCategory: input.primaryCategory ?? null,
      address: input.address ? JSON.stringify(input.address) : null,
      status: "active",
      lastSyncedAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return created;
}

// ─── getGbpAccount ────────────────────────────────────────────────────────────

/** Get the connected GBP account for a brand. */
export async function getGbpAccount(brandId: string) {
  const rows = await db
    .select()
    .from(gbpAccounts)
    .where(and(eq(gbpAccounts.brandId, brandId), eq(gbpAccounts.status, "active")))
    .limit(1);
  return rows[0] ?? null;
}

// ─── disconnectGbpAccount ─────────────────────────────────────────────────────

/** Remove (deactivate) a GBP account connection. */
export async function disconnectGbpAccount(brandId: string) {
  const account = await getGbpAccount(brandId);
  if (!account) return null;

  const [updated] = await db
    .update(gbpAccounts)
    .set({ status: "disconnected", updatedAt: new Date() })
    .where(eq(gbpAccounts.id, account.id))
    .returning();
  return updated;
}

// ─── fetchReviews ─────────────────────────────────────────────────────────────

/** Fetch reviews from GBP API (mock fallback in dev mode). */
export async function fetchReviews(
  brandId: string,
  limit: number = 20,
  offset: number = 0
) {
  const account = await getGbpAccount(brandId);

  if (isMockMode || !account) {
    // Generate deterministic mock reviews based on brandId
    const seed = brandId.split("-").join("").slice(0, 8);
    const count = 12;
    const reviews = Array.from({ length: count }).map((_, i) => {
      const idx = (parseInt(seed, 16) + i) % MOCK_REVIEW_COMMENTS.length;
      const rating = [5, 5, 4, 5, 2, 5, 5, 5, 3, 1][i % 10];
      return {
        id: `mock-rev-${i + 1}`,
        gbpAccountId: account?.id ?? "mock-account-id",
        brandId,
        externalReviewId: nextMockId("rev"),
        reviewerName: MOCK_REVIEWERS[i % MOCK_REVIEWERS.length],
        reviewerPhotoUrl: null,
        starRating: rating,
        comment: MOCK_REVIEW_COMMENTS[idx],
        replyComment: rating >= 4 ? "Thank you so much for your kind words! 💕 We can't wait to see you again." : null,
        replyUpdatedAt: rating >= 4 ? new Date(Date.now() - 86400000 * (i + 1)) : null,
        status: rating >= 4 ? "replied" : "new",
        aiSuggestedReply: null,
        aiReplyGeneratedAt: null,
        createTime: new Date(Date.now() - 86400000 * (i + 3)),
        updateTime: new Date(Date.now() - 86400000 * (i + 1)),
        fetchedAt: new Date(),
      };
    });
    return {
      reviews: reviews.slice(offset, offset + limit),
      total: count,
    };
  }

  // Real implementation would call Google My Business API
  const rows = await db
    .select()
    .from(gbpReviews)
    .where(eq(gbpReviews.brandId, brandId))
    .orderBy(desc(gbpReviews.createTime))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(gbpReviews)
    .where(eq(gbpReviews.brandId, brandId));

  return {
    reviews: rows,
    total: Number(countResult[0]?.count ?? 0),
  };
}

import { sql } from "drizzle-orm";

// ─── respondToReview ──────────────────────────────────────────────────────────

/** Reply to a GBP review. */
export async function respondToReview(
  brandId: string,
  reviewId: string,
  response: string
) {
  const account = await getGbpAccount(brandId);
  if (!account && !isMockMode) {
    throw new Error("No GBP account connected for this brand");
  }

  if (isMockMode) {
    return {
      id: reviewId,
      replyComment: response,
      replyUpdatedAt: new Date(),
      status: "replied",
      updated: true,
    };
  }

  // In production: call Google My Business API to post reply
  // Then update local DB
  const [updated] = await db
    .update(gbpReviews)
    .set({
      replyComment: response,
      replyUpdatedAt: new Date(),
      status: "replied",
    })
    .where(and(eq(gbpReviews.id, reviewId), eq(gbpReviews.brandId, brandId)))
    .returning();

  if (!updated) throw new Error("Review not found");
  return updated;
}

// ─── fetchPosts ─────────────────────────────────────────────────────────────────

/** Fetch GBP posts for a brand. */
export async function fetchPosts(
  brandId: string,
  limit: number = 20,
  offset: number = 0
) {
  const account = await getGbpAccount(brandId);

  if (isMockMode || !account) {
    const posts = [
      {
        id: "mock-post-1",
        gbpAccountId: account?.id ?? "mock-account-id",
        brandId,
        externalPostId: nextMockId("post"),
        title: "Mother's Day Special! 💐",
        summary: "Treat Mom to a luxury spa day! 20% off all packages this weekend only. Book now—slots filling fast!",
        actionType: "BOOK",
        actionUrl: "https://example.com/book",
        mediaUrls: ["https://picsum.photos/seed/mothersday/800/600"],
        postType: "offer",
        offerDetails: { discount: "20% off", validUntil: "2025-05-12" },
        eventDetails: null,
        status: "published",
        scheduledAt: null,
        publishedAt: new Date(Date.now() - 86400000 * 2),
        externalUrl: null,
        errorMessage: null,
        createdByUserId: null,
        createdAt: new Date(Date.now() - 86400000 * 3),
        updatedAt: new Date(Date.now() - 86400000 * 2),
      },
      {
        id: "mock-post-2",
        gbpAccountId: account?.id ?? "mock-account-id",
        brandId,
        externalPostId: nextMockId("post"),
        title: "New Balayage Technique",
        summary: "We're now offering the latest hand-painted balayage technique for sun-kissed, low-maintenance color. Perfect for summer!",
        actionType: "LEARN_MORE",
        actionUrl: "https://example.com/services",
        mediaUrls: ["https://picsum.photos/seed/balayage/800/600"],
        postType: "update",
        offerDetails: null,
        eventDetails: null,
        status: "published",
        scheduledAt: null,
        publishedAt: new Date(Date.now() - 86400000 * 5),
        externalUrl: null,
        errorMessage: null,
        createdByUserId: null,
        createdAt: new Date(Date.now() - 86400000 * 6),
        updatedAt: new Date(Date.now() - 86400000 * 5),
      },
      {
        id: "mock-post-3",
        gbpAccountId: account?.id ?? "mock-account-id",
        brandId,
        externalPostId: nextMockId("post"),
        title: "Summer Glow Workshop",
        summary: "Join us June 15th for a free summer skincare workshop! Learn tips from our estheticians and get a complimentary skin analysis.",
        actionType: "SIGN_UP",
        actionUrl: "https://example.com/events",
        mediaUrls: [],
        postType: "event",
        offerDetails: null,
        eventDetails: { startDate: "2025-06-15", startTime: "14:00", location: "Main Studio" },
        status: "scheduled",
        scheduledAt: new Date(Date.now() + 86400000 * 2),
        publishedAt: null,
        externalUrl: null,
        errorMessage: null,
        createdByUserId: null,
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 86400000),
      },
    ];
    return { posts: posts.slice(offset, offset + limit), total: posts.length };
  }

  const rows = await db
    .select()
    .from(gbpPosts)
    .where(eq(gbpPosts.brandId, brandId))
    .orderBy(desc(gbpPosts.createdAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(gbpPosts)
    .where(eq(gbpPosts.brandId, brandId));

  return { posts: rows, total: Number(countResult[0]?.count ?? 0) };
}

// ─── createPost ───────────────────────────────────────────────────────────────

/** Create a GBP post (offer, event, update). */
export async function createPost(brandId: string, postData: GbpPostInput) {
  const account = await getGbpAccount(brandId);
  if (!account && !isMockMode) {
    throw new Error("No GBP account connected for this brand");
  }

  if (isMockMode) {
    return {
      id: `mock-post-${Date.now()}`,
      gbpAccountId: account?.id ?? "mock-account-id",
      brandId,
      externalPostId: nextMockId("post"),
      title: postData.title ?? null,
      summary: postData.summary,
      actionType: postData.actionType ?? null,
      actionUrl: postData.actionUrl ?? null,
      mediaUrls: postData.mediaUrls ?? [],
      postType: postData.postType,
      offerDetails: postData.offerDetails ?? null,
      eventDetails: postData.eventDetails ?? null,
      status: postData.scheduledAt ? "scheduled" : "published",
      scheduledAt: postData.scheduledAt ?? null,
      publishedAt: postData.scheduledAt ? null : new Date(),
      externalUrl: null,
      errorMessage: null,
      createdByUserId: postData.createdByUserId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  const [created] = await db
    .insert(gbpPosts)
    .values({
      gbpAccountId: account!.id,
      brandId,
      title: postData.title ?? null,
      summary: postData.summary,
      actionType: postData.actionType ?? null,
      actionUrl: postData.actionUrl ?? null,
      mediaUrls: postData.mediaUrls ?? [],
      postType: postData.postType,
      offerDetails: postData.offerDetails ? JSON.stringify(postData.offerDetails) : null,
      eventDetails: postData.eventDetails ? JSON.stringify(postData.eventDetails) : null,
      status: postData.scheduledAt ? "scheduled" : "published",
      scheduledAt: postData.scheduledAt ?? null,
      publishedAt: postData.scheduledAt ? null : new Date(),
      createdByUserId: postData.createdByUserId ?? null,
      updatedAt: new Date(),
    })
    .returning();

  return created;
}

// ─── deletePost ─────────────────────────────────────────────────────────────────

/** Delete a GBP post. */
export async function deletePost(brandId: string, postId: string) {
  const account = await getGbpAccount(brandId);
  if (!account && !isMockMode) {
    throw new Error("No GBP account connected for this brand");
  }

  if (isMockMode) {
    return { id: postId, deleted: true };
  }

  // In production: call Google API to delete, then remove from DB
  const [deleted] = await db
    .delete(gbpPosts)
    .where(and(eq(gbpPosts.id, postId), eq(gbpPosts.brandId, brandId)))
    .returning();

  if (!deleted) throw new Error("Post not found");
  return deleted;
}

// ─── fetchQuestions ────────────────────────────────────────────────────────────

/** Fetch Q&A from GBP. */
export async function fetchQuestions(brandId: string) {
  const account = await getGbpAccount(brandId);

  if (isMockMode || !account) {
    return MOCK_QUESTIONS.map((q, i) => ({
      id: `mock-q-${i + 1}`,
      gbpAccountId: account?.id ?? "mock-account-id",
      brandId,
      externalQuestionId: nextMockId("q"),
      authorName: "Local Guide",
      questionText: q.q,
      answerText: q.a,
      aiSuggestedAnswer: null,
      answerUpdatedAt: new Date(Date.now() - 86400000 * (i + 7)),
      upvoteCount: Math.floor(Math.random() * 8),
      status: "answered" as const,
      createTime: new Date(Date.now() - 86400000 * (i + 14)),
      fetchedAt: new Date(),
    }));
  }

  const rows = await db
    .select()
    .from(gbpQuestions)
    .where(eq(gbpQuestions.brandId, brandId))
    .orderBy(desc(gbpQuestions.createTime));

  return rows;
}

// ─── answerQuestion ───────────────────────────────────────────────────────────

/** Answer a GBP question. */
export async function answerQuestion(
  brandId: string,
  questionId: string,
  answer: string
) {
  const account = await getGbpAccount(brandId);
  if (!account && !isMockMode) {
    throw new Error("No GBP account connected for this brand");
  }

  if (isMockMode) {
    return {
      id: questionId,
      answerText: answer,
      answerUpdatedAt: new Date(),
      status: "answered",
    };
  }

  const [updated] = await db
    .update(gbpQuestions)
    .set({
      answerText: answer,
      answerUpdatedAt: new Date(),
      status: "answered",
    })
    .where(and(eq(gbpQuestions.id, questionId), eq(gbpQuestions.brandId, brandId)))
    .returning();

  if (!updated) throw new Error("Question not found");
  return updated;
}

// ─── AI Suggest Review Response ───────────────────────────────────────────────

/** Use AI to suggest a review response. In mock mode, returns a pre-built template. */
export async function suggestAiResponse(brandId: string, reviewId: string) {
  // In production: call AI service (OpenAI / Anthropic)
  // For mock mode, generate based on review content
  const { reviews } = await fetchReviews(brandId, 50, 0);
  const review = reviews.find((r: any) => r.id === reviewId);

  const rating = review?.starRating ?? 5;
  const comment = review?.comment ?? "";
  const hasSpecifics = comment.length > 60;

  let suggestion = "";
  if (rating >= 5) {
    suggestion = hasSpecifics
      ? `Thank you so much for the wonderful review! We're thrilled you loved your experience and that we could deliver exactly what you were looking for. We can't wait to welcome you back soon! 💕`
      : `Thank you for the 5-star review! We're so happy to hear you had a great experience with us. Your support means the world to our team! ✨`;
  } else if (rating === 4) {
    suggestion = `Thank you for your feedback! We're glad you enjoyed your visit overall. We'd love to know if there's anything we can do to make your next experience a perfect 5 stars. Please don't hesitate to reach out! 🌟`;
  } else if (rating === 3) {
    suggestion = `Thank you for taking the time to share your experience. We genuinely appreciate your honest feedback and would love the opportunity to make things right. Please contact our manager directly so we can learn more and improve. 💬`;
  } else {
    suggestion = `We're truly sorry your experience didn't meet expectations. Your feedback is important to us, and we'd like to make this right. Please reach out to our salon manager at your earliest convenience so we can address your concerns personally. 🙏`;
  }

  return {
    reviewId,
    suggestion,
    tone: rating >= 4 ? "friendly" : "professional",
    generatedAt: new Date(),
  };
}

// ─── Flag Review for Removal ────────────────────────────────────────────────────

export interface ReviewFlagInput {
  brandId: string;
  reviewId: string;
  reason: "fake_spam" | "conflict_of_interest" | "off_topic" | "profanity" | "personal_info" | "legal_issue" | "other";
  details: string;
  escalatedToGoogle?: boolean;
  escalatedDate?: Date;
  supportTicketId?: string;
}

/** Flag a review for removal and track escalation status. */
export async function flagReviewForRemoval(input: ReviewFlagInput) {
  const account = await getGbpAccount(input.brandId);
  if (!account && !isMockMode) {
    throw new Error("No GBP account connected for this brand");
  }

  // In production: Call Google My Business API to flag the review
  // POST https://mybusiness.googleapis.com/v4/{review}/dispute
  // For now, update local DB with flag status

  if (isMockMode) {
    return {
      reviewId: input.reviewId,
      brandId: input.brandId,
      flagReason: input.reason,
      details: input.details,
      status: "flagged",
      flaggedAt: new Date(),
      escalatedToGoogle: input.escalatedToGoogle ?? false,
      message: `Review flagged as "${input.reason}". ${input.escalatedToGoogle ? "Escalated to Google support." : "Google will review within 3-5 business days."}`,
    };
  }

  const [updated] = await db
    .update(gbpReviews)
    .set({
      flagReason: input.reason,
      flagDetails: input.details,
      flagStatus: "flagged",
      flaggedAt: new Date(),
      escalatedToGoogle: input.escalatedToGoogle ?? false,
    })
    .where(and(eq(gbpReviews.id, input.reviewId), eq(gbpReviews.brandId, input.brandId)))
    .returning();

  if (!updated) throw new Error("Review not found");
  return updated;
}

// ─── Get Flagged Reviews ────────────────────────────────────────────────────────

/** Get all flagged reviews for a brand with their removal status. */
export async function getFlaggedReviews(brandId: string) {
  if (isMockMode) {
    return [];
  }

  const rows = await db
    .select()
    .from(gbpReviews)
    .where(and(
      eq(gbpReviews.brandId, brandId),
      sql`${gbpReviews.flagStatus} IS NOT NULL`
    ))
    .orderBy(desc(gbpReviews.flaggedAt));

  return rows;
}

// ─── Escalate Review Flag ─────────────────────────────────────────────────────

/** Escalate a flagged review to Google support with a support ticket. */
export async function escalateReviewFlag(
  brandId: string,
  reviewId: string,
  supportTicketId: string
) {
  if (isMockMode) {
    return {
      reviewId,
      status: "escalated",
      supportTicketId,
      escalatedAt: new Date(),
      message: "Review escalation submitted to Google Small Business Support. Expect response in 5-7 business days.",
    };
  }

  const [updated] = await db
    .update(gbpReviews)
    .set({
      flagStatus: "escalated",
      escalatedToGoogle: true,
      escalationDate: new Date(),
      supportTicketId,
    })
    .where(and(eq(gbpReviews.id, reviewId), eq(gbpReviews.brandId, brandId)))
    .returning();

  if (!updated) throw new Error("Review not found");
  return updated;
}

// ─── Bulk AI Respond to Reviews ─────────────────────────────────────────────────

/** Generate AI responses for all unanswered reviews. */
export async function bulkSuggestResponses(brandId: string, minRating?: number) {
  const { reviews } = await fetchReviews(brandId, 100, 0);
  const unanswered = reviews.filter((r: any) => {
    const isUnanswered = r.status === "new" || !r.replyComment;
    const matchesRating = minRating === undefined || r.starRating <= minRating;
    return isUnanswered && matchesRating;
  });

  const suggestions = [];
  for (const review of unanswered) {
    const suggestion = await suggestAiResponse(brandId, review.id);
    suggestions.push({
      reviewId: review.id,
      reviewerName: review.reviewerName,
      starRating: review.starRating,
      comment: review.comment,
      suggestedReply: suggestion.suggestion,
      tone: suggestion.tone,
    });
  }

  return {
    total: unanswered.length,
    suggestions,
    generatedAt: new Date(),
  };
}

// ─── AI Suggest Q&A Answer ────────────────────────────────────────────────────

/** Use AI to suggest a Q&A answer. */
export async function suggestAiAnswer(brandId: string, questionId: string) {
  const questions = await fetchQuestions(brandId);
  const question = questions.find((q: any) => q.id === questionId);

  const qText = question?.questionText ?? "";
  let suggestion = "";

  if (/bridal|wedding/i.test(qText)) {
    suggestion = `Yes, we absolutely offer bridal hair and makeup services! We provide both in-salon appointments and on-location services for your wedding day. We recommend booking a trial session 2–3 months before your big day. Call us at (555) 123-4567 to schedule!`;
  } else if (/hour|open|time/i.test(qText)) {
    suggestion = `Our hours are: Monday–Friday 9am–8pm, Saturday 9am–6pm, and Sunday 10am–5pm. We recommend booking appointments in advance, especially for weekends!`;
  } else if (/vegan|cruelty|organic/i.test(qText)) {
    suggestion = `Yes, we proudly use a wide range of vegan and cruelty-free products! Just let your stylist know your preferences when you arrive, and they'll be happy to recommend the best options for you.`;
  } else if (/gift card|voucher/i.test(qText)) {
    suggestion = `Yes, we offer gift cards in any denomination! They can be purchased in-salon or through our website, and they never expire. They make the perfect gift for any occasion! 🎁`;
  } else if (/park/i.test(qText)) {
    suggestion = `We have complimentary parking in the lot behind the salon. There's also free street parking available on weekends and after 6pm on weekdays.`;
  } else {
    suggestion = `Thank you for your question! We'd be happy to help. Please give us a call at (555) 123-4567 or send us a message, and our team will get back to you right away.`;
  }

  return {
    questionId,
    suggestion,
    confidence: 0.92,
    generatedAt: new Date(),
  };
}
