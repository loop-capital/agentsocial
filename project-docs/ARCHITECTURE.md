# AgentSocial Platform Architecture

**Last Updated:** 2026-06-01
**Status:** Active development

## System Overview

AgentSocial is a social media automation platform with an integrated website builder (SiteFlow), AI voice receptionist (Gisele), and AI content generation (muapi/Gemini). The platform serves two markets: self-serve SaaS and done-for-you (DFY) service tiers.

## Monorepo Structure

```
agentsocial/
├── packages/
│   ├── api/              # Fastify 4 backend (port 3001, 31 route files, 25 services)
│   ├── web/              # Next.js 14 frontend (port 3000)
│   ├── backend/          # Legacy creative engine (48 TS errors, not active)
│   ├── shared/           # Zod schemas, types, constants
│   ├── voice-agent/      # Gisele AI receptionist + Square API (port 3015)
│   ├── adobe-toolkit/    # Firefly + Stock API clients (327 + 247 lines)
│   └── facebook-connector/ # Facebook integration (legacy)
├── siteflow/             # Website builder (Next.js 14 + Tailwind + 21st.dev)
├── infra/                # Infrastructure config (Docker, Caddy, Ansible)
├── project-docs/         # Architecture, decisions, infrastructure docs
├── directives/           # SOPs, pricing, workflows
├── memory/               # Daily logs
├── skills/               # Agent skills (SEO auditor, AISO checker)
├── services/spamshield/  # SpamShield microservice
└── web/                  # Landing pages (spamsuit.co, my-app)
```

## Active Services

| Service | Port | Status | Purpose |
|---------|------|--------|---------|
| API Server | 3001 | ✅ Running | Main backend API (31 route modules) |
| Web App | 3000 | ✅ Running | Next.js dashboard |
| Voice Agent | 3015 | ✅ Running | Square booking API for Gisele |
| Dograh UI | 3020 | ✅ Running | Voice agent management UI |
| Dograh API | 8010 | ✅ Running | Voice workflow engine |
| SiteFlow Preview | 3456 | On-demand | Website builder preview |

## API Routes (31 modules, ~50+ endpoints)

| Module | Key Endpoints |
|--------|--------------|
| auth, api-keys, browser-auth | JWT auth, API keys, OAuth |
| posts, media, comments | Content CRUD, Cloudinary uploads |
| brands, channels, profiles | Brand management, social profiles |
| analytics, competitors | Dashboard data, competitor monitoring |
| billing, billing-tiers | Square billing, tier management |
| generation | **12 endpoints** — image, video, character, voice profile (muapi + Gemini) |
| gbp, google-oauth | Google Business Profile (pending API access) |
| clientvet | Client risk flags, deposit requirements |
| review-sentry, review-solicitation, review-templates | Review management |
| composio, callbacks | Social OAuth integrations |
| clipify | Video repurposing (11 endpoints) |
| twilio-webhooks, sms, sms-templates | SMS dispatch |
| campaigns, ad-management, conversion-tracking | Campaign + ads framework |
| account-manager, landing-pages, chat-widget | Client management, landing pages, AI chat |
| health, sync, legal | System health, data sync, legal pages |

## Database

- **Provider:** Supabase PostgreSQL
- **Host:** db.rswwiinrtsctgyzblchm.supabise.co
- **ORM:** Drizzle
- **Tables:** 21+ core tables (16 original + 5 ClientVet + Clipify + generation + campaign + ads + landing-pages + conversion-tracking)
- **⚠️ Warning:** Supabase pauses when idle — needs manual resume or migration for production

## Key Integrations

### Auth & Billing
- JWT auth (register/login/me) with bcryptjs
- API key generation + hash storage
- Square billing integration (production, PLEIJ connected)
- Multi-tier billing (Core $49, Pro $199, Elite $499)

### Social Media (via Composio MCP)
- Composio handles OAuth for IG, FB, X, LinkedIn, TikTok
- API key: `ak_ZUf…qtCYx` (Free tier, 20K calls/mo)
- Upgrade to Pro ($29/mo) when we have paying customers

### Content & Media Generation
- **muapi**: 200+ AI models (images, video, character, voice profile)
- **Gemini**: Free-tier fallback for generation
- **Claude API + OpenAI**: Text generation fallback
- **Cloudinary**: Media upload & transformations
- **Clipify**: Video repurposing (Whisper transcription → moment detection → reframe → captions)
- **yt-dlp**: YouTube download
- **Adobe Express Embed SDK**: In-app image editing (free tier)

### Voice AI
- **Dograh**: Self-hosted Vapi alternative (~$15/mo vs $32/mo)
- **Gisele**: AI phone receptionist for PLEIJ salon
- **3 workflows**: Inbound receptionist, rebooking reminders, review requests
- **Square production API** connected (10 stylists, 334 services)
- **Fish S2**: Planned TTS swap for better voice quality (at 20+ salon scale)

### Website Builder (SiteFlow)
- Next.js 14 + Tailwind + 21st.dev + Vercel
- Template engine for customer sites
- 3 clones built: Pedro, Amie, Notion (port 3456)

### Analytics
- **Plausible**: Self-hosted on Hetzner (free, open source)
- Built into all plans (not an upsell)
- Tracking script on every SiteFlow site
- API pulls 3 metrics into AgentSocial dashboard (visitors, top pages, conversion rate)

## Deployment Status

**❌ No production deployment yet.** Current blockers:
- Need Hetzner Cloud account + API key from Jason
- Need DNS wildcard for *.clawstudio.co
- Need Docker + Caddy reverse proxy config
- Supabase DB pauses when idle (needs fix for production)

## Frontend Pages (35+)

Dashboard + marketing pages + 3 voice-specific pages + generation UI + account management. Auth context not fully wired to all routes.

## Architecture Decision Records

See `project-docs/DECISIONS.md` for 12 ADRs including:
- ADR-001: Fastify over Express
- ADR-003: Self-hosted Dograh over Vapi
- ADR-004: Composio for social OAuth
- ADR-011: muapi adapter pattern for generation
- ADR-012: Self-hosted Plausible for analytics