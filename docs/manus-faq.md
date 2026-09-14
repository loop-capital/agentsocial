# Manus/Meta Integration — FAQ & Concerns Document

## Quota & Availability

**Q: What happens when I run out of credits?**
Your content still generates — it just uses our local AI instead of Meta-informed insights. You'll see a notification when you hit 80% and 100% usage. Credits reset daily at midnight UTC. Free tier: 300/day.

**Q: Can I buy more credits?**
Yes — paid plans include higher daily limits and priority routing. Details on our pricing page.

**Q: What if Meta's API is down?**
We automatically fall back to local LLM generation. No broken flows, no action required on your part. You'll see a brief toast notification: "Using local AI — Meta Insights temporarily unavailable."

---

## Data Privacy

**Q: What data do you send to Meta?**
We only send API requests to Meta's public endpoints (Ad Library, Business Account data). We do NOT send your content, creative assets, or personal information to Meta. The flow is: AgentSocial → Meta API → insights data back to us → fed into local LLM → content generated for you.

**Q: Does Meta see my generated content?**
No. Your content is generated locally by our AI. Meta only sees standard API requests for public/ad data.

**Q: Do you store Meta API responses?**
Yes — we cache insights data (trends, audience data) for performance, with TTLs ranging from 1-24 hours depending on data type. Cached data is stored in your workspace's database and expires automatically.

**Q: Can I use AgentSocial without connecting to Meta at all?**
Absolutely. The "Use Meta Insights" toggle is off by default. With it off, AgentSocial works exactly as before — 100% local AI, zero Meta API calls.

---

## Transparency

**Q: How do I know when my content used Meta Insights vs. local AI?**
Content enhanced with Meta data shows a "✨ Enhanced with Meta Insights" badge. Content from local AI shows no badge. You'll never be unsure which generated your copy.

**Q: What's the toggle doing exactly?**
When ON: eligible AI operations (copy generation, trend scans, audience insights) route through Meta API when credits are available. When OFF: all generation uses local LLM only. The toggle is per-workspace and persistent.

**Q: Do you show me what data informed my content?**
For trend scans and competitor analysis, yes — you see the source data (trending patterns, competitor ad summaries). For copy optimization, we show the patterns detected but not raw competitor ads, to respect IP.

---

## Technical Concerns

**Q: Is the Meta API connection secure?**
Yes. Tokens are stored in environment variables, never exposed client-side. All API calls go through our server-side wrapper with audit logging. We use HTTPS exclusively.

**Q: What about rate limiting?**
We handle Meta's rate limits automatically (429 responses → retry with backoff). Our own quota system prevents you from hitting Meta's limits unexpectedly.

**Q: What if I revoke my Meta access?**
All Meta-powered features gracefully degrade to local AI. Your cached data expires per normal TTL. No data loss, no broken account.

---

## Mitigation Summary

| Concern | Mitigation |
|---------|-----------|
| Quota exhaustion | Graceful fallback to local LLM + user notification at 80% and 100% |
| Meta API downtime | Circuit breaker + automatic local LLM fallback + toast notification |
| Data privacy | No user content sent to Meta; only public API queries; toggle default OFF |
| Transparency | "✨ Enhanced" badge on insight-powered content; no badge = local AI |
| Rate limiting | Server-side retry with exponential backoff; own quota system as first line |
| Token security | Env-var storage only; never client-exposed; audit logging |
| IP / competitor data | Show patterns/themes, not raw competitor creative; respect ad library terms |