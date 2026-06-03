import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/index.js";
import { clips, videoSources } from "../db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { processVideoSource, renderClip, findClipCandidates, parseTranscript } from "../services/clipify.js";
import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const createSourceSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  sourceType: z.enum(["upload", "youtube", "podcast", "url"]).default("upload"),
  language: z.string().default("en"),
  maxClips: z.number().min(1).max(20).default(5),
  formats: z.array(z.enum(["9:16", "16:9", "1:1"])).default(["9:16"]),
  style: z.enum(["opus", "karaoke", "minimal"]).default("opus"),
  reframeMode: z.enum(["pan", "split-screen", "center-crop"]).default("center-crop"),
});

const renderClipSchema = z.object({
  format: z.enum(["9:16", "16:9", "1:1"]).optional(),
  style: z.enum(["opus", "karaoke", "minimal"]).optional(),
  reframeMode: z.enum(["pan", "split-screen", "center-crop"]).optional(),
  language: z.string().optional(),
});

export async function clipifyRoutes(server: FastifyInstance) {
  // ─── Create video source + start processing ─────────────────────────────
  server.post("/sources", {
    schema: {
      tags: ["Clipify"],
      description: "Create a new video source and start processing",
      body: createSourceSchema,
      response: {
        201: z.object({
          source: z.object({
            id: z.string(),
            title: z.string().nullable(),
            status: z.string(),
            sourceUrl: z.string().nullable(),
            sourceType: z.string(),
            createdAt: z.string(),
          }),
          message: z.string(),
        }),
      },
    },
  }, async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.status(401).send({ error: "Authentication required" });
    const brandId = request.headers["x-brand-id"] as string;
    if (!brandId) return reply.status(400).send({ error: "Brand ID required" });

    const body = createSourceSchema.parse(request.body);

    // Create source record
    const [source] = await db.insert(videoSources).values({
      brandId,
      userId,
      title: body.title,
      description: body.description,
      sourceUrl: body.sourceUrl,
      sourceType: body.sourceType,
      status: "pending",
    }).returning();

    // Start processing in background if URL provided
    if (body.sourceUrl) {
      processVideoSource(source.id, brandId, body.sourceUrl, {
        title: body.title,
        description: body.description,
        formats: body.formats,
        style: body.style,
        reframeMode: body.reframeMode,
        language: body.language,
        maxClips: body.maxClips,
      }).catch((err) => {
        server.log.error({ err, sourceId: source.id }, "Clipify processing failed");
      });
    }

    return reply.status(201).send({
      source: {
        id: source.id,
        title: source.title,
        status: source.status,
        sourceUrl: source.sourceUrl,
        sourceType: source.sourceType,
        createdAt: source.createdAt.toISOString(),
      },
      message: body.sourceUrl
        ? "Video source created and processing started"
        : "Video source created. Upload video file to /sources/:id/upload",
    });
  });

  // ─── Upload video file ────────────────────────────────────────────────────
  server.post("/sources/:id/upload", {
    schema: {
      tags: ["Clipify"],
      description: "Upload a video file for processing",
    },
  }, async (request, reply) => {
    const user = request.user;
    const { id } = request.params as { id: string };
    const brandId = request.headers["x-brand-id"] as string;

    const source = await db.select().from(videoSources)
      .where(and(eq(videoSources.id, id), eq(videoSources.brandId, brandId)))
      .then((r) => r[0]);

    if (!source) return reply.status(404).send({ error: "Source not found" });

    const data = await request.file();
    if (!data) return reply.status(400).send({ error: "No file uploaded" });

    const workDir = `/tmp/clipify/${brandId}/${id}`;
    await fs.promises.mkdir(workDir, { recursive: true });
    const videoPath = path.join(workDir, "source.mp4");

    const buffer = await data.toBuffer();
    await fs.promises.writeFile(videoPath, buffer);

    await db.update(videoSources)
      .set({ localPath: videoPath, status: "transcribing" })
      .where(eq(videoSources.id, id));

    // Start processing
    const options = request.body as any || {};
    processVideoSource(id, brandId, videoPath, {
      title: source.title || undefined,
      formats: options.formats || ["9:16"],
      style: options.style || "opus",
      reframeMode: options.reframeMode || "center-crop",
      language: options.language || "en",
      maxClips: options.maxClips || 5,
    }).catch((err) => {
      server.log.error({ err, sourceId: id }, "Clipify processing failed");
    });

    return reply.send({
      message: "Upload received and processing started",
      sourceId: id,
    });
  });

  // ─── List video sources ─────────────────────────────────────────────────
  server.get("/sources", {
    schema: {
      tags: ["Clipify"],
      description: "List all video sources for brand",
    },
  }, async (request, reply) => {
    const brandId = request.headers["x-brand-id"] as string;
    if (!brandId) return reply.status(400).send({ error: "Brand ID required" });

    const sources = await db.select()
      .from(videoSources)
      .where(eq(videoSources.brandId, brandId))
      .orderBy(desc(videoSources.createdAt));

    return sources.map((s) => ({
      id: s.id,
      title: s.title,
      status: s.status,
      sourceType: s.sourceType,
      sourceUrl: s.sourceUrl,
      durationSeconds: s.durationSeconds,
      thumbnailUrl: s.thumbnailUrl,
      createdAt: s.createdAt.toISOString(),
    }));
  });

  // ─── Get video source with clips ──────────────────────────────────────────
  server.get("/sources/:id", {
    schema: {
      tags: ["Clipify"],
      description: "Get video source details and generated clips",
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const brandId = request.headers["x-brand-id"] as string;

    const source = await db.select().from(videoSources)
      .where(and(eq(videoSources.id, id), eq(videoSources.brandId, brandId)))
      .then((r) => r[0]);

    if (!source) return reply.status(404).send({ error: "Source not found" });

    const sourceClips = await db.select().from(clips)
      .where(eq(clips.videoSourceId, id))
      .orderBy(clips.startSeconds);

    return {
      source: {
        id: source.id,
        title: source.title,
        description: source.description,
        status: source.status,
        sourceType: source.sourceType,
        sourceUrl: source.sourceUrl,
        durationSeconds: source.durationSeconds,
        transcript: source.transcript,
        thumbnailUrl: source.thumbnailUrl,
        createdAt: source.createdAt.toISOString(),
      },
      clips: sourceClips.map((c) => ({
        id: c.id,
        title: c.title,
        startSeconds: c.startSeconds,
        endSeconds: c.endSeconds,
        durationSeconds: c.durationSeconds,
        format: c.format,
        style: c.style,
        reframeMode: c.reframeMode,
        whyFunny: c.whyFunny,
        status: c.status,
        outputUrl: c.outputUrl,
        thumbnailUrl: c.thumbnailUrl,
        transcript: c.transcript,
        createdAt: c.createdAt.toISOString(),
      })),
    };
  });

  // ─── Delete video source ─────────────────────────────────────────────────
  server.delete("/sources/:id", {
    schema: {
      tags: ["Clipify"],
      description: "Delete video source and all clips",
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const brandId = request.headers["x-brand-id"] as string;

    const source = await db.select().from(videoSources)
      .where(and(eq(videoSources.id, id), eq(videoSources.brandId, brandId)))
      .then((r) => r[0]);

    if (!source) return reply.status(404).send({ error: "Source not found" });

    // Clean up files
    try {
      const workDir = `/tmp/clipify/${brandId}/${id}`;
      await fs.promises.rm(workDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }

    // DB cascade will delete clips
    await db.delete(videoSources).where(eq(videoSources.id, id));

    return { message: "Video source deleted" };
  });

  // ─── List clips ───────────────────────────────────────────────────────────
  server.get("/clips", {
    schema: {
      tags: ["Clipify"],
      description: "List all clips for brand",
    },
  }, async (request, reply) => {
    const brandId = request.headers["x-brand-id"] as string;
    if (!brandId) return reply.status(400).send({ error: "Brand ID required" });

    const brandClips = await db.select()
      .from(clips)
      .where(eq(clips.brandId, brandId))
      .orderBy(desc(clips.createdAt));

    return brandClips.map((c) => ({
      id: c.id,
      title: c.title,
      videoSourceId: c.videoSourceId,
      startSeconds: c.startSeconds,
      endSeconds: c.endSeconds,
      durationSeconds: c.durationSeconds,
      format: c.format,
      style: c.style,
      whyFunny: c.whyFunny,
      status: c.status,
      outputUrl: c.outputUrl,
      thumbnailUrl: c.thumbnailUrl,
      createdAt: c.createdAt.toISOString(),
    }));
  });

  // ─── Get single clip ────────────────────────────────────────────────────
  server.get("/clips/:id", {
    schema: {
      tags: ["Clipify"],
      description: "Get clip details",
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const brandId = request.headers["x-brand-id"] as string;

    const clip = await db.select().from(clips)
      .where(and(eq(clips.id, id), eq(clips.brandId, brandId)))
      .then((r) => r[0]);

    if (!clip) return reply.status(404).send({ error: "Clip not found" });

    return {
      id: clip.id,
      title: clip.title,
      description: clip.description,
      startSeconds: clip.startSeconds,
      endSeconds: clip.endSeconds,
      durationSeconds: clip.durationSeconds,
      format: clip.format,
      style: clip.style,
      reframeMode: clip.reframeMode,
      whyFunny: clip.whyFunny,
      status: clip.status,
      outputUrl: clip.outputUrl,
      outputPath: clip.outputPath,
      thumbnailUrl: clip.thumbnailUrl,
      transcript: clip.transcript,
      captionsUrl: clip.captionsUrl,
      createdAt: clip.createdAt.toISOString(),
    };
  });

  // ─── Re-render clip with different settings ─────────────────────────────
  server.post("/clips/:id/render", {
    schema: {
      tags: ["Clipify"],
      description: "Re-render a clip with new settings",
      body: renderClipSchema,
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const brandId = request.headers["x-brand-id"] as string;

    const clip = await db.select().from(clips)
      .where(and(eq(clips.id, id), eq(clips.brandId, brandId)))
      .then((r) => r[0]);

    if (!clip) return reply.status(404).send({ error: "Clip not found" });

    const options = renderClipSchema.parse(request.body);

    // Start render in background
    renderClip(id, options).catch((err) => {
      server.log.error({ err, clipId: id }, "Clip render failed");
    });

    return {
      message: "Clip rendering started",
      clipId: id,
      status: "rendering",
    };
  });

  // ─── Stream clip video ──────────────────────────────────────────────────
  server.get("/clips/:id/video", {
    schema: {
      tags: ["Clipify"],
      description: "Stream clip video file",
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const brandId = request.headers["x-brand-id"] as string;

    const clip = await db.select().from(clips)
      .where(and(eq(clips.id, id), eq(clips.brandId, brandId)))
      .then((r) => r[0]);

    if (!clip || !clip.outputPath) {
      return reply.status(404).send({ error: "Clip video not found" });
    }

    if (!fs.existsSync(clip.outputPath)) {
      return reply.status(404).send({ error: "Clip file not found on disk" });
    }

    const stat = fs.statSync(clip.outputPath);
    reply.header("Content-Type", "video/mp4");
    reply.header("Content-Length", stat.size);
    reply.header("Content-Disposition", `inline; filename="${clip.title || "clip"}.mp4"`);

    const stream = fs.createReadStream(clip.outputPath);
    return reply.send(stream);
  });

  // ─── Delete clip ────────────────────────────────────────────────────────
  server.delete("/clips/:id", {
    schema: {
      tags: ["Clipify"],
      description: "Delete a clip",
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const brandId = request.headers["x-brand-id"] as string;

    const clip = await db.select().from(clips)
      .where(and(eq(clips.id, id), eq(clips.brandId, brandId)))
      .then((r) => r[0]);

    if (!clip) return reply.status(404).send({ error: "Clip not found" });

    // Clean up files
    try {
      if (clip.outputPath) {
        await fs.promises.rm(path.dirname(clip.outputPath), { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup errors
    }

    await db.delete(clips).where(eq(clips.id, id));
    return { message: "Clip deleted" };
  });

  // ─── Get clip transcript ─────────────────────────────────────────────────
  server.get("/clips/:id/transcript", {
    schema: {
      tags: ["Clipify"],
      description: "Get clip transcript with word timestamps",
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const brandId = request.headers["x-brand-id"] as string;

    const clip = await db.select().from(clips)
      .where(and(eq(clips.id, id), eq(clips.brandId, brandId)))
      .then((r) => r[0]);

    if (!clip) return reply.status(404).send({ error: "Clip not found" });

    return {
      transcript: clip.transcript,
      clip: {
        id: clip.id,
        title: clip.title,
        startSeconds: clip.startSeconds,
        endSeconds: clip.endSeconds,
      },
    };
  });
}
