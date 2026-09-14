"use client";

import type { LandingTemplateProps } from "./SalonPromoTemplate";

export function ServiceHighlightTemplate(props: LandingTemplateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
      <header className="py-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900">{props.headline}</h1>
        {props.subheadline && (
          <p className="mt-3 text-lg text-gray-600">{props.subheadline}</p>
        )}
      </header>
      {props.features.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 py-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {props.features.map((f, i) => (
              <div key={i} className="rounded-xl bg-white p-6 shadow-md">
                {f.icon && <span className="text-3xl">{f.icon}</span>}
                <h3 className="mt-2 text-xl font-semibold text-teal-700">{f.title}</h3>
                {f.description && <p className="mt-2 text-gray-600">{f.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="mx-auto max-w-2xl px-4 py-8 text-center">
        <a
          href={props.ctaUrl || "#"}
          onClick={props.onCtaClick}
          className="inline-block rounded-lg bg-teal-600 px-8 py-3 text-lg font-semibold text-white hover:bg-teal-700 transition-colors"
        >
          {props.ctaText}
        </a>
        {props.offerText && (
          <p className="mt-4 text-lg text-teal-700 font-medium">{props.offerText}</p>
        )}
      </section>
      <footer className="py-8 text-center text-sm text-gray-500">
        <p>{props.businessName}</p>
        {props.phone && <p>{props.phone}</p>}
        {props.address && <p>{props.address}</p>}
      </footer>
    </div>
  );
}