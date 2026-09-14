# HEARTBEAT.md

## Build Status — 2026-09-13

### 📚 Source of Truth
**Read these first, keep them current:**
- `project-docs/ARCHITECTURE.md` — System architecture (updated Aug 31)
- `project-docs/DECISIONS.md` — ADR records (13 decisions, updated Aug 31)
- `project-docs/INFRASTRUCTURE.md` — Infra state + deployment plan (updated Aug 31)
- `PROJECT_STATUS.md` — What's done vs not done (updated Aug 31)
- `ROADMAP.md` — Prioritized roadmap (NOW / NEXT / LATER, updated Aug 31)
- Wiki vault entities: `agentsocial-platform`, `gisele-voice-agent`, `deployment`

### Platform Status
- **API**: 0 TS errors ✅ (PC3 port **3002**, 32 route modules, ~265 endpoints)
- **Web**: 0 TS errors ✅ (PC3 port 3000, 35 pages)
- **Voice Agent**: Dograh deployed, Square production on port 3015
- **Generation**: muapi adapter + Gemini provider + Adobe Firefly MCP (17 endpoints + 5 Firefly tools)
- **Social**: Zernio adapter (ADR-013) — 46 endpoints in social.ts alone (profiles, accounts, OAuth, posts, inbox, contacts, analytics, broadcasts, sequences, automations, CRM)
- **Connected Accounts**: PLEIJ — IG (Composio), FB (Composio), YouTube (Composio), TikTok (Zernio), GBP (Zernio)
- **Review Sentry**: Auth-wired (dynamic brandId), needs public funnel UI
- **ClientVet**: Auth-wired, check_client_risk in Voice Agent booking flow
- **Voice Onboarding**: 3 pages built (/voice, /voice/onboarding, /voice/dashboard)
- **Content Creation**: Briar PBA framework in `content-creation/` — 4 framework files + SKILL.md + PLEIJ brand voice + 10 scripts with shot lists
- **DataForSEO**: Account active, needs billing activation (free trial has zero limits)
- **Agent Reach**: v1.5.0 installed (YouTube, V2EX, RSS, web; Twitter/Reddit need cookies)
- **OpenSEO MCP**: DataForSEO backend, needs billing activation
- **Bank Partnerships**: 5 CDFI/community banks identified (Climate First priority)
- **DB**: 21+ tables pushed
- **Staging Deploy**: ✅ PC3 (API :3002, Web :3000, PM2, Maven user) | ❌ Production (need Hetzner)
- **Last Deploy**: commit 8da9913 (June 6)

### 🔴 CRITICAL: 98 Days Since Last Commit (14+ Weeks)
Last commit: 8da9913 (June 6). Uncommitted work:
- Generation API expansion (+622 lines: voice clone, lipsync, TTS, Seedance multi-ref)
- Review Sentry public funnel UI (667 lines modified)
- ClientVet route expansion (54+ new lines)
- Project-docs updates (ARCHITECTURE, DECISIONS, INFRASTRUCTURE)
- Voice agent modifications (PLEIJ receptionist, signature validation patches)
- Chat widget (new — assets/chat-widget/, API route, web component)
- Content creation framework (new — content-creation/ with Briar PBA system)
- Bank partnership contacts (new — bank-partnership-contacts.md)
- Shared dist rebuilds
- `pleij-llms.txt` (new file)
- 104 files changed, 2,500 insertions, 19,468 deletions
**Loss risk is CRITICAL. 98 days. 14+ weeks.**

