# Voice Receptionist Architecture — Business Knowledge Layer

**Date**: 2026-05-22
**Status**: Design Document — Ready for Build
**Author**: AgentSocial-CEO

---

## The Problem

Dograh workflows are **static scripts** — greet → qualify → book → transfer. They break when:
- Caller asks "What time do you close on Saturday?" (not in the script)
- Caller asks "Do you do keratin treatments?" (requires salon knowledge)
- Caller wants to reschedule, not book new (different flow)
- Caller complains about a past visit (needs empathy, not booking)

We need the agent to **understand the business** and **respond naturally**, not follow a rigid script.

---

## Architecture: 3-Layer Voice Agent

```
Layer 3: Business Knowledge (NEW)
┌──────────────────────────────────────┐
│  Business Profile                    │
│  ┌─────────────┐  ┌──────────────┐  │
│  │ Salon Config │  │ FAQ / Policy │  │
│  │ (services,   │  │ (hours,      │  │
│  │  prices,     │  │  cancellatn, │  │
│  │  stylists)   │  │  parking)    │  │
│  └─────────────┘  └──────────────┘  │
│  ┌─────────────┐  ┌──────────────┐  │
│  │ Live Data   │  │ Personality  │  │
│  │ (bookings,  │  │ (tone,      │  │
│  │  availability)│  │  phrases)   │  │
│  └─────────────┘  └──────────────┘  │
└──────────┬───────────────────────────┘
           │ Injected into system prompt
           ▼
Layer 2: LLM (GPT-4o-mini)
┌──────────────────────────────────────┐
│  System prompt = Template + Knowledge │
│  + Function calling (book, transfer)  │
│  + Conversation memory (turn context)  │
└──────────┬───────────────────────────┘
           │
           ▼
Layer 1: Dograh (Transport)
┌──────────────────────────────────────┐
│  STT → LLM → TTS → Phone line       │
│  Manages telephony, recording, webhooks│
└──────────────────────────────────────┘
```

---

## What We Do NOT Need

❌ **Graphify per business** — Overkill. Graphify is for research/knowledge graphs. A voice receptionist needs structured business data, not a 1548-node knowledge graph.

❌ **RAG / vector search** — For salon-level knowledge (20 services, 3 stylists, 7 FAQs), injecting everything into the system prompt is simpler, faster, and cheaper than a RAG pipeline.

❌ **Separate knowledge base per call** — The LLM already has the full system prompt with all business info injected at call start.

---

## What We DO Need

✅ **Enhanced salon-config.ts** — Structured business data that gets injected into the system prompt (we already have this)

✅ **Live data hooks** — Real-time availability and booking integration via function calling (we have the Dograh function specs but need to wire them to AgentSocial API)

✅ **Dynamic prompt builder** — Generates the system prompt at call time from business config + live data (we have `generateInboundPrompt()` but need to enhance it)

✅ **Post-call intelligence** — Webhooks that capture call data and feed it back into AgentSocial for CRM, analytics, and follow-up campaigns

---

## The Design: Business Knowledge System

### 1. Business Profile Schema (Enhanced salon-config)

```typescript
interface BusinessProfile {
  // Identity
  id: string;
  name: string;
  dba?: string;                    // "Doing Business As"
  phone: string;
  address: string;
  website: string;
  google_maps_url?: string;

  // Personality
  brand_tone: 'warm_professional' | 'trendy_casual' | 'luxury_spa' | 'friendly_neighborhood';
  greeting_style: 'casual' | 'formal' | 'enthusiastic';
  agent_name?: string;            // "Hi, I'm Alex from PLEIJ Salon"
  
  // Services & Pricing
  services: Service[];
  service_categories: string[];   // ['cuts', 'color', 'treatments', 'styling']
  
  // Staff
  stylists: Stylist[];
  
  // Policies
  hours: Record<string, string>;
  cancellation_policy: string;
  parking_info: string;
  new_client_info?: string;       // "First visit? Get 20% off!"
  
  // Knowledge Base (FAQ-style, injected into prompt)
  faqs: FAQ[];
  policies: Policy[];
  special_notes?: string;          // "We're closed July 4th" or "Renovating through March"
  
  // Call Behavior
  transfer_rules: TransferRules;
  max_call_minutes: number;
  silence_timeout_seconds: number;
  
  // Outbound Campaigns
  campaigns: CampaignConfig;
}

interface Service {
  name: string;
  category: string;
  price_range: string;
  duration: number;                 // minutes
  description?: string;            // "Our signature balayage creates natural, sun-kissed highlights"
  popular?: boolean;               // Flag most-requested services
}

interface Stylist {
  name: string;
  specialties: string[];
  available_days: string[];
  bio?: string;                    // "Morgan specializes in creative color transformations"
  senior?: boolean;                // Senior stylists may have higher pricing
}

interface FAQ {
  q: string;                       // The question callers ask
  a: string;                       // The answer the agent should give
  triggers?: string[];              // Variations: ["prices", "how much", "cost"]
}

interface Policy {
  title: string;                   // "Cancellation Policy"
  content: string;                 // "24 hours notice required..."
  priority?: 'must_mention' | 'if_asked' | 'background';
}

interface TransferRules {
  complaint: boolean;
  complex_consultation: boolean;
  vip_client: boolean;
  pricing_dispute: boolean;
  emergency: boolean;
  custom?: Array<{trigger: string; reason: string}>;
}
```

