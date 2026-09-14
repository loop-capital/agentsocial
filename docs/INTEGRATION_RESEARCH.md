# SiteFlow — Website Builder Integration Research
**Feature Name:** SiteFlow (codename)
**Date:** April 17, 2026
**Status:** ✅ FEASIBLE — Ready for implementation
**Research By:** agentsocial-dev

---

## Executive Summary

SiteFlow — AgentSocial's AI-powered website builder — is **technically feasible and strategically differentiated**. No social media management platform offers a true full-website builder; the convergence is happening from website builders adding social (Squarespace, Wix). **AgentSocial inverts this: social-first, then website.** The AI-native generation engine is the core moat.

**Bottom line:** Build this. The architecture is proven, costs are predictable at ~$1.40/generation, and the competitive whitespace is enormous.

---

## 1. Current Platform Architecture

| Layer | Technology | Status |
|-------|-----------|--------|
| Backend | Express.js + Node.js | In production |
| Frontend | (multi-app directory, Next.js migration planned) | Needs clarification |
| Database | PostgreSQL + Redis | Schema exists |
| Auth | JWT + bcrypt | Implemented |
| AI Stack | Claude Code headless (`claude -p`) + `ANTHROPIC_API_KEY` | Ready to use |
| Hosting | Netlify (recommended for SiteFlow) | TBD |

**Integration point:** The website builder is a new module that extends the existing user/agent system — users have websites, agents can manage them via API.

> **Note:** Current `backend/server.js` uses Express. The task brief specifies Fastify as the target backend. **Migration to Fastify is recommended as part of Phase 1** since Fastify's plugin system maps better to SiteFlow's modular architecture (generation worker, design service, deploy service as separate plugins).

---

## 2. Tool Deep Dives

### 2.1 UI/UX Pro Max (`uipro` CLI) — ✅ PRIMARY DESIGN SYSTEM

**What it is:** A design intelligence CLI skill with 67 design styles, 161 color palettes, 57 font pairings. Generates complete design system configurations for Next.js/Tailwind projects.

**How it works:**
```bash
npm install -g uipro-cli      # v2.2.3 installed in test environment
uipro init --ai claude        # Installs skill files to .claude/skills/ui-ux-pro-max/

# Query design system programmatically:
python3 skills/ui-ux-pro-max/scripts/search.py "minimalism dark mode" --domain style
python3 skills/ui-ux-pro-max/scripts/search.py "fintech crypto" --design-system -f markdown
```

**What it outputs:** JSON design system specs (colors, typography, spacing, motion principles) consumable by Claude Code or direct embedding into generated sites.

**Installation for AgentSocial:**
```bash
# Server-side installation (run once during deployment)
npm install -g uipro-cli
cd /path/to/agentsocial-backend
uipro init --ai claude   # Places skill files in .claude/ at project root
```

**For Headless Generation:** The skill files are local. Claude Code headless (`claude -p`) can read them via `--append-system-prompt` or by injecting the design system prompt directly. The skill is not a runtime dependency — it's a prompt engineering asset.

**Capability coverage:**
- ✅ 67 styles (modern, minimal, brutalist, playful, etc.)
- ✅ 161 color palettes (searchable by keyword)
- ✅ 57 font pairings (Google Fonts)
- ✅ UX guidelines (accessibility, animation, performance)
- ✅ Pattern library references
- ⚠️ Cloud assets require free uipro.com login for full access

**Verdict:** Use as primary design system. The CLI is a one-time install; the skill files are prompts. No API key needed.

---

### 2.2 Framer Motion — ✅ ANIMATION LIBRARY

**What it is:** Production-grade animation library (rebranded to "Motion" in 2025) powering framer.com, Cursor homepage, and thousands of production sites.

**How it integrates:**
```bash
npm install framer-motion   # Standard npm, MIT licensed
```

**Generated sites automatically include:** page transition animations, scroll reveals, hover effects, form micro-interactions.

**Claude Code knows Framer Motion natively** — prompts like "add scroll animations to the hero" produce working Framer Motion code without additional configuration.

