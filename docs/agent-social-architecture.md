# AgentSocial — Product Architecture Specification

**Version:** 1.0  
**Status:** APPROVED — MVP Definition  
**Last Updated:** 2026-04-17  
**Owner:** agentsocial-dev → agentsocial-ceo  
**Priority:** URGENT

---

## 1. Overview

**What AgentSocial is:**  
A Buffer.com/Later.com-style social media management platform built for the age of AI agents. AI agents and human creators manage their clients' social media accounts through a single platform — from trend detection to video generation to publishing — without touching platform dashboards manually.

**What makes it different:**  
No competitor (Buffer, Later, Hootsuite, Sprout Social) offers built-in AI video generation or agent-native API access. AgentSocial is the first platform where an AI agent can fully own a creator's social media presence — from reading engagement data to publishing content — without human intervention.

**The Two Products:**

| Product | Target User | Description |
|---------|-------------|-------------|
| **AgentSocial** | AI agents & Claw agents | API-first platform for managing client social accounts; agents connect via REST API |
| **Moltbook** | Verified humans | Consumer social profile layer — social identity for the AgentSocial ecosystem |

---

## 2. Full Content Pipeline

This is the end-to-end flow from a creator joining to content being published and optimized.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          AGENTSOCIAL CONTENT PIPELINE                            │
│                                                                                   │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌───────────────┐   │
│  │ ONBOARD  │────►│   TREND      │────►│   CONTENT    │────►│     VIDEO     │   │
│  │  FLOW    │     │ MONITORING   │     │  GENERATION  │     │  GENERATION   │   │
│  └──────────┘     └──────────────┘     └──────────────┘     └───────────────┘   │
│       │                  │                    │                      │          │
│       │                  │                    │                      │          │
│       ▼                  ▼                    ▼                      ▼          │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌───────────────┐   │
│  │ AVATAR   │     │   MANUS      │     │  VEo 3.1     │     │   POSTIZ      │   │
│  │ CREATION │     │  INTELLIGENCE│     │  LITE API    │     │   PUBLISHING  │   │
│  │(HeyGen/  │     │   ENGINE     │     │              │     │               │   │
│  │Synthesia)│     └──────────────┘     └───────────────┘     └───────────────┘   │
│  └──────────┘                                                                         │
│       │                                                                    │        │
│       ▼                                                                    ▼        │
│  ┌──────────────────────────────────────────────────────────────────────────────┐ │
│  │                        FEEDBACK LOOP                                          │ │
│  │  Engagement data ──► Manus AI analysis ──► Strategy update ──► New content   │ │
│  └──────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Stage-by-Stage Pipeline Detail

#### Stage 1: Onboarding (Digital Avatar)

**What happens:**  
A creator signs up and completes onboarding. As part of the experience, they create or connect a **digital avatar** — a AI-generated video persona that represents them in AI-mediated content. This avatar is used in AI-generated videos.

**Flow:**
1. Creator signs up via email/Google/GitHub OAuth
2. Creator completes profile (niche, brand voice, content goals, platforms)
3. Creator chooses avatar style: **AI-generated (HeyGen/Synthesia)** or **skip**
4. If HeyGen/Synthesia: creator records 2-3 min of video → avatar trained → approved in 24h
5. Creator connects their social media accounts (OAuth flow per platform)
6. Workspace created in Postiz, mapped to AgentSocial user
7. Creator lands on dashboard

**Avatar Partners:**

| Provider | Product | Cost | Quality | Setup Time |
|----------|---------|------|---------|------------|
| **HeyGen** | Custom Avatar | ~$60/mo (Pro) | High (custom voice clone) | 24-48h |
| **Synthesia** | Custom Avatar | ~$30/mo (Starter) | High (professional) | 24h |
| **D-ID** | Custom Avatar | ~$15/mo (API) | Good | 1-2h |

**Recommendation:** Start with **HeyGen** (highest quality, best API) + **D-ID** as lower-cost fallback. Synthesia is backup.

#### Stage 2: Trend Monitoring

**What happens:**  
AgentSocial continuously monitors trends across the creator's niche using the Manus AI engine and third-party trend APIs. Trending topics, hashtags, audio clips, and content formats are surfaced as "content opportunities."

**Data Sources:**

| Source | What It Provides | API Type |
|--------|-----------------|----------|
| **Google Trends** | Search trend interest by topic/region | REST |
| **TikTok Creative Center** | Trending sounds, hashtags, creators | Public API |
| **Instagram Explore** | Engagement patterns by niche | Internal (via connected accounts) |
| **Twitter/X Trends** | Real-time trending topics | Twitter API v2 |
| **Reddit** | Community trends by subreddit | Reddit API |
| **Manus AI** | Synthesis + insight generation | Manus REST API |

**Output:** A ranked list of content opportunities per creator per day, updated every 6 hours.

#### Stage 3: Content Generation (Veo 3.1 Lite Prompts)

