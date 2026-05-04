"use client";

import { useState, useCallback } from "react";
import { Edit, Trash2, Copy, BarChart2 } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { PlatformBadge } from "./platform-badge";

export interface PostCardData {
  id: string;
  content: string;
  status: "published" | "scheduled" | "draft" | "failed" | "cancelled";
  platforms: string[];
  scheduledAt?: string | null;
  publishedAt?: string | null;
  createdAt?: string | null;
  engagement?: { impressions?: number; likes?: number; comments?: number; shares?: number } | null;
  mediaThumbnail?: string;
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
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function PostCard({ post, viewMode = "card", onEdit, onDelete, onDuplicate, onAnalytics }: PostCardProps) {
  return (
    <div className="post-card">
      {post.mediaThumbnail && (
        <div className="post-card-media">
          <img src={post.mediaThumbnail} alt="" className="post-card-thumbnail" />
        </div>
      )}
      <div className="post-card-content">
        <p className="post-card-text">{post.content}</p>
        <div className="post-card-meta">
          <div className="post-card-platforms">
            {post.platforms.map((p) => (
              <PlatformBadge key={p} platform={p} size="sm" showLabel={false} />
            ))}
          </div>
          <StatusBadge status={post.status} size="sm" />
        </div>
        <div className="post-card-footer">
          <span className="post-card-date">
            {post.status === "published" ? formatDate(post.publishedAt) : formatDate(post.scheduledAt)}
          </span>
          {post.engagement?.impressions && (
            <div className="post-card-engagement">
              <span className="engagement-item">{(post.engagement.impressions / 1000).toFixed(1)}K impressions</span>
            </div>
          )}
        </div>
        <div className="post-card-actions" style={{ justifyContent: "flex-end" }}>
          {onEdit && (
            <button className="post-action-btn" onClick={() => onEdit(post.id)} title="Edit">
              <Edit size={13} />
            </button>
          )}
          {onDuplicate && (
            <button className="post-action-btn" onClick={() => onDuplicate(post.id)} title="Duplicate">
              <Copy size={13} />
            </button>
          )}
          {onAnalytics && (
            <button className="post-action-btn" onClick={() => onAnalytics(post.id)} title="Analytics">
              <BarChart2 size={13} />
            </button>
          )}
          {onDelete && (
            <button className="post-action-btn post-action-btn-danger" onClick={() => onDelete(post.id)} title="Delete">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}