**Capability coverage:**
- ✅ Page transitions (AnimatePresence)
- ✅ Scroll-triggered animations (useScroll, useTransform)
- ✅ Gesture animations (hover, tap, drag)
- ✅ Layout animations (layoutId for shared element transitions)
- ✅ Server-side rendering safe (disable in SSR if needed)
- ✅ TypeScript first-class support

**Verdict:** Include by default in all generated sites. No API key, no cost, MIT license. Generator prompts should reference Framer Motion patterns from the design system.

---

### 2.3 21st.dev Magic MCP — ⚠️ COMPONENT LIBRARY (Secondary)

**What it is:** MCP server providing 100+ production-ready React components. Generates multiple UI variations per request — you pick the best.

**How it works:**
```json
// Claude.json MCP config
{
  "mcpServers": {
    "21st-dev-magic": {
      "command": "npx",
      "args": ["-y", "@21st-dev/magic@latest"],
      "env": { "API_KEY": "${21ST_DEV_API_KEY}" }
    }
  }
}
```

**Access:** Free API key at https://21st.dev/magic/console

**Integration for AgentSocial:**
- MCP servers are typically Claude Code/Claude Desktop configurations
- For **server-side generation** (our use case), the MCP is less directly applicable since MCP is a Claude Code-local tool
- For **client-facing UI** (design picker in the AgentSocial dashboard), we can run Claude Code sessions with the MCP enabled and return the results
- The real value: agents building sites via API can specify `use 21st.dev for the pricing table component` and Claude Code uses it

**Capability coverage:**
- ✅ Buttons, navbars, heroes, cards, footers, banners, tables, forms
- ✅ Multiple style variations per component
- ✅ Automatic dependency installation
- ⚠️ API key required
- ⚠️ Rate limits on free tier (unknown limit; paid plans from ~$20/mo)
- ⚠️ MCP-native — not a REST API (harder to call from backend workers directly)

**Verdict:** Use as secondary component source. Configure in Claude Code sessions for component generation. Do NOT build a direct API integration — let Claude Code handle it as a tool.

---

### 2.4 v0 by Vercel — ✅ REFERENCE ARCHITECTURE (Not Direct Integration)

**What it is:** v0.dev is Vercel's AI UI generator. As of July 2025, v0 has a **Platform API** (beta) that provides REST endpoints for programmatic generation.

**v0 Platform API (July 2025+):**
```typescript
import { v0 } from 'v0-sdk';

const client = new v0.Client({ apiKey: process.env.V0_API_KEY });
const response = await client.generate({
  prompt: 'A landing page for a coffee shop',
  template: 'next-app', // or 'html-tailwind'
});
// Returns: code + rendered preview URL
```

**Why NOT to integrate directly:**
1. **v0's generated output is often v0-specific** — heavy v0 dependencies, not ideal for standalone hosting
2. **v0 generates through conversation** — API is for continuing chats, not single-shot generation
3. **v0 output format is unpredictable** — hard to guarantee code quality/structure
4. **Cost unknown** — no public pricing for Platform API

**Why to use as REFERENCE:**
- v0's architecture (chat → generation → preview → iteration) is exactly what SiteFlow needs
- Study v0's UX flow: prompt → multiple options → pick → edit → deploy
- v0's structured output approach (selecting from variations) maps to our 21st.dev integration

**Verdict:** Do NOT integrate v0 as a generation backend. Study it as a UX/architecture reference. If v0 releases a stable generation API with predictable output, revisit.

---

### 2.5 AIDesigner MCP Server — ✅ REST API (Tertiary/Backup)

**What it is:** AI UI generation tool with both MCP server (OAuth-authenticated) and REST API (API key).

**REST API (relevant for backend):**
```bash
# CLI usage:
export AIDESIGNER_API_KEY="your-key-here"
npx @aidesigner/agent-skills generate --prompt "landing page hero"

# Direct REST API:
curl -X POST https://api.aidesigner.ai/v1/generate \
  -H "Authorization: Bearer $AIDESIGNER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "landing page hero section", "format": "html-tailwind"}'
```