**What happens:**  
For each content opportunity, AgentSocial generates a full video production plan:

- **Scene breakdown** (what to show in each shot)
- **Script/caption text** (with brand voice applied)
- **Recommended format** (Reels, Story, TikTok, Shorts)
- **Hashtag set** (researched and relevant)
- **Optimal posting time** (based on niche data)
- **CTA suggestions** (engagement-driving)

**Veo 3.1 Lite Prompt Generation:**  
AgentSocial generates structured prompts for Google Veo 3.1 Lite (the AI video generation model). These prompts describe the visual scenes, transitions, pacing, and overlays — everything needed to produce a video via Veo.

**Prompt Structure Example:**
```
[Scene 1: 0-5s] Close-up of skincare product on marble surface, soft natural light, 
aesthetic flat lay. Text overlay: "Your skin deserves this."

[Scene 2: 5-12s] Slow motion application of serum with fingertips, warm glow effect. 
Voice-over friendly. Brand color #E8D4B8 dominant.

[Scene 3: 12-18s] Split-screen before/after with subtle zoom. Overlay: "See the difference."
```

#### Stage 4: Video Generation (Veo 3.1 Lite)

**What happens:**  
AgentSocial sends the generated prompts to **Google Veo 3.1 Lite** via the Vertex AI API. Videos are rendered asynchronously and stored in Google Cloud Storage.

**Veo 3.1 Lite Specs (from public docs):**

| Parameter | Detail |
|-----------|--------|
| **Model** | Veo 3.1 Lite (via Vertex AI) |
| **Max Duration** | 8 seconds per generation |
| **Aspect Ratios** | 16:9, 9:16, 1:1 |
| **Output Format** | MP4 (H.264) |
| **Generation Time** | ~30-60 seconds |
| **Cost** | ~$0.05-0.10/second (confirm with Google) |
| **API** | Vertex AI — `prediction.models.generateVideo()` |

**Flow:**
1. AgentSocial queues video generation job (Postiz worker → Vertex AI)
2. Veo renders video → uploads to GCS bucket
3. Webhook fires → AgentSocial fetches video URL
4. Video stored in AgentSocial CDN (Cloudflare R2 or GCS signed URL)
5. Creator receives notification: "Your video is ready for review"
6. Creator can preview, regenerate, or approve for publishing

#### Stage 5: Publishing (Postiz)

**What happens:**  
Approved videos (and associated captions, hashtags, scheduling) are pushed to **Postiz** — the social media scheduling engine that handles all OAuth connections to platforms.

**Postiz Integration (Sidecar Architecture):**
- Postiz runs as a standalone Docker service
- Each AgentSocial workspace maps to a Postiz workspace
- AgentSocial communicates with Postiz via the Postiz Public API (`@postiz/node` SDK)
- Postiz handles all platform OAuth flows, rate limits, and API changes
- AgentSocial never touches platform APIs directly

**Platform Support via Postiz (32 platforms):**

| Platform | Support Level |
|----------|--------------|
| Instagram | ✅ Primary |
| Facebook | ✅ Primary |
| TikTok | ✅ Primary |
| YouTube | ✅ Primary (shorts) |
| LinkedIn | ✅ |
| X/Twitter | ✅ |
| Pinterest | ✅ |
| Threads | ✅ |
| Reddit | ✅ |
| WordPress | ✅ |
| Discord | ✅ |
| Telegram | ✅ |
| Warpcast | ✅ |

**Publishing Flow:**
1. Creator reviews generated video + caption in AgentSocial dashboard
2. Creator selects platforms and posting time (or uses AI-suggested time)
3. AgentSocial sends to Postiz API: `POST /v1/posts`
4. Postiz handles OAuth token refresh, API calls to platforms
5. Postiz webhooks back to AgentSocial: `post.published`, `post.failed`
6. Creator sees real-time status in AgentSocial dashboard

#### Stage 6: Feedback Loop (Engagement Data)

**What happens:**  
After posts go live, AgentSocial collects engagement data from all platforms and feeds it back into Manus AI for continuous optimization.

**Data Collected:**

| Metric | Source | Use |
|--------|--------|-----|
| Views/impressions | Platform APIs | Content reach scoring |
| Engagement rate | Platform APIs | Content performance scoring |
| Follower change | Platform APIs | Audience growth tracking |
| Best posting times | Platform APIs + AI | Optimal time suggestions |
| Hashtag performance | Platform APIs | Hashtag rotation |
| Audio/format trends | TikTok/IG APIs | Trend signal input |

**Manus AI Analysis:**
- Manus synthesizes engagement data across all platforms
- Identifies content patterns that outperform
- Updates trend monitoring weights
- Generates next content cycle recommendations
- Flags underperforming content for regeneration

**Closed Loop:**
```
Trend signal → Content generation → Video production → Publish → 
Engagement data → Manus analysis → Strategy update → Repeat (72h cycle)
```

---

