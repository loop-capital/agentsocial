import { describe, it, expect, vi, beforeEach } from "vitest";

const completeJson = vi.fn();
vi.mock("../services/ai/llm.js", async (orig) => ({
  ...(await orig<typeof import("../services/ai/llm.js")>()),
  completeJson: (...a: unknown[]) => completeJson(...a),
}));

import { zonedTimeToUtc, pickSlots, localParts } from "../services/ai/schedule.js";
import { extractJson, withRetry, isTransient } from "../services/ai/llm.js";
import { generatePlan, generateCaptions } from "../services/ai/planner.js";

beforeEach(() => completeJson.mockReset());

describe("zonedTimeToUtc", () => {
  it("handles EDT (UTC-4) and EST (UTC-5)", () => {
    expect(zonedTimeToUtc(2026, 9, 21, 11, 0, "America/New_York").toISOString()).toBe("2026-09-21T15:00:00.000Z");
    expect(zonedTimeToUtc(2026, 12, 21, 11, 0, "America/New_York").toISOString()).toBe("2026-12-21T16:00:00.000Z");
  });
  it("handles the DST switch day correctly", () => {
    // US DST ended 2026-11-01: 09:00 local is EST that morning
    expect(zonedTimeToUtc(2026, 11, 1, 9, 0, "America/New_York").toISOString()).toBe("2026-11-01T14:00:00.000Z");
  });
  it("handles UTC and non-US zones", () => {
    expect(zonedTimeToUtc(2026, 9, 21, 9, 0, "UTC").toISOString()).toBe("2026-09-21T09:00:00.000Z");
    expect(zonedTimeToUtc(2026, 9, 21, 9, 0, "Asia/Tokyo").toISOString()).toBe("2026-09-21T00:00:00.000Z");
  });
});

describe("pickSlots", () => {
  const now = new Date("2026-09-21T12:00:00Z"); // Monday 8am New York
  it("returns future, distinct, time-ordered slots inside the window", () => {
    const slots = pickSlots("instagram", 4, { tz: "America/New_York", days: 7, now });
    expect(slots).toHaveLength(4);
    expect(new Set(slots.map((s) => s.toISOString())).size).toBe(4);
    for (const s of slots) {
      expect(s.getTime()).toBeGreaterThan(now.getTime() + 30 * 60_000);
      expect(s.getTime()).toBeLessThan(now.getTime() + 8 * 86_400_000);
    }
    expect([...slots].sort((a, b) => a.getTime() - b.getTime())).toEqual(slots);
  });
  it("never uses a taken slot", () => {
    const first = pickSlots("gbp", 1, { tz: "America/New_York", days: 7, now })[0];
    const next = pickSlots("gbp", 1, { tz: "America/New_York", days: 7, now, taken: new Set([first.toISOString()]) })[0];
    expect(next.toISOString()).not.toBe(first.toISOString());
  });
  it("respects day-of-week rules (LinkedIn never on weekends)", () => {
    const slots = pickSlots("linkedin", 20, { tz: "America/New_York", days: 14, now });
    for (const s of slots) expect([0, 6]).not.toContain(localParts(s, "America/New_York").dow);
  });
  it("returns fewer slots rather than duplicates when the window is small", () => {
    expect(pickSlots("gbp", 10, { tz: "UTC", days: 2, now }).length).toBeLessThanOrEqual(2);
  });
});

describe("extractJson", () => {
  it("parses raw, fenced and prose-wrapped JSON", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
    expect(extractJson('```json\n{"a":2}\n```')).toEqual({ a: 2 });
    expect(extractJson('Here you go: {"a":3} hope it helps')).toEqual({ a: 3 });
    expect(() => extractJson("no json")).toThrow();
  });
});

describe("generatePlan", () => {
  const base = {
    brandName: "PLEIJ", voiceProfile: "warm", timezone: "America/New_York",
    days: 7, postsPerPlatform: 2, now: new Date("2026-09-21T12:00:00Z"),
  };

  it("assigns times in code, caps per-platform counts, drops unknown platforms and flags over-limit captions", async () => {
    completeJson.mockResolvedValueOnce({
      posts: [
        { platform: "instagram", caption: "one", pillar: "Authority", hook: "h1", media_idea: "reel", hashtags: ["#a"] },
        { platform: "instagram", caption: "two" },
        { platform: "instagram", caption: "three (over the cap of 2)" },
        { platform: "twitter", caption: "x".repeat(300) },
        { platform: "myspace", caption: "ignored" },
        { platform: "twitter", caption: "" },
      ],
    });
    const items = await generatePlan({ ...base, platforms: ["instagram", "twitter"] });
    expect(items.filter((i) => i.platform === "instagram")).toHaveLength(2);
    expect(items.some((i) => i.platform === "myspace")).toBe(false);
    const tw = items.find((i) => i.platform === "twitter")!;
    expect(tw.warnings.join()).toMatch(/300 characters \(max 280\)/);
    for (const i of items) expect(new Date(i.scheduled_at).getTime()).toBeGreaterThan(base.now.getTime());
    // sorted by time, no two items share a slot
    expect(items.map((i) => i.scheduled_at)).toEqual([...items.map((i) => i.scheduled_at)].sort());
    expect(new Set(items.map((i) => i.scheduled_at)).size).toBe(items.length);
  });

  it("skips slots already taken by the brand's scheduled posts", async () => {
    completeJson.mockResolvedValue({ posts: [{ platform: "gbp", caption: "a" }] });
    const [first] = await generatePlan({ ...base, postsPerPlatform: 1, platforms: ["gbp"] });
    const [second] = await generatePlan({ ...base, postsPerPlatform: 1, platforms: ["gbp"], takenSlots: new Set([first.scheduled_at]) });
    expect(second.scheduled_at).not.toBe(first.scheduled_at);
  });
});

describe("generateCaptions", () => {
  it("drops empty and over-limit variants", async () => {
    completeJson.mockResolvedValueOnce({
      captions: { twitter: [{ caption: "ok" }, { caption: "x".repeat(300) }, { caption: "  " }] },
    });
    const r = await generateCaptions({ brandName: "b", voiceProfile: "", brief: "x", platforms: ["twitter"] });
    expect(r.twitter.map((c) => c.caption)).toEqual(["ok"]);
  });
});

describe("withRetry", () => {
  it("retries transient errors then succeeds", async () => {
    let n = 0;
    const r = await withRetry(async () => { if (++n < 3) throw Object.assign(new Error("busy"), { status: 503 }); return "ok"; }, { baseMs: 1 });
    expect(r).toBe("ok");
    expect(n).toBe(3);
  });
  it("does not retry auth / bad-request errors", async () => {
    let n = 0;
    await expect(withRetry(async () => { n++; throw Object.assign(new Error("bad key"), { status: 403 }); }, { baseMs: 1 })).rejects.toThrow("bad key");
    expect(n).toBe(1);
  });
  it("gives up after the attempt limit", async () => {
    let n = 0;
    await expect(withRetry(async () => { n++; throw Object.assign(new Error("busy"), { status: 429 }); }, { attempts: 3, baseMs: 1 })).rejects.toThrow("busy");
    expect(n).toBe(3);
  });
  it("classifies statuses", () => {
    expect(isTransient({ status: 503 })).toBe(true);
    expect(isTransient({ status: 429 })).toBe(true);
    expect(isTransient({ status: 400 })).toBe(false);
  });
});
