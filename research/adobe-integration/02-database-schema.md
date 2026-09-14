# Adobe Creative Cloud Integration — Database Schema
## Asset Management & Adobe Integration Data Model

**Date:** 2026-05-03  
**Status:** Draft  
**Purpose:** Define database schema for storing Adobe-generated assets, licenses, API credentials, and integration metadata

---

## Entity Relationship Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   adobe_configs │     │  adobe_assets    │     │ asset_licenses  │
├─────────────────┤     ├──────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)          │     │ id (PK)         │
│ org_id (FK)     │────▶│ org_id (FK)      │◄────│ asset_id (FK)   │
│ client_id       │     │ user_id (FK)     │     │ user_id (FK)    │
│ client_secret   │     │ project_id (FK)  │     │ license_type    │
│ scopes          │     │ source           │     │ adobe_license_id│
│ is_active       │     │ adobe_asset_id   │     │ purchased_at    │
│ created_at      │     │ asset_type       │     │ cost_credits    │
│ updated_at      │     │ url              │     │ status          │
└─────────────────┘     │ thumbnail_url    │     │ expires_at      │
                        │ metadata         │     │ created_at      │
┌─────────────────┐     │ prompt           │     └─────────────────┘
│  asset_tags       │     │ style_preset     │
├─────────────────┤     │ credits_consumed │     ┌─────────────────┐
│ id (PK)         │     │ status           │     │ generation_jobs │
│ asset_id (FK)   │◄────│ storage_path     │     ├─────────────────┤
│ tag             │     │ width            │     │ id (PK)         │
│ confidence      │     │ height           │     │ asset_id (FK)   │◄──
│ created_at      │     │ file_size        │     │ job_type        │
└─────────────────┘     │ mime_type        │     │ status          │
                        │ is_licensed      │     │ adobe_job_id    │
┌─────────────────┐     │ is_public        │     │ request_payload │
│  api_usage_logs   │     │ created_at       │     │ response_data   │
├─────────────────┤     │ updated_at       │     │ started_at      │
│ id (PK)         │     └──────────────────┘     │ completed_at    │
│ org_id (FK)     │           │                  │ error_message   │
│ user_id (FK)    │           │                  │ retry_count       │
│ api_endpoint    │           │                  │ created_at        │
│ request_type    │           │                  │ updated_at        │
│ credits_used    │           │                  └─────────────────┘
│ status_code     │           │
│ response_time_ms│           │                  ┌─────────────────┐
│ error_message   │           │                  │ express_projects  │
│ created_at      │           │                  ├─────────────────┤
└─────────────────┘           │                  │ id (PK)         │
                              │                  │ org_id (FK)     │
┌─────────────────┐           │                  │ user_id (FK)    │
│  stock_searches   │         │                  │ name            │
├─────────────────┤           │                  │ template_id     │
│ id (PK)         │           │                  │ adobe_project_id│
│ user_id (FK)    │           │                  │ data_json       │
│ query           │           │                  │ status          │
│ filters         │           │                  │ created_at      │
│ results_count   │           │                  │ updated_at      │
│ created_at      │           │                  └─────────────────┘
└─────────────────┘           │
                              │
                        ┌──────────────────┐
                        │  organizations   │
                        ├──────────────────┤
                        │ id (PK)          │
                        │ name             │
                        │ adobe_org_id     │
                        │ plan_type        │
                        │ credits_balance  │
                        │ credits_used     │
                        │ monthly_limit    │
                        │ billing_status   │
                        │ created_at       │
                        │ updated_at       │
                        └──────────────────┘
```

---

## 1. adobe_configs — Adobe API Credentials

Stores OAuth credentials for Adobe API access per organization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| org_id | UUID | FOREIGN KEY → organizations.id | Organization reference |
| name | VARCHAR(255) | NOT NULL | Config name (e.g., "Production Firefly") |
| client_id | VARCHAR(255) | NOT NULL, ENCRYPTED | Adobe Client ID |
| client_secret | TEXT | NOT NULL, ENCRYPTED | Adobe Client Secret |
| scopes | TEXT[] | NOT NULL | Granted scopes array |
| access_token | TEXT | ENCRYPTED | Current access token |
| refresh_token | TEXT | ENCRYPTED | Refresh token (if applicable) |
| token_expires_at | TIMESTAMP | | Access token expiry |
| ims_host | VARCHAR(255) | DEFAULT 'ims-na1.adobelogin.com' | Adobe IMS host |
| api_key | VARCHAR(255) | | x-api-key header value |
| is_active | BOOLEAN | DEFAULT true | Whether config is active |
| last_used_at | TIMESTAMP | | Last API call timestamp |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_adobe_configs_org_id` on `org_id`
- `idx_adobe_configs_is_active` on `is_active`

