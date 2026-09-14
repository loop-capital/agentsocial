"use client";

import React from "react";
import type {
  TemplateColors,
  TemplateFonts,
  ServiceItem,
  BusinessHours,
} from "../types";

export interface LinkInBioConfig {
  brandName: string;
  title?: string;
  bio?: string;
  avatarUrl?: string;
  colors?: Partial<TemplateColors>;
  fonts?: Partial<TemplateFonts>;
  instagramFollowers?: string;
  reviewCount?: string;
  yearsExperience?: string;
  services?: ServiceItem[];
  actionButtons?: Array<{
    label: string;
    href: string;
    variant?: "primary" | "secondary" | "outline";
    icon?: string;
  }>;
  instagramFeedImages?: string[];
  contactPhone?: string;
  contactEmail?: string;
  hours?: BusinessHours[];
  customCss?: string;
}

interface LinkInBioTemplateProps {
  config: LinkInBioConfig;
}

const defaultColors: TemplateColors = {
  primary: "#2A9D8F",
  secondary: "#E76F51",
  background: "#FAFAFA",
  text: "#1A1A1A",
  accent: "#264653",
};

const defaultFonts: TemplateFonts = {
  heading: "'Playfair Display', Georgia, serif",
  body: "'Inter', system-ui, -apple-system, sans-serif",
};

