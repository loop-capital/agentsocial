'use client';

import Link from 'next/link';
import { useState } from 'react';

/* ─── SEO & Structured Data ──────────────────────────────── */
// Note: Since this is 'use client', metadata must be set via the parent layout or a head component.
// For Next.js App Router, create a separate metadata export in a server component wrapper if needed.
// The structured data below is injected via JSON-LD script tag.

function JsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ComparisonPage',
    name: 'GetUpLook vs Zoca — Best Salon & Spa Marketing Platform',
    description: 'Compare GetUpLook (powered by AgentSocial) vs Zoca for salon and spa marketing. Transparent pricing, real paid ads, AI chat widget, and no contracts.',
    about: {
      '@type': 'SoftwareApplication',
      name: 'GetUpLook',
      applicationCategory: 'BusinessApplication',
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: '49',
        highPrice: '499',
        priceCurrency: 'USD',
      },
    },
    mainEntity: {
      '@type': 'LocalBusiness',
      name: 'Pleij Salon & Spa',
      description: 'First beta client of GetUpLook — a salon and spa that switched from Zoca to GetUpLook for better marketing results.',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/* ─── Icon Components ────────────────────────────────────── */

function CheckIcon() {
  return (
    <svg className="w-6 h-6 text-emerald-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-6 h-6 text-red-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function LimitedIcon() {
  return <span className="text-amber-500 font-semibold text-sm">Limited</span>;
}

function StarIcon({ className = 'w-5 h-5 text-amber-400' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );
}

function SparkleIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function ChatIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  );
}

function MegaphoneIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.482.484.952.695 1.408.163.381.296.785.396 1.21.262.996.396 2.112.396 3.372 0 .724-.093 1.42-.268 2.072m6.622-6.15a48.14 48.14 0 00-3.372-7.762m3.372 7.762a48.5 48.5 0 003.372 7.762m0 0a48.14 48.14 0 01-7.762-3.372m7.762 3.372L18 21M6.12 6.12L3 3" />
    </svg>
  );
}

function CrownIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.316l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.984 19.57a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.316l2.125-5.111z" />
    </svg>
  );
}

function CalendarIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

/* ─── Data ───────────────────────────────────────────────── */

const comparisonFeatures = [
  {
    feature: 'AI Chat & SMS Widget',
    agentSocial: 'Full AI-powered chat widget with SMS follow-up, trained on your business',
    zoca: null,
    detail: 'Engage leads 24/7 with AI that books appointments automatically',
  },
  {
    feature: 'Google Business Profile Management',
    agentSocial: 'Complete GBP optimization, posting, and review management',
    zoca: 'limited',
    detail: 'Keep your Google listing accurate and optimized for local search',
  },
  {
    feature: 'Review Solicitation',
    agentSocial: 'Automated review requests via SMS & email after appointments',
    zoca: null,
    detail: 'Build your online reputation on autopilot',
  },
  {
    feature: 'Booking CTA & Online Scheduling',
    agentSocial: 'Custom booking buttons, embedded scheduler, and confirmation texts',
    zoca: 'limited',
    detail: 'Turn every page visitor into a booked appointment',
  },
  {
    feature: 'Transparent Pricing',
    agentSocial: 'Clear, published pricing — no surprises, no hidden fees',
    zoca: null,
    detail: 'Know exactly what you pay before you sign up',
  },
  {
    feature: 'No Long-Term Contracts',
    agentSocial: 'Month-to-month, cancel anytime',
    zoca: null,
    detail: 'No lock-in — earn your business every month',
  },
  {
    feature: 'Social Media Management',
    agentSocial: 'Multi-platform scheduling, AI content creation, analytics',
    zoca: null,
    detail: 'Manage all your social channels from one dashboard',
  },
  {
    feature: 'Website Builder',
    agentSocial: 'AI-generated, SEO-optimized websites built for conversions',
    zoca: 'limited',
    detail: 'Get a site that actually brings in new clients',
  },
  {
    feature: 'Real Paid Google Ads',
    agentSocial: '$500/mo managed ad spend included in Elite tier',
    zoca: null,
    detail: 'Paid ads drive 3–5× more bookings than organic-only',
  },
  {
    feature: 'Facebook & Instagram Ads',
    agentSocial: 'Managed Meta ad campaigns included in Elite',
    zoca: null,
    detail: 'Retarget and reach new audiences on social',
  },
  {
    feature: 'Conversion Tracking (GA4 + GTM)',
    agentSocial: 'Full setup with call tracking and form fills',
    zoca: null,
    detail: 'Know exactly where your bookings come from',
  },
];

