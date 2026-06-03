// ─── ClientVet API Routes ─────────────────────────────────────────────────────
// Client risk assessment, flag management, deposit requirements, and private notes.

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/index.js";
import {
  clientRiskFlags,
  depositRequirements,
  clientFlagEvents,
  clientPrivateNotes,
  brands,
} from "../db/schema.js";
import { eq, and, or, ilike, desc, sql } from "drizzle-orm";
import {
  calculateRiskLevel,
  assessClientRisk,
  recalculateRisk,
  DEFAULT_DEPOSIT_POLICY,
  type RiskLevel,
} from "../services/risk-calculator.js";
import {
  createDepositPayment,
  verifyDepositPayment,
  convertDepositToCredit,
  forfeitDeposit,
  processDepositWebhook,
} from "../services/square-deposit.js";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const FlagTypeSchema = z.enum([
  "no_show", "late_cancel", "negative_review", "review_extortion",
  "chargeback", "refund_abuse", "product_return_fraud",
  "free_service_extraction", "other",
]);

const RiskLevelSchema = z.enum(["low", "medium", "high", "fraud"]);

const CreateFlagSchema = z.object({
  phone: z.string().optional(),
  email: z.string().optional(),
  fullName: z.string().optional(),
  flagType: FlagTypeSchema,
  description: z.string().optional(),
  evidence: z.record(z.any()).optional(),
  appointmentId: z.string().uuid().optional(),
});

const AddFlagEventSchema = z.object({
  flagType: FlagTypeSchema,
  description: z.string().optional(),
  evidence: z.record(z.any()).optional(),
  appointmentId: z.string().uuid().optional(),
});

const CheckClientSchema = z.object({
  phone: z.string().optional(),
  email: z.string().optional(),
  brandId: z.string().uuid(),
  serviceAmountCents: z.number().optional(), // for deposit calculation
});

const UpdateDepositPolicySchema = z.object({
  low: z.object({
    depositPercent: z.number().min(0).max(100),
    requirePrepayment: z.boolean().default(false),
    allowBooking: z.boolean().default(true),
    creditOnly: z.boolean().default(false),
    noProductSales: z.boolean().default(false),
  }).optional(),
  medium: z.object({
    depositPercent: z.number().min(0).max(100),
    requirePrepayment: z.boolean().default(false),
    allowBooking: z.boolean().default(true),
    creditOnly: z.boolean().default(false),
    noProductSales: z.boolean().default(false),
  }).optional(),
  high: z.object({
    depositPercent: z.number().min(0).max(100),
    requirePrepayment: z.boolean().default(true),
    allowBooking: z.boolean().default(true),
    creditOnly: z.boolean().default(false),
    noProductSales: z.boolean().default(false),
  }).optional(),
  fraud: z.object({
    depositPercent: z.number().min(0).max(100),
    requirePrepayment: z.boolean().default(true),
    allowBooking: z.boolean().default(false),
    creditOnly: z.boolean().default(true),
    noProductSales: z.boolean().default(true),
  }).optional(),
});

const AddNoteSchema = z.object({
  note: z.string().min(1),
});

// ─── Routes ──────────────────────────────────────────────────────────────────

