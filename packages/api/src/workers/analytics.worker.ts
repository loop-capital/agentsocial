import { Worker } from "bullmq";
import { connection } from "../queues/redis.js";
import { getTwitterMetrics } from "../connectors/twitter.js";
import { getLinkedInMetrics } from "../connectors/linkedin.js";
import { getInstagramMetrics } from "../connectors/instagram.js";
import { decryptToken } from "../connectors/token-store.js";
import type { AnalyticsSyncJob } from "../queues/index.js";
import { db, channels, postChannels, postAnalytics } from "../db/index.js";
import { eq, and } from "drizzle-orm";

export function createAnalyticsWorker() {
  return new Worker<AnalyticsSyncJob>(
    "analytics-sync",
    async (job) => {
      const { brandId, channelId, startDate, endDate } = job.data;

      job.log(`Starting analytics sync for channel ${channelId}`);

      // Get channel and its token
      const [channel] = await db
        .select()
        .from(channels)
        .where(eq(channels.id, channelId))
        .limit(1);

      if (!channel) {
        throw new Error(`Channel ${channelId} not found`);
      }

      const accessToken = channel.accessTokenEncrypted
        ? decryptToken(channel.accessTokenEncrypted)
        : "mock_token";

      const platform = channel.platform;

      // Get all published posts for this channel in the date range
      const publishedPosts = await db
        .select()
        .from(postChannels)
        .where(
          and(
            eq(postChannels.channelId, channelId),
            eq(postChannels.status, "published"),
          )
        );

      const postIds = publishedPosts.map((pc) => pc.postId);
      const start = new Date(startDate);
      const end = new Date(endDate);

      job.log(`Syncing ${postIds.length} posts for channel ${channelId} (${platform})`);

      // Sync metrics for each published post
      let syncedCount = 0;
      for (const pc of publishedPosts) {
        const publishedAt = pc.publishedAt ? new Date(pc.publishedAt) : new Date();
        if (publishedAt < start || publishedAt > end) continue;
        if (!pc.platformPostId) continue;

        let metrics: { impressions: number; likes: number; retweets?: number; replies?: number; comments?: number; shares?: number; saves?: number };

        try {
          if (platform === "twitter") {
            const m = await getTwitterMetrics(pc.platformPostId, accessToken);
            metrics = { impressions: m.impressions, likes: m.likes, retweets: m.retweets, replies: m.replies };
          } else if (platform === "linkedin") {
            const m = await getLinkedInMetrics(pc.platformPostId, accessToken);
            metrics = { impressions: m.impressions, likes: m.likes, comments: m.comments, shares: m.shares };
          } else if (platform === "instagram") {
            const m = await getInstagramMetrics(pc.platformPostId, accessToken);
            metrics = { impressions: m.impressions, likes: m.likes, comments: m.comments, saves: m.saves };
          } else {
            continue;
          }

          // Upsert post analytics
          const engagements =
            metrics.likes + (metrics.replies || 0) + (metrics.comments || 0) +
            (metrics.shares || 0) + (metrics.retweets || 0) + (metrics.saves || 0);

          const existing = await db
            .select()
            .from(postAnalytics)
            .where(and(eq(postAnalytics.postId, pc.postId), eq(postAnalytics.channelId, channelId)))
            .limit(1);

          if (existing.length > 0) {
            await db
              .update(postAnalytics)
              .set({
                impressions: metrics.impressions,
                engagements,
                likes: metrics.likes,
                comments: (metrics as { comments?: number }).comments || 0,
                shares: (metrics as { shares?: number }).shares || 0,
                updatedAt: new Date(),
              })
              .where(eq(postAnalytics.id, existing[0].id));
          } else {
            await db.insert(postAnalytics).values({
              postId: pc.postId,
              channelId,
              impressions: metrics.impressions,
              reach: metrics.impressions,
              engagements,
              likes: metrics.likes,
              comments: (metrics as { comments?: number }).comments || 0,
              shares: (metrics as { shares?: number }).shares || 0,
              clicks: 0,
            });
          }

          syncedCount++;
        } catch (err) {
          job.log(`Failed to sync metrics for post ${pc.postId}: ${err}`);
          // Don't fail the whole job for one bad post
        }
      }

      job.log(`Analytics sync complete for channel ${channelId}: ${syncedCount} posts updated`);

      return { channelId, syncedCount, postIds: postIds.length };
    },
    {
      connection,
      concurrency: 2,
      limiter: { max: 5, duration: 1000 },
    }
  );
}