---

## 2. organizations — Organization Adobe Integration

Extended organization table with Adobe-specific fields.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Organization name |
| slug | VARCHAR(255) | UNIQUE, NOT NULL | URL-friendly identifier |
| adobe_org_id | VARCHAR(255) | | Adobe organization ID (from Admin Console) |
| plan_type | ENUM | | 'free', 'starter', 'pro', 'enterprise' |
| credits_balance | INTEGER | DEFAULT 0 | Remaining generative credits |
| credits_used | INTEGER | DEFAULT 0 | Total credits consumed |
| monthly_limit | INTEGER | DEFAULT 0 | Monthly credit allocation |
| credits_reset_at | TIMESTAMP | | Next credit reset date |
| billing_status | ENUM | DEFAULT 'active' | 'active', 'suspended', 'cancelled' |
| overage_enabled | BOOLEAN | DEFAULT false | Allow usage beyond limit |
| storage_quota_mb | INTEGER | DEFAULT 10240 | Storage quota in MB |
| storage_used_mb | INTEGER | DEFAULT 0 | Storage used in MB |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_organizations_adobe_org_id` on `adobe_org_id`
- `idx_organizations_billing_status` on `billing_status`

---

## 3. adobe_assets — Generated/Acquired Assets

Central asset storage for all Adobe-generated or licensed content.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| org_id | UUID | FOREIGN KEY → organizations.id | Organization reference |
| user_id | UUID | FOREIGN KEY → users.id | Creator reference |
| project_id | UUID | FOREIGN KEY → projects.id | Optional project reference |
| source | ENUM | NOT NULL | 'firefly', 'stock', 'photoshop', 'express', 'upload' |
| adobe_asset_id | VARCHAR(255) | | Adobe's asset ID (for Stock) |
| asset_type | ENUM | NOT NULL | 'image', 'video', 'vector', 'template', 'audio' |
| url | TEXT | | Primary asset URL (CDN) |
| thumbnail_url | TEXT | | Thumbnail/preview URL |
| storage_path | TEXT | | Internal storage path (S3) |
| metadata | JSONB | | Asset metadata (dimensions, format, etc.) |
| prompt | TEXT | | Generation prompt (for Firefly) |
| negative_prompt | TEXT | | Exclusion prompt |
| style_preset | VARCHAR(255) | | Applied style preset |
| seed | BIGINT | | Generation seed |
| num_variations | INTEGER | DEFAULT 1 | Number of variations generated |
| credits_consumed | INTEGER | DEFAULT 0 | Credits used for generation |
| status | ENUM | DEFAULT 'processing' | 'pending', 'processing', 'completed', 'failed', 'deleted' |
| width | INTEGER | | Image width in pixels |
| height | INTEGER | | Image height in pixels |
| file_size | INTEGER | | File size in bytes |
| mime_type | VARCHAR(100) | | MIME type |
| is_licensed | BOOLEAN | DEFAULT false | Whether asset is properly licensed |
| is_public | BOOLEAN | DEFAULT false | Publicly accessible |
| is_favorite | BOOLEAN | DEFAULT false | User favorite flag |
| tags | TEXT[] | | Auto-generated tags |
| description | TEXT | | User-provided description |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| deleted_at | TIMESTAMP | | Soft delete timestamp |

**Metadata JSONB Schema:**
```json
{
  "dimensions": { "width": 2688, "height": 1536 },
  "format": "jpeg",
  "color_profile": "sRGB",
  "dpi": 72,
  "adobe_specific": {
    "firefly_model": "image5",
    "generation_time_ms": 3500,
    "content_moderation_passed": true,
    "style_presets": ["doodle_drawing"]
  },
  "stock_specific": {
    "contributor_name": "John Doe",
    "creation_date": "2024-01-15",
    "premium_level": 0,
    "category_hierarchy": [{"name": "Nature", "id": 1}]
  },
  "photoshop_specific": {
    "operation": "removeBackground",
    "input_asset_id": "uuid-here"
  }
}
```

**Indexes:**
- `idx_adobe_assets_org_id` on `org_id`
- `idx_adobe_assets_user_id` on `user_id`
- `idx_adobe_assets_project_id` on `project_id`
- `idx_adobe_assets_source` on `source`
- `idx_adobe_assets_status` on `status`
- `idx_adobe_assets_asset_type` on `asset_type`
- `idx_adobe_assets_created_at` on `created_at`
- `idx_adobe_assets_is_licensed` on `is_licensed`
- `idx_adobe_assets_deleted_at` on `deleted_at` (for soft deletes)
- `GIN idx_adobe_assets_metadata` on `metadata` (GIN index for JSONB queries)
- `GIN idx_adobe_assets_tags` on `tags`

---

## 4. asset_licenses — License Tracking

Tracks all asset licenses (Stock purchases, extended licenses).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| asset_id | UUID | FOREIGN KEY → adobe_assets.id | Asset reference |
| user_id | UUID | FOREIGN KEY → users.id | Licensing user |
| org_id | UUID | FOREIGN KEY → organizations.id | Organization |
| license_type | ENUM | NOT NULL | 'standard', 'extended', 'premium' |
| adobe_license_id | VARCHAR(255) | | Adobe's license transaction ID |
| cost_credits | INTEGER | DEFAULT 0 | Credits consumed |
| cost_currency | VARCHAR(3) | DEFAULT 'USD' | Currency code |
| cost_amount | DECIMAL(10,2) | | Monetary cost |
| status | ENUM | DEFAULT 'active' | 'active', 'revoked', 'expired' |
| purchased_at | TIMESTAMP | | Purchase timestamp |
| expires_at | TIMESTAMP | | License expiry (if applicable) |
| metadata | JSONB | | License terms, usage rights |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_asset_licenses_asset_id` on `asset_id`
- `idx_asset_licenses_user_id` on `user_id`
- `idx_asset_licenses_org_id` on `org_id`
- `idx_asset_licenses_status` on `status`
- `idx_asset_licenses_purchased_at` on `purchased_at`

