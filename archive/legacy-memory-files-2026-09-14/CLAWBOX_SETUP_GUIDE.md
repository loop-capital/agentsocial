# ClawBox Setup Guide — AgentSocial Customer Onboarding

## Overview

This document describes how a customer receives, configures, and begins using their ClawBox with AgentSocial.

## Pre-Shipping (We Do This)

1. **Hardware preparation**
   - Raspberry Pi 5 or Mac Mini pre-configured
   - OpenClaw installed and configured
   - AgentSocial backend + frontend deployed
   - Database initialized with seed templates (24 templates)
   - Default agents configured with recommended Models Lab models
   - SSH access configured

2. **Software stack pre-installed**
   - Docker + Docker Compose
   - Node.js + npm
   - PostgreSQL
   - Ollama (local LLM inference)
   - Nginx (reverse proxy)
   - SSL certificates (self-signed, customer replaces with own)

## Customer Receives ClawBox

### Step 1: Physical Setup
1. Plug in power
2. Connect to router (ethernet preferred)
3. Wait for boot (LED indicator)
4. Access local dashboard: `https://clawbox.local` or `http://[device-ip]`

### Step 2: Setup Wizard (First Boot)

#### 2.1 Welcome & Account Creation
- Create admin account (email, password)
- Set ClawBox name (e.g., "jasons-clawbox")
- Choose timezone

#### 2.2 Models Lab Integration
**Critical: Customer must have their own Models Lab account**

- Option A: "I have a Models Lab account"
  - Input API key
  - Verify key (test call to Models Lab)
  - Show available credits

- Option B: "I need to create a Models Lab account"
  - Open iframe/link to modelslab.com/signup
  - Walk through signup process
  - Return to paste API key

- Option C: "Skip for now" → Uses Ollama only (limited functionality)

**Why their own account?**
- Privacy: Their API usage, their data
- Cost control: They pay for what they use
- Scalability: No shared pool limits
- Compliance: No data mixing between customers

#### 2.3 AI Model Selection

Pre-filled with recommended models based on agent roles:

| Agent | Recommended Model | Purpose |
|-------|------------------|---------|
| CEO | Qwen 3.5 397B | Strategy, decisions |
| Architect | DeepSeek V4 Pro | System design |
| Dev | Qwen 3.5 Coder | Code generation |
| Marketing | DeepSeek R1 | Copy, campaigns, reasoning |
| Research | Kimi K2.6 | Long context analysis |
| Design | GLM-5.1 | Visual concepts |
| Image Gen | FLUX Pro | Social media images |
| Video Gen | Wan 2.6 Video | Short clips |
| Audio | Elevenlabs TTS | Voiceovers |

Customer can:
- Accept all recommendations (one click)
- Customize per agent (dropdown per row)
- Add their own model endpoints (advanced)

**Fallback logic:**
- If Models Lab unavailable → falls back to Ollama local models
- If Ollama model not loaded → auto-pulls on first use

#### 2.4 Social Media Connections

OAuth connections for:
- Twitter/X
- LinkedIn
- Instagram (Business account)
- Facebook (Business page)
- TikTok (Business)
- YouTube (optional, for source ingestion)

Each shows:
- Login button → OAuth popup → authorize → connected
- Test post button (sends "Hello from AgentSocial!")
- Disconnect button

#### 2.5 Brand Voice Setup

- Brand name
- Industry (dropdown: SaaS, Agency, E-commerce, etc.)
- Tone slider: Professional ←→ Casual
- Voice examples: "We are" vs "I'm", formal vs conversational
- Sample output: Generate a test post to preview voice

#### 2.6 Website Integration

- "Connect your website" (SiteFlow)
  - Enter domain
  - Verify ownership (DNS TXT record or file upload)
  - Auto-install tracking pixel
- Or: "Create new website with AI" (generates from template)

#### 2.7 Review & Activate

Summary screen showing:
- ✅ Models Lab connected (credits: X)
- ✅ X agents configured with Y models
- ✅ Z social accounts connected
- ✅ Brand voice: [preview]
- ✅ Website: [status]

"Activate ClawBox" button → initializes all services → dashboard loads

## Post-Setup: Dashboard Access

**URL:** `https://agentsocial.[clawbox-name].local` or custom domain

### Navigation Sidebar
- **Dashboard** — Overview, stats, recent activity
- **Posts** — Create, schedule, manage social posts
- **Calendar** — Visual content calendar
- **Analytics** — Performance metrics
- **Templates** — Content template library + research
- **Website** — SiteFlow website builder
- **AI Studio** — Image/video/audio generation
- **Agents** — Manage OpenClaw agents
- **Settings** — Models, integrations, billing

## Models Lab Integration Details

### API Usage

**Base URL:** `https://modelslab.com/api/v6/`
**Chat URL:** `https://modelslab.com/api/uncensored-chat/v1/`

**Authentication:**
```json
{
  "key": "CUSTOMER_API_KEY"
}
```

**Image Generation Example:**
```bash
POST https://modelslab.com/api/v6/images/text2img
{
  "key": "CUSTOMER_KEY",
  "model_id": "flux",
  "prompt": "Professional social media graphic about AI automation",
  "width": 1024,
  "height": 1024,
  "samples": 1
}
```

**Chat/Completion Example:**
```bash
POST https://modelslab.com/api/uncensored-chat/v1/chat/completions
Authorization: Bearer CUSTOMER_KEY
{
  "model": "deepseek-r1",
  "messages": [{"role": "user", "content": "Write a LinkedIn post about..."}]
}
```

### Cost Tracking

Built-in usage dashboard shows:
- Images generated this month
- Tokens used by model
- Estimated cost
- Credits remaining (if Models Lab provides API)

### Fallback Chain

```
Models Lab API → Ollama local → Anthropic (if customer key) → OpenAI (if customer key)
```

## Maintenance & Updates

### Automatic
- Security patches (nightly)
- Template library updates (weekly)
- Model list refresh (daily)

### Manual
- OpenClaw agent updates (via CLI)
- Major version upgrades (quarterly)
- Custom model additions (anytime)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Models Lab key invalid" | Re-enter key at Settings → AI Models |
| "No credits remaining" | Customer tops up at modelslab.com |
| "Ollama model not found" | Auto-pulls on first use, or manual: `ollama pull [model]` |
| "Social auth expired" | Re-authenticate at Settings → Social |
| "Website not loading" | Check DNS, verify SSL, restart nginx |

## Security Considerations

1. **API Keys stored encrypted** in PostgreSQL
2. **No shared API keys** between customers
3. **Local processing preferred** (Ollama) for sensitive data
4. **HTTPS only** for all endpoints
5. **SSH key auth** for admin access
6. **Firewall rules** block external DB access

## Pricing Implications

**Our cost:** Hardware + shipping (~$200-500 one-time)
**Customer cost:**
- Models Lab: PAYG (~$10-50/mo typical usage)
- Domain: ~$12/yr
- Electricity: ~$5/mo

**No recurring fees to us** — customer pays model providers directly.

## Next Steps After Setup

1. Create first post using AI composer
2. Schedule a week's content
3. Generate website with SiteFlow
4. Review analytics after 7 days
5. Invite team members (if applicable)

## Support Resources

- In-app help (question marks on each page)
- Documentation: `https://docs.agentsocial.io`
- Community: Discord/Slack
- Priority support: Email with ClawBox ID

---

*Document Version: 1.0*
*Last Updated: 2026-04-29*
*Applies to: ClawBox v1.0, AgentSocial v0.1*
