# Manus/Meta Integration — Product Brief

## Overview
AgentSocial integrates Meta's advertising intelligence (via Manus) to give users data-driven content and targeting recommendations — turning raw Meta insights into actionable social media strategy.

## User-Facing Features

### 1. Insight-Powered Ad Copy Generation
**Value Prop:** "Write ads that already match what's working on Meta."
- When generating ad copy, AgentSocial queries Meta Ad Library for top-performing creatives in the user's vertical
- Local LLM synthesizes patterns (headline formulas, CTAs, emotional hooks) into fresh, original copy
- Users see a badge: "✨ Enhanced with Meta Insights" on AI-generated copy that used external data
- **Toggle:** "Use Meta Insights" switch on the copy generation screen — off by default for privacy-conscious users; on by default for new workspaces

### 2. Trend Scanning
**Value Prop:** "Know what's trending before your competitors do."
- Scans Meta Ad Library for vertical-specific creative trends (visual styles, messaging angles, offer types)
- Returns trend report: top 5 emerging patterns with confidence scores
- Trend data cached for 6 hours; users can force-refresh (costs extra credits)
- Displayed as a "Trends" panel in the content calendar view

### 3. Audience Insights for Targeting
**Value Prop:** "Stop guessing who your audience is."
- Pulls demographic and behavioral data from Meta for the user's connected business account
- Recommends targeting parameters (age, interests, lookalike audiences) based on actual performance data
- Shown as suggestions in the campaign setup flow
- Cached for 12 hours

### 4. Competitor Analysis
**Value Prop:** "See what your competitors are running — and what's working."
- Analyzes active ads from competitor pages in the same vertical
- Summary: ad count, creative formats, estimated spend tier, messaging themes
- P1 priority — available even on tight daily quotas

### 5. "Use Meta Insights" Toggle
- **Location:** Top-right of content creation UI, persistent per workspace
- **States:** On (blue, glowing) / Off (grey)
- **Behavior when ON:** All eligible AI operations route through Manus when credits available
- **Behavior when OFF:** All generation uses local LLM only (no Meta data, no credit consumption)
- **Tooltip:** "When enabled, AgentSocial uses Meta advertising data to improve your content. No personal data is sent to Meta."
- **Quota indicator:** Small pill below toggle showing "X/Y credits remaining today"

## Priority & Credit System

| Task Type | Priority | Est. Credits |
|-----------|----------|-------------|
| Trend Scan | P0 (highest) | 150 |
| Copy Optimization | P0 | 100 |
| Audience Insight | P1 | 75 |
| Competitor Analysis | P1 | 125 |
| Campaign Reporting | P2 | 50 |
| Generic Query | P2 | 25 |

**Free tier:** 300 credits/day + 1,000 initial bonus
**Credit drain:** P0 tasks served first; P2 tasks fall back to local LLM when credits < 20% of daily limit

## Fallback Behavior
When Manus is unavailable or quota exceeded:
- Seamless fallback to local LLM — user sees copy without the "✨ Enhanced" badge
- Toast notification: "Using local AI — Meta Insights unavailable (quota/timeout). Your content will still be generated."
- No user action required; no broken flows