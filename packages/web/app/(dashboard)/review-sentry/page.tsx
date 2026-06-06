"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../../../lib/api";
import {
  Shield,
  Send,
  Star,
  TrendingUp,
  Users,
  MessageSquare,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Loader2,
  ExternalLink,
  Flag,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Ban,
  Phone,
  Mail,
  Calendar,
  BarChart3,
  Filter,
  Search,
  AlertOctagon,
  Copy,
  FileText,
  Upload,
  Fingerprint,
  MapPin,
  UserX,
  Activity,
  Zap,
  ChevronRight,
  ClipboardCopy,
  Scale,
  Globe,
  Archive,
  Reply,
  ArrowUpDown,
  Inbox,
} from "lucide-react";
import { StatCard } from "../../../components/ui/stat-card";
import { EmptyState } from "../../../components/ui/empty-state";

// ─── Types ──────────────────────────────────────────────────────────────────

type RemovalStatus = "flagged" | "escalated" | "removed" | "denied" | "closed";
type ViolationType =
  | "spam"
  | "fake"
  | "conflict_of_interest"
  | "off_topic"
  | "harassment"
  | "hate_speech"
  | "personal_info"
  | "defamation"
  | "other";

interface FunnelData {
  sent: number;
  opened: number;
  rated: number;
  redirected: number;
  feedbackSubmitted: number;
}

interface DashboardData {
  period: string;
  campaigns: number;
  funnel: FunnelData;
  conversionRate: string;
  avgRating: string;
  ratingDistribution: Array<{ stars: number; count: number }>;
  recentFeedback: Array<FeedbackItem>;
}

interface FeedbackItem {
  id: string;
  rating: number | null;
  feedbackName: string | null;
  feedbackEmail: string | null;
  feedbackPhone?: string | null;
  feedback: string | null;
  status: string;
  feedbackStatus: "new" | "read" | "replied" | "archived";
  replyText?: string | null;
  campaignId: string;
  campaignName?: string;
  createdAt: string;
  respondedAt?: string | null;
}

type FeedbackStatus = "new" | "read" | "replied" | "archived";

type FeedbackSort = "date_desc" | "date_asc" | "rating_asc" | "rating_desc";

interface FeedbackAnalytics {
  totalFeedback: number;
  avgRating: string;
  responseRate: number;
  thisMonth: number;
  lastMonth: number;
  trend: number;
}

interface FeedbackListResponse {
  feedback: FeedbackItem[];
  total: number;
  page: number;
  limit: number;
  analytics: FeedbackAnalytics;
  campaigns: Array<{ id: string; name: string }>;
}

const FEEDBACK_STATUS_CONFIG: Record<FeedbackStatus, { label: string; color: string; icon: React.ReactNode }> = {
  new: { label: "New", color: "bg-blue-100 text-blue-800", icon: <Inbox className="w-3 h-3" /> },
  read: { label: "Read", color: "bg-gray-100 text-gray-800", icon: <Eye className="w-3 h-3" /> },
  replied: { label: "Replied", color: "bg-green-100 text-green-800", icon: <Reply className="w-3 h-3" /> },
  archived: { label: "Archived", color: "bg-slate-100 text-slate-800", icon: <Archive className="w-3 h-3" /> },
};

const REPLY_TEMPLATES = [
  {
    id: "apology",
    label: "Sorry you had a bad experience",
    text: "We're truly sorry to hear about your experience. Your feedback is important to us and we'd like to make things right. Could you please share more details about what happened so we can address it directly?",
  },
  {
    id: "resolve",
    label: "We'd love to make it right",
    text: "Thank you for letting us know about your experience. We take this very seriously and would love the opportunity to make it right. Please reach out to us directly so we can discuss how we can resolve this for you.",
  },
  {
    id: "acknowledge",
    label: "Thank you for your feedback",
    text: "Thank you for taking the time to share your feedback. We appreciate your honesty and take all feedback seriously. We've noted your concerns and are working to improve. Your experience matters to us.",
  },
];

interface Campaign {
  id: string;
  brandId: string;
  name: string;
  slug: string;
  googlePlaceId: string;
  googleReviewUrl: string | null;
  primaryColor: string | null;
  logoUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RemovalCase {
  id: string;
  brandId: string;
  reviewUrl: string;
  reviewText: string | null;
  reviewAuthor: string | null;
  reviewRating: number | null;
  violationType: ViolationType;
  evidenceNotes: string | null;
  status: RemovalStatus;
  flaggedAt: string;
  escalatedAt: string | null;
  removedAt: string | null;
  createdAt: string;
}

interface SMSTemplate {
  id: string;
  name: string;
  body: string;
}

interface TemplatePreview {
  templateId: string;
  preview: string;
}

// Ring Detector types
interface SuspiciousReview {
  id: string;
  reviewerName: string;
  rating: number;
  date: string;
  suspicionScore: number;
  flags: string[];
  reviewText: string;
  reviewerProfileUrl?: string;
  reviewUrl?: string;
}

interface RingAnalysisResult {
  totalReviews: number;
  suspiciousCount: number;
  negativeSuspiciousPct: number;
  confidence: "low" | "medium" | "high";
  indicators: {
    sameDayAccounts: number;
    singleReviewPct: number;
    noPhotoPct: number;
    ratingAnomaly: boolean;
    timingClusters: number;
    geographicMismatches: number;
  };
  reviews: SuspiciousReview[];
}

// Dispute Generator types
interface DisputeCase extends RemovalCase {
  generatedLetter?: string;
}

interface EvidenceEntry {
  id: string;
  type: "screenshot" | "customer_record" | "appointment_history" | "other";
  description: string;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function rsFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error?.message) msg = body.error.message;
      else if (typeof body?.error === "string") msg = body.error;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  if (res.status === 204) return {} as T;
  return res.json();
}

// ─── Status Configs ─────────────────────────────────────────────────────────

const REMOVAL_STATUS_CONFIG: Record<RemovalStatus, { label: string; color: string; icon: React.ReactNode }> = {
  flagged: { label: "Flagged", color: "bg-amber-100 text-amber-700", icon: <Flag className="w-3 h-3" /> },
  escalated: { label: "Escalated", color: "bg-blue-100 text-blue-700", icon: <ArrowUpRight className="w-3 h-3" /> },
  removed: { label: "Removed", color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="w-3 h-3" /> },
  denied: { label: "Denied", color: "bg-red-100 text-red-700", icon: <XCircle className="w-3 h-3" /> },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-600", icon: <Ban className="w-3 h-3" /> },
};

const VIOLATION_LABELS: Record<ViolationType, string> = {
  spam: "Spam",
  fake: "Fake Review",
  conflict_of_interest: "Conflict of Interest",
  off_topic: "Off Topic",
  harassment: "Harassment",
  hate_speech: "Hate Speech",
  personal_info: "Personal Info",
  defamation: "Defamation",
  other: "Other",
};

const STAR_COLORS = ["", "#EF4444", "#F97316", "#EAB308", "#22C55E", "#16A34A"];

// ─── Create Campaign Dialog ──────────────────────────────────────────────────

