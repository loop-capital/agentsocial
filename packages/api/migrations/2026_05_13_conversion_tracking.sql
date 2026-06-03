-- Conversion Tracking Migration
-- Created: 2026-05-13
-- AgentSocial DFY tier: Booking CTA impression/click/booking tracking + source attribution

-- ─── Custom Types ────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "conversion_event_type" AS ENUM(
    'booking_cta_impression',
    'booking_cta_click',
    'booking_form_start',
    'booking_completed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "conversion_source" AS ENUM(
    'organic',
    'chat_widget',
    'gbp',
    'ad',
    'referral'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─── Table: conversion_events ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "conversion_events" (
  "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "brand_id"        uuid NOT NULL,
  "session_id"      text,
  "event_type"      "conversion_event_type" NOT NULL,
  "source"          "conversion_source" NOT NULL DEFAULT 'organic',
  "metadata"        jsonb NOT NULL DEFAULT '{}',
  "created_at"      timestamp with time zone DEFAULT now() NOT NULL
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "conversion_events_brand_id_idx"        ON "conversion_events" ("brand_id");
CREATE INDEX IF NOT EXISTS "conversion_events_event_type_idx"      ON "conversion_events" ("event_type");
CREATE INDEX IF NOT EXISTS "conversion_events_created_at_idx"      ON "conversion_events" ("created_at");
CREATE INDEX IF NOT EXISTS "conversion_events_brand_type_idx"      ON "conversion_events" ("brand_id", "event_type");
CREATE INDEX IF NOT EXISTS "conversion_events_brand_created_idx"   ON "conversion_events" ("brand_id", "created_at");
CREATE INDEX IF NOT EXISTS "conversion_events_session_id_idx"      ON "conversion_events" ("session_id") WHERE "session_id" IS NOT NULL;

-- ─── Foreign Key ─────────────────────────────────────────────────────────────

DO $$ BEGIN
  ALTER TABLE "conversion_events" ADD CONSTRAINT "conversion_events_brand_id_brands_id_fk"
    FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─── Trigger for updated_at (reuse existing function) ─────────────────────────
-- (The update_updated_at_column() function already exists from the GBP migration)