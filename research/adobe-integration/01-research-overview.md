# Adobe Creative Cloud Integration Research
## AgentSocial Platform — Adobe Integration Design Document

**Date:** 2026-05-03  
**Status:** Research & Architecture Design  
**Priority APIs:** Adobe Firefly (P0), Adobe Stock (P0), Photoshop API (P1), Illustrator API (P1), Express Embed SDK (P2)

---

## 1. Executive Summary

This document outlines the research findings and proposed integration architecture for connecting Adobe Creative Cloud APIs into the AgentSocial platform. The integration enables AgentSocial users to:

- Generate AI-powered images and videos via **Adobe Firefly**
- Search, preview, and license stock assets via **Adobe Stock**
- Apply cloud-based image edits via **Adobe Photoshop API**
- Create social media graphics via **Adobe Express Embed SDK**

**Key Insight:** Adobe's APIs are enterprise-grade with enterprise pricing. Consumer plans do NOT include API access. Any integration requires an Adobe Enterprise/ETLA agreement starting at ~$1,000/month minimum.

---

## 2. Adobe Firefly API — AI Image/Video Generation (P0)

### 2.1 Overview
Firefly API enables text-to-image generation, style transfer, generative fill, and video generation. The latest model is **Firefly Image 5** with native 4MP resolution.

### 2.2 Authentication
- **OAuth Server-to-Server** (JWT deprecated as of June 30, 2025)
- Requires `client_id` and `client_secret` from Adobe Developer Console
- Scopes: `openid,AdobeID,session,additional_info,read_organizations,firefly_api,ff_apis`
- Token endpoint: `https://ims-na1.adobelogin.com/ims/token/v3`

### 2.3 API Endpoints

#### Generate Image (Synchronous)
```
POST https://firefly-api.adobe.io/v3/images/generate
```

**Request Body:**
```json
{
  "prompt": "a photo of a volcano",
  "numVariations": 4,
  "size": { "width": 2688, "height": 1536 },
  "promptBiasingLocaleCode": "en-US",
  "style": {
    "presets": ["doodle_drawing", "scribble_texture"]
  },
  "structure": {
    "strength": 100,
    "imageReference": {
      "source": { "uploadId": "upload-id-here" }
    }
  }
}
```

**Response:**
```json
{
  "outputs": [
    {
      "seed": 123456,
      "image": {
        "url": "https://...",
        "width": 2688,
        "height": 1536
      }
    }
  ]
}
```

#### Generate Image (Async)
```
POST https://firefly-api.adobe.io/v3/images/generate-async
```
- Returns a job ID for polling status
- Ideal for batch processing

### 2.4 Key Features

| Feature | Description |
|---------|-------------|
| Text-to-Image | Generate images from text prompts |
| Generative Fill | Expand images, remove objects, fill backgrounds |
| Style Transfer | Apply artistic styles to generated images |
| Custom Models | Train models on brand-specific imagery |
| Structure Reference | Match composition of reference images |
| Video Generation | 1080p/720p AI-generated video content |

### 2.5 Credit Consumption

| Operation | Credits Per Use |
|-----------|----------------|
| Standard AI (Generative Fill, Expand) | 1 credit |
| Firefly Image 5 (standard generation) | 10 credits |
| Firefly Image 4 Ultra | 20 credits |
| Sound effects generation | 10 credits |
| Speech synthesis | 10 credits per 1,000 chars |
| Video generation (1080p, 24fps) | 100 credits per second |
| Video generation (720p, 24fps) | 50 credits per second |

### 2.6 Rate Limits

| Tier | RPM | RPD |
|------|-----|-----|
| Default | 4 requests/min | 9,000 requests/day |
| Licensed Enterprise | Higher limits (negotiated) | Based on annual quota |

### 2.7 Pricing

| Plan | Monthly Price | Credits/Month | Notes |
|------|--------------|---------------|-------|
| Firefly Standard | $9.99 | 2,000 | Web UI only, no API |
| Firefly Pro | $19.99 | 4,000 | Web UI only, no API |
| Firefly Premium | $199.99 | 50,000 | Web UI only, no API |
| **Enterprise API** | ~$1,000+ min | Negotiated | ~$0.02 per standard generation |

**Important:** API access requires an Enterprise agreement. Consumer plans (Standard/Pro/Premium) do NOT include programmatic access.

