"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CalendarPlus, Check, Loader2, Save, Sparkles, Trash2 } from "lucide-react";
import { api, type AiPlanItem } from "../../../lib/api";
import { cn } from "../../../lib/utils";

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  gbp: "Google Business",
  linkedin: "LinkedIn",
  twitter: "X",
  youtube: "YouTube",
  pinterest: "Pinterest",
};

// Platforms that cannot publish without media. The planner writes copy only,
// so these are saved as drafts until media is attached in the composer.
const NEEDS_MEDIA = new Set(["instagram", "tiktok", "youtube", "pinterest"]);

function formatWhen(iso: string, tz: string) {
  if (!iso) return "No open slot";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function AiPlannerPage() {
  const [brands, setBrands] = useState<Array<{ id: string; name: string; channels: Array<{ platform: string; status: string }> }>>([]);
  const [brandId, setBrandId] = useState<string>("");
  const [aiReady, setAiReady] = useState<boolean | null>(null);

  const [voice, setVoice] = useState("");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceSaving, setVoiceSaving] = useState(false);

  const [platforms, setPlatforms] = useState<string[]>([]);
  const [days, setDays] = useState(7);
  const [perPlatform, setPerPlatform] = useState(3);
  const [theme, setTheme] = useState("");

  const [items, setItems] = useState<AiPlanItem[]>([]);
  const [timezone, setTimezone] = useState("UTC");
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const brand = brands.find((b) => b.id === brandId);
  const connected = Array.from(new Set((brand?.channels ?? []).filter((c) => c.status === "active").map((c) => c.platform)));

  useEffect(() => {
    api.ai.status().then((s) => setAiReady(s.configured)).catch(() => setAiReady(false));
    api.brands
      .list()
      .then((res) => {
        setBrands(res.data);
        if (res.data[0]) setBrandId(res.data[0].id);
      })
      .catch(() => setError("Failed to load brands"));
  }, []);

  useEffect(() => {
    if (!brandId) return;
    setItems([]);
    setNotice(null);
    api.ai.getVoice(brandId).then((v) => setVoice(v.voice_profile)).catch(() => setVoice(""));
  }, [brandId]);

  useEffect(() => {
    setPlatforms(connected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId, brands]);

  const togglePlatform = (p: string) =>
    setPlatforms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  async function saveVoice() {
    setVoiceSaving(true);
    setError(null);
    try {
      await api.ai.setVoice(brandId, voice);
      setNotice("Brand voice saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save voice");
    } finally {
      setVoiceSaving(false);
    }
  }

  async function generate() {
    setGenerating(true);
    setError(null);
    setNotice(null);
    try {
      const res = await api.ai.plan({
        brand_id: brandId,
        platforms,
        days,
        posts_per_platform: perPlatform,
        theme: theme.trim() || undefined,
      });
      setItems(res.items);
      setTimezone(res.timezone);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Plan generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function apply(schedule: boolean) {
    setApplying(true);
    setError(null);
    try {
      const res = await api.ai.applyPlan({
        brand_id: brandId,
        schedule,
        items: items.map((i) => ({
          platform: i.platform,
          caption: i.caption,
          scheduled_at: i.scheduled_at || undefined,
        })),
      });
      const scheduled = res.created.filter((c) => c.status === "scheduled").length;
      const drafts = res.created.length - scheduled;
      setNotice(
        `${scheduled} scheduled, ${drafts} saved as drafts.` +
          (res.skipped.length ? ` ${res.skipped.length} note(s): ${res.skipped.map((s) => s.reason).join("; ")}` : "")
      );
      setItems([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the plan");
    } finally {
      setApplying(false);
    }
  }

  const updateCaption = (idx: number, caption: string) =>
    setItems((cur) => cur.map((it, i) => (i === idx ? { ...it, caption } : it)));
  const removeItem = (idx: number) => setItems((cur) => cur.filter((_, i) => i !== idx));

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Sparkles className="h-6 w-6 text-[var(--color-primary)]" /> AI Planner
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Plan a week of posts in your brand voice, review them, then save as drafts or schedule.
        </p>
      </div>

      {aiReady === false && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          AI generation isn&apos;t set up yet: an LLM key (ANTHROPIC_API_KEY or GEMINI_API_KEY) needs to be added to the API server.
        </div>
      )}
      {error && <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {notice && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-900">
          <Check className="mt-0.5 h-4 w-4 shrink-0" /> {notice}
        </div>
      )}

      <section className="mb-6 rounded-xl border border-[var(--border-default)] bg-white p-5">
        <div className="mb-4 grid gap-4 md:grid-cols-4">
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block font-medium">Brand</span>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="w-full rounded-md border border-[var(--border-default)] bg-white px-3 py-2"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Days to plan</span>
            <input type="number" min={1} max={31} value={days} onChange={(e) => setDays(Number(e.target.value))}
              className="w-full rounded-md border border-[var(--border-default)] px-3 py-2" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Posts per platform</span>
            <input type="number" min={1} max={14} value={perPlatform} onChange={(e) => setPerPlatform(Number(e.target.value))}
              className="w-full rounded-md border border-[var(--border-default)] px-3 py-2" />
          </label>
        </div>

        <div className="mb-4">
          <span className="mb-2 block text-sm font-medium">Platforms</span>
          {connected.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">No connected channels for this brand yet. Connect accounts under Channels.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {connected.map((p) => (
                <button key={p} type="button" onClick={() => togglePlatform(p)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm",
                    platforms.includes(p)
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                      : "border-[var(--border-default)] bg-white text-[var(--text-secondary)]"
                  )}>
                  {PLATFORM_LABELS[p] ?? p}
                </button>
              ))}
            </div>
          )}
        </div>

        <label className="mb-4 block text-sm">
          <span className="mb-1 block font-medium">Focus or theme (optional)</span>
          <input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="e.g. fall color trends, keratin treatments, bridal season"
            className="w-full rounded-md border border-[var(--border-default)] px-3 py-2" />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={generate} disabled={generating || !brandId || platforms.length === 0}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? "Planning..." : "Generate plan"}
          </button>
          <button onClick={() => setVoiceOpen((o) => !o)} className="text-sm text-[var(--text-secondary)] underline">
            {voiceOpen ? "Hide brand voice" : "Edit brand voice"}
          </button>
        </div>

        {voiceOpen && (
          <div className="mt-4">
            <textarea value={voice} onChange={(e) => setVoice(e.target.value)} rows={10}
              placeholder="Describe the brand: audience, tone, dos and don'ts, content pillars, platforms..."
              className="w-full rounded-md border border-[var(--border-default)] px-3 py-2 font-mono text-xs" />
            <button onClick={saveVoice} disabled={voiceSaving}
              className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-sm hover:bg-[var(--bg-hover)] disabled:opacity-50">
              {voiceSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save voice
            </button>
          </div>
        )}
      </section>

      {items.length > 0 && (
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{items.length} posts planned</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Times are shown in {timezone} and use general best-practice slots, not your own analytics yet.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => apply(false)} disabled={applying}
                className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-white px-4 py-2 text-sm font-medium hover:bg-[var(--bg-hover)] disabled:opacity-50">
                <Save className="h-4 w-4" /> Save all as drafts
              </button>
              <button onClick={() => apply(true)} disabled={applying}
                className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50">
                {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />} Schedule
              </button>
            </div>
          </div>

          <ul className="space-y-3">
            {items.map((it, idx) => (
              <li key={`${it.platform}-${it.scheduled_at}-${idx}`} className="rounded-xl border border-[var(--border-default)] bg-white p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="rounded-full bg-[var(--bg-hover)] px-2 py-0.5 font-medium">{PLATFORM_LABELS[it.platform] ?? it.platform}</span>
                    <span className="text-[var(--text-secondary)]">{formatWhen(it.scheduled_at, timezone)}</span>
                    {it.pillar && <span className="text-xs text-[var(--text-secondary)]">· {it.pillar}</span>}
                  </div>
                  <button onClick={() => removeItem(idx)} aria-label="Remove post" className="text-[var(--text-secondary)] hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <textarea value={it.caption} onChange={(e) => updateCaption(idx, e.target.value)} rows={4}
                  className="w-full rounded-md border border-[var(--border-default)] px-3 py-2 text-sm" />
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
                  <span>{it.caption.length} characters</span>
                  {it.media_idea && <span>Media idea: {it.media_idea}</span>}
                </div>
                {NEEDS_MEDIA.has(it.platform) && (
                  <p className="mt-1 text-xs text-amber-700">Needs an image or video. Saved as a draft until media is added in Create Post.</p>
                )}
                {it.warnings.map((w) => (
                  <p key={w} className="mt-1 flex items-center gap-1 text-xs text-red-700">
                    <AlertTriangle className="h-3 w-3" /> {w}
                  </p>
                ))}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
