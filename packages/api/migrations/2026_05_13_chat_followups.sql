-- Chat Follow-ups Migration
-- Created: 2026-05-13
-- AgentSocial DFY tier: SMS follow-up automation after chat sessions

-- ─── Custom Types ────────────────────────────────────────────────────────────

DO $$ BEGIN
 CREATE TYPE "chat_followup_status" AS ENUM('pending', 'sent', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- ─── Table: chat_followups ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "chat_followups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"phone" text NOT NULL,
	"message_template" text NOT NULL,
	"status" "chat_followup_status" DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "chat_followups_brand_id_idx" ON "chat_followups" ("brand_id");
CREATE INDEX IF NOT EXISTS "chat_followups_session_id_idx" ON "chat_followups" ("session_id");
CREATE INDEX IF NOT EXISTS "chat_followups_status_idx" ON "chat_followups" ("status");
CREATE INDEX IF NOT EXISTS "chat_followups_pending_idx" ON "chat_followups" ("created_at") WHERE "status" = 'pending';

DO $$ BEGIN
 ALTER TABLE "chat_followups" ADD CONSTRAINT "chat_followups_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- ─── Table: chat_sessions ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"widget_id" text NOT NULL,
	"brand_id" uuid NOT NULL,
	"visitor_name" text,
	"visitor_phone" text,
	"visitor_email" text,
	"status" text NOT NULL DEFAULT 'active',
	"lead_captured" boolean NOT NULL DEFAULT false,
	"source" text NOT NULL DEFAULT 'web',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "chat_sessions_brand_id_idx" ON "chat_sessions" ("brand_id");
CREATE INDEX IF NOT EXISTS "chat_sessions_status_idx" ON "chat_sessions" ("status");
CREATE INDEX IF NOT EXISTS "chat_sessions_created_at_idx" ON "chat_sessions" ("created_at" DESC);

DO $$ BEGIN
 ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- ─── Table: chat_messages ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"sender" text NOT NULL,
	"content" text NOT NULL,
	"message_type" text NOT NULL DEFAULT 'text',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "chat_messages_session_id_idx" ON "chat_messages" ("session_id");
CREATE INDEX IF NOT EXISTS "chat_messages_created_at_idx" ON "chat_messages" ("created_at" DESC);

DO $$ BEGIN
 ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- ─── Table: chat_widget_configs ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "chat_widget_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL UNIQUE,
	"brand_color" text NOT NULL DEFAULT '#4F46E5',
	"greeting_message" text NOT NULL DEFAULT 'Hi there! 👋 How can we help you today?',
	"position" text NOT NULL DEFAULT 'bottom-right',
	"enabled" boolean NOT NULL DEFAULT true,
	"auto_response_enabled" boolean NOT NULL DEFAULT true,
	"auto_response_message" text NOT NULL DEFAULT '',
	"business_hours_start" text NOT NULL DEFAULT '09:00',
	"business_hours_end" text NOT NULL DEFAULT '19:00',
	"timezone" text NOT NULL DEFAULT 'America/New_York',
	"sms_followup_enabled" boolean NOT NULL DEFAULT false,
	"sms_followup_delay_minutes" integer NOT NULL DEFAULT 30,
	"sms_followup_template" text NOT NULL DEFAULT '',
	"powered_by_text" text NOT NULL DEFAULT 'Powered by GetUpLook',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "chat_widget_configs_brand_id_idx" ON "chat_widget_configs" ("brand_id");

DO $$ BEGIN
 ALTER TABLE "chat_widget_configs" ADD CONSTRAINT "chat_widget_configs_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- ─── Triggers for updated_at ─────────────────────────────────────────────────

DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON "chat_sessions";
CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON "chat_sessions"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_widget_configs_updated_at ON "chat_widget_configs";
CREATE TRIGGER update_chat_widget_configs_updated_at
    BEFORE UPDATE ON "chat_widget_configs"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();