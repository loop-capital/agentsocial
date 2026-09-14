"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Inline SVG icons                                                  */
/* ------------------------------------------------------------------ */

function IconMessage() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IconBarChart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconBot() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
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
function IconStar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function IconCode() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function IconCopy() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
function IconExternalLink() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface WidgetConfig {
  id: string;
  brandId: string;
  primaryColor: string;
  position: string;
  greeting: string;
  title: string;
  autoResponse: boolean;
  businessHours: Record<string, { open: string; close: string; enabled: boolean }>;
  smsFollowupEnabled: boolean;
  smsFollowupDelayMinutes: number;
  smsFollowupTemplate: string;
  businessName: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatSession {
  id: string;
  brandId: string;
  customerName: string;
  customerPhone?: string;
  lastMessage: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  sessionId: string;
  sender: "customer" | "bot" | "agent";
  content: string;
  createdAt: string;
}

interface WidgetAnalytics {
  totalSessions: number;
  avgResponseTime: number;
  satisfaction: number;
  sessionsByDay: Array<{ date: string; count: number }>;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/v1";

const POSITION_OPTIONS = [
  { value: "bottom-right", label: "Bottom Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "center", label: "Center" },
  { value: "inline", label: "Inline" },
];

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DAY_SHORT: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || body.message || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function defaultBusinessHours(): WidgetConfig["businessHours"] {
  const hours: WidgetConfig["businessHours"] = {};
  DAY_NAMES.forEach((d) => {
    hours[d] = { open: "09:00", close: "17:00", enabled: d !== "Saturday" && d !== "Sunday" };
  });
  return hours;
}

function defaultWidgetConfig(brandId: string): WidgetConfig {
  return {
    id: "",
    brandId,
    primaryColor: "#0f766e",
    position: "bottom-right",
    greeting: "Hi! How can we help you today?",
    title: "Chat with us",
    autoResponse: true,
    businessHours: defaultBusinessHours(),
    smsFollowupEnabled: false,
    smsFollowupDelayMinutes: 30,
    smsFollowupTemplate: "Hi {{name}}, thanks for chatting with us! We'd love to help. Reply here or visit {{link}} to book.",
    businessName: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/*  Loading / Error / Empty skeletons                                  */
/* ------------------------------------------------------------------ */

function CardSkeleton() {
  return <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3 mb-3" /><div className="h-8 bg-gray-200 rounded w-1/2" /></div>;
}

function RowSkeleton({ n = 4 }: { n?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-pulse flex gap-3 items-center">
          <div className="h-9 w-9 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-2"><div className="h-3 bg-gray-200 rounded w-2/3" /><div className="h-3 bg-gray-200 rounded w-1/3" /></div>
        </div>
      ))}
    </div>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
      <span className="text-red-500 mt-0.5"><IconAlert /></span>
      <div className="flex-1">
        <p className="text-sm text-red-700 font-medium">Something went wrong</p>
        <p className="text-xs text-red-500 mt-1">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 font-medium">
          <IconRefresh /> Retry
        </button>
      )}
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-400 mb-3">{icon}</div>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab navigation                                                     */
/* ------------------------------------------------------------------ */

type TabId = "config" | "sessions" | "analytics" | "embed";

function TabBar({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "config", label: "Widget Config", icon: <IconSettings /> },
    { id: "sessions", label: "Chat Sessions", icon: <IconMessage /> },
    { id: "analytics", label: "Analytics", icon: <IconBarChart /> },
    { id: "embed", label: "Embed Code", icon: <IconCode /> },
  ];
  return (
    <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
            active === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Widget Config tab                                                  */
/* ------------------------------------------------------------------ */

function WidgetConfigTab({ brandId }: { brandId: string }) {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/gbp/widget?brandId=${encodeURIComponent(brandId)}`);
      setConfig((res.data as WidgetConfig) || defaultWidgetConfig(brandId));
    } catch (err: any) {
      setError(err.message);
      setConfig(defaultWidgetConfig(brandId));
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await apiFetch("/gbp/widget", {
        method: "PUT",
        body: JSON.stringify({ ...config, brandId }),
      });
      setConfig((res.data as WidgetConfig) || config);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof WidgetConfig>(key: K, value: WidgetConfig[K]) => {
    setConfig((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updateBusinessHour = (day: string, field: "open" | "close" | "enabled", value: string | boolean) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const bh = { ...prev.businessHours };
      bh[day] = { ...bh[day], [field]: value };
      return { ...prev, businessHours: bh };
    });
  };

  if (loading) {
    return <div className="space-y-4"><CardSkeleton /><CardSkeleton /><RowSkeleton n={7} /></div>;
  }

  return (
    <div className="space-y-6">
      {error && <ErrorBanner message={error} onRetry={loadConfig} />}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-2 text-sm text-emerald-700 font-medium">
          <IconCheck /> Configuration saved successfully
        </div>
      )}

      {/* Appearance */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <IconSettings /> Appearance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Primary Color */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Primary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config?.primaryColor || "#0f766e"}
                onChange={(e) => updateField("primaryColor", e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={config?.primaryColor || "#0f766e"}
                onChange={(e) => updateField("primaryColor", e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Position */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Widget Position</label>
            <select
              value={config?.position || "bottom-right"}
              onChange={(e) => updateField("position", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
            >
              {POSITION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Widget Title</label>
            <input
              type="text"
              value={config?.title || ""}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Chat with us"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Greeting */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Greeting Message</label>
            <input
              type="text"
              value={config?.greeting || ""}
              onChange={(e) => updateField("greeting", e.target.value)}
              placeholder="Hi! How can we help you today?"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Business Name */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Business Name</label>
            <input
              type="text"
              value={config?.businessName || ""}
              onChange={(e) => updateField("businessName", e.target.value)}
              placeholder="Your Business Name"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">Displayed in the widget header and SMS follow-ups</p>
          </div>
        </div>
      </div>

      {/* Auto-Response Toggle */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <IconBot /> Auto-Response
            </h3>
            <p className="text-xs text-gray-400 mt-1">Automatically reply to customers when agents are unavailable</p>
          </div>
          <button
            onClick={() => updateField("autoResponse", !config?.autoResponse)}
            className={`relative w-11 h-6 rounded-full transition-colors ${config?.autoResponse ? "bg-teal-600" : "bg-gray-300"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config?.autoResponse ? "translate-x-5" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* SMS Follow-up */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <IconPhone /> SMS Follow-up
            </h3>
            <p className="text-xs text-gray-400 mt-1">Auto-send SMS summaries after chat sessions end</p>
          </div>
          <button
            onClick={() => updateField("smsFollowupEnabled", !config?.smsFollowupEnabled)}
            className={`relative w-11 h-6 rounded-full transition-colors ${config?.smsFollowupEnabled ? "bg-teal-600" : "bg-gray-300"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config?.smsFollowupEnabled ? "translate-x-5" : ""}`}
            />
          </button>
        </div>

        {config?.smsFollowupEnabled && (
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Delay (minutes)</label>
                <input
                  type="number"
                  value={config?.smsFollowupDelayMinutes ?? 30}
                  onChange={(e) => updateField("smsFollowupDelayMinutes", parseInt(e.target.value) || 0)}
                  min={0}
                  max={1440}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">Minutes after session ends before sending SMS (0 = immediate)</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">From Number</label>
                <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-50">
                  Configured via Twilio
                </div>
                <p className="text-xs text-gray-400 mt-1">Set TWILIO_PHONE_NUMBER in environment</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">SMS Template</label>
              <textarea
                value={config?.smsFollowupTemplate || ""}
                onChange={(e) => updateField("smsFollowupTemplate", e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                placeholder="Hi {{name}}, thanks for chatting with us!"
              />
              <p className="text-xs text-gray-400 mt-1">
                Available variables: <code className="bg-gray-100 px-1 rounded">{"{{name}}"}</code>, <code className="bg-gray-100 px-1 rounded">{"{{link}}"}</code>, <code className="bg-gray-100 px-1 rounded">{"{{business}}"}</code>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Business Hours */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <IconClock /> Business Hours
        </h3>
        <div className="space-y-3">
          {DAY_NAMES.map((day) => {
            const hours = config?.businessHours?.[day] || { open: "09:00", close: "17:00", enabled: false };
            return (
              <div key={day} className="flex items-center gap-3">
                <button
                  onClick={() => updateBusinessHour(day, "enabled", !hours.enabled)}
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    hours.enabled ? "bg-teal-600 border-teal-600 text-white" : "border-gray-300 bg-white"
                  }`}
                >
                  {hours.enabled && <IconCheck />}
                </button>
                <span className={`w-10 text-sm font-medium ${hours.enabled ? "text-gray-900" : "text-gray-400"}`}>
                  {DAY_SHORT[day]}
                </span>
                <input
                  type="time"
                  value={hours.open}
                  onChange={(e) => updateBusinessHour(day, "open", e.target.value)}
                  disabled={!hours.enabled}
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
                <span className="text-gray-400 text-sm">to</span>
                <input
                  type="time"
                  value={hours.close}
                  onChange={(e) => updateBusinessHour(day, "close", e.target.value)}
                  disabled={!hours.enabled}
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-teal-700 text-white text-sm font-medium rounded-lg hover:bg-teal-800 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Save Configuration"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Embed Code tab                                                     */
/* ------------------------------------------------------------------ */

function EmbedCodeTab({ brandId }: { brandId: string }) {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/gbp/widget?brandId=${encodeURIComponent(brandId)}`);
      setConfig((res.data as WidgetConfig) || defaultWidgetConfig(brandId));
    } catch {
      setConfig(defaultWidgetConfig(brandId));
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  if (loading) return <CardSkeleton />;

  const primaryColor = config?.primaryColor || "#0f766e";
  const position = config?.position || "bottom-right";
  const greeting = config?.greeting || "Hi! How can we help you today?";
  const title = config?.title || "Chat with us";
  const businessName = config?.businessName || "";

  const widgetScript = `<script
  src="${process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL || "https://cdn.getuplook.com/widget.js"}"
  data-brand-id="${brandId}"
  data-color="${primaryColor}"
  data-position="${position}"
  data-greeting="${greeting}"
  data-title="${title}"
  ${businessName ? `data-business-name="${businessName}"` : ""}
  async
></script>`;

  const embedSnippet = `<!-- GetUpLook Chat Widget -->
<div id="getuplook-chat-widget"></div>
${widgetScript}
<!-- End GetUpLook Chat Widget -->`;

  const reactComponent = `import { GetUpLookChat } from '@getuplook/react-chat';

export default function ContactPage() {
  return (
    <GetUpLookChat
      brandId="${brandId}"
      color="${primaryColor}"
      position="${position}"
      greeting="${greeting}"
      title="${title}"
      ${businessName ? `businessName="${businessName}"` : ""}
    />
  );
}`;

  const iframeEmbed = `<iframe
  src="${process.env.NEXT_PUBLIC_WIDGET_IFRAME_URL || "https://chat.getuplook.com"}/widget/${brandId}?color=${encodeURIComponent(primaryColor)}&position=${encodeURIComponent(position)}&greeting=${encodeURIComponent(greeting)}"
  width="100%"
  height="600"
  frameborder="0"
  style="border-radius: 12px;"
></iframe>`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Preview */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Widget Preview</h3>
        <div className="relative bg-gray-50 rounded-lg overflow-hidden" style={{ height: 400 }}>
          {/* Simulated website content */}
          <div className="p-6">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
            <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-6" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-20 bg-gray-200 rounded" />
              <div className="h-20 bg-gray-200 rounded" />
            </div>
          </div>

          {/* Floating chat bubble */}
          <div
            className="absolute bottom-4 right-4 cursor-pointer"
            style={{ right: position.includes("left") ? "auto" : "1rem", left: position.includes("left") ? "1rem" : "auto" }}
          >
            <div
              className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform"
              style={{ backgroundColor: primaryColor }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
          </div>

          {/* "Powered by" badge */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-gray-400">
            Powered by GetUpLook
          </div>
        </div>
      </div>

      {/* JavaScript Embed */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <IconCode /> JavaScript Embed Code
            </h3>
            <p className="text-xs text-gray-400 mt-1">Add this snippet to your website&apos;s HTML before the closing &lt;/body&gt; tag</p>
          </div>
          <button
            onClick={() => copyToClipboard(embedSnippet, "js")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
          >
            {copied === "js" ? <IconCheck /> : <IconCopy />}
            {copied === "js" ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto leading-relaxed">
          <code>{embedSnippet}</code>
        </pre>
      </div>

      {/* React Component */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <IconExternalLink /> React Component
            </h3>
            <p className="text-xs text-gray-400 mt-1">For Next.js / React apps — install <code className="bg-gray-100 px-1 rounded">@getuplook/react-chat</code></p>
          </div>
          <button
            onClick={() => copyToClipboard(reactComponent, "react")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
          >
            {copied === "react" ? <IconCheck /> : <IconCopy />}
            {copied === "react" ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto leading-relaxed">
          <code>{reactComponent}</code>
        </pre>
      </div>

      {/* Iframe Embed */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <IconExternalLink /> Iframe Embed
            </h3>
            <p className="text-xs text-gray-400 mt-1">For embedding as an inline chat panel (e.g. contact page)</p>
          </div>
          <button
            onClick={() => copyToClipboard(iframeEmbed, "iframe")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
          >
            {copied === "iframe" ? <IconCheck /> : <IconCopy />}
            {copied === "iframe" ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto leading-relaxed">
          <code>{iframeEmbed}</code>
        </pre>
      </div>

      {/* Configuration reference */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Configuration Reference</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 font-medium text-gray-500">Attribute</th>
                <th className="text-left py-2 pr-4 font-medium text-gray-500">Prop</th>
                <th className="text-left py-2 pr-4 font-medium text-gray-500">Description</th>
                <th className="text-left py-2 font-medium text-gray-500">Current</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <tr>
                <td className="py-2 pr-4"><code className="bg-gray-100 px-1 rounded">data-brand-id</code></td>
                <td className="py-2 pr-4"><code className="bg-gray-100 px-1 rounded">brandId</code></td>
                <td className="py-2 pr-4 text-gray-600">Your unique brand identifier</td>
                <td className="py-2 text-gray-900 font-mono">{brandId}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="bg-gray-100 px-1 rounded">data-color</code></td>
                <td className="py-2 pr-4"><code className="bg-gray-100 px-1 rounded">color</code></td>
                <td className="py-2 pr-4 text-gray-600">Primary widget color (hex)</td>
                <td className="py-2"><div className="flex items-center gap-2"><div className="w-4 h-4 rounded" style={{ backgroundColor: primaryColor }} /><span className="font-mono">{primaryColor}</span></div></td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="bg-gray-100 px-1 rounded">data-position</code></td>
                <td className="py-2 pr-4"><code className="bg-gray-100 px-1 rounded">position</code></td>
                <td className="py-2 pr-4 text-gray-600">Widget position (bottom-right, bottom-left)</td>
                <td className="py-2 text-gray-900 font-mono">{position}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="bg-gray-100 px-1 rounded">data-greeting</code></td>
                <td className="py-2 pr-4"><code className="bg-gray-100 px-1 rounded">greeting</code></td>
                <td className="py-2 pr-4 text-gray-600">Initial greeting message</td>
                <td className="py-2 text-gray-900 font-mono text-xs">{greeting}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="bg-gray-100 px-1 rounded">data-title</code></td>
                <td className="py-2 pr-4"><code className="bg-gray-100 px-1 rounded">title</code></td>
                <td className="py-2 pr-4 text-gray-600">Widget header title</td>
                <td className="py-2 text-gray-900 font-mono">{title}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="bg-gray-100 px-1 rounded">data-business-name</code></td>
                <td className="py-2 pr-4"><code className="bg-gray-100 px-1 rounded">businessName</code></td>
                <td className="py-2 pr-4 text-gray-600">Business name for branding and SMS</td>
                <td className="py-2 text-gray-900 font-mono">{businessName || "(not set)"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chat Sessions tab                                                  */
/* ------------------------------------------------------------------ */

function ChatSessionsTab({ brandId }: { brandId: string }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/gbp/widget/sessions?brandId=${encodeURIComponent(brandId)}`);
      setSessions((res.data as ChatSession[]) || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  if (loading) return <RowSkeleton n={5} />;

  if (error) return <ErrorBanner message={error} onRetry={loadSessions} />;

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={<IconMessage />}
        title="No chat sessions yet"
        description="When customers start chatting, their sessions will appear here."
      />
    );
  }

  if (selectedSession) {
    return <SessionMessages sessionId={selectedSession} onBack={() => setSelectedSession(null)} />;
  }

  const statusColor: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    closed: "bg-gray-100 text-gray-600",
    pending: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="space-y-3">
      {sessions.map((s) => (
        <button
          key={s.id}
          onClick={() => setSelectedSession(s.id)}
          className="w-full bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:border-teal-200 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 flex-shrink-0">
            <IconUser />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900 truncate">{s.customerName}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColor[s.status] || "bg-gray-100 text-gray-600"}`}>
                {s.status}
              </span>
            </div>
            <p className="text-xs text-gray-400 truncate mt-0.5">{s.lastMessage}</p>
          </div>
          <p className="text-[10px] text-gray-400 flex-shrink-0">{new Date(s.updatedAt).toLocaleDateString()}</p>
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Session messages detail                                            */
/* ------------------------------------------------------------------ */

function SessionMessages({ sessionId, onBack }: { sessionId: string; onBack: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`/gbp/widget/sessions/${sessionId}/messages?limit=50&offset=0`);
        setMessages((res.data as ChatMessage[]) || []);
        if (res.pagination) {
          setTotal(res.pagination.total);
          setHasMore(res.pagination.hasMore || false);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  const endSession = async () => {
    try {
      await apiFetch(`/gbp/widget/sessions/${sessionId}/end`, { method: "POST" });
      // Reload messages to reflect the session close
      onBack();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <RowSkeleton n={6} />;
  if (error) return <ErrorBanner message={error} />;

  if (messages.length === 0) {
    return (
      <div>
        <button onClick={onBack} className="text-sm text-teal-700 hover:text-teal-900 flex items-center gap-1 mb-4 font-medium">
          <IconChevronLeft /> Back to sessions
        </button>
        <EmptyState icon={<IconMessage />} title="No messages" description="This session has no messages yet." />
      </div>
    );
  }

  const senderStyles: Record<string, string> = {
    customer: "bg-gray-100 text-gray-900",
    bot: "bg-teal-50 text-teal-900",
    agent: "bg-blue-50 text-blue-900",
  };
  const senderIcon: Record<string, React.ReactNode> = {
    customer: <IconUser />,
    bot: <IconBot />,
    agent: <IconUser />,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-sm text-teal-700 hover:text-teal-900 flex items-center gap-1 font-medium">
          <IconChevronLeft /> Back to sessions
        </button>
        <button
          onClick={endSession}
          className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
        >
          End Session
        </button>
      </div>
      {total > 0 && (
        <p className="text-xs text-gray-400 mb-3">{total} messages</p>
      )}
      <div className="space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`rounded-xl p-4 ${senderStyles[m.sender] || "bg-gray-50"}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-current opacity-60">{senderIcon[m.sender]}</span>
              <span className="text-xs font-semibold capitalize">{m.sender}</span>
              <span className="text-xs opacity-50">{new Date(m.createdAt).toLocaleTimeString()}</span>
            </div>
            <p className="text-sm leading-relaxed">{m.content}</p>
          </div>
        ))}
      </div>
      {hasMore && (
        <div className="mt-4 text-center">
          <button className="text-sm text-teal-700 hover:text-teal-900 font-medium">Load more messages</button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Analytics tab                                                      */
/* ------------------------------------------------------------------ */

function AnalyticsTab({ brandId }: { brandId: string }) {
  const [analytics, setAnalytics] = useState<WidgetAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/gbp/widget/analytics?brandId=${encodeURIComponent(brandId)}`);
      setAnalytics((res.data as WidgetAnalytics) || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>;
  if (error) return <ErrorBanner message={error} onRetry={loadAnalytics} />;
  if (!analytics) return <EmptyState icon={<IconBarChart />} title="No analytics data" description="Analytics will appear once you have chat sessions." />;

  const maxByDay = Math.max(...analytics.sessionsByDay.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 flex items-center gap-2"><IconMessage /> Total Sessions</p>
          <p className="text-2xl font-bold mt-1 text-teal-700">{analytics.totalSessions.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 flex items-center gap-2"><IconClock /> Avg Response Time</p>
          <p className="text-2xl font-bold mt-1 text-teal-700">{analytics.avgResponseTime}s</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 flex items-center gap-2"><IconStar /> Satisfaction</p>
          <p className="text-2xl font-bold mt-1 text-teal-700">{analytics.satisfaction}%</p>
        </div>
      </div>

      {/* Sessions by day chart */}
      {analytics.sessionsByDay.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Sessions by Day</h3>
          <div className="space-y-3">
            {analytics.sessionsByDay.map((d) => (
              <div key={d.date} className="flex items-center gap-3">
                <span className="w-20 text-xs text-gray-500 flex-shrink-0">{d.date}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(d.count / maxByDay) * 100}%`, backgroundColor: "#0f766e" }}
                  />
                </div>
                <span className="w-8 text-xs font-medium text-gray-700 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */

function ChatWidgetContent() {
  const searchParams = useSearchParams();
  const brandId = searchParams.get("brandId") || "demo-brand-id";
  const [activeTab, setActiveTab] = useState<TabId>("config");

  return (
    <div className="min-h-screen bg-gray-50/80">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <IconMessage /> AI Chat Widget
          </h1>
          <p className="text-sm text-gray-500 mt-1">Configure your chat widget, view sessions, track analytics, and get embed codes</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <TabBar active={activeTab} onChange={setActiveTab} />
        </div>

        {/* Content */}
        {activeTab === "config" && <WidgetConfigTab brandId={brandId} />}
        {activeTab === "sessions" && <ChatSessionsTab brandId={brandId} />}
        {activeTab === "analytics" && <AnalyticsTab brandId={brandId} />}
        {activeTab === "embed" && <EmbedCodeTab brandId={brandId} />}
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-xs text-gray-400">
        Powered by GetUpLook
      </div>
    </div>
  );
}

export default function ChatWidgetPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50/80 flex items-center justify-center">
          <div className="text-gray-400 text-sm animate-pulse">Loading…</div>
        </div>
      }
    >
      <ChatWidgetContent />
    </Suspense>
  );
}