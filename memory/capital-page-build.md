# TaskLinkr Capital Landing Page Build

**Date:** 2026-04-02  
**Built by:** tl-dev

## Overview
Built a complete investor-facing landing page at `/capital` to attract VCs, angels, and funds to TaskLinkr as capital providers for AI-powered businesses.

## Files Created

### Page
- `app/capital/page.tsx` - Main page component with metadata

### Components
All components located in `components/capital/`:

1. **hero.tsx** - Hero section with "Capital for the Agent Economy" headline
2. **opportunity.tsx** - Market stats, quote from Roy Mann, first-mover narrative
3. **how-it-works.tsx** - 3-step process for investors
4. **for-investors.tsx** - Benefits for investors with mock dashboard preview
5. **for-startups.tsx** - Benefits for startups seeking funding
6. **featured-opportunity.tsx** - Basys Health case study placeholder
7. **faq.tsx** - Accordion FAQ section
8. **cta.tsx** - Investor waitlist form with email capture

### UI Components Added
- `components/ui/badge.tsx` - Badge component for tags
- `components/ui/accordion.tsx` - Accordion for FAQ section

### Dependencies Installed
- `@radix-ui/react-accordion` - For collapsible FAQ items

## Sections Implemented

### 1. Hero
- Headline: "Capital for the Agent Economy"
- Subheadline explaining TaskLinkr's purpose
- Two CTAs: "Join as Investor" + "View Opportunities"
- Trust signals: Verified Startups, Due Diligence Tools, Privacy Protected

### 2. The Opportunity
- Stats: $407B projected market, 47% CAGR, 15M+ agents by 2028
- Roy Mann quote from monday.com
- First-mover advantage narrative

### 3. How It Works
- Step 1: Create investor profile
- Step 2: Browse AI startups
- Step 3: Connect directly with founders

### 4. For Investors
- Curated deal flow
- Verified profiles
- Integrated due diligence tools
- Early access

### 5. For Startups/Agents
- VC & angel networks
- Warm introductions
- Capital + talent in one platform

### 6. Featured Opportunity
- Basys Health placeholder case study
- $2M seed round
- Healthcare AI sector
- Traction metrics (12 pilots, $180K ARR, 6 team members)

### 7. FAQ
- How does TaskLinkr verify startups?
- What's your fee structure?
- How is this different from AngelList?
- Can I invest in agent-to-agent businesses?
- What investment amounts are supported?
- Is my investment data secure?

### 8. CTA Section
- "Join the first investors in the agent economy"
- Email capture with investor type selection
- Stored in localStorage as `tasklinkr_investors`

## Design Notes
- Professional finance-industry aesthetic
- Emerald/emerald color scheme for trust and growth
- Dark mode compatible
- Uses existing TaskLinkr brand colors and components
- Trust signals throughout (security, verification, privacy)

## Data Storage
Investor waitlist emails stored in `localStorage` with the key `tasklinkr_investors`:
```json
[
  {
    "email": "investor@example.com",
    "type": "angel|vc|fund|corporate|other",
    "joinedAt": "2026-04-02T..."
  }
]
```

## Navigation Updated
- Added "Capital" link in Header navigation
- Styled with emerald color to highlight importance

## Testing
Run `npm run dev` and navigate to `/capital` to preview the page.
