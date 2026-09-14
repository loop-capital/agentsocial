# AISO: Google AI Search Optimization Strategy for AgentSocial Clients

**Created**: 2026-05-23
**Status**: Active Strategy
**Priority**: CRITICAL — this is the future of local search

---

## The Problem

Google is fundamentally changing search. AI Overviews + AI Mode now answer queries directly at the top of results. For local businesses:

- Users click traditional links only **8% of the time** when AI Overview is present (vs 15% without)
- Users click links WITHIN AI Overviews only **1% of the time**
- AI Overviews went from 89% informational queries (Oct 2024) → 57% informational (Oct 2025) — meaning commercial, transactional, and local queries are increasingly triggering AI answers
- **AI Mode** (launched 2025) handles complex, multi-step queries with "query fan-out" — it runs multiple searches and synthesizes answers

**Bottom line**: If a salon isn't mentioned in the AI Overview or AI Mode response for "best hair salon near me", they're invisible — even if they rank #1 organically.

---

## What We Do for Clients (Our AISO Stack)

### Layer 1: GBP Optimization (Foundation)
Everything starts here. Google's AI pulls heavily from GBP data.

- **Complete every GBP field** — services, descriptions, categories, attributes, hours, photos
- **Primary category** — must match the most searched term (e.g., "Hair Salon" not "Beauty Salon")
- **Service descriptions** — keyword-rich, natural language (AI reads these)
- **Photos** — high quality, regularly updated, geotagged
- **Posts** — weekly GBP posts with services, offers, events
- **Q&A** — pre-populate with common questions + AI-friendly answers
- **Attributes** — "Women-owned", "Wheelchair accessible", "Accepts credit cards", etc.

### Layer 2: Review Velocity & Sentiment (Signal)
Google's AI weighs review signals heavily for local recommendations.

- **Minimum 4.5 stars** — below this, AI won't recommend you
- **Review velocity** — 5-10 new reviews/month minimum
- **Review keywords** — customers naturally mention services ("highlights", "balayage", "keratin")
- **Review responses** — respond to ALL reviews within 24h, keyword-rich responses
- **Review solicitation** — automated post-visit SMS/email requesting reviews

### Layer 3: Structured Data / Schema Markup (Machine-Readable)
AI models parse structured data directly. This is how they "understand" your business.

- **LocalBusiness schema** — name, address, phone, hours, geo coords
- **Service schema** — each service with description and price
- **Review/AggregateRating schema** — star rating and count
- **FAQ schema** — common questions with answers
- **Offer/Price schema** — service pricing
- **ImageObject schema** — with captions and alt text

**We already built the Schema Engine plugin for this** (1,146 lines PHP, 5 schema types, 19 REST endpoints).

### Layer 4: Content That AI Cites (Authority Building)
AI Overviews cite sources. We need our clients' content to be the source.

- **FAQ pages** — answer every question a customer might ask
- **Service pages** — detailed descriptions with pricing, process, duration
- **Blog/content** — "Best Hair Color for Brunettes", "How to Maintain Balayage"
- **Before/after galleries** — with descriptive alt text and captions
- **Location pages** — neighborhood + city context ("hair salon in downtown Asheville")
- **Long-tail keywords** — specific queries trigger AI Overviews more than broad ones

### Layer 5: Citation Consistency (Trust Signal)
NAP (Name, Address, Phone) must be identical everywhere.

- **Top 50 directories** — Yelp, Apple Maps, Bing, Facebook, YellowPages, etc.
- **Industry directories** — StyleSeat, Booksy, Vagaro for salons
- **Social profiles** — consistent NAP across all platforms
- **Monitoring** — automated checks for NAP drift

### Layer 6: AI-Specific Optimization (Next-Gen)
These are emerging tactics specific to AI search visibility.

- **Conversational content** — write in natural Q&A format (how people ask AI)
- **Entity building** — consistent brand mentions across the web
- **Knowledge panel optimization** — claim and expand Google Knowledge Panel
- **Query fan-out coverage** — anticipate related queries and create content for each
- **Brand mention monitoring** — track when your business appears (or doesn't) in AI responses

---

## What We ADVISE Clients to Do (Their Responsibilities)

### Daily/Weekly
- Respond to every review within 24 hours
- Post on GBP at least once per week
- Share customer before/after photos (with permission) on social
- Answer new GBP Q&A questions promptly

### Monthly
- Review and update GBP services/pricing
- Request reviews from happy customers (we automate this)
- Check for NAP inconsistencies across directories
- Post 2-4 blog/content pieces (we can help generate these)

### Quarterly
- Refresh GBP photos (new angles, seasonal services)
- Update service descriptions with trending keywords
- Audit competitor AI visibility (we do this)
- Review and update FAQ content

---

## How We Stay on Top of Changes (Our Monitoring System)

### 1. Weekly AI Search Audit
- **Cron job** that queries Google for key local business terms
- Track which businesses appear in AI Overviews vs organic
- Measure position changes over time
- Alert when client visibility drops

### 2. Competitor AI Tracking
- Monitor top 5 competitors per client
- Track their review velocity, content, GBP changes
- Alert when competitor gains AI visibility

### 3. Google Algorithm Updates
- Monitor Google Search Central blog, SearchLiaison Twitter
- Track AI Overview format/functionality changes
- Document and adapt strategy within 48h of major changes

### 4. Industry Research
- Semrush, BrightLocal, Whitespark monthly reports
- Local SEO forums and communities
- A/B testing our own strategies across client base

### 5. Automated Reporting
- Monthly AI visibility score per client
- Before/after snapshots
- Recommended actions based on current best practices

---

## AgentSocial Features We Build for This

| Feature | Description | Priority |
|---------|-------------|----------|
| **GBP Manager** | Full read/write GBP API via Composio OAuth | P0 |
| **GBP Creator** | Pre-fill optimized profile for new businesses | P0 |
| **Review Automator** | Auto-respond + solicit reviews | P0 |
| **Schema Engine** | Structured data for client sites (already built) | P0 |
| **AI Visibility Tracker** | Monitor client appearance in AI Overviews | P1 |
| **Content Generator** | SEO-optimized blog/FAQ/service page content | P1 |
| **Citation Monitor** | NAP consistency check across 50+ directories | P1 |
| **Competitor Watch** | Track competitor AI search presence | P2 |
| **GBP Post Scheduler** | Weekly GBP posts with AI-optimized copy | P1 |
| **Knowledge Panel Manager** | Claim and optimize Knowledge Panels | P2 |

---

## Service Tier Inclusions

| Feature | Core ($49-79) | Pro ($199-299) | Elite ($499-799) |
|---------|---------------|----------------|-------------------|
| GBP optimization | ❌ | ✅ Full | ✅ Full + creation |
| Review automation | ❌ | ✅ Respond + solicit | ✅ AI-powered responses |
| Schema markup | ❌ | ✅ | ✅ |
| AI visibility tracking | ❌ | ✅ Monthly | ✅ Weekly + alerts |
| Content generation | ❌ | ✅ 2 posts/mo | ✅ 8 posts/mo |
| Citation monitoring | ❌ | ❌ | ✅ 50+ directories |
| Competitor tracking | ❌ | ❌ | ✅ Top 5 competitors |
| GBP posting | ❌ | ✅ Weekly | ✅ 3x/week |

---

## Key Sources
- Google Developers: AI Features and Your Website (May 2026)
- Semrush: AI Overviews Study (Oct 2025 data)
- Pew Research: User click behavior with AI Overviews (Jul 2025)