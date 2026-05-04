"use client";

import { useState } from "react";
import {
  MessageSquare,
  Search,
  Trash2,
  Check,
  Loader2,
  Filter,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { PlatformBadge } from "@/components/ui/platform-badge";
import {
  MOCK_COMMENTS,
  CommentData,
} from "../../../lib/mock-data";

type CommentStatus = "unread" | "read" | "replied" | "archived";
type CommentPriority = "low" | "medium" | "high" | "urgent";
type CommentSentiment = "positive" | "neutral" | "negative" | "spam";

const STATUS_COLORS: Record<CommentStatus, { bg: string; text: string }> = {
  unread: { bg: "#dcfce7", text: "#16a34a" },
  read: { bg: "#f3f4f6", text: "#6b7280" },
  replied: { bg: "#dbeafe", text: "#2563eb" },
  archived: { bg: "#f3f4f6", text: "#9ca3af" },
};

const PRIORITY_COLORS: Record<CommentPriority, string> = {
  low: "#6b7280",
  medium: "#f59e0b",
  high: "#ef4444",
  urgent: "#dc2626",
};

const SENTIMENT_COLORS: Record<CommentSentiment, string> = {
  positive: "#10b981",
  neutral: "#6b7280",
  negative: "#ef4444",
  spam: "#8b5cf6",
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "replied" | "archived">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  const PLATFORMS = [
    "instagram",
    "twitter",
    "facebook",
    "linkedin",
    "tiktok",
    "pinterest",
    "youtube",
    "threads",
  ];

  const filteredComments = MOCK_COMMENTS.filter((comment) => {
    // Tab filter
    if (activeTab === "unread" && comment.status !== "unread") return false;
    if (activeTab === "replied" && comment.status !== "replied") return false;
    if (activeTab === "archived" && comment.status !== "archived") return false;
    if (activeTab === "all" && comment.status === "archived") return false;

    // Platform filter
    if (platformFilter !== "all" && comment.platform !== platformFilter) return false;

    // Priority filter
    if (priorityFilter !== "all" && comment.priority !== priorityFilter) return false;

    // Sentiment filter
    if (sentimentFilter !== "all" && comment.sentiment !== sentimentFilter) return false;

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return comment.content.toLowerCase().includes(q);
    }

    return true;
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handlePlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPlatformFilter(e.target.value);
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPriorityFilter(e.target.value);
  };

  const handleSentimentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSentimentFilter(e.target.value);
  };

  const handleMarkAsRead = (id: string) => {
    console.log(`Mark comment ${id} as read`);
  };

  const handleMarkAsUnread = (id: string) => {
    console.log(`Mark comment ${id} as unread`);
  };

  const handleReply = (id: string) => {
    console.log(`Reply to comment ${id}`);
  };

  const handleArchive = (id: string) => {
    console.log(`Archive comment ${id}`);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this comment? This action cannot be undone.")) {
      console.log(`Delete comment ${id}`);
    }
  };

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action}`);
  };

  return (
    <div>
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1>Inbox</h1>
          <p>Unified comments and messages from all your platforms</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/create" className="btn btn-secondary">
            <MessageSquare size={14} /> New Post
          </Link>
        </div>
      </div>

      {/* ─── Filter Bar ───────────────────────────────────── */}
      <div className="filter-bar" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <div className="filter-search">
          <Search size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            type="search"
            placeholder="Search comments..."
            value={searchQuery}
            onChange={handleSearch}
            aria-label="Search comments"
          />
        </div>

        <select
          className="filter-select"
          value={platformFilter}
          onChange={handlePlatformChange}
          aria-label="Filter by platform"
        >
          <option value="all">All Platforms</option>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={priorityFilter}
          onChange={handlePriorityChange}
          aria-label="Filter by priority"
        >
          <option value="all">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <select
          className="filter-select"
          value={sentimentFilter}
          onChange={handleSentimentChange}
          aria-label="Filter by sentiment"
        >
          <option value="all">All Sentiments</option>
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Negative</option>
          <option value="spam">Spam</option>
        </select>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className={`btn btn-sm ${activeTab === "all" ? "btn-secondary" : "btn-ghost"}`}
            onClick={() => setActiveTab("all")}
          >
            All
            <span className="tab-count">{MOCK_COMMENTS.filter(c => c.status !== "archived").length}</span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === "unread" ? "btn-secondary" : "btn-ghost"}`}
            onClick={() => setActiveTab("unread")}
          >
            Unread
            <span className="tab-count">{MOCK_COMMENTS.filter(c => c.status === "unread").length}</span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === "replied" ? "btn-secondary" : "btn-ghost"}`}
            onClick={() => setActiveTab("replied")}
          >
            Replied
            <span className="tab-count">{MOCK_COMMENTS.filter(c => c.status === "replied").length}</span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === "archived" ? "btn-secondary" : "btn-ghost"}`}
            onClick={() => setActiveTab("archived")}
          >
            Archived
            <span className="tab-count">{MOCK_COMMENTS.filter(c => c.status === "archived").length}</span>
          </button>
        </div>
      </div>

      {/* ─── Comments List ────────────────────────────────── */}
      {filteredComments.length === 0 ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
          <p style={{ fontSize: "1.125rem", marginBottom: "0.5rem" }}>No comments found</p>
          {searchQuery || platformFilter !== "all" || priorityFilter !== "all" || sentimentFilter !== "all" ? (
            <p>Try adjusting your search or filters</p>
          ) : (
            <p>Engage with your audience to see comments here</p>
          )}
        </div>
      ) : (
        <div className="comments-list">
          {filteredComments.map((comment) => (
            <div
              key={comment.id}
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                padding: "1.25rem",
                borderLeft: `3px solid ${SENTIMENT_COLORS[comment.sentiment as CommentSentiment]}`,
                background: comment.status === "unread" ? "var(--color-success-bg)" : "var(--bg-card)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <img
                    src={comment.author_avatar_url || "/default-avatar.png"}
                    alt={comment.author_name}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: comment.author_is_verified ? "2px solid var(--color-primary)" : "none",
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      {comment.author_name}
                      {comment.author_is_verified && (
                        <span style={{ marginLeft: "0.25rem", fontSize: "0.75rem" }}>✓</span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      @{comment.author_username}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <PlatformBadge platform={comment.platform} size="sm" />
                  <span
                    className="comment-status"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      padding: "0.25rem 0.5rem",
                      borderRadius: "var(--radius-full)",
                      background: STATUS_COLORS[comment.status as CommentStatus].bg,
                      color: STATUS_COLORS[comment.status as CommentStatus].text,
                    }}
                  >
                    {comment.status.charAt(0).toUpperCase() + comment.status.slice(1)}
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      fontSize: "0.75rem",
                      color: PRIORITY_COLORS[comment.priority as CommentPriority],
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: PRIORITY_COLORS[comment.priority as CommentPriority],
                      }}
                    />
                    {comment.priority.charAt(0).toUpperCase() + comment.priority.slice(1)}
                  </span>
                </div>
              </div>

              <p style={{
                fontSize: "0.875rem",
                color: "var(--text-primary)",
                lineHeight: 1.6,
                marginBottom: "0.75rem",
              }}>
                {comment.content}
              </p>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  <span>
                    {formatTimeAgo(comment.received_at)}
                  </span>
                  <span>•</span>
                  <span>
                    {comment.author_follower_count?.toLocaleString() ?? "0"} followers
                  </span>
                </div>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  <button className="comment-action-btn" onClick={() => handleMarkAsRead(comment.id)} title="Mark as read">
                    <MessageSquare size={14} />
                  </button>
                  <button className="comment-action-btn" onClick={() => handleMarkAsUnread(comment.id)} title="Mark as unread">
                    <MessageSquare size={14} />
                  </button>
                  <button className="comment-action-btn" onClick={() => handleReply(comment.id)} title="Reply">
                    <MessageSquare size={14} />
                  </button>
                  <button className="comment-action-btn" onClick={() => handleArchive(comment.id)} title="Archive">
                    <Trash2 size={14} />
                  </button>
                  <button className="comment-action-btn comment-action-btn-danger" onClick={() => handleDelete(comment.id)} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bulk actions footer */}
      {filteredComments.length > 0 && (
        <div style={{
          marginTop: "1.5rem",
          padding: "0.75rem 1rem",
          background: "var(--bg-card)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-md)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.8rem",
          color: "var(--text-muted)",
        }}>
          <div>
            Selected: <span id="selected-count">0</span> comments
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-sm btn-secondary" onClick={() => handleBulkAction("mark_read")}>
              Mark as read
            </button>
            <button className="btn btn-sm btn-secondary" onClick={() => handleBulkAction("mark_unread")}>
              Mark as unread
            </button>
            <button className="btn btn-sm btn-secondary" onClick={() => handleBulkAction("archive")}>
              Archive
            </button>
            <button className="btn btn-sm btn-danger" onClick={() => handleBulkAction("delete")}>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}