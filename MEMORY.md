# MEMORY.md - Curated Long-Term Memory

**Last reviewed:** 2026-09-13 (weekly curation cron)
**Full details:** See `project-docs/` for architecture, decisions, infrastructure, and `PROJECT_STATUS.md` for current status.

---

## Quick Reference

### Architecture (see project-docs/ARCHITECTURE.md for full details)
- **Monorepo**: `packages/api` (Fastify 4, 32 route modules, ~265 endpoints), `packages/web` (Next.js 14, 35 pages), `packages/shared`, `packages/voice-agent`, `packages/adobe-toolkit`
- **Database**: Supabase PostgreSQL (Drizzle ORM), 21+ tables
- **Auth**: JWT + API keys (`as_dev_` prefix)
- **Social OAuth**: Composio (IG/FB/X/LinkedIn/YouTube) + Zernio (TikTok/GBP/inbox/broadcasts/CRM) | **Voice**: Dograh + Square | **Content**: muapi + Gemini + Claude/OpenAI + Cloudinary + Clipify + Adobe Firefly (MCP)
- **Content Creation**: Briar PBA framework in `content-creation/` — voice rules, principles, hook frameworks, ideation + PLEIJ brand voice + 10 Batch 1 scripts
- **Scraping**: Agent Reach v1.5.0 (YouTube, V2EX, RSS, Bilibili, web; Twitter/Reddit need cookies)
- **SEO**: OpenSEO MCP (DataForSEO, needs billing activation), DataForSEO account active (info@pleijsalon.com, free trial zero limits)
- **Browser Automation**: OpenCLI v1.8.7 (166 adapters, needs Chrome on PC2)
- **Website Builder**: SiteFlow (Next.js 14 + Tailwind + 21st.dev)
- **Analytics**: Plausible (self-hosted, free)
- **Bank Partnerships**: 5 CDFI/community banks identified (Climate First priority)
- **13 ADRs** — see `project-docs/DECISIONS.md`

### Service Tiers
| Tier | Price | Model |
|------|-------|-------|
| Core | $49/mo | Self-serve social media tools |
| Pro | $199/mo | DFY: GBP, reviews, AI chat, rebooking, SiteFlow |
| Elite | $499/mo | Full DFY + ads, 24/7 AI, multi-location |
| Voice AI | $99/mo add-on | AI receptionist (14-day free trial) |

**Customer vs Internal:**
- **Customer-facing**: Social scheduling, AI content (muapi/Gemini), GHL integration, voice agent
- **Internal-only**: LTX video generation, SiteFlow builder, Agent Reach research, full analytics exports
- **BYOK for high-cost AI**: muapi, OpenAI, Anthropic API keys added by customer in settings

**Build Plan**: See `BUILD_PLAN_2026-09-13.md` — 6 phases, 7 weeks to sales readiness

