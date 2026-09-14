# Content Creation Skill — Briar PBA Framework

## Overview
This skill generates social media content using Briar's PBA (Personal Brand Accelerator) framework, distilled from 120 lectures. It produces hooks, scripts, captions, and ideation briefs for any brand.

## Knowledge Base
All content must follow these files (read before generating):

| File | Purpose |
|------|---------|
| `voice-rules.md` | Hard rules (no em-dashes, 9-word max hooks, 5th-grade level, etc.) |
| `principles.md` | 100+ principles (P1-P109+) on hooks, ideation, format, strategy |
| `hook-frameworks.md` | 10 named hook frameworks (HF1-HF10) with structures & examples |
| `ideation.md` | Full ideation pipeline with source-quota rules |
| `brands/pleij.md` | PLEIJ Salon brand voice, ICP, pillars, platforms |

## Usage

### Generate Content for a Brand
1. Read the brand file (e.g., `brands/pleij.md`) for voice, ICP, pillars
2. Read `voice-rules.md` for hard formatting rules
3. Read `principles.md` for strategy principles
4. Read `hook-frameworks.md` for hook patterns
5. Generate content that adheres to ALL rules and principles

### Quick Reference — Hard Rules (Never Broken)
- **NO em-dashes** — use commas, periods, or hyphens instead
- **On-screen text: 9 words max** (sweet spot ~8, two lines)
- **5th-grade reading level** — simplify vocabulary
- **On-screen text is an open loop, never a restatement** of the verbal hook
- **Never resolve the hook in the first 15-20 seconds**
- **Every claim: falsifiable, visual, unique**
- **No "success," "great," "better," "more," "improve," "things," "powerful"**
- **No clickbait crutches** ("stop scrolling," "stay until the end")
- **Lead with nouns**, not verbs or function words
- **"How" beats "why"** — tactics over philosophy
- **Take a definitive stance** — nuance kills retention
- **Lean authentic** over over-scripted
- **Caption CTA in first sentence** if revenue is the goal

### Hook Frameworks Quick Reference
| ID | Name | One-line |
|----|------|----------|
| HF1 | Pain+Dream+Curiosity+Proof | Default stack: pain point, dream outcome, social proof, pump fake |
| HF2 | URS Trifecta | High TAM + specific emotion + unique framing |
| HF3 | Hook→Super Hook→EIA | Brain-dead blueprint: hook, super hook, explain, illustrate, apply |
| HF4 | Whisper Technique | Parenthetical under main hook (curiosity/risk-reversal/proof) |
| HF5 | Pump Fake | "But this is where it gets crazy" — pattern break |
| HF6 | Contrast Hook | Position between two opposing concepts |
| HF7 | Identity-Driven | Identities over verbs ("practice owner" not "reactive") |
| HF8 | Fear-Based | Pain point + fear + resolution (cap at 50%) |
| HF9 | Elephant in Room | Name the unspoken, then make it beautiful |
| HF10 | Emotional Resonance | Strike emotional nerve (no curiosity needed) |

### Output Format — Social Post
```yaml
pillar: <which brand pillar>
format: <IG_reel | IG_carousel | IG_post | TikTok | GBP_post>
funnel: <top | middle | bottom>

on_screen_text: "<8-9 words, open loop>"
whisper: "<2-3 words in parentheses>"
verbal_hook: "<different angle than on-screen text>"
body: "<2-3 sentences per idea, 3-6 stages>"
caption: "<CTA first sentence, then context, no em-dashes>"
hashtags: "<5-10 relevant tags>"

hook_framework: <HF1-HF10>
briar_principles: [<P##>]
voice_rules_applied: [<list rules followed>]
```

### Adding New Brands
Create a file in `brands/` with:
- Brand identity, location, type
- ICP (ideal customer profile) and IGP (ideal group profile)
- Content pillars (3-5)
- Voice signature (tone, do/don't)
- Platforms and funnel goals