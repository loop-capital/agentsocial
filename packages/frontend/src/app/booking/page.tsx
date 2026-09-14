"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BookingConfig {
  id: string;
  brandId: string;
  ctaText: string;
  ctaColor: string;
  ctaLinkUrl: string;
  enabledSources: string[];
  widgetPosition: string;
  showOnPages: string | string[];
  autoOpenDelay: number;
  createdAt: string;
  updatedAt: string;
}

interface ConversionStats {
  impressions: number;
  clicks: number;
  bookings: number;
  clickRate: number;
  bookingRate: number;
  sourceBreakdown: Record<string, number>;
  trend: Array<{
    date: string;
    impressions: number;
    clicks: number;
    bookings: number;
  }>;
}

interface RecentBooking {
  id: string;
  brandId: string;
  source: string;
  customerName: string;
  customerEmail?: string;
  service?: string;
  amount?: number;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Inline SVG icons — no lucide-react needed                         */
/* ------------------------------------------------------------------ */

function IconCalendar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconMousePointerClick() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 9l5 12 1.774-5.226L21 14z" /><path d="M16.071 16.071l4.243 4.243" /><path d="M7.188 2.239l.777 2.895" /><path d="M5.644 5.644l2.895.777" /><path d="M2.239 7.188l2.895.777" /><path d="M5.644 2.239l.777 2.895" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
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

function IconRefresh() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
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

function IconClock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
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

function IconDollarSign() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function IconTrendingUp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconPalette() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" /><circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" /><circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" /><circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function IconToggleLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="5" width="22" height="14" rx="7" ry="7" /><circle cx="8" cy="12" r="3" />
    </svg>
  );
}

function IconToggleRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="5" width="22" height="14" rx="7" ry="7" /><circle cx="16" cy="12" r="3" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/v1";

const POSITION_OPTIONS = [
  { value: "bottom-right", label: "Bottom Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "center", label: "Center" },
  { value: "inline", label: "Inline" },
];

const SOURCE_OPTIONS = [
  { value: "gbp", label: "Google Business Profile" },
  { value: "website_widget", label: "Website Widget" },
  { value: "direct_link", label: "Direct Link" },
];

const DEFAULT_CONFIG: BookingConfig = {
  id: "",
  brandId: "",
  ctaText: "Book Now",
  ctaColor: "#0f766e",
  ctaLinkUrl: "",
  enabledSources: ["gbp", "website_widget", "direct_link"],
  widgetPosition: "bottom-right",
  showOnPages: "all",
  autoOpenDelay: 0,
  createdAt: "",
  updatedAt: "",
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
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

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="text-gray-300 mb-3">{icon}</span>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
    </div>
  );
}

function FunnelStep({
  label,
  value,
  percentage,
  color,
}: {
  label: string;
  value: number;
  percentage: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-28 text-right">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-lg font-bold" style={{ color }}>
          {value.toLocaleString()}
        </p>
      </div>
      <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: percentage,
            backgroundColor: color,
            opacity: 0.85,
          }}
        />
      </div>
      <div className="w-16 text-right">
        <span className="text-sm font-medium" style={{ color }}>
          {percentage}
        </span>
      </div>
    </div>
  );
}

