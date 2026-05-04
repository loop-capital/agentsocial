"use client";

import { MoreHorizontal, Heart, MessageCircle, Share2, Eye, Edit, Trash2, Copy, BarChart2 } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { PlatformBadge } from "./platform-badge";
import { useState } from "react";

interface PostEngagement {
  likes: number;
  comments: number;
  shares: number;
  impressions?: number;
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
}

interface PostCardProps {
  post: PostCardData;
  viewMode?: "card" | "list";
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onAnalytics?: (id: string) => void;
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

export function PostCard({
  post,
  viewMode = "card",
  onEdit,
  onDelete,
  onDuplicate,
  onAnalytics,
}: PostCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
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
