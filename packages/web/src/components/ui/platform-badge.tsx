"use client";

export const PLATFORM_STYLES: Record<string, { color: string; label: string; bg?: string }> = {
  instagram: { color: "#E4405F", label: "Instagram", bg: "#FCE8EC" },
  twitter: { color: "#1DA1F2", label: "Twitter / X", bg: "#E8F6FE" },
  facebook: { color: "#1877F2", label: "Facebook", bg: "#E7F0FE" },
  linkedin: { color: "#0A66C2", label: "LinkedIn", bg: "#E6F0FA" },
  tiktok: { color: "#000000", label: "TikTok", bg: "#F3F3F3" },
  pinterest: { color: "#BD081C", label: "Pinterest", bg: "#FDE8EB" },
  youtube: { color: "#FF0000", label: "YouTube", bg: "#FFE8E8" },
  threads: { color: "#000000", label: "Threads", bg: "#F3F3F3" },
  bluesky: { color: "#0085FF", label: "Bluesky", bg: "#E8F2FF" },
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