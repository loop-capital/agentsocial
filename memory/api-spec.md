# AgentSocial — API Specification

## Overview

REST API designed for both human users (via dashboard) and autonomous agents. All endpoints return JSON and follow RESTful conventions.

**Base URL:** `https://api.agentsocial.co/v1`

---

## Authentication

### API Key Authentication (Agents)

```http
GET /api/v1/posts
Authorization: Bearer ak_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Or via header:
```http
X-API-Key: ak_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### JWT Authentication (Web Users)

```http
GET /api/v1/posts
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/missing auth) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## Posts

### Create Post

Create a new post and optionally publish immediately or schedule for later.

```http
POST /api/v1/posts
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "brand_id": "brand_xxx",
  "content": "Excited to announce our new feature! 🚀",
  "content_html": "<p>Excited to announce our new feature! 🚀</p>",
  "channels": ["channel_xxx", "channel_yyy"],
  "media": [
    {
      "type": "image",
      "url": "https://cdn.agentsocial.co/media/xxx.jpg",
      "alt_text": "Feature screenshot"
    }
  ],
  "scheduled_at": "2026-04-15T14:00:00Z",
  "timezone": "America/New_York",
  "tags": ["announcement", "product"],
  "platform_variants": {
    "channel_xxx": {
      "content": "Shorter version for Twitter"
    }
  }
}
```

**Response (201 Created):**
```json
{
  "id": "post_xxx",
  "brand_id": "brand_xxx",
  "content": "Excited to announce our new feature! 🚀",
  "status": "scheduled",
  "channels": [
    {
      "channel_id": "channel_xxx",
      "platform": "twitter",
      "status": "pending",
      "platform_post_id": null,
      "platform_post_url": null
    },
    {
      "channel_id": "channel_yyy",
      "platform": "linkedin",
      "status": "pending",
      "platform_post_id": null,
      "platform_post_url": null
    }
  ],
  "scheduled_at": "2026-04-15T14:00:00Z",
  "created_at": "2026-04-14T10:30:00Z",
  "updated_at": "2026-04-14T10:30:00Z"
}
```

### List Posts

```http
GET /api/v1/posts?brand_id=brand_xxx&status=scheduled&limit=20&cursor=xxx
Authorization: Bearer {token}
```

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| brand_id | string | Filter by brand (required unless org-wide scope) |
| status | string | Filter by status: `draft`, `scheduled`, `published`, `failed` |
| channel_id | string | Filter by specific channel |
| scheduled_after | ISO8601 | Posts scheduled after this time |
| scheduled_before | ISO8601 | Posts scheduled before this time |
| tags | string[] | Filter by tags |
| ai_generated | boolean | Filter AI-generated posts |
| limit | integer | Max results (default: 20, max: 100) |
| cursor | string | Pagination cursor |

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "post_xxx",
      "brand_id": "brand_xxx",
      "content": "Excited to announce our new feature! 🚀",
      "content_html": "<p>Excited to announce our new feature! 🚀</p>",
      "status": "scheduled",
      "channels": [
        {
          "channel_id": "channel_xxx",
          "platform": "twitter",
          "status": "pending",
          "platform_post_id": null
        }
      ],
      "media": [
        {
          "id": "asset_xxx",
          "type": "image",
          "url": "https://cdn.agentsocial.co/media/xxx.jpg",
          "thumbnail_url": "https://cdn.agentsocial.co/media/xxx_thumb.jpg",
          "width": 1200,
          "height": 800
        }
      ],
      "scheduled_at": "2026-04-15T14:00:00Z",
      "tags": ["announcement"],
      "created_by": {
        "id": "user_xxx",
        "name": "Jane Doe",
        "avatar_url": "https://..."
      },
      "created_at": "2026-04-14T10:30:00Z",
      "updated_at": "2026-04-14T10:30:00Z"
    }
  ],
  "pagination": {
    "has_more": true,
    "next_cursor": "eyJpZCI6InBvc3RfeXl5In0=",
    "total": 156
  }
}
```

### Get Post

