"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompetitorProfile {
  id: string;
  brandId: string;
  platform: string;
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  followerCount: number;
  followingCount: number;
  postCount: number;
  engagementRate: number | null;
  profileUrl: string | null;
  lastFetchedAt: string | null;
  active: boolean;
  createdAt: string;
}

interface CompetitorPost {
  id: string;
  profileId: string;
  externalId: string;
  content: string | null;
  mediaUrls: string[] | null;
  postType: string;
  publishedAt: string | null;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  engagementRate: number | null;
  hashtags: string[] | null;
  mentions: string[] | null;
  url: string | null;
  fetchedAt: string;
  createdAt: string;
}

const PLATFORMS = [
  { value: "twitter", label: "Twitter / X", icon: "𝕏", color: "bg-black" },
  { value: "instagram", label: "Instagram", icon: "📷", color: "bg-gradient-to-br from-purple-500 to-pink-500" },
  { value: "facebook", label: "Facebook", icon: "f", color: "bg-blue-600" },
  { value: "tiktok", label: "TikTok", icon: "♪", color: "bg-black" },
  { value: "linkedin", label: "LinkedIn", icon: "in", color: "bg-blue-700" },
] as const;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

// ─── Helper ──────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function timeAgo(date: string | null): string {
  if (!date) return "Never";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<CompetitorProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [posts, setPosts] = useState<CompetitorPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ platform: "twitter", handle: "" });
  const [error, setError] = useState<string | null>(null);

  // Temp brand ID — will be replaced with auth context
  const BRAND_ID = "00000000-0000-0000-0000-000000000000";

  const fetchCompetitors = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/competitors?brand_id=${BRAND_ID}`);
      if (!res.ok) throw new Error("Failed to fetch competitors");
      const data = await res.json();
      setCompetitors(data.competitors || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCompetitors(); }, [fetchCompetitors]);

  const fetchPosts = useCallback(async (profileId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/competitors/${profileId}/posts?limit=20`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (selectedId) fetchPosts(selectedId);
  }, [selectedId, fetchPosts]);

  const handleAdd = async () => {
    try {
      setError(null);
      const res = await fetch(`${API_URL}/api/v1/competitors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: BRAND_ID, ...addForm }),
      });
      if (!res.ok) throw new Error("Failed to add competitor");
      setShowAddModal(false);
      setAddForm({ platform: "twitter", handle: "" });
      fetchCompetitors();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRefresh = async (profileId: string) => {
    setRefreshing(profileId);
    try {
      const res = await fetch(`${API_URL}/api/v1/competitors/${profileId}/refresh`, { method: "POST" });
      if (!res.ok) throw new Error("Refresh failed");
      await fetchCompetitors();
      if (selectedId === profileId) await fetchPosts(profileId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRefreshing(null);
    }
  };

  const handleDelete = async (profileId: string) => {
    if (!confirm("Remove this competitor?")) return;
    try {
      await fetch(`${API_URL}/api/v1/competitors/${profileId}`, { method: "DELETE" });
      if (selectedId === profileId) { setSelectedId(null); setPosts([]); }
      fetchCompetitors();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const selected = competitors.find(c => c.id === selectedId);

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Competitor Monitor</h1>
          <p className="text-gray-500 mt-1">Track competitor social media activity and engagement</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Add Competitor
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {competitors.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold text-gray-700">No competitors tracked yet</h2>
          <p className="text-gray-500 mt-2 mb-6">Add a competitor to start monitoring their social media activity</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Your First Competitor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Competitor List */}
          <div className="lg:col-span-1 space-y-3">
            {competitors.map(c => {
              const platform = PLATFORMS.find(p => p.value === c.platform);
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedId === c.id
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${platform?.color || "bg-gray-500"} flex items-center justify-center text-white text-sm font-bold`}>
                        {platform?.icon || "?"}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {c.displayName || `@${c.handle}`}
                        </div>
                        <div className="text-sm text-gray-500">@{c.handle}</div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={e => { e.stopPropagation(); handleRefresh(c.id); }}
                        disabled={refreshing === c.id}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Refresh data"
                      >
                        {refreshing === c.id ? "⏳" : "🔄"}
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(c.id); }}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                    <span>{formatNumber(c.followerCount)} followers</span>
                    {c.engagementRate !== null && (
                      <span className="text-green-600 font-medium">
                        {(c.engagementRate / 100).toFixed(1)}% eng.
                      </span>
                    )}
                    <span className="text-gray-400 ml-auto">{timeAgo(c.lastFetchedAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Posts Panel */}
          <div className="lg:col-span-2">
            {selected ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selected.displayName || `@${selected.handle}`}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {PLATFORMS.find(p => p.value === selected.platform)?.label} · {selected.postCount} posts
                    </p>
                  </div>
                  <button
                    onClick={() => handleRefresh(selected.id)}
                    disabled={refreshing === selected.id}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {refreshing === selected.id ? "Refreshing..." : "Refresh"}
                  </button>
                </div>

                {posts.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <p className="text-gray-500">No posts fetched yet. Click Refresh to load.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map(post => (
                      <div key={post.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {post.content && (
                              <p className="text-gray-800 text-sm leading-relaxed mb-3 line-clamp-3">
                                {post.content}
                              </p>
                            )}
                            {post.hashtags && post.hashtags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {post.hashtags.slice(0, 5).map((tag, i) => (
                                  <span key={i} className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span title="Likes">❤️ {formatNumber(post.likes)}</span>
                              <span title="Comments">💬 {formatNumber(post.comments)}</span>
                              <span title="Shares">🔁 {formatNumber(post.shares)}</span>
                              {post.views > 0 && <span title="Views">👁 {formatNumber(post.views)}</span>}
                              {post.engagementRate !== null && (
                                <span className="text-green-600 font-medium">
                                  {(post.engagementRate / 100).toFixed(1)}%
                                </span>
                              )}
                              <span className="text-gray-400 ml-auto">
                                {timeAgo(post.publishedAt)}
                              </span>
                            </div>
                          </div>
                          {post.url && (
                            <a
                              href={post.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-3 text-blue-500 hover:text-blue-700 text-sm"
                            >
                              ↗
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl">
                <p className="text-gray-400">Select a competitor to view their posts</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Competitor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Add Competitor</h2>

            <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {PLATFORMS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setAddForm(f => ({ ...f, platform: p.value }))}
                  className={`p-2 rounded-lg text-center transition-colors ${
                    addForm.platform === p.value
                      ? "bg-blue-100 border-2 border-blue-500"
                      : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div className="text-lg">{p.icon}</div>
                  <div className="text-[10px] text-gray-600">{p.label}</div>
                </button>
              ))}
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1">Handle / Username</label>
            <input
              type="text"
              value={addForm.handle}
              onChange={e => setAddForm(f => ({ ...f, handle: e.target.value }))}
              placeholder="@competitor_handle"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              onKeyDown={e => { if (e.key === "Enter" && addForm.handle) handleAdd(); }}
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!addForm.handle.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Add Competitor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}