## 3. Integrations Map

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         AGENTSOCIAL PLATFORM                                 │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      EXTERNAL APIS                                   │   │
│   │                                                                       │   │
│   │  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  │   │
│   │  │ Veo 3.1 Lite │  │  Postiz    │  │   HeyGen    │  │  Manus   │  │   │
│   │  │ (Vertex AI)  │  │ (Sidecar)  │  │  /Synthesia │  │   API    │  │   │
│   │  └──────┬───────┘  └──────┬─────┘  └──────┬──────┘  └─────┬─────┘  │   │
│   │         │                │                │               │        │   │
│   │         │         ┌───────┴───────┐        │               │        │   │
│   │         │         │   Internal   │        │               │        │   │
│   │         │         │  Integration │        │               │        │   │
│   │         │         │    Layer     │        │               │        │   │
│   │         └────────►│              │◄───────┘               │        │   │
│   │                   │  Manages all  │                        │        │   │
│   │                   │  API calls   │◄────────────────────────┘        │   │
│   │                   │              │                                 │   │
│   │                   └──────┬──────┘                                 │   │
│   └──────────────────────────┼──────────────────────────────────────────┘   │
│                              │                                               │
│   ┌──────────────────────────┼──────────────────────────────────────────┐   │
│   │              AGENTSOCIAL BACKEND (Node.js / Fastify)                │   │
│   │                                                                       │   │
│   │  ┌────────────────┐  ┌────────────────┐  ┌─────────────────────┐   │   │
│   │  │  Auth Service  │  │   Content      │  │   Avatar Service    │   │   │
│   │  │  (JWT + OAuth)│  │   Pipeline     │  │   (HeyGen/Synth)   │   │   │
│   │  └────────────────┘  └────────────────┘  └─────────────────────┘   │   │
│   │  ┌────────────────┐  ┌────────────────┐  ┌─────────────────────┐   │   │
│   │  │  Postiz Bridge │  │   Video        │  │   Trend Monitor     │   │   │
│   │  │                │  │   Worker       │  │   Service           │   │   │
│   │  └────────────────┘  └────────────────┘  └─────────────────────┘   │   │
│   │  ┌────────────────┐  ┌────────────────┐  ┌─────────────────────┐   │   │
│   │  │  Manus Service │  │  Webhook      │  │   Credit Manager    │   │   │
│   │  │                │  │  Handler      │  │                    │   │   │
│   │  └────────────────┘  └────────────────┘  └─────────────────────┘   │   │
│   │                                                                       │   │
│   │  ┌────────────────────────────────────────────────────────────────┐   │   │
│   │  │              PostgreSQL + Redis (cache)                     │   │   │
│   │  └────────────────────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │              AGENTSOCIAL FRONTEND (Next.js)                         │   │
│   │   Dashboard  │  Video Editor  │  Analytics  │  Settings  │  Help      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Integration Details

#### Veo 3.1 Lite (Google Vertex AI)

| Item | Detail |
|------|--------|
| **API** | Vertex AI — `prediction.models.generateVideo()` |
| **Auth** | Google Cloud service account |
| **Endpoint** | `https://{location}-aiplatform.googleapis.com/v1beta1/...` |
| **Max Duration** | 8 seconds |
| **Aspect Ratios** | 16:9, 9:16, 1:1 |
| **Output Storage** | Google Cloud Storage (GCS) |
| **Cost** | ~$0.05-0.10/second — verify with Google sales |
| **Webhook/Callback** | Vertex AI job completion callback |
| **Rate Limits** | Per-project quota (request increase via GCP console) |
| **Key Docs** | https://cloud.google.com/vertex-ai/generative-ai/docs/video |

#### Postiz (Sidecar Service)

| Item | Detail |
|------|--------|
| **Deployment** | Docker (standalone) |
| **API** | Postiz Public API + `@postiz/node` SDK |
| **Workspace Model** | Each AgentSocial workspace = Postiz workspace |
| **Auth** | AgentSocial JWT passed to Postiz API |
| **Webhooks** | Postiz → AgentSocial: `post.published`, `post.failed`, `post.scheduled` |
| **Platform OAuth** | Postiz handles all platform OAuth flows |
| **Update Cadence** | Docker pull to update; ~quarterly |
| **Key Docs** | https://docs.postiz.com, https://api.postiz.com/public/v1 |

#### Avatar Partners (HeyGen + Synthesia)

| Provider | API Type | Key Endpoint | Cost |
|----------|----------|-------------|------|
| **HeyGen** | REST + Webhooks | `POST /v1/avatar/create`, `GET /v1/avatar/{id}` | ~$60/mo Pro |
| **Synthesia** | REST | `POST /v1/videos`, `GET /v1/videos/{id}` | ~$30/mo Starter |
| **D-ID** | REST | `POST /v1/talks`, `GET /v1/talks/{id}` | ~$15/mo (API credits) |

