# AISO Platform Design — "Profound Killer"

**Date:** 2026-05-19
**Author:** AgentSocial-CEO
**Status:** Design Complete — Ready for Phasing

## Product Vision

Build an AI Search Optimization platform that does everything Profound does (AEO visibility tracking, content agents, citation monitoring) at a fraction of the cost, integrated into AgentSocial's DFY service tiers.

**What Profound charges $1K+/mo for → We bundle at $199-499/mo.**

## Competitive Analysis: Profound vs. Our Build

| Feature | Profound | Our Build |
|---------|----------|-----------|
| AI visibility tracking | ✅ Daily runs, real browser | ✅ autocli + cron daily |
| Answer Engine Insights | ✅ Custom + real prompts | ✅ autocli queries + scoring |
| Content optimization agents | ✅ No-code workflow | ✅ AgentSocial content engine |
| Prompt volume data | ✅ Proprietary dataset | 🔧 Build from search trends |
| Closed-loop optimization | ✅ Track → create → measure | ✅ Score → generate → rescore |
| Shopping/recommendations | ✅ Product citations | 🔧 Phase 3 |
| Pricing | $1K+/mo enterprise | $199-499/mo DFY tiers |
| Target | Enterprise brands | SMBs (salons, local biz) |

## Product Architecture

### Core Components

```
┌─────────────────────────────────────────────────────┐
│                  AISO Platform                       │
├─────────────┬──────────────┬────────────────────────┤
│  SCANNER     │  MONITOR     │  OPTIMIZER             │
│  (One-time)  │  (Ongoing)   │  (Auto-improve)        │
├─────────────┼──────────────┼────────────────────────┤
│ • AISO Audit │ • Daily AI   │ • llms.txt generator   │
│ • SEO Audit  │   visibility │ • Schema generator     │
│ • Score/Grade│ • Citation   │ • Content suggestions  │
│ • Fix prompts│   tracker    │ • Auto-apply fixes      │
│ • PDF Report │ • Competitor │ • Closed-loop scoring  │
│              │   comparison │ • WordPress plugin     │
└─────────────┴──────────────┴────────────────────────┘
         │               │                │
         ▼               ▼                ▼
┌─────────────────────────────────────────────────────┐
│              DATA LAYER (Supabase)                   │
│  • scan_results    • ai_citations                    │
│  • visibility_logs  • optimization_actions            │
│  • competitor_data  • content_recommendations         │
└─────────────────────────────────────────────────────┘
         │               │                │
         ▼               ▼                ▼
┌─────────────────────────────────────────────────────┐
│           AI ENGINE LAYER                            │
│  • autocli (query AI engines)                       │
│  • Content engine (generate optimized content)       │
│  • Scoring engine (audit + rescore)                 │
│  • Cron (daily monitoring, alerts)                   │
└─────────────────────────────────────────────────────┘
```

### Data Model

```sql
-- AISO Platform Tables (add to AgentSocial Supabase)

-- Brands/businesses being monitored
CREATE TABLE aiso_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  brand_name TEXT NOT NULL,
  domain TEXT NOT NULL,
  industry TEXT,
  target_keywords TEXT[],
  competitors TEXT[], -- competitor domains
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- One-time audit scans
CREATE TABLE aiso_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES aiso_brands(id),
  scan_type TEXT NOT NULL CHECK (scan_type IN ('aiso', 'seo', 'full')),
  score INTEGER NOT NULL,
  grade TEXT NOT NULL,
  structured_data_score INTEGER,
  content_structure_score INTEGER,
  eeat_score INTEGER,
  llms_txt_score INTEGER,
  freshness_score INTEGER,
  conversational_score INTEGER,
  report_url TEXT, -- here.now link
  raw_results JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily AI visibility tracking
CREATE TABLE aiso_visibility_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES aiso_brands(id),
  query_date DATE NOT NULL,
  engine TEXT NOT NULL CHECK (engine IN ('chatgpt', 'perplexity', 'gemini', 'google_aio', 'claude')),
  query TEXT NOT NULL,
  mentioned BOOLEAN DEFAULT FALSE,
  citation_count INTEGER DEFAULT 0,
  position INTEGER, -- rank in AI response
  response_snippet TEXT,
  source_url TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitor visibility comparison
CREATE TABLE aiso_competitor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES aiso_brands(id),
  query_date DATE NOT NULL,
  engine TEXT NOT NULL,
  query TEXT NOT NULL,
  competitor_domain TEXT NOT NULL,
  mentioned BOOLEAN DEFAULT FALSE,
  position INTEGER,
  response_snippet TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optimization actions taken
CREATE TABLE aiso_optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES aiso_brands(id),
  scan_id UUID REFERENCES aiso_scans(id),
  action_type TEXT NOT NULL CHECK (action_type IN (
    'llms_txt_created', 'schema_added', 'content_optimized',
    'robots_fixed', 'faq_added', 'meta_optimized', 'other'
  )),
  description TEXT,
  before_score INTEGER,
  after_score INTEGER,
  auto_applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content recommendations
CREATE TABLE aiso_content_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES aiso_brands(id),
  recommendation_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content_outline TEXT,
  target_keywords TEXT[],
  priority TEXT CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_aiso_visibility_brand_date ON aiso_visibility_logs(brand_id, query_date DESC);
CREATE INDEX idx_aiso_competitor_brand_date ON aiso_competitor_logs(brand_id, query_date DESC);
CREATE INDEX idx_aiso_scans_brand ON aiso_scans(brand_id, created_at DESC);
```

