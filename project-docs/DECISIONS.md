# AgentSocial — Architecture Decision Records

**Last Updated:** 2026-06-01

---

## ADR-001: Fastify over Express for API Server
- **Date:** 2026-04-01
- **Status:** Accepted
- **Context:** Needed a fast, typed backend with plugin architecture
- **Decision:** Use Fastify 4 with Zod type provider
- **Consequences:** Better performance, schema validation built-in, smaller ecosystem than Express

---

## ADR-002: Supabase for Database
- **Date:** 2026-04-01
- **Status:** Accepted — ⚠️ Risk
- **Context:** Needed managed PostgreSQL without DevOps overhead
- **Decision:** Use Supabase free tier
- **Consequences:** Free tier pauses when idle — needs migration or auto-wake for production

---

## ADR-003: Self-Hosted Dograh over Vapi
- **Date:** 2026-05-15
- **Status:** Accepted
- **Context:** AI voice receptionist needed for PLEIJ salon. Vapi costs $32/mo, limited control.
- **Decision:** Self-host Dograh (open-source Vapi alternative)
- **Consequences:** ~$15/mo, full control, template system reusable for any salon. More ops burden.

---

## ADR-004: Composio for Social OAuth
- **Date:** 2026-05-19
- **Status:** Accepted
- **Context:** Building OAuth flows for 5+ platforms is complex and fragile
- **Decision:** Use Composio managed OAuth (1,000+ app integrations)
- **Consequences:** Fast integration, managed token refresh, but external dependency. Free tier 20K calls/mo, Pro at $29/mo when needed.

---

## ADR-005: PLEIJ-Only Build for Voice Agent
- **Date:** 2026-05-26
- **Status:** Accepted
- **Context:** Building salon voice agent — should it be multi-tenant ClawStudio product or PLEIJ-specific?
- **Decision:** PLEIJ-only, not multi-tenant (Jason confirmed)
- **Consequences:** Simpler code, faster delivery. Template system still reusable for future salons.

---

## ADR-006: Square Raw HTTPS over SDK
- **Date:** 2026-05-26
- **Status:** Accepted
- **Context:** Square Node SDK `searchAvailability` sends camelCase when API needs snake_case
- **Decision:** Bypass SDK, use raw HTTPS calls for Square API
- **Consequences:** More verbose code but correct behavior. SDK bug may be fixed eventually.

---

## ADR-007: DFY Service Tiers Alongside SaaS
- **Date:** 2026-05-11
- **Status:** Accepted
- **Context:** Zoca charges $299 for organic-only management. We can do better with paid ads.
- **Decision:** Three tiers: Core ($49/mo self-serve), Pro ($199/mo DFY), Elite ($499/mo full DFY + ads). Voice AI add-on at $99/mo.
- **Consequences:** Higher revenue per customer, but requires account management staffing for DFY tiers.

---

## ADR-008: SiteFlow as Template Engine (Not AI-First)
- **Date:** 2026-04-29
- **Status:** Accepted
- **Context:** Website builder needed for salon clients. AI generation is expensive and unreliable.
- **Decision:** SiteFlow is a template engine for customers; AI for internal use only
- **Consequences:** Predictable output, lower cost, faster delivery. AI used to generate new templates, not customer sites directly.

---

## ADR-009: Clipify for Video Repurposing
- **Date:** 2026-05-08
- **Status:** Accepted
- **Context:** Need short-form video from long-form content
- **Decision:** Fork/adapt Clipify (MIT License, louisedesadeleer/clipify) with Whisper transcription + AI moment detection
- **Consequences:** 11 API endpoints, 3 caption styles, 3 reframe modes. Requires ffmpeg + openai-whisper.

---

## ADR-010: AgentSocial Platform Over Ayrshare
- **Date:** 2026-04-29
- **Status:** Accepted
- **Context:** Need social media publishing. Buy Ayrshare or build our own?
- **Decision:** Build our own connectors. Free APIs (FB, IG, YT, Twitter, LinkedIn). No Ayrshare dependency.
- **Consequences:** More upfront work, zero per-post cost, full control over data and UX.

---

## ADR-011: muapi Adapter Pattern for AI Generation
- **Date:** 2026-05-31
- **Status:** Accepted
- **Context:** Need multi-model AI generation (images, video, characters). Direct API integration would couple us to one provider.
- **Decision:** Use adapter pattern with muapi (200+ models) as primary provider and Gemini (free tier) as fallback. Provider-agnostic `GenerationService` interface.
- **Consequences:** Flexible model switching, cost optimization (Gemini free tier for basic needs). 12 new API endpoints. ~$3.80/client/mo generation cost at DFY Pro tier (98.7% margin). Omni provider planned for future character videos ($1.50/video).

---

## ADR-012: Self-Hosted Plausible for Analytics
- **Date:** 2026-05-31
- **Status:** Accepted
- **Context:** Need analytics for client sites. Building our own is costly. Third-party analytics (Google Analytics) adds privacy concerns and data dependency.
- **Decision:** Self-host Plausible on Hetzner (free, open source, GDPR-compliant). Built into all plans, not an upsell.
- **Consequences:** Zero incremental cost, full data ownership, 3-metric API integration (visitors, top pages, conversion rate). Clients see results in our UI, not a separate dashboard. Tracking script embedded on every SiteFlow site.