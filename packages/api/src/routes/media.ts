import type { FastifyInstance } from "fastify";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { db, mediaAssets } from "../db/index.js";

export const mediaRoutes = async (server: FastifyInstance) => {
  // POST /media
  server.post("/", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({
        error: { code: "validation_error", message: "No file uploaded", request_id: request.id },
      });
    }

    const body = request.body as Record<string, string>;
    const brandId = body.brand_id;
    if (!brandId) {
      return reply.status(400).send({
        error: { code: "validation_error", message: "brand_id is required", request_id: request.id },
      });
    }

    // TODO: Upload to R2/S3 and generate thumbnail
    const fileUrl = `https://cdn.agentsocial.co/media/${nanoid()}-${data.filename}`;
    const thumbnailUrl = fileUrl;

    const [asset] = await db.insert(mediaAssets).values({
      brandId,
      uploaderUserId: request.userId!,
      type: data.mimetype.startsWith("video") ? "video" : "image",
      url: fileUrl,
      thumbnailUrl,
      filename: data.filename,
      mimeType: data.mimetype,
      fileSizeBytes: 0,
      processingStatus: "complete",
    }).returning();

    return reply.status(201).send({
      id: asset.id,
      type: asset.type,
      url: asset.url,
      thumbnail_url: asset.thumbnailUrl,
      filename: asset.filename,
      mime_type: asset.mimeType,
      file_size_bytes: asset.fileSizeBytes,
      width: asset.width,
      height: asset.height,
      processing_status: asset.processingStatus,
      created_at: asset.createdAt,
    });
  });

  // GET /media/:id
  server.get("/:id", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);

    if (!asset) {
      return reply.status(404).send({
        error: { code: "resource_not_found", message: "Media not found", request_id: request.id },
      });
    }

    return reply.send({
      id: asset.id,
      type: asset.type,
      url: asset.url,
      thumbnail_url: asset.thumbnailUrl,
      filename: asset.filename,
      mime_type: asset.mimeType,
      processing_status: asset.processingStatus,
      created_at: asset.createdAt,
    });
  });

  // DELETE /media/:id
  server.delete("/:id", {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
    return reply.status(204).send();
  });
};