# Template Research Strategy — AgentSocial

## Philosophy

The template library is a **living asset**, not a static list. Trends change, platforms evolve, and what worked last month may not work today. Our customers need fresh, proven templates that reflect current viral patterns.

## System Design

### Research Agents (Continuous)
- **agentsocial-research** — Primary discovery agent
- Monitors social platforms for viral content patterns
- Runs on schedule (daily/weekly) or on-demand
- Focuses on niches our customers care about

### Template Lifecycle

```
Discovery → Analysis → Generation → Validation → Deployment
    ↓           ↓            ↓            ↓            ↓
  Search    Deconstruct   Create    A/B Test    Auto-seed
  viral     hook/body/CTA template  against     to library
  posts     pattern       JSON      existing
```

## Research Sources

### Phase 1: Manual Curation (Now)
- You share viral posts you find
- We deconstruct them into templates
- Seed into database
- 24 templates currently seeded

### Phase 2: Automated Discovery (After Launch)
- Platform APIs (Twitter v2, LinkedIn, Instagram Basic Display)
- Web scraping for public viral content
- Hashtag trend monitoring
- Engagement threshold filtering

### Phase 3: Customer Data (Post-Launch)
- Analyze which templates drive highest engagement per customer
- Auto-generate variants from top performers
- Niche-specific template expansion

## How to Add Templates

### Option A: Share Viral Posts
Send me (or the research agent) posts with high engagement. Format:
```
Platform: twitter
Likes: 5000
Shares: 800
Content:
[post text]
```

### Option B: API Endpoint
```bash
POST /v1/content/templates/research
{
  "posts": [
    {
      "platform": "twitter",
      "content": "...",
      "likes": 5000,
      "shares": 800,
      "comments": 200
    }
  ]
}
```

### Option C: Scheduled Discovery (Future)
- Research agent runs daily
- Discovers new viral patterns automatically
- Seeds top 10 per niche into library
- Notifies team of emerging trends

## Template Categories to Expand

| Category | Current | Target | Niches Needed |
|----------|---------|--------|---------------|
| Hooks | 5 | 30 | All |
| CTAs | 4 | 20 | All |
| Stories | 3 | 25 | Founder, personal growth |
| Listicles | 2 | 15 | Business, tech |
| Frameworks | 3 | 15 | Marketing, sales |
| Comparisons | 2 | 10 | Product, service |
| Questions | 2 | 15 | Engagement, polls |
| Behind-scenes | 2 | 10 | Personal brand |
| Urgency | 1 | 10 | Product launches |
| Myth-busters | 1 | 10 | Education |

## Success Metrics

- Templates per niche: target 50+
- Template freshness: <30 days since last update
- Engagement lift: +20% for AI-generated posts using templates vs. raw generation
- Customer retention: template library as sticky feature

## Next Actions

1. **You find viral posts this weekend** → Share with me, I'll process them
2. **Set up research agent schedule** → Daily/weekly discovery runs
3. **Platform API access** → Twitter v2, LinkedIn, Instagram for automated discovery
4. **Customer feedback loop** → Which templates perform best, iterate

The 24 templates we have now are a solid foundation. The system is built to scale to 500+ templates within 6 months of launch through continuous research.
