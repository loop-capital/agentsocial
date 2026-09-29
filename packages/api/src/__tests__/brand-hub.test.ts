import { describe, it, expect } from "vitest";
import { composeBrandContext, brandChecklist, brandProfileSchema } from "../services/brand-hub.js";

const ready = { id: "1", platform: "instagram", name: "ig", status: "active", provider: "composio", ready: true, issues: [] };

describe("composeBrandContext", () => {
  it("merges structured profile and voice notes, skipping empty sections", () => {
    const ctx = composeBrandContext({
      name: "PLEIJ",
      profile: { industry: "Salon", city: "Columbus, OH", pillars: ["Authority", "Trust"], donts: ["em-dashes"], audience: { icp: "Women 28-45" } },
      voiceProfile: "Warm and confident.",
    });
    expect(ctx).toContain("Industry: Salon");
    expect(ctx).toContain("## Content pillars\n- Authority\n- Trust");
    expect(ctx).toContain("## Never\n- em-dashes");
    expect(ctx).toContain("## Voice notes\nWarm and confident.");
    expect(ctx).not.toContain("## Goals");
  });
  it("works with an empty profile", () => {
    expect(composeBrandContext({ name: "x", profile: {}, voiceProfile: null })).toBe("");
    expect(composeBrandContext({ name: "x" })).toBe("");
  });
});

describe("brandChecklist", () => {
  it("scores an empty brand at 0 and a complete one at 100", () => {
    expect(brandChecklist({ name: "x", timezone: "UTC" }, []).score).toBe(0);
    const full = brandChecklist(
      {
        name: "x", timezone: "America/New_York",
        profile: { industry: "Salon", city: "Columbus", audience: { icp: "Professional women 28 to 45" }, pillars: ["a", "b"], goals: ["bookings"] },
        voiceProfile: "v".repeat(100),
      },
      [ready],
    );
    expect(full.score).toBe(100);
    expect(full.items.every((i) => i.done)).toBe(true);
  });
  it("does not count a not-ready channel", () => {
    const c = brandChecklist({ name: "x", timezone: "UTC" }, [{ ...ready, ready: false }]);
    expect(c.items.find((i) => i.key === "channels")!.done).toBe(false);
  });
});

describe("brandProfileSchema", () => {
  it("rejects unknown booking providers and accepts partial profiles", () => {
    expect(brandProfileSchema.safeParse({ booking_provider: "square" }).success).toBe(true);
    expect(brandProfileSchema.safeParse({ booking_provider: "nope" }).success).toBe(false);
    expect(brandProfileSchema.safeParse({}).success).toBe(true);
  });
});
