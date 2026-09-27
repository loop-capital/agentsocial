# AGENTSOCIAL — WEBSITE BUILDER FEATURE BRIEF
**From:** Che (CEO, PC1)
**To:** AgentSocial-CEO + Team
**Date:** April 16, 2026
**Priority:** HIGH — Strategic differentiator

---

## Objective
Integrate AI-powered website building into the AgentSocial platform using the Claude Code website builder ecosystem. This becomes a core feature that separates AgentSocial from Buffer, Hootsuite, and every other social media management tool.

## Why This Matters
No social media platform currently offers built-in website generation. Users managing brands on AgentSocial could generate landing pages, link-in-bio sites, campaign microsites, and brand pages directly from the platform. This is a **$0 → $49/mo upsell** path and a massive competitive moat.

## The Claude Website Builder Stack

### Core Tools (install and integrate these)

**1. UI/UX Pro Max (Claude Code Skill)**
- 50+ design styles, 161 color palettes, 57 font pairings
- Makes output look designed, not AI-generated
- Source: `https://github.com/tenfoldmarc/website-builder-setup` (bundles all 3)
- Install: `git clone` into Claude commands directory

**2. Motion / Framer Motion (motion.dev)**
- Page transitions, hover effects, scroll reveals, parallax
- Motion+ AI Kit adds Claude skills: `/motion`, `/motion-audit`, `/css-spring`
- MCP server for real-time documentation search
- Source: `https://motion.dev/docs/ai-kit`
- License: Motion+ required for AI Kit ($)

**3. 21st.dev Magic MCP**
- 100+ production-ready React components (buttons, navbars, heroes, cards, footers)
- MCP server that generates components from natural language
- Source: `https://github.com/21st-dev/magic-mcp`
- Requires API key from `https://21st.dev/magic`

**4. v0 by Vercel**
- Browser-based AI frontend generator
- Native Next.js integration
- Can be used as a reference or parallel generation path
- Source: `https://v0.dev`

### Bundled Setup
@tenfoldmarc created a one-command install: `https://github.com/tenfoldmarc/website-builder-setup`
This bundles UI/UX Pro Max + Framer Motion + 21st.dev into one Claude Code skill.

## Architecture Options for AgentSocial Integration

### Option A: "Website as a Service" (Recommended)
- User clicks "Generate Website" in AgentSocial dashboard
- AgentSocial backend spawns a Claude Code session with the website-builder skill
- Claude generates a Next.js + Tailwind + Framer Motion site
- Output: Deployed to Vercel/Netlify via one-click, or downloadable ZIP
- Billing: Per-brand, counts toward plan limits

### Option B: "Template Engine"
- Pre-built templates (landing page, link-in-bio, campaign page, portfolio)
- User fills in brand details (colors, fonts, copy, images)
- AI fills in the rest using the design system
- Faster, less flexible, lower cost to run

### Option C: "Claude Code Plugin"
- AgentSocial offers a Claude Code skill that users can install
- Users with their own Claude Code subscription generate sites
- AgentSocial handles deployment, hosting, and analytics
- Lowest cost, highest barrier to entry for users

**Recommendation:** Start with Option A for MVP, add Option B for scale.

## Technical Implementation Research Needed

### AgentSocial-CEO: Assign to your team:

**agentsocial-dev:**
1. Research how to programmatically spawn Claude Code sessions (API vs CLI)
2. Evaluate hosting options: Vercel (free tier) vs Netlify vs self-hosted
3. Prototype: Can we run the website-builder-setup as a background process?
4. Database schema: Store generated sites, templates, brand configs
5. API endpoints: `POST /websites/generate`, `GET /websites/:id`, `PUT /websites/:id`
6. Pricing integration: Which plans get website generation? How many per month?

**agentsocial-marketing:**
1. Competitor analysis: Does any social media tool offer this? (Spoiler: No)
2. Pricing research: What do standalone website builders charge? ($12-30/mo)
3. Feature naming: "AgentSite"? "Social Sites"? "Brand Pages"?
4. Landing page copy for the feature launch
5. Target user personas: Who wants this most? (Small business owners, creators, agencies)

### Research Resources
- GitHub: `https://github.com/tenfoldmarc/website-builder-setup`
- Motion AI Kit: `https://motion.dev/docs/ai-kit`
- 21st.dev MCP: `https://github.com/21st-dev/magic-mcp`
- v0 by Vercel: `https://v0.dev`
- Medium article: "How I Built a High-End Animated Website in 10 Minutes Using Claude Code"
- Reddit r/vibecoding: "Rebuilt my Framer site in a day with Claude Code"

## Deliverables (Due: April 23, 2026)
1. **Technical feasibility report** — Can we build this? How? What's the cost?
2. **Prototype** — One generated website from AgentSocial platform (even if manual)
3. **Pricing model** — How much to charge, how much it costs us
4. **Timeline** — When can this ship? (Target: before MVP launch July 7)

## Questions to Answer
1. Do we need Claude Code licenses for each user, or can we run it server-side?
2. What's the token cost per website generation?
3. Can we cache/scaffold templates to reduce generation cost?
4. How do we handle custom domains for generated sites?
5. Can generated sites pull content from the user's social posts automatically?

---

**This is a game-changer.** No one else is doing this. Move fast.

— Che (CEO)
