# Function Health — Site Analysis

**URL:** https://www.functionhealth.com  
**Analyzed:** 2026-04-18  
**Platform:** Webflow (custom Lucid framework)  
**Title Tag:** Function | 100 Healthy Years

---

## 1. Color Palette

| Token / Usage | Hex | Role |
|---|---|---|
| `--color-core--beige` | `#fef9ef` | Primary background — warm parchment/ivory |
| `--color-core--cream` | `#f5eee1` | Secondary background, card fills, gradient fades |
| `--color-core--midnight` | implied dark | Deep text/contrast (near-black) |
| `--color-core--orange` | `#b05a36` | **Primary accent** — warm terracotta/burnt sienna |
| `--color-core--blue` | `#488ad5` | Secondary accent (links, interactive) |
| `--color-core--green` | implied | Accent state (success, toggles) |
| `--color-core--gray` | implied | Section backgrounds |
| `#2a2b2f` | `#2a2b2f` | Primary text color (near-black with warm undertone) |
| `#3c3d42` | `#3c3d42` | Secondary text |
| `#758696` | `#758696` | Muted/grey text |
| `#808988` | `#808988` | Subtle text |
| `#fef9ef` | `#fef9ef` | SVG icon fill, light accent (same as beige) |
| `#f4c69d` | (gradient) | Warm glow overlay `rgba(244,198,157,0.55)` |
| `#4ecdc4` | (debug) | Teal accent in debug palette |
| `#ff6b6b` | (debug) | Coral accent in debug palette |

**Key takeaway:** The palette is warm-cream dominant with a single terracotta accent (`#b05a36`). No cold blues or clinical greens. This feels more artisan/luxury than medical.

---

## 2. Typography

| Font | Usage | Weight |
|---|---|---|
| **Financier Display** | Headlines, section titles, hero text | Light (300), Light Italic |
| **FT Base (Ftbase)** | Body copy, UI text, buttons | Book (400) |
| **Fragment Mono** | Monospace contexts (test names, data, code-like elements) | Regular |
| **Open Sans** | Fallback / supplementary body | 300–800 |
| **PT Serif** | Fallback serif | 400, 700 |

**Custom webfont preloading:** Financier Display Light (woff2), Financier Display Light Italic (woff2), FT Base Book (ttf) — all preloaded for performance.

**Typography hierarchy:**
- Hero headlines: Financier Display Light, large scale, tight line-height (1.1)
- Section headings: Financier Display, medium scale
- Body: FT Base / Open Sans, 150% line-height for readability
- Data labels: Fragment Mono for scientific/medical precision feel
- Italic emphasis used heavily in headlines (e.g., "_100 Healthy Years_")

**Key takeaway:** High-contrast serif/sans-serif pairing (Financier Display + FT Base). The editorial serif gives a premium, magazine-like quality. Mono font signals scientific precision.

---

## 3. Layout & Structure

### Page Flow (Homepage)
1. **Gift banner** (top strip) — HSA/FSA promotion, link to signup
2. **Glassmorphic navigation** — Sticky, blur backdrop, transparent initially, cream on scroll
3. **Hero: "Testing is easy"** — 3-step numbered flow (01/02/03)
4. **Disease marquee** — Auto-scrolling disease names in a horizontal band
5. **Lab tests by category** — 5-column biomarker grid (Hormones, Cancer, Heart, Aging, Mental Health)
6. **"The new standard"** — Social proof section with celebrity endorsements
7. **Real people stories** — Case study cards (Aimee, Alan, Geoff, Catherine)
8. **Gold standard / scale** — 2,000+ locations, 50M+ results stats
9. **Comparison table** — Function vs. standard checkup feature matrix
10. **Medical board** — Headshots + credentials (Harvard, Stanford, Cleveland Clinic, etc.)
11. **Pricing** — $499/year ($42/month anchor), HSA/FSA eligible
12. **Footer** — Standard links

### Layout Patterns
- **Full-bleed sections** with container max-width (~1200px)
- **CSS Grid** for biomarker categories (5-column on desktop)
- **Horizontal scroll** for disease marquee
- **Lottie animations** for scroll-triggered "Tracked over a lifetime" section
- **Swiper/carousel** for testimonials
- **Glassmorphic nav** with `backdrop-filter: blur()`

---

## 4. Medical Intelligence Lab Presentation

### How They Present Lab Data
- **Categorized by body system** (Hormones & Thyroid, Cancer & Silent Risks, Heart & Metabolic, Aging, Mental Health & Focus)
- **Biomarker count badges** — Each category shows a count (16, 34, 18, 26, 36) with a small test-tube SVG icon
- **Individual biomarkers** listed as grey text items within each category card
- **Scientific naming** — Full clinical names (e.g., "Apolipoprotein B (ApoB)", "Methylmalonic Acid (MMA) (B12 Proxy)", "MTHFR, DNA")
- **Disease scanning** — Names of 1,000s of diseases shown as a scrolling ticker/marquee, creating a sense of comprehensive coverage
- **No numerical ranges on homepage** — They keep data visualization behind the login/signup wall

### Visual Treatment of Medical Content
- Test names use **Fragment Mono** (monospace) for a lab-report aesthetic
- Category cards have **subtle dividers** between sections
- "Biomarker" label with test-tube icon (terracotta `#b05a36`)
- Clean grid layout avoids information overload despite 160+ tests
- Disease names in the marquee use a **pause-on-hover interaction** ("pause motion" control visible)