### 2. Dynamic Prompt Builder

The prompt is built at call time from:

1. **Base personality** — Tone, greeting style, agent name
2. **Business data** — Hours, services, stylists, FAQs
3. **Live context** — Current time, day of week, special notes
4. **Function definitions** — What the agent can DO (book, transfer, check availability)

```typescript
function buildSystemPrompt(profile: BusinessProfile): string {
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  
  return `
You are ${profile.agent_name || 'the AI receptionist'} for ${profile.name}.

CURRENT TIME: ${dayName}, ${timeStr}

${getTonePrompt(profile.brand_tone)}

YOUR GOALS:
1. Answer questions about hours, location, services, and pricing
2. Help callers book appointments
3. Handle rescheduling and cancellations
4. Transfer to a human staff member when appropriate
5. Capture lead information for follow-up

${profile.special_notes ? `SPECIAL NOTE: ${profile.special_notes}` : ''}

HOURS:
${formatHours(profile.hours)}

LOCATION: ${profile.address}
${profile.parking_info ? `PARKING: ${profile.parking_info}` : ''}

SERVICES & PRICING:
${formatServices(profile.services)}

STYLISTS:
${formatStylists(profile.stylists)}

POLICIES:
${formatPolicies(profile.policies)}

COMMON QUESTIONS:
${formatFAQs(profile.faqs)}

BOOKING FLOW:
1. Ask what service they're interested in
2. Ask if they have a preferred stylist
3. Suggest available times
4. Collect name and phone number
5. Confirm booking details
6. Say "We'll send you a confirmation text shortly!"

TRANSFER RULES:
${formatTransferRules(profile.transfer_rules)}

IMPORTANT:
- Never make up pricing or services not listed
- If unsure, offer to transfer to the salon
- Keep responses concise — this is a phone conversation
- Always end with: "Is there anything else I can help you with?"
`.trim();
}
```

### 3. Function Calling (Live Data Integration)

The LLM can call functions to get real-time data:

```typescript
const VOICE_FUNCTIONS = [
  {
    name: 'check_availability',
    description: 'Check available appointment slots for a given date',
    parameters: {
      date: { type: 'string', description: 'YYYY-MM-DD' },
      stylist: { type: 'string', description: 'Stylist name (optional)' },
      service: { type: 'string', description: 'Service type' },
    },
    // → Calls AgentSocial API GET /api/v1/bookings/availability
  },
  {
    name: 'book_appointment',
    description: 'Book an appointment for the caller',
    parameters: {
      name: { type: 'string' },
      phone: { type: 'string' },
      service: { type: 'string' },
      stylist: { type: 'string' },
      date: { type: 'string', description: 'YYYY-MM-DD' },
      time: { type: 'string', description: 'HH:MM' },
    },
    // → Calls AgentSocial API POST /api/v1/bookings
  },
  {
    name: 'cancel_appointment',
    description: 'Cancel an existing appointment',
    parameters: {
      phone: { type: 'string', description: 'Caller phone number' },
      appointment_id: { type: 'string', description: 'Appointment ID if known' },
    },
    // → Calls AgentSocial API DELETE /api/v1/bookings/:id
  },
  {
    name: 'transfer_to_staff',
    description: 'Transfer the call to a human staff member',
    parameters: {
      reason: { type: 'string' },
      stylist: { type: 'string', description: 'Specific stylist (optional)' },
    },
    // → Dograh transfer action
  },
  {
    name: 'send_sms',
    description: 'Send a text message to the caller (booking confirmation, review link, etc.)',
    parameters: {
      message: { type: 'string', description: 'Message content' },
      type: { type: 'string', enum: ['confirmation', 'review_request', 'info'] },
    },
    // → Calls Twilio / AgentSocial SMS
  },
];
```

