# Postiz Integration Evaluation for AgentSocial

**Date:** 2026-04-17  
**Priority:** URGENT  
**Purpose:** Compare FORK vs API INTEGRATION approaches for embedding Postiz social media scheduling into AgentSocial  

---

## Background

**Postiz** (github.com/gitroomhq/postiz-app) is an open-source, self-hosted social media scheduler:
- **32 platforms** supported: Instagram, Facebook, TikTok, YouTube, LinkedIn, Reddit, Threads, Pinterest, X, Discord, Slack, Telegram, Warpcast, Reddit, Medium, WordPress, and more
- **Public API** with NodeJS SDK (`@postiz/node`)
- **AI content generation** built in
- **OAuth-first** — users authenticate directly with platforms (no API key scraping)
- **AGPL-3.0 license**
- **Monorepo:** NextJS (frontend) + NestJS (backend) + Prisma + Temporal
- **~3M Docker downloads, 20k views/month on GitHub**
- **N8N node + Make.com** integrations available

**AgentSocial need:** Enable AI agents and human users to create, schedule, and manage social media posts across all major platforms — without building this integration layer from scratch.

---

## Approach 1: FORK (Clone & Rebrand)

Clone the Postiz monorepo into AgentSocial's codebase, rebrand, and integrate directly.

### What This Means
- Copy the entire Postiz monorepo into `agentsocial/postiz-fork/`
- Replace Postiz branding with AgentSocial branding
- Deep-couple Postiz's data model into AgentSocial's database (shared Prisma schema)
- Expose Postiz's scheduling engine as internal AgentSocial microservices
- Build AgentSocial-specific UI on top of Postiz's NextJS frontend

### Build Time to MVP
| Phase | Estimated Time |
|-------|---------------|
| Initial fork & branding swap | 1-2 weeks |
| Schema integration (users, workspaces, teams) | 2-3 weeks |
| Auth integration (AgentSocial JWT ↔ Postiz sessions) | 1-2 weeks |
| Custom UI for AgentSocial-native UX | 2-3 weeks |
| Testing & bug fixes | 1-2 weeks |
| **Total** | **7-14 weeks** |

**Reality check:** Postiz is a large monorepo (NextJS + NestJS + Prisma + Temporal + workers). A naive fork will carry significant technical debt. Budget extra time for understanding Temporal workflows and workspace isolation logic.

### Maintenance Burden: ⛔ HIGH

| Category | Assessment |
|----------|------------|
| Upstream sync | Postiz releases frequently. Every update requires evaluating schema diffs, API changes, new platform integrations. |
| Bug fixes | You're now the maintainer. Any Postiz bug is your bug. |
| Security patches | OAuth flows and token handling require immediate attention. |
| Platform API changes | When Instagram or TikTok change their API, you must update the integration. |
| Temporal workflows | Complex async job system — debugging requires deep expertise. |
| Prisma migrations | Schema conflicts on every sync. |

**Estimated ongoing maintenance:** 0.5-1 FTE dedicated to Postiz fork.

### White-Label Potential: ✅ HIGH (in theory)

Full codebase control means you can:
- Completely rebrand (logo, colors, copy)
- Remove Postiz-specific UI elements
- Add AgentSocial-specific features (agent profiles, task billing, etc.)
- Modify the scheduling engine
- Control the data model entirely

**However:** AGPL-3.0 means any modifications to the forked Postiz code must be released under AGPL-3.0 if distributed. This doesn't prevent commercial use (AgentSocial can use it internally), but any AgentSocial-hosted version distributed to customers would trigger AGPL obligations. Consult a lawyer.

### Platform Integration Maintenance: ⛔ You own it

Every new platform Postiz adds (they add ~1-2/quarter) requires evaluating and potentially backporting. You cannot just `git pull` — every update is a manual merge.

### Scalability for Multi-Tenant: ⚠️ MODERATE RISK

Postiz is designed for single-workspace use. Multi-tenancy (AgentSocial needs this — multiple AgentSocial customers sharing infrastructure) requires:
- Workspace isolation at the DB level
- Rate limit isolation per tenant
- Tenant-aware Temporal workflow routing
- Analytics data partitioning

This is non-trivial and Postiz doesn't natively support it. You'd be building multi-tenancy on top of a single-tenant architecture.

### Revenue Model Impact

| Aspect | Impact |
|--------|--------|
| Cost | No per-seat licensing. Pure engineering cost. |
| Margins | High margin once built — no third-party fees |
| Pricing flexibility | Full control — can bundle into AgentSocial tiers freely |
| Lock-in | High — you're dependent on your own fork quality |
| Compliance risk | AGPL distribution obligations if white-label is sold to third parties |

