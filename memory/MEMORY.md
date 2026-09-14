# MEMORY.md — AgentSocial-CEO Long-Term Memory

> **Last updated:** 2026-07-19
> **Daily notes:** `memory/YYYY-MM-DD.md`

---

## Team & Machines

| Machine | Agents | Access |
|---------|--------|--------|
| **PC2** | Che, ColorGenius-CEO, ByondEdu-CEO, AgentSocial-CEO, Builder-CEO | Local |
| **PC1** | Eddie (stock), Lucy (main) | `ssh pc1` (home-pc.tail93c2b5.ts.net) |
| **PC3** | Eiza (main), Pleij | `ssh pc3` (100.109.228.58, user: loopcapital) |

---

## 🔴 CRITICAL: 43 Days Since Last Commit

Last commit: `8da9913` (June 6). **371 uncommitted files** at risk of loss.
No user sessions in 5+ days. All activity is automated cron/maintenance.

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
- **GBP API**: Rejected June 2, reapply **July 22** (3 days)
- **Hetzner Cloud**: Need account + API key from Jason
- **DNS wildcard**: *.clawstudio.co needed
- **Phorest API**: Need to apply for credentials
- **Video add-on pricing**: Jason to decide $99 vs $149
- **PM2 startup script**: Needs sudo on PC3

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

## Key Accounts
- **Square:** hello@pleijsalon.com / Nat1shafl0! (2FA)
- **Davines Pro:** tiche@pleijsalon.com / Luxott1ca!
- **OpenAI**: Quota exhausted — needs credits or switch to Gemini
- **Twilio**: Account SID AC_REDACTED (ClawStudio)

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
