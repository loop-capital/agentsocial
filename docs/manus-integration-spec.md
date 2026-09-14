# Meta Marketing Power-Up — Feature Specification
**Feature:** Manus API Integration  
**Status:** Draft  
**Owner:** agentsocial-dev  
**Priority:** HIGH — Strategic Differentiator  
**Last Updated:** 2026-04-17

---

## 1. Overview

**What this is:**  
A "Meta Marketing Power-Up" tier for AgentSocial that embeds Manus AI's Meta marketing capabilities directly into the platform. AgentSocial users (beauty pros, creators, small businesses) get AI-powered Instagram/Facebook ad generation, content calendars, competitor analysis, creator discovery, and image enhancement — without leaving AgentSocial.

**Why it matters:**  
No social media management platform (Buffer, Later, Hootsuite, Sprout Social) offers built-in Meta ad creative optimization. This is a first-to-market feature that makes AgentSocial the obvious choice for beauty/creator businesses on Meta platforms.

---

## 2. Manus API Research

### 2.1 API Overview

**Base URL:** `https://api.manus.ai`  
**Protocol:** RESTful JSON  
**Key Concept:** Manus is an *agentic* AI — you create Tasks (long-running jobs), upload Files, and receive results via webhooks or polling.

**Core Concepts:**
- **Tasks** — Long-running AI agent jobs (create, poll, update, cancel)
- **Files** — Presigned upload URLs returned by `/v1/files`; attach by `file_id`
- **Webhooks** — Async results and status changes; verified with RSA-SHA256
- **Connectors** — Optional sanctioned access to Gmail, Notion, Google Calendar
- **Agent Knobs:** `taskMode` (chat/adaptive/agent) and `agentProfile` (speed/quality)

### 2.2 Key Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/v1/tasks` | Create a new Manus task |
| GET | `/v1/tasks/{task_id}` | Poll task status/result |
| POST | `/v1/files` | Get presigned upload URL |
| POST | `/v1/webhooks` | Register webhook for async callbacks |
| DELETE | `/v1/tasks/{task_id}` | Cancel a running task |
| GET | `/v1/tasks` | List tasks |

**Standard Response Wrapper:**
```json
{ "ok": true, "request_id": "req_abc123", ... }
```
**Error Wrapper:**
```json
{ "ok": false, "request_id": "req_abc123", "error": { "code": "rate_limited", "message": "..." } }
```

**Error Codes:** `invalid_argument`, `not_found`, `permission_denied`, `rate_limited`

### 2.3 Authentication

- API key generated in the Manus dashboard
- Sent as: `Authorization: Bearer ${MANUS_API_KEY}`
- RSA-SHA256 webhook signature verification available

### 2.4 Rate Limits

- Not explicitly published in public docs
- Standard REST rate-limiting with `429` responses and `Retry-After` header
- Free tier: **1 concurrent task** limit
- Pro/Elite: higher concurrency (exact limits need enterprise contact)

### 2.5 Pricing Tiers (from manus.im/pricing & third-party research)

| Plan | Price | Credits/Month | Concurrent Tasks | Notes |
|------|-------|---------------|-----------------|-------|
| **Free** | $0 | 1,000 + 300/day refresh | 1 | First 1,000 credits; 300/day refresh |
| **Pro** | $39/mo | ~Generous (~500 tasks) | Higher | Full access, priority support |
| **Elite** | $199/mo | Unlimited | Highest | For power users/teams |
| **Team** | Custom | Shared pool | Higher | Admin controls, collaboration |
| **Add-on credits** | Varies | Never expire | — | On-demand top-up |

**Credit-per-task estimates (from community research):**
- Simple task (chat response): ~50 credits
- Average task: ~150 credits
- Complex task (multi-step, web browsing, file generation): ~300–500 credits
- At ~$0.01/credit on consumer tiers, average task ≈ $1.50

---

## 3. Feature Mapping: Manus Endpoints → AgentSocial Features

### 3.1 Instagram Ad Creative Generator

**User Story:** User clicks "Create Instagram Ad" → Manus generates scroll-stopping ad creative + copy from their AgentSocial profile/content.

**Manus Task Prompt Pattern:**
> "Create an Instagram ad campaign for [business type]. Generate 3 ad creatives with headline, body copy, CTA button text, and suggested hashtags. Target audience: [demographic]. Use the brand voice described: [from AgentSocial profile]."

