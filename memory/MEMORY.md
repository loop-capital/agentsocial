# MEMORY.md — AgentSocial-CEO Long-Term Memory

> **Last updated:** 2026-09-20
> **Daily notes:** `memory/YYYY-MM-DD.md`

---

## 🔴 CRITICAL: 106 Days Since Last Commit

Last commit: `8da9913` (June 6). **~104 uncommitted files** at risk of loss.
No user sessions since Sep 13 (7 days). All activity is automated cron/maintenance.

**Sep 13 checkpoint:** 5781c52 — "98 days of uncommitted AgentSocial work"

---

---

## Team & Machines

| Machine | Agents | Access |
|---------|--------|--------|
| **PC2** | Che, ColorGenius-CEO, ByondEdu-CEO, AgentSocial-CEO, Builder-CEO | Local |
| **PC1** | Eddie (stock), Lucy (main) | `ssh pc1` (home-pc.tail93c2b5.ts.net) |
| **PC3** | Eiza (main), Pleij | `ssh pc3` (100.109.228.58, user: loopcapital) |

---

---

## AgentSocial Platform — Current State

### What's Working
- **API**: 0 TS errors, PC3 port 3002, ~260 endpoints
- **Web**: 0 TS errors, PC3 port 3000, 35 pages
- **Voice Agent**: Dograh deployed, Square production (port 3015)
- **Social**: Zernio adapter (ADR-013) — 46 endpoints
- **Connected Accounts**: PLEIJ — IG, FB, YouTube (Composio), TikTok, GBP (Zernio)
- **Review Sentry**: Auth-wired, needs public funnel UI
- **ClientVet**: Auth-wired, integrated into Voice Agent booking flow

### Blocked Items
- **GBP API**: Rejected June 2, reapply eligible since **July 22** — now **60 days past**, still not applied
- **Hetzner Cloud**: Need account + API key from Jason
- **DNS wildcard**: *.clawstudio.co needed
- **Phorest API**: Need to apply for credentials
- **Video add-on pricing**: Jason to decide $99 vs $149
- **PM2 startup script**: Needs sudo on PC3
- **OpenAI quota exhausted** — voice agent blocked, need credits or switch to Gemini
- **DataForSEO**: Free trial with zero limits — needs payment method from Jason

### Voice Agent (PLEIJ Salon)
- Phone: +16146651751, Twilio SID: AC_REDACTED
- Dograh workflow ID 2: "PLEIJ Salon Receptionist"
- Cloudflare tunnel routing: `voice.getagentsocial.com` → API (8010), `dograh.getagentsocial.com` → UI (3020)
- **Blocked**: OpenAI quota exhausted (429 insufficient_quota) — need credits or switch to Gemini
- Signature validation patched (Cloudflare breaks HMAC-SHA1)

### Key Architecture Decisions
- Cloudflare tunnel routing: `dograh.` = UI, `voice.` = API
- `docker cp` can corrupt files — use volume mounts in docker-compose.yaml
- Dograh BYOK schema: `provider` as discriminator (flat object)
- Deepgram model: `nova-3` (not `nova-3-general`)

---

## Strategic Direction

**Ecosystem loop:** ByondEdu → COLORgenius → Marketplace → GetUpLook → Prokyur → repeat

**Square deal:** Cost-plus pricing. Cross-promotion to salon base.

**Growth model:** Consumer-pulled — clients recruit stylists via Formula IDs.

---

## Recent Work (Sep 13 — Last User Session)

### Phase 2 Task 3: AI Generation Integration
- Added `generateText` to `GenerationService` using muapi `gemini-2.0-flash`
- Created Cloudinary helper for asset storage
- New API routes: `/generate/image-from-caption`, `/generate/video-from-caption`, `/generate/related-posts`
- Frontend: Generate Image/Video/Related Posts buttons in post creation flow
- **Status**: Code delivered; full build blocked by pre-existing TS errors (MCP server missing `GenerationService` methods, `@agentsocial/shared` types not resolving, `gbp/page.tsx` missing `GbpAccount` type)
- Targeted type-check of changed files = 0 errors

### Adobe Firefly MCP Setup
- MCP server configured with `firefly_generate` and `firefly_generate_video` tools
- Added to agent toolkit for social content generation

### Composio Troubleshooting
- OAuth session resets blocked proper Adobe Firefly connection via Composio
- Firefly MCP remains the working alternative

---

---

## Key Accounts
- **Square:** hello@pleijsalon.com / Nat1shafl0! (2FA)
- **Davines Pro:** tiche@pleijsalon.com / Luxott1ca!
- **OpenAI**: Quota exhausted — needs credits or switch to Gemini
- **Twilio**: Account SID AC_REDACTED (ClawStudio)
- **DataForSEO**: Account active, free trial with zero limits — needs billing activation

---

## Lessons Learned
- Check PC3 MEMORY.md before assuming agent names
- Don't ask Jason for things I can find myself
- When Jason says "start building" — go fast
- Seasonal content = outbound marketing, NOT landing page
- Phone is primary device for stylists
- **Always check Docker logs first** — hours wasted before finding real issues
- **Always check routing config** — BACKEND_API_ENDPOINT pointed to wrong service
- **Cloudflare breaks Twilio signature validation** — HMAC-SHA1 computed against wrong URL
- **Use volume mounts, not docker cp** — docker cp can corrupt files
- **Dograh BYOK schema**: provider as discriminator (flat), not nested
- **Pre-existing TS errors block all verification** — must be fixed before any build can be declared green
- **Daily cron notes accumulate identical stale entries** — weekly curation is essential
