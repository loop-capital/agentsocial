# Booth Rental Professional Lead Pipeline

**Created:** 2026-09-03
**Status:** Planning
**Owner:** AgentSocial-CEO

---

## Target Market

Booth rental professionals — salon owners who rent chairs/suites to independent beauty pros — are ideal AgentSocial Pro/Elite customers because:

- They're **already entrepreneurs** (comfortable with SaaS subscriptions)
- They manage **social media for their own brand** + often help renters with theirs
- They need **review management, booking, GBP, and content** (our exact Pro tier)
- Average booth rental salon has **3-10 chairs**, each renter is a potential upsell
- 12,000+ on SalonRenter alone; MeetSpa, SalonSpaConnection add thousands more

## Lead Sources

### Directory Sites (scrape for salon names, addresses, contact info)

| Site | URL | Est. Listings | Data Available |
|------|-----|---------------|----------------|
| SalonRenter | salonrenter.com | 4,000+ | Salon name, city, price, listing URL |
| MeetSpa | meetspa.net | 200+ | Salon name, city, category, price, listing URL |
| SalonSpaConnection | salonspaconnection.com/jobs/ | 500+ | Job/board listings, salon names |
| Phenix Salon Suites | phenixsalonsuites.com | 150+ locations | Franchise locations, owner info |
| Sola Salon Studios | solasalonstudios.com | 500+ locations | Franchise locations |
| My Salon Suite | mysalonsuite.com | 200+ locations | Franchise locations |

### Enrichment Pipeline (treg)

Once we have salon names and domains, use treg to:

1. **Find owner emails** — `treg call hunter.people.email.find` or `tomba.people.email.find` ($0.0089/email)
2. **Enrich company data** — `treg call crustdata.companies.enrich` ($0.010/company)
3. **Verify emails** — `treg call hunter.email.verify` ($0.003/check)
4. **Find mobile numbers** — `treg call people.phone.find` (3 providers, routed)
5. **Search by role** — `treg call apollo.people.search` — "salon owner", "booth rental", "suite owner"

### Search Strategy (via treg)

```bash
# Install & authenticate
treg login                                    # browser auth
treg mcp install                              # MCP server for agents

# Discover people-search tools
treg catalog search "find salon owner email"
treg catalog search "beauty industry enrichment"

# Find verified emails for booth rental salon owners
treg call hunter.people.email.find \
  --query domain=phenixsalonsuites.com \
  --query full_name="Sarah Johnson"

# Find people by role at a company
treg call apollo.people.search \
  --query titles="Owner" \
  --query organization_name="Phenix Salon Suites"

# Verify before outreach
treg call hunter.email.verify \
  --query email="owner@salonname.com"

# Company enrichment (size, revenue, social links)
treg call crustdata.companies.enrich \
  --query domain="salonname.com"
```

## Cost Model

| Action | Provider | Cost | Volume Needed |
|--------|----------|------|---------------|
| Find work email | Tomba | $0.0089 | ~5,000 leads |
| Verify email | Hunter | $0.003 | ~5,000 leads |
| Company enrich | Crustdata | $0.010 | ~2,000 companies |
| Mobile number | Routed | ~$0.05 | ~1,000 hot leads |
| **Total for 5K leads** | | **~$65** | |

Compare: Apollo alone = $59/mo for 1 seat. Hunter = $34/mo. We get both + 58 more providers for pennies per call.

## Outreach Strategy

### Phase 1: Directory Scraping (Week 1)
- Scrape SalonRenter, MeetSpa, SalonSpaConnection for salon names + URLs
- Extract domain names, city/state, listing details
- Target: **2,000-5,000 salon records**

### Phase 2: Email Enrichment (Week 1-2)
- Run treg people.email.find on each salon domain
- Verify emails with treg email.verify
- Company enrichment for domain + social links
- Target: **1,500-3,000 verified owner emails**

### Phase 3: Outreach Campaigns (Week 2+)
- Cold email sequences via Mailchimp (already have cli-anything-mailchimp)
- Segmented by: franchise vs independent, city size, number of chairs
- A/B test subject lines: "Fill your empty chairs" vs "More renters, less hassle"

### Phase 4: Pipeline Integration
- Build AgentSocial Lead model in Supabase
- Auto-import enriched leads
- CRM integration (Zernio contacts API)
- Track: sent → opened → replied → demo → closed

## Data Schema (Supabase)

```sql
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_name TEXT NOT NULL,
  domain TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  owner_name TEXT,
  owner_email TEXT,
  owner_email_verified BOOLEAN DEFAULT FALSE,
  owner_phone TEXT,
  num_chairs INTEGER,
  source TEXT, -- 'salonrenter', 'meetspa', 'apollo', etc.
  source_url TEXT,
  category TEXT[], -- '{hair_salon,barber,nail,med_spa}'
  tier TEXT, -- 'franchise', 'independent', 'suite_rental'
  enrichment_data JSONB,
  outreach_status TEXT DEFAULT 'new', -- new, contacted, responded, demo, closed, lost
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Integration with AgentSocial

- **Pro Tier ($199/mo):** GBP management, review monitoring, social scheduling — perfect for booth rental owners
- **Elite Tier ($499/mo):** Full DFY + ads, multi-location support — for franchise owners (Phenix, Sola, My Salon Suite)
- **Pitch angle:** "We help you fill empty chairs AND manage your online presence — so renters find YOU"

## Next Steps

- [ ] Set up treg account and add credits ($10 to start)
- [ ] Scrape SalonRenter for all US listings
- [ ] Scrape MeetSpa for listings
- [ ] Build lead enrichment pipeline script
- [ ] Create leads table in Supabase
- [ ] Write cold email templates for booth rental owners
- [ ] Set up Mailchimp campaign sequence
- [ ] Test treg email finding on 10 salon domains