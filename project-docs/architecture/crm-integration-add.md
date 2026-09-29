# CRM Integration Architecture Design Document (ADD)

**Document ID:** ADD-CRM-001  
**Created:** 2026-09-14  
**Author:** AgentSocial-CEO  
**Status:** Draft for Review  
**Phase:** Phase 1 (GoHighLevel + Square)

---

## Executive Summary

This document defines the architecture for bidirectional CRM integration in AgentSocial, enabling seamless lead and contact synchronization between AgentSocial and external CRM/booking platforms. Phase 1 targets **GoHighLevel (GHL)** as the primary CRM and **Square** as the secondary booking/payments platform.

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Strategy Pattern** for connectors | Enables pluggable adapters without modifying core sync logic |
| **Queue-based sync** with Redis | Handles rate limits, provides retry logic, decouples systems |
| **AgentSocial = social engagement SoT**, **CRM = contact data SoT** | Clear ownership prevents conflicts |
| **Hourly batch + webhook real-time** | Balances API costs with critical event freshness |
| **Email + phone deduplication** | Matches salon industry practices (clients often share phones) |

---

## 1. System Architecture

### 1.1 High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AGENTSOCIAL PLATFORM                              │
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   Webhooks   │    │   REST API   │    │   Dashboard  │                  │
│  │   Receiver   │    │   Endpoints  │    │      UI      │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                          │
│         └───────────────────┼───────────────────┘                          │
│                             │                                              │
│                    ┌────────▼────────┐                                     │
│                    │  Sync Orchestrator │                                   │
│                    │  (Coordinator)     │                                   │
│                    └────────┬────────┘                                     │
│                             │                                              │
│         ┌───────────────────┼───────────────────┐                         │
│         │                   │                   │                         │
│  ┌──────▼───────┐  ┌───────▼────────┐  ┌───────▼───────┐                 │
│  │   GHL        │  │   Square       │  │   Future      │                 │
│  │   Connector  │  │   Connector    │  │   Connectors  │                 │
│  │   Adapter    │  │   Adapter      │  │   (Plugin)    │                 │
│  └──────┬───────┘  └───────┬────────┘  └───────┬───────┘                 │
│         │                  │                   │                          │
│         └──────────────────┼───────────────────┘                          │
│                            │                                             │
│                   ┌────────▼────────┐                                    │
│                   │   Redis Queue   │                                    │
│                   │   (BullMQ)      │                                    │
│                   └────────┬────────┘                                    │
│                            │                                             │
│                   ┌────────▼────────┐                                    │
│                   │   Sync Worker   │                                    │
│                   │   (Background)  │                                    │
│                   └────────┬────────┘                                    │
│                            │                                             │
│                   ┌────────▼────────┐                                    │
│                   │   PostgreSQL    │                                    │
│                   │   (Drizzle ORM) │                                    │
│                   └─────────────────┘                                    │
└─────────────────────────────────────────────────────────────────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  GoHighLevel    │    │     Square      │    │   Future CRMs   │
│  (GHL API v2)   │    │  (Payments +    │    │   (Mindbody,    │
│  OAuth 2.0      │    │   Booking)      │    │    Vagaro, etc) │
│  Webhooks       │    │  OAuth 2.0      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 1.2 Component Responsibilities

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| **Webhook Receiver** | Validate signatures, parse payloads, enqueue events | Fastify route + middleware |
| **Sync Orchestrator** | Coordinate batch jobs, manage sync state, handle conflicts | Service layer |
| **Connector Adapters** | Platform-specific API calls, auth, data transformation | Strategy pattern |
| **Redis Queue** | Job queue for async sync operations, retry logic | BullMQ + Redis |
| **Sync Worker** | Process queued jobs, execute sync, update database | Background worker |
| **Database** | Store sync state, mappings, conflict resolution logs | PostgreSQL (Drizzle) |

### 1.3 Data Flow: Contact Created in AgentSocial → GHL

```
┌──────────┐     ┌───────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Dashboard│ ──▶ │ POST /api│ ──▶ │  Sync    │ ──▶ │  Redis   │ ──▶ │  GHL     │
│   User   │     │ contacts  │     │Orchestrator│    │  Queue   │     │  API     │
└──────────┘     └───────────┘     └──────────┘     └──────────┘     └──────────┘
                      │                                      │
                      │                                      ▼
                      │                               ┌──────────┐
                      │                               │  Worker  │
                      │                               │ Process  │
                      │                               └──────────┘
                      │                                      │
                      ▼                                      ▼
                ┌──────────┐                          ┌──────────┐
                │   DB     │◀─────────────────────────│   DB     │
                │  (Write) │                          │ (Update) │
                └──────────┘                          └──────────┘
```

### 1.4 Data Flow: Webhook from GHL → AgentSocial

