# Evvy.com — Site Analysis

**URL:** https://www.evvy.com  
**Category:** Women's Health / Vaginal Microbiome Testing  
**Platform:** Webflow (custom theme, "evvy-v5")  
**Date Analyzed:** 2026-04-18  

---

## Brand Overview

Evvy is a direct-to-consumer women's health company offering at-home vaginal microbiome testing with clinician-reviewed results and prescription treatment. The site positions itself as "pioneering precision care for vaginal health" — bridging the gap between at-home testing and evidence-based clinical care. The brand leans modern, science-forward, and distinctly feminine without being cliché.

---

## Color Palette

### Primary Swatches (from CSS custom properties)

| Swatch | Hex | Usage |
|--------|-----|-------|
| **Black** | `#11161A` | Primary text, dark backgrounds |
| **Creme** | `#F3F1EE` | Light backgrounds, warm neutral |
| **Dark Creme** | `#DED7D1` | Secondary backgrounds, cards |
| **Darkest Creme** | `#C0B4AA` | Borders, subtle accents |
| **Light Creme** | `#F9F8F7` | Lightest background variant |
| **Blue** | `#6CA7FF` | Primary accent, links, CTAs |
| **Light Blue** | `#BCCDE3` | Highlights, secondary accent |
| **Blue Tint** | `#F3F8FF` | Very light blue background |
| **Cobalt** | `#2342FD` | Strong accent |
| **Marine** | `#073573` | Deep navy |
| **Pine** | `#074C4C` | Dark teal-green, section themes |
| **Teal** | `#166D6D` | Mid-tone teal |
| **Mint** | `#B2CDB8` | Soft green, highlights |
| **Pond** | `#1B8064` | Green accent |
| **Frog** | `#99A866` | Olive green |
| **Apple** | `#AD3700` | Deep red-orange |
| **Salmon** | `#FF915E` | Warm orange accent |
| **Orange** | `#FF7E4D` | CTA accent |
| **Dune** | `#FFC8B3` | Soft peach |
| **Pink** | `#93113A` | Deep magenta-red |
| **Orchid** | `#C89CD9` | Lavender-purple accent |
| **Purple** | `#D6D6FF` | Light purple, highlights |
| **Maroon** | `#610824` | Deep burgundy |
| **Yellow** | `#FBED6E` | "New!" tags, highlights |
| **Data Green** | `#65790C` | Chart/data visualization |
| **Data Red** | `#D91000` | Alert, data viz |
| **Data Yellow** | `#FBED6E` | Data viz |
| **Grey-100** | `#DBDCDD` | Light grey borders |
| **Grey-300** | `#B8B9BA` | Mid grey |
| **Grey-500** | `#707376` | Body text secondary |
| **Grey-800** | `#35393C` | Dark grey text |
| **Error Red** | `#D91000` | Form errors |
| **AA-Evvy Blue** | `#4084E9` | Accessibility contrast blue |
| **AA-Orchid** | `#B380C7` | Accessibility contrast orchid |
| **AA-Salmon** | `#F66737` | Accessibility contrast salmon |

### Color Architecture

- **Theme sections** alternate between light (creme) and dark (pine/dark) backgrounds
- Section themes: `u-theme-creme`, `u-theme-dark`, `u-theme-dark-creme`, `u-theme-pine`
- `data-accent` attribute dynamically swaps accent colors per component (blue, mint, orchid, yellow, pine, pink, pond, salmon, orange, purple, light-blue, apple, frog)
- `data-highlight` attribute applies highlight colors to text (purple, yellow, mint, salmon, light-blue)
- The palette is warm-neutral dominant (creme/black) with nature-toned accents (pine, mint, pond, frog) — feels botanical/scientific without being sterile

### Key Color Relationships

- **Primary background:** Creme `#F3F1EE` (warm off-white, not clinical white)
- **Primary text:** Black `#11161A` (warm near-black)
- **Primary accent:** Blue `#6CA7FF` (friendly, approachable, not corporate blue)
- **Secondary accent:** Pine `#074C4C` (deep teal-green for authority)
- **Warm accents:** Salmon `#FF915E`, Dune `#FFC8B3` (skin tones, warmth)
- **Feminine accents:** Orchid `#C89CD9`, Pink `#93113A` (used sparingly)
- **Freshness accents:** Mint `#B2CDB8`, Pond `#1B8064` (nature/health)