### 4. Post-Call Intelligence

After every call, Dograh sends a webhook to AgentSocial:

```typescript
interface CallEndPayload {
  call_id: string;
  agent_id: string;
  direction: 'inbound' | 'outbound';
  duration_seconds: number;
  transcript: string;
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  outcome: 'booked' | 'transferred' | 'info_provided' | 'voicemail' | 'no_answer' | 'declined';
  booked_appointment?: {
    service: string;
    stylist: string;
    date: string;
    time: string;
    caller_name: string;
    caller_phone: string;
  };
  caller_phone: string;
  caller_name?: string;
  transferred_to?: string;
  functions_called: string[];
  cost_usd: number;
}
```

This feeds into:
- **CRM** — Auto-create/update lead records
- **Analytics** — Call volume, booking rate, sentiment trends
- **Campaigns** — Trigger rebooking/review requests automatically
- **Improvement** — Review transcripts to improve FAQ and prompts

---

## Why NOT Graphify

| Approach | Latency | Cost | Complexity | Best For |
|----------|---------|------|------------|----------|
| **Prompt injection** (our approach) | ~0ms | $0 | Low | Businesses with <100 items of knowledge |
| **RAG** (vector search) | ~200ms | $0.001/query | Medium | Large knowledge bases (1000+ docs) |
| **Graphify** (knowledge graph) | ~500ms | $0.01/query | High | Research, complex relationships |

A salon has ~8 services, 3 stylists, 7 FAQs. That's **20 data points**. Prompt injection handles this perfectly — no RAG needed.

**When to upgrade to RAG**: If a business has 100+ services, a full menu, detailed product catalog, etc. (e.g., a medical spa with 200+ treatment combinations). At that point, we add a vector search layer.

**When to upgrade to Graphify**: If we're doing competitive intelligence, market research, or multi-source knowledge synthesis across many businesses.

---

## Build Plan — This Weekend

### Saturday: Voice Agent Core

1. **Enhance `BusinessProfile` schema** — Add agent_name, policies, special_notes, live context
2. **Build dynamic prompt builder** — `buildSystemPrompt()` with real-time context injection
3. **Wire function calling** — Connect check_availability + book_appointment to AgentSocial API
4. **Add post-call webhook handler** — Capture call data into CRM

### Sunday: PLEIJ Configuration + Testing

1. **Fill in PLEIJ business profile** — Real hours, services, stylists, FAQs
2. **Test inbound calls** — Call from phone, verify agent responds naturally
3. **Test function calling** — Verify booking, availability checks work
4. **Test transfer** — Verify call transfers to real salon phone
5. **Tune prompts** — Adjust based on test calls

### Monday: Polish + Deploy

1. **Deploy to cloud VPS** (once Hetzner account is ready)
2. **Configure Twilio** — Point PLEIJ's phone number to Dograh webhook
3. **Go live** — PLEIJ Salon's AI receptionist is active

---

## Answer to Jason's Questions

**"Can the agent respond outside of this workflow?"**
→ YES. The workflow is just the initial system prompt + function definitions. The LLM can handle ANY question about the business because all knowledge is in the prompt. It's not limited to a script — it can naturally answer "What are your Saturday hours?" or "Do you do keratin?" because that data is in the system prompt.

**"Do we setup a graphify for each business?"**
→ NO. Graphify is overkill for a single business. A salon has ~20 data points — we inject everything into the LLM's system prompt. Graphify would add latency and cost for no benefit. We'd only need RAG/Graphify for businesses with massive knowledge bases.

**"What is the best way to set this up?"**
→ The 3-layer architecture above:
- **Layer 1**: Dograh (transport — STT/TTS/phone)
- **Layer 2**: LLM with dynamic system prompt (intelligence)
- **Layer 3**: Business profile config (knowledge — structured data that feeds the prompt)