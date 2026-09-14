"use client";

type Status = "published" | "scheduled" | "draft" | "failed" | "pending";

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