**Capabilities:**
- Generates complete HTML documents with inline Tailwind CSS
- Supports multiple frameworks (HTML+Tailwind, React, Vue)
- CLI tool for agentic workflows

**Integration for AgentFlow:**
- **Backup generator** if Claude Code generation fails or times out
- **Component-level generation** for targeted edits ( regenerate just the hero section)
- API key from https://www.aidesigner.ai/settings/api-keys

**Capability coverage:**
- ✅ Full HTML+Tailwind generation
- ✅ REST API (not just MCP) — works from backend
- ✅ Component-level prompts
- ⚠️ Output is HTML (not Next.js) — would need conversion
- ⚠️ No free tier visible; pricing not publicly listed

**Verdict:** Use as secondary/backup generation engine. Implement as a fallback if primary Claude Code pipeline fails. Monitor pricing before heavy usage.

---

## 3. Recommended Architecture

### 3.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      AgentSocial Platform                        │
├──────────────────────┬──────────────────────────────────────────┤
│   Next.js Frontend   │              Express/Fastify Backend    │
│   (AgentSocial App)  │                                          │
│                      │  ┌──────────────┐  ┌─────────────────┐  │
│  ┌────────────────┐  │  │  Auth Layer  │  │  User/Plan DB   │  │
│  │  SiteFlow UI   │  │  │   (JWT)      │  │  (PostgreSQL)  │  │
│  │  - Design Picker│  │  └──────────────┘  └─────────────────┘  │
│  │  - Prompt Input │  │                                        │
│  │  - Preview       │  │  ┌──────────────────────────────────┐│
│  │  - Deploy btn    │  │  │     Generation Service (Plugin)  ││
│  └────────┬─────────┘  │  │  - claude -p spawner              ││
│           │ POST        │  │  - SSE progress streaming         ││
│           │ /api/v1/    │  │  - Token cost tracking            ││
│           │ generate    │  │  - Design system loader            ││
└───────────┼─────────────┤  └────────────────┬─────────────────┘│
            │             │                    │ writes to:
            │             │                    ▼
            │             │  ┌──────────────────────────────────┐│
            │             │  │   Generation Worker (Background)  ││
            │             │  │   - claude -p --bare             ││
            │             │  │   - uipro design system          ││
            │             │  │   - Writes to /websites/{id}/    ││
            │             │  └────────────┬──────────────────────┘│
            │             │               │ file output
            │             │               ▼
            │             │  ┌──────────────────────────────────┐│
            │             │  │   Deploy Service (Plugin)        ││
            │             │  │   - netlify deploy --prod       ││
            │             │  │   - Custom domain setup          ││
            │             │  │   - SSL certificate management    ││
            │             │  └────────────┬──────────────────────┘│
            │             │               │ deployment URL
            │             │               ▼
            │             │  ┌──────────────────────────────────┐│
            │             │  │   CDN / Hosting (Netlify)       ││
            │             │  │   - Generated Next.js sites     ││
            │             │  │   - Edge network                 ││
            │             │  │   - *.netlify.app subdomains    ││
            │             │  └──────────────────────────────────┘│
            │             │                                       │
            │             │  External Tool Integrations:          │
            │             │  ┌──────────────────────────────────┐ │
            │             │  │  ANTHROPIC_API_KEY ──► claude -p│ │
            │             │  │  uipro CLI ──────────► design   │ │
            │             │  │  21st.dev MCP ───────► components│ │
            │             │  │  AIDesigner REST ─────► fallback │ │
            │             │  └──────────────────────────────────┘ │
            └─────────────┴──────────────────────────────────────┘
```

### 3.2 Generation Flow (Step by Step)

```
1. User submits prompt + design preferences
       │
       ▼
2. Backend creates website record (status: 'generating')
   + generation_session record (for cost tracking)
       │
       ▼
