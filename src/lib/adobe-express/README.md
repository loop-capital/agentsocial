# Adobe Express Embed SDK Integration

Embed Adobe Express's full design editor directly into AgentSocial. Users can generate images with AI (Firefly), edit photos, browse templates, and export designs — all without leaving the platform.

## Features

| Module | What It Does |
|--------|-------------|
| **Generate Image** | AI image generation via Firefly |
| **Edit Image** | Retouch, filters, background removal |
| **Template Browser** | Browse Adobe Express template library |
| **Quick Actions** | Resize, crop, trim, compress |
| **Full Editor** | Complete Adobe Express experience |

## Setup

1. API key stored in `.env` (already configured)
2. SDK loads from Adobe CDN: `https://cc-embed.adobe.com/sdk/v4/CCEverywhere.js`

## Usage

```typescript
import { createAdobeExpress } from "./lib/adobe-express";

const express = createAdobeExpress({
  apiKey: process.env.ADOBE_EXPRESS_API_KEY!,
  appName: "AgentSocial",
});

// Generate an image with Firefly
const result = await express.generateImage({
  prompt: "a vibrant social media post about wellness",
  onComplete: (img) => console.log("Generated:", img.assetUrl),
});

// Edit an existing image
const edited = await express.editImage({
  assetUrl: "https://example.com/photo.jpg",
});

// Browse templates
const template = await express.browseTemplates({});

// Quick action: resize
const resized = await express.quickAction({
  type: "resize",
  assetUrl: "https://example.com/photo.jpg",
});

// Open full editor
const design = await express.openEditor("https://example.com/photo.jpg");
```

## Allowed Domains

- `localhost:3000` (dev)
- `localhost:3001` (dev)
- `getagentsocial.com` (production)

## API Key

`2cfb2e097e5a4e97b7b09bffdcdc5a79` (stored in `.env`)

## Why This Over Firefly REST API?

| | Embed SDK | Firefly REST API |
|---|---|---|
| Access | Business approval ✅ | Enterprise account ❌ |
| User experience | Full visual editor | Prompt → image |
| Templates | ✅ Adobe library | ❌ Not included |
| Background removal | ✅ Built-in | ❌ Separate API |
| API credentials | Simple API key | OAuth client_id + secret |

The Embed SDK gives users a professional design experience. The Firefly API is for server-side/batch automation. For AgentSocial's user-facing image generation, the Embed SDK is the right choice.
