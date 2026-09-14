# 2026-05-12 — DFY Service Build Plan (Saved for Tomorrow)

## Context
User wants to build a Zoca-style done-for-you (DFY) marketing service as an **additional paid service outside** the licensed AgentSocial platform. This is a separate revenue stream, not part of the core SaaS.

---

## What We Found About Zoca

### The Smoking Gun Evidence
From Zoca's own Red Chair Salon case study (scraped with Firecrawl):
- **Before Zoca**: "Yelp charged me for 349 clicks — but none of them sat in my chair." "Wasted $688 on Yelp in 10 days"
- **After Zoca**: "2+ Booking Requests/Day — without ads or chasing after clicks"
- **Proof**: Google Ads Transparency Center shows "Can't find advertiser" for Zoca — they do NOT run traditional paid ads

### What Zoca Actually Does ($299/mo)
- **Discovery Agent**: GBP optimization + basic SEO (organic, free)
- **Win Agent**: AI chat/SMS capturing existing demand
- **Loyalty Agent**: Automated rebooking/upsells
- **Social Agent**: Organic social content (Thrive only)
- **No ad spend**: Zero. All organic automation.

### Why Wife Cancelled
She paid $299/mo for ~$50 worth of automation:
- GBP optimization: 30 min/week DIY = FREE
- AI chat: Simple chatbot = $20-50/mo
- Landing page: zoca.com subdomain (she has pleijsalon.com)
- Social content: AI writing tools = $30/mo

---

## Our Competitive Advantage

| Feature | Zoca ($299) | AgentSocial DFY ($499) |
|---------|-------------|------------------------|
| Ad Spend | **$0** | **$500/mo included** |
| Google Search Ads | ❌ | ✅ |
| Facebook/Instagram Ads | ❌ | ✅ |
| Retargeting | ❌ | ✅ |
| Custom Domain | ❌ | ✅ |
| Conversion Tracking | ❌ | ✅ |

**Math**: Zoca = $299 for 0 ads = 2-4 leads/week. AgentSocial DFY = $499 with $500 ads = 17-29 leads/week.

### Killer Pitch
> "Zoca got you 2 bookings/day organically by NOT running ads. We'll get you 10+ by ACTUALLY running ads with real budgets."

---

## What We Have Already (AgentSocial Core)

1. ✅ **Social scheduler** + AI content generation
2. ✅ **SiteFlow Builder** — Full drag-and-drop (better than Zoca's 1-pager)
3. ✅ **Square Billing** — Payment processing
4. ✅ **Clipify** — Video repurposing
5. ✅ **Supabase DB** — PostgreSQL with brand_id scoping
6. ✅ **Auth System** — JWT + API keys
7. ✅ **Monorepo** — packages/backend, packages/frontend, packages/api, packages/shared

---

## What We Need to Build

### Phase 1: Core DFY Features (Week 1)
| Feature | Status | Complexity | Priority |
|---------|--------|------------|----------|
| **Google Business Profile API** | ❌ Not started | Medium | **HIGH** |
| **Review Management** (auto-respond + solicit) | ❌ Not started | Low | **HIGH** |
| **AI Chat/SMS Widget** | ❌ Not started | Medium | **HIGH** |
| **Rebooking Campaigns** (SMS/email) | ❌ Not started | Medium | **HIGH** |

### Phase 2: Service Infrastructure (Week 2)
| Feature | Status | Complexity | Priority |
|---------|--------|------------|----------|
| **Account Manager Portal** | ❌ Not started | Medium | **HIGH** |
| **Service Tier UI** | ❌ Not started | Low | **MEDIUM** |
| **Upgrade/Downgrade Flows** | ❌ Not started | Low | **MEDIUM** |
| **White-label Option** | ❌ Not started | Medium | **LOW** |

### Phase 3: Advanced DFY (Month 2)
| Feature | Status | Complexity | Priority |
|---------|--------|------------|----------|
| **Paid Ads API** (Google Local + Meta) | ❌ Not started | High | **MEDIUM** |
| **Multi-location Management** | ❌ Not started | Medium | **LOW** |
| **AI Voice Assistant** | ❌ Not started | High | **LOW** |

---

## Service Tiers (Proposed)

### Tier 1: Core (Self-Serve)
**Price**: $49-79/mo
- Social scheduler + AI content
- Multi-platform posting
- Basic analytics
- SiteFlow builder (DIY)

### Tier 2: Pro (Semi-DFY)
**Price**: $199-299/mo
- Everything in Core, PLUS:
- GBP management (weekly posts, Q&A, photos)
- Review management
- AI chat widget
- Monthly content strategy call
- Automated rebooking campaigns
- Simple SiteFlow landing page

### Tier 3: Elite (Full DFY — Zoca Killer)
**Price**: $499-799/mo
- Everything in Pro, PLUS:
- Full social media management (we create + post)
- GBP daily optimization
- 24/7 AI chat/SMS/voice
- **$500/mo Google + Facebook ad spend**
- Conversion tracking (GA4 + GTM)
- Retargeting campaigns
- Multi-location management
- Dedicated account manager
- Monthly performance reports

---

## What I Need From User (Tomorrow)

### 1. API Keys
| Service | Key Needed | For |
|---------|-----------|-----|
| **Google Business Profile API** | OAuth credentials | GBP management |
| **Google Ads API** | Developer token | Paid ads (Elite tier) |
| **Twilio/SMS** | Account SID + Auth | SMS booking/chat |
| **OpenAI/Claude** | API key | AI chat assistant |
| **Facebook/Meta** | App credentials | Meta ads (Elite tier) |

### 2. Business Decisions
- **Branding**: AgentSocial-branded or white-label?
- **Billing**: Separate Stripe account or existing Square?
- **Support**: Dedicated Slack/Discord or email?
- **Onboarding**: Self-serve or manual calls?

### 3. Domain/Hosting
- Separate domain for DFY service?
- Or keep under agentsocial.com?

### 4. Team/Operations
- Who handles DFY work initially?
- Hire account managers or fully automated?
- Wife as case study #1?

---

## Recommended Next Steps

### Tomorrow's Session:
1. **Start with GBP API integration** — highest impact, medium complexity
2. **Create account manager dashboard** — simple CRUD for managing clients
3. **Set up wife's salon as case study #1** — free Elite tier
4. **Build review management** — auto-respond + solicit reviews

### This Week:
5. Build AI chat widget (embeddable on any site)
6. Create rebooking campaign templates
7. Set up Pro tier billing ($199/mo)

### Next Week:
8. Build Elite tier features (paid ads integration)
9. Create comparison landing page (Zoca vs AgentSocial DFY)
10. Beta test with 3-5 salon clients

---

## Files Created/Updated
- `memory/2026-05-11.md` — Business model pivot
- `memory/2026-05-11-pleij-analysis.md` — Pleij Salon analysis
- `memory/2026-05-11-zoca-ads-analysis.md` — Zoca ads strategy
- `memory/2026-05-12-zoca-complete-analysis.md` — Complete feature breakdown
- **This file**: Build plan for DFY service

---

## Key Insights

1. **Zoca does NOT run ads** — they replace ads with organic automation
2. **Wife paid $299 for ~$50 of value** — she realized this and cancelled
3. **Our opportunity**: Do what Zoca does + ACTUALLY run paid ads
4. **Market validated**: 1,000+ salons pay Zoca $199-499/mo
5. **Differentiation**: We have content engine + SiteFlow + real ad spend

**Next session starts with: Build Google Business Profile API integration.**
