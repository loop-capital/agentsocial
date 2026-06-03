// ─── Square Deposit Payment Service ──────────────────────────────────────────
// Creates Square checkout links for required deposits based on risk level.
// Integrates with the existing Square billing setup.

import { SquareClient, SquareEnvironment } from "square";
import { db } from "../db/index.js";
import { clientRiskFlags, depositPayments, brands } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { getDepositRequirement, type RiskLevel } from "./risk-calculator.js";

// ─── Square Client (reuse same config as billing) ─────────────────────────────

const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN || "",
  environment: process.env.SQUARE_ENVIRONMENT === "production"
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox,
});

const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID || "";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

// ─── Create Deposit Payment ───────────────────────────────────────────────────

export interface DepositPaymentResult {
  checkoutUrl: string;
  paymentId: string;
  amountCents: number;
  riskLevel: RiskLevel;
  depositPercent: number;
}

export async function createDepositPayment(
  clientFlagId: string,
  serviceAmountCents: number,
  brandId: string,
): Promise<DepositPaymentResult> {
  // 1. Look up the client risk flag
  const [flag] = await db
    .select()
    .from(clientRiskFlags)
    .where(eq(clientRiskFlags.id, clientFlagId))
    .limit(1);

  if (!flag) {
    throw new Error(`Client flag ${clientFlagId} not found`);
  }

  // 2. Get deposit requirement based on risk level
  const deposit = await getDepositRequirement(flag.riskLevel, brandId);

  if (deposit.depositPercent === 0 || !deposit.allowBooking) {
    throw new Error(
      deposit.allowBooking
        ? "No deposit required for this risk level"
        : "Booking not allowed for this risk level"
    );
  }

  // 3. Calculate deposit amount
  const depositAmountCents = Math.ceil(serviceAmountCents * (deposit.depositPercent / 100));

  // 4. Create Square checkout link
  const idempotencyKey = `deposit-${clientFlagId}-${Date.now()}`;

  const checkoutResponse = await squareClient.checkout.paymentLinks.create({
    idempotencyKey,
    order: {
      locationId: SQUARE_LOCATION_ID,
      lineItems: [{
        name: `Service Deposit (${deposit.depositPercent}% - Risk: ${flag.riskLevel})`,
        quantity: "1",
        basePriceMoney: {
          amount: BigInt(depositAmountCents),
          currency: "USD",
        },
      }],
    },
    checkoutOptions: {
      redirectUrl: `${APP_URL}/booking/deposit-success?client=${clientFlagId}&brand=${brandId}`,
      merchantSupportEmail: "support@getagentsocial.com",
    },
    prePopulatedData: {
      buyerEmail: flag.email || undefined,
    },
  });

  const checkoutUrl = checkoutResponse.paymentLink?.url;
  const paymentId = checkoutResponse.paymentLink?.id;

  if (!checkoutUrl || !paymentId) {
    throw new Error("Failed to create Square checkout link for deposit");
  }

  // 5. Record the deposit payment in DB
  await db.insert(depositPayments).values({
    brandId,
    clientFlagId,
    squarePaymentId: paymentId,
    amountCents: depositAmountCents,
    currency: "USD",
    status: "pending",
    riskLevelAtPayment: flag.riskLevel,
    depositPercent: deposit.depositPercent,
  });

  return {
    checkoutUrl,
    paymentId,
    amountCents: depositAmountCents,
    riskLevel: flag.riskLevel,
    depositPercent: deposit.depositPercent,
  };
}

// ─── Verify Deposit Payment ──────────────────────────────────────────────────

export async function verifyDepositPayment(
  paymentId: string,
): Promise<{ status: string; amountCents: number; clientFlagId: string | null }> {
  const [payment] = await db
    .select()
    .from(depositPayments)
    .where(eq(depositPayments.squarePaymentId, paymentId))
    .limit(1);

  if (!payment) {
    throw new Error(`Deposit payment ${paymentId} not found`);
  }

  // In production, verify with Square API that payment was completed
  // For now, return stored status
  return {
    status: payment.status,
    amountCents: payment.amountCents,
    clientFlagId: payment.clientFlagId,
  };
}

// ─── Process Square Webhook for Deposit ────────────────────────────────────────

export async function processDepositWebhook(eventType: string, data: any): Promise<void> {
  // Handle deposit payment completion from Square webhook
  if (eventType === "payment.updated" || eventType === "order.fulfilled") {
    const orderId = data?.order?.id || data?.payment?.orderId;

    if (orderId) {
      await db
        .update(depositPayments)
        .set({
          status: "completed",
          squareOrderId: orderId,
          updatedAt: new Date(),
        })
        .where(eq(depositPayments.squarePaymentId, data?.payment?.id || orderId));
    }
  }

  if (eventType === "refund.created") {
    const paymentId = data?.refund?.paymentId;

    if (paymentId) {
      await db
        .update(depositPayments)
        .set({
          status: "refunded",
          refundedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(depositPayments.squarePaymentId, paymentId));
    }
  }
}

// ─── Convert Deposit to Service Credit ────────────────────────────────────────
// Called when appointment is completed — deposit converts to payment credit

export async function convertDepositToCredit(
  paymentId: string,
): Promise<{ status: string; amountCents: number }> {
  const [payment] = await db
    .select()
    .from(depositPayments)
    .where(eq(depositPayments.squarePaymentId, paymentId))
    .limit(1);

  if (!payment) {
    throw new Error(`Deposit payment ${paymentId} not found`);
  }

  if (payment.status !== "completed") {
    throw new Error(`Cannot convert deposit in ${payment.status} status`);
  }

  await db
    .update(depositPayments)
    .set({
      status: "converted_to_credit",
      convertedToCreditAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(depositPayments.squarePaymentId, paymentId));

  return {
    status: "converted_to_credit",
    amountCents: payment.amountCents,
  };
}

// ─── Forfeit Deposit (No-Show) ────────────────────────────────────────────────

export async function forfeitDeposit(
  paymentId: string,
): Promise<{ status: string; amountCents: number }> {
  const [payment] = await db
    .select()
    .from(depositPayments)
    .where(eq(depositPayments.squarePaymentId, paymentId))
    .limit(1);

  if (!payment) {
    throw new Error(`Deposit payment ${paymentId} not found`);
  }

  await db
    .update(depositPayments)
    .set({
      status: "forfeited",
      updatedAt: new Date(),
    })
    .where(eq(depositPayments.squarePaymentId, paymentId));

  return {
    status: "forfeited",
    amountCents: payment.amountCents,
  };
}