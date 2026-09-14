# AgentSocial — Database Schema

## Overview

PostgreSQL 15+ with Drizzle ORM. Schema designed for multi-tenant SaaS with row-level security policies.

---

## Schema Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                    USERS                                         │
│  ┌──────────────┐                                                                │
│  │     users    │◀────────────────────────────────────────────────────┐         │
│  │──────────────│                                                    │         │
│  │ id (PK)      │                                                    │         │
│  │ email        │                                                    │         │
│  │ name         │                                                    │         │
│  │ avatar       │                                                    │         │
│  │ tier_id (FK) │──▶ subscriptions                                   │         │
│  │ created_at   │                                                    │         │
│  └──────────────┘                                                    │         │
└──────────────────────────────────────────────────────────────────────┼─────────┘
                                                                       │
┌──────────────────────────────────────────────────────────────────────┼─────────┐
│                               ORGANIZATIONS                          │         │
│  ┌─────────────────┐      ┌─────────────────┐      ┌───────────────┐ │         │
│  │  organizations  │◀────▶│ organization_   │◀────▶│    users      │─┘         │
│  │─────────────────│      │ members         │      └───────────────┘           │
│  │ id (PK)         │      │─────────────────│                                  │
│  │ name            │      │ org_id (FK)     │                                  │
│  │ slug            │      │ user_id (FK)    │                                  │
│  │ owner_id (FK)   │      │ role            │                                  │
│  │ billing_email   │      │ joined_at       │                                  │
│  └─────────────────┘      └─────────────────┘                                  │
└────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                                  BRANDS                                        │
│  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────────────┐   │
│  │     brands      │◀────▶│ brand_members   │◀────▶│      users              │   │
│  │─────────────────│      │─────────────────│      └─────────────────────────┘   │
│  │ id (PK)         │      │ brand_id (FK)   │                                  │
│  │ org_id (FK)     │      │ user_id (FK)    │                                  │
│  │ name            │      │ role            │                                  │
│  │ timezone        │      │ permissions     │                                  │
│  │ settings        │      └─────────────────┘                                  │
│  └────────┬────────┘                                                            │
│           │                                                                     │
│           ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         CHANNELS                                         │   │
│  │  ┌─────────────────┐                                                    │   │
│  │  │    channels     │                                                    │   │
│  │  │─────────────────│                                                    │   │
│  │  │ id (PK)         │                                                    │   │
│  │  │ brand_id (FK)   │◀───────────────────────────────────────────────────┘   │
│  │  │ platform        │  {facebook, instagram, twitter, linkedin, youtube,     │
│  │  │ platform_id     │    tiktok, wordpress, bluesky}                         │
│  │  │ name            │                                                    │   │
│  │  │ credentials     │  {encrypted oauth tokens}                            │
│  │  │ status          │  {active, disconnected, rate_limited}                │
│  │  │ settings        │  {post_defaults, auto_reply, analytics}              │
│  │  │ last_sync_at    │                                                    │   │
│  │  │ created_at      │                                                    │   │
│  │  └─────────────────┘                                                    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                                  POSTS                                          │
│  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────────────┐  │
│  │     posts       │◀────▶│ post_channels   │◀────▶│       channels          │  │
│  │─────────────────│      │─────────────────│      └─────────────────────────┘  │
│  │ id (PK)         │      │ post_id (FK)    │                                  │
│  │ brand_id (FK)   │      │ channel_id (FK) │                                  │
│  │ created_by (FK) │      │ platform_post_id│  {external id}                   │
│  │ content         │      │ status          │  {pending, publishing, published,│  │
│  │ media_urls      │      │ published_at    │   failed, scheduled}             │
│  │ scheduled_at    │      │ error_message   │                                  │
│  │ timezone        │      │ analytics       │  {cached metrics}                │  │
│  │ status          │      └─────────────────┘                                  │  │
│  │ ai_generated    │                                                            │  │
│  │ tags            │      ┌─────────────────┐                                   │  │
│  │ metadata        │◀────▶│  post_versions  │  {revision history}               │  │
│  └────────┬────────┘      └─────────────────┘                                   │  │
│           │                                                                     │  │
│           ▼                                                                     │  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │  │
│  │                         POST ASSETS                                      │   │  │
│  │  ┌─────────────────┐                                                    │   │  │
│  │  │  post_assets    │                                                    │   │  │
│  │  │─────────────────│                                                    │   │  │
│  │  │ id (PK)         │                                                    │   │  │
│  │  │ post_id (FK)    │◀───────────────────────────────────────────────────┘   │  │
│  │  │ type            │  {image, video, carousel, document}                    │  │
│  │  │ url             │  {r2/cloudfront URL}                                   │  │
│  │  │ thumbnail_url   │                                                      │  │
│  │  │ metadata        │  {dimensions, duration, size, mime_type}               │  │
│  │  │ platform_vars   │  {per-platform variations}                             │  │
│  │  └─────────────────┘                                                      │  │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                               ENGAGEMENT                                        │
│  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────────────┐   │
│  │    comments     │◀────▶│ comment_replies │◀──▶│        users            │   │
│  │─────────────────│      │─────────────────│      └─────────────────────────┘   │
│  │ id (PK)         │      │ comment_id (FK) │                                  │
│  │ channel_id (FK) │      │ user_id (FK)    │                                  │
│  │ post_id (FK)    │◀────▶│ content         │                                  │
│  │ platform_cmt_id │      │ sent_at         │                                  │
│  │ author          │      └─────────────────┘                                  │
│  │ content         │                                                            │
│  │ sentiment       │  {positive, neutral, negative, spam}                     │
│  │ status          │  {unread, read, replied, archived}                       │
│  │ priority        │  {low, medium, high, urgent}                             │
│  │ received_at     │                                                            │
│  └─────────────────┘                                                            │
│                                                                                 │
│  ┌─────────────────┐      ┌─────────────────┐                                   │
│  │   mentions      │      │   messages      │  {DM conversations}              │
│  │─────────────────│      │─────────────────│                                   │
│  │ id (PK)         │      │ id (PK)         │                                   │
│  │ channel_id (FK) │      │ channel_id (FK) │                                   │
│  │ platform_id     │      │ conversation_id │                                   │
│  │ mentioned_user  │      │ sender          │                                   │
│  │ content         │      │ content         │                                   │
│  │ status          │      │ status          │                                   │
│  └─────────────────┘      └─────────────────┘                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                               ANALYTICS                                         │
│  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────────────┐  │
│  │  analytics_daily  │◀────▶│ analytics_hourly │◀──▶│      channels           │  │
│  │─────────────────│      │─────────────────│      └─────────────────────────┘  │
│  │ id (PK)         │      │ id (PK)         │                                  │
│  │ channel_id (FK) │      │ channel_id (FK) │                                  │
│  │ date            │      │ datetime        │                                  │
│  │ followers       │      │ impressions     │                                  │
│  │ impressions     │      │ engagements     │                                  │
│  │ reach           │      │ clicks          │                                  │
│  │ engagements     │      │ video_views     │                                  │
│  │ video_views     │      └─────────────────┘                                  │
│  │ profile_visits  │                                                            │
│  │ website_clicks  │      ┌─────────────────┐                                  │
│  └─────────────────┘      │ post_analytics  │  {per-post metrics}              │
│                           │─────────────────│                                  │
│                           │ post_id (FK)    │                                  │
│                           │ impressions     │                                  │
│                           │ reach           │                                  │
│                           │ likes           │                                  │
│                           │ comments        │                                  │
│                           │ shares          │                                  │
│                           │ saves           │                                  │
│                           │ video_views     │                                  │
│                           │ watch_time      │                                  │
│                           │ ctr             │                                  │
│                           └─────────────────┘                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              API & AGENTS                                       │
│  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────────────┐  │
│  │    api_keys     │◀────▶│   agents        │◀────▶│        users            │  │
│  │─────────────────│      │─────────────────│      └─────────────────────────┘  │
│  │ id (PK)         │      │ id (PK)         │                                  │
│  │ user_id (FK)    │◀────▶│ user_id (FK)    │                                  │
│  │ agent_id (FK)   │      │ name            │                                  │
│  │ key_hash        │      │ description     │                                  │
│  │ key_prefix      │      │ permissions     │  {scopes object}                 │
│  │ scopes          │      │ webhook_url     │                                  │
│  │ rate_limit      │      │ status          │                                  │
│  │ last_used_at    │      └─────────────────┘                                  │
│  │ expires_at      │                                                            │
│  └─────────────────┘                                                            │
│                                                                                 │
│  ┌─────────────────┐      ┌─────────────────┐                                 │
│  │  webhook_logs   │      │ rate_limit_logs │                                 │
│  │─────────────────│      │─────────────────│                                 │
│  │ id (PK)         │      │ id (PK)         │                                 │
│  │ agent_id (FK)   │      │ api_key_id (FK) │                                 │
│  │ event_type      │      │ endpoint        │                                 │
│  │ payload         │      │ requests_count  │                                 │
│  │ response_status │      │ window_start    │                                 │
│  │ sent_at         │      └─────────────────┘                                 │
│  │ retry_count     │                                                            │
│  └─────────────────┘                                                            │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SCHEDULING                                         │
│  ┌─────────────────┐      ┌─────────────────┐                                │
│  │ posting_schedule │◀────▶│  time_slots    │                                │
│  │─────────────────│      │─────────────────│                                │
│  │ id (PK)         │      │ schedule_id(FK)│                                │
│  │ brand_id (FK)   │      │ day_of_week    │                                │
│  │ name            │      │ time           │                                │
│  │ timezone        │      │ channel_ids    │                                │
│  │ is_default      │      └─────────────────┘                                │
│  └─────────────────┘                                                            │
│                                                                                 │
│  ┌─────────────────┐                                                            │
│  │  queue_settings │  {brand posting preferences}                            │
│  │─────────────────│                                                            │
│  │ brand_id (PK)   │                                                            │
│  │ max_posts_daily │                                                            │
│  │ auto_schedule   │                                                            │
│  │ optimal_times   │                                                            │
│  └─────────────────┘                                                            │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                            SUBSCRIPTIONS                                        │
│  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────────────┐  │
│  │  subscriptions  │◀────▶│   tiers         │◀────▶│    tier_features        │  │
│  │─────────────────│      │─────────────────│      │─────────────────────────│  │
│  │ id (PK)         │      │ id (PK)         │      │ tier_id (FK)            │  │
│  │ user_id (FK)    │◀────▶│ name            │◀────▶│ feature_key             │  │
│  │ tier_id (FK)   │      │ price_monthly   │      │ value                   │  │
│  │ status         │      │ price_yearly    │      └─────────────────────────┘  │
│  │ current_period │      │ description     │                                   │
│  │ cancel_at      │      │ is_active       │                                   │
│  │ stripe_sub_id  │      └─────────────────┘                                   │
│  └─────────────────┘                                                            │
│                                                                                 │
│  ┌─────────────────┐                                                            │
│  │  usage_limits   │  {track tier limits}                                      │
│  │─────────────────│                                                            │
│  │ user_id (PK)    │                                                            │
│  │ month           │                                                            │
│  │ posts_used      │                                                            │
│  │ brands_used     │                                                            │
│  │ channels_used   │                                                            │
│  │ api_calls       │                                                            │
│  └─────────────────┘                                                            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Table Definitions

