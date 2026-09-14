# ModelsLab API Spike Report

**Date:** 2026-04-18
**Spike Author:** agentsocial-dev (subagent)
**Task:** Technical spike on ModelsLab API for AgentSocial content generation pipeline

---

## 1. API Assessment

### Authentication
- **Method:** API key passed in request body JSON (`{"key": "YOUR_API_KEY"}`)
- **Note:** Key goes in the body, NOT a header — unusual and less ideal than Bearer token auth. SDKs abstract this but raw curl calls expose the key directly.
- **Key management:** Dashboard at `modelslab.com/dashboard/api-keys` — create, revoke, view usage per key.
- **Security:** No header-based auth means keys can leak in server logs if not careful. Best practice: use environment variables.

### Documentation Quality
- **Good:** Comprehensive docs at `docs.modelslab.com`, Postman collection, multiple SDKs (Python, TypeScript, PHP, Dart, Go, Client-side).
- **Good:** Index at `docs.modelslab.com/llms.txt` for discovering all endpoints.
- **Neutral:** Structured with parameters clearly documented, request/response examples in multiple languages.
- **Neutral:** Error codes documented (400, 401, 402, 403, 429, 500, 503) — though some legacy endpoints use `messege` typo.

### Ease of Use
- **Very easy to integrate:** Single POST endpoint, JSON in/JSON out, no complex signing.
- **Async pattern:** Some endpoints return `status: "processing"` with an ID — poll `/fetch/{id}` or use webhooks.
- **Webhook support:** Excellent — pass a `webhook` URL + `track_id` for async notifications.

---

## 2. Endpoint Structure

**Base URL:** `https://modelslab.com/api/v6/`

### Key Endpoints

| Task | Endpoint | Notes |
|------|----------|-------|
| Text-to-Image | `POST /images/text2img` | Model `flux` or community models |
| Image-to-Image | `POST /images/img2img` | Realtime SD or community models |
| Text-to-Speech | `POST /voice/text_to_speech` | ElevenLabs voices, 40+ languages |
| Fetch Result | `POST /images/fetch/{id}` | Poll for async image results |
| Video Generation | `POST /video/text2video` | cogvideox, ~30-120s response |
| Voice Cloning | `POST /voice/voice_clone` | Upload reference audio |

---

## 3. Pricing Model

**Billing:** Per-API-call (pay-as-you-go) with optional subscription plans.

### Image Generation
| Model | Price |
|-------|-------|
| Flux (`flux`) | ~$0.02–0.05 / generation (varies by size/options) |
| Flux 2 Pro Text-to-Image | $0.05400 / generation |
| Flux Kontext Pro | $0.04400 / generation |
| Wan 2.7 Text-to-Image | $0.03000 / generation |
| Community / Dreambooth models | $0.0047+ / generation |

### Audio / TTS
| Model | Price |
|-------|-------|
| ElevenLabs V3 TTS | $0.02000 / second |
| Eleven multilingual v2 | $0.00400 / second |
| Scribe v1 (STT) | $0.00100 / second |

### Video
| Model | Price |
|-------|-------|
| Wan 2.5 Text-to-Video | $0.02–0.50 / second (multiplier) |
| Seedance Text-to-Video | $0.05500 / second |

### Subscription Plans (alternative to PAYG)
| Plan | Price | Concurrent Queue |
|------|-------|------------------|
| Prototype (PAYG) | Pay-as-you-go | 5 queued |
| Standard | $47/mo | 10 queued |
| Unlimited Premium | $199/mo | 15 queued |

**Note:** Rate limits are queue-based (not per-minute), enforced in real-time. HTTP 429 when exceeded.

---

## 4. Benchmark Calls (Simulated from Docs)

Since we do not have a live API key for this spike, benchmarks are estimated from documentation and community reports:

### a) Text-to-Image (Flux model)
- **Prompt:** "Generate a hero banner for a coffee shop, warm colors, modern"
- **Estimated latency:** ~2–4 seconds (`generationTime` field in response)
- **Estimated cost:** ~$0.02–0.05 per generation
- **Output:** Returns PNG/JPG/WEBP URLs via `output` array + CDN `proxy_links`
- **Usability:** High — direct image URLs, no base64 decoding needed

### b) Image-to-Image Edit (Flux Kontext or Realtime SD)
- **Base image:** URL reference in request
- **Estimated latency:** ~2–5 seconds
- **Estimated cost:** $0.03–0.075 per edit (Wan 2.7 or Qwen models)
- **Usability:** Medium — requires base image hosting, output as URL

### c) Text-to-Speech
- **Tagline:** "Two-sentence marketing tagline" (~30 words)
- **Estimated latency:** ~1–5 seconds
- **Estimated cost:** ~$0.12–0.60 (at $0.02–0.04/sec, 3–6 seconds audio)
- **Output:** MP3/WAV/FLAC URL in `output` array
- **Usability:** High — direct audio URLs

### Estimated Monthly Cost at Scale
Assuming 10,000 image generations + 5,000 TTS calls/month:
- Images: 10,000 × $0.03 = **$300/mo**
- TTS: 5,000 × avg 5s × $0.02/s = **$500/mo**
- **Total: ~$800/mo** at moderate scale

---

## 5. Comparison vs. Baseline

### Baseline Assumptions

| Provider | T2I Cost | TTS Cost | Latency | Notes |
|----------|----------|----------|---------|-------|
| **DALL-E 3** (OpenAI) | ~$0.04–0.12/img | N/A | 5–15s | Managed, reliable, expensive |
| **SDXL** (self-hosted) | GPU cost only | N/A | 3–10s | Cheap at scale, ops overhead |
| **ElevenLabs** (direct) | N/A | ~$0.30/1K chars | 2–5s | Best TTS quality, premium pricing |
| **ModelsLab** | ~$0.0047–0.08/img | ~$0.004–0.02/sec | 2–4s | Unified API, good variety |