### Critical Credentials
- **Dial (AI Comms)**: Account theoplandgroup@gmail.com, number +1(256)573-4641, API key sk_live_***wuYC, $5 free credit, pay-as-you-go, listen service running, CLI v0.39.0
- **Treg (Tool Catalog)**: CLI installed v0.15.0, team the-opland-group, logged in as theoplandgroup@gmail.com, 60 providers/2896 endpoints, $0.14 remaining credit
- **Composio**: CLI v0.7.21 at /home/jason/.local/bin/composio, authenticated with uak_* key, plugin `@composio/openclaw-plugin@0.0.12` enabled in OpenClaw
- **Adobe Firefly MCP**: adobe-firefly-mcp server installed, WSLg wrapper at /tmp/firefly-mcp-wrapper.sh, account clawstudioai@outlook.com, 5 tools available
- **ANTHROPIC_API_KEY**: `packages/backend/.env`, `packages/api/.env`
- **Supabase DB**: postgresql at db.rswwiinrtsctgyzblchm.supabise.co
- **autocli**: ✅ WORKING — CDP bridge, port 19825
- **cli-anything-mailchimp**: ✅ INSTALLED — `cli-anything-mailchimp` on PATH, 303 commands (lists, campaigns, report, automations, ecommerce, templates). Set `MAILCHIMP_API_KEY` to activate.
- **MUAPI_API_KEY**: `packages/api/.env` (GENERATION_DEFAULT_PROVIDER=muapi)
- **Composio API Key**: `ak_ZUf…qtCYx` (rotated May 23, Free tier 20K calls)
- **Square**: Production credentials in `packages/voice-agent/.env` (PLEIJ salon)
- **PLEIJ Twilio**: **614-665-1751** (+16146651751) — THIS IS THE PLEIJ SALON NUMBER. NOT 740. NOT ANY OTHER NUMBER. DO NOT FORGET THIS.
- **Dograh (Voice Agent UI)**: localhost:3020 | **Dograh API**: localhost:8010 | **Voice API**: localhost:3015
- **PC3 API port**: **3002** (NOT 3001 — it's 3002 on PC3)
- **PC3 Web port**: 3000
- **Adobe Express Client ID**: `2cfb2e097e5a4e97b7b09bffdcdc5a79`
- **Adobe Express App Name**: AgentSocial
- **OpenClaw Gateway**: Compaction configured (safeguard mode, 4GB max)
- **DataForSEO**: login `info@pleijsalon.com`, free trial (zero limits, needs billing activation)

### Open Design
- **Location**: `/home/jason/open-design` (cloned from github.com/nexu-io/open-design)
- **Version**: 0.9.0 (Apache-2.0)
- **Node**: v24.16.0 (nvm use 24)
- **Daemon port**: 45453 | **Web UI port**: 46305
- **Start**: `cd /home/jason/open-design && nvm use 24 && pnpm tools-dev run web`
- **MCP**: Wired into OpenClaw (`open-design` server in `~/.openclaw/openclaw.json`)
- **Skills**: 157 (ad-creative, copywriting, brandkit, social-x-post-card, etc.)
- **Design Systems**: 152 (luxury, minimal, modern, bold, clean, etc.)
- **Integration**: SiteFlow templates, Adobe Express replacement, content pipeline
- **Agent adapters**: Claude Code, Codex, Cursor, OpenClaw, Copilot, Gemini, etc.

### Tool Paths
- QMD DB: `/home/jason/.config/qmd/qmd.db` | Binary: `/home/jason/.local/bin/qmd`
- Wiki: `~/.openclaw/wiki/agentsocial/` | Obsidian: `~/.openclaw/obsidian-vault/`
- Graphify: `/home/jason/.local/bin/graphify`
- Memory: `~/.openclaw/workspaces/agentsocial/memory/`

### Cron Jobs
- **QMD Re-index**: daily 6AM ET | **Weekly Curation**: Sun 4AM ET | **Graphify Refresh**: Mon/Thu 3AM ET

---

## Key Decisions & Milestones (Condensed)

### April 2026
- **Apr 1**: ADR-001 (Fastify over Express)
- **Apr 29**: ADR-008 (SiteFlow template engine), ADR-010 (Own connectors over Ayrshare)
- **Apr 29**: Business model pivot to SaaS + DFY, ADR-007 (Core $49, Pro $199, Elite $499, Voice $99)

### May 2026
- **May 3-6**: Phase 0+1 (auth, data flow, onboarding wizard)
- **May 8**: Clipify (ADR-009), ByondEdu AI widget
- **May 15**: Dograh voice agent deployed (ADR-003, ~$15/mo vs Vapi $32/mo)
- **May 19**: Composio integration (ADR-004, free 20K calls/mo), SEO/AISO skills
- **May 21**: GetUpLook child theme fixed, Adobe Express SDK embedded
- **May 22**: Voice 3-layer architecture (Dograh→LLM→Business profile), Hetzner blocked
- **May 23**: Review Sentry + ClientVet + SMS Dispatcher (Twilio), 5 DB tables pushed
- **May 25**: Content research (40-30-20-10 formula, 11AM/7PM posting, before/after +86% engagement)
- **May 26**: Square production for PLEIJ (ADR-005 PLEIJ-only, ADR-006 raw HTTPS bypass SDK bug), 8 booking providers researched
- **May 27**: The Salon Project lead (NYC, Phorest user, SEO B/72 AISO D/42)
- **May 31**: muapi generation (ADR-011, 17 endpoints, $3.80/client/mo, 98.7% margin), Plausible (ADR-012, self-hosted free)

### June 2026
- **Jun 2**: Zernio integration (ADR-013, GBP+TikTok+inbox+broadcasts+CRM), GBP API rejected (60-day age, reapply July 22)
- **Jun 3**: PC3 staging deployment (API :3002, Web :3000, PM2, Maven user, API key prefix fix `as_dev_`)
- **Jun 6**: Review Sentry + ClientVet auth-wired (dynamic brandId), check_client_risk in Voice Agent
- **Jun 6**: **LAST COMMIT** (8da9913) — 92 days and counting

### July 2026
- **Jul 19**: PLEIJ Voice Agent troubleshooting — signature validation patched, WebSocket routing fixed, Cloudflare tunnel routing documented. **Blocked**: OpenAI 429 quota exhaustion.

### August 2026
- **Aug 2**: Generation API expansion — 5 new endpoints + 2 updated. PLEIJ Digital Twin workflow documented. 40+ models cataloged.
- **Aug 24**: Chat widget files appeared (assets, API route, web component). Likely build artifact.
- **Aug 25**: Agent Reach v1.5.0, OpenSEO MCP, OpenCLI v1.8.7 installed.
- **Aug 26**: Jason returned (first session since Jul 19). DataForSEO setup (needs billing activation), PLEIJ content creation system built (Briar PBA framework: voice-rules, principles, hook-frameworks, ideation + PLEIJ brand voice + 10 Batch 1 scripts with shot lists).
- **Aug 27**: Google Skills Analysis — google/skills mostly GCP lock-in; only Google Ads MCP worth integrating (Elite tier $499/mo for PLEIJ paid ads).
- **Aug 30**: Bank partnership contacts — 5 CDFI/community banks identified for AgentSocial partnership outreach (Climate First, Southern, Beneficial State, City First, Spring).
- **Aug 31**: Weekly docs review — all project-docs updated (ARCHITECTURE, DECISIONS, INFRASTRUCTURE, PROJECT_STATUS, ROADMAP, HEARTBEAT). Wiki entities updated.

### September 2026
- **Sep 3**: Treg CLI v0.15.0 installed (401 token issue resolved via `treg login`), Dial CLI v0.39.0 installed (+1-256-573-4641, $5 credit). Columbus OH booth rental lead research: 8 leads (3 verified), company enrichment via Tomba. Booth rental pipeline strategy: scrape directories → treg enrich → Dial outreach (iMessage/SMS). First user session since Aug 26.
- **Sep 7**: Session ended due to user threats over Composio access. Composio CLI v0.7.21 confirmed local and authenticated.
- **Sep 8**: Composio plugin `@composio/openclaw-plugin@0.0.12` enabled and ready in OpenClaw. Plugin works through OpenClaw's internal tool system, not standalone CLI. Treg credit: $0.14 remaining.
- **Sep 11**: Adobe Firefly MCP server installed and running via WSLg. Tools: firefly_generate, firefly_generate_video, firefly_variations, firefly_expand, firefly_remove_background. Account: clawstudioai@outlook.com. Session experienced multiple resets due to agent execution surface confusion.
- **Sep 11**: Composio CLI verified again: v0.7.21, authenticated with uak_* key. Adobe Firefly OAuth via Composio remained unresolved (session resets).

---

## Blocked/Pending
- ❌ GBP API access — **rejected June 2** (60-day age). **Reapply eligible since July 22 — 52 days, NOT YET APPLIED.** Zernio bridge active (ADR-013)
- ❌ OpenAI quota exhausted (429 insufficient_quota) — needs credits or switch to Gemini for PLEIJ voice agent
- ⚠️ Duplicate Dograh workflow — "Receptionist - Inbound" (ID 1) should be deleted
- ⚠️ Stale Cloudflare tunnels — openclaw-schwab, schwab-tunnel need cleanup
- ❌ ClientVet Phase 3-4 (peer network, blocklist)
- ❌ Frontend auth context not fully wired to all routes
- ✅ PC3 Deployment: API (port 3002) + Web (port 3000) running on PM2, accessible via Tailscale
- ❌ GetUpLook WP app password + newsletter button + inner page logos
- ❌ Hetzner Cloud account + API key from Jason
- ❌ DNS wildcard for *.clawstudio.co
- ❌ Phorest API credentials — apply for first client
- ❌ Square SDK bug — searchAvailability camelCase (bypassed with raw HTTPS)
- ⚠️ Supabase DB pauses when idle — needs manual resume
- ❌ Review Sentry public page funnel UI
- ❌ Build own content research pipeline (replacing ScrapeGraph dependency)
- ⚠️ Agent Reach: Twitter, Reddit, LinkedIn, Instagram need auth cookies/login (desktop-only for some)
- ⚠️ DataForSEO: Account active but **free trial with zero limits** — Jason needs to add payment method
- ⚠️ OpenCLI: Needs Chrome extension on PC2 + browser sessions for IG/FB/LinkedIn
- ❌ PLEIJ Digital Twin frontend UI (voice clone + lipsync workflow needs building)

## Staleness Status (Updated 2026-09-06)
- 🔴 **98 days since last commit** (8da9913, June 6). ~104 files changed, ~2,500 insertions uncommitted. **Loss risk CRITICAL.**
- **GBP API reapply date**: July 22 — eligible for 52 days. Not yet applied.
- **Pattern**: Dream cycles have produced zero actionable content for 103+ consecutive days.
- **Last meaningful user activity**: Sep 11 (Adobe Firefly troubleshooting).


## Promoted From Short-Term Memory (2026-09-13)

<!-- openclaw-memory-promotion:memory:claim:249be31edb3b -->
- Memory Maintenance: Daily note written (this file). [score=0.760 signals=10 recalls=0 avg=0.620 source=memory/2026-08-29.md:12-12] <!-- trigger: maintenance, written --> <!-- importance: 8 -->
