import type { FastifyInstance } from "fastify";
import { eq, and } from "drizzle-orm";
import { createBrandSchema } from "@agentsocial/shared";
import { db, brands, channels } from "../db/index.js";

export const brandsRoutes = async (server: FastifyInstance) => {
  // GET /brands
  server.get("/", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const allBrands = await db.select().from(brands).where(eq(brands.userId, request.userId!));

    const brandsWithChannels = await Promise.all(
      allBrands.map(async (brand) => {
        const channelList = await db
          .select()
          .from(channels)
          .where(eq(channels.brandId, brand.id));

        return {
          id: brand.id,
          name: brand.name,
          logo_url: brand.logoUrl,
          channels_count: channelList.length,
          channels: channelList.map((ch) => ({
            id: ch.id,
            platform: ch.platform,
            name: ch.name,
            status: ch.status,
            follower_count: ch.followerCount,
          })),
          posts_this_month: 0,
          created_at: brand.createdAt,
        };
      })
    );

    return reply.send({ data: brandsWithChannels });
  });

  // GET /brands/:id
  server.get("/:id", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const [brand] = await db
      .select()
      .from(brands)
      .where(and(eq(brands.id, id), eq(brands.userId, request.userId!)))
      .limit(1);

    if (!brand) {
      return reply.status(404).send({
        error: { code: "resource_not_found", message: "Brand not found", request_id: request.id },
      });
    }

    const channelList = await db
      .select()
      .from(channels)
      .where(eq(channels.brandId, brand.id));

    return reply.send({
      id: brand.id,
      name: brand.name,
      logo_url: brand.logoUrl,
      timezone: brand.timezone,
      channels: channelList.map((ch) => ({
        id: ch.id,
        platform: ch.platform,
        name: ch.name,
        status: ch.status,
        follower_count: ch.followerCount,
      })),
      created_at: brand.createdAt,
    });
  });

  // POST /brands
  server.post("/", {
    onRequest: [server.authenticate],
    // schema: { body: createBrandSchema, response: { 201: { type: "object" } } },
  }, async (request, reply) => {
    const { name, organization_id, timezone } = request.body as {
      name: string;
      organization_id?: string;
      timezone?: string;
    };

    const [brand] = await db.insert(brands).values({
      userId: request.userId!,
      name,
      organizationId: organization_id || null,
      timezone: timezone || "UTC",
    }).returning();

    return reply.status(201).send({
      id: brand.id,
      name: brand.name,
      logo_url: brand.logoUrl,
      timezone: brand.timezone,
      organization_id: brand.organizationId,
      created_at: brand.createdAt,
    });
  });

  // PATCH /brands/:id
  server.patch("/:id", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { name, timezone, logo_url } = request.body as {
      name?: string;
      timezone?: string;
      logo_url?: string;
    };

    const [brand] = await db
      .select()
      .from(brands)
      .where(and(eq(brands.id, id), eq(brands.userId, request.userId!)))
      .limit(1);

    if (!brand) {
      return reply.status(404).send({
        error: { code: "resource_not_found", message: "Brand not found", request_id: request.id },
      });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (logo_url !== undefined) updateData.logoUrl = logo_url;

    const [updated] = await db.update(brands)
      .set(updateData)
      .where(eq(brands.id, id))
      .returning();

    return reply.send({
      id: updated.id,
      name: updated.name,
      logo_url: updated.logoUrl,
      timezone: updated.timezone,
      organization_id: updated.organizationId,
      updated_at: updated.updatedAt,
    });
  });

  // DELETE /brands/:id
  server.delete("/:id", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const [brand] = await db
      .select()
      .from(brands)
      .where(and(eq(brands.id, id), eq(brands.userId, request.userId!)))
      .limit(1);

    if (!brand) {
      return reply.status(404).send({
        error: { code: "resource_not_found", message: "Brand not found", request_id: request.id },
      });
    }

    await db.delete(brands).where(eq(brands.id, id));
    return reply.status(204).send();
  });
};