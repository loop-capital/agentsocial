import "dotenv/config";
import { createHash } from "crypto";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import multipart from "@fastify/multipart";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { serializerCompiler, validatorCompiler, jsonSchemaTransform, ZodTypeProvider } from "fastify-type-provider-zod";
import authPlugin from "./plugins/auth.js";
import { accessControl } from "./plugins/access-control.js";
import { healthRoutes } from "./routes/health.js";
import { legalRoutes } from "./routes/legal.js";
import { authRoutes } from "./routes/auth.js";
import { brandsRoutes } from "./routes/brands.js";
import { channelsRoutes } from "./routes/channels.js";
import { postsRoutes } from "./routes/posts.js";
import { apiKeysRoutes } from "./routes/api-keys.js";
import { commentsRoutes } from "./routes/comments.js";
import { mediaRoutes } from "./routes/media.js";
import { analyticsRoutes } from "./routes/analytics.js";
import { webhooksRoutes } from "./routes/webhooks.js";
import { callbackRoutes } from "./routes/callbacks.js";
import { syncRoutes } from "./routes/sync.js";
import { browserAuthRoutes } from "./routes/browser-auth.js";
import { competitorsRoutes } from "./routes/competitors.js";
import { billingRoutes } from "./routes/billing.js";
import { billingTiersRoutes } from "./routes/billing-tiers.js";
import { clipifyRoutes } from "./routes/clipify.js";
import { gbpRoutes } from "./routes/gbp.js";
import { googleOAuthRoutes } from "./routes/google-oauth.js";
import { campaignRoutes } from "./routes/campaigns.js";
import { twilioWebhookRoutes } from "./routes/twilio-webhooks.js";
import { composioRoutes } from "./routes/composio.js";
import { socialRoutes } from "./routes/social.js";
import { geminiRoutes } from "./routes/gemini.js";
import { generationRoutes } from "./routes/generation.js";
import { generatePostAssetsRoutes } from "./routes/generate-post-assets.js";
import { reviewSentryRoutes } from "./routes/review-sentry.js";
import { clientvetRoutes } from "./routes/clientvet.js";
import { adManagementRoutes } from "./routes/ad-management.js";
import { accountManagerRoutes } from "./routes/account-manager.js";
import { profilesRoutes } from "./routes/profiles.js";
import { landingPagesRoutes } from "./routes/landing-pages.js";
import { subscriptionGuardPlugin } from "./plugins/subscription-guard.js";
import { crmRoutes } from "./routes/crm.js";
import { startWorkers, stopWorkers } from "./workers/index.js";
import { requeueScheduledPosts } from "./queues/requeue.js";
import { ensureGenerationTables, sweepGenerationJobs } from "./services/generation-jobs.js";
import { aiRoutes } from "./routes/ai.js";
import { brandHubRoutes } from "./routes/brand-hub.js";
import { pool } from "./db/index.js";

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
    transport: process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
  },
}).withTypeProvider<ZodTypeProvider>();

// Register Zod-based validation and serialization
server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);

// ─── Plugins ─────────────────────────────────────────────────────────────────

await server.register(cors, {
  origin: [process.env.APP_URL || "http://localhost:3003", "http://localhost:3003", "http://localhost:3001"],
  credentials: true,
});

await server.register(helmet, {
  contentSecurityPolicy: false,
});

await server.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
  // All traffic arrives through the Cloudflare tunnel from 127.0.0.1, so limit
  // per credential, then per real client IP, instead of one shared bucket
  keyGenerator: (request) => {
    const credential = (request.headers["x-api-key"] as string | undefined) ?? request.headers.authorization;
    if (credential) return `cred:${createHash("sha256").update(credential).digest("hex").slice(0, 32)}`;
    const ip = (request.headers["cf-connecting-ip"] as string | undefined)
      ?? (request.headers["x-forwarded-for"] as string | undefined)?.split(",")[0].trim();
    return `ip:${ip ?? request.ip}`;
  },
});

