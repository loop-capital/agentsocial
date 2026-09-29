/**
 * Base CRM Connector
 *
 * Abstract base class implementing shared logic for all CRM adapters:
 * token encryption, common validation, conflict resolution, and deduplication
 * helpers. Platform-specific adapters extend this class.
 */

import { encryptToken, decryptToken } from "../../connectors/token-store.js";
import type { CRMConnector, CRMContact, CRMSyncResult, CRMConnectorConfig, ConflictResolution } from "./types.js";
import {
  CRMConnectorError,
  RateLimitError,
  ManualReviewRequiredError,
} from "./types.js";

export interface StoredTokens {
  accessTokenEncrypted?: string;
  refreshTokenEncrypted?: string;
  tokenExpiresAt?: Date | null;
}

/**
 * Shared validation helpers used by all connectors.
 */
export function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }
  return digits.length === 10 ? digits : phone;
}

export function normalizeEmail(email?: string): string | undefined {
  return email?.trim().toLowerCase();
}

/**
 * Apply a conflict resolution strategy to local and remote contact data.
 * Phase 2 can override this in adapters for platform-specific merge rules.
 */
export function resolveConflict(
  localData: Partial<CRMContact>,
  remoteData: Partial<CRMContact>,
  resolution: ConflictResolution,
): { resolved: Partial<CRMContact>; merged: boolean } {
  switch (resolution) {
    case "local_wins":
      return { resolved: { ...remoteData, ...localData }, merged: false };

    case "remote_wins":
      return { resolved: { ...localData, ...remoteData }, merged: false };

    case "merge": {
      const merged: Partial<CRMContact> = { ...remoteData };
      for (const key of Object.keys(localData) as Array<keyof CRMContact>) {
        const value = localData[key];
        if (value !== null && value !== undefined) {
          merged[key] = value as any;
        }
      }
      return { resolved: merged, merged: true };
    }

    case "manual":
      throw new ManualReviewRequiredError(localData, remoteData);

    default:
      throw new CRMConnectorError("Unknown conflict resolution strategy", "invalid_conflict_strategy");
  }
}

export abstract class BaseCRMConnector implements CRMConnector {
  protected config: CRMConnectorConfig;

  constructor(config: CRMConnectorConfig) {
    this.config = config;
  }

  // ─── Authentication helpers (shared) ───────────────────────────────────────

  protected encryptAccessToken(token: string): string {
    return encryptToken(token);
  }

  protected decryptAccessToken(encrypted: string): string {
    return decryptToken(encrypted);
  }

  protected encryptRefreshToken(token: string): string {
    return encryptToken(token);
  }

  protected decryptRefreshToken(encrypted: string): string {
    return decryptToken(encrypted);
  }

  /**
   * Encrypt both tokens into a storable shape. Adapters call this after
   * exchanging or refreshing OAuth tokens.
   */
  protected storeTokens(tokens: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
  }): StoredTokens {
    return {
      accessTokenEncrypted: this.encryptAccessToken(tokens.accessToken),
      refreshTokenEncrypted: tokens.refreshToken
        ? this.encryptRefreshToken(tokens.refreshToken)
        : undefined,
      tokenExpiresAt: tokens.expiresAt ?? null,
    };
  }

  // ─── Abstract contract (must be implemented per platform) ─────────────────

  abstract getAuthUrl(state: string): Promise<string>;
  abstract exchangeCode(code: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
  }>;
  abstract refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
  }>;
  abstract revokeAccess(accessToken: string): Promise<void>;

  abstract getContact(id: string): Promise<CRMContact | null>;
  abstract createContact(contact: Partial<CRMContact>): Promise<CRMSyncResult>;
  abstract updateContact(id: string, contact: Partial<CRMContact>): Promise<CRMSyncResult>;
  abstract deleteContact(id: string): Promise<CRMSyncResult>;
  abstract searchContacts(query: { email?: string; phone?: string }): Promise<CRMContact[]>;

  abstract bulkSyncContacts(contacts: Partial<CRMContact>[]): Promise<CRMSyncResult[]>;

  abstract getWebhookEvents(): Promise<string[]>;
  abstract registerWebhook(url: string, events: string[]): Promise<{ webhookId: string; secret: string }>;
  abstract unregisterWebhook(webhookId: string): Promise<void>;
  abstract verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;

  abstract getPlatformInfo(): Promise<{
    name: string;
    version: string;
    rateLimit: { limit: number; windowMs: number };
  }>;
}

export { CRMConnectorError, RateLimitError, ManualReviewRequiredError };
