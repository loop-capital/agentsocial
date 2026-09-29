/**
 * AI content planner — captions and multi-day plans in a brand's voice.
 *
 * The model writes content only. Dates/times are assigned in code (schedule.ts)
 * so the model can never invent invalid or past dates.
 */

import { completeJson } from "./llm.js";
import { pickSlots } from "./schedule.js";
import { PLATFORM_LIMITS } from "../publishing/types.js";

export interface PlanItem {
  platform: string;
  pillar: string;
  hook: string;
  caption: string;
  media_idea: string;
  hashtags: string[];
  scheduled_at: string; // ISO UTC
  warnings: string[];
}

export interface PlanRequest {
  brandName: string;
  voiceProfile: string;
  timezone: string;
  platforms: string[];
  days: number;
  postsPerPlatform: number;
  theme?: string;
  now?: Date;
  takenSlots?: Set<string>;
}

const SYSTEM_RULES = `You are the social media content strategist and copywriter for a small business.
Write posts that sound like the brand, follow its voice rules exactly, and never invent facts, prices, offers or results.
Return ONLY a JSON object, no commentary.`;

function limitsText(platforms: string[]): string {
  return platforms
    .map((p) => {
      const l = PLATFORM_LIMITS[p];
      return l ? `- ${p}: max ${l.text} characters${l.media === "required" ? ", needs an image/video" : ""}` : `- ${p}`;
    })
    .join("\n");
}

export async function generateCaptions(opts: {
  brandName: string;
  voiceProfile: string;
  brief: string;
  platforms: string[];
  variants?: number;
}): Promise<Record<string, Array<{ caption: string; hashtags: string[] }>>> {
  const variants = Math.min(Math.max(opts.variants ?? 2, 1), 5);
  const out = await completeJson<{ captions: Record<string, Array<{ caption: string; hashtags?: string[] }>> }>({
    system: `${SYSTEM_RULES}\n\n# Brand: ${opts.brandName}\n${opts.voiceProfile}`,
    user: `Write ${variants} caption variants for each platform for this post idea:\n"${opts.brief}"\n\nPlatform limits:\n${limitsText(opts.platforms)}\n\nJSON shape: {"captions": {"<platform>": [{"caption": "...", "hashtags": ["..."]}]}}`,
  });

  const result: Record<string, Array<{ caption: string; hashtags: string[] }>> = {};
  for (const p of opts.platforms) {
    const limit = PLATFORM_LIMITS[p]?.text ?? Infinity;
    result[p] = (out.captions?.[p] ?? [])
      .filter((c) => typeof c.caption === "string" && c.caption.trim())
      .map((c) => ({ caption: c.caption.trim(), hashtags: c.hashtags ?? [] }))
      .filter((c) => c.caption.length <= limit);
  }
  return result;
}

export async function generatePlan(req: PlanRequest): Promise<PlanItem[]> {
  const total = req.platforms.length * req.postsPerPlatform;
  const out = await completeJson<{
    posts: Array<{ platform: string; pillar?: string; hook?: string; caption: string; media_idea?: string; hashtags?: string[] }>;
  }>({
    system: `${SYSTEM_RULES}\n\n# Brand: ${req.brandName}\n${req.voiceProfile}`,
    user: `Plan ${total} posts: exactly ${req.postsPerPlatform} for each of these platforms over the next ${req.days} days.\n${limitsText(req.platforms)}\n${
      req.theme ? `Theme/focus: ${req.theme}\n` : ""
    }Vary the content pillars and formats; do not repeat hooks.\n\nJSON shape: {"posts": [{"platform": "...", "pillar": "...", "hook": "first line that stops the scroll", "caption": "full caption", "media_idea": "what photo/video to shoot or generate", "hashtags": ["..."]}]}`,
    maxTokens: 6000,
  });

  const taken = new Set(req.takenSlots ?? []);
  const byPlatform = new Map<string, typeof out.posts>();
  for (const p of out.posts ?? []) {
    if (!req.platforms.includes(p.platform) || !p.caption?.trim()) continue;
    const list = byPlatform.get(p.platform) ?? [];
    if (list.length < req.postsPerPlatform) list.push(p);
    byPlatform.set(p.platform, list);
  }

  const items: PlanItem[] = [];
  for (const platform of req.platforms) {
    const posts = byPlatform.get(platform) ?? [];
    const slots = pickSlots(platform, posts.length, { tz: req.timezone, days: req.days, now: req.now, taken });
    posts.forEach((p, i) => {
      const slot = slots[i];
      if (slot) taken.add(slot.toISOString());
      const warnings: string[] = [];
      const limit = PLATFORM_LIMITS[platform]?.text;
      if (limit && p.caption.length > limit) warnings.push(`Caption is ${p.caption.length} characters (max ${limit})`);
      if (!slot) warnings.push("No open posting slot in this window");
      items.push({
        platform,
        pillar: p.pillar ?? "",
        hook: p.hook ?? "",
        caption: p.caption.trim(),
        media_idea: p.media_idea ?? "",
        hashtags: p.hashtags ?? [],
        scheduled_at: slot ? slot.toISOString() : "",
        warnings,
      });
    });
  }
  return items.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
}