---

## 5. generation_jobs — Async Job Tracking

Tracks long-running async operations (Firefly generation, Photoshop batch processing).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| asset_id | UUID | FOREIGN KEY → adobe_assets.id | Resulting asset (nullable) |
| org_id | UUID | FOREIGN KEY → organizations.id | Organization |
| user_id | UUID | FOREIGN KEY → users.id | Requesting user |
| job_type | ENUM | NOT NULL | 'firefly_generate', 'photoshop_edit', 'stock_search', 'batch_process' |
| status | ENUM | DEFAULT 'queued' | 'queued', 'running', 'completed', 'failed', 'cancelled' |
| priority | INTEGER | DEFAULT 5 | Job priority (1-10, lower = higher) |
| adobe_job_id | VARCHAR(255) | | Adobe's async job ID |
| request_payload | JSONB | NOT NULL | Original request data |
| response_data | JSONB | | Final response/result |
| progress_percent | INTEGER | DEFAULT 0 | Completion percentage |
| started_at | TIMESTAMP | | Processing start time |
| completed_at | TIMESTAMP | | Completion time |
| estimated_completion | TIMESTAMP | | ETA |
| error_message | TEXT | | Error details |
| error_code | VARCHAR(100) | | Error code |
| retry_count | INTEGER | DEFAULT 0 | Number of retries |
| max_retries | INTEGER | DEFAULT 3 | Max retry attempts |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_generation_jobs_org_id` on `org_id`
- `idx_generation_jobs_user_id` on `user_id`
- `idx_generation_jobs_status` on `status`
- `idx_generation_jobs_job_type` on `job_type`
- `idx_generation_jobs_adobe_job_id` on `adobe_job_id`
- `idx_generation_jobs_created_at` on `created_at`
- `idx_generation_jobs_priority` on `priority, created_at` (for queue ordering)

---

## 6. stock_searches — Search Query Logging

Logs all Stock API searches for analytics and optimization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| user_id | UUID | FOREIGN KEY → users.id | Searching user |
| org_id | UUID | FOREIGN KEY → organizations.id | Organization |
| query | TEXT | NOT NULL | Search query text |
| filters | JSONB | | Applied filters |
| sort_order | VARCHAR(50) | DEFAULT 'relevance' | Sort criteria |
| results_count | INTEGER | | Number of results returned |
| selected_asset_id | UUID | | Asset user selected (if any) |
| response_time_ms | INTEGER | | API response time |
| created_at | TIMESTAMP | DEFAULT NOW() | Search timestamp |

**Indexes:**
- `idx_stock_searches_user_id` on `user_id`
- `idx_stock_searches_org_id` on `org_id`
- `idx_stock_searches_query` on `query` (for search analytics)
- `idx_stock_searches_created_at` on `created_at`

---

## 7. api_usage_logs — API Usage & Billing

Granular logging of all Adobe API calls for usage tracking and billing.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| org_id | UUID | FOREIGN KEY → organizations.id | Organization |
| user_id | UUID | FOREIGN KEY → users.id | Calling user |
| config_id | UUID | FOREIGN KEY → adobe_configs.id | Config used |
| api_service | ENUM | NOT NULL | 'firefly', 'stock', 'photoshop', 'express' |
| api_endpoint | VARCHAR(500) | NOT NULL | Full API endpoint URL |
| request_method | VARCHAR(10) | NOT NULL | HTTP method |
| request_size_bytes | INTEGER | | Request payload size |
| response_size_bytes | INTEGER | | Response payload size |
| credits_used | INTEGER | DEFAULT 0 | Credits consumed |
| status_code | INTEGER | | HTTP status code |
| response_time_ms | INTEGER | | Total response time |
| error_message | TEXT | | Error details |
| error_code | VARCHAR(100) | | Error code |
| rate_limit_hit | BOOLEAN | DEFAULT false | Whether rate limited |
| retry_after_ms | INTEGER | | Retry-After header value |
| created_at | TIMESTAMP | DEFAULT NOW() | Log timestamp |

**Indexes:**
- `idx_api_usage_logs_org_id` on `org_id`
- `idx_api_usage_logs_user_id` on `user_id`
- `idx_api_usage_logs_api_service` on `api_service`
- `idx_api_usage_logs_status_code` on `status_code`
- `idx_api_usage_logs_created_at` on `created_at`
- `idx_api_usage_logs_org_created` on `org_id, created_at`

---

## 8. express_projects — Adobe Express Projects

Tracks embedded Adobe Express projects and templates.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| org_id | UUID | FOREIGN KEY → organizations.id | Organization |
| user_id | UUID | FOREIGN KEY → users.id | Creator |
| name | VARCHAR(255) | NOT NULL | Project name |
| description | TEXT | | Project description |
| template_id | VARCHAR(255) | | Adobe template ID |
| adobe_project_id | VARCHAR(255) | | Adobe's project ID |
| data_json | JSONB | | Express document data |
| thumbnail_url | TEXT | | Project thumbnail |
| status | ENUM | DEFAULT 'draft' | 'draft', 'published', 'archived' |
| platform_preset | VARCHAR(50) | | 'instagram_post', 'instagram_story', 'twitter', 'facebook', 'linkedin', 'youtube' |
| dimensions | JSONB | | { width, height } |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_express_projects_org_id` on `org_id`
- `idx_express_projects_user_id` on `user_id`
- `idx_express_projects_status` on `status`
- `idx_express_projects_platform_preset` on `platform_preset`

