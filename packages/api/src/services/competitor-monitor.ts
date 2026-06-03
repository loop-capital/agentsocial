import { execSync } from "child_process";
import { db, competitorProfiles, competitorPosts } from "../db/index.js";
import { eq, and, desc } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

// ─── Types ──────────────────────────────────────────────────────────────────

interface AutocliPost {
  id?: string;
  text?: string;
  content?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
  retweets?: number;
  replies?: number;
  bookmarks?: number;
  url?: string;
  created_at?: string;
  media_urls?: string[];
  hashtags?: string[];
  mentions?: string[];
  type?: string;
}

interface AutocliProfile {
  name?: string;
  bio?: string;
  avatar_url?: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
}

// ─── Platform Fetchers ──────────────────────────────────────────────────────

const PLATFORM_FETCHERS: Record<string, (handle: string, limit: number) => { profileCmd: string; postsCmd: string }> = {
  twitter: (handle, limit) => ({
    profileCmd: `autocli twitter profile --username ${handle} --format json --limit ${limit}`,
    postsCmd: `autocli twitter profile --username ${handle} --format json --limit ${limit}`,
  }),
  instagram: (handle, limit) => ({
    profileCmd: `autocli instagram user --username ${handle} --format json --limit ${limit}`,
    postsCmd: `autocli instagram user --username ${handle} --format json --limit ${limit}`,
  }),
  facebook: (handle, limit) => ({
    profileCmd: `autocli facebook profile --username ${handle} --format json`,
    postsCmd: `autocli facebook profile --username ${handle} --format json --limit ${limit}`,
  }),
  tiktok: (handle, limit) => ({
    profileCmd: `autocli tiktok user --username ${handle} --format json --limit ${limit}`,
    postsCmd: `autocli tiktok user --username ${handle} --format json --limit ${limit}`,
  }),
  linkedin: (handle, limit) => ({
    profileCmd: `autocli linkedin profile --username ${handle} --format json`,
    postsCmd: `autocli linkedin profile --username ${handle} --format json --limit ${limit}`,
  }),
};

function runAutocli(cmd: string): unknown {
  try {
    const result = execSync(cmd, {
      encoding: "utf-8",
      timeout: 30_000,
      env: { ...process.env, AUTOCLI_DAEMON_PORT: "19825" },
    });
    return JSON.parse(result);
  } catch (err: any) {
    console.error(`[competitor-monitor] autocli failed: ${cmd}`, err?.message);
    return null;
  }
}

function normalizePosts(raw: unknown, platform: string): AutocliPost[] {
  if (!raw) return [];
  const data = Array.isArray(raw) ? raw : (raw as any)?.items ?? (raw as any)?.posts ?? (raw as any)?.data ?? [raw];
  return data.map((item: any) => ({
    id: item.id || item.tweet_id || item.post_id || item.pk || `${platform}-${Date.now()}-${Math.random()}`,
    text: item.text || item.caption || item.content || item.description || "",
    likes: item.likes || item.favorite_count || item.like_count || 0,
    comments: item.comments || item.reply_count || item.comment_count || 0,
    shares: item.shares || item.retweets || item.retweet_count || item.share_count || 0,
    views: item.views || item.view_count || item.impressions || 0,
    url: item.url || item.permalink || item.link || "",
    created_at: item.created_at || item.created_time || item.timestamp || item.date || "",
    media_urls: item.media_urls || item.images || item.media || [],
    hashtags: item.hashtags || item.tags || [],
    mentions: item.mentions || [],
    type: item.type || "standard",
  }));
}

