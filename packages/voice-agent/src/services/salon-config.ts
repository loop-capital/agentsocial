/**
 * PLEIJ Salon Configuration
 * All the salon-specific data the voice agent needs
 */

export const SALON_CONFIG = {
  id: 'pleij-salon',
  name: 'PLEIJ Salon',
  phone: '+1614XXXXXXX', // Replace with actual number
  address: '4170 N High St, Columbus, OH 43214',
  website: 'https://pleijsalon.com',
  
  hours: {
    tuesday: '10:00 AM - 7:00 PM',
    wednesday: '10:00 AM - 7:00 PM',
    thursday: '10:00 AM - 7:00 PM',
    friday: '10:00 AM - 7:00 PM',
    saturday: '9:00 AM - 5:00 PM',
    sunday: 'Closed',
    monday: 'Closed',
  },

  services: [
    { name: 'Haircut', category: 'cut', price_range: '$45-$85', duration: 45 },
    { name: 'Blowout', category: 'styling', price_range: '$35-$55', duration: 30 },
    { name: 'Full Color', category: 'color', price_range: '$120-$200', duration: 120 },
    { name: 'Highlights/Balayage', category: 'color', price_range: '$150-$250', duration: 150 },
    { name: 'Keratin Treatment', category: 'treatment', price_range: '$200-$350', duration: 120 },
    { name: 'Deep Conditioning', category: 'treatment', price_range: '$30-$50', duration: 30 },
    { name: 'Updo/Special Event', category: 'styling', price_range: '$75-$120', duration: 60 },
    { name: 'Bang Trim', category: 'cut', price_range: '$15-$20', duration: 15 },
  ],

  stylists: [
    { name: 'Ashley', specialties: ['Balayage', 'Color', 'Haircut'], available_days: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
    { name: 'Jessica', specialties: ['Keratin', 'Blowout', 'Updo'], available_days: ['Wednesday', 'Thursday', 'Friday', 'Saturday'] },
    { name: 'Morgan', specialties: ['Short Hair', 'Color Correction', 'Haircut'], available_days: ['Tuesday', 'Thursday', 'Friday', 'Saturday'] },
  ],

  faqs: [
    { q: 'What are your hours?', a: 'We\'re open Tuesday through Friday 10am to 7pm, Saturday 9am to 5pm. Closed Sunday and Monday.' },
    { q: 'Where are you located?', a: 'We\'re at 4170 North High Street in Columbus, Ohio, in Clintonville. There\'s free parking behind the building.' },
    { q: 'Do you take walk-ins?', a: 'We prefer appointments but can sometimes accommodate walk-ins. It\'s always best to call ahead or book online.' },
    { q: 'How much does a haircut cost?', a: 'Haircuts start at $45 and go up to $85 depending on the stylist and length of hair. Would you like to book an appointment?' },
    { q: 'Do you offer color services?', a: 'Yes! We offer full color starting at $120, highlights and balayage starting at $150, and color correction is available by consultation.' },
    { q: 'What\'s your cancellation policy?', a: 'We ask for 24 hours notice for cancellations. Late cancell or no-shows may be subject to a fee.' },
    { q: 'Do you have parking?', a: 'Yes, we have free parking behind the building and street parking on High Street.' },
  ],

  // Transfer rules — when to hand off to a human
  transfer_rules: {
    complaint: true,         // Always transfer complaints
    complex_color: true,     // Color correction needs consultation
    pricing_dispute: true,   // Transfer pricing issues
    vip_client: true,        // Known VIP clients get human
    emergency: true,         // Hair emergencies get human
  },

  // Rebooking campaign settings
  campaigns: {
    rebooking: {
      days_after_appointment: 21, // Contact 3 weeks after
      message: 'Hi {name}! It\'s been a while since your last visit to PLEIJ Salon. Ready for your next appointment? Reply YES to book or call us.',
    },
    review_request: {
      days_after_appointment: 3, // 3 days after
      message: 'Hi {name}! Thanks for visiting PLEIJ Salon. We\'d love your feedback! Would you mind leaving us a Google review? {review_link}',
    },
  },
} as const;

export type SalonConfig = typeof SALON_CONFIG;