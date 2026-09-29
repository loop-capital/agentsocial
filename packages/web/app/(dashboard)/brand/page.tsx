"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, CheckCircle2, Circle, Loader2, Save } from "lucide-react";
import { api, type BrandHub, type BrandProfile } from "../../../lib/api";
import { cn } from "../../../lib/utils";

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", gbp: "Google Business",
  linkedin: "LinkedIn", twitter: "X", youtube: "YouTube", pinterest: "Pinterest",
};

const BOOKING_PROVIDERS = [
  { id: "none", label: "None / not sure" },
  { id: "square", label: "Square" },
  { id: "phorest", label: "Phorest" },
  { id: "vagaro", label: "Vagaro" },
  { id: "boulevard", label: "Boulevard" },
  { id: "mindbody", label: "Mindbody" },
  { id: "other", label: "Other" },
];

const toLines = (a?: string[]) => (a ?? []).join("\n");
const fromLines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

function timezones(): string[] {
  try {
    return (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf("timeZone");
  } catch {
    return ["UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles"];
  }
}

const inputCls = "w-full rounded-md border border-[var(--border-default)] bg-white px-3 py-2 text-sm";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-[var(--text-secondary)]">{hint}</span>}
    </label>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-xl border border-[var(--border-default)] bg-white p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      {subtitle && <p className="mb-4 text-sm text-[var(--text-secondary)]">{subtitle}</p>}
      <div className={cn("space-y-4", subtitle ? "" : "mt-4")}>{children}</div>
    </section>
  );
}

