"use client";

import React, { useState, useEffect } from "react";
import type {
  TemplateColors,
  TemplateFonts,
  Testimonial,
  FAQItem,
  GalleryItem,
} from "../types";

export interface CampaignConfig {
  brandName: string;
  tagline?: string;
  colors?: Partial<TemplateColors>;
  fonts?: Partial<TemplateFonts>;
  logoUrl?: string;
  urgencyTitle?: string;
  offerTitle?: string;
  originalPrice?: string;
  salePrice?: string;
  offerDescription?: string;
  countdownTarget?: string; // ISO string
  countdownMessage?: string;
  valueStackItems?: string[];
  beforeAfterImages?: GalleryItem[];
  socialProofCount?: string;
  socialProofMessage?: string;
  testimonials?: Testimonial[];
  spotsRemaining?: number;
  spotsTotal?: number;
  bookingFormTitle?: string;
  faqItems?: FAQItem[];
  trustBadges?: string[];
  footerText?: string;
  customCss?: string;
}

interface CampaignTemplateProps {
  config: CampaignConfig;
}

const defaultColors: TemplateColors = {
  primary: "#2A9D8F",
  secondary: "#E76F51",
  background: "#FFFFFF",
  text: "#1A1A1A",
  accent: "#264653",
};

const defaultFonts: TemplateFonts = {
  heading: "'Playfair Display', Georgia, serif",
  body: "'Inter', system-ui, -apple-system, sans-serif",
};

