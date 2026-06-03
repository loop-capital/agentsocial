import { db, brands } from "../db/index.js";
import { eq } from "drizzle-orm";
import type { TierId, ServiceTier, Subscription, TierChangeResponse, CancelSubscriptionResponse, BillingHistoryItem } from "@agentsocial/shared";

// ─── Tier Definitions ─────────────────────────────────────────────────────────

const TIERS: Record<TierId, ServiceTier> = {
  core: {
    id: "core",
    name: "Core",
    price: 4900, // $49/mo
    currency: "USD",
    interval: "MONTHLY",
    features: [
      "1 brand",
      "5 social accounts",
      "30 posts/month",
      "1 GBP location",
      "Basic analytics",
      "Email support",
    ],
    limits: {
      postsPerMonth: 30,
      socialAccounts: 5,
      gbpLocations: 1,
      brands: 1,
      competitors: 0,
      apiAccess: false,
      prioritySupport: false,
      whiteLabelReports: false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 19900, // $199/mo
    currency: "USD",
    interval: "MONTHLY",
    features: [
      "5 brands",
      "25 social accounts",
      "Unlimited posts",
      "10 GBP locations",
      "5 competitor monitors",
      "Advanced analytics",
      "AI content suggestions",
      "Priority support",
    ],
    limits: {
      postsPerMonth: Infinity,
      socialAccounts: 25,
      gbpLocations: 10,
      brands: 5,
      competitors: 5,
      apiAccess: false,
      prioritySupport: true,
      whiteLabelReports: false,
    },
    popular: true,
  },
  elite: {
    id: "elite",
    name: "Elite",
    price: 49900, // $499/mo
    currency: "USD",
    interval: "MONTHLY",
    features: [
      "Unlimited brands",
      "Unlimited social accounts",
      "Unlimited posts",
      "Unlimited GBP locations",
      "Unlimited competitor monitors",
      "Full analytics & reporting",
      "AI content & review automation",
      "API access",
      "White-label reports",
      "Dedicated account manager",
    ],
    limits: {
      postsPerMonth: Infinity,
      socialAccounts: Infinity,
      gbpLocations: Infinity,
      brands: Infinity,
      competitors: Infinity,
      apiAccess: true,
      prioritySupport: true,
      whiteLabelReports: true,
    },
  },
};

const TIER_ORDER: TierId[] = ["core", "pro", "elite"];

function tierRank(id: TierId): number {
  return TIER_ORDER.indexOf(id);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getTiers(): ServiceTier[] {
  return TIER_ORDER.map((id) => TIERS[id]);
}

export function getTier(id: TierId): ServiceTier {
  return TIERS[id];
}

export async function getSubscription(brandId: string): Promise<Subscription | null> {
  const [brand] = await db
    .select({
      id: brands.id,
      subscriptionPlan: brands.subscriptionPlan,
      subscriptionStatus: brands.subscriptionStatus,
      squareSubscriptionId: brands.squareSubscriptionId,
      squareCustomerId: brands.squareCustomerId,
      trialEndsAt: brands.trialEndsAt,
    })
    .from(brands)
    .where(eq(brands.id, brandId))
    .limit(1);

  if (!brand) return null;

  // Map legacy plan names to tier IDs
  const tierId = mapLegacyPlan(brand.subscriptionPlan || "free");

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  return {
    id: brand.squareSubscriptionId || brand.id,
    brandId: brand.id,
    tierId,
    status: (brand.subscriptionStatus || "inactive") as Subscription["status"],
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: periodEnd.toISOString(),
    cancelAtPeriodEnd: false,
    trialEndsAt: brand.trialEndsAt ? new Date(brand.trialEndsAt).toISOString() : null,
    squareSubscriptionId: brand.squareSubscriptionId,
    squareCustomerId: brand.squareCustomerId,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export async function upgradeTier(brandId: string, targetTierId: TierId): Promise<TierChangeResponse> {
  const subscription = await getSubscription(brandId);
  if (!subscription) throw new Error("No subscription found for brand");

  const currentRank = tierRank(subscription.tierId);
  const targetRank = tierRank(targetTierId);

  if (targetRank <= currentRank) {
    throw new Error(`Cannot upgrade to ${targetTierId}: current tier is ${subscription.tierId}`);
  }

  const currentTier = TIERS[subscription.tierId];
  const targetTier = TIERS[targetTierId];

  // Calculate proration
  const now = new Date();
  const remainingDays = 30; // simplified
  const prorationCharge = Math.round((targetTier.price - currentTier.price) * (remainingDays / 30));
  const prorationCredit = 0;

  // Update brand plan
  await db
    .update(brands)
    .set({
      subscriptionPlan: targetTierId,
      subscriptionStatus: "active",
    })
    .where(eq(brands.id, brandId));

  const updated = await getSubscription(brandId);

  return {
    subscription: updated!,
    prorationCredit,
    prorationCharge,
    effectiveDate: now.toISOString(),
  };
}

export async function downgradeTier(brandId: string, targetTierId: TierId): Promise<TierChangeResponse> {
  const subscription = await getSubscription(brandId);
  if (!subscription) throw new Error("No subscription found for brand");

  const currentRank = tierRank(subscription.tierId);
  const targetRank = tierRank(targetTierId);

  if (targetRank >= currentRank) {
    throw new Error(`Cannot downgrade to ${targetTierId}: current tier is ${subscription.tierId}`);
  }

  const currentTier = TIERS[subscription.tierId];
  const targetTier = TIERS[targetTierId];

  const now = new Date();
  const prorationCredit = Math.round((currentTier.price - targetTier.price) * 0.5); // 50% credit for remaining period

  // Update brand plan — downgrades take effect at end of billing period
  await db
    .update(brands)
    .set({
      subscriptionPlan: targetTierId,
      subscriptionStatus: "active",
    })
    .where(eq(brands.id, brandId));

  const updated = await getSubscription(brandId);

  return {
    subscription: updated!,
    prorationCredit,
    prorationCharge: 0,
    effectiveDate: now.toISOString(),
  };
}

export async function cancelSubscription(brandId: string, _reason?: string): Promise<CancelSubscriptionResponse> {
  const subscription = await getSubscription(brandId);
  if (!subscription) throw new Error("No subscription found for brand");

  // Set cancel_at_period_end
  await db
    .update(brands)
    .set({
      subscriptionStatus: "canceled",
      subscriptionPlan: "free",
    })
    .where(eq(brands.id, brandId));

  const now = new Date();
  const accessUntil = new Date(now);
  accessUntil.setMonth(accessUntil.getMonth() + 1);

  return {
    subscription: {
      ...subscription,
      status: "canceled",
      cancelAtPeriodEnd: true,
    },
    accessUntil: accessUntil.toISOString(),
  };
}

export function getBillingHistory(_brandId: string): BillingHistoryItem[] {
  // Stub — in production this would query Square / Stripe invoices
  return [];
}

export function getTierLimits(tierId: TierId) {
  return TIERS[tierId]?.limits || TIERS.core.limits;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapLegacyPlan(plan: string): TierId {
  if (plan === "pro") return "pro";
  if (plan === "agency") return "elite";
  if (plan === "core") return "core";
  if (plan === "elite") return "elite";
  return "core"; // default to core (paid) if somehow unset but not "free"
}