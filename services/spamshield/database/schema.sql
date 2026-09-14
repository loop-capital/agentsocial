-- SpamShield Database Schema
-- Tables specific to the blocking service
-- Integrates with SpamCapture tables (spam_reports, pattern_groups, etc.)

-- ============================================
-- 1. MANUAL OVERRIDES (admin block/allow decisions)
-- ============================================
CREATE TABLE IF NOT EXISTS spamshield_overrides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL UNIQUE,
  decision TEXT NOT NULL CHECK (decision IN ('block', 'allow')),
  reason TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_overrides_phone ON spamshield_overrides (phone_number);
CREATE INDEX IF NOT EXISTS idx_overrides_expires ON spamshield_overrides (expires_at) WHERE expires_at IS NOT NULL;

-- ============================================
-- 2. CHECK LOGS (API usage analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS spamshield_check_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  risk_score INTEGER,
  risk_level TEXT,
  recommendation TEXT,
  action TEXT,
  api_key_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_check_logs_created ON spamshield_check_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_check_logs_phone ON spamshield_check_logs (phone_number);
CREATE INDEX IF NOT EXISTS idx_check_logs_api_key ON spamshield_check_logs (api_key_id);

-- ============================================
-- 3. API KEYS (for tracking usage by client)
-- ============================================
CREATE TABLE IF NOT EXISTS spamshield_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tier TEXT DEFAULT 'basic' CHECK (tier IN ('basic', 'premium', 'enterprise')),
  rate_limit INTEGER DEFAULT 100,
  allowed_ips INET[],
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================
-- 4. CACHE INVALIDATION LOG
-- ============================================
CREATE TABLE IF NOT EXISTS spamshield_cache_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('invalidate', 'refresh', 'warm')),
  triggered_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cache_events_phone ON spamshield_cache_events (phone_number);
CREATE INDEX IF NOT EXISTS idx_cache_events_created ON spamshield_cache_events (created_at DESC);

-- ============================================
-- 5. AGGREGATED NUMBER STATS (materialized view helper)
-- ============================================
CREATE TABLE IF NOT EXISTS spamshield_number_stats (
  phone_number TEXT PRIMARY KEY,
  total_reports INTEGER DEFAULT 0,
  recent_reports INTEGER DEFAULT 0, -- Last 30 days
  unique_victims INTEGER DEFAULT 0,
  pattern_groups INTEGER DEFAULT 0,
  first_seen TIMESTAMPTZ,
  last_seen TIMESTAMPTZ,
  report_types TEXT[],
  attorney_matches INTEGER DEFAULT 0,
  false_positive_reports INTEGER DEFAULT 0,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  cache_expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour'
);

CREATE INDEX IF NOT EXISTS idx_number_stats_expires ON spamshield_number_stats (cache_expires_at);

-- ============================================
-- 6. USAGE STATS (hourly aggregation)
-- ============================================
CREATE TABLE IF NOT EXISTS spamshield_usage_hourly (
  hour TIMESTAMPTZ PRIMARY KEY,
  total_checks INTEGER DEFAULT 0,
  unique_numbers INTEGER DEFAULT 0,
  cache_hits INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER,
  critical_count INTEGER DEFAULT 0,
  high_count INTEGER DEFAULT 0,
  medium_count INTEGER DEFAULT 0,
  low_count INTEGER DEFAULT 0
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
DROP TRIGGER IF EXISTS tr_overrides_updated ON spamshield_overrides;
CREATE TRIGGER tr_overrides_updated
  BEFORE UPDATE ON spamshield_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to refresh number stats (can be called by intelligence refresh)
CREATE OR REPLACE FUNCTION refresh_number_stats(target_phone TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
  INSERT INTO spamshield_number_stats (
    phone_number, total_reports, recent_reports, unique_victims,
    pattern_groups, first_seen, last_seen, report_types, attorney_matches,
    false_positive_reports, calculated_at, cache_expires_at
  )
  SELECT 
    sender_phone as phone_number,
    COUNT(*) as total_reports,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_reports,
    COUNT(DISTINCT reporter_phone) as unique_victims,
    COUNT(DISTINCT pattern_group_id) as pattern_groups,
    MIN(created_at) as first_seen,
    MAX(created_at) as last_seen,
    array_agg(DISTINCT unnested_violation_type) as report_types,
    COUNT(DISTINCT CASE WHEN attorney_id IS NOT NULL THEN attorney_id END) as attorney_matches,
    COUNT(CASE WHEN status = 'dismissed' THEN 1 END) as false_positive_reports,
    NOW() as calculated_at,
    NOW() + INTERVAL '1 hour' as cache_expires_at
  FROM spam_reports,
  LATERAL unnest(COALESCE(violation_type, ARRAY[]::text[])) as unnested_violation_type
  WHERE target_phone IS NULL OR sender_phone = target_phone
  GROUP BY sender_phone
  ON CONFLICT (phone_number) DO UPDATE SET
    total_reports = EXCLUDED.total_reports,
    recent_reports = EXCLUDED.recent_reports,
    unique_victims = EXCLUDED.unique_victims,
    pattern_groups = EXCLUDED.pattern_groups,
    first_seen = EXCLUDED.first_seen,
    last_seen = EXCLUDED.last_seen,
    report_types = EXCLUDED.report_types,
    attorney_matches = EXCLUDED.attorney_matches,
    false_positive_reports = EXCLUDED.false_positive_reports,
    calculated_at = EXCLUDED.calculated_at,
    cache_expires_at = EXCLUDED.cache_expires_at;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GRANT PERMISSIONS (adjust as needed)
-- ============================================
-- GRANT SELECT, INSERT, UPDATE ON spamshield_overrides TO spamshield_app;
-- GRANT SELECT, INSERT ON spamshield_check_logs TO spamshield_app;
-- GRANT SELECT ON spamshield_api_keys TO spamshield_app;
-- GRANT SELECT, INSERT, UPDATE ON spamshield_number_stats TO spamshield_app;