---

## 9. asset_collections — User Collections

Collections/folders for organizing assets.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| org_id | UUID | FOREIGN KEY → organizations.id | Organization |
| user_id | UUID | FOREIGN KEY → users.id | Owner |
| name | VARCHAR(255) | NOT NULL | Collection name |
| description | TEXT | | Description |
| parent_id | UUID | FOREIGN KEY → asset_collections.id | Nested collection |
| is_shared | BOOLEAN | DEFAULT false | Shared with team |
| share_settings | JSONB | | Sharing permissions |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

---

## 10. collection_assets — Collection Membership

Many-to-many link between collections and assets.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| collection_id | UUID | FOREIGN KEY → asset_collections.id | Collection |
| asset_id | UUID | FOREIGN KEY → adobe_assets.id | Asset |
| added_by | UUID | FOREIGN KEY → users.id | User who added |
| added_at | TIMESTAMP | DEFAULT NOW() | Addition timestamp |
| sort_order | INTEGER | DEFAULT 0 | Display order |

---

## Database Migrations (PostgreSQL)

### Migration 001: Initial Schema
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table (extended)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS adobe_org_id VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'free';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS credits_balance INTEGER DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS monthly_limit INTEGER DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS credits_reset_at TIMESTAMP;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_status VARCHAR(50) DEFAULT 'active';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS overage_enabled BOOLEAN DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS storage_quota_mb INTEGER DEFAULT 10240;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS storage_used_mb INTEGER DEFAULT 0;

