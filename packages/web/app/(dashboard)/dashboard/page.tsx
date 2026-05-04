"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp,
  FileText,
  Eye,
  Users,
  Plus,
  BarChart2,
  Calendar,
  Clock,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge, type Status } from "@/components/ui/status-badge";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { QuickActionCard } from "@/components/ui/quick-action-card";
import { CalendarWidget } from "@/components/ui/calendar-widget";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "../../../lib/api";

type Post = {
  id: string;
  brand_id: string;
  content: string;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
};

type Brand = {
  id: string;
  name: string;
  logo_url: string | null;
  timezone: string;
  channels_count?: number;
  channels?: Array<{
    id: string;
    platform: string;
    name: string;
    status: string;
    follower_count?: number | null;
  }>;
  created_at: string;
};

type AnalyticsSummary = {
  total_followers: number;
  followers_growth: number;
  total_impressions: number;
  total_engagements: number;
  engagement_rate: number;
  posts_published: number;
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DashboardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      // Load brands first
      setLoadingBrands(true);
      const brandsRes = await api.brands.list();
      const userBrands = brandsRes.data || [];
      setBrands(userBrands);
      setLoadingBrands(false);

      // Load posts
      setLoadingPosts(true);
      try {
        const postsRes = await api.posts.list({ limit: 5 });
        setPosts(postsRes.data || []);
      } catch (e) {
        console.error("Failed to load posts:", e);
      } finally {
        setLoadingPosts(false);
      }

      // Load analytics for first brand if available
      setLoadingAnalytics(true);
      if (userBrands.length > 0) {
        try {
          const analyticsRes = await api.analytics.summary(userBrands[0].id, "7d");
          setAnalytics(analyticsRes.summary || null);
        } catch (e) {
          console.error("Failed to load analytics:", e);
        }
      }
      setLoadingAnalytics(false);
    } catch (e) {
      setError("Failed to load dashboard data");
      setLoadingPosts(false);
      setLoadingBrands(false);
      setLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedBrand = brands[0];
  const upcomingPosts = posts.filter((p) => p.status === "scheduled");
  const publishedPosts = posts.filter((p) => p.status === "published");
  const totalPosts = posts.length;
  const scheduledCount = upcomingPosts.length;
  const channelsConnected = selectedBrand?.channels?.length ?? 0;

  const chartData = publishedPosts.slice(0, 7).map((_, idx) => ({
    date: new Date(Date.now() - (6 - idx) * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    impressions: analytics?.total_impressions ? Math.floor(analytics.total_impressions / 7) : 0,
    engagements: analytics?.total_engagements ? Math.floor(analytics.total_engagements / 7) : 0,
  }));

  const isLoading = loadingPosts || loadingBrands || loadingAnalytics;

  return (
    <div>
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back — here is your social media overview</p>
        </div>
        <Link href="/create" className="btn btn-primary">
          <Plus size={16} />
          Create Post
        </Link>
      </div>

      {error && (
        <div style={{ background: "#2d1a1a", border: "1px solid #c0392b", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1rem", color: "#e74c3c" }}>
          {error}
        </div>
      )}

      {/* ─── Stats Grid ─────────────────────────────────── */}
      <div className="stats-grid">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="stat-card" style={{ padding: "1.25rem" }}>
                <Skeleton style={{ width: "60%", height: 12, marginBottom: 12 }} />
                <Skeleton style={{ width: "40%", height: 28, marginBottom: 8 }} />
                <Skeleton style={{ width: "50%", height: 12 }} />
              </div>
            ))}
          </>
        ) : (
          <>
            <StatCard
              label="Total Posts"
              value={totalPosts.toString()}
              change={scheduledCount > 0 ? `${scheduledCount} scheduled` : undefined}
              changeType="neutral"
              icon={<FileText size={14} />}
            />
            <StatCard
              label="Impressions"
              value={analytics?.total_impressions != null ? (analytics.total_impressions >= 1000 ? `${(analytics.total_impressions / 1000).toFixed(1)}K` : analytics.total_impressions.toString()) : "0"}
              change={analytics?.total_impressions ? "Last 7 days" : undefined}
              changeType="neutral"
              icon={<Eye size={14} />}
            />
            <StatCard
              label="Engagements"
              value={analytics?.total_engagements?.toLocaleString() || "0"}
              change={analytics?.engagement_rate ? `${analytics.engagement_rate.toFixed(2)}% rate` : undefined}
              changeType="neutral"
              icon={<TrendingUp size={14} />}
            />
            <StatCard
              label="Followers"
              value={analytics?.total_followers?.toLocaleString() || "0"}
              change={analytics?.followers_growth != null ? `${analytics.followers_growth > 0 ? "+" : ""}${analytics.followers_growth}` : undefined}
              changeType={analytics?.followers_growth != null ? (analytics.followers_growth >= 0 ? "positive" : "negative") : "neutral"}
              icon={<Users size={14} />}
            />
          </>
        )}
      </div>

      {/* ─── Quick Actions ──────────────────────────────── */}
      <div className="quick-actions-grid">
        <QuickActionCard
          icon={Plus}
          label="Create Post"
          description="Write and publish new content"
          href="/create"
          accentColor="#3B82F6"
        />
        <QuickActionCard
          icon={BarChart2}
          label="View Analytics"
          description="Track your performance"
          href="/analytics"
          accentColor="#8B5CF6"
        />
        <QuickActionCard
          icon={Calendar}
          label="Schedule Queue"
          description="See upcoming posts"
          href="/calendar"
          accentColor="#10B981"
        />
      </div>

      {/* ─── Charts + Calendar Row ───────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", marginBottom: "1.75rem", alignItems: "start" }}>
        {/* Performance Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-card-title">Performance Overview</h3>
              <p className="chart-card-subtitle">Impressions &amp; Engagements — Last 7 days</p>
            </div>
            <div className="chart-card-action">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3B82F6", display: "inline-block" }} />
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Impressions</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Engagements</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ padding: "0.5rem 0.25rem 1.25rem" }}>
            {loadingAnalytics ? (
              <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
              </div>
            ) : analytics && analytics.total_impressions === 0 ? (
              <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <EmptyState
                  icon={<BarChart2 size={32} strokeWidth={1.5} />}
                  title="No analytics yet"
                  description="Start posting to see your performance data"
                  action={{ label: "Create Post", href: "/create" }}
                />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="impressionsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="engagementsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    tickLine={false}
                    axisLine={false}
                    interval={2}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: 8,
                      fontSize: "0.8125rem",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)",
                    }}
                    labelStyle={{ color: "#6B7280", marginBottom: 4 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="impressions"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#impressionsGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: "#3B82F6" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="engagements"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="url(#engagementsGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: "#10B981" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Upcoming Scheduled */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Upcoming Posts</h3>
            <Link href="/calendar" style={{ fontSize: "0.8rem", color: "var(--color-primary)", textDecoration: "none" }}>
              View all
            </Link>
          </div>
          <div style={{ padding: "0.5rem 0" }}>
            {loadingPosts ? (
              <div style={{ padding: "1.5rem" }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                    <Skeleton style={{ width: "100%", height: 40 }} />
                  </div>
                ))}
              </div>
            ) : upcomingPosts.length === 0 ? (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                No upcoming posts scheduled
                <br />
                <Link href="/create" style={{ color: "var(--color-primary)", fontSize: "0.8rem", marginTop: "0.5rem", display: "inline-block" }}>
                  Schedule a post
                </Link>
              </div>
            ) : (
              upcomingPosts.slice(0, 5).map((post) => (
                <div
                  key={post.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    padding: "0.75rem 1.25rem",
                    borderBottom: "1px solid var(--border-default)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: "0.8125rem",
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginBottom: "0.375rem",
                    }}>
                      {post.content}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Clock size={11} style={{ color: "var(--text-muted)" }} />
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {formatDate(post.scheduled_at)}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={post.status as Status} size="sm" />
                </div>
              ))
            )}
          </div>
          {!loadingPosts && upcomingPosts.length > 0 && (
            <div style={{ padding: "0.875rem 1.25rem", borderTop: "1px solid var(--border-default)" }}>
              <Link
                href="/create"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.375rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--color-primary)",
                  textDecoration: "none",
                  padding: "0.4375rem",
                  borderRadius: "var(--radius-md)",
                  transition: "background 0.12s",
                }}
              >
                <Plus size={14} />
                Schedule a post
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ─── Recent Posts Table ──────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Recent Posts</h3>
          <Link href="/posts" style={{ fontSize: "0.8rem", color: "var(--color-primary)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}>
            View all posts
            <ChevronRight size={13} />
          </Link>
        </div>

        {loadingPosts ? (
          <div style={{ padding: "1.5rem" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                <Skeleton style={{ width: 48, height: 48, borderRadius: 8 }} />
                <div style={{ flex: 1 }}>
                  <Skeleton style={{ width: "70%", height: 14, marginBottom: 8 }} />
                  <Skeleton style={{ width: "40%", height: 12 }} />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <EmptyState
              icon={<FileText size={32} strokeWidth={1.5} />}
              title="No posts yet"
              description="Create your first post to get started"
              action={{ label: "Create Post", href: "/create" }}
            />
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 300 }}>Content</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <p style={{
                        fontSize: "0.875rem",
                        color: "var(--text-primary)",
                        maxWidth: 320,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {post.content}
                      </p>
                    </td>
                    <td>
                      <StatusBadge status={post.status as Status} />
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                      {post.status === "published"
                        ? formatDate(post.published_at)
                        : formatDate(post.scheduled_at) ?? "Draft"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
