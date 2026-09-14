# AgentSocial — Roadmap

**Last Updated:** 2026-08-31
**Philosophy:** Build → Ship → Iterate. No more Phase 3 plans that sit for weeks.

---

## 🔴 CRITICAL: 86 Days Stale (June 6 → Aug 31)

Last commit `8da9913` was June 6. 122 files changed, 2,248 insertions, 19,482 deletions uncommitted. **Loss risk CRITICAL. No user activity for over 12 weeks.** All roadmap items below are blocked until someone commits and resumes work.

---

## NOW (Week of Aug 31-Sep 6) — Commit + Unblock

The absolute priority is committing the uncommitted work and breaking the stale period. 86 days with no commits — over 12 weeks stale:

1. **🔴 COMMIT uncommitted work** — 122 files, 2,248 insertions at risk. Generation API expansion (+622 lines: voice clone, lipsync, TTS, Seedance multi-ref), Review Sentry funnel UI, ClientVet routes, project-docs, voice agent changes, shared dist rebuilds, `pleij-llms.txt`, content-creation framework, chat widget, bank partnership contacts
2. **🔴 APPLY for GBP API access** — Eligible since July 22 (40 days ago!). No one applied. Do it now.
3. **🔴 Activate DataForSEO billing** — Jason to add payment method at https://app.dataforseo.com → Billing
4. **🔴 Jason to star 3-5 Batch 1 ideas** → then produce final scripts
5. Push latest code to PC3 — Review Sentry + ClientVet auth wiring, social routes, PLEIJ phone fix, Generation API expansion, content creation system
6. **Add muapi credits** and test Generation API end-to-end (voice clone, lipsync, TTS, multi-ref)
7. Fix OpenAI quota for PLEIJ voice agent (add credits or switch to Gemini)
8. **Voice agent live test** — Call PLEIJ (614-665-1751) and verify full booking flow
9. **Add reschedule endpoint** to voice API
10. **Map remaining 5 stylists** to STYLIST_MAP
11. **Review Sentry public page** — Build funnel UI for `/review/[slug]`
12. **SMS end-to-end test** — Real Twilio test with PLEIJ number
13. **Connect ClientVet → Voice Agent API handler**
14. **Clean up stale Cloudflare tunnels** (openclaw-schwab, schwab-tunnel)
15. **Clean up duplicate Dograh workflow** (delete "Receptionist - Inbound" ID 1)
16. **Build PLEIJ Digital Twin frontend UI** — Voice clone + lipsync workflow
17. **Bank partnership outreach** — Start with Climate First (has partnership form)

## NEXT (Weeks 2-4) — Social + Production

1. **Social OAuth UI** — Frontend connect flow (Composio for IG/FB/YouTube, Zernio for GBP/TikTok)
2. **Publishing pipeline** — Test BullMQ workers actually posting to FB/IG/X/TikTok/GBP
3. **Frontend auth** — Wire auth context to all routes
4. **Plausible integration** — Self-host on Hetzner, tracking script on SiteFlow sites, API into dashboard
5. **Supabase production fix** — Auto-wake or migrate off free tier
6. **Hetzner deployment** — Get Jason's account, set up Docker + Caddy + Plausible
7. **DNS wildcard** for *.clawstudio.co
8. **GetUpLook fixes** — Newsletter, logos, WP password
9. **The Salon Project outreach** — Sales lead (Phorest user, NYC, SEO audit done)
10. **Zernio MCP server** for Maven agent
11. **Build own content research pipeline** (replace ScrapeGraph dependency)
12. **PLEIJ demo walkthrough** — End-to-end for the salon
13. **Google Ads MCP evaluation** — For Elite tier paid ads management

## LATER (Month 2) — Growth Features

