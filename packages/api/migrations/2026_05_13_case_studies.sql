-- Case Studies table for GetUpLook business success stories
-- Migration: 2026_05_13_case_studies.sql

CREATE TABLE IF NOT EXISTS case_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  category TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'Starter',
  before_metrics JSONB NOT NULL DEFAULT '{}',
  after_metrics JSONB NOT NULL DEFAULT '{}',
  testimonial JSONB DEFAULT '{}',
  features JSONB DEFAULT '[]',
  photos JSONB DEFAULT '[]',
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_case_studies_slug ON case_studies (slug);
CREATE INDEX IF NOT EXISTS idx_case_studies_category ON case_studies (category);
CREATE INDEX IF NOT EXISTS idx_case_studies_published ON case_studies (is_published) WHERE is_published = true;