# AgentSocial Build Plan — 2026-09-13

## Strategy Summary
- **One system with feature gates** (not two separate systems)
- **LTX stays internal** (too complex/expensive for customers)
- **muapi/Gemini for customer video/image generation**
- **SiteFlow stays internal** (our landing pages, demos)
- **GoHighLevel (GHL) for customer CRM/website/funnels**
- **BYOK for high-cost AI generation** (muapi, OpenAI, Anthropic)

## Pricing Tiers

| Tier | Price | What's Included |
|------|-------|-----------------|
| Core | $49/mo | Social scheduling, basic AI (Gemini free), 1 brand, 3 channels, 50 posts/mo |
| Pro | $199/mo | + GHL sub-account, full AI suite (voice, chat, content), GBP + reviews, SiteFlow |
| Elite | $499/mo | + GHL white-label, DFY services, Google Ads, priority support |
| Voice AI | $99/mo add-on | AI receptionist (inbound calls, Square booking, review requests) |

## AI Provider Strategy

| Use Case | Provider | Billing |
|----------|----------|---------|
| Basic text/summaries | Gemini Flash | Us (free tier) |
| High-quality images | Imagen 3 (Google) | Us (reasonable cost) |
| Video generation | muapi (Seedance, Kling) | Customer BYOK |
| Advanced text (Claude) | Anthropic | Customer BYOK |
| Voice/avatar (internal) | LTX (RunPod) | Internal only |

## Build Phases

### Phase 1: Foundation (Week 1)
1. **Commit 104 uncommitted files** — 98 days stale, CRITICAL loss risk
2. **Test publishing pipeline end-to-end** — BullMQ workers actually posting to FB/IG/X/TikTok/GBP
3. **Wire frontend auth to all routes** — Auth context currently not fully wired
4. **Fix OpenAI quota** — Add credits or switch to Gemini for PLEIJ voice agent
5. **Map remaining 5 stylists** — Complete STYLIST_MAP entries
6. **Clean up duplicate Dograh workflow** — Delete "Receptionist - Inbound" ID 1
7. **Clean up stale Cloudflare tunnels** — openclaw-schwab, schwab-tunnel

### Phase 2: Buffer Dashboard + AI Generation (Week 2–3)
1. **Build Buffer-style post creation UI**
   - Tabs: Text, Image, Video, AI Generate
   - Platform selection: Instagram, TikTok, Facebook, YouTube, X, LinkedIn, GBP
   - Schedule: Now, Later, Best Time (AI-suggested)
   - Preview mode
2. **Integrate AI generation buttons**
   - "Generate Image from Caption" → muapi nano-banana → Cloudinary
   - "Generate Video from Caption" → muapi Seedance → Cloudinary
   - "Generate Related Posts" → AI suggests variations for other platforms
3. **Add scheduling + queue**
   - BullMQ workers for each platform
   - Optimal timing per platform (Tue-Thu 11am for salons)
   - Auto-schedule related posts with staggered timing
4. **Build content calendar view**
   - Weekly/monthly calendar
   - Drag-and-drop rescheduling
   - Platform color-coding

### Phase 3: GHL Integration (Week 4)
1. **Sign up for GHL Agency plan** ($297/mo)
2. **Build GHL → AgentSocial sync**
   - Contacts import
   - Booking sync
   - Campaign tracking
3. **Build AgentSocial → GHL sync**
   - Posts → GHL social calendar
   - Analytics → GHL dashboards
   - Review responses → GHL reputation management
4. **Add GHL OAuth/connect flow**
   - Settings → Integrations → Connect GHL
   - Sub-account selection

### Phase 4: Customer-Ready Features (Week 5)
1. **BYOK settings UI**
   - Settings → Integrations → Add API Keys
   - muapi, OpenAI, Anthropic
   - Usage tracking per key
2. **Review Sentry public funnel UI**
   - `/review/[slug]` page
   - QR code generation
   - SMS dispatch
3. **AI chat widget**
   - Claude-powered website chat
   - Square booking integration
   - ClientVet risk assessment
4. **Content creation pipeline**
   - Briar PBA framework integration
   - Brand voice training
   - Batch content generation

### Phase 5: Production Deployment (Week 6)
1. **Hetzner Cloud deployment**
   - Sign up for Hetzner account
   - Get API key from Jason
   - Deploy Docker containers
2. **DNS wildcard**
   - `*.clawstudio.co` for customer subdomains
   - `agentsocial.co` for marketing
3. **Plausible analytics**
   - Self-host on Hetzner
   - Tracking script on SiteFlow sites
   - API integration into dashboard
4. **Supabase production fix**
   - Auto-wake or migrate off free tier

### Phase 6: Sales Readiness (Week 7)
1. **Landing page**
   - Value proposition: "Buffer for agents"
   - Pricing table
   - Demo video (PLEIJ end-to-end)
2. **Demo flow**
   - PLEIJ salon walkthrough
   - Voice agent live call
   - Content calendar in action
3. **Onboarding wizard**
   - Brand setup
   - Platform connections
   - First post guided creation
4. **Documentation**
   - API docs (OpenAPI/Swagger)
   - Agent integration guide (OpenClaw skill)
   - GHL integration guide

## Internal-Only Features (Not in Customer Tiers)
- LTX video generation (high-cost GPU)
- Full analytics exports
- Multi-brand management (for our own brands)
- Custom integrations (bank partnerships)
- Agent Reach research tools
- SiteFlow website builder (internal demos)

## Blocked Items (Need Jason Action)
- GBP API reapply (eligible since July 22)
- Hetzner Cloud account + API key
- DataForSEO billing activation
- Video add-on pricing decision ($99 vs $149)
- PLEIJ Batch 1 content production (star 3-5 favorites)

## Key Metrics to Track
- API uptime (target: 99.9%)
- Publishing success rate (target: 95%+)
- AI generation cost per post (target: <$0.50)
- Customer onboarding time (target: <10 min)
- Time to first post (target: <5 min after signup)

## Tech Debt to Address
- 48 TS errors in packages/backend (legacy)
- packages/voice-agent TS errors (skipped on PC3)
- Duplicate Dograh workflow
- Supabase idle pause issue
- PM2 startup script (needs sudo for systemd)

---
*Created: 2026-09-13*
*Status: Not started*
*Next action: Commit uncommitted files*
