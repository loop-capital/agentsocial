# Review Sentry + ClientVet — Product Specification

## Mission
Give beauty and wellness professionals a shield against fake reviews, serial complainers, and review extortion. The current system is rigged against small businesses — Google does nothing to protect them. We fix that.

## The Problem
- Google's review system is entirely one-sided
- Bots, competitors, and disgruntled ex-employees can destroy a business with fake 1-star reviews
- Google's automated flagging system denies legitimate removal requests 60-70% of the time
- Business owners have zero visibility into whether a new client is a serial complainer
- There is no consequence for leaving fake or malicious reviews
- Current "reputation management" companies charge $500-2,000/review and use shady tactics

## Product Architecture

### Module 1: Review Sentry (Review Gating & Solicitation)

**What it does:** Intercepts customer reviews before they hit Google. Happy customers go public. Unhappy customers get routed to private feedback.

**How it works:**
1. After appointment, customer gets SMS: "How was your visit? ★★★★★"
2. They click link → branded landing page (NOT Google)
3. 4-5 stars → redirect to actual Google Review page
4. 1-3 stars → internal feedback form (never hits Google)

**Legal status:** 100% legal on Google. Yelp prohibits gating — we only gate for Google.

**Build time:** 3-4 days for landing page + routing

### Module 2: Review Shield (Review Removal & Defense)

**What it does:** When a bad review does hit, we fight back automatically.

**Sub-features:**

#### Review Ring Detector
When a business gets a bad review, our system automatically:
- Scrapes the reviewer's public Google profile
- Checks: How many 1-star reviews has this person left?
- Checks: Are they leaving negative reviews for multiple salons in the same area?
- Checks: Was this account created recently? Does it have a profile photo?
- Cross-references: Is this person in our UpLook client database?
- Flags patterns: "This account left 5 negative reviews for Columbus salons in 48 hours"

#### Auto-Dispute Generator
- Pulls all evidence automatically
- Generates the exact legal/ToS escalation language
- Pre-fills the Google appeal with the specific violation category + evidence
- One-click submit to Google
- Tracks case status through resolution
- If denied, auto-escalates with additional evidence

#### Public Counter-Response
- AI drafts a professional public response that neutralizes the review
- Example: "Our records show no appointment under this name. We take all feedback seriously, but this appears to be from a non-client. We have filed a dispute with Google."
- Makes other potential customers see that the business fights back

**Build time:** 5-7 days (after GBP API approval)

### Module 3: ClientVet (Client Screening & Ratings)

**What it does:** Lets professionals rate clients and screen new bookings for risk. This is the "flip side" — if customers can rate businesses, businesses should be able to rate customers.

#### Phase 1: Private Internal Notes (Zero Legal Risk)
- Stylist flags client as "Do Not Book" or "High Risk" in their own system
- Never leaves their business account
- No data sharing, no defamation risk, no FCRA concerns
- This is what every business already does mentally — we just systematize it

#### Phase 2: Behavioral Booking Flags + Client Abuse Tracking (Objective Data Only)
Instead of subjective ratings, we flag objective booking behaviors and client abuse patterns:

**Appointment abuse:**
- **No-show rate:** "This client has no-showed 3 out of their last 5 bookings"
- **Late cancel rate:** "Cancelled within 2 hours of appointment 4 times this month"
- **Booking velocity:** "Booked and cancelled at 5 different salons in 48 hours" (bot/competitor pattern)

**Financial abuse:**
- **Chargeback history:** "Filed chargebacks after 2 of 3 appointments"
- **Refund abuse:** "Requested refunds on 4 of their last 6 purchases"
- **Product return fraud:** "Returned 3 products in 30 days, each time after visible use"
- **Dilution/swap detection:** "Product returned with visible dilution or different consistency than sold" (photo evidence captured at return)
- **Free service extraction:** "Received 3 complimentary redo services in 6 months, each time threatening bad reviews"

**Review abuse:**
- **Serial negative reviewer:** "Left 1-star reviews at 4 different salons in the last 90 days"
- **Review extortion:** "Threatened bad review unless service was comped" (documented in booking notes)
- **Review after refund:** "Posted 1-star review 2 days after receiving full refund"

**Deposit requirement flow (Square integration):**
When a flagged client books, the system auto-requires Square prepayment before confirmation:
- Low risk: No deposit required
- Medium risk (1-2 flags): 50% deposit required
- High risk (3+ flags): 100% prepayment required
- Fraud confirmed: Booking declined, deposit-only service offered
- Ties into existing Square billing integration
- Deposit is released as credit toward service on completion
- No-show = deposit forfeited (configurable per business)