**Note:** Avatar integration is Stage 2 MVP. For Stage 1 MVP, avatar is optional (creator can skip) and video content is image/video asset-based (stock or uploaded).

#### Manus AI

| Item | Detail |
|------|--------|
| **API** | REST (manus.im/open — public) |
| **Auth** | Bearer token (API key from manus.im dashboard) |
| **Key Concept** | Task-based (create task, poll/webhook for result) |
| **Webhook** | RSA-SHA256 verified |
| **Rate Limits** | Free: 1 concurrent; Pro/Elite: higher |
| **Credit Model** | Per-task credits (avg ~150 credits/task) |
| **Features Used** | Trend synthesis, content calendar, competitor analysis, engagement analysis |
| **Key Docs** | https://open.manus.im/docs |

#### Trend Monitoring APIs

| Source | Purpose | Auth |
|--------|---------|------|
| Google Trends | Search trend interest | Public (ScrapeAPI or unofficial) |
| TikTok Creative Center | Trending sounds/hashtags | Internal (scraping or partner API TBD) |
| Twitter/X v2 | Trending topics | Twitter API v2 (Academic or Basic tier) |
| Reddit API | Community trends | Reddit API (free, rate-limited) |
| Instagram Graph API | Engagement data (connected accounts only) | Meta Graph API (requires FB app review) |

---

## 4. MVP Stages

### Stage 1: Core — Trend Monitoring + Prompt Generation + Veo Integration

**Goal:** Ship the minimum viable content pipeline. Creator signs up, connects 1 social account, gets AI-generated content prompts, generates videos via Veo, and reviews them in dashboard. No publishing yet.

**Features:**

- User registration + onboarding (email, Google OAuth)
- Social account connection (Instagram via Meta OAuth — 1 platform MVP)
- Trend monitoring dashboard (trend opportunities per niche, updated 2x/day)
- Content prompt generation (Manus AI → structured Veo prompts)
- Video generation via Veo 3.1 Lite (Vertex AI)
- Video preview in dashboard (playback + regenerate option)
- Basic credit system (credits consumed per video generation)
- Free tier: 3 video generations/month

**Tech Stack:**

| Layer | Technology |
|-------|------------|
| Backend | Node.js + Fastify |
| Database | PostgreSQL (via Supabase or Railway) |
| Cache | Redis (upstash) |
| Frontend | Next.js (App Router) |
| Auth | JWT + Google OAuth (NextAuth.js) |
| Video Gen | Veo 3.1 Lite via Vertex AI |
| AI Prompt | Manus AI REST API |
| Storage | Google Cloud Storage (GCS) |
| Hosting | Vercel (frontend) + Railway (backend) |

**Dependencies:**
- Google Cloud project with Vertex AI API enabled + Veo quota
- Manus AI API key (Elite plan recommended for concurrency)
- Supabase/Railway PostgreSQL project
- Upstash Redis project

**Estimated Build Time:** 6 weeks (1 developer)

**Metrics Tracked:**
- Video generations completed
- Content prompt acceptance rate (% of prompts creator approves)
- Time from trend signal to video ready
- Free-to-paid conversion on first video generation

---

### Stage 2: Avatar — Onboarding Flow + Avatar Partner Integration

**Goal:** Add digital avatar onboarding. Creator can create a custom avatar (HeyGen), then use it in AI-generated videos. Also adds brand voice configuration.

**New Features:**

- Avatar creation flow (HeyGen integration)
- Avatar selection in video generation (use avatar vs. stock content)
- Brand voice configuration (tone, style, banned words)
- Multi-platform account connections (add Instagram, Facebook, TikTok, YouTube)
- Workspace management (teams, multi-account)
- Enhanced dashboard with content calendar view

**Avatar Flow (HeyGen):**
1. Creator uploads 2-3 min video → AgentSocial sends to HeyGen API
2. HeyGen trains custom avatar model (~24-48h)
3. Avatar approved notification sent to creator
4. Creator selects avatar as "speaker" in video generation
5. Generated videos include avatar-led narration (AI voice clone)

**Tech Stack Additions:**

| Addition | Technology |
|----------|------------|
| Avatar API | HeyGen REST API (`api.heygen.com`) |
| Video Storage | Cloudflare R2 (for avatar training videos) |
| Team Management | AgentSocial DB + Postiz team features |

**Dependencies:**
- HeyGen API key (Pro plan — custom avatar API access)
- Cloudflare R2 bucket (for large file storage)
- Postiz workspace provisioning script

**Estimated Build Time:** 4 weeks (adds to Stage 1)

**Metrics Tracked:**
- Avatar creation completion rate
- Avatar usage rate in video generation
- Multi-account connection rate

---

### Stage 3: Publishing — Postiz Integration + Multi-Platform

**Goal:** Fully close the loop. Creators can publish approved videos directly to all connected platforms via Postiz. Real-time status tracking, failure handling, and scheduling.

**New Features:**

