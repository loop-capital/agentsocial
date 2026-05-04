import { createPublishWorker } from "../publish.worker.js";

export { createPublishWorker };

// Worker lifecycle management
let publishWorker: ReturnType<typeof createPublishWorker> | null = null;

export function startWorkers() {
  if (publishWorker) {
    console.log("[workers] Publish worker already running");
  } else {
    publishWorker = createPublishWorker();
    console.log("[workers] Publish worker started");
  }
}

export function stopWorkers() {
  if (publishWorker) {
    publishWorker.close();
    publishWorker = null;
    console.log("[workers] Publish worker stopped");
  }
}

export function getWorkerStatus() {
  return {
    publish: publishWorker ? "running" : "stopped",
  };
}