1. **DFY service tiers** — Pro ($199) and Elite ($499) flows
2. **Phorest API integration** — Salon booking beyond Square
3. **Fish S2 TTS** — Better voice for AI receptionist
4. **ClientVet Phase 3-4** — Peer network, blocklist
5. **Omni API integration** — When available (character videos)
6. **Paid ads API** — Google Ads, Meta Ads for DFY clients
7. **Plausible analytics dashboard** — Pull 3 metrics into AgentSocial UI
8. **Bank partnership program** — Formalize CDFI outreach after initial contact

## SOMEDAY — Nice to Have

- Multi-language support
- Advanced analytics (predictive)
- Team collaboration features
- Visual generation pipeline (carousels, quote cards)
- White-label SEO reports
- Auto-blog (RSS → blog post)
- Google Ads MCP integration (after Elite tier launch)

---

## Completed Milestones

- **Apr 1:** ADR-001: Fastify over Express
- **Apr 29:** ADR-008: SiteFlow as template engine, ADR-010: Own connectors
- **May 3-6:** Phase 0 + 1 (auth, data flow, onboarding)
- **May 8:** Clipify video repurposing, ADR-009
- **May 10:** Memory system overhaul
- **May 11:** Business model pivot (SaaS + DFY), ADR-007
- **May 15:** Dograh voice agent deployed, ADR-003
- **May 19:** Composio integration, ADR-004
- **May 23:** Review Sentry + ClientVet built, pricing finalized
- **May 25:** Content research (40-30-20-10 formula, posting schedules)
- **May 26:** Square production integration (PLEIJ), ADR-005 + ADR-006
- **May 27:** Voice onboarding UI + booking provider research
- **May 31:** muapi generation integration (12 endpoints), ADR-011
- **May 31:** Plausible analytics decision, ADR-012
- **Jun 2:** Zernio integration (GBP, TikTok, inbox, CRM), ADR-013
- **Jun 3:** PC3 staging deployment (API :3002, Web :3000, PM2, Maven user)
- **Jun 6:** Review Sentry + ClientVet auth-wired (dynamic brandId), Voice Agent check_client_risk
- **Jun 8:** Weekly curation + docs review
- **Jun 15–Jul 20:** Weekly curation reviews (no new commits)
- **Aug 3–Aug 17:** Weekly docs reviews (58–72 days stale)
- **Aug 24:** Weekly docs review (79 days stale. Chat widget files appeared.)
- **Aug 25:** Agent Reach v1.5.0, OpenSEO MCP, OpenCLI v1.8.7 installed
- **Aug 26:** Jason returned (first session since Jul 19). DataForSEO setup, PLEIJ content creation system built (Briar PBA framework + 10 scripts with shot lists)
- **Aug 27:** Google Skills Analysis — google/skills mostly GCP lock-in; only Google Ads MCP worth integrating
- **Aug 30:** Bank partnership contacts research — 5 CDFI/community banks identified
- **Aug 31:** Weekly docs review (86 days stale)

---

## Blocked/Pending

- ❌ GBP API access — **rejected June 2** (60-day age). **Eligible to reapply since July 22 — 40 days, still not applied.** Zernio bridge active (ADR-013).
- ❌ Hetzner Cloud account + API key — need from Jason
- ❌ DNS wildcard for *.clawstudio.co
- ❌ Phorest API credentials — apply for first client
- ❌ Square SDK bug — searchAvailability camelCase (bypassed with raw HTTPS)
- ❌ Video add-on pricing: $99 vs $149 (Jason to decide)
- ⚠️ Supabase DB pauses when idle — needs manual resume
- ❌ PM2 startup script for PC3 (needs sudo for systemd)
- ❌ OpenAI quota exhausted (429 insufficient_quota) — need credits or switch to Gemini
- ⚠️ Duplicate Dograh workflow — "Receptionist - Inbound" (ID 1) should be deleted
- ⚠️ DataForSEO — free trial with zero limits — Jason needs to add payment method
- 🔴 **86 days since last commit** — 122 uncommitted files, CRITICAL loss risk (over 12 weeks stale)