### API Routes

```
# Scanner (one-time audits)
POST   /api/v1/aiso/scan                    # Run AISO audit
POST   /api/v1/aiso/scan/seo                 # Run SEO audit
POST   /api/v1/aiso/scan/full                # Run full AISO + SEO
GET    /api/v1/aiso/scan/:id                 # Get scan results
GET    /api/v1/aiso/scan/:id/report          # Get hosted report URL
GET    /api/v1/aiso/scan/history/:brand_id   # Scan history

# Monitor (ongoing visibility)
POST   /api/v1/aiso/brands                   # Create brand profile
GET    /api/v1/aiso/brands                    # List brands
GET    /api/v1/aiso/brands/:id                # Get brand details
PUT    /api/v1/aiso/brands/:id                # Update brand
DELETE /api/v1/aiso/brands/:id                # Delete brand

GET    /api/v1/aiso/visibility/:brand_id      # Current visibility scores
GET    /api/v1/aiso/visibility/:brand_id/trend  # Score trend over time
GET    /api/v1/aiso/visibility/:brand_id/engines  # Per-engine breakdown

GET    /api/v1/aiso/competitors/:brand_id     # Competitor comparison
POST   /api/v1/aiso/competitors/:brand_id      # Add competitor

# Optimizer (auto-improve)
POST   /api/v1/aiso/optimize/llms-txt         # Generate llms.txt
POST   /api/v1/aiso/optimize/schema           # Generate schema markup
POST   /api/v1/aiso/optimize/content           # Generate content suggestions
POST   /api/v1/aiso/optimize/apply/:action_id  # Apply an optimization

GET    /api/v1/aiso/recommendations/:brand_id  # Get content recommendations
PUT    /api/v1/aiso/recommendations/:id        # Update recommendation status

# Dashboard
GET    /api/v1/aiso/dashboard/:brand_id        # Full dashboard data
GET    /api/v1/aiso/score-history/:brand_id    # Score over time chart data
```

### Frontend Pages

```
/aiso                    → Landing page (marketing)
/aiso/scan               → Run a scan (input URL)
/aiso/dashboard/:id      → Main dashboard (visibility scores, trends)
/aiso/dashboard/:id/scan → Scan history
/aiso/dashboard/:id/visibility → AI engine visibility breakdown
/aiso/dashboard/:id/competitors → Competitor comparison
/aiso/dashboard/:id/optimize → Optimization recommendations
/aiso/dashboard/:id/content  → Content suggestions
```

### Daily Monitoring Pipeline

```
Cron (6 AM ET daily)
  │
  ├── For each brand in aiso_brands:
  │     ├── For each target_keyword:
  │     │   ├── autocli query ChatGPT → record citation
  │     │   ├── autocli query Perplexity → record citation
  │     │   ├── autocli query Gemini → record citation
  │     │   └── web_search Google AIO → record citation
  │     ├── For each competitor:
  │     │   └── Same queries, record competitor visibility
  │     ├── Calculate visibility score (0-100)
  │     ├── Compare with previous day
  │     └── If score dropped >10 points → alert user
  │
  └── Weekly (Sunday 4 AM ET):
      ├── Re-run full AISO scan for active brands
      ├── Update recommendations
      └── Generate weekly report
```

### Scoring Engine

The AISO score (0-100) is calculated from:

