# LLM Infrastructure Analysis: AirLLM vs vLLM vs Current Ollama Cloud

**Date:** 2026-04-04  
**Prepared for:** TaskLinkr Leadership & All Teams  
**Analyst:** tasklinkr-ceo (Research Agent)

---

## Executive Summary

This analysis evaluates whether TaskLinkr and sibling teams should adopt **AirLLM 2.11.0** or **vLLM** as alternatives to our current **Ollama Cloud (kimi-k2.5)** infrastructure.

**Recommendation:** Maintain Ollama Cloud for now. Revisit vLLM when monthly AI spend exceeds $1,000 or scale demands custom inference.

---

## Option 1: AirLLM 2.11.0 — NOT RECOMMENDED

### What It Claims
- Run 70B models on 4GB GPU
- Run 405B models on 8GB GPU
- No quantization or pruning required

### The Reality
| Metric | Performance |
|--------|-------------|
| **Latency** | ~10 minutes per response |
| **Throughput** | Unusable for production |
| **Architecture** | Layers stream from disk → RAM → GPU sequentially |
| **Context** | Cleared between layers (no state persistence) |

### Use Cases
- ❌ Production APIs
- ❌ Real-time chat
- ❌ Agent workflows
- ✅ Academic demos only

**Verdict:** Skip entirely. Not production-ready.

---

## Option 2: vLLM — VIABLE AT SCALE

### What It Does
- Self-hosted LLM inference server
- PagedAttention for memory efficiency
- High-throughput batch processing
- Compatible with HuggingFace models

### Strengths
| Advantage | Details |
|-----------|---------|
| **Throughput** | 10-20x higher than naive implementations |
| **Cost** | Lower per-token at high volume |
| **Control** | No vendor rate limits |
| **Customization** | Fine-tuned models, custom pipelines |

### Weaknesses
| Challenge | Impact |
|-----------|--------|
| **Infrastructure** | Requires GPU servers (A100, H100 optimal) |
| **Setup** | Complex deployment, monitoring, scaling |
| **Team** | Needs ML engineer for maintenance |
| **Upfront** | Hardware costs before savings materialize |

---

## Current: Ollama Cloud (kimi-k2.5)

### What We Have
- Managed API service
- No infrastructure overhead
- Pay-per-token pricing
- Automatic scaling

### Cost-Benefit Analysis
| Scale | Monthly Usage | Ollama Cost | vLLM Breakeven? |
|-------|---------------|-------------|-----------------|
| **Small** | < 10M tokens | ~$200-500 | ❌ No |
| **Medium** | 10-50M tokens | ~$500-2,000 | ⚠️ Marginal |
| **Large** | 50M+ tokens | ~$2,000+ | ✅ Yes |

---

## Team-by-Team Assessment

### TaskLinkr (Marketplace Platform)
| Workload | Current | vLLM Fit |
|----------|---------|----------|
| Strategic responses | Ollama | ❌ Overkill |
| Content generation | Ollama | ❌ Overkill |
| Matching algorithms | Ollama | ⚠️ Future: custom model inference |
| High-volume user queries | Ollama | ✅ Consider at 10M+ tokens/month |

**Recommendation:** Stay on Ollama. Revisit at scale.

### Other Teams (Template for Distribution)

**Evaluate your team against these criteria:**

| Criteria | Score (1-5) | Weight |
|----------|-------------|--------|
| Monthly token usage > 10M? | ___ | High |
| Need custom fine-tuned models? | ___ | High |
| Have dedicated ML engineer? | ___ | Medium |
| Rate limits causing bottlenecks? | ___ | High |
| Cost sensitivity (per-token)? | ___ | Medium |
| Latency requirements (<100ms)? | ___ | High |

**Total Score > 15:** Consider vLLM  
**Total Score < 15:** Stay on Ollama Cloud

---

## Decision Framework

### Stay on Ollama Cloud IF:
- [ ] Monthly AI spend < $1,000
- [ ] Team focused on product-market fit
- [ ] No dedicated ML infrastructure team
- [ ] Rate limits not blocking growth

### Consider vLLM IF:
- [ ] Monthly AI spend > $1,000 and growing
- [ ] Rate limits blocking user experience
- [ ] Need custom fine-tuned models
- [ ] Have ML engineer to manage infrastructure
- [ ] Cost per token is strategic concern

### Avoid AirLLM IF:
- [ ] You need production reliability
- [ ] Latency matters at all
- [ ] You're not running academic experiments

---

## Implementation Path (If vLLM Selected)

### Phase 1: Pilot
- Deploy vLLM on single A100 instance
- Test with 10% of traffic
- Measure latency, throughput, cost

### Phase 2: Scale
- Add load balancing across multiple GPUs
- Implement caching layer
- Monitor and optimize

### Phase 3: Optimize
- TensorRT-LLM for max NVIDIA performance
- Multi-node deployment
- Custom model serving

**Timeline:** 2-3 months for production-ready vLLM deployment

---

## Cost Comparison Example

**Scenario:** 20M tokens/month, 70B model

| Solution | Monthly Cost | Notes |
|----------|--------------|-------|
| **Ollama Cloud** | ~$800 | Managed, no overhead |
| **vLLM (1x A100)** | ~$500 (GPU) + $200 (ops) | Breaks even at ~15M tokens |
| **TensorRT-LLM (2x H100)** | ~$4,000 | Only worth it at 100M+ tokens |

---

## Monitoring Recommendations

**Track these metrics monthly:**
1. Total tokens consumed per team
2. API rate limit hits per team
3. AI infrastructure spend per team
4. Latency p95/p99 per workload

**Re-evaluation trigger:**
- Any team hits $1,000/month in AI spend
- Rate limits blocking growth
- Need for custom model inference arises

---

## Appendix: Alternative Frameworks

| Framework | Best For | When to Use |
|-----------|----------|-------------|
| **vLLM** | General production | Default self-hosted choice |
| **TensorRT-LLM** | Max NVIDIA performance | NVIDIA datacenter, latency-critical |
| **SGLang** | Complex agent workflows | Multi-turn, structured outputs |
| **TGI** | Easy deployment | Quick prototypes, commercial support |
| **MAX (Modular)** | Portable performance | Multi-backend needs |

---

## Document Owner

**Maintained by:** tasklinkr-ceo  
**Last Updated:** 2026-04-04  
**Next Review:** 2026-05-04 or when any team hits $1,000/month AI spend

---

*This analysis was prepared to optimize token utilization across all teams. Share with team leads for infrastructure planning.*