**Input:** Business type, target audience, brand voice (from profile), product/service description  
**Output:** 3 ad sets (headline + body + CTA + hashtags + image suggestions)  
**Manus taskMode:** `agent` (full autonomous workflow)  
**Credit estimate:** ~200–400 credits per run (3 variants)

### 3.2 30-Day Content Calendar

**User Story:** User clicks "Generate Content Calendar" → Manus plans 30 days of Meta-optimized posts.

**Manus Task Prompt Pattern:**
> "Create a 30-day content calendar optimized for Instagram and Facebook for [business type]. Include post type (carousel, story, reel, static), caption themes, posting times, and hashtag groups. Business goals: [from profile]."

**Input:** Business type, goals, posting frequency, content themes  
**Output:** Structured calendar (date, time, post type, caption, hashtags)  
**Credit estimate:** ~300–500 credits (complex multi-step task)

### 3.3 Competitor Analysis

**User Story:** User enters competitor handles → Manus analyzes their Meta presence, top posts, engagement patterns.

**Manus Task Prompt Pattern:**
> "Perform a competitor analysis for [competitor handles] on Instagram and Facebook. Identify: top 5 performing post types, optimal posting frequency, audience engagement patterns, popular content themes, and recommended differentiation strategy for [user's business]."

**Input:** Competitor handles (comma-separated), user's business context  
**Output:** Structured report (PDF/markdown) with findings + recommendations  
**Credit estimate:** ~300–500 credits (research-heavy)

### 3.4 Creator Discovery

**User Story:** User defines collaboration criteria → Manus identifies matching Instagram/Facebook creators.

**Manus Task Prompt Pattern:**
> "Find Instagram creators matching these criteria: niche [beauty/fashion/lifestyle], audience size [10k-100k], engagement rate [>3%], audience demographics [describe]. Return top 10 with profile links, follower counts, avg engagement, and collaboration suitability notes."

**Input:** Niche, audience size range, engagement threshold, demographics  
**Output:** Ranked creator list with profile links and metrics  
**Credit estimate:** ~200–400 credits (research + analysis)

### 3.5 Product Image Enhancement

**User Story:** User uploads product photo → Manus enhances it for Meta ad specs.

**Manus Task Prompt Pattern:**
> "Enhance this product image for use in Meta (Instagram/Facebook) ads. Requirements: clean background, vibrant lighting, Meta ad format ratios (1:1, 4:5, 9:16), high-resolution output, on-brand aesthetic described as: [from profile]."

**Input:** Product image (via file upload), brand aesthetic notes  
**Output:** Enhanced images in multiple Meta ad ratios  
**Technical:** Uses `/v1/files` for image upload, task returns presigned download URLs  
**Credit estimate:** ~150–300 credits (image processing)

---

## 4. UI/UX Specification

### 4.1 Entry Point

**Location:** AgentSocial dashboard → new "Meta Marketing" tab (or sidebar item)  
**Badge:** "Power-Up" label to indicate premium feature

### 4.2 User Flow

```
Dashboard
  └── Meta Marketing Power-Up
        ├── Instagram Ad Generator
        │     ├── Input form (business type, target audience, product description)
        │     ├── Brand voice (auto-filled from profile, editable)
        │     ├── [Generate] button
        │     └── Results panel: 3 ad card previews
        │           ├── [Edit] [Copy] [Post to Meta] actions
        ├── 30-Day Content Calendar
        │     ├── Settings (frequency, goals, platforms: IG/FB/Both)
        │     ├── [Generate Calendar] button
        │     └── Calendar view (grid) with expandable post cards
        │           ├── [Edit] [Schedule] [Download] actions
        ├── Competitor Analysis
        │     ├── Competitor handles input (comma-separated)
        │     ├── [Run Analysis] button
        │     └── Report view (summary cards + detailed findings)
        ├── Creator Discovery
        │     ├── Criteria form (niche, size, engagement, demographics)
        │     ├── [Find Creators] button
        │     └── Creator cards grid (profile photo, handle, metrics, [View Profile])
        └── Image Enhancement Studio
              ├── Drag-and-drop image upload zone
              ├── Enhancement style selector (clean white, lifestyle, editorial)
              ├── [Enhance] button
              └── Preview grid: original + enhanced in 3 Meta ratios (1:1, 4:5, 9:16)
```

