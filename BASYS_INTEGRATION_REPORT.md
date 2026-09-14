# AgentSocial — Basys Health Integration Report

**Date:** 2026-04-29  
**Prepared for:** Basys Health Competitive Intelligence → Content Pipeline  
**Status:** Urgent — Research Complete, Moving to Content Creation

---

## Executive Summary

AgentSocial has **strong foundational infrastructure** to support the Basys Health competitive intelligence content pipeline. The system already supports:

- ✅ Multi-brand content generation (internal + external)
- ✅ AI-powered content generation (Claude + OpenAI fallback)
- ✅ Social media + blog content output
- ✅ Template-based generation with variable substitution
- ✅ Scheduling and publishing automation
- ✅ Brand-scoped data isolation
- ⚠️ **WordPress publishing — NOT yet built**
- ⚠️ **Competitive intelligence input format — needs custom endpoint**

**Recommendation:** Estimated effort is **2-3 weeks** for full integration including WordPress publishing and competitive intelligence endpoint.

---

## 1. Content Generation API

### Current Capabilities

AgentSocial already has a robust AI content generation service:

| Feature | Status | Endpoint |
|---|---|---|
| AI content generation | ✅ Built | `POST /v1/content/generate` |
| Template-based generation | ✅ Built | `POST /v1/content/generate-from-template` |
| Multi-platform output | ✅ Built | twitter, linkedin, facebook, instagram, tiktok |
| Brand-scoped generation | ✅ Built | `brandId` parameter isolates data |
| Bulk generation | ✅ Built | `POST /v1/content/bulk-generate` |
| Content extraction | ✅ Built | YouTube, audio, article, PDF, text |

### Current Input Format (`POST /v1/content/generate`)

```json
{
  "topic": "The future of health optimization",
  "platform": "linkedin",
  "tone": "professional",
  "length": "medium",
  "brandId": "basys-health"
}
```

### Current Output Format

```json
{
  "text": "The future of health optimization is here...",
  "hashtags": ["#HealthTech", "#Optimization"],
  "imagePrompts": ["Futuristic health lab with glowing screens"],
  "platform": "linkedin",
  "characterCount": 2847
}
```

### What Needs Building for Basys

A **new endpoint** that accepts structured competitive intelligence data:

**Proposed Endpoint:** `POST /v1/content/competitive-generate`

**Input Format:**

```json
{
  "brandId": "basys-health",
  "competitorData": {
    "source": "competitive_intelligence_report",
    "competitors": [
      {
        "name": "Function Health",
        "contentThemes": ["longevity", "blood testing", "personalized medicine"],
        "topPerformingTopics": ["biomarker analysis", "preventive care"],
        "engagementMetrics": {
          "avgLikes": 1250,
          "avgShares": 340
        },
        "recentPosts": [
          {
            "platform": "linkedin",
            "content": "...",
            "engagement": 5400
          }
        ]
      },
      {
        "name": "Superpower",
        "contentThemes": ["supplements", "cognitive enhancement"],
        "topPerformingTopics": ["nootropics", "sleep optimization"]
      }
    ],
    "marketGaps": ["affordable testing", "integration with wearables"],
    "trendingKeywords": ["longevity", "biomarkers", "optimization"]
  },
  "contentRequest": {
    "type": "blog_post",        // blog_post, social_post, newsletter
    "platform": "linkedin",      // for social posts
    "tone": "authoritative",
    "length": "long",
    "targetKeywords": ["health optimization", "biomarker testing"],
    "differentiationAngle": "affordable + accessible",
    "includeCTA": true
  }
}
```

**Output Format:**

```json
{
  "content": "# Why Basys Health Is Making Biomarker Testing Accessible to Everyone\n\nThe health optimization space has exploded...",
  "metadata": {
    "type": "blog_post",
    "wordCount": 1250,
    "readingTime": "5 min",
    "keywordsIntegrated": ["health optimization", "biomarker testing", "accessible"],
    "competitorsReferenced": ["Function Health", "Superpower"],
    "differentiationPoints": ["affordable testing", "no membership required"],
    "suggestedHashtags": ["#HealthOptimization", "#BiomarkerTesting"],
    "imagePrompts": ["Person smiling at health dashboard showing biomarkers"]
  },
  "socialMediaVersions": [
    {
      "platform": "linkedin",
      "text": "The health optimization space is dominated by $500+ memberships. We're changing that...",
      "characterCount": 2847
    },
    {
      "platform": "twitter",
      "text": "Function Health charges $500/year. Superpower: $300/month. Basys Health: $99 one-time. Same biomarkers. Better accessibility.",
      "characterCount": 178
    }
  ]
}
```