---

## Typography

### Font Stack

| Role | Family | Weights | Fallback |
|------|--------|---------|----------|
| **Primary** | Intervariable | 400 (regular), 500 (medium), 600 (semibold/bold) | Arial, sans-serif |
| **Secondary** | ABC Marist | 400 (regular) | "Times New Roman", sans-serif |
| **Monospace** | System monospace | — | — |

- **Intervariable** is a variable-weight sans-serif (likely custom or from ABC Dinamo). Clean, modern, geometric with personality.
- **ABC Marist** is used for editorial/serif moments — adds warmth and sophistication to longer-form content.
- Primary bold weight is 600 (semibold), not 700+ — gives a more approachable, less aggressive feel.

### Type Scale (fluid, clamp-based)

| Token | Min | Max |
|-------|-----|-----|
| Display | 2.5rem (40px) | 3.75rem (60px) |
| H1 | 2rem (32px) | 3rem (48px) |
| H2 | 2rem (32px) | 2.5rem (40px) |
| H3 | 1.5rem (24px) | 2rem (32px) |
| H4 | 1.25rem (20px) | 1.5rem (24px) |
| H5 | 1.125rem (18px) | 1.375rem (22px) |
| H6 | 1rem (16px) | 1.25rem (20px) |
| Text Large | 1rem (16px) | 1.125rem (18px) |
| Text Main | 0.875rem (14px) | 1rem (16px) |
| Text Small | 0.875rem (14px) | fixed |
| Text X-Small | 0.75rem (12px) | fixed |
| Eyebrow | 0.75rem (12px) | 0.8125rem (13px) |
| Caption | 0.75rem (12px) | 0.875rem (14px) |

### Line Heights

| Token | Value |
|-------|-------|
| Tight (1.1) | Display, H1 |
| Semi-tight (1.2) | H2 |
| Standard (1.25) | H3, H4 |
| Relaxed (1.4) | Body text |
| Loose (1.5) | Small text |

### Letter Spacing

- `-0.01em` (tight): Large headings
- `0em` (default): Body
- `0.04em`: Eyebrow/labels
- `0.05em`: Uppercase labels

### Typography Patterns

- **Eyebrow text:** Small uppercase labels above sections (e.g., "State-of-the-Art Testing")
- **Italic `<em>` used inside headings** for emphasis on key phrases (e.g., "precision care for *vaginal health*")
- **`data-max-width` attribute** controls line-length per element (e.g., `--max: 40ch`)
- **`tw-balance` and `tw-pretty`** utility classes for text-wrap: balance/pretty
- **Font weight 900** used on `concern_hero-content h1 strong` for dramatic contrast within headlines

---

## Layout Architecture

### Grid System

- **12-column grid** with CSS custom properties for column widths
- Fluid with `clamp()` responsive sizing
- Container with configurable margins (`--site--margin`)
- Breakout grid that extends content beyond container (`--breakout-start`, `--breakout-end`)
- Max viewport width defined via `--site--viewport-max` / `--site--viewport-min`

### Section Pattern

The homepage follows a distinct vertical section stack:

1. **Announcement bar** — "Take the quiz & Get $10 off →"
2. **Navigation** — Sticky smart-nav with dropdown mega-menus
3. **Hero section** — `u-theme-dark-creme` dark warm background
4. **3-Column value prop** — Testing / Care / Tracking
5. **4-Step funnel** — Numbered steps with images
6. **Quiz CTA section** — "How can Evvy help you?"
7. **Medical Advisory Board** — Grid of doctor portraits and credentials
8. **Sample Report CTA** — Email capture form
9. **Press logos** — Vogue, TechCrunch, Fast Company, Inc.
10. **Footer**

### Navigation

