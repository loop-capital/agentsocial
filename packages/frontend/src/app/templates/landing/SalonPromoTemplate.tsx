"use client";

export interface LandingTemplateProps {
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
  onCtaClick: () => void;
  onFormStart: () => void;
}

export function SalonPromoTemplate(props: LandingTemplateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <header className="py-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900">{props.headline}</h1>
        {props.subheadline && (
          <p className="mt-3 text-lg text-gray-600">{props.subheadline}</p>
        )}
      </header>
      {props.offerText && (
        <section className="mx-auto max-w-2xl px-4 py-8 text-center">
          <div className="rounded-xl bg-white p-8 shadow-lg">
            <p className="text-2xl font-semibold text-purple-700">{props.offerText}</p>
            {props.originalPrice && props.salePrice && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <span className="text-lg line-through text-gray-400">{props.originalPrice}</span>
                <span className="text-2xl font-bold text-purple-600">{props.salePrice}</span>
              </div>
            )}
            <a
              href={props.ctaUrl || "#"}
              onClick={props.onCtaClick}
              className="mt-6 inline-block rounded-lg bg-purple-600 px-8 py-3 text-lg font-semibold text-white hover:bg-purple-700 transition-colors"
            >
              {props.ctaText}
            </a>
          </div>
        </section>
      )}
      <footer className="py-8 text-center text-sm text-gray-500">
        <p>{props.businessName}</p>
        {props.phone && <p>{props.phone}</p>}
        {props.address && <p>{props.address}</p>}
      </footer>
    </div>
  );
}