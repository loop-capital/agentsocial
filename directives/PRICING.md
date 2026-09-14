# AgentSocial Pricing — Final Specification

**Last Updated:** 2026-05-23
**Status:** Approved

## Tiers

| Tier | Price | Included | Our Cost | Margin |
|------|-------|----------|----------|--------|
| **Core** | $49/mo ($490/yr) | Social scheduling, content engine, analytics, simple landing page | ~$7-10 | ~80% |
| **Pro** | $199/mo ($1,990/yr) | Core + Review Sentry + ClientVet + GBP management + AI chat + SiteFlow website builder | ~$10-15 | ~93% |
| **Elite** | $499/mo ($4,990/yr) | Pro + paid ads management + multi-location + priority support | ~$15-20 | ~97% |
| **Voice AI** | $99/mo add-on | AI receptionist, booking, rebooking, review requests via phone (14-day free trial) | $16-38 (ElevenLabs) / $10-15 (self-hosted S2 @ 20+ salons) | 61-84% → 85%+ |
| **Ad Management** | $149/mo add-on | Google + Meta ad management, optimization, reporting (included in Elite) | ~$5-10 | ~95% |

## What Each Tier Includes

### Core ($49/mo)
- Social media scheduling (IG, FB, X via Composio)
- Content engine (AI-generated posts, captions, hashtags)
- Analytics dashboard
- Simple landing page (not full SiteFlow builder)
- Square billing integration

### Pro ($199/mo)
- Everything in Core
- **Review Sentry** — Review gating, solicitation, removal defense
- **ClientVet** — Client risk screening, deposit requirements, private notes
- **GBP management** — Google Business Profile optimization
- **AI chat** — Website + SMS chatbot for booking
- **SiteFlow website builder** — Full website builder (not in Core)

### Elite ($499/mo)
- Everything in Pro
- Paid ads management (Google Ads, Meta Ads)
- Multi-location dashboard
- Priority support (24/7)
- Dedicated account manager
- Custom AI training on brand voice

### Voice AI ($99/mo add-on)
- AI phone receptionist (handles calls 24/7)
- Booking, rebooking, cancellation handling
- Review request SMS after appointments
- Voicemail transcription + forwarding
- 14-day free trial for all new add-ons
- Uses: Dograh + Deepgram + GPT-4o-mini + ElevenLabs (→ Fish S2 at scale)

## Voice AI Cost Breakdown

### Current (ElevenLabs)
| Component | Cost/mo |
|-----------|---------|
| ElevenLabs TTS | $5-22 |
| Deepgram STT | ~$3 |
| GPT-4o-mini LLM | ~$2 |
| Twilio calls + number | ~$6-11 |
| Server/infra | ~$2 |
| **Total per salon** | **$16-38** |

### At Scale (Fish S2 self-hosted, 20+ salons)
| Component | Cost/mo |
|-----------|---------|
| Fish S2 TTS (self-hosted) | ~$0 marginal |
| Deepgram STT | ~$3 |
| GPT-4o-mini LLM | ~$2 |
| Twilio calls + number | ~$6-11 |
| GPU server (shared) | ~$3-4/seat |
| Server/infra | ~$2 |
| **Total per salon** | **$10-15** |

**Migration trigger:** Swap ElevenLabs → Fish S2 when 20+ salons on Voice AI.
**Quality gate:** Test Fish S2 voice quality against ElevenLabs before committing. Salon receptionist is first impression — quality > margin.

## Annual Pricing (2 months free)

| Tier | Monthly | Annual (2mo free) |
|------|---------|-------------------|
| Core | $49/mo | $490/yr |
| Pro | $199/mo | $1,990/yr |
| Elite | $499/mo | $4,990/yr |
| Voice AI | $99/mo | $990/yr |

## Competitive Positioning

| Feature | AgentSocial Pro ($199) | Zoca ($299) | Podium ($60B, enterprise) | Birdeye (review only) |
|--------|----------------------|-------------|--------------------------|----------------------|
| Review gating | ✅ | ❌ | ✅ | ✅ |
| Review removal defense | ✅ | ❌ | ❌ | Partial |
| Client screening (ClientVet) | ✅ | ❌ | ❌ | ❌ |
| Deposit requirements by risk | ✅ | ❌ | ❌ | ❌ |
| AI receptionist | ✅ ($99 add-on) | ❌ | ❌ | ❌ |
| Content engine | ✅ | Partial | ❌ | ❌ |
| Website builder | ✅ | "Starter" | ❌ | ❌ |
| GBP management | ✅ | Partial | ✅ | ✅ |
| Transparent pricing | ✅ | ❌ (book a call) | ❌ (enterprise) | ❌ (book a call) |

**Our edge:** We offer more than Zoca at $100 less, with features Podium and Birdeye don't have (client screening, deposit flow, review defense).

## Ad Management Add-on (Pro only, included in Elite)

| Service | Price | What They Get |
|---------|-------|---------------|
| Ad Setup (one-time) | $299 | Campaign creation, targeting, ad copy, creative |
| Monthly Ad Management | $149/mo add-on | Monitoring, optimization, A/B testing, reporting |
| Ad Spend | Passed through | Client pays Google/Meta directly (no markup) |

**Why this works:**
- We own the data pipeline (Review Sentry + ClientVet) → better targeting than any agency
- Transparent: no ad spend markup, clients respect that
- Included in Elite, add-on for Pro
- Review Sentry tells us which keywords trigger bad reviews → we bid on the right ones
- ClientVet tells us ideal customer profile → we target similar audiences
- Our ads are 2-3x more effective than generic agencies because we have the data

**What we don't do:**
- ❌ Mark up ad spend (clients hate hidden fees)
- ❌ Promise specific lead numbers (CPCs fluctuate)
- ❌ Make ads the core pitch (Review Sentry + ClientVet are differentiators)

## Future: COLORgenius Bundles (Phase 2)

Cross-product bundles launch after both products have paying customers.

| Bundle | Price | Includes | Savings vs. Separate |
|--------|-------|----------|----------------------|
| Stylist Starter | $99/mo | AgentSocial Core + COLORgenius Base (1 line) | ~$20/mo |
| Stylist Pro | $199/mo | AgentSocial Pro + COLORgenius Pro (3 lines) | ~$55/mo |
| Stylist Elite | $399/mo | AgentSocial Elite + COLORgenius Pro (unlimited) | ~$100/mo |

Standalone pricing for each product stays available. Bundles are an option, not the only path.

## Chain / Multi-Location Pricing (Phase 2)

Enterprise pricing for franchise chains (Great Clips, Supercuts, etc.):
- Per-seat volume pricing: ~50% of standalone
- Stylist upgrade path: individual Pro add-on
- Launch after 50+ independent salon customers

## Key Principles

1. **No fake reviews.** FTC fine: $50,120/violation. Google caught 89% of fake positives in 2025.
2. **ClientVet is a platform, not a content creator.** We surface data, businesses decide. Section 230 safe.
3. **Track behaviors, not opinions.** No-shows, cancellations, chargebacks. FCRA-safe.
4. **Rate reliability, not likeability.** Anti-discrimination by design.
5. **Review Sentry is Google-only.** Yelp prohibits review gating.
6. **Voice quality > margin.** Test Fish S2 thoroughly before migrating from ElevenLabs.
7. **Transparent pricing.** No "book a call" walls. Price on the page.