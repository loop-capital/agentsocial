# AgentSocial Platform — Project Status

**Last Updated:** 2026-08-31
**Phase:** Staging (PC3 deployment active, production pending)

---

## Build Health

| Component | TS Errors | Status |
|-----------|-----------|--------|
| `packages/api` | 0 | ✅ Compiles & runs (PC3 port 3002) |
| `packages/web` | 0 | ✅ Compiles & runs (PC3 port 3000) |
| `packages/backend` | ~48 | ⚠️ Legacy, not active (not deployed) |
| `packages/voice-agent` | TS errors | ⚠️ Skipped on PC3 (not needed for Maven dashboard) |
| Database (Supabase) | — | ✅ 21+ tables pushed |

## Staging Deployment (PC3)

| Service | Port | PM2 Process | Status |
|---------|------|-------------|--------|
| API Server | 3002 | `agentsocial-api` | ✅ Online |
| Web App | 3000 | `agentsocial-web` | ✅ Online |

- **Host:** DESKTOP-QLDDUVF (100.109.228.58 via Tailscale)
- **Maven user:** `maven@agentsocial.ai` with API key auth (`as_dev_` prefix)
- **Last deploy commit:** `8da9913` (June 6) — 🔴 **86 days since last commit**
- **Verified endpoints:** health, social/profiles, social/accounts, auth/register, auth/login, api-keys

## What's Done & Working

### Core Platform
- ✅ JWT auth (register/login/me) + API key auth (`as_dev_` prefix)
- ✅ Posts CRUD with brand ownership
- ✅ 4-step onboarding wizard
- ✅ Analytics + Settings pages wired to API
- ✅ Competitor monitoring (full stack)
- ✅ Square billing integration (production, PLEIJ)
- ✅ 22 schema tests passing
- ✅ **AI generation service** — muapi + Gemini adapter (17 endpoints: image, video, character, voice profile, voice clone, lipsync, TTS, Seedance multi-ref)
- ✅ **Account manager + client management routes**
- ✅ **Campaign + ad management framework**
- ✅ **Chat widget service**
- ✅ **Conversion tracking**
- ✅ **Landing pages service**
- ✅ **Multi-tier billing** (Core $49, Pro $199, Elite $499, Voice $99 add-on)
- ✅ **Legal pages route**
- ✅ **Profiles route**
- ✅ **Google OAuth route** (awaiting GBP API access)

### Social (Zernio + Composio)
- ✅ **Zernio integration (ADR-013)** — 14 base + 50+ extended endpoints
- ✅ **PLEIJ connected:** IG + FB + YouTube (Composio), TikTok + GBP (Zernio)
- ✅ Social route: 46 endpoints (profiles, accounts, OAuth, posts, inbox, contacts, analytics, broadcasts, sequences, automations, CRM)

### Voice Agent (Gisele)
- ✅ Dograh deployed (self-hosted Vapi alternative)
- ✅ 3 workflows: inbound receptionist, rebooking, review requests
- ✅ Square production booking API (10 stylists, 334 services)
- ✅ Voice onboarding UI (3 pages, 8 booking providers)
- ✅ Full booking lifecycle: availability → book → cancel confirmed
- ✅ **check_client_risk** integrated into PLEIJ booking flow

### Review & Client Management
- ✅ Review Sentry — auth-wired with dynamic brandId (no more hardcoded IDs)
- ✅ ClientVet — auth-wired, risk calculator, deposit requirements, private notes
- ✅ 5 ClientVet DB tables pushed
- ✅ PLEIJ brand consolidated: `32d72826-c0d4-4871-8488-27b2774b0380`

### Content & Media
- ✅ AI content generation (Claude + OpenAI + muapi + Gemini)
- ✅ Cloudinary media upload + transformations
- ✅ Clipify video repurposing (11 endpoints)
- ✅ Adobe Express Embed SDK (in-app image editing, free tier)
- ✅ yt-dlp YouTube download
- ✅ SEO/AISO audit skills

### Content Creation (Briar PBA Framework) — NEW Aug 26
- ✅ **Framework files**: voice-rules, principles, hook-frameworks, ideation + SKILL.md
- ✅ **PLEIJ brand voice**: brands/pleij.md (ICP, pillars, platforms, funnel goals)
- ✅ **Batch 1 ideas**: 10 ideas across all 4 pillars (brands/pleij-batch-1.md)
- ✅ **Batch 1 scripts**: Full scripts with shot lists, 21KB (brands/pleij-batch-1-scripts.md)
- ✅ **Format mix**: IG Reel (6), TikTok (2), Carousel (1), Thread (1)
- ⏳ **Next:** Jason to star 3-5 favorites → produce final content