### 4.3 Power-Up Access Tiers

| Feature | Free (Trial) | Pro Power-Up ($X/mo) |
|---------|-------------|---------------------|
| Instagram Ad Generator | 3 free generates/mo | Unlimited |
| 30-Day Content Calendar | 1 free/mo | Unlimited |
| Competitor Analysis | 1 free/mo | Unlimited |
| Creator Discovery | 5 creator profiles/mo | Unlimited |
| Image Enhancement | 5 images/mo | Unlimited |

**Trial:** 1,000 Manus credits (Free tier) or bundled 500-credit trial for new Power-Up sign-ups  
**Note:** Actual pricing (X) TBD — see Section 6 Revenue Model

---

## 5. Technical Integration Plan

### 5.1 Architecture

```
AgentSocial Backend (Node.js/FastAPI)
    │
    ├── ManusService (new service/module)
    │     ├── createTask(prompt, files?, webhookUrl?) → taskId
    │     ├── pollTask(taskId) → taskResult
    │     ├── cancelTask(taskId)
    │     └── uploadFile(buffer) → fileId
    │
    ├── WebhookHandler (Express route: POST /webhooks/manus)
    │     ├── Verify RSA-SHA256 signature
    │     ├── Parse task result
    │     ├── Update user notification (WebSocket/polling)
    │     └── Store result in DB
    │
    └── CreditManager
          ├── deductCredits(userId, amount)
          ├── checkBalance(userId)
          └── queueTaskIfNoCredits(userId)

Manus API (api.manus.ai)
    ├── POST /v1/tasks
    ├── GET  /v1/tasks/{id}
    ├── POST /v1/files (presigned URL)
    └── POST /v1/webhooks
```

### 5.2 Webhook vs Polling Strategy

- **Primary:** Webhooks (async) — AgentSocial registers a webhook at task creation. Manus calls back when the task completes. This avoids polling overhead.
- **Fallback:** Polling — If webhook delivery fails, client polls `GET /v1/tasks/{id}` every 10s for up to 5 minutes.
- **Timeout:** Tasks > 10 minutes trigger a timeout alert to the user.

### 5.3 Credit Management (AgentSocial-side)

- AgentSocial purchases a **Platform-level Manus plan** (Pro or Elite) and resells access to users.
- Each user has a **virtual credit balance** in the AgentSocial DB (not touching Manus credits directly).
- When a user triggers a feature, AgentSocial:
  1. Checks user's virtual balance
  2. Calls Manus API with the appropriate prompt
  3. Logs actual credit cost post-completion (from task result metadata)
  4. Deducts from user's virtual balance
- **Idle protection:** If Manus returns a different credit cost than estimated, reconcile on webhook callback.

### 5.4 File Upload Flow (Image Enhancement)

```
1. Client uploads image to AgentSocial (multipart/form-data)
2. AgentSocial uploads to Manus: POST /v1/files → gets presigned upload URL
3. AgentSocial PUTs the file to the presigned URL
4. AgentSocial creates Manus task with file_id in the prompt
5. Manus processes, returns result with enhanced image URLs
6. AgentSocial stores result and notifies client
```

### 5.5 Prompt Templating

- Store Manus prompt templates in `backend/prompts/manus/` as `.md` files.
- Each feature has a base prompt with variable interpolation: `{{businessType}}`, `{{targetAudience}}`, `{{brandVoice}}`, etc.
- Prompts are reviewed/approved before production (prompt injection risk).

### 5.6 Error Handling

| Manus Error | AgentSocial Response |
|-------------|----------------------|
| `rate_limited` (429) | Queue task, retry after `Retry-After` header |
| `permission_denied` | Log error, notify user, suggest checking API key |
| Task timeout (>10 min) | Mark as failed, notify user, offer retry |
| Webhook miss (>5 min) | Fall back to polling |
| Out of Manus credits | Pause user tasks, notify user to top up |

### 5.7 Security Considerations

