"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MoreHorizontal,
  Edit3,
  Trash2,
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  addWeeks,
  subWeeks,
  startOfDay,
} from "date-fns";
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
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  channels?: Array<{
    channel_id: string;
    platform: string;
    status: string;
    platform_post_id: string | null;
    platform_post_url: string | null;
  }>;
};

export default function ContentCalendarPage() {
  const router = useRouter();
  const [view, setView] = useState<"month" | "week">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [brandId, setBrandId] = useState<string | null>(null);
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingPost, setDraggingPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hoverDay, setHoverDay] = useState<Date | null>(null);

  useEffect(() => {
    api.brands
      .list()
      .then((res) => {
        setBrands(res.data.map((b) => ({ id: b.id, name: b.name })));
        if (res.data.length > 0) setBrandId(res.data[0].id);
      })
      .catch(() => setError("Failed to load brands"));
  }, []);

  useEffect(() => {
    if (!brandId) return;
    setLoading(true);
    api.posts
      .list({ brand_id: brandId, limit: 200 })
      .then((res) => {
        setPosts(res.data);
      })
      .catch(() => setError("Failed to load posts"))
      .finally(() => setLoading(false));
  }, [brandId]);

  const days = useMemo(() => {
    if (view === "month") {
      return eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentDate)),
        end: endOfWeek(endOfMonth(currentDate)),
      });
    }
    return eachDayOfInterval({
      start: startOfWeek(currentDate),
      end: endOfWeek(currentDate),
    });
  }, [currentDate, view]);

  const postsByDay = useMemo(() => {
    const map = new Map<string, Post[]>();
    posts.forEach((post) => {
      const dateKey = post.scheduled_at
        ? format(parseISO(post.scheduled_at), "yyyy-MM-dd")
        : post.published_at
        ? format(parseISO(post.published_at), "yyyy-MM-dd")
        : null;
      if (!dateKey) return;
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(post);
    });
    return map;
  }, [posts]);

  function navigate(direction: "prev" | "next") {
    if (view === "month") {
      setCurrentDate(direction === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else {
      setCurrentDate(direction === "prev" ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    }
  }

  function handleDragStart(post: Post) {
    setDraggingPost(post);
  }

  async function handleDrop(day: Date) {
    if (!draggingPost || !draggingPost.scheduled_at) return;
    const originalDate = parseISO(draggingPost.scheduled_at);
    const newDate = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      originalDate.getHours(),
      originalDate.getMinutes()
    );
    const iso = newDate.toISOString();
    setDraggingPost(null);
    try {
      await api.posts.update(draggingPost.id, { scheduled_at: iso });
      setPosts((prev) =>
        prev.map((p) => (p.id === draggingPost.id ? { ...p, scheduled_at: iso } : p))
      );
    } catch {
      setError("Failed to reschedule post");
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

  const headerDate = format(
    currentDate,
    view === "month" ? "MMMM yyyy" : "MMM d, yyyy"
  );

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Content Calendar</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Drag and drop posts to reschedule.
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
          <div className="flex rounded-lg border border-[var(--border-default)] bg-white p-1">
            <button
              onClick={() => setView("month")}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md",
                view === "month" ? "bg-[var(--color-primary)] text-white" : "text-[var(--text-secondary)]"
              )}
            >
              Month
            </button>
            <button
              onClick={() => setView("week")}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md",
                view === "week" ? "bg-[var(--color-primary)] text-white" : "text-[var(--text-secondary)]"
              )}
            >
              Week
            </button>
          </div>
          <button
            onClick={() => navigate("prev")}
            className="rounded-lg border border-[var(--border-default)] bg-white p-2 hover:bg-[var(--bg-hover)]"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="min-w-[140px] text-center text-sm font-medium">{headerDate}</span>
          <button
            onClick={() => navigate("next")}
            className="rounded-lg border border-[var(--border-default)] bg-white p-2 hover:bg-[var(--bg-hover)]"
          >
            <ChevronRight size={18} />
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

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center text-sm text-[var(--text-muted)]">
          Loading calendar...
        </div>
      ) : (
        <>
          {view === "month" && (
            <div className="grid grid-cols-7 gap-px rounded-xl border border-[var(--border-default)] bg-[var(--border-default)] overflow-hidden">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="bg-[var(--bg-subtle)] p-2 text-center text-xs font-semibold text-[var(--text-secondary)]">
                  {d}
                </div>
              ))}
              {days.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayPosts = postsByDay.get(dateKey) || [];
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, new Date());
                return (
                  <div
                    key={dateKey}
                    className={cn(
                      "min-h-[120px] bg-white p-2 transition hover:bg-[var(--bg-hover)]",
                      !isCurrentMonth ? "bg-[var(--bg-subtle)]/50" : ""
                    )}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setHoverDay(day);
                    }}
                    onDragLeave={() => setHoverDay(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setHoverDay(null);
                      handleDrop(day);
                    }}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          isToday ? "rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-white" : "text-[var(--text-primary)]"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      {hoverDay && isSameDay(hoverDay, day) && draggingPost && (
                        <span className="text-[10px] text-[var(--color-primary)]">Drop here</span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {dayPosts.map((post) => (
                        <div
                          key={post.id}
                          draggable
                          onDragStart={() => handleDragStart(post)}
                          className="group cursor-move rounded-md border border-[var(--border-default)] bg-white p-2 text-xs shadow-sm transition hover:shadow-md"
                        >
                          <div className="mb-1 flex items-center gap-1">
                            {post.channels?.slice(0, 3).map((ch) => (
                              <span
                                key={ch.channel_id}
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: PLATFORM_COLORS[ch.platform.toLowerCase()] || "#9ca3af" }}
                                title={PLATFORM_LABELS[ch.platform.toLowerCase()] || ch.platform}
                              />
                            ))}
                            <span className="ml-auto text-[10px] text-[var(--text-muted)]">
                              {post.scheduled_at ? format(parseISO(post.scheduled_at), "h:mm a") : "—"}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-[11px] text-[var(--text-primary)]">
                            {post.content || "(no caption)"}
                          </p>
                          <div className="mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100">
                            <button
                              onClick={() => router.push(`/create-post?edit=${post.id}`)}
                              className="rounded p-1 hover:bg-[var(--bg-hover)]"
                              title="Edit"
                            >
                              <Edit3 size={10} />
                            </button>
                            <button
                              onClick={() => deletePost(post.id)}
                              className="rounded p-1 text-red-500 hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 size={10} />
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

          {view === "week" && (
            <div className="space-y-3">
              {days.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayPosts = postsByDay.get(dateKey) || [];
                return (
                  <div
                    key={dateKey}
                    className="flex gap-4 rounded-xl border border-[var(--border-default)] bg-white p-4"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(day)}
                  >
                    <div className="w-24 shrink-0 text-center">
                      <div className="text-lg font-semibold">{format(day, "d")}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{format(day, "EEEE")}</div>
                    </div>
                    <div className="flex-1 space-y-2">
                      {dayPosts.length === 0 && (
                        <div className="text-sm text-[var(--text-muted)]">No posts scheduled.</div>
                      )}
                      {dayPosts.map((post) => (
                        <div
                          key={post.id}
                          draggable
                          onDragStart={() => handleDragStart(post)}
                          className="flex cursor-move items-center justify-between rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex -space-x-1">
                              {post.channels?.map((ch) => (
                                <span
                                  key={ch.channel_id}
                                  className="h-3 w-3 rounded-full border border-white"
                                  style={{ backgroundColor: PLATFORM_COLORS[ch.platform.toLowerCase()] || "#9ca3af" }}
                                  title={PLATFORM_LABELS[ch.platform.toLowerCase()] || ch.platform}
                                />
                              ))}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{post.content.slice(0, 80) || "(no caption)"}</p>
                              <p className="text-xs text-[var(--text-muted)]">
                                {post.scheduled_at ? format(parseISO(post.scheduled_at), "h:mm a") : "No time"} · {post.status}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => router.push(`/create-post?edit=${post.id}`)}
                              className="rounded p-2 hover:bg-white"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => deletePost(post.id)}
                              className="rounded p-2 text-red-500 hover:bg-white"
                            >
                              <Trash2 size={14} />
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
        </>
      )}
    </div>
  );
}
