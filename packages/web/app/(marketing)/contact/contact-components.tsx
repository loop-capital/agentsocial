"use client";

import { useState } from "react";

interface FAQItem {
  q: string;
  a: string;
}

export function ContactFAQ({ items }: { items: FAQItem[] }) {
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

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const contactReasons = [
    { value: "sales", label: "Sales — I want a demo or plan info" },
    { value: "support", label: "Support — I need help with my account" },
    { value: "partnership", label: "Partnership — Integration or reseller inquiry" },
    { value: "enterprise", label: "Enterprise — Custom plan or volume pricing" },
    { value: "press", label: "Press — Media or analyst inquiry" },
    { value: "other", label: "Other" },
  ];

  if (submitted) {
    return (
      <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-slate-900">Message Sent!</h3>
        <p className="mt-2 text-slate-600">
          Thanks for reaching out. We&apos;ll get back to you within 24 hours — usually much faster.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-2">First Name *</label>
          <input type="text" id="firstName" name="firstName" required className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-slate-900 placeholder-slate-400" placeholder="Jane" />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-2">Last Name *</label>
          <input type="text" id="lastName" name="lastName" required className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-slate-900 placeholder-slate-400" placeholder="Smith" />
        </div>
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Work Email *</label>
        <input type="email" id="email" name="email" required className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-slate-900 placeholder-slate-400" placeholder="jane@company.com" />
      </div>
      <div>
        <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-2">Company</label>
        <input type="text" id="company" name="company" className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-slate-900 placeholder-slate-400" placeholder="Company name" />
      </div>
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-slate-700 mb-2">Reason for Contact *</label>
        <select id="reason" name="reason" required className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-slate-900 bg-white" defaultValue="">
          <option value="" disabled>Select a reason...</option>
          {contactReasons.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="plan" className="block text-sm font-medium text-slate-700 mb-2">Interested Plan</label>
        <select id="plan" name="plan" className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-slate-900 bg-white" defaultValue="">
          <option value="" disabled>Select a plan...</option>
          <option value="starter">Starter — $29/mo</option>
          <option value="pro">Pro — $99/mo</option>
          <option value="enterprise">Enterprise — $299/mo</option>
          <option value="unsure">Not sure yet</option>
        </select>
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">Message *</label>
        <textarea id="message" name="message" required rows={5} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-slate-900 placeholder-slate-400 resize-none" placeholder="Tell us about your needs, questions, or how we can help..." />
      </div>
      <div>
        <button type="submit" className="w-full px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-emerald-500/20">
          Send Message
        </button>
        <p className="mt-3 text-sm text-slate-400 text-center">
          We&apos;ll never share your info. Read our Privacy Policy for details.
        </p>
      </div>
    </form>
  );
}