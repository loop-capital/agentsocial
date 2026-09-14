# Adobe Creative Integration — Product Architecture

## Problem Statement
We need image/video generation and creative tools for:
- **Us** (AgentSocial internal development)
- **All AgentSocial users** (SaaS customers who don't have Adobe enterprise accounts)

## Reality Check

| Approach | Works For | Setup | Cost | Limitation |
|----------|-----------|-------|------|------------|
| Firefly Services API | Developers with enterprise access | Developer Console project | $0.02-0.10/image | Requires admin provisioning |
| "Adobe for Creativity" MCP | Claude users only | Click install in Claude | Free/personal Adobe ID | Claude-exclusive, not programmable |
| Firefly consumer web app | Individual users | Sign up at adobe.com | Free tier (25 credits/mo) | Manual UI only, no API |
| Alternatives (DALL-E, Midjourney, etc.) | Anyone | API key | Various | Not Adobe |

## The Only Scalable Architecture

We build a **multi-provider creative pipeline** where Adobe is the premium option and alternatives are the default.

```
User Request: "Generate hero image for my landing page"
         │
         ▼
AgentSocial Creative Engine
         │
    ┌────┴────┬──────────┬──────────┐
    │         │          │          │
    ▼         ▼          ▼          ▼
 Adobe     DALL-E 3   Midjourney   Stability
 (opt-in)  (default)   (premium)    (fallback)
    │         │          │          │
    └────┬────┴──────────┴──────────┘
         │
         ▼
  Unified Asset Output
  (stored in user's Cloudinary/AgentSocial storage)
```

## Provider Strategy

### Tier 1: Default (No user setup required)
**Provider**: OpenAI DALL-E 3 via user's own OpenAI API key
- Cost: ~$0.04/image (1024x1024)
- Quality: Excellent for most use cases
- Setup: User provides OPENAI_API_KEY in settings
- Best for: 90% of users, quick generation, general imagery

### Tier 2: Premium Creative (Requires user setup)
**Provider**: Adobe Firefly Services API
- Cost: $0.02-0.10/image (varies by feature)
- Quality: Professional, brand-safe, commercial use
- Setup: User brings their own Adobe credentials
- Best for: Users who already have Adobe CC or want commercial-grade output

### Tier 3: Specialized (Requires user setup)
**Provider**: Midjourney API / Leonardo AI / Stable Diffusion
- Cost: Various
- Quality: Artistic, stylized
- Setup: User provides their own API key
- Best for: Specific artistic styles

### Tier 4: Fallback (Always available)
**Provider**: Pollinations.ai / Pollinations (free, no key)
- Cost: Free
- Quality: Good enough for drafts
- Setup: None
- Best for: Prototyping, users without any API keys

## Implementation Plan

### Phase 1: Multi-Provider Engine (Week 1)
Build the unified creative engine that can route to any provider:

```
packages/backend/src/creative-engine/
├── providers/
│   ├── openai-dalle.ts      # DALL-E 3 via OpenAI
│   ├── adobe-firefly.ts     # Firefly Services API
│   ├── pollinations.ts      # Free fallback
│   └── midjourney.ts        # Future
├── types.ts                 # Unified request/response types
├── router.ts               # Provider selection logic
└── index.ts                # Public API
```

### Phase 2: User Settings (Week 1)
Add creative provider configuration to user settings:

```typescript
interface UserCreativeSettings {
  defaultProvider: 'openai' | 'adobe' | 'midjourney' | 'pollinations' | 'auto';
  apiKeys: {
    openai?: string;
    adobeClientId?: string;
    adobeClientSecret?: string;
  };
  preferences: {
    defaultImageSize: '1024x1024' | '1792x1024' | '1024x1792';
    defaultStyle: 'vivid' | 'natural';
    saveToCloudinary: boolean;
  };
}
```

### Phase 3: Template Integration (Week 2)
Wire the creative engine into SiteFlow templates:

```typescript
// Template can specify image generation prompts
template.images = [
  {
    slot: 'hero',
    prompt: 'Modern SaaS dashboard interface, clean minimal design, blue gradient background, professional photography',
    provider: 'auto', // uses user's default
    size: '1792x1024'
  }
];
```

### Phase 4: Adobe MCP Bridge (Future)
When the Adobe for Creativity MCP becomes available as a standalone endpoint:

```
mcporter config add adobe-creativity --url "https://mcp-gateway.adobe.io/creativity/mcp"
```

Use this for interactive creative workflows within OpenClaw/Claude sessions.

## For AgentSocial Users

### Onboarding Flow
1. User signs up → gets Pollinations (free, no setup)
2. User wants better quality → add OpenAI API key (pay-as-you-go)
3. User has Adobe CC → connect Adobe ID for Firefly (premium output)
4. Power users → configure multiple providers, let router pick best

### Pricing Strategy
- **Free tier**: Pollinations only, limited generations
- **Pro tier**: Includes DALL-E 3 credits (we pay OpenAI, mark up)
- **Business tier**: Includes Firefly credits (we pay Adobe, mark up)
- **Bring-your-own-key**: User pays provider directly, we take small platform fee

## What We Build This Week

1. **Multi-provider creative engine** — abstract interface, 3 implementations (OpenAI, Pollinations, Adobe placeholder)
2. **User settings UI** — add API keys, pick default provider
3. **SiteFlow template integration** — auto-generate images during build
4. **Fallback chain** — if provider fails, try next in chain

## Adobe API Access Path

For users who want Adobe:
1. We provide instructions for Developer Console setup
2. User creates OAuth Server-to-Server credentials
3. User inputs Client ID + Secret in AgentSocial settings
4. Our backend generates tokens and calls Firefly API
5. User pays Adobe directly for credits

## Alternative: Reseller Model

If Adobe opens a partner/reseller program:
- We get master API credentials
- We provision sub-accounts per user
- We bill users for Firefly usage
- Revenue share with Adobe

---

## Recommendation

**Don't wait for Adobe.** Build the multi-provider engine NOW with OpenAI + Pollinations. Add Adobe as a premium option when users ask for it. This gets the feature shipped in days, not months.

The Claude Adobe connector is a separate concern — that's for **interactive** creative work when you're chatting with the AI. The API-based providers are for **automated** generation during builds.
