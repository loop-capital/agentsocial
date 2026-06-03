/**
 * Business Profile System — Voice Agent Knowledge Layer
 * 
 * Each business gets a BusinessProfile that defines:
 * 1. What the agent knows (services, hours, FAQs, policies)
 * 2. How the agent behaves (tone, personality, transfer rules)
 * 3. What the agent can do (function calling definitions)
 * 
 * This data is injected into the LLM system prompt at call time,
 * so the agent can answer ANY question about the business naturally.
 * 
 * No RAG or Graphify needed — salons have ~20 data points that fit
 * easily in a system prompt.
 */

// ─── Type Definitions ───────────────────────────────────────────

export interface BusinessProfile {
  // Identity
  id: string;
  name: string;
  dba?: string;
  phone: string;
  address: string;
  website: string;
  google_maps_url?: string;

  // Personality
  brand_tone: BrandTone;
  greeting_style: GreetingStyle;
  agent_name?: string;
  agent_persona?: string;        // Custom persona override

  // Services & Pricing
  services: Service[];
  service_categories: string[];

  // Staff
  stylists: Stylist[];

  // Policies
  hours: Record<string, string>;
  cancellation_policy: string;
  parking_info?: string;
  new_client_offer?: string;
  special_notes?: string;        // "Closed July 4th", "Renovating through March"

  // Knowledge
  faqs: FAQ[];
  policies: Policy[];

  // Call Behavior
  transfer_rules: TransferRules;
  max_call_minutes: number;
  silence_timeout_seconds: number;

  // Voice
  voice_id: string;
  voice_stability: number;
  voice_similarity_boost: number;
  voice_style: number;

  // Outbound Campaigns
  campaigns: CampaignConfig;

  // API Integration
  agentsocial_api_url?: string;
  agentsocial_api_key?: string;
  twilio_phone_number?: string;
  transfer_phone_number?: string;
}

export type BrandTone = 'warm_professional' | 'trendy_casual' | 'luxury_spa' | 'friendly_neighborhood';
export type GreetingStyle = 'casual' | 'formal' | 'enthusiastic';

export interface Service {
  name: string;
  category: string;
  price_range: string;
  duration: number;               // minutes
  description?: string;
  popular?: boolean;
}

export interface Stylist {
  name: string;
  specialties: string[];
  available_days: string[];
  bio?: string;
  senior?: boolean;
}

export interface FAQ {
  q: string;
  a: string;
  triggers?: string[];             // Variations of the question
}

export interface Policy {
  title: string;
  content: string;
  priority?: 'must_mention' | 'if_asked' | 'background';
}

export interface TransferRules {
  complaint: boolean;
  complex_consultation: boolean;
  vip_client: boolean;
  pricing_dispute: boolean;
  emergency: boolean;
  custom?: Array<{ trigger: string; reason: string }>;
}

export interface CampaignConfig {
  rebooking: {
    days_after_appointment: number;
    message_template: string;
  };
  review_request: {
    days_after_appointment: number;
    message_template: string;
  };
}

// ─── Tone Definitions ─────────────────────────────────────────────

const TONE_PROMPTS: Record<BrandTone, string> = {
  warm_professional: 
    'You are warm and professional, like a knowledgeable front desk person who genuinely cares about clients. ' +
    'You make people feel welcome and valued. Use "we" when talking about the salon.',
  trendy_casual: 
    'You are trendy and casual, speaking like a friend who happens to work at a cool salon. ' +
    'Use contemporary language but stay professional. Keep it light and fun.',
  luxury_spa: 
    'You are refined and luxurious, using words like "indulge", "experience", "pamper". ' +
    'Create a sense of exclusivity and personalized care.',
  friendly_neighborhood: 
    'You are the friendly neighborhood stylist who knows everyone by name. ' +
    'Down-to-earth and approachable. Use casual, warm language.',
};