---

## Approach 2: API INTEGRATION (Sidecar Service)

Run Postiz as a standalone Docker service alongside AgentSocial. AgentSocial communicates with Postiz via its public API or direct SDK calls.

### What This Means
- Deploy Postiz as a separate service: `https://postiz.agentsocial.internal`
- Each AgentSocial workspace maps to a Postiz **workspace** (Postiz supports workspaces natively)
- AgentSocial UI wraps Postiz's API; users never see Postiz branding directly
- Postiz handles all scheduling, OAuth flows, and platform integrations
- AgentSocial focuses on its core value: agent marketplace, billing, task management

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AgentSocial Platform                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │  Frontend     │  │  Backend API  │  │  AgentSocial DB  │ │
│  │  (NextJS)     │  │  (Node/Python)│  │  (Postgres)      │ │
│  └──────────────┘  └──────┬───────┘  └──────────────────┘ │
│                          │                                   │
│                          │ JWT-authenticated API calls     │
│                          ▼                                   │
│              ┌─────────────────────────┐                    │
│              │  Postiz Service         │                    │
│              │  (Docker, standalone)   │                    │
│              │  /workspace/:id        │                    │
│              └─────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### Build Time to MVP
| Phase | Estimated Time |
|-------|---------------|
| Postiz Docker deployment + configuration | 1-2 days |
| AgentSocial workspace → Postiz workspace mapping | 3-5 days |
| OAuth callback handling (user connects Instagram, etc.) | 3-5 days |
| Post creation/scheduling UI wrapper | 1-2 weeks |
| Webhook handling (post published, failed, etc.) | 1 week |
| Analytics data pull into AgentSocial | 1 week |
| **Total** | **4-6 weeks** |

**Can ship a working MVP in under 2 months with 1 developer.**

### Maintenance Burden: ✅ LOW-MEDERATE

| Category | Assessment |
|----------|------------|
| Upstream sync | Docker pull to update. No code conflicts. |
| Bug fixes | Postiz team owns Postiz bugs. You file issues/PRs. |
| Security patches | Pull new image, redeploy. |
| Platform API changes | Postiz team updates. You pull new image. |
| Temporal workflows | Postiz team maintains. |
| Prisma migrations | Postiz team handles in new releases. |

**Estimated ongoing maintenance:** ~0.1 FTE — just keeping the Docker image updated and monitoring.

**Caveat:** If Postiz introduces breaking API changes, you need a short adaptation window. Track their changelog.

### White-Label Potential: ⚠️ PARTIAL

Postiz branding will appear in:
- OAuth consent screens (platform-native — unavoidable)
- Email notifications from Postiz (configurable if self-hosted)

Postiz branding **won't appear** in:
- AgentSocial's UI (you build this)
- User-facing dashboards
- Your domain

You can achieve a fully white-labeled experience for users. The "powered by Postiz" only appears in internal implementation.

**AGPL note:** Running Postiz as a sidecar service means you are *using* AGPL software but not *distributing* it. Your AgentSocial application doesn't need to be AGPL. This is a significant legal advantage over the FORK approach.

### Platform Integration Maintenance: ✅ Postiz team owns it

Every new platform added to Postiz is immediately available to AgentSocial on the next Docker image pull. Currently adding ~1-2 platforms per quarter.

### Scalability for Multi-Tenant: ✅ GOOD

Postiz's **workspace model** maps directly to multi-tenant needs:

| Postiz Concept | AgentSocial Mapping |
|----------------|-------------------|
| Workspace | Per-customer tenant |
| Team members | Per-customer users |
| Channels/integrations | Per-customer connected social accounts |
| AI generation | Per-customer AI content |

- Each workspace is fully isolated
- Rate limits are per-workspace
- Analytics are per-workspace
- No data leakage between workspaces

AgentSocial would run one Postiz instance per workspace (or a shared instance with workspace isolation). This is a supported deployment model.

### Revenue Model Impact

| Aspect | Impact |
|--------|--------|
| Cost | Docker hosting costs (Postiz is lightweight — ~512MB RAM) + your dev time |
| Margins | High — no per-seat or revenue-share fees to Postiz |
| Pricing flexibility | Full control — bundle scheduling into any tier |
| Lock-in | Low — if Postiz fails or changes license, you have 4-6 weeks of runway to pivot |
| Compliance | No AGPL obligations. You are a user, not a distributor. |

---

## Comparison Matrix

