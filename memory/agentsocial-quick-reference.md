# AgentSocial — Quick Reference for Lucy

## What It Is
Buffer-style social media platform built agent-first. Free APIs (FB, IG, YT, Twitter, LinkedIn). No Ayrshare — we build our own.

## Tech Stack
- Frontend: Next.js 14 (App Router)
- Backend: Fastify
- Database: PostgreSQL + Drizzle ORM
- Queue: Redis + BullMQ

## Pricing
- Free: 1 brand, 3 channels, 50 posts/mo
- Starter: $19/mo — 3 brands, 15 channels, 500 posts/mo
- Pro: $49/mo — 10 brands, unlimited posts, analytics
- Agency: $149/mo — 50 brands, team features, white-label

## Phase 1 (Weeks 1-3)
1. Set up monorepo: web/, api/, connectors/, shared/
2. User auth (NextAuth.js + API keys for agents)
3. Facebook Graph API connector first (OAuth + post publishing)
4. Basic dashboard
5. Instagram + YouTube connectors next

## Platform Connectors (All Free)
- Facebook Graph API
- Instagram Graph API
- YouTube Data API v3
- Twitter/X API v2
- LinkedIn API
- TikTok Content Posting API

## CEO: Jason Opland
Report progress daily. Full specs on PC1 — ask Che if needed.