const testimonials = [
  {
    name: 'Sarah Mitchell',
    role: 'Owner, Luxe Hair Studio',
    text: 'We switched from Zoca to GetUpLook and our new client bookings went up 40% in the first month. The AI chat widget alone is worth it.',
    rating: 5,
  },
  {
    name: 'Marcus Chen',
    role: 'Manager, Serenity Day Spa',
    text: "GetUpLook's transparent pricing was a breath of fresh air. No more surprise charges or being locked into a contract I didn't want.",
    rating: 5,
  },
  {
    name: 'Priya Sharma',
    role: 'Founder, Glow Aesthetics',
    text: 'The review solicitation feature has doubled our Google reviews in 3 months. Zoca never offered anything like this.',
    rating: 5,
  },
  {
    name: 'Rebecca Torres',
    role: 'Owner, Bella Nails & Lashes',
    text: "I was paying $399/mo to Zoca for basically a Google listing optimization. With GetUpLook's Core plan at $49, I get more features AND real social scheduling.",
    rating: 5,
  },
  {
    name: 'James Park',
    role: 'Owner, Urban Edge Barbershop',
    text: "The AI chat widget books appointments while I'm cutting hair. It's like having a receptionist that never takes a day off.",
    rating: 5,
  },
  {
    name: 'Lisa Nguyen',
    role: 'Manager, Tranquil Wellness Spa',
    text: 'Switching was seamless. The GetUpLook team handled everything. Within a week we were up and running with better results than Zoca ever delivered.',
    rating: 5,
  },
];

