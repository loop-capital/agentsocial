/**
 * CRM Sync Queue + Worker
 *
 * Handles asynchronous CRM sync jobs using BullMQ + Redis.
 * Job types: BATCH_SYNC, WEBHOOK_EVENT, MANUAL_SYNC, TOKEN_REFRESH.
 *
 * Phase 1A: queue infrastructure and job dispatcher shell.
 * Phase 1B/1C: connector-specific processors will be wired in.
 */

import { Queue, Worker, Job } from "bullmq";
import { eq } from "drizzle-orm";
import { connection } from "./redis.js";
import {
  db,
  crmSyncJobs,
  crmWebhookEvents,
  crmProviders,
} from "../db/index.js";

export const CRM_SYNC_QUEUE_NAME = "crm-sync";

export enum CrmSyncJobType {
  BATCH_SYNC = "batch_sync",
  WEBHOOK_EVENT = "webhook_event",
  MANUAL_SYNC = "manual_sync",
  TOKEN_REFRESH = "token_refresh",
}

export interface CrmSyncJobData {
  brandId: string;
  crmProviderId: string;
  jobType: CrmSyncJobType;
  contactIds?: string[];
  webhookEventId?: string;
  priority?: "low" | "normal" | "high";
}

export interface CrmSyncJobResult {
  success: boolean;
  processedRecords: number;
  failedRecords: number;
  errorMessage?: string;
}

export const crmSyncQueue = new Queue<CrmSyncJobData>(CRM_SYNC_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: {
      count: 100,
    },
    removeOnFail: {
      count: 500,
    },
  },
});

/**
 * Enqueue a CRM sync job. Optionally creates a tracking row in crmSyncJobs.
 */
export async function enqueueCrmSync(
  data: CrmSyncJobData,
  options: { jobId?: string; delay?: number; tracking?: boolean } = {},
): Promise<Job<CrmSyncJobData, CrmSyncJobResult>> {
  const jobOptions: Parameters<typeof crmSyncQueue.add>[2] = {
    jobId: options.jobId,
    delay: options.delay,
    priority: data.priority === "high" ? 1 : data.priority === "low" ? 3 : 2,
  };

  const job = await crmSyncQueue.add(
    `${data.jobType}:${data.crmProviderId}`,
    data,
    jobOptions,
  );

  if (options.tracking) {
    const provider = await db
      .select({ provider: crmProviders.provider })
      .from(crmProviders)
      .where(eq(crmProviders.id, data.crmProviderId))
      .limit(1);

    await db.insert(crmSyncJobs).values({
      brandId: data.brandId,
      crmProviderId: data.crmProviderId,
      jobId: job.id ?? `crm-sync-${Date.now()}`,
      type: data.jobType,
      direction: "bidirectional", // Phase 2: derive from provider config
      status: "pending",
    });
  }

  return job;
}

/**
 * Placeholder processor for batch sync jobs.
 * Phase 1B/1C will fetch the connector and run bulk operations.
 */
async function processBatchSync(
  _brandId: string,
  _crmProviderId: string,
  _contactIds?: string[],
): Promise<CrmSyncJobResult> {
  // Phase 1A: no-op foundation. Phase 1B/1C will implement real sync.
  return { success: true, processedRecords: 0, failedRecords: 0 };
}

/**
 * Placeholder processor for manual sync jobs.
 */
async function processManualSync(
  _brandId: string,
  _crmProviderId: string,
): Promise<CrmSyncJobResult> {
  // Phase 1A: no-op foundation. Phase 1B/1C will implement real sync.
  return { success: true, processedRecords: 0, failedRecords: 0 };
}

/**
 * Placeholder processor for token refresh jobs.
 */
async function processTokenRefresh(_crmProviderId: string): Promise<CrmSyncJobResult> {
  // Phase 1A: no-op foundation. Phase 1B/1C will call connector.refreshAccessToken.
  return { success: true, processedRecords: 0, failedRecords: 0 };
}

/**
 * Process an incoming CRM webhook event that was persisted to crmWebhookEvents.
 */
async function processWebhookEvent(webhookEventId: string): Promise<CrmSyncJobResult> {
  const [event] = await db
    .select()
    .from(crmWebhookEvents)
    .where(eq(crmWebhookEvents.id, webhookEventId))
    .limit(1);

  if (!event) {
    return { success: false, processedRecords: 0, failedRecords: 1, errorMessage: "Webhook event not found" };
  }

  // Phase 1A: mark as processed with no-op. Phase 1B/1C will call connector logic.
  await db
    .update(crmWebhookEvents)
    .set({
      processed: true,
      processedAt: new Date(),
    })
    .where(eq(crmWebhookEvents.id, webhookEventId));

  return { success: true, processedRecords: 1, failedRecords: 0 };
}

async function updateJobStatus(
  jobId: string,
  result: CrmSyncJobResult,
): Promise<void> {
  try {
    await db
      .update(crmSyncJobs)
      .set({
        status: result.success ? "completed" : "failed",
        processedRecords: result.processedRecords,
        failedRecords: result.failedRecords,
        errorMessage: result.errorMessage,
        completedAt: result.success ? new Date() : undefined,
      })
      .where(eq(crmSyncJobs.jobId, jobId));
  } catch (err) {
    console.error("[crm-sync] Failed to update job status:", err);
  }
}

/**
 * Create and return the CRM sync BullMQ worker.
 */
export function createCrmSyncWorker() {
  const worker = new Worker<CrmSyncJobData, CrmSyncJobResult>(
    CRM_SYNC_QUEUE_NAME,
    async (job) => {
      const { brandId, crmProviderId, jobType, contactIds, webhookEventId } = job.data;

      console.log(
        `[crm-sync] Processing job ${job.id}: ${jobType} for brand ${brandId}`,
      );

      let result: CrmSyncJobResult;

      switch (jobType) {
        case CrmSyncJobType.BATCH_SYNC:
          result = await processBatchSync(brandId, crmProviderId, contactIds);
          break;
        case CrmSyncJobType.WEBHOOK_EVENT:
          result = await processWebhookEvent(webhookEventId!);
          break;
        case CrmSyncJobType.MANUAL_SYNC:
          result = await processManualSync(brandId, crmProviderId);
          break;
        case CrmSyncJobType.TOKEN_REFRESH:
          result = await processTokenRefresh(crmProviderId);
          break;
        default:
          result = {
            success: false,
            processedRecords: 0,
            failedRecords: 1,
            errorMessage: `Unknown job type: ${String(jobType)}`,
          };
      }

      if (job.id) {
        await updateJobStatus(job.id, result);
      }

      if (!result.success) {
        throw new Error(result.errorMessage || "CRM sync job failed");
      }

      return result;
    },
    {
      connection,
      concurrency: 5,
    },
  );

  worker.on("completed", (job) => {
    console.log(`[crm-sync] Job ${job.id} completed successfully`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[crm-sync] Job ${job?.id} failed:`, err);

    if (job && job.attemptsMade >= 3) {
      // Phase 2: alert on repeated failures (Sentry/PagerDuty/Slack)
      console.error(`[crm-sync] Job ${job.id} exhausted retries`);
    }
  });

  worker.on("error", (err) => {
    console.error("[crm-sync] Worker error:", err);
  });

  return worker;
}

export default createCrmSyncWorker;
