import React from 'react';
import type { Metadata } from 'next';
import { GetUpLookBadge } from '@/components/getuplook-badge';

// Static data — will be replaced with DB fetch later
const caseStudies: Record<string, CaseStudy> = {
  'pleij-salon': {
    slug: 'pleij-salon',
    businessName: 'Pleij Salon & Spa',
    category: 'salon',
    tier: 'Elite',
    heroPhoto: '/images/case-studies/pleij-hero.jpg',
    beforeMetrics: {
      onlineVisibility: 'Low — minimal Google Business Profile optimization',
      reviews: '0 reviews on Google',
      chatAvailability: 'No online chat — phone-only during business hours',
      bookingProcess: 'Manual phone scheduling, no online booking',
      responseTime: '24–48 hours for inquiries',
      localSearchRanking: 'Not in top 10 for key local searches',
    },
    afterMetrics: {
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
    publishedAt: '2026-05-13',
  },
};

interface CaseStudy {
  slug: string;
  businessName: string;
  category: string;
  tier: string;
  heroPhoto: string;
  beforeMetrics: Record<string, string>;
  afterMetrics: Record<string, string>;
  testimonial: { quote: string; author: string; role: string; photo: string };
  features: { icon: string; title: string; description: string }[];
  photos: string[];
  publishedAt: string;
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const study = caseStudies[slug];
  if (!study) return { title: 'Case Study Not Found' };

  return {
    title: `${study.businessName} Case Study — GetUpLook`,
    description: `See how ${study.businessName} grew their online presence with GetUpLook. ${study.afterMetrics.reviews} and counting.`,
    openGraph: {
      title: `${study.businessName} Case Study — GetUpLook`,
      description: `From invisible to #1 locally. ${study.businessName} shares their GetUpLook success story.`,
      images: [study.heroPhoto],
      type: 'article',
    },
  };
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const study = caseStudies[slug];

  if (!study) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Case Study Not Found</h1>
        <p className="mt-4 text-gray-500">We couldn&apos;t find this case study. Browse all case studies below.</p>
        <a href="/case-studies" className="mt-6 inline-block text-emerald-600 hover:text-emerald-700 font-medium">
          ← Back to Case Studies
        </a>
      </div>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${study.businessName} Case Study — GetUpLook`,
    description: `How ${study.businessName} grew their online presence with GetUpLook.`,
    image: study.heroPhoto,
    datePublished: study.publishedAt,
    author: { '@type': 'Organization', name: 'GetUpLook' },
    publisher: { '@type': 'Organization', name: 'GetUpLook', logo: { '@type': 'ImageObject', url: 'https://getuplook.com/logo.png' } },
  };

  const metricLabels = Object.keys(study.beforeMetrics);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-10" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <span className="inline-flex items-center gap-1.5 bg-yellow-400 text-yellow-900 text-xs font-bold uppercase px-3 py-1 rounded-full">
              ⭐ {study.tier} Tier
            </span>
            <span className="text-emerald-200 text-sm capitalize">{study.category}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
            {study.businessName}
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-emerald-100 max-w-2xl">
            From invisible online to the #1 local result. Here&apos;s how {study.businessName} did it with GetUpLook.
          </p>
          <div className="mt-8">
            <GetUpLookBadge businessName={study.businessName} slug={study.slug} rating={4.9} reviewCount={50} variant="compact" />
          </div>
        </div>
      </section>

      {/* Before / After */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">The Transformation</h2>
        <p className="text-gray-500 mb-10">See the measurable impact GetUpLook delivered for {study.businessName}.</p>

        <div className="grid gap-6">
          {metricLabels.map((label) => (
            <div key={label} className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-red-50 border border-red-200 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-1">Before</p>
                <p className="text-sm font-medium text-gray-800 capitalize">{label.replace(/([A-Z])/g, ' $1')}</p>
                <p className="text-gray-700 mt-1">{study.beforeMetrics[label]}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500 mb-1">After GetUpLook</p>
                <p className="text-sm font-medium text-gray-800 capitalize">{label.replace(/([A-Z])/g, ' $1')}</p>
                <p className="text-gray-700 mt-1">{study.afterMetrics[label]}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">What They Use</h2>
          <p className="text-gray-500 mb-10">{study.businessName} leverages these GetUpLook features on the {study.tier} plan.</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {study.features.map((f) => (
              <div key={f.title} className="bg-white rounded-xl border border-gray-200 p-6 hover:border-emerald-300 hover:shadow-sm transition-all">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 sm:p-12 text-center">
          <svg className="w-10 h-10 mx-auto text-emerald-300 mb-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983z" />
          </svg>
          <blockquote className="text-xl sm:text-2xl font-medium text-gray-900 leading-relaxed">
            &ldquo;{study.testimonial.quote}&rdquo;
          </blockquote>
          <div className="mt-6">
            <p className="font-semibold text-emerald-800">{study.testimonial.author}</p>
            <p className="text-sm text-emerald-600">{study.testimonial.role}</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-emerald-600 to-teal-500 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">See Your Results on GetUpLook</h2>
          <p className="mt-4 text-lg text-emerald-100">
            Join {study.businessName} and hundreds of local businesses growing with GetUpLook.
          </p>
          <a
            href="/register"
            className="mt-8 inline-block bg-white text-emerald-700 font-bold px-8 py-4 rounded-xl text-lg hover:bg-emerald-50 transition-colors shadow-lg"
          >
            Get Started Free →
          </a>
        </div>
      </section>
    </>
  );
}