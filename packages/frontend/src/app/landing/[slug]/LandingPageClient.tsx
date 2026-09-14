"use client";

import { useState, useEffect } from "react";
import { SalonPromoTemplate } from "../../templates/landing/SalonPromoTemplate";
import { NewClientSpecialTemplate } from "../../templates/landing/NewClientSpecialTemplate";
import { ServiceHighlightTemplate } from "../../templates/landing/ServiceHighlightTemplate";

interface LandingPageData {
  id: string;
  slug: string;
  title: string;
  templateType: "salon_promo" | "new_client" | "service_highlight";
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
  reviews: Array<{
    name: string;
    rating: number;
    text: string;
    date?: string;
    avatar?: string;
  }>;
  features: Array<{
    icon?: string;
    title: string;
    description?: string;
  }>;
  urgencyType: "countdown" | "limited_spots" | "seasonal" | null;
  urgencyConfig: {
    countdownEndsAt?: string;
    countdownLabel?: string;
    spotsRemaining?: number;
    spotsTotal?: number;
    seasonalLabel?: string;
    seasonalExpiry?: string;
  } | null;
  isPublished: boolean;
  conversionTrackingEnabled: boolean;
  brandId?: string;
}

interface Props {
  slug: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function LandingPageClient({ slug }: Props) {
  const [page, setPage] = useState<LandingPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/landing-pages/${slug}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Page not found");
          } else {
            setError("Failed to load page");
          }
          return;
        }
        const { data } = await res.json();
        setPage(data);
      } catch {
        setError("Failed to load page");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  // Track impression on load
  useEffect(() => {
    if (!page?.conversionTrackingEnabled) return;
    try {
      fetch(`${API_BASE}/api/v1/gbp/conversion/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: page.brandId || (page as any).brand_id,
          eventType: "booking_cta_impression",
          source: "ad",
          metadata: { landingPageSlug: slug },
        }),
      }).catch(() => {});
    } catch {}
  }, [page, slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <div className="text-6xl">😕</div>
        <h1 className="text-2xl font-bold text-gray-900">
          {error === "Page not found" ? "Page Not Found" : "Something Went Wrong"}
        </h1>
        <p className="text-gray-500">
          {error === "Page not found"
            ? "This landing page doesn't exist or is no longer available."
            : "We couldn't load this page. Please try again later."}
        </p>
        <a href="/" className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          Go Home
        </a>
      </div>
    );
  }

  const handleCtaClick = () => {
    if (!page.conversionTrackingEnabled) return;
    try {
      fetch(`${API_BASE}/api/v1/gbp/conversion/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: (page as any).brand_id || page.brandId,
          eventType: "booking_cta_click",
          source: "ad",
          metadata: { landingPageSlug: slug },
        }),
      }).catch(() => {});
    } catch {}
  };

  const handleFormStart = () => {
    if (!page.conversionTrackingEnabled) return;
    try {
      fetch(`${API_BASE}/api/v1/gbp/conversion/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: (page as any).brand_id || page.brandId,
          eventType: "booking_form_start",
          source: "ad",
          metadata: { landingPageSlug: slug },
        }),
      }).catch(() => {});
    } catch {}
  };

  const commonProps = {
    ...page,
    onCtaClick: handleCtaClick,
    onFormStart: handleFormStart,
  };

  switch (page.templateType) {
    case "new_client":
      return <NewClientSpecialTemplate {...commonProps} />;
    case "service_highlight":
      return <ServiceHighlightTemplate {...commonProps} />;
    case "salon_promo":
    default:
      return <SalonPromoTemplate {...commonProps} />;
  }
}