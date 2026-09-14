# Manus Integration & Meta API Wrapper

## Overview

This module provides:

1. **Meta API Wrapper** — Secure proxy for Meta Graph API with auth, retry logic, and audit logging
2. **Manus Integration** — Priority-based routing (P0/P1 → Manus, P2 → local LLM fallback) with per-workspace credit tracking
3. **Models Lab Integration** — Fallback image generation with queue polling and retry logic

## Setup

### 1. Run Database Migrations

```bash
psql $DATABASE_URL -f schema-manus.sql
```

This creates the following tables:
- `workspaces` — workspace/business information
- `manus_usage_daily` — daily API usage tracking with credit limits
- `manus_cache` — TTL-based cache for frequently requested insights
- `manus_priority_tasks` — priority routing configuration (with sample data)

### 2. Environment Variables

```bash
# Meta API (required for Meta wrapper and Manus)
META_USER_ACCESS_TOKEN=EAAT...

# Database (required for Manus tracking)
DATABASE_URL=postgresql://user:pass@host:5432/db

# Models Lab (optional — for image generation fallback)
MODELSLAB_API_KEY=your_api_key
```

### 3. Restart the server

```bash
node server.js
```

---

## Meta API Wrapper

**Prefix:** `/api/meta`

### `GET /api/meta/:endpoint`
Proxy GET requests to Meta Graph API.

```bash
# Get WhatsApp Business accounts
curl http://localhost:3001/api/meta/me/whatsapp_business_management

# Get phone number info
curl "http://localhost:3001/api/meta/5556350478?fields=id,name"
```

### `POST /api/meta/:endpoint`
Proxy POST requests to Meta Graph API.

```bash
curl -X POST http://localhost:3001/api/meta/5556350478/messages \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "+1234567890",
    "type": "text",
    "text": { "body": "Hello from AgentSocial!" }
  }'
```

### `GET /api/meta/health`
Check Meta API connectivity and token status.

```json
{ "status": "configured", "metaStatus": "connected", "tokenConfigured": true }
```

### `GET /api/meta/admin/log`
Returns last 50 audit log entries (admin use).

---

## Manus Integration

**Prefix:** `/api/manus`

### Priority Levels

| Level | Task Types | Routing |
|-------|-----------|---------|
| P0 | `trend_scan`, `copy_optimization` | Manus preferred |
| P1 | `audience_insight`, `competitor_analysis` | Manus if credits > threshold |
| P2 | `campaign_reporting`, `generic_query` | Local LLM fallback |

### Credit Limits (Free Tier)

- **Daily:** 300 credits
- **Monthly bonus:** 1000 credits
- **Total available:** 1300 credits

### `POST /api/manus/trend-scan` (P0)

Scan Meta Ad Library for trending creatives.

```bash
curl -X POST http://localhost:3001/api/manus/trend-scan \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "00000000-0000-0000-0000-000000000001",
    "vertical": "fitness",
    "region": "US",
    "dateRange": "30"
  }'
```

**Response:**
```json
{
  "trends": [...],
  "source": "manus",
  "creditsUsed": 150,
  "cached": false
}
```

### `POST /api/manus/copy-optimization` (P0)

Optimize ad copy using Meta audience insights.

```bash
curl -X POST http://localhost:3001/api/manus/copy-optimization \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "00000000-0000-0000-0000-000000000001",
    "currentCopy": "Lose weight fast with our new program!",
    "targetAudience": "women 25-40 interested in health",
    "goal": "conversions"
  }'
```

### `GET /api/manus/usage/:workspaceId`

Returns today's usage stats.

```json
{
  "workspaceId": "00000000-0000-0000-0000-000000000001",
  "date": "2026-04-18",
  "apiCalls": 5,
  "creditsConsumed": 450,
  "creditsRemaining": 850,
  "dailyLimit": 300,
  "monthlyLimit": 1000,
  "usagePercent": 35
}
```

### `POST /api/manus/usage/:workspaceId/reset`

Manually reset daily counters (or call from external cron).

### Cache Endpoints

- `GET /api/manus/cache/:workspaceId/:cacheKey` — retrieve cached value
- `DELETE /api/manus/cache/:workspaceId/:cacheKey` — invalidate cache entry
- `POST /api/manus/cache/clean` — delete expired entries
- `POST /api/manus/daily-reset` — trigger midnight reset manually

---

## Models Lab Integration

**Prefix:** `/api/modelslab`

### `POST /api/modelslab/imagine`

Generate images from text prompts.

```bash
curl -X POST http://localhost:3001/api/modelslab/imagine \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A fitness influencer doing yoga at sunrise",
    "negative_prompt": "blurry, watermark, low quality",
    "width": 1024,
    "height": 1024,
    "num_images": 2,
    "style": "realistic"
  }'
```

**Response (completed):**
```json
{
  "images": ["https://..."],
  "status": "completed",
  "jobId": "abc123"
}
```

**Response (queued — long generation):**
```json
{
  "status": "queued",
  "jobId": "abc123",
  "message": "Job submitted. Poll GET /api/modelslab/job/:jobId for results.",
  "estimatedWait": "30-60s"
}
```

### `GET /api/modelslab/job/:jobId`

Poll status of a queued job.

### `GET /api/modelslab/health`

Check Models Lab API connectivity.

---

## Background Jobs

A background timer runs automatically when `DATABASE_URL` is set:

- **Midnight UTC:** Resets daily counters for all workspaces + cleans expired cache
- **Every 6 hours:** Cleans expired cache entries

---

## Adding New Priority Tasks

Insert into `manus_priority_tasks`:

```sql
INSERT INTO manus_priority_tasks (task_type, priority_level, description, estimated_credits)
VALUES ('my_new_task', 1, 'Description of task', 80);
```

The `determineRoute()` function in `routes/manus.js` handles routing automatically based on priority level and available credits.