- API key stored in environment variables / secrets manager (never in code)
- Webhook endpoint verified with RSA-SHA256 signature
- User-provided inputs (competitor handles, product descriptions) sanitized before inserting into prompts (prevent prompt injection)
- Rate limit per user: max 5 Manus tasks/hour (configurable)

---

## 6. Credit Budget Analysis

### 6.1 Manus Platform Costs (AgentSocial as Reseller)

| Plan | Monthly Cost | Credits | Cost per Credit | Est. Tasks/Month |
|------|-------------|---------|----------------|------------------|
| Pro | $39 | ~5,000* | ~$0.008 | ~500 (avg 10 credits/task) |
| Elite | $199 | Unlimited | ~$0.003–0.005** | Unlimited |

*Third-party estimate; needs verification with Manus sales  
**Assumes ~40k credits/mo at $199

### 6.2 Per-User Credit Economics

| Feature | Est. Credits/Task | Pro Plan Equivalent |
|---------|------------------|---------------------|
| Instagram Ad Generator (3 variants) | 200–400 | 12–25 tasks/mo |
| 30-Day Content Calendar | 300–500 | 10–16 tasks/mo |
| Competitor Analysis | 300–500 | 10–16 tasks/mo |
| Creator Discovery (10 results) | 200–400 | 12–25 tasks/mo |
| Image Enhancement (3 outputs) | 150–300 | 16–33 tasks/mo |

**Free trial allocation:** 500 credits per new Power-Up user  
**Break-even:** At $9.99/mo Power-Up price, 500 credits = 10 average tasks = ~3x ad generator runs or 1 calendar + some extras

### 6.3 Daily Concurrency Constraints

- Free/Pro tier: 1 concurrent task
- Elite: higher concurrency
- **Implication:** If AgentSocial serves 100 concurrent users, Elite plan needed or task queuing required
- **Recommendation:** Start with Elite for platform (unlimited concurrency), tier-1 users get priority queue

---

## 7. Revenue Model

### 7.1 Recommendation: Premium Tier ("Meta Marketing Power-Up")

**Rationale:**
1. Manus API costs are real (~$0.01/credit)
2. Competitors charge $15–60/mo for similar AI features (Previewed, AdCreative.ai, etc.)
3. AgentSocial's target users (beauty pros, creators) have willingness to pay for marketing tools
4. Embedding it in base plan dilutes perceived value and creates cost risk at scale

### 7.2 Pricing Options

| Option | Price | Positioning | Pros | Cons |
|--------|-------|-------------|------|------|
| **A. Bundle in Pro** | Pro plan: $19/mo (includes all power-ups) | Simple, drives Pro adoption | Clear value prop | Complex to attribute Manus cost |
| **B. Standalone add-on** | $9.99/mo (500 virtual credits) | ala carte | Low commitment entry | Revenue leakage if usage > $9.99 |
| **C. Tiered credits** | $9.99/250, $24.99/1,000, $49.99/3,000 | Flexible consumption | Aligns cost with usage | Complexity |
| **D. Freemium + upgrade** | Free: 3 trials/mo, Upgrade: $14.99/mo unlimited | Viral + conversion | Low friction, high conversion | Higher churn risk |

**Recommended: Option D (Freemium + Upgrade)**  
- Free: 3 trial generates across all features per month (no credit card required)
- Upgrade to "Meta Power-Up" ($14.99/mo): unlimited access to all 5 features + image enhancement studio
- **Rationale:** Trial drives adoption; unlimited removes friction for power users who convert

### 7.3 Revenue Projection (Year 1)

| Month | Free Users | Paying Users | MRR |
|-------|-----------|--------------|-----|
| 1 | 500 | 20 | $300 |
| 3 | 2,000 | 120 | $1,800 |
| 6 | 8,000 | 600 | $9,000 |
| 12 | 30,000 | 3,000 | $45,000 |

**Assumptions:** 2–3% free-to-paid conversion, $14.99/mo Power-Up  
**Manus Platform Cost at 3,000 paying users:** If avg user uses 100 credits/task × 20 tasks/mo = 6M credits/mo → Elite ~$199/mo (platform cost is fixed, so margin improves dramatically with scale)

### 7.4 Attribution Strategy

- Track which feature generates the most "try → buy" conversions
- A/B test Power-Up entry points in the UI
- Offer first-month discount (50% off) to reduce conversion friction

---

