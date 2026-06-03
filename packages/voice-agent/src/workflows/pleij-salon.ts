/**
 * Dograh Workflow Definitions for PLEIJ Salon
 * These define the voice agent behavior for different call scenarios
 * 
 * Dograh uses a visual workflow builder. These configs can be imported
 * via Dograh's API to pre-configure agents.
 */

import { SALON_CONFIG } from '../services/salon-config.js';

// PLEIJ Salon Inbound Receptionist
export const pleijInboundWorkflow = {
  name: 'PLEIJ Salon - Receptionist',
  description: 'Inbound call handler for PLEIJ Salon — greets callers, answers questions, books appointments, transfers to staff',
  type: 'inbound' as const,

  // System prompt for the LLM
  system_prompt: `You are the AI receptionist for ${SALON_CONFIG.name}, a hair salon in Clintonville, Columbus, Ohio.

YOUR PERSONALITY:
- Warm, friendly, and professional — like a knowledgeable front desk person
- You love helping people feel beautiful
- You're efficient but never rushed
- You refer to the salon by name: "PLEIJ" (rhymes with "play")

YOUR GOALS:
1. Answer questions about hours, location, services, and pricing
2. Help callers book appointments
3. Transfer to a human stylist when appropriate
4. Capture lead information for follow-up

KEY INFO:
- Hours: Tue-Fri 10am-7pm, Sat 9am-5pm, Closed Sun-Mon
- Address: 4170 N High St, Columbus, OH 43214 (Clintonville)
- Services: Haircuts ($45-$85), Color ($120+), Balayage ($150+), Keratin ($200+), Blowouts ($35+)
- Parking: Free parking behind the building
- Cancellation: 24 hours notice required

BOOKING FLOW:
1. Ask what service they're interested in
2. Ask if they have a preferred stylist
3. Suggest available times (Tue-Sat)
4. Collect their name and phone number
5. Confirm the booking details
6. Say "We'll send you a confirmation text shortly!"

TRANSFER RULES:
- Complaints → Transfer immediately
- Color correction consultation → Transfer
- VIP clients requesting specific stylist → Transfer
- Hair emergencies → Transfer
- If unsure → Offer transfer ("I can also connect you directly with our team")

IMPORTANT:
- Never make up pricing or services not listed
- If you don't know something, offer to transfer
- Always end with: "Is there anything else I can help you with?"
- Keep responses concise — this is a phone conversation`,

  // Voice settings
  voice: {
    provider: 'elevenlabs' as const,
    voice_id: 'EXAVITQu4hl4svVMZw5J', // Rachel — warm, professional female voice
    model: 'eleven_turbo_v2_5',
    stability: 0.6,
    similarity_boost: 0.75,
    style: 0.3,
  },

  // STT settings
  stt: {
    provider: 'deepgram' as const,
    model: 'nova-2',
    language: 'en-US',
    punctuate: true,
    profanity_filter: false,
  },

  // LLM settings
  llm: {
    provider: 'openai' as const,
    model: 'gpt-4o-mini',
    temperature: 0.3,
    max_tokens: 150, // Keep responses short for voice
  },

  // Function calling capabilities
  functions: {
    check_availability: {
      description: 'Check available appointment slots for a given date and stylist',
      parameters: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
        stylist: { type: 'string', description: 'Stylist name (optional)' },
        service: { type: 'string', description: 'Service type' },
      },
    },
    book_appointment: {
      description: 'Book an appointment for the caller',
      parameters: {
        name: { type: 'string', description: 'Customer name' },
        phone: { type: 'string', description: 'Customer phone number' },
        service: { type: 'string', description: 'Service requested' },
        stylist: { type: 'string', description: 'Preferred stylist' },
        date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
        time: { type: 'string', description: 'Time in HH:MM format' },
      },
    },
    transfer_call: {
      description: 'Transfer the call to a human staff member',
      parameters: {
        reason: { type: 'string', description: 'Reason for transfer' },
        stylist: { type: 'string', description: 'Specific stylist to transfer to (optional)' },
      },
    },
    end_call: {
      description: 'Politely end the call',
      parameters: {
        reason: { type: 'string', description: 'Reason for ending' },
      },
    },
  },

  // Transfer phone number
  transfer_number: SALON_CONFIG.phone,
  
  // Max call duration
  max_duration_minutes: 5,
  
  // Inactivity timeout
  silence_timeout_seconds: 10,
  
  // Post-call webhook
  webhook_url: `${process.env.AGENTSOCIAL_API_URL || 'http://localhost:3010'}/webhooks/dograh/call-ended`,
};