```http
GET /api/v1/posts/{post_id}
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "id": "post_xxx",
  "brand_id": "brand_xxx",
  "content": "Excited to announce our new feature! 🚀",
  "status": "published",
  "channels": [
    {
      "channel_id": "channel_xxx",
      "platform": "twitter",
      "status": "published",
      "platform_post_id": "1234567890",
      "platform_post_url": "https://twitter.com/...",
      "published_at": "2026-04-15T14:00:00Z",
      "analytics": {
        "impressions": 15420,
        "engagements": 892,
        "likes": 654,
        "retweets": 238
      }
    }
  ],
  "media": [...],
  "scheduled_at": "2026-04-15T14:00:00Z",
  "published_at": "2026-04-15T14:00:00Z",
  "tags": ["announcement"],
  "created_at": "2026-04-14T10:30:00Z",
  "updated_at": "2026-04-15T14:00:00Z"
}
```

### Update Post

Only posts in `draft` or `scheduled` status can be updated.

```http
PATCH /api/v1/posts/{post_id}
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Updated content",
  "scheduled_at": "2026-04-16T10:00:00Z",
  "channels": ["channel_xxx", "channel_zzz"]
}
```

### Delete Post

```http
DELETE /api/v1/posts/{post_id}
Authorization: Bearer {token}
```

**Response (204 No Content)**

### Publish Post Now

Immediately publish a scheduled or draft post.

```http
POST /api/v1/posts/{post_id}/publish
Authorization: Bearer {token}
```

### Cancel Scheduled Post

```http
POST /api/v1/posts/{post_id}/cancel
Authorization: Bearer {token}
```

### Duplicate Post

```http
POST /api/v1/posts/{post_id}/duplicate
Authorization: Bearer {token}
```

**Response (201 Created):** New post with same content in `draft` status.

---

## Comments

### List Comments

Unified inbox across all connected channels.