3. Backend spawns background worker:
   claude -p "[SYSTEM PROMPT + uipro design system + prompt]"
   --bare --allowedTools Write,Bash,Read,Glob
   --output-format stream-json
   Working dir: /websites/{user_id}/{website_id}/
       │
       ├──────► SSE stream back to frontend (phase: scaffolding → components → content)
       │
       ▼
4. Worker writes Next.js project files
       │
       ▼
5. Worker runs: npm install + npm run build (or `next build`)
       │
       ▼
6. Worker deploys via: netlify deploy --prod --dir=out
       │
       ▼
7. Backend updates website record:
   - status: 'published'
   - deployment_url: 'https://sitename.netlify.app'
   - generated_at: NOW()
       │
       ▼
8. Webhook POST to user callback URL (if registered)
       │
       ▼
9. Frontend polls /websites/:id → shows published URL
```

---

## 4. API Endpoint Specifications

### 4.1 Website Management

```
POST   /api/v1/websites
       Create and generate a new website
       Auth: JWT (Bearer token)
       Body: {
         "name": "Alex's Portfolio",
         "prompt": "Build a modern portfolio for a freelance developer...",
         "design": {
           "style": "modern",           // modern|minimal|bold|playful|elegant|brutalist
           "colorPalette": "midnight-indigo",  // from uipro palette names
           "fontPairing": "inter-sans",  // from uipro font pairs
           "animationLevel": "moderate"  // none|subtle|moderate|full
         },
         "templateId": "uuid"            // optional, pre-built scaffold
       }
       Response 202: { "id": "uuid", "status": "generating", "generationSessionId": "uuid" }

GET    /api/v1/websites
       List user's websites (paginated)
       Auth: JWT
       Query: ?page=1&limit=10&status=published

GET    /api/v1/websites/:id
       Get website details including deployment URL
       Auth: JWT (must own website)

PUT    /api/v1/websites/:id
       Update website content (regenerates affected sections only)
       Auth: JWT
       Body: { "prompt": "Change the hero headline to...", "section": "hero" }

DELETE /api/v1/websites/:id
       Delete website and undeploy from Netlify
       Auth: JWT

POST   /api/v1/websites/:id/generate
       Regenerate entire website
       Auth: JWT
       Body: { "prompt": "Same design, new content", "design": { ... } }

POST   /api/v1/websites/:id/deploy
       Trigger redeploy (after manual edits)
       Auth: JWT

GET    /api/v1/websites/:id/deploy/status
       Get Netlify deployment status
       Auth: JWT
```

### 4.2 Generation (Internal)

```
POST   /api/v1/generate
       Full generation entry point (used by worker)
       Internal only (service-to-service)

GET    /api/v1/generate/:sessionId
       Get generation session status
       Auth: JWT

GET    /api/v1/generate/:sessionId/stream
       SSE stream of generation progress
       Auth: JWT
       Events:
         event: progress
         data: { "phase": "scaffolding", "progress": 20, "message": "Creating Next.js..." }
         event: progress
         data: { "phase": "components", "progress": 50, "message": "Building hero section..." }
         event: complete
         data: { "phase": "done", "progress": 100, "websiteId": "uuid", "deploymentUrl": "..." }
         event: error
         data: { "error": "...", "phase": "components" }
```

### 4.3 Design System

```
GET    /api/v1/design/styles
       List 67 design styles from UI/UX Pro Max
       Auth: Public
       Response: [{ "id": "modern", "name": "Modern", "description": "...", "keywords": [...] }]

GET    /api/v1/design/palettes
       List 161 color palettes
       Auth: Public
       Response: [{ "id": "midnight-indigo", "primary": "#4f46e5", "secondary": "...", ... }]

GET    /api/v1/design/fonts
       List 57 font pairings
       Auth: Public

POST   /api/v1/design/preview
       Generate a preview snippet from a design config
       Auth: JWT
       Body: { "style": "modern", "palette": "midnight-indigo", "fontPairing": "inter" }
       Response: { "htmlPreview": "<snippet>", "designSystem": { ... } }
