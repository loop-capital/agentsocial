// ─── ClientVet Risk Calculator ───────────────────────────────────────────────
// Calculates client risk level based on behavioral flags and determines
// deposit requirements for each risk tier.

import { db } from "../db/index.js";
import { clientRiskFlags, depositRequirements, clientFlagEvents } from "../db/schema.js";
import { eq, and, gte, desc } from "drizzle-orm";
import { riskLevelEnum } from "../db/schema.js";

export type RiskLevel = typeof riskLevelEnum.enumValues[number];

export interface RiskAssessment {
  riskLevel: RiskLevel;
  depositRequired: boolean;
  depositPercent: number;
  requirePrepayment: boolean;
  allowBooking: boolean;
  creditOnly: boolean;
  noProductSales: boolean;
  flags: FlagSummary[];
}

export interface FlagSummary {
  type: string;
  count: number;
  lastOccurrence: Date | null;
}

// ─── Risk Thresholds (from spec) ──────────────────────────────────────────────
//
// no_show:        1 in 90 days → medium, 2+ in 180 days → high
// negative_review: 1 in 30 days → medium, 2+ in 90 days → high
// chargeback:     any → high
// refund_abuse:   2+ in 90 days → medium
// product_return: any → high
// review_extortion: any → high
// free_service:   2+ → fraud

const THRESHOLDS = {
  no_show: {
    medium: { count: 1, days: 90 },
    high: { count: 2, days: 180 },
  },
  negative_review: {
    medium: { count: 1, days: 30 },
    high: { count: 2, days: 90 },
  },
  chargeback: {
    high: { count: 1, days: 365 }, // any within a year
  },
  refund_abuse: {
    medium: { count: 2, days: 90 },
  },
  product_return_fraud: {
    high: { count: 1, days: 365 }, // any within a year
  },
  review_extortion: {
    high: { count: 1, days: 365 }, // any within a year
  },
  free_service_extraction: {
    fraud: { count: 2, days: 365 }, // 2+ is fraud territory
  },
} as const;

// ─── Default Deposit Policy ───────────────────────────────────────────────────

export const DEFAULT_DEPOSIT_POLICY: Record<RiskLevel, {
  depositPercent: number;
  requirePrepayment: boolean;
  allowBooking: boolean;
  creditOnly: boolean;
  noProductSales: boolean;
}> = {
  low: {
    depositPercent: 0,
    requirePrepayment: false,
    allowBooking: true,
    creditOnly: false,
    noProductSales: false,
  },
  medium: {
    depositPercent: 50,
    requirePrepayment: false,
    allowBooking: true,
    creditOnly: false,
    noProductSales: false,
  },
  high: {
    depositPercent: 100,
    requirePrepayment: true,
    allowBooking: true,
    creditOnly: false,
    noProductSales: false,
  },
  fraud: {
    depositPercent: 100,
    requirePrepayment: true,
    allowBooking: false,
    creditOnly: true,
    noProductSales: true,
  },
};

// ─── Calculate Risk Level ─────────────────────────────────────────────────────

export function calculateRiskLevel(flag: typeof clientRiskFlags.$inferSelect): RiskLevel {
  // Check each flag type against thresholds, from worst to best
  // Fraud-level flags first
  if (flag.freeServiceExtractionCount >= THRESHOLDS.free_service_extraction.fraud.count) {
    return "fraud";
  }

  // High-level flags
  if (
    flag.noShowCount >= THRESHOLDS.no_show.high.count ||
    flag.negativeReviewCount >= THRESHOLDS.negative_review.high.count ||
    flag.chargebackCount >= THRESHOLDS.chargeback.high.count ||
    flag.productReturnFraudCount >= THRESHOLDS.product_return_fraud.high.count ||
    flag.reviewExtortionCount >= THRESHOLDS.review_extortion.high.count
  ) {
    return "high";
  }

  // Medium-level flags
  if (
    flag.noShowCount >= THRESHOLDS.no_show.medium.count ||
    flag.negativeReviewCount >= THRESHOLDS.negative_review.medium.count ||
    flag.refundCount >= THRESHOLDS.refund_abuse.medium.count
  ) {
    return "medium";
  }

  return "low";
}

// ─── Get Deposit Requirement ───────────────────────────────────────────────────

export async function getDepositRequirement(
  riskLevel: RiskLevel,
  brandId: string,
): Promise<typeof DEFAULT_DEPOSIT_POLICY[RiskLevel]> {
  // Check for brand-specific deposit policy override
  const [customPolicy] = await db
    .select()
    .from(depositRequirements)
    .where(
      and(
        eq(depositRequirements.brandId, brandId),
        eq(depositRequirements.riskLevel, riskLevel),
      ),
    )
    .limit(1);

  if (customPolicy) {
    return {
      depositPercent: customPolicy.depositPercent,
      requirePrepayment: customPolicy.requirePrepayment,
      allowBooking: customPolicy.allowBooking,
      creditOnly: customPolicy.creditOnly,
      noProductSales: customPolicy.noProductSales,
    };
  }

  return DEFAULT_DEPOSIT_POLICY[riskLevel];
}

// ─── Full Risk Assessment ──────────────────────────────────────────────────────

export async function assessClientRisk(
  clientFlag: typeof clientRiskFlags.$inferSelect,
  brandId: string,
): Promise<RiskAssessment> {
  const riskLevel = calculateRiskLevel(clientFlag);
  const deposit = await getDepositRequirement(riskLevel, brandId);

  // Get recent flag events for this client
  const recentEvents = await db
    .select()
    .from(clientFlagEvents)
    .where(eq(clientFlagEvents.clientFlagId, clientFlag.id))
    .orderBy(desc(clientFlagEvents.createdAt))
    .limit(20);

  // Summarize flags
  const flagSummary: FlagSummary[] = [];
  const flagTypes = [
    "no_show", "late_cancel", "negative_review", "review_extortion",
    "chargeback", "refund_abuse", "product_return_fraud",
    "free_service_extraction", "other",
  ] as const;

  for (const type of flagTypes) {
    const events = recentEvents.filter((e) => e.flagType === type);
    if (events.length > 0) {
      flagSummary.push({
        type,
        count: events.length,
        lastOccurrence: events[0].createdAt ?? null,
      });
    }
  }

  return {
    riskLevel,
    depositRequired: deposit.depositPercent > 0,
    depositPercent: deposit.depositPercent,
    requirePrepayment: deposit.requirePrepayment,
    allowBooking: deposit.allowBooking,
    creditOnly: deposit.creditOnly,
    noProductSales: deposit.noProductSales,
    flags: flagSummary,
  };
}

// ─── Recalculate Risk After Flag Update ────────────────────────────────────────

export async function recalculateRisk(clientFlagId: string): Promise<RiskLevel> {
  const [flag] = await db
    .select()
    .from(clientRiskFlags)
    .where(eq(clientRiskFlags.id, clientFlagId))
    .limit(1);

  if (!flag) throw new Error(`Client flag ${clientFlagId} not found`);

  const newLevel = calculateRiskLevel(flag);

  await db
    .update(clientRiskFlags)
    .set({
      riskLevel: newLevel,
      lastFlagAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(clientRiskFlags.id, clientFlagId));

  return newLevel;
}