---
name: aiso-checker
description: AI Search Engine Optimization audit — checks whether a website is optimized to appear in AI-generated answers from ChatGPT, Perplexity, Claude, Gemini, and Google AI Overviews. Use when asked about AI search visibility/AISO, or alongside seo-auditor for a full audit.
---

# AISO Checker Skill

**AI Search Engine Optimization audit** — check if a website is optimized to appear in AI-generated answers from ChatGPT, Perplexity, Claude, Gemini, and Google AI Overviews.

## Why This Matters

- ChatGPT processes **1B+ queries/week**, Perplexity handles **30M+ daily**
- Google AI Overviews appear in **25-60% of searches**
- **58.5% of Google searches end with zero clicks** — AI engines cite statements, not pages
- Optimization for AI is fundamentally different from traditional SEO

## When to Use

When the user asks to:
- Check AI search visibility / AISO
- "Is my site optimized for ChatGPT/Perplexity?"
- "Can AI engines find and cite my content?"
- Run alongside `seo-auditor` for a complete audit

## Process

### Step 1: Collect Data

```bash
# Fetch the page
curl -sL "$URL" -o /tmp/aiso-page.html

# Check for llms.txt
curl -sL "https://$DOMAIN/llms.txt" -o /tmp/aiso-llms.txt
curl -sL "https://$DOMAIN/llms-full.txt" -o /tmp/aiso-llms-full.txt

# Check robots.txt for AI crawler rules
curl -sL "https://$DOMAIN/robots.txt" -o /tmp/aiso-robots.txt
```

Also use `web_fetch` for readable content and `web_search` for brand visibility checks.

### Step 2: Score Each Category

---

#### 1. STRUCTURED DATA & SCHEMA (20% weight — 20 points)

Check:
- JSON-LD structured data present
- FAQPage schema (critical for AI citation)
- HowTo schema (for tutorial content)
- Article schema with Author
- Organization schema
- BreadcrumbList schema

```bash
# Extract JSON-LD blocks
cat /tmp/aiso-page.html | grep -oP '(?<=application/ld\+json">).*?(?=</script>)' | python3 -m json.tool 2>/dev/null

# Check for specific schema types
cat /tmp/aiso-page.html | grep -oi '"@type"[[:space:]]*:[[:space:]]*"[^"]*"'

# Check for FAQPage specifically
cat /tmp/aiso-page.html | grep -oi 'FAQPage\|HowTo\|Article\|Organization\|BreadcrumbList\|LocalBusiness'
```

**Scoring:**
| Condition | Score |
|-----------|-------|
| No schema at all | 0/20 |
| Basic Organization only | 8/20 |
| FAQ + Article + Author | 14/20 |
| Comprehensive (FAQ + HowTo + Article + Author + Breadcrumb) | 20/20 |

---

#### 2. CONTENT STRUCTURE FOR AI CITATION (25% weight — 25 points)

Check:
- **Question-based headings**: "How do I...", "What is the best...", "Why does..."
- **Direct answer paragraphs**: 2-3 sentence answers immediately after each heading
- **Statistics with cited sources**: "According to [Source], X% of..."
- **Definition-style sentences**: "[Term] is [definition]..." — AI engines love these
- **Bulleted/numbered lists**: structured data within prose
- **FAQ sections**: explicit Q&A format

```bash
# Check for question headings
cat /tmp/aiso-page.html | sed 's/<[^>]*>//g' | grep -ci 'how do\|what is\|why does\|how to\|can you\|what are\|where is\|when should'

# Check for definition patterns
cat /tmp/aiso-page.html | sed 's/<[^>]*>//g' | grep -ci ' is ' | head -5

# Check for lists
cat /tmp/aiso-page.html | grep -ci '<ul\|<ol\|<li'

# Check for FAQ sections
cat /tmp/aiso-page.html | grep -ci 'faq\|frequently asked\|question'
```

**Scoring:**
| Condition | Score |
|-----------|-------|
| Wall of text, no structure | 0/25 |
| Basic headings only | 10/25 |
| Q&A format + statistics | 18/25 |
| Full AEO: questions + direct answers + stats + lists + FAQ | 25/25 |

