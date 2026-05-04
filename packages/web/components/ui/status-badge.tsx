"use client";

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  published: { bg: "#DCFCE7", color: "#16A34A", label: "Published" },
  scheduled: { bg: "#FEF3C7", color: "#D97706", label: "Scheduled" },
  draft: { bg: "#F3F4F6", color: "#6B7280", label: "Draft" },
  failed: { bg: "#FEE2E2", color: "#DC2626", label: "Failed" },
  cancelled: { bg: "#FEE2E2", color: "#DC2626", label: "Cancelled" },
};

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const style = STATUS_STYLES[status.toLowerCase()] ?? {
    bg: "#F3F4F6",
    color: "#6B7280",
    label: status,
  };

  return (
    <span
      className={`status-badge status-badge-${size}`}
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      <span className="status-dot" style={{ backgroundColor: style.color }} />
      {style.label}
    </span>
  );
}