### 2.8 Content Moderation
- Firefly has safety filters that may reject 5-15% of requests
- False positives common on product photos (kitchen knives, swimwear)
- Rejected requests still consume credits — no output

---

## 3. Adobe Stock API — Search & Licensing (P0)

### 3.1 Overview
Adobe Stock API provides programmatic access to 300M+ assets (photos, videos, vectors, templates). Requires **Stock for Enterprise** subscription or **Adobe Affiliate** program membership.

### 3.2 Access Requirements
- **Stock for Enterprise** subscription (via Adobe Admin Console)
- **Adobe Affiliate** program membership (for search only)
- Prerelease program approval for non-Enterprise
- Creative Cloud Professional/Professional Plus does NOT include Stock API access

### 3.3 Authentication
- **Server-to-Server OAuth** (recommended for Enterprise)
- **User OAuth** (requires Prerelease approval)
- Requires `client_id` and `client_secret`
- Scopes: `openid, AdobeID, stock`

### 3.4 API Endpoints

#### Search Assets
```
GET https://stock.adobe.io/Rest/Media/1/Search/Files
```

**Query Parameters:**
```
?search_parameters[words]=mountain+landscape
&search_parameters[limit]=32
&search_parameters[offset]=0
&search_parameters[order]=relevance
&search_parameters[filters][content_type:photo]=1
&search_parameters[filters][content_type:illustration]=1
&locale=en_US
```

**Headers:**
```
x-api-key: {client_id}
x-product: AgentSocial/1.0
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "nb_results": 125000,
  "files": [
    {
      "id": 123456789,
      "title": "Mountain Landscape",
      "creator_name": "John Doe",
      "thumbnail_url": "https://t4.ftcdn.net/...",
      "width": 6000,
      "height": 4000,
      "category_hierarchy": [{"name": "Nature", "id": 1}],
      "content_type": "image",
      "media_type_id": 1,
      "creation_date": "2024-01-15",
      "premium_level_id": 0
    }
  ]
}
```

#### Get Asset Details (Bulk)
```
GET https://stock.adobe.io/Rest/Media/1/Files/{id}
GET https://stock.adobe.io/Rest/Media/1/Files?ids=123,456,789
```

#### Get Licensing Info
```
GET https://stock.adobe.io/Rest/Libraries/1/Member/Profile
```
- Returns user's purchasing status and available credits

#### License Asset
```
POST https://stock.adobe.io/Rest/Libraries/1/Content/{content_id}/License
```

**Request Body:**
```json
{
  "purchase_state": "purchased",
  "license": "Standard"
}
```

#### Get License History
```
GET https://stock.adobe.io/Rest/Libraries/1/Member/LicensedAssets
```

### 3.5 Search Filters

| Filter | Values | Description |
|--------|--------|-------------|
| content_type | photo, illustration, vector, video, template | Asset type |
| orientation | horizontal, vertical, square, all | Image orientation |
| has_releases | 1, 0 | Has model/property releases |
| is_premium | 1, 0 | Premium assets only |
| prices | [{"price": 0, "purchase_options": ["all"] }] | Price range |
| age | 1d, 1w, 1m, 6m, 1y, 2y, all | Asset age |
| video_duration | 0-20s, 20-60s, 60s+ | Video length |

### 3.6 Licensing Tiers

| Tier | Cost | Usage |
|------|------|-------|
| Standard License | 1 credit | Web, social, digital (up to 500K copies) |
| Extended License | 8 credits | Unlimited reproduction, merchandise |
| Premium/Video | 2-50 credits | Premium assets, video content |

### 3.7 Rate Limits
- Search: **100 assets per request** (max page size)
- No published per-second rate limits, but recommended to stay under 10 req/sec
- Enterprise plans get higher throughput

### 3.8 Pricing
- Requires **Stock for Enterprise** subscription
- Credits purchased in bundles (10, 40, 350, 750, etc.)
- Standard: ~$2.99-$7.99 per image depending on plan
- Enterprise: Volume pricing available

---

## 4. Adobe Photoshop API — Cloud-Based Editing (P1)

### 4.1 Overview
Photoshop API enables cloud-based image editing including background removal, smart object manipulation, actions playback, and text layer editing.

