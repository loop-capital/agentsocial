import type { Metadata } from "next";
import Link from "next/link";
import { CompareFAQ, PricingTierToggle } from "./compare-components";

export const metadata: Metadata = {
  title: "Compare Plans — GetUpLook vs Zoca | Upgrade Your Salon Marketing",
  description:
    "See how GetUpLook (powered by AgentSocial) compares to Zoca. Transparent pricing, real paid ads, AI chat widget, and no contracts. Upgrade today.",
  openGraph: {
    title: "Compare Plans — GetUpLook vs Zoca",
    description:
      "Stop paying for free listings. GetUpLook includes real paid ads, AI chat, review management, and transparent pricing.",
    url: "https://getuplook.com/compare",
    siteName: "GetUpLook",
    type: "website",
  },
};

/* ─── Reusable UI primitives ─────────────────────────────── */

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

const Cross = ({ className = "" }: { className?: string }) => (
  <svg
    className={`w-5 h-5 text-red-500 inline-block ${className}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const Badge = ({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}) => {
  const map = {
    neutral: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[tone]}`}>
      {children}
    </span>
  );
};

const SparkleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

/* ─── Data ───────────────────────────────────────────────── */

const comparisonFeatures = [
  { feature: "Google Business Profile optimization", zoca: true, getuplook: true },
  { feature: "Real paid Google Ads ($500/mo spend)", zoca: false, getuplook: true, highlight: true },
  { feature: "Facebook & Instagram ad campaigns", zoca: false, getuplook: true, highlight: true },
  { feature: "Full conversion tracking (GA4 + GTM)", zoca: false, getuplook: true },
  { feature: "AI-powered review management", zoca: false, getuplook: true },
  { feature: "AI chat & SMS widget (24/7 booking)", zoca: false, getuplook: true, highlight: true },
  { feature: "Client rebooking automation", zoca: false, getuplook: true },
  { feature: "Custom domain landing pages", zoca: false, getuplook: true, highlight: true },
  { feature: "Works with Fresha, Vagaro, Square", zoca: false, getuplook: true },
  { feature: "Transparent public pricing", zoca: false, getuplook: true, highlight: true },
  { feature: "Social media scheduling & AI content", zoca: false, getuplook: true },
  { feature: "Video repurposing (Clipify)", zoca: false, getuplook: true },
  { feature: "Booking widget integration", zoca: true, getuplook: true },
  { feature: "Email / SMS follow-up campaigns", zoca: false, getuplook: true },
];

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
    badge: null,
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
    badge: "Most Popular",
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
    badge: null,
    cta: "Start Free Trial",
    href: "/register?plan=elite",
  },
];

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Owner, Luxe Hair Studio",
    text: "We switched from Zoca and our new client bookings went up 40% in the first month. The AI chat widget alone is worth it.",
    rating: 5,
  },
  {
    name: "Marcus Chen",
    role: "Manager, Serenity Day Spa",
    text: "Transparent pricing was a breath of fresh air. No more surprise charges or being locked into a contract I didn't want.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "Founder, Glow Aesthetics",
    text: "The review solicitation feature has doubled our Google reviews in 3 months. Zoca never offered anything like this.",
    rating: 5,
  },
];

const faqs = [
  {
    q: "How do you know Zoca runs zero paid ads?",
    a: "We checked the Google Ads Transparency Center for Zoca and their client domains. No active paid campaigns were found. Their own case study for Red Chair Salon explicitly states results came 'without ads.'",
  },
  {
    q: "What does GetUpLook Elite include that Zoca doesn't?",
    a: "Elite includes $500/month in managed Google Ads spend, Facebook/Instagram campaigns, full GA4 + GTM conversion tracking, AI review responses, custom-domain landing pages, and Clipify video repurposing. Zoca offers none of these.",
  },
  {
    q: "Can I keep my existing booking system?",
    a: "Absolutely. GetUpLook wraps around Fresha, Vagaro, Square, or any booking platform you already use. We drive traffic to YOUR system, not a locked-in replacement.",
  },
  {
    q: "Is the $499/mo GetUpLook price really all-inclusive?",
    a: "Yes. $499/month covers our DFY service plus $500 in real ad spend. There are no hidden fees or 'book a call' gates. You can sign up and start immediately.",
  },
  {
    q: "What if I'm already using Zoca?",
    a: "We offer a free migration audit. Our team will review your current setup and build a transition plan that preserves your existing GMB optimization while adding the paid media Zoca doesn't provide.",
  },
  {
    q: "Will I lose my Google Business Profile data?",
    a: "Not at all. GetUpLook enhances your existing Google Business Profile. We take over optimization, posting, and review management. Your profile stays live and improves under our management.",
  },
  {
    q: "How does the AI chat widget work?",
    a: "Our AI chat widget is trained on your business details — services, hours, pricing. It engages website visitors 24/7, answers questions, and books appointments directly into your scheduling system. Included in Pro and Elite plans.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes, you can upgrade or downgrade anytime. Move from Core to Pro when you're ready for GBP management and the AI chat widget. Upgrade to Elite when you want the full done-for-you experience with real ad spend.",
  },
];

