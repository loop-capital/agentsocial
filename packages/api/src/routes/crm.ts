/**
 * CRM Integration Routes
 *
 * Phase 1A foundation routes for CRM provider management, webhook ingestion,
 * sync triggering, mappings, and audit logs.
 *
 * Routes:
 *   POST /webhooks/crm/:provider
 *   GET  /crm/providers
 *   POST /crm/providers
 *   PUT  /crm/providers/:id
 *   DELETE /crm/providers/:id
 *   POST /crm/providers/:id/oauth/callback
 *   POST /crm/providers/:id/sync
 *   GET  /crm/providers/:id/sync/status
 *   GET  /crm/mappings
 *   GET  /crm/logs
 */

import type { FastifyInstance } from "fastify";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  crmProviders,
  crmContactMappings,
  crmSyncJobs,
  crmSyncLogs,
  crmWebhookEvents,
  crmProviderEnum,
  crmSyncDirectionEnum,
} from "../db/index.js";
import { encryptToken } from "../connectors/token-store.js";
import { enqueueCrmSync, CrmSyncJobType } from "../queues/crm-sync.worker.js";
import type { CRMPlatform, SyncDirection } from "../services/crm/types.js";
import { listRegisteredPlatforms } from "../services/crm/connector-registry.js";

const providerParamSchema = z.object({
  provider: z.enum(["gohighlevel", "square"]),
});

const createProviderSchema = z.object({
  brand_id: z.string().uuid(),
  provider: z.enum(["gohighlevel", "square"]),
  sync_direction: z.enum(["bidirectional", "push_only", "pull_only"]).optional(),
  sync_enabled: z.boolean().optional(),
  webhook_enabled: z.boolean().optional(),
});

const updateProviderSchema = z.object({
  sync_direction: z.enum(["bidirectional", "push_only", "pull_only"]).optional(),
  sync_enabled: z.boolean().optional(),
  webhook_enabled: z.boolean().optional(),
  webhook_url: z.string().url().optional().nullable(),
  external_account_id: z.string().optional().nullable(),
  external_company_id: z.string().optional().nullable(),
});