```
┌──────────┐     ┌───────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│    GHL   │ ──▶ │POST       │ ──▶ │ Signature│ ──▶ │  Redis   │ ──▶ │  Sync    │
│ Webhook  │     │/webhooks/ │     │  Verify  │     │  Queue   │     │  Worker  │
│          │     │   ghl     │     │Middleware│     │          │     │          │
└──────────┘     └───────────┘     └──────────┘     └──────────┘     └────┬─────┘
                                                                          │
                                                                          ▼
                                                                    ┌──────────┐
                                                                    │ Conflict │
                                                                    │  Check   │
                                                                    └────┬─────┘
                                                                         │
                                         ┌───────────────────────────────┤
                                         │                               │
                                  ┌──────▼──────┐                 ┌──────▼──────┐
                                  │  No Conflict│                 │   Conflict  │
                                  │  (Write)    │                 │  (Resolve)  │
                                  └──────┬──────┘                 └──────┬──────┘
                                         │                               │
                                         ▼                               ▼
                                   ┌──────────┐                   ┌──────────┐
                                   │   DB     │                   │  Log +   │
                                   │  Update  │                   │  Notify  │
                                   └──────────┘                   └──────────┘
```

---

## 2. Connector Interface Design

### 2.1 Pattern Selection: Strategy Pattern

After evaluating Strategy vs Plugin vs Factory patterns, **Strategy Pattern** was selected because:

1. **Clear interface contract** — All connectors implement the same methods
2. **Runtime swapping** — Can switch connectors per brand without code changes
3. **Testability** — Easy to mock connectors in unit tests
4. **Existing precedent** — Matches our social media connector pattern (`packages/api/src/connectors/`)

### 2.2 Unified Connector Interface

```typescript
// packages/api/src/services/crm/types.ts

export enum CRMPlatform {
  GOHIGHLEVEL = 'gohighlevel',
  SQUARE = 'square',
}

export interface CRMContact {
  id: string;              // Platform-native ID
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  sourceOfTruth: 'agentsocial' | 'crm';
}

export interface CRMSyncResult {
  success: boolean;
  contactId?: string;
  action: 'created' | 'updated' | 'deleted' | 'skipped';
  conflict?: {
    field: string;
    localValue: any;
    remoteValue: any;
    resolution: 'local_wins' | 'remote_wins' | 'merged';
  };
  error?: string;
}

export interface CRMConnector {
  // Authentication
  getAuthUrl(state: string): Promise<string>;
  exchangeCode(code: string): Promise<{ accessToken: string; refreshToken: string }>;
  refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }>;
  revokeAccess(accessToken: string): Promise<void>;

  // Contact CRUD
  getContact(id: string): Promise<CRMContact | null>;
  createContact(contact: Partial<CRMContact>): Promise<CRMSyncResult>;
  updateContact(id: string, contact: Partial<CRMContact>): Promise<CRMSyncResult>;
  deleteContact(id: string): Promise<CRMSyncResult>;
  searchContacts(query: { email?: string; phone?: string }): Promise<CRMContact[]>;

  // Bulk operations
  bulkSyncContacts(contacts: Partial<CRMContact>[]): Promise<CRMSyncResult[]>;

  // Webhooks
  getWebhookEvents(): Promise<string[]>;
  registerWebhook(url: string, events: string[]): Promise<{ webhookId: string; secret: string }>;
  unregisterWebhook(webhookId: string): Promise<void>;
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;

  // Metadata
  getPlatformInfo(): Promise<{ name: string; version: string; rateLimit: { limit: number; windowMs: number } }>;
}
```

### 2.3 Adapter Implementation Structure

```
packages/api/src/services/crm/
├── types.ts                 # Shared types and interfaces
├── connector-registry.ts    # Registry for connector lookup
├── base-connector.ts        # Abstract base class with common logic
├── adapters/
│   ├── gohighlevel/
│   │   ├── index.ts         # GHL connector implementation
│   │   ├── auth.ts          # OAuth 2.0 flow
│   │   ├── api-client.ts    # HTTP client with rate limiting
│   │   ├── transformers.ts  # Data mapping (AgentSocial ↔ GHL)
│   │   └── webhooks.ts      # Webhook handling
│   └── square/
│       ├── index.ts         # Square connector implementation
│       ├── auth.ts          # OAuth 2.0 flow
│       ├── api-client.ts    # Square SDK wrapper
│       ├── transformers.ts  # Data mapping
│       └── webhooks.ts      # Webhook handling
└── sync/
    ├── orchestrator.ts      # Sync coordination logic
    ├── conflict-resolver.ts # Deduplication and conflict resolution
    ├── scheduler.ts         # Batch job scheduling
    └── queue-worker.ts      # Redis queue processor
```

---

## 3. Data Models (Database Schema)

### 3.1 New Tables

Add to `packages/api/src/db/schema.ts`:

