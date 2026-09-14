"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { contentApi, socialApi } from "@/lib/api";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "#1DA1F2",
  linkedin: "#0A66C2",
  facebook: "#1877F2",
  instagram: "#E4405F",
  tiktok: "#000000",
};

const MAX_CHARS: Record<string, number> = {
  twitter: 280,
  linkedin: 3000,
  facebook: 63206,
  instagram: 2200,
  tiktok: 2200,
};

const ALL_PLATFORMS = ["twitter", "linkedin", "facebook", "instagram", "tiktok"];

type ToneOption = "professional" | "casual" | "humorous" | "inspirational" | "educational";
type LengthOption = "short" | "medium" | "long";

/* ------------------------------------------------------------------ */
/*  Simple inline icons (SVG) — no lucide-react needed               */
/* ------------------------------------------------------------------ */

function IconSend() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IconSparkles() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z" /><path d="M5 3l.9 2.7L8 7l-2.1.8L5 10.5l-.9-2.7L2 7l2.1-.8z" />
    </svg>
  );
}
function IconEye() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function IconX() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function IconReset() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-5H1" />
    </svg>
  );
}
function IconTemplate() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
    </svg>
  );
}
function IconImage() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page (inner, needs Suspense for useSearchParams)            */
/* ------------------------------------------------------------------ */

