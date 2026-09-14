"use client";

import type { LandingTemplateProps } from "./SalonPromoTemplate";

export function NewClientSpecialTemplate(props: LandingTemplateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <header className="py-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900">{props.headline}</h1>
        {props.subheadline && (
          <p className="mt-3 text-lg text-gray-600">{props.subheadline}</p>
        )}
      </header>
      {props.offerText && (
        <section className="mx-auto max-w-2xl px-4 py-8 text-center">
          <div className="rounded-xl bg-white p-8 shadow-lg border-2 border-amber-200">
            <p className="text-xl font-semibold text-amber-700">🎉 New Client Special</p>
            <p className="mt-3 text-2xl font-bold text-orange-600">{props.offerText}</p>
            {props.originalPrice && props.salePrice && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <span className="text-lg line-through text-gray-400">{props.originalPrice}</span>
                <span className="text-2xl font-bold text-orange-600">{props.salePrice}</span>
              </div>
            )}
            <a
              href={props.ctaUrl || "#"}
              onClick={props.onCtaClick}
              className="mt-6 inline-block rounded-lg bg-orange-500 px-8 py-3 text-lg font-semibold text-white hover:bg-orange-600 transition-colors"
            >
              {props.ctaText}
            </a>
          </div>
        </section>
      )}
      {props.features.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 py-8">
          <ul className="space-y-3">
            {props.features.map((f, i) => (
              <li key={i} className="flex items-start gap-3 rounded-lg bg-white p-4 shadow">
                {f.icon && <span className="text-2xl">{f.icon}</span>}
                <div>
                  <p className="font-semibold text-gray-800">{f.title}</p>
                  {f.description && <p className="mt-1 text-sm text-gray-500">{f.description}</p>}
                </div>
              </li>
            ))}
          </ul>
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