```typescript
// ─── CRM Integrations ────────────────────────────────────────────────────────

export const crmProviderEnum = pgEnum("crm_provider", [
  "gohighlevel",
  "square",
]);

export const crmSyncDirectionEnum = pgEnum("crm_sync_direction", [
  "bidirectional",
  "push_only",
  "pull_only",
]);

export const crmSyncStatusEnum = pgEnum("crm_sync_status", [
  "pending",
  "syncing",
  "completed",
  "failed",
  "paused",
]);

export const crmConflictResolutionEnum = pgEnum("crm_conflict_resolution", [
  "local_wins",
  "remote_wins",
  "merge",
  "manual",
]);

// CRM Provider Configurations (per brand)
export const crmProviders = pgTable("crm_providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  provider: crmProviderEnum("provider").notNull(),
  // OAuth credentials (encrypted)
  accessTokenEncrypted: text("access_token_encrypted"),
  refreshTokenEncrypted: text("refresh_token_encrypted"),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
  // GHL-specific: location/sub-account ID
  externalAccountId: text("external_account_id"), // GHL locationId, Square locationId
  externalCompanyId: text("external_company_id"), // GHL companyId for agency model
  // Configuration
  syncDirection: crmSyncDirectionEnum("sync_direction").notNull().default("bidirectional"),
  syncEnabled: boolean("sync_enabled").notNull().default(false),
  webhookEnabled: boolean("webhook_enabled").notNull().default(false),
  webhookUrl: text("webhook_url"),
  webhookSecret: text("webhook_secret"), // For verifying incoming webhooks
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Contact Mapping Table (AgentSocial ↔ CRM)
export const crmContactMappings = pgTable("crm_contact_mappings", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  crmProviderId: uuid("crm_provider_id").notNull().references(() => crmProviders.id, { onDelete: "cascade" }),
  // AgentSocial side
  agentSocialContactId: uuid("agent_social_contact_id").notNull(), // References future contacts table
  // CRM side
  crmContactId: text("crm_contact_id").notNull(), // Platform-native ID
  crmExternalId: text("crm_external_id"), // Secondary identifier (for dedup)
  // Deduplication keys
  matchEmail: text("match_email"),
  matchPhone: text("match_phone"),
  // Sync metadata
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  syncStatus: crmSyncStatusEnum("sync_status").notNull().default("pending"),
  conflictResolution: crmConflictResolutionEnum("conflict_resolution").notNull().default("remote_wins"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Sync Jobs (for tracking batch operations)
export const crmSyncJobs = pgTable("crm_sync_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  crmProviderId: uuid("crm_provider_id").notNull().references(() => crmProviders.id, { onDelete: "cascade" }),
  jobId: text("job_id").notNull(), // Redis/BullMQ job ID
  type: text("type").notNull(), // 'batch', 'webhook', 'manual'
  direction: crmSyncDirectionEnum("direction").notNull(),
  status: crmSyncStatusEnum("status").notNull().default("pending"),
  totalRecords: integer("total_records").notNull().default(0),
  processedRecords: integer("processed_records").notNull().default(0),
  failedRecords: integer("failed_records").notNull().default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Sync Logs (audit trail)
export const crmSyncLogs = pgTable("crm_sync_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  crmProviderId: uuid("crm_provider_id").notNull().references(() => crmProviders.id, { onDelete: "cascade" }),
  syncJobId: uuid("sync_job_id").references(() => crmSyncJobs.id, { onDelete: "set null" }),
  contactMappingId: uuid("contact_mapping_id").references(() => crmContactMappings.id, { onDelete: "set null" }),
  action: text("action").notNull(), // 'create', 'update', 'delete', 'skip'
  direction: text("direction").notNull(), // 'push', 'pull'
  result: text("result").notNull(), // 'success', 'failed', 'conflict'
  requestData: jsonb("request_data"),
  responseData: jsonb("response_data"),
  errorMessage: text("error_message"),
  durationMs: integer("duration_ms"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Webhook Events (incoming from CRM)
export const crmWebhookEvents = pgTable("crm_webhook_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  crmProviderId: uuid("crm_provider_id").notNull().references(() => crmProviders.id, { onDelete: "cascade" }),
  externalEventId: text("external_event_id").notNull(), // CRM's event ID
  eventType: text("event_type").notNull(), // 'contact.created', 'contact.updated', etc.
  payload: jsonb("payload").notNull(),
  signature: text("signature"), // For verification
  verified: boolean("verified").notNull().default(false),
  processed: boolean("processed").notNull().default(false),
  processingError: text("processing_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

// Relations
export const crmProvidersRelations = relations(crmProviders, ({ one, many }) => ({
  brand: one(brands, { fields: [crmProviders.brandId], references: [brands.id] }),
  contactMappings: many(crmContactMappings),
  syncJobs: many(crmSyncJobs),
  syncLogs: many(crmSyncLogs),
  webhookEvents: many(crmWebhookEvents),
}));

export const crmContactMappingsRelations = relations(crmContactMappings, ({ one }) => ({
  brand: one(brands, { fields: [crmContactMappings.brandId], references: [brands.id] }),
  crmProvider: one(crmProviders, { fields: [crmContactMappings.crmProviderId], references: [crmProviders.id] }),
}));

export const crmSyncJobsRelations = relations(crmSyncJobs, ({ one, many }) => ({
  brand: one(brands, { fields: [crmSyncJobs.brandId], references: [brands.id] }),
  crmProvider: one(crmProviders, { fields: [crmSyncJobs.crmProviderId], references: [crmProviders.id] }),
  logs: many(crmSyncLogs),
}));

export const crmSyncLogsRelations = relations(crmSyncLogs, ({ one }) => ({
  brand: one(brands, { fields: [crmSyncLogs.brandId], references: [brands.id] }),
  crmProvider: one(crmProviders, { fields: [crmSyncLogs.crmProviderId], references: [crmProviders.id] }),
  syncJob: one(crmSyncJobs, { fields: [crmSyncLogs.syncJobId], references: [crmSyncJobs.id] }),
  contactMapping: one(crmContactMappings, { fields: [crmSyncLogs.contactMappingId], references: [crmContactMappings.id] }),
}));

export const crmWebhookEventsRelations = relations(crmWebhookEvents, ({ one }) => ({
  brand: one(brands, { fields: [crmWebhookEvents.brandId], references: [brands.id] }),
  crmProvider: one(crmProviders, { fields: [crmWebhookEvents.crmProviderId], references: [crmProviders.id] }),
}));
```