const GREETING_TEMPLATES: Record<GreetingStyle, string> = {
  casual: "Hey there! Thanks for calling {salon}. I'm {agent}, how can I help you today?",
  formal: "Good {time_of_day}. Thank you for calling {salon}. This is {agent}. How may I assist you?",
  enthusiastic: "Hi! Welcome to {salon}! I'm {agent} and I'm excited to help you today! What can I do for you?",
};

// ─── Prompt Builder ────────────────────────────────────────────────

/**
 * Build the full system prompt for a voice agent call.
 * Injects all business knowledge, personality, and behavioral rules
 * into the LLM context so it can handle ANY question naturally.
 */
export function buildSystemPrompt(profile: BusinessProfile): string {
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const salonName = profile.dba || profile.name;
  const agentIntro = profile.agent_name 
    ? `My name is ${profile.agent_name}.` 
    : '';

  const sections: string[] = [];

  // ── Identity & Personality ──
  sections.push(`You are ${profile.agent_name || 'the AI receptionist'} for ${salonName}.${profile.agent_persona ? ' ' + profile.agent_persona : ''}`);

  sections.push(TONE_PROMPTS[profile.brand_tone]);

  // ── Current Context ──
  sections.push(`CURRENT TIME: ${dayName}, ${timeStr}`);

  // Check if currently open/closed
  const hoursToday = profile.hours[dayName.toLowerCase()];
  if (hoursToday && hoursToday.toLowerCase() !== 'closed') {
    sections.push(`The salon is currently OPEN (hours today: ${hoursToday}).`);
  } else {
    sections.push(`The salon is currently CLOSED (closed on ${dayName}s).`);
  }

  if (profile.special_notes) {
    sections.push(`⚠️ SPECIAL NOTE: ${profile.special_notes}`);
  }

  // ── Goals ──
  sections.push(`YOUR GOALS:
1. Answer questions about hours, location, services, and pricing
2. Help callers book or reschedule appointments
3. Handle cancellations politely
4. Transfer to a human staff member when appropriate
5. Capture lead information for follow-up`);

  // ── Business Info ──
  sections.push(`HOURS:
${formatHours(profile.hours)}`);

  sections.push(`LOCATION: ${profile.address}`);
  if (profile.parking_info) {
    sections.push(`PARKING: ${profile.parking_info}`);
  }
  if (profile.new_client_offer) {
    sections.push(`NEW CLIENT OFFER: ${profile.new_client_offer}`);
  }

  // ── Services ──
  sections.push(`SERVICES & PRICING:
${formatServices(profile.services)}`);

  // ── Stylists ──
  sections.push(`STYLISTS:
${formatStylists(profile.stylists)}`);

  // ── Policies ──
  if (profile.policies?.length) {
    sections.push(`POLICIES:
${formatPolicies(profile.policies)}`);
  }

  // ── FAQs ──
  if (profile.faqs?.length) {
    sections.push(`COMMON QUESTIONS:
${formatFAQs(profile.faqs)}`);
  }

  // ── Booking Flow ──
  sections.push(`BOOKING FLOW:
1. Ask what service they're interested in
2. Ask if they have a preferred stylist
3. Suggest available times (check_availability function)
4. Collect their name and phone number
5. Confirm booking details
6. Say "We'll send you a confirmation text shortly!"`);

  // ── Transfer Rules ──
  sections.push(`TRANSFER RULES:
${formatTransferRules(profile.transfer_rules)}`);

  // ── Hard Rules ──
  sections.push(`IMPORTANT RULES:
- Never make up pricing, services, or information not listed above
- If you don't know something, say "Let me check on that" and offer to transfer
- Keep responses concise — this is a phone conversation, not email
- Always end with: "Is there anything else I can help you with?"
- Never promise specific appointment times without checking availability
- If the caller is upset or has a complaint, offer to transfer immediately
- Be genuine and helpful — sound like a real person who cares`);

  return sections.join('\n\n');
}

/**
 * Build the greeting that plays when a call connects.
 */
