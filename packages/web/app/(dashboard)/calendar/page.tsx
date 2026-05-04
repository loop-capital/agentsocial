"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";
import { PlatformBadge } from "../../../components/ui/platform-badge";
import { EmptyState } from "../../../components/ui/empty-state";
import { MOCK_CALENDAR_EVENTS, CalendarEvent } from "../../../lib/mock-data";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E4405F",
  twitter: "#1DA1F2",
  facebook: "#1877F2",
  linkedin: "#0A66C2",
  tiktok: "#000000",
  pinterest: "#BD081C",
  youtube: "#FF0000",
  threads: "#000000",
};

interface CalendarCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

function buildCalendarDays(year: number, month: number): CalendarCell[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const today = new Date("2026-04-24");

  const cells: CalendarCell[] = [];

  // Pad with days from previous month
  const startPad = firstDay.getDay();
  for (let i = startPad - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    cells.push({ date: d, isCurrentMonth: false, isToday: false, events: [] });
  }

  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    const dateStr = date.toISOString().split("T")[0];
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
    const events = MOCK_CALENDAR_EVENTS.filter((e) => e.date === dateStr);
    cells.push({ date, isCurrentMonth: true, isToday, events });
  }

  // Pad with days from next month
  const endPad = 42 - cells.length; // 6 rows × 7 cols = 42
  for (let i = 1; i <= endPad; i++) {
    const d = new Date(year, month + 1, i);
    cells.push({ date: d, isCurrentMonth: false, isToday: false, events: [] });
  }

  return cells;
}

export default function CalendarPage() {
  const today = new Date("2026-04-24");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const cells = useMemo(() => buildCalendarDays(year, month), [year, month]);

  const monthName = new Date(year, month).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  };

  const goToToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  // Count events by status for the month
  const monthEvents = cells.filter((c) => c.isCurrentMonth);
  const publishedCount = monthEvents.reduce(
    (s, c) => s + c.events.filter((e) => e.status === "published").length,
    0
  );
  const scheduledCount = monthEvents.reduce(
    (s, c) => s + c.events.filter((e) => e.status === "scheduled").length,
    0
  );

  return (
    <div>
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1>Calendar</h1>
          <p>View and manage your scheduled content</p>
        </div>
        <Link href="/create" className="btn btn-primary">
          <Plus size={16} />
          Schedule Post
        </Link>
      </div>

      {/* ─── Summary Stats ─────────────────────────────── */}
      <div style={{
        display: "flex",
        gap: "1rem",
        marginBottom: "1.5rem",
        flexWrap: "wrap",
      }}>
        {[
          { label: "Total Posts", value: publishedCount + scheduledCount, color: "var(--text-primary)" },
          { label: "Published", value: publishedCount, color: "var(--color-success)" },
          { label: "Scheduled", value: scheduledCount, color: "var(--color-warning)" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="card"
            style={{
              padding: "0.75rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              flex: 1,
              minWidth: 120,
            }}
          >
            <div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: stat.color }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Calendar Nav ──────────────────────────────── */}
      <div className="calendar-nav" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button className="calendar-nav-btn" onClick={prevMonth} aria-label="Previous month">
            <ChevronLeft size={16} />
          </button>
          <h2 className="calendar-month-title">{monthName}</h2>
          <button className="calendar-nav-btn" onClick={nextMonth} aria-label="Next month">
            <ChevronRight size={16} />
          </button>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-secondary btn-sm" onClick={goToToday}>
            <CalendarDays size={14} />
            Today
          </button>
        </div>
      </div>

      {/* ─── Calendar Grid ─────────────────────────────── */}
      <div className="calendar-grid" role="grid" aria-label="Calendar">
        {/* Day headers */}
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="calendar-header-cell" role="columnheader">
            {day}
          </div>
        ))}

        {/* Cells */}
        {cells.map((cell, idx) => {
          const dateKey = cell.date.toISOString();
          const isLastRow = idx >= 35;
          return (
            <div
              key={dateKey}
              className={`calendar-cell ${cell.isToday ? "today" : ""} ${!cell.isCurrentMonth ? "other-month" : ""}`}
              style={{ minHeight: 100 }}
              role="gridcell"
              aria-label={`${cell.date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}${cell.events.length > 0 ? `, ${cell.events.length} posts` : ""}`}
            >
              <div className="calendar-day-number">
                {cell.date.getDate()}
              </div>

              {/* Events */}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {cell.events.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="calendar-event"
                    style={{
                      backgroundColor: `${PLATFORM_COLORS[event.platform] ?? "#6b7280"}20`,
                      color: PLATFORM_COLORS[event.platform] ?? "#6b7280",
                    }}
                    onClick={() => setSelectedEvent(event)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedEvent(event)}
                  >
                    <span
                      className="calendar-event-dot"
                      style={{ backgroundColor: PLATFORM_COLORS[event.platform] ?? "#6b7280" }}
                    />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {event.content}
                    </span>
                  </div>
                ))}

                {cell.events.length > 3 && (
                  <div style={{
                    fontSize: "0.6875rem",
                    color: "var(--text-muted)",
                    paddingLeft: "0.375rem",
                  }}>
                    +{cell.events.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Event Detail Modal ────────────────────────── */}
      {selectedEvent && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setSelectedEvent(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Post details"
        >
          <div className="modal">
            <div className="modal-header">
              <h2>Scheduled Post</h2>
              <button className="modal-close" onClick={() => setSelectedEvent(null)} aria-label="Close">
                ×
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <PlatformBadge platform={selectedEvent.platform} />
                <span style={{
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  padding: "0.2rem 0.5rem",
                  borderRadius: "var(--radius-full)",
                  background: selectedEvent.status === "published" ? "var(--color-success-bg)" : "var(--color-warning-bg)",
                  color: selectedEvent.status === "published" ? "var(--color-success)" : "var(--color-warning)",
                }}>
                  {selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
                </span>
              </div>

              <p style={{
                fontSize: "0.9375rem",
                color: "var(--text-primary)",
                lineHeight: 1.6,
                marginBottom: "1rem",
              }}>
                {selectedEvent.content}
              </p>

              <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                {new Date(selectedEvent.date + "T12:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedEvent(null)}>
                Close
              </button>
              <Link href={`/posts?search=${encodeURIComponent(selectedEvent.content.slice(0, 30))}`} className="btn btn-primary">
                View Post
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─── Platform Legend ───────────────────────────── */}
      <div style={{
        marginTop: "1rem",
        padding: "0.875rem 1rem",
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-md)",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
        fontSize: "0.8rem",
        color: "var(--text-muted)",
      }}>
        <span style={{ fontWeight: 500 }}>Platforms:</span>
        {Object.entries(PLATFORM_COLORS).map(([platform, color]) => (
          <span key={platform} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
            {platform.charAt(0).toUpperCase() + platform.slice(1)}
          </span>
        ))}
      </div>
    </div>
  );
}
