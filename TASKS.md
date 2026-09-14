# AGENTSOCIAL — ACTIVE TASKS

> ⚠️ **Stale (flagged 2026-09-13):** not updated since 2026-04-25 — nearly
> 5 months, the stalest plan doc in the fleet. `MEMORY.md` and
> `PROJECT_STATUS.md` are far more current (both actively maintained via
> weekly curation) — check those first. Per the fleet's new plan-doc
> discipline: keep this file current as you work, or retire it if
> `MEMORY.md`'s "Blocked/Pending" section has fully superseded it.

**Project Lead:** AgentSocial-CEO
**Location:** PC2 (Office)
**Workspace:** /home/jason/.openclaw/workspaces/agentsocial

---

## 🔥 PRIORITY 1: Website Builder — Template Engine (Customer-Facing)
**Status:** IN DEVELOPMENT (agentsocial-dev assigned)
**Decision:** April 25, 2026 — Hybrid model: Templates for customers, Claude Code AI for internal
**Due:** May 9, 2026
**Brief:** See WEBSITE_BUILDER_BRIEF.md

### agentsocial-dev tasks:
- [ ] Build 4 template components (Landing, Link-in-Bio, Campaign, Portfolio)
- [ ] Build template engine (Next.js 14 + Tailwind + 21st.dev)
- [ ] Build API routes (POST /websites, GET /websites/:id, PUT, POST /deploy, GET /templates)
- [ ] Build database schema (websites, templates tables with brand_id scoping)
- [ ] Integrate Vercel deployment API
- [ ] Build frontend dashboard (template picker, brand config form, preview, deploy button)
- [ ] End-to-end test: create → configure → preview → deploy

### agentsocial-marketing tasks:
- [x] Competitor analysis: any social platform offering this? (Spoiler: No)
- [x] Pricing research: standalone website builders charge $12-30/mo
- [ ] Feature naming options (SiteFlow vs others)
- [ ] Target user persona identification
- [ ] Draft landing page copy for feature launch

---

## PRIORITY 2: Core Platform (IN PROGRESS)
**Status:** Code complete, testing phase
**MVP Deadline:** July 7, 2026

- [ ] Facebook connector testing (requires Meta Business Account)
- [ ] Analytics dashboard
- [ ] Post scheduling engine (Redis now ready — BullMQ unblocked)
- [ ] Per-brand pricing integration
- [ ] Deployment pipeline

---

## TABLED / BACKLOG

### Website Builder — Claude Code AI (Internal Tool)
**Status:** TABLED
**Reason:** Awaiting ANTHROPIC_API_KEY for headless Claude Code CLI
**Use Case:** Internal site generation for premium tier or agency partners
**Location:** `/home/jason/.openclaw/workspaces/agentsocial/tools/website-builder-setup/`
**Unblock:** Provide ANTHROPIC_API_KEY → prototype generation within 1 week

### Meta Business Account Setup
**Status:** PENDING (Jason)
**Needed For:** Facebook connector testing, Instagram API access
**Action:** Create Meta Developer App + Business Account verification

---

## Completed
- ✅ Monorepo setup (api, shared, web, facebook-connector)
- ✅ Fastify backend with Drizzle ORM
- ✅ Next.js 14 frontend scaffold
- ✅ PostgreSQL schema design
- ✅ Full stack built (30+ files)
- ✅ Graphify knowledge graph installation (completed April 16, 09:08 EDT)
- ✅ Manus API integration research (completed April 17, 13:54 EDT)
- ✅ Postiz integration evaluation (completed April 17, 16:11 EDT)
- ✅ AgentSocial full architecture specification (completed April 17, 22:27 EDT)
- ✅ Website builder research foundation completed
- ✅ Website builder hosting evaluation completed
- ✅ Website builder token cost estimation completed
- ✅ Website builder API endpoints scoped
- ✅ Website builder database schema designed
- ✅ Redis server operational (April 25, 09:48 EDT)
- ✅ Hybrid model decision: templates for customers, Claude for internal (April 25, 09:56 EDT)