```http
GET /api/v1/comments?brand_id=brand_xxx&status=unread&priority=high
Authorization: Bearer {token}
```

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| brand_id | string | Filter by brand |
| channel_id | string | Filter by channel |
| status | string | `unread`, `read`, `replied`, `archived` |
| priority | string | `low`, `medium`, `high`, `urgent` |
| sentiment | string | `positive`, `neutral`, `negative`, `spam` |
| search | string | Search in comment content |
| limit | integer | Max results (default: 50) |
| cursor | string | Pagination cursor |

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "comment_xxx",
      "channel_id": "channel_xxx",
      "channel_name": "MyBrand on Twitter",
      "platform": "twitter",
      "post_id": "post_xxx",
      "post_content": "Original post content...",
      "platform_comment_id": "1234567890",
      "author": {
        "name": "John Smith",
        "username": "@johnsmith",
        "avatar_url": "https://...",
        "is_verified": true,
        "follower_count": 54200
      },
      "content": "This is amazing! When will it be available?",
      "content_html": "<p>This is amazing! When will it be available?</p>",
      "sentiment": "positive",
      "sentiment_confidence": 0.95,
      "priority": "medium",
      "status": "unread",
      "like_count": 12,
      "ai_suggested_reply": "Thanks John! It will be available next week. Stay tuned!",
      "ai_suggested_reply_confidence": 0.88,
      "received_at": "2026-04-14T18:30:00Z",
      "platform_url": "https://twitter.com/..."
    }
  ],
  "pagination": {
    "has_more": true,
    "next_cursor": "...",
    "total": 234
  },
  "summary": {
    "unread_count": 156,
    "high_priority_count": 12,
    "avg_response_time_seconds": 3600
  }
}
```

### Get Comment

```http
GET /api/v1/comments/{comment_id}
Authorization: Bearer {token}
```

### Reply to Comment

```http
POST /api/v1/comments/{comment_id}/reply
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Thanks for your question! It will be available next week.",
  "use_ai_suggestion": false
}
```

**Response (201 Created):**
```json
{
  "id": "reply_xxx",
  "comment_id": "comment_xxx",
  "content": "Thanks for your question! It will be available next week.",
  "status": "sending",
  "sent_at": "2026-04-14T19:00:00Z"
}
```

### Bulk Update Comments

```http
POST /api/v1/comments/bulk
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "ids": ["comment_xxx", "comment_yyy", "comment_zzz"],
  "action": "mark_read"
}
```

**Actions:** `mark_read`, `mark_unread`, `archive`, `set_priority`

### Get AI Suggested Reply

```http
POST /api/v1/comments/{comment_id}/suggest-reply
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "tone": "friendly",  // friendly, professional, humorous
  "include_cta": false
}
```

**Response (200 OK):**
```json
{
  "suggestions": [
    {
      "content": "Thanks so much for the kind words! We're launching next week.",
      "confidence": 0.92,
      "tone": "friendly"
    },
    {
      "content": "We appreciate your interest! Launch date is next Monday.",
      "confidence": 0.88,
      "tone": "professional"
    }
  ]
}
```

---

## Analytics

### Get Dashboard Analytics

```http
GET /api/v1/analytics/dashboard?brand_id=brand_xxx&period=7d
Authorization: Bearer {token}
```

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| brand_id | string | Filter by brand |
| channel_id | string | Filter by specific channel |
| period | string | `24h`, `7d`, `30d`, `90d`, `custom` |
| start_date | date | Required if period=custom |
| end_date | date | Required if period=custom |

**Response (200 OK):**
```json
{
  "period": {
    "start": "2026-04-07T00:00:00Z",
    "end": "2026-04-14T23:59:59Z"
  },
  "summary": {
    "total_followers": 125400,
    "followers_growth": 3200,
    "followers_growth_percent": 2.62,
    "total_impressions": 892000,
    "total_engagements": 45600,
    "engagement_rate": 5.11,
    "posts_published": 42,
    "avg_posts_per_day": 6
  },
  "by_channel": [
    {
      "channel_id": "channel_xxx",
      "platform": "twitter",
      "name": "@mybrand",
      "followers": 45200,
      "followers_growth": 1200,
      "impressions": 340000,
      "engagements": 18200,
      "engagement_rate": 5.35,
      "best_performing_post": {
        "id": "post_xxx",
        "content": "...",
        "engagements": 4500
      }
    }
  ],
  "daily_trend": [
    {
      "date": "2026-04-07",
      "impressions": 125000,
      "engagements": 6200,
      "followers": 122200
    }
    // ... more days
  ],
  "content_performance": {
    "top_posts": [...],
    "engagement_by_content_type": {
      "image": 5.8,
      "video": 8.2,
      "text": 3.1
    },
    "optimal_posting_times": [
      { "day": "Tuesday", "hour": 14, "engagement": 8.5 },
      { "day": "Wednesday", "hour": 10, "engagement": 7.9 }
    ]
  }
}
```

### Get Post Analytics

```http
GET /api/v1/analytics/posts/{post_id}
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "post_id": "post_xxx",
  "published_at": "2026-04-14T14:00:00Z",
  "channels": [
    {
      "channel_id": "channel_xxx",
      "platform": "twitter",
      "impressions": 15420,
      "reach": 12300,
      "engagements": 892,
      "engagement_rate": 5.78,
      "likes": 654,
      "comments": 45,
      "shares": 238,
      "clicks": 89
    }
  ],
  "hourly_breakdown": [
    {
      "hour": "2026-04-14T14:00:00Z",
      "impressions": 5200,
      "engagements": 320
    }
    // ... more hours
  ],
  "audience_demographics": {
    "age": { "18-24": 15, "25-34": 35, "35-44": 28, "45+": 22 },
    "gender": { "male": 48, "female": 49, "other": 3 },
    "top_countries": ["US", "GB", "CA", "AU", "DE"]
  }
}
```

### Export Analytics Report

```http
POST /api/v1/analytics/export
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "brand_id": "brand_xxx",
  "period": "30d",
  "format": "pdf",  // pdf, csv, xlsx
  "include_charts": true,
  "branded": true
}
```

**Response (202 Accepted):**
```json
{
  "job_id": "export_xxx",
  "status": "processing",
  "estimated_completion": "2026-04-14T19:05:00Z",
  "download_url": null
}
```

Then poll:
```http
GET /api/v1/exports/{export_id}
```

---

## Schedule

### Get Queue

```http
GET /api/v1/schedule/queue?brand_id=brand_xxx&status=upcoming
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "queue": [
    {
      "position": 1,
      "post": {
        "id": "post_xxx",
        "content": "...",
        "scheduled_at": "2026-04-15T14:00:00Z",
        "channels": ["Twitter", "LinkedIn"]
      },
      "estimated_publish_at": "2026-04-15T14:00:00Z"
    }
  ],
  "stats": {
    "scheduled_today": 5,
    "scheduled_this_week": 23,
    "optimal_slots_available": 12
  }
}
```

### Get Calendar

```http
GET /api/v1/calendar?brand_id=brand_xxx&start=2026-04-01&end=2026-04-30
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "start_date": "2026-04-01",
  "end_date": "2026-04-30",
  "posts": [
    {
      "id": "post_xxx",
      "date": "2026-04-15",
      "time": "14:00",
      "content_preview": "Excited to announce...",
      "status": "scheduled",
      "channels": ["twitter", "linkedin"],
      "has_media": true
    }
  ],
  "summary": {
    "total_posts": 45,
    "by_day": {
      "2026-04-15": 3,
      "2026-04-16": 2
    }
  }
}
```

### Get Optimal Posting Times

```http
GET /api/v1/schedule/optimal-times?brand_id=brand_xxx&channels=channel_xxx,channel_yyy
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "recommendations": [
    {
      "day": "Tuesday",
      "hour": 14,
      "engagement_score": 8.5,
      "reason": "Your audience is most active during this time"
    },
    {
      "day": "Thursday",
      "hour": 10,
      "engagement_score": 7.9,
      "reason": "Consistent high engagement across channels"
    }
  ],
  "based_on_data": "last_90_days",
  "confidence": "high"
}
```

---

## Media

### Upload Media

```http
POST /api/v1/media
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request:**
```
file: [binary data]
type: image
brand_id: brand_xxx
```