export default function LinkInBioTemplate({ config }: LinkInBioTemplateProps) {
  const {
    brandName = "Alex Morgan",
    title = "Licensed Esthetician | NYC",
    bio = "Transforming skin, one glow at a time. Book your facial, peel, or consultation. ✨",
    avatarUrl = "https://picsum.photos/300/300?random=20",
    colors: c = {},
    fonts: f = {},
    instagramFollowers = "12.4K",
    reviewCount = "287",
    yearsExperience = "8",
    services = [
      { name: "Signature Facial", price: "$120", description: "60 min deep cleanse + hydration" },
      { name: "Chemical Peel", price: "$150", description: "Custom peel for your skin type" },
      { name: "LED Light Therapy", price: "$95", description: "30 min rejuvenation treatment" },
      { name: "Microdermabrasion", price: "$175", description: "Exfoliation + collagen boost" },
    ],
    actionButtons = [
      { label: "Book Appointment", href: "#book", variant: "primary", icon: "📅" },
      { label: "View Services & Pricing", href: "#services", variant: "secondary", icon: "✨" },
      { label: "Before & After Gallery", href: "#gallery", variant: "outline", icon: "📸" },
      { label: "Read Reviews", href: "#reviews", variant: "outline", icon: "⭐" },
      { label: "Follow on Instagram", href: "https://instagram.com", variant: "outline", icon: "📷" },
      { label: "Contact Me", href: "#contact", variant: "outline", icon: "💬" },
    ],
    instagramFeedImages = [
      "https://picsum.photos/300/300?random=31",
      "https://picsum.photos/300/300?random=32",
      "https://picsum.photos/300/300?random=33",
      "https://picsum.photos/300/300?random=34",
      "https://picsum.photos/300/300?random=35",
      "https://picsum.photos/300/300?random=36",
    ],
    contactPhone = "(555) 234-5678",
    contactEmail = "alex@skincare.nyc",
    hours = [
      { day: "Mon - Fri", hours: "9:00 AM - 6:00 PM" },
      { day: "Saturday", hours: "10:00 AM - 4:00 PM" },
      { day: "Sunday", hours: "Closed" },
    ],
    customCss,
  } = config;

  const colors = { ...defaultColors, ...c };
  const fonts = { ...defaultFonts, ...f };

  const getButtonStyles = (variant?: string) => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: colors.secondary,
          color: "#FFFFFF",
          border: "none",
        };
      case "secondary":
        return {
          backgroundColor: colors.primary,
          color: "#FFFFFF",
          border: "none",
        };
      default:
        return {
          backgroundColor: "transparent",
          color: colors.text,
          border: `2px solid ${colors.text}15`,
        };
    }
  };

  return (
    <div
      className="min-h-screen antialiased"
      style={{ fontFamily: fonts.body, color: colors.text, backgroundColor: colors.background }}
    >
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}

      <div className="max-w-md mx-auto px-5 py-10">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-5">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={brandName}
                className="w-28 h-28 rounded-full mx-auto object-cover shadow-lg border-4 border-white"
              />
            ) : (
              <div
                className="w-28 h-28 rounded-full mx-auto flex items-center justify-center text-4xl font-bold text-white shadow-lg border-4 border-white"
                style={{ backgroundColor: colors.secondary }}
              >
                {brandName.charAt(0)}
              </div>
            )}
            {/* Verified badge */}
            <div
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs border-2 border-white"
              style={{ backgroundColor: colors.primary }}
            >
              ✓
            </div>
          </div>

          <h1
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: fonts.heading }}
          >
            {brandName}
          </h1>
          <p className="text-sm mb-3" style={{ color: colors.primary }}>
            {title}
          </p>
          <p className="text-sm opacity-60 leading-relaxed max-w-xs mx-auto">
            {bio}
          </p>
        </div>

        {/* Social Proof Row */}
        <div
          className="flex justify-center gap-6 mb-8 py-4 px-4 rounded-2xl"
          style={{ backgroundColor: colors.primary + "08" }}
        >
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: colors.primary }}>
              {instagramFollowers}
            </p>
            <p className="text-xs opacity-50">Followers</p>
          </div>
          <div
            className="w-px"
            style={{ backgroundColor: colors.text + "15" }}
          />
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: colors.primary }}>
              {reviewCount}
            </p>
            <p className="text-xs opacity-50">Reviews</p>
          </div>
          <div
            className="w-px"
            style={{ backgroundColor: colors.text + "15" }}
          />
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: colors.primary }}>
              {yearsExperience}
            </p>
            <p className="text-xs opacity-50">Years</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-10">
          {actionButtons.map((btn, idx) => {
            const styles = getButtonStyles(btn.variant);
            return (
              <a
                key={idx}
                href={btn.href}
                target={btn.href.startsWith("http") ? "_blank" : undefined}
                rel={btn.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="block w-full py-3.5 px-6 rounded-full text-center font-semibold text-sm transition-all hover:shadow-md active:scale-[0.98]"
                style={styles}
              >
                {btn.icon && <span className="mr-2">{btn.icon}</span>}
                {btn.label}
              </a>
            );
          })}
        </div>

        {/* Services Mini-List */}
        <div id="services" className="mb-10">
          <h2
            className="text-lg font-semibold mb-4 text-center"
            style={{ fontFamily: fonts.heading }}
          >
            Services & Pricing
          </h2>
          <div className="space-y-3">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-3 px-4 rounded-xl border"
                style={{ borderColor: colors.text + "08", backgroundColor: colors.background }}
              >
                <div>
                  <p className="font-medium text-sm">{service.name}</p>
                  <p className="text-xs opacity-50">{service.description}</p>
                </div>
                <p
                  className="font-bold text-sm"
                  style={{ color: colors.secondary }}
                >
                  {service.price}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Instagram Feed Placeholder */}
        <div id="gallery" className="mb-10">
          <h2
            className="text-lg font-semibold mb-4 text-center"
            style={{ fontFamily: fonts.heading }}
          >
            Latest Work
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {instagramFeedImages.map((src, idx) => (
              <div key={idx} className="aspect-square rounded-xl overflow-hidden">
                <img
                  src={src}
                  alt={`Gallery ${idx + 1}`}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer: Contact & Hours */}
        <div id="contact" className="text-center mb-6">
          <div className="space-y-2 text-sm opacity-60 mb-6">
            {contactPhone && (
              <a href={`tel:${contactPhone}`} className="block hover:opacity-80 transition-opacity">
                📞 {contactPhone}
              </a>
            )}
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} className="block hover:opacity-80 transition-opacity">
                ✉️ {contactEmail}
              </a>
            )}
          </div>

          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-40 mb-3">
              Hours
            </p>
            <div className="space-y-1 text-xs opacity-50">
              {hours.map((h, idx) => (
                <div key={idx} className="flex justify-between max-w-[200px] mx-auto">
                  <span>{h.day}</span>
                  <span>{h.hours}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Brand */}
        <div className="text-center pt-6 border-t" style={{ borderColor: colors.text + "08" }}>
          <p className="text-xs opacity-30">
            Book via {brandName}
          </p>
        </div>
      </div>
    </div>
  );
}
