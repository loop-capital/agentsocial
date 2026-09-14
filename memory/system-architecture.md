# AgentSocial — System Architecture

## Executive Summary

AgentSocial is a Buffer-style social media management platform built agent-first. Unlike Buffer's closed API, AgentSocial provides first-class REST and WebSocket APIs designed for autonomous agents to publish content, respond to comments, and analyze performance at scale.

**Key Differentiators:**
- Agent-native API with API key authentication
- WebSocket real-time events for agent workflows
- Competitive pricing ($19-49/mo vs Buffer's $5-10/mo per channel)
- Platform connectors with built-in retry logic and token refresh

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────┬─────────────┬─────────────────┬───────────────────────────────┤
│   Web App   │   Mobile    │   Agent SDK     │   Third-party Integrations    │
│   (Next.js) │   (PWA)     │   (Node.js)     │   (Zapier, Make, etc.)      │
└──────┬──────┴──────┬──────┴────────┬────────┴───────────────┬───────────────┘
       │             │               │                        │
       └─────────────┴───────────────┴────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │     Cloudflare CDN      │
              │     + DDoS Protection   │
              └────────────┬────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────────────────────┐
│                              API GATEWAY                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                     Kong/AWS API Gateway                                │ │
│  │  - Rate limiting per API key    - JWT validation    - Request routing   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────────────────────┐
│                           APPLICATION LAYER                                  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                    Web Dashboard (Next.js 14+)                          │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │ │
│  │  │  Brand   │ │ Calendar │ │ Composer │ │ Analytics│ │ Team Mgmt    │  │ │
│  │  │  Mgmt    │ │  View    │ │          │ │ Dashboard│ │              │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                    REST API (Fastify + tRPC)                            │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌───────────────┐  │ │
│  │  │   Posts      │ │  Comments    │ │  Analytics   │ │   Schedule    │  │ │
│  │  │   /posts     │ │  /comments   │ │  /analytics  │ │   /schedule   │  │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └───────────────┘  │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌───────────────┐  │ │
│  │  │   Media      │ │   Calendar   │ │   Webhooks   │ │   Events WS   │  │ │
│  │  │   /media     │ │  /calendar   │ │  /webhooks   │ │  /events      │  │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └───────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                    Platform Connector Service                             │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │ │
│  │  │ Facebook │ │Instagram │ │ YouTube  │ │ Twitter  │ │ LinkedIn │   │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                               │ │
│  │  │  TikTok  │ │ WordPress│ │  Bluesky │                               │ │
│  │  └──────────┘ └──────────┘ └──────────┘                               │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────────────────────┐
│                            DATA LAYER                                        │
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐   │
│  │   PostgreSQL     │  │     Redis        │  │   Cloudflare R2 (S3)     │   │
│  │   (Primary DB)   │  │   (Cache/Queue)  │  │   (Media Storage)        │   │
│  │                  │  │                  │  │                          │   │
│  │  • Users         │  │  • Session cache │  │  • Images                │   │
│  │  • Brands        │  │  • Rate limiting │  │  • Videos                │   │
│  │  • Posts         │  │  • BullMQ queue  │  │  • Thumbnails            │   │
│  │  • Analytics     │  │  • Real-time pub │  │                          │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Web Dashboard (Next.js 14+)

**Technology Stack:**
- **Framework:** Next.js 14+ with App Router
- **Styling:** Tailwind CSS + Radix UI primitives
- **State:** Zustand for client state, React Query for server state
- **Calendar:** FullCalendar or react-big-calendar
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts for analytics

**Key Features:**
- **Brand Management:** Create brands, connect social accounts via OAuth
- **Content Calendar:** Visual drag-and-drop calendar with multi-platform view
- **Post Composer:** Rich text editor with per-platform preview
- **Comment Inbox:** Unified feed across all platforms with AI-suggested replies
- **Analytics Dashboard:** Per-post metrics, follower growth, engagement trends
- **Team Management:** Role-based access (Admin, Editor, Viewer)

### 2. REST API (Fastify + tRPC)

**Technology Stack:**
- **Framework:** Fastify (faster than Express, built-in schema validation)
- **Protocol:** tRPC for type-safe internal calls, REST for external
- **Auth:** API key authentication for agents, JWT for web users
- **Validation:** Zod schemas throughout
- **Documentation:** OpenAPI/Swagger auto-generated

**Key Endpoints:**
- `POST /api/v1/posts` — Create and publish posts
- `GET /api/v1/posts` — List scheduled/published posts
- `GET /api/v1/comments` — Unified comment inbox
- `POST /api/v1/comments/:id/reply` — Reply to comments
- `GET /api/v1/analytics` — Performance data
- `WebSocket /api/v1/events` — Real-time notifications

### 3. Platform Connector Service

**Architecture Pattern:** Plugin-based connectors with shared interface

```typescript
interface PlatformConnector {
  name: PlatformName;
  version: string;
  
  // Authentication
  initiateOAuth(): string;
  handleCallback(code: string): Promise<AuthTokens>;
  refreshTokens(tokens: AuthTokens): Promise<AuthTokens>;
  
  // Content operations
  publishPost(post: Post): Promise<PlatformPostId>;
  deletePost(id: PlatformPostId): Promise<void>;
  getPost(id: PlatformPostId): Promise<PlatformPost>;
  
  // Engagement
  getComments(postId: PlatformPostId): Promise<Comment[]>;
  replyToComment(commentId: string, reply: string): Promise<void>;
  
  // Analytics
  getAnalytics(postId: PlatformPostId): Promise<Analytics>;
  
  // Rate limiting
  getRateLimitStatus(): Promise<RateLimitStatus>;
}
```

**Supported Platforms:**
1. Facebook Graph API (Pages)
2. Instagram Graph API (Business/Creator accounts)
3. YouTube Data API v3
4. Twitter/X API v2
5. LinkedIn API
6. TikTok Content Posting API
7. WordPress REST API
8. Bluesky AT Protocol (future)

### 4. Job Queue (BullMQ + Redis)

**Queue Types:**
- `publish-queue` — Scheduled post publishing
- `retry-queue` — Failed post retry with exponential backoff
- `sync-queue` — Sync comments, analytics
- `webhook-queue` — Outbound webhook delivery

**Job Lifecycle:**
```
Scheduled → Queued → Processing → Published
                              ↓
                         Failed → Retry (max 3)
                              ↓
                         Dead Letter Queue
```

---

## Data Flow Diagrams

### Post Publishing Flow

```
┌─────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  User   │────▶│   Composer   │────▶│   API POST   │────▶│   Validate   │
└─────────┘     └──────────────┘     │   /api/v1/   │     └──────┬───────┘
                                     │   posts      │            │
                                     └──────────────┘            │
                                                                  ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Publish    │◀────│  Connector   │◀────│    BullMQ    │◀────│   Create     │
│   to Platform│     │   Service    │     │   Queue      │     │   Job        │
└──────┬───────┘     └──────────────┘     └──────────────┘     └──────────────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Platform   │────▶│   Webhook    │────▶│  WebSocket   │
│   Response   │     │   (optional) │     │  Broadcast   │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Real-Time Comment Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Platform   │────▶│   Webhook    │────▶│   API        │
│   Webhook    │     │   Handler    │     │   Event Bus  │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                       ┌──────────────────────────┼──────────────┐
                       │                          │              │
                       ▼                          ▼              ▼
                ┌──────────────┐          ┌──────────────┐ ┌──────────────┐
                │   WebSocket  │          │   Agent      │ │   Save to    │
                │   Broadcast  │          │   Webhook    │ │   Database   │
                │   (Dashboard)│          │   (External) │ │              │
                └──────────────┘          └──────────────┘ └──────────────┘
```

---

## Authentication & Security

### Multi-Layer Auth Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION                           │
├──────────────────────┬────────────────────────────────────────────┤
│   Web Dashboard      │   Agent API                              │
│   (User-facing)      │   (Machine-to-machine)                    │
├──────────────────────┼────────────────────────────────────────────┤
│   • Supabase Auth    │   • API Key (x-api-key header)           │
│   • JWT tokens       │   • Per-agent key generation             │
│   • OAuth2 (social)  │   • Rate limiting per key                  │
│   • MFA support      │   • IP allowlisting (optional)             │
│                      │   • Scopes/permissions per key             │
└──────────────────────┴────────────────────────────────────────────┘
```

### API Key Structure

```
ak_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ak_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Format: ak_{env}_{32-char random}
Permissions: read, write, admin (per-endpoint granularity)
```

---

## Rate Limiting Strategy

### Tier-Based Limits

| Tier | Requests/Min | Posts/Hour | Webhooks |
|------|--------------|------------|----------|
| Free | 60 | 5 | ❌ |
| Starter | 300 | 25 | ✅ |
| Pro | 1,000 | Unlimited | ✅ |
| Agency | 5,000 | Unlimited | ✅ Custom |

### Implementation
- **Redis** for distributed rate limiting (sliding window)
- **Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **Response:** 429 Too Many Requests with Retry-After

---

## Infrastructure Architecture

### Deployment Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        Kubernetes                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Web Pods  │  │   API Pods  │  │ Worker Pods │         │
│  │   (Next.js) │  │  (Fastify)  │  │  (BullMQ)   │         │
│  │   x3        │  │   x3        │  │   x2        │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  PostgreSQL │  │    Redis    │  │   MinIO     │         │
│  │   (HA: 3)   │  │   (HA: 3)   │  │   (S3)      │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │  Cloudflare  │    │   Grafana    │
            │    (CDN)     │    │  + Prometheus│
            └──────────────┘    └──────────────┘
```

### Environment Configuration

```yaml
# Production
api:
  replicas: 3
  resources:
    cpu: 2
    memory: 4Gi
  autoscaling:
    min: 3
    max: 20
    cpu_target: 70%

web:
  replicas: 3
  resources:
    cpu: 1
    memory: 2Gi

workers:
  replicas: 2
  concurrency: 10
```

---

## WebSocket Architecture

### Connection Handling

```
┌────────────────────────────────────────────────────────────────┐
│                        WebSocket Server                         │
├────────────────────────────────────────────────────────────────┤
│  Redis Pub/Sub (horizontal scaling)                            │
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │   WS Node   │◀───▶│   WS Node   │◀───▶│   WS Node   │       │
│  │    :3001    │     │    :3002    │     │    :3003    │       │
│  └──────┬──────┘     └─────────────┘     └─────────────┘       │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Authentication Middleware                   │   │
│  │         (JWT for users, API key for agents)            │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

### Event Types

```typescript
enum WebSocketEvent {
  // Post events
  POST_SCHEDULED = 'post.scheduled',
  POST_PUBLISHED = 'post.published',
  POST_FAILED = 'post.failed',
  
  // Comment events
  COMMENT_RECEIVED = 'comment.received',
  COMMENT_REPLIED = 'comment.replied',
  
  // Analytics events
  ANALYTICS_UPDATED = 'analytics.updated',
  
  // System events
  RATE_LIMIT_WARNING = 'system.rate_limit',
  TOKEN_EXPIRED = 'auth.token_expired',
}
```

---

## Monitoring & Observability

### Metrics (Prometheus)

- **API:** Request rate, latency p99, error rate by endpoint
- **Workers:** Queue depth, processing time, retry rate
- **Connectors:** Platform API calls, rate limit hits, errors
- **Database:** Query duration, connection pool usage

### Logging (Structured JSON)

```json
{
  "level": "info",
  "service": "api",
  "trace_id": "abc-123",
  "user_id": "user_xxx",
  "method": "POST",
  "path": "/api/v1/posts",
  "duration_ms": 45,
  "platform": "instagram",
  "post_id": "post_xxx"
}
```

### Alerting Rules

- API error rate > 5% for 5 minutes
- Queue depth > 10,000
- Platform connector failures > 10/minute
- Database connections > 80%

---

## Disaster Recovery

### Backup Strategy

| Component | Frequency | Retention | Method |
|-----------|-----------|-----------|--------|
| PostgreSQL | Continuous | 30 days | WAL-E to S3 |
| Redis | Hourly | 7 days | RDB snapshots |
| Media (R2) | Versioned | 90 days | Object versioning |

### RTO/RPO Targets

- **RTO:** 15 minutes (automated failover)
- **RPO:** 5 minutes (WAL streaming)

---

## Technology Stack Summary

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Next.js 14+ | App Router, RSC, optimal performance |
| API Framework | Fastify | 2x faster than Express, built-in validation |
| Database | PostgreSQL 15+ | JSONB, full-text search, reliability |
| ORM | Drizzle | Type-safe, lightweight, migrations |
| Cache/Queue | Redis 7+ | BullMQ, rate limiting, sessions |
| Object Storage | Cloudflare R2 | S3-compatible, zero egress fees |
| Auth | Supabase Auth | OAuth providers, MFA, row-level security |
| Deployment | Kubernetes | Scalability, resilience, portability |
| Monitoring | Grafana + Prometheus | Industry standard, OSS |