**Response (201 Created):**
```json
{
  "id": "asset_xxx",
  "type": "image",
  "url": "https://cdn.agentsocial.co/media/xxx.jpg",
  "thumbnail_url": "https://cdn.agentsocial.co/media/xxx_thumb.jpg",
  "filename": "screenshot.jpg",
  "mime_type": "image/jpeg",
  "file_size_bytes": 245800,
  "width": 1200,
  "height": 800,
  "processing_status": "complete",
  "created_at": "2026-04-14T10:30:00Z"
}
```

### Get Media

```http
GET /api/v1/media/{media_id}
Authorization: Bearer {token}
```

### Delete Media

```http
DELETE /api/v1/media/{media_id}
Authorization: Bearer {token}
```

---

## Brands & Channels

### List Brands

```http
GET /api/v1/brands?organization_id=org_xxx
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "brand_xxx",
      "name": "My Brand",
      "logo_url": "https://...",
      "channels_count": 5,
      "channels": [
        {
          "id": "channel_xxx",
          "platform": "twitter",
          "name": "@mybrand",
          "status": "active",
          "follower_count": 45200
        }
      ],
      "posts_this_month": 42,
      "created_at": "2026-01-15T10:00:00Z"
    }
  ]
}
```

### Create Brand

```http
POST /api/v1/brands
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "organization_id": "org_xxx",
  "name": "My New Brand",
  "timezone": "America/Los_Angeles"
}
```

### Connect Channel

Initiate OAuth flow for a new channel.

```http
POST /api/v1/channels/connect
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "brand_id": "brand_xxx",
  "platform": "twitter"
}
```

**Response (200 OK):**
```json
{
  "authorization_url": "https://twitter.com/i/oauth2/authorize?...",
  "state": "random_state_string",
  "expires_at": "2026-04-14T11:00:00Z"
}
```

### List Channels

```http
GET /api/v1/channels?brand_id=brand_xxx
Authorization: Bearer {token}
```

### Update Channel Settings

```http
PATCH /api/v1/channels/{channel_id}
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "settings": {
    "auto_reply_enabled": true,
    "auto_reply_message": "Thanks for reaching out! We'll respond soon.",
    "post_defaults": {
      "add_utm": true,
      "utm_source": "social"
    }
  }
}
```

### Disconnect Channel

```http
POST /api/v1/channels/{channel_id}/disconnect
Authorization: Bearer {token}
```

