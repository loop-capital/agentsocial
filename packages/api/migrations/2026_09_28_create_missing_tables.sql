DO $$ BEGIN
 CREATE TYPE "conversion_event_type" AS ENUM('booking_cta_impression', 'booking_cta_click', 'booking_form_start', 'booking_completed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
;

DO $$ BEGIN
 CREATE TYPE "conversion_source" AS ENUM('organic', 'chat_widget', 'gbp', 'ad', 'referral');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
;

DO $$ BEGIN
 CREATE TYPE "landing_page_template" AS ENUM('salon_promo', 'new_client', 'service_highlight');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
;

DO $$ BEGIN
 CREATE TYPE "landing_page_urgency" AS ENUM('countdown', 'limited_spots', 'seasonal');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
;

DO $$ BEGIN
 CREATE TYPE "crm_conflict_resolution" AS ENUM('local_wins', 'remote_wins', 'merge', 'manual');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
;

DO $$ BEGIN
 CREATE TYPE "crm_provider" AS ENUM('gohighlevel', 'square');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
;

DO $$ BEGIN
 CREATE TYPE "crm_sync_direction" AS ENUM('bidirectional', 'push_only', 'pull_only');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
;

DO $$ BEGIN
 CREATE TYPE "crm_sync_status" AS ENUM('pending', 'syncing', 'completed', 'failed', 'paused');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
;

CREATE TABLE IF NOT EXISTS "chat_followups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"phone" text NOT NULL,
	"message_template" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
;

CREATE TABLE IF NOT EXISTS "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"sender" text NOT NULL,
	"content" text NOT NULL,
	"message_type" text DEFAULT 'text' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
;

CREATE TABLE IF NOT EXISTS "chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"widget_id" text NOT NULL,
	"brand_id" uuid NOT NULL,
	"visitor_name" text,
	"visitor_phone" text,
	"visitor_email" text,
	"status" text DEFAULT 'active' NOT NULL,
	"lead_captured" boolean DEFAULT false NOT NULL,
	"source" text DEFAULT 'web' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
;

CREATE TABLE IF NOT EXISTS "chat_widget_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"brand_color" text DEFAULT '#4F46E5' NOT NULL,
	"greeting_message" text DEFAULT 'Hi there! 👋 How can we help you today?' NOT NULL,
	"position" text DEFAULT 'bottom-right' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"auto_response_enabled" boolean DEFAULT true NOT NULL,
	"auto_response_message" text DEFAULT '' NOT NULL,
	"business_hours_start" text DEFAULT '09:00' NOT NULL,
	"business_hours_end" text DEFAULT '19:00' NOT NULL,
	"timezone" text DEFAULT 'America/New_York' NOT NULL,
	"sms_followup_enabled" boolean DEFAULT false NOT NULL,
	"sms_followup_delay_minutes" integer DEFAULT 30 NOT NULL,
	"sms_followup_template" text DEFAULT '' NOT NULL,
	"powered_by_text" text DEFAULT 'Powered by GetUpLook' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
;

CREATE TABLE IF NOT EXISTS "conversion_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"session_id" text,
	"event_type" "conversion_event_type" NOT NULL,
	"source" "conversion_source" DEFAULT 'organic' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
;

CREATE TABLE IF NOT EXISTS "landing_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"template_type" "landing_page_template" DEFAULT 'salon_promo' NOT NULL,
	"headline" text NOT NULL,
	"subheadline" text,
	"offer_text" text,
	"original_price" text,
	"sale_price" text,
	"cta_text" text DEFAULT 'Book Now' NOT NULL,
	"cta_url" text,
	"business_name" text NOT NULL,
	"business_category" text,
	"phone" text,
	"address" text,
	"reviews" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"urgency_type" "landing_page_urgency",
	"urgency_config" jsonb DEFAULT '{}'::jsonb,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"conversion_tracking_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "landing_pages_slug_unique" UNIQUE("slug")
);
;

CREATE TABLE IF NOT EXISTS "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"business_name" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"phone" text,
	"email" text,
	"website_url" text,
	"address" text,
	"city" text,
	"state" text,
	"zip" text,
	"latitude" integer,
	"longitude" integer,
	"hours" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"services" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rating_avg" integer DEFAULT 0,
	"review_count" integer DEFAULT 0,
	"theme" text DEFAULT 'modern' NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_slug_unique" UNIQUE("slug")
);
;

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
;

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
;

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
;

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
;

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
;

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
;

DO $$ BEGIN
 ALTER TABLE "chat_followups" ADD CONSTRAINT "chat_followups_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
;

DO $$ BEGIN
 ALTER TABLE "chat_followups" ADD CONSTRAINT "chat_followups_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
;

DO $$ BEGIN
 ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
;

DO $$ BEGIN
 ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
;

DO $$ BEGIN
 ALTER TABLE "chat_widget_configs" ADD CONSTRAINT "chat_widget_configs_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
;

DO $$ BEGIN
 ALTER TABLE "conversion_events" ADD CONSTRAINT "conversion_events_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
;

DO $$ BEGIN
 ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
;

DO $$ BEGIN
 ALTER TABLE "profiles" ADD CONSTRAINT "profiles_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
;

DO $$ BEGIN
 ALTER TABLE "contacts" ADD CONSTRAINT "contacts_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
;

DO $$ BEGIN
 ALTER TABLE "crm_contact_mappings" ADD CONSTRAINT "crm_contact_mappings_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
;

DO $$ BEGIN
 ALTER TABLE "crm_contact_mappings" ADD CONSTRAINT "crm_contact_mappings_crm_provider_id_crm_providers_id_fk" FOREIGN KEY ("crm_provider_id") REFERENCES "crm_providers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
;

DO $$ BEGIN
 ALTER TABLE "crm_providers" ADD CONSTRAINT "crm_providers_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
;

DO $$ BEGIN
 ALTER TABLE "crm_sync_jobs" ADD CONSTRAINT "crm_sync_jobs_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
;

DO $$ BEGIN
 ALTER TABLE "crm_sync_jobs" ADD CONSTRAINT "crm_sync_jobs_crm_provider_id_crm_providers_id_fk" FOREIGN KEY ("crm_provider_id") REFERENCES "crm_providers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
;

DO $$ BEGIN
 ALTER TABLE "crm_sync_logs" ADD CONSTRAINT "crm_sync_logs_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
;

DO $$ BEGIN
 ALTER TABLE "crm_sync_logs" ADD CONSTRAINT "crm_sync_logs_crm_provider_id_crm_providers_id_fk" FOREIGN KEY ("crm_provider_id") REFERENCES "crm_providers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
;

DO $$ BEGIN
 ALTER TABLE "crm_sync_logs" ADD CONSTRAINT "crm_sync_logs_sync_job_id_crm_sync_jobs_id_fk" FOREIGN KEY ("sync_job_id") REFERENCES "crm_sync_jobs"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
;

DO $$ BEGIN
 ALTER TABLE "crm_sync_logs" ADD CONSTRAINT "crm_sync_logs_contact_mapping_id_crm_contact_mappings_id_fk" FOREIGN KEY ("contact_mapping_id") REFERENCES "crm_contact_mappings"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
;

DO $$ BEGIN
 ALTER TABLE "crm_webhook_events" ADD CONSTRAINT "crm_webhook_events_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
;

DO $$ BEGIN
 ALTER TABLE "crm_webhook_events" ADD CONSTRAINT "crm_webhook_events_crm_provider_id_crm_providers_id_fk" FOREIGN KEY ("crm_provider_id") REFERENCES "crm_providers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
;
