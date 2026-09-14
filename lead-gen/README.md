# COLORgenius Lead Generation — Columbus Pilot

## Quick Start

```bash
# 1. Search-based discovery (works without Chrome)
cd lead-gen && source ../.venv-leads/bin/activate
python3 search_scraper.py --city "Columbus Ohio" --output output/discovery.csv

# 2. IG email enrichment (requires Chrome + OpenCLI extension + IG login)
python3 ig_email_pipeline.py output/columbus_colorists_enriched.csv output/with_emails.csv

# 3. Booth rental site scraper (Playwright, for when sites are accessible)
python3 booth_scraper.py --city "Columbus" --output output/booth_rentals.csv
```

## Pipeline Architecture

```
Discovery (search_scraper.py)
  ├── Google/Bing site: searches → profile URLs
  ├── ScrapeGraph MCP extract → contact info from profiles  
  └── Playwright headless → for JS-rendered pages
       │
Enrichment (ig_email_pipeline.py)
  ├── OpenCLI Instagram → bio emails, follower counts, business status
  ├── GlossGenius/StyleSeat contact pages → form contact (no email)
  ├── Web search → personal websites, Yelp, LinkedIn
  └── Playwright → Sola/Salon Lofts/MSS profile pages
```

## Current Results — Columbus Pilot (Aug 2026)

**17 qualified leads** after removing 3 non-Columbus entries:
- Caitlin Orlinsky → Woodbridge, VA (removed)
- Hailey Hartglass → Smithtown, NY (removed)  
- Catherine Dougherty → appears to have moved to Charlotte, NC (flagged)

### Email Coverage

| Source | Emails Found | Method |
|--------|-------------|--------|
| True Salon (My Salon Suite) | 1 | Direct extraction from profile page |
| Instagram bios | 0 | Blocked — requires logged-in browser |
| GlossGenius contact pages | 0 | Forms only, no exposed emails |
| Salon Lofts profiles | 0 | Phone numbers only |
| Sola Salon profiles | 0 | Booking widgets only |
| Personal websites | 0 | Contact forms only (GlossGenius) |

**Total: 1 email out of 17 leads (5.9%)**

### What We Have Instead of Emails

| Contact Method | Count | Details |
|----------------|-------|---------|
| Phone numbers | 4 | Christine Chamcess (614-309-4008), Lisa Scalamonti (614-323-5836), Abigail Hale (614-506-1128), Kari Viers (614-918-7618), Hannah Godown (937-216-6469) |
| Instagram handles | 5 | @christinechamglam, @hair_by_kassy, @kimberlyloomis, @hair_by_kassy (duplicate), plus others TBD |
| Booking websites | 6 | StyleSeat, GlossGenius (2), Yelp (2), Sola booking, Salon Lofts booking |
| Personal websites | 2 | truesalon.co (404), kimberlyloomis.glossgenius.com |
| Yelp listings | 2 | Kari V, Kassy Ross, Christine Chamness |

### Next Steps for Email Acquisition

1. **OpenCLI IG enrichment** — Run `ig_email_pipeline.py` when Chrome is open on PC2 with IG login
2. **Instagram DM outreach** — For high-value tier 1 leads, reach out via DM instead of email
3. **Phone call outreach** — 5 leads have direct phone numbers
4. **Contact form submission** — GlossGenius and StyleSeat have contact forms that relay messages
5. **Booking page cold outreach** — Book a consultation through the platform's booking system

## Files

- `output/columbus_colorists_final.csv` — Clean 17-lead list (primary)
- `output/columbus_colorists_enriched.csv` — With all enrichment data
- `output/columbus_leads_initial.csv` — Raw discovery results (20 leads, pre-filtering)
- `lead_scraper.py` — Original ScrapeGraphAI-based scraper (slow, requires local LLM)
- `booth_scraper.py` — Playwright-based booth rental site scraper (sites timeout)
- `search_scraper.py` — Search-based discovery scraper (recommended approach)
- `enrich_leads.py` — Multi-source email enrichment (ScrapeGraph SDK, credits-based)
- `ig_email_pipeline.py` — Instagram email extraction via OpenCLI (requires Chrome + IG login)

## Tier Definitions

| Tier | Label | Criteria | Outreach Priority |
|------|-------|----------|-------------------|
| 1 | tier1_colorist | Color specialist (balayage, highlights, color correction) | HIGH — core COLORgenius demo |
| 2 | tier2_stylist | General stylist with color services | MEDIUM — good for volume |
| 3 | tier3_nail_skin | Nail tech / esthetician | LOW — not core target |
| 4 | tier4_general | General beauty / unspecified | LOW — may not be good fit |

## Booth Rental Platforms in Columbus

| Platform | Locations | Profile Approach |
|----------|-----------|-----------------|
| Salon Lofts | Grandview, Clintonville, Upper Arlington, Dublin, German Village, Short North | Direct profile URLs work |
| Sola Salon Studios | Dublin, Polaris, Westerville, Worthington, Hilliard, Easton | JS-heavy, need Playwright |
| My Salon Suite | Clintonville, Hilliard | Direct profile URLs work |
| Phenix Suite Salon | Columbus | Site down / 404 |