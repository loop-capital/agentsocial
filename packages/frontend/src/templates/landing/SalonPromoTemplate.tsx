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

function CountdownTimer({ endsAt, label }: { endsAt: string; label?: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date(endsAt).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  return (
    <div className="bg-red-600 text-white py-3 px-4 text-center">
      <p className="text-sm font-medium mb-2">{label || "🔥 Limited Time Offer — Ends Soon!"}</p>
      <div className="flex items-center justify-center gap-3">
        {[
          { value: timeLeft.days, unit: "Days" },
          { value: timeLeft.hours, unit: "Hrs" },
          { value: timeLeft.minutes, unit: "Min" },
          { value: timeLeft.seconds, unit: "Sec" },
        ].map(({ value, unit }) => (
          <div key={unit} className="bg-red-700 rounded px-3 py-1">
            <div className="text-2xl font-bold">{String(value).padStart(2, "0")}</div>
            <div className="text-xs uppercase tracking-wider opacity-80">{unit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} className={`w-5 h-5 ${star <= rating ? "text-yellow-400" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function SalonPromoTemplate(props: TemplateProps) {
  const {
    headline, subheadline, offerText, originalPrice, salePrice,
    ctaText, ctaUrl, businessName, phone, address,
    reviews, features, urgencyType, urgencyConfig,
    onCtaClick, onFormStart,
  } = props;

  const ctaHref = ctaUrl || "#booking";
  const displayReviews = reviews.length > 0 ? reviews.slice(0, 5) : [];
  const displayFeatures = features.length > 0 ? features.slice(0, 6) : [
    { title: "Professional Results", description: "Expert stylists deliver the look you want" },
    { title: "Premium Products", description: "Only the best for your hair and skin" },
    { title: "Relaxing Atmosphere", description: "Unwind while we pamper you" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Schema.org LocalBusiness markup */}
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

      {/* Urgency Bar */}
      {urgencyType === "countdown" && urgencyConfig?.countdownEndsAt && (
        <CountdownTimer endsAt={urgencyConfig.countdownEndsAt} label={urgencyConfig.countdownLabel} />
      )}
      {urgencyType === "limited_spots" && urgencyConfig && (
        <div className="bg-red-600 text-white py-2 px-4 text-center text-sm font-medium">
          🔥 Only {urgencyConfig.spotsRemaining || 5} spots left at this price!
        </div>
      )}
      {urgencyType === "seasonal" && urgencyConfig?.seasonalLabel && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 text-center text-sm font-medium">
          ✨ {urgencyConfig.seasonalLabel}
        </div>
      )}

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
            {headline}
          </h1>
          {subheadline && (
            <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              {subheadline}
            </p>
          )}
          {offerText && (
            <div className="inline-block bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-4 mb-8">
              <p className="text-xl sm:text-2xl font-bold">{offerText}</p>
              {(originalPrice || salePrice) && (
                <div className="flex items-center justify-center gap-3 mt-2">
                  {originalPrice && (
                    <span className="text-white/60 line-through text-lg">${originalPrice}</span>
                  )}
                  {salePrice && (
                    <span className="text-3xl font-extrabold">${salePrice}</span>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={ctaHref}
              onClick={onCtaClick}
              className="inline-flex items-center justify-center px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-lg font-bold rounded-full shadow-lg transition-all transform hover:scale-105"
            >
              {ctaText}
              <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            {phone && (
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="text-white/90 hover:text-white flex items-center gap-2 text-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {phone}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-10">
            Why Choose {businessName}?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayFeatures.map((f, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-xl mb-3">
                  {f.icon || "✨"}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                {f.description && (
                  <p className="text-sm text-gray-600">{f.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      {displayReviews.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-10">
              What Our Clients Say
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayReviews.map((review, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <StarRating rating={review.rating} />
                  <p className="text-gray-700 mt-3 text-sm leading-relaxed">"{review.text}"</p>
                  <div className="flex items-center gap-2 mt-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600">
                      {review.name.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-900 text-sm">{review.name}</span>
                    {review.date && (
                      <span className="text-gray-400 text-xs">{review.date}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Booking / CTA Section */}
      <section id="booking" className="py-16 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Book Your Appointment Today
          </h2>
          <p className="text-gray-600 mb-8">
            Don&apos;t miss out — reserve your spot now and experience the {businessName} difference.
          </p>
          <form
            className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 space-y-4"
            onFocus={onFormStart}
            onSubmit={(e) => { e.preventDefault(); onCtaClick(); if (ctaUrl) window.open(ctaUrl, "_blank"); }}
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Your Name"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                required
              />
              <input
                type="tel"
                placeholder="Phone Number"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <input
              type="email"
              placeholder="Email Address"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
            <textarea
              placeholder="What service are you interested in?"
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
            />
            <button
              type="submit"
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-lg transition-colors shadow-md"
            >
              {ctaText}
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="font-semibold text-white text-lg mb-2">{businessName}</p>
          {address && <p className="text-sm mb-1">{address}</p>}
          {phone && <p className="text-sm mb-4">{phone}</p>}
          <p className="text-xs text-gray-500">
            Powered by AgentSocial · © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}