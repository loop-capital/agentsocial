-- ─── GBP Tables Migration ──────────────────────────────────────────────────────
-- Creates Google Business Profile tables for the DFY marketing service.
-- Safe to run multiple times (IF NOT EXISTS).

-- ─── Enums ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gbp_review_status') THEN
    CREATE TYPE gbp_review_status AS ENUM ('new', 'replied', 'archived');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gbp_post_status') THEN
    CREATE TYPE gbp_post_status AS ENUM ('draft', 'scheduled', 'published', 'failed', 'cancelled');
  END IF;
END $$;

-- ─── GBP Accounts ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gbp_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  google_account_id text NOT NULL,
  display_name text,
  location_id text NOT NULL,
  location_name text,
  address jsonb,
  phone text,
  website_url text,
  primary_category text,
  categories text[],
  hours jsonb,
  photos jsonb,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamp with time zone,
  status text NOT NULL DEFAULT 'active',
  last_synced_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── GBP Reviews ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gbp_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gbp_account_id uuid NOT NULL REFERENCES gbp_accounts(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  external_review_id text NOT NULL,
  reviewer_name text,
  reviewer_photo_url text,
  star_rating integer,
  comment text,
  reply_comment text,
  reply_updated_at timestamp with time zone,
  status gbp_review_status NOT NULL DEFAULT 'new',
  ai_suggested_reply text,
  ai_reply_generated_at timestamp with time zone,
  create_time timestamp with time zone,
  update_time timestamp with time zone,
  fetched_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── GBP Posts ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gbp_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gbp_account_id uuid NOT NULL REFERENCES gbp_accounts(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  external_post_id text,
  title text,
  summary text NOT NULL,
  action_type text,
  action_url text,
  media_urls text[],
  post_type text NOT NULL DEFAULT 'update',
  offer_details jsonb,
  event_details jsonb,
  status gbp_post_status NOT NULL DEFAULT 'draft',
  scheduled_at timestamp with time zone,
  published_at timestamp with time zone,
  external_url text,
  error_message text,
  created_by_user_id uuid REFERENCES users(id),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── GBP Questions ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gbp_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gbp_account_id uuid NOT NULL REFERENCES gbp_accounts(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  external_question_id text NOT NULL,
  author_name text,
  question_text text NOT NULL,
  answer_text text,
  ai_suggested_answer text,
  answer_updated_at timestamp with time zone,
  upvote_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'unanswered',
  create_time timestamp with time zone,
  fetched_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── Review Solicitations ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS review_solicitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  gbp_account_id uuid NOT NULL REFERENCES gbp_accounts(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  client_phone text NOT NULL,
  client_email text,
  message_template text,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamp with time zone,
  opened_at timestamp with time zone,
  clicked_at timestamp with time zone,
  review_received_at timestamp with time zone,
  error_message text,
  created_by_user_id uuid REFERENCES users(id),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS gbp_accounts_brand_id_idx ON gbp_accounts(brand_id);
CREATE INDEX IF NOT EXISTS gbp_accounts_google_account_id_idx ON gbp_accounts(google_account_id);
CREATE INDEX IF NOT EXISTS gbp_accounts_status_idx ON gbp_accounts(status);

CREATE INDEX IF NOT EXISTS gbp_reviews_gbp_account_id_idx ON gbp_reviews(gbp_account_id);
CREATE INDEX IF NOT EXISTS gbp_reviews_brand_id_idx ON gbp_reviews(brand_id);
CREATE INDEX IF NOT EXISTS gbp_reviews_status_idx ON gbp_reviews(status);
CREATE INDEX IF NOT EXISTS gbp_reviews_star_rating_idx ON gbp_reviews(star_rating);
CREATE INDEX IF NOT EXISTS gbp_reviews_external_review_id_idx ON gbp_reviews(external_review_id);

CREATE INDEX IF NOT EXISTS gbp_posts_gbp_account_id_idx ON gbp_posts(gbp_account_id);
CREATE INDEX IF NOT EXISTS gbp_posts_brand_id_idx ON gbp_posts(brand_id);
CREATE INDEX IF NOT EXISTS gbp_posts_status_idx ON gbp_posts(status);
CREATE INDEX IF NOT EXISTS gbp_posts_post_type_idx ON gbp_posts(post_type);

CREATE INDEX IF NOT EXISTS gbp_questions_gbp_account_id_idx ON gbp_questions(gbp_account_id);
CREATE INDEX IF NOT EXISTS gbp_questions_brand_id_idx ON gbp_questions(brand_id);
CREATE INDEX IF NOT EXISTS gbp_questions_status_idx ON gbp_questions(status);

CREATE INDEX IF NOT EXISTS review_solicitations_brand_id_idx ON review_solicitations(brand_id);
CREATE INDEX IF NOT EXISTS review_solicitations_gbp_account_id_idx ON review_solicitations(gbp_account_id);
CREATE INDEX IF NOT EXISTS review_solicitations_status_idx ON review_solicitations(status);