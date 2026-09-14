# AgentSocial Schema Engine — Build Plan

## AIOSEO Feature Analysis (What We Need vs Don't)

### ✅ BUILD (Core for salon DFY clients)
| Feature | AIOSEO Tier | Why We Need It |
|---------|-----------|---------------|
| **LocalBusiness Schema** | Plus ($99.50) | CRITICAL — Google Knowledge Panel, Maps ranking, AI citation |
| **FAQ Schema** | Plus ($99.50) | Rich snippets + AI citation fuel |
| **Service Schema** | Plus ($99.50) | AI engines enumerate services offered |
| **Review/AggregateRating Schema** | Plus ($99.50) | Trust signals, star snippets |
| **Organization Schema** | Free | Already have via AIOSEO free |
| **XML Sitemaps** | Free | Already have via AIOSEO free |
| **llms.txt generation** | Free | Already have via AIOSEO free |
| **Breadcrumb Schema** | Free | Already have via AIOSEO free |
| **Social Media (OG/Twitter)** | Free | Already have via AIOSEO free |
| **Google Search Console** | Basic ($49.50) | Verify ownership, submit sitemaps |
| **Redirection Manager** | Plus ($99.50) | Fix 404s, preserve rankings |
| **Author SEO / E-E-A-T** | Plus ($99.50) | Staff profiles, expertise signals |
| **Post Index Status** | Plus ($99.50) | Track what's indexed in GSC |
| **SEO Revisions** | Plus ($99.50) | Track meta changes over time |

### ⏳ BUILD LATER (Nice to have, not critical for salons)
| Feature | AIOSEO Tier | Notes |
|---------|-----------|-------|
| WooCommerce SEO | Plus | Only if client has shop |
| Link Assistant | Plus | Internal link suggestions |
| Keyword Rank Tracker | Plus | Useful but needs API ($$) |
| AI Content Generator | Plus | We already have AI agents |
| AI Assistant | Plus | We already have AI agents |
| Headline Analyzer | Basic | Nice but not critical |
| TruSEO Analysis | Basic | We audit ourselves |
| Writing Assistant | Plus | We generate content ourselves |
| RSS Content | Free | Low priority |

### ❌ SKIP (We don't need or already have)
| Feature | Why Skip |
|---------|---------|
| Page Builder Integration | Not relevant |
| TikTok integration | Low ROI for salons |
| Microsoft Clarity | Separate free tool |
| Multi-site management | We manage remotely via API |

## What We're Building: AgentSocial Schema Engine

### Phase 1: Schema Engine Plugin (This Session)
A WordPress plugin that outputs all critical schema types:

**Schema Types:**
1. `LocalBusiness` (HealthAndBeautyBusiness / SalonOrSpa) — address, hours, geo, phone, priceRange
2. `FAQPage` — configurable Q&A pairs with structured data
3. `Service` — per-service schema with offerCatalog
4. `Review` + `AggregateRating` — embed reviews with schema
5. `Person` — staff/team profiles for E-E-A-T
6. `BreadcrumbList` — (keep AIOSEO free's version)
7. `Organization` — (keep AIOSEO free's version)

**Admin UI:**
- Business Info tab: name, address, phone, hours, geo coords, price range, sameAs links
- Services tab: add/edit/delete services with name, description, category
- FAQ tab: add/edit/delete Q&A pairs
- Reviews tab: add/edit/manage reviews with author, rating, text
- Team tab: add/edit staff with name, title, bio, photo, specialties
- Schema Preview tab: see generated JSON-LD output

**Remote API:**
- REST API endpoint for remote management via AgentSocial
- Application password authentication
- CRUD for all schema data types

### Phase 2: Remote Management (Next)
- AgentSocial API connects to client WP sites
- Push schema updates from our dashboard
- Bulk manage all DFY clients from one interface

### Phase 3: Additional Features
- Redirection manager (404 tracking + redirect rules)
- Google Search Console integration (verify + submit)
- Post index status (pull from GSC API)
- SEO revision history

## Why This Beats AIOSEO Pro
| | AIOSEO Pro | AgentSocial Schema Engine |
|---|-----------|---------------------------|
| Cost | $99.50/yr/site | Free (we own it) |
| LocalBusiness | Generic | Salon-optimized defaults |
| Remote management | ❌ | ✅ via REST API |
| White-label | ❌ | ✅ AgentSocial branded |
| Custom schema types | Limited | Extensible |
| AI integration | Basic ChatGPT | Full AgentSocial AI stack |
| DFY workflow | ❌ | ✅ Built for service model |