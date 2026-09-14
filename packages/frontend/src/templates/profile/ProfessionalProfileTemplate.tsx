"use client";

import React from "react";
import type {
  TemplateColors,
  TemplateFonts,
  ServiceItem,
  BusinessHours,
} from "../types";

// ─── Types ──────────────────────────────────────────────────────────────────

export type ProfileTheme = "modern" | "classic" | "bold";

export interface ReviewItem {
  id: string;
  reviewerName: string;
  reviewerPhotoUrl?: string;
  starRating: number;
  comment: string;
  replyComment?: string;
  createTime?: string;
}

export interface ProfessionalProfileConfig {
  brandName: string;
  slug: string;
  category: string;
  description?: string;
  phone?: string;
  email?: string;
  websiteUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  hours?: BusinessHours[];
  hoursMap?: Record<string, string>;
  photos?: string[];
  services?: ServiceItem[];
  ratingAvg?: number; // 0-5 scale (or basis points / 10)
  reviewCount?: number;
  reviews?: ReviewItem[];
  theme?: ProfileTheme;
  colors?: Partial<TemplateColors>;
  fonts?: Partial<TemplateFonts>;
  bookingUrl?: string;
  bookingButtonText?: string;
  logoUrl?: string;
}

// ─── Theme Presets ──────────────────────────────────────────────────────────

const THEME_COLORS: Record<ProfileTheme, TemplateColors> = {
  modern: {
    primary: "#2A9D8F",
    secondary: "#E76F51",
    background: "#FFFFFF",
    text: "#1A1A1A",
    accent: "#264653",
  },
  classic: {
    primary: "#8B7355",
    secondary: "#D4A574",
    background: "#FDFBF7",
    text: "#2C2420",
    accent: "#5C4033",
  },
  bold: {
    primary: "#E63946",
    secondary: "#FFB703",
    background: "#FFFFFF",
    text: "#0A0A0A",
    accent: "#1D3557",
  },
};

const THEME_FONTS: Record<ProfileTheme, TemplateFonts> = {
  modern: { heading: "Inter", body: "Inter" },
  classic: { heading: "Playfair Display", body: "Lora" },
  bold: { heading: "Space Grotesk", body: "DM Sans" },
};

