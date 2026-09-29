/**
 * Brand hub — one per-brand profile that every tool reads from.
 *
 * `profile` (structured, jsonb) + `voice_profile` (free-form markdown) are merged
 * into a single context block for the AI planner, so the brand is described once.
 */

import { z } from "zod";

const list = z.array(z.string().max(300)).max(30);

export const brandProfileSchema = z.object({
  industry: z.string().max(120).optional(),
  description: z.string().max(1500).optional(),
  website: z.string().max(300).optional(),
  city: z.string().max(120).optional(),
  tone: z.string().max(500).optional(),
  audience: z.object({
    icp: z.string().max(1000).optional(),
    pain_points: list.optional(),
    dream_outcomes: list.optional(),
  }).optional(),
  pillars: list.optional(),
  goals: list.optional(),
  dos: list.optional(),
  donts: list.optional(),
  hashtags: list.optional(),
  booking_provider: z.enum(["square", "phorest", "vagaro", "boulevard", "mindbody", "other", "none"]).optional(),
});
export type BrandProfile = z.infer<typeof brandProfileSchema>;

const bullets = (items?: string[]) => (items ?? []).filter(Boolean).map((i) => `- ${i}`).join("\n");

/** Markdown context handed to the LLM: structured profile first, then the free-form voice notes. */
export function composeBrandContext(brand: { name: string; profile?: unknown; voiceProfile?: string | null }): string {
  const p = (brand.profile ?? {}) as BrandProfile;
  const parts: string[] = [];

  const facts = [
    p.industry && `Industry: ${p.industry}`,
    p.city && `Location: ${p.city}`,
    p.website && `Website: ${p.website}`,
    p.description && `About: ${p.description}`,
  ].filter(Boolean);
  if (facts.length) parts.push(facts.join("\n"));

  if (p.audience?.icp) parts.push(`## Ideal customer\n${p.audience.icp}`);
  if (p.audience?.pain_points?.length) parts.push(`## Customer pain points\n${bullets(p.audience.pain_points)}`);
  if (p.audience?.dream_outcomes?.length) parts.push(`## Outcomes customers want\n${bullets(p.audience.dream_outcomes)}`);
  if (p.pillars?.length) parts.push(`## Content pillars\n${bullets(p.pillars)}`);
  if (p.goals?.length) parts.push(`## Goals\n${bullets(p.goals)}`);
  if (p.tone) parts.push(`## Tone\n${p.tone}`);
  if (p.dos?.length) parts.push(`## Always\n${bullets(p.dos)}`);
  if (p.donts?.length) parts.push(`## Never\n${bullets(p.donts)}`);
  if (p.hashtags?.length) parts.push(`## Preferred hashtags\n${p.hashtags.join(" ")}`);
  if (brand.voiceProfile?.trim()) parts.push(`## Voice notes\n${brand.voiceProfile.trim()}`);

  return parts.join("\n\n");
}

export interface ChannelSummary {
  id: string;
  platform: string;
  name: string;
  status: string;
  /** Which provider will publish for this channel. */
  provider: string;
  /** True when the channel has what its provider needs to publish. */
  ready: boolean;
  issues: string[];
}

export interface ChecklistItem { key: string; label: string; done: boolean; hint: string }

export function brandChecklist(
  brand: { name: string; timezone: string; profile?: unknown; voiceProfile?: string | null },
  channels: ChannelSummary[],
): { score: number; items: ChecklistItem[] } {
  const p = (brand.profile ?? {}) as BrandProfile;
  const items: ChecklistItem[] = [
    { key: "basics", label: "Business basics", done: Boolean(p.industry && p.city), hint: "Add your industry and city." },
    { key: "timezone", label: "Timezone set", done: brand.timezone !== "UTC", hint: "Posts are scheduled in your local time." },
    { key: "audience", label: "Ideal customer described", done: (p.audience?.icp ?? "").length >= 20, hint: "Who are you trying to reach?" },
    { key: "pillars", label: "Content pillars (2+)", done: (p.pillars ?? []).length >= 2, hint: "The themes your posts rotate through." },
    { key: "voice", label: "Brand voice written", done: ((brand.voiceProfile ?? "").length + (p.tone ?? "").length) >= 80, hint: "How you sound, and what to avoid." },
    { key: "channels", label: "A channel ready to publish", done: channels.some((c) => c.ready), hint: "Connect at least one social account." },
    { key: "goals", label: "Goals set", done: (p.goals ?? []).length >= 1, hint: "Followers, bookings, reviews..." },
  ];
  const done = items.filter((i) => i.done).length;
  return { score: Math.round((done / items.length) * 100), items };
}