-- Create indexes
CREATE INDEX idx_organizations_adobe_org_id ON organizations(adobe_org_id);
CREATE INDEX idx_organizations_billing_status ON organizations(billing_status);

-- Adobe configs table
CREATE TABLE adobe_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    client_id VARCHAR(255) NOT NULL,
    client_secret TEXT NOT NULL,
    scopes TEXT[] NOT NULL DEFAULT '{}',
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    ims_host VARCHAR(255) DEFAULT 'ims-na1.adobelogin.com',
    api_key VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_adobe_configs_org_id ON adobe_configs(org_id);
CREATE INDEX idx_adobe_configs_is_active ON adobe_configs(is_active);

-- Adobe assets table
CREATE TABLE adobe_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    source VARCHAR(50) NOT NULL CHECK (source IN ('firefly', 'stock', 'photoshop', 'express', 'upload')),
    adobe_asset_id VARCHAR(255),
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('image', 'video', 'vector', 'template', 'audio')),
    url TEXT,
    thumbnail_url TEXT,
    storage_path TEXT,
    metadata JSONB DEFAULT '{}',
    prompt TEXT,
    negative_prompt TEXT,
    style_preset VARCHAR(255),
    seed BIGINT,
    num_variations INTEGER DEFAULT 1,
    credits_consumed INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'processing' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'deleted')),
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    mime_type VARCHAR(100),
    is_licensed BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    is_favorite BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_adobe_assets_org_id ON adobe_assets(org_id);
CREATE INDEX idx_adobe_assets_user_id ON adobe_assets(user_id);
CREATE INDEX idx_adobe_assets_project_id ON adobe_assets(project_id);
CREATE INDEX idx_adobe_assets_source ON adobe_assets(source);
CREATE INDEX idx_adobe_assets_status ON adobe_assets(status);
CREATE INDEX idx_adobe_assets_asset_type ON adobe_assets(asset_type);
CREATE INDEX idx_adobe_assets_created_at ON adobe_assets(created_at);
CREATE INDEX idx_adobe_assets_is_licensed ON adobe_assets(is_licensed);
CREATE INDEX idx_adobe_assets_deleted_at ON adobe_assets(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_adobe_assets_metadata ON adobe_assets USING GIN (metadata);
CREATE INDEX idx_adobe_assets_tags ON adobe_assets USING GIN (tags);

-- Asset licenses table
CREATE TABLE asset_licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES adobe_assets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    license_type VARCHAR(50) NOT NULL CHECK (license_type IN ('standard', 'extended', 'premium')),
    adobe_license_id VARCHAR(255),
    cost_credits INTEGER DEFAULT 0,
    cost_currency VARCHAR(3) DEFAULT 'USD',
    cost_amount DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
    purchased_at TIMESTAMP,
    expires_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_asset_licenses_asset_id ON asset_licenses(asset_id);
CREATE INDEX idx_asset_licenses_user_id ON asset_licenses(user_id);
CREATE INDEX idx_asset_licenses_org_id ON asset_licenses(org_id);
CREATE INDEX idx_asset_licenses_status ON asset_licenses(status);
CREATE INDEX idx_asset_licenses_purchased_at ON asset_licenses(purchased_at);

-- Generation jobs table
CREATE TABLE generation_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES adobe_assets(id) ON DELETE SET NULL,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('firefly_generate', 'photoshop_edit', 'stock_search', 'batch_process')),
    status VARCHAR(50) DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
    priority INTEGER DEFAULT 5,
    adobe_job_id VARCHAR(255),
    request_payload JSONB NOT NULL DEFAULT '{}',
    response_data JSONB DEFAULT '{}',
    progress_percent INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    estimated_completion TIMESTAMP,
    error_message TEXT,
    error_code VARCHAR(100),
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_generation_jobs_org_id ON generation_jobs(org_id);
CREATE INDEX idx_generation_jobs_user_id ON generation_jobs(user_id);
CREATE INDEX idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX idx_generation_jobs_job_type ON generation_jobs(job_type);
CREATE INDEX idx_generation_jobs_adobe_job_id ON generation_jobs(adobe_job_id);
CREATE INDEX idx_generation_jobs_created_at ON generation_jobs(created_at);
CREATE INDEX idx_generation_jobs_priority ON generation_jobs(priority, created_at);

