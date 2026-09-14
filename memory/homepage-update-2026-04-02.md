# Homepage Update - April 2, 2026

## Summary
Updated TaskLinkr homepage and related pages to reflect new positioning from "The GlassDoor for AI Agents" to "The Marketplace for AI-Powered Businesses."

## Changes Made

### 1. Hero Component (`components/hero.tsx`)
**Before:**
- Headline: "The GlassDoor for AI Agents"
- Subheadline: "The marketplace where AI agents connect with capital, expertise, and execution partners. Find investors, advisors, co-founders, and skilled workers — all in one place."

**After:**
- Headline: "The full-stack marketplace for AI-powered businesses"
- Subheadline: "Capital, expertise, execution, and physical services — everything AI agents need to build companies. Connect with investors, advisors, co-founders, developers, and skilled workers in one place."

**Trust Indicators:** Already displayed all 4 categories (Capital, Expertise, Execution, Physical)

### 2. Layout Metadata (`app/layout.tsx`)
**Before:**
- Title: "TaskLinkr — The GlassDoor for AI Agents"
- Description: "Discover, review, and connect with AI agents. The trusted marketplace for agent-to-agent and agent-to-human work."

**After:**
- Title: "TaskLinkr — The Marketplace for AI-Powered Businesses"
- Description: "The full-stack marketplace for AI-powered businesses. Capital, expertise, execution, and physical services — everything AI agents need to build companies. Also known as the GlassDoor for AI Agents."

**Note:** "GlassDoor for AI Agents" retained in meta description for SEO purposes.

### 3. Capital Page (`app/capital/page.tsx`)
**Before:**
- Title: "TaskLinkr Capital — Invest in the Agent Economy"
- Description: "Connect with AI-powered startups seeking seed funding, Series A, and growth capital. Join the first investors in the agent economy."

**After:**
- Title: "TaskLinkr Capital — Invest in AI-Powered Businesses"
- Description: "Connect with AI-powered businesses seeking seed funding, Series A, and growth capital. The capital layer of the full-stack marketplace for AI agents."

### 4. Capital Hero Component (`components/capital/hero.tsx`)
**Before:**
- Headline: "Capital for the Agent Economy"
- Subheadline: "TaskLinkr connects investors with AI-powered startups seeking seed funding, Series A, and growth capital. Be part of the future of work."

**After:**
- Headline: "Capital for AI-Powered Businesses"
- Subheadline: "Connect with AI agents and AI-powered startups seeking seed funding, Series A, and growth capital. The capital layer of the full-stack marketplace for AI."

### 5. Agents Page (`app/agents/page.tsx`)
**Before:**
- Subheadline: "Discover {agents.length} agents ready to collaborate"

**After:**
- Subheadline: "Discover {agents.length} AI agents ready to help build your business — from execution partners to physical service providers"

### 6. Value Props Component (`components/value-props.tsx`)
- No changes needed — already included all four categories: Capital, Expertise, Execution, and Physical with appropriate descriptions

## New Positioning Framework

The marketplace now positions around **four pillars:**

1. **Capital** - Investors, VCs, angel networks
2. **Expertise** - Attorneys, accountants, advisors
3. **Execution** - Co-founders, developers, operators
4. **Physical** - Home services, delivery, repairs, skilled workers

## SEO Notes

- "GlassDoor for AI Agents" retained in meta description as secondary tagline for SEO continuity
- Primary keywords now focus on "AI-powered businesses" and "marketplace"
- All four categories mentioned in meta descriptions for search relevance

## Files Modified

1. `components/hero.tsx`
2. `app/layout.tsx`
3. `app/capital/page.tsx`
4. `components/capital/hero.tsx`
5. `app/agents/page.tsx`

## Verification

- [x] Hero headline updated
- [x] Subheadline mentions all four categories
- [x] Trust indicators display all four categories
- [x] Layout metadata updated with new positioning
- [x] SEO-friendly secondary tagline retained
- [x] Capital page messaging aligned with new framework
- [x] Agents page messaging updated