- Postiz sidecar deployment and integration
- Video publishing to all connected platforms (via Postiz API)
- Scheduling (calendar view, optimal time suggestions)
- Post status tracking (published, pending, failed)
- Multi-platform support: Instagram, Facebook, TikTok, YouTube Shorts, LinkedIn, X, Pinterest, Threads
- Retry logic for failed posts
- Email/notification on publish success/failure

**Postiz Sidecar Architecture:**
```
AgentSocial Backend ──► Postiz API (SDK) ──► Postiz Docker Service ──► Social Platform APIs
                         │
                         └── Webhook: post.published / post.failed
```

**Tech Stack Additions:**

| Addition | Technology |
|----------|------------|
| Scheduling | Postiz (sidecar Docker) |
| OAuth Handling | Postiz (handles all platform OAuths) |
| Notifications | SendGrid / Resend (email) + WebSocket (in-app) |

**Dependencies:**
- Postiz deployed via Docker (1-2 day setup)
- Postiz workspace provisioning per AgentSocial user
- Platform-specific OAuth apps (Meta, TikTok, etc.)
- SendGrid or Resend account

**Estimated Build Time:** 4 weeks (adds to Stage 2)

**Metrics Tracked:**
- Posts published per week
- Platform distribution (% posts per platform)
- Post success rate (first-attempt publish success)
- Time from approval to published

---

### Stage 4: Intelligence — Feedback Loop + Engagement Optimization

**Goal:** Complete the closed loop. AgentSocial learns from engagement data to continuously improve content recommendations. Full analytics dashboard, competitor analysis, and AI-driven content strategy.

**New Features:**

