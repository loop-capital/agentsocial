# AgentSocial — Build Progress

**Last Updated:** 2026-04-21
**MVP Target:** July 7, 2026
**Current Phase:** Phase 1 → Phase 2 (Foundation + Job Queue + Connectors)

---

## Status Overview

| Area | Status | Notes |
|------|--------|-------|
| Monorepo Setup | ✅ Done | Turborepo + pnpm workspaces |
| PostgreSQL Schema | ✅ Done | 17 tables with Drizzle ORM |
| Auth Endpoints | ✅ Done | JWT register/login + API keys |
| Health Check | ✅ Done | /health + /ready endpoints |
| Docker Compose | ✅ Done | PostgreSQL + Redis |
| Fastify API Routes | ✅ Done | 35+ endpoints |
| **Next.js Dashboard Pages** | ✅ Done | All pages route-grouped |
| **BullMQ Job Queue** | ✅ Done | 4 queues, worker scaffold |
| **Platform Connector Stubs** | ✅ Done | Twitter, LinkedIn, Instagram |
| Next.js Web Build | ✅ Done | All 10 routes build clean |
| Shared Package | ✅ Done | Zod schemas + domain types |
| API Build | ✅ Done | Compiles with 0 errors |

---

## Build Output

```
Route (app)                              Size     First Load JS
├ ○ /                                    175 B          94.1 kB
├ ○ /_not-found                          875 B          88.1 kB
├ ○ /analytics                           153 B          87.3 kB
├ ○ /dashboard                           155 B          87.3 kB
├ ○ /login                               154 B          87.3 kB
├ ○ /posts                               155 B          87.3 kB
├ ○ /register                            154 B          87.3 kB
└ ○ /settings                            155 B          87.3 kB
✓ 3/3 packages built successfully
```

---

## What Was Built This Session

### 1. Next.js Dashboard Pages
All route-grouped pages with proper layout hierarchy:

```
packages/web/app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/
│   ├── layout.tsx        ← "use client", sidebar nav
│   ├── dashboard/page.tsx
│   ├── posts/page.tsx
│   ├── analytics/page.tsx
│   └── settings/page.tsx
├── page.tsx              ← Landing page
├── layout.tsx            ← Root layout
└── globals.css
```

### 2. BullMQ Job Queue Setup
- `src/queues/redis.ts` — Redis connection config (ioredis)
- `src/queues/index.ts` — Queue definitions + helpers:
  - `post-publish` — high priority, 3 retry attempts
  - `analytics-sync` — medium priority, 2 retries
  - `export-report` — low priority, 2 retries
  - `media-process` — media processing pipeline
- `src/workers/publish.worker.ts` — Publish worker with concurrency control
- `src/workers/index.ts` — Worker lifecycle (start/stop)

### 3. Platform Connector Stubs
All with full OAuth flow scaffolding:

| Platform | File | OAuth | Publish | Refresh |
|----------|------|-------|---------|---------|
| Twitter | `connectors/twitter.ts` | ✅ | ✅ stub | ✅ |
| LinkedIn | `connectors/linkedin.ts` | ✅ | ✅ stub | ✅ |
| Instagram | `connectors/instagram.ts` | ✅ | ✅ stub | ✅ |

OAuth functions: `get{X}OAuthUrl()`, `exchange{X}Code()`, `refresh{X}Token()`
Publish functions: `publishTo{X}()` → returns `{ platformPostId, platformPostUrl }`
Metrics functions: `get{X}Metrics()` → `{ impressions, likes, ... }`

### 4. Type Error Fixes
- `next.config.ts` → `next.config.mjs` (Next.js 14 doesn't support .ts config)
- Dashboard layout: added `"use client"` directive for `usePathname()`
- Removed duplicate CSS import from dashboard layout
- Fixed connector barrel export (named exports to avoid `PublishOptions` conflict)
- Fixed publish worker: `connection` imported from `redis.ts`, not `queues/index.ts`
- Removed unused `postPublishQueue` import from worker

---

## Architecture

### Monorepo
```
agentsocial/
├── packages/
│   ├── api/          # Fastify + TypeScript
│   │   └── src/
│   │       ├── server.ts
│   │       ├── db/ (schema.ts + index.ts)
│   │       ├── plugins/auth.ts
│   │       ├── routes/ (9 route files, 35+ endpoints)
│   │       ├── queues/ (BullMQ + Redis)
│   │       ├── workers/ (publish.worker.ts)
│   │       └── connectors/ (twitter, linkedin, instagram)
│   ├── web/          # Next.js 14 App Router
│   │   └── app/
│   │       ├── (auth)/login, register
│   │       ├── (dashboard)/dashboard, posts, analytics, settings
│   │       └── page.tsx (landing)
│   └── shared/       # Zod schemas + domain types
├── docker-compose.yml (PostgreSQL 16 + Redis 7)
├── turbo.json
└── pnpm-workspace.yaml
```

### Database Schema (17 tables)
users, api_keys, organizations, organization_memberships, brands, channels, posts, post_channels, media_assets, post_media, comments, comment_replies, post_analytics, daily_analytics, webhooks, export_jobs

---

## Known Gaps / Remaining Work

- [ ] Real OAuth credentials (Twitter, LinkedIn, Instagram) needed for live connect
- [ ] Media upload needs R2/S3 integration (stub only)
- [ ] AI reply suggestions need OpenAI/Claude integration
- [ ] WebSocket events not implemented
- [ ] Redis connection requires local/Cloudflare Redis to be running
- [ ] Dashboard pages need API integration (fetch from `/api/v1/`)
- [ ] Auth flow (login/register) needs JWT session handling
- [ ] API routes need to be updated to use BullMQ for scheduled posts

---

## Next Steps (Phase 2 — Queue Integration)

1. Wire posts route to enqueue scheduled posts via BullMQ
2. Add `publish.worker.ts` to server startup
3. Implement webhook endpoint for platform callbacks (Twitter/LinkedIn/Instagram)
4. Add `@fastify/cors` allowlist for web app origin
5. Write integration tests for queue workers

---

## File Map (updated)

```
packages/api/src/
├── server.ts              # Fastify app entry
├── db/
│   ├── index.ts           # Drizzle instance
│   └── schema.ts          # 17 tables with relations
├── plugins/
│   └── auth.ts            # JWT + API key middleware
├── routes/
│   ├── health.ts
│   ├── auth.ts
│   ├── brands.ts
│   ├── channels.ts
│   ├── posts.ts
│   ├── comments.ts
│   ├── media.ts
│   ├── analytics.ts
│   └── webhooks.ts
├── queues/
│   ├── index.ts           # Queue definitions + helpers
│   └── redis.ts            # Redis/ioredis connection
├── workers/
│   ├── index.ts            # startWorkers/stopWorkers
│   └── publish.worker.ts   # Post publishing worker
└── connectors/
    ├── index.ts            # Barrel export (named)
    ├── twitter.ts          # Twitter API + OAuth
    ├── linkedin.ts         # LinkedIn API + OAuth
    └── instagram.ts        # Instagram Graph API + OAuth

packages/shared/src/
├── index.ts
├── schemas/index.ts       # Zod input schemas
└── types/index.ts         # Domain interfaces

packages/web/app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/
│   ├── layout.tsx          # Sidebar + nav
│   ├── dashboard/page.tsx
│   ├── posts/page.tsx
│   ├── analytics/page.tsx
│   └── settings/page.tsx
├── page.tsx               # Landing page
├── layout.tsx             # Root layout
└── globals.css
```