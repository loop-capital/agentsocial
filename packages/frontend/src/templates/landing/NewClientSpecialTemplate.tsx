"use client";

import { useState, useEffect } from "react";

interface ReviewItem {
  name: string;
  rating: number;
  text: string;
  date?: string;
  avatar?: string;
}

interface FeatureItem {
  icon?: string;
  title: string;
  description?: string;
}

interface UrgencyConfig {
  countdownEndsAt?: string;
  countdownLabel?: string;
  spotsRemaining?: number;
  spotsTotal?: number;
  seasonalLabel?: string;
  seasonalExpiry?: string;
}

interface TemplateProps {
  headline: string;
  subheadline: string | null;
  offerText: string | null;
  originalPrice: string | null;
  salePrice: string | null;
  ctaText: string;
  ctaUrl: string | null;
  businessName: string;
  businessCategory: string | null;
  phone: string | null;
  address: string | null;
  reviews: ReviewItem[];
  features: FeatureItem[];
  urgencyType: "countdown" | "limited_spots" | "seasonal" | null;
  urgencyConfig: UrgencyConfig | null;
  onCtaClick: () => void;
  onFormStart: () => void;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} className={`w-4 h-4 ${star <= rating ? "text-yellow-400" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function NewClientSpecialTemplate(props: TemplateProps) {
  const {
    headline, subheadline, offerText, originalPrice, salePrice,
    ctaText, ctaUrl, businessName, phone, address,
    reviews, features, urgencyType, urgencyConfig,
    onCtaClick, onFormStart,
  } = props;

  const ctaHref = ctaUrl || "#claim-offer";
  const displayReviews = reviews.slice(0, 5);
  const displayFeatures = features.length > 0 ? features.slice(0, 6) : [
    { title: "First Visit Guarantee", description: "Love your visit or we'll make it right" },
    { title: "No Hidden Fees", description: "Transparent pricing, always" },
    { title: "Expert Team", description: "Certified professionals you can trust" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Schema.org markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: businessName,
            telephone: phone,
            address: address ? { "@type": "PostalAddress", streetAddress: address } : undefined,
            offer: offerText ? {
              "@type": "Offer",
              name: offerText,
              price: salePrice,
              priceCurrency: "USD",
              availability: "https://schema.org/LimitedAvailability",
            } : undefined,
          }),
        }}
      />

      {/* Urgency strip */}
      {urgencyType === "limited_spots" && urgencyConfig && (
        <div className="bg-amber-500 text-white py-2 px-4 text-center text-sm font-semibold">
          ⚡ New Client Special — Only {urgencyConfig.spotsRemaining || 10} spots remaining!
        </div>
      )}
      {urgencyType === "seasonal" && urgencyConfig?.seasonalLabel && (
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white py-2 px-4 text-center text-sm font-semibold">
          🎉 {urgencyConfig.seasonalLabel}
        </div>
      )}

      {/* Hero — Welcome New Clients */}
      <section className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="inline-block bg-amber-100 text-amber-800 text-sm font-semibold px-4 py-1 rounded-full mb-6">
            ✨ New Client Special
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            {headline}
          </h1>
          {subheadline && (
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {subheadline}
            </p>
          )}
          {(originalPrice || salePrice || offerText) && (
            <div className="inline-flex items-center gap-4 bg-white rounded-2xl shadow-lg px-8 py-5 mb-8">
              {offerText && <span className="text-lg font-medium text-gray-700">{offerText}</span>}
              {originalPrice && (
                <span className="text-gray-400 line-through text-xl">${originalPrice}</span>
              )}
              {salePrice && (
                <span className="text-4xl font-extrabold text-amber-600">${salePrice}</span>
              )}
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={ctaHref}
              onClick={onCtaClick}
              className="inline-flex items-center justify-center px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white text-lg font-bold rounded-full shadow-lg transition-all transform hover:scale-105"
            >
              {ctaText}
            </a>
            {phone && (
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="text-gray-600 hover:text-gray-800 flex items-center gap-2 text-lg font-medium">
                📞 {phone}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-10">
            Why First-Timers Love {businessName}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayFeatures.map((f, i) => (
              <div key={i} className="bg-amber-50 rounded-xl p-6 border border-amber-100">
                <div className="text-2xl mb-3">{f.icon || "🌟"}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                {f.description && <p className="text-sm text-gray-600">{f.description}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      {displayReviews.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-10">
              Hear From Our Happy Clients
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {displayReviews.slice(0, 4).map((review, i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <StarRating rating={review.rating} />
                  <p className="text-gray-700 mt-3 text-sm leading-relaxed">"{review.text}"</p>
                  <p className="mt-3 font-medium text-gray-900 text-sm">— {review.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Claim Offer Form */}
      <section id="claim-offer" className="py-16 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 text-center">
            <span className="inline-block bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              New Clients Only
            </span>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Claim Your Special Offer</h2>
            <p className="text-gray-500 text-sm mb-6">Fill out the form below and we&apos;ll get you booked!</p>
            <form
              onFocus={onFormStart}
              onSubmit={(e) => { e.preventDefault(); onCtaClick(); if (ctaUrl) window.open(ctaUrl, "_blank"); }}
              className="space-y-4"
            >
              <input
                type="text"
                placeholder="Your Name"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                required
              />
              <input
                type="tel"
                placeholder="Phone Number"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                required
              />
              <input
                type="email"
                placeholder="Email (optional)"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
              <button
                type="submit"
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg rounded-lg transition-colors shadow-md"
              >
                {ctaText}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="font-semibold text-white text-lg mb-2">{businessName}</p>
          {address && <p className="text-sm mb-1">{address}</p>}
          {phone && <p className="text-sm mb-4">{phone}</p>}
          <p className="text-xs text-gray-500">Powered by AgentSocial · © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}