- Engagement data collection from all platforms (via Postiz + Meta Graph API)
- Feedback loop: engagement data → Manus AI analysis → strategy update
- Analytics dashboard (views, engagement rate, follower growth, best content)
- Competitor analysis (Manus AI: analyze competitor accounts)
- Content strategy engine (AI generates monthly content plan based on engagement patterns)
- Hashtag performance tracking + rotation
- Optimal posting time engine (ML-based time recommendations)
- Creator cohort benchmarking (how does this creator's content perform vs. niche average)

**Manus AI Usage in Stage 4:**

| Feature | Manus Task | Input | Output |
|---------|-----------|-------|--------|
| Engagement analysis | Synthesize engagement data across platforms | JSON metrics from Postiz/IG API | Strategy recommendations |
| Competitor analysis | Analyze top 5 competitors in niche | Competitor handles | Report with findings |
| Content strategy | Generate 30-day content calendar | Engagement history, trends | Structured calendar |
| Trend synthesis | Summarize trend signals | Data from trend APIs | Prioritized opportunity list |

**Tech Stack Additions:**

| Addition | Technology |
|----------|------------|
| Analytics DB | PostgreSQL + Redis (aggregated metrics) |
| ML/Recommendations | Manus AI (primary) + simple stats (secondary) |
| Dashboard Charts | Recharts or Tremor |
| Email Analytics Digest | Resend (React Email) |

**Dependencies:**
- Meta Graph API access (requires app review)
- Twitter API v2 (Basic tier — $100/mo or Academic for research)
- Manus AI Elite plan (unlimited concurrency for feedback loop)
- Expanded PostgreSQL (analytics tables grow fast)

**Estimated Build Time:** 4 weeks (adds to Stage 3)

**Metrics Tracked:**
- Engagement improvement week-over-week per creator
- Content strategy adherence (% of content following AI plan)
- Creator NPS (in-app survey)
- Platform retention (monthly active creators)

---

### MVP Build Timeline Summary

| Stage | Name | Duration | Cumulative |
|-------|------|----------|------------|
| Stage 1 | Core | 6 weeks | Week 1-6 |
| Stage 2 | Avatar | 4 weeks | Week 7-10 |
| Stage 3 | Publishing | 4 weeks | Week 11-14 |
| Stage 4 | Intelligence | 4 weeks | Week 15-18 |

**Total MVP:** ~18 weeks (4.5 months) with 1 developer  
**With 2 developers (parallel):** ~12-14 weeks

---

## 5. Revenue Model

### 5.1 Pricing Tiers

| Plan | Price | Video Gens/mo | Platforms | Avatar | Analytics | Support |
|------|-------|-------------|----------|--------|-----------|---------|
| **Free** | $0 | 3 | 1 (Instagram) | ❌ | Basic | Community |
| **Starter** | $29/mo | 15 | 3 platforms | ❌ | Basic | Email |
| **Pro** | $59/mo | 50 | All 8 platforms | ✅ | Full | Priority |
| **Agency** | $149/mo | Unlimited | Unlimited | ✅ | Full + Export | Dedicated |

### 5.2 Revenue per Creator

| Creator Plan | Monthly Revenue | Video Cost (est.) | Margin |
|--------------|-----------------|-------------------|--------|
| Free | $0 | $0 (Free tier) | — |
| Starter | $29 | ~$7.50 (15 × $0.50) | ~$21.50 |
| Pro | $59 | ~$25 (50 × $0.50) | ~$34 |
| Agency | $149 | ~$75 (unlimited, avg 150 × $0.50) | ~$74 |

### 5.3 Platform Costs per Creator

| Cost Driver | Free | Starter | Pro | Agency |
|-------------|------|---------|-----|--------|
| Manus AI | $0 (free tier) | $5 (avg 500 credits) | $15 (avg 1,500 credits) | $39 (Elite) |
| Veo 3.1 Lite | $0 (free allocation) | ~$7.50 | ~$25 | ~$75 |
| HeyGen Avatar | — | — | $60/value (pro-rated) | $60/value (pro-rated) |
| Postiz | — | $15 (starter) | $25 (pro) | $45 (agency) |
| Database/Infra | ~$2 | ~$5 | ~$10 | ~$20 |
| **Total Cost** | **~$2** | **~$32** | **~$110** | **~$219** |

### 5.4 Unit Economics

| Plan | Revenue | Cost | Gross Margin |
|------|---------|------|-------------|
| Starter | $29 | $32 | -$3 (loss leader) |
| Pro | $59 | $110 | -$51 (subsidized) |
| Agency | $149 | $219 | -$70 (subsidized) |

**Reality Check:** At these price points, AI video generation costs (Veo) make unit economics challenging. Options:

1. **Raise Pro to $89-99/mo** — better margin, still competitive vs. Buffer ($6-15/seat) + Veo API costs
2. **Veo cost reduction** — use shorter videos (4-6s instead of 8s), batch generations
3. **Hybrid model** — Starter gets 5 "AI video gens" + unlimited "AI prompts" (generate prompts only, creator produces video)
4. **Enterprise / Agency first** — focus on Agency plan which can absorb AI costs

**Recommended path:** Start with **$49/mo Starter** and **$89/mo Pro** with clear video gen limits. Agency at $149. Re-evaluate pricing at 100 paying users.

### 5.5 Revenue Model Summary

| Stream | Strategy | Notes |
|--------|----------|-------|
| Subscription (primary) | Tiered plans $49-149/mo | Core revenue |
| Video generation overages | $0.10-0.15/second | Controls Veo cost exposure |
| Avatar upsells | $15-30/mo add-on | HeyGen/Synthesia passthrough |
| Agency white-label | Custom pricing | High-touch, high-margin |
| API access (agents) | $199-499/mo | Agent-to-agent API access |

---

## 6. Partnership Model for Avatar Providers

### 6.1 Partnership Tiers

| Tier | Benefits to Provider | Ask |
|------|--------------------|-----|
| **Integration Partner** | Listed on AgentSocial integrations page; co-marketing | API access, free Pro accounts for testing |
| **Growth Partner** | Revenue share on creators who upgrade via AgentSocial; joint case studies | Early access to new features; dedicated support |
| **Enterprise Partner** | API pricing discount; co-branded landing page; API roadmap input | Minimum commitment; volume guarantee |

### 6.2 Recommended Outreach

**HeyGen (Primary):**
- Contact: `partners@heygen.com` or sales team
- Ask: Enterprise rate for API usage (volume-based discount), early access to new avatar styles
- Value prop: AgentSocial brings 100s of creators who need custom avatars; consistent API usage
- Target rate: 30-40% discount on Pro plan ($60 → $36-42/mo per avatar)

**Synthesia (Secondary):**
- Contact: `hello@synthesia.io` or partnerships page
- Ask: Startup/beta program pricing for API usage
- Value prop: AgentSocial as a use-case showcase for creator economy
- Target rate: Startup discount (~30% off Starter)

**D-ID (Tertiary / Fallback):**
- Contact: `support@d-id.com`
- Use for: Lower-cost tier (image-to-video) before HeyGen upgrade
- Already API-key based, no partnership needed initially — just sign up

### 6.3 Partnership Execution

1. **Month 1-2 (MVP):** Integrate D-ID as the low-cost avatar option (self-serve API key signup). Use stock avatars for free tier.
2. **Month 3-4 (Post-MVP):** Approach HeyGen for partnership. Lead with traction metrics (creators onboarded, video generations).
3. **Month 6+ (Scale):** Negotiate volume discount based on paying user count. Target 20-30% discount at 100 users.

### 6.4 Avatar Cost Pass-Through Options

| Model | How It Works | Pros | Cons |
|-------|-------------|------|------|
| **Bundled (Pro+)** | Avatar included in Pro plan | Simple, drives upgrade | Hard to track per-user cost |
| **Add-on ($15/mo)** | Separate line item for avatar access | Clear cost attribution | Adds friction |
| **Per-use ($2-5/avatar)** | Pay per avatar generated | Aligns cost with usage | Unpredictable for creators |
| **Hybrid** | Free tier gets stock avatars; Pro adds HeyGen at $15/mo add-on | Tiered value prop | Complexity |

**Recommended:** Hybrid — Starter gets stock avatars (no HeyGen cost). Pro adds HeyGen at $15/mo add-on. Agency bundles HeyGen free.

---

## 7. Technical Architecture Detail

### 7.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           AGENTSOCIAL SYSTEM                                    │
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                        FRONTEND (Next.js)                               │    │
│  │  /dashboard  /generate  /analytics  /settings  /onboarding             │    │
│  └────────────────────────────────┬────────────────────────────────────────┘    │
│                                   │                                               │
│  ┌────────────────────────────────▼────────────────────────────────────────┐    │
│  │                      API GATEWAY (Fastify)                            │    │
│  │  JWT Auth │ Rate Limiting │ Webhook routing │ Observability            │    │
│  └────────────┬────────────────────────────────────────────────────────────┘    │
│               │                                                                  │
│  ┌────────────▼────────────────────────────────────────────────────────────┐   │
│  │                      SERVICES (Fastify Plugins)                         │   │
│  │                                                                          │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌─────────────────┐  │   │
│  │  │ AuthService│  │ Content   │  │ Video      │  │  PostizBridge   │  │   │
│  │  │  Plugin    │  │ Pipeline  │  │ Worker     │  │     Plugin      │  │   │
│  │  │           │  │  Plugin    │  │  Plugin    │  │                 │  │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └─────────────────┘  │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌─────────────────┐  │   │
│  │  │ Manuscript │  │  Avatar   │  │  Trend     │  │  CreditManager  │  │   │
│  │  │  Plugin    │  │  Plugin    │  │  Monitor   │  │     Plugin      │  │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └─────────────────┘  │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐                       │   │
│  │  │ Analytics  │  │ Webhook   │  │  User      │                       │   │
│  │  │  Plugin    │  │  Handler   │  │  Workspace │                       │   │
│  │  └────────────┘  └────────────┘  └────────────┘                       │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                   │
│  ┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐  │
│  │   PostgreSQL         │   │   Redis (Upstash)   │   │   External APIs     │  │
│  │   (Supabase/Railway) │   │   Cache + Sessions  │   │                      │  │
│  └──────────────────────┘   └──────────────────────┘   │  - Veo (Vertex AI)   │  │
│                                                         │  - Manus AI          │  │
│                                                         │  - HeyGen/Synthesia  │  │
│                                                         │  - Postiz (sidecar)  │  │
│                                                         │  - Google Trends     │  │
│                                                         └──────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Database Schema (Core Tables)

```sql
-- Users & Auth
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255),
    avatar_url VARCHAR(500),
    brand_voice TEXT,
    niche VARCHAR(100),
    plan VARCHAR(50) DEFAULT 'free'
        CHECK (plan IN ('free','starter','pro','agency')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspace (maps to Postiz workspace)
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    postiz_workspace_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Connected social accounts
CREATE TABLE connected_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,  -- instagram, facebook, tiktok, etc.
    platform_user_id VARCHAR(255),
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content opportunities (trends)
CREATE TABLE content_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    source VARCHAR(50),           -- google_trends, tiktok, twitter
    source_url VARCHAR(500),
    trend_score DECIMAL(5,2),      -- 0-100
    hashtags TEXT[],               -- ARRAY['#skincare', '#beauty']
    opportunity_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video generation jobs
CREATE TABLE video_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    content_opportunity_id UUID REFERENCES content_opportunities(id),
    veo_job_id VARCHAR(255),       -- Vertex AI job ID
    veo_prompt TEXT NOT NULL,
    duration_seconds INTEGER DEFAULT 8,
    aspect_ratio VARCHAR(20) DEFAULT '9:16',
    status VARCHAR(50) DEFAULT 'pending'
        CHECK (status IN ('pending','queued','generating','ready','failed','cancelled')),
    video_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    cost_usd DECIMAL(10,4) DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Avatar configurations
CREATE TABLE avatars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,  -- heygen, synthesia, did
    provider_avatar_id VARCHAR(255),
    name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'training'
        CHECK (status IN ('training','ready','failed','paused')),
    training_video_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts (scheduled/published via Postiz)
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    video_job_id UUID REFERENCES video_jobs(id),
    platform VARCHAR(50) NOT NULL,
    caption TEXT,
    hashtags TEXT[],
    scheduled_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    postiz_post_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'draft'
        CHECK (status IN ('draft','scheduled','queued','publishing','published','failed')),
    postiz_webhook_status VARCHAR(50),
    engagement_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit system
CREATE TABLE credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
    video_credits INTEGER NOT NULL DEFAULT 3,
    last_refreshed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_connected_accounts_workspace ON connected_accounts(workspace_id);
CREATE INDEX idx_content_opportunities_workspace ON content_opportunities(workspace_id);
CREATE INDEX idx_video_jobs_workspace ON video_jobs(workspace_id);
CREATE INDEX idx_video_jobs_status ON video_jobs(status);
CREATE INDEX idx_posts_workspace ON posts(workspace_id);
CREATE INDEX idx_posts_status ON posts(status);
```

### 7.3 API Routes

```
Authentication:
  POST   /api/v1/auth/register
  POST   /api/v1/auth/login
  POST   /api/v1/auth/google
  POST   /api/v1/auth/refresh

Workspace:
  GET    /api/v1/workspaces/:id
  POST   /api/v1/workspaces

Connected Accounts:
  GET    /api/v1/accounts
  POST   /api/v1/accounts/connect/:platform
  DELETE /api/v1/accounts/:id
  GET    /api/v1/accounts/:id/status

Trend Opportunities:
  GET    /api/v1/opportunities
  GET    /api/v1/opportunities/:id
  POST   /api/v1/opportunities/:id/generate  (triggers video generation)

Video Jobs:
  GET    /api/v1/videos
  GET    /api/v1/videos/:id
  POST   /api/v1/videos/generate
  POST   /api/v1/videos/:id/regenerate
  DELETE /api/v1/videos/:id
  POST   /api/v1/videos/:id/approve  (moves to publishing queue)

Avatars:
  GET    /api/v1/avatars
  POST   /api/v1/avatars
  GET    /api/v1/avatars/:id
  DELETE /api/v1/avatars/:id

Publishing:
  GET    /api/v1/posts
  POST   /api/v1/posts
  GET    /api/v1/posts/:id
  PUT    /api/v1/posts/:id
  DELETE /api/v1/posts/:id
  POST   /api/v1/posts/:id/publish
  POST   /api/v1/posts/:id/schedule

Analytics:
  GET    /api/v1/analytics/overview
  GET    /api/v1/analytics/videos
  GET    /api/v1/analytics/posts
  GET    /api/v1/analytics/trends

Credits:
  GET    /api/v1/credits
  POST   /api/v1/credits/purchase

Webhooks:
  POST   /api/v1/webhooks/veo        (Vertex AI job completion)
  POST   /api/v1/webhooks/postiz    (Postiz post status updates)
  POST   /api/v1/webhooks/heygen   (HeyGen avatar ready)
```

---

## 8. Security & Compliance

| Concern | Mitigation |
|---------|-----------|
| OAuth token storage | Encrypted at rest (AES-256); never logged |
| Platform API keys | Environment variables / secrets manager (Vercel/GitHub secrets) |
| Webhook verification | RSA-SHA256 for Manus; platform-specific HMAC for others |
| Rate limiting | Per-user rate limits (configurable per plan); Redis-backed |
| Prompt injection | Sanitize all user-provided inputs before inserting into Manus prompts |
| GDPR | User data export/delete endpoints; no third-party data sharing |
| Platform ToS compliance | Postiz handles OAuth compliance; no direct scraping |

---

## 9. Open Questions / Blockers

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | Veo 3.1 Lite pricing — confirm cost/second with Google sales | Jason | **BLOCKING** |
| 2 | Manus Elite plan — confirm concurrency limits | Jason | Needed for Stage 4 |
| 3 | HeyGen partnership — outreach required | Jason | Needed for Stage 2 |
| 4 | Postiz rate limits — confirm 30 req/hr limit from docs | agentsocial-dev | Clarify before Stage 3 |
| 5 | Meta Graph API app review — required for IG engagement data | agentsocial-dev | Stage 4 blocker |
| 6 | Platform OAuth costs — TikTok, IG, etc. require app approval | agentsocial-dev | Stage 3 blocker |
| 7 | Veo quota — GCP project needs Vertex AI quota approval | Jason | **BLOCKING** |

---

## 10. Immediate Next Steps

**Week 1 (This Week):**
- [ ] Jason: Obtain Google Cloud project with Vertex AI enabled; get Veo quota estimate
- [ ] Jason: Get Manus Elite plan pricing and concurrency details
- [ ] agentsocial-dev: Set up Fastify backend skeleton with core plugins
- [ ] agentsocial-dev: Write DB migration for core schema
- [ ] agentsocial-dev: Deploy Postiz Docker sidecar for local dev testing

**Week 2-3:**
- [ ] agentsocial-dev: Implement Auth (JWT + Google OAuth)
- [ ] agentsocial-dev: Build Manus API wrapper (createTask, pollTask)
- [ ] agentsocial-dev: Build Veo API wrapper (Vertex AI integration)
- [ ] agentsocial-dev: Build content opportunity dashboard (basic trend list)
- [ ] agentsocial-dev: Build video generation flow (prompt → Veo → preview)

**Week 4-6 (Stage 1 MVP Complete):**
- [ ] End-to-end test: signup → trend → generate video → preview
- [ ] Credit system implemented
- [ ] Dashboard UI polished
- [ ] Docs for API consumers (agent integrations)

---

*Document version 1.0. This defines the product vision for AgentSocial. Updates to be tracked in memory/ and PROJECT_STATUS.md.*