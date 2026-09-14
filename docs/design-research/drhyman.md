# DrHyman.com — Site Design Analysis

**URL:** https://drhyman.com  
**Platform:** Shopify (custom theme)  
**Date Analyzed:** 2026-04-18  
**Category:** Health Professional / Functional Medicine  

---

## Color Palette

| Scheme | Background | Foreground | Use |
|--------|-----------|------------|-----|
| Primary (scheme-1) | `#FFFFFF` | `rgb(60,61,66)` (#3C3D42) | Rich text, main content sections |
| Warm Gray (scheme-2) | `#F7F7F7` | `rgb(60,61,66)` | Image+text sections, featured collections |
| Dark Charcoal (scheme-3) | `rgb(60,61,66)` | `#FFFFFF` | Hero banner, footer |
| Dark Alt (scheme-4) | `rgb(60,61,66)` | `#FFFFFF` | Content library section |
| Muted Blue-Gray (scheme-5) | `rgb(106,119,132)` (#6A7784) | `#FFFFFF` | Accent sections |
| Warm Beige (scheme-6) | `rgb(233,230,228)` (#E9E6E4) | `#000000` | Subtle warm backgrounds |
| **Terracotta (scheme-7)** | `rgb(192,120,88)` (#C07858) | `rgb(254,249,239)` (#FEF9EF) | **Brand accent — warm, earthy health tone** |
| Sage Green (scheme-8) | `rgb(152,163,155)` (#98A39B) | `#FFFFFF` | Health/nature accent |
| Mauve (scheme-9) | `rgb(136,118,119)` (#887677) | `#FFFFFF` | Accent |
| Gold (scheme-10) | `rgb(219,196,134)` (#DBC486) | `rgb(60,61,66)` | Premium/warm accent |
| Cream (scheme-11) | `rgb(254,249,239)` (#FEF9EF) | `rgb(60,61,66)` | Light warm background |
| **Deep Forest Green (scheme-12)** | `rgb(44,74,61)` (#2C4A3D) | `#FFFFFF` | **Authority/health green** |
| Black (scheme-13) | `#000000` | `#FFFFFF` | Dark accent |
| Deep Charcoal (scheme-4 variant) | `rgb(60,61,66)` | `#FFFFFF` | Footer alt |

### Primary Palette Summary
- **Primary Text:** `#3C3D42` (dark charcoal)
- **White:** `#FFFFFF` (clean backgrounds, dark-mode text)
- **Brand Accent 1:** `#C07858` (warm terracotta — wellness, earth, warmth)
- **Brand Accent 2:** `#2C4A3D` (deep forest green — health, trust, nature)
- **Warm Neutral:** `#E9E6E4` (warm beige) and `#FEF9EF` (cream)
- **Gold Accent:** `#DBC486` (premium, authority)
- **Button Primary:** Dark charcoal bg / white text
- **Button Secondary:** White bg / dark text

---

## Typography

| Element | Font | Weight | Scale |
|---------|------|--------|-------|
| **Body** | General Sans, Helvetica Neue, Arial, Lucida Grande, sans-serif | 400 | 1.0 |
| **Headings** | General Sans (same family) | 400 | 1.0 |
| **Bold/Headings** | General Sans | 500, 600 | — |
| **Italic** | General Sans Italic | 400, 600 | — |

**Key observations:**
- Single typeface family (General Sans) for both headings and body — clean, modern, minimal
- Variable weight (400/500/600) creates hierarchy instead of mixing typefaces
- Geometric sans-serif style — approachable yet authoritative
- `font-display: swap` for performance
- No serif anywhere — entirely sans-serif system

---

## Layout & Section Order

1. **Announcement Bar** — "Save 20% on ALL supplements when you sign up for the Hyman Hive TODAY!" (promo banner, color-scheme-1)
2. **Sticky Header** — Logo left, nav links (Content Library, Function Health, Private Practice, Food Fix, Supplements, Programs dropdown, About dropdown), account/search/cart icons. Sticky type: always.
3. **Hero Banner (Video)** — Full-width autoplay muted video background (16:9). Overlay text centered: "Personalized, 360 *functional medicine* for your well-being" + subline + two CTAs ("Content Library" primary, "Shop Supplements" secondary). Color-scheme-3 (dark charcoal bg, white text).
4. **Image + Text (Dr. Hyman Portrait)** — Left: headshot image. Right: "Ask AI Mark" section — AI chat tool trained on Hyman's books/podcasts/clinical experience. Delphi AI integration (chatbot widget). Color-scheme-1.
5. **Multicolumn — "Awards & Press"** — 3-column card grid with logos/badges. Color-scheme-1.
6. **Multicolumn — "The Dr. Hyman Show"** — 3-column podcast cards with images. Color-scheme-2.
7. **Rich Text — "15x NYTimes Best Seller"** — Book promotion section. Color-scheme-1.
8. **Multicolumn — "The UltraWellness Center"** — 3-column cards for private practice. Color-scheme-2.
9. **Image + Text (Function Health App)** — Reversed layout (image right). "Join Function Health: 100+ lab tests" with 4-step how-it-works. Color-scheme-2.
10. **Content Library / Blog** — "What topics are you interested in learning about?" with topic tags (Trending, Longevity, Brain Health, Gut Health, etc.). Blog post grid. Color-scheme-4 (dark bg).
11. **Featured Collections (Supplements)** — Product cards for supplements (Berberine, Magnesium, etc.) linked to supp.co. Slider layout.
12. **Multicolumn — "Vitamin Shop"** — Another supplement category section.
13. **Multicolumn — "Symptom Questionnaire"** — Interactive assessment CTA.
14. **Sticky CTA** — Collapsed sticky bottom bar (color-scheme-1).
15. **Footer** — Dark (color-scheme-3). Navigation, social links (Facebook, Instagram, Pinterest, YouTube, Twitter/X), disclaimer text, copyright "© 2026, Hyman Enterprises LLC", legal links.

---

## Content Structure & Strategy

### Authority Positioning
- **MD credential** front and center in title tag: "Mark Hyman, MD | Physician | Advocate | Educator"
- **"The most trusted name in functional medicine"** — hero subline claims authority explicitly
- **15x NY Times Best Seller** — dedicated section with visual emphasis
- **"Awards & Press"** — media credibility logos/badges (multicolumn)
- **The UltraWellness Center** — private practice section reinforces clinical authority
- **AI Chatbot ("Ask AI Mark")** — trained on his own content, positions brand as a knowledge authority

### Podcast Integration
- **"The Dr. Hyman Show"** — dedicated multicolumn section with 44+ podcast references in source
- YouTube channel linked (youtube.com/user/ultrawellness)
- Podcast episodes appear as content cards in the library
- Tagged `/blogs/content/tagged/podcast` for filtering

### Book Promotion
- **"15x NYTimes Best Seller"** — standalone section
- Specific books referenced: "Young Forever", "The Blood Sugar Solution", "Food Fix", "10-Day Detox"
- Books tied to programs (10-Day Detox has its own landing page at /pages/10-day-detox)

### E-Commerce (Supplements)
- Shopify-powered product catalog
- Supplements section in nav + dedicated shop page
- Products linked to supp.co (third-party fulfillment)
- Supplement stacks featured: Anxiety, Fitness & Performance, Foundational Nutritional Support, Longevity & Biohacking
- Featured slider with product cards

### Lead Generation
- **Function Health partnership** — "100+ lab tests" with 4-step funnel (Lab test → Get results → Take action → Retest)
- **Hyman Hive membership** — promoted in announcement bar (20% discount)
- **Symptom Questionnaire** — interactive assessment CTA
- **AI Mark chatbot** — Delphi-powered AI engagement tool
- **Newsletter** — footer signup (minimal, not prominently placed)

---

## Credibility Signals

1. **MD credential** in site title and throughout
2. **15x NY Times Best Seller** badge — most prominent book claim
3. **Awards & Press** section with media logos
4. **The UltraWellness Center** — real clinical practice
5. **YouTube channel** with dedicated URL
6. **Social proof** — 5 social media accounts (Facebook, Instagram, Pinterest, YouTube, X/Twitter)
7. **Disclaimer** — full legal disclaimer in footer, "not medical advice" — professional responsibility signal
8. **Function Health partnership** — lab testing with "2,000+ locations"
9. **AI-powered tool** — trained on proprietary content, tech-forward positioning

---

## Design Patterns Worth Noting for Basys Health

### What Works Well
1. **Warm earth tones** (terracotta, sage, cream) — feels health-oriented without being clinical. The palette avoids cold blues/greens.
2. **Single typeface** (General Sans) — clean, modern, reduces visual noise
3. **Video hero** — immediately engaging, shows the human behind the brand
4. **AI chatbot integration** — modern trust-building tool, leverages proprietary content
5. **4-step funnel** (Function Health) — clear, actionable path from curiosity to commitment
6. **Topic-based content library** — tagged filtering makes content discoverable
7. **Dark hero + light content** — creates visual contrast and draws the eye down the page
8. **Sticky header** — always accessible navigation

### What Could Improve
1. **Footer newsletter is buried** — no prominent email capture above the fold
2. **14 color schemes** defined — many unused in practice; palette is complex
3. **No testimonials section** on homepage — missed social proof opportunity
4. **Supplement cards link externally** (supp.co) — takes users off-site
5. **Mobile nav drawer** — standard Shopify approach, nothing innovative

### Transferable Elements for Basys Health
- **Terracotta/cream palette** — warm, human, not clinical
- **AI chatbot** for health Q&A — very on-brand for personalized health
- **4-step how-it-works** pattern — perfect for supplement protocols
- **Topic-tagged content library** — scalable content discovery
- **Disclaimer in footer** — important for health platforms
- **Video hero** — personal connection with founder/practitioner
- **Supplement stacks** as product bundles — mirrors Basys Health protocol model

---

## Technical Notes

- **Platform:** Shopify (custom theme, theme ID 66)
- **CSS Framework:** Shopify Dawn-based with extensive custom CSS overrides
- **Animations:** `scroll-trigger animate--fade-in` and `animate--slide-in` (intersection observer-based)
- **AI Chatbot:** Delphi (delphi.ai) — config UUID: `b5420176-0a29-42ae-9e6d-7b17bde0097f`
- **Email Marketing:** Klaviyo integration
- **Payments:** Shopify portable wallets, Shop Pay
- **Responsive:** Mobile-first with `749px` and `1250px` breakpoints
- **Content max-width:** `88rem` (≈1408px)
- **Image loading:** Lazy load with responsive srcset (165w to 1500w)
- **Video:** HTML5 native player, autoplay/muted/loop, 720p MP4
- **Border radius on images:** Custom `20px` on multicolumn cards (warm, rounded feel)

---

## Summary Score Card

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Visual Hierarchy | ★★★★☆ | Clear section flow, strong hero, good contrast |
| Authority & Trust | ★★★★★ | MD credential, bestseller badge, press section, clinical practice |
| Conversion Design | ★★★☆☆ | Weak email capture, good supplement CTAs, AI engagement |
| Content Strategy | ★★★★☆ | Strong topic library, podcast integration, blog depth |
| Mobile Experience | ★★★☆☆ | Standard Shopify mobile, drawer nav, nothing special |
| Brand Personality | ★★★★☆ | Warm, professional, approachable, not sterile |
| Health Credibility | ★★★★★ | Full medical disclaimer, real practice, lab partnership |

**Overall:** Top-tier health authority site. Strongest in credibility positioning and content depth. Weakest in lead capture and mobile innovation. The warm color palette and AI chatbot are standout differentiators.
