DO $$ BEGIN
 CREATE TYPE "client_flag_type" AS ENUM('no_show', 'late_cancel', 'negative_review', 'review_extortion', 'chargeback', 'refund_abuse', 'product_return_fraud', 'free_service_extraction', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "risk_level" AS ENUM('low', 'medium', 'high', 'fraud');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_flag_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_flag_id" uuid NOT NULL,
	"flag_type" "client_flag_type" NOT NULL,
	"description" text,
	"evidence" jsonb DEFAULT '{}'::jsonb,
	"appointment_id" uuid,
	"flagged_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_private_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_flag_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"note" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_risk_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"phone" text,
	"email" text,
	"full_name" text,
	"risk_level" "risk_level" DEFAULT 'low' NOT NULL,
	"no_show_count" integer DEFAULT 0 NOT NULL,
	"negative_review_count" integer DEFAULT 0 NOT NULL,
	"chargeback_count" integer DEFAULT 0 NOT NULL,
	"refund_count" integer DEFAULT 0 NOT NULL,
	"product_return_fraud_count" integer DEFAULT 0 NOT NULL,
	"review_extortion_count" integer DEFAULT 0 NOT NULL,
	"free_service_extraction_count" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"flagged_by" uuid,
	"last_flag_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deposit_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"client_flag_id" uuid,
	"square_payment_id" text,
	"square_order_id" text,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"risk_level_at_payment" "risk_level",
	"deposit_percent" integer,
	"converted_to_credit_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deposit_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"risk_level" "risk_level" NOT NULL,
	"deposit_percent" integer NOT NULL,
	"require_prepayment" boolean DEFAULT false NOT NULL,
	"allow_booking" boolean DEFAULT true NOT NULL,
	"credit_only" boolean DEFAULT false NOT NULL,
	"no_product_sales" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "review_campaigns" ADD COLUMN "sms_template_id" text DEFAULT 'thank_you';--> statement-breakpoint
ALTER TABLE "review_campaigns" ADD COLUMN "auto_send_delay_hours" integer DEFAULT 2;--> statement-breakpoint
ALTER TABLE "review_campaigns" ADD COLUMN "max_reminders" integer DEFAULT 2;--> statement-breakpoint
ALTER TABLE "review_requests" ADD COLUMN "sms_status" text;--> statement-breakpoint
ALTER TABLE "review_requests" ADD COLUMN "sms_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "review_requests" ADD COLUMN "sms_delivered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "review_requests" ADD COLUMN "sms_message_sid" text;--> statement-breakpoint
ALTER TABLE "review_requests" ADD COLUMN "reminder_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "review_requests" ADD COLUMN "last_reminder_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "review_requests" ADD COLUMN "opted_out" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "review_requests" ADD COLUMN "opted_out_at" timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_flag_events" ADD CONSTRAINT "client_flag_events_client_flag_id_client_risk_flags_id_fk" FOREIGN KEY ("client_flag_id") REFERENCES "client_risk_flags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_flag_events" ADD CONSTRAINT "client_flag_events_flagged_by_users_id_fk" FOREIGN KEY ("flagged_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_private_notes" ADD CONSTRAINT "client_private_notes_client_flag_id_client_risk_flags_id_fk" FOREIGN KEY ("client_flag_id") REFERENCES "client_risk_flags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_private_notes" ADD CONSTRAINT "client_private_notes_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_private_notes" ADD CONSTRAINT "client_private_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_risk_flags" ADD CONSTRAINT "client_risk_flags_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_risk_flags" ADD CONSTRAINT "client_risk_flags_flagged_by_users_id_fk" FOREIGN KEY ("flagged_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deposit_payments" ADD CONSTRAINT "deposit_payments_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deposit_payments" ADD CONSTRAINT "deposit_payments_client_flag_id_client_risk_flags_id_fk" FOREIGN KEY ("client_flag_id") REFERENCES "client_risk_flags"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deposit_requirements" ADD CONSTRAINT "deposit_requirements_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