### 3.2 Contacts Table (Future — referenced by mappings)

```typescript
// Note: This table will be created when Contact management feature is built
// Referenced here for completeness of the CRM integration design

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  email: text("email"),
  phone: text("phone"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  tags: text("tags").array(),
  customFields: jsonb("custom_fields").default({}),
  source: text("source").notNull().default("manual"), // manual, import, crm_sync, webhook
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
```

---

## 4. API Contracts

### 4.1 AgentSocial Internal API (Fastify Routes)

```typescript
// packages/api/src/routes/crm.ts

// GET /crm/providers — List configured CRM providers for a brand
// POST /crm/providers — Configure a new CRM provider (start OAuth flow)
// PUT /crm/providers/:id — Update provider config
// DELETE /crm/providers/:id — Disconnect CRM provider
// POST /crm/providers/:id/oauth/callback — OAuth callback handler
// POST /crm/providers/:id/sync — Trigger manual sync
// GET /crm/providers/:id/sync/status — Get sync status
// GET /crm/mappings — List contact mappings
// GET /crm/logs — View sync audit logs
```

### 4.2 CRM Connector API Contracts

#### GoHighLevel (GHL) API v2

| Operation | Endpoint | Method | Notes |
|-----------|----------|--------|-------|
| OAuth Auth URL | `https://marketplace.leadconnectorhq.com/oauth/authorize` | GET | Params: `client_id`, `redirect_uri`, `scope`, `state` |
| Exchange Code | `https://services.leadconnectorhq.com/oauth/token` | POST | Body: `client_id`, `client_secret`, `code`, `redirect_uri`, `grant_type=authorization_code` |
| Refresh Token | `https://services.leadconnectorhq.com/oauth/token` | POST | Body: `client_id`, `client_secret`, `refresh_token`, `grant_type=refresh_token` |
| Get Contact | `https://rest.gohighlevel.com/v2/contacts/{contactId}` | GET | Header: `Authorization: Bearer {token}`, `Version: 2021-07-28` |
| Create Contact | `https://rest.gohighlevel.com/v2/contacts` | POST | Body: contact object |
| Update Contact | `https://rest.gohighlevel.com/v2/contacts/{contactId}` | PUT | Body: contact object |
| Search Contacts | `https://rest.gohighlevel.com/v2/contacts` | GET | Query: `email`, `phone` |
| Webhook Config | Marketplace Dashboard | N/A | Configured in app settings, not API |

**GHL OAuth Scopes Required:**
```
locations.readonly
contacts.readonly
contacts.write
conversations.readonly
webhooks.readonly
webhooks.write
```

**GHL Rate Limits:**
- Standard: 100 requests/second per location
- Burst: 500 requests in 5 seconds
- Agency token: shared across all sub-accounts

#### Square API

| Operation | Endpoint | Method | Notes |
|-----------|----------|--------|-------|
| OAuth Auth URL | `https://connect.squareup.com/oauth2/authorize` | GET | Params: `client_id`, `redirect_uri`, `scope`, `state` |
| Exchange Code | `https://connect.squareup.com/v2/oauth2/token` | POST | Body: `client_id`, `client_secret`, `code`, `redirect_uri`, `grant_type=authorization_code` |
| Refresh Token | `https://connect.squareup.com/v2/oauth2/token` | POST | Body: `client_id`, `client_secret`, `refresh_token`, `grant_type=refresh_token` |
| Get Customer | `https://connect.squareup.com/v2/customers/{customerId}` | GET | Header: `Authorization: Bearer {token}`, `Square-Version: 2025-01-23` |
| Create Customer | `https://connect.squareup.com/v2/customers` | POST | Body: customer object |
| Update Customer | `https://connect.squareup.com/v2/customers/{customerId}` | PUT | Body: customer object |
| Search Customers | `https://connect.squareup.com/v2/customers/search` | POST | Body: query with `filter` |
| Create Webhook | `https://connect.squareup.com/v2/webhook-subscriptions` | POST | Body: `name`, `url`, `event_types` |
| Delete Webhook | `https://connect.squareup.com/v2/webhook-subscriptions/{id}` | DELETE | |

**Square OAuth Scopes Required:**
```
CUSTOMERS_READ
CUSTOMERS_WRITE
WEBHOOK_SUBSCRIPTIONS_READ
WEBHOOK_SUBSCRIPTIONS_WRITE
```

**Square Rate Limits:**
- Default: 1000 requests/minute per application
- Per-access-token: 500 requests/minute

### 4.3 Webhook Payload Examples

#### GoHighLevel Webhook Payload (Contact Created)

```json
{
  "type": "CONTACT_CREATED",
  "timestamp": "2026-09-14T21:00:00.000Z",
  "webhookId": "wh_abc123",
  "locationId": "HjiMUOsCCHCjtxzEf8PR",
  "companyId": "GNb7aIv4rQFVb9iwNl5K",
  "data": {
    "id": "ghl_contact_123",
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane.doe@example.com",
    "phone": "+1234567890",
    "tags": ["new-lead", "website"],
    "customFields": {
      "source": "website_form",
      "service_interest": "hair_color"
    },
    "createdAt": "2026-09-14T21:00:00.000Z",
    "updatedAt": "2026-09-14T21:00:00.000Z"
  }
}
```

