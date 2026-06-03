// ─── GBP (Google Business Profile) Types ──────────────────────────────────
// These mirror the DB schema in packages/api/src/db/schema.ts

// ─── Enums ──────────────────────────────────────────────────────────────────

export type GbpPostType = "OFFER" | "EVENT" | "UPDATE" | "CTA";

export type GbpReviewStatus = "new" | "replied" | "ignored" | "flagged";

export type GbpPostStatus = "draft" | "published" | "scheduled" | "expired" | "failed";

export type SolicitationStatus = "pending" | "sent" | "opened" | "clicked" | "reviewed" | "failed";

// ─── GbpAccount ──────────────────────────────────────────────────────────────

export interface GbpAccount {
  id: string;
  brandId: string;
  googleAccountId: string;
  displayName: string | null;
  locationId: string;
  locationName: string | null;
  address: Record<string, unknown> | null;
  phone: string | null;
  websiteUrl: string | null;
  primaryCategory: string | null;
  categories: string[] | null;
  hours: Record<string, unknown> | null;
  photos: Record<string, unknown> | null;
  accessTokenEncrypted: string | null;
  refreshTokenEncrypted: string | null;
  tokenExpiresAt: string | null;
  status: string;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGbpAccountInput {
  brandId: string;
  googleAccountId: string;
  locationId: string;
  displayName?: string;
  locationName?: string;
  address?: Record<string, unknown>;
  phone?: string;
  websiteUrl?: string;
  primaryCategory?: string;
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string;
}

export interface UpdateGbpAccountInput {
  displayName?: string;
  locationName?: string;
  address?: Record<string, unknown>;
  phone?: string;
  websiteUrl?: string;
  primaryCategory?: string;
  categories?: string[];
  hours?: Record<string, unknown>;
  photos?: Record<string, unknown>;
  accessTokenEncrypted?: string;
  refreshTokenEncrypted?: string;
  tokenExpiresAt?: string;
  status?: string;
  lastSyncedAt?: string;
}

// ─── GbpReview ──────────────────────────────────────────────────────────────

export interface GbpReview {
  id: string;
  gbpAccountId: string;
  brandId: string;
  externalReviewId: string;
  reviewerName: string | null;
  reviewerPhotoUrl: string | null;
  starRating: number | null;
  comment: string | null;
  replyComment: string | null;
  replyUpdatedAt: string | null;
  status: GbpReviewStatus;
  aiSuggestedReply: string | null;
  aiReplyGeneratedAt: string | null;
  createTime: string | null;
  updateTime: string | null;
  fetchedAt: string;
}

export interface ReviewResponse {
  reviewId: string;
  replyComment: string;
  replyUpdatedAt: string | null;
  status: GbpReviewStatus;
}

export interface AiSuggestResponseInput {
  brandId: string;
  reviewId: string;
}

export interface AiSuggestResponseOutput {
  reviewId: string;
  suggestion: string;
  tone: string;
  generatedAt: string;
}

// ─── GbpPost ────────────────────────────────────────────────────────────────

export interface GbpPost {
  id: string;
  gbpAccountId: string;
  brandId: string;
  externalPostId: string | null;
  title: string | null;
  summary: string;
  actionType: string | null;
  actionUrl: string | null;
  mediaUrls: string[] | null;
  postType: GbpPostType;
  offerDetails: Record<string, unknown> | null;
  eventDetails: Record<string, unknown> | null;
  status: GbpPostStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  externalUrl: string | null;
  errorMessage: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGbpPostInput {
  title?: string;
  summary: string;
  actionType?: "BOOK" | "ORDER" | "SHOP" | "LEARN_MORE" | "SIGN_UP" | "CALL";
  actionUrl?: string;
  mediaUrls?: string[];
  postType: GbpPostType;
  offerDetails?: Record<string, unknown>;
  eventDetails?: Record<string, unknown>;
  scheduledAt?: string;
  createdByUserId?: string;
}

export interface UpdateGbpPostInput {
  title?: string;
  summary?: string;
  actionType?: string;
  actionUrl?: string;
  mediaUrls?: string[];
  offerDetails?: Record<string, unknown>;
  eventDetails?: Record<string, unknown>;
  status?: GbpPostStatus;
  scheduledAt?: string;
}

// ─── GbpQuestion ────────────────────────────────────────────────────────────

export interface GbpQuestion {
  id: string;
  gbpAccountId: string;
  brandId: string;
  externalQuestionId: string;
  authorName: string | null;
  questionText: string;
  answerText: string | null;
  aiSuggestedAnswer: string | null;
  answerUpdatedAt: string | null;
  upvoteCount: number;
  status: string;
  createTime: string | null;
  fetchedAt: string;
}

export interface AnswerQuestionInput {
  brandId: string;
  questionId: string;
  answer: string;
}

export interface AiSuggestAnswerInput {
  brandId: string;
  questionId: string;
}

// ─── ReviewSolicitation ──────────────────────────────────────────────────────

export interface ReviewSolicitation {
  id: string;
  brandId: string;
  gbpAccountId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string | null;
  messageTemplate: string | null;
  status: SolicitationStatus;
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  reviewReceivedAt: string | null;
  errorMessage: string | null;
  createdByUserId: string | null;
  createdAt: string;
}

export interface CreateSolicitationInput {
  brandId: string;
  gbpAccountId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  messageTemplate?: string;
  createdByUserId?: string;
}

export interface SolicitationStats {
  total: number;
  sent: number;
  opened: number;
  clicked: number;
  reviewed: number;
  failed: number;
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginationParams {
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    has_more: boolean;
    next_cursor: string | null;
    total: number;
  };
}