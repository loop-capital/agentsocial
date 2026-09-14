# Manus/Meta Usage Tracking Schema

## Overview
Database schema for tracking Manus (Meta AI) API usage per workspace to enforce free tier limits and implement priority-based routing.

## Tables

### 1. `workspaces`
Stores workspace/business information
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  meta_business_account_id VARCHAR(50),
  meta_phone_number_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. `manus_usage_daily`
Tracks daily API usage per workspace
```sql
CREATE TABLE manus_usage_daily (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  usage_date DATE NOT NULL,
  api_calls INTEGER DEFAULT 0,
  credits_consumed INTEGER DEFAULT 0,
  -- Breakdown by endpoint type for better tracking
  ad_library_calls INTEGER DEFAULT 0,
  audience_insights_calls INTEGER DEFAULT 0,
  business_suite_calls INTEGER DEFAULT 0,
  messaging_calls INTEGER DEFAULT 0,
  -- Quota management
  daily_credit_limit INTEGER DEFAULT 300, -- Free tier: 300 credits/day
  monthly_credit_limit INTEGER DEFAULT 1000, -- Initial free tier bonus
  credits_remaining INTEGER DEFAULT 1300, -- 1000 initial + 300 daily
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE(workspace_id, usage_date)
);
```

### 3. `manus_cache`
Caches frequently requested Manus insights to reduce API calls
```sql
CREATE TABLE manus_cache (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  cache_key VARCHAR(255) NOT NULL, -- e.g., "trends:fitness:us" or "audience:yoga:25-34"
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE(workspace_id, cache_key)
);
```

### 4. `manus_priority_tasks`
Defines which task types get priority access to Manus API
```sql
CREATE TABLE manus_priority_tasks (
  id SERIAL PRIMARY KEY,
  task_type VARCHAR(100) NOT NULL, -- e.g., "trend_scan", "copy_optimization"
  priority_level INTEGER NOT NULL, -- 0 = highest priority (P0), 1 = medium (P1), 2 = low (P2)
  description TEXT,
  estimated_credits INTEGER, -- Estimated credits per call
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample data:
INSERT INTO manus_priority_tasks (task_type, priority_level, description, estimated_credits) VALUES
('trend_scan', 0, 'Scan Meta Ad Library for trending creatives in vertical', 150),
('copy_optimization', 0, 'Optimize ad copy using Meta audience insights', 100),
('audience_insight', 1, 'Get detailed audience demographics and behaviors', 75),
('competitor_analysis', 1, 'Analyze competitor ad performance and targeting', 125),
('campaign_reporting', 2, 'Get performance metrics for running campaigns', 50),
('generic_query', 2, 'General purpose queries to Manus/LLM', 25);
```

## Indexes
```sql
CREATE INDEX idx_manus_usage_daily_workspace_date ON manus_usage_daily(workspace_id, usage_date);
CREATE INDEX idx_manus_cache_workspace_expires ON manus_cache(workspace_id, expires_at);
CREATE INDEX idx_manus_priority_tasks_type ON manus_priority_tasks(task_type);
```

## Usage Logic

### Daily Quota Reset
- At midnight UTC, increment `usage_date` and reset daily counters
- Carry over unused credits? (Optional: allow limited rollover)

### Credit Calculation
- Different API endpoints have different credit costs
- Track actual credits consumed based on Meta's pricing
- Fallback to estimated costs if actual not available

### Priority-Based Routing Logic
1. When a request comes in:
   - Check workspace's daily credits remaining
   - If credits >= estimated cost for task type:
     - Check if task_type is P0 or P1
     - If P0/P1 OR (P2 AND credits > threshold): Route to Manus
     - Else: Route to local LLM fallback
   - Else: Route to local LLM fallback (quota exceeded)

### Cache Strategy
- TTL based on data type:
  - Trending data: 6 hours
  - Audience insights: 12 hours
  - Competitor analysis: 24 hours
  - Business metrics: 1 hour
- Cache key format: `{data_type}:{vertical}:{region}:{params_hash}`

## API Endpoints for Usage Management

### GET `/api/manus/usage/:workspaceId`
Returns today's usage stats for workspace

### POST `/api/manus/usage/:workspaceId/reset`
Resets daily usage (called by cron at midnight)

### GET `/api/manus/cache/:workspaceId/:cacheKey`
Retrieves cached value if not expired

### POST `/api/manus/cache/:workspaceId/:cacheKey`
Stores value with TTL

## Implementation Notes
- Use transactions for usage tracking to prevent race conditions
- Consider adding alerting when usage > 80% of daily limit
- Log all Manus API calls for audit and debugging
- Implement circuit breaker pattern for Manus API failures