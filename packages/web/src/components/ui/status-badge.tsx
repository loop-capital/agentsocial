"use client";

export type Status = "published" | "scheduled" | "draft" | "failed" | "pending" | "cancelled" | "queued" | "publishing" | "archived";

interface StatusBadgeProps {
  status: Status;
  size?: "sm" | "md";
}

const STATUS_CONFIG: Record<Status, { label: string; bg: string; color: string; dot: string }> = {
  published: { label: "Published", bg: "#dcfce7", color: "#16a34a", dot: "#16a34a" },
  scheduled: { label: "Scheduled", bg: "#fef3c7", color: "#d97706", dot: "#d97706" },
  draft: { label: "Draft", bg: "#f3f4f6", color: "#6b7280", dot: "#6b7280" },
  failed: { label: "Failed", bg: "#fee2e2", color: "#dc2626", dot: "#dc2626" },
  pending: { label: "Pending", bg: "#f3f4f6", color: "#6b7280", dot: "#6b7280" },
  cancelled: { label: "Cancelled", bg: "#fee2e2", color: "#9ca3af", dot: "#9ca3af" },
  queued: { label: "Queued", bg: "#e0e7ff", color: "#4f46e5", dot: "#4f46e5" },
  publishing: { label: "Publishing", bg: "#dbeafe", color: "#2563eb", dot: "#2563eb" },
  archived: { label: "Archived", bg: "#f3f4f6", color: "#9ca3af", dot: "#9ca3af" },
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span
      className={`status-badge${size === "sm" ? " status-badge-sm" : ""}`}
      style={{ background: config.bg, color: config.color }}
    >
      <span className="status-dot" style={{ background: config.dot }} />
      {config.label}
    </span>
  );
}