- **Mega-menu dropdown** with product cards, "Shop by Concern" filters (Vaginal Health, Fertility, Menopause, UTIs)
- **Promo cards** in dropdown with star ratings and product thumbnails
- **Mobile hamburger** with slide-in nav
- **Sticky nav** with `fs-scrolldisable` for mobile scroll lock

### Card Pattern

- Product cards with 3:2 aspect ratio thumbnails
- Background images with overlay content
- Star rating component with 5-star SVG icons
- Tags (e.g., "New!" in yellow)

---

## Women's Health Positioning

### Narrative Strategy

Evvy's positioning is built on three pillars:

1. **Medical legitimacy** — CLIA/CAP/CLEP certified, peer-reviewed, physician-reviewed results, Medical Advisory Board of 11 OB-GYNs from Stanford, UCSF, Northwestern
2. **Gender health gap advocacy** — "Women and people with vaginas were not required to be in US clinical research until 1993" — frames the product as closing a systemic gap
3. **Empowerment language** — "Take control," "precision care," "finally bringing the power and precision of metagenomics to vaginal healthcare"

### Language Patterns

- Uses "people with vaginas" alongside "women" — inclusive without losing specificity
- Avoids clinical jargon in headlines; uses it in supporting detail
- Condition-specific landing pages: `/shop-vaginal-symptoms`, `/shop-fertility`, `/shop-peri-menopause`, `/shop-utis`
- Emphasizes that traditional testing misses things: "700+ bacteria and fungi — all with a simple, at-home swab"

### Empathy Signals

- Testimonials prominently placed ("75,000+ people")
- Direct quotes with emotional language: "I felt heard, understood, and cared for"
- Health coaching as core offering, not upsell
- Community support mentioned as included benefit

---

## Test Presentation

### Product Page Structure (`/vaginal-microbiome-test`)

1. **Product selector** — Two tiers: mNGS only, or mNGS + PCR Panel
2. **Add-on products** — Probiotic suppositories, boric acid, hyaluronic acid (upsell cross-sells)
3. **Condition tabs** — Interactive tabs filtering by: BV, AV, CV, Fertility, STIs, UTIs, Yeast, Mycoplasma
4. **5-Step process** — Numbered steps with images
5. **What you get** — Expandable accordion with 4 value props
6. **After testing** — 3-step care pathway
7. **Fertility insights** — Dedicated section with research citations
8. **Medical credibility** — Physician quote, certification badges
9. **Cost comparison** — Side-by-side traditional costs vs. Evvy
10. **FAQ accordion** — 13 questions

### Test Tiers

| Tier | Technology | Price | Details |
|------|-----------|-------|---------|
| **Vaginal Microbiome Test** | mNGS | $159 ($129 sub) | 700+ bacteria & fungi |
| **+ Expanded PCR Panel** | mNGS + PCR | $248 ($218 sub) | Adds 4 STIs + 11 common microbes, 1-3 day prelim results |

### Key Selling Points

- "First and only CLIA-certified, mNGS vaginal health test"
- "Most comprehensive" messaging throughout
- "One easy at-home swab" — emphasizes simplicity
- HSA/FSA eligible
- Free shipping
- Subscription model: 4 tests/year, skip/cancel anytime

---

## Results Display

### Sample Report Offering

- Dedicated CTA: "See a Sample Report" with email capture (Klaviyo form)
- Report includes: dominant bacteria, custom scores, personalized insights for symptoms/fertility/menopause
- Results are "clinician-reviewed"

### Results Communication Hierarchy

1. **Microbe identification** — 700+ bacteria and fungi detected
2. **Condition mapping** — Which microbes are associated with which conditions (BV, AV, CV, etc.)
3. **Antibiotic susceptibility** — Which treatments research shows are most effective
4. **Tracking** — Compare over time with membership retests
5. **Action plan** — Custom plan with "clear next steps"
6. **Coaching** — 1:1 session with certified health coach included

### Data Visualization Approach

- `data-green` / `data-red` / `data-yellow` CSS swatches suggest traffic-light style data viz
- Condition tabs for filtering results by health concern
- "Microbiome Diversity Score" as headline metric

---

