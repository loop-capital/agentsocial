-- ============================================================
-- Manus/Meta Usage Tracking Schema
-- For AgentSocial platform
-- ============================================================

-- Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  meta_business_account_id VARCHAR(50),
  meta_phone_number_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Manus Usage Daily — tracks per-workspace daily API usage
CREATE TABLE IF NOT EXISTS manus_usage_daily (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  api_calls INTEGER DEFAULT 0,
  credits_consumed INTEGER DEFAULT 0,
  ad_library_calls INTEGER DEFAULT 0,
  audience_insights_calls INTEGER DEFAULT 0,
  business_suite_calls INTEGER DEFAULT 0,
  messaging_calls INTEGER DEFAULT 0,
  daily_credit_limit INTEGER DEFAULT 300,
  monthly_credit_limit INTEGER DEFAULT 1000,
  credits_remaining INTEGER DEFAULT 1300,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE(workspace_id, usage_date)
);

-- Manus Cache — TTL-based cache for frequently accessed insights
CREATE TABLE IF NOT EXISTS manus_cache (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  cache_key VARCHAR(255) NOT NULL,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE(workspace_id, cache_key)
);

-- Manus Priority Tasks — defines task types and their priority routing
CREATE TABLE IF NOT EXISTS manus_priority_tasks (
  id SERIAL PRIMARY KEY,
  task_type VARCHAR(100) NOT NULL UNIQUE,
  priority_level INTEGER NOT NULL CHECK (priority_level BETWEEN 0 AND 2),
  description TEXT,
  estimated_credits INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_manus_usage_daily_workspace_date ON manus_usage_daily(workspace_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_manus_cache_workspace_expires ON manus_cache(workspace_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_manus_cache_expires ON manus_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_manus_priority_tasks_type ON manus_priority_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_manus_priority_tasks_active ON manus_priority_tasks(is_active) WHERE is_active = TRUE;

-- ============================================================
-- Sample Data: Priority Tasks
-- ============================================================
INSERT INTO manus_priority_tasks (task_type, priority_level, description, estimated_credits) VALUES
  ('trend_scan',        0, 'Scan Meta Ad Library for trending creatives in vertical', 150),
  ('copy_optimization', 0, 'Optimize ad copy using Meta audience insights', 100),
  ('audience_insight',  1, 'Get detailed audience demographics and behaviors', 75),
  ('competitor_analysis', 1, 'Analyze competitor ad performance and targeting', 125),
  ('campaign_reporting', 2, 'Get performance metrics for running campaigns', 50),
  ('generic_query',     2, 'General purpose queries to Manus/LLM', 25)
ON CONFLICT (task_type) DO NOTHING;

-- ============================================================
-- Sample Data: Test Workspace
-- ============================================================
INSERT INTO workspaces (id, name, meta_business_account_id, meta_phone_number_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Demo Workspace', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
