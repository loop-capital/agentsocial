import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db, channels } from "../db/index.js";
import { enqueueAnalyticsSync } from "../queues/index.js";

export const syncRoutes = async (server: FastifyInstance) => {
  // POST /sync/analytics — trigger analytics sync for a brand's channels
  server.post("/sync/analytics", {
    onRequest: [server.authenticate],
    schema: {
      body: {
        type: "object",
        properties: {
          brand_id: { type: "string" },
          channel_id: { type: "string" },
          start_date: { type: "string" },
          end_date: { type: "string" },
        },
        required: ["brand_id"],
      },
    },
  }, async (request, reply) => {
    const { brand_id, channel_id, start_date, end_date } = request.body as {
      brand_id: string;
      channel_id?: string;
      start_date?: string;
      end_date?: string;
    };

    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = end_date || new Date().toISOString();

    let targetChannels: string[];

    if (channel_id) {
      targetChannels = [channel_id];
    } else {
      // Get all channels for this brand
      const brandChannels = await db
        .select({ id: channels.id })
        .from(channels)
        .where(eq(channels.brandId, brand_id));

      targetChannels = brandChannels.map((c) => c.id);
    }

    if (targetChannels.length === 0) {
      return reply.send({
        queued: 0,
        message: "No channels found for brand",
      });
    }

    // Enqueue a sync job per channel
    const jobs = await Promise.all(
      targetChannels.map((chId) =>
        enqueueAnalyticsSync({
          brandId: brand_id,
          channelId: chId,
          startDate,
          endDate,
        })
      )
    );

    return reply.send({
      queued: jobs.length,
      job_ids: jobs.map((j) => j.id),
      channel_ids: targetChannels,
      period: { start: startDate, end: endDate },
    });
  });
};
