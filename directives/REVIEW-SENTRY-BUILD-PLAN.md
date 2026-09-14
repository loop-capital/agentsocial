# Review Sentry — Review Gating & Solicitation Tool

## Product Overview
Review Sentry is a review gating and solicitation tool that maximizes positive public reviews while capturing negative feedback privately. It integrates with AgentSocial's existing platform and the GBP API.

## How Review Gating Works

### Customer Flow
1. Customer receives link via SMS/email/QR after appointment
2. They land on a branded landing page with star rating widget
3. They click 1-5 stars:
   - **4-5 stars →** Redirected to the business's actual Google Review page (public positive review)
   - **1-3 stars →** Routed to internal feedback form (private, goes to business owner/manager)
4. Happy customers boost the public rating
5. Unhappy customers get their issues addressed privately before they go public

### Why It's Legal
- Google has **no policy** against review gating or solicitation
- Yelp **explicitly prohibits** review gating — we only use this for Google
- The customer is never deceived — they're giving a real review either way
- This is the same system Podium ($60B valuation), Birdeye, and Reputation.com use

## Architecture

### Components

#### 1. Landing Page (Next.js)
- Branded review collection page at `review.agentsocial.com/{business-slug}`
- Mobile-first design (90%+ of reviews come from phones)
- Star rating widget with smooth animation
- Business logo, name, and photo from GBP data
- Dynamic routing based on business slug

#### 2. Review Router
```
Customer clicks stars:
  if rating >= 4:
    → Show "Thanks! Share your experience on Google?"
    → Button links to: https://search.google.com/local/writereview?placeid={PLACE_ID}
    → Also offer: "Share on Facebook" / "Share on Yelp" (optional)
  if rating <= 3:
    → Show "We're sorry to hear that. Tell us more so we can make it right."
    → Display internal feedback form (name, email, details, photos)
    → Submit sends to: business owner email + AgentSocial dashboard
    → Optional: auto-respond with apology + discount/rebooking offer
```

#### 3. SMS/Email Dispatcher
- Triggered after appointment completion (manual or via booking system webhook)
- Sends personalized message: "Hi [Name]! How was your visit to [Salon]? [Rate us ★★★★★]"
- Link contains unique token to track: who, when, which appointment
- Tracks: sent, opened, rated, redirected (conversion funnel)

#### 4. Dashboard (AgentSocial Web App)
- Review funnel analytics: sent → opened → rated → redirected → posted
- Negative feedback inbox with response templates
- Auto-response rules for negative feedback
- Review velocity tracking (reviews/week, average rating trend)
- Competitor benchmarking (rating comparison)

#### 5. GBP Integration
- Auto-generates Google Review link using Place ID
- Pulls current rating and review count for tracking
- Posts AI-drafted review responses (once API approved)
- Monitors for new reviews and alerts on negatives

### Tech Stack
- **Frontend:** Next.js 14 + Tailwind (existing AgentSocial stack)
- **Backend:** packages/api (existing Express server on port 3002)
- **Database:** Supabase (existing, new tables)
- **SMS:** Twilio (already configured for voice agent)
- **Email:** SendGrid or Resend
- **Hosting:** Vercel (frontend) + existing API server

### Database Schema (New Tables)

```sql
-- Review campaigns (per business)
CREATE TABLE review_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  google_place_id TEXT,
  google_review_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review requests sent to customers
CREATE TABLE review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES review_campaigns(id),
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  appointment_date DATE,
  token UUID UNIQUE DEFAULT gen_random_uuid(),
  status TEXT DEFAULT 'sent', -- sent, opened, rated, redirected, feedback_submitted
  rating SMALLINT, -- 1-5 stars if rated
  redirected_to TEXT, -- 'google', 'facebook', 'yelp'
  feedback TEXT, -- negative feedback content
  created_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  rated_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ
);

-- Review responses (AI-drafted)
CREATE TABLE review_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id),
  review_text TEXT,
  review_rating SMALLINT,
  review_author TEXT,
  review_date TIMESTAMPTZ,
  response_draft TEXT, -- AI-generated response
  response_final TEXT, -- edited/approved response
  status TEXT DEFAULT 'draft', -- draft, approved, posted, skipped
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Endpoints

```
POST   /api/v1/review-sentry/campaigns          — Create review campaign
GET    /api/v1/review-sentry/campaigns/:id       — Get campaign details
PATCH  /api/v1/review-sentry/campaigns/:id       — Update campaign
DELETE /api/v1/review-sentry/campaigns/:id       — Deactivate campaign

