"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek, addMonths, subMonths, isSameDay } from "date-fns";
import { PLATFORM_STYLES } from "./platform-badge";
import { MOCK_CALENDAR_EVENTS } from "../../../lib/mock-data";

export function CalendarWidget() {
  const [currentDate, setCurrentDate] = useState(new Date("2026-04-24"));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof MOCK_CALENDAR_EVENTS> = {};
    MOCK_CALENDAR_EVENTS.forEach((ev) => {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    return map;
  }, []);

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const formatDateKey = (d: Date) => format(d, "yyyy-MM-dd");

  return (
    <div>
      <div className="calendar-nav">
        <button className="calendar-nav-btn" onClick={prevMonth}>
          <ChevronLeft size={16} />
          Prev
        </button>
        <span className="calendar-month-title">{format(currentDate, "MMMM yyyy")}</span>
        <button className="calendar-nav-btn" onClick={nextMonth}>
          Next
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="calendar-grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="calendar-header-cell">{d}</div>
        ))}

        {days.map((day) => {
          const dateKey = formatDateKey(day);
          const events = eventsByDate[dateKey] ?? [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const today = isToday(day);

          return (
            <div
              key={dateKey}
              className={`calendar-cell${today ? " today" : ""}${!isCurrentMonth ? " other-month" : ""}${selectedDate && isSameDay(day, selectedDate) ? " selected" : ""}`}
              onClick={() => setSelectedDate(selectedDate && isSameDay(day, selectedDate) ? null : day)}
            >
              <div className="calendar-day-number">{format(day, "d")}</div>
              {events.slice(0, 2).map((ev) => {
                const style = PLATFORM_STYLES[ev.platform] ?? { color: "#6b7280" };
                return (
                  <div
                    key={ev.id}
                    className="calendar-event"
                    style={{ background: `${style.color}20`, color: style.color }}
                    title={ev.content}
                  >
                    <span className="calendar-event-dot" style={{ background: style.color }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ev.content}
                    </span>
                  </div>
                );
              })}
              {events.length > 2 && (
                <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", padding: "0 0.25rem" }}>
                  +{events.length - 2} more
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedDate && eventsByDate[formatDateKey(selectedDate)]?.length > 0 && (
        <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)" }}>
          <h4 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Posts on {format(selectedDate, "MMM d, yyyy")}
          </h4>
          {eventsByDate[formatDateKey(selectedDate)].map((ev) => {
            const style = PLATFORM_STYLES[ev.platform] ?? { color: "#6b7280" };
            return (
              <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.375rem 0", borderBottom: "1px solid var(--border-default)" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: style.color }} />
                <span style={{ fontSize: "0.8125rem", flex: 1 }}>{ev.content}</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "capitalize" }}>{ev.platform}</span>
                <span className={`badge badge-sm ${ev.status === "published" ? "badge-success" : "badge-warning"}`}>{ev.status}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}