### NOW (Week of Sep 14-20) — Updated Sep 13
1. 🔴 **COMMIT uncommitted work** — 98 days at risk, loss risk CRITICAL (104 files)
2. 🔴 **APPLY for GBP API access** — Eligible since July 22 (52 days!). No one applied yet.
3. 🔴 **Activate DataForSEO billing** — Jason to add payment method at https://app.dataforseo.com → Billing
4. 🔴 **Jason to star 3-5 Batch 1 ideas** → then produce final scripts
5. Push latest code to PC3 (Review Sentry + ClientVet auth wiring, social routes, PLEIJ phone fix, Generation API expansion, content creation system)
6. **Add muapi credits** and test Generation API end-to-end (voice clone, lipsync, TTS, multi-ref)
7. Fix OpenAI quota for PLEIJ voice agent (add credits or switch to Gemini)
8. Test real inbound call to PLEIJ (614-665-1751) after LLM fix
9. Voice agent: add reschedule endpoint
10. Map remaining 5 stylists to STYLIST_MAP
11. Build Review Sentry public funnel UI (`/review/[slug]`)
12. SMS end-to-end test with real Twilio
13. Connect ClientVet → Voice Agent API handler
14. Clean up stale Cloudflare tunnels (openclaw-schwab, schwab-tunnel)
15. Clean up duplicate Dograh workflow (delete "Receptionist - Inbound" ID 1)
16. Build PLEIJ Digital Twin frontend UI (voice clone + lipsync workflow)
17. Bank partnership outreach — Start with Climate First (has partnership form)
18. **Booth rental lead pipeline** — Enrich remaining Columbus leads, expand to MeetSpa, set up Dial outreach (treg + Dial iMessage)
19. **Adobe Firefly MCP** — Test firefly_generate and firefly_generate_video end-to-end for social content
20. **Composio** — Resolve Adobe Firefly OAuth connection properly (session resets blocked prior attempts)

### NEXT (Weeks 2-4)
1. Social OAuth UI flow (Composio + Zernio backend → frontend connect)
2. Publishing pipeline (BullMQ → actual posting to FB/IG/X/TikTok/GBP)
3. Plausible integration (self-host on Hetzner, tracking script on SiteFlow sites, API into dashboard)
4. Frontend auth wired to all routes
5. Supabase production fix (auto-wake or migrate)
6. The Salon Project outreach (sales lead — Phorest user, NYC)
7. Zernio MCP server for Maven agent
8. Build own content research pipeline (replace ScrapeGraph dependency)
9. GetUpLook fixes (newsletter, logos, WP password)
10. Hetzner deployment + DNS wildcard for *.clawstudio.co
11. PLEIJ demo walkthrough — End-to-end for the salon
12. Video add-on pricing decision — $99 vs $149 (Jason to decide)
13. Google Ads MCP evaluation for Elite tier

### Blocked/Pending
- ❌ GBP API access — **rejected June 2** (60-day age). **Eligible to reapply since July 22 — 52 days, NOT YET APPLIED.** Zernio bridge active (ADR-013).
- ❌ Hetzner Cloud account + API key — need from Jason
- ❌ DNS wildcard for *.clawstudio.co
- ❌ Phorest API credentials — apply for first client
- ❌ Square SDK bug — searchAvailability camelCase (bypassed with raw HTTPS)
- ❌ Video add-on pricing: $99 vs $149 (Jason to decide)
- ❌ OpenAI quota exhausted (429 insufficient_quota) — need credits or switch to Gemini
- ⚠️ Duplicate Dograh workflow — "Receptionist - Inbound" (ID 1) should be deleted
- ⚠️ Supabase DB pauses when idle — needs manual resume
- ⚠️ DataForSEO — account active but **free trial with zero limits** — Jason needs to add payment method
- ❌ PM2 startup script for PC3 (needs sudo for systemd)
- 🔴 **98 days since last commit** — 104 uncommitted files, CRITICAL loss risk (14+ weeks stale)
- ❌ Adobe Firefly via Composio OAuth — session resets blocked; Firefly MCP is working alternative

### 🔄 Weekly Docs Review Cron
Every Monday 10AM ET — review project-docs/, wiki entities, MEMORY.md for staleness.

### 🔄 Weekly Memory Curation Cron
Every Sunday 4AM ET — review daily logs, curate MEMORY.md, update HEARTBEAT.md. Last run: 2026-09-13. Staleness updated: 2026-09-13 (98 days).
