"use client";

import { useState } from "react";
import Link from "next/link";
import { FAQAccordion } from "./faq-accordion";

/* ─── Icons ──────────────────────────────────────────────────── */

const Check = ({ className = "" }: { className?: string }) => (
  <svg
    className={`w-5 h-5 text-emerald-500 inline-block shrink-0 ${className}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const Dash = () => (
  <svg
    className="w-5 h-5 text-slate-300 dark:text-slate-600 inline-block shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
  </svg>
);

const XMark = () => (
  <svg
    className="w-5 h-5 text-slate-300 dark:text-slate-600 inline-block shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SparkleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
);

/* ─── Pricing Data ─────────────────────────────────────────────── */

interface TierFeature {
  name: string;
  included: boolean;
}

interface Tier {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  annualSavings: number;
  description: string;
  badge: string | null;
  isAddOn: boolean;
  addOnNote?: string;
  cta: string;
  ctaHref: string;
  features: TierFeature[];
}

const tiers: Tier[] = [
  {
    id: "core",
    name: "Core",
    monthlyPrice: 49,
    annualPrice: 490,
    annualSavings: 98,
    description: "Social scheduling, content engine, analytics, and a simple landing page.",
    badge: null,
    isAddOn: false,
    cta: "Start Free Trial",
    ctaHref: "/register?plan=core",
    features: [
      { name: "Social media scheduling (IG, FB, X)", included: true },
      { name: "AI content engine (posts, captions, hashtags)", included: true },
      { name: "Analytics dashboard", included: true },
      { name: "Simple landing page", included: true },
      { name: "Square billing integration", included: true },
      { name: "Email support", included: true },
      { name: "Review Sentry — review gating & defense", included: false },
      { name: "ClientVet — client risk screening", included: false },
      { name: "GBP management", included: false },
      { name: "AI chat & SMS widget", included: false },
      { name: "SiteFlow website builder", included: false },
      { name: "Paid ads management", included: false },
      { name: "Multi-location dashboard", included: false },
      { name: "Priority support (24/7)", included: false },
      { name: "Dedicated account manager", included: false },
      { name: "Custom AI brand training", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 199,
    annualPrice: 1990,
    annualSavings: 398,
    description: "Core + Review Sentry, ClientVet, GBP, AI chat, and the SiteFlow website builder.",
    badge: "Most Popular",
    isAddOn: false,
    cta: "Start Free Trial",
    ctaHref: "/register?plan=pro",
    features: [
      { name: "Everything in Core", included: true },
      { name: "Review Sentry — review gating & removal defense", included: true },
      { name: "ClientVet — client risk screening & deposits", included: true },
      { name: "Google Business Profile management", included: true },
      { name: "AI chat & SMS widget (24/7 booking)", included: true },
      { name: "SiteFlow website builder", included: true },
      { name: "Priority email & chat support", included: true },
      { name: "Paid ads management", included: false },
      { name: "Multi-location dashboard", included: false },
      { name: "Priority support (24/7)", included: false },
      { name: "Dedicated account manager", included: false },
      { name: "Custom AI brand training", included: false },
    ],
  },
  {
    id: "elite",
    name: "Elite",
    monthlyPrice: 499,
    annualPrice: 4990,
    annualSavings: 998,
    description: "Pro + paid ads, multi-location, priority support, and dedicated account manager.",
    badge: null,
    isAddOn: false,
    cta: "Start Free Trial",
    ctaHref: "/register?plan=elite",
    features: [
      { name: "Everything in Pro", included: true },
      { name: "Paid ads management (Google + Meta)", included: true },
      { name: "Multi-location dashboard", included: true },
      { name: "Priority support (24/7)", included: true },
      { name: "Dedicated account manager", included: true },
      { name: "Custom AI training on brand voice", included: true },
    ],
  },
  {
    id: "voice-ai",
    name: "Voice AI",
    monthlyPrice: 99,
    annualPrice: 990,
    annualSavings: 198,
    description: "AI phone receptionist that books, rebooks, and requests reviews — 24/7.",
    badge: null,
    isAddOn: true,
    addOnNote: "Add to any plan · 14-day free trial",
    cta: "Add Voice AI",
    ctaHref: "/register?plan=voice-ai",
    features: [
      { name: "AI phone receptionist (24/7)", included: true },
      { name: "Booking & rebooking via phone", included: true },
      { name: "Cancellation handling", included: true },
      { name: "Review request SMS after appointments", included: true },
      { name: "Voicemail transcription & forwarding", included: true },
      { name: "14-day free trial", included: true },
    ],
  },
];

/* ─── Feature Comparison Data ─────────────────────────────────── */

type FeatureValue = boolean | string;

interface ComparisonRow {
  name: string;
  core: FeatureValue;
  pro: FeatureValue;
  elite: FeatureValue;
}

const featureSections: { title: string; rows: ComparisonRow[] }[] = [
  {
    title: "Social & Content",
    rows: [
      { name: "Social media scheduling", core: "IG, FB, X", pro: "IG, FB, X", elite: "IG, FB, X" },
      { name: "AI content engine", core: true, pro: true, elite: true },
      { name: "Analytics dashboard", core: "Basic", pro: "Advanced", elite: "Advanced" },
      { name: "Simple landing page", core: true, pro: true, elite: true },
    ],
  },
  {
    title: "Review Management",
    rows: [
      { name: "Review Sentry — review gating", core: false, pro: true, elite: true },
      { name: "Review Sentry — removal defense", core: false, pro: true, elite: true },
      { name: "Google Business Profile management", core: false, pro: true, elite: true },
    ],
  },
  {
    title: "Client Protection",
    rows: [
      { name: "ClientVet — client risk screening", core: false, pro: true, elite: true },
      { name: "Deposit requirements by risk level", core: false, pro: true, elite: true },
      { name: "Private client notes", core: false, pro: true, elite: true },
    ],
  },
  {
    title: "Website & Communication",
    rows: [
      { name: "SiteFlow website builder", core: false, pro: true, elite: true },
      { name: "AI chat & SMS widget", core: false, pro: true, elite: true },
      { name: "Voice AI add-on", core: "$99/mo", pro: "$99/mo", elite: "$99/mo" },
    ],
  },
  {
    title: "Advertising & Multi-Location",
    rows: [
      { name: "Paid ads management (Google + Meta)", core: false, pro: false, elite: true },
      { name: "Multi-location dashboard", core: false, pro: false, elite: true },
      { name: "Custom AI brand training", core: false, pro: false, elite: true },
    ],
  },
  {
    title: "Support",
    rows: [
      { name: "Support", core: "Email", pro: "Email + Chat", elite: "24/7 Priority + Phone" },
      { name: "Dedicated account manager", core: false, pro: false, elite: true },
    ],
  },
];

/* ─── FAQ Data ────────────────────────────────────────────────── */

const pricingFaqs = [
  {
    q: "Can I switch plans at any time?",
    a: "Yes. Upgrade or downgrade anytime — your billing adjusts on the next cycle. No penalties, no lock-in.",
  },
  {
    q: "Is there a contract?",
    a: "No. All plans are month-to-month. Cancel anytime, no questions asked.",
  },
  {
    q: "What's included in the free trial?",
    a: "You get 14 days of full Pro features — social scheduling, content engine, analytics, Review Sentry, ClientVet, SiteFlow website builder, and AI chat. No credit card required to start.",
  },
  {
    q: "Do I need Voice AI?",
    a: "It's an optional add-on for salons that want 24/7 phone coverage. The AI receptionist handles booking, rebooking, cancellations, and review requests via phone. Try it free for 14 days and see if it works for your business.",
  },
  {
    q: "How does ClientVet work?",
    a: "ClientVet uses double-blind client screening. We track behavioral signals — no-shows, cancellations, chargebacks — not opinions. Businesses see aggregate reliability scores, never individual ratings. It's FCRA-safe by design: we rate reliability, not likeability.",
  },
  {
    q: "Is Review Sentry legal?",
    a: "Yes. Review Sentry is fully Google-compliant. We never post fake reviews — the FTC fines $50,120+ per violation and Google caught 89% of fake positives in 2025. Our review gating follows Google's terms, and our removal defense uses legitimate dispute processes.",
  },
  {
    q: "What happens after my 14-day free trial?",
    a: "You pick a plan and enter payment info only when you're ready. If you don't, your account pauses — no surprise charges.",
  },
  {
    q: "What's the difference between the simple landing page and SiteFlow?",
    a: "The simple landing page (Core) is a single-page presence — great for basic info and booking. SiteFlow (Pro and Elite) is a full website builder with custom domains, multiple pages, and your brand colors and content.",
  },
];

/* ─── Billing Toggle ─────────────────────────────────────────── */

function BillingToggle({
  isAnnual,
  onToggle,
}: {
  isAnnual: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span
        className={`text-sm font-medium transition-colors ${
          !isAnnual
            ? "text-slate-900 dark:text-white"
            : "text-slate-500 dark:text-slate-400"
        }`}
      >
        Monthly
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={isAnnual}
        onClick={onToggle}
        className="relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 bg-slate-200 dark:bg-slate-700 aria-checked:bg-emerald-500"
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-[22px] w-[22px] transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            isAnnual ? "translate-x-[22px]" : "translate-x-0"
          }`}
        />
      </button>
      <span
        className={`text-sm font-medium transition-colors ${
          isAnnual
            ? "text-slate-900 dark:text-white"
            : "text-slate-500 dark:text-slate-400"
        }`}
      >
        Annual
      </span>
      {isAnnual && (
        <span className="ml-1 inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          Save 2 months
        </span>
      )}
    </div>
  );
}