```

### 4.4 Templates

```
GET    /api/v1/templates
       List pre-built website templates
       Auth: Public
       Response: [{ "id": "uuid", "name": "Landing Page", "category": "landing-page", ... }]

GET    /api/v1/templates/:id
       Get template details with scaffold structure

POST   /api/v1/templates/:id/use
       Start generation from template (creates website + generation session)
       Auth: JWT
       Body: { "name": "...", "prompt": "...", "design": { ... } }
```

### 4.5 Domains & Billing

```
POST   /api/v1/websites/:id/domains
       Add custom domain
       Auth: JWT

DELETE /api/v1/websites/:id/domains/:domainId
       Remove custom domain

POST   /api/v1/domains/:id/verify
       Verify DNS configuration

GET    /api/v1/billing/usage
       Get token usage for current billing period
       Auth: JWT

GET    /api/v1/plans
       List plans with website limits
       Auth: Public
```

---

## 5. Database Schema Extensions

### New Tables (add to existing schema.sql)

```sql
-- Website plans/billing
CREATE TABLE plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    websites_limit INTEGER DEFAULT 1,           -- 0 = unlimited
    generations_per_month INTEGER DEFAULT 5,
    price_monthly DECIMAL(10,2) DEFAULT 0,
    price_yearly DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User plan assignments
CREATE TABLE user_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES plans(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ends_at TIMESTAMP WITH TIME ZONE
);

-- Generated websites
CREATE TABLE websites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    prompt TEXT NOT NULL,                        -- Full generation prompt
    design_config JSONB NOT NULL DEFAULT '{}',
    site_data JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'draft'
        CHECK (status IN ('draft','generating','published','archived','failed')),
    deployment_url VARCHAR(500),
    deployment_id VARCHAR(255),
    deployment_status VARCHAR(50) DEFAULT 'pending',
    generated_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Design configurations (snapshot per generation)
CREATE TABLE design_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
    style VARCHAR(100),
    color_palette JSONB,
    font_pairing JSONB,
    animation_level VARCHAR(50) DEFAULT 'moderate',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generation sessions (cost tracking & debugging)
CREATE TABLE generation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
    model_used VARCHAR(100) NOT NULL DEFAULT 'claude-sonnet-4-6',
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    cache_read_tokens INTEGER DEFAULT 0,
    cache_write_tokens INTEGER DEFAULT 0,
    cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0,
    generation_time_ms INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'running'
        CHECK (status IN ('running','success','failed','partial','cancelled')),
    error_message TEXT,
    claude_session_id VARCHAR(255),
    prompt TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Website templates (pre-built scaffolds)
CREATE TABLE website_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(100),                -- landing-page|link-in-bio|portfolio|blog
    preview_image_url VARCHAR(500),
    default_design_config JSONB DEFAULT '{}',
    scaffold_files JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custom domains
CREATE TABLE custom_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
    domain VARCHAR(255) UNIQUE NOT NULL,
    verification_status VARCHAR(50) DEFAULT 'pending',
    dns_config JSONB,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_websites_user ON websites(user_id);
CREATE INDEX idx_websites_status ON websites(status);
CREATE INDEX idx_websites_slug ON websites(slug);
CREATE INDEX idx_generation_sessions_website ON generation_sessions(website_id);
CREATE INDEX idx_generation_sessions_created ON generation_sessions(created_at);
CREATE INDEX idx_custom_domains_website ON custom_domains(website_id);
CREATE INDEX idx_user_plans_user ON user_plans(user_id);
```

### Design Config JSONB Structure

```typescript
interface DesignConfig {
  style: 'modern' | 'minimal' | 'bold' | 'playful' | 'elegant' | 'brutalist';
  colorPalette: {
    id: string;           // 'midnight-indigo'
    primary: string;      // '#4f46e5'
    secondary: string;   // '#7c3aed'
    accent: string;       // '#ec4899'
    background: string;   // '#0f172a'
    text: string;         // '#f8fafc'
    muted: string;        // '#64748b'
  };
  fontPairing: {
    id: string;            // 'inter-sans'
    heading: string;      // 'Inter'
    body: string;          // 'Inter'
  };
  animationLevel: 'none' | 'subtle' | 'moderate' | 'full';
}

