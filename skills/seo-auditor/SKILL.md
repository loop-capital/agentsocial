---
name: seo-auditor
description: Comprehensive traditional SEO audit of a website with scoring, findings, and actionable fix prompts. Use when asked to audit, check, or review a website's SEO (pair with aiso-checker for AI search coverage).
---

# SEO Auditor Skill

Comprehensive website SEO audit with scoring, findings, and actionable fix prompts.

## When to Use

When the user asks to audit, check, or review a website's SEO — traditional search engine optimization. Also used as the first half of a full audit (pair with `aiso-checker` for AI search coverage).

## Activation

User says anything like:
- "audit this site's SEO"
- "run an SEO audit on [domain]"
- "check SEO for [url]"
- "how's my SEO?"

## Process

### Step 1: Collect Data

For each URL provided, gather:

```bash
# Fetch the page HTML
curl -sL "$URL" -o /tmp/seo-page.html

# Fetch HTTP headers
curl -sI "$URL" > /tmp/seo-headers.txt

# Fetch robots.txt
curl -sL "https://$DOMAIN/robots.txt" -o /tmp/seo-robots.txt

# Fetch sitemap
curl -sL "https://$DOMAIN/sitemap.xml" -o /tmp/seo-sitemap.xml

# Fetch llms.txt (for AISO crossover)
curl -sL "https://$DOMAIN/llms.txt" -o /tmp/seo-llms.txt
curl -sL "https://$DOMAIN/llms-full.txt" -o /tmp/seo-llms-full.txt
```

Also use `web_fetch` on the URL to get readable content and `web_search` for competitor analysis.

### Step 2: Score Each Area

Audit and score across 8 areas. For each area, check the criteria below and assign a score out of the max points.

---

#### 1. META TAGS & ON-PAGE (15 points)

Check:
- **Title tag**: exists, 50-60 chars, target keyword near front
- **Meta description**: exists, 150-160 chars, compelling with keyword
- **H1**: exactly one per page, matches topic
- **H2-H6 hierarchy**: logical structure, no skipped levels
- **Canonical URL**: present and correct
- **Open Graph tags**: og:title, og:description, og:image, og:url
- **Twitter Card tags**: present

How to check:
```bash
# Title
cat /tmp/seo-page.html | grep -oi '<title>[^<]*</title>'
# Meta description
cat /tmp/seo-page.html | grep -oi 'meta name="description"[^>]*content="[^"]*"'
# H1
cat /tmp/seo-page.html | grep -oi '<h[1-6][^>]*>[^<]*</h[1-6]>'
# Canonical
cat /tmp/seo-page.html | grep -oi 'link rel="canonical"[^>]*href="[^"]*"'
# OG tags
cat /tmp/seo-page.html | grep -oi 'meta property="og:[^"]*"[^>]*content="[^"]*"'
# Twitter cards
cat /tmp/seo-page.html | grep -oi 'meta name="twitter:[^"]*"[^>]*content="[^"]*"'
```

Scoring:
- All present and optimized → 15/15
- Missing 1-2 elements → 10-14/15
- Missing 3+ → 5-9/15
- No meta tags → 0-4/15

---

#### 2. CONTENT QUALITY (15 points)

Check:
- **Word count**: 1,500+ for key pages
- **Keyword density**: natural, not stuffed (1-2%)
- **Internal links**: to related pages
- **External links**: to authoritative sources
- **Image alt text**: on all images
- **Readability**: short paragraphs, bullet lists, clear language

How to check:
```bash
# Word count (rough)
cat /tmp/seo-page.html | sed 's/<[^>]*>//g' | wc -w
# Image alts
cat /tmp/seo-page.html | grep -oi '<img[^>]*>' | grep -c 'alt='
cat /tmp/seo-page.html | grep -oi '<img[^>]*>' | grep -cv 'alt='
# Links
cat /tmp/seo-page.html | grep -oi '<a[^>]*href="[^"]*"[^>]*>' | head -20
```

Scoring:
- 1,500+ words, natural keywords, alt text, good links → 15/15
- Thin content or keyword stuffing → 5-9/15
- No content → 0-4/15

---

#### 3. TECHNICAL SEO (15 points)

Check:
- **Page speed / Core Web Vitals**: LCP, CLS, INP (note: use web_search for PageSpeed Insights if available)
- **Mobile-friendly**: responsive design
- **HTTPS**: valid SSL cert
- **Clean URLs**: no dynamic params, lowercase, hyphens
- **No redirect chains**: max 1 redirect
- **Security headers**: HSTS, X-Frame-Options, X-Content-Type-Options

How to check:
```bash
# HTTP headers
cat /tmp/seo-headers.txt | grep -i 'strict-transport-security\|x-frame-options\|x-content-type-options\|location\|content-encoding'
# HTTPS check
echo "$URL" | grep -q 'https://' && echo "HTTPS: YES" || echo "HTTPS: NO"
# Redirect chains
curl -sI -L "$URL" 2>&1 | grep -i 'HTTP/\|location'
```

Scoring:
- HTTPS, fast, mobile-friendly, clean URLs, security headers → 15/15
- Missing security headers or slow → 8-14/15
- HTTP, broken, redirect chains → 0-7/15

---

#### 4. CRAWLABILITY & INDEXING (15 points)

Check:
- **robots.txt**: exists and doesn't block important pages
- **XML sitemap**: exists with lastmod dates
- **Sitemap referenced in robots.txt**
- **No accidental noindex tags** on important pages
- **Canonical tags consistent**: www vs non-www, http vs https