#### Square Webhook Payload (Customer Created)

```json
{
  "merchant_id": "MERCHANT_ID",
  "location_id": "LOCATION_ID",
  "type": "customer.created",
  "event_id": "evt_square_123",
  "created_at": "2026-09-14T21:00:00.000Z",
  "data": {
    "type": "customer",
    "id": "sq_customer_123",
    "object": {
      "customer": {
        "id": "sq_customer_123",
        "given_name": "Jane",
        "family_name": "Doe",
        "email_address": "jane.doe@example.com",
        "phone_number": "+1234567890",
        "created_at": "2026-09-14T21:00:00.000Z",
        "updated_at": "2026-09-14T21:00:00.000Z"
      }
    }
  }
}
```

---

## 5. Security Considerations

### 5.1 OAuth 2.0 Implementation

#### Authorization Code Flow (Both GHL and Square)

```
┌──────────┐     ┌───────────┐     ┌──────────┐     ┌──────────┐
│  Agent   │ ──▶ │   GHL/    │ ──▶ │   User   │ ──▶ │  Agent   │
│  Social  │     │   Square  │     │  Browser │     │  Social  │
│          │     │   Auth    │     │          │     │  Server  │
└──────────┘     └───────────┘     └──────────┘     └──────────┘
     │                  │                  │                  │
     │ 1. Generate      │                  │                  │
     │    state + PKCE  │                  │                  │
     │    (optional)    │                  │                  │
     │─────────────────▶│                  │                  │
     │                  │                  │                  │
     │ 2. Redirect to   │                  │                  │
     │    auth URL      │                  │                  │
     │◀─────────────────│                  │                  │
     │                  │                  │                  │
     │ 3. Redirect user │                  │                  │
     │    to auth URL   │─────────────────▶│                  │
     │                  │                  │                  │
     │                  │ 4. User logs in  │                  │
     │                  │    and approves  │                  │
     │                  │─────────────────▶│                  │
     │                  │                  │                  │
     │ 5. Redirect with │                  │                  │
     │    code + state  │◀─────────────────│                  │
     │◀─────────────────│                  │                  │
     │                  │                  │                  │
     │ 6. Exchange code │                  │                  │
     │    for tokens    │─────────────────▶│                  │
     │                  │                  │                  │
     │ 7. Return access │                  │                  │
     │    + refresh     │◀─────────────────│                  │
     │    tokens        │                  │                  │
     │◀─────────────────│                  │                  │
```

#### Security Requirements

1. **State parameter**: Generate cryptographically random state, store in session/Redis, validate on callback
2. **PKCE** (recommended for Square mobile flows): Use existing `packages/api/src/connectors/pkce.ts`
3. **HTTPS only**: All OAuth endpoints must use HTTPS in production
4. **Token encryption**: Encrypt access/refresh tokens at rest using existing `encryptToken`/`decryptToken` from `token-store.ts`
5. **Token rotation**: Refresh tokens every 7 days (Square) / 24 hours (GHL) before expiry

### 5.2 Webhook Signature Verification

#### GoHighLevel (Ed25519 — preferred, or RSA fallback)

```typescript
// packages/api/src/services/crm/adapters/gohighlevel/webhooks.ts

import crypto from 'crypto';

const GHL_ED25519_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAi2HR1srL4o18O8BRa7gVJY7G7bupbN3H9AwJrHCDiOg=
-----END PUBLIC KEY-----`;

const GHL_RSA_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAokvo/r9tVgcfZ5DysOSC
Frm602qYV0MaAiNnX9O8KxMbiyRKWeL9JpCpVpt4XHIcBOK4u3cLSqJGOLaPuXw6
dO0t6Q/ZVdAV5Phz+ZtzPL16iCGeK9po6D6JHBpbi989mmzMryUnQJezlYJ3DVfB
csedpinheNnyYeFXolrJvcsjDtfAeRx5ByHQmTnSdFUzuAnC9/GepgLT9SM4nCpv
uxmZMxrJt5Rw+VUaQ9B8JSvbMPpez4peKaJPZHBbU3OdeCVx5klVXXZQGNHOs8gF
3kvoV5rTnXV0IknLBXlcKKAQLZcY/Q9rG6Ifi9c+5vqlvHPCUJFT5XUGG5RKgOKU
J062fRtN+rLYZUV+BjafxQauvC8wSWeYja63VSUruvmNj8xkx2zE/Juc+yjLjTXp
IocmaiFeAO6fUtNjDeFVkhf5LNb59vECyrHD2SQIrhgXpO4Q3dVNA5rw576PwTzN
h/AMfHKIjE4xQA1SZuYJmNnmVZLIZBlQAF9Ntd03rfadZ+yDiOXCCs9FkHibELhC
HULgCsnuDJHcrGNd5/Ddm5hxGQ0ASitgHeMZ0kcIOwKDOzOU53lDza6/Y09T7sYJ
PQe7z0cvj7aE4B+Ax1ZoZGPzpJlZtGXCsu9aTEGEnKzmsFqwcSsnw3JB31IGKAyk
T1hhTiaCeIY/OwwwNUY2yvcCAwEAAQ==
-----END PUBLIC KEY-----`;

export function verifyGhlWebhookSignature(payload: string, headers: Record<string, string>): boolean {
  const ghlSig = headers['x-ghl-signature'];
  const legacySig = headers['x-wh-signature'];

  // Prefer Ed25519 (current standard)
  if (ghlSig && ghlSig !== 'N/A') {
    try {
      const payloadBuffer = Buffer.from(payload, 'utf8');
      const signatureBuffer = Buffer.from(ghlSig, 'base64');
      return crypto.verify(null, payloadBuffer, GHL_ED25519_PUBLIC_KEY, signatureBuffer);
    } catch {
      return false;
    }
  }

  // Fallback to RSA (legacy, deprecated Sep 2026)
  if (legacySig && legacySig !== 'N/A') {
    try {
      const verifier = crypto.createVerify('SHA256');
      verifier.update(payload);
      return verifier.verify(GHL_RSA_PUBLIC_KEY, legacySig, 'base64');
    } catch {
      return false;
    }
  }

  return false;
}
```

