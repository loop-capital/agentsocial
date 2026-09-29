import { createPublishWorker } from "./publish.worker.js";
import { createAnalyticsWorker } from "./analytics.worker.js";
import { createCrmSyncWorker } from "../queues/crm-sync.worker.js";

export { createPublishWorker, createAnalyticsWorker, createCrmSyncWorker };

// Worker lifecycle management
let publishWorker: ReturnType<typeof createPublishWorker> | null = null;
let analyticsWorker: ReturnType<typeof createAnalyticsWorker> | null = null;
let crmSyncWorker: ReturnType<typeof createCrmSyncWorker> | null = null;

export function startWorkers() {
  if (publishWorker) {
    console.log("[workers] Publish worker already running");
  } else {
    publishWorker = createPublishWorker();
    console.log("[workers] Publish worker started");
  }

  if (analyticsWorker) {
    console.log("[workers] Analytics worker already running");
  } else {
    analyticsWorker = createAnalyticsWorker();
    console.log("[workers] Analytics worker started");
  }

  if (crmSyncWorker) {
    console.log("[workers] CRM sync worker already running");
  } else {
    crmSyncWorker = createCrmSyncWorker();
    console.log("[workers] CRM sync worker started");
  }
}

export async function stopWorkers() {
  if (publishWorker) {
    await publishWorker.close();
    publishWorker = null;
    console.log("[workers] Publish worker stopped");
  }

  if (analyticsWorker) {
    await analyticsWorker.close();
    analyticsWorker = null;
    console.log("[workers] Analytics worker stopped");
  }

  if (crmSyncWorker) {
    await crmSyncWorker.close();
    crmSyncWorker = null;
    console.log("[workers] CRM sync worker stopped");
  }
}
