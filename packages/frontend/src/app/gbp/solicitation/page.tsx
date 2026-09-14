"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type SolicitationStatus =
  | "pending"
  | "sent"
  | "opened"
  | "clicked"
  | "reviewed"
  | "failed";

interface ReviewSolicitation {
  id: string;
  brandId: string;
  clientName: string;
  phone?: string;
  email?: string;
  messageTemplate: string;
  status: SolicitationStatus;
  createdAt: string;
  sentAt?: string;
  openedAt?: string;
  clickedAt?: string;
  reviewedAt?: string;
  failureReason?: string;
}

interface SolicitationStats {
  total: number;
  pending: number;
  sent: number;
  opened: number;
  clicked: number;
  reviewed: number;
  failed: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/v1";

const STATUS_STAGES: SolicitationStatus[] = [
  "pending",
  "sent",
  "opened",
  "clicked",
  "reviewed",
];

const STATUS_CONFIG: Record<
  SolicitationStatus,
  { label: string; bg: string; text: string; icon: string }
> = {
  pending: {
    label: "Pending",
    bg: "#f3f4f6",
    text: "#6b7280",
    icon: "clock",
  },
  sent: {
    label: "Sent",
    bg: "#dbeafe",
    text: "#1d4ed8",
    icon: "send",
  },
  opened: {
    label: "Opened",
    bg: "#fef3c7",
    text: "#92400e",
    icon: "mail",
  },
  clicked: {
    label: "Clicked",
    bg: "#d1fae5",
    text: "#065f46",
    icon: "cursor",
  },
  reviewed: {
    label: "Reviewed",
    bg: "#dcfce7",
    text: "#15803d",
    icon: "star",
  },
  failed: {
    label: "Failed",
    bg: "#fee2e2",
    text: "#dc2626",
    icon: "x",
  },
};

const MESSAGE_TEMPLATES = [
  {
    id: "default",
    name: "Default — Friendly",
    body: "Hi {name}! We'd love to hear about your experience. Would you mind leaving us a quick review? It only takes a minute and means the world to us. {link}",
  },
  {
    id: "professional",
    name: "Professional",
    body: "Dear {name}, thank you for choosing our services. Your feedback helps us improve. Please consider sharing your experience by leaving a review: {link}",
  },
  {
    id: "casual",
    name: "Short & Casual",
    body: "Hey {name}! How'd we do? Drop us a quick review here: {link}",
  },
];

/* ------------------------------------------------------------------ */
/*  Inline SVG icons — no lucide-react imports                        */
/* ------------------------------------------------------------------ */

function IconSend() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconRefresh() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}
function IconX() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
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

