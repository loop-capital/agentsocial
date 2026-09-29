"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  Filter,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { format, parseISO, isPast, isFuture, isToday } from "date-fns";
import { api } from "../../../lib/api";
import { cn } from "../../../lib/utils";

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#e4405f",
  tiktok: "#000000",
  facebook: "#1877f2",
  youtube: "#ff0000",
  x: "#1da1f2",
  linkedin: "#0a66c2",
  gbp: "#9ca3af",
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  youtube: "YouTube",
  x: "X",
  linkedin: "LinkedIn",
  gbp: "GBP",
};

type Post = {
  id: string;
  brand_id: string;
  content: string;
  status: "draft" | "scheduled" | "published" | "failed";
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  channels?: Array<{
    channel_id: string;
    platform: string;
    status: "pending" | "posted" | "failed";
    platform_post_id: string | null;
    platform_post_url: string | null;
    published_at: string | null;
  }>;
};

export default function QueuePage() {
  const router = useRouter();
  const [brandId, setBrandId] = useState<string | null>(null);
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "posted" | "failed">("all");
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    api.brands
      .list()
      .then((res) => {
        setBrands(res.data.map((b) => ({ id: b.id, name: b.name })));
        if (res.data.length > 0) setBrandId(res.data[0].id);
      })
      .catch(() => setError("Failed to load brands"));
  }, []);

  const loadPosts = async () => {
    if (!brandId) return;
    setLoading(true);
    try {
      const res = await api.posts.list({ brand_id: brandId, limit: 200 });
      setPosts(res.data as Post[]);
    } catch {
      setError("Failed to load queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [brandId]);

  const filteredPosts = useMemo(() => {
    const now = new Date();
    return posts.filter((post) => {
      if (filter === "upcoming") return post.status === "scheduled" && post.scheduled_at && isFuture(parseISO(post.scheduled_at));
      if (filter === "posted") return post.status === "published" || post.status === "scheduled" && post.scheduled_at && isPast(parseISO(post.scheduled_at));
      if (filter === "failed") return post.status === "failed" || post.channels?.some((c) => c.status === "failed");
      return true;
    });
  }, [posts, filter]);

  async function pauseResumePost(id: string, current: string) {
    try {
      if (current === "scheduled") {
        await api.posts.cancel(id);
      } else {
        await api.posts.publish(id);
      }
      await loadPosts();
    } catch {
      setError("Failed to update post status");
    }
  }

  async function deletePost(id: string) {
    if (!confirm("Delete this post?")) return;
    try {
      await api.posts.delete(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError("Failed to delete post");
    }
  }

  function toggleQueue() {
    setPaused((p) => !p);
  }

  const grouped = useMemo(() => {
    const map = new Map<string, Post[]>();
    filteredPosts.forEach((post) => {
      const key = post.scheduled_at
        ? format(parseISO(post.scheduled_at), "yyyy-MM-dd")
        : post.published_at
        ? format(parseISO(post.published_at), "yyyy-MM-dd")
        : "Unscheduled";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(post);
    });
    return Array.from(map.entries()).sort(([a], [b]) => (a === "Unscheduled" ? 1 : b === "Unscheduled" ? -1 : a.localeCompare(b)));
  }, [filteredPosts]);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Queue</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Upcoming posts and publishing status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="rounded-md border border-[var(--border-default)] bg-white px-3 py-2 text-sm"
            value={brandId || ""}
            onChange={(e) => setBrandId(e.target.value)}
          >
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => router.push("/content-calendar")}
            className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-white px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
          >
            <Calendar size={16} />
            Calendar
          </button>
          <button
            onClick={() => router.push("/create-post")}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
          >
            <Plus size={16} />
            New Post
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border-default)] bg-white p-4 shadow-sm">
        <div className="flex gap-2">
          {["all", "upcoming", "posted", "failed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition",
                filter === f ? "bg-[var(--color-primary)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleQueue}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
              paused
                ? "bg-[var(--color-warning-bg)] text-[var(--color-warning)]"
                : "bg-[var(--color-success-bg)] text-[var(--color-success)]"
            )}
          >
            {paused ? <Play size={16} /> : <Pause size={16} />}
            {paused ? "Queue Paused" : "Queue Active"}
          </button>
          <button
            onClick={loadPosts}
            className="rounded-lg border border-[var(--border-default)] bg-white p-2 hover:bg-[var(--bg-hover)]"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-sm text-[var(--text-muted)]">
          Loading queue...
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-default)] bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-light)]">
            <Calendar size={24} className="text-[var(--color-primary)]" />
          </div>
          <h3 className="text-lg font-medium">No posts in queue</h3>
          <p className="mb-4 text-sm text-[var(--text-secondary)]">
            {filter === "all" ? "Start creating content for your channels." : `No ${filter} posts found.`}
          </p>
          <button
            onClick={() => router.push("/create-post")}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
          >
            Create Post
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([dateKey, dayPosts]) => {
            const dateLabel =
              dateKey === "Unscheduled"
                ? "Unscheduled"
                : isToday(parseISO(dateKey))
                ? "Today"
                : format(parseISO(dateKey), "EEEE, MMMM d, yyyy");
            return (
              <div key={dateKey} className="rounded-xl border border-[var(--border-default)] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <Clock size={16} className="text-[var(--color-primary)]" />
                  {dateLabel}
                  <span className="ml-2 rounded-full bg-[var(--bg-subtle)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                    {dayPosts.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {dayPosts.map((post) => (
                    <div
                      key={post.id}
                      className="flex flex-col gap-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4 sm:flex-row sm:items-center"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {post.content.slice(0, 120) || "(no caption)"}
                          {post.content.length > 120 && "..."}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
                          <div className="flex -space-x-1">
                            {post.channels?.map((ch) => (
                              <span
                                key={ch.channel_id}
                                className="flex h-5 w-5 items-center justify-center rounded-full border border-white text-[8px] font-bold text-white"
                                style={{ backgroundColor: PLATFORM_COLORS[ch.platform.toLowerCase()] || "#9ca3af" }}
                                title={PLATFORM_LABELS[ch.platform.toLowerCase()] || ch.platform}
                              >
                                {ch.platform[0].toUpperCase()}
                              </span>
                            ))}
                          </div>
                          {post.scheduled_at && (
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {format(parseISO(post.scheduled_at), "h:mm a")}
                            </span>
                          )}
                          <StatusBadge status={post.status} />
                        </div>
                        {post.channels && post.channels.some((c) => c.status === "failed") && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                            <AlertCircle size={12} />
                            One or more platforms failed to publish
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/create-post?edit=${post.id}`)}
                          className="rounded-lg border border-[var(--border-default)] bg-white p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>
                        {post.status === "scheduled" && (
                          <button
                            onClick={() => pauseResumePost(post.id, post.status)}
                            className="rounded-lg border border-[var(--border-default)] bg-white p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                            title="Pause / Cancel"
                          >
                            <Pause size={16} />
                          </button>
                        )}
                        {post.status === "draft" && (
                          <button
                            onClick={() => pauseResumePost(post.id, post.status)}
                            className="rounded-lg bg-[var(--color-success)] p-2 text-white hover:opacity-90"
                            title="Publish now"
                          >
                            <Play size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => deletePost(post.id)}
                          className="rounded-lg border border-[var(--border-default)] bg-white p-2 text-red-500 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    scheduled: "bg-blue-50 text-blue-600",
    published: "bg-green-50 text-green-600",
    failed: "bg-red-50 text-red-600",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", styles[status] || styles.draft)}>
      {status}
    </span>
  );
}
