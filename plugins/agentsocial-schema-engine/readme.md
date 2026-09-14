# AgentSocial Schema Engine

Comprehensive schema markup engine for local businesses with AI agent discovery support.

## Features

### Schema Types Generated
- **LocalBusiness** (HealthAndBeautyBusiness / SalonOrSpa) — address, hours, geo, phone, price range
- **FAQPage** — configurable Q&A pairs for rich snippets and AI citation
- **Service** — per-service schema with categories and offer catalogs
- **Review** + **AggregateRating** — star ratings in search results
- **Person** — team/staff profiles for E-E-A-T authority signals

### AI Agent Discovery (v1.2.0)
- **robots.txt** — AI crawler rules (GPTBot, Claude-Web, OAI-SearchBot, etc.) + Content Signals
- **Link headers** — RFC 8288 response headers for API discovery
- **Markdown negotiation** — Returns `text/markdown` when AI agents send `Accept: text/markdown`
- **`/.well-known/api-catalog`** — RFC 9727 linkset+json API catalog
- **`/.well-known/mcp/server-card.json`** — MCP Server Card (SEP-1649)
- **`/.well-known/agent-skills/index.json`** — Agent Skills Discovery index (RFC v0.2.0)
- **`/.well-known/markdown`** — Direct markdown endpoint

### Admin UI
- Business Info — name, address, phone, hours, geo coordinates, social links
- Services — add/edit/delete with categories
- FAQ — add/edit/delete Q&A pairs
- Reviews — add/edit/manage with author, rating, date
- Team — add/edit staff with title, specialty, bio, photo
- Schema Preview — see generated JSON-LD output

### Remote API (REST)
All data is manageable remotely via `/wp-json/asse/v1/` endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/business` | GET/POST | Business settings |
| `/faqs` | GET/POST/PUT/DELETE | FAQ items |
| `/services` | GET/POST/PUT/DELETE | Services |
| `/reviews` | GET/POST/DELETE | Reviews |
| `/team` | GET/POST/PUT/DELETE | Team members |
| `/schema-preview` | GET | Generated schema (public) |
| `/health` | GET | Plugin health check (public) |
| `/theme-options` | GET/POST | Theme option management |
| `/read-file` | GET | Read theme/plugin files |

**Authentication**: WordPress application passwords (Users → Profile → Application Passwords)

### Well-Known Endpoints (Public, AI-Discoverable)

| Endpoint | Format | Description |
|----------|--------|-------------|
| `/.well-known/api-catalog` | linkset+json | RFC 9727 API catalog |
| `/.well-known/mcp/server-card.json` | JSON | MCP Server Card (SEP-1649) |
| `/.well-known/agent-skills/index.json` | JSON | Agent Skills Discovery (RFC v0.2.0) |
| `/.well-known/markdown` | text/markdown | Business info in markdown for AI agents |

## Installation

1. Upload `agentsocial-schema-engine` folder to `/wp-content/plugins/`
2. Activate through WordPress admin → Plugins
3. **Important**: After activation, visit Settings → Permalinks and click "Save Changes" to flush rewrite rules (required for `/.well-known/` endpoints)
4. Go to Schema Engine → Business Info and enter your details
5. Add FAQ items, services, reviews, and team members
6. Use Schema Preview to verify output

## Changelog

### 1.2.0
- Added AI agent discovery: robots.txt rules, Content Signals, Link headers (RFC 8288)
- Added markdown content negotiation for AI agents
- Added `/.well-known/api-catalog` (RFC 9727)
- Added `/.well-known/mcp/server-card.json` (SEP-1649)
- Added `/.well-known/agent-skills/index.json` (RFC v0.2.0)
- Added `/.well-known/markdown` endpoint

### 1.1.0
- Added additional_type, alternate_names, google_rating, google_review_count fields
- Added theme options read/write API endpoints
- Added read-file endpoint for theme/plugin file access
- Added REST API schema preview endpoint

### 1.0.0
- Initial release
- LocalBusiness, FAQ, Service, Review, Team schema
- Remote API management
- Admin UI

## Why This Over AIOSEO Pro

| | AIOSEO Pro ($99.50/yr) | AgentSocial Schema Engine |
|---|---|---|
| Cost | $99.50/yr per site | Free |
| Remote API | ❌ | ✅ Full CRUD |
| AI Discovery | ❌ | ✅ Full agent discovery stack |
| White-label | ❌ | ✅ AgentSocial branded |
| Salon defaults | ❌ Generic | ✅ SalonOrSpa default |
| AI integration | Basic ChatGPT | ✅ Full AgentSocial AI |
| DFY workflow | ❌ | ✅ Built for service model |

## License

Proprietary — AgentSocial. For use on AgentSocial DFY client sites only.