/* ─── Hero ──────────────────────────────────────────────────── */

function Hero({
  isAnnual,
  onToggleAnnual,
}: {
  isAnnual: boolean;
  onToggleAnnual: () => void;
}) {
  return (
    <section className="relative overflow-hidden bg-slate-900 dark:bg-slate-950 text-white">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-900 dark:from-blue-800/30 dark:via-slate-950 dark:to-slate-950" />

      <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-6">
          <SparkleIcon className="w-4 h-4" />
          14-day free trial · No credit card required
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
          Simple, transparent pricing
        </h1>

        <p className="mt-5 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          No hidden fees. No contracts. Cancel anytime. Pick a plan and start
          growing your salon.
        </p>

        <div className="mt-10">
          <BillingToggle isAnnual={isAnnual} onToggle={onToggleAnnual} />
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing Card ───────────────────────────────────────────── */

function PricingCard({ tier, isAnnual }: { tier: Tier; isAnnual: boolean }) {
  const displayPrice = isAnnual
    ? Math.round(tier.annualPrice / 12)
    : tier.monthlyPrice;
  const isPro = tier.id === "pro";

  return (
    <div
      className={`relative rounded-2xl flex flex-col h-full ${
        isPro
          ? "bg-gradient-to-b from-slate-900 to-slate-800 dark:from-emerald-900/40 dark:to-slate-900 text-white border-2 border-emerald-500/60 shadow-xl shadow-emerald-500/10 xl:scale-105 z-10"
          : "bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm text-slate-900 dark:text-white"
      }`}
    >
      {/* Badge */}
      {tier.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 text-sm font-bold rounded-full shadow-lg bg-emerald-600 text-white">
            {tier.badge}
          </span>
        </div>
      )}

      <div className="p-8 flex-1 flex flex-col">
        {/* Tier name */}
        <div className="mb-6">
          {tier.isAddOn && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs font-semibold mb-3">
              <PhoneIcon />
              Add-on
            </div>
          )}
          <h3
            className={`text-xl font-bold ${
              isPro
                ? "text-white"
                : "text-slate-900 dark:text-white"
            }`}
          >
            {tier.name}
          </h3>

          {/* Price */}
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span
                className={`text-5xl font-extrabold tracking-tight ${
                  isPro ? "text-white" : "text-slate-900 dark:text-white"
                }`}
              >
                ${displayPrice}
              </span>
              <span
                className={`text-lg ${
                  isPro
                    ? "text-slate-300"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                /mo
              </span>
            </div>
            {isAnnual && (
              <div
                className={`mt-1.5 text-sm ${
                  isPro
                    ? "text-emerald-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                Billed ${tier.annualPrice}/yr · Save ${tier.annualSavings}
              </div>
            )}
            {!isAnnual && tier.annualSavings > 0 && (
              <div
                className={`mt-1.5 text-sm ${
                  isPro
                    ? "text-slate-400"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                ${Math.round(tier.annualPrice / 12)}/mo with annual billing
              </div>
            )}
          </div>

          <p
            className={`mt-3 text-sm leading-relaxed ${
              isPro
                ? "text-slate-300"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {tier.description}
          </p>
        </div>

        {/* Add-on note */}
        {tier.isAddOn && tier.addOnNote && (
          <div
            className={`mb-4 px-3 py-2 rounded-lg text-sm font-medium ${
              isPro
                ? "bg-white/10 text-slate-200"
                : "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400"
            }`}
          >
            {tier.addOnNote}
          </div>
        )}

        {/* Features */}
        <div className="flex-1 space-y-2 mb-8">
          {tier.features.map((f, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 py-1 ${
                !f.included ? "opacity-40" : ""
              }`}
            >
              {f.included ? (
                <span className={isPro ? "text-emerald-400 mt-0.5" : "text-emerald-500 mt-0.5"}>
                  <Check />
                </span>
              ) : (
                <span className="mt-0.5">
                  <Dash />
                </span>
              )}
              <span
                className={`text-sm ${
                  f.included
                    ? isPro
                      ? "text-slate-200"
                      : "text-slate-700 dark:text-slate-300"
                    : "text-slate-400 dark:text-slate-600 line-through"
                }`}
              >
                {f.name}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href={tier.ctaHref}
          className={`block w-full text-center px-6 py-4 rounded-xl text-lg font-bold transition-all duration-200 ${
            tier.isAddOn
              ? "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20"
              : isPro
                ? "bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-lg shadow-emerald-500/20"
                : "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900"
          }`}
        >
          {tier.cta}
        </Link>
      </div>
    </div>
  );
}

/* ─── Pricing Cards ──────────────────────────────────────────── */

function PricingCards({ isAnnual }: { isAnnual: boolean }) {
  return (
    <section className="py-16 sm:py-24 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8 items-start">
          {tiers.map((tier) => (
            <PricingCard key={tier.id} tier={tier} isAnnual={isAnnual} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Feature Section (for table) ──────────────────────────── */

function FeatureSection({
  section,
  isFirst,
}: {
  section: { title: string; rows: ComparisonRow[] };
  isFirst: boolean;
}) {
  return (
    <>
      <tr
        className={`${
          isFirst ? "" : "border-t-2"
        } border-slate-200 dark:border-slate-700`}
      >
        <td
          colSpan={4}
          className="px-4 pt-5 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
        >
          {section.title}
        </td>
      </tr>
      {section.rows.map((row, i) => (
        <tr
          key={i}
          className={`border-t border-slate-100 dark:border-slate-800 ${
            i % 2 === 0
              ? "bg-white dark:bg-slate-900/50"
              : "bg-slate-50/50 dark:bg-slate-900/30"
          }`}
        >
          <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 font-medium">
            {row.name}
          </td>
          {(
            [row.core, row.pro, row.elite] as FeatureValue[]
          ).map((val, j) => (
            <td
              key={j}
              className={`px-4 py-3 text-center text-sm ${
                j === 1 ? "bg-emerald-50/50 dark:bg-emerald-900/10" : ""
              }`}
            >
              {val === true ? (
                <span className="text-emerald-500">
                  <Check />
                </span>
              ) : val === false ? (
                <XMark />
              ) : (
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {val}
                </span>
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ─── Feature Comparison Table ─────────────────────────────────── */

function FeatureComparisonTable() {
  return (
    <section className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
            Feature Comparison
          </h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400 text-lg">
            See everything that&apos;s included at a glance
          </p>
        </div>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                <th className="px-4 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400 min-w-[220px]">
                  Feature
                </th>
                <th className="px-4 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300 text-center w-[140px]">
                  Core
                  <div className="text-xs font-normal text-slate-400 dark:text-slate-500 mt-0.5">
                    $49/mo
                  </div>
                </th>
                <th className="px-4 py-4 text-sm font-semibold text-center w-[140px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-t-lg">
                  Pro
                  <div className="text-xs font-normal text-emerald-500 dark:text-emerald-400/70 mt-0.5">
                    $199/mo
                  </div>
                </th>
                <th className="px-4 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300 text-center w-[140px]">
                  Elite
                  <div className="text-xs font-normal text-slate-400 dark:text-slate-500 mt-0.5">
                    $499/mo
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {featureSections.map((section, si) => (
                <FeatureSection key={si} section={section} isFirst={si === 0} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ─── Bottom CTA ─────────────────────────────────────────────── */

function BottomCTA() {
  return (
    <section className="py-16 sm:py-24 bg-slate-900 dark:bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold">
          Ready to protect your salon?
        </h2>
        <p className="mt-4 text-lg text-slate-300">
          Start your 14-day free trial today. No credit card required.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-emerald-500/20"
          >
            Start Free Trial
          </Link>
          <Link
            href="/contact"
            className="px-8 py-4 bg-transparent border border-slate-500 hover:border-slate-300 text-white rounded-xl font-semibold text-lg transition-colors"
          >
            Talk to Sales
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-400">
          No credit card required · Cancel anytime · 14-day free trial
        </p>
      </div>
    </section>
  );
}

/* ─── Page Client Component ──────────────────────────────────── */

export function PricingPageClient() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950">
      <Hero isAnnual={isAnnual} onToggleAnnual={() => setIsAnnual(!isAnnual)} />
      <PricingCards isAnnual={isAnnual} />
      <FeatureComparisonTable />
      <section className="py-16 sm:py-24 bg-white dark:bg-slate-950">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 text-lg">
              Everything you need to know about pricing
            </p>
          </div>
          <FAQAccordion items={pricingFaqs} />
        </div>
      </section>
      <BottomCTA />
    </main>
  );
}