### Core Tables

#### `users`
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    tier_id UUID REFERENCES tiers(id),
    
    -- Auth (managed by Supabase)
    supabase_uid UUID UNIQUE,
    
    -- Preferences
    preferences JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    
    -- Soft delete
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tier ON users(tier_id);
CREATE INDEX idx_users_deleted ON users(deleted_at) WHERE deleted_at IS NULL;
```

#### `organizations`
```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    
    -- Billing
    billing_email VARCHAR(255),
    billing_address JSONB,
    
    -- Owner
    owner_id UUID NOT NULL REFERENCES users(id),
    
    -- Settings
    settings JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_owner ON organizations(owner_id);
```

#### `organization_members`
```sql
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    permissions JSONB DEFAULT '{}',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
```

### Brand Management

#### `brands`
```sql
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Brand identity
    logo_url TEXT,
    website_url TEXT,
    industry VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    
    -- Settings
    settings JSONB DEFAULT '{
        "default_hashtags": [],
        "auto_shorten_links": true,
        "approval_workflow": false
    }',
    
    -- Limits (from tier)
    max_channels INTEGER DEFAULT 3,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_brands_org ON brands(organization_id);
CREATE INDEX idx_brands_deleted ON brands(deleted_at) WHERE deleted_at IS NULL;
```

#### `brand_members`
```sql
CREATE TABLE brand_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
    permissions JSONB DEFAULT '{}',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(brand_id, user_id)
);

