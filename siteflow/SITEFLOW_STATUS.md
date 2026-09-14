# SiteFlow System Status

## autocli Status

**Working** — all 55+ public commands available via CDP bridge:
- `hackernews top`, `devto top`, `wikipedia search`
- `google search`, `reddit hot`, `youtube search`
- 55+ sites total (news, social, content platforms)

**NOT working**:
- Twitter (requires logged-in session)
- Instagram, Facebook (require login)
- Any site needing auth/cookies

**Setup**: CDP bridge replaces Chrome extension because MV3 service worker won't start in headless Chrome on WSL. Bridge connects to Chrome via CDP port 9222 and daemon port 19825.

## Template Database
- 8 sites scraped: amie.so, figma.com, framer.com, notion.so, ped.ro, raycast.com, stripe.com
- Stored in `siteflow/templates/`
- Index: `siteflow/templates/index.json` (70KB)

## Design Token Extractor
- CSS analysis + AI vision for token extraction
- Extracts colors, typography, spacing, layout patterns

## Code Generator
- Claude Code API for React component generation
- Uses scraped tokens + 21st.dev components

## Brand Adaptation Engine
- Brand config: colors, fonts, content, logos
- Token substitution system

## Preview Renderer
- Live preview server running on port 3456
- Clones: pedro, amie, notion
- All compile and serve successfully

## Next Steps
- [ ] Complete remaining site clones (figma, framer, raycast, stripe)
- [ ] Wire frontend to real API
- [ ] Build user dashboard
- [ ] Add subscription/payment flow

## Scraper Status
- 8/10 sites scraped successfully
- Linear.app and vercel.com failed (brotli/403)
- perplexity.ai not yet attempted

## API Endpoints
- Template list: `GET /api/templates`
- Template detail: `GET /api/templates/:id`
- Clone generation: `POST /api/generate/clone`
- Brand config: `PUT /api/brand/:id`

## Environment
- Anthropic credits: RELOADED ✅
- Puppeteer Chrome: `/home/jason/.cache/puppeteer/chrome/linux-147.0.7727.57/chrome-linux64/chrome`
- System Chrome: `/home/jason/.local/bin/google-chrome`
- autocli: WORKING with CDP bridge
