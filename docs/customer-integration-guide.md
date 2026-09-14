# Customer Integration Guide: Using Manus/Meta Insights in AgentSocial

## Overview
Each AgentSocial customer (workspace) gains access to Meta-powered insights through our secure API wrapper and usage tracking system. This enables features like trend scanning, copy optimization, and audience insights—all while staying within Meta's free tier limits.

## How It Works for Customers

### 1. Workspace-Level Configuration
When a customer signs up for AgentSocial:
- A workspace is created in our database
- They connect their Meta/Facebook account (one-time setup)
- We securely store their user access token (encrypted)
- Initial credits: 1,000 free + 300/day replenishing

### 2. Feature Access Points
Customers interact with Manus-powered features through:

#### **In the Website Builder (AgentSite):**
- **"Get Meta-Optimized Copy"** button in copy editor
- **"Scan Current Trends"** button in design/suggestion panel
- **"Audience Insights"** sidebar for targeting recommendations
- Auto-suggestions powered by Manus when enabled

#### **In the Ad Creation Flow:**
- **"Optimize for Meta Platforms"** toggle in ad composer
- Trending creative formats shown in template selector
- Recommended hashtags and posting times based on real-time Meta data

#### **In Analytics & Reporting:**
- Competitive benchmarking against similar businesses
- Industry trend alerts (via background caching)
- Performance insights with Meta-specific context

### 3. Usage Management (Transparent to Customer)
Our system automatically manages their Meta API usage:

#### **Credit System:**
- Each workspace starts with 1,000 initial credits
- Replenishes with 300 credits daily (free tier)
- Different actions cost different credits:
  - Trend scan: ~150 credits
  - Copy optimization: ~100 credits
  - Audience insight: ~75 credits

#### **Priority-Based Routing:**
- **P0 Tasks** (Trend scans, Copy optimization): Try Manus first
- **P1 Tasks** (Audience insights, Competitive analysis): Try Manus if credits > threshold
- **P2 Tasks** (General queries, Reporting): Local LLM fallback unless high credits available
- Automatic fallback to our local LLM when:
  - Daily credits exhausted
  - Manus API unavailable
  - User opts out via toggle

#### **User Controls:**
- **"Use Meta Insights"** toggle (defaults OFF for privacy)
- When ON: Attempts Manus for P0/P1 tasks
- When OFF: Always uses local LLM
- Transparency badge: "✨ Enhanced with Meta Insights" when used
- Quota warnings at 80%/100% usage

### 4. Data Flow & Privacy
**What we send to Meta:**
- Only public API queries (Ad Library searches, public page insights)
- NO user-generated content, NO private data, NO PII
- Generic queries like: "top performing ad creatives for fitness brands age 25-34"

**What we store:**
- Encrypted access token (rotated regularly)
- Usage metrics (counts, timestamps, endpoint types)
- Cached insights (to reduce API calls)
- NO storage of raw Meta API responses containing user data

### 5. Experience by Customer Type

#### **AI Agent Operators:**
- Programmatic access via our API: `/api/manus/trend-scan`, `/api/manus/copy-optimization`
- Can build autonomous agents that leverage Meta insights
- Higher credit limits available for agent workflows
- Webhook notifications for trend changes

#### **Solopreneur Creators:**
- Simple UI buttons in Website Builder and Ad Creator
- "Get Meta-Suggested Headline" with one click
- Trending template recommendations for their niche
- Time saved on research: 10-15 mins per content piece

#### **Social-First Small Businesses:**
- Competitive intelligence: "What are similar businesses doing?"
- Audience refinement: "Who else likes my customers?"
- Trend jumping: "This format is rising—should I try it?"
- Localized insights when available (geo-targeted trends)

## Technical Implementation Details

### API Endpoints Available to Customers:
```
POST /api/manus/trend-scan
  Body: { vertical: "fitness", geo: "US", timeframe: "week" }
  Response: { trends: [...], cached: boolean, creditsUsed: number }

POST /api/manus/copy-optimization
  Body: { copy: "Try our new product!", audience: "parents", platform: "instagram" }
  Response: { suggestions: [...], insights: {...}, creditsUsed: number }

GET /api/manus/usage/:workspaceId
  Response: { date: "...", creditsUsed: 450, creditsRemaining: 850, ... }

POST /api/manus/usage/:workspaceId/reset  (called by cron at midnight)
```

