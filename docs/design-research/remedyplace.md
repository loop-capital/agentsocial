# Remedy Place — Site Analysis

**URL:** https://www.remedyplace.com  
**Type:** Social Wellness Club (membership-based wellness)  
**Founded:** Dr. Jonathan Leary (concept in development since 2012, first club opened 2019)  
**Locations:** West Hollywood, SoHo (NYC), Flatiron (NYC), Boston (Seaport)  
**Analyzed:** 2026-04-18

---

## Design Agencies & Tech Stack

| Role | Agency/Firm |
|------|-------------|
| **Website Design & Dev** | **Boundary** (Los Angeles, CA) — boundaryla.com |
| **Brand Identity** | **Zero** (New York, zero.nyc) — philosophy-driven brand identity, worked closely with architectural team |
| **Interior Design** | **Bells + Whistles** (Los Angeles) — darker, moodier interior aesthetic replacing traditional wellness tropes |
| **Logo/Typography** | **Adrian Gilling Design** — custom typography referencing units of measurement; logo suite leans into scientific aspects |
| **CMS/CMS Platform** | **Sanity.io** (headless CMS) — all content structured via Sanity schemas |
| **Framework** | **Next.js** (React) — `__NEXT_DATA__` confirms Next.js SSR |
| **Booking Platform** | **Zenoti** — reservation/bookings via Zenoti webstore |
| **Email Marketing** | **Klaviyo** (form embed: `klaviyo-form-X3p3Xz`) |
| **Hosting** | Vercel (implied by Next.js stack) |

---

## Colors

| Token | Hex | Usage |
|-------|-----|-------|
| **Onyx** | `#1A1817` / `#141210` | Primary background — deep near-black |
| **Bone** | `#FEFAF1` / `#FDFAF1` | Primary text on dark, light accent |
| **Air** | `#ECECEA` / `#D0CDC5` | Secondary text, hover states |
| **Grey** | `#B7B2AB` / `#B9B2AA` | Borders, muted elements (used at 50% opacity) |
| **Warm Brown** | `#30251C` | Dark accent, secondary backgrounds |
| **Near-Black** | `#000000` | Footer/overlay base |

**Palette Character:** Near-monochrome with warm undertones. Dark, moody, luxury. The color system is deliberately restrained — almost no color at all. Warm bone/cream replaces pure white. Greys have warm brown undertones. This creates a cave-like, intimate atmosphere that mirrors the physical club interiors (Venetian plaster, grey-washed woods).

---

## Typography

| Usage | Font | Details |
|-------|------|---------|
| **Headings & Nav** | **Beausite Slick** (custom) | Class: `font-beausite-slick`. Used for all uppercase headings, nav items, card titles. A geometric sans-serif with tight spacing. Custom-designed for the brand, referencing "units of measurement" per the brand identity brief. |
| **Body Text** | System / sans-serif stack | Class: `font-light`, `tracking-wide`. Lightweight body copy. |

**Typographic Style:**
- **All headings are uppercase** — consistently throughout the site
- **Generous letter-spacing**: `tracking-[0.1em]` on nav, `tracking-[0.05em]` on footer
- **Light font weights** throughout (300 weight for body)
- **No serif fonts** — entirely sans-serif system
- **Scale is large** — hero text at `text-[3.3vw]`, section heads at `text-[36px]`
- **Limited text width**: `max-w-[720px]`, `max-w-[60ch]` for body prose

---

## Layout & Structure

### Page Sections (Homepage, top to bottom)

1. **Full-screen hero video** — Autoplaying background video with overlaid text "SELF-CARE MADE SOCIAL" and a "Reservations" CTA that opens a club-selector popup
2. **Mission statement** — Centered paragraph on dark background explaining the Social Wellness Club concept
3. **"Our Clubs" hover cards** — 4 cards (Boston/Seaport, Flatiron, SoHo, West Hollywood) with hover-reveal details and location overlines
4. **Decorative image grid** — 3 tall portrait images (masonry-style, rounded corners)
5. **"Remedy Categories" cards** — 4 category cards: Tech-Remedies, Alternative Medicine, Biometric Testing, Classes
6. **"Our Remedies" hero section** — Left-aligned text block with background image (darkened 60%), listing curated services by Dr. Leary
7. **Remedy detail cards** — 9 hover cards: Guided Ice Bath, Sauna Suites, Hyperbaric Chamber, Contrast Suites, Red Light Bed, Lymphatic Compression, AI Massage, Foam Bathing, Cryo, Acupuncture, Chiropractic
8. **Newsletter/Email signup** — Klaviyo-embedded form in footer
9. **Footer** — 4-column grid with navigation, social links, highlights, legal