CREATE INDEX idx_brand_members_brand ON brand_members(brand_id);
CREATE INDEX idx_brand_members_user ON brand_members(user_id);
```

### Channels & Platform Integration

#### `channels`
```sql
CREATE TYPE platform_type AS ENUM (
    'facebook', 'instagram', 'twitter', 'linkedin', 
    'youtube', 'tiktok', 'wordpress', 'bluesky', 'threads'
);

CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    platform platform_type NOT NULL,
    
    -- Platform-specific identifiers
    platform_page_id VARCHAR(255),  -- Facebook Page ID, Instagram Business ID, etc.
    platform_username VARCHAR(255), -- @handle
    platform_display_name VARCHAR(255),
    
    -- OAuth credentials (encrypted)
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMPTZ,
    
    -- Channel status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'rate_limited', 'expired')),
    last_error TEXT,
    last_sync_at TIMESTAMPTZ,
    
    -- Channel settings
    settings JSONB DEFAULT '{
        "auto_reply_enabled": false,
        "auto_reply_message": null,
        "post_defaults": {
            "add_utm": true,
            "default_hashtags": []
        }
    }',
    
    -- Profile data (cached from platform)
    profile_data JSONB,
    follower_count INTEGER DEFAULT 0,
    follower_count_updated_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(brand_id, platform, platform_page_id)
);