export function buildGreeting(profile: BusinessProfile): string {
  const now = new Date();
  const hour = now.getHours();
  let timeOfDay = 'morning';
  if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  if (hour >= 17) timeOfDay = 'evening';

  const salonName = profile.dba || profile.name;
  const agentName = profile.agent_name || 'the virtual assistant';

  return GREETING_TEMPLATES[profile.greeting_style]
    .replace('{salon}', salonName)
    .replace('{agent}', agentName)
    .replace('{time_of_day}', timeOfDay);
}

/**
 * Build the rebooking campaign prompt for outbound calls.
 */
export function buildRebookingPrompt(profile: BusinessProfile): string {
  const salonName = profile.dba || profile.name;
  const tone = TONE_PROMPTS[profile.brand_tone];

  return `You are calling on behalf of ${salonName} to remind past clients about rebooking.

${tone}

YOUR FLOW:
1. "Hi {name}, this is ${profile.agent_name || 'calling'} from ${salonName}! How are you doing?"
2. "It's been a while since your last visit and we'd love to see you again."
3. If interested → Offer to book an appointment with their previous stylist
4. If not → "No problem! We'll reach out again later. Have a great day!"

IMPORTANT:
- Keep it under 2 minutes
- Never be pushy or guilt-trip
- If they sound busy, offer to text a booking link instead
- End with "Thanks for your time, {name}!"`;
}

/**
 * Build the review request prompt for outbound calls.
 */
export function buildReviewPrompt(profile: BusinessProfile): string {
  const salonName = profile.dba || profile.name;
  const tone = TONE_PROMPTS[profile.brand_tone];

  return `You are calling on behalf of ${salonName} to ask recent clients for a Google review.

${tone}

YOUR FLOW:
1. "Hi {name}, this is ${profile.agent_name || 'calling'} from ${salonName}! I hope you loved your visit."
2. "Would you be willing to leave us a quick Google review?"
3. If YES → "Awesome! I'll text you a link right now. It takes about 30 seconds."
4. If NO → "No worries at all! Thanks for being a ${salonName} client. Have a great day!"

IMPORTANT:
- Keep under 90 seconds
- Never push if they decline
- Always offer the text option`;
}

// ─── Formatting Helpers ───────────────────────────────────────────

function formatHours(hours: Record<string, string>): string {
  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  return dayOrder
    .filter(day => hours[day])
    .map(day => `- ${day.charAt(0).toUpperCase() + day.slice(1)}: ${hours[day]}`)
    .join('\n');
}

function formatServices(services: Service[]): string {
  return services
    .map(s => {
      let line = `- ${s.name}: ${s.price_range} (${s.duration} min)`;
      if (s.popular) line += ' ⭐ POPULAR';
      if (s.description) line += `\n  ${s.description}`;
      return line;
    })
    .join('\n');
}

function formatStylists(stylists: Stylist[]): string {
  return stylists
    .map(s => {
      let line = `- ${s.name}: ${s.specialties.join(', ')} (Available: ${s.available_days.join(', ')})`;
      if (s.senior) line += ' [Senior Stylist]';
      if (s.bio) line += `\n  ${s.bio}`;
      return line;
    })
    .join('\n');
}

function formatPolicies(policies: Policy[]): string {
  return policies
    .map(p => {
      let line = `- ${p.title}: ${p.content}`;
      if (p.priority === 'must_mention') line += ' [MUST MENTION]';
      return line;
    })
    .join('\n');
}

function formatFAQs(faqs: FAQ[]): string {
  return faqs
    .map(f => {
      let line = `Q: "${f.q}" → A: "${f.a}"`;
      if (f.triggers) line += ` (also matches: ${f.triggers.join(', ')})`;
      return line;
    })
    .join('\n');
}