---

## 2. WordPress Publishing

### Current Status: ❌ NOT BUILT

AgentSocial does **NOT** currently have WordPress integration. The system has:
- Social media platform connectors (Facebook, Twitter, etc.)
- Vercel deployment for SiteFlow websites
- **No WordPress REST API integration**

### What Needs Building

**Option A: WordPress REST API (Recommended)**

| Component | Description |
|---|---|
| Authentication | WordPress Application Passwords (WP 5.6+) |
| Endpoint | `POST /v1/wordpress/publish` |
| Features | Publish draft, schedule post, upload media, set categories/tags |
| Storage | Store WP credentials per brand in `channels` table |

**API Contract (Proposed):**

```http
POST /v1/wordpress/publish
Content-Type: application/json

{
  "brandId": "basys-health",
  "siteUrl": "https://basyshealth.com",
  "credentials": {
    "username": "content_api",
    "applicationPassword": "xxxx xxxx xxxx xxxx"
  },
  "post": {
    "title": "Why Basys Health Is Making Biomarker Testing Accessible",
    "content": "<h2>The Problem with Current Health Optimization...</h2>",
    "status": "draft",          // draft, publish, future
    "categories": [118, 42],      // WP category IDs
    "tags": ["health", "optimization"],
    "featuredMedia": "https://...jpg",
    "meta": {
      "seo_title": "Accessible Biomarker Testing | Basys Health",
      "seo_description": "..."
    }
  }
}
```

**Response:**

```json
{
  "success": true,
  "postId": 1847,
  "postUrl": "https://basyshealth.com/why-basys-health-is-making-biomarker-testing-accessible",
  "status": "draft",
  "publishedAt": null,
  "message": "Draft created successfully"
}
```

**Option B: WordPress Plugin (Future)**

For more advanced integration (custom blocks, real-time sync), a WordPress plugin could be built that:
- Receives webhooks from AgentSocial
- Auto-creates drafts with Gutenberg blocks
- Syncs content status back to AgentSocial

---

## 3. Internal vs External Version

### Current Architecture: ✅ Supports Both

AgentSocial uses a **multi-tenant brand-scoped architecture** that naturally supports internal + external use:

```
Organization (AgentSocial)
├── Brand: "Basys Health"          ← Internal business
├── Brand: "ByondEdu"              ← Internal business
├── Brand: "ColorGenius"           ← Internal business
├── Brand: "Customer A"            ← External paying customer
├── Brand: "Customer B"            ← External paying customer
```

**How It Works:**

| Feature | Internal (6+ businesses) | External (customers) |
|---|---|---|
| **Data Isolation** | ✅ Brand-scoped | ✅ Brand-scoped |
| **Content Generation** | ✅ Full access | ✅ Full access |
| **Templates** | ✅ All + custom internal | ✅ Standard library |
| **WordPress Publishing** | ✅ All sites | ✅ Their sites only |
| **Pricing** | Internal cost allocation | Subscription tiers |
| **Support Level** | Dedicated | Standard |

### Recommended Implementation

1. **Create 6+ internal brands** for Basys, ByondEdu, ColorGenius, etc.
2. **Create a "customer" tier** in the API key system with restricted permissions
3. **Use the same API endpoints** — access control is handled by `brandId` + API key permissions
4. **Add subscription tracking** (if not already in place) for external customers

---

## 4. API Contract

### Base URL

```
Production:  https://api.agentsocial.io/v1
Staging:     https://staging-api.agentsocial.io/v1
Local Dev:   http://localhost:3001/v1
```

### Authentication

| Method | Status | Details |
|---|---|---|
| API Keys | ✅ Built | `X-API-Key: your_api_key_here` header |
| JWT Tokens | ✅ Built | For frontend user sessions |
| WordPress App Passwords | ❌ Needs Build | Per-brand credentials |

### Rate Limits