function CountdownTimer({ targetDate, colors }: { targetDate: string; colors: TemplateColors }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();
      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const units = [
    { value: timeLeft.days, label: "Days" },
    { value: timeLeft.hours, label: "Hours" },
    { value: timeLeft.minutes, label: "Mins" },
    { value: timeLeft.seconds, label: "Secs" },
  ];

  return (
    <div className="flex justify-center gap-3 md:gap-4">
      {units.map((unit) => (
        <div key={unit.label} className="text-center">
          <div
            className="w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center text-2xl md:text-3xl font-bold text-white mb-1 shadow-lg"
            style={{ backgroundColor: colors.secondary }}
          >
            {String(unit.value).padStart(2, "0")}
          </div>
          <span className="text-xs uppercase tracking-wider opacity-60 font-medium">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function StarRating({ rating }: { rating?: number }) {
  if (!rating) return null;
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < rating ? "text-[#E9C46A]" : "text-gray-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function CampaignTemplate({ config }: CampaignTemplateProps) {
  const {
    brandName = "Glow Up Studio",
    tagline = "Premium Beauty Services",
    colors: c = {},
    fonts: f = {},
    logoUrl,
    urgencyTitle = "Flash Sale — 48 Hours Only",
    offerTitle = "50% Off Brazilian Blowout",
    originalPrice = "$300",
    salePrice = "$150",
    offerDescription = "Transform your hair with our signature Brazilian Blowout treatment. Smooth, frizz-free, salon-perfect results.",
    countdownTarget = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    countdownMessage = "Offer ends in",
    valueStackItems = [
      "Personalized hair consultation",
      "Full Brazilian Blowout treatment",
      "Deep conditioning mask",
      "Take-home aftercare kit",
      "30-day satisfaction guarantee",
    ],
    beforeAfterImages = [
      { src: "https://picsum.photos/500/400?random=41", caption: "Before", category: "before" },
      { src: "https://picsum.photos/500/400?random=42", caption: "After", category: "after" },
    ],
    socialProofCount = "127",
    socialProofMessage = "clients booked this week",
    testimonials = [
      {
        quote: "My hair has never looked better! The results lasted for months.",
        authorName: "Sarah M.",
        rating: 5,
      },
      {
        quote: "Amazing deal and incredible service. Will definitely be back!",
        authorName: "Lisa T.",
        rating: 5,
      },
      {
        quote: "Worth every penny. My hair is silky smooth and frizz-free.",
        authorName: "Rachel K.",
        rating: 5,
      },
    ],
    spotsRemaining = 23,
    spotsTotal = 50,
    bookingFormTitle = "Claim Your Spot",
    faqItems = [
      { question: "How long does the treatment take?", answer: "The full service takes approximately 2-3 hours including consultation." },
      { question: "How long do results last?", answer: "Results typically last 3-5 months with proper aftercare." },
      { question: "Is this safe for color-treated hair?", answer: "Yes, our treatment is safe for color-treated hair. We recommend waiting 2 weeks after coloring." },
      { question: "What's your cancellation policy?", answer: "We require 24 hours notice for cancellations to avoid a $50 fee." },
      { question: "How should I prepare?", answer: "Arrive with clean, dry hair. Avoid heavy conditioners 48 hours prior." },
    ],
    trustBadges = ["Licensed Professionals", "Insured", "5-Star Rated", "Satisfaction Guaranteed"],
    footerText = "© 2026 Glow Up Studio. All rights reserved.",
    customCss,
  } = config;

  const colors = { ...defaultColors, ...c };
  const fonts = { ...defaultFonts, ...f };
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const spotsPercent = Math.round((spotsRemaining / spotsTotal) * 100);

  return (
    <div
      className="min-h-screen antialiased"
      style={{ fontFamily: fonts.body, color: colors.text, backgroundColor: colors.background }}
    >
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}

      {/* Urgency Header */}
      <div
        className="w-full py-3 px-6 text-center"
        style={{ backgroundColor: colors.secondary }}
      >
        <p className="text-white text-sm font-semibold flex items-center justify-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
          {urgencyTitle}
        </p>
      </div>

      {/* Navbar */}
      <nav className="w-full px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: colors.text + "0D" }}>
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt={brandName} className="h-8 w-auto" />
          ) : (
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: colors.primary }}
            >
              {brandName.charAt(0)}
            </div>
          )}
          <div>
            <span className="font-bold" style={{ fontFamily: fonts.heading }}>{brandName}</span>
            {tagline && <span className="text-xs opacity-50 ml-2">{tagline}</span>}
          </div>
        </div>
      </nav>

      {/* Hero Offer */}
      <section className="px-6 py-12 md:py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1
            className="text-4xl md:text-6xl font-bold mb-4"
            style={{ fontFamily: fonts.heading, color: colors.secondary }}
          >
            {offerTitle}
          </h1>
          <p className="text-lg opacity-60 mb-8 max-w-xl mx-auto leading-relaxed">
            {offerDescription}
          </p>

          {/* Price */}
          <div className="mb-10">
            <span className="text-2xl md:text-3xl opacity-40 line-through mr-3">
              {originalPrice}
            </span>
            <span
              className="text-4xl md:text-6xl font-bold"
              style={{ color: colors.secondary }}
            >
              {salePrice}
            </span>
          </div>

          {/* Countdown */}
          <div className="mb-4">
            <p className="text-sm font-medium uppercase tracking-wider opacity-50 mb-4">
              {countdownMessage}
            </p>
            <CountdownTimer targetDate={countdownTarget} colors={colors} />
          </div>
        </div>
      </section>

      {/* Value Stack */}
      <section className="px-6 py-12" style={{ backgroundColor: colors.primary + "06" }}>
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-2xl font-bold mb-8 text-center"
            style={{ fontFamily: fonts.heading }}
          >
            What's Included
          </h2>
          <div className="space-y-4">
            {valueStackItems.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: colors.primary }}
                >
                  ✓
                </div>
                <p className="text-sm opacity-70">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Gallery */}
      <section className="px-6 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-2xl font-bold mb-8 text-center"
            style={{ fontFamily: fonts.heading }}
          >
            See The Results
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {beforeAfterImages.map((img, idx) => (
              <div key={idx} className="relative rounded-2xl overflow-hidden shadow-lg">
                <img
                  src={img.src}
                  alt={img.caption || "Gallery"}
                  className="w-full aspect-[5/4] object-cover"
                />
                <div
                  className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: img.category === "after" ? colors.primary : colors.accent }}
                >
                  {img.caption}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="px-6 py-12" style={{ backgroundColor: colors.secondary + "06" }}>
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-medium"
            style={{ backgroundColor: colors.secondary + "12", color: colors.secondary }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colors.secondary }} />
            {socialProofCount} {socialProofMessage}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="rounded-2xl p-6 text-left border"
                style={{ borderColor: colors.text + "10", backgroundColor: colors.background }}
              >
                <StarRating rating={t.rating} />
                <p className="mt-3 mb-4 text-sm opacity-70 italic leading-relaxed">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: colors.primary }}
                  >
                    {t.authorName.charAt(0)}
                  </div>
                  <span className="text-sm font-medium">{t.authorName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scarcity Bar */}
      <section className="px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Spots remaining</span>
            <span className="text-sm font-bold" style={{ color: colors.secondary }}>
              {spotsRemaining} / {spotsTotal}
            </span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: colors.text + "10" }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${spotsPercent}%`,
                backgroundColor: colors.secondary,
              }}
            />
          </div>
        </div>
      </section>

      {/* Booking Form */}
      <section id="booking" className="px-6 py-12 md:py-16">
        <div className="max-w-lg mx-auto">
          <h2
            className="text-2xl font-bold mb-8 text-center"
            style={{ fontFamily: fonts.heading }}
          >
            {bookingFormTitle}
          </h2>
          <form
            className="space-y-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <div>
              <label className="block text-sm font-medium mb-1.5 opacity-70">Full Name</label>
              <input
                type="text"
                placeholder="Your name"
                className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
                style={{ borderColor: colors.text + "15" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 opacity-70">Phone Number</label>
              <input
                type="tel"
                placeholder="(555) 000-0000"
                className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
                style={{ borderColor: colors.text + "15" }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 opacity-70">Preferred Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
                  style={{ borderColor: colors.text + "15" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 opacity-70">Preferred Time</label>
                <select
                  className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
                  style={{ borderColor: colors.text + "15" }}
                >
                  <option>Morning (9am - 12pm)</option>
                  <option>Afternoon (12pm - 4pm)</option>
                  <option>Evening (4pm - 7pm)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 opacity-70">Service</label>
              <select
                className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
                style={{ borderColor: colors.text + "15" }}
              >
                <option>Brazilian Blowout — Flash Sale</option>
                <option>Deep Conditioning Treatment</option>
                <option>Consultation Only</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-4 rounded-xl text-white font-semibold text-lg transition-all hover:opacity-90 hover:shadow-xl"
              style={{ backgroundColor: colors.secondary }}
            >
              Book Now — {salePrice}
            </button>
            <p className="text-xs text-center opacity-40">
              Limited time offer. Secure your spot today.
            </p>
          </form>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-6 py-12" style={{ backgroundColor: colors.primary + "06" }}>
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-2xl font-bold mb-8 text-center"
            style={{ fontFamily: fonts.heading }}
          >
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqItems.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border overflow-hidden transition-all"
                style={{ borderColor: colors.text + "10", backgroundColor: colors.background }}
              >
                <button
                  className="w-full px-5 py-4 flex items-center justify-between text-left"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  <span className="font-medium text-sm pr-4">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 flex-shrink-0 transition-transform ${openFaq === idx ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-4 text-sm opacity-70 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-4">
            {trustBadges.map((badge, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border"
                style={{ borderColor: colors.text + "10" }}
              >
                <svg className="w-4 h-4" style={{ color: colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium opacity-70">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t text-center" style={{ borderColor: colors.text + "10" }}>
        <p className="text-sm opacity-40">{footerText}</p>
      </footer>
    </div>
  );
}