function calculateEngagementRate(post: AutocliPost, followers: number): number | null {
  if (!followers) return null;
  const totalEngagements = (post.likes || 0) + (post.comments || 0) + (post.shares || 0);
  return Math.round((totalEngagements / followers) * 10_000); // basis points
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function addCompetitor(brandId: string, platform: string, handle: string) {
  const fetcher = PLATFORM_FETCHERS[platform];
  if (!fetcher) throw new Error(`Unsupported platform: ${platform}. Supported: ${Object.keys(PLATFORM_FETCHERS).join(", ")}`);

  // Check for duplicate
  const existing = await db.select().from(competitorProfiles).where(
    and(eq(competitorProfiles.brandId, brandId), eq(competitorProfiles.platform, platform), eq(competitorProfiles.handle, handle))
  ).limit(1);

  if (existing.length > 0) {
    return { id: existing[0].id, status: "already_exists" };
  }

  // Create profile record
  const [profile] = await db.insert(competitorProfiles).values({
    brandId,
    platform,
    handle,
    profileUrl: `https://${platform === "twitter" ? "x.com" : platform + ".com"}/${handle}`,
  }).returning();

  // Fetch initial data
  await refreshCompetitor(profile.id);

  return { id: profile.id, status: "created" };
}

export async function refreshCompetitor(profileId: string) {
  const [profile] = await db.select().from(competitorProfiles).where(eq(competitorProfiles.id, profileId)).limit(1);
  if (!profile) throw new Error("Competitor profile not found");

  const fetcher = PLATFORM_FETCHERS[profile.platform];
  if (!fetcher) throw new Error(`No fetcher for platform: ${profile.platform}`);

  const { profileCmd, postsCmd } = fetcher(profile.handle, 20);

  // Fetch profile metadata
  const profileData = runAutocli(profileCmd) as AutocliProfile | null;
  if (profileData) {
    await db.update(competitorProfiles).set({
      displayName: profileData.name || profile.displayName,
      avatarUrl: profileData.avatar_url || profile.avatarUrl,
      bio: profileData.bio || profile.bio,
      followerCount: profileData.followers_count || profile.followerCount,
      followingCount: profileData.following_count || profile.followingCount,
      postCount: profileData.posts_count || profile.postCount,
      lastFetchedAt: new Date(),
    }).where(eq(competitorProfiles.id, profileId));
  }

  // Fetch posts
  const rawPosts = runAutocli(postsCmd);
  const posts = normalizePosts(rawPosts, profile.platform);

  if (posts.length > 0) {
    // Get existing external IDs to avoid duplicates
    const existingPosts = await db.select({ externalId: competitorPosts.externalId })
      .from(competitorPosts)
      .where(eq(competitorPosts.profileId, profileId));
    const existingIds = new Set(existingPosts.map(p => p.externalId));

    const newPosts = posts.filter(p => p.id && !existingIds.has(p.id));

    if (newPosts.length > 0) {
      await db.insert(competitorPosts).values(
        newPosts.map(post => ({
          profileId,
          externalId: post.id!,
          content: post.text || null,
          mediaUrls: post.media_urls?.length ? post.media_urls : null,
          postType: post.type || "standard",
          publishedAt: post.created_at ? new Date(post.created_at) : null,
          likes: post.likes || 0,
          comments: post.comments || 0,
          shares: post.shares || 0,
          views: post.views || 0,
          engagementRate: calculateEngagementRate(post, profile.followerCount || profileData?.followers_count || 0),
          hashtags: post.hashtags?.length ? post.hashtags : null,
          mentions: post.mentions?.length ? post.mentions : null,
          url: post.url || null,
        }))
      );
    }
  }

  // Update profile engagement rate (average of recent posts)
  const recentPosts = await db.select().from(competitorPosts)
    .where(eq(competitorPosts.profileId, profileId))
    .orderBy(desc(competitorPosts.publishedAt))
    .limit(10);

  if (recentPosts.length > 0) {
    const rates = recentPosts.filter(p => p.engagementRate !== null).map(p => p.engagementRate!);
    if (rates.length > 0) {
      const avgRate = Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
      await db.update(competitorProfiles).set({ engagementRate: avgRate }).where(eq(competitorProfiles.id, profileId));
    }
  }

  return { profileId, postsFetched: posts.length, profileUpdated: !!profileData };
}

export async function listCompetitors(brandId: string) {
  return db.select().from(competitorProfiles).where(eq(competitorProfiles.brandId, brandId));
}

export async function getCompetitorPosts(profileId: string, limit = 20) {
  return db.select().from(competitorPosts)
    .where(eq(competitorPosts.profileId, profileId))
    .orderBy(desc(competitorPosts.publishedAt))
    .limit(limit);
}

export async function removeCompetitor(profileId: string) {
  // Cascade delete handles posts automatically
  await db.delete(competitorProfiles).where(eq(competitorProfiles.id, profileId));
  return { deleted: true };
}

export async function refreshAllCompetitors(brandId: string) {
  const profiles = await db.select().from(competitorProfiles).where(
    and(eq(competitorProfiles.brandId, brandId), eq(competitorProfiles.active, true))
  );

  const results = [];
  for (const profile of profiles) {
    try {
      const result = await refreshCompetitor(profile.id);
      results.push({ id: profile.id, handle: profile.handle, ...result });
    } catch (err: any) {
      results.push({ id: profile.id, handle: profile.handle, error: err.message });
    }
  }

  return results;
}