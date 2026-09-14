"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { socialApi } from "@/lib/api";

/* ------------------------------------------------------------------ */
/*  Inline SVG icons — no lucide-react needed                        */
/* ------------------------------------------------------------------ */

function IconTrend() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
}
function IconClock() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface PostRow {
  id: string;
  content: string;
  platforms: any;
  scheduled_at: string | null;
  published_at: string | null;
  status: string;
  media_urls?: string[];
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const PLATFORM_DOT: Record<string, string> = {
  twitter: "#1DA1F2",
  linkedin: "#0A66C2",
  facebook: "#1877F2",
  instagram: "#E4405F",
  tiktok: "#000000",
};

const PLATFORM_BG: Record<string, string> = {
  twitter: "#eff6ff",
  linkedin: "#eef2ff",
  facebook: "#eff6ff",
  instagram: "#fdf2f8",
  tiktok: "#f9fafb",
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                    */
/* ------------------------------------------------------------------ */

function StatCard({ label, value, sub, color = "#0f766e" }: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function SimpleBarChart({ data, color = "#0f766e" }: {
  data: Array<{ label: string; value: number }>;
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-sm text-gray-600 w-24 truncate capitalize">{item.label}</span>
          <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(item.value / max) * 100}%`, background: color }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700 w-10 text-right">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function extractPlatforms(post: PostRow): string[] {
  if (Array.isArray(post.platforms)) {
    return post.platforms.map((pl: any) =>
      typeof pl === "string" ? pl : pl?.platform || "unknown",
    );
  }
  if (typeof post.platforms === "string") return [post.platforms];
  return ["unknown"];
}

function bestHour(posts: PostRow[]): string {
  const counts: Record<number, number> = {};
  for (const p of posts) {
    if (p.scheduled_at) {
      const h = new Date(p.scheduled_at).getHours();
      counts[h] = (counts[h] || 0) + 1;
    }
  }
  const entries = Object.entries(counts);
  if (!entries.length) return "—";
  const best = Number(entries.sort((a, b) => Number(b[1]) - Number(a[1]))[0][0]);
  const suffix = best >= 12 ? "PM" : "AM";
  return `${best % 12 || 12}:00 ${suffix}`;
}

/* ------------------------------------------------------------------ */
/*  AnalyticsInner                                                    */
/* ------------------------------------------------------------------ */

function AnalyticsInner() {
  const searchParams = useSearchParams();
  const brandId = searchParams.get("brandId") || "demo-brand-id";

  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");
  const [sortCol, setSortCol] = useState<"date" | "status">("date");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    const end = new Date();
    const start = new Date(Date.now() - days * 86_400_000);
    socialApi
      .posts(brandId, `startDate=${start.toISOString()}&endDate=${end.toISOString()}&limit=500`)
      .then((data: any) => setPosts(data.posts || []))
      .catch((err: any) => setError(err.message || "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, [brandId, dateRange]);

  /* Derived */
  const published = posts.filter((p) => p.status === "published");
  const scheduled = posts.filter((p) => p.status === "scheduled");
  const drafts = posts.filter((p) => p.status === "draft");

  /* Platform counts */
  const platformCount: Record<string, number> = {};
  for (const post of posts) {
    for (const pl of extractPlatforms(post)) {
      platformCount[pl] = (platformCount[pl] || 0) + 1;
    }
  }
  const platformData = Object.entries(platformCount)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));

  /* Day-of-week counts */
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayCounts: Record<string, number> = {};
  for (const p of posts) {
    if (p.scheduled_at) {
      const d = dayNames[new Date(p.scheduled_at).getDay()];
      dayCounts[d] = (dayCounts[d] || 0) + 1;
    }
  }
  const maxDay = Math.max(...Object.values(dayCounts), 1);

  /* Content type */
  const withMedia = posts.filter(
    (p) => Array.isArray(p.media_urls) && p.media_urls.length > 0,
  ).length;

  /* Top posts */
  const topPosts = [...published]
    .sort(
      (a, b) =>
        new Date(b.published_at || b.created_at).getTime() -
        new Date(a.published_at || a.created_at).getTime(),
    )
    .slice(0, 5);

  /* Table */
  const sorted = [...posts].sort((a, b) => {
    const av =
      sortCol === "date"
        ? new Date(a.scheduled_at || a.created_at).getTime()
        : a.status;
    const bv =
      sortCol === "date"
        ? new Date(b.scheduled_at || b.created_at).getTime()
        : b.status;
    if (av < bv) return sortAsc ? -1 : 1;
    if (av > bv) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleSort = (col: typeof sortCol) => {
    if (col === sortCol) setSortAsc((v) => !v);
    else { setSortCol(col); setSortAsc(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Performance across all your social posts</p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(["7d", "30d", "90d"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                dateRange === r ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {r === "7d" ? "Last 7 days" : r === "30d" ? "Last 30 days" : "Last 90 days"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600">{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Posts" value={posts.length} sub={`Past ${dateRange}`} />
        <StatCard
          label="Published"
          value={published.length}
          color="#16a34a"
          sub={posts.length ? `${Math.round((published.length / posts.length) * 100)}% of total` : undefined}
        />
        <StatCard label="Scheduled" value={scheduled.length} color="#2563eb" />
        <StatCard
          label="Best Posting Time"
          value={bestHour(posts)}
          sub="From your schedule data"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Platform breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Posts by Platform</h2>
          {platformData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No platform data yet</p>
          ) : (
            <SimpleBarChart data={platformData} color="#0f766e" />
          )}
        </div>

        {/* Content mix */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Content Mix</h2>
          <div className="space-y-5">
            <div>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">By Type</h3>
              <SimpleBarChart
                data={[
                  { label: "Text only", value: posts.length - withMedia },
                  { label: "With media", value: withMedia },
                ]}
                color="#0891b2"
              />
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">By Status</h3>
              <SimpleBarChart
                data={[
                  { label: "Published", value: published.length },
                  { label: "Scheduled", value: scheduled.length },
                  { label: "Draft", value: drafts.length },
                ]}
                color="#0f766e"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Best days */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <IconClock />
          <h2 className="text-sm font-semibold text-gray-900">Best Days to Post</h2>
        </div>
        {Object.keys(dayCounts).length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No scheduled post data yet</p>
        ) : (
          <div className="flex items-end gap-2 h-28">
            {dayNames.map((d) => {
              const count = dayCounts[d] || 0;
              const pct = Math.round((count / maxDay) * 100);
              const isBest = pct === 100 && count > 0;
              return (
                <div key={d} className="flex-1 flex flex-col items-center gap-1">
                  {count > 0 && <span className="text-xs text-gray-400">{count}</span>}
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${Math.max(pct, 4)}%`,
                      background: isBest ? "#0f766e" : "#d1fae5",
                    }}
                  />
                  <span className="text-xs font-medium text-gray-500">{d}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top posts */}
      {topPosts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <IconTrend />
            <h2 className="text-sm font-semibold text-gray-900">Recently Published</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {topPosts.map((p) => {
              const platforms = extractPlatforms(p);
              return (
                <div key={p.id} className="px-6 py-3.5 flex items-start gap-3">
                  <div className="flex gap-1 pt-1 flex-shrink-0">
                    {platforms.slice(0, 3).map((pl) => (
                      <span
                        key={pl}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: PLATFORM_DOT[pl] || "#6b7280",
                          display: "inline-block",
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{p.content}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {p.published_at
                        ? new Date(p.published_at).toLocaleDateString()
                        : ""}
                      {" · "}
                      {platforms.join(", ")}
                    </p>
                  </div>
                  {/* Platform badges */}
                  <div className="flex gap-1 flex-shrink-0">
                    {platforms.slice(0, 2).map((pl) => (
                      <span
                        key={pl}
                        style={{
                          padding: "0.125rem 0.5rem",
                          borderRadius: 9999,
                          background: PLATFORM_BG[pl] || "#f3f4f6",
                          color: "#374151",
                          fontSize: "0.7rem",
                          fontWeight: 500,
                        }}
                      >
                        {pl}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Posts table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">All Posts ({posts.length})</h2>
        </div>
        {sorted.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            No posts found for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th
                    style={{ padding: "0.625rem 1.25rem", textAlign: "left", color: "#6b7280", fontWeight: 600, cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSort("date")}
                  >
                    Date {sortCol === "date" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th style={{ padding: "0.625rem 1rem", textAlign: "left", color: "#6b7280", fontWeight: 600 }}>Content</th>
                  <th style={{ padding: "0.625rem 1rem", textAlign: "left", color: "#6b7280", fontWeight: 600 }}>Platform</th>
                  <th
                    style={{ padding: "0.625rem 1.25rem", textAlign: "left", color: "#6b7280", fontWeight: 600, cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSort("status")}
                  >
                    Status {sortCol === "status" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0, 50).map((p) => {
                  const platforms = extractPlatforms(p);
                  return (
                    <tr key={p.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "0.75rem 1.25rem", whiteSpace: "nowrap", color: "#6b7280" }}>
                        {new Date(p.scheduled_at || p.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#374151" }}>
                        {p.content}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {platforms.map((pl) => (
                            <span
                              key={pl}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "0.125rem 0.5rem",
                                borderRadius: 9999,
                                background: PLATFORM_BG[pl] || "#f3f4f6",
                                color: "#374151",
                                fontSize: "0.7rem",
                                fontWeight: 500,
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: PLATFORM_DOT[pl] || "#6b7280", display: "inline-block" }} />
                              {pl}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 1.25rem" }}>
                        <span style={{
                          padding: "0.125rem 0.625rem",
                          borderRadius: 9999,
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          background:
                            p.status === "published" ? "#dcfce7" :
                            p.status === "scheduled" ? "#dbeafe" :
                            p.status === "error" ? "#fee2e2" : "#f3f4f6",
                          color:
                            p.status === "published" ? "#15803d" :
                            p.status === "scheduled" ? "#1d4ed8" :
                            p.status === "error" ? "#dc2626" : "#6b7280",
                        }}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {posts.length > 50 && (
              <div className="px-6 py-3 text-xs text-gray-400 border-t border-gray-100">
                Showing 50 of {posts.length} posts
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>}>
      <AnalyticsInner />
    </Suspense>
  );
}