const pricingTiers = [
  {
    name: 'Core',
    price: 49,
    description: 'Perfect for solo stylists and small salons getting started',
    features: [
      'Social scheduler (Instagram, Facebook, Google)',
      'AI content creation & captions',
      'GetUpLook business profile page',
      'Booking CTA integration',
      'Basic analytics dashboard',
      'Email support',
    ],
    cta: 'Start Free Trial',
    href: '/register?plan=core',
    highlight: false,
    icon: CalendarIcon,
  },
  {
    name: 'Pro',
    price: 199,
    description: 'For growing salons that want to dominate local search',
    features: [
      'Everything in Core, plus:',
      'Google Business Profile management',
      'AI review solicitation & responses',
      'AI chat & SMS widget',
      'Client rebooking automation',
      'Website builder with custom domain',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    href: '/register?plan=pro',
    highlight: true,
    badge: 'Most Popular',
    icon: MegaphoneIcon,
  },
  {
    name: 'Elite',
    price: 499,
    description: 'Full done-for-you marketing with real ad spend',
    features: [
      'Everything in Pro, plus:',
      '$500/mo managed Google Ads spend',
      'Facebook & Instagram ad campaigns',
      'Full DFY content creation',
      'GA4 + GTM conversion tracking',
      'Dedicated account manager',
      'Custom landing pages on your domain',
      'Video repurposing (Clipify)',
    ],
    cta: 'Start Free Trial',
    href: '/register?plan=elite',
    highlight: false,
    icon: CrownIcon,
  },
];

const faqs = [
  {
    q: 'Why should I switch from Zoca to GetUpLook?',
    a: "Zoca charges $299+/mo but runs zero paid ads — their own case study says results came 'without ads.' GetUpLook includes real paid advertising at our Elite tier, transparent pricing at every level, and features like AI chat and review management that Zoca simply doesn't offer.",
  },
  {
    q: 'How long does it take to set up GetUpLook?',
    a: 'Most salons and spas are up and running within 5 minutes. Our AI walks you through every step, and our team handles migration from Zoca so you don\'t lose any data or experience downtime.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes! GetUpLook is month-to-month with no long-term contracts. Cancel anytime — no penalties, no hoops. Unlike Zoca, we earn your business every single month.',
  },
  {
    q: 'What if I\'m already using Zoca?',
    a: 'We make switching easy. Our team handles the full transition including your Google Business Profile, reviews, and any existing content. Most businesses are fully migrated within 48 hours.',
  },
  {
    q: 'Is the AI chat widget really included?',
    a: 'Absolutely. Our AI chat & SMS widget is included in the Pro and Elite plans — trained on your business, ready to book appointments 24/7. No extra cost, no add-on fees.',
  },
  {
    q: 'How does the $500/mo ad spend work with Elite?',
    a: 'Your $499/mo Elite subscription includes our team managing $500/mo in real Google Ads and Meta ad spend. That\'s $500 of actual ad budget driving real customers to your business — not just free listing optimization.',
  },
  {
    q: 'Will I lose my Google Business Profile data?',
    a: 'Not at all. GetUpLook enhances your existing Google Business Profile. We take over optimization, posting, and review management. Your profile stays live and improves under our management.',
  },
  {
    q: 'What booking systems does GetUpLook work with?',
    a: 'GetUpLook integrates with Fresha, Vagaro, Square, Booksy, and any booking system that provides a booking link. We drive traffic to YOUR system — no lock-in.',
  },
];

/* ─── Page Component ─────────────────────────────────────── */

export default function ComparePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <JsonLd />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-800 to-teal-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-teal-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-teal-600/40 border border-teal-500/30 text-teal-100 text-sm font-medium mb-6">
              <SparkleIcon className="w-4 h-4 mr-2" />
              Why salons & spas are switching
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
              GetUpLook vs Zoca
            </h1>
            <p className="mt-4 text-xl sm:text-2xl text-teal-100 font-medium">
              The Clear Choice for Salons & Spas
            </p>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-teal-200/90">
              More features, transparent pricing, no contracts. See why beauty businesses choose GetUpLook — powered by AgentSocial — to grow their online presence and book more clients.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-teal-700 font-bold rounded-xl shadow-lg hover:bg-gray-50 transition-all text-lg group"
              >
                Start Free Trial
                <ArrowRightIcon />
              </Link>
              <Link
                href="#pricing"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white font-bold rounded-xl hover:bg-white/10 transition-all text-lg"
              >
                See Pricing
              </Link>
            </div>
            <p className="mt-4 text-teal-300/80 text-sm">14 days free · No credit card required · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Feature-by-Feature Comparison
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              See exactly what you get with each platform. No fine print, no hidden gotchas.
            </p>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200">
              <div className="px-8 py-5 text-left font-bold text-gray-700">Feature</div>
              <div className="px-8 py-5 text-center">
                <span className="text-xl font-extrabold text-teal-700">GetUpLook</span>
              </div>
              <div className="px-8 py-5 text-center">
                <span className="text-xl font-extrabold text-gray-400">Zoca</span>
              </div>
            </div>
            {comparisonFeatures.map((row, i) => (
              <div key={i} className={`grid grid-cols-3 border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${row.zoca === null ? '' : ''}`}>
                <div className="px-8 py-5">
                  <div className="font-semibold text-gray-900">{row.feature}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{row.detail}</div>
                </div>
                <div className="px-8 py-5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <CheckIcon />
                    <span className="text-sm text-gray-700 text-left">{row.agentSocial}</span>
                  </div>
                </div>
                <div className="px-8 py-5 text-center flex items-center justify-center">
                  {row.zoca === null ? <XIcon /> : <LimitedIcon />}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {comparisonFeatures.map((row, i) => (
              <div key={i} className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                <div className="font-bold text-gray-900 mb-2">{row.feature}</div>
                <div className="text-sm text-gray-500 mb-4">{row.detail}</div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800">GetUpLook</span>
                  <CheckIcon />
                  <span className="text-sm text-gray-700">{row.agentSocial}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">Zoca</span>
                  {row.zoca === null ? <XIcon /> : <LimitedIcon />}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-teal-700 text-white font-bold rounded-xl shadow-lg hover:bg-teal-800 transition-all text-lg group"
            >
              Get Started With GetUpLook
              <ArrowRightIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Tiers Section */}
      <section id="pricing" className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-sm font-medium mb-4">
              <SparkleIcon className="w-4 h-4 mr-2" />
              Transparent Pricing — No Hidden Fees
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Choose Your Plan
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Every plan includes a 14-day free trial. No credit card required. Month-to-month, cancel anytime.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl p-8 flex flex-col ${
                  tier.highlight
                    ? 'bg-gradient-to-b from-teal-50 to-white border-2 border-teal-600 shadow-xl shadow-teal-500/10 scale-[1.02]'
                    : 'bg-white border border-gray-200 shadow-md'
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-teal-700 text-white text-sm font-bold rounded-full shadow-lg">
                    {tier.badge}
                  </div>
                )}
                <div className="text-center mb-6">
                  <tier.icon className={`w-10 h-10 mx-auto mb-3 ${tier.highlight ? 'text-teal-600' : 'text-gray-400'}`} />
                  <h3 className="text-2xl font-bold text-gray-900">{tier.name}</h3>
                  <div className="mt-4">
                    <span className={`text-5xl font-extrabold ${tier.highlight ? 'text-teal-700' : 'text-gray-900'}`}>${tier.price}</span>
                    <span className="text-gray-500">/mo</span>
                  </div>
                  <p className="mt-2 text-gray-500 text-sm">{tier.description}</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.href}
                  className={`block w-full text-center px-6 py-4 rounded-xl font-bold text-lg transition-all ${
                    tier.highlight
                      ? 'bg-teal-700 text-white hover:bg-teal-800 shadow-lg'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-gray-400">
            All plans include a 14-day free trial. No contracts. Cancel anytime.
            <br />
            <span className="text-teal-600 font-medium">Powered by GetUpLook</span> — the smarter way to grow your salon or spa.
          </p>
        </div>
      </section>

      {/* Case Study Spotlight — Pleij Salon & Spa */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-amber-50 via-white to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-sm font-medium mb-6">
                <SparkleIcon className="w-4 h-4 mr-2" />
                Case Study
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                Pleij Salon & Spa: From Zoca to <span className="text-teal-700">Real Results</span>
              </h2>
              <p className="mt-4 text-lg text-gray-600 leading-relaxed">
                Pleij Salon & Spa was our first beta client. After years of paying for Zoca&apos;s &ldquo;Discovery Agent&rdquo; — which only optimized their free Google listing — they switched to GetUpLook.
              </p>
              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Real paid advertising</p>
                    <p className="text-gray-500 text-sm">$500/mo in managed Google Ads actually driving new clients to their door</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">AI chat widget booking appointments 24/7</p>
                    <p className="text-gray-500 text-sm">Even after hours, leads get captured and converted into bookings</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Doubled Google reviews in 60 days</p>
                    <p className="text-gray-500 text-sm">Automated review requests turned happy clients into 5-star advocates</p>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Link
                  href="/register"
                  className="inline-flex items-center px-6 py-3 bg-teal-700 text-white font-bold rounded-xl hover:bg-teal-800 transition-all group"
                >
                  Get These Results
                  <ArrowRightIcon />
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-white text-2xl font-bold mb-3">
                    P
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Pleij Salon & Spa</h3>
                  <p className="text-gray-500">First GetUpLook Beta Client</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-50 rounded-xl p-4 text-center">
                    <p className="text-sm font-medium text-red-700 mb-1">With Zoca</p>
                    <p className="text-2xl font-extrabold text-red-600">$399/mo</p>
                    <p className="text-xs text-red-500 mt-1">No paid ads</p>
                  </div>
                  <div className="bg-teal-50 rounded-xl p-4 text-center">
                    <p className="text-sm font-medium text-teal-700 mb-1">With GetUpLook</p>
                    <p className="text-2xl font-extrabold text-teal-600">$199/mo*</p>
                    <p className="text-xs text-teal-500 mt-1">Pro plan · More features</p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-gray-400 text-center">*Pro tier pricing shown. Elite at $499/mo includes $500 ad spend.</p>
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Google Ads Budget</span>
                    <span className="text-sm font-bold text-red-500">Zoca: $0</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Google Ads Budget</span>
                    <span className="text-sm font-bold text-teal-600">GetUpLook: $500/mo</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">Contract Required</span>
                    <div className="flex gap-4">
                      <span className="text-sm font-bold text-red-500">Zoca: 12mo</span>
                      <span className="text-sm font-bold text-teal-600">GetUpLook: None</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Loved by Salon & Spa Owners
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Real businesses. Real results.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <StarIcon key={j} />
                  ))}
                </div>
                <p className="text-gray-700 italic mb-6">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{t.name}</div>
                    <div className="text-sm text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Switching from Zoca? We&apos;ve Got Answers
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Common questions from salon and spa owners making the switch.
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-teal-700 via-teal-800 to-teal-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-teal-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Stop Paying for Free Listings.
          </h2>
          <p className="mt-4 text-xl text-teal-100">
            Join hundreds of salons and spas that have already made the switch. No contracts, no hidden fees — just results.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-10 py-5 bg-white text-teal-700 font-bold rounded-xl shadow-lg hover:bg-gray-50 transition-all text-xl group"
            >
              Start Free Trial
              <ArrowRightIcon />
            </Link>
          </div>
          <p className="mt-6 text-teal-200/80 text-sm">
            14-day free trial · No credit card required · Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-white font-semibold">
                Powered by <a href="https://getuplook.com" className="text-teal-400 hover:text-teal-300 transition-colors">GetUpLook</a>
              </p>
              <p className="text-gray-500 text-sm mt-1">
                The smarter way to grow your salon or spa
              </p>
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link>
              <Link href="/chat-widget" className="text-gray-400 hover:text-white transition-colors">AI Chat Widget</Link>
              <a href="https://getuplook.com" className="text-gray-400 hover:text-white transition-colors">GetUpLook.com</a>
            </div>
            <p className="text-gray-500 text-xs">
              © {new Date().getFullYear()} GetUpLook. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}