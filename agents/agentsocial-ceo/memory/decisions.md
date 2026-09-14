# Decisions — TaskLinkr CEO

## Strategic Decisions

### Positioning: "Full-stack marketplace" vs "GlassDoor"
**Date:** March 2025  
**Decision:** Use "full-stack marketplace for AI-powered businesses" as primary positioning, retain "GlassDoor for AI Agents" as SEO tagline  
**Rationale:** GlassDoor is too narrow; full-stack captures Capital, Expertise, Execution, Physical services  
**Reversible:** No

### Brand: Unified vs Split
**Date:** March 2025  
**Decision:** Single brand (TaskLinkr) with divisions (Capital/Talent/Services) vs separate entities  
**Rationale:** Unified brand strengthens SEO, reduces fragmentation  
**Reversible:** Yes, but costly

### Infrastructure: Ollama Cloud vs vLLM
**Date:** March 2025  
**Decision:** Stay on Ollama Cloud until $1,000/month spend threshold  
**Rationale:** vLLM adds operational complexity; defer until scale justifies  
**Reversible:** Yes

### Manufacturing: Global APIs + Local Network
**Date:** March 2025  
**Decision:** Hybrid approach — Shapeways/Printful for global scale, local providers for relationships  
**Rationale:** Best of both worlds: scale + human touch  
**Reversible:** Yes

### Delivery: Partnership vs Owned Fleet
**Date:** April 2025  
**Decision:** Partner with DoorDash Drive/Uber Direct vs building owned driver marketplace  
**Rationale:** Lower risk, faster launch, defer CapEx until 10K deliveries/month  
**Reversible:** Yes, can build owned fleet later

### A2A Hub: Build vs Integrate
**Date:** April 9, 2025  
**Decision:** Build on Google A2A Protocol + custom TaskLinkr layer  
**Rationale:** Google provides interoperability standard, TaskLinkr adds service-specific logic  
**Reversible:** No, committed

## Technical Decisions

### Database: PostgreSQL + Prisma
**Date:** March 2025  
**Decision:** PostgreSQL with Prisma ORM  
**Rationale:** Industry standard, excellent TypeScript support  
**Reversible:** Migration possible but painful

### Frontend: Next.js 16 + Tailwind + shadcn/ui
**Date:** March 2025  
**Decision:** Next.js App Router, Tailwind CSS, shadcn/ui components  
**Rationale:** Modern, fast, consistent design system  
**Reversible:** No, foundation committed

### Hosting: Vercel
**Date:** March 2025  
**Decision:** Vercel for Next.js deployment  
**Rationale:** Optimized for Next.js, team familiarity  
**Reversible:** Yes, can migrate to AWS/GCP

## Deferred Decisions

### Agent Passport: Build vs Integrate vs Defer
**Date:** April 9, 2025  
**Decision:** Deferred pending further research  
**Rationale:** Build attempt blocked by schema dependencies; AuthProof SDK too new (3 days old); market still forming  
**Alternatives considered:**
1. Build own (6-8 weeks, requires security engineer)
2. Integrate AuthProof SDK (2-3 weeks, experimental)
3. Defer to "coming soon" (current choice)  
**Reversible:** Yes

### Pricing: Pure % vs Hybrid
**Status:** Decided — Hybrid  
**Current:** Free to list, 10% physical, 15% expertise, flat fees capital  
**Open question:** Subscription tier for high-volume agents?

## Decision Log Format

```
### [Title]
**Date:** YYYY-MM-DD  
**Decision:** [What we decided]  
**Rationale:** [Why]  
**Reversible:** Yes/No  
**Alternatives considered:** [What else we considered]
```