// ─── Helper Components ──────────────────────────────────────────────────────

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  // Handle basis points (e.g. 47 → 4.7)
  const normalized = rating > 5 ? rating / 10 : rating;
  const full = Math.floor(normalized);
  const partial = normalized - full;
  const empty = max - full - (partial > 0.25 ? 1 : 0);

  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <svg key={`full-${i}`} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {partial > 0.25 && (
        <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 20 20">
          <defs>
            <linearGradient id={`partial-${normalized}`}>
              <stop offset={`${partial * 100}%`} stopColor="currentColor" />
              <stop offset={`${partial * 100}%`} stopColor="#D1D5DB" />
            </linearGradient>
          </defs>
          <path fill={`url(#partial-${normalized})`} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )}
      {Array.from({ length: Math.max(0, empty) }).map((_, i) => (
        <svg key={`empty-${i}`} className="w-5 h-5 text-gray-300 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function GetUpLookBadge() {
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
      <span>Listed on <strong className="text-gray-700">GetUpLook</strong></span>
    </div>
  );
}

// ─── Main Template ──────────────────────────────────────────────────────────

interface ProfessionalProfileTemplateProps {
  config: ProfessionalProfileConfig;
}

export default function ProfessionalProfileTemplate({ config }: ProfessionalProfileTemplateProps) {
  const theme: ProfileTheme = config.theme || "modern";
  const colors = { ...THEME_COLORS[theme], ...config.colors };
  const fonts = { ...THEME_FONTS[theme], ...config.fonts };
  const rating = config.ratingAvg ?? 0;
  const normalizedRating = rating > 5 ? rating / 10 : rating;
  const displayRating = normalizedRating.toFixed(1);
  const reviews = config.reviews || [];
  const services = config.services || [];
  const photos = config.photos || [];
  const hoursMap = config.hoursMap || (config.hours || []).reduce((acc, h) => {
    const day = h.day.charAt(0).toUpperCase() + h.day.slice(1).toLowerCase();
    acc[day] = h.hours;
    return acc;
  }, {} as Record<string, string>);

  const bookingUrl = config.bookingUrl || `#${config.slug}-booking`;
  const bookingText = config.bookingButtonText || "Book Now";

  const fullAddress = [config.address, config.city, config.state, config.zip].filter(Boolean).join(", ");
  const mapEmbedUrl = config.latitude && config.longitude
    ? `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tgm6j-0rgg&zoom=15&q=${config.latitude},${config.longitude}`
    : fullAddress
      ? `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tgm6j-0rgg&zoom=15&q=${encodeURIComponent(fullAddress)}`
      : undefined;

  const themeClass = `profile-theme-${theme}`;

  return (
    <div className={themeClass} style={{ fontFamily: fonts.body }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .${themeClass} { --color-primary: ${colors.primary}; --color-secondary: ${colors.secondary}; --color-bg: ${colors.background}; --color-text: ${colors.text}; --color-accent: ${colors.accent}; --font-heading: ${fonts.heading}; --font-body: ${fonts.body}; }
        .${themeClass} h1, .${themeClass} h2, .${themeClass} h3 { font-family: var(--font-heading), sans-serif; }
      ` }} />

      {/* ─── Hero Section ──────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-gray-50 to-white overflow-hidden">
        {photos[0] && (
          <div className="absolute inset-0 z-0">
            <img
              src={photos[0]}
              alt={config.brandName}
              className="w-full h-full object-cover opacity-20"
            />
          </div>
        )}
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-16 sm:py-24">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {config.logoUrl && (
              <img
                src={config.logoUrl}
                alt={config.brandName}
                className="w-20 h-20 rounded-xl object-cover shadow-lg"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  {config.category}
                </span>
                <GetUpLookBadge />
              </div>
              <h1
                className="text-4xl sm:text-5xl font-bold mb-3"
                style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}
              >
                {config.brandName}
              </h1>
              {config.description && (
                <p className="text-gray-600 text-lg max-w-2xl mb-4">
                  {config.description}
                </p>
              )}
              <div className="flex items-center gap-4 flex-wrap">
                {rating > 0 && (
                  <div className="flex items-center gap-2">
                    <StarRating rating={rating} />
                    <span className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                      {displayRating}
                    </span>
                    <span className="text-gray-500">
                      ({config.reviewCount || 0} reviews)
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="sm:ml-auto">
              <a
                href={bookingUrl}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
                style={{ backgroundColor: "var(--color-secondary)" }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {bookingText}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Photo Gallery ──────────────────────────────────────────────── */}
      {photos.length > 1 && (
        <section className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.slice(1, 7).map((photo, i) => (
              <div key={i} className={`relative rounded-xl overflow-hidden ${i === 0 ? "col-span-2 row-span-2" : ""} aspect-square`}>
                <img
                  src={photo}
                  alt={`${config.brandName} photo ${i + 2}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Services ───────────────────────────────────────────────────── */}
      {services.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 py-12">
          <h2
            className="text-3xl font-bold mb-8"
            style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}
          >
            Our Services
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {services.map((service, i) => (
              <div
                key={i}
                className="flex items-start justify-between p-5 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-lg" style={{ color: "var(--color-text)" }}>
                    {service.name}
                  </h3>
                  {service.description && (
                    <p className="text-gray-500 text-sm mt-1">{service.description}</p>
                  )}
                  {service.duration && (
                    <span className="inline-block mt-1 text-xs text-gray-400">{service.duration}</span>
                  )}
                </div>
                {service.price && (
                  <span
                    className="text-lg font-bold ml-4 shrink-0"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {service.price}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Reviews ────────────────────────────────────────────────────── */}
      {reviews.length > 0 && (
        <section className="bg-gray-50 py-12">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2
                className="text-3xl font-bold"
                style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}
              >
                Reviews
              </h2>
              {rating > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating rating={rating} />
                  <span className="font-semibold" style={{ color: "var(--color-text)" }}>
                    {displayRating}
                  </span>
                  <span className="text-gray-500 text-sm">({config.reviewCount})</span>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {reviews.slice(0, 5).map((review) => (
                <div key={review.id} className="bg-white rounded-xl p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                        style={{ backgroundColor: "var(--color-primary)" }}
                      >
                        {review.reviewerName?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: "var(--color-text)" }}>
                          {review.reviewerName}
                        </p>
                        {review.createTime && (
                          <p className="text-xs text-gray-400">
                            {new Date(review.createTime).toLocaleDateString("en-US", {
                              year: "numeric", month: "long", day: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <StarRating rating={review.starRating} />
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                  {review.replyComment && (
                    <div className="mt-3 ml-4 pl-4 border-l-2 text-sm" style={{ borderColor: "var(--color-primary)" }}>
                      <p className="font-semibold text-xs mb-1" style={{ color: "var(--color-primary)" }}>
                        Response from {config.brandName}:
                      </p>
                      <p className="text-gray-600">{review.replyComment}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {(config.reviewCount ?? 0) > 5 && (
              <div className="text-center mt-6">
                <button
                  className="px-6 py-2 border-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
                >
                  View All {config.reviewCount} Reviews
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── Business Info (Hours + Contact + Map) ──────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2">
          {/* Hours + Contact */}
          <div>
            <h2
              className="text-3xl font-bold mb-6"
              style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}
            >
              Business Info
            </h2>

            {/* Hours */}
            {Object.keys(hoursMap).length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold text-lg mb-3" style={{ color: "var(--color-text)" }}>
                  Hours
                </h3>
                <div className="space-y-1">
                  {Object.entries(hoursMap).map(([day, hours]) => {
                    const isClosed = hours.toLowerCase() === "closed";
                    return (
                      <div key={day} className="flex justify-between py-1.5 border-b border-gray-100">
                        <span className="text-gray-700 font-medium">{day}</span>
                        <span className={isClosed ? "text-red-500 font-medium" : "text-gray-600"}>
                          {isClosed ? "Closed" : hours}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Contact */}
            <div className="space-y-3">
              {config.phone && (
                <a href={`tel:${config.phone}`} className="flex items-center gap-3 text-gray-700 hover:text-gray-900">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {config.phone}
                </a>
              )}
              {config.email && (
                <a href={`mailto:${config.email}`} className="flex items-center gap-3 text-gray-700 hover:text-gray-900">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {config.email}
                </a>
              )}
              {config.websiteUrl && (
                <a href={config.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-700 hover:text-gray-900">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                  </svg>
                  Visit Website
                </a>
              )}
              {fullAddress && (
                <div className="flex items-start gap-3 text-gray-700">
                  <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{fullAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          {mapEmbedUrl && (
            <div className="rounded-xl overflow-hidden shadow-md h-80 sm:h-auto">
              <iframe
                src={mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: "320px" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`${config.brandName} location`}
              />
            </div>
          )}
        </div>
      </section>

      {/* ─── CTA Section ────────────────────────────────────────────────── */}
      <section
        className="py-16 text-center"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        <div className="max-w-3xl mx-auto px-4">
          <h2
            className="text-3xl font-bold text-white mb-4"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Ready to Book?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Schedule your appointment at {config.brandName} today.
          </p>
          <a
            href={bookingUrl}
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105"
            style={{ color: "var(--color-primary)" }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {bookingText}
          </a>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <GetUpLookBadge />
          <p className="text-sm mt-3">
            &copy; {new Date().getFullYear()} {config.brandName}. All rights reserved.
          </p>
          <p className="text-xs mt-1 text-gray-600">
            Profile powered by GetUpLook — Local business marketing & SEO
          </p>
        </div>
      </footer>
    </div>
  );
}

// ─── SSG Export Helper ──────────────────────────────────────────────────────

export function generateStaticParams(configs: ProfessionalProfileConfig[]): string[] {
  return configs.map((c) => c.slug);
}

export function generateMetadata(config: ProfessionalProfileConfig) {
  const normalizedRating = (config.ratingAvg ?? 0) > 5
    ? (config.ratingAvg ?? 0) / 10
    : (config.ratingAvg ?? 0);
  const fullAddress = [config.address, config.city, config.state, config.zip].filter(Boolean).join(", ");

  return {
    title: `${config.brandName} — ${config.category} in ${config.city || ""}${config.state ? `, ${config.state}` : ""} | GetUpLook`,
    description: config.description || `${config.brandName} — ${config.category} in ${fullAddress}. Book your appointment today!`,
    openGraph: {
      title: `${config.brandName} — ${config.category}`,
      description: config.description || `Find ${config.brandName} on GetUpLook. ${normalizedRating > 0 ? `Rated ${normalizedRating.toFixed(1)}/5.` : ""}`,
      url: `https://getuplook.com/profile/${config.slug}`,
      siteName: "GetUpLook",
      type: "website" as const,
      images: config.photos?.slice(0, 1) || [],
    },
    alternates: {
      canonical: `https://getuplook.com/profile/${config.slug}`,
    },
  };
}

export function generateJsonLd(config: ProfessionalProfileConfig) {
  const normalizedRating = (config.ratingAvg ?? 0) > 5
    ? (config.ratingAvg ?? 0) / 10
    : (config.ratingAvg ?? 0);
  const fullAddress = [config.address, config.city, config.state, config.zip].filter(Boolean).join(", ");

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: config.brandName,
    description: config.description,
    url: `https://getuplook.com/profile/${config.slug}`,
    telephone: config.phone,
    email: config.email,
    image: config.photos?.[0],
    address: {
      "@type": "PostalAddress",
      streetAddress: config.address,
      addressLocality: config.city,
      addressRegion: config.state,
      postalCode: config.zip,
      addressCountry: "US",
    },
    geo: config.latitude && config.longitude
      ? { "@type": "GeoCoordinates", latitude: config.latitude, longitude: config.longitude }
      : undefined,
    aggregateRating: normalizedRating > 0 && (config.reviewCount ?? 0) > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: normalizedRating,
          reviewCount: config.reviewCount,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
    openingHoursSpecification: Object.entries(config.hoursMap || {}).map(([day, hours]) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: day,
      opens: hours === "Closed" ? undefined : hours?.split(" - ")?.[0],
      closes: hours === "Closed" ? undefined : hours?.split(" - ")?.[1],
    })),
    priceRange: config.services?.length ? "$$" : undefined,
    hasOfferCatalog: config.services?.length
      ? {
          "@type": "OfferCatalog",
          name: `${config.brandName} Services`,
          itemListElement: config.services.map((s, i) => ({
            "@type": "OfferCatalog",
            position: i + 1,
            name: s.name,
            description: s.description,
            offers: s.price
              ? { "@type": "Offer", price: s.price.replace(/[^0-9.]/g, ""), priceCurrency: "USD" }
              : undefined,
          })),
        }
      : undefined,
  };
}