How to check:
```bash
# robots.txt content
cat /tmp/seo-robots.txt
# Sitemap
cat /tmp/seo-sitemap.xml | head -50
# noindex tags
cat /tmp/seo-page.html | grep -oi 'meta name="robots"[^>]*content="[^"]*noindex[^"]*"'
# Sitemap in robots
cat /tmp/seo-robots.txt | grep -i 'sitemap'
```

Scoring:
- robots.txt + sitemap + no noindex + consistent canonicals → 15/15
- Missing sitemap or robots issues → 8-14/15
- Blocks crawlers or noindex on key pages → 0-7/15

---

#### 5. STRUCTURED DATA / SCHEMA (15 points)

Check:
- **JSON-LD structured data** present
- **Appropriate schema types**: Organization, Article, FAQPage, LocalBusiness, BreadcrumbList, Product
- **Valid schema** (recommend testing at validator.schema.org)

How to check:
```bash
# Extract JSON-LD
cat /tmp/seo-page.html | grep -o 'application/ld+json[^>]*>[^<]*' | python3 -m json.tool 2>/dev/null || echo "No valid JSON-LD found"
# Schema.org types
cat /tmp/seo-page.html | grep -oi '"@type"[[:space:]]*:[[:space:]]*"[^"]*"'
# Microdata
cat /tmp/seo-page.html | grep -oi 'itemscope[^>]*itemtype="[^"]*"'
```

Scoring:
- Comprehensive schema (Organization + page-specific + FAQ) → 15/15
- Basic schema only → 8-14/15
- No structured data → 0-7/15

---

#### 6. LOCAL SEO (10 points, if applicable)

Check:
- **Google Business Profile** categories optimized (use web_search)
- **NAP consistency**: Name, Address, Phone consistent across site
- **Review count and rating** vs competitors
- **LocalBusiness schema** on site

How to check:
- Use `web_search` for "{business name} {city}" to check GBP presence
- Check the page for NAP info (address, phone)
- Check for LocalBusiness schema in structured data

Scoring:
- GBP optimized + NAP consistent + LocalBusiness schema → 10/10
- GBP exists but not optimized → 5-9/10
- No local presence → 0-4/10 (skip if not a local business, award 10/10)

---

#### 7. COMPETITOR COMPARISON (10 points)

Check:
- Search the main keyword, identify top 3 competitors
- Compare: content depth, schema usage, backlink signals
- Identify content gaps the site is missing

How to check:
- Use `web_search` for the site's primary keywords
- Use `web_fetch` on top 3 competitor pages
- Compare word count, schema presence, heading structure

Scoring:
- Competitive or ahead → 8-10/10
- Gaps identified but actionable → 4-7/10
- Significantly behind → 0-3/10

---

#### 8. BACKLINK & AUTHORITY SIGNALS (5 points)

Check:
- Brand mentions in search results (use web_search for "@brandname" or site name)
- External links pointing to the domain
- Domain age and authority indicators

How to check:
- Use `web_search` for `"$BRANDNAME" -site:$DOMAIN` to find mentions
- Use `web_search` for `link:$DOMAIN` or `"$DOMAIN" references`

Scoring:
- Strong brand presence and mentions → 5/5
- Some mentions → 2-4/5
- No presence → 0-1/5

---

### Step 3: Generate Report

Calculate total score out of 100.

**Grading Scale:**
| Score | Grade |
|-------|-------|
| 90-100 | A+ |
| 80-89 | A |
| 70-79 | B |
| 60-69 | C |
| 40-59 | D |
| 0-39 | F |

#### Report Format

```markdown
# SEO Audit Report: {DOMAIN}
**Date:** {DATE}
**Overall Grade:** {LETTER} ({SCORE}/100)

## Score Breakdown

| Area | Score | Max |
|------|-------|-----|
| Meta Tags & On-Page | {X}/15 | 15 |
| Content Quality | {X}/15 | 15 |
| Technical SEO | {X}/15 | 15 |
| Crawlability & Indexing | {X}/15 | 15 |
| Structured Data / Schema | {X}/15 | 15 |
| Local SEO | {X}/10 | 10 |
| Competitor Comparison | {X}/10 | 10 |
| Backlink & Authority | {X}/5 | 5 |
| **TOTAL** | **{X}/100** | **100** |

## Top 5 Priority Fixes

### 1. {FIX_TITLE}
**Impact:** {High/Medium/Low} | **Area:** {AREA} | **Current Issue:** {DESCRIPTION}

**Fix Prompt (copy-paste into Bolt/Cursor/Claude Code):**
> {SPECIFIC_PROMPT_WITH_EXACT_HTML_OR_CONFIG_CHANGES}

[... repeat for fixes 2-5 ...]

## Summary

{ONE_PARAGRAPH_SUMMARY_OF_OVERALL_SEO_HEALTH_AND_TOP_PRIORITY}
```

### Step 4: Host Report

After generating the report, host it on here.now using the here-now skill:

```bash
npx here-now /tmp/seo-report-{domain}-{date}.md
```

Include the shareable URL in the response.

## Important Notes

- Be specific in fix prompts — include exact HTML, JSON-LD, or config changes
- Never give generic advice like "improve your content" — always say exactly what to add/change
- If a check fails (e.g., site is down), note it and score that area as 0
- Always check both HTTP and HTTPS, both www and non-www
- For local businesses, the Local SEO section is critical
- Pair with `aiso-checker` for a complete audit (traditional SEO + AI search optimization)