import { Queue, Worker, Job } from "bullmq";
import { connection } from "./redis.js";
import type { Post } from "@agentsocial/shared";

// Queue names
export const QUEUES = {
  POST_PUBLISH: "post-publish",
  POST_SCHEDULE: "post-schedule",
  ANALYTICS_SYNC: "analytics-sync",
  MEDIA_PROCESS: "media-process",
  EXPORT_REPORT: "export-report",
} as const;

// ─── Post Publishing Queue ────────────────────────────────────────────────────

export interface PostPublishJob {
  postId: string;
  channelId: string;
  content: string;
  scheduledFor?: string;
}

export const postPublishQueue = new Queue<PostPublishJob>(QUEUES.POST_PUBLISH, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});

// ─── Analytics Sync Queue ─────────────────────────────────────────────────────

export interface AnalyticsSyncJob {
  brandId: string;
  channelId: string;
  startDate: string;
  endDate: string;
}

export const analyticsSyncQueue = new Queue<AnalyticsSyncJob>(QUEUES.ANALYTICS_SYNC, {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "fixed", delay: 5000 },
    removeOnComplete: 50,
    removeOnFail: 200,
  },
});

// ─── Export Report Queue ───────────────────────────────────────────────────────

export interface ExportReportJob {
  userId: string;
  brandId: string;
  format: "pdf" | "csv" | "xlsx";
  period: string;
  includeCharts: boolean;
}

export const exportReportQueue = new Queue<ExportReportJob>(QUEUES.EXPORT_REPORT, {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 3000 },
    removeOnComplete: 20,
    removeOnFail: 100,
  },
});

// ─── Job Enqueue Helpers ──────────────────────────────────────────────────────

/** Deterministic id so a post/channel pair can only have one live publish job. */
export const publishJobId = (postId: string, channelId: string) => `pub-${postId}-${channelId}`;

/**
 * Enqueue (or re-enqueue) a publish job. Any existing job for the same
 * post/channel is removed first, so rescheduling never leaves a stale job
 * that would fire at the old time.
 */
export async function enqueuePostPublish(data: PostPublishJob): Promise<Job<PostPublishJob>> {
  await removePostPublishJobs(data.postId, [data.channelId]);
  const delay = data.scheduledFor
    ? Math.max(0, new Date(data.scheduledFor).getTime() - Date.now())
    : undefined;
  return postPublishQueue.add("publish-post", data, {
    jobId: publishJobId(data.postId, data.channelId),
    delay,
  });
}

/** Remove pending/delayed publish jobs (cancel, reschedule, delete). Active jobs are left to the worker's guards. */
export async function removePostPublishJobs(postId: string, channelIds: string[]): Promise<void> {
  await Promise.all(
    channelIds.map(async (channelId) => {
      const job = await postPublishQueue.getJob(publishJobId(postId, channelId));
      if (!job) return;
      const state = await job.getState();
      if (state !== "active") await job.remove().catch(() => undefined);
    }),
  );
}

export async function enqueueAnalyticsSync(data: AnalyticsSyncJob): Promise<Job<AnalyticsSyncJob>> {
  return analyticsSyncQueue.add("sync-analytics", data, {
    priority: 2,
  });
}

export async function enqueueExportReport(data: ExportReportJob): Promise<Job<ExportReportJob>> {
  return exportReportQueue.add("export-report", data, {
    priority: 1,
  });
}

// ─── Queue Health ─────────────────────────────────────────────────────────────

export async function getQueueStats() {
  const [publish, analytics, export_] = await Promise.all([
    postPublishQueue.getJobCounts(),
    analyticsSyncQueue.getJobCounts(),
    exportReportQueue.getJobCounts(),
  ]);

  return { publish, analytics, export: export_ };
}