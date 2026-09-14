# TaskLinkr Messaging Update — 2026-04-02

## Summary

Updated all TaskLinkr messaging to reflect the full marketplace scope. The positioning has evolved from "AI agents hiring humans" to a comprehensive marketplace connecting AI agents (and their users) with capital, expertise, and execution partners.

## New Positioning

**Core Statement:**
> TaskLinkr is the marketplace where AI agents (and their users) connect with capital, expertise, and execution partners.

**Four Categories:**

| Category | Who | Example Use Case |
|----------|-----|------------------|
| **Capital** | Investors, VCs, angel networks | AI startup seeking seed funding |
| **Expertise** | Attorneys, accountants, designers, advisors | Agent needing legal review of contracts |
| **Execution** | Co-founders, developers, builders, operators | Finding a technical co-founder |
| **Physical** | Home services, delivery, repairs, field work | AI agent hiring a plumber |

---

## Files Updated

### 1. Website Landing Page

**File:** `web/my-app/components/hero.tsx`

**Changes:**
- Updated subheadline from "Discover, review, and connect with AI agents" to include capital and expertise
- Trust indicators now show four pillars: Capital, Expertise, Execution, Physical
- Main headline remains "The GlassDoor for AI Agents" (brand consistency)

**New Subheadline:**
> The marketplace where AI agents connect with capital, expertise, and execution partners. Find investors, advisors, co-founders, and skilled workers — all in one place.

**New Trust Indicators:**
- Capital: Investors & VCs
- Expertise: Advisors & Specialists
- Execution: Co-founders & Builders
- Physical: Home Services & Repairs

---

### 2. Value Props Section

**File:** `web/my-app/components/value-props.tsx`

**Changes:**
- Restructured from "Two Directories" to "Four Categories"
- Each category now has its own section with relevant features
- Added investor/funder angle to Capital section
- Reframed human directory to include professionals (attorneys, accountants, etc.)

**New Section Headers:**
- "Four Categories, Infinite Possibilities" (was "Two Directories, One Mission")

**Category Features:**

| Category | Feature 1 | Feature 2 | Feature 3 |
|----------|-----------|------------|------------|
| **Capital** | Find Investors | Pitch to VCs | Funding Network |
| **Expertise** | Legal & Financial | Design & Creative | Advisory Network |
| **Execution** | Find Co-founders | Hire Developers | Build Teams |
| **Physical** | Home Services | Delivery & Repairs | Local Experts |

---

### 3. Moltbook Profile

**File:** `memory/moltbook-setup.md`

**Updated Bio:**
```
The marketplace where AI agents (and their users) connect with capital, expertise, and execution partners.

We're building infrastructure for the agent economy:

💼 CAPITAL — Find investors, VCs, and angel networks. AI startups can discover funding sources and pitch to interested investors.

🎯 EXPERTISE — Connect with attorneys, accountants, designers, and advisors. Agents and users can find specialized human expertise.

⚡ EXECUTION — Find co-founders, developers, and operators. Build teams to bring AI-powered businesses to life.

🔧 PHYSICAL — Hire humans for real-world tasks. Home services, delivery, repairs, and field work.

The agent economy isn't just about AI-to-AI commerce. It's about connecting agents and their users with every resource they need to succeed — funding, expertise, talent, and hands-on help.

Early Access:
📧 tasklinkr@outlook.com
🐦 @GetTaskLinkr
🌐 TaskLinkr.co

Building the future of agent-human collaboration. 🚀
```

**Status:** ⏳ Requires re-upload to Moltbook after verification

---

### 4. Social Bios (TaskLinkrJobs)

**File:** `memory/tasklinkrjobs-social-setup.md`

**New Bio (All Platforms):**
```
AI agents & users connecting with capital, expertise & execution partners 💼 Find investors, advisors, co-founders & workers → TaskLinkr.co
```

**Platform-Specific Variations:**

| Platform | Bio | Character Count |
|----------|-----|-----------------|
| X/Twitter | `AI agents & users connecting with capital, expertise & execution partners 💼 Find investors, advisors, co-founders & workers → TaskLinkr.co` | ~125 chars |
| Instagram | `AI agents & users connecting with capital, expertise & execution partners 💼 Find investors, advisors, co-founders & workers. ⬇️ Join waitlist` | ~135 chars |
| Facebook | `TaskLinkr is the marketplace where AI agents (and their users) connect with capital, expertise, and execution partners. Find investors, advisors, co-founders, and skilled workers — all in one place.` | ~200 chars |

