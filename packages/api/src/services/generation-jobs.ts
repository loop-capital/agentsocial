/**
 * Generation Jobs — durable record of every muapi image/video job.
 *
 * - Jobs are polled server-side (sweepGenerationJobs) so clients never hold a
 *   connection open; clients read state via GET /generate/jobs/:id.
 * - Every job stores the estimated cost at submit and muapi's actual cost at
 *   completion, which feeds per-brand monthly spend and optional caps.
 * - Terminal transitions emit generate.completed / generate.failed webhooks.
 */

import { pool } from "../db/index.js";
import { getGenerationService, MuapiError } from "./generation.js";
import { deliverWebhookEvent } from "./webhook-delivery.js";

export type JobKind = "image" | "video" | "video_edit";
export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface JobError {
  code: string;
  message: string;
  upstream_status?: number;
  upstream_error?: unknown;
}

export interface GenerationJob {
  id: string;
  kind: JobKind;
  status: JobStatus;
  brandId: string;
  userId: string;
  provider: string;
  model: string;
  providerJobId: string | null;
  request: Record<string, unknown>;
  outputs: Array<{ url: string; mimeType: string }>;
  error: JobError | null;
  estimatedCostUsd: number | null;
  actualCostUsd: number | null;
  pollAttempts: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

/** Jobs still running after this are failed so they stop counting as pending spend. */
const JOB_TIMEOUT_MS = 30 * 60_000;

export async function ensureGenerationTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS generation_jobs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind text NOT NULL,
      status text NOT NULL DEFAULT 'queued',
      provider text NOT NULL,
      model text NOT NULL,
      provider_job_id text,
      request jsonb NOT NULL DEFAULT '{}'::jsonb,
      outputs jsonb NOT NULL DEFAULT '[]'::jsonb,
      error jsonb,
      estimated_cost_usd numeric(12, 6),
      actual_cost_usd numeric(12, 6),
      poll_attempts integer NOT NULL DEFAULT 0,
      last_polled_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      completed_at timestamptz
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS generation_jobs_brand_created_idx ON generation_jobs (brand_id, created_at DESC)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS generation_jobs_active_idx ON generation_jobs (status) WHERE status IN ('queued', 'processing')`);
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS generation_jobs_provider_job_idx ON generation_jobs (provider, provider_job_id) WHERE provider_job_id IS NOT NULL`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS generation_budgets (
      brand_id uuid PRIMARY KEY REFERENCES brands(id) ON DELETE CASCADE,
      monthly_cap_usd numeric(12, 2),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

const num = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));

function toJob(r: any): GenerationJob {
  return {
    id: r.id,
    kind: r.kind,
    status: r.status,
    brandId: r.brand_id,
    userId: r.user_id,
    provider: r.provider,
    model: r.model,
    providerJobId: r.provider_job_id,
    request: r.request ?? {},
    outputs: r.outputs ?? [],
    error: r.error ?? null,
    estimatedCostUsd: num(r.estimated_cost_usd),
    actualCostUsd: num(r.actual_cost_usd),
    pollAttempts: r.poll_attempts,
    // The pool returns timestamps as strings
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
    completedAt: r.completed_at ? new Date(r.completed_at) : null,
  };
}

/** Public JSON shape of a job (also keeps the fields older clients poll for). */
export function serializeJob(job: GenerationJob) {
  return {
    id: job.id,
    jobId: job.id,
    kind: job.kind,
    status: job.status,
    brand_id: job.brandId,
    provider: job.provider,
    model: job.model,
    provider_job_id: job.providerJobId,
    outputs: job.outputs,
    result: job.outputs[0] ? { url: job.outputs[0].url } : null,
    error: job.error?.message ?? null,
    error_details: job.error,
    cost: {
      currency: "USD" as const,
      estimated_usd: job.estimatedCostUsd,
      actual_usd: job.actualCostUsd,
    },
    created_at: job.createdAt.toISOString(),
    updated_at: job.updatedAt.toISOString(),
    completed_at: job.completedAt ? job.completedAt.toISOString() : null,
  };
}

