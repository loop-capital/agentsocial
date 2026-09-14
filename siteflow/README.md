# SiteFlow - Website Builder System

A complete website builder pipeline that scrapes design-focused sites, extracts design tokens, generates React/Next.js components, and adapts them to any brand.

## Architecture

```
siteflow/
├── scraper/              # Python scraper for target sites
│   └── godly-scraper.py
├── extractor/            # Design token extractor
│   └── design-token-extractor.py
├── templates/            # Template database
│   ├── schema.json       # Template JSON schema
│   ├── build-index.ts    # Index builder
│   ├── index.json        # Master template catalog
│   ├── scraped/          # Raw scraped data
│   └── extracted/        # Extracted design systems
├── generator/            # Code generation engine
│   ├── types.ts          # TypeScript types
│   ├── code-generator.ts # React/Next.js generator
│   └── brand-adapter.ts  # Brand adaptation engine
├── renderer/             # Preview server
│   └── server.ts         # Express preview API
├── generated/            # Output directory
├── run.ts                # Master CLI orchestrator
└── package.json
```

## Quick Start

### Full Pipeline
```bash
npx tsx run.ts --site=stripe.com --brand="MyBrand" --colors="#FF0000,#000000,#FFFFFF"
```

### Individual Steps
```bash
# 1. Scrape sites
npx tsx run.ts --scrape

# 2. Extract design tokens
npx tsx run.ts --extract

# 3. Generate site from template
npx tsx run.ts --generate --template=stripe.com

# 4. Adapt to brand
npx tsx run.ts --adapt --template=stripe.com --brand="Acme" --colors="#6366F1,#1E1B4B,#818CF8"

# 5. Preview
npx tsx run.ts --preview
```

## API Endpoints

- `POST /api/preview` - Render design system as HTML
- `GET /api/preview/file?path=...` - Preview generated file

## Generated Output

Each generated site includes:
- `pages/LandingPage.tsx` - Landing page with hero, features, CTA
- `pages/AboutPage.tsx` - About page with story, mission, values
- `pages/PricingPage.tsx` - Pricing page with plans
- `pages/ContactPage.tsx` - Contact page with form
- `styles/globals.css` - CSS variables
- `tailwind.config.ts` - Tailwind config
- `package.json` + `next.config.js` - Next.js setup
