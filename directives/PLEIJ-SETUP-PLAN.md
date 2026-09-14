# PLEIJ Salon — Full AISO + Voice Agent Setup Plan

**Created**: 2026-05-23
**Status**: Building
**Priority**: P0 — First real client, proof of concept

---

## Current State

| Component | Status | Notes |
|-----------|--------|-------|
| PLEIJ website | ✅ Live | pleijsalon.com (WordPress, ASÉ theme) |
| Zoca landing page | ✅ Still live | pleijsaloncolumbus.zoca.com (wife paying $299/mo) |
| Dograh voice agent | ✅ Deployed locally | localhost:3020/8010, 3 workflows |
| Schema Engine plugin | ✅ Built | 1,146 lines, needs reinstall after PHP fix |
| Composio OAuth | ✅ Configured | IG + FB connected, Google not yet |
| GBP access | ❌ NOT connected | Need OAuth via Composio for PLEIJ's Google account |
| Review automation | ❌ Not built | Need review monitoring + auto-response |
| Landing page (ours) | ❌ Not built | ClawStudio add-on, salon template |
| AI visibility tracking | ❌ Not built | Need to monitor PLEIJ in AI Overviews |
| Social posting | ❌ Not automated | IG/FB connected but no posting workflow |

---

## Phase 1: GBP Connect + Audit (TODAY)

### Step 1: Connect PLEIJ's Google Account via Composio
- Jason connects PLEIJ's Google account through Composio OAuth
- Scopes needed: `business.manage`, `review.read`, `review.reply`
- This gives us full GBP read/write access

### Step 2: Full GBP Audit
Once connected, pull and assess:
- [ ] Business name, categories, attributes — optimized?
- [ ] Services list — complete with descriptions + pricing?
- [ ] Photos — how many, quality, recency?
- [ ] Reviews — count, avg rating, response rate, response time?
- [ ] Posts — last post date, frequency?
- [ ] Q&A — any unanswered questions?
- [ ] Description — keyword-rich, natural language?
- [ ] Hours — accurate including holidays?
- [ ] Booking link — connected?

### Step 3: Fix What's Wrong
Based on audit findings:
- Fill in missing fields
- Optimize service descriptions with keywords
- Respond to any unanswered reviews
- Post if no recent posts
- Add missing attributes

---

## Phase 2: Review Automation (THIS WEEKEND)

### Build: Review Automator Module
1. **Monitor** — Poll new reviews via GBP API (daily)
2. **AI Respond** — Generate contextual responses using LLM
   - Positive: Thank + mention specific service
   - Negative: Acknowledge + invite to contact
   - Neutral: Thank + highlight service
3. **Solicit** — After appointments, send SMS/email requesting review
   - Link directly to Google review form
   - Timing: 3-24 hours after visit
4. **Dashboard** — Review count, avg rating, response rate, sentiment trend

---

## Phase 3: Voice Agent Production (THIS WEEKEND)

### Current State
- Dograh deployed locally (localhost:8010)
- 3 workflows built: Inbound, Rebooking, Review Request
- PLEIJ salon config exists

### To Go Production
1. **Deploy Dograh to Hetzner cloud** (need account from Jason)
   - Or: Use local server with port forwarding + Twilio webhook
2. **Connect Twilio number** → Dograh webhook
3. **Test full flow**: Call → STT → LLM → TTS → Response
4. **Add knowledge base** — PLEIJ services, pricing, hours, policies
   - Use graphify or simple JSON for now
   - Agent can answer: hours, services, pricing, book appointment
5. **Monitor** — Log all calls, transcriptions, outcomes

### Voice Agent Knowledge Base
The agent needs to know:
- All services + prices + duration
- Staff names + specialties
- Business hours (including holiday schedule)
- Booking policies (cancellation, no-show)
- Location, parking, accessibility
- Current promotions
- Common questions (color processing time, aftercare, etc.)

**How to structure this:**
- NOT a full graphify per business (overkill for now)
- JSON config file per client (salon-config.ts pattern already exists)
- LLM gets this context in system prompt
- For complex questions: "Let me connect you to the salon"

---

## Phase 4: Landing Page (NEXT WEEK)

### Build: ClawStudio Salon Landing Template
- Hero: PLEIJ Salon name + "Best Salon in Columbus" + CTA
- Services grid (pulled from GBP data)
- Gallery (from GBP photos + Instagram)
- Reviews widget (from GBP reviews)
- Map + hours (GBP embed)
- AI chat widget (text version of voice agent)
- Book Now CTA → Square booking / phone call
- Deploy to: pleij.clawstudio.co or their custom domain

---

## Phase 5: Ongoing AISO (WEEK 2+)

### Weekly
- GBP post (service spotlight, seasonal offer)
- Review response (within 24h)
- Social post (IG/FB from AgentSocial)
- AI visibility check (are we showing up in AI Overviews?)

### Monthly
- GBP photo refresh
- Content: blog post or FAQ page on pleijsalon.com
- Citation consistency check
- Competitor audit
- Client report: AI visibility score, review trend, leads generated

---

## What I Need From Jason

1. **PLEIJ Google account access** — Connect via Composio OAuth link
2. **Hetzner Cloud account** — For production Dograh deployment (or confirm local server is OK)
3. **PLEIJ Twilio phone number** — For voice agent (or set up new one)
4. **DNS for clawstudio.co** — Wildcard or pleij.clawstudio.co A record
5. **Square booking link** — For landing page CTA (or use phone call)

---

## Success Metrics (30 days)

| Metric | Current | Target |
|--------|---------|--------|
| GBP completion | Unknown | 100% all fields |
| Review count | Unknown | +10 new reviews |
| Review response rate | Unknown | 100% within 24h |
| AI Overview appearance | Unknown | Appear for "hair salon columbus" |
| Voice agent calls | 0 | Handling all inbound |
| Landing page live | ❌ | ✅ pleij.clawstudio.co |
| Monthly GBP posts | 0 | 4+ |