# AgentSocial — Marketing Readiness Report

**Date:** May 14, 2026  
**Status:** Content built, pages compile, ready for deployment review

---

## ✅ Completed

### 1. Pricing Page (`/pricing`)
- **3 tiers:** Starter ($29/mo), Pro ($99/mo), Enterprise ($299/mo)
- Full feature comparison table (17 features across all tiers)
- Interactive FAQ accordion (8 questions)
- 30-day money-back guarantee section
- CTA banners linking to `/register` and `/contact`
- Server Component architecture (interactive parts extracted to client component)
- OpenGraph metadata for social sharing

### 2. Contact Page (`/contact`)
- Contact form with 6 fields: First Name, Last Name, Email, Company, Reason (dropdown), Plan Interest (dropdown), Message
- Form reason options: Sales, Support, Partnership, Enterprise, Press, Other
- Plan interest options: Starter, Pro, Enterprise, Not sure yet
- Success state after form submission
- Contact method cards: Email, Live Chat, Response Time
- Sidebar with quick links to Pricing, Compare, and Free Trial
- Enterprise CTA card
- FAQ section (5 contact-specific questions)
- OpenGraph metadata

### 3. 30-Day Content Calendar (`CONTENT_CALENDAR_30DAY.md`)
- **4 weeks** of daily content across 7 platforms
- **Week 1:** Awareness — "You're Doing Social Wrong" (bold hooks, pain points)
- **Week 2:** Education — "How AI Social Media Actually Works" (product demos, transparency)
- **Week 3:** Social Proof — "Real Results from Real Businesses" (testimonials, metrics)
- **Week 4:** Conversion — "Start Your Free Trial Today" (urgency, CTAs)
- **Days 29-30:** Final conversion sprint
- Evergreen content templates (7 templates)
- Hashtag strategy per platform
- Automation notes (scheduling, AI generation, Clipify, analytics)
- Success metrics table (weekly + 30-day targets)

### 4. Bug Fix: Compare Page
- Fixed existing `useState` error in `/compare` page by extracting interactive components (`PricingTierToggle`, `CompareFAQ`) into client components
- All three marketing pages now properly follow Next.js App Router server/client component patterns

---

## ⚠️ Still Needed Before Deployment

### Backend / API
- [ ] **Contact form submission endpoint** — Currently client-side only (sets `submitted` state). Need a `/api/contact` route to actually send emails/store submissions
- [ ] **Stripe/payment integration** — Pricing page CTAs link to `/register?plan=...` but no payment flow exists yet
- [ ] **Trial management** — 14-day free trial mechanism (no credit card required) needs backend logic

### Content / Marketing
- [ ] **Testimonials for pricing page** — Compare page has Zoca-specific testimonials; pricing page needs AgentSocial-branded ones
- [ ] **Blog/SEO content** — Content calendar assumes content creation capacity; need writers or AI pipeline
- [ ] **Email drip sequences** — Calendar drives trial sign-ups but no onboarding email series exists
- [ ] **Screenshot/video assets** — Content calendar references screen recordings and demos that need to be produced

### Technical
- [ ] **Navigation header/footer** — Marketing pages currently have individual footers but no shared nav/header component linking `/`, `/pricing`, `/contact`, `/compare`
- [ ] **Analytics tracking** — No GA4/PostHog events on pricing CTA clicks, contact form submissions
- [ ] **A/B testing** — Content calendar mentions testing CTA variants but no framework exists
- [ ] **Social sharing images** — OpenGraph tags reference URLs but no og:image assets generated
- [ ] **Legal pages** — Privacy Policy and Terms of Service linked from contact form but not created

---

## File Inventory

| File | Description | Lines |
|------|-------------|-------|
| `packages/web/app/(marketing)/pricing/page.tsx` | Pricing page (server component) | ~440 |
| `packages/web/app/(marketing)/pricing/faq-accordion.tsx` | Client component for FAQ accordion | ~80 |
| `packages/web/app/(marketing)/contact/page.tsx` | Contact page (server component) | ~310 |
| `packages/web/app/(marketing)/contact/contact-components.tsx` | Client components (form + FAQ) | ~170 |
| `packages/web/app/(marketing)/compare/compare-components.tsx` | Client components (fix for compare page) | ~240 |
| `CONTENT_CALENDAR_30DAY.md` | 30-day social media content calendar | ~350 |

---

## Architecture Notes

All marketing pages follow the same pattern:
- **Page file** = Server Component (handles metadata, static content)
- **Client component file** = `"use client"` directive for interactive parts (FAQ accordions, forms, toggles)
- This pattern is required by Next.js App Router and avoids the `useState` in Server Component error