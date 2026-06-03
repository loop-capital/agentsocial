import { SquareClient, SquareEnvironment } from "square";
import { db, brands, subscriptionStatusEnum } from "../db/index.js";
import { eq } from "drizzle-orm";

// ─── Square Client ────────────────────────────────────────────────────────────

const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN || "",
  environment: process.env.SQUARE_ENVIRONMENT === "production"
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox,
});

const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID || "";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

// ─── Plan Definitions ─────────────────────────────────────────────────────────

export interface PlanDefinition {
  id: string;          // Square plan variation catalog ID
  name: string;
  price: number;       // in cents
  currency: string;
  interval: "MONTHLY" | "YEARLY";
  features: string[];
  limits: Record<string, number>;
}

export const PLANS: Record<string, PlanDefinition> = {
  free: {
    id: "",
    name: "Free",
    price: 0,
    currency: "USD",
    interval: "MONTHLY",
    features: ["1 brand", "3 social accounts", "10 posts/month"],
    limits: { brands: 1, channels: 3, postsPerMonth: 10, competitors: 0 },
  },
  pro: {
    id: "Q57VQGJPM73WSP257BHRCUAB", // Square sandbox plan variation ID
    name: "Pro",
    price: 2900, // $29.00
    currency: "USD",
    interval: "MONTHLY",
    features: ["3 brands", "15 social accounts", "Unlimited posts", "Competitor monitoring", "Analytics"],
    limits: { brands: 3, channels: 15, postsPerMonth: Infinity, competitors: 10 },
  },
  agency: {
    id: "3G6AQFH4MQSOXLAU6VJ3OA4L", // Square sandbox plan variation ID
    name: "Agency",
    price: 9900, // $99.00
    currency: "USD",
    interval: "MONTHLY",
    features: ["Unlimited brands", "Unlimited accounts", "API access", "Priority support", "White-label reports"],
    limits: { brands: Infinity, channels: Infinity, postsPerMonth: Infinity, competitors: Infinity },
  },
};

// ─── Customer Management ──────────────────────────────────────────────────────

export async function createSquareCustomer(userId: string, email: string, name: string) {
  const response = await squareClient.customers.create({
    emailAddress: email,
    givenName: name.split(" ")[0] || name,
    familyName: name.split(" ").slice(1).join(" ") || undefined,
    referenceId: userId,
  });

  const customerId = response.customer?.id;
  if (!customerId) throw new Error("Failed to create Square customer");

  return customerId;
}

export async function getOrCreateSquareCustomer(userId: string, email: string, name: string, brandId: string) {
  const [brand] = await db.select({ squareCustomerId: brands.squareCustomerId })
    .from(brands).where(eq(brands.id, brandId)).limit(1);

  if (brand?.squareCustomerId) return brand.squareCustomerId;

  const customerId = await createSquareCustomer(userId, email, name);

  await db.update(brands).set({ squareCustomerId: customerId }).where(eq(brands.id, brandId));

  return customerId;
}

// ─── Catalog Setup ─────────────────────────────────────────────────────────────
// Creates SUBSCRIPTION_PLAN + SUBSCRIPTION_PLAN_VARIATION objects in Square.
// Uses the current Square API (2024-11+): pricing on phase, cadence required.

