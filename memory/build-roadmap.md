# AgentSocial — Build Roadmap

## Executive Summary

This roadmap outlines a phased approach to building AgentSocial, targeting an MVP launch in 12 weeks and full feature parity with Buffer within 6 months.

---

## Phase 1: Foundation (Weeks 1-4)

**Goal:** Core infrastructure, database, and authentication

### Week 1: Project Setup & Infrastructure

**Deliverables:**
- [ ] Initialize monorepo structure with Turborepo
- [ ] Set up CI/CD pipeline (GitHub Actions → Vercel/Railway)
- [ ] Configure PostgreSQL and Redis infrastructure
- [ ] Set up S3/Cloudflare R2 for media storage
- [ ] Configure monitoring (Grafana + Prometheus)
- [ ] Set up staging and production environments

**Technical Tasks:**
```bash
# Monorepo structure
packages/
  web/                    # Next.js 14 dashboard
  api/                    # Fastify REST API
  connectors/             # Platform connectors
  shared/                 # Types, schemas, utilities
  sdk/                    # TypeScript SDK

# Infrastructure
- Docker Compose for local dev
- Terraform for cloud infrastructure
- Kubernetes manifests for production
```

### Week 2: Database & Auth

**Deliverables:**
- [ ] Complete database schema migration (Drizzle)
- [ ] Implement Supabase Auth integration
- [ ] API key generation and validation system
- [ ] Row-level security policies
- [ ] Rate limiting infrastructure (Redis)

**Database Focus:**
- Users, organizations, brands tables
- OAuth token storage (encrypted)
- API keys with permission scopes

### Week 3: Core API Endpoints

**Deliverables:**
- [ ] POST /api/v1/posts — Create posts
- [ ] GET /api/v1/posts — List posts
- [ ] PATCH /api/v1/posts/:id — Update posts
- [ ] DELETE /api/v1/posts/:id — Delete posts
- [ ] POST /api/v1/media — Upload media
- [ ] Basic error handling and validation

**Key Decisions:**
- tRPC for internal API calls
- Zod for all validation
- OpenAPI generation from code

### Week 4: Web Dashboard Foundation

**Deliverables:**
- [ ] Next.js project with App Router
- [ ] Authentication flow (login/signup)
- [ ] Dashboard layout with sidebar navigation
- [ ] Brand management (create, list)
- [ ] Channel connection UI (OAuth flows)

**UI Components:**
- Shadcn/ui component library setup
- Tailwind configuration
- Dark/light mode support

---

## Phase 2: Core Features (Weeks 5-8)

**Goal:** Working post composer and publishing

### Week 5: Post Composer

**Deliverables:**
- [ ] Rich text editor with markdown support
- [ ] Per-platform character counters
- [ ] Media upload (drag & drop)
- [ ] Platform preview (how post looks on each platform)
- [ ] Scheduling picker with timezone support

**Technical Tasks:**
- Integrate TipTap or Slate editor
- Image/video upload to R2
- Thumbnail generation
- Platform-specific validation

### Week 6: Platform Connectors — Group 1

**Deliverables:**
- [ ] Twitter/X API v2 connector
- [ ] LinkedIn API connector
- [ ] OAuth callback handling
- [ ] Token refresh automation
- [ ] Error handling and retry logic

**Connector Scope:**
```typescript
// Week 6 connectors
- Twitter/X: Posts, threads, media
- LinkedIn: Personal and company posts
```

### Week 7: Publishing Pipeline

**Deliverables:**
- [ ] BullMQ job queue setup
- [ ] Scheduled publishing worker
- [ ] Real-time publish status updates
- [ ] Failed post retry logic
- [ ] WebSocket events for dashboard

**Job Types:**
- `publish-post` — Immediate or scheduled publishing
- `refresh-tokens` — Background token refresh
- `sync-analytics` — Daily analytics sync

### Week 8: Content Calendar

**Deliverables:**
- [ ] Visual calendar view (month/week/day)
- [ ] Drag-and-drop rescheduling
- [ ] Calendar filters (by channel, status)
- [ ] Quick edit from calendar
- [ ] Calendar export (ICS)

---

## Phase 3: Engagement (Weeks 9-12)

**Goal:** Comment inbox and basic analytics

### Week 9: Comment Inbox

**Deliverables:**
- [ ] Unified comment inbox UI
- [ ] Platform connectors for comments (Twitter, LinkedIn)
- [ ] Comment fetching and storage
- [ ] Reply functionality
- [ ] Read/unread status tracking

**Features:**
- Thread view for conversations
- Quick reply templates
- Keyboard shortcuts

### Week 10: Platform Connectors — Group 2

**Deliverables:**
- [ ] Facebook Graph API connector
- [ ] Instagram Graph API connector
- [ ] Stories publishing (reminder flow)
- [ ] Reels publishing (Instagram)

**Instagram Specific:**
- Media container upload flow
- Polling for processing status
- Carousel support

### Week 11: Basic Analytics

**Deliverables:**
- [ ] Post-level analytics display
- [ ] Follower growth chart
- [ ] Engagement rate calculations
- [ ] Best performing posts list
- [ ] Simple export (CSV)

**Metrics:**
- Impressions, reach, engagements
- Likes, comments, shares
- Follower count over time

### Week 12: MVP Launch Prep

**Deliverables:**
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Documentation (API docs, guides)
- [ ] Pricing page implementation
- [ ] Stripe billing integration
- [ ] Landing page polish

**Launch Checklist:**
- [ ] Load testing (k6)
- [ ] Security audit
- [ ] Backup and disaster recovery tested
- [ ] Support channels ready
- [ ] Analytics tracking (PostHog)

---

## Phase 4: Growth Features (Weeks 13-16)

