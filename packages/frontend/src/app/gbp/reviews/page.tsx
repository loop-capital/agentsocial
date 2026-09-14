"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { GbpReview, GbpReviewStatus, AiSuggestResponseOutput } from "@agentsocial/shared";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/v1";

const STATUS_CONFIG: Record<GbpReviewStatus, { label: string; bg: string; text: string; dot: string }> = {
  new:      { label: "New",      bg: "#dbeafe", text: "#1d4ed8", dot: "#3b82f6" },
  replied:  { label: "Replied",   bg: "#dcfce7", text: "#15803d", dot: "#22c55e" },
  ignored:  { label: "Ignored",   bg: "#f3f4f6", text: "#6b7280", dot: "#9ca3af" },
  flagged:  { label: "Flagged",   bg: "#fef3c7", text: "#92400e", dot: "#f59e0b" },
};

/* ------------------------------------------------------------------ */
/*  Inline SVG icons                                                  */
/* ------------------------------------------------------------------ */

function IconStar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
    </svg>
  );
}

function IconStarEmpty() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
    </svg>
  );
}

function IconFilter() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function IconSend() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function IconSparkles() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconFlag() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Star rating component                                             */
/* ------------------------------------------------------------------ */

function StarRating({ rating, size = 16 }: { rating: number | null; size?: number }) {
  if (rating === null) return <span className="text-gray-400 text-xs">No rating</span>;
  const full = Math.floor(rating);
  const partial = rating - full >= 0.5;
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < full ? "#f59e0b" : i === full && partial ? "#f59e0b" : "#d1d5db" }}>
          {i < full ? <IconStar /> : <IconStarEmpty />}
        </span>
      ))}
      <span className="text-xs text-gray-500 ml-1">({rating})</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  API helpers                                                       */
/* ------------------------------------------------------------------ */

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || body.message || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null as T;
  return res.json();
}

/* ------------------------------------------------------------------ */
/*  ReviewsInner                                                      */
/* ------------------------------------------------------------------ */

