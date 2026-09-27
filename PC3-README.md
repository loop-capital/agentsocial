# PC3 AgentSocial Deployment Guide

## What This Branch Contains
Focused AgentSocial for Marcus' team (PLEIJ Salon, Che Lace, WigViz, COLORgenius, SKINgenius)

### Included:
- ✅ Social scheduling (Composio-backed: YouTube, Facebook, Instagram)
- ✅ ReviewSentry (review management + SMS outreach)
- ✅ Voice agent (booking flow with GHL integration)
- ✅ Basic auth + API keys
- ✅ Dashboard + analytics

### Removed:
- ❌ ClientVet (not needed for salon focus)
- ❌ GBP direct integration (use Zernio)
- ❌ TikTok/LinkedIn (Composio not configured)
- ❌ Salon prospector (separate tool)
- ❌ Newsjack (separate PR tool)

### Quick Start:
```bash
pnpm install
pnpm db:push
pnpm dev
```

### Composio Setup:
Ensure COMPOSIO_API_KEY is set in .env
Current connections: YouTube, Facebook, Instagram
