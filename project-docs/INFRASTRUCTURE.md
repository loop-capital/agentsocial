# AgentSocial — Infrastructure

**Last Updated:** 2026-09-14

## Current State: Development Only

**⚠️ No production deployment exists.** Everything runs on a single development machine (WSL2 Linux).

---

## Compute

| Service | Host | Port | Notes |
|---------|------|------|-------|
| API Server | WSL2 localhost | 3001 | Fastify 4 backend (34 route modules, ~270+ endpoints) |
| Web App | WSL2 localhost | 3000 | Next.js 14 frontend (35+ pages) |
| Voice Agent (Square) | WSL2 localhost | 3015 | Gisele booking API (8 endpoints) |
| Dograh UI | WSL2 localhost | 3020 | Voice agent management |
| Dograh API | WSL2 localhost | 8010 | Voice workflow engine |
| SiteFlow | WSL2 localhost | 3456 | Website builder preview (on-demand) |
| Open Design | WSL2 localhost | 46305 | Design system daemon (on-demand) |

## Database

- **Provider:** Supabase (Free tier)
- **Host:** db.rswwiinrtsctgyzblchm.supabise.co
- **ORM:** Drizzle
- **Tables:** 21+ (core + ClientVet + Clipify + generation + campaigns + ads + landing-pages + conversion-tracking)
- **⚠️ Risk:** Free tier pauses when idle. Needs manual resume or migration for production.

## External Services

| Service | Purpose | Tier | Cost |
|---------|---------|------|------|
| Supabase | PostgreSQL database | Free | $0/mo |
| Composio | Social OAuth + app integrations | Free | $0/mo (20K calls) |
| Square | PLEIJ billing + booking API | Production | $0 (merchant pays) |
| OpenAI | AI content generation | Pay-per-use | Variable |
| Anthropic | Claude API | Pay-per-use | Variable |
| muapi | Multi-model AI generation (200+ models) | Pay-per-use | ~$3.80/client/mo |
| Gemini | Free-tier AI generation fallback | Free | $0/mo |
| Cloudinary | Media upload + CDN for generated assets | Free tier | $0/mo |
| Dograh | Voice AI (self-hosted) | Self-hosted | ~$15/mo infra |
| Plausible | Analytics (self-hosted on Hetzner) | Self-hosted | $0/mo |
| DataForSEO | SEO data (DataForSEO) | Free trial | $0/mo (needs billing) |
| Agent Reach | Multi-platform scraping | Free | $0/mo |
| Dial | AI comms (iMessage/SMS) | Pay-as-you-go | $5 credit |
| Treg | Tool catalog | Pay-as-you-go | $0.14 remaining |

## Production Deployment Plan (NOT YET BUILT)

**Target:** Hetzner Cloud (pending Jason's account + API key)

### Planned Architecture
```
Internet → Cloudflare DNS (*.clawstudio.co)
  → Caddy reverse proxy (auto HTTPS)
    → API (Docker) :3001
    → Web (Docker) :3000
    → Voice Agent :3015
    → Dograh :3020/:8010
    → Plausible :8080
```

### Requirements (All Open)
- [ ] Hetzner Cloud account + API key (from Jason)
- [ ] DNS wildcard for *.clawstudio.co
- [ ] Docker Compose config (infra/ exists, needs testing)
- [ ] Caddy reverse proxy config
- [ ] Environment variable management (production secrets)
- [ ] CI/CD pipeline (GitHub Actions → Hetzner)
- [ ] Supabase migration or auto-wake solution
- [ ] Monitoring + alerting
- [ ] Plausible self-hosted setup on Hetzner

### Infra Files
- `infra/` — Docker Compose, Caddy, Ansible, deploy scripts
- `docker-compose.yml` — Local development
- `railway.toml` — Railway config (alternative to Hetzner)
- `vercel.json` — Vercel deployment (web frontend)

## Domain Strategy

- **clawstudio.co** — Primary domain
- **\*.clawstudio.co** — Wildcard for customer subdomains + services
- **agentsocial.co** — Marketing site (not yet configured)
- **spamsuit.co** — Landing page (deployed on Vercel)

## Key Credentials (locations, not values)

| Credential | Location |
|------------|----------|
| ANTHROPIC_API_KEY | packages/backend/.env, packages/api/.env |
| OPENAI_API_KEY | packages/backend/.env |
| MUAPI_API_KEY | packages/api/.env |
| CLOUDINARY_* | packages/api/.env, .env.example |
| Supabase DB URL | packages/api/.env |
| Composio API key | OpenClaw MCP config |
| Square credentials | packages/voice-agent/.env |
| Cloudinary credentials | packages/backend/.env |
| Adobe Client ID | packages/web/.env (NEXT_PUBLIC_ADOBE_CLIENT_ID) |
| Google OAuth | packages/api/.env (GBP API pending) |
| Gemini API key | packages/api/.env |
| Dial API key | packages/api/.env |

## Ports Reference

| Port | Service | Status |
|------|---------|--------|
| 3000 | Web frontend | ✅ Active |
| 3001 | API backend | ✅ Active |
| 3015 | Voice Agent (Square) | ✅ Active |
| 3020 | Dograh UI | ✅ Active |
| 3456 | SiteFlow preview | On-demand |
| 8010 | Dograh API | ✅ Active |
| 45453 | Open Design daemon | On-demand |
| 46305 | Open Design web UI | On-demand |

## Monitoring

**None.** No production monitoring, logging, or alerting in place yet. Plausible analytics planned for site traffic but not for infrastructure monitoring. Needs setup before launch.

## Recent Changes (Sep 2026)

- **Sep 13**: Cloudinary integration added for generated asset CDN (ADR-014)
- **Sep 13**: Generation MCP server expanded with post-creation wrappers (image-from-caption, video-from-caption, related-posts)
- **Sep 13**: Frontend social create page updated with AI generation buttons
- **Sep 13**: 98 days of uncommitted work checkpointed to git