// PLEIJ Salon Outbound Rebooking Agent
export const pleijRebookingWorkflow = {
  name: 'PLEIJ Salon - Rebooking Reminder',
  description: 'Outbound call to remind past clients to rebook',
  type: 'outbound' as const,

  system_prompt: `You are calling on behalf of ${SALON_CONFIG.name} to remind past clients about rebooking.

YOUR PERSONALITY:
- Friendly, casual, caring — like a friend checking in
- Brief and respectful of their time
- Never pushy

YOUR FLOW:
1. "Hi {name}, this is [assistant name] from PLEIJ Salon! How are you doing?"
2. "It's been about 3 weeks since your last visit and we'd love to see you again."
3. If interested → Offer to book an appointment
4. If not interested → "No problem! We'll reach out again next month. Have a great day!"
5. Always ask if they want to book with their previous stylist

IMPORTANT:
- Keep it under 2 minutes
- Never be pushy or guilt-trip
- If they sound busy, offer to text them a booking link instead
- End with "Thanks for your time, {name}!"`,

  voice: {
    provider: 'elevenlabs' as const,
    voice_id: 'EXAVITQu4hl4svVMZw5J',
    model: 'eleven_turbo_v2_5',
    stability: 0.7,
    similarity_boost: 0.75,
    style: 0.2,
  },

  stt: {
    provider: 'deepgram' as const,
    model: 'nova-2',
    language: 'en-US',
    punctuate: true,
  },

  llm: {
    provider: 'openai' as const,
    model: 'gpt-4o-mini',
    temperature: 0.4,
    max_tokens: 120,
  },

  max_duration_minutes: 3,
  silence_timeout_seconds: 8,
  
  webhook_url: `${process.env.AGENTSOCIAL_API_URL || 'http://localhost:3010'}/webhooks/dograh/call-ended`,
};

// PLEIJ Salon Review Request Agent
export const pleijReviewWorkflow = {
  name: 'PLEIJ Salon - Review Request',
  description: 'Outbound call to request Google reviews from recent clients',
  type: 'outbound' as const,

  system_prompt: `You are calling on behalf of ${SALON_CONFIG.name} to ask recent clients for a Google review.

YOUR PERSONALITY:
- Warm, grateful, not salesy
- Brief — respect their time
- Enthusiastic but genuine

YOUR FLOW:
1. "Hi {name}, this is from PLEIJ Salon! I hope you loved your visit with {stylist}."
2. "We're trying to grow our reviews on Google. Would you be willing to leave us a quick review?"
3. If YES → "Awesome! I'll text you a link right now. It takes about 30 seconds."
4. If NO → "No worries at all! Thanks for being a PLEIJ client. Have a great day!"

IMPORTANT:
- Keep under 90 seconds
- Never push if they decline
- Always offer the text option instead of requiring them to search`,

  voice: {
    provider: 'elevenlabs' as const,
    voice_id: 'EXAVITQu4hl4svVMZw5J',
    model: 'eleven_turbo_v2_5',
    stability: 0.7,
    similarity_boost: 0.75,
    style: 0.4,
  },

  stt: {
    provider: 'deepgram' as const,
    model: 'nova-2',
    language: 'en-US',
    punctuate: true,
  },

  llm: {
    provider: 'openai' as const,
    model: 'gpt-4o-mini',
    temperature: 0.3,
    max_tokens: 80,
  },

  max_duration_minutes: 2,
  silence_timeout_seconds: 8,
  
  webhook_url: `${process.env.AGENTSOCIAL_API_URL || 'http://localhost:3010'}/webhooks/dograh/call-ended`,
};

export const workflows = {
  pleij_inbound: pleijInboundWorkflow,
  pleij_rebooking: pleijRebookingWorkflow,
  pleij_review: pleijReviewWorkflow,
};