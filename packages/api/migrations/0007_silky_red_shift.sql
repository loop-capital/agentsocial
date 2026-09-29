DO $$ BEGIN
 CREATE TYPE "crm_conflict_resolution" AS ENUM('local_wins', 'remote_wins', 'merge', 'manual');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "crm_provider" AS ENUM('gohighlevel', 'square');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "crm_sync_direction" AS ENUM('bidirectional', 'push_only', 'pull_only');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "crm_sync_status" AS ENUM('pending', 'syncing', 'completed', 'failed', 'paused');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"email" text,
	"phone" text,
	"first_name" text,
	"last_name" text,
	"tags" text[],
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"source" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crm_contact_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"crm_provider_id" uuid NOT NULL,
	"agent_social_contact_id" uuid NOT NULL,
	"crm_contact_id" text NOT NULL,
	"crm_external_id" text,
	"match_email" text,
	"match_phone" text,
	"last_synced_at" timestamp with time zone,
	"sync_status" "crm_sync_status" DEFAULT 'pending' NOT NULL,
	"conflict_resolution" "crm_conflict_resolution" DEFAULT 'remote_wins' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crm_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"provider" "crm_provider" NOT NULL,
	"access_token_encrypted" text,
	"refresh_token_encrypted" text,
	"token_expires_at" timestamp with time zone,
	"external_account_id" text,
	"external_company_id" text,
	"sync_direction" "crm_sync_direction" DEFAULT 'bidirectional' NOT NULL,
	"sync_enabled" boolean DEFAULT false NOT NULL,
	"webhook_enabled" boolean DEFAULT false NOT NULL,
	"webhook_url" text,
	"webhook_secret" text,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crm_sync_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"crm_provider_id" uuid NOT NULL,
	"job_id" text NOT NULL,
	"type" text NOT NULL,
	"direction" "crm_sync_direction" NOT NULL,
	"status" "crm_sync_status" DEFAULT 'pending' NOT NULL,
	"total_records" integer DEFAULT 0 NOT NULL,
	"processed_records" integer DEFAULT 0 NOT NULL,
	"failed_records" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crm_sync_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"crm_provider_id" uuid NOT NULL,
	"sync_job_id" uuid,
	"contact_mapping_id" uuid,
	"action" text NOT NULL,
	"direction" text NOT NULL,
	"result" text NOT NULL,
	"request_data" jsonb,
	"response_data" jsonb,
	"error_message" text,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crm_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"crm_provider_id" uuid NOT NULL,
	"external_event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"signature" text,
	"verified" boolean DEFAULT false NOT NULL,
	"processed" boolean DEFAULT false NOT NULL,
	"processing_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contacts" ADD CONSTRAINT "contacts_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crm_contact_mappings" ADD CONSTRAINT "crm_contact_mappings_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crm_contact_mappings" ADD CONSTRAINT "crm_contact_mappings_crm_provider_id_crm_providers_id_fk" FOREIGN KEY ("crm_provider_id") REFERENCES "crm_providers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crm_providers" ADD CONSTRAINT "crm_providers_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crm_sync_jobs" ADD CONSTRAINT "crm_sync_jobs_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crm_sync_jobs" ADD CONSTRAINT "crm_sync_jobs_crm_provider_id_crm_providers_id_fk" FOREIGN KEY ("crm_provider_id") REFERENCES "crm_providers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crm_sync_logs" ADD CONSTRAINT "crm_sync_logs_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crm_sync_logs" ADD CONSTRAINT "crm_sync_logs_crm_provider_id_crm_providers_id_fk" FOREIGN KEY ("crm_provider_id") REFERENCES "crm_providers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crm_sync_logs" ADD CONSTRAINT "crm_sync_logs_sync_job_id_crm_sync_jobs_id_fk" FOREIGN KEY ("sync_job_id") REFERENCES "crm_sync_jobs"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crm_sync_logs" ADD CONSTRAINT "crm_sync_logs_contact_mapping_id_crm_contact_mappings_id_fk" FOREIGN KEY ("contact_mapping_id") REFERENCES "crm_contact_mappings"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crm_webhook_events" ADD CONSTRAINT "crm_webhook_events_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crm_webhook_events" ADD CONSTRAINT "crm_webhook_events_crm_provider_id_crm_providers_id_fk" FOREIGN KEY ("crm_provider_id") REFERENCES "crm_providers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