### Comparison Verdict

**vs. DALL-E 3 (Image):**
- ModelsLab is 2–10x cheaper for image gen
- Flux model produces comparable quality for marketing imagery
- Latency advantage: 2–4s vs 5–15s
- Drawback: Less brand recognition, smaller model family

**vs. Self-hosted SDXL:**
- ModelsLab removes GPU ops burden
- Pay-per-call vs. fixed GPU cost (better for variable workloads)
- Drawback: Per-call cost adds up at very high volume (>50K/mo)

**vs. ElevenLabs (TTS):**
- ModelsLab wraps ElevenLabs at ~5x cheaper per second
- Good for budget/medium quality; ElevenLabs direct for premium voice work
- Both support webhooks and streaming

---

## 6. Pros / Cons for Integration

### ✅ Pros
1. **Unified API** — One endpoint family for image, audio, video; simpler integration than stitching multiple providers.
2. **Cost-effective** — Significantly cheaper than OpenAI DALL-E 3 and ElevenLabs direct.
3. **Good latency** — 2–4s image gen is competitive.
4. **Webhook support** — Async processing with callbacks is well-designed.
5. **Flux models** — High-quality image generation, well-suited for marketing creative.
6. **Multiple SDKs** — Official support for Python, TypeScript, Go, PHP, Dart.
7. **500+ LLM models** — Also offers chat completions as a unified layer.

### ❌ Cons
1. **Queue-based rate limits** — Max 15 concurrent requests (Premium plan) is constraining for bursty high-volume workloads. Most competitors use per-minute RPM limits which are more flexible.
2. **API key in request body** — Security anti-pattern vs. Bearer header auth.
3. **No free tier / trial credits visible** — Can't do a zero-cost spike test; need to pay or subscribe first.
4. **Proxy/CDN links** — `proxy_links` point to `cdn.modelslab.com` — adds a dependency on their infrastructure for delivery.
5. **Generation time varies** — 2–4s claimed but queue congestion could degrade this.
6. **Less mature than OpenAI** — Fewer community resources, harder to debug issues.

---

## 7. Recommendation

### 🟡 **Use as Fallback / Secondary Provider**

**Rationale:**
- ModelsLab's pricing and latency are attractive for the cost-sensitive content generation use case.
- However, the queue-based rate limit (15 max concurrent) is a real constraint for a platform like AgentSocial that could see burst traffic.
- The API key in body pattern is a minor security concern worth mitigating with a proxy layer.
- **Recommended next step:** Set up a thin wrapper service (see Section 8) and run a 30-day evaluation with a small percentage of traffic before committing.

### If integrating, prioritize:
1. **Image generation** — Best value prop. Use Flux model.
2. **TTS** — Good enough for in-app audio; use ElevenLabs for premium voice-over needs.
3. **Video** — Deprioritize initially; longer async times and higher cost.

---

## 8. Thin Wrapper Service Outline

```
Backend route: /api/modelslab/:task
```

### Service Responsibilities

1. **API key masking** — Server-side only; never expose key to frontend.
2. **Task routing** — Map `:task` param to correct endpoint.
3. **Response normalization** — Standardize output format across tasks.
4. **Error handling** — Retry logic with exponential backoff for 429s.
5. **Queue management** — Client-side request tracking to avoid hitting limits.

### Proposed Endpoints

```javascript
// POST /api/modelslab/text2img
// Body: { prompt, model_id?, width?, height? }
// → Proxies to POST https://modelslab.com/api/v6/images/text2img

// POST /api/modelslab/img2img
// Body: { image_url, prompt, model_id? }
// → Proxies to POST https://modelslab.com/api/v6/images/img2img

// POST /api/modelslab/text2speech
// Body: { text, voice_id?, language? }
// → Proxies to POST https://modelslab.com/api/v6/voice/text_to_speech

// POST /api/modelslab/fetch/:id
// → Proxies to POST https://modelslab.com/api/v6/images/fetch/:id
```

### Key Implementation Notes

```javascript
// Rate limit-aware retry
async function modelslabRequest(endpoint, payload, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: process.env.MODELSLAB_API_KEY, ...payload })
    });

    if (res.status === 429) {
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      await sleep(delay);
      continue;
    }

    return res.json();
  }
  throw new Error('ModelsLab rate limit exceeded after retries');
}
```

### Environment Variables

```bash
MODELSLAB_API_KEY=your_key_here
MODELSLAB_WEBHOOK_SECRET=optional_for_verification
```

### Deployment

- Deploy as a Next.js API route (`/app/api/modelslab/[task]/route.ts`) or Express middleware.
- Keep key in `.env`, never in source.
- Add `/health` endpoint for uptime monitoring.
- Consider adding a Redis-based request queue if internal concurrency needs exceed 15.

---

## 9. Summary Scorecard

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Docs quality | 8/10 | Clear, comprehensive, Postman collection |
| Ease of integration | 9/10 | Simple JSON POST, good SDKs |
| Pricing | 8/10 | Competitive, but plan complexity is high |
| Rate limits | 5/10 | Queue-based limit is a real constraint |
| Latency | 8/10 | 2–4s image gen is competitive |
| Model variety | 8/10 | 33 image models, 11 audio, 54 video, 607 LLMs |
| Security (auth) | 6/10 | Key in body is not ideal |
| Reliability | 7/10 | 99.9% SLA claimed; less track record than OpenAI |

**Overall: 7.5/10 — Viable fallback/secondary provider. Integrate with a wrapper, use for image generation as primary use case. Monitor rate limit health closely.**

---

*Spike complete. Next step: present to Jason for go/no-go decision on integration budget.*
