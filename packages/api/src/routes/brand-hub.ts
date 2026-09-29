/**
 * Brand hub routes — one place to read/update everything about a brand.
 *
 *   GET /hub/:brandId   — basics, profile, voice, channels (with readiness), integrations, checklist
 *   PUT /hub/:brandId   — update basics / profile / voice in one call
 */

import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { and, eq } from "drizzle-orm";
import { db, brands, channels, crmProviders, mediaAssets } from "../db/index.js";
import { brandProfileSchema, brandChecklist, type ChannelSummary } from "../services/brand-hub.js";
import { providerFor, usesProviderRouter } from "../services/publishing/index.js";

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  timezone: z.string().min(1).max(64).optional(),
  logo_url: z.string().url().max(500).nullable().optional(),
  profile: brandProfileSchema.optional(),
  voice_profile: z.string().max(20000).optional(),
});

const validTimezone = (tz: string) => {
  try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return true; } catch { return false; }
};

function summarize(c: typeof channels.$inferSelect): ChannelSummary {
  const settings = (c.settings ?? {}) as Record<string, unknown>;
  const provider = providerFor(c.platform, settings);
  const viaRouter = usesProviderRouter(c.platform, settings);
  const legacy = Boolean(c.accessTokenEncrypted) || (c.authMethod === "browser" && Boolean(c.usernameEncrypted));
  const issues: string[] = [];
  if (c.status !== "active") issues.push(`Channel is ${c.status}`);
  if (!viaRouter && !legacy) issues.push(`Not connected to ${provider}`);
  return {
    id: c.id,
    platform: c.platform,
    name: c.name,
    status: c.status,
    provider: viaRouter ? provider : legacy ? "direct" : provider,
    ready: c.status === "active" && (viaRouter || legacy),
    issues,
  };
}

export const brandHubRoutes = async (server: FastifyInstance) => {
  async function load(brandId: string, userId: string) {
    const [brand] = await db.select().from(brands).where(and(eq(brands.id, brandId), eq(brands.userId, userId))).limit(1);
    return brand;
  }

  async function snapshot(brand: typeof brands.$inferSelect) {
    const chans = (await db.select().from(channels).where(eq(channels.brandId, brand.id))).map(summarize);
    const crm = await db
      .select({ provider: crmProviders.provider, syncEnabled: crmProviders.syncEnabled })
      .from(crmProviders)
      .where(eq(crmProviders.brandId, brand.id));
    const media = await db.select({ id: mediaAssets.id }).from(mediaAssets).where(eq(mediaAssets.brandId, brand.id));
    return {
      brand: { id: brand.id, name: brand.name, logo_url: brand.logoUrl, timezone: brand.timezone },
      profile: (brand.profile ?? {}) as Record<string, unknown>,
      voice_profile: brand.voiceProfile ?? "",
      channels: chans,
      integrations: crm.map((c) => ({ type: "crm", provider: c.provider, sync_enabled: c.syncEnabled })),
      media_count: media.length,
      checklist: brandChecklist(brand, chans),
    };
  }

  server.get("/:brandId", { onRequest: [server.authenticate] }, async (request, reply) => {
    const { brandId } = request.params as { brandId: string };
    const brand = await load(brandId, request.userId!);
    if (!brand) {
      return reply.status(404).send({ error: { code: "resource_not_found", message: "Brand not found", request_id: request.id } });
    }
    return snapshot(brand);
  });

  server.put("/:brandId", { onRequest: [server.authenticate] }, async (request, reply) => {
    const { brandId } = request.params as { brandId: string };
    const parsed = updateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: "validation_error", message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "), request_id: request.id } });
    }
    const body = parsed.data;
    const brand = await load(brandId, request.userId!);
    if (!brand) {
      return reply.status(404).send({ error: { code: "resource_not_found", message: "Brand not found", request_id: request.id } });
    }
    if (body.timezone && !validTimezone(body.timezone)) {
      return reply.status(400).send({ error: { code: "validation_error", message: `Unknown timezone "${body.timezone}"`, request_id: request.id } });
    }

    const [updated] = await db
      .update(brands)
      .set({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.timezone !== undefined ? { timezone: body.timezone } : {}),
        ...(body.logo_url !== undefined ? { logoUrl: body.logo_url } : {}),
        // Profile is merged shallowly so a partial save never wipes other sections
        ...(body.profile !== undefined ? { profile: { ...((brand.profile ?? {}) as object), ...body.profile } } : {}),
        ...(body.voice_profile !== undefined ? { voiceProfile: body.voice_profile } : {}),
        updatedAt: new Date(),
      })
      .where(eq(brands.id, brandId))
      .returning();
    return snapshot(updated);
  });
};