---

#### 3. E-E-A-T SIGNALS (15% weight — 15 points)

**Experience, Expertise, Authoritativeness, Trustworthiness**

Check:
- **Author name and photo** on content
- **Author bio** with credentials/expertise
- **"Last updated" dates** visible on pages
- **External citations** to authoritative sources (studies, government data, research)
- **About page** with company credentials and team info

```bash
# Check for author info
cat /tmp/aiso-page.html | grep -ci 'author\|written by\|by '

# Check for dates
cat /tmp/aiso-page.html | grep -ci 'updated\|published\|last modified\|date'

# Check for external citations
cat /tmp/aiso-page.html | grep -oi '<a[^>]*href="https://[^"]*"[^>]*>' | grep -cv "$DOMAIN"

# Check for About page link
cat /tmp/aiso-page.html | grep -ci 'about\|about-us\|our-team\|our story'
```

Use `web_fetch` on the About page if found.

**Scoring:**
| Condition | Score |
|-----------|-------|
| Nothing — anonymous, no dates, no citations | 0/15 |
| Author name only | 5/15 |
| Author + bio + citations + dates | 10/15 |
| Full E-E-A-T: author + bio + photo + dates + citations + About page | 15/15 |

---

#### 4. llms.txt & AI CRAWLER SIGNALS (10% weight — 10 points)

Check:
- **`/llms.txt`** file at domain root (AI-readable site summary in Markdown)
- **`/llms-full.txt`** (detailed version)
- **robots.txt** is NOT blocking AI crawlers: `GPTBot`, `anthropic-ai`, `PerplexityBot`, `Google-Extended`, `Applebot-Extended`, `Bytespider`, `CCBot`
- **XML sitemap** exists with lastmod dates

```bash
# Check llms.txt
cat /tmp/aiso-llms.txt
echo "---"
cat /tmp/aiso-llms-full.txt

# Check robots.txt for AI crawler blocks
cat /tmp/aiso-robots.txt | grep -i 'gptbot\|anthropic\|perplexity\|google-extended\|applebot\|bytespider\|ccbot\|user-agent.*\*.*disallow'

# Check sitemap
cat /tmp/aiso-sitemap.xml | head -30 2>/dev/null || echo "No sitemap found"
```

**Scoring:**
| Condition | Score |
|-----------|-------|
| Blocks AI crawlers in robots.txt | 0/10 |
| Allows crawlers + has sitemap | 4/10 |
| + llms.txt present | 7/10 |
| Full implementation: allows crawlers + sitemap + llms.txt + llms-full.txt | 10/10 |

---

#### 5. CONTENT FRESHNESS & DEPTH (15% weight — 15 points)

Check:
- Content updated in last 6 months (visible dates)
- Publication and update dates visible to crawlers
- 1,500+ words on key pages
- Regular publishing cadence (check blog/listing pages)

```bash
# Check for dates in content
cat /tmp/aiso-page.html | sed 's/<[^>]*>//g' | grep -oi '\(january\|february\|march\|april\|may\|june\|july\|august\|september\|october\|november\|december\) [0-9]\{1,2\}, [0-9]\{4\}'

# Word count
cat /tmp/aiso-page.html | sed 's/<[^>]*>//g' | wc -w
```

**Scoring:**
| Condition | Score |
|-----------|-------|
| Stale/thin content, no dates | 0/15 |
| Some dates, moderate depth | 7/15 |
| Recent updates + deep content (1,500+ words) | 11/15 |
| Actively maintained with visible dates and 2,000+ words | 15/15 |

---

#### 6. CONVERSATIONAL QUERY OPTIMIZATION (15% weight — 15 points)

Check:
- **Natural language questions** in headings: "How do I...", "What is the best...", "Why does..."
- **Long-tail conversational phrases**: full sentences people type into ChatGPT
- **Direct concise answers** in first 2-3 sentences after headings
- **Comparison content**: "X vs Y", "alternative to X"
- **"People Also Ask" coverage**: address common follow-up questions