/* ------------------------------------------------------------------ */
/*  Sub-components                                                    */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: SolicitationStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "0.125rem 0.625rem",
        borderRadius: 9999,
        fontSize: "0.7rem",
        fontWeight: 600,
        background: cfg.bg,
        color: cfg.text,
      }}
    >
      {cfg.label}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  color = "#0f766e",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color }}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function FunnelBar({
  label,
  count,
  total,
  color,
  isLast,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  isLast: boolean;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const widthPct = total > 0 ? Math.max(Math.round((count / total) * 100), 2) : 0;
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600 w-20 text-right font-medium">
        {label}
      </span>
      <div className="flex-1 relative">
        <div
          className="h-7 rounded-lg transition-all duration-500"
          style={{
            width: `${widthPct}%`,
            background: color,
            minWidth: count > 0 ? "2rem" : undefined,
          }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-700 w-16">
        {count}
      </span>
      <span className="text-xs text-gray-400 w-12">
        {pct}%
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton                                                  */
/* ------------------------------------------------------------------ */

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-64 bg-gray-100 rounded mt-2" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="h-7 w-16 bg-gray-100 rounded mt-2" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 w-20 bg-gray-100 rounded" />
              <div className="flex-1 h-7 bg-gray-100 rounded" />
              <div className="h-4 w-12 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="h-5 w-32 bg-gray-200 rounded mb-6" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 bg-gray-50 rounded mb-2" />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Create Solicitation Modal                                         */
/* ------------------------------------------------------------------ */

function CreateModal({
  brandId,
  onClose,
  onCreated,
}: {
  brandId: string;
  onClose: () => void;
  onCreated: (s: ReviewSolicitation) => void;
}) {
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [templateId, setTemplateId] = useState("default");
  const [customMessage, setCustomMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedTemplate = MESSAGE_TEMPLATES.find((t) => t.id === templateId);
  const messageTemplate =
    templateId === "custom" ? customMessage : selectedTemplate?.body || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      setError("Client name is required");
      return;
    }
    if (!phone.trim() && !email.trim()) {
      setError("At least one contact method (phone or email) is required");
      return;
    }
    if (templateId === "custom" && !customMessage.trim()) {
      setError("Custom message is required");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/gbp/solicitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          clientName: clientName.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          messageTemplate: messageTemplate.trim(),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Request failed (${res.status})`);
      }
      const json = await res.json();
      onCreated(json.data);
    } catch (err: any) {
      setError(err.message || "Failed to create solicitation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">
            New Review Solicitation
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <IconX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="John Smith"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone (SMS)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 123 4567"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Template selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message Template
            </label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              {MESSAGE_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
              <option value="custom">Custom message…</option>
            </select>
          </div>

          {/* Custom message or preview */}
          {templateId === "custom" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
                placeholder="Write your message. Use {name} and {link} placeholders."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              />
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
              <p className="text-xs font-medium text-gray-400 uppercase mb-1">
                Preview
              </p>
              <p className="whitespace-pre-wrap">
                {selectedTemplate?.body.replace("{name}", clientName || "Client")}
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50"
              style={{ background: submitting ? "#99f6e4" : "#0f766e" }}
            >
              {submitting ? "Creating…" : "Create Solicitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SolicitationInner (main page logic)                               */
/* ------------------------------------------------------------------ */

function SolicitationInner() {
  const searchParams = useSearchParams();
  const brandId = searchParams.get("brandId") || "demo-brand-id";

  const [solicitations, setSolicitations] = useState<ReviewSolicitation[]>([]);
  const [stats, setStats] = useState<SolicitationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState<SolicitationStatus | "all">(
    "all"
  );
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  /* Fetch data */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [solicitationsRes, statsRes] = await Promise.all([
        fetch(
          `${API_BASE}/gbp/solicitations?brandId=${encodeURIComponent(brandId)}&limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}${
            statusFilter !== "all"
              ? `&status=${statusFilter}`
              : ""
          }`
        ),
        fetch(
          `${API_BASE}/gbp/solicitations/stats?brandId=${encodeURIComponent(brandId)}`
        ),
      ]);
      if (!solicitationsRes.ok || !statsRes.ok) {
        throw new Error(
          `Failed to load data (${solicitationsRes.status}, ${statsRes.status})`
        );
      }
      const [solicitationsJson, statsJson] = await Promise.all([
        solicitationsRes.json(),
        statsRes.json(),
      ]);
      setSolicitations(solicitationsJson.data || []);
      setStats(statsJson.data || null);
    } catch (err: any) {
      setError(err.message || "Failed to load solicitations");
    } finally {
      setLoading(false);
    }
  }, [brandId, statusFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* Send solicitation */
  const handleSend = async (id: string) => {
    setSendingId(id);
    try {
      const res = await fetch(`${API_BASE}/gbp/solicitations/${id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Send failed (${res.status})`);
      }
      const json = await res.json();
      setSolicitations((prev) =>
        prev.map((s) => (s.id === id ? json.data : s))
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSendingId(null);
    }
  };

  /* Handle created */
  const handleCreated = (s: ReviewSolicitation) => {
    setSolicitations((prev) => [s, ...prev]);
    setShowCreate(false);
    setStats((prev) =>
      prev ? { ...prev, total: prev.total + 1, pending: prev.pending + 1 } : prev
    );
  };

  /* Filtered list */
  const filtered =
    statusFilter === "all"
      ? solicitations
      : solicitations.filter((s) => s.status === statusFilter);

  /* Funnel conversion rates */
  const funnelData = STATUS_STAGES.map((stage) => ({
    stage,
    count: stats ? (stats as any)[stage] || 0 : 0,
  }));
  const funnelTotal = stats?.total || 0;

  if (loading && solicitations.length === 0) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Review Solicitations
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Send review requests and track their progress
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <IconRefresh />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
            style={{ background: "#0f766e" }}
          >
            <IconPlus />
            New Request
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600 flex items-start gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
          <button
            onClick={() => setError("")}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <IconX />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total" value={stats?.total ?? "—"} color="#374151" />
        <StatCard label="Pending" value={stats?.pending ?? "—"} color="#6b7280" />
        <StatCard label="Sent" value={stats?.sent ?? "—"} color="#1d4ed8" />
        <StatCard label="Opened" value={stats?.opened ?? "—"} color="#d97706" />
        <StatCard label="Clicked" value={stats?.clicked ?? "—"} color="#059669" />
        <StatCard label="Reviewed" value={stats?.reviewed ?? "—"} color="#15803d" />
      </div>

      {/* Funnel / Pipeline */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <IconUsers />
          <h2 className="text-sm font-semibold text-gray-900">
            Conversion Funnel
          </h2>
        </div>
        {funnelTotal === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400">
            No solicitation data yet. Create your first request to see the funnel.
          </div>
        ) : (
          <div className="space-y-2">
            {funnelData.map((item, idx) => {
              const colors = [
                "#e5e7eb", // pending
                "#93c5fd", // sent
                "#fcd34d", // opened
                "#6ee7b7", // clicked
                "#86efac", // reviewed
              ];
              return (
                <FunnelBar
                  key={item.stage}
                  label={STATUS_CONFIG[item.stage].label}
                  count={item.count}
                  total={funnelTotal}
                  color={colors[idx]}
                  isLast={idx === funnelData.length - 1}
                />
              );
            })}
            {/* Conversion rate */}
            {stats && stats.total > 0 && stats.reviewed > 0 && (
              <div className="pt-4 border-t border-gray-100 mt-4">
                <p className="text-sm text-gray-600">
                  Overall conversion rate:{" "}
                  <span className="font-bold text-teal-700">
                    {Math.round((stats.reviewed / stats.total) * 100)}%
                  </span>{" "}
                  (reviewed / total)
                </p>
                {stats.opened > 0 && stats.clicked > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Open→Click: {Math.round((stats.clicked / stats.opened) * 100)}%{" "}
                    · Click→Review:{" "}
                    {Math.round((stats.reviewed / Math.max(stats.clicked, 1)) * 100)}%
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500 flex items-center gap-1">
          <IconFilter /> Filter:
        </span>
        {(["all", ...STATUS_STAGES, "failed"] as const).map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              setPage(0);
            }}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              statusFilter === s
                ? "text-white shadow-sm"
                : "text-gray-500 bg-gray-100 hover:bg-gray-200"
            }`}
            style={
              statusFilter === s && s !== "all"
                ? {
                    background: STATUS_CONFIG[s as SolicitationStatus]?.bg || "#0f766e",
                    color: STATUS_CONFIG[s as SolicitationStatus]?.text || "#fff",
                  }
                : statusFilter === s && s === "all"
                ? { background: "#0f766e", color: "#fff" }
                : undefined
            }
          >
            {s === "all"
              ? "All"
              : STATUS_CONFIG[s as SolicitationStatus]?.label || s}
          </button>
        ))}
      </div>

      {/* Solicitations list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            Solicitations ({filtered.length})
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <IconSend />
              </div>
            </div>
            <p className="text-sm text-gray-500 font-medium">
              No solicitations yet
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Create a review request to start collecting feedback
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
              style={{ background: "#0f766e" }}
            >
              <IconPlus />
              New Request
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors"
              >
                {/* Icon */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: STATUS_CONFIG[s.status].bg,
                  }}
                >
                  {s.status === "pending" && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={STATUS_CONFIG[s.status].text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                  )}
                  {s.status === "sent" && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={STATUS_CONFIG[s.status].text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  )}
                  {s.status === "opened" && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={STATUS_CONFIG[s.status].text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                    </svg>
                  )}
                  {s.status === "clicked" && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={STATUS_CONFIG[s.status].text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /><path d="M13 13l6 6" />
                    </svg>
                  )}
                  {s.status === "reviewed" && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={STATUS_CONFIG[s.status].text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  )}
                  {s.status === "failed" && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={STATUS_CONFIG[s.status].text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {s.clientName}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                    {s.phone && <span>{s.phone}</span>}
                    {s.phone && s.email && <span>·</span>}
                    {s.email && <span>{s.email}</span>}
                    <span>·</span>
                    <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                  </p>
                  {s.status === "failed" && s.failureReason && (
                    <p className="text-xs text-red-500 mt-0.5">
                      {s.failureReason}
                    </p>
                  )}
                </div>

                {/* Status + actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={s.status} />
                  {s.status === "pending" && (
                    <button
                      onClick={() => handleSend(s.id)}
                      disabled={sendingId === s.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors disabled:opacity-50"
                      style={{ background: sendingId === s.id ? "#99f6e4" : "#0f766e" }}
                    >
                      <IconSend />
                      {sendingId === s.id ? "Sending…" : "Send"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination hint */}
        {solicitations.length >= PAGE_SIZE && (
          <div className="px-6 py-3 text-xs text-gray-400 border-t border-gray-100 flex items-center justify-between">
            <span>
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, solicitations.length)} of{" "}
              {stats?.total ?? solicitations.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-2 py-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={solicitations.length < PAGE_SIZE}
                className="px-2 py-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Powered by */}
      <p className="text-center text-xs text-gray-300 pt-2">
        Powered by AgentSocial
      </p>

      {/* Create modal */}
      {showCreate && (
        <CreateModal
          brandId={brandId}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page export with Suspense boundary                                */
/* ------------------------------------------------------------------ */

export default function SolicitationPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <SolicitationInner />
    </Suspense>
  );
}