function ReviewsInner() {
  const searchParams = useSearchParams();
  const brandId = searchParams.get("brandId") || "demo-brand-id";
  const accountIdFromQuery = searchParams.get("accountId");

  /* State */
  const [accounts, setAccounts] = useState<{ id: string; displayName: string | null; locationName: string | null }[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [reviews, setReviews] = useState<GbpReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* Filters */
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<GbpReviewStatus | "all">("all");

  /* Selection & actions */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"ignore" | "flag" | null>(null);

  /* Reply state per review */
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [replying, setReplying] = useState<Record<string, boolean>>({});
  const [suggesting, setSuggesting] = useState<Record<string, boolean>>({});
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, AiSuggestResponseOutput>>({});
  const [expandedReview, setExpandedReview] = useState<string | null>(null);

  /* Load accounts */
  useEffect(() => {
    apiFetch<{ data: any[] }>(`/gbp/accounts?brandId=${brandId}`)
      .then((res) => {
        const accts = res.data || [];
        setAccounts(accts);
        if (accountIdFromQuery) {
          setSelectedAccountId(accountIdFromQuery);
        } else if (accts.length > 0) {
          setSelectedAccountId(accts[0].id);
        }
      })
      .catch(() => setError("Failed to load accounts"));
  }, [brandId, accountIdFromQuery]);

  /* Load reviews when account changes */
  const loadReviews = useCallback(() => {
    if (!selectedAccountId) return;
    setLoading(true);
    setError("");
    apiFetch<{ data: GbpReview[] }>(`/gbp/accounts/${selectedAccountId}/reviews?limit=20&offset=0`)
      .then((res) => {
        setReviews(res.data || []);
        setSelectedIds(new Set());
      })
      .catch((err) => setError(err.message || "Failed to load reviews"))
      .finally(() => setLoading(false));
  }, [selectedAccountId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  /* Derived: filtered reviews */
  const filtered = reviews.filter((r) => {
    if (filterRating !== null && r.starRating !== filterRating) return false;
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    return true;
  });

  /* Bulk actions */
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((r) => r.id)));
    }
  };

  const handleBulkIgnore = async () => {
    setBulkAction("ignore");
    try {
      // Mark each selected review as ignored via status update
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          apiFetch(`/gbp/accounts/${selectedAccountId}/reviews/${id}/respond`, {
            method: "POST",
            body: JSON.stringify({ response: "", status: "ignored" }),
          })
        )
      );
      setReviews((prev) =>
        prev.map((r) => (selectedIds.has(r.id) ? { ...r, status: "ignored" as GbpReviewStatus } : r))
      );
      setSelectedIds(new Set());
    } catch (err: any) {
      setError(err.message || "Bulk ignore failed");
    } finally {
      setBulkAction(null);
    }
  };

  const handleBulkFlag = async () => {
    setBulkAction("flag");
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          apiFetch(`/gbp/accounts/${selectedAccountId}/reviews/${id}/respond`, {
            method: "POST",
            body: JSON.stringify({ response: "", status: "flagged" }),
          })
        )
      );
      setReviews((prev) =>
        prev.map((r) => (selectedIds.has(r.id) ? { ...r, status: "flagged" as GbpReviewStatus } : r))
      );
      setSelectedIds(new Set());
    } catch (err: any) {
      setError(err.message || "Bulk flag failed");
    } finally {
      setBulkAction(null);
    }
  };

  /* AI suggestion */
  const handleSuggest = async (reviewId: string) => {
    setSuggesting((prev) => ({ ...prev, [reviewId]: true }));
    try {
      const res = await apiFetch<{ data: AiSuggestResponseOutput }>(
        `/gbp/accounts/${selectedAccountId}/reviews/${reviewId}/ai-suggest`,
        { method: "POST", body: JSON.stringify({ brandId }) }
      );
      const suggestion = res.data;
      if (suggestion) {
        setAiSuggestions((prev) => ({ ...prev, [reviewId]: suggestion }));
        setReplyTexts((prev) => ({ ...prev, [reviewId]: suggestion.suggestion }));
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate suggestion");
    } finally {
      setSuggesting((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  /* Submit reply */
  const handleReply = async (reviewId: string) => {
    const reply = replyTexts[reviewId]?.trim();
    if (!reply) return;
    setReplying((prev) => ({ ...prev, [reviewId]: true }));
    try {
      await apiFetch(`/gbp/accounts/${selectedAccountId}/reviews/${reviewId}/respond`, {
        method: "POST",
        body: JSON.stringify({ response: reply }),
      });
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, status: "replied" as GbpReviewStatus, replyComment: reply, replyUpdatedAt: new Date().toISOString() }
            : r
        )
      );
      setReplyTexts((prev) => {
        const next = { ...prev };
        delete next[reviewId];
        return next;
      });
      setExpandedReview(null);
    } catch (err: any) {
      setError(err.message || "Failed to submit reply");
    } finally {
      setReplying((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  /* Use AI suggestion as reply */
  const handleUseSuggestion = (reviewId: string) => {
    const suggestion = aiSuggestions[reviewId];
    if (suggestion) {
      setReplyTexts((prev) => ({ ...prev, [reviewId]: suggestion.suggestion }));
      setExpandedReview(reviewId);
    }
  };

  /* Loading skeleton */
  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-8 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse">
            <div className="h-4 w-32 bg-gray-200 rounded mb-3" />
            <div className="h-3 w-full bg-gray-100 rounded mb-2" />
            <div className="h-3 w-3/4 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  /* Stats */
  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + (r.starRating || 0), 0) / reviews.filter((r) => r.starRating !== null).length).toFixed(1)
    : "—";
  const newCount = reviews.filter((r) => r.status === "new").length;
  const repliedCount = reviews.filter((r) => r.status === "replied").length;
  const flaggedCount = reviews.filter((r) => r.status === "flagged").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and respond to Google Business Profile reviews</p>
        </div>
        <button
          onClick={loadReviews}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <IconRefresh />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600">{error}</div>
      )}

      {/* Account selector */}
      {accounts.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Account:</label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="flex-1 max-w-xs text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.displayName || a.locationName || a.id}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500">Avg Rating</p>
          <p className="text-2xl font-bold mt-1 text-yellow-600">{avgRating}</p>
          <p className="text-xs text-gray-400 mt-1">{reviews.filter((r) => r.starRating !== null).length} rated reviews</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500">New</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">{newCount}</p>
          <p className="text-xs text-gray-400 mt-1">Awaiting response</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500">Replied</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{repliedCount}</p>
          <p className="text-xs text-gray-400 mt-1">Responses sent</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500">Flagged</p>
          <p className="text-2xl font-bold mt-1 text-amber-600">{flaggedCount}</p>
          <p className="text-xs text-gray-400 mt-1">Needs attention</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <IconFilter />
          <span className="font-medium">Filters</span>
        </div>

        {/* Rating filter */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilterRating(null)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterRating === null ? "bg-teal-50 text-teal-700 border border-teal-200" : "text-gray-500 hover:text-gray-700 border border-transparent"
            }`}
          >
            All ratings
          </button>
          {[1, 2, 3, 4, 5].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRating(filterRating === r ? null : r)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                filterRating === r ? "bg-yellow-50 text-yellow-700 border border-yellow-200" : "text-gray-500 hover:text-gray-700 border border-transparent"
              }`}
            >
              <IconStar /> {r}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200" />

        {/* Status filter */}
        <div className="flex items-center gap-1">
          {(["all", "new", "replied", "ignored", "flagged"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterStatus === s
                  ? "bg-teal-50 text-teal-700 border border-teal-200"
                  : "text-gray-500 hover:text-gray-700 border border-transparent"
              }`}
            >
              {s === "all" ? "All" : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>

        <div className="ml-auto text-xs text-gray-400">
          {filtered.length} of {reviews.length} reviews
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 flex items-center gap-4">
          <span className="text-sm font-medium text-teal-800">{selectedIds.size} selected</span>
          <button
            onClick={handleBulkIgnore}
            disabled={bulkAction === "ignore"}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <IconEyeOff /> Mark Ignored
          </button>
          <button
            onClick={handleBulkFlag}
            disabled={bulkAction === "flag"}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <IconFlag /> Flag
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Review list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="text-gray-300 mb-3">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">
            {reviews.length === 0 ? "No reviews yet. Reviews will appear here when customers leave feedback." : "No reviews match your filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Select all checkbox */}
          <div className="flex items-center gap-3 px-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.size === filtered.length && filtered.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-xs text-gray-500">Select all</span>
            </label>
          </div>

          {filtered.map((review) => {
            const isExpanded = expandedReview === review.id;
            const cfg = STATUS_CONFIG[review.status];
            const suggestion = aiSuggestions[review.id];
            const isReplying = replying[review.id];
            const isSuggesting = suggesting[review.id];
            const currentReply = replyTexts[review.id] || "";

            return (
              <div
                key={review.id}
                className={`bg-white rounded-xl border shadow-sm transition-colors ${
                  selectedIds.has(review.id) ? "border-teal-200 bg-teal-50/30" : "border-gray-100"
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(review.id)}
                        onChange={() => toggleSelect(review.id)}
                        className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                    </div>

                    {/* Reviewer info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {review.reviewerName || "Anonymous"}
                        </span>
                        <StarRating rating={review.starRating} />
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full"
                          style={{ background: cfg.bg, color: cfg.text }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
                          {cfg.label}
                        </span>
                        {review.createTime && (
                          <span className="text-xs text-gray-400">
                            {new Date(review.createTime).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Review comment */}
                      {review.comment && (
                        <p className="mt-2 text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                      )}

                      {/* Existing reply */}
                      {review.replyComment && (
                        <div className="mt-3 pl-3 border-l-2 border-teal-200">
                          <p className="text-xs text-gray-400 mb-1 font-medium">Your response</p>
                          <p className="text-sm text-gray-600">{review.replyComment}</p>
                          {review.replyUpdatedAt && (
                            <p className="text-xs text-gray-300 mt-1">
                              {new Date(review.replyUpdatedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}

                      {/* AI suggestion preview */}
                      {suggestion && !isExpanded && (
                        <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-start gap-2">
                          <span className="text-indigo-500 mt-0.5"><IconSparkles /></span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-indigo-700 mb-0.5">AI Suggested Reply</p>
                            <p className="text-sm text-indigo-900 truncate">{suggestion.suggestion}</p>
                          </div>
                          <button
                            onClick={() => handleUseSuggestion(review.id)}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 whitespace-nowrap"
                          >
                            Use Suggestion
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {review.status !== "replied" && (
                        <>
                          <button
                            onClick={() => {
                              setExpandedReview(isExpanded ? null : review.id);
                              if (!replyTexts[review.id]) {
                                setReplyTexts((prev) => ({ ...prev, [review.id]: "" }));
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                          >
                            <IconSend /> Reply
                          </button>
                          <button
                            onClick={() => handleSuggest(review.id)}
                            disabled={isSuggesting}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                          >
                            {isSuggesting ? (
                              <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600" />
                            ) : (
                              <IconSparkles />
                            )}
                            AI Suggest
                          </button>
                        </>
                      )}
                      {review.status === "replied" && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                          <IconCheck /> Replied
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Inline reply editor */}
                  {isExpanded && (
                    <div className="mt-4 ml-8 border-t border-gray-100 pt-4">
                      <textarea
                        value={currentReply}
                        onChange={(e) => setReplyTexts((prev) => ({ ...prev, [review.id]: e.target.value }))}
                        placeholder="Write your reply..."
                        rows={3}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                      />
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() => handleReply(review.id)}
                          disabled={!currentReply.trim() || isReplying}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isReplying ? (
                            <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                          ) : (
                            <IconSend />
                          )}
                          Submit Reply
                        </button>
                        {suggestion && (
                          <button
                            onClick={() => setReplyTexts((prev) => ({ ...prev, [review.id]: suggestion.suggestion }))}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                          >
                            <IconSparkles /> Use Suggestion
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setExpandedReview(null);
                            setReplyTexts((prev) => {
                              const next = { ...prev };
                              delete next[review.id];
                              return next;
                            });
                          }}
                          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load more (future pagination) */}
      {filtered.length >= 20 && (
        <div className="text-center">
          <button className="text-sm text-teal-600 hover:text-teal-800 font-medium transition-colors">
            Load more reviews
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-6 pb-4">
        <p className="text-xs text-gray-400">Powered by AgentSocial</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page wrapper with Suspense                                         */
/* ------------------------------------------------------------------ */

export default function ReviewsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
      }
    >
      <ReviewsInner />
    </Suspense>
  );
}