| Dimension | FORK | API INTEGRATION |
|-----------|------|-----------------|
| Build time to MVP | 7-14 weeks | 4-6 weeks |
| Maintenance burden | ⛔ HIGH | ✅ LOW |
| White-label quality | ✅ Full | ✅ Full (user-facing) |
| Platform integration maintenance | ⛔ You own it | ✅ Postiz owns it |
| Multi-tenant scalability | ⚠️ Risky | ✅ Built-in |
| Revenue model flexibility | ✅ Full | ✅ Full |
| AGPL compliance risk | ⚠️ High (distribution) | ✅ Clean |
| Lock-in risk | Low (you own code) | ⚠️ Medium (dependency) |
| Team expertise required | Deep (NestJS, Temporal, Prisma) | Moderate (Docker, API) |

---

## Recommendation: **API INTEGRATION (Sidecar Service)**

### Rationale

**The FORK approach trades engineering time for control you don't need yet.** Here's why:

1. **Time-to-value:** API Integration ships MVP in 4-6 weeks vs 7-14 weeks. At a startup stage, 2-3 months of saved dev time is existential.

2. **Maintenance cliff:** Postiz is actively maintained with 3M downloads and real revenue (hosted product). The risk of abandonment is low. But if you fork, you own the maintenance regardless.

3. **Platform changes are frequent:** Social media APIs change quarterly. Instagram alone changed its API 3 times in 2024. You do not want to own that maintenance cycle.

4. **Multi-tenancy is built into Postiz's workspace model.** Forking would require rebuilding this from scratch.

5. **AGPL compliance is cleaner with API integration.** Running AGPL as a service doesn't trigger distribution obligations. Forking and distributing (even to your own customers) creates legal exposure.

6. **Lock-in is manageable:**
   - Postiz has a public API + SDK
   - N8N and Make.com integrations exist (escape hatch)
   - If Postiz goes rogue, a full rewrite of the scheduling layer is 4-6 weeks of work — no worse than the FORK approach's ongoing maintenance
   - Add a **scheduling abstraction layer** in AgentSocial's backend so Postiz is swappable

### Implementation Plan (API Integration)

**Week 1-2: Infrastructure**
- [ ] Deploy Postiz via Docker on your hosting (Railway/Render/VPS)
- [ ] Configure PostgreSQL database for Postiz
- [ ] Set up workspace provisioning script
- [ ] Configure domain: `postiz-internal.agentsocial.com`

**Week 3-4: Core Integration**
- [ ] Build Postiz workspace mapper in AgentSocial backend
- [ ] Onboard AgentSocial user → create Postiz workspace (via API)
- [ ] Implement OAuth bridge: AgentSocial passes Postiz OAuth tokens to frontend
- [ ] Build post creation form in AgentSocial UI (wraps Postiz API)
- [ ] Handle OAuth callbacks (user connects Instagram, etc.)

**Week 5-6: Advanced Features**
- [ ] Webhook handler for post status updates (published, failed, etc.)
- [ ] Pull analytics data back into AgentSocial dashboard
- [ ] AI content generation integration (Postiz has this built-in — expose via API)
- [ ] Team collaboration features (Postiz supports this natively)

**Week 7-8: Polish & MVP**
- [ ] Error handling and retry logic
- [ ] Rate limit management per workspace
- [ ] UI polish and user testing
- [ ] Documentation for AgentSocial API

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Postiz upstream breaks | Pin to a specific version tag in Docker. Test updates before deploying. |
| Postiz changes pricing/license | Scheduling abstraction layer in AgentSocial backend. Swappable interface. |
| API rate limits (30 req/hr) | Batch operations, cache responses, use webhooks instead of polling. |
| Multi-workspace scaling | Run separate Postiz instances per tier (free tier = shared, pro = dedicated). |
| AGPL license change | Monitor Postiz license. If it changes to proprietary, evaluate Buffer/Meltwater alternatives. |

### If You Still Want FORK

If white-label control is non-negotiable and you have the team, consider a **hybrid approach**:
- Use API Integration for MVP (ship fast)
- Fork only the Postiz frontend (React components) for fully custom UI
- Keep Postiz backend as sidecar service
- Gradually migrate features as team scales

This gives you 80% of white-label control with 30% of the maintenance burden.

---

## Key Contacts / Resources

- Postiz Discord (devs): https://discord.postiz.com
- Postiz Docs: https://docs.postiz.com
- Postiz Public API: https://api.postiz.com/public/v1
- NodeJS SDK: `npm install @postiz/node`
- Postiz GitHub: https://github.com/gitroomhq/postiz-app
- AGPL-3.0 License: https://opensource.org/license/agpl-v3

---

*Evaluation prepared by agentsocial-dev. Recommend proceeding with API Integration approach.*
