"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { socialApi } from "@/lib/api";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const PLATFORM_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  twitter: { bg: "#eff6ff", text: "#1d4ed8", dot: "#1DA1F2" },
  facebook: { bg: "#eff6ff", text: "#1e40af", dot: "#1877F2" },
  instagram: { bg: "#fdf2f8", text: "#9d174d", dot: "#E4405F" },
  linkedin: { bg: "#eef2ff", text: "#3730a3", dot: "#0A66C2" },
  tiktok: { bg: "#f9fafb", text: "#111827", dot: "#000000" },
};

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/* ------------------------------------------------------------------ */
/*  Inline SVG icons                                                  */
/* ------------------------------------------------------------------ */

function IconChevronLeft() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>;
}
function IconChevronRight() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>;
}
function IconPlus() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}
function IconX() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}
function IconEdit() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isToday(year: number, month: number, day: number) {
  const now = new Date();
  return day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
}

function getWeekDates(anchor: Date): Date[] {
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - anchor.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface CalendarPost {
  id: string;
  content: string;
  platform: string;
  scheduled_at: string | null;
  status: string;
}

/* ------------------------------------------------------------------ */
/*  CalendarInner                                                     */
/* ------------------------------------------------------------------ */

function CalendarInner() {
  const searchParams = useSearchParams();
  const brandId = searchParams.get("brandId") || "demo-brand-id";

  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Fetch posts whenever date or brandId changes
  useEffect(() => {
    setLoading(true);
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    socialApi
      .posts(brandId, `startDate=${start}&endDate=${end}&limit=200`)
      .then((data: any) => setPosts(data.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [brandId, year, month]);

  const navigate = (dir: number) => {
    setCurrentDate(new Date(year, month + dir, 1));
  };

  const goToToday = () => setCurrentDate(new Date());

  const getPostsForDate = (key: string) =>
    posts.filter((p) => p.scheduled_at?.startsWith(key));

  /* Drag-and-drop rescheduling */
  const handleDragStart = (id: string) => setDraggingId(id);
  const handleDragOver = (key: string, e: React.DragEvent) => {
    e.preventDefault();
    setDropTarget(key);
  };
  const handleDrop = async (key: string) => {
    if (!draggingId || !key) return;
    setDraggingId(null);
    setDropTarget(null);
    if (rescheduling) return;
    const post = posts.find((p) => p.id === draggingId);
    if (!post || post.scheduled_at?.startsWith(key)) return;
    const newDate = new Date(`${key}T${(post.scheduled_at || "").split("T")[1] || "12:00:00"}`);
    setRescheduling(true);
    try {
      await socialApi.updatePost(brandId, draggingId, {
        scheduledAt: newDate.toISOString(),
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === draggingId
            ? { ...p, scheduled_at: newDate.toISOString() }
            : p,
        ),
      );
    } catch {
      // silently ignore — post stays in original position
    } finally {
      setRescheduling(false);
    }
  };
  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTarget(null);
  };

  const weekDates = getWeekDates(currentDate);

  const totalScheduled = posts.filter((p) => p.status === "scheduled").length;
  const totalPublished = posts.filter((p) => p.status === "published").length;
  const totalDraft = posts.filter((p) => p.status === "draft").length;
  const platformCount = new Set(posts.map((p) => p.platform)).size;

  /* ── Post chip component ── */
  const PostChip = ({ post }: { post: CalendarPost }) => {
    const platform = (Array.isArray(post.platform)
      ? post.platform[0]
      : typeof post.platform === "string"
      ? post.platform
      : "twitter") as string;
    const colors = PLATFORM_COLORS[platform] || PLATFORM_COLORS.twitter;
    const time = post.scheduled_at
      ? new Date(post.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";

    return (
      <div
        draggable
        onDragStart={() => handleDragStart(post.id)}
        onDragEnd={handleDragEnd}
        onClick={() => setSelectedPost(post)}
        style={{
          padding: "0.2rem 0.5rem",
          borderRadius: 6,
          background: colors.bg,
          color: colors.text,
          fontSize: "0.72rem",
          fontWeight: 500,
          cursor: "grab",
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
          userSelect: "none",
          opacity: draggingId === post.id ? 0.4 : 1,
          transition: "opacity 0.15s",
          overflow: "hidden",
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: colors.dot, flexShrink: 0, display: "inline-block" }} />
        {time && <span style={{ opacity: 0.65, flexShrink: 0 }}>{time}</span>}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {post.content?.slice(0, 30) || "Post"}
        </span>
      </div>
    );
  };

  /* ── Day cell for month view ── */
  const DayCell = ({ day }: { day: number }) => {
    const key = dateKey(year, month, day);
    const dayPosts = getPostsForDate(key);
    const today = isToday(year, month, day);
    const isDropTarget = dropTarget === key;

    return (
      <div
        onDragOver={(e) => handleDragOver(key, e)}
        onDrop={() => handleDrop(key)}
        style={{
          minHeight: 100,
          borderRight: "1px solid #f3f4f6",
          borderBottom: "1px solid #f3f4f6",
          padding: "0.375rem",
          background: isDropTarget ? "#f0fdf4" : today ? "#f0fdfa" : "transparent",
          transition: "background 0.1s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
          <span style={{
            fontSize: "0.8125rem",
            fontWeight: 500,
            width: 26,
            height: 26,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            background: today ? "#0f766e" : "transparent",
            color: today ? "#fff" : "#374151",
          }}>
            {day}
          </span>
          {dayPosts.length > 0 && (
            <span style={{ fontSize: "0.6875rem", color: "#9ca3af" }}>{dayPosts.length}</span>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {dayPosts.slice(0, 3).map((p) => <PostChip key={p.id} post={p} />)}
          {dayPosts.length > 3 && (
            <span style={{ fontSize: "0.68rem", color: "#9ca3af", paddingLeft: 4 }}>
              +{dayPosts.length - 3} more
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Calendar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Schedule and manage posts — drag to reschedule</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 text-sm">
            {(["month", "week"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  viewMode === mode
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <Link
            href={`/social/create?brandId=${brandId}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium text-sm hover:bg-teal-700 transition-colors"
          >
            <IconPlus /> New Post
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Scheduled", value: totalScheduled, color: "text-blue-600" },
          { label: "Published", value: totalPublished, color: "text-green-600" },
          { label: "Drafts", value: totalDraft, color: "text-amber-600" },
          { label: "Platforms", value: platformCount, color: "text-teal-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Navigation bar */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <IconChevronLeft />
          </button>
          <h2 className="text-base font-semibold text-gray-900 min-w-[180px] text-center">
            {viewMode === "week"
              ? `${weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
              : `${MONTH_NAMES[month]} ${year}`}
          </h2>
          <button
            onClick={() => navigate(1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <IconChevronRight />
          </button>
        </div>
        <button
          onClick={goToToday}
          className="px-3 py-1.5 text-sm font-medium text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
        >
          Today
        </button>
      </div>

      {/* Platform legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(PLATFORM_COLORS).map(([name, colors]) => (
          <span key={name} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors.dot, display: "inline-block" }} />
            {name.charAt(0).toUpperCase() + name.slice(1)}
          </span>
        ))}
        {rescheduling && (
          <span className="text-xs text-teal-600 font-medium animate-pulse">Rescheduling...</span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
      ) : viewMode === "month" ? (
        /* ── Month View ── */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="grid grid-cols-7 border-b border-gray-100">
            {WEEK_DAYS.map((d) => (
              <div key={d} className="py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDayOfMonth(year, month) }).map((_, i) => (
              <div key={`pad-${i}`} style={{ minHeight: 100, borderRight: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6", background: "#fafafa" }} />
            ))}
            {Array.from({ length: daysInMonth(year, month) }).map((_, i) => (
              <DayCell key={i + 1} day={i + 1} />
            ))}
          </div>
        </div>
      ) : (
        /* ── Week View ── */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="grid grid-cols-7 border-b border-gray-100">
            {weekDates.map((date) => {
              const today = date.toDateString() === new Date().toDateString();
              return (
                <div key={date.toISOString()} className="py-3 text-center border-r border-gray-100 last:border-r-0">
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    {WEEK_DAYS[date.getDay()]}
                  </div>
                  <div className={`mt-1 text-base font-semibold mx-auto w-8 h-8 flex items-center justify-center rounded-full ${today ? "bg-teal-600 text-white" : "text-gray-700"}`}>
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-7 min-h-[400px]">
            {weekDates.map((date) => {
              const key = date.toISOString().split("T")[0];
              const dayPosts = getPostsForDate(key);
              const isDropTarget = dropTarget === key;

              return (
                <div
                  key={key}
                  onDragOver={(e) => handleDragOver(key, e)}
                  onDrop={() => handleDrop(key)}
                  style={{
                    borderRight: "1px solid #f3f4f6",
                    padding: "0.5rem",
                    background: isDropTarget ? "#f0fdf4" : "transparent",
                    transition: "background 0.1s",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                  className="last:border-r-0"
                >
                  {dayPosts.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-xs text-gray-300">No posts</span>
                    </div>
                  ) : (
                    dayPosts.map((p) => <PostChip key={p.id} post={p} />)
                  )}
                  <Link
                    href={`/social/create?brandId=${brandId}&date=${key}`}
                    className="mt-auto text-xs text-gray-300 hover:text-teal-600 text-center py-1 transition-colors"
                  >
                    + Add
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Post detail modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                {(() => {
                  const platform =
                    typeof selectedPost.platform === "string"
                      ? selectedPost.platform
                      : "twitter";
                  const colors = PLATFORM_COLORS[platform] || PLATFORM_COLORS.twitter;
                  return (
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      padding: "0.25rem 0.75rem",
                      borderRadius: 9999,
                      background: colors.bg,
                      color: colors.text,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: colors.dot, display: "inline-block" }} />
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </span>
                  );
                })()}
                <p className="text-xs text-gray-400 mt-1">
                  {selectedPost.scheduled_at
                    ? new Date(selectedPost.scheduled_at).toLocaleString()
                    : "Unscheduled"}
                </p>
              </div>
              <button onClick={() => setSelectedPost(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <IconX />
              </button>
            </div>

            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed mb-4">
              {selectedPost.content}
            </p>

            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                selectedPost.status === "published"
                  ? "bg-green-100 text-green-700"
                  : selectedPost.status === "scheduled"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600"
              }`}>
                {selectedPost.status}
              </span>
              <div className="flex-1" />
              <Link
                href={`/social/posts/${selectedPost.id}?brandId=${brandId}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <IconEdit /> Edit
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContentCalendarPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>}>
      <CalendarInner />
    </Suspense>
  );
}