### Layout System
- **Next.js + Tailwind CSS** — utility-first responsive classes throughout
- **Grid-based footer**: `lg:grid-cols-4`
- **Mobile-first** with responsive breakpoints at `md:` and `lg:`
- **Section styles**: `spacious`, `page-section`, `left-aligned`, `none`
- **Generous vertical spacing** — `mt-12 lg:mt-16`, `py-[2vw]`, `pb-[2vw]`
- **Max widths**: container utility for content centering
- **Rounded corners** on cards: `roundedCorners: true` throughout

---

## Luxury Wellness Aesthetic

### Overall Vibe
**Dark, moody, refined minimalism.** This is the antithesis of the bright, airy, white-washed wellness aesthetic. Remedy Place chose brutalist minimalism with warm, earthy undertones — cavernous and intimate, like a private club.

### Key Design Principles (from Boundary case study)
> "Every design decision was made with intention. From the first scroll to the final click, the experience needed to mirror the feeling of stepping into a Remedy Place: grounding, elegant, and effortlessly serene."
> 
> "We embraced a philosophy of refined minimalism. A monochrome palette, spacious layouts, and soft transitions created a sense of calm throughout."

### Visual Elements
- **Dark backgrounds everywhere** — `bg-onyx` (#1A1817) is the default, not white
- **Full-bleed imagery** — photos span edge to edge
- **Video hero** — cinematic, moody footage (not stock imagery)
- **Hover-reveal cards** — hover darkens images and reveals service descriptions
- **Image darkening overlays** — 20-60% programmatically applied via Sanity `imageSettings.darken`
- **Rounded corners** on all cards and images (consistent with modern luxury)
- **Minimal UI chrome** — no visible borders on most sections, content breathes
- **Soft transitions** — `duration-[2s] ease-out-expo` for hero animations

---

## Social Wellness Positioning

**Tagline:** "Self-Care Made Social" (registered trademark: Social Wellness Club®)

**Key Positioning Elements:**
- **Category creation** — explicitly states "We are not a spa, not a gym, we created a new category"
- **Science meets soul** — brand identity built on duality of clinical evidence + human connection
- **Founder authority** — Dr. Jonathan Leary, clinical background, 10+ years of evidence
- **Social dimension** — emphasis on socializing as part of wellness ("give you a healthier way to socialize")
- **Membership exclusivity** — club locations, private suites, curated experiences

**How Positioning Manifests on Site:**
- "Reservations" button (not "Book Now") — implies club, not spa
- Club selector popup with location names (Seaport, Flatiron, SoHo, West Hollywood)
- Group experiences highlighted (Foam Bathing for parties of 4-6)
- "Guided" services — ice bath breathwork, contrast therapy — social by nature
- "#6minuteclub" — community challenge language

---

## Service Presentation

### Card-Based Hover System
- Services displayed as **image cards** in a responsive grid/slider
- **Default state**: Full image with service name overlaid
- **Hover state**: Image darkens (20-40%), descriptive text fades in on back
- **CTA**: "Reserve" button triggers a club-selector popup
- **Two card sizes**: Standard (300×500) and Centered (380×360)

### Service Categories
1. **Tech-Remedies** — Ice Bath, Sauna, Hyperbaric, Contrast, Red Light, Lymphatic Compression, AI Massage, Cryo
2. **Alternative Medicine** — Acupuncture, Chiropractic
3. **Biometric Testing** — Clinical assessments
4. **Classes** — Group movement/breathwork sessions

### Service Descriptions
- Brief, benefit-focused copy (1-2 sentences per service)
- Written in second person ("your body," "you'll feel")
- Clinical language balanced with sensory language
- Example: "Push more oxygen into your body, enhancing the performance of every internal system"

---

## Location / Club Display

### Club Presentation
- 4 clubs displayed as hover cards in "Our Clubs" section
- Each card shows: **City overline** + **Neighborhood name** + **High-quality interior photo**
- Locations: Boston (Seaport), NYC (Flatiron), NYC (SoHo), LA (West Hollywood)
- Individual club pages at `/clubs/[slug]`
- All booking funneled through location-specific Zenoti URLs

### Interior Photography
- **Professional architectural photography** — shot by interior design photographers
- Warm, dim, moody lighting in all club images
- Materials visible: Venetian plaster, dark wood, stone, leather
- Spaces look intimate, not cavernous (despite being "cavernous retreat" per press)
- No people in most architectural shots — spaces speak for themselves

---

## Booking Flow

### Reservation UX
1. **CTA appears** as "Reservations" button (hero) or "Reserve" on service cards
2. **Popup opens** with "Select a Club" heading
3. **Location buttons** for each applicable club (varies by service)
4. **Redirects to Zenoti webstore** — external booking platform
5. Some services use `reserve.remedyplace.com` subdomain, others `remedyplace.zenoti.com`

### Booking Characteristics
- **No inline booking** — all booking happens off-site on Zenoti
- **No pricing displayed** on website
- **No membership tiers** visible on homepage
- **Service-specific availability** — not all services at all clubs
- **Klaviyo email capture** in footer for lead nurturing

---

## Brand Voice

**Tone:** Confident, authoritative, restrained. Clinical meets luxury hospitality.

**Voice Characteristics:**
- Short, declarative sentences: "We are not a spa, not a gym"
- Scientific authority: "rooted in evidence," "backed by over a decade of clinical experience"
- Second-person intimacy: "help you feel better," "give you a healthier way to socialize"
- No exclamation points — calm, not excited
- Trademark symbols used liberally (®, ™) — brand protection is important
- Uppercase headings throughout — assertive, not whispering
- Sparse body copy — doesn't over-explain, trusts the reader

**Copy Examples:**
- "Self-Care Made Social" (hero tagline)
- "Where self-care meets connection" (secondary tagline)
- "Every Remedy is rooted in evidence and backed by over a decade of our own clinical experience" (authority)
- "Living a healthy lifestyle no longer means being isolated" (emotional benefit)

---

## Photography Style

### Visual Direction
- **Dark, moody, editorial** — high contrast, low-key lighting
- **Warm color temperature** — amber/warm undertones throughout
- **No bright white spaces** in photography — everything exists in shadow
- **Architectural focus** — spaces, not people (or people as silhouettes)
- **Texture-forward** — Venetian plaster, leather, wood grain all featured prominently
- **Custom photography** — not stock; clearly shot specifically for the brand

### Image Treatment
- **Darkening overlays**: 10-60% on all background images (controlled via CMS)
- **Responsive image sizing** — `srcSet` with multiple breakpoints via Next.js Image
- **LQIP blur placeholders** — base64 blur previews for perceived loading speed
- **Rounded corners** on all card images
- **Cinematic aspect ratios** — 16:9 for heroes, mixed ratios for service cards

---

## Key Takeaways for Basys Health

| Remedy Place Pattern | Basys Health Applicability |
|----------------------|---------------------------|
| Dark luxury aesthetic | Consider a moody palette instead of clinical white — differentiates from typical health sites |
| Hover-reveal service cards | Interactive service exploration pattern works well for health services |
| Location-first booking | If multi-location, make location selection central to the flow |
| Video hero | Cinematic hero content creates emotional connection before any text |
| Science + Soul positioning | Balance clinical authority with human warmth in brand voice |
| Custom typography | Bespoke typeface creates instant brand recognition — consider investment |
| Image darkening system | Programmatic overlay control via CMS allows flexible mood adjustment |
| No pricing on site | Premium/exclusive positioning — pricing is discussed after interest is captured |
| Klaviyo email capture | Footer email form for lead nurturing before booking |
| Sanity headless CMS | Structured content management enables flexible page composition |

---

## Architecture Notes

- **Next.js SSR** with `__NEXT_DATA__` hydration
- **Sanity.io** as headless CMS with `jptxcgmn` project ID
- **Tailwind CSS** utility-first styling
- **Custom Tailwind theme** with named colors (bone, air, onyx, grey)
- **Custom font**: `font-beausite-slick` (loaded via CSS)
- **Zenoti** for booking/ecommerce
- **Klaviyo** for email marketing
- **Sanity image pipeline** with blur placeholders, responsive sizing, and hotspot/crop controls
- **Component architecture**: `heroWithCta`, `hoverCardSection`, `decorativeImageGrid` — modular CMS-driven sections
- **Page structure** defined entirely in Sanity (content types, not hard-coded pages)

