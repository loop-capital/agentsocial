import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm, ContactFAQ } from "./contact-components";

export const metadata: Metadata = {
  title: "Contact Us — AgentSocial | Get in Touch",
  description:
    "Have questions about AgentSocial? Want a demo? Need support? Reach out and we'll get back to you within 24 hours.",
  openGraph: {
    title: "Contact Us — AgentSocial",
    description: "Get in touch with the AgentSocial team. Sales, support, or partnerships — we're here to help.",
    url: "https://agentsocial.io/contact",
    siteName: "AgentSocial",
    type: "website",
  },
};

/* ─── Reusable Icons ──────────────────────────────────────── */

const SparkleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

/* ─── Contact Info Cards ───────────────────────────────────── */

const contactMethods = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.616a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
    title: "Email",
    detail: "hello@agentsocial.io",
    sub: "We reply within 24 hours",
    href: "mailto:hello@agentsocial.io",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.362l-.297-.227a2.093 2.093 0 01-.718-1.612V10.608a2.093 2.093 0 01.718-1.612l.297-.227a2.115 2.115 0 01.825-.362c1.332-.108 2.668-.163 4.02-.163h3c.884 0 1.688.403 2.2 1.033z" />
      </svg>
    ),
    title: "Live Chat",
    detail: "In-dashboard chat",
    sub: "Pro & Enterprise · Mon–Fri 9am–6pm ET",
    href: "/register",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Response Time",
    detail: "< 24 hours",
    sub: "Usually within 2 hours during business hours",
    href: "#contact-form",
  },
];

const contactFaqs = [
  {
    q: "How quickly will I hear back?",
    a: "We respond to all inquiries within 24 hours, usually much faster. Sales and support requests during business hours are typically answered within 2 hours.",
  },
  {
    q: "Can I schedule a live demo?",
    a: "Yes! Select 'Sales' as your reason and mention you'd like a demo. We'll set up a 30-minute walkthrough tailored to your business.",
  },
  {
    q: "Do you offer custom enterprise plans?",
    a: "Absolutely. Enterprise plans can include multi-brand management, custom integrations, dedicated account managers, and volume pricing. Select 'Enterprise' as your reason and we'll build a custom quote.",
  },
  {
    q: "What's the best way to reach support?",
    a: "Use this contact form or email support@agentsocial.io. Pro and Enterprise customers also get live chat and phone support from their dashboard.",
  },
  {
    q: "I'm already a customer. Should I use this form?",
    a: "For faster support, log in to your dashboard and use the in-app chat. But this form works too — we'll route it to the right team.",
  },
];

/* ─── Hero ──────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden bg-slate-900 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-900" />
      <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-6">
          <SparkleIcon className="w-4 h-4" />
          We typically respond within 2 hours
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
          Let&apos;s Talk
        </h1>

        <p className="mt-5 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Whether you need a demo, have questions about pricing, or want to discuss
          a custom enterprise plan — we&apos;re here to help.
        </p>
      </div>
    </section>
  );
}

/* ─── Contact Methods ───────────────────────────────────────── */

function ContactMethodsSection() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-6">
          {contactMethods.map((method, i) => (
            <a
              key={i}
              href={method.href}
              className="group block p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/5 transition-all"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 mb-4 group-hover:bg-emerald-200 transition-colors">
                {method.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900">{method.title}</h3>
              <p className="text-emerald-600 font-semibold mt-1">{method.detail}</p>
              <p className="text-sm text-slate-500 mt-1">{method.sub}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="py-8 bg-slate-50 border-t border-slate-200">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-slate-700 font-semibold">AgentSocial</p>
            <p className="text-xs text-slate-400 mt-1">AI-powered social media management</p>
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/pricing" className="text-slate-400 hover:text-slate-700 transition-colors">Pricing</Link>
            <Link href="/contact" className="text-slate-400 hover:text-slate-700 transition-colors">Contact</Link>
            <Link href="/compare" className="text-slate-400 hover:text-slate-700 transition-colors">Compare</Link>
          </div>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} AgentSocial. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─── Page ──────────────────────────────────────────────────── */

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white">
      <Hero />
      <ContactMethodsSection />
      <section id="contact-form" className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-12">
            <div className="lg:col-span-3">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Send Us a Message</h2>
              <p className="mt-3 text-slate-500 text-lg">
                Fill out the form below and we&apos;ll get back to you within 24 hours.
              </p>
              <div className="mt-8">
                <ContactForm />
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="sticky top-8 space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Links</h3>
                  <div className="space-y-3">
                    <Link
                      href="/pricing"
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">View Pricing</p>
                        <p className="text-sm text-slate-500">Compare plans and features</p>
                      </div>
                    </Link>
                    <Link
                      href="/compare"
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">Compare vs Zoca</p>
                        <p className="text-sm text-slate-500">See how we stack up</p>
                      </div>
                    </Link>
                    <Link
                      href="/register"
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37l6-9.28m-6 9.28l-6-9.28M12 21a9 9 0 110-18 9 9 0 010 18z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">Start Free Trial</p>
                        <p className="text-sm text-slate-500">14 days, no credit card</p>
                      </div>
                    </Link>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
                  <h3 className="text-lg font-bold mb-2">Enterprise?</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Need multi-brand management, custom integrations, or volume pricing? Select
                    &ldquo;Enterprise&rdquo; in the form and we&apos;ll build a custom plan for your business.
                  </p>
                  <Link
                    href="/register?plan=enterprise"
                    className="inline-flex items-center mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-lg font-semibold text-sm transition-colors"
                  >
                    Learn about Enterprise
                    <svg className="w-4 h-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Common Questions</h2>
            <p className="mt-3 text-slate-500 text-lg">Quick answers before you reach out</p>
          </div>
          <ContactFAQ items={contactFaqs} />
        </div>
      </section>
      <Footer />
    </main>
  );
}