/* ─── Hero ────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden bg-slate-900 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-900" />
      <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <Badge tone="warning">
          <SparkleIcon className="w-3.5 h-3.5" />
          Verified via Google Ads Transparency Center
        </Badge>

        <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
          Stop Paying $299/mo for{" "}
          <span className="text-red-400">Free Listings</span>
        </h1>

        <p className="mt-5 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Zoca charges $299/month but runs{" "}
          <strong className="text-white">zero paid ads</strong>. Their "Discovery Agent"
          only optimizes your free Google Business Profile. GetUpLook actually{" "}
          <strong className="text-emerald-400">buys you ads</strong>.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-emerald-500/20"
          >
            Start Free Trial
          </Link>
          <span className="text-slate-400 text-sm">14 days free · Cancel anytime</span>
        </div>
      </div>
    </section>
  );
}

/* ─── Feature Comparison Table ──────────────────────────────── */

function FeatureTable() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Feature Comparison</h2>
          <p className="mt-3 text-slate-500 text-lg">What you actually get for your money</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Feature</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-center w-32">Zoca</th>
                <th className="px-6 py-4 text-sm font-semibold text-emerald-700 text-center w-40 bg-emerald-50/50">
                  GetUpLook
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((f, i) => (
                <tr
                  key={i}
                  className={`border-t border-slate-100 ${f.highlight ? "bg-amber-50/40" : ""}`}
                >
                  <td className="px-6 py-4 text-sm text-slate-700 font-medium">{f.feature}</td>
                  <td className="px-6 py-4 text-center">
                    {f.zoca ? <Check /> : <Cross />}
                  </td>
                  <td className="px-6 py-4 text-center bg-emerald-50/30">
                    <Check />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-slate-400 text-center">
          Data sourced from public Zoca pricing pages, case studies, and Google Ads Transparency Center.
        </p>
      </div>
    </section>
  );
}

/* ─── Interactive Tier Toggle & Pricing ─────────────────────── */

function PricingTiers() {
  return <PricingTierToggle />;
}

/* ─── Zoca vs GetUpLook Pricing ─────────────────────────────── */

