# Creative Engine Frontend UI — Specification

## Overview
React + TypeScript + Tailwind CSS components for the AgentSocial Creative Engine. Communicates with the Fastify backend at `/api/creative/*`.

## Files

| File | Purpose |
|------|---------|
| `creative-api.ts` | API client, types, and local-storage settings persistence |
| `CreativeEngineSettings.tsx` | Settings panel: API keys, default provider, preferences |
| `ImageGenerationUI.tsx` | Single-image generation: prompt input, templates, gallery, download/copy |
| `BatchGenerationUI.tsx` | Batch generation: multi-prompt textarea, progress tracking, bulk download |
| `SiteFlowImageIntegration.tsx` | SiteFlow integration: auto-generate template slot images with regenerate |
| `CreativeStudioPage.tsx` | Tabbed studio page composing all sub-components |
| `index.ts` | Barrel export of all public APIs |

## Component APIs

### CreativeEngineSettings
- Props: `onSettingsChange?: (settings: UserCreativeSettings) => void`
- Features: API key management (OpenAI, Adobe), default provider dropdown, image size/style defaults, Cloudinary toggle, provider status list
- State: persisted to `localStorage` under key `creative-engine-settings`

### ImageGenerationUI
- Props: `initialPrompt?: string`, `onImageGenerated?: (image: GeneratedImage) => void`, `onUseImage?: (image) => void`, `compact?: boolean`
- Features: prompt textarea, 8 built-in templates, provider/size/quality/style selectors, live cost estimate, generate button with loading state, gallery with hover overlay actions (download, copy URL, use in site), error display with fallback suggestion

### BatchGenerationUI
- Props: `initialPrompts?: string`, `onComplete?: (images: GeneratedImage[]) => void`
- Features: multi-line textarea (one prompt per line), same generation options as single-image, sequential processing with abort, per-job status tracking, progress bar, bulk download & copy URLs

### SiteFlowImageIntegration
- Props: `slots: TemplateSlot[]`, `siteName: string`, `onComplete?: (images) => void`, `onSlotImage?: (slotId, image) => void`
- Features: list of template slots with thumbnails, generate-all button, per-slot regenerate, preview link, progress tracking, regeneration counter

### CreativeStudioPage
- Props: `siteFlowSlots?: TemplateSlot[]`, `siteName?: string`, `onSiteFlowComplete?: (images) => void`
- Features: tab navigation (Generate / Batch / SiteFlow / Settings), settings toggle, demo slots when no siteFlowSlots provided

## Backend Integration
- Base URL: `process.env.NEXT_PUBLIC_API_URL || http://localhost:3001/v1`
- API key headers: `x-openai-key`, `x-adobe-client-id`, `x-adobe-client-secret`
- Endpoints consumed:
  - `POST /api/creative/generate`
  - `POST /api/creative/generate-batch`
  - `GET /api/creative/providers`
  - `POST /api/creative/estimate`

## UI Dependencies
Requires the following shadcn/ui-style components (provided in `src/components/ui/`):
- `card.tsx`, `button.tsx`, `input.tsx`, `label.tsx`, `textarea.tsx`, `select.tsx`, `badge.tsx`, `switch.tsx`, `progress.tsx`, `separator.tsx`
- `lib/utils.ts` with `cn()` helper using `clsx` + `tailwind-merge`

## Responsive Design
- All components use Tailwind responsive utilities (`sm:`, `md:`, `lg:`)
- Gallery grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3/4`
- Settings panel: `max-w-2xl` centered
- Batch progress list: `max-h-[400px] overflow-y-auto`

## Error Handling
- Network errors: displayed as `Badge variant="destructive"` with actionable fallback suggestion (switch to Pollinations)
- Provider failures: backend fallback mechanism (`fallbackTo` field) is surfaced in error messages
- API unavailability: static fallback for provider list in settings
- Graceful degradation: `catch` blocks on all `fetch` calls with console logging
