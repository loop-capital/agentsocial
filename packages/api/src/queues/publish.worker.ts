import { Worker, Job } from "bullmq";
import { eq } from "drizzle-orm";
import { connection } from "./redis.js";
import { db, channels, posts, postChannels } from "../db/index.js";
import { decryptToken } from "../connectors/token-store.js";

// Platform connectors
import { publishToTwitter } from "../connectors/twitter.js";
import { publishToLinkedIn } from "../connectors/linkedin.js";
import { publishToFacebook } from "../connectors/facebook.js";
import { publishToInstagram } from "../connectors/instagram.js";
import { publishToTikTok } from "../connectors/tiktok.js";

import type { PostPublishJob } from "./index.js";

interface PublishContext {
  postId: string;
  channelId: string;
  content: string;
  platform: string;
  accessToken: string;
  channelName: string;
}

/**
 * Publish a single post to a single channel.
 * Updates postChannels row with success/failure status.
 */
async function publishSingle(
  ctx: PublishContext
): Promise<{ success: boolean; platformPostId?: string; platformPostUrl?: string; error?: string }> {
  const { postId, channelId, content, platform, accessToken, channelName } = ctx;

  console.log(`[publish-worker] Publishing post ${postId} to ${platform} (${channelName})`);

  try {
    let result: { platformPostId: string; platformPostUrl: string } | null = null;

    switch (platform) {
      case "twitter": {
        result = await publishToTwitter(content, {
          accessToken,
          channelId,
        });
        break;
      }

      case "linkedin": {
        result = await publishToLinkedIn(content, {
          accessToken,
          channelId,
        });
        break;
      }

      case "facebook": {
        result = await publishToFacebook(content, {
          accessToken,
          channelId,
        });
        break;
      }

      case "instagram": {
        result = await publishToInstagram(content, {
          accessToken,
          channelId,
          caption: content,
        });
        break;
      }

      case "tiktok": {
        result = await publishToTikTok(content, {
          accessToken,
          channelId,
          title: content.slice(0, 100),
          description: content,
        });
        break;
      }

      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    if (!result) {
      throw new Error(`Platform ${platform} returned no result`);
    }

    // Update postChannels row as published
    await db
      .update(postChannels)
      .set({
        status: "published",
        platformPostId: result.platformPostId,
        platformPostUrl: result.platformPostUrl,
        publishedAt: new Date(),
        updatedAt: new Date(),
        errorMessage: null,
      })
      .where(eq(postChannels.id, `${postId}:${channelId}`));

    console.log(`[publish-worker] ✅ Published to ${platform}: ${result.platformPostUrl}`);

    return {
      success: true,
      platformPostId: result.platformPostId,
      platformPostUrl: result.platformPostUrl,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[publish-worker] ❌ Failed to publish to ${platform}: ${errorMessage}`);

    // Update postChannels row as failed
    await db
      .update(postChannels)
      .set({
        status: "failed",
        errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(postChannels.id, `${postId}:${channelId}`));

    return { success: false, error: errorMessage };
  }
}

/**
 * After all channels have been processed, update the overall post status.
 */
async function updatePostStatus(postId: string): Promise<void> {
  const channelStatuses = await db
    .select()
    .from(postChannels)
    .where(eq(postChannels.postId, postId));

  const allPublished = channelStatuses.every((c) => c.status === "published");
  const anyFailed = channelStatuses.some((c) => c.status === "failed");
  const allFailed = channelStatuses.every((c) => c.status === "failed");

  if (allPublished) {
    await db
      .update(posts)
      .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(posts.id, postId));
  } else if (anyFailed) {
    // If some succeeded and some failed, mark the post as "failed" for visibility
    // but individual channels show their own status
    if (allFailed) {
      await db
        .update(posts)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(posts.id, postId));
    }
  }
}

/**
 * BullMQ Worker handler for post-publish jobs.
 */
async function processPublishJob(job: Job<PostPublishJob>): Promise<void> {
  const { postId, channelId, content, scheduledFor } = job.data;

  console.log(`[publish-worker] Job ${job.id} — post=${postId}, channel=${channelId}, scheduled=${scheduledFor ?? "immediate"}`);

  // 1. Fetch the channel record
  const [channelRecord] = await db
    .select()
    .from(channels)
    .where(eq(channels.id, channelId))
    .limit(1);

  if (!channelRecord) {
    throw new Error(`Channel ${channelId} not found`);
  }

  if (!channelRecord.accessTokenEncrypted) {
    throw new Error(`Channel ${channelId} has no access token`);
  }

  // 2. Decrypt token
  let accessToken: string;
  try {
    accessToken = decryptToken(channelRecord.accessTokenEncrypted);
  } catch (err) {
    throw new Error(`Failed to decrypt token for channel ${channelId}: ${err}`);
  }

  // 3. Publish to the platform
  const result = await publishSingle({
    postId,
    channelId,
    content,
    platform: channelRecord.platform,
    accessToken,
    channelName: channelRecord.name,
  });

  // 4. Update overall post status
  await updatePostStatus(postId);

  if (!result.success) {
    throw new Error(result.error);
  }
}

/**
 * Create and return a BullMQ Worker for the post-publish queue.
 */
export function createPublishWorker() {
  const worker = new Worker<PostPublishJob>(
    "post-publish",
    processPublishJob,
    {
      connection,
      concurrency: 5,
      limiter: {
        max: 20,
        duration: 1000,
      },
    }
  );

  worker.on("completed", (job) => {
    console.log(`[publish-worker] Job ${job.id} completed — post=${job.data.postId}, channel=${job.data.channelId}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[publish-worker] Job ${job?.id} failed: ${err.message}`);
  });

  worker.on("error", (err) => {
    console.error(`[publish-worker] Worker error: ${err.message}`);
  });

  return worker;
}

export default createPublishWorker;