function CreatePostInner() {
  const searchParams = useSearchParams();
  const brandId = searchParams.get("brandId") || "demo-brand-id";

  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["twitter", "linkedin"]);
  const [isScheduleMode, setIsScheduleMode] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("12:00");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [postStatus, setPostStatus] = useState<"draft" | "scheduled" | "published" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI generation state
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiTone, setAiTone] = useState<ToneOption>("professional");
  const [aiLength, setAiLength] = useState<LengthOption>("medium");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiHashtags, setAiHashtags] = useState<string[]>([]);
  const [aiImagePrompts, setAiImagePrompts] = useState<string[]>([]);

  // Template picker state
  const [showTemplatePanel, setShowTemplatePanel] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateFilter, setTemplateFilter] = useState<string>("all");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const activePlatform = selectedPlatforms[0] || "twitter";
  const minChars = Math.min(...selectedPlatforms.map((p) => MAX_CHARS[p] ?? 500));
  const currentLength = content.length;
  const charProgress = Math.min((currentLength / minChars) * 100, 100);
  const isOverLimit = currentLength > minChars;

  // Load templates when panel opens
  useEffect(() => {
    if (!showTemplatePanel || templates.length > 0) return;
    setTemplatesLoading(true);
    contentApi
      .templates()
      .then((r: any) => setTemplates(r.templates || []))
      .catch(() => setTemplates([]))
      .finally(() => setTemplatesLoading(false));
  }, [showTemplatePanel]);

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform],
    );
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaPreview(URL.createObjectURL(file));
    setMediaType(file.type.startsWith("video") ? "video" : "image");
  };

  // Real AI generation
  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    setAiError("");
    try {
      const result: any = await contentApi.generate({
        topic: aiTopic,
        platform: activePlatform as any,
        tone: aiTone,
        length: aiLength,
        brandId,
      });
      setContent(result.text || "");
      setAiHashtags(result.hashtags || []);
      setAiImagePrompts(result.imagePrompts || []);
      setShowAIPanel(false);
    } catch (err: any) {
      setAiError(err.message || "AI generation failed");
    } finally {
      setAiLoading(false);
    }
  };

  // Apply a template's example text into the composer
  const handleApplyTemplate = (template: any) => {
    setContent(template.example_text || "");
    setShowTemplatePanel(false);
  };

  const handleSchedule = async () => {
    if (!content.trim() || selectedPlatforms.length === 0) return;
    if (!scheduleDate) {
      alert("Please select a date.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const accounts: any = await socialApi.accounts(brandId);
      const matchedAccounts = (accounts.accounts || []).filter((a: any) =>
        selectedPlatforms.includes(a.platform),
      );
      const platforms = matchedAccounts.map((a: any) => ({
        integrationId: a.postiz_account_id,
        settings: { __type: a.platform },
      }));
      if (!platforms.length) {
        platforms.push(...selectedPlatforms.map((p) => ({ integrationId: p, settings: { __type: p } })));
      }
      await socialApi.createPost(brandId, {
        content,
        platforms,
        scheduledAt: new Date(`${scheduleDate}T${scheduleTime}`).toISOString(),
      });
      setPostStatus("scheduled");
    } catch (err: any) {
      setSubmitError(err.message || "Failed to schedule post");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishNow = async () => {
    if (!content.trim() || selectedPlatforms.length === 0) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const accounts: any = await socialApi.accounts(brandId);
      const matchedAccounts = (accounts.accounts || []).filter((a: any) =>
        selectedPlatforms.includes(a.platform),
      );
      const platforms = matchedAccounts.map((a: any) => ({
        integrationId: a.postiz_account_id,
        settings: { __type: a.platform },
      }));
      if (!platforms.length) {
        platforms.push(...selectedPlatforms.map((p) => ({ integrationId: p, settings: { __type: p } })));
      }
      await socialApi.createPost(brandId, { content, platforms });
      setPostStatus("published");
    } catch (err: any) {
      setSubmitError(err.message || "Failed to publish post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await socialApi.createPost(brandId, {
        content,
        platforms: selectedPlatforms.map((p) => ({ integrationId: p, settings: { __type: p } })),
        status: "draft",
      });
      setPostStatus("draft");
    } catch (err: any) {
      setSubmitError(err.message || "Failed to save draft");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setContent("");
    setSelectedPlatforms(["twitter", "linkedin"]);
    setIsScheduleMode(false);
    setScheduleDate("");
    setScheduleTime("12:00");
    setMediaPreview(null);
    setMediaType(null);
    setShowPreview(false);
    setPostStatus(null);
    setAiHashtags([]);
    setAiImagePrompts([]);
    setSubmitError("");
  };

  const filteredTemplates = templateFilter === "all"
    ? templates
    : templates.filter((t) => t.category === templateFilter || t.platform === templateFilter);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Create Post</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            Write, schedule and publish social media content
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-secondary btn-sm" onClick={handleSaveDraft} disabled={submitting || !content.trim()}>
            Save Draft
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowPreview((v) => !v)}>
            <IconEye /> Preview
          </button>
        </div>
      </div>

      {/* Status Banner */}
      {postStatus && (
        <div style={{
          padding: "0.75rem 1rem",
          borderRadius: "var(--radius-md)",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: postStatus === "published" ? "#dcfce7" : postStatus === "scheduled" ? "#fef9c3" : "#f3f4f6",
          color: postStatus === "published" ? "#166534" : postStatus === "scheduled" ? "#854d0e" : "#374151",
          fontSize: "0.875rem",
          fontWeight: 500,
        }}>
          <span>
            {postStatus === "published" && "✓ Post published successfully!"}
            {postStatus === "scheduled" && `✓ Scheduled for ${scheduleDate} at ${scheduleTime}`}
            {postStatus === "draft" && "✓ Draft saved"}
          </span>
          <button onClick={() => setPostStatus(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: "0.25rem" }}>
            <IconX />
          </button>
        </div>
      )}

      {/* Submit Error */}
      {submitError && (
        <div style={{ padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", marginBottom: "1rem", background: "#fee2e2", color: "#991b1b", fontSize: "0.875rem" }}>
          {submitError}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: showPreview ? "1fr 360px" : "1fr", gap: "1.5rem", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Platform Selector */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600 }}>Select Platforms</h3>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {selectedPlatforms.length} selected
              </span>
            </div>
            <div style={{ padding: "0.875rem 1.25rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {ALL_PLATFORMS.map((platform) => {
                const isSelected = selectedPlatforms.includes(platform);
                const color = PLATFORM_COLORS[platform] ?? "#6b7280";
                return (
                  <button
                    key={platform}
                    onClick={() => togglePlatform(platform)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      padding: "0.375rem 0.875rem",
                      borderRadius: "var(--radius-md)",
                      border: `1.5px solid ${isSelected ? color : "var(--border-default)"}`,
                      background: isSelected ? `${color}18` : "transparent",
                      color: isSelected ? color : "var(--text-secondary)",
                      fontSize: "0.8125rem",
                      fontWeight: isSelected ? 600 : 400,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, opacity: isSelected ? 1 : 0.35, display: "inline-block" }} />
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </button>
                );
              })}
            </div>
            {selectedPlatforms.length === 0 && (
              <div style={{ padding: "0 1.25rem 1rem", fontSize: "0.8rem", color: "var(--color-danger)" }}>
                Select at least one platform
              </div>
            )}
          </div>

          {/* AI Generator Panel */}
          <div className="card">
            <div className="card-header" style={{ justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                <IconSparkles /> Generate with AI
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAIPanel((v) => !v)}>
                {showAIPanel ? "Collapse" : "Expand"}
              </button>
            </div>
            {showAIPanel && (
              <div style={{ padding: "0.875rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Topic or idea *</label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="e.g. How AI is transforming social media marketing"
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      border: "1.5px solid var(--border-default)",
                      borderRadius: "var(--radius-md)",
                      fontSize: "0.875rem",
                      background: "var(--bg-base)",
                      color: "var(--text-primary)",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Tone</label>
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value as ToneOption)}
                      style={{
                        width: "100%",
                        padding: "0.5rem 0.75rem",
                        border: "1.5px solid var(--border-default)",
                        borderRadius: "var(--radius-md)",
                        fontSize: "0.875rem",
                        background: "var(--bg-base)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="humorous">Humorous</option>
                      <option value="inspirational">Inspirational</option>
                      <option value="educational">Educational</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Length</label>
                    <select
                      value={aiLength}
                      onChange={(e) => setAiLength(e.target.value as LengthOption)}
                      style={{
                        width: "100%",
                        padding: "0.5rem 0.75rem",
                        border: "1.5px solid var(--border-default)",
                        borderRadius: "var(--radius-md)",
                        fontSize: "0.875rem",
                        background: "var(--bg-base)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <option value="short">Short</option>
                      <option value="medium">Medium</option>
                      <option value="long">Long</option>
                    </select>
                  </div>
                </div>
                {aiError && (
                  <div style={{ fontSize: "0.8125rem", color: "#dc2626", padding: "0.5rem 0.75rem", background: "#fee2e2", borderRadius: "var(--radius-sm)" }}>
                    {aiError}
                  </div>
                )}
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleAIGenerate}
                  disabled={aiLoading || !aiTopic.trim()}
                  style={{ alignSelf: "flex-start" }}
                >
                  <IconSparkles />
                  {aiLoading ? "Generating..." : "Generate Post"}
                </button>
                {aiHashtags.length > 0 && (
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    Suggested hashtags:{" "}
                    {aiHashtags.map((h) => (
                      <button
                        key={h}
                        onClick={() => setContent((c) => c + (c ? " " : "") + (h.startsWith("#") ? h : `#${h}`))}
                        style={{ background: "none", border: "none", color: "var(--color-primary)", cursor: "pointer", fontSize: "0.8125rem", padding: "0 0.125rem" }}
                      >
                        {h.startsWith("#") ? h : `#${h}`}
                      </button>
                    ))}
                  </div>
                )}
                {aiImagePrompts.length > 0 && (
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    <strong>Image ideas:</strong>
                    <ul style={{ margin: "0.25rem 0 0", paddingLeft: "1.25rem" }}>
                      {aiImagePrompts.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Template Picker */}
          <div className="card">
            <div className="card-header" style={{ justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                <IconTemplate /> Viral Templates
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowTemplatePanel((v) => !v)}>
                {showTemplatePanel ? "Collapse" : "Browse"}
              </button>
            </div>
            {showTemplatePanel && (
              <div style={{ padding: "0.875rem 1.25rem" }}>
                {/* Filter tabs */}
                <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", marginBottom: "0.875rem" }}>
                  {["all", "hook", "story", "cta", "engagement", "promo"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setTemplateFilter(cat)}
                      style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "var(--radius-md)",
                        border: `1px solid ${templateFilter === cat ? "var(--color-primary)" : "var(--border-default)"}`,
                        background: templateFilter === cat ? "var(--color-primary)" : "transparent",
                        color: templateFilter === cat ? "#fff" : "var(--text-secondary)",
                        fontSize: "0.75rem",
                        fontWeight: templateFilter === cat ? 600 : 400,
                        cursor: "pointer",
                      }}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>

                {templatesLoading ? (
                  <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>Loading templates...</div>
                ) : filteredTemplates.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>No templates found</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: 320, overflowY: "auto" }}>
                    {filteredTemplates.map((template) => (
                      <div
                        key={template.id}
                        style={{
                          padding: "0.75rem",
                          border: "1px solid var(--border-default)",
                          borderRadius: "var(--radius-md)",
                          cursor: "pointer",
                          transition: "border-color 0.15s, background 0.15s",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-primary)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-subtle)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                        onClick={() => handleApplyTemplate(template)}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                          <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>{template.name}</span>
                          <div style={{ display: "flex", gap: "0.25rem" }}>
                            <span style={{
                              fontSize: "0.7rem",
                              padding: "0.125rem 0.5rem",
                              borderRadius: "9999px",
                              background: "var(--bg-subtle)",
                              color: "var(--text-muted)",
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                            }}>
                              {template.category}
                            </span>
                            <span style={{
                              fontSize: "0.7rem",
                              padding: "0.125rem 0.5rem",
                              borderRadius: "9999px",
                              background: "var(--bg-subtle)",
                              color: "var(--text-muted)",
                            }}>
                              {template.platform}
                            </span>
                          </div>
                        </div>
                        <p style={{
                          fontSize: "0.8rem",
                          color: "var(--text-secondary)",
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          whiteSpace: "pre-wrap",
                        }}>
                          {template.example_text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Post Composer */}
          <div className="card">
            <div className="card-header" style={{ justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600 }}>Write your post</h3>
              <span style={{ fontSize: "0.75rem", color: isOverLimit ? "var(--color-danger)" : currentLength > minChars * 0.9 ? "var(--color-warning)" : "var(--text-muted)", fontWeight: isOverLimit ? 600 : 400 }}>
                {currentLength}/{minChars}
              </span>
            </div>
            <div style={{ padding: "0.875rem 1.25rem" }}>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post or generate with AI above..."
                style={{
                  width: "100%",
                  minHeight: 160,
                  padding: "0.75rem",
                  border: `1.5px solid ${isOverLimit ? "var(--color-danger)" : "var(--border-default)"}`,
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.9375rem",
                  lineHeight: 1.6,
                  resize: "vertical",
                  outline: "none",
                  fontFamily: "inherit",
                  color: "var(--text-primary)",
                  background: "var(--bg-base)",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => { if (!isOverLimit) e.currentTarget.style.borderColor = "var(--color-primary)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = isOverLimit ? "var(--color-danger)" : "var(--border-default)"; }}
              />

              {/* Progress bar */}
              <div style={{ height: 3, background: "var(--border-default)", borderRadius: 2, marginTop: "0.375rem", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${Math.min(charProgress, 100)}%`,
                  background: isOverLimit ? "var(--color-danger)" : currentLength > minChars * 0.9 ? "var(--color-warning)" : "var(--color-primary)",
                  borderRadius: 2,
                  transition: "width 0.15s, background 0.15s",
                }} />
              </div>

              {/* Character limit per platform */}
              {selectedPlatforms.length > 1 && (
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                  {selectedPlatforms.map((p) => {
                    const limit = MAX_CHARS[p] ?? 500;
                    const over = currentLength > limit;
                    return (
                      <span key={p} style={{ fontSize: "0.7rem", color: over ? "var(--color-danger)" : "var(--text-muted)" }}>
                        {p}: {currentLength}/{limit}{over ? " ⚠" : ""}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Media Upload */}
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
                <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleMediaChange} />
                <button className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>
                  <IconImage /> Add Media
                </button>
                {mediaPreview && (
                  <button className="btn btn-secondary btn-sm" onClick={() => { setMediaPreview(null); setMediaType(null); }}>
                    <IconX /> Remove
                  </button>
                )}
              </div>

              {mediaPreview && (
                <div style={{ marginTop: "0.75rem", borderRadius: "var(--radius-md)", overflow: "hidden", maxHeight: 240 }}>
                  {mediaType === "video"
                    ? <video src={mediaPreview} controls style={{ width: "100%", maxHeight: 240, display: "block" }} />
                    : <img src={mediaPreview} alt="Preview" style={{ width: "100%", maxHeight: 240, objectFit: "cover", display: "block" }} />}
                </div>
              )}

              {/* Schedule Toggle */}
              <div style={{ marginTop: "1rem", padding: "0.75rem", background: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 }}>
                  <input type="checkbox" checked={isScheduleMode} onChange={(e) => setIsScheduleMode(e.target.checked)} style={{ accentColor: "#0f766e", width: 15, height: 15 }} />
                  <IconCalendar /> Schedule this post
                </label>
                {isScheduleMode && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.75rem" }}>
                    <div>
                      <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Date</label>
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        style={{ width: "100%", padding: "0.375rem 0.5rem", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", fontSize: "0.875rem", background: "var(--bg-base)", color: "var(--text-primary)" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Time</label>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        style={{ width: "100%", padding: "0.375rem 0.5rem", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", fontSize: "0.875rem", background: "var(--bg-base)", color: "var(--text-primary)" }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                <button className="btn btn-ghost btn-sm" onClick={handleReset}>
                  <IconReset /> Reset
                </button>
                {isScheduleMode && (
                  <button
                    className="btn btn-secondary"
                    onClick={handleSchedule}
                    disabled={submitting || !content.trim() || selectedPlatforms.length === 0 || !scheduleDate}
                  >
                    <IconCalendar /> {submitting ? "Scheduling..." : "Schedule"}
                  </button>
                )}
                {!isScheduleMode && (
                  <button
                    className="btn btn-primary"
                    onClick={handlePublishNow}
                    disabled={submitting || !content.trim() || selectedPlatforms.length === 0}
                  >
                    <IconSend /> {submitting ? "Publishing..." : "Publish Now"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="card" style={{ position: "sticky", top: "1.5rem" }}>
            <div className="card-header" style={{ justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600 }}>Preview</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowPreview(false)}><IconX /></button>
            </div>
            <div style={{ padding: "1rem 1.25rem" }}>
              {/* Platform tabs in preview */}
              {selectedPlatforms.length > 1 && (
                <div style={{ display: "flex", gap: "0.375rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                  {selectedPlatforms.map((p) => (
                    <span key={p} style={{
                      padding: "0.125rem 0.625rem",
                      borderRadius: "9999px",
                      background: `${PLATFORM_COLORS[p] || "#6b7280"}18`,
                      color: PLATFORM_COLORS[p] || "#6b7280",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </span>
                  ))}
                </div>
              )}

              {/* Mock post card */}
              <div style={{ background: "var(--bg-subtle)", borderRadius: "var(--radius-md)", padding: "0.875rem", border: "1px solid var(--border-default)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: PLATFORM_COLORS[activePlatform] || "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.75rem", fontWeight: 700 }}>
                    {activePlatform.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>Your Brand</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Just now · {activePlatform}</div>
                  </div>
                </div>

                {mediaPreview && (
                  <div style={{ borderRadius: "var(--radius-sm)", overflow: "hidden", marginBottom: "0.625rem" }}>
                    {mediaType === "video"
                      ? <video src={mediaPreview} style={{ width: "100%", display: "block" }} />
                      : <img src={mediaPreview} alt="" style={{ width: "100%", display: "block" }} />}
                  </div>
                )}

                <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "var(--text-primary)", margin: 0, whiteSpace: "pre-wrap" }}>
                  {content || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Your post will appear here...</span>}
                </p>

                {activePlatform === "twitter" && currentLength > 0 && (
                  <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: isOverLimit ? "#dc2626" : "var(--text-muted)" }}>
                    {currentLength}/280
                  </div>
                )}
              </div>

              <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-default)", display: "flex", gap: "0.5rem" }}>
                {isScheduleMode ? (
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={handleSchedule} disabled={submitting || !content.trim() || !scheduleDate}>
                    <IconCalendar /> Schedule
                  </button>
                ) : (
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={handlePublishNow} disabled={submitting || !content.trim()}>
                    <IconSend /> Publish
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreatePostPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2.5rem", textAlign: "center" }}>Loading...</div>}>
      <CreatePostInner />
    </Suspense>
  );
}
