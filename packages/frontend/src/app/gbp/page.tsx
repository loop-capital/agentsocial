"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Types — imported from shared package                              */
/* ------------------------------------------------------------------ */

import type {
  GbpAccount,
  GbpReview,
  GbpPost,
  GbpQuestion,
  SolicitationStats,
} from "@agentsocial/shared";

/* ------------------------------------------------------------------ */
/*  Inline SVG icons — no lucide-react needed                         */
/* ------------------------------------------------------------------ */

function IconBuilding() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><path d="M9 22V18h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M12 10h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconMessageCircle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconHelpCircle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconSend() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function IconMegaphone() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/v1";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: "#dcfce7", text: "#15803d" },
  connected: { bg: "#dcfce7", text: "#15803d" },
  new: { bg: "#dbeafe", text: "#1d4ed8" },
  replied: { bg: "#dcfce7", text: "#15803d" },
  ignored: { bg: "#f3f4f6", text: "#6b7280" },
  flagged: { bg: "#fee2e2", text: "#dc2626" },
  draft: { bg: "#f3f4f6", text: "#6b7280" },
  published: { bg: "#dcfce7", text: "#15803d" },
  scheduled: { bg: "#dbeafe", text: "#1d4ed8" },
  expired: { bg: "#fef3c7", text: "#92400e" },
  failed: { bg: "#fee2e2", text: "#dc2626" },
  pending: { bg: "#fef3c7", text: "#92400e" },
  sent: { bg: "#dbeafe", text: "#1d4ed8" },
  opened: { bg: "#e0e7ff", text: "#4338ca" },
  clicked: { bg: "#d1fae5", text: "#065f46" },
  reviewed: { bg: "#dcfce7", text: "#15803d" },
};

