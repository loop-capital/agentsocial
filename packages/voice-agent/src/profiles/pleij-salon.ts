/**
 * PLEIJ Salon — Business Profile
 * 
 * Complete business knowledge for the AI receptionist.
 * This data gets injected into the LLM system prompt at call time,
 * enabling natural conversations about any aspect of the business.
 * 
 * No rigid scripts — the agent can handle ANY question because
 * it has full business context in the prompt.
 */

import type { BusinessProfile } from './business-profile.js';

export const PLEIJ_PROFILE: BusinessProfile = {
  // ─── Identity ─────────────────────────────────────────────────
  id: 'pleij-salon',
  name: 'PLEIJ Salon',
  dba: 'PLEIJ',
  phone: '+1614XXXXXXX',       // Replace with actual Twilio number
  address: '4170 N High St, Columbus, OH 43214',
  website: 'https://pleijsalon.com',
  google_maps_url: 'https://maps.google.com/?cid=pleij-salon-columbus',

  // ─── Personality ──────────────────────────────────────────────
  brand_tone: 'warm_professional',
  greeting_style: 'casual',
  agent_name: 'Alex',
  agent_persona: 'You love helping people look and feel their best. You know PLEIJ inside and out — services, stylists, pricing, and the vibe of the salon. You sound like someone who actually works there, not a robot reading a script.',

  // ─── Services & Pricing ───────────────────────────────────────
  service_categories: ['cuts', 'color', 'treatments', 'styling', 'extensions'],

  services: [
    // Cuts
    { name: 'Women\'s Haircut', category: 'cuts', price_range: '$55–$85', duration: 45, popular: true,
      description: 'Precision cut tailored to your face shape and lifestyle' },
    { name: 'Men\'s Haircut', category: 'cuts', price_range: '$35–$45', duration: 30, popular: true },
    { name: 'Bang Trim', category: 'cuts', price_range: '$15–$20', duration: 15,
      description: 'Quick bang trim between visits' },
    { name: 'Kids\' Cut (12 & under)', category: 'cuts', price_range: '$25–$35', duration: 25 },

    // Color
    { name: 'Single Process Color', category: 'color', price_range: '$120–$160', duration: 120, popular: true,
      description: 'Full color from root to tip' },
    { name: 'Highlights', category: 'color', price_range: '$150–$200', duration: 150 },
    { name: 'Balayage', category: 'color', price_range: '$180–$250', duration: 180, popular: true,
      description: 'Hand-painted highlights for a natural, sun-kissed look' },
    { name: 'Color Correction', category: 'color', price_range: '$200+', duration: 240,
      description: 'Fix previous color mistakes — consultation required' },
    { name: 'Root Touch-Up', category: 'color', price_range: '$80–$110', duration: 60 },
    { name: 'Gloss Treatment', category: 'color', price_range: '$50–$75', duration: 30,
      description: 'Adds shine and refreshes color between visits' },

    // Treatments
    { name: 'Keratin Smoothing Treatment', category: 'treatments', price_range: '$200–$350', duration: 120, popular: true,
      description: 'Reduces frizz and adds shine for up to 3 months' },
    { name: 'Deep Conditioning Treatment', category: 'treatments', price_range: '$30–$50', duration: 30 },
    { name: 'Scalp Treatment', category: 'treatments', price_range: '$40–$60', duration: 30 },
    { name: 'Olaplex Treatment', category: 'treatments', price_range: '$40–$75', duration: 30,
      description: 'Bond repair for damaged hair — add to any service' },

    // Styling
    { name: 'Blowout', category: 'styling', price_range: '$35–$55', duration: 30, popular: true },
    { name: 'Updo / Special Event Style', category: 'styling', price_range: '$75–$120', duration: 60 },
    { name: 'Braids & Twists', category: 'styling', price_range: '$60–$100', duration: 60 },

    // Extensions
    { name: 'Tape-In Extensions', category: 'extensions', price_range: '$400+ (varies)', duration: 180,
      description: 'Consultation required for pricing' },
  ],

  // ─── Stylists ────────────────────────────────────────────────
  stylists: [
    {
      name: 'Ashley',
      specialties: ['Balayage', 'Color', 'Haircut', 'Extensions'],
      available_days: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      bio: 'Balayage specialist with 8 years of experience. Known for natural, sun-kissed color.',
      senior: true,
    },
    {
      name: 'Jessica',
      specialties: ['Keratin', 'Blowout', 'Updo', 'Bridal'],
      available_days: ['Wednesday', 'Thursday', 'Friday', 'Saturday'],
      bio: 'Our go-to for special events and keratin treatments. Creates stunning updos.',
      senior: true,
    },
    {
      name: 'Morgan',
      specialties: ['Short Hair', 'Color Correction', 'Haircut', 'Men\'s Cuts'],
      available_days: ['Tuesday', 'Thursday', 'Friday', 'Saturday'],
      bio: 'Specializes in bold transformations and precision cuts. Great with color correction.',
      senior: false,
    },
  ],

  // ─── Hours ────────────────────────────────────────────────────
  hours: {
    monday: 'Closed',
    tuesday: '10:00 AM – 7:00 PM',
    wednesday: '10:00 AM – 7:00 PM',
    thursday: '10:00 AM – 7:00 PM',
    friday: '10:00 AM – 7:00 PM',
    saturday: '9:00 AM – 5:00 PM',
    sunday: 'Closed',
  },

  // ─── Policies ─────────────────────────────────────────────────
  cancellation_policy: 'We require 24 hours notice for cancellations. Late cancellations or no-shows may be subject to a fee.',
  parking_info: 'Free parking available behind the building. Street parking on N High St as well.',
  new_client_offer: 'First-time clients get 20% off any service! Just mention this when booking.',
  special_notes: '',  // Set dynamically for holidays, events, etc.

  policies: [
    {
      title: 'Cancellation Policy',
      content: 'We require 24 hours notice for cancellations. Late cancellations or no-shows may be subject to a 50% charge of the scheduled service.',
      priority: 'must_mention',
    },
    {
      title: 'New Client Discount',
      content: 'First-time clients receive 20% off any service.',
      priority: 'if_asked',
    },
    {
      title: 'Color Consultation',
      content: 'For major color changes or corrections, we recommend a complimentary consultation before booking the service.',
      priority: 'if_asked',
    },
    {
      title: 'Arrival',
      content: 'Please arrive 5 minutes before your appointment. If you\'re more than 15 minutes late, we may need to reschedule.',
      priority: 'background',
    },
    {
      title: 'Products',
      content: 'We carry Davines, Olaplex, and Kevin Murphy products for purchase.',
      priority: 'if_asked',
    },
  ],

  // ─── FAQs ─────────────────────────────────────────────────────
  faqs: [
    {
      q: 'What are your hours?',
      a: 'We\'re open Tuesday through Friday 10am to 7pm, and Saturday 9am to 5pm. We\'re closed Sunday and Monday.',
      triggers: ['hours', 'open', 'when', 'what time'],
    },
    {
      q: 'Where are you located?',
      a: 'We\'re at 4170 North High Street in Clintonville, Columbus. There\'s free parking behind the building.',
      triggers: ['location', 'where', 'address', 'directions'],
    },
    {
      q: 'Do you take walk-ins?',
      a: 'We prefer appointments to make sure we can give you the time you deserve, but we can sometimes accommodate walk-ins. It\'s always best to call ahead or book online.',
      triggers: ['walk-in', 'walk in', 'without appointment', 'just come'],
    },
    {
      q: 'How much does a haircut cost?',
      a: 'Women\'s haircuts start at $55 and go up to $85 depending on the stylist and length. Men\'s cuts are $35–$45. We also offer kids\' cuts starting at $25.',
      triggers: ['haircut cost', 'how much', 'price', 'pricing'],
    },
    {
      q: 'Do you do color services?',
      a: 'Absolutely! We offer single process color starting at $120, highlights from $150, and our popular balayage from $180. We also do root touch-ups, gloss treatments, and color corrections.',
      triggers: ['color', 'dye', 'highlights', 'balayage'],
    },
    {
      q: 'What\'s balayage?',
      a: 'Balayage is a hand-painted highlighting technique that creates a natural, sun-kissed look. It\'s lower maintenance than traditional highlights because it grows out seamlessly. Our balayage starts at $180.',
      triggers: ['balayage', 'hand-painted', 'natural highlights'],
    },
    {
      q: 'How do I book an appointment?',
      a: 'I can help you book right now over the phone! I just need your name, phone number, what service you\'d like, and your preferred date and time. You can also book online at pleijsalon.com.',
      triggers: ['book', 'appointment', 'schedule', 'make appointment'],
    },
    {
      q: 'What\'s your cancellation policy?',
      a: 'We ask for 24 hours notice for cancellations. Late cancellations or no-shows may be subject to a 50% charge. We totally understand things come up — just give us a call as soon as you know!',
      triggers: ['cancel', 'cancellation', 'reschedule', 'change appointment'],
    },
    {
      q: 'Do you have parking?',
      a: 'Yes! We have free parking right behind the building, plus street parking on High Street.',
      triggers: ['parking', 'park', 'where to park'],
    },
    {
      q: 'What products do you use?',
      a: 'We carry Davines, Olaplex, and Kevin Murphy products. They\'re available for purchase in the salon.',
      triggers: ['products', 'brands', 'product line'],
    },
  ],

  // ─── Call Behavior ────────────────────────────────────────────
  transfer_rules: {
    complaint: true,
    complex_consultation: true,
    vip_client: true,
    pricing_dispute: true,
    emergency: true,
    custom: [
      { trigger: 'caller asks for a specific stylist by name and wants to talk directly', reason: 'Client-stylist relationship' },
      { trigger: 'caller has a color emergency or hair disaster', reason: 'Urgent hair situation' },
    ],
  },

  max_call_minutes: 5,
  silence_timeout_seconds: 10,

  // ─── Voice ────────────────────────────────────────────────────
  voice_id: 'EXAVITQu4hl4svVMZw5J',  // Rachel
  voice_stability: 0.6,
  voice_similarity_boost: 0.75,
  voice_style: 0.3,

  // ─── Campaigns ────────────────────────────────────────────────
  campaigns: {
    rebooking: {
      days_after_appointment: 21,
      message_template: 'Hi {name}! It\'s been a while since your last visit to PLEIJ Salon. Ready for your next appointment? Reply YES to book or call us at {phone}.',
    },
    review_request: {
      days_after_appointment: 3,
      message_template: 'Hi {name}! Thanks for visiting PLEIJ Salon. We\'d love your feedback! Would you mind leaving us a quick Google review? {review_link}',
    },
  },

  // ─── API Integration ──────────────────────────────────────────
  agentsocial_api_url: process.env.AGENTSOCIAL_API_URL || 'http://localhost:3001',
  agentsocial_api_key: process.env.AGENTSOCIAL_API_KEY || '',
  twilio_phone_number: process.env.TWILIO_PHONE_NUMBER || '',
  transfer_phone_number: process.env.PLEIJ_TRANSFER_NUMBER || '+1614XXXXXXX',
};

export default PLEIJ_PROFILE;