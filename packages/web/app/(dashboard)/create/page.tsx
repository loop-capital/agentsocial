"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, Wand2, Calendar, Eye, X, Loader2, AlertCircle } from "lucide-react";
import { PLATFORM_STYLES } from "@/components/ui/platform-badge";
import { api } from "../../../lib/api";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", color: "#E4405F", charLimit: 2200 },
  { id: "twitter", label: "Twitter / X", color: "#1DA1F2", charLimit: 280 },
  { id: "facebook", label: "Facebook", color: "#1877F2", charLimit: 63206 },
  { id: "linkedin", label: "LinkedIn", color: "#0A66C2", charLimit: 3000 },
  { id: "tiktok", label: "TikTok", color: "#000000", charLimit: 2200 },
  { id: "pinterest", label: "Pinterest", color: "#BD081C", charLimit: 500 },
  { id: "youtube", label: "YouTube", color: "#FF0000", charLimit: 5000 },
  { id: "threads", label: "Threads", color: "#000000", charLimit: 500 },
];

const PLATFORM_PREVIEWS: Record<string, string> = {
  instagram: "Instagram",
  twitter: "Twitter / X",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  pinterest: "Pinterest",
  youtube: "YouTube",
  threads: "Threads",
};

interface Brand {
  id: string;
  name: string;
  channels: Array<{ id: string; platform: string; name: string; status: string }>;
}

interface Channel {
  id: string;
  platform: string;
  name: string;
}

