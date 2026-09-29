import { and, eq } from "drizzle-orm";
import { db, posts, postChannels } from "../db/index.js";
import { postPublishQueue, enqueuePostPublish, publishJobId } from "./index.js";

/** Posts more than this late are failed instead of published (server was down). */
const MAX_LATE_MS = Number(process.env.REQUEUE_MAX_LATE_MINUTES ?? 360) * 60_000;

/**
 * Rebuild the Redis queue from the database. Redis is only a timer — the
 * database is the source of truth — so a Redis wipe or restart must not lose
 * scheduled posts. Safe to run repeatedly: existing jobs are left alone.
 */
export async function requeueScheduledPosts(): Promise<{ queued: number; missed: number }> {
  const rows = await db
    .select({
      postId: posts.id,
      content: posts.content,
      scheduledAt: posts.scheduledAt,
      channelId: postChannels.channelId,
    })
    .from(posts)
    .innerJoin(postChannels, eq(postChannels.postId, posts.id))
    .where(and(eq(posts.status, "scheduled"), eq(postChannels.status, "pending")));

  let queued = 0;
  let missed = 0;
  const now = Date.now();

  for (const r of rows) {
    if (!r.scheduledAt) continue;
    if (await postPublishQueue.getJob(publishJobId(r.postId, r.channelId))) continue;

    if (now - r.scheduledAt.getTime() > MAX_LATE_MS) {
      await db
        .update(postChannels)
        .set({ status: "failed", errorMessage: "Missed schedule (server was down)", updatedAt: new Date() })
        .where(and(eq(postChannels.postId, r.postId), eq(postChannels.channelId, r.channelId)));
      await db.update(posts).set({ status: "failed", updatedAt: new Date() }).where(eq(posts.id, r.postId));
      missed++;
      continue;
    }

    await enqueuePostPublish({
      postId: r.postId,
      channelId: r.channelId,
      content: r.content,
      scheduledFor: r.scheduledAt.toISOString(),
    });
    queued++;
  }
  return { queued, missed };
}
