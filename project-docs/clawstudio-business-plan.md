# ClawStudio Business Plan

## Company Overview

**Name:** ClawStudio LLC
**Website:** ClawStudio.co
**Product:** AI Voice Receptionist for Salons & Spas
**Model:** Hardware + SaaS (Self-hosted on Mac Mini)

## Problem

62% of salon calls go unanswered. Missed calls = missed appointments = lost revenue ($25,000+/year for small salons).

## Solution

Local AI receptionist that runs on a Mac Mini in the salon:
- Answers calls 24/7
- Books appointments
- Handles cancellations
- Sends SMS confirmations
- Speaks naturally (voice cloning)
- Works offline (no internet dependency)

## Pricing

| Component | Price | Notes |
|-----------|-------|-------|
| **Mac Mini Hardware** | $599 | One-time purchase, salon owns it |
| **Setup & Configuration** | $299 | One-time (waived for pilot) |
| **Monthly Service** | $59/mo | Unlimited calls, updates, support |
| **Annual Discount** | $49/mo | $588/year (save $120 vs monthly) |
| **Trial Period** | 30 days | Free, full features |

## Unit Economics

**Per Salon:**
- Hardware cost: $599 (retail, we buy at ~$499 wholesale)
- Setup time: 2-3 hours ($150 labor cost)
- Monthly revenue: $59
- Monthly gross margin: ~$50 (after support costs)
- Break-even: 12 months
- LTV (3-year): $2,124
- CAC: ~$200 (marketing + setup)
- LTV/CAC ratio: 10.6x ✅

**At Scale:**
- 100 salons: $5,900/mo = $70,800/year
- 500 salons: $29,500/mo = $354,000/year
- 1,000 salons: $59,000/mo = $708,000/year

## Competitive Advantage

1. **Local Processing** — No cloud dependency, no per-minute charges
2. **Privacy** — Data stays in salon, not in Big Tech clouds
3. **Voice Quality** — Voice cloning sounds like real person
4. **Customizable** — Per-salon workflows, not one-size-fits-all
5. **Affordable** — $59/mo vs $199-300/mo for cloud competitors

## Go-to-Market

**Phase 1: Pilot (Month 1-2)**
- PLEIJ Salon (Columbus, OH)
- 30-day free trial
- Document results (calls answered, appointments booked)

**Phase 2: Local Expansion (Month 3-6)**
- 10 salons in Columbus area
- Word-of-mouth + local Facebook groups
- Partner with salon suppliers (Sally Beauty, etc.)

**Phase 3: Regional (Month 7-12)**
- 100 salons across Ohio
- Trade show presence (Premiere Orlando, etc.)
- Referral program ($100 credit for referrals)

**Phase 4: National (Year 2)**
- 1,000+ salons nationwide
- Online marketing (Google Ads, Facebook)
- Integration partnerships (Square, Mindbody, etc.)

## Workflow Template System

### Base Template (Included)

```yaml
salon_workflow:
  name: "Standard Salon Receptionist"
  version: 1.0
  
  greeting:
    - "Hello, thank you for calling {{salon_name}}!"
    - "Hi, this is {{salon_name}}, how can I help you today?"
  
  services:
    - name: "Haircut"
      duration: "30 min"
      price: "$35"
    - name: "Color"
      duration: "90 min"
      price: "$85"
    - name: "Highlights"
      duration: "120 min"
      price: "$120"
    - name: "Blowout"
      duration: "45 min"
      price: "$45"
    - name: "Men's Cut"
      duration: "30 min"
      price: "$25"
  
  appointment_booking:
    - Ask: "What service are you looking for?"
    - Ask: "What day works for you?"
    - Check availability via {{booking_system}}
    - Confirm: "Great, I have you booked for {{service}} on {{date}} at {{time}}."
    - Send SMS confirmation
  
  cancellation:
    - Ask: "When was your appointment scheduled?"
    - Look up in system
    - Confirm: "I've cancelled your appointment for {{date}} at {{time}}."
    - Offer to reschedule
  
  hours:
    monday: "9:00 AM - 7:00 PM"
    tuesday: "9:00 AM - 7:00 PM"
    wednesday: "9:00 AM - 7:00 PM"
    thursday: "9:00 AM - 8:00 PM"
    friday: "9:00 AM - 8:00 PM"
    saturday: "8:00 AM - 5:00 PM"
    sunday: "Closed"
  
  escalation:
    - emergency_calls: "forward_to_manager"
    - complex_requests: "take_message_and_text_staff"
    - complaints: "log_and_alert_owner"
  
  voice:
    tone: "friendly_professional"
    speed: "normal"
    gender: "female"
    clone_voice: true
    voice_sample: "{{provided_by_salon}}"
```

