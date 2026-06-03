import Link from "next/link";
import {
  ShieldCheck,
  UserX,
  Sparkles,
  MapPin,
  Megaphone,
  Phone,
  Star,
  ArrowRight,
  Check,
  ChevronRight,
} from "lucide-react";

/* ─── Data ────────────────────────────────────────────────────── */

const features = [
  {
    icon: ShieldCheck,
    title: "Review Sentry",
    description:
      "Catch fake reviews before they damage your reputation. Auto-flag suspicious patterns and protect your star rating.",
    href: "#review-sentry",
  },
  {
    icon: UserX,
    title: "ClientVet",
    description:
      "Block no-shows and problematic clients automatically. Save hours of headache and protect your schedule.",
    href: "#features",
  },
  {
    icon: Sparkles,
    title: "AI Content Engine",
    description:
      "Generate scroll-stopping social posts in seconds. On-brand, platform-ready, and tailored to your salon.",
    href: "#features",
  },
  {
    icon: MapPin,
    title: "GBP Management",
    description:
      "Dominate local search. Keep your Google Business Profile optimized, updated, and pulling in new clients.",
    href: "#features",
  },
  {
    icon: Megaphone,
    title: "Ad Management",
    description:
      "Google & Meta ads managed for you. Reach the right clients at the right time without the learning curve.",
    href: "#features",
  },
  {
    icon: Phone,
    title: "Voice AI Receptionist",
    description:
      "Never miss a call again. Your AI receptionist books appointments, answers FAQs, and sounds just like you.",
    href: "#features",
  },
];

const reviewSteps = [
  {
    step: "1",
    title: "Request reviews",
    description:
      "Automatically ask happy clients for reviews after their appointment.",
  },
  {
    step: "2",
    title: "Gate negative feedback",
    description:
      "Intercept dissatisfied clients privately before they post publicly.",
  },
  {
    step: "3",
    title: "Auto-flag suspicious patterns",
    description:
      "AI detects fake or malicious reviews and alerts you to take action.",
  },
];

const pricingTiers = [
  {
    name: "Core",
    price: "$49",
    period: "/mo",
    description: "Everything to get started",
    features: [
      "Social scheduling",
      "AI content engine",
      "Analytics dashboard",
      "Simple landing page",
    ],
    href: "/pricing",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$199",
    period: "/mo",
    description: "For growing businesses",
    features: [
      "Everything in Core",
      "Review Sentry",
      "ClientVet",
      "GBP management",
      "AI chat & SiteFlow builder",
    ],
    href: "/pricing",
    highlighted: true,
  },
  {
    name: "Elite",
    price: "$499",
    period: "/mo",
    description: "For multi-location brands",
    features: [
      "Everything in Pro",
      "Paid ads management",
      "Multi-location support",
      "Priority support",
    ],
    href: "/pricing",
    highlighted: false,
  },
];

const testimonials = [
  {
    quote:
      "Review Sentry caught 3 fake reviews in our first week. It literally paid for itself.",
    author: "Sarah",
    business: "Luxe Beauty Bar",
  },
  {
    quote:
      "ClientVet paid for itself in one avoided no-show. I can't imagine going back.",
    author: "Maria",
    business: "Studio 42",
  },
  {
    quote:
      "The AI content engine saves me 4 hours a week. That's more time with clients.",
    author: "Jen",
    business: "The Glow Bar",
  },
];

const logoNames = [
  "Luxe Beauty Bar",
  "PLEIJ Salon",
  "Studio 42",
  "The Glow Bar",
  "Velvet Roots",
  "Polished Co.",
];

const stats = [
  { value: "10K+", label: "posts scheduled" },
  { value: "2.5M+", label: "impressions" },
  { value: "4.8★", label: "avg rating" },
];

const footerLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Compare", href: "/compare" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

