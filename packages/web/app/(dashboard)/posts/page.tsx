"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Edit,
  Trash2,
  Copy,
  BarChart2,
  CheckSquare,
  Square,
  Calendar,
  Loader2,
  AlertCircle,
  Send,
  CalendarOff,
} from "lucide-react";
import Link from "next/link";
import { PostCard } from "@/components/ui/post-card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { PlatformBadge, PLATFORM_STYLES } from "@/components/ui/platform-badge";
import { api } from "../../../lib/api";

const CHANNEL_STATUS_COLORS: Record<string, string> = {
  published: "#16A34A",
  scheduled: "#D97706",
  draft: "#6B7280",
  failed: "#DC2626",
  cancelled: "#DC2626",
  pending: "#3B82F6",
};

type Tab = "all" | "drafts" | "scheduled" | "published" | "failed" | "cancelled";
type ViewMode = "grid" | "list";

interface Post {
  id: string;
  brand_id: string;
  content: string;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  channels?: Array<{
    channel_id: string;
    platform: string;
    status: string;
    platform_post_id: string | null;
    platform_post_url: string | null;
    published_at: string | null;
  }>;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "drafts", label: "Drafts" },
  { key: "scheduled", label: "Scheduled" },
  { key: "published", label: "Published" },
  { key: "failed", label: "Failed" },
];

function mapPostToCardData(post: Post) {
  const platforms = post.channels?.map((c) => c.platform) || [];
  return {
    id: post.id,
    content: post.content,
    status: post.status as "published" | "scheduled" | "draft" | "failed",
    platforms,
    scheduledAt: post.scheduled_at,
    publishedAt: post.published_at,
    createdAt: post.created_at,
    engagement: null,
    channels: post.channels?.map((c) => ({
      channel_id: c.channel_id,
      platform: c.platform,
      status: c.status,
    })),
  };
}

