import type { FastifyInstance } from "fastify";
import * as campaignService from "../services/campaigns.js";

export const campaignRoutes = async (server: FastifyInstance) => {

  // GET /api/v1/campaigns — List campaigns
  server.get("/", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const query = request.query as Record<string, string | undefined>;
    const brandId = query.brandId;
    if (!brandId) {
      return reply.status(400).send({ error: { code: "brand_required", message: "brandId query param required" } });
    }

    const status = query.status as "active" | "paused" | "draft" | "completed" | undefined;
    const type = query.type as "rebooking" | "birthday" | "winback" | "custom" | undefined;

    const campaigns = await campaignService.listCampaigns(brandId, status, type);
    return reply.send({ data: campaigns });
  });

  // POST /api/v1/campaigns — Create campaign
  server.post("/", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const body = request.body as Record<string, unknown>;
    const { brandId, name, type, template, subject, channel, triggers } = body;

    if (!brandId || !name || !type || !template || !channel) {
      return reply.status(400).send({
        error: { code: "missing_fields", message: "brandId, name, type, template, and channel are required" },
      });
    }

    const campaign = await campaignService.createCampaign({
      brandId: brandId as string,
      name: name as string,
      type: type as "rebooking" | "birthday" | "winback" | "custom",
      template: template as string,
      subject: subject as string | undefined,
      channel: channel as "sms" | "email" | "both",
      triggers: (triggers ?? []) as any[],
    });

    return reply.status(201).send({ data: campaign });
  });

  // GET /api/v1/campaigns/:id — Get campaign detail
  server.get("/:id", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const campaign = await campaignService.getCampaign(id);
    if (!campaign) {
      return reply.status(404).send({ error: { code: "not_found", message: "Campaign not found" } });
    }

    return reply.send({ data: campaign });
  });

  // PUT /api/v1/campaigns/:id — Update campaign
  server.put("/:id", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.type !== undefined) updates.type = body.type;
    if (body.status !== undefined) updates.status = body.status;
    if (body.template !== undefined) updates.template = body.template;
    if (body.subject !== undefined) updates.subject = body.subject;
    if (body.channel !== undefined) updates.channel = body.channel;
    if (body.triggers !== undefined) updates.triggers = body.triggers;

    const campaign = await campaignService.updateCampaign(id, updates as any);
    if (!campaign) {
      return reply.status(404).send({ error: { code: "not_found", message: "Campaign not found" } });
    }

    return reply.send({ data: campaign });
  });

  // GET /api/v1/campaigns/:id/stats — Campaign stats
  server.get("/:id/stats", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const stats = await campaignService.getCampaignStats(id);
    if (!stats) {
      return reply.status(404).send({ error: { code: "not_found", message: "Campaign not found" } });
    }

    return reply.send({ data: stats });
  });

  // GET /api/v1/campaigns/:id/messages — Campaign messages
  server.get("/:id/messages", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as Record<string, string | undefined>;

    // Verify campaign exists
    const campaign = await campaignService.getCampaign(id);
    if (!campaign) {
      return reply.status(404).send({ error: { code: "not_found", message: "Campaign not found" } });
    }

    const status = query.status as any;
    const limit = Math.min(100, parseInt(query.limit ?? "50", 10));
    const offset = parseInt(query.offset ?? "0", 10);

    const messages = await campaignService.getCampaignMessages(id, status, limit, offset);
    return reply.send({ data: messages });
  });
};