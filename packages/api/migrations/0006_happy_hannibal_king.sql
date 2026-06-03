DO $$ BEGIN
 CREATE TYPE "review_feedback_status" AS ENUM('new', 'read', 'replied', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "gemini_job_type" ADD VALUE 'omni_flash_generate';--> statement-breakpoint
ALTER TYPE "gemini_job_type" ADD VALUE 'omni_flash_edit';--> statement-breakpoint
ALTER TABLE "review_requests" ADD COLUMN "feedback_status" "review_feedback_status" DEFAULT 'new';--> statement-breakpoint
ALTER TABLE "review_requests" ADD COLUMN "feedback_phone" text;--> statement-breakpoint
ALTER TABLE "review_requests" ADD COLUMN "reply_text" text;