## 8. Build Timeline

### Phase 1: Core Integration (Weeks 1–3)
**Goal:** Ship the Manus API wrapper + 1 feature (Instagram Ad Generator)

- [ ] Set up ManusService class (createTask, pollTask, uploadFile)
- [ ] Webhook handler with signature verification
- [ ] CreditManager (virtual balance, deduction)
- [ ] Basic UI: Ad Generator form + results display
- [ ] Error handling + retry logic
- [ ] End-to-end test with test Manus account

### Phase 2: Full Feature Set (Weeks 4–6)
**Goal:** All 5 features + UI polish

- [ ] Content Calendar feature
- [ ] Competitor Analysis feature
- [ ] Creator Discovery feature
- [ ] Image Enhancement Studio (file upload flow)
- [ ] Prompt template system (review + approval workflow)
- [ ] Per-user rate limiting (5 tasks/hour)

### Phase 3: Monetization (Weeks 7–8)
**Goal:** Power-Up tier live, revenue tracking

- [ ] Free trial logic (3 trials/user/month)
- [ ] Power-Up subscription flow (Stripe)
- [ ] Upgrade prompts in UI
- [ ] Analytics dashboard (tasks generated, credits used, conversions)
- [ ] Manus platform account upgrade (Pro → Elite as user base grows)

### Phase 4: Optimization (Weeks 9–10)
**Goal:** Scale, reliability, retention

- [ ] Prompt optimization (reduce credit cost without quality loss)
- [ ] Result caching (repeat queries within 24h hit cache)
- [ ] Queue system for peak concurrency
- [ ] User onboarding tooltips for Power-Up features
- [ ] Conversion email sequence (day 1, 3, 7, 14)

---

## 9. Open Questions / Blockers

1. **Manus Enterprise Contact:** Need to verify Pro plan credit count and Elite concurrency limits — requires outreach to `contact@manus.im` or sales team.
2. **API Rate Limits:** Public docs don't list explicit rate limits. Need to confirm before production scaling.
3. **Webhook Reliability:** Need SLA confirmation or fallback polling stress test.
4. **Credit Reconciliation:** If Manus changes credit pricing mid-month, how do we adjust user balances?
5. **Image Storage:** Enhanced images returned by Manus — where do we store them? (S3? Temporary CDN?) Cost needs estimating.
6. **Cancellation Flow:** If a user cancels Power-Up, what happens to their in-flight Manus tasks?
7. **Meta Platform Approval:** Users posting ads through AgentSocial to Meta may need additional OAuth permissions from Meta.

---

## 10. Success Metrics

| Metric | Target (Month 3) | Target (Month 6) |
|--------|-----------------|-----------------|
| Power-Up trial starts | 500 | 3,000 |
| Trial → Paid conversion | 5% | 8% |
| Avg tasks/user/month | 5 | 10 |
| User satisfaction (in-app) | >4.0/5 | >4.3/5 |
| Manus API uptime | 99.5% | 99.9% |
| Support tickets (Power-Up) | <20/mo | <10/mo |

---

## 11. Appendix

### A. Relevant Documentation Links
- Manus API Intro: https://manus.im/docs/integrations/manus-api
- Open Manus API Docs: https://open.manus.im/docs
- Manus Pricing: https://manus.im/pricing
- Manus Meta Marketing: https://manus.im/programs/meta/mkt
- Meta Marketing API: https://developers.facebook.com/docs/marketing-api/

### B. Key Contacts
- Manus API Support: `api-support@manus.ai`
- Manus Sales (Enterprise/Elite): `contact@manus.im`

### C. File Structure (Proposed)

```
backend/
  services/
    manus/
      ManusService.ts        # Core API wrapper
      WebhookHandler.ts      # Webhook processing
      prompts/
        ad-generator.md
        content-calendar.md
        competitor-analysis.md
        creator-discovery.md
        image-enhancement.md
      CreditManager.ts       # Virtual credit balance
      TaskQueue.ts           # Concurrency management
frontend/
  components/
    meta-power-up/
      AdGenerator.tsx
      ContentCalendar.tsx
      CompetitorAnalysis.tsx
      CreatorDiscovery.tsx
      ImageEnhancementStudio.tsx
  pages/
    dashboard/meta-power-up/
```