## Medical Credibility

### Advisory Board (11 physicians)

| Name | Credential | Affiliation |
|------|-----------|-------------|
| Dr. Kate McLean | MD, MPH, FACOG | Chief Medical Advisor at Evvy |
| Dr. Craig Cohen | OB-GYN | Professor at UCSF |
| Dr. Diana Currie | OB-GYN | Washington Medical Commissioner |
| Dr. Stephen Klasko | | Fmr President/CEO, Jefferson Health |
| Dr. Jill Krapf | OB-GYN | Vulvar Pain Specialist |
| Dr. Leah Millheiser | OB-GYN | Dept Director, Stanford |
| Dr. Kelle Moley | OB-GYN | Physician-Scientist at Ferring |
| Dr. Sameena Rahman | OB/GYN | Professor at Northwestern |
| Dr. David Sable | | Professor, OB/GYN, IVF Specialist |
| Dr. Sara Vaughn | OB-GYN | Fertility Specialist |
| Dr. Eduardo Hariton | MD, MBA, FACOG | VP Strategic Initiatives, US Fertility |

### Trust Signals

- **Certifications:** CLIA, CAP, CLEP certified
- **Peer-reviewed** methodology
- **"Trusted by 75,000+"** users
- **Press logos:** Vogue, TechCrunch, Fast Company, Inc. Magazine
- **Star ratings:** 5-star SVG icons on product cards
- **Research participation:** IRB-approved, opt-in data sharing to "close the gender health gap"

### Credibility Architecture

- Physician names with titles and institutional affiliations
- Headshot photos (circular crops)
- "View All" / "View Less" toggle for full advisory board
- Certification badges in dedicated section
- Quote from Stanford OB-GYN as social proof

---

## 4-Step Funnel

The homepage presents a clear 4-step acquisition funnel:

### Step 1: Test Your Vaginal Microbiome
- "Evvy offers the most comprehensive vaginal microbiome test"
- "Using metagenomic sequencing to uncover 700+ bacteria and fungi"
- "Simple, at-home swab"
- Image: Test kit product photo (3:2 ratio)

### Step 2: Get Advanced Results
- "Reviewed by a licensed clinician"
- "Personalized insights into your vaginal health"
- "Including potential links to symptoms, fertility, and overall well-being"
- Image: Phone showing results app (3:2 ratio)

### Step 3: Get a Plan + Rx Treatment
- "Customized plan — including targeted prescriptions from a clinician if eligible"
- "Tailored to your unique microbiome"
- Image: Care/treatment visualization (3:2 ratio)

### Step 4: Track & Optimize (implied by membership)
- Proactive tracking with membership
- "Discover how treatments and behaviors affect your microbiome"
- Image: Soft glow abstract visualization (3:2 ratio)

### Funnel Design Notes

- Steps are numbered with large "Step 1/2/3/4" labels
- Each step has an image + heading + description
- Horizontal layout on desktop, stacked on mobile
- Arrow/icon flow between steps
- CTA buttons throughout funnel path

---

## Quiz Conversion

### Homepage Quiz CTA

- **Placement:** Dedicated section after the 4-step funnel
- **Headline:** "How can Evvy help you?"
- **Copy:** "Take our quick 5-question quiz and we'll share personalized testing recommendations for how we can support your vaginal health — plus a personal discount!"
- **CTA:** "Take the Quiz" button (arrow icon)
- **Incentive:** $10 off (also promoted in announcement bar)

### Quiz Page (`/take-the-quiz`)

- Quiz is embedded/built on-page (not a third-party tool)
- Lead with testimonials: "75,000+ people take control"
- Product recommendations shown after quiz completion
- Cart integration: quiz feeds directly into product selection

### Quiz UX Pattern

- 5 questions (concise, not tedious)
- Personalization hook: "personalized testing recommendations"
- Discount incentive: "$10 off" for completion
- Low friction: embedded on site, no redirect
- Smart product routing: routes to Vaginal Health, Fertility, Menopause, or UTIs based on answers

---

## Photography & Visual Style

### Image Types