CREATE INDEX idx_channels_brand ON channels(brand_id);
CREATE INDEX idx_channels_platform ON channels(platform);
CREATE INDEX idx_channels_status ON channels(status) WHERE status != 'active';
```

### Content Management

#### `posts`
```sql
CREATE TYPE post_status AS ENUM (
    'draft', 'scheduled', 'queued', 'publishing', 'published', 
    'failed', 'cancelled', 'archived'
);

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    
    -- Content
    content TEXT NOT NULL,
    content_html TEXT,  -- Rich text HTML
    
    -- Media
    media_urls TEXT[],  -- Array of R2 URLs
    
    -- Scheduling
    scheduled_at TIMESTAMPTZ,
    timezone VARCHAR(50) DEFAULT 'UTC',
    published_at TIMESTAMPTZ,
    
    -- Status
    status post_status DEFAULT 'draft',
    
    -- AI generation metadata
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_prompt TEXT,
    ai_model VARCHAR(100),
    
    -- Organization
    tags TEXT[],
    campaign_id UUID,
    
    -- Approval workflow
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_posts_brand ON posts(brand_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_scheduled ON posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);
```

#### `post_channels`
```sql
CREATE TYPE channel_post_status AS ENUM (
    'pending', 'publishing', 'published', 'failed', 'cancelled'
);

CREATE TABLE post_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    
    -- Platform-specific content variations
    content_variant TEXT,  -- If different from main post content
    
    -- Publishing status
    status channel_post_status DEFAULT 'pending',
    platform_post_id VARCHAR(255),  -- External ID from platform
    platform_post_url TEXT,         -- Public URL
    published_at TIMESTAMPTZ,
    
    -- Error tracking
    error_code VARCHAR(100),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Cached analytics
    analytics JSONB,
    last_analytics_sync TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(post_id, channel_id)
);

CREATE INDEX idx_post_channels_post ON post_channels(post_id);
CREATE INDEX idx_post_channels_channel ON post_channels(channel_id);
CREATE INDEX idx_post_channels_status ON post_channels(status);
CREATE INDEX idx_post_channels_platform ON post_channels(platform_post_id);
```

#### `post_assets`
```sql
CREATE TYPE asset_type AS ENUM ('image', 'video', 'carousel', 'document', 'gif');

