import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Case Studies — GetUpLook',
  description: 'See how local businesses grow with GetUpLook. Real results, real stories.',
  openGraph: {
    title: 'Case Studies — GetUpLook',
    description: 'See how local businesses grow with GetUpLook. Real results, real stories.',
  },
};

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'salon', label: 'Salon' },
  { value: 'spa', label: 'Spa' },
  { value: 'barber', label: 'Barber' },
  { value: 'esthetician', label: 'Esthetician' },
  { value: 'wellness', label: 'Wellness' },
] as const;

interface CaseStudyCard {
  slug: string;
  businessName: string;
  category: string;
  tier: string;
  keyMetric: string;
  thumbnail: string;
}

const caseStudies: CaseStudyCard[] = [
  {
    slug: 'pleij-salon',
    businessName: 'Pleij Salon & Spa',
    category: 'salon',
    tier: 'Elite',
    keyMetric: '50+ reviews · #1 local ranking',
    thumbnail: '/images/case-studies/pleij-hero.jpg',
  },
];

const tierColors: Record<string, string> = {
  Elite: 'bg-yellow-400 text-yellow-900',
  Pro: 'bg-blue-500 text-white',
  Starter: 'bg-gray-200 text-gray-700',
};

export default function CaseStudiesPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-emerald-700 to-teal-600 text-white py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold">Case Studies</h1>
          <p className="mt-4 text-lg sm:text-xl text-emerald-100 max-w-2xl mx-auto">
            Real businesses. Real results. See how local professionals grow with GetUpLook.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6">
        <div className="flex flex-wrap gap-2 bg-white rounded-xl shadow-md p-3 justify-center">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                cat.value === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Cards Grid */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {caseStudies.map((study) => (
            <Link
              key={study.slug}
              href={`/case-studies/${study.slug}`}
              className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-emerald-300 transition-all"
            >
              <div className="aspect-video bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                <span className="text-4xl">💇‍♀️</span>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${tierColors[study.tier] || 'bg-gray-200 text-gray-700'}`}>
                    {study.tier}
                  </span>
                  <span className="text-xs text-gray-400 capitalize">{study.category}</span>
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                  {study.businessName}
                </h3>
                <p className="mt-1 text-sm text-gray-500">{study.keyMetric}</p>
                <div className="mt-3 text-sm text-emerald-600 font-medium group-hover:underline">
                  Read case study →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {caseStudies.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500">No case studies yet. Check back soon!</p>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Want to be our next success story?</h2>
          <p className="mt-3 text-gray-500">Get listed on GetUpLook and start growing your local business today.</p>
          <a
            href="/register"
            className="mt-6 inline-block bg-emerald-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Get Started Free →
          </a>
        </div>
      </section>
    </>
  );
}