#### Square (HMAC-SHA256)

```typescript
// packages/api/src/services/crm/adapters/square/webhooks.ts

import crypto from 'crypto';

export function verifySquareWebhookSignature(
  payload: string,
  signature: string,
  webhookSecret: string
): boolean {
  if (!signature || signature === 'N/A') return false;

  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}
```

### 5.3 Data Encryption

All sensitive data stored in the database MUST be encrypted:

| Field | Encryption Method | Key Source |
|-------|------------------|------------|
| `access_token_encrypted` | AES-256-GCM | `process.env.TOKEN_ENCRYPTION_KEY` |
| `refresh_token_encrypted` | AES-256-GCM | `process.env.TOKEN_ENCRYPTION_KEY` |
| `webhook_secret` | AES-256-GCM | `process.env.TOKEN_ENCRYPTION_KEY` |

Use existing `encryptToken`/`decryptToken` from `packages/api/src/connectors/token-store.ts`.

### 5.4 Environment Variables Required

```bash
# CRM Integration
COMPOSIO_API_KEY=ak_...  # Existing, for social media

# GHL OAuth
GHL_CLIENT_ID=
GHL_CLIENT_SECRET=
GHL_REDIRECT_URI=https://app.agentsocial.com/api/crm/providers/gohighlevel/oauth/callback

# Square OAuth
SQUARE_CLIENT_ID=
SQUARE_CLIENT_SECRET=
SQUARE_REDIRECT_URI=https://app.agentsocial.com/api/crm/providers/square/oauth/callback
SQUARE_ENVIRONMENT=production  # or sandbox

# Token Encryption (32-byte hex key)
TOKEN_ENCRYPTION_KEY=

# Webhook Base URL (public-facing)
WEBHOOK_BASE_URL=https://api.agentsocial.com/api/webhooks/crm
```

---

## 6. Scalability Considerations

### 6.1 Queue-Based Sync Architecture

```typescript
// packages/api/src/queues/crm-sync.worker.ts

import { Queue, Worker, Job } from 'bullmq';
import { redisConfig } from './redis.js';

// Queue definitions
export const crmSyncQueue = new Queue('crm-sync', {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs for debugging
    },
    removeOnFail: {
      count: 500, // Keep last 500 failed jobs for analysis
    },
  },
});

// Job types
export enum CrmSyncJobType {
  BATCH_SYNC = 'batch_sync',
  WEBHOOK_EVENT = 'webhook_event',
  MANUAL_SYNC = 'manual_sync',
  TOKEN_REFRESH = 'token_refresh',
}

export interface CrmSyncJobData {
  brandId: string;
  crmProviderId: string;
  jobType: CrmSyncJobType;
  contactIds?: string[];
  webhookEventId?: string;
  priority?: 'low' | 'normal' | 'high';
}

// Worker implementation
const worker = new Worker<CrmSyncJobData, any>(
  'crm-sync',
  async (job) => {
    const { brandId, crmProviderId, jobType, contactIds, webhookEventId } = job.data;

    console.log(`[crm-sync] Processing job ${job.id}: ${jobType} for brand ${brandId}`);

    switch (jobType) {
      case CrmSyncJobType.BATCH_SYNC:
        return await processBatchSync(brandId, crmProviderId, contactIds);
      case CrmSyncJobType.WEBHOOK_EVENT:
        return await processWebhookEvent(webhookEventId!);
      case CrmSyncJobType.MANUAL_SYNC:
        return await processManualSync(brandId, crmProviderId);
      case CrmSyncJobType.TOKEN_REFRESH:
        return await processTokenRefresh(crmProviderId);
      default:
        throw new Error(`Unknown job type: ${jobType}`);
    }
  },
  {
    connection: redisConfig,
    concurrency: 5, // Process 5 jobs concurrently
  }
);

worker.on('completed', (job) => {
  console.log(`[crm-sync] Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`[crm-sync] Job ${job?.id} failed:`, err);
  // Alert on repeated failures
  if (job?.attemptsMade >= 3) {
    // Send alert to monitoring system
  }
});
```

### 6.2 Rate Limiting Strategy

#### GoHighLevel Rate Limits

```typescript
// packages/api/src/services/crm/adapters/gohighlevel/api-client.ts