CREATE TABLE post_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    
    type asset_type NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    
    -- Metadata
    filename VARCHAR(500),
    mime_type VARCHAR(100),
    file_size_bytes BIGINT,
    width INTEGER,
    height INTEGER,
    duration_seconds INTEGER,  -- For video
    
    -- Platform-specific variations
    platform_variants JSONB,  -- {facebook: {url: ...}, instagram: {url: ...}}
    
    -- Processing status
    processing_status VARCHAR(50) DEFAULT 'pending',
    processing_error TEXT,
    
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_post_assets_post ON post_assets(post_id);
CREATE INDEX idx_post_assets_type ON post_assets(type);
```

### Engagement

#### `comments`
```sql
CREATE TYPE comment_sentiment AS ENUM ('positive', 'neutral', 'negative', 'spam');
CREATE TYPE comment_status AS ENUM ('unread', 'read', 'replied', 'archived', 'spam');
CREATE TYPE comment_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id),  -- May be NULL if platform doesn't link
    
    -- Platform identifiers
    platform_comment_id VARCHAR(255) NOT NULL,
    platform_parent_id VARCHAR(255),  -- For replies to comments
    
    -- Author info
    author_name VARCHAR(255),
    author_username VARCHAR(255),
    author_avatar_url TEXT,
    author_is_verified BOOLEAN DEFAULT FALSE,
    author_follower_count INTEGER,
    
    -- Content
    content TEXT NOT NULL,
    content_html TEXT,
    
    -- Engagement metrics (from platform)
    like_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    
    -- Classification
    sentiment comment_sentiment,
    sentiment_confidence FLOAT,
    priority comment_priority DEFAULT 'medium',
    status comment_status DEFAULT 'unread',
    
    -- AI suggestions
    ai_suggested_reply TEXT,
    ai_suggested_reply_confidence FLOAT,
    
    received_at TIMESTAMPTZ NOT NULL,
    platform_created_at TIMESTAMPTZ,
    
    UNIQUE(channel_id, platform_comment_id)
);

CREATE INDEX idx_comments_channel ON comments(channel_id);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_status ON comments(status);
CREATE INDEX idx_comments_priority ON comments(priority) WHERE status = 'unread';
CREATE INDEX idx_comments_received ON comments(received_at DESC);
```

#### `comment_replies`
```sql
CREATE TABLE comment_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    
    content TEXT NOT NULL,
    
    -- Platform delivery
    platform_reply_id VARCHAR(255),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    
    -- Status
    status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'failed')),
    error_message TEXT
);

CREATE INDEX idx_comment_replies_comment ON comment_replies(comment_id);
CREATE INDEX idx_comment_replies_user ON comment_replies(user_id);
```

### Analytics

#### `analytics_daily`
```sql
CREATE TABLE analytics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Follower metrics
    followers INTEGER,
    followers_growth INTEGER,
    
    -- Content metrics
    posts_published INTEGER DEFAULT 0,
    
    -- Engagement metrics
    impressions INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    engagements INTEGER DEFAULT 0,
    engagement_rate FLOAT,
    
    -- Breakdown
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    
    -- Profile metrics
    profile_visits INTEGER DEFAULT 0,
    website_clicks INTEGER DEFAULT 0,
    
    -- Video metrics
    video_views INTEGER DEFAULT 0,
    video_watch_time_seconds INTEGER DEFAULT 0,
    
    UNIQUE(channel_id, date)
);

CREATE INDEX idx_analytics_daily_channel ON analytics_daily(channel_id);
CREATE INDEX idx_analytics_daily_date ON analytics_daily(date DESC);
```

#### `post_analytics`
```sql
CREATE TABLE post_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    
    -- Reach
    impressions INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    
    -- Engagement
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    
    -- Video (if applicable)
    video_views INTEGER DEFAULT 0,
    video_watch_time_seconds INTEGER DEFAULT 0,
    video_completions INTEGER DEFAULT 0,
    
    -- Calculated
    engagement_rate FLOAT,
    ctr FLOAT,
    
    -- Platform-specific
    platform_data JSONB,
    
    last_sync_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(post_id, channel_id)
);

