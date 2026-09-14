# SpamSuit Landing Page

## Quick Start

```bash
cd web/spamsuit-landing
npm install
npm run dev
```

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

## Structure

```
src/app/
  layout.tsx    - Root layout (Inter font, metadata)
  page.tsx      - Main landing page
  globals.css   - Tailwind + custom utilities
```

## Sections

1. **Nav** - Fixed top bar with "Report Spam" CTA
2. **Hero** - "Getting unwanted texts?" + SMS forwarder
3. **How It Works** - 3-step process (Report → Validate → Get Paid)
4. **The Numbers** - $500-$1,500 per violation, $0 cost
5. **What Counts** - Common TCPA violations list
6. **CTA** - Dark section with report@spamsuit.co
7. **FAQ** - Common questions answered
8. **Footer** - Privacy, Terms, Contact links

## Colors

- Teal: #2A9D8F (trust, action)
- Coral: #E76F51 (urgency, CTA)
- Charcoal: #1A1A1A (text)
- White: #FFFFFF (background)

## Next Steps

- [ ] Add SMS upload form (Twilio integration)
- [ ] Add attorney portal link
- [ ] Connect to Supabase for report storage
- [ ] Add analytics (Vercel Analytics)
- [ ] Privacy policy page
- [ ] Terms of service page