import Bottleneck from 'bottleneck';

// GHL limits: 100 req/sec per location, 500 burst in 5 sec
const ghlLimiter = new Bottleneck({
  minTime: 10, // 10ms between requests (100/sec)
  maxConcurrent: 10,
  reservoir: 500, // Burst capacity
  reservoirRefreshInterval: 5000, // Refill every 5 seconds
  reservoirRefreshAmount: 500,
});

export class GHLApiClient {
  private accessToken: string;
  private locationId: string;

  constructor(accessToken: string, locationId: string) {
    this.accessToken = accessToken;
    this.locationId = locationId;
  }

  private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    return ghlLimiter.schedule(async () => {
      const response = await fetch(`https://rest.gohighlevel.com/v2${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${this.accessToken}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          throw new RateLimitError(`Rate limited. Retry after ${retryAfter}s`, retryAfter);
        }
        throw new ApiError(`GHL API error: ${response.statusText}`, response.status);
      }

      return response.json();
    });
  }
}
```

#### Square Rate Limits

```typescript
// packages/api/src/services/crm/adapters/square/api-client.ts

import Bottleneck from 'bottleneck';

// Square limits: 1000 req/min per app, 500 req/min per token
const squareAppLimiter = new Bottleneck({
  minTime: 60, // 60ms between requests (~1000/min)
  maxConcurrent: 5,
});

const squareTokenLimiter = new Bottleneck({
  minTime: 120, // 120ms between requests (500/min)
  maxConcurrent: 3,
});

export class SquareApiClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    // Apply both app-level and token-level rate limiting
    return squareAppLimiter.schedule(async () => {
      return squareTokenLimiter.schedule(async () => {
        const response = await fetch(`https://connect.squareup.com/v2${endpoint}`, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${this.accessToken}`,
            'Square-Version': '2025-01-23',
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After') || '60';
            throw new RateLimitError(`Square rate limited. Retry after ${retryAfter}s`, retryAfter);
          }
          throw new ApiError(`Square API error: ${response.statusText}`, response.status);
        }

        return response.json();
      });
    });
  }
}
```

### 6.3 Batch Sync Scheduling

```typescript
// packages/api/src/services/crm/sync/scheduler.ts

import cron from 'node-cron';
import { crmSyncQueue, CrmSyncJobType } from '../../queues/crm-sync.worker.js';
import { db, crmProviders } from '../../db/index.js';
import { eq, and } from 'drizzle-orm';

// Hourly batch sync for all active CRM integrations
export const hourlyBatchSync = cron.schedule('0 * * * *', async () => {
  console.log('[crm-sync] Starting hourly batch sync');

  const activeProviders = await db.select({
    id: crmProviders.id,
    brandId: crmProviders.brandId,
    provider: crmProviders.provider,
  }).from(crmProviders)
    .where(and(
      eq(crmProviders.syncEnabled, true),
      eq(crmProviders.webhookEnabled, true)
    ));

  for (const provider of activeProviders) {
    await crmSyncQueue.add('batch-sync', {
      brandId: provider.brandId,
      crmProviderId: provider.id,
      jobType: CrmSyncJobType.BATCH_SYNC,
      priority: 'low',
    }, {
      jobId: `batch-${provider.id}-${Date.now()}`,
    });
  }
});

// Daily token refresh check (run at 3 AM)
export const dailyTokenRefresh = cron.schedule('0 3 * * *', async () => {
  console.log('[crm-sync] Checking tokens for refresh');

  const expiringTokens = await db.select({
    id: crmProviders.id,
    provider: crmProviders.provider,
    tokenExpiresAt: crmProviders.tokenExpiresAt,
  }).from(crmProviders)
    .where(eq(crmProviders.syncEnabled, true));

  for (const provider of expiringTokens) {
    if (!provider.tokenExpiresAt) continue;

    const hoursUntilExpiry = (provider.tokenExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60);

    // Refresh if expires within 24 hours
    if (hoursUntilExpiry < 24) {
      await crmSyncQueue.add('token-refresh', {
        brandId: provider.brandId!,
        crmProviderId: provider.id,
        jobType: CrmSyncJobType.TOKEN_REFRESH,
        priority: 'high',
      });
    }
  }
});
```

### 6.4 Deduplication Strategy

```typescript
// packages/api/src/services/crm/sync/conflict-resolver.ts

import { db, crmContactMappings } from '../../db/index.js';
import { eq, and, or } from 'drizzle-orm';

export interface DedupKey {
  email?: string;
  phone?: string;
}

export async function findExistingContact(
  brandId: string,
  crmProviderId: string,
  dedupKey: DedupKey
): Promise<string | null> {
  const conditions = [
    eq(crmContactMappings.brandId, brandId),
    eq(crmContactMappings.crmProviderId, crmProviderId),
  ];

  if (dedupKey.email) {
    conditions.push(eq(crmContactMappings.matchEmail, dedupKey.email.toLowerCase()));
  }

  if (dedupKey.phone) {
    // Normalize phone: remove non-digits, drop leading 1 for US numbers
    const normalizedPhone = normalizePhoneNumber(dedupKey.phone);
    conditions.push(eq(crmContactMappings.matchPhone, normalizedPhone));
  }

  const mapping = await db.select({
    crmContactId: crmContactMappings.crmContactId,
  }).from(crmContactMappings)
    .where(and(...conditions))
    .limit(1);

  return mapping[0]?.crmContactId ?? null;
}

