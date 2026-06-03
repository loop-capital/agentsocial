// ─── Service Tier Billing Types ──────────────────────────────────────────────

export type TierId = "core" | "pro" | "elite";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "inactive";

export interface TierLimit {
  postsPerMonth: number;
  socialAccounts: number;
  gbpLocations: number;
  brands: number;
  competitors: number;
  apiAccess: boolean;
  prioritySupport: boolean;
  whiteLabelReports: boolean;
}

export interface ServiceTier {
  id: TierId;
  name: string;
  price: number;       // in cents
  currency: string;
  interval: "MONTHLY" | "YEARLY";
  features: string[];
  limits: TierLimit;
  popular?: boolean;   // highlight recommended tier
}

export interface Subscription {
  id: string;
  brandId: string;
  tierId: TierId;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  squareSubscriptionId: string | null;
  squareCustomerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TierUpgradeRequest {
  brandId: string;
  targetTierId: TierId;
}

export interface TierDowngradeRequest {
  brandId: string;
  targetTierId: TierId;
}

export interface TierChangeResponse {
  subscription: Subscription;
  prorationCredit?: number;   // in cents, credit from remaining period
  prorationCharge?: number;    // in cents, additional charge for new tier
  effectiveDate: string;
}

export interface CancelSubscriptionRequest {
  brandId: string;
  reason?: string;
}

export interface CancelSubscriptionResponse {
  subscription: Subscription;
  accessUntil: string; // date when access expires
}

export interface BillingHistoryItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed" | "refunded";
  invoiceUrl?: string;
}

export interface BillingHistoryResponse {
  items: BillingHistoryItem[];
  pagination: {
    total: number;
    hasMore: boolean;
  };
}