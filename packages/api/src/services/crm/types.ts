/**
 * CRM Connector Types
 *
 * Unified contract for all CRM adapters. Phase 1A defines the base
 * interfaces and enums. Phase 1B/1C will add GoHighLevel and Square
 * implementations. Future Phase 2 connectors (Mindbody, Vagaro, Booksy)
 * should import and implement these contracts.
 */

export enum CRMPlatform {
  GOHIGHLEVEL = "gohighlevel",
  SQUARE = "square",
}

export type SyncDirection = "bidirectional" | "push_only" | "pull_only";
export type SyncStatus = "pending" | "syncing" | "completed" | "failed" | "paused";
export type ConflictResolution = "local_wins" | "remote_wins" | "merge" | "manual";

/**
 * Normalized contact representation used across all CRM connectors.
 * Connector adapters translate platform-specific payloads to/from this shape.
 */
export interface CRMContact {
  id: string; // Platform-native ID
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  sourceOfTruth: "agentsocial" | "crm";
}

/**
 * Result returned by a single contact sync operation.
 */
export interface CRMSyncResult {
  success: boolean;
  contactId?: string;
  action: "created" | "updated" | "deleted" | "skipped";
  conflict?: {
    field: string;
    localValue: unknown;
    remoteValue: unknown;
    resolution: "local_wins" | "remote_wins" | "merged";
  };
  error?: string;
}

/**
 * Platform metadata returned by a connector.
 */
export interface CRMPlatformInfo {
  name: string;
  version: string;
  rateLimit: {
    limit: number; // requests per window
    windowMs: number; // window duration in milliseconds
  };
}

/**
 * Full connector contract. All adapters must implement this interface.
 * Phase 2 may split bulk operations into a separate interface.
 */
export interface CRMConnector {
  // Authentication
  getAuthUrl(state: string): Promise<string>;
  exchangeCode(code: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }>;
  refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }>;
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
  getPlatformInfo(): Promise<CRMPlatformInfo>;
}

/**
 * Minimal set of OAuth settings needed to configure a connector.
 * Adapters extend this interface with platform-specific fields.
 */
export interface CRMConnectorConfig {
  brandId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  externalAccountId?: string;
  externalCompanyId?: string;
}

/**
 * Errors thrown by connectors are normalized to this shape.
 */
export class CRMConnectorError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = "CRMConnectorError";
  }
}

export class RateLimitError extends CRMConnectorError {
  constructor(message: string, public readonly retryAfterSeconds?: number) {
    super(message, "rate_limit", 429, true);
    this.name = "RateLimitError";
  }
}

export class ManualReviewRequiredError extends CRMConnectorError {
  constructor(
    public readonly localData: unknown,
    public readonly remoteData: unknown,
  ) {
    super("Conflict requires manual review", "manual_review_required", 409, false);
    this.name = "ManualReviewRequiredError";
  }
}
