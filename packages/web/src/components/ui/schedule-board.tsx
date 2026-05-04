"use client";

import { ReactNode } from "react";

interface ScheduleBoardProps {
  children?: ReactNode;
}

const NEXT_DAYS = [
  { label: "Today", date: new Date("2026-04-24") },
  { label: "Tomorrow", date: new Date("2026-04-25") },
  { label: "May 5", date: new Date("2026-05-05") },
];

export function ScheduleBoard({ children }: ScheduleBoardProps) {
  return (
    <div className="card">
      <div className="card-header">
        <h3 style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Schedule Queue</h3>
        <a href="/calendar" style={{ fontSize: "0.8rem", color: "var(--color-primary)", textDecoration: "none" }}>
          View calendar
        </a>
      </div>
      {children}
    </div>
  );
}