| Endpoint | Current Limit | Notes |
|---|---|---|
| Content generation | 20 req/min | Per API key (sliding window) |
| Template listing | 100 req/min | |
| Publishing | 50 req/min | |
| Competitive generate | **TBD** | Suggest 10 req/min (heavier processing) |

### Example Request Flow

```bash
# 1. Generate content from competitive intelligence
curl -X POST https://api.agentsocial.io/v1/content/competitive-generate \
  -H "X-API-Key: basys_prod_key_xxx" \
  -H "Content-Type: application/json" \
  -d @competitor-data.json

# 2. Publish to WordPress
curl -X POST https://api.agentsocial.io/v1/wordpress/publish \
  -H "X-API-Key: basys_prod_key_xxx" \
  -H "Content-Type: application/json" \
  -d @post-data.json
```

---

## 5. What's Built vs What Needs Building

### ✅ Already Built

| Component | Location |
|---|---|
| AI content generation | `packages/backend/src/services/ai-content.ts` |
| Content templates | `packages/backend/src/routes/templates.ts` |
| Bulk generation | `packages/backend/src/routes/content.ts` |
| Brand-scoped routes | All routes use `brandId` parameter |
| API key system | `packages/api/src/db/schema.ts` → `api_keys` table |
| Multi-tenant DB | `organizations` + `brands` + `users` |
| SiteFlow (website builder) | `packages/backend/src/routes/websites.ts` |
| Frontend dashboard | `packages/frontend/src/app/websites/` |

### ❌ Needs Building

| Component | Effort | Priority |
|---|---|---|
| Competitive intelligence endpoint | 3-4 days | **HIGH** |
| WordPress REST API integration | 5-7 days | **HIGH** |
| WordPress auth storage (per brand) | 1-2 days | HIGH |
| Content type expansion (blog/newsletter) | 2-3 days | MEDIUM |
| Basys-specific content templates | 2-3 days | MEDIUM |
| WordPress media upload | 2-3 days | LOW |

### Total Estimated Effort

**Phase 1 (MVP):** 2 weeks
- Competitive intelligence endpoint
- WordPress publish (basic)
- Internal brand setup for 6+ businesses

**Phase 2 (Production):** +1 week
- WordPress media upload
- Advanced templates
- Monitoring and error handling
- Documentation

---

## 6. Immediate Next Steps

1. **Confirm requirements** — Schedule 30-min call to finalize competitive intelligence input format
2. **Create development branch** — `feature/basys-competitive-integration`
3. **Build competitive intelligence endpoint** — Use existing `ai-content.ts` as base
4. **Set up internal brands** — Basys, ByondEdu, ColorGenius, etc.
5. **Build WordPress connector** — Start with basic publish, iterate
6. **Test end-to-end** — Competitor data → content → WordPress draft

---

## 7. Technical Notes

### Existing AI Service

The `ai-content.ts` service supports Claude (primary) and OpenAI (fallback). To add competitive intelligence:

1. Create new prompt builder: `buildCompetitivePrompt(input)`
2. Add to `GenerateContentInput` interface:
   ```typescript
   competitorData?: {
     competitors: CompetitorInsight[];
     marketGaps: string[];
     trendingKeywords: string[];
   }
   ```
3. Create new route handler in `content.ts`
4. Add rate limiter key: `competitive:${brandId}`

### Database Schema

No schema changes needed for Phase 1. The existing `posts` table can store generated content:

```sql
-- Posts already support this
INSERT INTO posts (brand_id, content, status, scheduled_at)
VALUES ('basys-health', '<generated blog post>', 'draft', NULL);
```

For WordPress integration, add to `channels` table (already supports multiple platforms):

```sql
-- WordPress as a "channel"
INSERT INTO channels (brand_id, platform, name, account_id, settings)
VALUES ('basys-health', 'wordpress', 'Basys Blog', 'basyshealth.com', 
  '{"siteUrl": "https://basyshealth.com", "authMethod": "app_password"}'
);
```

---

## Conclusion

AgentSocial's architecture **fully supports** the Basys Health competitive intelligence content pipeline. The multi-tenant brand system makes internal/external dual-use straightforward. The main work is:

1. **Competitive intelligence endpoint** (~1 week)
2. **WordPress publishing integration** (~1-2 weeks)

With these two components, Basys can begin automated content creation immediately.

**Ready to proceed?** Confirm the competitive intelligence input format and we'll start development.
