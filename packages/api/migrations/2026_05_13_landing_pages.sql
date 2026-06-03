-- Landing Pages Migration
-- Created: 2026-05-13
-- AgentSocial DFY tier: Ad landing pages hosted on getuplook.com subdomains

-- ─── Table: landing_pages ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "landing_pages" (
  "id"                              uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "brand_id"                        uuid NOT NULL,
  "slug"                             text NOT NULL,
  "title"                            text NOT NULL,
  "template_type"                    varchar(50) NOT NULL DEFAULT 'salon_promo',
  "headline"                         text NOT NULL,
  "subheadline"                      text,
  "offer_text"                       text,
  "original_price"                   text,
  "sale_price"                       text,
  "cta_text"                         text NOT NULL DEFAULT 'Book Now',
  "cta_url"                          text,
  "business_name"                    text NOT NULL,
  "business_category"                text,
  "phone"                            text,
  "address"                          text,
  "reviews"                          jsonb NOT NULL DEFAULT '[]',
  "features"                         jsonb NOT NULL DEFAULT '[]',
  "urgency_type"                     varchar(50),
  "urgency_config"                   jsonb DEFAULT '{}',
  "is_published"                     boolean NOT NULL DEFAULT false,
  "published_at"                     timestamp with time zone,
  "conversion_tracking_enabled"     boolean NOT NULL DEFAULT true,
  "created_at"                       timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at"                       timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS "landing_pages_slug_idx"           ON "landing_pages" ("slug");
CREATE INDEX IF NOT EXISTS "landing_pages_brand_id_idx"             ON "landing_pages" ("brand_id");
CREATE INDEX IF NOT EXISTS "landing_pages_is_published_idx"          ON "landing_pages" ("is_published");
CREATE INDEX IF NOT EXISTS "landing_pages_template_type_idx"         ON "landing_pages" ("template_type");
CREATE INDEX IF NOT EXISTS "landing_pages_brand_published_idx"      ON "landing_pages" ("brand_id", "is_published");

-- ─── Foreign Key ─────────────────────────────────────────────────────────────

DO $$ BEGIN
  ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_brand_id_brands_id_fk"
    FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─── Trigger for updated_at ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION "update_updated_at_column"()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updated_at" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER "landing_pages_updated_at_trigger"
    BEFORE UPDATE ON "landing_pages"
    FOR EACH ROW
    EXECUTE FUNCTION "update_updated_at_column"();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;