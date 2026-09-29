import { describe, it, expect, vi } from "vitest";

vi.mock("../db/index.js", () => ({ pool: { query: vi.fn() } }));
vi.mock("../services/webhook-delivery.js", () => ({ deliverWebhookEvent: vi.fn() }));

const { normalizePhone, inQuietHours, nextAllowedTime, callTwiml } = await import("../services/outbound-messaging.js");

describe("normalizePhone", () => {
  it("accepts E.164 and common US formats", () => {
    expect(normalizePhone("+16145551234")).toBe("+16145551234");
    expect(normalizePhone("(614) 555-1234")).toBe("+16145551234");
    expect(normalizePhone("614.555.1234")).toBe("+16145551234");
    expect(normalizePhone("1-614-555-1234")).toBe("+16145551234");
    expect(normalizePhone("+44 20 7946 0958")).toBe("+442079460958");
  });

  it("rejects things that aren't phone numbers", () => {
    expect(normalizePhone("555-1234")).toBeNull();
    expect(normalizePhone("hello")).toBeNull();
    expect(normalizePhone("+1234")).toBeNull();
  });
});

describe("quiet hours (9pm–8am default)", () => {
  const NY = "America/New_York";
  // 2026-09-29 is EDT (UTC-4)
  const at = (utc: string) => new Date(utc);

  it("is quiet late at night and early morning, local time", () => {
    expect(inQuietHours(at("2026-09-30T02:00:00Z"), NY, 21, 8)).toBe(true); // 10pm EDT
    expect(inQuietHours(at("2026-09-29T10:30:00Z"), NY, 21, 8)).toBe(true); // 6:30am EDT
  });

  it("is open during the day", () => {
    expect(inQuietHours(at("2026-09-29T14:00:00Z"), NY, 21, 8)).toBe(false); // 10am EDT
    expect(inQuietHours(at("2026-09-30T00:59:00Z"), NY, 21, 8)).toBe(false); // 8:59pm EDT
  });

  it("uses the brand's timezone, not the server's", () => {
    // 10pm EDT is 7pm in Los Angeles
    expect(inQuietHours(at("2026-09-30T02:00:00Z"), "America/Los_Angeles", 21, 8)).toBe(false);
  });

  it("defers a late-night send to 8am local the next morning", () => {
    const next = nextAllowedTime(at("2026-09-30T02:10:00Z"), NY, 21, 8); // 10:10pm EDT
    expect(next.toISOString()).toBe("2026-09-30T12:00:00.000Z"); // 8:00am EDT
  });

  it("leaves an allowed time unchanged", () => {
    const t = at("2026-09-29T15:07:00Z");
    expect(nextAllowedTime(t, NY, 21, 8).getTime()).toBe(t.getTime());
  });

  it("treats equal start and end as no quiet hours", () => {
    expect(inQuietHours(at("2026-09-30T04:00:00Z"), NY, 0, 0)).toBe(false);
  });
});

describe("callTwiml", () => {
  it("speaks the script and escapes XML", () => {
    const xml = callTwiml(`Hi Sam, your appointment at <PLEIJ> & Spa is tomorrow at 3 "sharp"`);
    expect(xml).toBe(
      '<Response><Say voice="Polly.Joanna">Hi Sam, your appointment at &lt;PLEIJ&gt; &amp; Spa is tomorrow at 3 &quot;sharp&quot;</Say></Response>',
    );
  });
});
