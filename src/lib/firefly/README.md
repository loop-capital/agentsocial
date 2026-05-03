# Adobe Firefly API Integration

Image generation, compositing, and upscaling for AgentSocial via Adobe Firefly API.

## Setup

1. Get credentials from [Adobe Developer Console](https://developer.adobe.com/console)
   - Note: Enterprise account may be required for API access
2. Set environment variables:
   ```bash
   export FIREFLY_CLIENT_ID="your_client_id"
   export FIREFLY_CLIENT_SECRET="your_client_secret"
   ```

## Usage

```typescript
import { Firefly } from "./lib/firefly";

const firefly = Firefly.fromEnv();

// Generate an image
const result = await firefly.generate.generateSync({
  prompt: "a professional social media post about healthy living",
  numVariations: 3,
  contentClass: "photo",
  size: { width: 1024, height: 1024 },
});

// Composite a product into a scene
const composite = await firefly.composite.compositeSync({
  image: "base64_product_photo",
  prompt: "product displayed on a modern kitchen counter with warm lighting",
  harmonization: { strength: 75 },
});

// Upscale a low-res image
const upscaled = await firefly.upscale.upscaleSync({
  image: "base64_low_res_image",
  scaleFactor: 4,
  useCase: "userAssets",
});
```

## Modules

| Module | Purpose | API Endpoint |
|--------|---------|-------------|
| `auth.ts` | OAuth token management | `ims-na1.adobelogin.com/ims/token/v3` |
| `generate.ts` | Text-to-image generation | `firefly-api.adobe.io/v3/images/generate-async` |
| `composite.ts` | Product scene compositing | `firefly-api.adobe.io/v3/images/composite-async` |
| `upscale.ts` | Image resolution enhancement | `firefly-api.adobe.io/v3/images/upscale-async` |

## For AgentSocial Integration

The plan is to bundle Firefly image generation into AgentSocial as a feature:
- Users generate images for social posts directly in the platform
- Brand consistency via custom models
- Product photos composited into social media backgrounds
- Upscale low-res assets to high-res

## Auth Note

The Firefly API requires OAuth server-to-server credentials from Adobe Developer Console. This may require an enterprise account. Alternative approaches:
- Use Firefly web app API (limited, not officially documented)
- Partner with Adobe for API access
- Use alternative image generation APIs (Stability AI, Replicate, etc.)
