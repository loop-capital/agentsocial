# URGENT — WEBSITE BUILDER SPRINT
**Date:** April 21, 2026
**From:** Jason / System Update

## Status
Website Builder integration is largely complete (see PROJECT_STATUS.md). The remaining gap is the **prototype** and **pricing model** before the April 23 deadline.

## Remaining tasks before April 23:
1. **agentsocial-dev** — Prototype: generate one sample website end-to-end using the integrated stack
2. **agentsocial-design** — Design the Website Builder UI (generator flow, output preview, template picker)
3. **agentsocial-marketing** — Finalize pricing model and feature naming (AgentSite recommended)
4. **agentsocial-research** — Confirm no competitor has shipped this; lock pricing benchmarks ($12-30/mo)

## What's already done (do NOT re-research):
- Technical feasibility (see tools/website-builder-setup/FINDINGS.md)
- Manus/Meta integration (see docs/manus-api-wrapper.md)
- Models Lab API fallback (see routes/modelslab.js)
- Competitive analysis (see docs/website-builder-competitive-analysis.md)
- Database schema design underway

## Context
Website Builder is AgentSocial's strategic moat. No competitor (Buffer, Hootsuite, Sprout Social, Later) offers built-in website generation. This is a $0 → $49/mo upsell. Move fast.
