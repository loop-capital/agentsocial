import { Worker } from "bullmq";
import { connection } from "../queues/redis.js";
import { publishToTwitter } from "../connectors/twitter.js";
import { publishToLinkedIn } from "../connectors/linkedin.js";
import { publishToInstagram } from "../connectors/instagram.js";
import { publishToFacebook } from "../connectors/facebook.js";
import { publishToTikTok } from "../connectors/tiktok.js";
import { publishViaBrowser } from "../connectors/browser-automation.js";
import { decryptToken } from "../connectors/token-store.js";
import type { PostPublishJob } from "../queues/index.js";
import { db, postChannels, channels, posts } from "../db/index.js";
import { eq } from "drizzle-orm";

// Helper to extract image URLs from content HTML
function extractMediaUrls(contentHtml: string): string[] | undefined {
  const imgRegex = /src="([^"]+\.(?:jpg|jpeg|png|gif|webp))"/gi;
  const matches: string[] = [];
  let match;
  while ((match = imgRegex.exec(contentHtml)) !== null) {
    matches.push(match[1]);
  }
  return matches.length > 0 ? matches : undefined;
}

export function createPublishWorker() {
  return new Worker<PostPublishJob>(
    "post-publish",
    async (job) => {
      const { postId, channelId, content } = job.data;

      // Look up the channel
      const [channel] = await db
        .select()
        .from(channels)
        .where(eq(channels.id, channelId))
        .limit(1);

      if (!channel) {
        throw new Error(`Channel ${channelId} not found`);
      }

      if (channel.status !== "active") {
        throw new Error(`Channel ${channelId} is not active`);
      }

      const platform = channel.platform;
      let result: { platformPostId: string; platformPostUrl: string };

      try {
        // Route to browser automation for username/password channels
        if (channel.authMethod === "browser" || (channel.usernameEncrypted && !channel.accessTokenEncrypted)) {
          if (!channel.usernameEncrypted || !channel.passwordEncrypted) {
            throw new Error(`Channel ${channelId} has incomplete browser credentials`);
          }

          const username = decryptToken(channel.usernameEncrypted);
          const password = decryptToken(channel.passwordEncrypted);

          // Fetch post details for media/content
          const [post] = await db
            .select()
            .from(posts)
            .where(eq(posts.id, postId))
            .limit(1);

          const mediaUrls = post?.contentHtml ? extractMediaUrls(post.contentHtml) : undefined;
          const caption = post?.content || content || "";

          const browserResult = await publishViaBrowser(platform as "instagram" | "facebook" | "tiktok", {
            credentials: { username, password },
            imagePath: mediaUrls?.[0],
            videoPath: mediaUrls?.[0],
            caption,
          });

          if (!browserResult.success) {
            throw new Error(browserResult.error || "Browser automation failed");
          }

          result = {
            platformPostId: browserResult.platformPostId || "browser",
            platformPostUrl: browserResult.platformPostUrl || "",
          };
        } else {
          // OAuth path
          if (!channel.accessTokenEncrypted) {
            throw new Error(`Channel ${channelId} has no access token`);
          }

          const accessToken = decryptToken(channel.accessTokenEncrypted);

          if (platform === "twitter") {
            result = await publishToTwitter(content, { channelId, accessToken });
          } else if (platform === "linkedin") {
            result = await publishToLinkedIn(content, { channelId, accessToken });
          } else if (platform === "instagram") {
            result = await publishToInstagram(content, { channelId, accessToken });
          } else if (platform === "facebook") {
            result = await publishToFacebook(content, { channelId, accessToken });
          } else if (platform === "tiktok") {
            result = await publishToTikTok(content, { channelId, accessToken });
          } else {
            throw new Error(`Unsupported platform: ${platform}`);
          }
        }
      } catch (error) {
        // Mark as failed
        await db
          .update(postChannels)
          .set({
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
            updatedAt: new Date(),
          })
          .where(eq(postChannels.id, channelId));

        const remaining = await db
          .select()
          .from(postChannels)
          .where(eq(postChannels.postId, postId));

        const allFailed = remaining.every((pc) => pc.status === "failed");
        if (allFailed) {
          await db.update(posts).set({ status: "failed" }).where(eq(posts.id, postId));
        }

        throw error;
      }

      // Mark as published
      await db
        .update(postChannels)
        .set({
          status: "published",
          platformPostId: result.platformPostId,
          platformPostUrl: result.platformPostUrl,
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(postChannels.id, channelId));

      return result;
    },
    {
      connection,
      concurrency: 2, // Lower for browser automation (resource intensive)
      limiter: { max: 5, duration: 10000 }, // Slower rate for stealth
    }
  );
}