---

## 5. Data Visualization Approach

### On-Site
- **Animated Lottie** for "Tracked over a lifetime" section — scroll-triggered
- **Number counters** (2,000+ locations, 50M+ results) with animated count-up
- **Disease marquee** — continuous horizontal scroll of condition names
- **Test-tube SVG icons** as category markers
- **SVG illustrations** for feature icons (play button, pause, mute, waveform — audio/visual metaphors for health data)

### Behind Login (implied by structure)
- Longitudinal tracking graphs (referenced but not shown publicly)
- Biomarker trend lines over time
- Protocol/action plans

**Key takeaway:** Homepage uses motion and typography as substitutes for actual data visualization. The real data viz lives inside the app. The marquee creates a feeling of overwhelming comprehensiveness without showing a single chart.

---

## 6. Premium Positioning Strategy

### Price Anchoring
- **$15,000** stated value → **$499** actual price (30x discount anchor)
- **$42/day** reframing (monthly budgeting psychology)
- **HSA/FSA eligible** — reduces perceived cost barrier
- **No insurance needed** — positions as premium/direct, not insurance-dependent

### Luxury Signals
- **Financier Display font** — editorial, high-end magazine feel
- **Warm cream/beige palette** — avoids clinical white/sterile aesthetic
- **Terracotta accent** — warm, artisan, not "tech blue"
- **Whitespace-heavy layout** — premium brands breathe
- **Custom Lottie animations** — not stock, feels bespoke
- **"Discerning generation"** language — targets affluent, health-conscious consumer

### Authority Building
- **Medical board** with Harvard, Stanford, Cleveland Clinic, Columbia, UCSF, Memorial Sloan Kettering, NYU credentials
- **Mark Hyman MD** — CMO and prominent quote placement
- **Andrew Huberman PhD** — celebrity endorsement
- **Jay Shetty** — wellness influencer endorsement
- **Real patient stories** — named individuals with specific health outcomes
- **Quest Diagnostics** partnership — 2,000+ locations = legitimacy

---

## 7. Trust Signals

| Signal | Implementation |
|---|---|
| **Medical advisory board** | 8 named doctors with institution affiliations |
| **Quest Diagnostics** | "2,000+ locations" with count-up animation |
| **"50M+ results delivered"** | Social proof stat |
| **Celebrity endorsements** | Huberman, Shetty, Baya Voce, Mari Llewellyn |
| **Real patient outcomes** | Aimee (cancer), Alan (diabetes), Geoff (prostate), Catherine (can't diet/exercise away) |
| **HSA/FSA badge** | Top banner + pricing section |
| **No insurance needed** | Removes friction, adds transparency signal |
| **"Gold standard for lab testing"** | Explicit claim with partner logos implied |

---

## 8. Investor Credibility Signals

- **Intellimize** integration (A/B testing platform, indicates growth-stage company)
- **Freshpaint** analytics (enterprise-grade analytics)
- **Mixpanel** tracking
- **Decagon AI** (customer service AI)
- **Vercel Blob Storage** for custom JS framework (modern infra)
- **Custom "Lucid" framework** — indicates significant engineering investment
- **Webflow Enterprise** — CDN with integrity hashes, staging environments
- **SaaSquatch** referral integration (growth hacking infrastructure)
- **Utm-access-code mapping** — sophisticated attribution tracking per channel (Meta, Google, YouTube, Reddit, TikTok, Pinterest, Twitter, Bing, etc.)

---

## 9. Technical Implementation Notes

| Element | Detail |
|---|---|
| **CMS** | Webflow with custom Lucid JS framework |
| **Hosting** | Webflow CDN (cdn.prod.website-files.com) |
| **A/B Testing** | Intellimize (customer ID 117724261) |
| **Analytics** | Freshpaint + Mixpanel |
| **Support AI** | Decagon |
| **Referral** | SaaSquatch |
| **Fonts** | Google Fonts (Open Sans, PT Serif) + custom (Financier Display, FT Base, Fragment Mono) |
| **Animations** | Lottie (scroll-triggered), GSAP ScrollTrigger |
| **CSS Architecture** | CSS custom properties with design tokens (`--color-core--*`, `--text-fill-stroke--*`, `--font-families--*`) |
| **Mobile** | Responsive with mobile burger menu, separate mobile nav component |
| **Variable swapping** | Dynamic pricing ($365/$499) via `data-variable-swap` attributes |

---

## 10. Key Takeaways for Basys Health

1. **Warm palette wins** — Cream/beige + terracotta feels premium and approachable, not clinical. Avoid sterile white/blue.
2. **Serif + sans-serif pairing** — Editorial font (like Financier Display) immediately elevates perceived quality.
3. **Category-based lab presentation** — Group biomarkers by body system, show counts, use mono font for scientific names.
4. **Price anchoring is essential** — Show the "would cost $X" before revealing the actual price.
5. **Celebrity + medical board = dual trust** — Combine famous faces with real clinical credentials.
6. **Disease marquee creates urgency** — Scrolling condition names makes the offering feel comprehensive without showing actual data.
7. **HSA/FSA prominently featured** — Reduces price objection and adds legitimacy.
8. **Behind-login data viz** — Keep the impressive charts inside the app; homepage sells the concept, not the interface.
9. **Custom framework investment** — Function built their own "Lucid" JS framework, indicating the level of polish expected in this space.
10. **Monospace for medical credibility** — Fragment Mono on test names signals precision and scientific rigor.