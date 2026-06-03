DO $$ BEGIN
 CREATE TYPE "conversion_event_type" AS ENUM('booking_cta_impression', 'booking_cta_click', 'booking_form_start', 'booking_completed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "conversion_source" AS ENUM('organic', 'chat_widget', 'gbp', 'ad', 'referral');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "gemini_job_status" AS ENUM('processing', 'complete', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "gemini_job_type" AS ENUM('text_generate', 'image_generate', 'video_generate', 'video_edit');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "landing_page_template" AS ENUM('salon_promo', 'new_client', 'service_highlight');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "landing_page_urgency" AS ENUM('countdown', 'limited_spots', 'seasonal');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"sender" text NOT NULL,
	"content" text NOT NULL,
	"message_type" text DEFAULT 'text' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversion_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"session_id" text,
	"event_type" "conversion_event_type" NOT NULL,
	"source" "conversion_source" DEFAULT 'organic' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gemini_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"job_type" "gemini_job_type" NOT NULL,
	"model" text,
	"prompt" text,
	"operation_name" text,
	"config" jsonb DEFAULT '{}'::jsonb,
	"result" jsonb DEFAULT '{}'::jsonb,
	"status" "gemini_job_status" DEFAULT 'processing' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE "gbp_reviews" ADD COLUMN "flag_reason" text;--> statement-breakpoint
ALTER TABLE "gbp_reviews" ADD COLUMN "flag_details" text;--> statement-breakpoint
ALTER TABLE "gbp_reviews" ADD COLUMN "flag_status" text;--> statement-breakpoint
ALTER TABLE "gbp_reviews" ADD COLUMN "flagged_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "gbp_reviews" ADD COLUMN "escalated_to_google" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "gbp_reviews" ADD COLUMN "escalation_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "gbp_reviews" ADD COLUMN "support_ticket_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_followups" ADD CONSTRAINT "chat_followups_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_followups" ADD CONSTRAINT "chat_followups_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_widget_configs" ADD CONSTRAINT "chat_widget_configs_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversion_events" ADD CONSTRAINT "conversion_events_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gemini_jobs" ADD CONSTRAINT "gemini_jobs_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gemini_jobs" ADD CONSTRAINT "gemini_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profiles" ADD CONSTRAINT "profiles_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
