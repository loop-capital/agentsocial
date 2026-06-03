"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Star,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2,
  Sparkles,
  Copy,
  Clock,
} from "lucide-react";
import { api } from "../../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GbpAccount {
  id: string;
  brand_id: string;
  account_name: string;
  location_id: string;
  status: string;
  review_count: number;
  average_rating: number;
  response_rate: number;
  created_at: string;
}

interface Review {
  id: string;
  account_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  status: "new" | "replied" | "archived";
  reply_text: string | null;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ratingStars(rating: number, size = "w-4 h-4") {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`${size} ${i < Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
    />
  ));
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function GbpReviewsPage() {
  const [accounts, setAccounts] = useState<GbpAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "new" | "replied" | "archived">("all");
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<Record<string, string>>({});
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const BRAND_ID = "00000000-0000-0000-0000-000000000000";

  // ─── Data fetching ──────────────────────────────────────────────────────────

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await api.gbp.listAccounts(BRAND_ID);
      const data = (res as any).data || res;
      setAccounts(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0 && !selectedAccount) {
        setSelectedAccount(data[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReviews = useCallback(async () => {
    if (!selectedAccount) return;
    setLoading(true);
    try {
      const res = await api.gbp.getReviews(selectedAccount, 50);
      const data = (res as any).data || res;
      setReviews(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedAccount]);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [selectedAccount]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const handleAiSuggest = async (accountId: string, reviewId: string) => {
    setAiLoading(reviewId);
    try {
      const res = await api.gbp.aiSuggest(accountId, reviewId);
      const suggestion = (res as any).data?.suggestion || (res as any).suggestion || "";
      setAiSuggestion((prev) => ({ ...prev, [reviewId]: suggestion }));
      setReplyTexts((prev) => ({ ...prev, [reviewId]: suggestion }));
    } catch (err: any) {
      setAiSuggestion((prev) => ({ ...prev, [reviewId]: `Error: ${err.message}` }));
    } finally {
      setAiLoading(null);
    }
  };

  const handleCopySuggestion = (reviewId: string) => {
    const text = aiSuggestion[reviewId];
    if (text) {
      navigator.clipboard.writeText(text);
      setCopiedId(reviewId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleSubmitReply = async (reviewId: string) => {
    setSubmitting(reviewId);
    try {
      // Optimistic update
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, status: "replied" as const, reply_text: replyTexts[reviewId] || r.reply_text }
            : r
        )
      );
      setReplyTexts((prev) => {
        const next = { ...prev };
        delete next[reviewId];
        return next;
      });
    } finally {
      setSubmitting(null);
    }
  };

  // ─── Filtered reviews ──────────────────────────────────────────────────────

  const filteredReviews = filter === "all"
    ? reviews
    : reviews.filter((r) => r.status === filter);

  const newCount = reviews.filter((r) => r.status === "new").length;
  const repliedCount = reviews.filter((r) => r.status === "replied").length;

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Respond to reviews with AI assistance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {newCount > 0 && (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                {newCount} new
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Account selector */}
      {accounts.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {accounts.map((account) => (
            <button
              key={account.id}
              onClick={() => setSelectedAccount(account.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                selectedAccount === account.id
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {account.account_name}
              <span className="ml-2 text-xs opacity-70">
                ★ {account.average_rating.toFixed(1)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-3">
        {[
          { key: "all" as const, label: "All", count: reviews.length },
          { key: "new" as const, label: "New", count: newCount },
          { key: "replied" as const, label: "Replied", count: repliedCount },
          { key: "archived" as const, label: "Archived", count: reviews.filter((r) => r.status === "archived").length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === tab.key
                ? "bg-indigo-100 text-indigo-700 font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 text-xs opacity-70">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Reviews list */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Reviews Yet</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            {filter !== "all"
              ? `No ${filter} reviews found. Try a different filter.`
              : "Connect a Google Business Profile and start soliciting reviews from your customers."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              accountId={selectedAccount!}
              aiSuggestion={aiSuggestion[review.id]}
              aiLoading={aiLoading === review.id}
              replyText={replyTexts[review.id] ?? review.reply_text ?? ""}
              copied={copiedId === review.id}
              submitting={submitting === review.id}
              onAiSuggest={() => handleAiSuggest(selectedAccount!, review.id)}
              onReplyTextChange={(text) =>
                setReplyTexts((prev) => ({ ...prev, [review.id]: text }))
              }
              onCopySuggestion={() => handleCopySuggestion(review.id)}
              onSubmitReply={() => handleSubmitReply(review.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Review Card Component ────────────────────────────────────────────────────

function ReviewCard({
  review,
  accountId,
  aiSuggestion,
  aiLoading,
  replyText,
  copied,
  submitting,
  onAiSuggest,
  onReplyTextChange,
  onCopySuggestion,
  onSubmitReply,
}: {
  review: Review;
  accountId: string;
  aiSuggestion?: string;
  aiLoading: boolean;
  replyText: string;
  copied: boolean;
  submitting: boolean;
  onAiSuggest: () => void;
  onReplyTextChange: (text: string) => void;
  onCopySuggestion: () => void;
  onSubmitReply: () => void;
}) {
  const isNew = review.status === "new";
  const isReplied = review.status === "replied";

  return (
    <div
      className={`bg-white rounded-xl border p-5 transition-colors ${
        isNew ? "border-yellow-300 bg-yellow-50/30" : "border-gray-200"
      }`}
    >
      {/* Review header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
            {review.reviewer_name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <div className="font-medium text-gray-900">{review.reviewer_name}</div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-0.5">
                {ratingStars(review.rating)}
              </span>
              <span className="text-xs text-gray-400">{timeAgo(review.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isNew && (
            <span className="px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3" /> Needs Reply
            </span>
          )}
          {isReplied && (
            <span className="px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Replied
            </span>
          )}
        </div>
      </div>

      {/* Review text */}
      <p className="text-gray-700 mb-4">{review.comment}</p>

      {/* Existing reply */}
      {review.reply_text && !replyText && (
        <div className="bg-indigo-50 rounded-lg p-3 mb-3 border border-indigo-100">
          <div className="text-xs font-medium text-indigo-600 mb-1">Your Reply</div>
          <p className="text-sm text-gray-700">{review.reply_text}</p>
        </div>
      )}

      {/* Reply section */}
      {(isNew || replyText) && (
        <div className="space-y-3">
          {/* AI Suggest button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onAiSuggest}
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50"
            >
              {aiLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              AI Suggest Reply
            </button>
            {aiSuggestion && !aiLoading && (
              <button
                onClick={onCopySuggestion}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Copy className="w-3 h-3" />
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>

          {/* Reply textarea */}
          <textarea
            value={replyText}
            onChange={(e) => onReplyTextChange(e.target.value)}
            placeholder="Type your reply..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />

          {/* Submit */}
          <div className="flex justify-end">
            <button
              onClick={onSubmitReply}
              disabled={!replyText.trim() || submitting}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}