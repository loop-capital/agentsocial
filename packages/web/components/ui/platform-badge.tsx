"use client";

const PLATFORM_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  twitter: { bg: "#E8F4FD", color: "#1DA1F2", label: "Twitter" },
  instagram: { bg: "#FCE8EF", color: "#E4405F", label: "Instagram" },
  facebook: { bg: "#E8F0FE", color: "#1877F2", label: "Facebook" },
  linkedin: { bg: "#E8EEF8", color: "#0A66C2", label: "LinkedIn" },
  tiktok: { bg: "#F0F0F0", color: "#000000", label: "TikTok" },
  pinterest: { bg: "#FCE8E8", color: "#BD081C", label: "Pinterest" },
  youtube: { bg: "#FEE8E8", color: "#FF0000", label: "YouTube" },
  threads: { bg: "#F5F5F5", color: "#000000", label: "Threads" },
  bluesky: { bg: "#E8F4FD", color: "#0085FF", label: "Bluesky" },
};

interface PlatformBadgeProps {
  platform: string;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function PlatformBadge({ platform, showLabel = true, size = "md" }: PlatformBadgeProps) {
  const style = PLATFORM_STYLES[platform.toLowerCase()] ?? {
    bg: "#F5F5F5",
    color: "#6B7280",
    label: platform,
  };

  return (
    <span
      className={`platform-badge platform-badge-${size}`}
      style={{ backgroundColor: style.bg, color: style.color }}
      aria-label={style.label}
    >
      <span className="platform-dot" style={{ backgroundColor: style.color }} />
      {showLabel && <span>{style.label}</span>}
    </span>
  );
}

export { PLATFORM_STYLES };