export const crmRoutes = async (server: FastifyInstance) => {
  // ─── Webhook receiver (public) ─────────────────────────────────────────────
  // POST /webhooks/crm/:provider
  server.post("/webhooks/crm/:provider", async (request, reply) => {
    const parse = providerParamSchema.safeParse(request.params);
    if (!parse.success) {
      return reply.status(400).send({
        error: { code: "invalid_provider", message: "Unsupported provider", request_id: request.id },
      });
    }

    const { provider } = parse.data;
    const payload = request.body as Record<string, unknown>;

    // Phase 1A: accept and persist webhook payloads. Phase 1B/1C will add
    // signature verification and provider-specific event parsing.
    const externalEventId = String(payload.eventId ?? payload.id ?? payload.event_id ?? `unknown-${Date.now()}`);
    const eventType = String(payload.type ?? payload.eventType ?? "unknown");

    // We need a provider record to link the event. In Phase 1B/1C this will
    // resolve via locationId/merchantId in the payload.
    const providerRecord = await db
      .select({ id: crmProviders.id, brandId: crmProviders.brandId })
      .from(crmProviders)
      .where(
        and(
          eq(crmProviders.provider, provider),
          eq(crmProviders.webhookEnabled, true),
        ),
      )
      .limit(1);

    if (providerRecord.length === 0) {
      // Acknowledge webhook so platforms don't retry. Log to console for now.
      console.warn(`[crm-webhook] No enabled provider for ${provider}`);
      return reply.status(200).send({ received: true, linked: false });
    }

    const [{ id: crmProviderId, brandId }] = providerRecord;

    const [event] = await db
      .insert(crmWebhookEvents)
      .values({
        brandId,
        crmProviderId,
        externalEventId,
        eventType,
        payload,
        signature: request.headers["x-signature"] as string | undefined,
        verified: false,
        processed: false,
      })
      .returning({ id: crmWebhookEvents.id });

    // Phase 1B/1C: enqueue WEBHOOK_EVENT job for async processing.
    if (event) {
      await enqueueCrmSync(
        {
          brandId,
          crmProviderId,
          jobType: CrmSyncJobType.WEBHOOK_EVENT,
          webhookEventId: event.id,
          priority: "high",
        },
        { tracking: true },
      );
    }

    return reply.status(200).send({ received: true, linked: true });
  });

  // ─── Provider management (authenticated) ────────────────────────────────────
  // GET /crm/providers
  server.get("/crm/providers", {
    onRequest: [server.authenticate],
    schema: {
      querystring: {
        type: "object",
        properties: {
          brand_id: { type: "string" },
        },
      },
    },
  }, async (request, reply) => {
    const { brand_id } = request.query as { brand_id?: string };

    const rows = brand_id
      ? await db.select().from(crmProviders).where(eq(crmProviders.brandId, brand_id))
      : await db.select().from(crmProviders);

    return reply.send({
      data: rows.map((p) => ({
        id: p.id,
        brand_id: p.brandId,
        provider: p.provider,
        sync_direction: p.syncDirection,
        sync_enabled: p.syncEnabled,
        webhook_enabled: p.webhookEnabled,
        webhook_url: p.webhookUrl,
        external_account_id: p.externalAccountId,
        external_company_id: p.externalCompanyId,
        last_synced_at: p.lastSyncedAt,
        created_at: p.createdAt,
        updated_at: p.updatedAt,
      })),
      available_platforms: listRegisteredPlatforms(),
    });
  });

  // POST /crm/providers
  server.post("/crm/providers", {
    onRequest: [server.authenticate],
    schema: { body: createProviderSchema as any },
  }, async (request, reply) => {
    const body = createProviderSchema.parse(request.body);

    const [existing] = await db
      .select({ id: crmProviders.id })
      .from(crmProviders)
      .where(
        and(
          eq(crmProviders.brandId, body.brand_id),
          eq(crmProviders.provider, body.provider),
        ),
      )
      .limit(1);

    if (existing) {
      return reply.status(409).send({
        error: { code: "provider_exists", message: "Provider already configured for this brand", request_id: request.id },
      });
    }

    // Phase 1B/1C: generate OAuth URL and redirect user; here we just create the
    // provider record in a "pending" state and return an authorization URL.
    const [provider] = await db
      .insert(crmProviders)
      .values({
        brandId: body.brand_id,
        provider: body.provider,
        syncDirection: body.sync_direction ?? "bidirectional",
        syncEnabled: body.sync_enabled ?? false,
        webhookEnabled: body.webhook_enabled ?? false,
        webhookUrl: process.env.WEBHOOK_BASE_URL
          ? `${process.env.WEBHOOK_BASE_URL}/${body.provider}`
          : undefined,
      })
      .returning({
        id: crmProviders.id,
        provider: crmProviders.provider,
        webhookUrl: crmProviders.webhookUrl,
      });

    return reply.status(201).send({
      id: provider.id,
      provider: provider.provider,
      auth_url: `https://placeholder.agentsocial.com/oauth/${provider.provider}?provider_id=${provider.id}`,
      // Phase 1B/1C: replace with real connector.getAuthUrl() result
      message: "Provider created. Complete OAuth to activate.",
    });
  });

  // PUT /crm/providers/:id
  server.put("/crm/providers/:id", {
    onRequest: [server.authenticate],
    schema: { body: updateProviderSchema as any },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateProviderSchema.parse(request.body);

    const [existing] = await db
      .select()
      .from(crmProviders)
      .where(eq(crmProviders.id, id))
      .limit(1);

    if (!existing) {
      return reply.status(404).send({
        error: { code: "provider_not_found", message: "CRM provider not found", request_id: request.id },
      });
    }

    await db
      .update(crmProviders)
      .set({
        syncDirection: body.sync_direction ?? existing.syncDirection,
        syncEnabled: body.sync_enabled ?? existing.syncEnabled,
        webhookEnabled: body.webhook_enabled ?? existing.webhookEnabled,
        webhookUrl: body.webhook_url !== undefined ? body.webhook_url : existing.webhookUrl,
        externalAccountId: body.external_account_id !== undefined ? body.external_account_id : existing.externalAccountId,
        externalCompanyId: body.external_company_id !== undefined ? body.external_company_id : existing.externalCompanyId,
        updatedAt: new Date(),
      })
      .where(eq(crmProviders.id, id));

    return reply.send({ id, updated: true });
  });

  // DELETE /crm/providers/:id
  server.delete("/crm/providers/:id", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const [existing] = await db
      .select()
      .from(crmProviders)
      .where(eq(crmProviders.id, id))
      .limit(1);

    if (!existing) {
      return reply.status(404).send({
        error: { code: "provider_not_found", message: "CRM provider not found", request_id: request.id },
      });
    }

    // Phase 1B/1C: call connector.revokeAccess() before deleting tokens.
    await db.delete(crmProviders).where(eq(crmProviders.id, id));

    return reply.send({ id, deleted: true });
  });

  // POST /crm/providers/:id/oauth/callback
  server.post("/crm/providers/:id/oauth/callback", {
    onRequest: [server.authenticate],
    schema: {
      body: {
        type: "object",
        properties: {
          code: { type: "string" },
          state: { type: "string" },
        },
        required: ["code"],
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { code, state } = request.body as { code: string; state?: string };

    const [provider] = await db
      .select()
      .from(crmProviders)
      .where(eq(crmProviders.id, id))
      .limit(1);

    if (!provider) {
      return reply.status(404).send({
        error: { code: "provider_not_found", message: "CRM provider not found", request_id: request.id },
      });
    }

    // Phase 1B/1C: validate state, exchange code via connector, persist tokens.
    // Phase 1A: accept callback and store encrypted placeholder token so the
    // route compiles and the schema is exercised.
    await db
      .update(crmProviders)
      .set({
        accessTokenEncrypted: encryptToken(`oauth-code:${code}`),
        syncEnabled: true,
        updatedAt: new Date(),
      })
      .where(eq(crmProviders.id, id));

    return reply.send({
      id,
      provider: provider.provider,
      state_received: state,
      connected: true,
      message: "OAuth callback received. Token exchange will be implemented in Phase 1B/1C.",
    });
  });

  // POST /crm/providers/:id/sync
  server.post("/crm/providers/:id/sync", {
    onRequest: [server.authenticate],
    schema: {
      body: {
        type: "object",
        properties: {
          direction: { type: "string", enum: ["bidirectional", "push_only", "pull_only"] },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { direction } = (request.body ?? {}) as { direction?: SyncDirection };

    const [provider] = await db
      .select()
      .from(crmProviders)
      .where(eq(crmProviders.id, id))
      .limit(1);

    if (!provider) {
      return reply.status(404).send({
        error: { code: "provider_not_found", message: "CRM provider not found", request_id: request.id },
      });
    }

    const job = await enqueueCrmSync(
      {
        brandId: provider.brandId,
        crmProviderId: provider.id,
        jobType: CrmSyncJobType.MANUAL_SYNC,
        priority: "normal",
      },
      {
        jobId: `manual-sync-${provider.id}-${Date.now()}`,
        tracking: true,
      },
    );

    return reply.send({
      id,
      job_id: job.id,
      direction: direction ?? provider.syncDirection,
      status: "pending",
    });
  });

  // GET /crm/providers/:id/sync/status
  server.get("/crm/providers/:id/sync/status", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const [provider] = await db
      .select({
        id: crmProviders.id,
        lastSyncedAt: crmProviders.lastSyncedAt,
        syncEnabled: crmProviders.syncEnabled,
      })
      .from(crmProviders)
      .where(eq(crmProviders.id, id))
      .limit(1);

    if (!provider) {
      return reply.status(404).send({
        error: { code: "provider_not_found", message: "CRM provider not found", request_id: request.id },
      });
    }

    const jobs = await db
      .select()
      .from(crmSyncJobs)
      .where(eq(crmSyncJobs.crmProviderId, id))
      .orderBy(desc(crmSyncJobs.createdAt))
      .limit(10);

    return reply.send({
      provider_id: provider.id,
      sync_enabled: provider.syncEnabled,
      last_synced_at: provider.lastSyncedAt,
      recent_jobs: jobs.map((j) => ({
        id: j.id,
        job_id: j.jobId,
        type: j.type,
        direction: j.direction,
        status: j.status,
        total_records: j.totalRecords,
        processed_records: j.processedRecords,
        failed_records: j.failedRecords,
        created_at: j.createdAt,
        completed_at: j.completedAt,
      })),
    });
  });

  // GET /crm/mappings
  server.get("/crm/mappings", {
    onRequest: [server.authenticate],
    schema: {
      querystring: {
        type: "object",
        properties: {
          brand_id: { type: "string" },
          crm_provider_id: { type: "string" },
          limit: { type: "number" },
          offset: { type: "number" },
        },
      },
    },
  }, async (request, reply) => {
    const { brand_id, crm_provider_id, limit = 50, offset = 0 } = request.query as {
      brand_id?: string;
      crm_provider_id?: string;
      limit?: number;
      offset?: number;
    };

    const conditions = [];
    if (brand_id) conditions.push(eq(crmContactMappings.brandId, brand_id));
    if (crm_provider_id) conditions.push(eq(crmContactMappings.crmProviderId, crm_provider_id));

    const rows = await db
      .select()
      .from(crmContactMappings)
      .where(conditions.length ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset);

    return reply.send({
      data: rows.map((m) => ({
        id: m.id,
        brand_id: m.brandId,
        crm_provider_id: m.crmProviderId,
        agent_social_contact_id: m.agentSocialContactId,
        crm_contact_id: m.crmContactId,
        crm_external_id: m.crmExternalId,
        match_email: m.matchEmail,
        match_phone: m.matchPhone,
        sync_status: m.syncStatus,
        conflict_resolution: m.conflictResolution,
        last_synced_at: m.lastSyncedAt,
        created_at: m.createdAt,
      })),
    });
  });

  // GET /crm/logs
  server.get("/crm/logs", {
    onRequest: [server.authenticate],
    schema: {
      querystring: {
        type: "object",
        properties: {
          brand_id: { type: "string" },
          crm_provider_id: { type: "string" },
          limit: { type: "number" },
          offset: { type: "number" },
        },
      },
    },
  }, async (request, reply) => {
    const { brand_id, crm_provider_id, limit = 50, offset = 0 } = request.query as {
      brand_id?: string;
      crm_provider_id?: string;
      limit?: number;
      offset?: number;
    };

    const conditions = [];
    if (brand_id) conditions.push(eq(crmSyncLogs.brandId, brand_id));
    if (crm_provider_id) conditions.push(eq(crmSyncLogs.crmProviderId, crm_provider_id));

    const rows = await db
      .select()
      .from(crmSyncLogs)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(crmSyncLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return reply.send({
      data: rows.map((l) => ({
        id: l.id,
        brand_id: l.brandId,
        crm_provider_id: l.crmProviderId,
        sync_job_id: l.syncJobId,
        contact_mapping_id: l.contactMappingId,
        action: l.action,
        direction: l.direction,
        result: l.result,
        error_message: l.errorMessage,
        duration_ms: l.durationMs,
        created_at: l.createdAt,
      })),
    });
  });
};

export default crmRoutes;