### 4.2 Authentication
- Same OAuth Server-to-Server as Firefly
- Requires `client_id` and `client_secret`
- Scopes: `openid, AdobeID, read_organizations`

### 4.3 Key Capabilities

| Capability | Description | Use Case |
|-----------|-------------|----------|
| Remove Background | AI-powered subject isolation | Product photography |
| Smart Object | Non-destructive layer replacement | Mockup generation |
| Auto Tone | AI-driven photo enhancement | Content optimization |
| Text Layer | Add/edit text on PSD files | Social media graphics |
| Actions | Batch apply Photoshop actions | Bulk image processing |
| Custom Filters | Apply preset or custom filters | Brand consistency |

### 4.4 API Endpoints

#### Remove Background
```
POST https://image.adobe.io/sensei/cutout
```

**Request:**
```json
{
  "input": {
    "href": "https://storage-url/input.jpg",
    "storage": "external"
  },
  "output": {
    "href": "https://storage-url/output.png",
    "storage": "external",
    "overwrite": true
  }
}
```

#### Smart Object Replacement
```
POST https://image.adobe.io/pie/psdService/smartObject
```

**Request:**
```json
{
  "inputs": [{
    "href": "https://storage-url/template.psd",
    "storage": "external"
  }],
  "options": {
    "layers": [{
      "name": "Design",
      "input": {
        "href": "https://storage-url/new-design.png",
        "storage": "external"
      }
    }]
  },
  "outputs": [{
    "href": "https://storage-url/output.jpg",
    "storage": "external",
    "type": "image/jpeg"
  }]
}
```

### 4.5 Pricing
- ~$0.15 per API call (legacy pricing)
- 500 free trial calls available
- Enterprise volume discounts through Adobe Sales

### 4.6 Rate Limits
- Not publicly documented
- Processing time: 1-5 seconds per operation
- Batch processing supported via job queue

---

## 5. Adobe Express Embed SDK — Social Graphics (P2)

### 5.1 Overview
Adobe Express Embed SDK allows embedding the full Express editor or Quick Actions within AgentSocial's interface. Best for template-based social media graphic creation.

### 5.2 SDK Modes

| Mode | Description |
|------|-------------|
| Full Editor | Complete Express editor with templates, fonts, stock |
| Quick Actions | Fast editing tools (resize, remove bg, crop, etc.) |
| Document API | Read/modify Express documents programmatically |

### 5.3 Authentication
- OAuth Web credential
- Scopes: `openid, creative_sdk, profile, address, AdobeID, email, cc_files, cc_libraries`

### 5.4 Use Cases
- Social media post creation from templates
- Quick resize for multiple platforms
- Background removal for product shots
- Text overlay on images

---

## 6. Illustrator API & Video APIs (P2 — Future)

### 6.1 Illustrator API
- Primarily SDK/plugin-based (CEP/UXP)
- No dedicated REST API for vector manipulation
- Can use Photoshop API for SVG export workflows
- **Recommendation:** Defer until Adobe releases REST API

### 6.2 Premiere Pro / After Effects APIs
- No native scalable REST API for video automation
- Plugin-based (C++ SDK, CEP panels)
- Third-party solutions (Plainly, Templater) bridge this gap
- **Recommendation:** Use Firefly Video API for generative video; defer full video automation

---

## 7. Authentication Architecture

### 7.1 OAuth Server-to-Server Flow
```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ AgentSocial │────▶│ Adobe IMS        │────▶│ Adobe Services  │
│ Backend     │◄────│ (ims-na1.adobe  │◄────│ (Firefly, Stock,│
│             │     │  login.com)      │     │  Photoshop)     │
└─────────────┘     └──────────────────┘     └─────────────────┘
     │
     │ Client Credentials Flow
     │ grant_type=client_credentials
     │ scope=openid,AdobeID,firefly_api,...
     ▼
  Access Token (24hr expiry)
```

### 7.2 Token Management
- Tokens expire every 24 hours
- Implement automatic refresh before expiry
- Store tokens securely (encrypted at rest)
- Use Redis/caching layer for token storage

### 7.3 Required Credentials
```javascript
const ADOBE_CONFIG = {
  clientId: process.env.ADOBE_CLIENT_ID,
  clientSecret: process.env.ADOBE_CLIENT_SECRET,
  imsHost: 'https://ims-na1.adobelogin.com',
  apiKey: process.env.ADOBE_CLIENT_ID, // x-api-key header
  scopes: 'openid,AdobeID,session,additional_info,read_organizations,firefly_api,ff_apis,stock'
};
```

