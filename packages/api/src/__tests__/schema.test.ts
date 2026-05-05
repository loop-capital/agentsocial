import { describe, it, expect } from "vitest";

// ─── Schema Table Tests ────────────────────────────────────────────────────────
// Validate that all Drizzle schema tables export correctly and have expected columns.

import * as schema from "../db/schema.js";

describe("Database Schema", () => {
  const TABLE_NAMES = [
    "users", "apiKeys", "organizations", "organizationMemberships",
    "brands", "channels", "posts", "postChannels", "postMedia",
    "mediaAssets", "comments", "commentReplies", "postAnalytics",
    "dailyAnalytics", "webhooks", "exportJobs",
    "competitorProfiles", "competitorPosts",
  ];

  it("exports all expected tables", () => {
    for (const name of TABLE_NAMES) {
      expect(schema).toHaveProperty(name);
    }
  });

  it("users table has required columns", () => {
    const cols = Object.keys(schema.users);
    expect(cols).toContain("id");
    expect(cols).toContain("email");
    expect(cols).toContain("passwordHash");
    expect(cols).toContain("name");
    expect(cols).toContain("createdAt");
    expect(cols).toContain("updatedAt");
  });

  it("brands table has required columns", () => {
    const cols = Object.keys(schema.brands);
    expect(cols).toContain("id");
    expect(cols).toContain("name");
    expect(cols).toContain("userId");
    expect(cols).toContain("organizationId");
  });

  it("channels table has required columns", () => {
    const cols = Object.keys(schema.channels);
    expect(cols).toContain("id");
    expect(cols).toContain("brandId");
    expect(cols).toContain("platform");
    expect(cols).toContain("accountId");
  });

  it("posts table has required columns", () => {
    const cols = Object.keys(schema.posts);
    expect(cols).toContain("id");
    expect(cols).toContain("brandId");
    expect(cols).toContain("content");
    expect(cols).toContain("status");
    expect(cols).toContain("createdByUserId");
  });

  it("competitorProfiles table has required columns", () => {
    const cols = Object.keys(schema.competitorProfiles);
    expect(cols).toContain("id");
    expect(cols).toContain("brandId");
    expect(cols).toContain("platform");
    expect(cols).toContain("handle");
    expect(cols).toContain("followerCount");
    expect(cols).toContain("engagementRate");
  });

  it("competitorPosts table has required columns", () => {
    const cols = Object.keys(schema.competitorPosts);
    expect(cols).toContain("id");
    expect(cols).toContain("profileId");
    expect(cols).toContain("externalId");
    expect(cols).toContain("content");
    expect(cols).toContain("likes");
    expect(cols).toContain("comments");
    expect(cols).toContain("shares");
  });

  it("exports platform enum with expected values", () => {
    expect(schema.platformEnum.enumValues).toContain("twitter");
    expect(schema.platformEnum.enumValues).toContain("instagram");
    expect(schema.platformEnum.enumValues).toContain("facebook");
    expect(schema.platformEnum.enumValues).toContain("tiktok");
    expect(schema.platformEnum.enumValues).toContain("linkedin");
  });

  it("exports postStatus enum with expected values", () => {
    expect(schema.postStatusEnum.enumValues).toContain("draft");
    expect(schema.postStatusEnum.enumValues).toContain("scheduled");
    expect(schema.postStatusEnum.enumValues).toContain("published");
  });
});

// ─── Engagement Rate Calculation Tests ──────────────────────────────────────────

describe("Engagement Rate Calculation", () => {
  function calculateEngagementRate(likes: number, comments: number, shares: number, followers: number): number | null {
    if (!followers) return null;
    const totalEngagements = likes + comments + shares;
    return Math.round((totalEngagements / followers) * 10_000);
  }

  it("returns null for zero followers", () => {
    expect(calculateEngagementRate(100, 50, 25, 0)).toBeNull();
  });

  it("calculates rate in basis points", () => {
    // 200 likes + 100 comments + 50 shares = 350 / 10000 = 3.5% = 350bps
    expect(calculateEngagementRate(200, 100, 50, 10_000)).toBe(350);
  });

  it("handles zero engagement", () => {
    expect(calculateEngagementRate(0, 0, 0, 1000)).toBe(0);
  });

  it("handles very high engagement", () => {
    // Viral post: 50k likes + 10k comments + 5k shares = 65k / 10k = 650% = 65000bps
    expect(calculateEngagementRate(50_000, 10_000, 5_000, 10_000)).toBe(65000);
  });
});