---

### 5. Launch Announcement Posts

**File:** `memory/tasklinkrjobs-social-setup.md` (added section)

#### Post 1: "AI Agents Hiring Humans" (Physical Focus)
```
🤖 AI agents are hiring humans for real-world tasks.

From home repairs to deliveries to field work — AI agents need human hands.

TaskLinkr connects AI with local experts who can get physical work done.

Join the waitlist: TaskLinkr.co

#AI #FutureOfWork #GigEconomy #AIAgents
```

#### Post 2: "Connecting with Investors" (Capital Focus)
```
💼 AI agents and their users, meet investors.

Building an AI startup? TaskLinkr connects you with VCs, angel networks, and funding sources.

The agent economy needs capital. We're making the introduction.

Early access: TaskLinkr.co

#Startups #VC #AIFunding #AgentEconomy
```

#### Post 3: "Finding Co-founders & Experts" (Execution/Expertise Focus)
```
🚀 Need a co-founder? A developer? An attorney?

TaskLinkr is building the marketplace where AI agents and users find execution partners.

Building something great takes a team. We help you find yours.

Example: Basys Health needed specialized app builders. TaskLinkr is where they'd list that need.

Join the waitlist: TaskLinkr.co

#CoFounder #StartupJobs #AI #BuildInPublic
```

#### Post 4: Comprehensive Launch Announcement
```
🎯 TaskLinkr: The marketplace for the agent economy.

We're building infrastructure for AI agents and their users to connect with:

💼 Capital — Investors, VCs, angel networks
🎯 Expertise — Attorneys, accountants, advisors  
⚡ Execution — Co-founders, developers, operators
🔧 Physical — Home services, delivery, repairs

The GlassDoor for AI Agents, but bigger. Because agents don't just need other agents — they need the entire ecosystem.

Join early: TaskLinkr.co

#AgentEconomy #AI #FutureOfWork #Infrastructure
```

---

## Rationale

### Why This Expansion?

1. **Market Reality**: AI agents aren't just hiring humans for tasks — they're part of larger businesses that need funding, legal structure, and teams.

2. **User Story**: A user like Jason building Basys Health doesn't just need AI-to-AI commerce. They need investors, attorneys, co-founders, AND contractors.

3. **Differentiation**: Other agent marketplaces focus on agent-to-agent. TaskLinkr is the full-stack marketplace for agent-powered businesses.

4. **Tone Shift**: "Professional, ambitious, infrastructure-for-the-future" — we're not a gig app, we're economic infrastructure.

### What Stayed the Same

- "GlassDoor for AI Agents" tagline (brand recognition)
- Focus on trust, reviews, verification
- Marketplace fundamentals (profiles, matching, reviews)
- Early access call-to-action

### What Changed

- Expanded from "human workers" to "capital, expertise, execution, physical"
- Added investor/VC angle to target startup founders
- Added co-founder angle to target builders
- Added professional services (attorneys, accountants) for business needs

---

## Action Items

### Immediate (Human Required)
- [ ] Verify Moltbook profile (claim URL in moltbook-setup.md)
- [ ] Update Moltbook bio with new version
- [ ] Create social accounts using updated bios

### After Verification
- [ ] Post launch announcements (use drafted posts)
- [ ] Cross-post to Moltbook community
- [ ] Update website (changes already committed)

### Future
- [ ] Create separate landing pages for each category (capital/, expertise/, etc.)
- [ ] Develop investor-specific messaging
- [ ] Create "for investors" and "for experts" value props

---

## Files Modified

| File | Change Type |
|------|-------------|
| `web/my-app/components/hero.tsx` | Content update |
| `web/my-app/components/value-props.tsx` | Major restructure |
| `memory/moltbook-setup.md` | Bio update, status note |
| `memory/tasklinkrjobs-social-setup.md` | Bio + launch posts added |
| `memory/messaging-update-2026-04-02.md` | This file (new) |

---

## Status

| Component | Status |
|-----------|--------|
| Website code | ✅ Updated |
| Moltbook bio | ⏳ Draft ready, needs upload |
| Social bios | ⏳ Draft ready, needs account creation |
| Launch posts | ✅ Drafted |
| Documentation | ✅ Complete |

---

*Updated: 2026-04-02*
*Agent: tl-marketing*