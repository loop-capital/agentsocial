DO $$ BEGIN
 CREATE TYPE "clip_status" AS ENUM('pending', 'transcribing', 'finding_moments', 'rendering', 'complete', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "gbp_post_status" AS ENUM('draft', 'scheduled', 'published', 'failed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "gbp_review_status" AS ENUM('new', 'replied', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "subscription_status" AS ENUM('trialing', 'active', 'past_due', 'canceled', 'inactive');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_source_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"title" text,
	"description" text,
	"start_seconds" integer NOT NULL,
	"end_seconds" integer NOT NULL,
	"duration_seconds" integer NOT NULL,
	"format" text DEFAULT '9:16' NOT NULL,
	"style" text DEFAULT 'opus' NOT NULL,
	"reframe_mode" text,
	"output_url" text,
	"output_path" text,
	"thumbnail_url" text,
	"transcript" jsonb,
	"captions_url" text,
	"why_funny" text,
	"status" "clip_status" DEFAULT 'pending' NOT NULL,
	"render_progress" integer DEFAULT 0,
	"error_message" text,
	"scheduled_for" timestamp with time zone,
	"published_to_channels" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gbp_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"google_account_id" text NOT NULL,
	"display_name" text,
	"location_id" text NOT NULL,
	"location_name" text,
	"address" jsonb,
	"phone" text,
	"website_url" text,
	"primary_category" text,
	"categories" text[],
	"hours" jsonb,
	"photos" jsonb,
	"access_token_encrypted" text,
	"refresh_token_encrypted" text,
	"token_expires_at" timestamp with time zone,
	"status" text DEFAULT 'active' NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gbp_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gbp_account_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"external_post_id" text,
	"title" text,
	"summary" text NOT NULL,
	"action_type" text,
	"action_url" text,
	"media_urls" text[],
	"post_type" text DEFAULT 'update' NOT NULL,
	"offer_details" jsonb,
	"event_details" jsonb,
	"status" "gbp_post_status" DEFAULT 'draft' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"external_url" text,
	"error_message" text,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gbp_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gbp_account_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"external_question_id" text NOT NULL,
	"author_name" text,
	"question_text" text NOT NULL,
	"answer_text" text,
	"ai_suggested_answer" text,
	"answer_updated_at" timestamp with time zone,
	"upvote_count" integer DEFAULT 0,
	"status" text DEFAULT 'unanswered' NOT NULL,
	"create_time" timestamp with time zone,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gbp_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gbp_account_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"external_review_id" text NOT NULL,
	"reviewer_name" text,
	"reviewer_photo_url" text,
	"star_rating" integer,
	"comment" text,
	"reply_comment" text,
	"reply_updated_at" timestamp with time zone,
	"status" "gbp_review_status" DEFAULT 'new' NOT NULL,
	"ai_suggested_reply" text,
	"ai_reply_generated_at" timestamp with time zone,
	"create_time" timestamp with time zone,
	"update_time" timestamp with time zone,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "review_solicitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"gbp_account_id" uuid NOT NULL,
	"client_name" text NOT NULL,
	"client_phone" text NOT NULL,
	"client_email" text,
	"message_template" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"clicked_at" timestamp with time zone,
	"review_received_at" timestamp with time zone,
	"error_message" text,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "video_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text,
	"description" text,
	"source_url" text,
	"source_type" text DEFAULT 'upload' NOT NULL,
	"local_path" text,
	"duration_seconds" integer,
	"transcript" jsonb,
	"status" "clip_status" DEFAULT 'pending' NOT NULL,
	"thumbnail_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "subscription_status" "subscription_status" DEFAULT 'inactive' NOT NULL;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "subscription_plan" text;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "square_customer_id" text;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "square_subscription_id" text;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "trial_ends_at" timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clips" ADD CONSTRAINT "clips_video_source_id_video_sources_id_fk" FOREIGN KEY ("video_source_id") REFERENCES "video_sources"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clips" ADD CONSTRAINT "clips_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gbp_accounts" ADD CONSTRAINT "gbp_accounts_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gbp_posts" ADD CONSTRAINT "gbp_posts_gbp_account_id_gbp_accounts_id_fk" FOREIGN KEY ("gbp_account_id") REFERENCES "gbp_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gbp_posts" ADD CONSTRAINT "gbp_posts_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gbp_posts" ADD CONSTRAINT "gbp_posts_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gbp_questions" ADD CONSTRAINT "gbp_questions_gbp_account_id_gbp_accounts_id_fk" FOREIGN KEY ("gbp_account_id") REFERENCES "gbp_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gbp_questions" ADD CONSTRAINT "gbp_questions_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gbp_reviews" ADD CONSTRAINT "gbp_reviews_gbp_account_id_gbp_accounts_id_fk" FOREIGN KEY ("gbp_account_id") REFERENCES "gbp_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gbp_reviews" ADD CONSTRAINT "gbp_reviews_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "review_solicitations" ADD CONSTRAINT "review_solicitations_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "review_solicitations" ADD CONSTRAINT "review_solicitations_gbp_account_id_gbp_accounts_id_fk" FOREIGN KEY ("gbp_account_id") REFERENCES "gbp_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "review_solicitations" ADD CONSTRAINT "review_solicitations_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "video_sources" ADD CONSTRAINT "video_sources_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "video_sources" ADD CONSTRAINT "video_sources_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