1. **Audit Score** (40%) — From our existing AISO Checker skill
   - Structured Data & Schema: 20 pts
   - Content Structure for AI Citation: 25 pts
   - E-E-A-T Signals: 15 pts
   - llms.txt & AI Crawler Signals: 10 pts
   - Content Freshness & Depth: 15 pts
   - Conversational Query Optimization: 15 pts

2. **Visibility Score** (40%) — From daily monitoring
   - % of tracked queries where brand is mentioned
   - Average position in AI responses
   - Number of AI engines citing the brand
   - Trend (improving/declining/stable)

3. **Optimization Score** (20%) — Actions taken
   - % of recommended fixes applied
   - Score improvement after fixes
   - Content published from recommendations

### Revenue Model

| Tier | Price | AISO Included |
|------|-------|---------------|
| Core | $49-79/mo | 1 scan/month, no monitoring |
| Pro | $199-299/mo | Weekly scans + daily monitoring + optimizer |
| Elite | $499-799/mo | Daily scans + real-time monitoring + auto-optimize + competitor tracking |

## Phased Build Plan

### Phase 1: Scanner (1 week) — agentsocial-dev
- [ ] Create DB migration for AISO tables
- [ ] Build `/api/v1/aiso/scan` endpoint (wraps existing AISO Checker skill)
- [ ] Build `/api/v1/aiso/scan/seo` endpoint (wraps existing SEO Auditor skill)
- [ ] Build scan results storage and history
- [ ] Build report generation (Markdown → here.now hosting)
- [ ] Build `/aiso/scan` frontend page (input URL, show results)
- [ ] Test: Run scan on pleijsalon.com, verify scoring

### Phase 2: Monitor (1 week) — agentsocial-dev
- [ ] Build `/api/v1/aiso/brands` CRUD
- [ ] Build `/api/v1/aiso/visibility` tracking
- [ ] Create autocli-based AI engine query pipeline
- [ ] Set up daily cron for visibility tracking
- [ ] Build visibility score calculation
- [ ] Build `/aiso/dashboard` frontend (visibility scores, trends)
- [ ] Build competitor comparison
- [ ] Test: Monitor PLEIJ for 3 days, verify daily scores

### Phase 3: Optimizer (1 week) — agentsocial-dev
- [ ] Build llms.txt generator (from site content)
- [ ] Build schema generator (FAQ, LocalBusiness, Article)
- [ ] Build content recommendation engine
- [ ] Build `/api/v1/aiso/optimize` endpoints
- [ ] Build `/aiso/dashboard/:id/optimize` frontend
- [ ] Build closed-loop scoring (before/after optimization)
- [ ] WordPress plugin: auto-apply schema + llms.txt
- [ ] Test: Generate llms.txt for PLEIJ, verify score improvement

### Phase 4: Scale (ongoing) — agentsocial-marketing
- [ ] Marketing page: /aiso landing page
- [ ] Free scan as lead magnet (SEO audit → email capture → DFY upsell)
- [ ] Email sequence: scan results → optimization pitch → DFY demo
- [ ] Integration with AgentSocial content engine
- [ ] White-label for agencies
- [ ] API for third-party integrations

## Agent Assignments

| Phase | Agent | Focus |
|-------|-------|-------|
| Phase 1 | agentsocial-dev | Scanner API + frontend |
| Phase 1 | agentsocial-architect | DB schema review, API design review |
| Phase 2 | agentsocial-dev | Monitor API + cron + dashboard |
| Phase 2 | agentsocial-architect | Visibility scoring algorithm |
| Phase 3 | agentsocial-dev | Optimizer + WordPress plugin |
| Phase 3 | agentsocial-architect | Closed-loop scoring design |
| Phase 4 | agentsocial-marketing | Landing page, email sequence, lead magnet |
| All | agentsocial-ceo | Priority calls, testing, demos |

## Key Decisions

1. **Use autocli for AI queries** — Already working, supports multiple sites, can query ChatGPT/Perplexity/Gemini
2. **Supabase for data** — Already our DB, no new infra needed
3. **here.now for report hosting** — Already authenticated, generates shareable URLs
4. **Existing skills as foundation** — AISO Checker and SEO Auditor skills are battle-tested
5. **WordPress plugin for auto-apply** — Our DFY clients mostly use WordPress, so we can push fixes directly
6. **Free scan as lead gen** — Same model as our SEO audit funnel, proven to work

## Success Metrics

- PLEIJ Salon: AISO score 40 → 80+ in 30 days
- 10 free scans/month → 2 DFY Pro conversions
- Daily monitoring shows measurable visibility improvement within 7 days
- Zero manual intervention for Pro/Elite tier monitoring