export async function createJob(input: {
  kind: JobKind;
  brandId: string;
  userId: string;
  provider: string;
  model: string;
  request: Record<string, unknown>;
  estimatedCostUsd: number | null;
}): Promise<GenerationJob> {
  const { rows } = await pool.query(
    `INSERT INTO generation_jobs (kind, brand_id, user_id, provider, model, request, estimated_cost_usd)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [input.kind, input.brandId, input.userId, input.provider, input.model, input.request, input.estimatedCostUsd],
  );
  return toJob(rows[0]);
}

async function updateJob(id: string, fields: Record<string, unknown>): Promise<GenerationJob> {
  const keys = Object.keys(fields);
  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
  const { rows } = await pool.query(
    `UPDATE generation_jobs SET ${sets}, updated_at = now() WHERE id = $1 RETURNING *`,
    [id, ...keys.map((k) => fields[k])],
  );
  return toJob(rows[0]);
}

/** Load a job visible to this user (via brand ownership); matches our id or muapi's. */
export async function getJobForUser(jobId: string, userId: string): Promise<GenerationJob | null> {
  const providerJobId = jobId.replace(/^muapi-/, "");
  const { rows } = await pool.query(
    `SELECT j.* FROM generation_jobs j JOIN brands b ON b.id = j.brand_id
     WHERE b.user_id = $1 AND (j.id::text = $2 OR j.provider_job_id = $3)
     LIMIT 1`,
    [userId, jobId, providerJobId],
  );
  return rows[0] ? toJob(rows[0]) : null;
}

export async function listJobs(brandId: string, opts: { status?: JobStatus; limit?: number } = {}) {
  const { rows } = await pool.query(
    `SELECT * FROM generation_jobs WHERE brand_id = $1 AND ($2::text IS NULL OR status = $2)
     ORDER BY created_at DESC LIMIT $3`,
    [brandId, opts.status ?? null, Math.min(opts.limit ?? 50, 200)],
  );
  return rows.map(toJob);
}

// ─── Spend & budgets ─────────────────────────────────────────────────────────

export interface BrandSpend {
  month: string;
  actual_usd: number;
  pending_estimated_usd: number;
  jobs_completed: number;
  jobs_failed: number;
  jobs_in_progress: number;
  monthly_cap_usd: number | null;
  remaining_usd: number | null;
}

/** Month is "YYYY-MM" (UTC); defaults to the current month. */
export async function getBrandSpend(brandId: string, month?: string): Promise<BrandSpend> {
  const m = month ?? new Date().toISOString().slice(0, 7);
  const { rows } = await pool.query(
    `SELECT
       coalesce(sum(actual_cost_usd) FILTER (WHERE status = 'completed'), 0) AS actual,
       coalesce(sum(estimated_cost_usd) FILTER (WHERE status IN ('queued', 'processing')), 0) AS pending,
       count(*) FILTER (WHERE status = 'completed') AS completed,
       count(*) FILTER (WHERE status = 'failed') AS failed,
       count(*) FILTER (WHERE status IN ('queued', 'processing')) AS in_progress
     FROM generation_jobs
     WHERE brand_id = $1 AND to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM') = $2`,
    [brandId, m],
  );
  const cap = await getBrandCap(brandId);
  const actual = Number(rows[0].actual);
  const pending = Number(rows[0].pending);
  return {
    month: m,
    actual_usd: actual,
    pending_estimated_usd: pending,
    jobs_completed: Number(rows[0].completed),
    jobs_failed: Number(rows[0].failed),
    jobs_in_progress: Number(rows[0].in_progress),
    monthly_cap_usd: cap,
    remaining_usd: cap === null ? null : Math.max(0, cap - actual - pending),
  };
}

export async function getBrandCap(brandId: string): Promise<number | null> {
  const { rows } = await pool.query(`SELECT monthly_cap_usd FROM generation_budgets WHERE brand_id = $1`, [brandId]);
  return num(rows[0]?.monthly_cap_usd);
}

export async function setBrandCap(brandId: string, capUsd: number | null): Promise<void> {
  await pool.query(
    `INSERT INTO generation_budgets (brand_id, monthly_cap_usd) VALUES ($1, $2)
     ON CONFLICT (brand_id) DO UPDATE SET monthly_cap_usd = EXCLUDED.monthly_cap_usd, updated_at = now()`,
    [brandId, capUsd],
  );
}

/** Throws a budget error when this job would push the brand past its monthly cap. */
export async function assertWithinBudget(brandId: string, estimatedCostUsd: number | null): Promise<void> {
  const spend = await getBrandSpend(brandId);
  if (spend.monthly_cap_usd === null) return;
  const projected = spend.actual_usd + spend.pending_estimated_usd + (estimatedCostUsd ?? 0);
  if (projected > spend.monthly_cap_usd) {
    throw new BudgetExceededError(spend, estimatedCostUsd ?? 0);
  }
}

