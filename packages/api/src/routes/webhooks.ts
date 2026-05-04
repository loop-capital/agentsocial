import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";
import { createWebhookSchema } from "@agentsocial/shared";
import { db, webhooks } from "../db/index.js";

export const webhooksRoutes = async (server: FastifyInstance) => {
  // GET /webhooks
  server.get("/", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const allWebhooks = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.userId, request.userId!));

    return reply.send({
      data: allWebhooks.map((wh) => ({
        id: wh.id,
        url: wh.url,
        events: wh.events,
        active: wh.active,
        created_at: wh.createdAt,
      })),
    });
  });

  // POST /webhooks
  server.post("/", {
    onRequest: [server.authenticate],
    schema: { body: createWebhookSchema },
  }, async (request, reply) => {
    const { url, events, secret, active } = request.body as {
      url: string; events: string[]; secret?: string; active?: boolean;
    };

    const secretHash = await bcrypt.hash(secret || nanoid(32), 10);
    const [webhook] = await db.insert(webhooks).values({
      userId: request.userId!,
      url,
      events,
      secretHash,
      active: active ?? true,
    }).returning();

    return reply.status(201).send({
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      secret: secret || `whsec_${nanoid(24)}`,
      active: webhook.active,
      created_at: webhook.createdAt,
    });
  });

  // DELETE /webhooks/:id
  server.delete("/:id", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await db
      .delete(webhooks)
      .where(and(eq(webhooks.id, id), eq(webhooks.userId, request.userId!)));
    return reply.status(204).send();
  });
};