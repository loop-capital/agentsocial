"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon,
  Check,
  Clock,
  ImageIcon,
  Loader2,
  MonitorPlay,
  Save,
  Send,
  Sparkles,
  Type,
  Wand2,
} from "lucide-react";
import { format, addHours, startOfTomorrow } from "date-fns";
import { api } from "../../../lib/api";
import { cn } from "../../../lib/utils";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", color: "#e4405f", maxChars: 2200 },
  { id: "tiktok", label: "TikTok", color: "#000000", maxChars: 2200 },
  { id: "facebook", label: "Facebook", color: "#1877f2", maxChars: 63206 },
  { id: "youtube", label: "YouTube", color: "#ff0000", maxChars: 5000 },
  { id: "twitter", label: "X", color: "#1da1f2", maxChars: 280 },
  { id: "linkedin", label: "LinkedIn", color: "#0a66c2", maxChars: 3000 },
  { id: "gbp", label: "GBP", color: "#9ca3af", maxChars: 1500 },
];

const TABS = [
  { id: "text", label: "Text", icon: Type },
  { id: "image", label: "Image", icon: ImageIcon },
  { id: "video", label: "Video", icon: MonitorPlay },
  { id: "ai", label: "AI Generate", icon: Sparkles },
];

type Media = { type: "image" | "video"; url: string; alt_text?: string };
type VideoJob = { jobId: string; status: string; progress?: number; url?: string };

