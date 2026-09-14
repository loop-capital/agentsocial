# Replit Integration — AgentSocial Client Onboarding

**Date**: 2026-05-22
**Status**: Plan — Ready for Build
**Author**: AgentSocial-CEO

---

## What Replit Brings to AgentSocial

Replit Agent + MCP server lets us **programmatically generate client sites** from a natural language prompt. This turns our manual client setup into an automated pipeline.

### Key Capability: `create_app_from_prompt`

The Replit MCP server exposes a `create_app_from_prompt` tool that:
1. Takes a natural language description of an app
2. Agent builds the entire project (code, UI, config)
3. Returns a URL to track progress
4. Deploys to production directly

This means: **Salon signs up → we generate their site automatically.**

---

## Integration Architecture

```
Client Signup (clawstudio.co)
        │
        ▼
AgentSocial API
        │
        ├──► Replit MCP: create_app_from_prompt
        │    "Build a salon landing page for PLEIJ Salon,
        │     Columbus OH. Include: booking widget, hours,
        │     services menu, AI chat widget, phone number.
        │     Brand colors: #000000, #ffffff. Style: modern minimalist."
        │
        │    Returns: deployed site URL
        │
        ├──► Hetzner API: provision VPS
        │    Returns: API + voice agent endpoints
        │
        └──► AgentSocial DB: create brand record
             Returns: API keys, configuration
        │
        ▼
Client Live (within 20 minutes)
  - Landing page (Replit)
  - AI Receptionist (Dograh on Hetzner)
  - Social media management (AgentSocial API)
```

---

## Use Cases for AgentSocial

### 1. Instant Client Sites (Primary Use)

When a salon signs up for Cloud Pro/Managed:
- Replit Agent generates a custom landing page with their branding
- Includes: booking widget, services menu, hours, AI chat, phone number
- Connected to our AgentSocial API for real bookings
- Deployed to `<client>.clawstudio.co` or their custom domain

**Time: ~5-10 minutes (vs. current ~2-3 hours manual)**

### 2. Demo Sites for Sales

Before a salon commits to paying:
- Generate a preview of what their AI-powered site would look like
- Include working voice agent demo (call a test number)
- Share link with salon owner for review
- Convert to full deployment when they sign up

**Time: ~3-5 minutes**

### 3. Feature Prototyping

Test new AgentSocial features in isolation:
- New booking widget design
- AI chat component variations
- Mobile app prototypes
- Landing page A/B tests

---

## Implementation Plan

### Phase 1: MCP Connection (This Week)

```bash
# Add Replit MCP server to AgentSocial
# In openclaw.json or .mcp config:
{
  "mcpServers": {
    "replit": {
      "command": "npx",
      "args": ["@replit/mcp-server"],
      "env": {
        "REPLIT_TOKEN": "<from Replit settings>"
      }
    }
  }
}
```

Then call `create_app_from_prompt` from our onboarding flow.

### Phase 2: Template Prompts (Week 1)

Build standardized prompts for salon vertical:

```python
SALON_SITE_PROMPT = """
Build a modern salon landing page for {salon_name}.

Features:
- Hero section with salon name and tagline
- Services menu with pricing (data provided via API)
- Online booking widget connected to /api/v1/bookings
- Business hours sidebar
- AI chat widget (bottom-right corner)
- Phone call CTA button
- Google Maps embed
- Customer reviews section
- Instagram feed integration

Brand colors: {primary_color}, {secondary_color}
Style: {brand_tone} (warm professional / trendy casual / luxury spa)
Address: {address}
Phone: {phone}

Connect all booking actions to AgentSocial API:
- GET /api/v1/bookings/availability
- POST /api/v1/bookings
- GET /api/v1/services

Deploy as a Next.js app with Tailwind CSS.
"""
```

### Phase 3: Automated Pipeline (Week 2)

Wire into our provisioning script:

```bash
# In provision.sh, after VPS is created:
REPLIT_URL=$(npx @replit/mcp-server create_app_from_prompt \
  "$(generate_salmon_prompt $CLIENT_NAME)" \
  --type web \
  --deploy)

# Update DNS to point to Replit deployment or our VPS
```

---

## Cost Analysis

| Item | Replit Cost | Our Cost | Notes |
|------|-------------|----------|-------|
| Site generation | ~$0.50/generation | $0 | Replit credits |
| Site hosting | ~$5-10/mo per site | $0 | Replit deployment |
| Voice agent | $0 | $7-14/VPS | Still on Hetzner |
| API backend | $0 | $7-14/VPS | Still on Hetzner |

**Total per client**: ~$12-24/mo (Replit hosting) + $14-28 (Hetzner VPS) = **$26-52/mo**

At $99-149/mo pricing, that's **57-82% margin**. Good enough.

---

## What NOT to Use Replit For

- ❌ Voice agent (Dograh) — needs real-time audio, Twilio webhooks
- ❌ API backend — needs PostgreSQL, Redis, persistent state
- ❌ Production database — needs reliability, backups
- ✅ Client landing pages — perfect fit
- ✅ Demo sites — perfect fit
- ✅ Prototyping — perfect fit

---

## Next Steps

1. Get Replit account + API token
2. Add Replit MCP server to OpenClaw config
3. Build salon site template prompts
4. Test `create_app_from_prompt` with PLEIJ data
5. Wire into provision.sh pipeline