---

## 8. Rate Limiting & Error Handling

### 8.1 Retry Strategy
```javascript
const retryConfig = {
  retries: 3,
  backoff: 'exponential',
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  retryableStatusCodes: [429, 500, 502, 503, 504],
  retryAfterHeader: true // Respect Retry-After header
};
```

### 8.2 Rate Limit Response
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 4
X-RateLimit-Remaining: 0
```

### 8.3 Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Bad Request | Check request payload |
| 401 | Unauthorized | Refresh access token |
| 403 | Forbidden | Check scopes/permissions |
| 429 | Rate Limited | Implement backoff |
| 500 | Server Error | Retry with backoff |
| 503 | Service Unavailable | Retry with longer delay |

---

## 9. Security Considerations

1. **Credential Storage:** Use AWS Secrets Manager / HashiCorp Vault
2. **Token Rotation:** Implement automatic token refresh
3. **Request Signing:** Use x-api-key header for all requests
4. **Content Safety:** Firefly filters may reject legitimate content (5-15% false positive rate)
5. **Data Privacy:** All generated content should be encrypted at rest
6. **Audit Logging:** Log all API calls for compliance

---

## 10. Cost Analysis Summary

### 10.1 Estimated Monthly Costs (Medium Scale)

| Service | Usage | Cost/Unit | Monthly Cost |
|---------|-------|-----------|--------------|
| Firefly API | 5,000 images | $0.02 | $100 |
| Stock API | 500 licenses | $3.00 | $1,500 |
| Photoshop API | 2,000 operations | $0.15 | $300 |
| Enterprise Min | Fixed | — | $1,000 |
| **Total** | — | — | **~$2,900/month** |

### 10.2 Cost Optimization Strategies

1. **Batch Processing:** Use async APIs for bulk operations
2. **Caching:** Cache search results and generated assets
3. **Lazy Loading:** Only generate on-demand
4. **Credit Pooling:** Enterprise plans allow team-wide credit sharing
5. **Fallback to Web UI:** Use consumer Firefly for manual creative work
6. **Hybrid Approach:** Use purpose-built mockup APIs for template rendering ($0.002 vs $0.02)

---

## 11. Integration Architecture

### 11.1 High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    AgentSocial Platform                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Content      │  │ Asset        │  │ Creative     │     │
│  │ Editor       │  │ Library      │  │ Studio       │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │             │
│  ┌──────┴──────────────────┴──────────────────┴──────┐    │
│  │              Adobe Integration Service               │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │    │
│  │  │ Firefly │ │ Stock   │ │Photo-  │ │Express  │  │    │
│  │  │ Adapter │ │ Adapter │ │shop    │ │Embed   │  │    │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘  │    │
│  │       └─────────────┴───────────┴─────────────┘     │    │
│  │                    Token Manager                     │    │
│  └────────────────────────┬─────────────────────────────┘    │
│                           │                                  │
│              ┌────────────┴────────────┐                   │
│              ▼                         ▼                   │
│  ┌─────────────────────┐   ┌─────────────────────┐         │
│  │  Asset Storage      │   │  Job Queue          │         │
│  │  (S3/CloudFront)    │   │  (Redis/Bull)       │         │
│  └─────────────────────┘   └─────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
      ┌───────────┐  ┌───────────┐  ┌───────────┐
      │ Firefly   │  │ Adobe     │  │ Adobe     │
      │ API       │  │ Stock API │  │ Photoshop │
      │           │  │           │  │ API       │
      └───────────┘  └───────────┘  └───────────┘
```

### 11.2 Service Architecture
```javascript
// Adobe Integration Service (Node.js/Express)
class AdobeIntegrationService {
  constructor(config) {
    this.tokenManager = new TokenManager(config);
    this.fireflyAdapter = new FireflyAdapter(config, this.tokenManager);
    this.stockAdapter = new StockAdapter(config, this.tokenManager);
    this.photoshopAdapter = new PhotoshopAdapter(config, this.tokenManager);
    this.expressAdapter = new ExpressAdapter(config, this.tokenManager);
  }
  
  async generateImage(prompt, options) {
    return this.fireflyAdapter.generate(prompt, options);
  }
  
  async searchStock(query, filters) {
    return this.stockAdapter.search(query, filters);
  }
  
  async licenseStock(assetId) {
    return this.stockAdapter.license(assetId);
  }
  
  async removeBackground(imageUrl) {
    return this.photoshopAdapter.removeBackground(imageUrl);
  }
}
```

