DO $$ BEGIN
 CREATE TYPE "review_campaign_status" AS ENUM('active', 'paused', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "review_removal_status" AS ENUM('flagged', 'escalated', 'removed', 'denied', 'closed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "review_request_status" AS ENUM('sent', 'opened', 'rated', 'redirected', 'feedback_submitted');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "review_violation_type" AS ENUM('spam', 'fake', 'conflict_of_interest', 'off_topic', 'harassment', 'hate_speech', 'personal_info', 'defamation', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "review_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"google_place_id" text NOT NULL,
	"google_review_url" text,
	"primary_color" text DEFAULT '#4F46E5',
	"logo_url" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_campaigns_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "review_removal_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"review_url" text NOT NULL,
	"review_text" text,
	"review_author" text,
	"review_rating" integer,
	"violation_type" "review_violation_type" NOT NULL,
	"evidence_notes" text,
	"escalation_notes" text,
	"status" "review_removal_status" DEFAULT 'flagged' NOT NULL,
	"flagged_at" timestamp with time zone DEFAULT now() NOT NULL,
	"escalated_at" timestamp with time zone,
	"removed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "review_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"customer_name" text,
	"customer_phone" text,
	"customer_email" text,
	"appointment_date" timestamp with time zone,
	"token" text,
	"status" "review_request_status" DEFAULT 'sent' NOT NULL,
	"rating" integer,
	"redirected_to" text,
	"feedback" text,
	"feedback_name" text,
	"feedback_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"opened_at" timestamp with time zone,
	"rated_at" timestamp with time zone,
	"responded_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "review_campaigns" ADD CONSTRAINT "review_campaigns_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "review_removal_cases" ADD CONSTRAINT "review_removal_cases_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_campaign_id_review_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "review_campaigns"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