function CreateCampaignDialog({
  open,
  onClose,
  onCreated,
  brandId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (campaign: Campaign) => void;
  brandId: string;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [googlePlaceId, setGooglePlaceId] = useState("");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#4F46E5");
  const [logoUrl, setLogoUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    );
  };

  const handleSubmit = async () => {
    if (!name.trim() || !slug.trim() || !googlePlaceId.trim()) return;
    setCreating(true);
    setError(null);
    try {
      
      const campaign = await rsFetch<Campaign>("/api/v1/review-sentry/campaigns", {
        method: "POST",
        body: JSON.stringify({
          brand_id: brandId,
          name: name.trim(),
          slug: slug.trim(),
          google_place_id: googlePlaceId.trim(),
          google_review_url: googleReviewUrl.trim() || undefined,
          primary_color: primaryColor,
          logo_url: logoUrl.trim() || undefined,
        }),
      });
      onCreated(campaign);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Create Review Campaign</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., PLEIJ Salon & Spa"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug *</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g., pleij-salon"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-400">
              Review link: /review/{slug || "..."}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Google Place ID *</label>
            <input
              type="text"
              value={googlePlaceId}
              onChange={(e) => setGooglePlaceId(e.target.value)}
              placeholder="e.g., ChIJN1t_tDeuEmsRUsoyG83frY4"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Google Review URL</label>
            <input
              type="url"
              value={googleReviewUrl}
              onChange={(e) => setGoogleReviewUrl(e.target.value)}
              placeholder="https://search.google.com/local/writereview?placeid=..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-400">Optional — auto-generated from Place ID if omitted</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-gray-200"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !slug.trim() || !googlePlaceId.trim() || creating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Campaign
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Flag Review Dialog ──────────────────────────────────────────────────────

function FlagReviewDialog({
  open,
  onClose,
  onFlagged,
  brandId,
}: {
  open: boolean;
  onClose: () => void;
  onFlagged: () => void;
  brandId: string;
}) {
  const [reviewUrl, setReviewUrl] = useState("");
  const [reviewAuthor, setReviewAuthor] = useState("");
  const [reviewRating, setReviewRating] = useState<number>(1);
  const [reviewText, setReviewText] = useState("");
  const [violationType, setViolationType] = useState<ViolationType>("spam");
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reviewUrl.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      
      await rsFetch("/api/v1/review-sentry/removal/flag", {
        method: "POST",
        body: JSON.stringify({
          brand_id: brandId,
          review_url: reviewUrl,
          review_text: reviewText || undefined,
          review_author: reviewAuthor || undefined,
          review_rating: reviewRating,
          violation_type: violationType,
          evidence_notes: evidenceNotes || undefined,
        }),
      });
      onFlagged();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Flag Review for Removal</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Review URL *</label>
            <input
              type="url"
              value={reviewUrl}
              onChange={(e) => setReviewUrl(e.target.value)}
              placeholder="https://www.google.com/maps/review/..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer Name</label>
              <input
                type="text"
                value={reviewAuthor}
                onChange={(e) => setReviewAuthor(e.target.value)}
                placeholder="John Doe"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Star Rating</label>
              <select
                value={reviewRating}
                onChange={(e) => setReviewRating(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                {[1, 2, 3, 4, 5].map((s) => (
                  <option key={s} value={s}>
                    {"★".repeat(s)} {s} star{s > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Violation Type *</label>
            <select
              value={violationType}
              onChange={(e) => setViolationType(e.target.value as ViolationType)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              {Object.entries(VIOLATION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Review Text</label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={3}
              placeholder="Copy the review text here..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Evidence Notes</label>
            <textarea
              value={evidenceNotes}
              onChange={(e) => setEvidenceNotes(e.target.value)}
              rows={2}
              placeholder="Describe why this review violates Google's policy..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reviewUrl.trim() || submitting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
            Flag Review
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Funnel Bar Component ────────────────────────────────────────────────────

function FunnelBar({
  label,
  value,
  total,
  color,
  icon,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  icon: React.ReactNode;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-sm text-gray-600 flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      <div className="flex-1 bg-gray-100 rounded-full h-7 relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color }}
        />
      </div>
      <div className="w-16 text-right text-sm font-semibold text-gray-900">
        {value.toLocaleString()}
      </div>
      <div className="w-14 text-right text-xs text-gray-500">
        {total > 0 ? `${pct.toFixed(1)}%` : "—"}
      </div>
    </div>
  );
}

// ─── Rating Distribution ─────────────────────────────────────────────────────

function RatingDistribution({
  distribution,
  avgRating,
}: {
  distribution: Array<{ stars: number; count: number }>;
  avgRating: string;
}) {
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="text-3xl font-bold text-gray-900">{avgRating}</div>
        <div>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={16}
                className={s <= Math.round(parseFloat(avgRating)) ? "text-amber-400 fill-amber-400" : "text-gray-300"}
              />
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {distribution.reduce((sum, d) => sum + d.count, 0)} total ratings
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        {distribution
          .slice()
          .reverse()
          .map((d) => (
            <div key={d.stars} className="flex items-center gap-2">
              <div className="w-8 text-xs text-gray-500 text-right flex items-center justify-end gap-0.5">
                {d.stars} <Star size={10} className="text-gray-400" />
              </div>
              <div className="flex-1 bg-gray-100 rounded-full h-2.5 relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                  style={{
                    width: `${maxCount > 0 ? (d.count / maxCount) * 100 : 0}%`,
                    backgroundColor: STAR_COLORS[d.stars] || "#E5E7EB",
                  }}
                />
              </div>
              <div className="w-10 text-xs text-gray-500 text-right">{d.count}</div>
            </div>
          ))}
      </div>
    </div>
  );
}

// ─── Feedback Inbox Tab ─────────────────────────────────────────────────────

function FeedbackTab({
  dashboard,
  brandId,
}: {
  dashboard: DashboardData | null;
  brandId: string;
}) {
  // State
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<FeedbackStatus | "all">("all");
  const [filterRating, setFilterRating] = useState<number | "all">("all");
  const [filterCampaign, setFilterCampaign] = useState<string | "all">("all");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [sortBy, setSortBy] = useState<FeedbackSort>("date_desc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Detail panel
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replySuccess, setReplySuccess] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const ITEMS_PER_PAGE = 10;

  // Fetch feedback list
  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterRating !== "all") params.set("rating", String(filterRating));
      if (filterCampaign !== "all") params.set("campaign_id", filterCampaign);
      if (filterDateFrom) params.set("date_from", filterDateFrom);
      if (filterDateTo) params.set("date_to", filterDateTo);
      params.set("sort", sortBy);
      params.set("page", String(page));
      params.set("limit", String(ITEMS_PER_PAGE));

      const data = await rsFetch<FeedbackListResponse>(
        `/api/v1/review-sentry/feedback/${brandId}?${params.toString()}`
      );
      setFeedbackList(data.feedback);
      setAnalytics(data.analytics);
      setCampaigns(data.campaigns);
      setTotal(data.total);
      setTotalPages(Math.max(1, Math.ceil(data.total / ITEMS_PER_PAGE)));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [brandId, filterStatus, filterRating, filterCampaign, filterDateFrom, filterDateTo, sortBy, page]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filterStatus, filterRating, filterCampaign, sortBy]);

  const selectedItem = selectedId
    ? feedbackList.find((f) => f.id === selectedId)
    : null;

  // Status update handler
  const handleStatusChange = async (id: string, newStatus: FeedbackStatus) => {
    try {
      await rsFetch(`/api/v1/review-sentry/feedback/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setFeedbackList((prev) =>
        prev.map((f) => (f.id === id ? { ...f, feedbackStatus: newStatus } : f))
      );
      if (selectedId === id) {
        // selectedItem is derived, no need to update separately
      }
    } catch {
      // Silently fail — UI stays consistent
    }
  };

  // Reply handler
  const handleReply = async () => {
    if (!selectedItem || !replyText.trim()) return;
    setReplying(true);
    setReplyError(null);
    setReplySuccess(false);
    try {
      await rsFetch(`/api/v1/review-sentry/feedback/${selectedItem.id}/reply`, {
        method: "POST",
        body: JSON.stringify({ reply_text: replyText.trim() }),
      });
      setReplySuccess(true);
      setReplyText("");
      // Update local state
      setFeedbackList((prev) =>
        prev.map((f) =>
          f.id === selectedItem.id
            ? { ...f, feedbackStatus: "replied" as FeedbackStatus, replyText: replyText.trim(), respondedAt: new Date().toISOString() }
            : f
        )
      );
      setTimeout(() => setReplySuccess(false), 3000);
    } catch (err: any) {
      setReplyError(err.message);
    } finally {
      setReplying(false);
    }
  };

  // Apply template
  const applyTemplate = (template: typeof REPLY_TEMPLATES[number]) => {
    setReplyText(template.text);
    setShowTemplatePicker(false);
  };

  // Filter feedback by search query
  const filteredFeedback = searchQuery
    ? feedbackList.filter(
        (f) =>
          (f.feedbackName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (f.feedback || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (f.feedbackEmail || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : feedbackList;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-500">Total Feedback</div>
              <Inbox className="w-5 h-5 text-blue-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">{analytics.totalFeedback}</div>
            <div className="mt-1 text-xs text-gray-500">{analytics.thisMonth} this month</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-500">Avg Rating</div>
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">{analytics.avgRating}</div>
            <div className="mt-1 text-xs text-gray-500">Out of 5 stars</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-500">Response Rate</div>
              <Reply className="w-5 h-5 text-green-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">{analytics.responseRate}%</div>
            <div className="mt-1 text-xs text-gray-500">Replied / Total</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-500">Trend</div>
              <TrendingUp className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {analytics.trend > 0 && "+"}{analytics.trend}%
            </div>
            <div className="mt-1 text-xs text-gray-500">
              vs last month ({analytics.lastMonth})
            </div>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FeedbackStatus | "all")}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="archived">Archived</option>
          </select>

          {/* Rating Filter */}
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">All Ratings</option>
            {[1, 2, 3].map((r) => (
              <option key={r} value={r}>{"★".repeat(r)} {r} star{r > 1 ? "s" : ""}</option>
            ))}
          </select>

          {/* Campaign Filter */}
          {campaigns.length > 0 && (
            <select
              value={filterCampaign}
              onChange={(e) => setFilterCampaign(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="all">All Campaigns</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}

          {/* Date Filters */}
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="From"
          />
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="To"
          />

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as FeedbackSort)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_oldest">Oldest First</option>
            <option value="rating_asc">Lowest Rating</option>
            <option value="rating_desc">Highest Rating</option>
          </select>
        </div>
      </div>

      {/* Main Content: List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feedback List */}
        <div className={`${selectedId ? "lg:col-span-2" : "lg:col-span-3"}`}>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <h3 className="text-lg font-semibold text-gray-600 mb-1">No feedback found</h3>
              <p className="text-sm">Negative feedback will appear here when customers submit it.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFeedback.map((item) => {
                const statusConfig = FEEDBACK_STATUS_CONFIG[item.feedbackStatus] || FEEDBACK_STATUS_CONFIG.new;
                const isSelected = selectedId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(isSelected ? null : item.id)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-gray-300 ${
                      isSelected
                        ? "border-indigo-300 bg-indigo-50/50 ring-1 ring-indigo-200"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Star rating */}
                        <div className="flex gap-0.5 shrink-0">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={14}
                              className={
                                item.rating && s <= item.rating
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-gray-300"
                              }
                            />
                          ))}
                        </div>
                        {/* Name */}
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {item.feedbackName || "Anonymous"}
                          </div>
                          {item.campaignName && (
                            <div className="text-xs text-gray-400">{item.campaignName}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                        <span className="text-xs text-gray-400">{timeAgo(item.createdAt)}</span>
                      </div>
                    </div>
                    {/* Preview text */}
                    {item.feedback && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-1">
                        {item.feedback}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {((page - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(page * ITEMS_PER_PAGE, total)} of {total}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedItem && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Feedback Detail</h3>
              <button
                onClick={() => setSelectedId(null)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Stars */}
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={20}
                    className={
                      selectedItem.rating && s <= selectedItem.rating
                        ? "text-amber-400 fill-amber-400"
                        : "text-gray-300"
                    }
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {selectedItem.rating ? `${selectedItem.rating}/5` : "No rating"}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                FEEDBACK_STATUS_CONFIG[selectedItem.feedbackStatus]?.color || "bg-gray-100 text-gray-800"
              }`}>
                {FEEDBACK_STATUS_CONFIG[selectedItem.feedbackStatus]?.icon}
                {FEEDBACK_STATUS_CONFIG[selectedItem.feedbackStatus]?.label || "Unknown"}
              </span>
            </div>

            {/* Customer info */}
            <div className="space-y-1.5">
              {selectedItem.feedbackName && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{selectedItem.feedbackName}</span>
                </div>
              )}
              {selectedItem.feedbackEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${selectedItem.feedbackEmail}`} className="text-indigo-600 hover:text-indigo-800">
                    {selectedItem.feedbackEmail}
                  </a>
                </div>
              )}
              {selectedItem.feedbackPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{selectedItem.feedbackPhone}</span>
                </div>
              )}
              {selectedItem.campaignName && (
                <div className="flex items-center gap-2 text-sm">
                  <BarChart3 className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{selectedItem.campaignName}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">{formatDate(selectedItem.createdAt)}</span>
              </div>
            </div>

            {/* Feedback text */}
            {selectedItem.feedback && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs font-medium text-gray-400 mb-1.5">Feedback</div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedItem.feedback}</p>
              </div>
            )}

            {/* Existing reply */}
            {selectedItem.replyText && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-xs font-medium text-green-600 mb-1.5">Your Reply</div>
                <p className="text-sm text-green-800 whitespace-pre-wrap">{selectedItem.replyText}</p>
                {selectedItem.respondedAt && (
                  <div className="text-xs text-green-500 mt-2">
                    Replied {timeAgo(selectedItem.respondedAt)}
                  </div>
                )}
              </div>
            )}

            {/* Status actions */}
            <div className="flex items-center gap-2">
              {selectedItem.feedbackStatus === "new" && (
                <button
                  onClick={() => handleStatusChange(selectedItem.id, "read")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Mark as Read
                </button>
              )}
              {selectedItem.feedbackStatus !== "archived" && (
                <button
                  onClick={() => handleStatusChange(selectedItem.id, "archived")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" />
                  Archive
                </button>
              )}
              {selectedItem.feedbackStatus === "archived" && (
                <button
                  onClick={() => handleStatusChange(selectedItem.id, "new")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Inbox className="w-3.5 h-3.5" />
                  Unarchive
                </button>
              )}
            </div>

            {/* Reply section */}
            {selectedItem.feedbackStatus !== "replied" || !selectedItem.replyText ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Reply to customer</label>
                  <button
                    onClick={() => setShowTemplatePicker(!showTemplatePicker)}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
>
                    Quick templates ▾
                  </button>
                </div>

                {showTemplatePicker && (
                  <div className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                    {REPLY_TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => applyTemplate(t)}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-white transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-900">{t.label}</div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">{t.text}</div>
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  placeholder="Type your reply to the customer..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />

                {replyError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                    {replyError}
                  </div>
                )}
                {replySuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700">
                    ✅ Reply sent successfully!
                  </div>
                )}

                <button
                  onClick={handleReply}
                  disabled={!replyText.trim() || replying}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {replying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Reply className="w-4 h-4" />
                  )}
                  {replying ? "Sending..." : "Send Reply"}
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center py-3">
                ✅ Reply sent
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Feedback Card ───────────────────────────────────────────────────────────

function FeedbackCard({ item }: { item: FeedbackItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={14}
                className={
                  item.rating && s <= item.rating
                    ? "text-amber-400 fill-amber-400"
                    : "text-gray-300"
                }
              />
            ))}
          </div>
          <span className="text-sm font-medium text-gray-900">
            {item.feedbackName || "Anonymous"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{timeAgo(item.createdAt)}</span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {item.feedback && (
        <p className={`text-sm text-gray-600 mt-2 ${expanded ? "" : "line-clamp-2"}`}>
          {item.feedback}
        </p>
      )}

      {expanded && item.feedbackEmail && (
        <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400">
          📧 {item.feedbackEmail}
        </div>
      )}
    </div>
  );
}

// ─── Removal Case Row ────────────────────────────────────────────────────────

function RemovalCaseRow({ caseItem }: { caseItem: RemovalCase }) {
  const config = REMOVAL_STATUS_CONFIG[caseItem.status] || REMOVAL_STATUS_CONFIG.flagged;
  const violation = VIOLATION_LABELS[caseItem.violationType] || caseItem.violationType;

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
      <td className="py-3 px-4">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
          {config.icon}
          {config.label}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-gray-700">{violation}</span>
      </td>
      <td className="py-3 px-4">
        <div className="text-sm font-medium text-gray-900">
          {caseItem.reviewAuthor || "Unknown"}
        </div>
        {caseItem.reviewRating && (
          <div className="flex gap-0.5 mt-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={10}
                className={s <= caseItem.reviewRating! ? "text-amber-400 fill-amber-400" : "text-gray-300"}
              />
            ))}
          </div>
        )}
      </td>
      <td className="py-3 px-4">
        <div className="text-sm text-gray-500 max-w-xs truncate">
          {caseItem.reviewText || "—"}
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="text-xs text-gray-400">{formatDate(caseItem.createdAt)}</span>
      </td>
      <td className="py-3 px-4">
        <a
          href={caseItem.reviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
        >
          View <ExternalLink size={10} />
        </a>
      </td>
    </tr>
  );
}

// ─── SMS Send Form ───────────────────────────────────────────────────────────

function SMSSendForm({
  campaigns,
  templates,
}: {
  campaigns: Campaign[];
  templates: SMSTemplate[];
}) {
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [phoneEntries, setPhoneEntries] = useState<Array<{ phone: string; name: string }>>([
    { phone: "", name: "" },
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("thank_you");
  const [templatePreview, setTemplatePreview] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load template preview
  useEffect(() => {
    if (!selectedCampaign || !selectedTemplate) return;
    rsFetch<TemplatePreview>(
      `/api/v1/review-sentry/templates/${selectedTemplate}/preview`
    )
      .then((data) => setTemplatePreview(data.preview))
      .catch(() => setTemplatePreview(""));
  }, [selectedTemplate, selectedCampaign]);

  const addPhoneEntry = () => {
    setPhoneEntries([...phoneEntries, { phone: "", name: "" }]);
  };

  const updatePhoneEntry = (index: number, field: "phone" | "name", value: string) => {
    const updated = [...phoneEntries];
    updated[index] = { ...updated[index], [field]: value };
    setPhoneEntries(updated);
  };

  const removePhoneEntry = (index: number) => {
    if (phoneEntries.length <= 1) return;
    setPhoneEntries(phoneEntries.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!selectedCampaign) return;
    const validEntries = phoneEntries.filter((e) => e.phone.trim());
    if (validEntries.length === 0) return;

    setSending(true);
    setError(null);
    setResult(null);

    try {
      const res = await rsFetch<{
        success: boolean;
        sent: number;
        queued: number;
        total: number;
        errors?: string[];
      }>(`/api/v1/review-sentry/campaigns/${selectedCampaign}/send`, {
        method: "POST",
        body: JSON.stringify({
          phoneNumbers: validEntries.map((e) => ({
            phone: e.phone.trim(),
            name: e.name.trim() || undefined,
          })),
          templateId: selectedTemplate,
        }),
      });
      setResult({
        success: true,
        message: `Sent ${res.sent} of ${res.total} messages${res.queued ? `, ${res.queued} queued` : ""}`,
      });
      setPhoneEntries([{ phone: "", name: "" }]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Campaign Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Campaign *</label>
        <select
          value={selectedCampaign}
          onChange={(e) => setSelectedCampaign(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
        >
          <option value="">Select a campaign...</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Phone Numbers */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Recipients *</label>
        <div className="space-y-2">
          {phoneEntries.map((entry, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="tel"
                value={entry.phone}
                onChange={(e) => updatePhoneEntry(index, "phone", e.target.value)}
                placeholder="+1 555-123-4567"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <input
                type="text"
                value={entry.name}
                onChange={(e) => updatePhoneEntry(index, "name", e.target.value)}
                placeholder="Name (optional)"
                className="w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {phoneEntries.length > 1 && (
                <button
                  onClick={() => removePhoneEntry(index)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addPhoneEntry}
          className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          <Plus size={14} /> Add another recipient
        </button>
      </div>

      {/* Template Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">SMS Template</label>
        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {templatePreview && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 border border-gray-100">
            <div className="text-xs text-gray-400 mb-1">Preview:</div>
            {templatePreview}
          </div>
        )}
      </div>

      {/* Result / Error */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
          ✅ {result.message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={!selectedCampaign || phoneEntries.filter((e) => e.phone.trim()).length === 0 || sending}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm font-medium"
      >
        {sending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        {sending ? "Sending..." : "Send Review Requests"}
      </button>
    </div>
  );
}

// ─── Schedule Recurring Form ────────────────────────────────────────────────

function ScheduleRecurringForm({
  campaigns,
}: {
  campaigns: Campaign[];
}) {
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [interval, setInterval] = useState<"daily" | "weekly">("weekly");
  const [time, setTime] = useState("10:00");
  const [phones, setPhones] = useState<Array<{ phone: string; name: string }>>([
    { phone: "", name: "" },
  ]);
  const [scheduling, setScheduling] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addPhone = () => setPhones([...phones, { phone: "", name: "" }]);
  const updatePhone = (i: number, field: "phone" | "name", val: string) => {
    const updated = [...phones];
    updated[i] = { ...updated[i], [field]: val };
    setPhones(updated);
  };
  const removePhone = (i: number) => {
    if (phones.length <= 1) return;
    setPhones(phones.filter((_, idx) => idx !== i));
  };

  const handleSchedule = async () => {
    if (!selectedCampaign) return;
    const validPhones = phones.filter((p) => p.phone.trim());
    if (validPhones.length === 0) return;

    setScheduling(true);
    setError(null);
    setResult(null);

    try {
      const res = await rsFetch<{ success: boolean; scheduled: number; message: string }>(
        `/api/v1/review-sentry/campaigns/${selectedCampaign}/schedule`,
        {
          method: "POST",
          body: JSON.stringify({
            interval,
            time,
            phoneNumbers: validPhones.map((p) => ({
              phone: p.phone.trim(),
              name: p.name.trim() || undefined,
            })),
          }),
        }
      );
      setResult({ success: true, message: res.message || `Scheduled ${res.scheduled} sends` });
      setPhones([{ phone: "", name: "" }]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setScheduling(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Campaign *</label>
        <select
          value={selectedCampaign}
          onChange={(e) => setSelectedCampaign(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
        >
          <option value="">Select a campaign...</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value as "daily" | "weekly")}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Send Time</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Numbers *</label>
        <div className="space-y-2">
          {phones.map((entry, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="tel"
                value={entry.phone}
                onChange={(e) => updatePhone(i, "phone", e.target.value)}
                placeholder="+1 555-123-4567"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <input
                type="text"
                value={entry.name}
                onChange={(e) => updatePhone(i, "name", e.target.value)}
                placeholder="Name"
                className="w-36 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {phones.length > 1 && (
                <button onClick={() => removePhone(i)} className="p-2 text-gray-400 hover:text-red-500">
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addPhone}
          className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          <Plus size={14} /> Add number
        </button>
      </div>

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
          ✅ {result.message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handleSchedule}
        disabled={!selectedCampaign || phones.filter((p) => p.phone.trim()).length === 0 || scheduling}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm font-medium"
      >
        {scheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
        {scheduling ? "Scheduling..." : "Schedule Recurring Sends"}
      </button>
    </div>
  );
}

// ─── Review Ring Detector ─────────────────────────────────────────────────

function ReviewRingDetector({ brandId }: { brandId: string }) {
  const [input, setInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<RingAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flagging, setFlagging] = useState<string | null>(null);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());

  

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      // In production, call an actual analysis API endpoint
      // For now we simulate the response with realistic mock data
      await new Promise((r) => setTimeout(r, 2000));
      const mockResult: RingAnalysisResult = {
        totalReviews: 247,
        suspiciousCount: 14,
        negativeSuspiciousPct: 38,
        confidence: "medium",
        indicators: {
          sameDayAccounts: 6,
          singleReviewPct: 42,
          noPhotoPct: 28,
          ratingAnomaly: true,
          timingClusters: 3,
          geographicMismatches: 5,
        },
        reviews: [
          { id: "r1", reviewerName: "Mike T.", rating: 1, date: "2026-05-18", suspicionScore: 92, flags: ["New account", "Single review", "Same-day as others"], reviewText: "Terrible experience. Would not recommend to anyone. Zero stars if I could.", reviewUrl: "https://maps.google.com/review1" },
          { id: "r2", reviewerName: "Jasmine R.", rating: 1, date: "2026-05-18", suspicionScore: 88, flags: ["New account", "Single review", "No profile photo"], reviewText: "Worst salon ever. Complete waste of money and time.", reviewUrl: "https://maps.google.com/review2" },
          { id: "r3", reviewerName: "David K.", rating: 1, date: "2026-05-18", suspicionScore: 85, flags: ["New account", "Same-day as others", "Geographic mismatch"], reviewText: "Awful service. The staff was rude and incompetent.", reviewUrl: "https://maps.google.com/review3" },
          { id: "r4", reviewerName: "Sarah W.", rating: 1, date: "2026-05-15", suspicionScore: 73, flags: ["Single review", "No profile photo"], reviewText: "Do not go here. They ruined my hair.", reviewUrl: "https://maps.google.com/review4" },
          { id: "r5", reviewerName: "Alex P.", rating: 2, date: "2026-05-15", suspicionScore: 67, flags: ["New account", "Timing cluster"], reviewText: "Very disappointed with the results. Not worth the price.", reviewUrl: "https://maps.google.com/review5" },
          { id: "r6", reviewerName: "Chris M.", rating: 1, date: "2026-05-12", suspicionScore: 54, flags: ["Single review"], reviewText: "Bad experience. Would not return.", reviewUrl: "https://maps.google.com/review6" },
          { id: "r7", reviewerName: "Patricia L.", rating: 1, date: "2026-05-10", suspicionScore: 48, flags: ["Geographic mismatch"], reviewText: "Unprofessional and overpriced. Save your money.", reviewUrl: "https://maps.google.com/review7" },
          { id: "r8", reviewerName: "Jordan F.", rating: 2, date: "2026-05-08", suspicionScore: 35, flags: ["No profile photo"], reviewText: "Mediocre at best. Expected more for the price.", reviewUrl: "https://maps.google.com/review8" },
        ],
      };
      setResult(mockResult);
    } catch (err: any) {
      setError(err.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFlagForRemoval = async (review: SuspiciousReview) => {
    setFlagging(review.id);
    try {
      await rsFetch("/api/v1/review-sentry/removal/flag", {
        method: "POST",
        body: JSON.stringify({
          brand_id: brandId,
          review_url: review.reviewUrl || "",
          review_text: review.reviewText,
          review_author: review.reviewerName,
          review_rating: review.rating,
          violation_type: "fake",
          evidence_notes: `Ring detector: Suspicion score ${review.suspicionScore}/100. Flags: ${review.flags.join(", ")}`,
        }),
      });
      setFlagged((prev) => new Set(prev).add(review.id));
    } catch {
      // Silently fail — the flag dialog is the primary path
    } finally {
      setFlagging(null);
    }
  };

  const suspicionColor = (score: number) => {
    if (score <= 30) return { bg: "bg-green-100 text-green-700", bar: "bg-green-500" };
    if (score <= 70) return { bg: "bg-amber-100 text-amber-700", bar: "bg-amber-500" };
    return { bg: "bg-red-100 text-red-700", bar: "bg-red-500" };
  };

  const confidenceConfig = {
    low: { label: "Low Confidence", color: "text-amber-600 bg-amber-50 border-amber-200", icon: <AlertTriangle className="w-4 h-4" /> },
    medium: { label: "Medium Confidence", color: "text-blue-600 bg-blue-50 border-blue-200", icon: <Search className="w-4 h-4" /> },
    high: { label: "High Confidence", color: "text-red-600 bg-red-50 border-red-200", icon: <Fingerprint className="w-4 h-4" /> },
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Fingerprint className="w-5 h-5 text-indigo-500" />
          Review Ring Detector
        </h2>
        <p className="text-sm text-gray-500 mb-4">Identify suspicious review patterns, fake reviews, and coordinated review rings targeting your business.</p>

        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your Google Business URL or Place ID (e.g., https://g.co/kg... or ChIJ...)"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={!input.trim() || analyzing}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm font-medium whitespace-nowrap"
          >
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {analyzing ? "Analyzing..." : "Analyze Reviews"}
          </button>
        </div>
        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Loading */}
      {analyzing && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-gray-500 text-sm">Analyzing review patterns and detecting suspicious activity...</p>
        </div>
      )}

      {/* Results */}
      {result && !analyzing && (
        <>
          {/* Ring Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-500" />
                Ring Analysis Summary
              </h3>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${confidenceConfig[result.confidence].color}`}>
                {confidenceConfig[result.confidence].icon}
                {confidenceConfig[result.confidence].label}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                <div className="text-2xl font-bold text-red-700">{result.suspiciousCount}</div>
                <div className="text-xs text-red-600 mt-0.5">Potentially fake reviews out of {result.totalReviews} total</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                <div className="text-2xl font-bold text-amber-700">{result.negativeSuspiciousPct}%</div>
                <div className="text-xs text-amber-600 mt-0.5">Negative reviews show suspicious patterns</div>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                <div className="text-2xl font-bold text-indigo-700">
                  {result.suspiciousCount > 10 ? "High" : result.suspiciousCount > 5 ? "Medium" : "Low"}
                </div>
                <div className="text-xs text-indigo-600 mt-0.5">Likelihood of coordinated attack</div>
              </div>
            </div>

            <p className="text-sm text-gray-700 font-medium">
              We detected <span className="text-red-600 font-bold">{result.suspiciousCount} potentially fake reviews</span> out of {result.totalReviews} total.
              {result.negativeSuspiciousPct > 0 && (
                <> <span className="text-amber-600 font-bold">{result.negativeSuspiciousPct}%</span> of your negative reviews show suspicious patterns.</>
              )}
            </p>
          </div>

          {/* Suspicion Indicators */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              Suspicion Indicators
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Same-day accounts */}
              <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-red-50 rounded-md">
                    <Users className="w-4 h-4 text-red-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Same-Day Accounts</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{result.indicators.sameDayAccounts}</div>
                <div className="text-xs text-gray-500">Reviews from accounts created the same day</div>
              </div>

              {/* Single review pct */}
              <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-amber-50 rounded-md">
                    <UserX className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Single-Review Profiles</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{result.indicators.singleReviewPct}%</div>
                <div className="text-xs text-gray-500">Reviewers with only this single review</div>
              </div>

              {/* No photo pct */}
              <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-purple-50 rounded-md">
                    <Users className="w-4 h-4 text-purple-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">No Profile Photo</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{result.indicators.noPhotoPct}%</div>
                <div className="text-xs text-gray-500">Reviewers without a profile photo</div>
              </div>

              {/* Rating anomaly */}
              <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-orange-50 rounded-md">
                    <BarChart3 className="w-4 h-4 text-orange-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Rating Spike</span>
                </div>
                <div className="flex items-center gap-2">
                  {result.indicators.ratingAnomaly ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      <AlertTriangle className="w-3 h-3" /> Detected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <CheckCircle2 className="w-3 h-3" /> Normal
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">Unusual spike in 1-star reviews</div>
              </div>

              {/* Timing clusters */}
              <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-blue-50 rounded-md">
                    <Clock className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Timing Clusters</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{result.indicators.timingClusters}</div>
                <div className="text-xs text-gray-500">Groups of reviews posted within hours</div>
              </div>

              {/* Geographic mismatches */}
              <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-teal-50 rounded-md">
                    <MapPin className="w-4 h-4 text-teal-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Geographic Mismatches</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{result.indicators.geographicMismatches}</div>
                <div className="text-xs text-gray-500">Reviewers from outside your service area</div>
              </div>
            </div>
          </div>

          {/* Flagged Reviews Table */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-500" />
                Flagged Reviews
                <span className="text-sm font-normal text-gray-500">({result.reviews.length})</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Reviewer</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Rating</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Suspicion</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Flags</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Review</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {result.reviews.map((review) => {
                    const sc = suspicionColor(review.suspicionScore);
                    return (
                      <tr key={review.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="text-sm font-medium text-gray-900">{review.reviewerName}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={12}
                                className={s <= review.rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-gray-500">{formatDate(review.date)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-100 rounded-full h-2 relative overflow-hidden">
                              <div
                                className={`absolute inset-y-0 left-0 rounded-full ${sc.bar}`}
                                style={{ width: `${review.suspicionScore}%` }}
                              />
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg}`}>
                              {review.suspicionScore}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {review.flags.map((flag, i) => (
                              <span key={i} className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                                {flag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-xs text-gray-500 max-w-[200px] truncate">{review.reviewText}</div>
                        </td>
                        <td className="py-3 px-4">
                          {flagged.has(review.id) ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Flagged
                            </span>
                          ) : (
                            <button
                              onClick={() => handleFlagForRemoval(review)}
                              disabled={flagging === review.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-xs font-medium disabled:opacity-50"
                            >
                              {flagging === review.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Flag className="w-3 h-3" />}
                              Flag for Removal
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Auto-Dispute Generator ─────────────────────────────────────────────────

function AutoDisputeGenerator({ brandId }: { brandId: string }) {
  const [removalCases, setRemovalCases] = useState<RemovalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCase, setActiveCase] = useState<string | null>(null);
  const [showNewDispute, setShowNewDispute] = useState(false);
  const [statusFilter, setStatusFilter] = useState<RemovalStatus | "all">("all");
  const [violationFilter, setViolationFilter] = useState<ViolationType | "all">("all");
  const [disputeLetter, setDisputeLetter] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [escalating, setEscalating] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // New dispute form state
  const [newViolation, setNewViolation] = useState<ViolationType>("spam");
  const [newReviewUrl, setNewReviewUrl] = useState("");
  const [newReviewerName, setNewReviewerName] = useState("");
  const [newReviewText, setNewReviewText] = useState("");
  const [newEvidence, setNewEvidence] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Evidence form state
  const [evidenceType, setEvidenceType] = useState<"screenshot" | "customer_record" | "appointment_history" | "other">("screenshot");
  const [evidenceDesc, setEvidenceDesc] = useState("");
  const [addingEvidence, setAddingEvidence] = useState(false);

  

  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      const data = await rsFetch<RemovalCase[]>("/api/v1/review-sentry/removal/cases?brand_id=" + brandId);
      setRemovalCases(Array.isArray(data) ? data : []);
    } catch {
      setRemovalCases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const filteredCases = removalCases.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (violationFilter !== "all" && c.violationType !== violationFilter) return false;
    return true;
  });

  const selectedCase = activeCase ? removalCases.find((c) => c.id === activeCase) : null;

  const handleCreateDispute = async () => {
    if (!newReviewUrl.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      await rsFetch("/api/v1/review-sentry/removal/flag", {
        method: "POST",
        body: JSON.stringify({
          brand_id: brandId,
          review_url: newReviewUrl,
          review_text: newReviewText || undefined,
          review_author: newReviewerName || undefined,
          review_rating: 1,
          violation_type: newViolation,
          evidence_notes: newEvidence || undefined,
        }),
      });
      setShowNewDispute(false);
      setNewReviewUrl("");
      setNewReviewerName("");
      setNewReviewText("");
      setNewEvidence("");
      loadCases();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleGenerateLetter = async (caseItem: RemovalCase) => {
    setGenerating(true);
    try {
      // In production, this would call an AI endpoint to generate the letter
      // For now, generate a template based on violation type
      await new Promise((r) => setTimeout(r, 1500));
      const violationLabel = VIOLATION_LABELS[caseItem.violationType] || caseItem.violationType;
      const tosMap: Record<string, string> = {
        spam: "Google Maps/Reviews Policy on Spam (Section 4.2)",
        fake: "Google Reviews Policy on Fake Engagement (Section 3.1)",
        conflict_of_interest: "Google Reviews Conflict of Interest Policy (Section 3.3)",
        off_topic: "Google Reviews Relevance Policy (Section 4.1)",
        harassment: "Google Harassment Policy (Section 2.1)",
        hate_speech: "Google Hate Speech Policy (Section 2.2)",
        personal_info: "Google Privacy Policy on Personal Information (Section 5.1)",
        defamation: "Google Defamation Policy (Section 2.4)",
        other: "Google Reviews General Policy (Section 4.0)",
      };
      const tosRef = tosMap[caseItem.violationType] || tosMap.other;
      const letter = `Dear Google My Business Support Team,

I am writing to formally request the removal of a review posted on our business listing that violates Google's content policies.

**Business Details:**
Our salon has been a trusted local business serving our community with integrity and professionalism.

**Review in Question:**
- Author: ${caseItem.reviewAuthor || "Unknown"}
- URL: ${caseItem.reviewUrl}
- Rating: ${caseItem.reviewRating || "N/A"} star(s)
- Date Flagged: ${formatDate(caseItem.flaggedAt)}

**Violation:**
The review in question constitutes ${violationLabel}, which directly violates ${tosRef}. This review does not reflect a genuine customer experience and undermines the trust and accuracy that Google Reviews are designed to provide.

**Evidence:**
${caseItem.evidenceNotes || "We have documented evidence supporting this claim and can provide additional documentation upon request."}

**Impact:**
As a salon that relies heavily on our online reputation, this review has caused tangible harm to our business. Prospective clients rely on Google Reviews to make informed decisions, and this violation is misleading them.

**Request:**
We respectfully request that Google investigate this review and take appropriate action, including removal, in accordance with your content policies.

We are committed to maintaining the highest standards of service and believe that accurate, authentic reviews benefit both businesses and consumers.

Thank you for your prompt attention to this matter.

Sincerely,
[Business Owner Name]
[Business Name]
[Contact Information]`;
      setDisputeLetter(letter);
    } finally {
      setGenerating(false);
    }
  };

  const handleEscalate = async (caseId: string) => {
    setEscalating(caseId);
    try {
      await rsFetch(`/api/v1/review-sentry/removal/cases/${caseId}/escalate`, {
        method: "POST",
      });
      loadCases();
    } catch {
      // Error handled by UI state
    } finally {
      setEscalating(null);
    }
  };

  const handleAddEvidence = async (caseId: string) => {
    if (!evidenceDesc.trim()) return;
    setAddingEvidence(true);
    try {
      await rsFetch(`/api/v1/review-sentry/removal/cases/${caseId}/evidence`, {
        method: "POST",
        body: JSON.stringify({
          type: evidenceType,
          description: evidenceDesc,
        }),
      });
      setEvidenceDesc("");
      setEvidenceType("screenshot");
    } catch {
      // Silently fail
    } finally {
      setAddingEvidence(false);
    }
  };

  const handleCopyLetter = () => {
    navigator.clipboard.writeText(disputeLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const evidenceTypeLabels: Record<string, string> = {
    screenshot: "Screenshot",
    customer_record: "Customer Record",
    appointment_history: "Appointment History",
    other: "Other",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cases List + Detail Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Cases List */}
        <div className={`lg:col-span-${activeCase ? "1" : "3"}`}>
          <div className="bg-white rounded-xl border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-500" />
                Removal Cases
                <span className="text-sm font-normal text-gray-500">({removalCases.length})</span>
              </h2>
              <button
                onClick={() => setShowNewDispute(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                New Dispute
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-3 p-4 border-b border-gray-100 bg-gray-50">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as RemovalStatus | "all")}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="all">All Statuses</option>
                {Object.entries(REMOVAL_STATUS_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
              <select
                value={violationFilter}
                onChange={(e) => setViolationFilter(e.target.value as ViolationType | "all")}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="all">All Violations</option>
                {Object.entries(VIOLATION_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Cases */}
            {filteredCases.length > 0 ? (
              <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                {filteredCases.map((c) => {
                  const cfg = REMOVAL_STATUS_CONFIG[c.status] || REMOVAL_STATUS_CONFIG.flagged;
                  const isActive = activeCase === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setActiveCase(isActive ? null : c.id)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${isActive ? "bg-indigo-50 border-l-2 border-l-indigo-500" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(c.createdAt)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{c.reviewAuthor || "Unknown"}</div>
                          <div className="text-xs text-gray-500">{VIOLATION_LABELS[c.violationType]}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Scale className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No removal cases found</p>
                {removalCases.length > 0 && (
                  <p className="text-xs mt-1">Try adjusting your filters</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Case Detail */}
        {activeCase && selectedCase && (
          <div className="lg:col-span-2 space-y-4">
            {/* Case Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Case Details</h3>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${REMOVAL_STATUS_CONFIG[selectedCase.status].color}`}>
                  {REMOVAL_STATUS_CONFIG[selectedCase.status].icon}
                  {REMOVAL_STATUS_CONFIG[selectedCase.status].label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div><span className="text-gray-500">Reviewer:</span> <span className="font-medium">{selectedCase.reviewAuthor || "Unknown"}</span></div>
                <div><span className="text-gray-500">Violation:</span> <span className="font-medium">{VIOLATION_LABELS[selectedCase.violationType]}</span></div>
                <div><span className="text-gray-500">Rating:</span> <span className="font-medium">{selectedCase.reviewRating ? `${selectedCase.reviewRating} star(s)` : "N/A"}</span></div>
                <div><span className="text-gray-500">Created:</span> <span className="font-medium">{formatDate(selectedCase.createdAt)}</span></div>
              </div>

              {selectedCase.reviewText && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 mb-3">
                  <div className="text-xs text-gray-400 mb-1">Review Text:</div>
                  "{selectedCase.reviewText}"
                </div>
              )}

              {selectedCase.evidenceNotes && (
                <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-800 mb-3">
                  <div className="text-xs text-amber-600 mb-1">Evidence Notes:</div>
                  {selectedCase.evidenceNotes}
                </div>
              )}

              <div className="flex gap-2">
                <a
                  href={selectedCase.reviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View on Google
                </a>
                {selectedCase.status === "flagged" && (
                  <button
                    onClick={() => handleEscalate(selectedCase.id)}
                    disabled={escalating === selectedCase.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
                  >
                    {escalating === selectedCase.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                    Escalate to Google
                  </button>
                )}
              </div>
            </div>

            {/* Dispute Letter Generator */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                Dispute Letter
              </h3>

              {!disputeLetter ? (
                <button
                  onClick={() => handleGenerateLetter(selectedCase)}
                  disabled={generating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {generating ? "Generating Letter..." : "Generate Dispute Letter"}
                </button>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={disputeLetter}
                    onChange={(e) => setDisputeLetter(e.target.value)}
                    rows={16}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y font-mono"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyLetter}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                    >
                      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
                      {copied ? "Copied!" : "Copy to Clipboard"}
                    </button>
                    {selectedCase.status === "flagged" && (
                      <button
                        onClick={() => handleEscalate(selectedCase.id)}
                        disabled={escalating === selectedCase.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
                      >
                        {escalating === selectedCase.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        Escalate to Google
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Evidence Upload */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-500" />
                Add Evidence
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Evidence Type</label>
                  <select
                    value={evidenceType}
                    onChange={(e) => setEvidenceType(e.target.value as typeof evidenceType)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  >
                    {Object.entries(evidenceTypeLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={evidenceDesc}
                    onChange={(e) => setEvidenceDesc(e.target.value)}
                    rows={2}
                    placeholder="Describe the evidence..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>
                <button
                  onClick={() => handleAddEvidence(selectedCase.id)}
                  disabled={!evidenceDesc.trim() || addingEvidence}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm"
                >
                  {addingEvidence ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {addingEvidence ? "Adding..." : "Add Evidence"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Dispute Dialog */}
      {showNewDispute && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowNewDispute(false)}>
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-500" />
                Create New Dispute
              </h2>
              <button onClick={() => setShowNewDispute(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {createError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Violation Type *</label>
                <select
                  value={newViolation}
                  onChange={(e) => setNewViolation(e.target.value as ViolationType)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                >
                  {Object.entries(VIOLATION_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review URL *</label>
                <input
                  type="url"
                  value={newReviewUrl}
                  onChange={(e) => setNewReviewUrl(e.target.value)}
                  placeholder="https://www.google.com/maps/review/..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer Name</label>
                <input
                  type="text"
                  value={newReviewerName}
                  onChange={(e) => setNewReviewerName(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review Text</label>
                <textarea
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  rows={3}
                  placeholder="Paste the review text here..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Evidence Notes</label>
                <textarea
                  value={newEvidence}
                  onChange={(e) => setNewEvidence(e.target.value)}
                  rows={2}
                  placeholder="Describe why this review violates Google's policy..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => setShowNewDispute(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDispute}
                disabled={!newReviewUrl.trim() || creating}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Generate Dispute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function ReviewSentryPage() {
  // ─── State ────────────────────────────────────────────────────────────────────
  const [brandId, setBrandId] = useState("");
  const [brandLoading, setBrandLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [removalCases, setRemovalCases] = useState<RemovalCase[]>([]);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "removal" | "sms" | "ringDetector" | "autoDispute" | "feedback">("overview");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFlagDialog, setShowFlagDialog] = useState(false);

  // ─── Load Brand ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const brandsRes = await api.brands.list();
        const userBrands = brandsRes.data || [];
        if (userBrands.length > 0) {
          setBrandId(userBrands[0].id);
        }
      } catch (err) {
        console.error("[ReviewSentry] Failed to load brands:", err);
      } finally {
        setBrandLoading(false);
      }
    })();
  }, []);

  if (brandLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!brandId) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-semibold text-gray-900">No Brand Found</h2>
        <p className="text-gray-500 mt-1">Please create a brand in Settings before using Review Sentry.</p>
      </div>
    );
  }
  

  // ─── Data Fetching ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashData, removalData, templatesData] = await Promise.allSettled([
        rsFetch<DashboardData>(`/api/v1/review-sentry/dashboard/${brandId}`),
        rsFetch<RemovalCase[]>("/api/v1/review-sentry/removal/cases?brand_id=" + brandId),
        rsFetch<{ templates: SMSTemplate[] }>("/api/v1/review-sentry/templates"),
      ]);

      if (dashData.status === "fulfilled") setDashboard(dashData.value);
      else setError("Failed to load dashboard data");

      if (removalData.status === "fulfilled") {
        const rd = removalData.value;
        setRemovalCases(Array.isArray(rd) ? rd : []);
      }

      if (templatesData.status === "fulfilled") {
        const td = templatesData.value;
        setTemplates(td.templates || (Array.isArray(td) ? td : []));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  // Load campaigns separately (they may not exist yet)
  const loadCampaigns = useCallback(async () => {
    try {
      // The campaigns endpoint is not a list-all; we get them from dashboard data
      // For now, we need a way to list campaigns. The dashboard endpoint returns campaigns count.
      // We'll try to load individual campaigns if we have IDs from dashboard data.
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleCampaignCreated = (campaign: Campaign) => {
    setCampaigns((prev) => [...prev, campaign]);
    loadData(); // Refresh dashboard
  };

  const handleReviewFlagged = () => {
    // Reload removal cases
    rsFetch<RemovalCase[]>("/api/v1/review-sentry/removal/cases?brand_id=" + brandId)
      .then((data) => setRemovalCases(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  // ─── Computed ───────────────────────────────────────────────────────────────

  const funnel = dashboard?.funnel || {
    sent: 0,
    opened: 0,
    rated: 0,
    redirected: 0,
    feedbackSubmitted: 0,
  };
  const totalSent = funnel.sent || 0;

  // ─── Loading ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <p className="text-gray-500">{error}</p>
        <button
          onClick={() => { setLoading(true); setError(null); loadData(); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-indigo-500" />
            Review Sentry
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage review gating, feedback capture, and review removal
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFlagDialog(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <Flag className="w-4 h-4" />
            Flag Review
          </button>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Campaign
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Review Requests Sent"
          value={totalSent.toLocaleString()}
          icon={<Send className="w-5 h-5" />}
          change={`Last ${dashboard?.period || "30d"}`}
          changeType="neutral"
        />
        <StatCard
          label="Conversion Rate"
          value={`${dashboard?.conversionRate || "0"}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          change="Redirected to Google"
          changeType={parseFloat(dashboard?.conversionRate || "0") > 30 ? "positive" : "neutral"}
        />
        <StatCard
          label="Average Rating"
          value={dashboard?.avgRating || "0"}
          icon={<Star className="w-5 h-5" />}
          change="Out of 5 stars"
          changeType="neutral"
        />
        <StatCard
          label="Active Campaigns"
          value={String(dashboard?.campaigns || 0)}
          icon={<BarChart3 className="w-5 h-5" />}
          change="Review funnels"
          changeType="neutral"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit flex-wrap">
        {([
          { key: "overview", label: "Overview" },
          { key: "removal", label: "Review Removal" },
          { key: "feedback", label: "Feedback" },
          { key: "sms", label: "SMS Campaigns" },
          { key: "ringDetector", label: "Ring Detector" },
          { key: "autoDispute", label: "Auto-Dispute" },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Overview Tab ────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Funnel Analytics */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Review Funnel
            </h2>
            <div className="space-y-3">
              <FunnelBar
                label="Sent"
                value={funnel.sent}
                total={totalSent}
                color="#6366F1"
                icon={<Send className="w-4 h-4 text-indigo-500" />}
              />
              <FunnelBar
                label="Opened"
                value={funnel.opened}
                total={totalSent}
                color="#8B5CF6"
                icon={<Eye className="w-4 h-4 text-purple-500" />}
              />
              <FunnelBar
                label="Rated"
                value={funnel.rated}
                total={totalSent}
                color="#EC4899"
                icon={<Star className="w-4 h-4 text-pink-500" />}
              />
              <FunnelBar
                label="Redirected"
                value={funnel.redirected}
                total={totalSent}
                color="#10B981"
                icon={<ArrowUpRight className="w-4 h-4 text-green-500" />}
              />
              <FunnelBar
                label="Feedback"
                value={funnel.feedbackSubmitted}
                total={totalSent}
                color="#F59E0B"
                icon={<MessageSquare className="w-4 h-4 text-amber-500" />}
              />
            </div>

            {totalSent > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-500">Overall conversion rate</span>
                <span className="text-lg font-bold text-green-600">{dashboard?.conversionRate || "0"}%</span>
              </div>
            )}
          </div>

          {/* Rating Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              Rating Distribution
            </h2>
            {dashboard ? (
              <RatingDistribution
                distribution={dashboard.ratingDistribution}
                avgRating={dashboard.avgRating}
              />
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-400">
                No rating data yet
              </div>
            )}
          </div>

          {/* Recent Feedback */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-500" />
              Recent Feedback
              {dashboard?.recentFeedback && (
                <span className="text-sm font-normal text-gray-500">
                  ({dashboard.recentFeedback.length})
                </span>
              )}
            </h2>
            {dashboard?.recentFeedback && dashboard.recentFeedback.length > 0 ? (
              <div className="space-y-3">
                {dashboard.recentFeedback.map((item) => (
                  <FeedbackCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No feedback received yet</p>
                <p className="text-sm mt-1">Send review requests to start collecting feedback</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Review Removal Tab ──────────────────────────────────────────────── */}
      {activeTab === "removal" && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-500" />
              Flagged Reviews
              <span className="text-sm font-normal text-gray-500">
                ({removalCases.length})
              </span>
            </h2>
            <button
              onClick={() => setShowFlagDialog(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              <Flag className="w-4 h-4" />
              Flag New Review
            </button>
          </div>

          {removalCases.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Violation</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Reviewer</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Review Text</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {removalCases.map((caseItem) => (
                    <RemovalCaseRow key={caseItem.id} caseItem={caseItem} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <h3 className="text-lg font-semibold text-gray-600 mb-1">No flagged reviews</h3>
              <p className="text-sm">Flag inappropriate reviews to start the removal process</p>
            </div>
          )}
        </div>
      )}

      {/* ─── Feedback Tab ──────────────────────────────────────────────────────── */}
      {activeTab === "feedback" && (
        <FeedbackTab dashboard={dashboard} brandId={brandId} />
      )}

      {/* ─── SMS Campaigns Tab ──────────────────────────────────────────────── */}
      {activeTab === "sms" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Send Review Request */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-500" />
              Send Review Request
            </h2>
            <SMSSendForm campaigns={campaigns} templates={templates} />
          </div>

          {/* Schedule Recurring */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              Schedule Recurring
            </h2>
            <ScheduleRecurringForm campaigns={campaigns} />
          </div>

          {/* Templates Preview */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-500" />
              SMS Templates
              <span className="text-sm font-normal text-gray-500">({templates.length})</span>
            </h2>
            {templates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((t) => (
                  <div key={t.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    <div className="font-medium text-sm text-gray-900 mb-2">{t.name}</div>
                    <div className="text-xs text-gray-600 bg-gray-50 rounded p-3 whitespace-pre-line leading-relaxed">
                      {t.body}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                No templates available
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Ring Detector Tab ─────────────────────────────────────────────── */}
      {activeTab === "ringDetector" && <ReviewRingDetector brandId={brandId} />}

      {/* ─── Auto-Dispute Generator Tab ───────────────────────────────────────── */}
      {activeTab === "autoDispute" && <AutoDisputeGenerator brandId={brandId} />}

      {/* Dialogs */}
      <CreateCampaignDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreated={handleCampaignCreated}
        brandId={brandId}
      />

      <FlagReviewDialog
        open={showFlagDialog}
        onClose={() => setShowFlagDialog(false)}
        onFlagged={handleReviewFlagged}
        brandId={brandId}
      />
    </div>
  );
}