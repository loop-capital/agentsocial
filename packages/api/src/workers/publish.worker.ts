import { Worker, UnrecoverableError } from "bullmq";
import { and, eq } from "drizzle-orm";
import { connection } from "../queues/redis.js";
import type { PostPublishJob } from "../queues/index.js";
import { db, postChannels, channels, posts, postMedia, mediaAssets } from "../db/index.js";
import {
  publishToChannel,
  usesProviderRouter,
  PublishValidationError,
  type PublishMedia,
  type PublishResult,
} from "../services/publishing/index.js";
import { publishToTwitter } from "../connectors/twitter.js";
import { publishToLinkedIn } from "../connectors/linkedin.js";
import { publishToInstagram } from "../connectors/instagram.js";
import { publishToFacebook } from "../connectors/facebook.js";
import { publishToTikTok } from "../connectors/tiktok.js";
import { publishViaBrowser } from "../connectors/browser-automation.js";
import { decryptToken } from "../connectors/token-store.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractMediaUrls(contentHtml: string | null): string[] {
  if (!contentHtml) return [];
  const re = /src="([^"]+\.(?:jpg|jpeg|png|gif|webp|mp4|mov))"/gi;
  const out: string[] = [];
  let m;
  while ((m = re.exec(contentHtml)) !== null) out.push(m[1]);
  return out;
}

async function loadMedia(postId: string, contentHtml: string | null): Promise<PublishMedia[]> {
  const rows = await db
    .select({ type: mediaAssets.type, url: mediaAssets.url })
    .from(postMedia)
    .innerJoin(mediaAssets, eq(postMedia.assetId, mediaAssets.id))
    .where(eq(postMedia.postId, postId));

  if (rows.length) {
    return rows.map((r) => ({ type: r.type === "video" ? "video" : "image", url: r.url }) as PublishMedia);
  }
  return extractMediaUrls(contentHtml).map((url) => ({
    type: /\.(mp4|mov)$/i.test(url) ? "video" : "image",
    url,
  }));
}