```bash
# Question headings
cat /tmp/aiso-page.html | sed 's/<[^>]*>//g' | grep -ci '?'

# Comparison content
cat /tmp/aiso-page.html | sed 's/<[^>]*>//g' | grep -ci ' vs \|versus\|alternative\|compare\|difference between'

# Direct answers (short paragraphs after headings)
# Manual review needed
```

Also use `web_search` for "people also ask" queries related to the site's topic.

**Scoring:**
| Condition | Score |
|-----------|-------|
| Keyword-stuffed, no natural language | 0/15 |
| Some question headings | 7/15 |
| Good Q&A coverage with direct answers | 11/15 |
| Comprehensive: questions + direct answers + comparisons + PAA | 15/15 |

---

### Step 3: AI Visibility Check

Use `web_search` to check if the brand/site appears in AI-generated results:

```
web_search: "{BRAND_NAME} {KEYWORD}"
web_search: "site:{DOMAIN}"
web_search: "{BRAND_NAME} review" OR "{BRAND_NAME} vs"
```

Check if:
- Brand appears in Perplexity answers
- Brand is cited in ChatGPT-style answers found via search
- Brand appears in Google AI Overviews (if possible to verify)

### Step 4: Generate Report

Calculate weighted total out of 100.

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
# AISO Audit Report: {DOMAIN}
**Date:** {DATE}
**Overall Grade:** {LETTER} ({SCORE}/100)
**AI Visibility:** {VISIBLE/PARTIAL/NOT VISIBLE}

## Score Breakdown

| Area | Weight | Score | Max |
|------|--------|-------|-----|
| Structured Data & Schema | 20% | {X}/20 | 20 |
| Content Structure for AI Citation | 25% | {X}/25 | 25 |
| E-E-A-T Signals | 15% | {X}/15 | 15 |
| llms.txt & AI Crawler Signals | 10% | {X}/10 | 10 |
| Content Freshness & Depth | 15% | {X}/15 | 15 |
| Conversational Query Optimization | 15% | {X}/15 | 15 |
| **TOTAL** | **100%** | **{X}/100** | **100** |

## AI Visibility Check

- **ChatGPT**: {Appears / Does not appear} for "{primary keyword}"
- **Perplexity**: {Appears / Does not appear} for "{primary keyword}"
- **Google AI Overviews**: {Appears / Does not appear} for "{primary keyword}"

## Top 5 Priority Fixes

### 1. {FIX_TITLE}
**Impact:** {Critical/High/Medium} | **Category:** {CATEGORY} | **Current Issue:** {DESCRIPTION}

**Fix Prompt (copy-paste into Bolt/Cursor/Claude Code):**
> {SPECIFIC_PROMPT_WITH_EXACT_CHANGES}

Example fix prompt:
> "Add the following JSON-LD schema to the <head> of {URL}. This FAQPage schema covers the top 5 questions your audience asks: {SPECIFIC_QUESTIONS}. Place it inside a <script type='application/ld+json'> tag."

[... repeat for fixes 2-5 ...]

## Why AISO Matters

- ChatGPT processes 1B+ queries/week — your content needs to be cited by AI engines
- Perplexity handles 30M+ daily queries with source citations
- Google AI Overviews appear in 25-60% of searches
- 58.5% of Google searches end with zero clicks — AI engines cite statements, not pages
- Traditional SEO gets you on page 1. AISO gets you in the answer.

## Summary

{ONE_PARAGRAPH_SUMMARY_OF_AI_SEARCH_READINESS_AND_TOP_PRIORITY}
```

### Step 5: Host Report

After generating the report, host it on here.now:

```bash
npx here-now /tmp/aiso-report-{domain}-{date}.md
```

Include the shareable URL in the response.

## Important Notes

- Fix prompts must be specific — exact JSON-LD, exact headings, exact llms.txt content
- Never say "add structured data" — say "add this exact JSON-LD block: {JSON}"
- llms.txt is the single highest-impact AISO fix for most sites — prioritize it
- FAQPage schema is the second highest-impact — AI engines love citing Q&A
- Always check robots.txt for AI crawler blocks — a single Disallow rule can kill AI visibility
- For local businesses, combine with `seo-auditor` skill (Local SEO section)
- The AI Visibility check is observational — we can search for the brand but can't query ChatGPT/Perplexity directly