export const clientvetRoutes = async (server: FastifyInstance) => {

  // ─── Check Client Before Booking ─────────────────────────────────────────
  // This is the endpoint the booking system calls to determine if a deposit is needed

  server.post("/check", {
    schema: { body: CheckClientSchema },
  }, async (request, reply) => {
    const { phone, email, brandId, serviceAmountCents } = request.body as z.infer<typeof CheckClientSchema>;

    if (!phone && !email) {
      return reply.status(400).send({
        error: { code: "missing_identifier", message: "Provide phone or email" },
      });
    }

    // Find existing client flag by phone or email for this brand
    const conditions = [eq(clientRiskFlags.brandId, brandId)];
    if (phone) conditions.push(eq(clientRiskFlags.phone, phone));
    if (email) conditions.push(eq(clientRiskFlags.email, email));

    const [existingFlag] = await db
      .select()
      .from(clientRiskFlags)
      .where(and(...conditions))
      .limit(1);

    if (!existingFlag) {
      // No flags = low risk, no deposit required
      return reply.send({
        riskLevel: "low",
        depositRequired: false,
        depositPercent: 0,
        requirePrepayment: false,
        allowBooking: true,
        creditOnly: false,
        noProductSales: false,
        flags: [],
        clientFlagId: null,
      });
    }

    // Get full risk assessment
    const assessment = await assessClientRisk(existingFlag, brandId);

    // If deposit required and we have a service amount, create a checkout link
    let depositCheckout = null;
    if (assessment.depositRequired && serviceAmountCents && assessment.allowBooking) {
      try {
        depositCheckout = await createDepositPayment(
          existingFlag.id,
          serviceAmountCents,
          brandId,
        );
      } catch (err: any) {
        // Log but don't fail — the booking can still proceed, just without a pre-built checkout link
        console.error("[clientvet] Failed to create deposit checkout:", err.message);
      }
    }

    return reply.send({
      ...assessment,
      clientFlagId: existingFlag.id,
      depositCheckout,
    });
  });

  // ─── Look Up Client Risk Profile ──────────────────────────────────────────

  server.get("/clients/:identifier", async (request, reply) => {
    const { identifier } = request.params as { identifier: string };
    const { brandId } = request.query as { brandId?: string };

    // Try to find by phone or email
    const conditions = brandId
      ? and(
          eq(clientRiskFlags.brandId, brandId),
          or(
            eq(clientRiskFlags.phone, identifier),
            eq(clientRiskFlags.email, identifier),
          ),
        )
      : or(
          eq(clientRiskFlags.phone, identifier),
          eq(clientRiskFlags.email, identifier),
        );

    const flags = await db
      .select()
      .from(clientRiskFlags)
      .where(conditions);

    if (flags.length === 0) {
      return reply.status(404).send({
        error: { code: "not_found", message: "Client not found" },
      });
    }

    // Get full assessment for the first match
    const flag = flags[0];
    const assessment = await assessClientRisk(flag, flag.brandId);

    return reply.send({
      ...flag,
      assessment,
    });
  });

  // ─── Create or Update Client Risk Flag ──────────────────────────────────────

  server.post("/clients", {
    schema: { body: CreateFlagSchema },
  }, async (request, reply) => {
    const body = request.body as z.infer<typeof CreateFlagSchema>;
    const { brandId } = request.query as { brandId: string };

    if (!brandId) {
      return reply.status(400).send({
        error: { code: "missing_brand", message: "brandId query parameter required" },
      });
    }

    // Check if client already exists for this brand
    const conditions = [eq(clientRiskFlags.brandId, brandId)];
    if (body.phone) conditions.push(eq(clientRiskFlags.phone, body.phone));
    if (body.email) conditions.push(eq(clientRiskFlags.email, body.email));

    const [existingFlag] = await db
      .select()
      .from(clientRiskFlags)
      .where(and(...conditions))
      .limit(1);

    let flagRecord: typeof clientRiskFlags.$inferSelect;

    if (existingFlag) {
      // Increment the appropriate counter
      const incrementField = getCounterField(body.flagType);
      if (!incrementField) {
        return reply.status(400).send({
          error: { code: "invalid_flag_type", message: `Unknown flag type: ${body.flagType}` },
        });
      }

      const newValue = (existingFlag[incrementField as keyof typeof existingFlag] as number) + 1;

      await db
        .update(clientRiskFlags)
        .set({
          [incrementField]: newValue,
          lastFlagAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(clientRiskFlags.id, existingFlag.id));

      // Create the flag event
      await db.insert(clientFlagEvents).values({
        clientFlagId: existingFlag.id,
        flagType: body.flagType,
        description: body.description,
        evidence: body.evidence || {},
        appointmentId: body.appointmentId,
        flaggedBy: (request.user as any)?.id || "system",
      });

      // Recalculate risk level
      const newRiskLevel = await recalculateRisk(existingFlag.id);

      const [updated] = await db
        .select()
        .from(clientRiskFlags)
        .where(eq(clientRiskFlags.id, existingFlag.id))
        .limit(1);

      flagRecord = updated!;
    } else {
      // Create new client flag
      const incrementField = getCounterField(body.flagType);
      const initialValues: Record<string, number> = {
        noShowCount: 0,
        negativeReviewCount: 0,
        chargebackCount: 0,
        refundCount: 0,
        productReturnFraudCount: 0,
        reviewExtortionCount: 0,
        freeServiceExtractionCount: 0,
      };
      if (incrementField) initialValues[incrementField] = 1;

      const [inserted] = await db.insert(clientRiskFlags).values({
        brandId,
        phone: body.phone,
        email: body.email,
        fullName: body.fullName,
        riskLevel: "low", // will be recalculated
        flaggedBy: (request.user as any)?.id || "system",
        lastFlagAt: new Date(),
        ...initialValues,
      }).returning();

      // Create flag event
      await db.insert(clientFlagEvents).values({
        clientFlagId: inserted.id,
        flagType: body.flagType,
        description: body.description,
        evidence: body.evidence || {},
        appointmentId: body.appointmentId,
        flaggedBy: (request.user as any)?.id || "system",
      });

      // Recalculate risk level
      await recalculateRisk(inserted.id);

      const [created] = await db
        .select()
        .from(clientRiskFlags)
        .where(eq(clientRiskFlags.id, inserted.id))
        .limit(1);

      flagRecord = created!;
    }

    const assessment = await assessClientRisk(flagRecord, brandId);

    return reply.status(existingFlag ? 200 : 201).send({
      ...flagRecord,
      assessment,
    });
  });

  // ─── Add Flag Event to Existing Client ─────────────────────────────────────

  server.post("/clients/:id/flag", {
    schema: { body: AddFlagEventSchema },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as z.infer<typeof AddFlagEventSchema>;

    const [flag] = await db
      .select()
      .from(clientRiskFlags)
      .where(eq(clientRiskFlags.id, id))
      .limit(1);

    if (!flag) {
      return reply.status(404).send({
        error: { code: "not_found", message: "Client flag not found" },
      });
    }

    // Increment the appropriate counter
    const incrementField = getCounterField(body.flagType);
    if (!incrementField) {
      return reply.status(400).send({
        error: { code: "invalid_flag_type", message: `Unknown flag type: ${body.flagType}` },
      });
    }

    const newValue = (flag[incrementField as keyof typeof flag] as number) + 1;

    await db
      .update(clientRiskFlags)
      .set({
        [incrementField]: newValue,
        lastFlagAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(clientRiskFlags.id, id));

    // Create flag event
    const [event] = await db.insert(clientFlagEvents).values({
      clientFlagId: id,
      flagType: body.flagType,
      description: body.description,
      evidence: body.evidence || {},
      appointmentId: body.appointmentId,
      flaggedBy: (request.user as any)?.id || "system",
    }).returning();

    // Recalculate risk level
    const newRiskLevel = await recalculateRisk(id);

    const assessment = await assessClientRisk(
      (await db.select().from(clientRiskFlags).where(eq(clientRiskFlags.id, id)).limit(1))[0],
      flag.brandId,
    );

    return reply.send({
      event,
      riskLevel: newRiskLevel,
      assessment,
    });
  });

  // ─── List Flagged Clients for a Brand ───────────────────────────────────────

  server.get("/clients", async (request, reply) => {
    const { brandId, riskLevel, search, page, limit } = request.query as {
      brandId: string;
      riskLevel?: RiskLevel;
      search?: string;
      page?: string;
      limit?: string;
    };

    const pageNum = parseInt(page || "1", 10);
    const limitNum = Math.min(parseInt(limit || "50", 10), 100);
    const offset = (pageNum - 1) * limitNum;

    const conditions = [eq(clientRiskFlags.brandId, brandId)];
    if (riskLevel) conditions.push(eq(clientRiskFlags.riskLevel, riskLevel));
    if (search) {
      conditions.push(
        or(
          ilike(clientRiskFlags.fullName, `%${search}%`),
          ilike(clientRiskFlags.phone, `%${search}%`),
          ilike(clientRiskFlags.email, `%${search}%`),
        )!,
      );
    }

    const [clients, countResult] = await Promise.all([
      db
        .select()
        .from(clientRiskFlags)
        .where(and(...conditions))
        .orderBy(desc(clientRiskFlags.lastFlagAt))
        .limit(limitNum)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(clientRiskFlags)
        .where(and(...conditions)),
    ]);

    return reply.send({
      clients,
      total: countResult[0]?.count || 0,
      page: pageNum,
      limit: limitNum,
    });
  });

  // ─── Delete Client Flag (Soft Delete) ──────────────────────────────────────

  server.delete("/clients/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const [flag] = await db
      .select()
      .from(clientRiskFlags)
      .where(eq(clientRiskFlags.id, id))
      .limit(1);

    if (!flag) {
      return reply.status(404).send({
        error: { code: "not_found", message: "Client flag not found" },
      });
    }

    // Reset all counters to 0 and set risk level back to low
    await db
      .update(clientRiskFlags)
      .set({
        riskLevel: "low",
        noShowCount: 0,
        negativeReviewCount: 0,
        chargebackCount: 0,
        refundCount: 0,
        productReturnFraudCount: 0,
        reviewExtortionCount: 0,
        freeServiceExtractionCount: 0,
        notes: null,
        updatedAt: new Date(),
      })
      .where(eq(clientRiskFlags.id, id));

    return reply.send({ success: true, message: "Client flags cleared" });
  });

  // ─── Get Deposit Policy for a Brand ────────────────────────────────────────

  server.get("/deposits/:brandId", async (request, reply) => {
    const { brandId } = request.params as { brandId: string };

    const policies = await db
      .select()
      .from(depositRequirements)
      .where(eq(depositRequirements.brandId, brandId));

    // Fill in defaults for any missing risk levels
    const policyMap: Record<RiskLevel, typeof DEFAULT_DEPOSIT_POLICY[RiskLevel]> = {
      ...DEFAULT_DEPOSIT_POLICY,
    };

    for (const policy of policies) {
      policyMap[policy.riskLevel as RiskLevel] = {
        depositPercent: policy.depositPercent,
        requirePrepayment: policy.requirePrepayment,
        allowBooking: policy.allowBooking,
        creditOnly: policy.creditOnly,
        noProductSales: policy.noProductSales,
      };
    }

    return reply.send({
      brandId,
      policies: policyMap,
    });
  });

  // ─── Update Deposit Policy for a Brand ─────────────────────────────────────

  server.put("/deposits/:brandId", {
    schema: { body: UpdateDepositPolicySchema },
  }, async (request, reply) => {
    const { brandId } = request.params as { brandId: string };
    const body = request.body as z.infer<typeof UpdateDepositPolicySchema>;

    const results = [];

    for (const [level, config] of Object.entries(body)) {
      if (!config) continue;
      const riskLevel = level as RiskLevel;

      // Upsert: try update, if not found then insert
      const [existing] = await db
        .select()
        .from(depositRequirements)
        .where(
          and(
            eq(depositRequirements.brandId, brandId),
            eq(depositRequirements.riskLevel, riskLevel),
          ),
        )
        .limit(1);

      if (existing) {
        await db
          .update(depositRequirements)
          .set({
            depositPercent: config.depositPercent,
            requirePrepayment: config.requirePrepayment,
            allowBooking: config.allowBooking,
            creditOnly: config.creditOnly,
            noProductSales: config.noProductSales,
            updatedAt: new Date(),
          })
          .where(eq(depositRequirements.id, existing.id));
      } else {
        await db.insert(depositRequirements).values({
          brandId,
          riskLevel,
          depositPercent: config.depositPercent,
          requirePrepayment: config.requirePrepayment,
          allowBooking: config.allowBooking,
          creditOnly: config.creditOnly,
          noProductSales: config.noProductSales,
        });
      }

      results.push({ riskLevel, ...config });
    }

    return reply.send({ brandId, updated: results });
  });

  // ─── Add Private Note (Business-Only, Never Shared) ──────────────────────────

  server.post("/clients/:id/notes", {
    schema: { body: AddNoteSchema },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { note } = request.body as z.infer<typeof AddNoteSchema>;
    const { brandId } = request.query as { brandId: string };

    if (!brandId) {
      return reply.status(400).send({
        error: { code: "missing_brand", message: "brandId query parameter required" },
      });
    }

    const [flag] = await db
      .select()
      .from(clientRiskFlags)
      .where(eq(clientRiskFlags.id, id))
      .limit(1);

    if (!flag) {
      return reply.status(404).send({
        error: { code: "not_found", message: "Client flag not found" },
      });
    }

    const [created] = await db.insert(clientPrivateNotes).values({
      clientFlagId: id,
      brandId,
      note,
      createdBy: (request.user as any)?.id || "system",
    }).returning();

    return reply.status(201).send(created);
  });

  // ─── Get Private Notes for a Client ────────────────────────────────────────

  server.get("/clients/:id/notes", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { brandId } = request.query as { brandId: string };

    if (!brandId) {
      return reply.status(400).send({
        error: { code: "missing_brand", message: "brandId query parameter required" },
      });
    }

    const notes = await db
      .select()
      .from(clientPrivateNotes)
      .where(
        and(
          eq(clientPrivateNotes.clientFlagId, id),
          eq(clientPrivateNotes.brandId, brandId), // Only notes from THIS business
        ),
      )
      .orderBy(desc(clientPrivateNotes.createdAt));

    return reply.send({ notes });
  });

  // ─── Deposit Payment Endpoints ──────────────────────────────────────────────

  // Create a deposit checkout link for a flagged client
  server.post("/deposits/create", async (request, reply) => {
    const { clientFlagId, serviceAmountCents, brandId } = request.body as {
      clientFlagId: string;
      serviceAmountCents: number;
      brandId: string;
    };

    if (!clientFlagId || !serviceAmountCents || !brandId) {
      return reply.status(400).send({
        error: { code: "missing_params", message: "clientFlagId, serviceAmountCents, and brandId required" },
      });
    }

    try {
      const result = await createDepositPayment(clientFlagId, serviceAmountCents, brandId);
      return reply.status(201).send(result);
    } catch (err: any) {
      return reply.status(400).send({
        error: { code: "deposit_failed", message: err.message },
      });
    }
  });

  // Verify deposit payment status
  server.get("/deposits/:paymentId/status", async (request, reply) => {
    const { paymentId } = request.params as { paymentId: string };

    try {
      const result = await verifyDepositPayment(paymentId);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(404).send({
        error: { code: "not_found", message: err.message },
      });
    }
  });

  // Convert deposit to service credit (appointment completed)
  server.post("/deposits/:paymentId/convert", async (request, reply) => {
    const { paymentId } = request.params as { paymentId: string };

    try {
      const result = await convertDepositToCredit(paymentId);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({
        error: { code: "convert_failed", message: err.message },
      });
    }
  });

  // Forfeit deposit (no-show)
  server.post("/deposits/:paymentId/forfeit", async (request, reply) => {
    const { paymentId } = request.params as { paymentId: string };

    try {
      const result = await forfeitDeposit(paymentId);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({
        error: { code: "forfeit_failed", message: err.message },
      });
    }
  });

  // Square webhook for deposit payments
  server.post("/deposits/webhook", async (request, reply) => {
    const body = request.body as any;
    const eventType = body?.type || body?.event_type;

    if (!eventType) {
      return reply.status(400).send({ error: "Missing event type" });
    }

    // Process asynchronously
    processDepositWebhook(eventType, body?.data || body).catch((err) => {
      console.error("[clientvet] Deposit webhook processing error:", err);
    });

    return reply.status(200).send({ received: true });
  });
};

// ─── Helper: Map flag type to counter field ────────────────────────────────────

function getCounterField(flagType: string): string | null {
  const mapping: Record<string, string> = {
    no_show: "noShowCount",
    late_cancel: "noShowCount", // late cancels count toward no-show counter
    negative_review: "negativeReviewCount",
    review_extortion: "reviewExtortionCount",
    chargeback: "chargebackCount",
    refund_abuse: "refundCount",
    product_return_fraud: "productReturnFraudCount",
    free_service_extraction: "freeServiceExtractionCount",
    other: "noShowCount", // default counter
  };
  return mapping[flagType] || null;
}