"use client";

import { Heart, MessageCircle, Share2, Eye, Edit, Trash2, Copy, BarChart2, Send, CalendarOff, Loader2 } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { PlatformBadge, PLATFORM_STYLES } from "./platform-badge";
import { useState } from "react";

interface PostEngagement {
  likes: number;
  comments: number;
  shares: number;
  impressions?: number;
}

interface ChannelStatus {
  channel_id: string;
  platform: string;
  status: string;
}

export interface PostCardData {
  id: string;
  content: string;
  status: string;
  platforms: string[];
  scheduledAt?: string | null;
  publishedAt?: string | null;
  createdAt?: string | null;
  engagement?: PostEngagement;
  mediaThumbnail?: string;
  channels?: ChannelStatus[];
}

interface PostCardProps {
  post: PostCardData;
  viewMode?: "card" | "list";
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onAnalytics?: (id: string) => void;
  onPublish?: (id: string) => void;
  onCancel?: (id: string) => void;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatEngagement(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

const CHANNEL_STATUS_COLORS: Record<string, string> = {
  published: "#16A34A",
  scheduled: "#D97706",
  draft: "#6B7280",
  failed: "#DC2626",
  cancelled: "#DC2626",
  pending: "#3B82F6",
};

function ChannelStatusIcons({ channels }: { channels?: ChannelStatus[] }) {
  if (!channels || channels.length === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexWrap: "wrap" }}>
      {channels.map((ch) => {
        const style = PLATFORM_STYLES[ch.platform.toLowerCase()];
        const statusColor = CHANNEL_STATUS_COLORS[ch.status.toLowerCase()] || "#6B7280";
        return (
          <div
            key={ch.channel_id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              padding: "0.125rem 0.375rem",
              borderRadius: "var(--radius-sm)",
              background: style?.bg ?? "#F3F4F6",
              border: `1px solid ${style?.color ?? "#E5E7EB"}20`,
            }}
            title={`${ch.platform}: ${ch.status}`}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: statusColor,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: "0.6875rem", fontWeight: 500, color: style?.color ?? "#6B7280" }}>
              {style?.label ?? ch.platform}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function PostCard({
  post,
  viewMode = "card",
  onEdit,
  onDelete,
  onDuplicate,
  onAnalytics,
  onPublish,
  onCancel,
}: PostCardProps) {
  const [publishing, setPublishing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const displayDate = post.status === "scheduled"
    ? formatDate(post.scheduledAt)
    : formatDate(post.publishedAt);

  return (
    <div className={`post-card ${viewMode === "list" ? "post-card-list" : ""}`}>
      {post.mediaThumbnail && (
        <div className="post-card-media">
          <img src={post.mediaThumbnail} alt="" className="post-card-thumbnail" />
        </div>
      )}
      <div className="post-card-content">
        <p className="post-card-text">
          {post.content.length > 160 ? post.content.slice(0, 160) + "…" : post.content}
        </p>

        <div className="post-card-meta">
          <div className="post-card-platforms">
            {post.platforms.map((p) => (
              <PlatformBadge key={p} platform={p} showLabel={false} size="sm" />
            ))}
          </div>
          <StatusBadge status={post.status} size="sm" />
        </div>

        {post.channels && post.channels.length > 0 && (
          <div style={{ marginTop: "-0.25rem" }}>
            <ChannelStatusIcons channels={post.channels} />
          </div>
        )}

        <div className="post-card-footer">
          <span className="post-card-date">{displayDate}</span>

          {post.engagement && (
            <div className="post-card-engagement">
              {post.engagement.impressions !== undefined && (
                <span className="engagement-item" title="Impressions">
                  <Eye size={12} />
                  {formatEngagement(post.engagement.impressions)}
                </span>
              )}
              {post.engagement.likes !== undefined && (
                <span className="engagement-item" title="Likes">
                  <Heart size={12} />
                  {formatEngagement(post.engagement.likes)}
                </span>
              )}
              {post.engagement.comments !== undefined && (
                <span className="engagement-item" title="Comments">
                  <MessageCircle size={12} />
                  {formatEngagement(post.engagement.comments)}
                </span>
              )}
              {post.engagement.shares !== undefined && (
                <span className="engagement-item" title="Shares">
                  <Share2 size={12} />
                  {formatEngagement(post.engagement.shares)}
                </span>
              )}
            </div>
          )}

          <div className="post-card-actions">
            {(post.status === "draft" || post.status === "scheduled") && onPublish && (
              <button
                className="post-action-btn"
                onClick={() => {
                  setPublishing(true);
                  onPublish(post.id);
                }}
                aria-label="Publish now"
                title="Publish Now"
                disabled={publishing}
              >
                {publishing ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
              </button>
            )}
            {post.status === "scheduled" && onCancel && (
              <button
                className="post-action-btn"
                onClick={() => {
                  setCancelling(true);
                  onCancel(post.id);
                }}
                aria-label="Cancel schedule"
                title="Cancel Schedule"
                disabled={cancelling}
              >
                {cancelling ? <Loader2 size={14} className="spin" /> : <CalendarOff size={14} />}
              </button>
            )}
            <button
              className="post-action-btn"
              onClick={() => onEdit?.(post.id)}
              aria-label="Edit post"
              title="Edit"
            >
              <Edit size={14} />
            </button>
            <button
              className="post-action-btn"
              onClick={() => onDuplicate?.(post.id)}
              aria-label="Duplicate post"
              title="Duplicate"
            >
              <Copy size={14} />
            </button>
            <button
              className="post-action-btn"
              onClick={() => onAnalytics?.(post.id)}
              aria-label="View analytics"
              title="Analytics"
            >
              <BarChart2 size={14} />
            </button>
            <button
              className="post-action-btn post-action-btn-danger"
              onClick={() => onDelete?.(post.id)}
              aria-label="Delete post"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
