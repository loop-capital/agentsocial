# Maven Research Brief: Salon Video Content Strategy

**Date:** May 24, 2026
**From:** AgentSocial Engineering → Maven/PC3 Marketing Team
**Priority:** Start immediately — Omni Flash API drops in coming weeks

---

## Objective

Research what makes salon video content perform across all platforms, so when our AI video engine launches, we have proven templates, prompts, and distribution strategies ready.

---

## Research Area 1: Trending Salon Video Formats

### What to Research
- Top 20 salon Instagram Reels this month — what format are they using?
- Top 20 salon TikToks this month — what hooks, transitions, audio?
- Which video styles drive **bookings** (not just views)?
- Average view counts, save rates, share rates by format type

### Format Categories to Map
| Format | Description | Performance Indicator |
|--------|-------------|----------------------|
| Before/After | Transformation reveal | High saves, shares |
| Tutorial | How-to styling tips | High saves, comments |
| Day-in-Life | Salon atmosphere walkthrough | High watch time |
| Trending Audio | Lip-sync/trend participation | High reach, new followers |
| Client Testimonial | Real client reactions | High trust, conversions |
| Seasonal Promo | Offer/discount announcement | Direct bookings |
| ASMR | Satisfying cutting/styling sounds | High completion rate |
| Product Spotlight | Featured product demo | Product sales |

### Deliverable
Rank-ordered list of formats with:
- Best-performing platform for each
- Average engagement rate
- Recommended video length
- Sample prompts for AI generation

---

## Research Area 2: Platform Algorithm Research

### What to Research
For each platform (IG Reels, TikTok, YouTube Shorts, Facebook Reels, Pinterest):

1. **How does the algorithm rank video content?**
   - What signals matter most (watch time, saves, shares, comments)?
   - How does the first 3 seconds affect distribution?
   - Does native audio vs. music affect reach?

2. **What gets shadowbanned or suppressed?**
   - Watermarked content from other platforms
   - Certain hashtags or phrases
   - Over-posting frequency thresholds

3. **Optimal posting specs per platform**
   - Aspect ratio, duration, file size
   - Best times to post for salon audiences
   - How many hashtags and which ones

### Deliverable
Platform-by-platform optimization guide:
```
Platform: Instagram Reels
- Aspect Ratio: 9:16 (1080x1920)
- Duration: 15-30s optimal
- First frame: Hook in <1s (text overlay or dramatic reveal)
- Audio: Trending audio boosts reach 2-3x
- Hashtags: 3-5 niche > 20 generic
- Best posting times for salons: Tue-Thu 11am, Sat 10am
- Algorithm weight: Watch time (40%) > Shares (25%) > Saves (20%) > Comments (15%)
```

---

## Research Area 3: Distribution Beyond Social

### What to Research
Where else does salon video content go that drives bookings?

| Channel | How It Works | Priority |
|---------|-------------|----------|
| Google Business Profile | Video posts on GBP listing | 🔴 Critical |
| Email Marketing | Video in newsletter/broadcasts | 🟡 Important |
| Website Hero | Landing page background video | 🟡 Important |
| Yelp | Video on business listing | 🟠 Moderate |
| Nextdoor | Local community posts | 🟠 Moderate |
| GBP Messaging | Video in Google chat responses | 🔴 Critical |
| SMS/WhatsApp | Video messages to clients | 🟡 Important |

### Deliverable
For each channel:
- Format requirements (aspect ratio, length, file type)
- Does it drive direct bookings?
- Can we automate distribution via API?
- Priority for our pipeline

---

## Research Area 4: Competitor Video Analysis

### Salons to Study (Top Performers)
- Find 10 salon brands with 50K+ followers doing video well
- Find 5 local salons (Columbus OH area) active on video

### What to Document
- How often they post video
- What formats they use most
- Average view counts vs. follower count
- Do they run video ads? If so, what's the creative?
- What do they do **badly** that we can improve on?

### Deliverable
Competitive matrix:
| Salon | Followers | Posts/Week | Top Format | Avg Views | Video Ads? | Our Edge |
|-------|-----------|------------|------------|-----------|------------|----------|
| Salon A | 200K | 5 | Before/After | 15K | Yes | AI generation at 1/10 cost |
| ... | ... | ... | ... | ... | ... | ... |

---

## Research Area 5: Prompt Library Development

### What We Need
Since our AI generates video from text prompts, we need proven prompt formulas.

### Prompt Formula Structure
```
[Subject] + [Action] + [Setting] + [Style] + [Mood] + [Audio]
```

### Example Prompts to Test and Refine
1. **Transformation**: "A stylist revealing a balayage transformation in a modern salon with warm lighting, cinematic close-up, upbeat mood, with background music"
2. **Tutorial**: "A cosmetologist demonstrating a quick styling tip at their station, tutorial style, professional mood, with voiceover"
3. **Atmosphere**: "A clean modern salon with clients being styled, warm golden lighting, lifestyle documentary style, cozy mood, ambient salon sounds"
4. **Promo**: "A salon seasonal promotion announcement with text overlay showing special offer, bold colorful style, exciting mood, with upbeat music"
5. **ASMR**: "Close-up of hair being washed and styled with satisfying sounds, minimal style, relaxing mood, ASMR audio"

### Deliverable
- 20 tested prompt formulas organized by format category
- Which prompts produce the best results with current AI video tools
- Platform-specific prompt variations (TikTok favors different style than IG)

---

## Research Area 6: Video Ad Creative for Paid Campaigns

### What to Research
- What video ad creative works for salon/beauty businesses on:
  - Google Ads (YouTube pre-roll, Display)
  - Meta Ads (IG Reels ads, FB in-stream)
  - TikTok Ads
- Average CPM, CPC, CPA benchmarks for salon video ads
- Ad creative best practices:
  - Hook in first 2 seconds
  - Clear CTA overlay
  - Mobile-first design
  - Captioned (85% watch without sound)

### Deliverable
Ad creative guide:
- Ad specs per platform (dimensions, duration, file size)
- CTA frameworks that convert for salons
- Budget recommendations per ad format
- 5 tested ad prompt templates

---

## Timeline

| Week | Focus | Deliverable |
|------|-------|-------------|
| Week 1 | Trending formats + Platform algorithms | Format ranking + Optimization guide |
| Week 2 | Distribution channels + Competitor analysis | Channel guide + Competitive matrix |
| Week 3 | Prompt library + Ad creative | 20 prompts + Ad guide |
| Week 4 | Integration into AgentSocial templates | Final template set for launch |

---

## How This Connects to AgentSocial

```
Maven Research          →  AgentSocial Platform
───────────────────────     ──────────────────────
Format rankings         →  Video template selection
Platform guides         →  Auto-optimization settings
Distribution channels   →  Multi-platform publishing
Competitive gaps        →  Feature differentiation
Prompt formulas         →  AI generation templates
Ad creative guide       →  Elite tier ad pipeline
```

Every piece of research maps directly to a feature we're building. This isn't academic — it's fuel for the product.

---

## Priority

**Start with Area 1 (Trending Formats) and Area 2 (Platform Algorithms) immediately.** These inform everything else.

Send findings to Jason for review. We'll ingest the best research into our template system as it comes in.