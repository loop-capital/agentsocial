# AgentSocial Scraping and Content Tools Reference

**Last updated:** 2026-09-12

## Tool Inventory

### 1. Agent Reach
**What:** Social media search and content extraction (YouTube, X/Twitter, Reddit, GitHub, Bilibili, XiaoHongShu, etc.)
**When to use:**
- Searching social platforms for content/reviews
- Extracting video subtitles from YouTube/Bilibili
- Reading GitHub repos without complex auth
- RSS feed monitoring
- V2EX, Xueqiu Chinese platforms
**How:** `agent-reach <command>` via pipx (v1.5.0)
**Auth:** Some platforms need cookies (Twitter/X, Reddit, Facebook, Instagram, LinkedIn, Xiaohongshu)
**Cost:** Free (open source)

### 2. Scrapling
**What:** Adaptive web scraping framework with anti-bot bypass (Cloudflare Turnstile), JS rendering, spider framework
**When to use:**
- Large-scale crawling with anti-bot protection
- Sites that block standard scrapers
- Need spider framework with concurrent sessions, proxy rotation, pause/resume
- Bulk data extraction with CSS selectors
**How:** `~/.local/share/pipx/venvs/scrapling/bin/python` or `scrapling` CLI
**Cost:** Free

### 3. ScrapeGraph
**What:** AI-powered web scraping with structured extraction via natural language prompts
**When to use:**
- Need AI to understand and extract structured data from messy HTML
- One-off extractions where writing CSS selectors is tedious
- Complex pages requiring semantic understanding
**How:** Via MCP server (`scrapegraph__scrape`, `scrapegraph__extract`, etc.)
**Cost:** Credits-based (free tier available)

### 4. OpenCLI
**What:** Browser automation via Chrome DevTools Protocol (166 adapters)
**When to use:**
- Need to interact with sites as a real user (clicks, forms, scrolls)
- Sites requiring login/session state (Facebook, Instagram, TikTok)
- Complex navigation flows
**How:** Requires Chrome browser sessions
**Status:** Needs Chrome sessions configured (blocked by CDP URL issue, Claude fixing)

### 5. Composio
**What:** External app integration platform (Gmail, GitHub, Slack, etc.)
**When to use:**
- Cross-app workflows (email to calendar to tickets)
- API integrations without building custom connectors
**How:** `composio` CLI (v0.4.1 Node.js)
**Important:** Does NOT support Adobe Firefly (not in catalog)

## Decision Matrix

| Need | Tool | Why |
|------|------|-----|
| Search YouTube/Twitter/GitHub | Agent Reach | Purpose-built, free, no API keys |
| Bulk crawl with anti-bot | Scrapling | Built-in Cloudflare bypass, spider framework |
| AI extraction from HTML | ScrapeGraph | Natural language prompts, structured output |
| Browser automation (login, clicks) | OpenCLI | Real Chrome sessions, 166 adapters |
| Cross-app workflows | Composio | 100+ integrations, handles auth |
| Adobe Firefly image gen | adobe-firefly-mcp | Browser automation for Firefly (separate from Composio) |

## Quick Commands

```bash
# Agent Reach
agent-reach --version                    # Check version
agent-reach search youtube "AI tools"    # Search YouTube
agent-reach search twitter "product"     # Search Twitter/X (needs auth)
agent-reach search github "repo name"    # Search GitHub

# Scrapling
scrapling --version                      # Check version
scrapling fetch https://example.com      # Fetch a page
scrapling spider https://example.com     # Crawl a site

# ScrapeGraph (via MCP)
scrapegraph__scrape --website_url "..."  # Scrape a page
scrapegraph__extract --website_url "..." --user_prompt "..."  # AI extraction

# OpenCLI (needs Chrome sessions)
opencli --version                        # Check version
```

## Installation Status
- Agent Reach v1.5.0 (pipx) - INSTALLED
- Scrapling v0.4.15 (pipx, with extras) - INSTALLED
- ScrapeGraph (MCP server, credits-based) - INSTALLED
- OpenCLI v1.8.7 (needs Chrome sessions) - BLOCKED (CDP URL issue)
- Composio v0.4.1 (Node.js, authenticated) - INSTALLED
- Adobe Firefly MCP (browser automation) - BLOCKED (CDP URL issue)
