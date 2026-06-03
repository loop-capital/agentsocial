/**
 * Seed script: Insert Pleij Salon & Spa as the first GetUpLook case study.
 *
 * Run: npx ts-node packages/api/src/scripts/seed-case-studies.ts
 */

const PLEIJ_CASE_STUDY = {
  slug: 'pleij-salon',
  business_name: 'Pleij Salon & Spa',
  category: 'salon',
  tier: 'Elite',
  before_metrics: {
    onlineVisibility: 'Low — minimal Google Business Profile optimization',
    reviews: '0 reviews on Google',
    chatAvailability: 'No online chat — phone-only during business hours',
    bookingProcess: 'Manual phone scheduling, no online booking',
    responseTime: '24–48 hours for inquiries',
    localSearchRanking: 'Not in top 10 for key local searches',
  },
  after_metrics: {
    onlineVisibility: 'Optimized GBP with photos, posts, and Q&A — top 3 local pack',
    reviews: '50+ five-star Google reviews in 6 months',
    chatAvailability: '24/7 AI chat widget — instant answers & booking',
    bookingProcess: 'Online booking with automated reminders & rebooking',
    responseTime: 'Instant via AI chat, < 2 min average',
    localSearchRanking: '#1–#3 for "salon near me" & related terms',
  },
  testimonial: {
    quote:
      'GetUpLook transformed our online presence. We went from invisible on Google to the top result in our area. The AI chat widget alone has booked dozens of new clients who would have gone elsewhere.',
    author: 'Maria Pleij',
    role: 'Owner, Pleij Salon & Spa',
    photo: '/images/case-studies/pleij-portrait.jpg',
  },
  features: [
    { icon: '⭐', title: 'Elite Tier', description: 'Full platform access including priority support and advanced analytics' },
    { icon: '🔍', title: 'GBP Optimization', description: 'Complete Google Business Profile setup, optimization, and ongoing management' },
    { icon: '💬', title: '24/7 AI Chat Widget', description: 'Always-on chat that answers questions, books appointments, and captures leads' },
    { icon: '📅', title: 'Automated Rebooking', description: 'Smart reminders and one-click rebooking that keeps clients coming back' },
    { icon: '📊', title: 'Review Management', description: 'Automated review requests and response suggestions to build social proof' },
    { icon: '📈', title: 'Local SEO Boost', description: 'Targeted optimization for local search visibility and map pack ranking' },
  ],
  photos: ['/images/case-studies/pleij-hero.jpg'],
  is_published: true,
  published_at: '2026-05-13T00:00:00Z',
};

// SQL for direct insertion (adapt to your DB client)
const SQL = `
INSERT INTO case_studies (slug, business_name, category, tier, before_metrics, after_metrics, testimonial, features, photos, is_published, published_at)
VALUES (
  '${PLEIJ_CASE_STUDY.slug}',
  '${PLEIJ_CASE_STUDY.business_name}',
  '${PLEIJ_CASE_STUDY.category}',
  '${PLEIJ_CASE_STUDY.tier}',
  '${JSON.stringify(PLEIJ_CASE_STUDY.before_metrics)}'::jsonb,
  '${JSON.stringify(PLEIJ_CASE_STUDY.after_metrics)}'::jsonb,
  '${JSON.stringify(PLEIJ_CASE_STUDY.testimonial)}'::jsonb,
  '${JSON.stringify(PLEIJ_CASE_STUDY.features)}'::jsonb,
  '${JSON.stringify(PLEIJ_CASE_STUDY.photos)}'::jsonb,
  true,
  '2026-05-13T00:00:00Z'
)
ON CONFLICT (slug) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  before_metrics = EXCLUDED.before_metrics,
  after_metrics = EXCLUDED.after_metrics,
  testimonial = EXCLUDED.testimonial,
  features = EXCLUDED.features,
  photos = EXCLUDED.photos,
  is_published = EXCLUDED.is_published,
  updated_at = now();
`;

console.log('=== Case Study Seed SQL ===');
console.log(SQL);

// Export for programmatic use
export { PLEIJ_CASE_STUDY };

/**
 * To run with a DB pool:
 *
 * import { pool } from '../db';
 * await pool.query(SQL);
 * console.log('✅ Pleij Salon case study seeded');
 */