/** Once no channel is pending, settle the post's overall status. */
async function settlePost(postId: string) {
  const rows = await db.select().from(postChannels).where(eq(postChannels.postId, postId));
  if (rows.some((r) => r.status === "pending")) return;
  const anyPublished = rows.some((r) => r.status === "published");
  await db
    .update(posts)
    .set({
      status: anyPublished ? "published" : "failed",
      ...(anyPublished ? { publishedAt: new Date() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(posts.id, postId));
}

/**
 * Legacy path for channels that hold their own OAuth tokens or browser
 * credentials rather than a Composio/Zernio connection. Deprecated — new
 * channels should connect through the provider router.
 */
async function publishLegacy(
  channel: typeof channels.$inferSelect,
  content: string,
  media: PublishMedia[],
): Promise<PublishResult> {
  const platform = channel.platform;
  if (channel.authMethod === "browser" || (channel.usernameEncrypted && !channel.accessTokenEncrypted)) {
    if (!channel.usernameEncrypted || !channel.passwordEncrypted) {
      throw new PublishValidationError(`Channel ${channel.id} has incomplete browser credentials`);
    }
    const r = await publishViaBrowser(platform as "instagram" | "facebook" | "tiktok", {
      credentials: {
        username: decryptToken(channel.usernameEncrypted),
        password: decryptToken(channel.passwordEncrypted),
      },
      imagePath: media[0]?.url,
      videoPath: media[0]?.url,
      caption: content,
    });
    if (!r.success) throw new Error(r.error || "Browser automation failed");
    return { platformPostId: r.platformPostId || "browser", platformPostUrl: r.platformPostUrl || "" };
  }

  if (!channel.accessTokenEncrypted) {
    throw new PublishValidationError(`Channel ${channel.id} has no connection (no token, Composio or Zernio account)`);
  }
  const accessToken = decryptToken(channel.accessTokenEncrypted);
  const opts = { channelId: channel.id, accessToken };
  switch (platform) {
    case "twitter": return publishToTwitter(content, opts);
    case "linkedin": return publishToLinkedIn(content, opts);
    case "instagram": return publishToInstagram(content, opts);
    case "facebook": return publishToFacebook(content, opts);
    case "tiktok": return publishToTikTok(content, opts);
    default: throw new PublishValidationError(`Unsupported platform: ${platform}`);
  }
}

// ─── Worker ──────────────────────────────────────────────────────────────────

export function createPublishWorker() {
  return new Worker<PostPublishJob>(
    "post-publish",
    async (job) => {
      const { postId, channelId, scheduledFor } = job.data;

      // Guard 1: the post must still be scheduled (not cancelled/deleted/edited back to draft).
      const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
      if (!post || post.status !== "scheduled") {
        return { skipped: `post is ${post?.status ?? "missing"}` };
      }

      // Guard 2: a rescheduled post leaves a stale job behind if removal raced — skip it.
      if (scheduledFor && post.scheduledAt && Math.abs(post.scheduledAt.getTime() - new Date(scheduledFor).getTime()) > 1000) {
        return { skipped: "stale job (post was rescheduled)" };
      }

      // Guard 3: idempotency — only publish a channel that is still pending.
      const [pc] = await db
        .select()
        .from(postChannels)
        .where(and(eq(postChannels.postId, postId), eq(postChannels.channelId, channelId)))
        .limit(1);
      if (!pc || pc.status !== "pending") {
        return { skipped: `channel is ${pc?.status ?? "missing"}` };
      }

      const [channel] = await db.select().from(channels).where(eq(channels.id, channelId)).limit(1);
      const maxAttempts = job.opts.attempts ?? 1;
      const isLastAttempt = job.attemptsMade + 1 >= maxAttempts;

      const fail = async (err: unknown, final: boolean) => {
        const message = err instanceof Error ? err.message : "Unknown error";
        await db
          .update(postChannels)
          .set({ errorMessage: message, ...(final ? { status: "failed" } : {}), updatedAt: new Date() })
          .where(and(eq(postChannels.postId, postId), eq(postChannels.channelId, channelId)));
        if (final) await settlePost(postId);
      };

      try {
        if (!channel) throw new PublishValidationError(`Channel ${channelId} not found`);
        if (channel.status !== "active") throw new PublishValidationError(`Channel ${channelId} is not active`);

        const settings = (channel.settings ?? {}) as Record<string, unknown>;
        const media = await loadMedia(postId, post.contentHtml);

        let result: PublishResult;
        if (usesProviderRouter(channel.platform, settings)) {
          result = await publishToChannel({
            brandId: channel.brandId,
            channel: {
              id: channel.id,
              platform: channel.platform,
              name: channel.name,
              accountId: channel.accountId,
              settings,
            },
            content: post.content,
            media,
          });
        } else {
          result = await publishLegacy(channel, post.content, media);
        }

        // Cache identifiers discovered during publishing (IG business id, FB page id, ...).
        if (result.settingsPatch) {
          await db
            .update(channels)
            .set({ settings: { ...settings, ...result.settingsPatch }, updatedAt: new Date() })
            .where(eq(channels.id, channel.id));
        }

        await db
          .update(postChannels)
          .set({
            status: "published",
            platformPostId: result.platformPostId,
            platformPostUrl: result.platformPostUrl,
            publishedAt: new Date(),
            errorMessage: null,
            updatedAt: new Date(),
          })
          .where(and(eq(postChannels.postId, postId), eq(postChannels.channelId, channelId)));
        await settlePost(postId);
        return result;
      } catch (error) {
        if (error instanceof PublishValidationError) {
          // Retrying can't fix this — fail immediately.
          await fail(error, true);
          throw new UnrecoverableError(error.message);
        }
        await fail(error, isLastAttempt);
        throw error;
      }
    },
    {
      connection,
      concurrency: 2,
      limiter: { max: 5, duration: 10000 },
    },
  );
}