CREATE INDEX idx_post_analytics_post ON post_analytics(post_id);
CREATE INDEX idx_post_analytics_channel ON post_analytics(channel_id);
```

### API & Agents

#### `api_keys`
```sql
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id),
    
    -- Key (store hash, show prefix only)
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(10) NOT NULL,  -- First 8 chars for display
    
    -- Scopes
    name VARCHAR(255),
    scopes JSONB NOT NULL DEFAULT '["read:posts", "write:posts"]',
    
    -- Rate limiting
    rate_limit_per_minute INTEGER DEFAULT 60,
    
    -- Usage tracking
    last_used_at TIMESTAMPTZ,
    use_count INTEGER DEFAULT 0,
    
    -- Expiration
    expires_at TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- IP allowlist (optional)
    allowed_ips INET[]
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = TRUE;
```

#### `agents`
```sql
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Webhook configuration
    webhook_url TEXT,
    webhook_secret TEXT,
    webhook_events JSONB DEFAULT '["post.published", "comment.received"]',
    
    -- Permissions
    allowed_brands UUID[],  -- NULL = all brands
    allowed_channels UUID[], -- NULL = all channels
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'suspended')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agents_user ON agents(user_id);
CREATE INDEX idx_agents_org ON agents(organization_id);
CREATE INDEX idx_agents_status ON agents(status);
```

### Subscriptions & Billing

#### `tiers`
```sql
CREATE TABLE tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identification
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    
    -- Pricing
    price_monthly_cents INTEGER NOT NULL,
    price_yearly_cents INTEGER NOT NULL,
    
    -- Features
    max_brands INTEGER NOT NULL DEFAULT 1,
    max_channels INTEGER NOT NULL DEFAULT 3,
    max_posts_per_month INTEGER NOT NULL DEFAULT 50,
    max_team_members INTEGER,
    
    -- API limits
    api_rate_limit_per_minute INTEGER DEFAULT 60,
    api_webhooks_enabled BOOLEAN DEFAULT FALSE,
    api_white_label_enabled BOOLEAN DEFAULT FALSE,
    
    -- Analytics
    analytics_retention_days INTEGER DEFAULT 30,
    analytics_advanced BOOLEAN DEFAULT FALSE,
    
    -- Features
    features JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default tiers
INSERT INTO tiers (name, slug, description, price_monthly_cents, price_yearly_cents, max_brands, max_channels, max_posts_per_month, api_rate_limit_per_minute, api_webhooks_enabled) VALUES
('Free', 'free', 'For individuals getting started', 0, 0, 1, 3, 50, 60, FALSE),
('Starter', 'starter', 'For creators and small businesses', 1900, 19000, 3, 15, 500, 300, TRUE),
('Pro', 'pro', 'For growing teams and agencies', 4900, 49000, 10, NULL, NULL, 1000, TRUE),
('Agency', 'agency', 'For large agencies and enterprises', 14900, 149000, 50, NULL, NULL, 5000, TRUE);
```

#### `subscriptions`
```sql
CREATE TYPE subscription_status AS ENUM (
    'trialing', 'active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired'
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    tier_id UUID NOT NULL REFERENCES tiers(id),
    
    -- Stripe integration
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    stripe_price_id VARCHAR(255),
    
    -- Status
    status subscription_status DEFAULT 'incomplete',
    
    -- Current period
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    
    -- Cancellation
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    
    -- Trial
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
```

---

## Indexes Summary

### Performance-Critical Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| `posts` | `(brand_id, status, scheduled_at)` | Queue queries |
| `posts` | `(status, scheduled_at)` WHERE `status = 'scheduled'` | Scheduler polling |
| `comments` | `(channel_id, status, received_at)` | Inbox queries |
| `post_channels` | `(status, retry_count)` WHERE `status = 'failed'` | Retry queue |
| `channels` | `(platform, status)` | Platform health checks |
| `analytics_daily` | `(channel_id, date DESC)` | Dashboard charts |

### Full-Text Search

```sql
-- For post content search
CREATE INDEX idx_posts_content_search ON posts USING GIN(to_tsvector('english', content));

-- For comment content search
CREATE INDEX idx_comments_content_search ON comments USING GIN(to_tsvector('english', content));
```

### Partitioning

```sql
-- Partition analytics tables by month for query performance
CREATE TABLE analytics_daily (
    -- ... columns
) PARTITION BY RANGE (date);

-- Create partitions dynamically via cron job
CREATE TABLE analytics_daily_2024_01 PARTITION OF analytics_daily
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

---

## Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
-- ... etc

-- Example policy: Users can only see posts from brands they have access to
CREATE POLICY posts_org_isolation ON posts
    USING (
        brand_id IN (
            SELECT brand_id FROM brand_members WHERE user_id = auth.uid()
        )
    );

-- Example policy: Users can only see their own API keys
CREATE POLICY api_keys_user_isolation ON api_keys
    USING (user_id = auth.uid());
```