---

## Webhooks

### List Webhooks

```http
GET /api/v1/webhooks
Authorization: Bearer {token}
```

### Create Webhook

```http
POST /api/v1/webhooks
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "url": "https://myapp.com/webhooks/agentsocial",
  "events": ["post.published", "comment.received", "post.failed"],
  "secret": "my_webhook_secret_for_signature",
  "active": true
}
```

**Response (201 Created):**
```json
{
  "id": "webhook_xxx",
  "url": "https://myapp.com/webhooks/agentsocial",
  "events": ["post.published", "comment.received", "post.failed"],
  "secret": "whsec_...",
  "active": true,
  "created_at": "2026-04-14T10:30:00Z"
}
```

### Webhook Event Payloads

**post.published:**
```json
{
  "event": "post.published",
  "timestamp": "2026-04-14T14:00:00Z",
  "data": {
    "post_id": "post_xxx",
    "brand_id": "brand_xxx",
    "content": "...",
    "channels": [
      {
        "channel_id": "channel_xxx",
        "platform": "twitter",
        "platform_post_id": "1234567890",
        "platform_post_url": "https://twitter.com/..."
      }
    ],
    "published_at": "2026-04-14T14:00:00Z"
  }
}
```

**comment.received:**
```json
{
  "event": "comment.received",
  "timestamp": "2026-04-14T18:30:00Z",
  "data": {
    "comment_id": "comment_xxx",
    "channel_id": "channel_xxx",
    "platform": "twitter",
    "post_id": "post_xxx",
    "author": {
      "name": "John Smith",
      "username": "@johnsmith"
    },
    "content": "This is amazing!",
    "received_at": "2026-04-14T18:30:00Z"
  }
}
```

### Webhook Signature Verification

```
X-Webhook-Signature: t=1713110400,v1=sha256=...

Payload: {timestamp}.{json_body}
Signature: HMAC-SHA256(timestamp.payload, secret)
```

---

## WebSocket Events

### Connection

```javascript
const ws = new WebSocket('wss://api.agentsocial.co/v1/events');

// Authenticate
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'Bearer {token}'
  }));
};
```

### Subscribe to Events

```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  channels: ['post.*', 'comment.*'],
  brand_id: 'brand_xxx'  // Optional: filter by brand
}));
```

### Event Format

```json
{
  "type": "event",
  "event": "post.published",
  "timestamp": "2026-04-14T14:00:00Z",
  "data": { ... }
}
```

### Heartbeat

```javascript
// Server sends every 30s
{ "type": "ping", "timestamp": "2026-04-14T14:00:00Z" }

// Client responds
{ "type": "pong" }
```

---

## Errors

### Error Response Format

```json
{
  "error": {
    "code": "validation_error",
    "message": "The request failed validation",
    "details": [
      {
        "field": "content",
        "message": "Content is required"
      },
      {
        "field": "channels",
        "message": "At least one channel is required"
      }
    ],
    "request_id": "req_xxx"
  }
}
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `validation_error` | 400 | Request validation failed |
| `authentication_required` | 401 | Missing or invalid authentication |
| `insufficient_permissions` | 403 | User lacks permission for this action |
| `resource_not_found` | 404 | Requested resource does not exist |
| `rate_limit_exceeded` | 429 | Too many requests |
| `platform_error` | 502 | Upstream platform API error |
| `internal_error` | 500 | Internal server error |

---

## SDKs

### Official SDKs

- **JavaScript/TypeScript:** `npm install @agentsocial/sdk`
- **Python:** `pip install agentsocial`
- **Go:** `go get github.com/agentsocial/go-sdk`

### JavaScript Example

```javascript
import { AgentSocial } from '@agentsocial/sdk';

const client = new AgentSocial({
  apiKey: 'ak_live_xxx'
});

// Create and schedule a post
const post = await client.posts.create({
  brandId: 'brand_xxx',
  content: 'Hello world!',
  channels: ['channel_xxx'],
  scheduledAt: new Date('2026-04-15T14:00:00Z')
});

// Listen for events
client.events.on('post.published', (event) => {
  console.log('Post published:', event.data.platform_post_url);
});
```