These are hard facts, not opinions. No defamation liability.

#### Phase 3: Closed-Loop Peer Network (The Game Changer)
- Professionals rate clients after verified appointments only
- Ratings are double-blind: the client never sees their score
- Other businesses see aggregate only: "Client Rating: 2.5/5 from 3 professionals"
- The system NEVER tells a business to deny service
- It surfaces data: "This client has a low rating from other pros" — business makes the call
- Required: deposit/prepayment for flagged clients (not denial of service)

#### Phase 4: The Blocklist + Abuse Tracking
- If a client is flagged for ANY abuse pattern at Salon A (review fraud, chargeback, product return fraud, free service extraction, refund extortion)
- Their phone, email, and device ID are flagged in UpLook
- If they try to book at Salon B, Salon B gets a specific alert with the abuse type:
  - "⚠️ High Risk: Review manipulation flagged at partner salon"
  - "⚠️ High Risk: 3 chargebacks in 6 months at partner locations"
  - "⚠️ High Risk: Product return fraud (dilution/swap) confirmed at partner salon"
  - "⚠️ High Risk: Free service extraction pattern (3 comped services via review threats)"
- Salon B can require 100% prepayment, decline the booking, or accept with caution
- This is NOT a public blacklist — it's a private network among verified professionals

**Abuse categories tracked:**

| Category | Flag | Auto-Action |
|----------|------|-------------|
| No-show | 1 in 90 days, 2+ in 180 days | 50% deposit required |
| Negative reviews | 1 in past 30 days, 2+ in 90 days across network | Alert on booking |
| Review extortion | Threatened bad review for free service | 100% prepayment required |
| Chargeback after service | Filed chargeback after appointment | 100% prepayment required |
| Product return fraud | Returned diluted/swapped product | No product sales, service only |
| Refund abuse | 2+ refunds in 90 days | No refund policy, credit only |
| Free service extraction | 2+ comped services via complaints | Decline booking |

### Design Principles (Navigating Legal Landmines)

**Section 230 CDA:** We stay a platform, not a content creator. We don't tell businesses "don't serve this person." We surface data. The business decides.

**FCRA:** We do NOT aggregate consumer data into a "credit score." We track booking behaviors (no-shows, cancellations) and let professionals leave private notes. This is like Yelp for consumers — same concept, reversed direction.

**Discrimination:** Ratings must be based on objective booking behaviors and transactional data, not protected characteristics. We enforce this in the UI — you rate "reliability" and "professionalism," not "likeability."

**Google ToS:** We don't scrape Google at scale. We check individual reviewer profiles when a business receives a review — this is standard practice and legal.

### Pricing

| Product | Price | Notes |
|---------|-------|-------|
| Review Sentry (gating + solicitation) | Included in Pro/Elite | Core feature, not upsell |
| Review Shield (removal + defense) | $99/removal or included in Elite | Flagging, evidence, escalation |
| ClientVet (screening) | Included in Pro/Elite | Network effect moat |
| Full Stack | Pro $199/mo, Elite $499/mo | Everything included |

Review Sentry and ClientVet are NOT upsells — they're built into the platform. We're selling protection, not nickel-and-diming.

### Competitive Moat

No other platform offers this combination:
- **Podium** ($60B) — does review gating, no client screening, no review defense
- **Birdeye** — does review management, no client ratings, no removal service
- **Reputation.com** — enterprise only, $500+/mo, no client screening
- **Yelp** — actively hostile to businesses, no defense tools
- **Google** — protects reviewers, ignores businesses

We're the only platform that gives professionals BOTH offense (solicitation + gating) AND defense (removal + screening).

### Build Priority

1. **Review Sentry landing page + gating** — ✅ BUILT (3-4 days, demo immediately)
2. **SMS dispatcher** — 2-3 days, Twilio integration
3. **Square deposit flow** — 2-3 days, auto-require deposits for flagged clients
4. **Review Shield: Ring Detector** — 3-4 days, auto-analyze incoming negative reviews
5. **Review Shield: Auto-Dispute** — 3-4 days, generate appeal templates
6. **ClientVet Phase 1: Private notes** — 2-3 days, internal flags per business
7. **ClientVet Phase 2: Behavioral flags + abuse tracking** — 4-5 days, no-show/cancel/chargeback/refund/product return/review extortion
8. **ClientVet Phase 3: Peer network** — 5-7 days, cross-business ratings
9. **ClientVet Phase 4: Blocklist** — 3-4 days, cross-network alerts

**Total: 30-40 days to full product suite**

---

*This is about giving small business owners a fighting chance against a system that's rigged against them. Google doesn't protect these people. We do.*