-- API usage logs table
CREATE TABLE api_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    config_id UUID REFERENCES adobe_configs(id) ON DELETE SET NULL,
    api_service VARCHAR(50) NOT NULL CHECK (api_service IN ('firefly', 'stock', 'photoshop', 'express')),
    api_endpoint VARCHAR(500) NOT NULL,
    request_method VARCHAR(10) NOT NULL,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    credits_used INTEGER DEFAULT 0,
    status_code INTEGER,
    response_time_ms INTEGER,
    error_message TEXT,
    error_code VARCHAR(100),
    rate_limit_hit BOOLEAN DEFAULT false,
    retry_after_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_usage_logs_org_id ON api_usage_logs(org_id);
CREATE INDEX idx_api_usage_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX idx_api_usage_logs_api_service ON api_usage_logs(api_service);
CREATE INDEX idx_api_usage_logs_status_code ON api_usage_logs(status_code);
CREATE INDEX idx_api_usage_logs_created_at ON api_usage_logs(created_at);
CREATE INDEX idx_api_usage_logs_org_created ON api_usage_logs(org_id, created_at);

-- Stock searches table
CREATE TABLE stock_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    filters JSONB DEFAULT '{}',
    sort_order VARCHAR(50) DEFAULT 'relevance',
    results_count INTEGER,
    selected_asset_id UUID,
    response_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_stock_searches_user_id ON stock_searches(user_id);
CREATE INDEX idx_stock_searches_org_id ON stock_searches(org_id);
CREATE INDEX idx_stock_searches_created_at ON stock_searches(created_at);

-- Asset collections table
CREATE TABLE asset_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES asset_collections(id) ON DELETE SET NULL,
    is_shared BOOLEAN DEFAULT false,
    share_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_asset_collections_org_id ON asset_collections(org_id);
CREATE INDEX idx_asset_collections_user_id ON asset_collections(user_id);
CREATE INDEX idx_asset_collections_parent_id ON asset_collections(parent_id);

-- Collection assets junction table
CREATE TABLE collection_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID NOT NULL REFERENCES asset_collections(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES adobe_assets(id) ON DELETE CASCADE,
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    added_at TIMESTAMP DEFAULT NOW(),
    sort_order INTEGER DEFAULT 0,
    UNIQUE(collection_id, asset_id)
);

CREATE INDEX idx_collection_assets_collection_id ON collection_assets(collection_id);
CREATE INDEX idx_collection_assets_asset_id ON collection_assets(asset_id);

-- Express projects table
CREATE TABLE express_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_id VARCHAR(255),
    adobe_project_id VARCHAR(255),
    data_json JSONB DEFAULT '{}',
    thumbnail_url TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    platform_preset VARCHAR(50),
    dimensions JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_express_projects_org_id ON express_projects(org_id);
CREATE INDEX idx_express_projects_user_id ON express_projects(user_id);
CREATE INDEX idx_express_projects_status ON express_projects(status);
CREATE INDEX idx_express_projects_platform_preset ON express_projects(platform_preset);
```

---

## Entity Relationships Summary

| Entity | Relationships |
|--------|--------------|
| organizations | 1:N → adobe_configs, adobe_assets, asset_licenses, generation_jobs, api_usage_logs, asset_collections, express_projects |
| adobe_configs | N:1 → organizations |
| adobe_assets | N:1 → organizations, users, projects; 1:N → asset_licenses, generation_jobs; N:N → asset_collections (via collection_assets) |
| asset_licenses | N:1 → adobe_assets, users, organizations |
| generation_jobs | N:1 → adobe_assets, organizations, users |
| api_usage_logs | N:1 → organizations, users, adobe_configs |
| stock_searches | N:1 → users, organizations |
| asset_collections | N:1 → organizations, users; self-referencing parent; N:N → adobe_assets |
| express_projects | N:1 → organizations, users |

---

*Schema Version: 1.0*  
*Last Updated: 2026-05-03*
