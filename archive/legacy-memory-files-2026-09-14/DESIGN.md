---
name: AgentSocial
description: Social content automation platform with integrated website builder. Professional, trustworthy, and modern.
colors:
  primary: "#1A1C1E"
  secondary: "#6C7278"
  tertiary: "#2563EB"
  accent: "#10B981"
  surface: "#FFFFFF"
  surface-alt: "#F9FAFB"
  on-primary: "#FFFFFF"
  on-secondary: "#FFFFFF"
  on-tertiary: "#FFFFFF"
  on-accent: "#FFFFFF"
  on-surface: "#1A1C1E"
  on-surface-alt: "#6C7278"
  success: "#10B981"
  warning: "#F59E0B"
  error: "#EF4444"
  border: "#E5E7EB"
  border-focus: "#2563EB"
typography:
  h1:
    fontFamily: Inter
    fontSize: 3rem
    fontWeight: "700"
    lineHeight: "1.1"
    letterSpacing: "-0.02em"
  h2:
    fontFamily: Inter
    fontSize: 2.25rem
    fontWeight: "600"
    lineHeight: "1.2"
    letterSpacing: "-0.01em"
  h3:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: "600"
    lineHeight: "1.3"
  h4:
    fontFamily: Inter
    fontSize: 1.25rem
    fontWeight: "600"
    lineHeight: "1.4"
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: "400"
    lineHeight: "1.6"
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: "400"
    lineHeight: "1.6"
  body-sm:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: "400"
    lineHeight: "1.5"
  label:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: "600"
    lineHeight: "1.5"
    letterSpacing: "0.05em"
    fontFeature: '"calt", "kern"'
  caption:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: "400"
    lineHeight: "1.4"
    fontFeature: '"calt", "kern"'
  mono:
    fontFamily: JetBrains Mono
    fontSize: 0.875rem
    fontWeight: "400"
    lineHeight: "1.6"
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  4xl: 96px
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    rounded: "{rounded.lg}"
    padding: 12px 24px
    typography: "{typography.body-md}"
  button-primary-hover:
    backgroundColor: "#1D4ED8"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.tertiary}"
    rounded: "{rounded.lg}"
    padding: 12px 24px
  button-secondary-hover:
    backgroundColor: "#EFF6FF"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 8px 16px
  button-ghost-hover:
    backgroundColor: "{colors.surface-alt}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
  card-elevated:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 12px 16px
    height: 44px
  input-focus:
    borderColor: "{colors.border-focus}"
  badge:
    backgroundColor: "#EFF6FF"
    textColor: "{colors.tertiary}"
    rounded: "{rounded.full}"
    padding: 4px 12px
    typography: "{typography.label}"
  badge-success:
    backgroundColor: "#D1FAE5"
    textColor: "#065F46"
  badge-error:
    backgroundColor: "#FEE2E2"
    textColor: "#991B1B"
  nav-link:
    textColor: "{colors.on-surface-alt}"
    typography: "{typography.body-md}"
  nav-link-active:
    textColor: "{colors.tertiary}"
  nav-link-hover:
    textColor: "{colors.on-surface}"
---

## Overview

AgentSocial is a professional social content automation platform with an integrated website builder. The visual identity balances **trust and capability** — clean enough for business users, modern enough for creators. The UI draws from editorial minimalism with purposeful accent color usage. Every surface breathes; no element crowds another.

## Colors

The palette uses a deep ink primary for authority, with electric blue (tertiary) as the primary action color. Green accents signal growth and success — core to the platform's value proposition of growing social presence.

- **Primary (#1A1C1E):** Deep ink for headlines, core text, and dark surfaces.
- **Secondary (#6C7278):** Slate for captions, borders, metadata, and disabled states.
- **Tertiary (#2563EB):** Electric blue — the primary action color for CTAs, links, and active states.
- **Accent (#10B981):** Emerald green for success states, growth metrics, and positive reinforcement.
- **Surface (#FFFFFF):** Clean white canvas for content areas.
- **Surface-alt (#F9FAFB):** Subtle gray for background sections and card fills.

An agent reading this file should produce a UI with deep ink headlines in Inter, a clean white canvas, electric blue primary buttons, and emerald green success indicators.

## Typography

Inter is the workhorse — readable at every size, professional at every weight. JetBrains Mono for code and data. The type scale uses tight tracking on headlines for editorial density and generous line-height on body text for readability.

- **Headlines (h1–h4):** Inter, semibold/bold, tight tracking, generous size jumps between levels.
- **Body:** Inter regular, 1.6 line-height for comfortable reading.
- **Labels:** Inter semibold, all-caps tracking, small size — for badges, tags, and section headers.
- **Mono:** JetBrains Mono for code snippets, API keys, and data tables.

## Layout

Content max-width: 1200px for pages, 800px for prose-heavy sections. 12-column grid. Section padding: 96px vertical (4xl), 64px for compact sections. Card grids use 24px gaps. Mobile collapses to single column with 32px horizontal padding.

## Elevation & Depth

Two elevation levels only — flat cards and elevated cards. Flat cards use border only (#E5E7EB 1px). Elevated cards use a subtle shadow: `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)`. No heavy drop shadows. Modals and popovers use: `0 10px 25px rgba(0,0,0,0.15)`.

## Shapes

- Buttons: 12px radius (lg) — rounded but not pill-shaped.
- Cards: 16px radius (xl) — modern and approachable.
- Inputs: 8px radius (md) — slightly rounded to feel friendly.
- Badges/pills: Full radius (9999px).
- Small elements (tags, toggles): 4px radius (sm).

## Components

### Buttons
Primary buttons are electric blue with white text. Secondary buttons are outlined with blue text on hover fill. Ghost buttons have no border and subtle background on hover. All buttons have 44px minimum touch target.

### Cards
Cards use white backgrounds with subtle borders or shadows. Content cards are flat. Feature cards are elevated. All cards have xl (16px) rounding and lg (24px) padding.

### Inputs
Clean white backgrounds, 1px gray border (#E5E7EB). Focus state switches to blue border (#2563EB) with a subtle blue ring. 44px height for comfortable tapping.

### Navigation
Top navigation uses ghost links in slate, with the active item in electric blue. Sidebar navigation uses the same pattern with a subtle background fill on hover.

## Do's and Don'ts

### ✅ Do
- Use electric blue sparingly — only for primary actions and active states
- Leave generous whitespace between sections
- Use emerald green exclusively for success, growth, and positive metrics
- Keep headlines tight-tracked and body text generous
- Use rounded xl cards for content containers
- Pair deep ink text on white/light backgrounds for maximum readability

### ❌ Don't
- Use electric blue for large background fills — it's an accent, not a surface
- Mix more than 3 colors in a single component
- Use emerald green for error or warning states
- Crowd content — every section needs breathing room
- Apply heavy shadows to multiple nested levels
- Use decorative gradients — AgentSocial is clean and purposeful

## Responsive Behavior

- **Desktop (1200px+):** Full layout, sidebar visible, multi-column grids
- **Tablet (768–1199px):** Sidebar collapses to icons, 2-column grids
- **Mobile (<768px):** Single column, bottom navigation, stacked cards, 32px horizontal padding
- Touch targets minimum 44px on all interactive elements
- Typography scales down one step on mobile (h1 → h2 size, etc.)