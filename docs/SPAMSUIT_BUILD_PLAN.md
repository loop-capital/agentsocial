# SpamSuit Build Plan v2 — Updated 2026-04-14

## MVP Scope (Originally: 4 weeks → Now substantially built)

### ✅ Complete
| Component | Status | URL/Path |
|-----------|--------|----------|
| Landing page | Live | spamsuit-landing.vercel.app |
| Working CTA buttons | Live | Forward modal + Upload screenshot |
| SMS webhook API | Built | /api/webhook/sms |
| Web report API | Live | /api/report |
| Admin dashboard | Live | /admin, /admin/reports, /admin/cases, /admin/attorneys |
| Victim dashboard | Live | /dashboard |
| Email notifications (4 templates) | Built | /api/emails/welcome, validated, attorney-match, settlement |
| Database (8 tables) | Live | Supabase prowvkbxcdhtoiidxowb |
| Legal docs | Drafted | privacy-policy, terms, attorney agreement, consent form |
| Marketing content | Drafted | social posts, email templates, DM responses, press kit |
| Revenue model | Defined | Y1 $175K → Y2 $1.05M → Y3 $3.25M |
| Data sales strategy | Defined | Anonymized aggregates only, 1000+ sample min |

### 🔧 In Progress
| Component | Status | Notes |
|-----------|--------|-------|
| Mobile app (Expo/RN) | Screens built, fixing compile errors | 6 screens, API service, design system |
| Screenshot upload (S3) | Not started | Currently base64 via API |
| Email delivery (Resend/SendGrid) | Templates built, no provider | Swap console.log for real delivery |

### ⏳ Next Up (Priority Order)
1. **Twilio webhook config** — Jason sets webhook URL in Twilio dashboard (30 sec)
2. **Domain name** — Jason purchases + points to Vercel
3. **Mobile app compile fix + test** — Overnight
4. **Attorney signup flow** — Landing page + API for attorneys to register
5. **Real email delivery** — Add Resend API key, one-line swap
6. **S3 screenshot upload** — Presigned URLs for image storage
7. **IG + social launch** — Jason creates accounts, posts landing page screenshot
8. **Buffer account** — Team content scheduling

### 📋 Jason's Action Items
- [ ] Buy domain → point DNS to Vercel
- [ ] Create Instagram account → post landing page screenshot
- [ ] Follow realtor + beauty pro + attorney + AG accounts on IG
- [ ] Set up Buffer account for team
- [ ] Log into Twilio → set webhook URL to `https://spamsuit-landing.vercel.app/api/webhook/sms`
- [ ] Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER to Vercel env vars

## Phase 2: Post-MVP Expansion
- FDCPA lead generation (debt collection harassment)
- Robocall detection (same TCPA, different input)
- FCRA credit report errors
- Carrier API integration (spam data → carriers)
- Mobile app store submission
- AG office outreach

## Phase 3: Platform Growth
- Class action aggregation
- Attorney subscription model
- Data marketplace (anonymized)
- Mobile app deep integration (SMS auto-forward)
- Carrier partnerships (spam intelligence feeds)
- Nationwide expansion

## Revenue Model (Updated)
| Stream | Phase | Est. Revenue |
|--------|-------|-------------|
| Attorney lead fees (contingency) | MVP | Y1 $175K |
| Anonymized data sales | Post-MVP | Y2 $500K+ |
| Attorney subscriptions | Phase 2 | Y2 $300K |
| Carrier data partnerships | Phase 3 | Y3 $1M+ |
| Class action referrals | Phase 3 | Y3 $500K+ |

## Design System
- White: #FFFFFF (backgrounds)
- Teal: #2A9D8F (primary, CTAs)
- Coral: #E76F51 (alerts, secondary CTAs)
- Charcoal: #1A1A1A (text)
- Font: System/Inter

## Key Rules
- Never sell personal data — anonymized aggregates only
- Never send unsolicited texts (TCPA compliance)
- Consumer copy: universal appeal, no AI references, no profession limits
- Legal docs: plain English, marked DRAFT until attorney review
- Attorney model: contingency-first (no upfront cost to consumers)