POST   /api/v1/review-sentry/requests             — Send review request (SMS/email)
GET    /api/v1/review-sentry/requests/:token       — Landing page data (public)
POST   /api/v1/review-sentry/requests/:token/rate — Customer rates (1-5 stars)
POST   /api/v1/review-sentry/requests/:token/feedback — Submit negative feedback

GET    /api/v1/review-sentry/dashboard/:brand_id  — Dashboard analytics
GET    /api/v1/review-sentry/responses             — List pending responses
POST   /api/v1/review-sentry/responses/:id/approve — Approve AI response
POST   /api/v1/review-sentry/responses/:id/post    — Post approved response to GBP

POST   /api/v1/review-sentry/removal/flag          — Flag a review for removal
GET    /api/v1/review-sentry/removal/cases          — List removal cases
POST   /api/v1/review-sentry/removal/cases/:id/evidence — Upload evidence
POST   /api/v1/review-sentry/removal/cases/:id/escalate  — Escalate to GBP Support
```

### Landing Page Design

```
┌─────────────────────────────────────┐
│         [Business Logo]             │
│      PLEIJ Salon & Spa             │
│   ★ ★ ★ ★ ★                       │
│   How was your experience?         │
│                                     │
│   [1] [2] [3] [4] [5] ← stars     │
│                                     │
│   Powered by AgentSocial            │
└─────────────────────────────────────┘

IF 4-5 stars:
┌─────────────────────────────────────┐
│      Thank you, [Name]! 🎉          │
│                                     │
│   We're so glad you had a great     │
│   experience! Would you mind         │
│   sharing it on Google?             │
│                                     │
│   [Leave Google Review →]           │
│                                     │
│   Reviews help small businesses     │
│   like ours so much! 🙏             │
└─────────────────────────────────────┘

IF 1-3 stars:
┌─────────────────────────────────────┐
│   We're sorry to hear that 😔       │
│                                     │
│   Your feedback helps us improve.   │
│   Tell us more about what happened: │
│                                     │
│   Name: [____________]              │
│   Email: [____________]             │
│   What happened:                    │
│   [____________________________]    │
│   [____________________________]    │
│                                     │
│   [Submit Feedback]                 │
│                                     │
│   We'll follow up within 24 hours.  │
└─────────────────────────────────────┘
```

## Review Flagging & Removal Service

### Dashboard for Flagging
- Pull all reviews from GBP API (once approved)
- AI classifies each review for violation type:
  - Spam/fake: no profile, no history, template text
  - Conflict of interest: competitor, ex-employee
  - Off-topic: political rants, wrong business
  - Harassment: personal attacks, threats
  - Personal info: phone numbers, addresses
- One-click flag with pre-built evidence file
- Track flag status through Google's review process
- Escalation workflow when flag is denied

### Evidence Builder
- Auto-generate evidence package:
  - Screenshot of review + reviewer profile
  - Customer record match/no-match from CRM
  - LinkedIn cross-reference for employment check
  - Reverse image search on profile photo
  - Review pattern analysis (same-day accounts, clustering)
- Attach to escalation ticket
- Track case through resolution

## Pricing (Review Management Suite)

| Tier | Monthly | Included |
|------|---------|----------|
| **Review Sentry** | $49/mo | Gating, solicitation SMS, feedback capture |
| **Review Response** | $99/mo | AI responses within 24h, all platforms |
| **Review Guard** | $199/mo | Monitoring, flagging, evidence builder, escalation |
| **Full Stack** | $299/mo | Everything above + dashboard + analytics |

Plus one-time removal fees:
- Per review flag + escalation: $99
- Per defamation legal filing: $399

## Build Priority

1. **Review Gating Landing Page** (3-4 days) — Core product, can demo immediately
2. **SMS/Email Dispatcher** (2-3 days) — Twilio integration, send after appointments
3. **Negative Feedback Dashboard** (2-3 days) — Internal inbox for unhappy customers
4. **GBP Review Pull + AI Classification** (3-4 days) — Once API approved
5. **Flagging + Evidence Builder** (3-4 days) — Semi-automated review removal
6. **Dashboard Analytics** (2-3 days) — Conversion funnel, rating trends

**Total estimate: 15-21 days to full product**

## PLEIJ Salon as First Customer

- Google Place ID: ChIJd_aB0mf0OIgRSkIlGEBnpBo
- Current rating: 4.6 (274 reviews, ~24 one-star)
- Goal: Flag removable violations, respond to legit complaints, gate new reviews
- Expected impact: Remove 3-5 one-star reviews → 4.7+ rating within 60 days