export async function createSubscriptionPlans() {
  const planEntries = [
    { key: "pro", name: "AgentSocial Pro", price: 2900 },
    { key: "agency", name: "AgentSocial Agency", price: 9900 },
  ];

  const createdIds: Record<string, string> = {};

  try {
    const response = await squareClient.catalog.batchUpsert({
      idempotencyKey: `plans-${Date.now()}`,
      batches: [
        {
          objects: planEntries.flatMap((plan) => [
            {
              type: "SUBSCRIPTION_PLAN" as any,
              id: `#plan-${plan.key}-base`,
              subscriptionPlanData: {
                name: plan.name,
              },
            } as any,
            {
              type: "SUBSCRIPTION_PLAN_VARIATION" as any,
              id: `#plan-${plan.key}-var`,
              subscriptionPlanVariationData: {
                name: `${plan.name} Monthly`,
                subscriptionPlanId: `#plan-${plan.key}-base`,
                phases: [
                  {
                    ordinal: BigInt(0),
                    pricing: {
                      type: "STATIC" as any,
                      price: {
                        amount: plan.price,
                        currency: "USD" as any,
                      },
                    },
                    cadence: "MONTHLY" as any,
                  },
                ],
              },
            } as any,
          ]),
        },
      ],
    } as any);

    // Map client IDs → server IDs from id_mappings
    const respAny = response as any;
    const idMappings = respAny.idMappings || respAny.id_mappings || [];
    for (const mapping of idMappings) {
      const clientId: string = mapping.clientObjectId || mapping.client_object_id || "";
      const serverId: string = mapping.objectId || mapping.object_id || "";
      const match = clientId.match(/^#plan-(pro|agency)-var$/);
      if (match && serverId) {
        const key = match[1];
        PLANS[key].id = serverId;
        createdIds[key] = serverId;
      }
    }
  } catch (err: any) {
    console.error("[billing] Failed to create plans:", err.message);
  }

  return createdIds;
}

// ─── Checkout Link ───────────────────────────────────────────────────────────

export async function createCheckoutLink(brandId: string, planKey: string, customerId: string) {
  const plan = PLANS[planKey];
  if (!plan) throw new Error(`Unknown plan: ${planKey}`);

  // For paid plans, generate a Square Checkout link
  if (planKey === "free") {
    await db.update(brands).set({
      subscriptionStatus: "active",
      subscriptionPlan: "free",
    }).where(eq(brands.id, brandId));
    return { checkoutUrl: null, planKey, status: "active" };
  }

  // Create subscription first (PENDING status until payment)
  const subResponse = await squareClient.subscriptions.create({
    idempotencyKey: `sub-${brandId}-${planKey}-${Date.now()}`,
    locationId: SQUARE_LOCATION_ID,
    planVariationId: plan.id,
    customerId,
    startDate: new Date().toISOString().split("T")[0],
    timezone: "America/New_York",
  });

  const subscriptionId = subResponse.subscription?.id;
  if (!subscriptionId) throw new Error("Failed to create Square subscription");

  // Store pending subscription
  await db.update(brands).set({
    squareSubscriptionId: subscriptionId,
    subscriptionStatus: "inactive",
    subscriptionPlan: planKey,
  }).where(eq(brands.id, brandId));

  // Generate checkout link for the first invoice
  const checkoutResponse = await squareClient.checkout.paymentLinks.create({
    idempotencyKey: `checkout-${brandId}-${Date.now()}`,
    order: {
      locationId: SQUARE_LOCATION_ID,
      lineItems: [{
        name: `${plan.name} Subscription`,
        quantity: "1",
        basePriceMoney: {
          amount: BigInt(plan.price),
          currency: "USD",
        },
      }],
    },
    checkoutOptions: {
      redirectUrl: `${APP_URL}/billing/success?brand_id=${brandId}&plan=${planKey}`,
      merchantSupportEmail: "support@agentsocial.com",
    },
  });

  const checkoutUrl = checkoutResponse.paymentLink?.url;
  if (!checkoutUrl) throw new Error("Failed to create checkout link");

  return { checkoutUrl, subscriptionId, planKey, status: "pending" };
}

// ─── Subscription Management ──────────────────────────────────────────────────

export async function createSubscription(brandId: string, planKey: string, customerId: string) {
  // Use the new checkout flow
  return createCheckoutLink(brandId, planKey, customerId);
}

export async function cancelSubscription(brandId: string) {
  const [brand] = await db.select({
    squareSubscriptionId: brands.squareSubscriptionId,
  }).from(brands).where(eq(brands.id, brandId)).limit(1);

  if (!brand?.squareSubscriptionId) throw new Error("No active subscription found");

  await squareClient.subscriptions.cancel({ subscriptionId: brand.squareSubscriptionId });

  await db.update(brands).set({
    subscriptionStatus: "canceled",
  }).where(eq(brands.id, brandId));

  return { canceled: true };
}

export async function getSubscriptionStatus(brandId: string) {
  const [brand] = await db.select({
    subscriptionStatus: brands.subscriptionStatus,
    subscriptionPlan: brands.subscriptionPlan,
    squareSubscriptionId: brands.squareSubscriptionId,
    trialEndsAt: brands.trialEndsAt,
  }).from(brands).where(eq(brands.id, brandId)).limit(1);

  if (!brand) throw new Error("Brand not found");

  if (brand.squareSubscriptionId) {
    try {
      const response = await squareClient.subscriptions.get({ subscriptionId: brand.squareSubscriptionId });
      const squareStatus = response.subscription?.status;

      if (squareStatus && String(squareStatus) !== brand.subscriptionStatus) {
        const mappedStatus = mapSquareStatus(String(squareStatus));
        await db.update(brands).set({ subscriptionStatus: mappedStatus }).where(eq(brands.id, brandId));
        brand.subscriptionStatus = mappedStatus;
      }
    } catch {
      // If Square API fails, return DB status
    }
  }

  return {
    status: brand.subscriptionStatus,
    plan: brand.subscriptionPlan || "free",
    trialEndsAt: brand.trialEndsAt,
  };
}

// ─── Feature Access ────────────────────────────────────────────────────────────

export function getPlanLimits(plan: string | null): PlanDefinition["limits"] {
  const planKey = plan || "free";
  return PLANS[planKey]?.limits ?? PLANS.free.limits;
}

export function hasFeatureAccess(plan: string | null, feature: string): boolean {
  const limits = getPlanLimits(plan);
  const val = limits[feature];
  return val === undefined || val > 0;
}

export function isWithinLimit(plan: string | null, feature: string, current: number): boolean {
  const limits = getPlanLimits(plan);
  const limit = limits[feature];
  if (limit === undefined) return true;
  if (limit === Infinity) return true;
  return current < limit;
}

// ─── Webhook Processing ───────────────────────────────────────────────────────

export async function processWebhookEvent(eventType: string, eventData: any) {
  console.log(`[billing] Processing webhook: ${eventType}`);

  switch (eventType) {
    case "payment.created":
    case "payment.updated": {
      const payment = eventData.payment;
      if (!payment) break;

      // Find subscription by order_id or reference
      const orderId = payment.orderId;
      if (!orderId) break;

      // Try to find brand by subscription ID in order
      const subscriptionId = payment.subscriptionId;
      if (subscriptionId) {
        const brandRows = await db.select({ id: brands.id }).from(brands)
          .where(eq(brands.squareSubscriptionId, subscriptionId)).limit(1);

        if (brandRows.length > 0) {
          const status = payment.status === "COMPLETED" ? "active" : "past_due";
          await db.update(brands).set({
            subscriptionStatus: status,
          }).where(eq(brands.id, brandRows[0].id));
        }
      }
      break;
    }

    case "invoice.payment_made": {
      const invoice = eventData.invoice;
      if (!invoice) break;

      const subId = invoice.subscriptionId;
      if (!subId) break;

      const brandRows = await db.select({ id: brands.id }).from(brands)
        .where(eq(brands.squareSubscriptionId, subId)).limit(1);

      if (brandRows.length > 0) {
        await db.update(brands).set({
          subscriptionStatus: "active",
        }).where(eq(brands.id, brandRows[0].id));
      }
      break;
    }

    case "subscription.created":
    case "subscription.updated": {
      const subscription = eventData.subscription;
      if (!subscription) break;

      const brandRows = await db.select({ id: brands.id }).from(brands)
        .where(eq(brands.squareSubscriptionId, subscription.id)).limit(1);

      if (brandRows.length > 0) {
        await db.update(brands).set({
          subscriptionStatus: mapSquareStatus(subscription.status),
          subscriptionPlan: mapPlanFromSquare(subscription.planId),
        }).where(eq(brands.id, brandRows[0].id));
      }
      break;
    }

    case "subscription.deleted": {
      const sub = eventData.subscription;
      if (!sub) break;

      const brandRows = await db.select({ id: brands.id }).from(brands)
        .where(eq(brands.squareSubscriptionId, sub.id)).limit(1);

      if (brandRows.length > 0) {
        await db.update(brands).set({
          subscriptionStatus: "canceled",
          squareSubscriptionId: null,
        }).where(eq(brands.id, brandRows[0].id));
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = eventData.invoice;
      if (!invoice) break;

      const subId = invoice.subscriptionId;
      if (!subId) break;

      const brandRows = await db.select({ id: brands.id }).from(brands)
        .where(eq(brands.squareSubscriptionId, subId)).limit(1);

      if (brandRows.length > 0) {
        await db.update(brands).set({
          subscriptionStatus: "past_due",
        }).where(eq(brands.id, brandRows[0].id));
      }
      break;
    }

    default:
      console.log(`[billing] Unhandled webhook type: ${eventType}`);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapSquareStatus(squareStatus: string): "trialing" | "active" | "past_due" | "canceled" | "inactive" {
  const statusMap: Record<string, "trialing" | "active" | "past_due" | "canceled" | "inactive"> = {
    ACTIVE: "active",
    ACTIVE_TRIAL: "trialing",
    PAST_DUE: "past_due",
    CANCELED: "canceled",
    DEACTIVATED: "inactive",
    PAUSED: "past_due",
  };
  return statusMap[squareStatus] || "inactive";
}

function mapPlanFromSquare(planId: string): string | null {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.id === planId) return key;
  }
  return null;
}