function FunnelArrow() {
  return (
    <div className="flex justify-center my-1">
      <IconArrowRight />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CTA Code Generator                                                 */
/* ------------------------------------------------------------------ */

type CtaEmbedStyle = "floating" | "inline" | "popup";
type CtaEmbedSize = "small" | "medium" | "large";

function generateCtaCode(
  style: CtaEmbedStyle,
  config: { ctaText: string; ctaColor: string; ctaLinkUrl: string },
  size: CtaEmbedSize,
  position: string
): string {
  const sizeMap: Record<CtaEmbedSize, { padding: string; fontSize: string; borderRadius: string }> = {
    small: { padding: "10px 20px", fontSize: "14px", borderRadius: "8px" },
    medium: { padding: "14px 28px", fontSize: "16px", borderRadius: "10px" },
    large: { padding: "18px 36px", fontSize: "18px", borderRadius: "12px" },
  };
  const s = sizeMap[size];
  const url = config.ctaLinkUrl || "/book";
  const text = config.ctaText || "Book Now";

  const trackingScript = `<script>
(function(){if(window.__asTrack)return;window.__asTrack=function(t){fetch('/api/v1/gbp/conversion/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({brandId:BRAND_ID,eventType:t,source:'organic'})}).catch(function(){})};fetch('/api/v1/gbp/conversion/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({brandId:BRAND_ID,eventType:'booking_cta_impression',source:'organic'})}).catch(function(){})})();
</script>`;

  if (style === "floating") {
    const posMap: Record<string, string> = {
      bottom_right: "bottom: 24px; right: 24px;",
      bottom_left: "bottom: 24px; left: 24px;",
      center: "bottom: 24px; left: 50%; transform: translateX(-50%);",
    };
    return `<!-- AgentSocial Booking CTA: Floating Button -->
<div id="as-booking-cta" style="position:fixed;${posMap[position] || posMap.bottom_right}z-index:9999;">
  <a href="${url}"
     style="display:inline-block;padding:${s.padding};font-size:${s.fontSize};font-weight:600;color:#fff;background:${config.ctaColor};border-radius:${s.borderRadius};text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,0.2);transition:transform 0.2s,box-shadow 0.2s;"
     onmouseover="this.style.transform='scale(1.05)';this.style.boxShadow='0 6px 20px rgba(0,0,0,0.3)'"
     onmouseout="this.style.transform='scale(1)';this.style.boxShadow='0 4px 14px rgba(0,0,0,0.2)'"
     onclick="if(window.__asTrack){window.__asTrack('booking_cta_click')}"
  >${text}</a>
</div>
${trackingScript}`;
  }

  if (style === "inline") {
    return `<!-- AgentSocial Booking CTA: Inline Embed -->
<div id="as-booking-cta-inline" style="text-align:center;padding:16px 0;">
  <a href="${url}"
     style="display:inline-block;padding:${s.padding};font-size:${s.fontSize};font-weight:600;color:#fff;background:${config.ctaColor};border-radius:${s.borderRadius};text-decoration:none;transition:opacity 0.2s;"
     onmouseover="this.style.opacity='0.9'"
     onmouseout="this.style.opacity='1'"
     onclick="if(window.__asTrack){window.__asTrack('booking_cta_click')}"
  >${text}</a>
</div>
${trackingScript}`;
  }

  // Popup modal
  return `<!-- AgentSocial Booking CTA: Popup Modal -->
<div id="as-booking-popup" style="display:none;position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.5);align-items:center;justify-content:center;">
  <div style="background:#fff;border-radius:16px;padding:32px;max-width:480px;width:90%;box-shadow:0 24px 48px rgba(0,0,0,0.2);position:relative;">
    <button onclick="document.getElementById('as-booking-popup').style.display='none'" style="position:absolute;top:12px;right:12px;background:none;border:none;font-size:24px;cursor:pointer;color:#666;">&times;</button>
    <h3 style="margin:0 0 16px;font-size:20px;font-weight:700;">${text}</h3>
    <a href="${url}"
       style="display:inline-block;padding:${s.padding};font-size:${s.fontSize};font-weight:600;color:#fff;background:${config.ctaColor};border-radius:${s.borderRadius};text-decoration:none;text-align:center;width:100%;box-sizing:border-box;"
       onclick="if(window.__asTrack){window.__asTrack('booking_cta_click')}"
    >${text}</a>
  </div>
</div>
${trackingScript}`;
}

/* ------------------------------------------------------------------ */
/*  Tab type                                                          */
/* ------------------------------------------------------------------ */

type TabKey = "config" | "embed" | "analytics" | "bookings";

/* ------------------------------------------------------------------ */
/*  Booking Dashboard Inner                                           */
/* ------------------------------------------------------------------ */

function BookingDashboardInner() {
  const searchParams = useSearchParams();
  const brandId = searchParams.get("brandId") || "demo-brand-id";

  /* ----- state ----- */
  const [config, setConfig] = useState<BookingConfig>(DEFAULT_CONFIG);
  const [stats, setStats] = useState<ConversionStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("config");

  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  /* ----- form fields ----- */
  const [ctaText, setCtaText] = useState(DEFAULT_CONFIG.ctaText);
  const [ctaColor, setCtaColor] = useState(DEFAULT_CONFIG.ctaColor);
  const [ctaLinkUrl, setCtaLinkUrl] = useState(DEFAULT_CONFIG.ctaLinkUrl);
  const [widgetPosition, setWidgetPosition] = useState(DEFAULT_CONFIG.widgetPosition);
  const [autoOpenDelay, setAutoOpenDelay] = useState(DEFAULT_CONFIG.autoOpenDelay);
  const [showOnPages, setShowOnPages] = useState<string | string[]>(DEFAULT_CONFIG.showOnPages);
  const [showOnPagesInput, setShowOnPagesInput] = useState("");

  /* ----- CTA embed state ----- */
  const [ctaEmbedStyle, setCtaEmbedStyle] = useState<"floating" | "inline" | "popup">("floating");
  const [ctaEmbedSize, setCtaEmbedSize] = useState<"small" | "medium" | "large">("medium");
  const [ctaEmbedPosition, setCtaEmbedPosition] = useState("bottom_right");
  const [showCtaPreview, setShowCtaPreview] = useState(false);
  const [ctaCodeCopied, setCtaCodeCopied] = useState(false);
  const [enabledSources, setEnabledSources] = useState<string[]>(DEFAULT_CONFIG.enabledSources);

  /* ----- fetch config ----- */
  const fetchConfig = useCallback(async () => {
    setLoadingConfig(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/gbp/booking/config?brandId=${brandId}`);
      if (!res.ok) throw new Error(`Failed to load config (${res.status})`);
      const json = await res.json();
      const data: BookingConfig = json.data ?? json;
      setConfig(data);
      setCtaText(data.ctaText);
      setCtaColor(data.ctaColor);
      setCtaLinkUrl(data.ctaLinkUrl);
      setWidgetPosition(data.widgetPosition);
      setAutoOpenDelay(data.autoOpenDelay);
      setShowOnPages(data.showOnPages);
      if (Array.isArray(data.showOnPages)) {
        setShowOnPagesInput(data.showOnPages.join(", "));
      } else {
        setShowOnPagesInput(data.showOnPages === "all" ? "" : data.showOnPages);
      }
      setEnabledSources(data.enabledSources);
    } catch (err: any) {
      setError(err.message || "Failed to load config");
    } finally {
      setLoadingConfig(false);
    }
  }, [brandId]);

  /* ----- fetch stats ----- */
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(`${API_BASE}/gbp/booking/stats?brandId=${brandId}&period=30d`);
      if (!res.ok) throw new Error(`Failed to load stats (${res.status})`);
      const json = await res.json();
      setStats(json.data ?? json);
    } catch {
      // Stats are non-critical; leave as null
    } finally {
      setLoadingStats(false);
    }
  }, [brandId]);

  /* ----- fetch recent bookings ----- */
  const fetchBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const res = await fetch(`${API_BASE}/gbp/booking/recent?brandId=${brandId}&limit=10`);
      if (!res.ok) throw new Error(`Failed to load bookings (${res.status})`);
      const json = await res.json();
      setRecentBookings(json.data ?? json);
    } catch {
      // Non-critical
    } finally {
      setLoadingBookings(false);
    }
  }, [brandId]);

  useEffect(() => {
    fetchConfig();
    fetchStats();
    fetchBookings();
  }, [fetchConfig, fetchStats, fetchBookings]);

  /* ----- save config ----- */
  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setError(null);
    try {
      const pages = showOnPagesInput.trim()
        ? showOnPagesInput.split(",").map((p) => p.trim()).filter(Boolean)
        : "all";
      const payload = {
        brandId,
        ctaText,
        ctaColor,
        ctaLinkUrl,
        enabledSources,
        widgetPosition,
        showOnPages: pages,
        autoOpenDelay,
      };
      const res = await fetch(`${API_BASE}/gbp/booking/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      const json = await res.json();
      const data: BookingConfig = json.data ?? json;
      setConfig(data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  /* ----- toggle source ----- */
  const toggleSource = (source: string) => {
    setEnabledSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  };

  /* ----- source label helper ----- */
  const sourceLabel = (key: string) =>
    SOURCE_OPTIONS.find((s) => s.value === key)?.label ?? key;

  /* ----- funnel percentages ----- */
  const impPct = stats ? "100%" : "0%";
  const clickPct = stats
    ? stats.impressions > 0
      ? `${((stats.clicks / stats.impressions) * 100).toFixed(1)}%`
      : "0%"
    : "0%";
  const bookPct = stats
    ? stats.impressions > 0
      ? `${((stats.bookings / stats.impressions) * 100).toFixed(1)}%`
      : "0%"
    : "0%";

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div className="min-h-screen bg-gray-50/80">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-teal-700"><IconCalendar /></span>
            <h1 className="text-xl font-bold text-gray-900">Booking CTA &amp; Conversions</h1>
          </div>
          <button
            onClick={() => { fetchConfig(); fetchStats(); fetchBookings(); }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-700 transition-colors"
          >
            <IconRefresh /> Refresh
          </button>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 text-lg leading-none">&times;</button>
          </div>
        </div>
      )}

      {/* Success banner */}
      {saveSuccess && (
        <div className="max-w-7xl mx-auto px-6 mt-4">
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <IconCheck /> Configuration saved successfully!
          </div>
        </div>
      )}

      {/* Tabs */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 flex gap-1">
          {(
            [
              { key: "config", label: "Configuration", icon: <IconSettings /> },
              { key: "embed", label: "Get CTA Code", icon: <IconLink /> },
              { key: "analytics", label: "Analytics", icon: <IconBarChart /> },
              { key: "bookings", label: "Recent Bookings", icon: <IconCalendar /> },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-teal-700 text-teal-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* ========== CONFIG TAB ========== */}
        {activeTab === "config" && (
          <div className="space-y-6">
            {loadingConfig ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              <>
                {/* CTA Button Settings */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <IconPalette /> CTA Button Settings
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* CTA Text */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                      <input
                        type="text"
                        value={ctaText}
                        onChange={(e) => setCtaText(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Book Now"
                      />
                    </div>

                    {/* CTA Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Button Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={ctaColor}
                          onChange={(e) => setCtaColor(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={ctaColor}
                          onChange={(e) => setCtaColor(e.target.value)}
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        {/* Preview */}
                        <button
                          className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                          style={{ backgroundColor: ctaColor }}
                        >
                          {ctaText || "Preview"}
                        </button>
                      </div>
                    </div>

                    {/* CTA Link URL */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400"><IconLink /></span>
                        <input
                          type="url"
                          value={ctaLinkUrl}
                          onChange={(e) => setCtaLinkUrl(e.target.value)}
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="https://book.example.com/appointment"
                        />
                      </div>
                    </div>

                    {/* Widget Position */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Widget Position</label>
                      <select
                        value={widgetPosition}
                        onChange={(e) => setWidgetPosition(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                      >
                        {POSITION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Auto-Open Delay */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Auto-Open Delay (seconds)</label>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={autoOpenDelay}
                        onChange={(e) => setAutoOpenDelay(Number(e.target.value))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <p className="text-xs text-gray-400 mt-1">Set to 0 to disable auto-open</p>
                    </div>

                    {/* Show on Pages */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Show on Pages</label>
                      <div className="flex items-center gap-3 mb-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="showOnPages"
                            checked={showOnPages === "all" || (Array.isArray(showOnPages) && showOnPages.length === 0)}
                            onChange={() => { setShowOnPages("all"); setShowOnPagesInput(""); }}
                            className="accent-teal-700"
                          />
                          All pages
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="showOnPages"
                            checked={Array.isArray(showOnPages) && showOnPages.length > 0}
                            onChange={() => {
                              const pages = showOnPagesInput.trim()
                                ? showOnPagesInput.split(",").map((p) => p.trim()).filter(Boolean)
                                : ["/"];
                              setShowOnPages(pages);
                            }}
                            className="accent-teal-700"
                          />
                          Custom pages
                        </label>
                      </div>
                      {Array.isArray(showOnPages) && (
                        <input
                          type="text"
                          value={showOnPagesInput}
                          onChange={(e) => {
                            setShowOnPagesInput(e.target.value);
                            const pages = e.target.value
                              .split(",")
                              .map((p) => p.trim())
                              .filter(Boolean);
                            setShowOnPages(pages.length > 0 ? pages : []);
                          }}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="/contact, /services, /about"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Source Toggle */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <IconGlobe /> Booking Sources
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">Enable or disable booking sources to control where customers can book from.</p>
                  <div className="space-y-3">
                    {SOURCE_OPTIONS.map((source) => {
                      const enabled = enabledSources.includes(source.value);
                      return (
                        <div
                          key={source.value}
                          className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-800">{source.label}</p>
                            <p className="text-xs text-gray-400">
                              {source.value === "gbp" && "Bookings from your Google Business Profile"}
                              {source.value === "website_widget" && "Embedded widget on your website"}
                              {source.value === "direct_link" && "Shareable direct booking link"}
                            </p>
                          </div>
                          <button
                            onClick={() => toggleSource(source.value)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              enabled
                                ? "bg-teal-50 text-teal-700 hover:bg-teal-100"
                                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                            }`}
                          >
                            {enabled ? <IconToggleRight /> : <IconToggleLeft />}
                            {enabled ? "Enabled" : "Disabled"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
                    style={{ backgroundColor: ctaColor }}
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving…
                      </>
                    ) : (
                      <>Save Configuration</>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ========== EMBED / CTA CODE TAB ========== */}
        {activeTab === "embed" && (
          <div className="space-y-6">
            {/* CTA Code Generator */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <IconLink /> Get Booking CTA Code
                </h2>
                <button
                  onClick={() => setShowCtaPreview(!showCtaPreview)}
                  className="flex items-center gap-1.5 text-sm text-teal-700 hover:text-teal-800 transition-colors"
                >
                  {showCtaPreview ? "Hide Preview" : "Show Preview"}
                </button>
              </div>

              {/* Style Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                {/* Embed Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Embed Style</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["floating", "inline", "popup"] as CtaEmbedStyle[]).map((style) => (
                      <button
                        key={style}
                        onClick={() => setCtaEmbedStyle(style)}
                        className={`px-3 py-2.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                          ctaEmbedStyle === style
                            ? "border-teal-600 bg-teal-50 text-teal-800"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <div className="text-xs mb-0.5">
                          {style === "floating" ? "📱" : style === "inline" ? "📝" : "💬"}
                        </div>
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {ctaEmbedStyle === "floating" && "A sticky button that stays visible as users scroll"}
                    {ctaEmbedStyle === "inline" && "An embedded button that fits naturally in your page content"}
                    {ctaEmbedStyle === "popup" && "A modal popup that draws attention to the booking CTA"}
                  </p>
                </div>

                {/* Size & Position */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Button Size</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["small", "medium", "large"] as CtaEmbedSize[]).map((size) => (
                        <button
                          key={size}
                          onClick={() => setCtaEmbedSize(size)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                            ctaEmbedSize === size
                              ? "border-teal-600 bg-teal-50 text-teal-800"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {size.charAt(0).toUpperCase() + size.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  {ctaEmbedStyle === "floating" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                      <select
                        value={ctaEmbedPosition}
                        onChange={(e) => setCtaEmbedPosition(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                      >
                        <option value="bottom_right">Bottom Right</option>
                        <option value="bottom_left">Bottom Left</option>
                        <option value="center">Bottom Center</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Live Preview */}
              {showCtaPreview && (
                <div className="mb-5 border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">Live Preview</span>
                    <span className="text-xs text-gray-400">
                      {ctaEmbedStyle === "floating" ? "Floating button" : ctaEmbedStyle === "inline" ? "Inline embed" : "Popup modal"}
                    </span>
                  </div>
                  <div className="relative bg-gray-100 min-h-[140px] flex items-center justify-center p-8">
                    {/* Simulated page background */}
                    <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-3" />
                      <div className="h-2 bg-gray-100 rounded w-full mb-2" />
                      <div className="h-2 bg-gray-100 rounded w-5/6 mb-4" />
                      {ctaEmbedStyle === "inline" ? (
                        <div className="text-center">
                          <button
                            className="text-white font-semibold hover:opacity-90 transition-opacity"
                            style={{
                              backgroundColor: ctaColor,
                              padding: ctaEmbedSize === "small" ? "10px 20px" : ctaEmbedSize === "large" ? "18px 36px" : "14px 28px",
                              fontSize: ctaEmbedSize === "small" ? "14px" : ctaEmbedSize === "large" ? "18px" : "16px",
                              borderRadius: ctaEmbedSize === "small" ? "8px" : ctaEmbedSize === "large" ? "12px" : "10px",
                              display: "inline-block",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            {ctaText || "Book Now"}
                          </button>
                        </div>
                      ) : ctaEmbedStyle === "popup" ? (
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-lg">
                          <h4 className="font-bold text-gray-900 mb-3">{ctaText || "Book Now"}</h4>
                          <button
                            className="w-full text-white font-semibold py-2 rounded-lg"
                            style={{
                              backgroundColor: ctaColor,
                              fontSize: ctaEmbedSize === "small" ? "14px" : ctaEmbedSize === "large" ? "18px" : "16px",
                            }}
                          >
                            {ctaText || "Book Now"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                    {ctaEmbedStyle === "floating" && (
                      <div
                        className="absolute"
                        style={{
                          bottom: "16px",
                          right: ctaEmbedPosition === "bottom_left" ? undefined : ctaEmbedPosition === "center" ? undefined : "16px",
                          left: ctaEmbedPosition === "bottom_left" ? "16px" : ctaEmbedPosition === "center" ? "50%" : undefined,
                          transform: ctaEmbedPosition === "center" ? "translateX(-50%)" : undefined,
                        }}
                      >
                        <button
                          className="text-white font-semibold shadow-lg"
                          style={{
                            backgroundColor: ctaColor,
                            padding: ctaEmbedSize === "small" ? "10px 20px" : ctaEmbedSize === "large" ? "18px 36px" : "14px 28px",
                            fontSize: ctaEmbedSize === "small" ? "14px" : ctaEmbedSize === "large" ? "18px" : "16px",
                            borderRadius: ctaEmbedSize === "small" ? "8px" : ctaEmbedSize === "large" ? "12px" : "10px",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          {ctaText || "Book Now"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Generated Code */}
              <div className="relative">
                <div className="absolute top-3 right-3 z-10">
                  <button
                    onClick={() => {
                      const code = generateCtaCode(ctaEmbedStyle, {
                        ctaText,
                        ctaColor,
                        ctaLinkUrl,
                      }, ctaEmbedSize, ctaEmbedPosition);
                      navigator.clipboard.writeText(code).then(() => {
                        setCtaCodeCopied(true);
                        setTimeout(() => setCtaCodeCopied(false), 2000);
                      });
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      ctaCodeCopied
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {ctaCodeCopied ? (
                      <><IconCheck /> Copied!</>
                    ) : (
                      <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg> Copy Code</>
                    )}
                  </button>
                </div>
                <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto max-h-64 overflow-y-auto leading-relaxed">
                  <code>{generateCtaCode(ctaEmbedStyle, { ctaText, ctaColor, ctaLinkUrl }, ctaEmbedSize, ctaEmbedPosition)}</code>
                </pre>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Replace <code className="bg-gray-100 px-1 rounded text-gray-600">BRAND_ID</code> with your actual brand ID before embedding.
                The widget automatically tracks impressions and clicks via the conversion tracking API.
              </p>
            </div>
          </div>
        )}

        {/* ========== ANALYTICS TAB ========== */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {loadingStats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : stats ? (
              <>
                {/* Stat cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard
                    label="Impressions"
                    value={stats.impressions.toLocaleString()}
                    sub="Last 30 days"
                    color="#0f766e"
                    icon={<IconEye />}
                  />
                  <StatCard
                    label="Clicks"
                    value={stats.clicks.toLocaleString()}
                    sub={`${(stats.clickRate * 100).toFixed(1)}% click rate`}
                    color="#0e7490"
                    icon={<IconMousePointerClick />}
                  />
                  <StatCard
                    label="Bookings"
                    value={stats.bookings.toLocaleString()}
                    sub={`${(stats.bookingRate * 100).toFixed(1)}% booking rate`}
                    color="#7c3aed"
                    icon={<IconCalendar />}
                  />
                </div>

                {/* Conversion Funnel */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
                    <IconTrendingUp /> Conversion Funnel
                  </h2>
                  <div className="space-y-3 max-w-xl mx-auto">
                    <FunnelStep label="Impressions" value={stats.impressions} percentage={impPct} color="#0f766e" />
                    <FunnelArrow />
                    <FunnelStep label="Clicks" value={stats.clicks} percentage={clickPct} color="#0e7490" />
                    <FunnelArrow />
                    <FunnelStep label="Bookings" value={stats.bookings} percentage={bookPct} color="#7c3aed" />
                  </div>
                </div>

                {/* Source Attribution Breakdown */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <IconBarChart /> Source Attribution
                  </h2>
                  {Object.keys(stats.sourceBreakdown).length === 0 ? (
                    <EmptyState
                      icon={<IconBarChart />}
                      title="No attribution data"
                      description="Source attribution will appear once you receive bookings from multiple sources."
                    />
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(stats.sourceBreakdown)
                        .sort(([, a], [, b]) => b - a)
                        .map(([source, count]) => {
                          const total = stats.bookings || 1;
                          const pct = ((count / total) * 100).toFixed(1);
                          return (
                            <div key={source} className="flex items-center gap-4">
                              <div className="w-36 text-sm font-medium text-gray-700">
                                {sourceLabel(source)}
                              </div>
                              <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor: source === "gbp" ? "#0f766e" : source === "website_widget" ? "#0e7490" : "#7c3aed",
                                    opacity: 0.8,
                                  }}
                                />
                              </div>
                              <div className="w-20 text-right">
                                <span className="text-sm font-semibold text-gray-800">{count}</span>
                                <span className="text-xs text-gray-400 ml-1">({pct}%)</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Trend Table */}
                {stats.trend && stats.trend.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Daily Trend (Last 30 Days)</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-2 px-3 text-gray-500 font-medium">Date</th>
                            <th className="text-right py-2 px-3 text-gray-500 font-medium">Impressions</th>
                            <th className="text-right py-2 px-3 text-gray-500 font-medium">Clicks</th>
                            <th className="text-right py-2 px-3 text-gray-500 font-medium">Bookings</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.trend.slice(-7).map((row) => (
                            <tr key={row.date} className="border-b border-gray-50 hover:bg-gray-50/50">
                              <td className="py-2 px-3 text-gray-700">{row.date}</td>
                              <td className="py-2 px-3 text-right text-gray-700">{row.impressions.toLocaleString()}</td>
                              <td className="py-2 px-3 text-right text-gray-700">{row.clicks.toLocaleString()}</td>
                              <td className="py-2 px-3 text-right font-medium" style={{ color: "#7c3aed" }}>{row.bookings.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                icon={<IconBarChart />}
                title="No analytics data"
                description="Conversion stats will appear once your booking widget starts receiving traffic."
              />
            )}
          </div>
        )}

        {/* ========== RECENT BOOKINGS TAB ========== */}
        {activeTab === "bookings" && (
          <div className="space-y-6">
            {loadingBookings ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                <EmptyState
                  icon={<IconCalendar />}
                  title="No bookings yet"
                  description="Recent bookings will appear here once customers start booking through your widget."
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">Customer</th>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">Source</th>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">Service</th>
                        <th className="text-right py-3 px-4 text-gray-500 font-medium">Amount</th>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBookings.map((booking) => (
                        <tr key={booking.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400"><IconUser /></span>
                              <div>
                                <p className="font-medium text-gray-800">{booking.customerName}</p>
                                {booking.customerEmail && (
                                  <p className="text-xs text-gray-400">{booking.customerEmail}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: booking.source === "gbp" ? "#dcfce7" : booking.source === "website_widget" ? "#dbeafe" : "#f3e8ff",
                                color: booking.source === "gbp" ? "#15803d" : booking.source === "website_widget" ? "#1d4ed8" : "#7c3aed",
                              }}
                            >
                              {sourceLabel(booking.source)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-700">{booking.service || "—"}</td>
                          <td className="py-3 px-4 text-right">
                            {booking.amount != null ? (
                              <span className="font-medium flex items-center justify-end gap-1">
                                <IconDollarSign /> {booking.amount.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="flex items-center gap-1 text-gray-500 text-xs">
                              <IconClock /> {new Date(booking.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">Powered by AgentSocial</p>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page wrapper with Suspense boundary                                */
/* ------------------------------------------------------------------ */

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50/80 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading…</div>
        </div>
      }
    >
      <BookingDashboardInner />
    </Suspense>
  );
}