export default function CreatePostPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("text");
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);
  const [channels, setChannels] = useState<Array<{ id: string; platform: string; name: string; status: string }>>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);

  const [scheduleMode, setScheduleMode] = useState<"now" | "later" | "best">("now");
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [bestTime, setBestTime] = useState<string | null>(null);

  const [media, setMedia] = useState<Media[]>([]);
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [videoJob, setVideoJob] = useState<VideoJob | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    api.brands
      .list()
      .then((res) => {
        setBrands(res.data.map((b) => ({ id: b.id, name: b.name })));
        if (res.data.length > 0) {
          setBrandId(res.data[0].id);
        }
      })
      .catch(() => setError("Failed to load brands"))
      .finally(() => setLoadingBrands(false));
  }, []);

  useEffect(() => {
    if (!brandId) return;
    api.channels.list(brandId).then((res) => setChannels(res.data)).catch(() => setError("Failed to load channels"));
  }, [brandId]);

  // Edit mode: /create-post?edit=<postId> (used by the calendar and queue Edit buttons)
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("edit");
    if (!id) return;
    api.posts
      .get(id)
      .then((post) => {
        setEditingId(post.id);
        setBrandId(post.brand_id);
        setContent(post.content);
        setSelectedPlatforms(Array.from(new Set(post.channels.map((c) => c.platform.toLowerCase()))));
        if (post.scheduled_at) {
          setScheduleMode("later");
          setScheduledAt(format(new Date(post.scheduled_at), "yyyy-MM-dd'T'HH:mm"));
        }
      })
      .catch(() => setError("Could not load that post for editing"));
  }, []);

  const channelIdsForPlatforms = useMemo(() => {
    return channels
      .filter((c) => selectedPlatforms.includes(c.platform.toLowerCase()) && c.status === "active")
      .map((c) => c.id);
  }, [channels, selectedPlatforms]);

  const lowestMaxChars = useMemo(() => {
    const selected = PLATFORMS.filter((p) => selectedPlatforms.includes(p.id));
    if (selected.length === 0) return 2200;
    return Math.min(...selected.map((p) => p.maxChars));
  }, [selectedPlatforms]);

  function togglePlatform(id: string) {
    setSelectedPlatforms((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function suggestBestTime() {
    setScheduleMode("best");
    const platform = selectedPlatforms[0];
    try {
      if (!brandId || !platform) throw new Error("no platform");
      // General best-practice slots for the platform in the brand's timezone (not analytics-based yet)
      const res = await api.ai.bestTimes(brandId, platform, 1);
      if (!res.slots[0]) throw new Error("no slot");
      setBestTime(format(new Date(res.slots[0]), "yyyy-MM-dd'T'HH:mm"));
    } catch {
      setBestTime(format(addHours(startOfTomorrow(), 11), "yyyy-MM-dd'T'HH:mm"));
    }
  }

  async function generateImage() {
    if (!brandId) return setError("Select a brand first");
    const caption = imagePrompt || content;
    if (!caption.trim()) return setError("Enter a caption or image prompt");
    setGeneratingImage(true);
    setError(null);
    try {
      const ratio = activeTab === "image" ? "1:1" : "9:16";
      const res = await api.generation.imageFromCaption({ caption, aspectRatio: ratio as any }, brandId);
      if (res.imageUrl) {
        setMedia((prev) => [...prev, { type: "image", url: res.imageUrl, alt_text: caption.slice(0, 100) }]);
      } else {
        setError("No image returned");
      }
    } catch (err: any) {
      setError(err.message || "Image generation failed");
    } finally {
      setGeneratingImage(false);
    }
  }

  async function generateVideo() {
    if (!brandId) return setError("Select a brand first");
    const caption = imagePrompt || content;
    if (!caption.trim()) return setError("Enter a caption or video prompt");
    setGeneratingVideo(true);
    setError(null);
    setVideoJob(null);
    try {
      const firstImage = media.find((m) => m.type === "image");
      const res = await api.generation.videoFromCaption(
        { caption, imageUrl: firstImage?.url || null, aspectRatio: "9:16" },
        brandId
      );
      setVideoJob({ jobId: res.jobId, status: res.status });
      pollVideoJob(res.jobId);
    } catch (err: any) {
      setError(err.message || "Video generation failed");
    } finally {
      setGeneratingVideo(false);
    }
  }

  function pollVideoJob(jobId: string) {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const status = await api.generation.videoFromCaptionStatus(jobId);
        setVideoJob({
          jobId: status.jobId || jobId,
          status: status.status,
          url: status.videoUrl,
        });
        if (status.status === "completed" && status.videoUrl) {
          setMedia((prev) => [...prev, { type: "video", url: status.videoUrl!, alt_text: content.slice(0, 100) }]);
          clearInterval(interval);
        }
        if (status.status === "failed" || attempts > 60) {
          clearInterval(interval);
        }
      } catch {
        clearInterval(interval);
      }
    }, 5000);
  }

  function removeMedia(url: string) {
    setMedia((prev) => prev.filter((m) => m.url !== url));
  }

  async function handleSubmit(action: "draft" | "schedule" | "publish") {
    if (!brandId) return setError("Select a brand first");
    if (!content.trim() && media.length === 0) return setError("Add a caption or media");
    if (selectedPlatforms.length === 0 && action !== "draft") return setError("Select at least one platform");
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      let scheduled: string | undefined;
      if (action === "schedule") {
        if (scheduleMode === "later" && scheduledAt) scheduled = new Date(scheduledAt).toISOString();
        else if (scheduleMode === "best" && bestTime) scheduled = new Date(bestTime).toISOString();
        else if (scheduleMode === "now") scheduled = new Date().toISOString();
        else scheduled = new Date().toISOString();
      }

      const payload = {
        brand_id: brandId,
        content,
        channels: channelIdsForPlatforms,
        media,
        scheduled_at: scheduled,
        tags: [],
      };

      let post: { id: string };
      if (editingId) {
        // Editing keeps attached media; only text, channels and time change
        const updated = await api.posts.update(editingId, {
          content,
          channels: channelIdsForPlatforms,
          ...(action === "draft" ? {} : { scheduled_at: scheduled ?? new Date().toISOString() }),
        });
        post = updated;
        // Turning a scheduled post back into a draft also clears its queued job
        if (action === "draft") await api.posts.cancel(editingId).catch(() => undefined);
      } else {
        post = await api.posts.create(payload);
      }

      if (action === "publish" && post.id) {
        await api.posts.publish(post.id);
      }

      setSuccess(action === "draft" ? (editingId ? "Changes saved" : "Draft saved") : action === "schedule" ? "Post scheduled" : "Publishing now. Check the queue for status");
      if (action !== "draft") {
        setTimeout(() => router.push("/queue"), 800);
      } else {
        setTimeout(() => router.push("/content-calendar"), 800);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save post");
    } finally {
      setSaving(false);
    }
  }

  if (loadingBrands) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Create Post</h1>
          <p className="text-sm text-[var(--text-secondary)]">Build, preview, and schedule content across your channels.</p>
        </div>
        <select
          className="rounded-md border border-[var(--border-default)] bg-white px-3 py-2 text-sm"
          value={brandId || ""}
          onChange={(e) => setBrandId(e.target.value)}
        >
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      {success && <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-600">{success}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 rounded-lg border border-[var(--border-default)] bg-white p-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
                    activeTab === tab.id ? "bg-[var(--color-primary)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  )}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content composer */}
          <div className="rounded-xl border border-[var(--border-default)] bg-white p-5 shadow-sm">
            <label className="mb-2 block text-sm font-medium">Caption / Hook</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What do you want to share?"
              className="min-h-[160px] w-full resize-y rounded-lg border border-[var(--border-default)] p-4 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]"
            />
            <div className="mt-2 flex justify-between text-xs text-[var(--text-muted)]">
              <span>{content.length} / {lowestMaxChars}</span>
              {content.length > lowestMaxChars && <span className="text-red-500">Over limit for selected platforms</span>}
            </div>
          </div>

          {/* AI generation controls */}
          {activeTab === "image" || activeTab === "ai" ? (
            <div className="rounded-xl border border-[var(--border-default)] bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Wand2 size={16} className="text-[var(--color-primary)]" />
                AI Generation
              </div>
              <input
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Optional override prompt (defaults to caption)"
                className="mb-3 w-full rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={generateImage}
                  disabled={generatingImage}
                  className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
                >
                  {generatingImage ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                  Generate image from caption
                </button>
                <button
                  onClick={generateVideo}
                  disabled={generatingVideo}
                  className="flex items-center gap-2 rounded-lg border border-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] disabled:opacity-60"
                >
                  {generatingVideo ? <Loader2 size={16} className="animate-spin" /> : <MonitorPlay size={16} />}
                  Generate video from caption
                </button>
              </div>
              {videoJob && (
                <div className="mt-4 rounded-lg bg-[var(--bg-subtle)] p-3 text-sm">
                  <div className="flex items-center gap-2">
                    {videoJob.status !== "completed" && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    <span className="font-medium">Video job:</span> {videoJob.status}
                    {videoJob.progress !== undefined && <span className="ml-auto">{videoJob.progress}%</span>}
                  </div>
                  {videoJob.url && (
                    <video src={videoJob.url} controls className="mt-2 max-h-48 rounded-lg" />
                  )}
                </div>
              )}
            </div>
          ) : null}

          {/* Media preview */}
          {media.length > 0 && (
            <div className="rounded-xl border border-[var(--border-default)] bg-white p-5 shadow-sm">
              <div className="mb-3 text-sm font-medium">Attached media</div>
              <div className="flex flex-wrap gap-3">
                {media.map((m) => (
                  <div key={m.url} className="group relative">
                    {m.type === "image" ? (
                      <img src={m.url} alt={m.alt_text || ""} className="h-32 w-32 rounded-lg object-cover" />
                    ) : (
                      <video src={m.url} className="h-32 w-32 rounded-lg object-cover" />
                    )}
                    <button
                      onClick={() => removeMedia(m.url)}
                      className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white opacity-0 transition group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Platforms */}
          <div className="rounded-xl border border-[var(--border-default)] bg-white p-5 shadow-sm">
            <div className="mb-3 text-sm font-medium">Platforms</div>
            <div className="flex flex-wrap gap-3">
              {PLATFORMS.map((p) => {
                const active = selectedPlatforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition",
                      active ? "border-transparent text-white" : "border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    )}
                    style={{ backgroundColor: active ? p.color : undefined }}
                  >
                    {active && <Check size={14} />}
                    {p.label}
                  </button>
                );
              })}
            </div>
            {channelIdsForPlatforms.length === 0 && selectedPlatforms.length > 0 && (
              <p className="mt-2 text-xs text-red-500">No connected active channels for these platforms. Connect channels first.</p>
            )}
          </div>

          {/* Scheduling */}
          <div className="rounded-xl border border-[var(--border-default)] bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <CalendarIcon size={16} />
              Schedule
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="schedule"
                  checked={scheduleMode === "now"}
                  onChange={() => setScheduleMode("now")}
                />
                Post now
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="schedule"
                  checked={scheduleMode === "later"}
                  onChange={() => setScheduleMode("later")}
                />
                Later
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="schedule"
                  checked={scheduleMode === "best"}
                  onChange={() => setScheduleMode("best")}
                />
                Best Time
                <Clock size={14} className="text-[var(--color-warning)]" />
              </label>
            </div>
            {scheduleMode === "later" && (
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="mt-3 rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm"
              />
            )}
            {scheduleMode === "best" && (
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="datetime-local"
                  value={bestTime || ""}
                  readOnly
                  className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 py-2 text-sm"
                />
                <button
                  onClick={suggestBestTime}
                  className="flex items-center gap-2 rounded-lg bg-[var(--color-warning-bg)] px-3 py-2 text-sm font-medium text-[var(--color-warning)]"
                >
                  <Sparkles size={14} />
                  Suggest
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleSubmit("draft")}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-60"
            >
              <Save size={16} />
              Save Draft
            </button>
            <button
              onClick={() => handleSubmit("schedule")}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
            >
              <CalendarIcon size={16} />
              Schedule
            </button>
            <button
              onClick={() => handleSubmit("publish")}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[var(--color-success)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              <Send size={16} />
              Post Now
            </button>
          </div>
        </div>

        {/* Preview panel */}
        <div className="space-y-6">
          <div className="sticky top-6 rounded-xl border border-[var(--border-default)] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium">Preview</span>
              <span className="text-xs text-[var(--text-muted)]">{selectedPlatforms.length || "All"} platform(s)</span>
            </div>
            <div className="space-y-5">
              {(selectedPlatforms.length === 0 ? PLATFORMS.map((p) => p.id) : selectedPlatforms).map((platformId) => {
                const platform = PLATFORMS.find((p) => p.id === platformId)!;
                return (
                  <div key={platform.id} className="rounded-lg border border-[var(--border-default)] p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full" style={{ backgroundColor: platform.color }} />
                      <div>
                        <div className="text-xs font-semibold">{platform.label}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">@brandhandle</div>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-[var(--text-primary)]">
                      {content || <span className="text-[var(--text-muted)]">Your caption will appear here...</span>}
                    </p>
                    {media.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {media.map((m) =>
                          m.type === "image" ? (
                            <img key={m.url} src={m.url} alt="" className="h-24 w-full rounded-md object-cover" />
                          ) : (
                            <video key={m.url} src={m.url} className="h-24 w-full rounded-md object-cover" />
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