| Type | Style | Usage |
|------|-------|-------|
| Product photography | Clean, 3:2 ratio, on white/gradient backgrounds | Test kit, probiotic bottles |
| App/screenshots | Phone mockups showing results UI | Step 2 imagery |
| Abstract textures | Gradient textures, soft glow effects | Step 4, background overlays |
| Physician portraits | Circular headshot crops | Medical Advisory Board |
| Lifestyle | Warm-toned, soft focus, skin-forward | Product context shots |

### Visual Characteristics

- **Warm creme backgrounds** — never clinical white
- **Gradient textures** — Abstract gradient images (avif format) used as section backgrounds
- **Soft glow effects** — Warm, diffused lighting aesthetic
- **Product images** — Shot at 3:2 ratio, transparent/gradient backgrounds
- **No stock imagery** — Custom photography and illustrations throughout
- **Image format:** WebP and AVIF for performance, with srcset responsive sizing

### Icon System

- Custom SVG icons throughout (not an icon library)
- Arrow icons on all CTA buttons
- Checkmark icons for list items
- Star rating SVGs (5-star component)
- Numbered step indicators
- Small "Rx" badge icon for prescription products

---

## Key Design Patterns for Basys Health

### What Works Well

1. **Creme/warm neutral palette** — Far more inviting than clinical white. Communicates warmth without sacrificing professionalism.
2. **Nature-toned accent system** — Pine/mint/pond/frog greens + blue creates a botanical/scientific feel that's distinct from generic healthcare blue.
3. **Multi-accent component system** — `data-accent` attribute allows per-component color theming without CSS bloat. Each content block can have its own accent while maintaining brand cohesion.
4. **Step-by-step funnel visualization** — Large numbered steps with images makes the process tangible and reduces anxiety.
5. **Quiz as conversion tool** — 5 questions + discount incentive is a proven pattern. Routes users to the right product without overwhelming them.
6. **Advisory board social proof** — 11 named physicians with institutional affiliations is extremely powerful for medical credibility.
7. **Condition-specific routing** — Shop by Concern (Vaginal Health, Fertility, Menopause, UTIs) meets users where they are.
8. **Inclusive language** — "People with vaginas" alongside "women" broadens the audience without alienating.
9. **Email-gated sample report** — Klaviyo integration for lead capture in exchange for seeing what results look like.

### Patterns to Adapt

1. **Fluid type scale** — The `clamp()`-based typography system ensures readability at every viewport. Basys should implement similar.
2. **Component accent system** — Per-component accent colors via data attributes is cleaner than utility classes. Consider for Basys supplement/protocol theming.
3. **Test tier comparison** — Two clear tiers (basic + expanded) with pricing is simpler than a la carte. Consider for Basys test panels.
4. **Membership as default** — Subscribe & save as the primary CTA with one-time as secondary. Drives LTV.
5. **Cross-sell in product context** — Probiotics, suppositories shown as add-ons during test purchase flow.

### What to Avoid

1. **Too many accent colors** — 13 accent colors risks visual inconsistency if not carefully governed.
2. **Announcement bar redundancy** — Quiz CTA appears in announcement bar AND in-page; ensure only one prominent CTA per page.
3. **Webflow dependency** — Custom Webflow setup makes iteration expensive; Basys should use a more portable stack.

---

## Technical Notes

- **Platform:** Webflow (custom theme "evvy-v5")
- **CSS framework:** Custom property-driven design system (no Tailwind/Bootstrap)
- **E-commerce:** Shopyflow (Shopify x Webflow integration)
- **Email capture:** Klaviyo embedded forms
- **Analytics:** FullStory (`fs-scrolldisable`, `fs-event` attributes)
- **Image CDN:** Webflow CDN with srcset responsive sizing, AVIF/WebP format
- **Animations:** Custom `fx-underline`, `fx-scale` interaction attributes
- **Mobile nav:** Webflow dropdown system with scroll disable
- **Typography:** ABC Dinamo fonts (Intervariable, ABC Marist) — premium type foundry
- **Accessibility:** AA contrast swatches defined (`--swatch--aa-evvy-blue`, etc.)