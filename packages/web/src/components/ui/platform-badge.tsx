"use client";

export const PLATFORM_STYLES: Record<string, { color: string; label: string }> = {
  instagram: { color: "#E4405F", label: "Instagram" },
  twitter: { color: "#1DA1F2", label: "Twitter / X" },
  facebook: { color: "#1877F2", label: "Facebook" },
  linkedin: { color: "#0A66C2", label: "LinkedIn" },
  tiktok: { color: "#000000", label: "TikTok" },
  pinterest: { color: "#BD081C", label: "Pinterest" },
  youtube: { color: "#FF0000", label: "YouTube" },
  threads: { color: "#000000", label: "Threads" },
  bluesky: { color: "#0085FF", label: "Bluesky" },
};

interface PlatformBadgeProps {
  platform: string;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function PlatformBadge({ platform, showLabel = true, size = "md" }: PlatformBadgeProps) {
  const style = PLATFORM_STYLES[platform];
  if (!style) return null;

  return (
    <span
      className={`platform-badge${size === "sm" ? " platform-badge-sm" : ""}`}
      style={{ background: `${style.color}18`, color: style.color }}
    >
      <span className="platform-dot" style={{ background: style.color }} />
      {showLabel && style.label}
    </span>
  );
}