export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');

  // Handle US numbers: remove leading 1 if 11 digits
  if (digits.length === 11 && digits.startsWith('1')) {
    digits = digits.slice(1);
  }

  // Must be 10 digits for US numbers
  if (digits.length !== 10) {
    return phone; // Return original if can't normalize
  }

  return digits;
}

export enum ConflictResolution {
  LOCAL_WINS = 'local_wins',      // AgentSocial data takes precedence
  REMOTE_WINS = 'remote_wins',    // CRM data takes precedence
  MERGE = 'merge',                // Merge fields intelligently
  MANUAL = 'manual',              // Flag for human review
}

export function resolveConflict(
  localData: any,
  remoteData: any,
  resolution: ConflictResolution
): { resolved: any; merged: boolean } {
  switch (resolution) {
    case ConflictResolution.LOCAL_WINS:
      return { resolved: localData, merged: false };

    case ConflictResolution.REMOTE_WINS:
      return { resolved: remoteData, merged: false };

    case ConflictResolution.MERGE:
      // Merge strategy: prefer non-null values, local wins on conflict
      const merged = { ...remoteData };
      for (const key of Object.keys(localData)) {
        if (localData[key] !== null && localData[key] !== undefined) {
          merged[key] = localData[key];
        }
      }
      return { resolved: merged, merged: true };

    case ConflictResolution.MANUAL:
      // Log for manual review, don't auto-resolve
      throw new ManualReviewRequiredError(localData, remoteData);
  }
}
```

---

## 7. Implementation Roadmap

### Phase 1A: Foundation (Week 1-2)
- [ ] Add database tables to schema
- [ ] Create migration scripts
- [ ] Implement base connector interface
- [ ] Set up Redis queue infrastructure
- [ ] Create webhook receiver routes

### Phase 1B: GoHighLevel Integration (Week 2-3)
- [ ] Implement GHL OAuth flow
- [ ] Build GHL API client with rate limiting
- [ ] Create GHL contact transformers
- [ ] Implement GHL webhook verification
- [ ] Build GHL sync worker jobs
- [ ] Test with GHL sandbox account

### Phase 1C: Square Integration (Week 3-4)
- [ ] Implement Square OAuth flow (extend existing billing integration)
- [ ] Build Square customer API client
- [ ] Create Square customer transformers
- [ ] Implement Square webhook verification
- [ ] Build Square sync worker jobs
- [ ] Test with Square sandbox

### Phase 1D: Testing & Hardening (Week 4-5)
- [ ] Write unit tests for all connectors
- [ ] Write integration tests with sandbox environments
- [ ] Load test queue processing
- [ ] Security audit (OAuth, encryption, webhooks)
- [ ] Documentation (API docs, runbook for ops)

### Phase 2: Extended Features (Future)
- [ ] Bidirectional sync for appointments/bookings
- [ ] Custom field mapping UI
- [ ] Sync conflict resolution UI
- [ ] Additional CRM connectors (Mindbody, Vagaro, Booksy)
- [ ] Real-time sync dashboard

---

## 8. Monitoring & Observability

### 8.1 Metrics to Track

| Metric | Type | Alert Threshold |
|--------|------|-----------------|
| `crm_sync_jobs_total` | Counter | — |
| `crm_sync_jobs_failed` | Counter | > 5 per hour |
| `crm_sync_duration_seconds` | Histogram | p95 > 30s |
| `crm_webhook_events_received` | Counter | — |
| `crm_webhook_events_failed_verification` | Counter | > 1% of received |
| `crm_api_rate_limit_hits` | Counter | > 10 per hour |
| `crm_token_refresh_failures` | Counter | Any failure |
| `crm_queue_depth` | Gauge | > 1000 jobs |

### 8.2 Logging Standards

```typescript
// Structured logging format
logger.info('crm_sync_started', {
  brandId: '...',
  crmProviderId: '...',
  jobType: 'batch_sync',
  contactCount: 150,
});

logger.error('crm_sync_failed', {
  brandId: '...',
  crmProviderId: '...',
  error: 'Rate limit exceeded',
  retryAfter: 60,
  attempt: 2,
});
```

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **SoT** | Source of Truth — the authoritative system for a specific data domain |
| **GHL** | GoHighLevel — CRM and marketing automation platform |
| **OAuth 2.0** | Authorization framework for delegated API access |
| **Webhook** | HTTP callback for real-time event notifications |
| **Idempotent** | Operation that produces the same result regardless of how many times it's executed |

---

## Appendix B: References

- GoHighLevel API Docs: https://marketplace.gohighlevel.com/docs/
- Square API Docs: https://developer.squareup.com/docs
- OAuth 2.0 RFC: https://datatracker.ietf.org/doc/html/rfc6749
- BullMQ Docs: https://docs.bullmq.io/
- AgentSocial Existing Patterns: `packages/api/src/connectors/`, `packages/api/src/services/composio.ts`

---

**Document History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2026-09-14 | AgentSocial-CEO | Initial draft |