**Goal:** Advanced features for power users

### Week 13: Advanced Analytics

**Deliverables:**
- [ ] Competitor comparison
- [ ] Optimal posting time recommendations
- [ ] Audience demographics
- [ ] Custom date range analytics
- [ ] Branded PDF reports

### Week 14: AI Features

**Deliverables:**
- [ ] AI content generation (OpenAI/Claude)
- [ ] AI reply suggestions
- [ ] Content idea generator
- [ ] Hashtag recommendations
- [ ] Sentiment analysis on comments

### Week 15: Team Collaboration

**Deliverables:**
- [ ] Team member invitation
- [ ] Role-based permissions (Admin, Editor, Viewer)
- [ ] Approval workflows
- [ ] Activity logs
- [ ] Notifications (email + in-app)

### Week 16: Additional Platforms

**Deliverables:**
- [ ] YouTube connector
- [ ] TikTok connector
- [ ] WordPress connector
- [ ] Bluesky connector (AT Protocol)

---

## Phase 5: Scale & Enterprise (Weeks 17-24)

**Goal:** Enterprise features and platform stability

### Weeks 17-18: API & Webhooks

**Deliverables:**
- [ ] Complete REST API coverage
- [ ] WebSocket real-time events
- [ ] Webhook management UI
- [ ] API documentation (Mintlify)
- [ ] SDKs (JavaScript, Python, Go)

### Weeks 19-20: Enterprise Features

**Deliverables:**
- [ ] White-label API option
- [ ] Custom domains
- [ ] SSO (SAML/OIDC)
- [ ] Audit logs
- [ ] Advanced team management

### Weeks 21-22: Performance & Scale

**Deliverables:**
- [ ] Database read replicas
- [ ] CDN optimization
- [ ] Worker auto-scaling
- [ ] Connection pooling optimization
- [ ] Query performance tuning

### Weeks 23-24: Polish & Expansion

**Deliverables:**
- [ ] Mobile app (React Native)
- [ ] Browser extension
- [ ] Zapier integration
- [ ] Make.com integration
- [ ] API marketplace listing

---

## Timeline Summary

```
Month 1: ████ Foundation (DB, Auth, API, Dashboard shell)
Month 2: ████ Core Features (Composer, Publishing, Calendar)
Month 3: ████ Engagement + MVP Launch (Comments, Analytics)
Month 4: ████ Growth Features (AI, Team, More platforms)
Month 5: ████ Enterprise + Scale (API, Webhooks, SSO)
Month 6: ████ Polish (Mobile, Integrations, Marketplace)

Week:  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20 21 22 23 24
       ├─ Foundation ─┤├─ Core ─┤├── Engagement ─┤├── Growth ─┤├── Enterprise ─┤
                                         ▲
                                         └─ MVP LAUNCH
```

---

## Resource Requirements

### Team Composition

| Phase | Engineers | Designer | PM | Total |
|-------|-----------|----------|-----|-------|
| 1-2 | 2 backend, 2 frontend | 1 | 0.5 | 5.5 |
| 3 | 2 backend, 2 frontend | 1 | 1 | 6 |
| 4 | 3 backend, 3 frontend | 1 | 1 | 8 |
| 5 | 3 backend, 3 frontend, 1 mobile | 1 | 1 | 9 |

### Infrastructure Costs (Monthly)

| Component | Staging | Production |
|-----------|---------|------------|
| PostgreSQL (RDS/Neon) | $50 | $200-500 |
| Redis (Upstash/ElastiCache) | $30 | $100-200 |
| Kubernetes (EKS/GKE) | $100 | $500-1000 |
| S3/R2 Storage | $20 | $100-500 |
| CDN (Cloudflare) | $20 | $200 |
| Monitoring | $50 | $200 |
| **Total** | **~$270** | **~$1,500-2,600** |

---

## Risk Mitigation

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Platform API changes | High | High | Abstract connectors, rapid response plan |
| Rate limit issues | Medium | Medium | Aggressive rate limiting, queue prioritization |
| OAuth token expiration | Medium | High | Automated refresh, user notifications |
| Media processing failures | Medium | Medium | Retry logic, async processing, manual fallback |

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Buffer reopens API | Low | High | Differentiate on agent-native features |
| Platform blocks API access | Low | High | Multi-platform strategy, legal review |
| Pricing pressure | Medium | Medium | Cost advantage vs Buffer, value-based pricing |

---

## Success Metrics

### Phase Gates

| Phase | Metric | Target |
|-------|--------|--------|
| 2 | API latency p95 | <200ms |
| 2 | Publish success rate | >99% |
| 3 | MVP signups | 100 users |
| 4 | Weekly active users | 500 |
| 5 | Monthly revenue | $5,000 MRR |
| 6 | Monthly revenue | $20,000 MRR |

---

## Dependencies

### External Dependencies

1. **Twitter/X API** — Apply for Basic tier ($100/mo) in Week 5
2. **LinkedIn Marketing Partner** — Apply in Week 5
3. **Instagram Business Verification** — Complete in Week 6
4. **Stripe** — Account setup in Week 1
5. **OpenAI API** — For AI features in Week 14

### Internal Dependencies

1. **OpenClaw Gateway** — For agent integrations
2. **Design System** — Component library completion
3. **Documentation Site** — Mintlify or similar

---

## Next Steps

1. **Immediate (This Week):**
   - Finalize technical architecture decisions
   - Set up development environments
   - Create GitHub repositories

2. **Week 1 Kickoff:**
   - Team onboarding
   - Sprint planning
   - First commits

3. **MVP Target:**
   - 12 weeks from kickoff
   - Limited beta to 100 users
   - Iterate based on feedback
