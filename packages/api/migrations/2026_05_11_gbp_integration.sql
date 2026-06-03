-- Google Business Profile Integration Migration
-- Created: 2026-05-11
-- AgentSocial Pro / Elite tier feature

-- ─── Custom Types ────────────────────────────────────────────────────────────

DO $$ BEGIN
 CREATE TYPE "gbp_account_status" AS ENUM('active', 'disconnected', 'error');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "gbp_post_status" AS ENUM('draft', 'published', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "gbp_post_type" AS ENUM('offer', 'event', 'update');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "review_sentiment" AS ENUM('positive', 'neutral', 'negative');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "review_response_source" AS ENUM('ai', 'manual');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "solicitation_status" AS ENUM('pending', 'sent', 'responded', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- ─── Table: gbp_accounts ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "gbp_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"google_account_email" text NOT NULL,
	"gbp_location_id" text NOT NULL,
	"gbp_location_name" text,
	"access_token_encrypted" text,
	"refresh_token_encrypted" text,
	"token_expires_at" timestamp with time zone,
	"status" "gbp_account_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "gbp_accounts_brand_id_idx" ON "gbp_accounts" ("brand_id");
CREATE INDEX IF NOT EXISTS "gbp_accounts_status_idx" ON "gbp_accounts" ("status");
CREATE INDEX IF NOT EXISTS "gbp_accounts_gbp_location_id_idx" ON "gbp_accounts" ("gbp_location_id");

DO $$ BEGIN
 ALTER TABLE "gbp_accounts" ADD CONSTRAINT "gbp_accounts_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- ─── Table: gbp_reviews ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "gbp_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"gbp_account_id" uuid NOT NULL,
	"review_id" text NOT NULL,
	"reviewer_name" text NOT NULL,
	"reviewer_photo_url" text,
	"rating" integer NOT NULL,
	"comment" text,
	"review_date" timestamp with time zone NOT NULL,
	"response_text" text,
	"responded_at" timestamp with time zone,
	"responded_by" "review_response_source",
	"sentiment" "review_sentiment",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "gbp_reviews_brand_id_idx" ON "gbp_reviews" ("brand_id");
CREATE INDEX IF NOT EXISTS "gbp_reviews_gbp_account_id_idx" ON "gbp_reviews" ("gbp_account_id");
CREATE INDEX IF NOT EXISTS "gbp_reviews_review_date_idx" ON "gbp_reviews" ("review_date" DESC);
CREATE INDEX IF NOT EXISTS "gbp_reviews_rating_idx" ON "gbp_reviews" ("rating");
CREATE INDEX IF NOT EXISTS "gbp_reviews_sentiment_idx" ON "gbp_reviews" ("sentiment");
CREATE UNIQUE INDEX IF NOT EXISTS "gbp_reviews_review_id_unique" ON "gbp_reviews" ("review_id");

DO $$ BEGIN
 ALTER TABLE "gbp_reviews" ADD CONSTRAINT "gbp_reviews_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "gbp_reviews" ADD CONSTRAINT "gbp_reviews_gbp_account_id_gbp_accounts_id_fk" FOREIGN KEY ("gbp_account_id") REFERENCES "gbp_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- ─── Table: gbp_posts ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "gbp_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"gbp_account_id" uuid NOT NULL,
	"post_type" "gbp_post_type" NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"media_urls" text[],
	"call_to_action" text,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"status" "gbp_post_status" DEFAULT 'draft' NOT NULL,
	"google_post_id" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "gbp_posts_brand_id_idx" ON "gbp_posts" ("brand_id");
CREATE INDEX IF NOT EXISTS "gbp_posts_gbp_account_id_idx" ON "gbp_posts" ("gbp_account_id");
CREATE INDEX IF NOT EXISTS "gbp_posts_status_idx" ON "gbp_posts" ("status");
CREATE INDEX IF NOT EXISTS "gbp_posts_post_type_idx" ON "gbp_posts" ("post_type");
CREATE INDEX IF NOT EXISTS "gbp_posts_scheduled_idx" ON "gbp_posts" ("start_date") WHERE "status" = 'draft';

DO $$ BEGIN
 ALTER TABLE "gbp_posts" ADD CONSTRAINT "gbp_posts_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "gbp_posts" ADD CONSTRAINT "gbp_posts_gbp_account_id_gbp_accounts_id_fk" FOREIGN KEY ("gbp_account_id") REFERENCES "gbp_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- ─── Table: gbp_qa ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "gbp_qa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"gbp_account_id" uuid NOT NULL,
	"question_id" text NOT NULL,
	"question_text" text NOT NULL,
	"asked_by" text,
	"asked_at" timestamp with time zone NOT NULL,
	"answer_text" text,
	"answered_at" timestamp with time zone,
	"answered_by" "review_response_source",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "gbp_qa_brand_id_idx" ON "gbp_qa" ("brand_id");
CREATE INDEX IF NOT EXISTS "gbp_qa_gbp_account_id_idx" ON "gbp_qa" ("gbp_account_id");
CREATE INDEX IF NOT EXISTS "gbp_qa_asked_at_idx" ON "gbp_qa" ("asked_at" DESC);
CREATE INDEX IF NOT EXISTS "gbp_qa_answered_at_idx" ON "gbp_qa" ("answered_at") WHERE "answered_at" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "gbp_qa_question_id_unique" ON "gbp_qa" ("question_id");

DO $$ BEGIN
 ALTER TABLE "gbp_qa" ADD CONSTRAINT "gbp_qa_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "gbp_qa" ADD CONSTRAINT "gbp_qa_gbp_account_id_gbp_accounts_id_fk" FOREIGN KEY ("gbp_account_id") REFERENCES "gbp_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- ─── Table: review_solicitations ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "review_solicitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"client_name" text NOT NULL,
	"client_phone" text,
	"client_email" text,
	"appointment_date" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"status" "solicitation_status" DEFAULT 'pending' NOT NULL,
	"message_template" text,
	"google_review_link" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "review_solicitations_brand_id_idx" ON "review_solicitations" ("brand_id");
CREATE INDEX IF NOT EXISTS "review_solicitations_status_idx" ON "review_solicitations" ("status");
CREATE INDEX IF NOT EXISTS "review_solicitations_appointment_date_idx" ON "review_solicitations" ("appointment_date");
CREATE INDEX IF NOT EXISTS "review_solicitations_pending_idx" ON "review_solicitations" ("created_at") WHERE "status" = 'pending';

DO $$ BEGIN
 ALTER TABLE "review_solicitations" ADD CONSTRAINT "review_solicitations_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- ─── Triggers for updated_at ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_gbp_accounts_updated_at ON "gbp_accounts";
CREATE TRIGGER update_gbp_accounts_updated_at
    BEFORE UPDATE ON "gbp_accounts"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