function statusBadge(status: string) {
  const c = STATUS_COLORS[status] || { bg: "#f3f4f6", text: "#6b7280" };
  return (
    <span
      style={{
        padding: "0.125rem 0.625rem",
        borderRadius: 9999,
        fontSize: "0.7rem",
        fontWeight: 600,
        background: c.bg,
        color: c.text,
      }}
    >
      {status}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                    */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  sub,
  color = "#0f766e",
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
      <p className="text-2xl font-bold mt-1" style={{ color }}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
      <div className="h-7 bg-gray-200 rounded w-1/2 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-2/3" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="px-6 py-4 animate-pulse flex items-center gap-3">
      <div className="h-4 bg-gray-200 rounded w-1/4" />
      <div className="h-4 bg-gray-100 rounded flex-1" />
      <div className="h-4 bg-gray-200 rounded w-16" />
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="text-gray-300 mb-3">{icon}</span>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab type                                                          */
/* ------------------------------------------------------------------ */

type TabKey = "overview" | "reviews" | "posts" | "questions";

/* ------------------------------------------------------------------ */
/*  GBP Dashboard Inner                                               */
/* ------------------------------------------------------------------ */

function GbpDashboardInner() {
  const searchParams = useSearchParams();
  const brandId = searchParams.get("brandId") || "demo-brand-id";

  const [accounts, setAccounts] = useState<GbpAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<GbpReview[]>([]);
  const [posts, setPosts] = useState<GbpPost[]>([]);
  const [questions, setQuestions] = useState<GbpQuestion[]>([]);
  const [solicitationStats, setSolicitationStats] = useState<SolicitationStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  /* ---- Fetch accounts ---- */
  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/gbp/accounts?brandId=${encodeURIComponent(brandId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data: GbpAccount[] = json.data || json;
      setAccounts(data);
      if (data.length > 0 && !selectedAccountId) {
        setSelectedAccountId(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load GBP accounts");
    }
  }, [brandId]);

  /* ---- Fetch solicitation stats ---- */
  const fetchSolicitationStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/gbp/solicitations/stats?brandId=${encodeURIComponent(brandId)}`);
      if (!res.ok) return;
      const json = await res.json();
      setSolicitationStats(json.data || json);
    } catch {
      // non-critical, silently ignore
    }
  }, [brandId]);

  /* ---- Fetch reviews ---- */
  const fetchReviews = useCallback(async () => {
    if (!selectedAccountId) return;
    try {
      const res = await fetch(`${API_BASE}/gbp/accounts/${selectedAccountId}/reviews?limit=5`);
      if (!res.ok) return;
      const json = await res.json();
      setReviews(json.data || json);
    } catch {
      // non-critical
    }
  }, [selectedAccountId]);

  /* ---- Fetch posts ---- */
  const fetchPosts = useCallback(async () => {
    if (!selectedAccountId) return;
    try {
      const res = await fetch(`${API_BASE}/gbp/accounts/${selectedAccountId}/posts?limit=5`);
      if (!res.ok) return;
      const json = await res.json();
      setPosts(json.data || json);
    } catch {
      // non-critical
    }
  }, [selectedAccountId]);

  /* ---- Fetch questions ---- */
  const fetchQuestions = useCallback(async () => {
    if (!selectedAccountId) return;
    try {
      const res = await fetch(`${API_BASE}/gbp/accounts/${selectedAccountId}/questions`);
      if (!res.ok) return;
      const json = await res.json();
      setQuestions(json.data || json);
    } catch {
      // non-critical
    }
  }, [selectedAccountId]);

  /* ---- Initial load ---- */
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAccounts(), fetchSolicitationStats()])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fetchAccounts, fetchSolicitationStats]);

  /* ---- Load detail data when account changes ---- */
  useEffect(() => {
    if (selectedAccountId) {
      fetchReviews();
      fetchPosts();
      fetchQuestions();
    }
  }, [selectedAccountId, fetchReviews, fetchPosts, fetchQuestions]);

  /* ---- Derived ---- */
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + (r.starRating || 0), 0) / reviews.length).toFixed(1)
      : "—";

  const newReviews = reviews.filter((r) => r.status === "new").length;
  const unrepliedQuestions = questions.filter((q) => !q.answerText).length;

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "reviews", label: "Reviews", count: reviews.length },
    { key: "posts", label: "Posts", count: posts.length },
    { key: "questions", label: "Q&A", count: questions.length },
  ];

  const handleRefresh = () => {
    setLoading(true);
    setError("");
    Promise.all([fetchAccounts(), fetchSolicitationStats()])
      .catch(() => {})
      .finally(() => setLoading(false));
    if (selectedAccountId) {
      fetchReviews();
      fetchPosts();
      fetchQuestions();
    }
  };

  /* ---- Loading skeleton ---- */
  if (loading && accounts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <IconBuilding />
            Google Business Profile
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your GBP accounts, reviews, posts, and Q&A
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <IconRefresh />
          Refresh
        </button>
      </div>

      {/* ─── Error ─── */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ─── Account selector ─── */}
      {accounts.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-600">Account:</span>
          <div className="flex gap-2 flex-wrap">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => setSelectedAccountId(acc.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  acc.id === selectedAccountId
                    ? "bg-teal-700 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {acc.locationName || acc.displayName || acc.id}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Tabs ─── */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? "bg-teal-100 text-teal-700" : "bg-gray-200 text-gray-500"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── Overview Tab ─── */}
      {activeTab === "overview" && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Connected Accounts"
              value={accounts.length}
              sub={accounts.filter((a) => a.status === "active" || a.status === "connected").length + " active"}
              icon={<IconBuilding />}
            />
            <StatCard
              label="Average Rating"
              value={avgRating}
              sub={`${reviews.length} review${reviews.length !== 1 ? "s" : ""}`}
              color="#f59e0b"
              icon={<IconStar />}
            />
            <StatCard
              label="New Reviews"
              value={newReviews}
              sub="Awaiting reply"
              color={newReviews > 0 ? "#dc2626" : "#0f766e"}
              icon={<IconMessageCircle />}
            />
            <StatCard
              label="Unanswered Qs"
              value={unrepliedQuestions}
              sub="Need attention"
              color={unrepliedQuestions > 0 ? "#f59e0b" : "#0f766e"}
              icon={<IconHelpCircle />}
            />
          </div>

          {/* Solicitation stats */}
          {solicitationStats && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <IconMegaphone />
                <h2 className="text-sm font-semibold text-gray-900">Review Solicitation</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: "Total", value: solicitationStats.total },
                  { label: "Sent", value: solicitationStats.sent },
                  { label: "Opened", value: solicitationStats.opened },
                  { label: "Clicked", value: solicitationStats.clicked },
                  { label: "Reviewed", value: solicitationStats.reviewed },
                  { label: "Failed", value: solicitationStats.failed },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent reviews (overview) */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <IconStar />
              <h2 className="text-sm font-semibold text-gray-900">Recent Reviews</h2>
              {newReviews > 0 && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                  {newReviews} new
                </span>
              )}
            </div>
            {reviews.length === 0 ? (
              <EmptyState
                icon={<IconStar />}
                title="No reviews yet"
                description="Reviews will appear here once customers start leaving feedback."
              />
            ) : (
              <div className="divide-y divide-gray-50">
                {reviews.slice(0, 3).map((review) => (
                  <div key={review.id} className="px-6 py-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800">
                        {review.reviewerName || "Anonymous"}
                      </span>
                      <div className="flex items-center gap-2">
                        {review.starRating !== null && (
                          <span className="text-sm font-medium text-yellow-600">
                            {"★".repeat(review.starRating)}
                            {"☆".repeat(5 - review.starRating)}
                          </span>
                        )}
                        {statusBadge(review.status)}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600 line-clamp-2">{review.comment}</p>
                    )}
                    {review.aiSuggestedReply && (
                      <div className="mt-2 p-2 bg-teal-50 rounded-lg border border-teal-100">
                        <p className="text-xs font-medium text-teal-700 mb-0.5">AI Suggested Reply</p>
                        <p className="text-xs text-teal-600 line-clamp-2">{review.aiSuggestedReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent posts (overview) */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <IconMegaphone />
              <h2 className="text-sm font-semibold text-gray-900">Recent Posts</h2>
            </div>
            {posts.length === 0 ? (
              <EmptyState
                icon={<IconMegaphone />}
                title="No posts yet"
                description="Create posts to keep your business profile updated."
              />
            ) : (
              <div className="divide-y divide-gray-50">
                {posts.slice(0, 3).map((post) => (
                  <div key={post.id} className="px-6 py-3.5 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {post.title && (
                          <span className="text-sm font-medium text-gray-800">{post.title}</span>
                        )}
                        {statusBadge(post.status)}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{post.summary}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {post.postType}
                        {post.scheduledAt && ` · Scheduled: ${new Date(post.scheduledAt).toLocaleDateString()}`}
                        {post.publishedAt && ` · Published: ${new Date(post.publishedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent questions (overview) */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <IconHelpCircle />
              <h2 className="text-sm font-semibold text-gray-900">Recent Questions</h2>
              {unrepliedQuestions > 0 && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  {unrepliedQuestions} unanswered
                </span>
              )}
            </div>
            {questions.length === 0 ? (
              <EmptyState
                icon={<IconHelpCircle />}
                title="No questions yet"
                description="Customer Q&A will appear here as questions come in."
              />
            ) : (
              <div className="divide-y divide-gray-50">
                {questions.slice(0, 3).map((q) => (
                  <div key={q.id} className="px-6 py-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800">
                        {q.authorName || "Anonymous"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {q.createTime ? new Date(q.createTime).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{q.questionText}</p>
                    {q.answerText ? (
                      <p className="text-sm text-teal-700 mt-1">↳ {q.answerText}</p>
                    ) : q.aiSuggestedAnswer ? (
                      <div className="mt-1.5 p-2 bg-teal-50 rounded-lg border border-teal-100">
                        <p className="text-xs font-medium text-teal-700 mb-0.5">AI Suggested Answer</p>
                        <p className="text-xs text-teal-600 line-clamp-2">{q.aiSuggestedAnswer}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600 mt-1">No answer yet</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── Reviews Tab ─── */}
      {activeTab === "reviews" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Reviews"
              value={reviews.length}
              icon={<IconStar />}
            />
            <StatCard
              label="Average Rating"
              value={avgRating}
              color="#f59e0b"
            />
            <StatCard
              label="New"
              value={newReviews}
              color={newReviews > 0 ? "#dc2626" : "#0f766e"}
            />
            <StatCard
              label="Replied"
              value={reviews.filter((r) => r.status === "replied").length}
              color="#16a34a"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <IconStar />
              <h2 className="text-sm font-semibold text-gray-900">All Reviews</h2>
            </div>
            {reviews.length === 0 ? (
              <EmptyState
                icon={<IconStar />}
                title="No reviews"
                description="Reviews from your Google Business Profile will appear here."
              />
            ) : (
              <div className="divide-y divide-gray-50">
                {reviews.map((review) => (
                  <div key={review.id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">
                          {review.reviewerName || "Anonymous"}
                        </span>
                        {review.starRating !== null && (
                          <span className="text-sm text-yellow-500">
                            {"★".repeat(review.starRating)}
                            {"☆".repeat(5 - review.starRating)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {statusBadge(review.status)}
                        <span className="text-xs text-gray-400">
                          {review.createTime
                            ? new Date(review.createTime).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-700 mb-2">{review.comment}</p>
                    )}
                    {review.replyComment && (
                      <div className="ml-4 pl-3 border-l-2 border-teal-200 mb-2">
                        <p className="text-xs font-medium text-gray-500 mb-0.5">Your reply</p>
                        <p className="text-sm text-gray-600">{review.replyComment}</p>
                      </div>
                    )}
                    {review.aiSuggestedReply && !review.replyComment && (
                      <div className="p-3 bg-teal-50 rounded-lg border border-teal-100">
                        <p className="text-xs font-medium text-teal-700 mb-1">✨ AI Suggested Reply</p>
                        <p className="text-sm text-teal-700">{review.aiSuggestedReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── Posts Tab ─── */}
      {activeTab === "posts" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Posts"
              value={posts.length}
              icon={<IconMegaphone />}
            />
            <StatCard
              label="Published"
              value={posts.filter((p) => p.status === "published").length}
              color="#16a34a"
            />
            <StatCard
              label="Scheduled"
              value={posts.filter((p) => p.status === "scheduled").length}
              color="#2563eb"
            />
            <StatCard
              label="Drafts"
              value={posts.filter((p) => p.status === "draft").length}
              color="#6b7280"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <IconMegaphone />
              <h2 className="text-sm font-semibold text-gray-900">All Posts</h2>
            </div>
            {posts.length === 0 ? (
              <EmptyState
                icon={<IconMegaphone />}
                title="No posts"
                description="Create posts to keep your business profile engaging and up to date."
              />
            ) : (
              <div className="divide-y divide-gray-50">
                {posts.map((post) => (
                  <div key={post.id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {post.title && (
                          <span className="text-sm font-semibold text-gray-800">{post.title}</span>
                        )}
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            background: post.postType === "OFFER" ? "#fef3c7" : post.postType === "EVENT" ? "#dbeafe" : "#f3f4f6",
                            color: post.postType === "OFFER" ? "#92400e" : post.postType === "EVENT" ? "#1d4ed8" : "#6b7280",
                          }}
                        >
                          {post.postType}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {statusBadge(post.status)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{post.summary}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {post.scheduledAt && <span>Scheduled: {new Date(post.scheduledAt).toLocaleDateString()}</span>}
                      {post.publishedAt && <span>Published: {new Date(post.publishedAt).toLocaleDateString()}</span>}
                      {post.errorMessage && <span className="text-red-500">{post.errorMessage}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── Q&A Tab ─── */}
      {activeTab === "questions" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              label="Total Questions"
              value={questions.length}
              icon={<IconHelpCircle />}
            />
            <StatCard
              label="Unanswered"
              value={unrepliedQuestions}
              color={unrepliedQuestions > 0 ? "#f59e0b" : "#0f766e"}
            />
            <StatCard
              label="Answered"
              value={questions.filter((q) => q.answerText).length}
              color="#16a34a"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <IconHelpCircle />
              <h2 className="text-sm font-semibold text-gray-900">All Questions</h2>
            </div>
            {questions.length === 0 ? (
              <EmptyState
                icon={<IconHelpCircle />}
                title="No questions"
                description="Customer Q&A will appear here as questions come in."
              />
            ) : (
              <div className="divide-y divide-gray-50">
                {questions.map((q) => (
                  <div key={q.id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">
                          {q.authorName || "Anonymous"}
                        </span>
                        {q.upvoteCount > 0 && (
                          <span className="text-xs text-gray-400">↑ {q.upvoteCount}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {q.createTime ? new Date(q.createTime).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{q.questionText}</p>
                    {q.answerText ? (
                      <div className="ml-4 pl-3 border-l-2 border-teal-200">
                        <p className="text-sm text-teal-700">{q.answerText}</p>
                        {q.answerUpdatedAt && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Updated {new Date(q.answerUpdatedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ) : q.aiSuggestedAnswer ? (
                      <div className="p-3 bg-teal-50 rounded-lg border border-teal-100">
                        <p className="text-xs font-medium text-teal-700 mb-1">✨ AI Suggested Answer</p>
                        <p className="text-sm text-teal-700">{q.aiSuggestedAnswer}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-amber-600">No answer yet</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── Footer ─── */}
      <div className="text-center text-xs text-gray-400 pt-4 pb-2">
        Powered by AgentSocial
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page export (Suspense wrapper)                                     */
/* ------------------------------------------------------------------ */

export default function GbpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
      }
    >
      <GbpDashboardInner />
    </Suspense>
  );
}