export default function BrandHubPage() {
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);
  const [brandId, setBrandId] = useState("");
  const [hub, setHub] = useState<BrandHub | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // form state (list fields are edited as one-item-per-line text)
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [profile, setProfile] = useState<BrandProfile>({});
  const [voice, setVoice] = useState("");
  const [lists, setLists] = useState({ pain: "", dreams: "", goals: "", pillars: "", dos: "", donts: "", hashtags: "" });

  const tzOptions = useMemo(timezones, []);

  useEffect(() => {
    api.brands
      .list()
      .then((res) => {
        setBrands(res.data.map((b) => ({ id: b.id, name: b.name })));
        if (res.data[0]) setBrandId(res.data[0].id);
        else setLoading(false);
      })
      .catch(() => {
        setError("Failed to load brands");
        setLoading(false);
      });
  }, []);

  function hydrate(h: BrandHub) {
    setHub(h);
    setName(h.brand.name);
    setTimezone(h.brand.timezone);
    setProfile(h.profile);
    setVoice(h.voice_profile);
    setLists({
      pain: toLines(h.profile.audience?.pain_points),
      dreams: toLines(h.profile.audience?.dream_outcomes),
      goals: toLines(h.profile.goals),
      pillars: toLines(h.profile.pillars),
      dos: toLines(h.profile.dos),
      donts: toLines(h.profile.donts),
      hashtags: (h.profile.hashtags ?? []).join(" "),
    });
  }

  useEffect(() => {
    if (!brandId) return;
    setLoading(true);
    setError(null);
    api.hub
      .get(brandId)
      .then(hydrate)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load brand"))
      .finally(() => setLoading(false));
  }, [brandId]);

  const set = <K extends keyof BrandProfile>(k: K, v: BrandProfile[K]) => setProfile((p) => ({ ...p, [k]: v }));

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await api.hub.update(brandId, {
        name,
        timezone,
        voice_profile: voice,
        profile: {
          ...profile,
          audience: { ...profile.audience, pain_points: fromLines(lists.pain), dream_outcomes: fromLines(lists.dreams) },
          goals: fromLines(lists.goals),
          pillars: fromLines(lists.pillars),
          dos: fromLines(lists.dos),
          donts: fromLines(lists.donts),
          hashtags: lists.hashtags.split(/\s+/).filter(Boolean),
        },
      });
      hydrate(updated);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !hub) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  const score = hub?.checklist.score ?? 0;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Brand Hub</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Describe the business once. The AI Planner, composer and every other tool read from here.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {brands.length > 1 && (
            <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="rounded-md border border-[var(--border-default)] bg-white px-3 py-2 text-sm">
              {brands.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
            </select>
          )}
          <button onClick={save} disabled={saving || !hub}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {saved && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-900">
          <Check className="h-4 w-4" /> Saved.
        </div>
      )}

      {hub && (
        <>
          <Card title={`Setup ${score}% complete`} subtitle="The more the AI knows, the more the posts sound like you.">
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-hover)]">
              <div className="h-full rounded-full bg-[var(--color-primary)] transition-all" style={{ width: `${score}%` }} />
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {hub.checklist.items.map((i) => (
                <li key={i.key} className="flex items-start gap-2 text-sm">
                  {i.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-secondary)]" />}
                  <span>
                    <span className={cn(i.done ? "text-[var(--text-secondary)]" : "")}>{i.label}</span>
                    {!i.done && <span className="block text-xs text-[var(--text-secondary)]">{i.hint}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Business basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Business name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
              <Field label="Timezone" hint="Scheduled posts go out in this timezone.">
                <select className={inputCls} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                  {[...new Set([timezone, ...tzOptions])].map((tz) => (<option key={tz} value={tz}>{tz}</option>))}
                </select>
              </Field>
              <Field label="Industry"><input className={inputCls} value={profile.industry ?? ""} onChange={(e) => set("industry", e.target.value)} placeholder="e.g. Hair salon" /></Field>
              <Field label="City / area served"><input className={inputCls} value={profile.city ?? ""} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Columbus, OH" /></Field>
              <Field label="Website"><input className={inputCls} value={profile.website ?? ""} onChange={(e) => set("website", e.target.value)} placeholder="https://" /></Field>
            </div>
            <Field label="About the business"><textarea rows={3} className={inputCls} value={profile.description ?? ""} onChange={(e) => set("description", e.target.value)} /></Field>
          </Card>

          <Card title="Audience and goals">
            <Field label="Ideal customer"><textarea rows={3} className={inputCls} value={profile.audience?.icp ?? ""} onChange={(e) => setProfile((p) => ({ ...p, audience: { ...p.audience, icp: e.target.value } }))} placeholder="Who are you trying to reach?" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Their pain points" hint="One per line"><textarea rows={4} className={inputCls} value={lists.pain} onChange={(e) => setLists({ ...lists, pain: e.target.value })} /></Field>
              <Field label="Outcomes they want" hint="One per line"><textarea rows={4} className={inputCls} value={lists.dreams} onChange={(e) => setLists({ ...lists, dreams: e.target.value })} /></Field>
            </div>
            <Field label="Goals" hint="One per line, e.g. more bookings, more reviews"><textarea rows={3} className={inputCls} value={lists.goals} onChange={(e) => setLists({ ...lists, goals: e.target.value })} /></Field>
          </Card>

          <Card title="Content and voice">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Content pillars" hint="The themes your posts rotate through. One per line"><textarea rows={4} className={inputCls} value={lists.pillars} onChange={(e) => setLists({ ...lists, pillars: e.target.value })} /></Field>
              <Field label="Preferred hashtags" hint="Separated by spaces"><textarea rows={4} className={inputCls} value={lists.hashtags} onChange={(e) => setLists({ ...lists, hashtags: e.target.value })} /></Field>
            </div>
            <Field label="Tone"><input className={inputCls} value={profile.tone ?? ""} onChange={(e) => set("tone", e.target.value)} placeholder="e.g. Warm and confident, never condescending" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Always" hint="One per line"><textarea rows={4} className={inputCls} value={lists.dos} onChange={(e) => setLists({ ...lists, dos: e.target.value })} /></Field>
              <Field label="Never" hint="One per line"><textarea rows={4} className={inputCls} value={lists.donts} onChange={(e) => setLists({ ...lists, donts: e.target.value })} /></Field>
            </div>
            <Field label="Extra voice notes" hint="Free-form. Examples of how you write, phrases you use, anything the AI should know."><textarea rows={8} className={cn(inputCls, "font-mono text-xs")} value={voice} onChange={(e) => setVoice(e.target.value)} /></Field>
          </Card>

          <Card title="Connected channels" subtitle="Accounts we can publish to for this brand.">
            {hub.channels.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">No channels yet.</p>
            ) : (
              <ul className="divide-y divide-[var(--border-default)]">
                {hub.channels.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <div>
                      <span className="font-medium">{PLATFORM_LABELS[c.platform] ?? c.platform}</span>
                      <span className="ml-2 text-[var(--text-secondary)]">{c.name}</span>
                      {c.issues.map((i) => (
                        <span key={i} className="mt-0.5 flex items-center gap-1 text-xs text-amber-700"><AlertTriangle className="h-3 w-3" />{i}</span>
                      ))}
                    </div>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs", c.ready ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800")}>
                      {c.ready ? "Ready" : "Needs attention"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/channels" className="inline-block text-sm text-[var(--color-primary)] underline">Manage channels</Link>
          </Card>

          <Card title="Client system" subtitle="Where your customers and bookings live. ClientVet and review requests use this.">
            <Field label="Booking / CRM software">
              <select className={inputCls} value={profile.booking_provider ?? "none"} onChange={(e) => set("booking_provider", e.target.value as BrandProfile["booking_provider"])}>
                {BOOKING_PROVIDERS.map((b) => (<option key={b.id} value={b.id}>{b.label}</option>))}
              </select>
            </Field>
            {hub.integrations.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">Nothing connected yet.</p>
            ) : (
              <ul className="text-sm">
                {hub.integrations.map((i) => (
                  <li key={i.provider}>{i.provider} · {i.sync_enabled ? "syncing" : "connected, sync off"}</li>
                ))}
              </ul>
            )}
          </Card>

          <p className="mb-8 text-xs text-[var(--text-secondary)]">{hub.media_count} media file{hub.media_count === 1 ? "" : "s"} in the library.</p>
        </>
      )}
    </div>
  );
}