function ZocaComparison() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Zoca vs GetUpLook Pricing</h2>
          <p className="mt-3 text-slate-500 text-lg">See how each tier stacks up</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Zoca */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Zoca</h3>
              <Badge tone="neutral">Requires sales call</Badge>
            </div>
            <ul className="space-y-3">
              {[
                { price: "$149/mo", name: "Basic", desc: "GMB optimization only" },
                { price: "$299/mo", name: "Professional", desc: "Their most popular plan" },
                { price: "$499/mo", name: "Elite", desc: "Still no paid ads" },
              ].map((tier) => (
                <li key={tier.price} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="font-semibold text-slate-900">{tier.name}</p>
                    <p className="text-sm text-slate-500">{tier.desc}</p>
                  </div>
                  <span className="text-lg font-bold text-slate-700">{tier.price}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 p-3 bg-red-50 rounded-lg text-sm text-red-700 flex items-start gap-2">
              <Cross className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>No paid ad spend included</strong> at any tier. Zoca&apos;s Red Chair Salon case study explicitly states &ldquo;2+ bookings/day <em>without ads</em>.&rdquo;
              </span>
            </div>
          </div>

          {/* GetUpLook */}
          <div className="rounded-2xl border-2 border-emerald-500 bg-white shadow-lg shadow-emerald-500/10 p-6 sm:p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge tone="success">Best Value</Badge>
            </div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">GetUpLook</h3>
              <Badge tone="success">Powered by AgentSocial</Badge>
            </div>
            <ul className="space-y-3">
              {[
                { price: "$49/mo", name: "Core", desc: "Social scheduling + AI content" },
                { price: "$199/mo", name: "Pro", desc: "DFY content + review mgmt + chat" },
                { price: "$499/mo", name: "Elite", desc: "+$500/mo real ad spend included", highlight: true },
              ].map((tier) => (
                <li
                  key={tier.price}
                  className={`flex items-center justify-between py-2 border-b last:border-0 rounded-lg px-3 -mx-3 ${
                    tier.highlight ? "bg-emerald-50 border-emerald-200" : "border-slate-100"
                  }`}
                >
                  <div>
                    <p className={`font-semibold ${tier.highlight ? "text-emerald-900" : "text-slate-900"}`}>
                      {tier.name}
                    </p>
                    <p className="text-sm text-slate-500">{tier.desc}</p>
                  </div>
                  <span className={`text-lg font-bold ${tier.highlight ? "text-emerald-600" : "text-slate-700"}`}>
                    {tier.price}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-5 p-3 bg-emerald-50 rounded-lg text-sm text-emerald-800 flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>$500/mo in real ad spend</strong> is included with Elite. You get Google Ads + Meta campaigns managed by our team.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Case Study Spotlight ─────────────────────────────────── */

function CaseStudy() {
  return (
    <section className="py-16 sm:py-24 bg-gradient-to-br from-amber-50 via-white to-emerald-50">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge tone="warning">
              <SparkleIcon className="w-3.5 h-3.5" />
              Case Study
            </Badge>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-slate-900">
              Pleij Salon & Spa: From Zoca to{" "}
              <span className="text-emerald-600">Real Results</span>
            </h2>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              Pleij Salon &amp; Spa was our first beta client. After years of paying for Zoca&apos;s
              &ldquo;Discovery Agent&rdquo; — which only optimized their free Google listing — they switched
              to GetUpLook.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Real paid advertising ($500/mo in managed Google Ads)",
                "AI chat widget booking appointments 24/7",
                "Doubled Google reviews in 60 days",
                "No contract — month-to-month, cancel anytime",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="flex-shrink-0" />
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link
                href="/register"
                className="inline-flex items-center px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl font-bold transition-colors shadow-lg shadow-emerald-500/20 group"
              >
                Get These Results
                <ArrowRightIcon />
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-xl font-bold mb-2">
                P
              </div>
              <h3 className="text-lg font-bold text-slate-900">Pleij Salon & Spa</h3>
              <p className="text-sm text-slate-500">First GetUpLook Beta Client</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <p className="text-xs font-medium text-red-700 mb-1">With Zoca</p>
                <p className="text-2xl font-extrabold text-red-600">$399/mo</p>
                <p className="text-xs text-red-500 mt-1">No paid ads</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-xs font-medium text-emerald-700 mb-1">With GetUpLook</p>
                <p className="text-2xl font-extrabold text-emerald-600">$199/mo*</p>
                <p className="text-xs text-emerald-500 mt-1">Pro plan · More features</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Google Ads Budget</span>
                <span className="font-bold text-red-500">Zoca: $0</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Google Ads Budget</span>
                <span className="font-bold text-emerald-600">GetUpLook: $500/mo</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Contract Required</span>
                <div className="flex gap-3">
                  <span className="font-bold text-red-500">Zoca: 12mo</span>
                  <span className="font-bold text-emerald-600">GetUpLook: None</span>
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400 text-center">*Pro tier pricing shown. Elite at $499/mo includes $500 ad spend.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials ─────────────────────────────────────────── */

function Testimonials() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Loved by Salon & Spa Owners</h2>
          <p className="mt-3 text-slate-500 text-lg">Real businesses. Real results.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:shadow-lg transition-shadow">
              <div className="flex gap-1 mb-3">
                {[...Array(t.rating)].map((_, j) => (
                  <svg key={j} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-slate-700 italic mb-4">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ───────────────────────────────────────────────────── */

function FAQ() {
  return (
    <section className="py-16 sm:py-24 bg-slate-50">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Switching from Zoca? We&apos;ve Got Answers</h2>
          <p className="mt-3 text-slate-500 text-lg">Common questions from salon and spa owners</p>
        </div>
        <CompareFAQ items={faqs} />
      </div>
    </section>
  );
}

/* ─── CTA Banner ───────────────────────────────────────────── */

function CTABanner() {
  return (
    <section className="py-16 sm:py-20 bg-slate-900 text-white">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold">
          Ready to Actually Get Bookings?
        </h2>
        <p className="mt-4 text-lg text-slate-300">
          Stop paying for free listings. Start paying for real customers.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-emerald-500/20"
          >
            Start Free Trial
          </Link>
          <Link
            href="#pricing"
            className="px-8 py-3.5 bg-transparent border border-slate-500 hover:border-slate-300 text-white rounded-xl font-semibold text-lg transition-colors"
          >
            Compare Plans
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-500">14-day free trial · No credit card required · Powered by <a href="https://getuplook.com" className="text-emerald-400 hover:text-emerald-300">GetUpLook</a></p>
      </div>
    </section>
  );
}

/* ─── Footer ───────────────────────────────────────────────── */

function FooterNote() {
  return (
    <footer className="py-8 bg-white border-t border-slate-200">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-slate-700 font-semibold">
              Powered by <a href="https://getuplook.com" className="text-emerald-600 hover:text-emerald-500 transition-colors">GetUpLook</a>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              The smarter way to grow your salon or spa
            </p>
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/pricing" className="text-slate-400 hover:text-slate-700 transition-colors">Pricing</Link>
            <Link href="/chat-widget" className="text-slate-400 hover:text-slate-700 transition-colors">AI Chat Widget</Link>
            <a href="https://getuplook.com" className="text-slate-400 hover:text-slate-700 transition-colors">GetUpLook.com</a>
          </div>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} GetUpLook. All rights reserved.
          </p>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
          Comparison based on publicly available Zoca pricing, case studies, and Google Ads Transparency Center data as of May 2026. All trademarks belong to their respective owners.
        </div>
      </div>
    </footer>
  );
}

/* ─── Page ──────────────────────────────────────────────────── */

export default function ComparePage() {
  return (
    <main className="min-h-screen bg-white">
      <Hero />
      <FeatureTable />
      <PricingTiers />
      <ZocaComparison />
      <CaseStudy />
      <Testimonials />
      <FAQ />
      <CTABanner />
      <FooterNote />
    </main>
  );
}