export default function CreatePostPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load brands on mount
  useEffect(() => {
    api.brands.list()
      .then((res: { data: Brand[] }) => {
        const list = res.data || [];
        setBrands(list);
        if (list.length > 0) {
          setSelectedBrandId(list[0].id);
          setChannels(list[0].channels || []);
        }
      })
      .catch((err: { message?: string }) => setError(err?.message || "Failed to load brands"));
  }, []);

  // Update channels when brand changes
  useEffect(() => {
    const brand = brands.find((b) => b.id === selectedBrandId);
    if (brand) {
      const chs = brand.channels || [];
      setChannels(
        chs.map((c) => ({ id: c.id, platform: c.platform, name: c.name }))
      );
    } else {
      setChannels([]);
    }
    setSelectedChannels([]);
    setSelectedPlatforms([]);
  }, [selectedBrandId, brands]);

  const currentPlatform = selectedPlatforms[0] || "instagram";
  const platformConfig = PLATFORMS.find((p) => p.id === currentPlatform) ?? PLATFORMS[0];
  const charLimit = platformConfig.charLimit;
  const charPercent = Math.min((content.length / charLimit) * 100, 100);
  const isOverLimit = content.length > charLimit;

  const togglePlatform = useCallback((id: string) => {
    setSelectedPlatforms((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      // Sync channels based on selected platforms
      const relevantChannels = channels.filter((c) => next.includes(c.platform));
      setSelectedChannels(relevantChannels.map((c) => c.id));
      return next;
    });
  }, [channels]);

  const handleSubmit = async () => {
    if (!content.trim() || selectedChannels.length === 0 || !selectedBrandId) return;
    if (isOverLimit) return;

    setSubmitting(true);
    setError(null);

    try {
      let scheduledAt: string | undefined;
      if (scheduleMode === "later" && scheduledDate && scheduledTime) {
        scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      }

      await api.posts.create({
        brand_id: selectedBrandId,
        content,
        channels: selectedChannels,
        ...(scheduledAt ? { scheduled_at: scheduledAt } : {}),
      });

      setSaved(true);
      setTimeout(() => {
        router.push("/posts");
      }, 1500);
    } catch (err: any) {
      setError(err?.message || "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedBrandId) return;
    setSubmitting(true);
    setError(null);

    try {
      await api.posts.create({
        brand_id: selectedBrandId,
        content,
        channels: selectedChannels.length > 0 ? selectedChannels : [],
      });
      setSaved(true);
      setTimeout(() => {
        router.push("/posts");
      }, 1500);
    } catch (err: any) {
      setError(err?.message || "Failed to save draft");
    } finally {
      setSubmitting(false);
    }
  };

  const availablePlatforms = PLATFORMS.filter((p) =>
    channels.some((c) => c.platform === p.id)
  );

  return (
    <div>
      <div className="page-header">
        <h1>Create Post</h1>
        <p>Write and schedule content for your connected platforms</p>
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
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "start" }}>
        {/* Left: Compose */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Brand Selector */}
          <div className="card">
            <div className="card-header">
              <h2>Brand</h2>
            </div>
            <div className="card-body">
              <select
                className="form-input"
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(e.target.value)}
                disabled={brands.length === 0}
              >
                {brands.length === 0 && <option>No brands available</option>}
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Platform Selector */}
          <div className="card">
            <div className="card-header">
              <h2>Publish to</h2>
            </div>
            <div className="card-body">
              {channels.length === 0 ? (
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  No channels connected for this brand. Go to Settings to connect a channel.
                </p>
              ) : (
                <div className="platform-toggle-group">
                  {availablePlatforms.map((p) => (
                    <button
                      key={p.id}
                      className={`platform-toggle ${selectedPlatforms.includes(p.id) ? "selected" : ""}`}
                      onClick={() => togglePlatform(p.id)}
                      style={
                        selectedPlatforms.includes(p.id)
                          ? { borderColor: p.color, background: `${p.color}12`, color: "var(--text-primary)" }
                          : {}
                      }
                      aria-pressed={selectedPlatforms.includes(p.id)}
                    >
                      <span
                        className="platform-toggle-dot"
                        style={{ backgroundColor: p.color }}
                      />
                      {p.label}
                    </button>
                  ))}
                </div>
              )}

              {selectedPlatforms.length > 1 && (
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Post will be adapted for each platform&apos;s format and character limit
                </p>
              )}
            </div>
          </div>

          {/* Text Editor */}
          <div className="card">
            <div className="card-header">
              <h2>Content</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setShowPreview(!showPreview)}
                  title="Preview"
                >
                  <Eye size={14} />
                  Preview
                </button>
              </div>
            </div>
            <div className="card-body">
              <textarea
                className="form-textarea"
                placeholder="What do you want to share with your audience? Write naturally — our AI will help optimize for each platform."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={7}
                aria-label="Post content"
              />

              {/* Char count */}
              <div className="char-count-bar" style={{ justifyContent: "space-between", marginTop: "0.625rem" }}>
                <span
                  style={{
                    color: isOverLimit ? "var(--color-danger)" : content.length > charLimit * 0.9 ? "var(--color-warning)" : "var(--text-muted)",
                    fontSize: "0.8rem",
                  }}
                >
                  {content.length > 0 && `${content.length} / ${charLimit}`}
                </span>
                {isOverLimit && (
                  <span style={{ color: "var(--color-danger)", fontSize: "0.8rem", fontWeight: 500 }}>
                    {content.length - charLimit} over limit
                  </span>
                )}
              </div>
              <div className="char-progress">
                <div
                  className={`char-progress-fill ${isOverLimit ? "over" : ""}`}
                  style={{
                    width: `${Math.min(charPercent, 100)}%`,
                    background: isOverLimit
                      ? "var(--color-danger)"
                      : charPercent > 90
                      ? "var(--color-warning)"
                      : "var(--color-primary)",
                  }}
                />
              </div>

              {/* AI Actions */}
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.875rem" }}>
                <button className="btn btn-sm btn-secondary">
                  <Wand2 size={13} />
                  Rewrite with AI
                </button>
                <button className="btn btn-sm btn-secondary">
                  <Wand2 size={13} />
                  Expand
                </button>
              </div>
            </div>
          </div>

          {/* Media Upload */}
          <div className="card">
            <div className="card-header">
              <h2>Media</h2>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Optional</span>
            </div>
            <div className="card-body">
              <div
                className={`media-upload-area ${dragOver ? "drag-over" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
                role="button"
                tabIndex={0}
                aria-label="Upload media"
                onKeyDown={(e) => e.key === "Enter" && alert("Media picker would open")}
              >
                <div className="media-upload-icon">
                  <Upload size={28} strokeWidth={1.5} />
                </div>
                <p className="media-upload-text">
                  Drag & drop images or videos here
                </p>
                <p className="media-upload-hint">
                  or click to browse — PNG, JPG, MP4 up to 100MB
                </p>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="card">
            <div className="card-header">
              <h2>When to post</h2>
            </div>
            <div className="card-body">
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
                <button
                  className={`btn ${scheduleMode === "now" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setScheduleMode("now")}
                >
                  Post now
                </button>
                <button
                  className={`btn ${scheduleMode === "later" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setScheduleMode("later")}
                >
                  <Calendar size={14} />
                  Schedule for later
                </button>
              </div>

              {scheduleMode === "later" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      aria-label="Schedule date"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Time</label>
                    <input
                      type="time"
                      className="form-input"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      aria-label="Schedule time"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.625rem" }}>
            <button
              className="btn btn-secondary"
              onClick={handleSaveDraft}
              disabled={submitting || !selectedBrandId}
            >
              {submitting ? <Loader2 size={14} className="spin" /> : "Save as Draft"}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!content.trim() || isOverLimit || selectedChannels.length === 0 || !selectedBrandId || submitting}
            >
              {submitting ? <Loader2 size={14} className="spin" /> : (scheduleMode === "now" ? "Publish Now" : "Schedule Post")}
            </button>
          </div>

          {saved && (
            <div style={{
              position: "fixed",
              bottom: "1.5rem",
              right: "1.5rem",
              background: "var(--color-success)",
              color: "white",
              padding: "0.75rem 1.25rem",
              borderRadius: "var(--radius-md)",
              fontSize: "0.875rem",
              fontWeight: 500,
              boxShadow: "var(--shadow-lg)",
              zIndex: 200,
            }}>
              Post saved successfully!
            </div>
          )}
        </div>

        {/* Right: Preview */}
        <div style={{ position: "sticky", top: "calc(var(--topbar-height) + 1.5rem)" }}>
          <div className="preview-pane">
            <div className="preview-pane-header">
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: PLATFORM_STYLES[currentPlatform]?.color ?? "#6b7280",
                  display: "inline-block",
                }}
              />
              <span className="preview-pane-title">
                {PLATFORM_PREVIEWS[currentPlatform]} Preview
              </span>
              <button
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  display: "flex",
                }}
                onClick={() => setShowPreview(false)}
                aria-label="Close preview"
              >
                <X size={14} />
              </button>
            </div>
            <div className="preview-pane-body">
              {content ? (
                <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{content}</p>
              ) : (
                <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                  Your post content will appear here...
                </p>
              )}
              {content && (
                <div style={{
                  marginTop: "1rem",
                  paddingTop: "0.75rem",
                  borderTop: "1px solid var(--border-default)",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span>Character count</span>
                    <span style={{ color: isOverLimit ? "var(--color-danger)" : "inherit" }}>
                      {content.length} / {charLimit}
                    </span>
                  </div>
                  <div className="char-progress">
                    <div
                      className="char-progress-fill"
                      style={{
                        width: `${Math.min(charPercent, 100)}%`,
                        background: isOverLimit ? "var(--color-danger)" : "var(--color-primary)",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Multi-platform preview tabs */}
          {selectedPlatforms.length > 1 && (
            <div className="card" style={{ marginTop: "1rem" }}>
              <div className="card-header" style={{ padding: "0.75rem 1rem" }}>
                <h2 style={{ fontSize: "0.875rem" }}>All Platform Previews</h2>
              </div>
              <div style={{ padding: "0 1rem 1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {selectedPlatforms.map((pid) => {
                  const p = PLATFORMS.find((pl) => pl.id === pid) ?? { label: pid, color: "#6b7280", charLimit: 500 };
                  return (
                    <div key={pid} style={{
                      padding: "0.625rem 0.75rem",
                      background: "var(--bg-subtle)",
                      borderRadius: "var(--radius-md)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block" }} />
                      <span style={{ fontSize: "0.8125rem", fontWeight: 500, flex: 1 }}>{p.label}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {content.length > p.charLimit ? (
                          <span style={{ color: "var(--color-danger)" }}>{p.charLimit - content.length} over</span>
                        ) : (
                          `${p.charLimit - content.length} left`
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