function formatTransferRules(rules: TransferRules): string {
  const lines: string[] = [];
  if (rules.complaint) lines.push('- Complaints → Transfer immediately');
  if (rules.complex_consultation) lines.push('- Complex consultations (color correction, major changes) → Transfer');
  if (rules.vip_client) lines.push('- VIP or returning clients requesting specific stylist → Transfer');
  if (rules.pricing_dispute) lines.push('- Pricing disputes → Transfer');
  if (rules.emergency) lines.push('- Hair emergencies → Transfer immediately');
  if (rules.custom) {
    for (const rule of rules.custom) {
      lines.push(`- ${rule.trigger} → Transfer (${rule.reason})`);
    }
  }
  lines.push('- When unsure → Offer to transfer: "I can also connect you directly with our team"');
  return lines.join('\n');
}

// ─── Voice Function Definitions ────────────────────────────────────

export const VOICE_FUNCTIONS = [
  {
    name: 'check_availability',
    description: 'Check available appointment slots for a given date and optionally a specific stylist or service',
    parameters: {
      type: 'object' as const,
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
        stylist: { type: 'string', description: 'Preferred stylist name (optional)' },
        service: { type: 'string', description: 'Service type to check availability for (optional)' },
      },
      required: ['date'] as const,
    },
  },
  {
    name: 'book_appointment',
    description: 'Book an appointment for the caller',
    parameters: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Customer name' },
        phone: { type: 'string', description: 'Customer phone number' },
        service: { type: 'string', description: 'Service requested' },
        stylist: { type: 'string', description: 'Preferred stylist name (optional)' },
        date: { type: 'string', description: 'Appointment date in YYYY-MM-DD format' },
        time: { type: 'string', description: 'Appointment time in HH:MM format' },
      },
      required: ['name', 'phone', 'service', 'date', 'time'] as const,
    },
  },
  {
    name: 'cancel_appointment',
    description: 'Cancel an existing appointment. Always confirm cancellation with the caller first.',
    parameters: {
      type: 'object' as const,
      properties: {
        phone: { type: 'string', description: 'Caller phone number to look up appointment' },
        reason: { type: 'string', description: 'Reason for cancellation (optional)' },
      },
      required: ['phone'] as const,
    },
  },
  {
    name: 'transfer_to_staff',
    description: 'Transfer the call to a human staff member. Use when the caller has a complaint, needs a complex consultation, or specifically asks to speak to someone.',
    parameters: {
      type: 'object' as const,
      properties: {
        reason: { type: 'string', description: 'Reason for transfer' },
        stylist: { type: 'string', description: 'Specific stylist to transfer to (optional)' },
      },
      required: ['reason'] as const,
    },
  },
  {
    name: 'send_sms',
    description: 'Send a text message to the caller. Use for booking confirmations, review links, or information they asked for.',
    parameters: {
      type: 'object' as const,
      properties: {
        message: { type: 'string', description: 'Message content to send' },
        type: { type: 'string', enum: ['confirmation', 'review_request', 'info', 'booking_link'], description: 'Type of message' },
      },
      required: ['message', 'type'] as const,
    },
  },
];

// ─── Default Voice Configurations ──────────────────────────────────

export const DEFAULT_VOICES: Record<BrandTone, { voice_id: string; name: string }> = {
  warm_professional: { voice_id: 'EXAVITQu4hl4svVMZw5J', name: 'Rachel' },   // Warm, professional female
  trendy_casual:     { voice_id: 'FGYM2lxPpBn6hJAhJU5M', name: 'Lily' },      // Young, casual female
  luxury_spa:        { voice_id: 'jAuH5CBdfjiDbnElFwTs', name: 'Charlotte' }, // Refined, elegant female
  friendly_neighborhood: { voice_id: 'FGYM2lxPpBn6hJAhJU5M', name: 'Lily' }, // Friendly, approachable
};

export const DEFAULT_VOICE_SETTINGS = {
  warm_professional: { stability: 0.6, similarity_boost: 0.75, style: 0.3 },
  trendy_casual:     { stability: 0.5, similarity_boost: 0.75, style: 0.5 },
  luxury_spa:        { stability: 0.7, similarity_boost: 0.8,  style: 0.2 },
  friendly_neighborhood: { stability: 0.6, similarity_boost: 0.75, style: 0.4 },
};