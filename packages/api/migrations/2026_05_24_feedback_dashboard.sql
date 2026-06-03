-- Feedback dashboard: add feedback_status and reply_text to review_requests
-- This enables the negative feedback inbox with status tracking and reply capability

-- Add feedback_status enum type
CREATE TYPE review_feedback_status AS ENUM ('new', 'read', 'replied', 'archived');

-- Add feedback_status column (nullable, only applies to feedback_submitted rows)
ALTER TABLE review_requests ADD COLUMN IF NOT EXISTS feedback_status review_feedback_status DEFAULT 'new';

-- Add reply_text column for merchant replies to feedback
ALTER TABLE review_requests ADD COLUMN IF NOT EXISTS reply_text text;

-- Add feedback_phone column (customers may leave phone on feedback form)
ALTER TABLE review_requests ADD COLUMN IF NOT EXISTS feedback_phone text;

-- Create index for fast feedback listing queries
CREATE INDEX IF NOT EXISTS idx_review_requests_feedback_status ON review_requests (feedback_status) WHERE status = 'feedback_submitted';
CREATE INDEX IF NOT EXISTS idx_review_requests_feedback_created ON review_requests (created_at DESC) WHERE status = 'feedback_submitted';