interface SiteData {
  site: {
    name: string;
    tagline?: string;
    description?: string;
    logo?: string;
  };
  pages: Array<{
    slug: string;
    title: string;
    sections: Section[];
  }>;
  navigation: NavItem[];
  footer: FooterConfig;
}
```

---

## 6. Build Timeline

### Phase 1: Core Infrastructure — Week 1–2

| Day | Task | Deliverable |
|-----|------|-------------|
| 1–2 | Add DB tables (websites, generation_sessions, plans, design_configs) | Migration file |
| 1–2 | Migrate Express → Fastify backend (plugin architecture) | New server.js |
| 3–4 | Implement `POST /websites` + `GET /websites/:id` endpoints | REST API |
| 3–4 | Set up `ANTHROPIC_API_KEY` server-side env, verify `claude -p` works | Verified CLI |
| 5–7 | Build generation worker (spawns `claude -p` as background process) | Worker service |
| 5–7 | Implement `GET /generate/:sessionId/stream` SSE endpoint | SSE endpoint |
| 7–10 | Implement plan limits (check `user_plans` before generation) | Billing guard |
| 11–14 | Implement `GET /websites/:id/deploy/status` + deploy worker | Deploy endpoint |

**Milestone:** End of Week 2 — User can create website via API, get SSE progress, see deployed URL.

### Phase 2: Design System Integration — Week 3

| Day | Task | Deliverable |
|-----|------|-------------|
| 15–16 | Integrate `uipro` CLI — verify skill files accessible to `claude -p` | Design system |
| 15–16 | Build `GET /design/styles`, `GET /design/palettes`, `GET /design/fonts` endpoints | Design API |
| 17–18 | Build design picker UI component in frontend | React component |
| 17–18 | Build `POST /design/preview` endpoint (generates a preview snippet) | Preview API |
| 19–21 | Implement prompt caching strategy (embed design system once) | Cost optimization |

**Milestone:** End of Week 3 — User can select design style/palette/font before generation.

### Phase 3: Templates & Deployment — Week 4

| Day | Task | Deliverable |
|-----|------|-------------|
| 22–23 | Create 3 starter templates (landing page, link-in-bio, portfolio) | Template DB records |
| 22–23 | Implement `GET /templates`, `POST /templates/:id/use` | Template API |
| 24–25 | Implement Netlify CLI deploy (`netlify deploy --prod`) | Deploy service |
| 24–25 | Add custom domain support (`POST /websites/:id/domains`) | Domain API |
| 26–28 | Build `POST /websites/:id/deploy` endpoint + status polling | Redeploy API |

**Milestone:** End of Week 4 — User can pick template, generate, and deploy to custom domain.

### Phase 4: Polish & Launch — Week 5–6

| Day | Task | Deliverable |
|-----|------|-------------|
| 29–32 | Error handling, retry logic, generation timeout (5 min max) | Reliability |
| 29–32 | Generation cancellation (`DELETE /generate/:sessionId`) | Cancel API |
| 33–35 | Build frontend UI: dashboard, website list, design picker, preview | Full UI |
| 33–35 | Add usage tracking dashboard (`GET /billing/usage`) | Billing UI |
| 36–40 | Landing page copy for SiteFlow, docs for API consumers | Marketing + docs |
| 41–42 | Integration testing, bug fixes | QA |

**Milestone:** End of Week 6 — Full product ready for beta users.

### Total Estimated Timeline: **6 weeks**

| Phase | Duration | Key Deliverable |
|-------|----------|-----------------|
| Phase 1 | Week 1–2 | Core generation + deploy pipeline |
| Phase 2 | Week 3 | Design system UI |
| Phase 3 | Week 4 | Templates + custom domains |
| Phase 4 | Week 5–6 | Polish + launch |

---

## 7. Cost Analysis

### 7.1 Per-Generation Token Costs

**Primary model: Claude Sonnet 4.6** (best cost/quality ratio for code generation)

| Phase | Input Tokens | Output Tokens | Model | Cost |
|-------|-------------|---------------|-------|------|
| Project scaffolding | 15,000 | 8,000 | Sonnet 4.6 | $0.165 |
| Component generation (4 sections) | 25,000 | 35,000 | Sonnet 4.6 | $0.600 |
| Content writing | 20,000 | 12,000 | Haiku 4.5 | $0.110 |
| Styling + Framer Motion | 18,000 | 15,000 | Sonnet 4.6 | $0.279 |
| **Total per generation** | **~78,000** | **~70,000** | **Mixed** | **~$1.15** |

**With prompt caching** (design system embedded once, reused across sections):
- Cache write: 20,000 tokens × $3.75/MTok = $0.075 (one-time per session)
- Cache reads: 80,000 tokens × $0.30/MTok = $0.024 per section
- **Cached total: ~$1.05–$1.40 per generation**

### 7.2 Monthly Operating Costs

| Users | Sites/User/Mo | Total Generations | Claude API Cost | Netlify Cost | Total |
|-------|---------------|-------------------|-----------------|--------------|-------|
| 10 | 3 | 30 | $42 | Free | **$42/mo** |
| 50 | 3 | 150 | $210 | Free | **$210/mo** |
| 100 | 5 | 500 | $700 | $20/mo Pro | **$720/mo** |
| 500 | 5 | 2,500 | $3,500 | $20/mo Pro | **$3,520/mo** |

### 7.3 Third-Party API Costs

| Tool | Free Tier | Paid Tier | Notes |
|------|-----------|-----------|-------|
| UI/UX Pro Max | ✅ Unlimited | N/A | CLI tool, no usage limits |
| Framer Motion | ✅ Unlimited | N/A | MIT license, no cost |
| 21st.dev Magic | ~50 requests/mo (unconfirmed) | ~$20/mo | MCP tool, rate-limited |
| AIDesigner | Unknown | Unknown | REST API, pricing not public |
| Netlify | 100GB bandwidth/mo | $20/mo Pro flat | Commercial use OK on free |

### 7.4 Revenue Potential

**Bundled into existing AgentSocial plans** (recommended — don't price separately):

| Plan | Social Features | SiteFlow | Price | Sites Included |
|------|----------------|----------|-------|----------------|
| Free | Basic scheduling | 1-page landing only | $0 | 1 |
| Starter | Full scheduling + analytics | 5-page site | $15/mo | 3/mo |
| Pro | All social + AI | Unlimited pages | $29/mo | 10/mo |
| Agency | Multi-account + API | White-label | $79/mo | Unlimited |

**Margin at 100 Pro users:** $2,900/mo revenue – $700 Claude costs = **$2,200/mo margin**

### 7.5 Cost Optimization Strategies

1. **Prompt caching** — Embed design system once per session, reuse cache reads (saves ~$0.10/section)
2. **Haiku for content** — Use Sonnet 4.6 for code only, Haiku 4.5 for copy (saves ~$0.05/generation)
3. **Template scaffolds** — Pre-generated page shells reduce token overhead per generation
4. **Regenerate sections only** — Allow partial re-generation, not full site rebuild
5. **Structured output** — Use `--json-schema` for deterministic output (reduces wasted output tokens)
6. **Generation queue** — Batch async jobs to share context window overhead

---

## 8. Tool Integration Matrix

| Tool | Role | Integration Type | API Key Required? | Cost | Priority |
|------|------|------------------|-------------------|------|----------|
| Claude Code (`claude -p`) | Primary generator | CLI + ANTHROPIC_API_KEY | ✅ Yes | ~$1.40/gen | **P0 — Required** |
| UI/UX Pro Max | Design system | CLI skill files | ❌ No | Free | **P0 — Required** |
| Framer Motion | Animations | npm package | ❌ No | Free (MIT) | **P0 — Required** |
| Netlify | Hosting | CLI + REST API | ✅ Yes (auth token) | Free–$20/mo | **P0 — Required** |
| 21st.dev Magic | Components | MCP server config | ✅ Yes | ~$20/mo (est.) | P1 — Secondary |
| AIDesigner | Backup generator | REST API | ✅ Yes | Unknown | P2 — Fallback |
| v0 by Vercel | Reference only | None | N/A | N/A | P3 — Architecture ref |

---

## 9. Key Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Claude Code subscription doesn't cover automation | **HIGH** | Use `ANTHROPIC_API_KEY` for all server-side generation (not OAuth subscription) |
| Generation timeout (>5 min) | **MEDIUM** | Implement async job queue with status polling; set 5-min hard timeout |
| Token costs unpredictable at scale | **MEDIUM** | Hard cap per user per month via `user_plans.generations_per_month`; prompt caching |
| `uipro` CLI cloud assets require login | **LOW** | Use free uipro.com account; design system works offline for most styles |
| 21st.dev rate limits on free tier | **LOW** | Treat as component suggestions only; have fallback to manual components |
| Netlify deploy rate limits | **LOW** | Queue deploys; cache deployment state locally |
| Generated content quality variance | **MEDIUM** | Template scaffolds ensure minimum quality baseline; prompt engineering guide |
| v0 Platform API pricing unknown | **LOW** | Use as reference only; do not integrate directly |

---

## 10. Recommendations Summary

### Do

1. **Build it.** The competitive whitespace is real. No social tool has a real website builder.
2. **Use Netlify** for hosting — commercial use allowed, flat $20/mo pricing.
3. **Use Claude Code headless (`claude -p`)** as the primary generation engine with `ANTHROPIC_API_KEY`.
4. **Bundle SiteFlow into existing AgentSocial plans** — not a separate product.
5. **Migrate Express → Fastify** in Phase 1 to support modular plugin architecture.
6. **Start with templates** — 3 pre-built scaffolds (landing page, link-in-bio, portfolio) reduce generation cost and ensure quality.
7. **Build the design picker first** — this is the primary UX differentiator vs. pure API-based generation.

### Don't

1. **Don't integrate v0 directly** — its output format is unpredictable and pricing is unknown.
2. **Don't build a direct REST API to 21st.dev** — use it as a Claude Code tool, not a backend service.
3. **Don't generate without plan limits** — hard cap generations per month per user to control costs.
4. **Don't skip prompt caching** — it reduces per-generation cost by ~10%.
5. **Don't deploy Netlify on free tier for production** — 100GB limit sounds fine until you have 50 active sites.

---

## 11. Immediate Next Steps (for agentsocial-dev)

1. **Obtain `ANTHROPIC_API_KEY`** from Anthropic console — without this, nothing works
2. **Set up Netlify account + generate auth token** for programmatic deploys
3. **Migrate backend** from Express to Fastify (plugin-based architecture maps better to SiteFlow services)
4. **Write database migration** for new tables (websites, generation_sessions, plans, design_configs, website_templates, custom_domains)
5. **Build generation worker** as the first core service (everything else depends on it)
6. **Sign up for 21st.dev** at 21st.dev/magic/console to get API key for component generation

---

## 12. References

- Claude Code headless: https://code.claude.com/docs/en/headless
- Agent SDK: https://code.claude.com/docs/en/agent-sdk/overview
- UI/UX Pro Max skill: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- 21st.dev Magic MCP: https://github.com/21st-dev/magic-mcp
- AIDesigner REST API: https://www.aidesigner.ai/docs/api
- v0 Platform API (beta): https://v0.dev/docs/v0-platform-api
- Framer Motion: https://motion.dev/
- Netlify CLI: https://docs.netlify.com/cli/
- Netlify commercial usage: https://www.netlify.com/plans/
- Previous research: `docs/website-builder-*.md`, `tools/website-builder-setup/FINDINGS.md`, `tools/website-builder-setup/TEST_RESULTS.md`
