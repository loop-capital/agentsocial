"use client";

import { useState } from "react";

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

const Dash = () => (
  <svg className="w-5 h-5 text-slate-300 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
  </svg>
);

interface FAQItem {
  q: string;
  a: string;
}

export function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {items.map((faq, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-100 transition-colors"
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

export function PricingTierToggle({ tiers }: { tiers: { id: string; name: string; price: number; badge: string | null }[] }) {
  const [activeTier, setActiveTier] = useState<string>(tiers[1]?.id || "pro");
  const active = tiers.find(t => t.id === activeTier) || tiers[1];

  return (
    <div>
      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center bg-slate-200 rounded-xl p-1 gap-1">
          {tiers.map(tier => (
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
      <div className="text-center">
        <p className="text-lg text-slate-500">Selected: <strong className="text-slate-900">{active?.name}</strong> — ${active?.price}/mo</p>
      </div>
    </div>
  );
}