---

## 12. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
- [ ] Set up Adobe Developer Console project
- [ ] Implement OAuth Server-to-Server authentication
- [ ] Build Token Manager with auto-refresh
- [ ] Create base HTTP client with retry logic
- [ ] Set up enterprise Adobe agreement

### Phase 2: Firefly Integration (Weeks 5-8)
- [ ] Implement image generation API
- [ ] Add style presets and customization options
- [ ] Build async job queue for batch generation
- [ ] Create asset storage and CDN integration
- [ ] Implement content moderation handling

### Phase 3: Stock Integration (Weeks 9-12)
- [ ] Implement search API with filters
- [ ] Build preview/thumbnail display
- [ ] Add licensing workflow
- [ ] Create license history tracking
- [ ] Implement asset download and storage

### Phase 4: Photoshop API (Weeks 13-16)
- [ ] Implement background removal
- [ ] Add Smart Object replacement
- [ ] Build text layer editing
- [ ] Create batch processing workflows

### Phase 5: Express SDK (Weeks 17-20)
- [ ] Embed Quick Actions
- [ ] Add template-based editor
- [ ] Build social media preset sizes

### Phase 6: Polish (Weeks 21-24)
- [ ] Performance optimization
- [ ] Error handling and logging
- [ ] Analytics and monitoring
- [ ] Documentation and training

---

## 13. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| High enterprise costs | High | High | Start with minimum commitment; negotiate volume discounts |
| Rate limiting | Medium | Medium | Implement queuing and backoff; request higher limits |
| Content moderation false positives | High | Medium | Build retry logic; cache accepted prompts |
| API deprecation/changes | Low | High | Abstract APIs behind adapter layer; monitor changelogs |
| Adobe approval delays | Medium | High | Apply early; have fallback creative tools |
| No Illustrator/Premiere REST APIs | Certain | Medium | Use Photoshop API for SVG; use Firefly for video |

---

## 14. Alternative Considerations

### 14.1 For Image Generation
- **OpenAI DALL-E 3:** $0.04-0.08/image, REST API available
- **Midjourney:** No API, Discord-only
- **Stability AI:** $0.003-0.008/image, open-source models
- **Leonardo AI:** $0.003-0.01/image, good for game assets

### 14.2 For Stock Photos
- **Unsplash API:** Free for limited use
- **Pexels API:** Free for limited use
- **Shutterstock API:** Similar pricing to Adobe
- **Getty Images API:** Premium pricing

### 14.3 For Image Editing
- **Remove.bg API:** $0.09-0.25/image
- **Cloudinary:** $25/month for transformations
- **Replicate:** Open-source models, pay-per-use

### 14.4 Recommendation
Start with Adobe for enterprise customers who already use Creative Cloud. For cost-sensitive users, offer OpenAI/Stability AI as alternatives for generation, and Unsplash/Pexels for stock.

---

## 15. References

1. [Adobe Firefly API Documentation](https://developer.adobe.com/firefly-services/docs/firefly-api/)
2. [Adobe Stock API Documentation](https://developer.adobe.com/stock/docs/getting-started/)
3. [Adobe Photoshop API Documentation](https://developer.adobe.com/photoshop/api)
4. [Adobe Express Embed SDK](https://developer.adobe.com/express/embed-sdk/)
5. [Adobe Developer Console](https://developer.adobe.com/developer-console/)
6. [Adobe Authentication Guide](https://developer.adobe.com/developer-console/docs/guides/authentication/)
7. [Firefly API Pricing Analysis (SudoMock)](https://sudomock.com/blog/adobe-firefly-api-pricing-2026)
8. [Firefly Best Practices (Medium)](https://medium.com/adobetech/firefly-services-api-strategies-best-practices-every-developer-should-know-42d8b74a226d)

---

*Document Version: 1.0*  
*Last Updated: 2026-05-03*  
*Next Review: 2026-06-03*