### PLEIJ Digital Twin
- ✅ **Voice clone** — minimax-voice-clone ($0.65) or suno-voice-clone (FREE)
- ✅ **Lipsync** — 13 models for face+audio → talking head video ($0.04–$0.75)
- ✅ **TTS** — 6 models with voice_id support ($0.035–$0.65)
- ✅ **Seedance multi-ref** — Up to 5 images + video + audio ($1.50–$3.60)
- ✅ **Upload audio** — WAV/MP3/M4A → hosted audioUrl + audioId
- ✅ **Full pipeline** — voice clone → TTS → character → lipsync/multi-ref (all muapi)

### SEO & Research Tools — NEW Aug 25-27
- ✅ **Agent Reach v1.5.0** — YouTube, V2EX, RSS, Bilibili, web scraping (Twitter/Reddit need cookies)
- ✅ **OpenSEO MCP** — DataForSEO backend, account active, needs billing activation
- ✅ **DataForSEO** — Account active (info@pleijsalon.com), auth works, free trial with zero limits
- ✅ **Google Skills Analysis** — google/skills mostly GCP lock-in; only Google Ads MCP worth integrating (Elite tier $499/mo)

### Bank Partnership Research — NEW Aug 30
- ✅ **5 CDFI/community banks identified** for AgentSocial partnership outreach
- ✅ Priority: Climate First (St. Petersburg), Southern (AR), Beneficial State (Oakland), City First (DC), Spring (Bronx)
- ✅ See `bank-partnership-contacts.md` for full details

### Integrations
- ✅ Composio MCP (1,000+ apps, managed OAuth for IG/FB/X/LinkedIn/YouTube)
- ✅ Zernio (GBP, TikTok, inbox, broadcasts, sequences, automations, CRM, analytics)
- ✅ Square production API (PLEIJ)
- ✅ Twilio SMS (3 templates, rate limiting, opt-out)

## What's NOT Done (Real List)

### 🔴 Blocked — External Dependency
1. **GBP API access** — Rejected June 2 (60-day age). **Eligible to reapply since July 22 — 40 days ago. No one has applied yet.** Zernio bridge active (ADR-013).
2. **Hetzner Cloud** — Need Jason's account + API key for production deployment
3. **DNS wildcard** — Need *.clawstudio.co configured
4. **Omni API** — Waiting for public release
5. **DataForSEO billing** — Jason needs to add payment method at https://app.dataforseo.com → Billing

### 🟡 Ready to Build — No Blockers
1. **COMMIT uncommitted work** — 122 files, 2,248 insertions at CRITICAL risk of loss (86 days stale)
2. **Voice agent live test** — Never made a real phone call to PLEIJ (614-665-1751)
3. **Reschedule endpoint** — Voice API needs this
4. **Map remaining stylists** — 5 of 10 stylists need STYLIST_MAP entries
5. **Social OAuth UI flow** — Composio + Zernio backend exists, need frontend connect flow
6. **Publishing pipeline** — BullMQ workers exist, never tested posting to any platform
7. **Frontend auth** — Not fully wired to all routes
8. **GetUpLook** — Newsletter button, inner page logos, WP password
9. **Plausible setup** — Self-host on Hetzner alongside platform
10. **muapi credits** — Add credits and test generation end-to-end
11. **Review Sentry public page** — Funnel UI for `/review/[slug]`
12. **SMS end-to-end test** — Real Twilio test with PLEIJ number
13. **ClientVet → Voice Agent API handler** — Function defined, handler not connected
14. **PLEIJ content production** — Jason to star Batch 1 favorites → produce final content
15. **Bank partnership outreach** — Contact Climate First (has partnership form, tech-forward)

### 🟠 Strategic — Lower Priority
1. **Fish S2 POC** — Test TTS swap for AI receptionist
2. **ClientVet Phases 3-4** — Peer network, blocklist
3. **Phorest API** — Submit credentials request (first client: The Salon Project, NYC)
4. **Supabase idle fix** — Auto-wake or migrate for production
5. **Content research pipeline** — Build own pipeline vs ScrapeGraph dependency
6. **Video add-on pricing** — $99 vs $149 (Jason to decide)
7. **PLEIJ Digital Twin frontend** — UI for voice clone + lipsync workflow needs building
8. **Google Ads MCP integration** — For Elite tier ($499/mo) paid ads management

## Key Metrics

| Metric | Value |
|--------|-------|
| API route modules | 32 |
| API endpoints | ~265 (46 in social.ts, 17 in generation.ts) |
| Frontend pages | 35 |
| DB tables | 21+ |
| Booking providers researched | 8 |
| Staging deployments | 1 (PC3 via PM2) |
| Production deployments | 0 |
| Generation endpoints | 17 (muapi + Gemini: image, video, character, voice, clone, lipsync, TTS, multi-ref) |
| ADR decisions | 13 |
| Connected social accounts (PLEIJ) | 5 (IG, FB, YouTube, TikTok, GBP) |
| Content creation scripts | 10 (Batch 1, PLEIJ brand) |
| Bank partnership targets | 5 (CDFI/community banks) |
| Days since last commit | **86** (June 6) |

---

*Last reviewed: 2026-08-31. Previous: Aug 25, 2026.*