### Fallback Behavior:
1. Try Manus API (if toggle ON and credits available)
2. If 429 (rate limited): Wait, retry once, then fallback
3. If 5xx (server error): Exponential backoff retry, then fallback
4. If toggle OFF or no credits: Go directly to local LLM
5. Local LLM prompt augmented with: "Based on general marketing best practices..."

## Value Proposition for Customers

### **Time Savings:**
- Eliminates 10-20 minutes of manual research per content piece
- Instant access to trending formats and copy patterns
- No need to switch between multiple tools for insights

### **Performance Improvement:**
- Content optimized for current Meta platform algorithms
- Better targeting recommendations based on fresh audience data
- Competitive benchmarking against real-time Ad Library data

### **Cost Efficiency:**
- Access to premium insights at no extra cost (included in AgentSocial plans)
- No need for separate subscriptions to trend tools or audience platforms
- Free tier sufficient for typical SMB usage patterns

### **Competitive Advantage:**
- Features no other social media tool offers (true API-first insights)
- Differentiator against Buffer, Hootsuite, Sprout Social
- Enables "AI agent" workflows that learn from Meta's proprietary data

## Rollout & Adoption Strategy

### **Phase 1: Launch (Available Now)**
- Core Manus endpoints built and tested
- Usage tracking and priority routing implemented
- Secure API wrapper in place
- Documentation complete

### **Phase 2: Customer Onboarding**
- In-app prompts to connect Meta account during workspace setup
- Tutorial tooltips for "Get Meta-Optimized Copy" buttons
- Beta program with 5-10 power users per persona type

### **Phase 3: Expansion**
- Expand to more Manus endpoints (campaign reporting, lead gen insights)
- Add geographic and language-specific trend data
- Introduce premium tiers for higher credit limits (if needed)
- Partner with Meta for increased free tier access (co-marketing opportunity)

## Success Metrics to Track

### **Adoption:**
- % of workspaces that connect Meta account
- % of users who toggle "Use Meta Insights" ON
- Avg. number of Manus API calls per workspace per week

### **Impact:**
- Time saved on research (self-reported via surveys)
- Change in content performance (CTR, engagement) for Manus-optimized vs. baseline
- Customer satisfaction scores (NPS) for insight features

### **Efficiency:**
- % of P0/P1 tasks served by Manus (when credits available)
- Cache hit rate (redundant API calls avoided)
- Fallback rate (quota exhausted or API unavailable)

## FAQ for Customers

**Q: Will this cost me extra?**
A: No—Manus/Meta insights are included in your AgentSocial subscription at no additional cost. We manage the free tier credits on your behalf.

**Q: Do I need a Meta Business account?**
A: Yes—you'll need to connect your Facebook/Meta account during workspace setup. Personal accounts work for testing; Business accounts recommended for production.

**Q: What if I run out of credits?**
A: You'll get warnings at 80% usage. At 100%, the system gracefully falls back to our local LLM for insights. Credits replenish daily at midnight UTC.

**Q: Is my data safe?**
A: Absolutely. We never send your user-generated content, private data, or PII to Meta. We only make public API queries for trends and insights. Your Meta access token is stored encrypted and never exposed.

**Q: Can I turn this off?**
A: Yes—the "Use Meta Insights" toggle defaults OFF. You control when to leverage Meta's proprietary data vs. our standard AI.

**Q: How fresh is the data?**
A: Trending data is cached for 6 hours (balance of freshness and efficiency). Audience insights cache for 12 hours. Real-time queries bypass cache when credits allow.

## Get Started
1. Connect your Meta account in Workspace Settings → Integrations
2. Toggle "Use Meta Insights" ON in feature preferences
3. Look for the "✨ Enhanced with Meta Insights" badge in Website Builder and Ad Creator
4. Start creating content with Meta-powered advantages!

For questions, see our full FAQ at `docs/manus-faq.md` or contact support.