/* ─── Component ───────────────────────────────────────────────── */

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white antialiased">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* gradient backdrop */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-gray-950"
        />

        <div className="relative mx-auto max-w-6xl px-6 pt-12 pb-20 text-center sm:pt-24 sm:pb-28">
          {/* subtle badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800/60 px-4 py-1.5 text-sm text-gray-300">
            <Sparkles className="h-4 w-4 text-blue-400" />
            AI-powered platform for salons &amp; spas
          </div>

          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Social Media Management,{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Built for Salons &amp; Spas
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-gray-400">
            AI-powered content creation, review management, client screening —
            all in one platform. So you can focus on making clients look &amp;
            feel amazing.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-600 bg-gray-800/50 px-7 py-3.5 text-base font-semibold text-gray-200 transition hover:border-gray-500 hover:bg-gray-800"
            >
              See Pricing
            </Link>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            14-day free trial · No credit card required
          </p>
        </div>
      </section>

      {/* ── Social Proof Bar ──────────────────────────────────── */}
      <section className="border-y border-gray-800 bg-gray-900/60">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <p className="mb-8 text-center text-sm font-medium uppercase tracking-wider text-gray-400">
            Trusted by 500+ salons and spas
          </p>

          {/* placeholder logos */}
          <div className="mb-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {logoNames.map((name) => (
              <span
                key={name}
                className="text-sm font-semibold tracking-wide text-gray-500"
              >
                {name}
              </span>
            ))}
          </div>

          {/* stats */}
          <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-16">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold text-white sm:text-3xl">
                  {s.value}
                </p>
                <p className="text-sm text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────────────── */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Everything you need to grow
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-400">
            One platform to manage your social presence, protect your reputation,
            and keep your books full.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group rounded-xl border border-gray-800 bg-gray-900/70 p-6 transition hover:border-gray-700 hover:bg-gray-900"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600/10 text-blue-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">
                  {f.description}
                </p>
                <Link
                  href={f.href}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-400 transition hover:text-blue-300"
                >
                  Learn more
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Review Sentry Highlight ───────────────────────────── */}
      <section
        id="review-sentry"
        className="border-y border-gray-800 bg-gradient-to-br from-blue-600/10 via-gray-900 to-purple-600/10"
      >
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-300">
              <ShieldCheck className="h-4 w-4" />
              Review Sentry
            </div>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Never let a fake review hurt your business again
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-400">
              Your online reputation is everything. Review Sentry watches your
              back 24/7 — catching fakes, intercepting negativity, and keeping
              your stars shining.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {reviewSteps.map((s) => (
              <div key={s.step} className="relative text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-blue-500/40 bg-blue-500/10 text-lg font-bold text-blue-400">
                  {s.step}
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-gray-400">{s.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500"
            >
              Protect Your Reputation
              <ShieldCheck className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pricing Preview ────────────────────────────────────── */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-400">
            Pick the plan that fits your business. Upgrade anytime as you grow.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-xl border p-6 transition ${
                tier.highlighted
                  ? "border-blue-500 bg-gray-900 shadow-lg shadow-blue-500/10"
                  : "border-gray-800 bg-gray-900/60 hover:border-gray-700"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}

              <h3 className="text-lg font-semibold text-white">{tier.name}</h3>
              <p className="mt-1 text-sm text-gray-400">{tier.description}</p>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">
                  {tier.price}
                </span>
                <span className="text-sm text-gray-400">{tier.period}</span>
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-start gap-2 text-sm text-gray-300"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                    {feat}
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className={`mt-8 flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition ${
                  tier.highlighted
                    ? "bg-blue-600 text-white hover:bg-blue-500"
                    : "border border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700"
                }`}
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            View all plans and add-ons
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────── */}
      <section className="border-y border-gray-800 bg-gray-900/40">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Loved by salon owners
            </h2>
            <p className="mt-4 text-gray-400">
              Real results from real businesses.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.author}
                className="rounded-xl border border-gray-800 bg-gray-900/70 p-6"
              >
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-gray-300">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-4 border-t border-gray-800 pt-4">
                  <p className="text-sm font-semibold text-white">
                    {t.author}
                  </p>
                  <p className="text-sm text-gray-500">{t.business}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-600/20 via-gray-950 to-purple-600/10"
        />

        <div className="relative mx-auto max-w-6xl px-6 py-20 text-center sm:py-28">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to grow your salon?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-gray-400">
            Start your 14-day free trial. No credit card required.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-600 bg-gray-800/50 px-7 py-3.5 text-base font-semibold text-gray-200 transition hover:border-gray-500 hover:bg-gray-800"
            >
              Schedule Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-gray-800 bg-gray-950">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/"
              className="text-lg font-bold tracking-tight text-white"
            >
              AgentSocial
            </Link>

            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              {footerLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm text-gray-400 transition hover:text-gray-200"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-8 border-t border-gray-800 pt-6">
            <p className="text-sm text-gray-500">
              © 2026 AgentSocial. All rights reserved.
            </p>
            <p className="mt-1 text-xs text-gray-600">
              Built for salon and spa owners who want more clients and less
              stress.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}