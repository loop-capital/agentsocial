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
        <svg key={star} className={`w-4 h-4 ${star <= rating ? "text-emerald-400" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function ServiceHighlightTemplate(props: TemplateProps) {
  const {
    headline, subheadline, offerText, originalPrice, salePrice,
    ctaText, ctaUrl, businessName, businessCategory, phone, address,
    reviews, features, urgencyType, urgencyConfig,
    onCtaClick, onFormStart,
  } = props;

  const ctaHref = ctaUrl || "#book-service";
  const displayReviews = reviews.slice(0, 5);
  const displayFeatures = features.length > 0 ? features.slice(0, 6) : [
    { title: "Expert Technique", description: "Skilled professionals delivering exceptional results" },
    { title: "Premium Quality", description: "Top-tier products and meticulous attention to detail" },
    { title: "Satisfaction Guaranteed", description: "We stand behind every service we provide" },
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
            } : undefined,
          }),
        }}
      />

      {/* Urgency banner */}
      {urgencyType === "limited_spots" && urgencyConfig && (
        <div className="bg-emerald-600 text-white py-2 px-4 text-center text-sm font-semibold">
          🎯 Limited Availability — {urgencyConfig.spotsRemaining || 5} bookings left!
        </div>
      )}
      {urgencyType === "seasonal" && urgencyConfig?.seasonalLabel && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-2 px-4 text-center text-sm font-semibold">
          🌟 {urgencyConfig.seasonalLabel}
        </div>
      )}

      {/* Hero — Clean & Professional */}
      <section className="relative bg-gradient-to-br from-emerald-600 to-teal-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
        <div className="relative max-w-4xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center">
            {businessCategory && (
              <span className="inline-block bg-white/20 text-white/95 text-sm font-medium px-4 py-1 rounded-full mb-4 backdrop-blur-sm">
                {businessCategory}
              </span>
            )}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              {headline}
            </h1>
            {subheadline && (
              <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                {subheadline}
              </p>
            )}
            {(originalPrice || salePrice) && (
              <div className="inline-flex items-baseline gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 mb-8">
                {originalPrice && (
                  <span className="text-white/60 line-through text-lg">Was ${originalPrice}</span>
                )}
                {salePrice && (
                  <span className="text-4xl font-extrabold">${salePrice}</span>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <a
              href={ctaHref}
              onClick={onCtaClick}
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-emerald-700 hover:bg-gray-50 text-lg font-bold rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              {ctaText}
              <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            {phone && (
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="text-white/90 hover:text-white flex items-center gap-2 text-lg font-medium backdrop-blur-sm">
                📞 {phone}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Service Details */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-3">
            {offerText || "What's Included"}
          </h2>
          <p className="text-center text-gray-500 mb-10 max-w-xl mx-auto">
            Professional service tailored to your needs at {businessName}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayFeatures.map((f, i) => (
              <div key={i} className="bg-emerald-50 rounded-xl p-6 border border-emerald-100 hover:border-emerald-200 transition-colors">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl mb-4">
                  {f.icon || "✅"}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                {f.description && <p className="text-sm text-gray-600 leading-relaxed">{f.description}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {displayReviews.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-10">
              Client Testimonials
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {displayReviews.map((review, i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700">
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{review.name}</p>
                      <StarRating rating={review.rating} />
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">"{review.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Booking CTA */}
      <section id="book-service" className="py-16 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-emerald-600 text-white px-6 py-4 text-center">
              <h2 className="text-xl font-bold">Book This Service</h2>
              <p className="text-emerald-100 text-sm">Reserve your appointment now</p>
            </div>
            <div className="p-6 sm:p-8">
              <form
                onFocus={onFormStart}
                onSubmit={(e) => { e.preventDefault(); onCtaClick(); if (ctaUrl) window.open(ctaUrl, "_blank"); }}
                className="space-y-4"
              >
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
                <textarea
                  placeholder="Preferred date & time (optional)"
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
                />
                <button
                  type="submit"
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-lg transition-colors shadow-md"
                >
                  {ctaText}
                </button>
              </form>
            </div>
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