export class BudgetExceededError extends Error {
  constructor(public spend: BrandSpend, public estimatedCostUsd: number) {
    super(
      `Monthly generation cap of $${spend.monthly_cap_usd?.toFixed(2)} would be exceeded ` +
        `(spent $${spend.actual_usd.toFixed(4)}, pending $${spend.pending_estimated_usd.toFixed(4)}, ` +
        `this job ~$${estimatedCostUsd.toFixed(4)})`,
    );
  }
}

// ─── Submit & poll ───────────────────────────────────────────────────────────

/** Submit a queued job to muapi; marks the job failed (and rethrows) on upstream error. */
export async function submitJob(job: GenerationJob, body: Record<string, unknown>): Promise<GenerationJob> {
  const service = getGenerationService();
  try {
    const submitted = await service.submitMuapi(job.model, body);
    return await updateJob(job.id, {
      status: "processing",
      provider_job_id: submitted.requestId,
      ...(submitted.costUsd !== null ? { actual_cost_usd: submitted.costUsd } : {}),
    });
  } catch (err) {
    await finishJob(job, { status: "failed", error: toJobError(err) });
    throw err;
  }
}

export function toJobError(err: unknown): JobError {
  if (err instanceof MuapiError) {
    return { code: err.code, message: err.message, upstream_status: err.upstreamStatus, upstream_error: err.upstreamError };
  }
  return { code: "internal_error", message: err instanceof Error ? err.message : String(err) };
}

async function finishJob(
  job: GenerationJob,
  fields: { status: "completed" | "failed"; outputs?: GenerationJob["outputs"]; error?: JobError; actualCostUsd?: number | null },
): Promise<GenerationJob> {
  const updated = await updateJob(job.id, {
    status: fields.status,
    completed_at: new Date(),
    ...(fields.outputs ? { outputs: JSON.stringify(fields.outputs) } : {}),
    // Clear transient poll errors on success
    error: fields.error ? JSON.stringify(fields.error) : null,
    // A failed job isn't billed by muapi; keep 0 so it doesn't count as spend
    ...(fields.status === "failed" ? { actual_cost_usd: 0 } : {}),
    ...(fields.actualCostUsd != null ? { actual_cost_usd: fields.actualCostUsd } : {}),
  });
  void deliverWebhookEvent(updated.userId, `generate.${fields.status}`, serializeJob(updated));
  return updated;
}

/** Poll one job once and persist the result. Returns the (possibly updated) job. */
export async function refreshJob(job: GenerationJob): Promise<GenerationJob> {
  if (job.status === "completed" || job.status === "failed" || !job.providerJobId) return job;

  if (Date.now() - job.createdAt.getTime() > JOB_TIMEOUT_MS) {
    return finishJob(job, {
      status: "failed",
      error: { code: "job_timeout", message: `No result from ${job.provider} after ${JOB_TIMEOUT_MS / 60_000} minutes` },
    });
  }

  try {
    const result = await getGenerationService().pollMuapi(job.providerJobId);
    if (result.status === "completed") {
      return finishJob(job, {
        status: "completed",
        outputs: result.outputs,
        actualCostUsd: result.costUsd ?? job.actualCostUsd ?? job.estimatedCostUsd,
      });
    }
    if (result.status === "failed") {
      return finishJob(job, {
        status: "failed",
        error: { code: "generation_failed", message: result.error ?? "Generation failed upstream", upstream_error: result.raw },
      });
    }
    return await updateJob(job.id, { poll_attempts: job.pollAttempts + 1, last_polled_at: new Date() });
  } catch (err) {
    // Transient poll errors don't fail the job; the timeout above bounds retries
    return await updateJob(job.id, {
      poll_attempts: job.pollAttempts + 1,
      last_polled_at: new Date(),
      error: JSON.stringify(toJobError(err)),
    });
  }
}

/** Wait (bounded) for a job to finish — used for short image jobs. */
export async function waitForJob(job: GenerationJob, timeoutMs: number): Promise<GenerationJob> {
  const deadline = Date.now() + timeoutMs;
  let current = job;
  while (current.status === "processing" && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2000));
    current = await refreshJob(current);
  }
  return current;
}

let sweeping = false;

/** Poll every in-flight job once. Runs on an interval from server start. */
export async function sweepGenerationJobs(): Promise<{ polled: number }> {
  if (sweeping) return { polled: 0 };
  sweeping = true;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM generation_jobs
       WHERE status = 'processing' AND provider_job_id IS NOT NULL
         AND (last_polled_at IS NULL OR last_polled_at < now() - interval '5 seconds')
       ORDER BY created_at LIMIT 50`,
    );
    for (const row of rows) await refreshJob(toJob(row));
    return { polled: rows.length };
  } finally {
    sweeping = false;
  }
}