await server.register(multipart, {
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Routes mix Zod schemas and plain JSON Schema; convert only the Zod parts for the spec
const isZod = (s: unknown) => !!s && typeof s === "object" && "_def" in (s as object);
const zodAwareTransform: typeof jsonSchemaTransform = ({ schema, url }) => {
  if (!schema) return { schema, url };
  const zodParts: Record<string, any> = {};
  const plainParts: Record<string, any> = {};
  for (const [k, v] of Object.entries(schema as Record<string, any>)) {
    if (k === "response" && v && typeof v === "object") {
      const zodRes: Record<string, any> = {};
      const plainRes: Record<string, any> = {};
      for (const [code, r] of Object.entries(v)) (isZod(r) ? zodRes : plainRes)[code] = r;
      if (Object.keys(zodRes).length) zodParts.response = zodRes;
      if (Object.keys(plainRes).length) plainParts.response = plainRes;
    } else {
      (isZod(v) ? zodParts : plainParts)[k] = v;
    }
  }
  const converted = jsonSchemaTransform({ schema: zodParts as any, url }).schema as Record<string, any>;
  const response = { ...(plainParts.response ?? {}), ...(converted?.response ?? {}) };
  return {
    schema: { ...plainParts, ...converted, ...(Object.keys(response).length ? { response } : {}) } as any,
    url,
  };
};

await server.register(swagger, {
  openapi: {
    info: {
      title: "AgentSocial API",
      version: "1.0.0",
      description: "Agent-first social media management API",
    },
    // Route paths already include /api/v1, so the server URL is the host root
    servers: [{ url: "/", description: "API v1" }],
    components: {
      securitySchemes: {
        apiKey: { type: "apiKey", in: "header", name: "X-API-Key" },
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    security: [{ apiKey: [] }, { bearerAuth: [] }],
    tags: [
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Brands", description: "Brand management" },
      { name: "Channels", description: "Channel management" },
      { name: "Posts", description: "Post management" },
      { name: "Comments", description: "Comment inbox" },
      { name: "Media", description: "Media uploads" },
      { name: "Analytics", description: "Analytics" },
      { name: "Webhooks", description: "Webhook management" },
      { name: "Clipify", description: "Short-form video repurposing" },
      { name: "Gemini", description: "Multimodal AI generation (text, image, video)" },
      { name: "Generation", description: "muapi image/video generation: async jobs, spend tracking and per-brand budgets. Brand via x-brand-id header or brand_id." },
    ],
  },
  transform: zodAwareTransform,
});

await server.register(swaggerUi, {
  routePrefix: "/docs",
});

await server.register(authPlugin);

// ─── Global Auth Guard ──────────────────────────────────────────────────────
// Protect all routes except explicitly public ones. Entries are path prefixes,
// optionally limited to one method ("GET /profiles"); a trailing "$" means an
// exact path match.
const PUBLIC_PREFIXES = [
  "/auth/register",
  "/auth/login",
  "/health",
  "/clientvet/deposits/webhook", // Square-signed; verified in the handler (fails closed)
  "/webhooks",
  "/browser-auth",
  "/channels/callback",
  "/channels/facebook/callback",
  "/channels/facebook/pages",
  "/channels/facebook/connect-pages",
  "/channels/instagram/callback",
  "/billing/plans",
  "/billing/tiers",
  "/billing/webhook",
  "/docs",
  "/legal",
  "GET /landing-pages/",
  "GET /profiles",
  "GET /review-sentry/business/",
  "POST /review-sentry/rate$",
  "POST /review-sentry/feedback$",
  "/review-sentry/sms/webhook",
  "GET /review-sentry/templates",
  "/twilio/sms",
  "/twilio/sms-status",
  "/twilio/voice",
];

server.addHook("onRequest", async (request, reply) => {
  const fullUrl = request.url.split("?")[0]; // strip query string
  // Normalize: strip /api/v1 prefix for matching
  const path = fullUrl.startsWith("/api/v1") ? fullUrl.slice("/api/v1".length) || "/" : fullUrl;
  const isPublic = PUBLIC_PREFIXES.some((entry) => {
    const [method, pattern] = entry.includes(" ") ? entry.split(" ") : [null, entry];
    if (method && method !== request.method) return false;
    return pattern.endsWith("$") ? path === pattern.slice(0, -1) : path.startsWith(pattern);
  });
  if (isPublic) return;
  // Also allow root / and favicon
  if (path === "/" || path === "/favicon.ico") return;
  // For all other routes, require authentication
  await server.authenticate(request, reply);
});

// Brand ownership + admin-only areas, once auth has set request.userId
server.addHook("preHandler", accessControl);

// ─── Routes ──────────────────────────────────────────────────────────────────

await server.register(legalRoutes);
await server.register(healthRoutes, { prefix: "/api/v1" });
await server.register(authRoutes, { prefix: "/api/v1/auth" });
await server.register(brandsRoutes, { prefix: "/api/v1/brands" });
await server.register(channelsRoutes, { prefix: "/api/v1/channels" });
await server.register(postsRoutes, { prefix: "/api/v1/posts" });
await server.register(apiKeysRoutes, { prefix: "/api/v1/api-keys" });
await server.register(commentsRoutes, { prefix: "/api/v1/comments" });
await server.register(mediaRoutes, { prefix: "/api/v1/media" });
await server.register(analyticsRoutes, { prefix: "/api/v1/analytics" });
await server.register(webhooksRoutes, { prefix: "/api/v1/webhooks" });
await server.register(callbackRoutes, { prefix: "/api/v1" });
await server.register(syncRoutes, { prefix: "/api/v1/sync" });
await server.register(browserAuthRoutes, { prefix: "/api/v1/channels" });
await server.register(competitorsRoutes, { prefix: "/api/v1/competitors" });
await server.register(billingRoutes, { prefix: "/api/v1/billing" });
await server.register(billingTiersRoutes, { prefix: "/api/v1/billing" });
await server.register(clipifyRoutes, { prefix: "/api/v1/clipify" });
await server.register(gbpRoutes, { prefix: "/api/v1/gbp" });
await server.register(googleOAuthRoutes);
await server.register(campaignRoutes, { prefix: "/api/v1/campaigns" });
await server.register(accountManagerRoutes, { prefix: "/api/v1/manager" });
await server.register(profilesRoutes, { prefix: "/api/v1/profiles" });
await server.register(landingPagesRoutes, { prefix: "/api/v1/landing-pages" });
await server.register(twilioWebhookRoutes, { prefix: "/api/v1/twilio" });
await server.register(composioRoutes, { prefix: "/api/v1/composio" });
await server.register(aiRoutes, { prefix: "/api/v1/ai" });
await server.register(brandHubRoutes, { prefix: "/api/v1/hub" });
await server.register(socialRoutes, { prefix: "/api/v1/social" });
await server.register(geminiRoutes, { prefix: "/api/v1/gemini" });
  await server.register(generationRoutes, { prefix: "/api/v1/generate" });
await server.register(generatePostAssetsRoutes, { prefix: "/api/v1/generate" });
await server.register(reviewSentryRoutes, { prefix: "/api/v1/review-sentry" });
await server.register(clientvetRoutes, { prefix: "/api/v1/clientvet" });
await server.register(adManagementRoutes, { prefix: "/api/v1/ad-management" });
await server.register(crmRoutes, { prefix: "/api/v1/crm" });
await server.register(subscriptionGuardPlugin);

// ─── Global Error Handler ───────────────────────────────────────────────────

server.setErrorHandler((error, request, reply) => {
  request.log.error(error);

  if (error.validation) {
    return reply.status(400).send({
      error: {
        code: "validation_error",
        message: "The request failed validation",
        details: error.validation.map((v) => ({
          field: String(v.instancePath || v.params?.missingProperty || "unknown"),
          message: v.message || "Invalid value",
        })),
        request_id: request.id,
      },
    });
  }

  if (error.statusCode) {
    return reply.status(error.statusCode).send({
      error: {
        code: error.code || "request_error",
        message: error.message,
        request_id: request.id,
      },
    });
  }

  return reply.status(500).send({
    error: {
      code: "internal_error",
      message: "Internal server error",
      request_id: request.id,
    },
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

const start = async () => {
  try {
    // ── Run DB migrations (auto-create tables) ─────────────────────────────────
    // Run async — don't block server startup if DB is slow/unreachable
    const migrationPromise = (async () => {
      try {
        await pool.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS voice_profile text`);
        await pool.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS profile jsonb NOT NULL DEFAULT '{}'::jsonb`);
      } catch (e: any) {
        server.log.warn({ err: e.message }, "⚠️ voice_profile migration skipped");
      }
      try {
        await ensureGenerationTables();
        await pool.query(`ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS secret_encrypted text`);
      } catch (e: any) {
        server.log.warn({ err: e.message }, "⚠️ generation jobs migration skipped");
      }
      // New publishing platforms (GBP via Zernio, Pinterest via Composio)
      for (const v of ["gbp", "pinterest"]) {
        try {
          await pool.query(`ALTER TYPE platform ADD VALUE IF NOT EXISTS '${v}'`);
        } catch (e: any) {
          server.log.warn({ err: e.message, value: v }, "⚠️ platform enum migration skipped");
        }
      }
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS competitor_profiles (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            brand_id uuid NOT NULL,
            platform text NOT NULL,
            handle text NOT NULL,
            display_name text,
            avatar_url text,
            bio text,
            follower_count integer DEFAULT 0 NOT NULL,
            following_count integer DEFAULT 0 NOT NULL,
            post_count integer DEFAULT 0 NOT NULL,
            engagement_rate integer,
            profile_url text,
            last_fetched_at timestamp with time zone,
            active boolean DEFAULT true NOT NULL,
            created_at timestamp with time zone DEFAULT now() NOT NULL
          );
        `);
        try {
          await pool.query(`ALTER TABLE competitor_profiles ADD CONSTRAINT fk_competitor_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;`);
        } catch (_e: any) { /* already exists */ }

        await pool.query(`
          CREATE TABLE IF NOT EXISTS competitor_posts (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            profile_id uuid NOT NULL,
            external_id text NOT NULL,
            content text,
            media_urls text[],
            post_type text DEFAULT 'standard' NOT NULL,
            published_at timestamp with time zone,
            likes integer DEFAULT 0 NOT NULL,
            comments integer DEFAULT 0 NOT NULL,
            shares integer DEFAULT 0 NOT NULL,
            views integer DEFAULT 0 NOT NULL,
            engagement_rate integer,
            hashtags text[],
            mentions text[],
            url text,
            fetched_at timestamp with time zone DEFAULT now() NOT NULL,
            created_at timestamp with time zone DEFAULT now() NOT NULL
          );
        `);
        try {
          await pool.query(`ALTER TABLE competitor_posts ADD CONSTRAINT fk_competitor_profile FOREIGN KEY (profile_id) REFERENCES competitor_profiles(id) ON DELETE CASCADE;`);
        } catch (_e2: any) { /* already exists */ }

        await pool.query(`CREATE INDEX IF NOT EXISTS competitor_profiles_brand_id_idx ON competitor_profiles(brand_id);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS competitor_posts_profile_id_idx ON competitor_posts(profile_id);`);

        server.log.info("✅ Competitor tables ensured");
      } catch (migErr: any) {
        server.log.warn({ migErr: migErr.message }, "⚠️ Competitor migration skipped");
      }

      // Add subscription columns to brands table
      try {
        await pool.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS "subscriptionStatus" text DEFAULT 'inactive';`);
        await pool.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS "subscriptionPlan" text DEFAULT 'free';`);
        await pool.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS "squareCustomerId" text;`);
        await pool.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS "squareSubscriptionId" text;`);
        await pool.query(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS "trialEndsAt" timestamp with time zone;`);
        server.log.info("✅ Subscription columns ensured on brands");
      } catch (subErr: any) {
        server.log.warn({ subErr: subErr.message }, "⚠️ Subscription migration skipped");
      }

      // Add clipify tables
      try {
        await pool.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'clip_status') THEN
              CREATE TYPE clip_status AS ENUM ('pending', 'transcribing', 'finding_moments', 'rendering', 'complete', 'failed');
            END IF;
          END $$;
        `);
        await pool.query(`
          CREATE TABLE IF NOT EXISTS video_sources (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            brand_id uuid NOT NULL,
            user_id uuid NOT NULL,
            title text,
            description text,
            source_url text,
            source_type text DEFAULT 'upload' NOT NULL,
            local_path text,
            duration_seconds integer,
            transcript jsonb DEFAULT '{}',
            status text DEFAULT 'pending' NOT NULL,
            thumbnail_url text,
            created_at timestamp with time zone DEFAULT now() NOT NULL,
            updated_at timestamp with time zone DEFAULT now() NOT NULL
          );
        `);
        try {
          await pool.query(`ALTER TABLE video_sources ADD CONSTRAINT fk_video_source_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;`);
        } catch (_e: any) { /* already exists */ }
        await pool.query(`
          CREATE TABLE IF NOT EXISTS clips (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            video_source_id uuid NOT NULL,
            brand_id uuid NOT NULL,
            title text,
            description text,
            start_seconds integer NOT NULL,
            end_seconds integer NOT NULL,
            duration_seconds integer NOT NULL,
            format text DEFAULT '9:16' NOT NULL,
            style text DEFAULT 'opus' NOT NULL,
            reframe_mode text,
            output_url text,
            output_path text,
            thumbnail_url text,
            transcript jsonb DEFAULT '[]',
            captions_url text,
            why_funny text,
            status text DEFAULT 'pending' NOT NULL,
            render_progress integer DEFAULT 0,
            error_message text,
            scheduled_for timestamp with time zone,
            published_to_channels jsonb DEFAULT '[]',
            created_at timestamp with time zone DEFAULT now() NOT NULL,
            updated_at timestamp with time zone DEFAULT now() NOT NULL
          );
        `);
        try {
          await pool.query(`ALTER TABLE clips ADD CONSTRAINT fk_clip_source FOREIGN KEY (video_source_id) REFERENCES video_sources(id) ON DELETE CASCADE;`);
        } catch (_e2: any) { /* already exists */ }
        try {
          await pool.query(`ALTER TABLE clips ADD CONSTRAINT fk_clip_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;`);
        } catch (_e3: any) { /* already exists */ }
        await pool.query(`CREATE INDEX IF NOT EXISTS video_sources_brand_id_idx ON video_sources(brand_id);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS clips_video_source_id_idx ON clips(video_source_id);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS clips_brand_id_idx ON clips(brand_id);`);
        server.log.info("✅ Clipify tables ensured");
      } catch (clipErr: any) {
        server.log.warn({ clipErr: clipErr.message }, "⚠️ Clipify migration skipped");
      }

      // Add Gemini jobs table
      try {
        await pool.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gemini_job_status') THEN
              CREATE TYPE gemini_job_status AS ENUM ('processing', 'complete', 'failed');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gemini_job_type') THEN
              CREATE TYPE gemini_job_type AS ENUM ('text_generate', 'image_generate', 'video_generate', 'video_edit');
            END IF;
          END $$;
        `);
        await pool.query(`
          CREATE TABLE IF NOT EXISTS gemini_jobs (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            brand_id uuid NOT NULL,
            user_id uuid NOT NULL,
            job_type gemini_job_type NOT NULL,
            model text,
            prompt text,
            operation_name text,
            config jsonb DEFAULT '{}',
            result jsonb DEFAULT '{}',
            status gemini_job_status NOT NULL DEFAULT 'processing',
            created_at timestamp with time zone DEFAULT now() NOT NULL
          );
        `);
        try {
          await pool.query(`ALTER TABLE gemini_jobs ADD CONSTRAINT fk_gemini_job_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;`);
        } catch (_e: any) { /* already exists */ }
        try {
          await pool.query(`ALTER TABLE gemini_jobs ADD CONSTRAINT fk_gemini_job_user FOREIGN KEY (user_id) REFERENCES users(id);`);
        } catch (_e2: any) { /* already exists */ }
        await pool.query(`CREATE INDEX IF NOT EXISTS gemini_jobs_brand_id_idx ON gemini_jobs(brand_id);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS gemini_jobs_status_idx ON gemini_jobs(status);`);
        server.log.info("✅ Gemini jobs table ensured");
      } catch (geminiErr: any) {
        server.log.warn({ geminiErr: geminiErr.message }, "⚠️ Gemini migration skipped");
      }
    })();

    const port = parseInt(process.env.PORT || "3001", 10);
    const host = process.env.HOST || "0.0.0.0";
    await server.listen({ port, host });
    server.log.info(`🚀 AgentSocial API running at http://${host}:${port}`);
    server.log.info(`📖 API docs at http://localhost:${port}/docs`);

    // Start BullMQ workers
    startWorkers();

    server.log.info(`✅ BullMQ workers started`);

    // Rebuild scheduled jobs from the database now, then every 5 minutes as a safety net.
    const sweep = async () => {
      try {
        const r = await requeueScheduledPosts();
        if (r.queued || r.missed) server.log.info(r, "🔁 Scheduled posts re-queued");
      } catch (e: any) {
        server.log.warn({ err: e.message }, "⚠️ Scheduled-post re-queue failed");
      }
    };
    void sweep();
    setInterval(sweep, 5 * 60_000).unref();

    // Poll in-flight muapi generation jobs so clients never wait on a request
    setInterval(() => {
      sweepGenerationJobs().catch((e: any) => server.log.warn({ err: e.message }, "⚠️ Generation job sweep failed"));
    }, 10_000).unref();
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  server.log.info("Shutting down...");
  await stopWorkers();
  await server.close();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

start();

export type App = typeof server;