### Customization Per Salon

Each salon gets a custom config file:

```yaml
# PLEIJ Salon Configuration
salon_name: "PLEIJ Salon"
location: "Columbus, OH"
phone: "614-555-0123"

staff:
  - name: "Sarah"
    role: "Senior Stylist"
    specialties: ["Color", "Highlights"]
  - name: "Mike"
    role: "Barber"
    specialties: ["Men's Cuts", "Beard Trim"]

services:
  - name: "Signature Cut"
    duration: "45 min"
    price: "$55"
    description: "Consultation + cut + style"
  
  - name: "Balayage"
    duration: "150 min"
    price: "$185"
    description: "Hand-painted highlights"

booking_system: "square"
square_location_id: "sq_location_abc123"

hours:
  monday: "Closed"
  tuesday: "10:00 AM - 6:00 PM"
  wednesday: "10:00 AM - 6:00 PM"
  thursday: "10:00 AM - 8:00 PM"
  friday: "10:00 AM - 8:00 PM"
  saturday: "9:00 AM - 5:00 PM"
  sunday: "Closed"

special_instructions:
  - "We offer complimentary beverages (wine, coffee, water)"
  - "Please arrive 10 minutes early for consultation"
  - "We use all-natural, cruelty-free products"
  - "Gift cards available in any denomination"

voice:
  clone_voice: true
  voice_sample_url: "https://clawstudio.co/voices/pleij-sample.wav"
  tone: "warm_luxury"
  greeting_style: "personalized"
```

## Technology Stack

**Hardware:**
- Mac Mini M4 (16GB RAM)
- External microphone (optional)
- USB-C power adapter

**Software:**
- VoiceStudio (or custom build with Coqui TTS)
- Whisper (transcription)
- Fastify (API server)
- PostgreSQL (local database)
- BullMQ (job queue)

**Integration:**
- Square (booking + payments)
- Twilio (SMS)
- SendGrid (email)

## Financial Projections

**Year 1:**
- Salons: 50
- Revenue: $35,400
- Costs: $45,000 (hardware + development)
- Net: -$9,600 (investment year)

**Year 2:**
- Salons: 200
- Revenue: $141,600
- Costs: $60,000 (support + marketing)
- Net: $81,600

**Year 3:**
- Salons: 500
- Revenue: $354,000
- Costs: $100,000
- Net: $254,000

## Risks & Mitigation

**Risk:** Hardware failure
**Mitigation:** AppleCare+ warranty, backup config in cloud, 24hr replacement

**Risk:** Voice quality not good enough
**Mitigation:** Pilot with PLEIJ first, iterate on voice cloning, fallback to human

**Risk:** Competitors copy model
**Mitigation:** First-mover advantage, local customization moat, salon relationships

**Risk:** Salons don't want hardware
**Mitigation:** Offer cloud-hosted option at $99/mo for non-tech salons

## Next Steps

1. **Buy Mac Mini** for PLEIJ pilot
2. **Build voice prototype** (2-3 weeks)
3. **Install at PLEIJ** (1 week)
4. **Run 30-day trial** (measure calls answered, appointments booked)
5. **Iterate** based on feedback
6. **Launch** with pricing

## Contact

**Jason Opland**
**ClawStudio LLC**
**jason@clawstudio.co**

---

*Document Version: 1.0*
*Created: 2026-09-19*
*Status: Draft — Pending PLEIJ Pilot*
