"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Eye,
  Users,
  Heart,
  Download,
  ChevronUp,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { StatCard } from "@/components/ui/stat-card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "../../../lib/api";

type DateRange = "7d" | "30d" | "90d";

type AnalyticsData = {
  period: { start: string | null; end: string | null; range: string };
  summary: {
    total_followers: number;
    followers_growth: number;
    followers_growth_percent: number;
    total_impressions: number;
    total_engagements: number;
    engagement_rate: number;
    posts_published: number;
    avg_posts_per_day: number;
  };
  daily_trend: Array<{
    date: string;
    impressions: number;
    engagements: number;
    followers: number;
  }>;
};

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>("7d");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brandId, setBrandId] = useState<string | null>(null);

  // Load brand first, then analytics
  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!brandId) {
        const brandsRes = await api.brands.list();
        const brands = brandsRes.data || [];
        if (brands.length === 0) {
          setLoading(false);
          return;
        }
        const id = brands[0].id;
        setBrandId(id);
        const res = await api.analytics.summary(id, dateRange);
        setAnalytics(res as unknown as AnalyticsData);
      } else {
        const res = await api.analytics.summary(brandId, dateRange);
        setAnalytics(res as unknown as AnalyticsData);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [brandId, dateRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const summary = analytics?.summary;
  const dailyTrend = analytics?.daily_trend || [];

  const timeSeriesData = dailyTrend.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  const hasData = summary && summary.total_impressions > 0;

  return (
    <div>
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1>Analytics</h1>
          <p>Track performance across all your connected channels</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-secondary">
            <Download size={15} /> Export CSV
          </button>
          <button className="btn btn-secondary">
            <Download size={15} /> Export PDF
          </button>
        </div>
      </div>

      {/* Date Range */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <DateRangePicker
          value={dateRange}
          onChange={(v) => setDateRange(v as DateRange)}
          options={[
            { value: "7d", label: "Last 7 days" },
            { value: "30d", label: "Last 30 days" },
            { value: "90d", label: "Last 90 days" },
          ]}
        />
      </div>

      {error && (
        <div style={{ background: "#2d1a1a", border: "1px solid #c0392b", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1rem", color: "#e74c3c" }}>
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="stat-card" style={{ padding: "1.25rem" }}>
                <Skeleton style={{ width: "60%", height: 12, marginBottom: 12 }} />
                <Skeleton style={{ width: "40%", height: 28, marginBottom: 8 }} />
                <Skeleton style={{ width: "50%", height: 12 }} />
              </div>
            ))}
          </>
        ) : !hasData ? (
          <div style={{ gridColumn: "1 / -1", padding: "2rem", textAlign: "center" }}>
            <EmptyState
              icon={<TrendingUp size={32} strokeWidth={1.5} />}
              title="No data yet"
              description="Start posting to see analytics"
              action={{ label: "Create Post", href: "/create" }}
            />
          </div>
        ) : (
          <>
            <StatCard
              label="Total Impressions"
              value={summary!.total_impressions >= 1000 ? `${(summary!.total_impressions / 1000).toFixed(1)}K` : summary!.total_impressions.toString()}
              change={dateRange}
              changeType="neutral"
              icon={<Eye size={14} />}
            />
            <StatCard
              label="Total Engagements"
              value={summary!.total_engagements.toLocaleString()}
              change={`${summary!.engagement_rate.toFixed(2)}% rate`}
              changeType="neutral"
              icon={<Heart size={14} />}
            />
            <StatCard
              label="Engagement Rate"
              value={`${summary!.engagement_rate.toFixed(2)}%`}
              change={summary!.avg_posts_per_day > 0 ? `${summary!.avg_posts_per_day.toFixed(1)} posts/day` : undefined}
              changeType="neutral"
              icon={<TrendingUp size={14} />}
            />
            <StatCard
              label="New Followers"
              value={`+${summary!.followers_growth}`}
              change={`${summary!.followers_growth_percent.toFixed(1)}%`}
              changeType={summary!.followers_growth >= 0 ? "positive" : "negative"}
              icon={<Users size={14} />}
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      {hasData && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3 className="chart-card-title">Performance Over Time</h3>
                <p className="chart-card-subtitle">Impressions &amp; Engagements</p>
              </div>
            </div>
            <div style={{ padding: "0.5rem 0.25rem 1.25rem" }}>
              {loading ? (
                <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
                </div>
              ) : timeSeriesData.length === 0 ? (
                <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                  No data for selected period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={timeSeriesData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} interval={Math.floor(Math.max(timeSeriesData.length / 6, 1))} />
                    <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                    <Tooltip contentStyle={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: "0.8125rem", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)" }} />
                    <Legend wrapperStyle={{ fontSize: "0.8125rem", paddingTop: "0.5rem" }} iconType="circle" iconSize={8} />
                    <Line type="monotone" dataKey="impressions" stroke="#3B82F6" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "#3B82F6" }} />
                    <Line type="monotone" dataKey="engagements" stroke="#10B981" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "#10B981" }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
