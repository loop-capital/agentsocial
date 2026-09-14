# AgentSocial Onboarding Survey — v1

## Based on OmniSocial qualification questions, adapted for local businesses/salons

### Step 1: Contact Info
- First Name *
- Last Name *
- Business Name *
- Phone *
- Email *
- Business Address (for local SEO)

### Step 2: Business Profile
- Business Type * (dropdown)
  - Hair Salon / Barbershop
  - Nail Studio
  - Skin / Med Spa
  - Massage / Wellness
  - Fitness / Yoga Studio
  - Restaurant / Cafe
  - Retail
  - Professional Services
  - Other
- Years in Business * (dropdown)
  - Pre-launch (not open yet)
  - 0-2 years
  - 3-5 years
  - 6-10 years
  - 10+ years
- Number of Locations * (dropdown)
  - 1
  - 2-3
  - 4-5
  - 6+
- Annual Revenue Range * (dropdown)
  - Under $100K
  - $100K - $499K
  - $500K - $1M
  - $1M - $5M
  - $5M+
- Revenue Goal for Next 12 Months * (dropdown)
  - Double my current revenue
  - Hit consistent $50K/month
  - Cross $100K/month
  - Cross $500K/year
  - $1M+ per year

### Step 3: Current Presence & Pain
- How do most of your customers find you? * (select up to 2)
  - Walk-ins / drive-by
  - Referrals / word of mouth
  - Google Search
  - Social media (IG, FB, TikTok)
  - Ads (Google, Meta, etc.)
  - Reviews (Google, Yelp)
  - My website
  - Other
- What's your biggest marketing challenge right now? * (select up to 2)
  - Not enough new customers finding me
  - Existing customers don't come back often enough
  - I don't have time to post on social media
  - My social media doesn't turn followers into bookings
  - Negative or no Google reviews
  - My website is outdated or I don't have one
  - I'm spending on ads but not seeing ROI
  - I don't know what to post or say
  - Other
- How often do you post on social media? * (dropdown)
  - Never
  - 1-4 times per month
  - 1-2 times per week
  - 3-5 times per week
  - Daily or more
- Which platforms are you on? * (checkboxes)
  - Instagram
  - Facebook
  - TikTok
  - Google Business Profile
  - YouTube
  - X / Twitter
  - Pinterest
  - None yet
- Do you currently use any of these? * (checkboxes)
  - Booking software (Vagaro, Booksy, Square, etc.)
  - Email marketing (Mailchimp, etc.)
  - Review management tool
  - Social media scheduler (Buffer, Later, etc.)
  - Google Ads / Meta Ads
  - None of these

### Step 4: Goals & Magic Wand
- What would make this a success for you? * (open text, 500 chars)
- If you could wave a magic wand and change one thing about your marketing, what would it be? * (open text, 500 chars)
- How did you hear about AgentSocial? (optional dropdown)
- SMS consent checkbox + Privacy Policy + Terms

## Implementation Notes
- Use our existing 4-step onboarding wizard as the base
- Add these questions as "enhanced" onboarding after signup
- Survey data feeds into: content engine training, GBP setup, review strategy, ad targeting
- Revenue question enables tier recommendation (Core vs Pro vs Elite)
- Business type + location enables local SEO and competitor analysis
- Current tools question identifies integration opportunities (Composio connectors)

## Difference from OmniSocial Survey
- We ask about **walk-ins** and **drive-by** (they don't — they target online-only coaches)
- We ask about **number of locations** (they don't — they target solopreneurs)
- We ask about **booking software** (they don't — they don't integrate with any)
- We ask about **Google Business Profile** (they don't — no local SEO play)
- We ask about **reviews** (they don't — no review management)
- We ask about **website** as a pain point (they offer GHL pages only)
- We don't gate behind a call — self-serve signup with smart tier recommendation