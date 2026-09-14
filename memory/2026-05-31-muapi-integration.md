# muapi Integration Plan — 2026-05-31

## Decision
Use muapi as our generation backend (replacing direct model integrations).
Evaluate Omni API when it launches — muapi is 15-25x cheaper for video.

## Cost Comparison
| Provider | Image | 60s Video | Model |
|----------|-------|-----------|-------|
| muapi | $0.03 | $0.25-0.60 | Pay-per-use |
| Higgsfield | Included | Included in sub | Subscription ($10-30/mo) |
| Omni | Unknown | ~$10 | Pay-per-use |

## Per-Salon Cost Estimate (muapi)
- 5 images/week × $0.03 = $0.15/week
- 2 videos/week × $0.40 = $0.80/week
- Total: ~$3.80/month per salon client
- DFY Pro at $299/mo → $3.80 gen cost = 98.7% margin

## Architecture
```
AgentSocial App
    ↓
Our Generation API (packages/generation)
    ↓ adapter pattern ↓
muapi Provider (now) → Omni Provider (future) → Direct models (future)
    ↓
Storage (Supabase) → CDN delivery
```

## Key Models for Salon Content
- **Nano Banana / Nano Banana 2** — social images ($0.03)
- **Flux Dev** — high-quality images ($0.025)
- **Kling v2.1 Standard** — image-to-video for salon reels ($0.10-0.15)
- **Seedance 2.0** — high-quality video ($0.40-0.60)
- **Kling Avatar Standard** — talking head videos for salons
- **Flux Kontext Pro** — image editing/restyling
- **AI Product Shot** — product/service photography
- **Creatify Lip Sync** — lip sync for video ads

## muapi Features We'll Use
- REST API (200+ models, pay-per-use)
- MCP server (agent-driven generation)
- Webhooks (async video generation)
- Programmatic pricing API (cost estimation before generation)
- Social publishing endpoints (TikTok, YouTube)
- ComfyUI integration (advanced workflows)

## Integration Steps
1. packages/generation — adapter pattern with provider interface
2. muapi provider implementing the interface
3. Backend API routes wrapping generation service
4. Frontend generation UI (studio mode)
5. Agent prompts calling MCP for generation
6. Webhook handler for async video completion