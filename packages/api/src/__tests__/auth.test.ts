import { describe, it, expect } from "vitest";
import { z } from "zod";

// ─── Schema Validation Tests ──────────────────────────────────────────────────
// These test the Zod schemas and business logic without needing a DB connection.

import { registerSchema, loginSchema } from "@agentsocial/shared";

describe("Auth Schemas", () => {
  describe("registerSchema", () => {
    it("accepts valid registration data", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "securepass123",
        name: "Test User",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty email", () => {
      const result = registerSchema.safeParse({
        email: "",
        password: "securepass123",
        name: "Test User",
      });
      expect(result.success).toBe(false);
    });

    it("rejects short password", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "abc",
        name: "Test User",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty name", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "securepass123",
        name: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("accepts valid login data", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "securepass123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing password", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
      });
      expect(result.success).toBe(false);
    });
  });
});

// ─── Competitor Monitor Service Tests ──────────────────────────────────────────

describe("Competitor Platform Validation", () => {
  const SUPPORTED_PLATFORMS = ["twitter", "instagram", "facebook", "tiktok", "linkedin"];

  it("accepts all supported platforms", () => {
    const schema = z.enum(SUPPORTED_PLATFORMS as [string, ...string[]]);
    SUPPORTED_PLATFORMS.forEach((platform) => {
      expect(schema.safeParse(platform).success).toBe(true);
    });
  });

  it("rejects unsupported platform", () => {
    const schema = z.enum(["twitter", "instagram", "facebook", "tiktok", "linkedin"]);
    const result = schema.safeParse("snapchat");
    expect(result.success).toBe(false);
  });

  it("validates add competitor schema", () => {
    const addCompetitorSchema = z.object({
      brand_id: z.string().uuid(),
      platform: z.enum(["twitter", "instagram", "facebook", "tiktok", "linkedin"]),
      handle: z.string().min(1).max(100),
    });

    const valid = addCompetitorSchema.safeParse({
      brand_id: "00000000-0000-0000-0000-000000000000",
      platform: "twitter",
      handle: "naval",
    });
    expect(valid.success).toBe(true);

    const invalid = addCompetitorSchema.safeParse({
      brand_id: "not-a-uuid",
      platform: "myspace",
      handle: "",
    });
    expect(invalid.success).toBe(false);
  });
});