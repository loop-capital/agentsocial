# AgentSocial — SiteFlow Template Engine

## What Was Built

A complete template-based website generator ("SiteFlow") for AgentSocial customers.

### 1. Database Schema (`packages/backend/src/db/schema.sql`)

Added two new tables with triggers and seed data:

- **`templates`** — 4 pre-built templates (landing, link-in-bio, campaign, portfolio)
- **`websites`** — customer sites with JSON config, deployment tracking, brand scoping
- Brand-scoped indexes + updated_at triggers on both tables

### 2. Backend API (`packages/backend/src/routes/websites.ts`)

Fastify route module registered at `/v1`:

| Method | Path | Description |
|---|---|---|
| GET | `/v1/templates` | List active templates (optional `?category=`) |
| GET | `/v1/websites?brandId=` | List websites for a brand |
| POST | `/v1/websites` | Create website from template |
| GET | `/v1/websites/:id` | Get website config + template details |
| PUT | `/v1/websites/:id` | Update config, status, name, customDomain |
| DELETE | `/v1/websites/:id` | Delete website (brand-scoped) |
| POST | `/v1/websites/:id/deploy` | Trigger Vercel deployment |
| POST | `/v1/websites/:id/export` | Export static ZIP |

Every query is scoped to `brand_id`. Schema validated in Fastify build.

### 3. Shared Types (`packages/shared/src/types.ts`)

Added complete type definitions:
- `WebsiteStatus`, `WebsiteConfig`, `Template`, `Website`
- `CreateWebsiteRequest`, `UpdateWebsiteRequest`, `DeployWebsiteResponse`
- `TemplateListResponse`, `WebsiteListResponse`

### 4. Frontend Templates (React + Tailwind)

| Template | Path | Description |
|---|---|---|
| Landing Page | `packages/frontend/src/templates/landing/LandingPageTemplate.tsx` | Hero, features, CTA, footer |
| Link-in-Bio | `packages/frontend/src/templates/linkinbio/LinkInBioTemplate.tsx` | Avatar, bio, social icons, links grid |
| Campaign | `packages/frontend/src/templates/campaign/CampaignTemplate.tsx` | Countdown, signup, testimonials |
| Portfolio | `packages/frontend/src/templates/portfolio/PortfolioTemplate.tsx` | Gallery, about, contact |

All accept a `config` prop with brand colors, fonts, copy, images, social links, gallery, etc.

### 5. Dashboard Pages (Next.js App Router)

| Route | File | Purpose |
|---|---|---|
| `/websites` | `app/websites/page.tsx` | List all brand websites, deploy, delete |
| `/websites/new` | `app/websites/new/page.tsx` | Pick template → name site → create |
| `/websites/edit/[id]` | `app/websites/edit/[id]/page.tsx` | Full editor with live preview, color pickers, deploy button |
| `/preview/[id]` | `app/preview/[id]/page.tsx` | Server-rendered public preview page |

### 6. API Client (`packages/frontend/src/lib/siteflow.ts`)

Typed `siteflowApi` helper with methods for all endpoints. Reads `NEXT_PUBLIC_API_URL`.

### 7. Environment Variables

Updated `.env.example` files:

```bash
# Backend
VERCEL_TOKEN=your_vercel_token_here
VERCEL_TEAM_ID=your_vercel_team_id_here
NEXT_PUBLIC_API_URL=http://localhost:3001/v1
```

### 8. Documentation

- `docs/API.md` — Full endpoint docs with request/response examples

### 9. Build Verification

- Backend TypeScript: ✅ `tsc` passes
- Frontend TypeScript + Next.js build: ✅ passes
- Routes loaded successfully in isolation test

## How to Use

1. Start the backend: `cd packages/backend && npm run dev`
2. Start the frontend: `cd packages/frontend && npm run dev`
3. Visit `http://localhost:3000/websites?brandId=demo-brand-id`
4. Click **New Website** → pick template → name it → **Continue**
5. Edit brand colors, copy, images in the editor → **Save**
6. Click **Deploy** → site goes live on Vercel

## Future Enhancements

- Real Vercel API integration (currently simulated)
- Image upload to S3/R2 for logos/galleries
- Custom domain DNS verification
- Drag-and-drop editor (instead of form fields)
- Analytics dashboard per site
- Template marketplace (user-submitted templates)