export default function PostsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [publishId, setPublishId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = activeTab === "drafts" ? "draft" : activeTab === "all" ? undefined : activeTab;
      const res = await api.posts.list({
        status: statusParam,
        limit: 50,
      });
      setPosts((res.data || []) as Post[]);
    } catch (err: any) {
      setError(err?.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const allPosts = useMemo(() => posts.map(mapPostToCardData), [posts]);

  const tabCounts = useMemo(() => ({
    all: posts.length,
    drafts: posts.filter((p) => p.status === "draft").length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    published: posts.filter((p) => p.status === "published").length,
    failed: posts.filter((p) => p.status === "failed").length,
    cancelled: posts.filter((p) => p.status === "cancelled").length,
  }), [posts]);

  const filteredPosts = useMemo(() => {
    let result = allPosts;

    if (activeTab === "drafts") result = result.filter((p) => p.status === "draft");
    else if (activeTab === "scheduled") result = result.filter((p) => p.status === "scheduled");
    else if (activeTab === "published") result = result.filter((p) => p.status === "published");
    else if (activeTab === "failed") result = result.filter((p) => p.status === "failed");

    if (platformFilter !== "all") {
      result = result.filter((p) => p.platforms.includes(platformFilter));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.content.toLowerCase().includes(q));
    }

    return result;
  }, [allPosts, activeTab, platformFilter, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPosts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPosts.map((p) => p.id)));
    }
  };

  const handleBulkDelete = () => {
    if (!confirm(`Delete ${selectedIds.size} post(s)? This cannot be undone.`)) return;
    Promise.all(
      Array.from(selectedIds).map((id) => api.posts.delete(id))
    )
      .then(() => {
        setSelectedIds(new Set());
        setBulkMenuOpen(false);
        fetchPosts();
      })
      .catch((err) => alert(err?.message || "Failed to delete posts"));
  };

  const handleBulkReschedule = () => {
    setBulkMenuOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post? This action cannot be undone.")) return;
    setDeleteId(id);
    try {
      await api.posts.delete(id);
      fetchPosts();
    } catch (err: any) {
      alert(err?.message || "Failed to delete post");
    } finally {
      setDeleteId(null);
    }
  };

  const handleDuplicate = (id: string) => {
    api.posts.duplicate?.(id)
      ?.then(() => fetchPosts())
      ?.catch((err: any) => alert(err?.message || "Failed to duplicate"));
  };

  const handleAnalytics = () => {
    window.location.href = "/analytics";
  };

  const handlePublish = async (id: string) => {
    setPublishId(id);
    try {
      await api.posts.publish(id);
      fetchPosts();
    } catch (err: any) {
      alert(err?.message || "Failed to publish post");
    } finally {
      setPublishId(null);
    }
  };

  const handleCancel = async (id: string) => {
    setCancelId(id);
    try {
      await api.posts.cancel(id);
      fetchPosts();
    } catch (err: any) {
      alert(err?.message || "Failed to cancel schedule");
    } finally {
      setCancelId(null);
    }
  };

  const handleEdit = (id: string) => {
    window.location.href = `/create?edit=${id}`;
  };

  const PLATFORMS = ["instagram", "twitter", "facebook", "linkedin", "tiktok", "pinterest", "youtube", "threads"];

  return (
    <div>
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1>Posts</h1>
          <p>Create, schedule, and manage your social media content</p>
        </div>
        <Link href="/create" className="btn btn-primary">
          <Plus size={16} />
          New Post
        </Link>
      </div>

      {error && (
        <div style={{
          background: "var(--color-danger-bg, #fef2f2)",
          color: "var(--color-danger, #dc2626)",
          padding: "0.75rem 1rem",
          borderRadius: "var(--radius-md)",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.875rem",
        }}>
          <AlertCircle size={16} />
          {error}
          <button
            onClick={fetchPosts}
            style={{ marginLeft: "auto", background: "none", border: "none", color: "inherit", cursor: "pointer", textDecoration: "underline" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ─── Tabs ─────────────────────────────────────────── */}
      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className="tab-count">{tabCounts[tab.key]}</span>
          </button>
        ))}
      </div>

      {/* ─── Filter Bar ───────────────────────────────────── */}
      <div className="filter-bar">
        <div className="filter-search">
          <Search size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            type="search"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search posts"
          />
        </div>

        <select
          className="filter-select"
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          aria-label="Filter by platform"
        >
          <option value="all">All Platforms</option>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>

        <div className="filter-bar-right">
          {selectedIds.size > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginRight: "0.5rem" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {selectedIds.size} selected
              </span>
              <button className="btn btn-sm btn-secondary" onClick={() => setSelectedIds(new Set())}>
                Clear
              </button>
              <div style={{ position: "relative" }}>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => setBulkMenuOpen((v) => !v)}
                >
                  Bulk Actions
                </button>
                {bulkMenuOpen && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: "0.25rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "var(--shadow-lg)",
                    zIndex: 50,
                    minWidth: 160,
                    overflow: "hidden",
                  }}>
                    <button
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        width: "100%",
                        padding: "0.5rem 0.875rem",
                        border: "none",
                        background: "transparent",
                        fontSize: "0.875rem",
                        color: "var(--text-primary)",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      onClick={handleBulkReschedule}
                    >
                      <Calendar size={14} />
                      Reschedule
                    </button>
                    <button
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        width: "100%",
                        padding: "0.5rem 0.875rem",
                        border: "none",
                        background: "transparent",
                        fontSize: "0.875rem",
                        color: "var(--color-danger)",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-danger-bg)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      onClick={handleBulkDelete}
                    >
                      <Trash2 size={14} />
                      Delete selected
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          <button
            className={`btn btn-sm ${viewMode === "grid" ? "btn-secondary" : "btn-ghost"}`}
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
            title="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            className={`btn btn-sm ${viewMode === "list" ? "btn-secondary" : "btn-ghost"}`}
            onClick={() => setViewMode("list")}
            aria-label="List view"
            title="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* ─── Loading State ────────────────────────────────── */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <Loader2 size={24} className="spin" style={{ color: "var(--text-muted)" }} />
        </div>
      )}

      {/* ─── Posts ────────────────────────────────────────── */}
      {!loading && filteredPosts.length === 0 ? (
        <EmptyState
          icon={<SlidersHorizontal size={32} strokeWidth={1.5} />}
          title={`No ${activeTab === "all" ? "" : activeTab} posts found`}
          description={
            searchQuery || platformFilter !== "all"
              ? "Try adjusting your search or filters"
              : activeTab === "drafts"
              ? "Start by creating a new draft post"
              : activeTab === "scheduled"
              ? "Schedule your first post to see it here"
              : activeTab === "published"
              ? "Publish your first post to see it here"
              : "No failed posts"
          }
          action={{ label: "Create Post", href: "/create" }}
        />
      ) : !loading && viewMode === "grid" ? (
        <div className="posts-grid">
          {filteredPosts.map((post) => (
            <div key={post.id} style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  top: "0.75rem",
                  left: "0.75rem",
                  zIndex: 10,
                  cursor: "pointer",
                }}
                onClick={(e) => { e.stopPropagation(); toggleSelect(post.id); }}
              >
                {selectedIds.has(post.id) ? (
                  <CheckSquare size={18} color="#3b82f6" fill="#3b82f6" style={{ background: "white", borderRadius: 4 }} />
                ) : (
                  <Square size={18} color="#9ca3af" style={{ background: "white", borderRadius: 4 }} />
                )}
              </div>
              <PostCard
                post={post}
                viewMode="card"
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onAnalytics={handleAnalytics}
                onPublish={handlePublish}
                onCancel={handleCancel}
              />
              {deleteId === post.id && (
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.3)",
                  borderRadius: "var(--radius-lg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Loader2 size={20} className="spin" color="white" />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : !loading && (
        <div className="card" style={{ overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} onClick={toggleSelectAll}>
                    {selectedIds.size === filteredPosts.length && filteredPosts.length > 0 ? (
                      <CheckSquare size={16} color="#3b82f6" fill="#3b82f6" />
                    ) : (
                      <Square size={16} color="#9ca3af" />
                    )}
                  </div>
                </th>
                <th style={{ minWidth: 300 }}>Content</th>
                <th>Status</th>
                <th>Platforms</th>
                <th>Date</th>
                <th style={{ width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((post) => (
                <tr key={post.id} style={{ opacity: deleteId === post.id || publishId === post.id || cancelId === post.id ? 0.5 : 1 }}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} onClick={() => toggleSelect(post.id)}>
                      {selectedIds.has(post.id) ? (
                        <CheckSquare size={16} color="#3b82f6" fill="#3b82f6" />
                      ) : (
                        <Square size={16} color="#9ca3af" />
                      )}
                    </div>
                  </td>
                  <td>
                    <p style={{
                      fontSize: "0.875rem",
                      color: "var(--text-primary)",
                      maxWidth: 320,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {post.content}
                    </p>
                  </td>
                  <td><StatusBadge status={post.status} size="sm" /></td>
                  <td>
                    <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                      {post.platforms.map((p) => <PlatformBadge key={p} platform={p} size="sm" showLabel={false} />)}
                    </div>
                    {post.channels && post.channels.length > 0 && (
                      <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", marginTop: "0.375rem" }}>
                        {post.channels.map((ch) => {
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
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                      {post.status === "published"
                        ? post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString()
                          : "—"
                        : post.scheduledAt
                        ? new Date(post.scheduledAt).toLocaleDateString()
                        : post.createdAt
                        ? new Date(post.createdAt).toLocaleDateString()
                        : "—"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.125rem" }}>
                      {(post.status === "draft" || post.status === "scheduled") && (
                        <button
                          className="post-action-btn"
                          onClick={() => handlePublish(post.id)}
                          title="Publish Now"
                          disabled={publishId === post.id}
                        >
                          {publishId === post.id ? <Loader2 size={13} className="spin" /> : <Send size={13} />}
                        </button>
                      )}
                      {post.status === "scheduled" && (
                        <button
                          className="post-action-btn"
                          onClick={() => handleCancel(post.id)}
                          title="Cancel Schedule"
                          disabled={cancelId === post.id}
                        >
                          {cancelId === post.id ? <Loader2 size={13} className="spin" /> : <CalendarOff size={13} />}
                        </button>
                      )}
                      <button className="post-action-btn" onClick={() => handleEdit(post.id)} title="Edit"><Edit size={13} /></button>
                      <button className="post-action-btn" onClick={() => handleDuplicate(post.id)} title="Duplicate"><Copy size={13} /></button>
                      <button className="post-action-btn" onClick={() => handleAnalytics()} title="Analytics"><BarChart2 size={13} /></button>
                      <button
                        className="post-action-btn post-action-btn-danger"
                        onClick={() => handleDelete(post.id)}
                        title="Delete"
                        disabled={deleteId === post.id}
                      >
                        {deleteId === post.id ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary footer */}
      {!loading && filteredPosts.length > 0 && (
        <div style={{
          marginTop: "1.5rem",
          padding: "0.75rem 1rem",
          background: "var(--bg-card)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-md)",
          fontSize: "0.8rem",
          color: "var(--text-muted)",
          textAlign: "center",
        }}>
          Showing {filteredPosts.length} of {posts.length} posts
        </div>
      )}
    </div>
  );
}
