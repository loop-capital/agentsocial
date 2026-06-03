"use client";

import { useState } from "react";
import Link from "next/link";

const Check = ({ className = "" }: { className?: string }) => (
  <svg
    className={`w-5 h-5 text-emerald-500 inline-block ${className}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const pricingTiers = [
  {
    id: "core",
    name: "Core",
    price: 49,
    description: "Social scheduler + AI content + GetUpLook profile",
    features: [
      { name: "Social scheduler (Instagram, Facebook, Google)", included: true },
      { name: "AI content creation & captions", included: true },
      { name: "GetUpLook business profile page", included: true },
      { name: "Booking CTA integration", included: true },
      { name: "Basic analytics dashboard", included: true },
      { name: "Google Business Profile management", included: false },
      { name: "AI review solicitation & responses", included: false },
      { name: "AI chat & SMS widget", included: false },
      { name: "Client rebooking automation", included: false },
      { name: "Website builder with custom domain", included: false },
      { name: "Managed Google Ads spend", included: false },
      { name: "Facebook & Instagram ad campaigns", included: false },
      { name: "Dedicated account manager", included: false },
    ],
    badge: null as string | null,
    cta: "Start Free Trial",
    href: "/register?plan=core",
  },
  {
    id: "pro",
    name: "Pro",
    price: 199,
    description: "Everything in Core + GBP, reviews, chat widget, rebooking",
    features: [
      { name: "Social scheduler (Instagram, Facebook, Google)", included: true },
      { name: "AI content creation & captions", included: true },
      { name: "GetUpLook business profile page", included: true },
      { name: "Booking CTA integration", included: true },
      { name: "Basic analytics dashboard", included: true },
      { name: "Google Business Profile management", included: true },
      { name: "AI review solicitation & responses", included: true },
      { name: "AI chat & SMS widget", included: true },
      { name: "Client rebooking automation", included: true },
      { name: "Website builder with custom domain", included: true },
      { name: "Managed Google Ads spend", included: false },
      { name: "Facebook & Instagram ad campaigns", included: false },
      { name: "Dedicated account manager", included: false },
    ],
    badge: "Most Popular" as string | null,
    cta: "Start Free Trial",
    href: "/register?plan=pro",
  },
  {
    id: "elite",
    name: "Elite",
    price: 499,
    description: "Full DFY + $500 ad spend + dedicated account manager",
    features: [
      { name: "Social scheduler (Instagram, Facebook, Google)", included: true },
      { name: "AI content creation & captions", included: true },
      { name: "GetUpLook business profile page", included: true },
      { name: "Booking CTA integration", included: true },
      { name: "Basic analytics dashboard", included: true },
      { name: "Google Business Profile management", included: true },
      { name: "AI review solicitation & responses", included: true },
      { name: "AI chat & SMS widget", included: true },
      { name: "Client rebooking automation", included: true },
      { name: "Website builder with custom domain", included: true },
      { name: "Managed Google Ads spend ($500/mo)", included: true },
      { name: "Facebook & Instagram ad campaigns", included: true },
      { name: "Dedicated account manager", included: true },
    ],
    badge: null as string | null,
    cta: "Start Free Trial",
    href: "/register?plan=elite",
  },
];

interface FAQItem {
  q: string;
  a: string;
}

export function CompareFAQ({ items }: { items: FAQItem[] }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {items.map((faq, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <button
            className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
            onClick={() => setOpenFaq(openFaq === i ? null : i)}
          >
            <span className="font-semibold text-slate-900 pr-4">{faq.q}</span>
            <svg
              className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openFaq === i && (
            <div className="px-5 pb-5 text-slate-600 leading-relaxed">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function PricingTierToggle() {
  const [activeTier, setActiveTier] = useState<string>("pro");
  const activeData = pricingTiers.find(t => t.id === activeTier) || pricingTiers[1];

  return (
    <section className="py-16 sm:py-24 bg-slate-50">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Pricing That Makes Sense</h2>
          <p className="mt-3 text-slate-500 text-lg">Transparent pricing vs. &ldquo;book a call&rdquo;</p>
        </div>

        {/* Tier Toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center bg-slate-200 rounded-xl p-1 gap-1">
            {pricingTiers.map(tier => (
              <button
                key={tier.id}
                onClick={() => setActiveTier(tier.id)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTier === tier.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tier.name}
                <span className="ml-1.5 text-xs opacity-70">${tier.price}/mo</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Tier Card */}
        <div className="max-w-2xl mx-auto">
          <div className={`rounded-2xl border-2 bg-white shadow-lg p-8 ${
            activeTier === "pro" ? "border-emerald-500 shadow-emerald-500/10" : "border-slate-200"
          }`}>
            {activeData.badge && (
              <div className="flex justify-center -mt-12 mb-4">
                <span className="px-4 py-1 bg-emerald-600 text-white text-sm font-bold rounded-full shadow-lg">
                  {activeData.badge}
                </span>
              </div>
            )}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-slate-900">{activeData.name}</h3>
              <div className="mt-4">
                <span className="text-5xl font-extrabold text-slate-900">${activeData.price}</span>
                <span className="text-slate-500">/mo</span>
              </div>
              <p className="mt-2 text-slate-500">{activeData.description}</p>
            </div>

            <div className="space-y-3 mb-8">
              {activeData.features.map((f, i) => (
                <div key={i} className={`flex items-center gap-3 py-2 px-3 rounded-lg ${f.included ? 'bg-emerald-50/50' : 'bg-slate-50'}`}>
                  {f.included ? (
                    <Check className="flex-shrink-0" />
                  ) : (
                    <svg className="w-5 h-5 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                    </svg>
                  )}
                  <span className={`text-sm ${f.included ? 'text-slate-700' : 'text-slate-400'}`}>
                    {f.name}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href={activeData.href}
              className="block w-full text-center px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl text-lg transition-colors shadow-lg shadow-emerald-500/20"
            >
              {activeData.cta}
            </Link>
          </div>
        </div>

        {/* Quick comparison strip */}
        <div className="mt-10 grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {pricingTiers.map(tier => (
            <button
              key={tier.id}
              onClick={() => setActiveTier(tier.id)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                activeTier === tier.id
                  ? "border-emerald-500 bg-emerald-50/50 shadow-md"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{tier.name}</span>
                <span className="text-lg font-extrabold text-slate-900">${tier.price}/mo</span>
              </div>
              <p className="text-sm text-slate-500 mt-1">{tier.description}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}