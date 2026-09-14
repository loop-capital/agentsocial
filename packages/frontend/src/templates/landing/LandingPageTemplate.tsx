"use client";

import React from "react";
import type {
  TemplateColors,
  TemplateFonts,
  ServiceItem,
  TeamMember,
  Testimonial,
  SocialLink,
  BusinessHours,
} from "../types";

export interface LandingPageConfig {
  brandName: string;
  tagline?: string;
  colors?: Partial<TemplateColors>;
  fonts?: Partial<TemplateFonts>;
  logoUrl?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  services?: ServiceItem[];
  aboutOwnerPhotoUrl?: string;
  aboutTitle?: string;
  aboutStory?: string;
  missionStatement?: string;
  team?: TeamMember[];
  testimonials?: Testimonial[];
  bookingCtaTitle?: string;
  bookingCtaSubtitle?: string;
  bookingCtaButtonText?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  hours?: BusinessHours[];
  socialLinks?: SocialLink[];
  footerText?: string;
  customCss?: string;
}

interface LandingPageTemplateProps {
  config: LandingPageConfig;
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

function StarRating({ rating }: { rating?: number }) {
  if (!rating) return null;
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${
            i < rating ? "text-[#E9C46A]" : "text-gray-300"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function LandingPageTemplate({ config }: LandingPageTemplateProps) {
  const {
    brandName = "Serenity Spa & Salon",
    tagline = "",
    colors: c = {},
    fonts: f = {},
    logoUrl,
    heroTitle = "Experience Beauty, Elevated",
    heroSubtitle = "Where luxury meets expertise. Book your transformation today.",
    heroImageUrl = "https://picsum.photos/1600/900?random=1",
    ctaText = "Book Now",
    ctaUrl = "#booking",
    services = [
      {
        name: "Hair Design",
        description: "Cuts, color, balayage, and treatments tailored to your style.",
        icon: "💇‍♀️",
      },
      {
        name: "Nail Artistry",
        description: "Manicures, pedicures, gel, and custom nail art.",
        icon: "💅",
      },
      {
        name: "Skin Care",
        description: "Facials, peels, and rejuvenating skin treatments.",
        icon: "✨",
      },
      {
        name: "Massage Therapy",
        description: "Swedish, deep tissue, and hot stone massages.",
        icon: "🧘‍♀️",
      },
    ],
    aboutOwnerPhotoUrl = "https://picsum.photos/400/500?random=2",
    aboutTitle = "Our Story",
    aboutStory = "Founded in 2015, we started with a simple belief: everyone deserves to feel confident and beautiful. What began as a single-chair studio has grown into a trusted destination for beauty and wellness.",
    missionStatement = "To provide exceptional beauty experiences that empower our clients to look and feel their absolute best, every single day.",
    team = [
      {
        name: "Aria Chen",
        title: "Lead Stylist",
        specialties: "Color, Balayage, Bridal",
        photoUrl: "https://picsum.photos/300/300?random=11",
      },
      {
        name: "Jordan Rivera",
        title: "Nail Artist",
        specialties: "Gel Art, Nail Extensions",
        photoUrl: "https://picsum.photos/300/300?random=12",
      },
      {
        name: "Samira Patel",
        title: "Esthetician",
        specialties: "Facials, Skin Treatments",
        photoUrl: "https://picsum.photos/300/300?random=13",
      },
      {
        name: "Taylor Brooks",
        title: "Massage Therapist",
        specialties: "Deep Tissue, Hot Stone",
        photoUrl: "https://picsum.photos/300/300?random=14",
      },
    ],
    testimonials = [
      {
        quote: "Best salon experience I've ever had. Aria completely transformed my hair!",
        authorName: "Michelle D.",
        rating: 5,
      },
      {
        quote: "The atmosphere is so calming and the team is incredibly talented.",
        authorName: "Jessica K.",
        rating: 5,
      },
      {
        quote: "I always leave feeling like a million bucks. Highly recommend!",
        authorName: "Ashley R.",
        rating: 5,
      },
    ],
    bookingCtaTitle = "Ready to Transform?",
    bookingCtaSubtitle = "Book your appointment today and experience the difference.",
    bookingCtaButtonText = "Book Your Appointment",
    contactPhone = "(555) 123-4567",
    contactEmail = "hello@serenityspa.com",
    contactAddress = "123 Beauty Lane, Suite 100, New York, NY 10001",
    hours = [
      { day: "Mon - Fri", hours: "9:00 AM - 7:00 PM" },
      { day: "Saturday", hours: "10:00 AM - 6:00 PM" },
      { day: "Sunday", hours: "11:00 AM - 4:00 PM" },
    ],
    socialLinks = [
      { platform: "Instagram", url: "#" },
      { platform: "Facebook", url: "#" },
      { platform: "TikTok", url: "#" },
    ],
    footerText = "© 2026 Serenity Spa & Salon. All rights reserved.",
    customCss,
  } = config;

  const colors = { ...defaultColors, ...c };
  const fonts = { ...defaultFonts, ...f };

  const menuItems = [
    { label: "Services", href: "#services" },
    { label: "Our Story", href: "#about" },
    { label: "Team", href: "#team" },
    { label: "Reviews", href: "#testimonials" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <div
      className="min-h-screen antialiased"
      style={{ fontFamily: fonts.body, color: colors.text, backgroundColor: colors.background }}
    >
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}

      {/* Navigation */}
      <nav
        className="sticky top-0 z-50 w-full px-6 py-4 backdrop-blur-md bg-white/90 border-b"
        style={{ borderColor: colors.text + "0D" }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
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
            <span
              className="text-xl font-bold tracking-tight"
              style={{ fontFamily: fonts.heading }}
            >
              {brandName}
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium hover:opacity-70 transition-opacity"
              >
                {item.label}
              </a>
            ))}
            <a
              href={ctaUrl}
              className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90 hover:shadow-lg"
              style={{ backgroundColor: colors.secondary }}
            >
              {ctaText}
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative w-full min-h-[600px] md:min-h-[700px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImageUrl}
            alt="Hero"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: colors.accent + "66" }}
          />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white">
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            style={{ fontFamily: fonts.heading, textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}
          >
            {heroTitle}
          </h1>
          <p className="text-lg md:text-xl mb-10 opacity-90 max-w-2xl mx-auto leading-relaxed">
            {heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={ctaUrl}
              className="inline-block px-8 py-4 rounded-xl text-white font-semibold text-lg transition-all hover:opacity-90 hover:shadow-xl hover:-translate-y-0.5"
              style={{ backgroundColor: colors.secondary }}
            >
              {ctaText}
            </a>
            <a
              href="#services"
              className="inline-block px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:bg-white/20 border-2 border-white/50"
            >
              Explore Services
            </a>
          </div>
        </div>

        {/* Floating Booking Trigger */}
        <div className="absolute bottom-6 right-6 z-20 hidden md:block">
          <button
            className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all hover:scale-110"
            style={{ backgroundColor: colors.secondary }}
            title="Quick Book"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="px-6 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: fonts.heading, color: colors.text }}
            >
              Our Services
            </h2>
            <p className="text-lg opacity-60 max-w-xl mx-auto">
              Expert care for your hair, skin, and nails
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="group rounded-2xl p-6 border transition-all hover:shadow-xl hover:-translate-y-1"
                style={{ borderColor: colors.text + "10", backgroundColor: colors.background }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-5 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: colors.primary + "15" }}
                >
                  {service.icon}
                </div>
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ fontFamily: fonts.heading }}
                >
                  {service.name}
                </h3>
                <p className="text-sm opacity-60 mb-4 leading-relaxed">
                  {service.description}
                </p>
                <a
                  href="#booking"
                  className="text-sm font-semibold inline-flex items-center gap-1 transition-opacity hover:opacity-70"
                  style={{ color: colors.primary }}
                >
                  Learn More
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About / Story Section */}
      <section id="about" className="px-6 py-20 md:py-28" style={{ backgroundColor: colors.primary + "08" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img
                src={aboutOwnerPhotoUrl}
                alt={aboutTitle}
                className="w-full rounded-2xl shadow-xl object-cover aspect-[4/5]"
              />
              <div
                className="absolute -bottom-4 -right-4 w-24 h-24 rounded-2xl hidden md:block"
                style={{ backgroundColor: colors.secondary }}
              />
            </div>
            <div>
              <h2
                className="text-3xl md:text-4xl font-bold mb-6"
                style={{ fontFamily: fonts.heading }}
              >
                {aboutTitle}
              </h2>
              <p className="text-lg opacity-70 mb-6 leading-relaxed">
                {aboutStory}
              </p>
              <div
                className="rounded-xl p-6 border-l-4"
                style={{
                  backgroundColor: colors.background,
                  borderColor: colors.secondary,
                }}
              >
                <p className="italic opacity-80" style={{ fontFamily: fonts.heading }}>
                  "{missionStatement}"
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="px-6 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: fonts.heading }}
            >
              Meet Our Team
            </h2>
            <p className="text-lg opacity-60 max-w-xl mx-auto">
              Passionate professionals dedicated to your beauty
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, idx) => (
              <div
                key={idx}
                className="group rounded-2xl overflow-hidden border transition-all hover:shadow-xl"
                style={{ borderColor: colors.text + "10" }}
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4"
                    style={{ backgroundColor: colors.accent + "44" }}
                  >
                    <button
                      className="w-full py-2.5 rounded-lg text-white text-sm font-semibold"
                      style={{ backgroundColor: colors.secondary }}
                    >
                      Book with {member.name.split(" ")[0]}
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  <h3
                    className="font-semibold text-lg mb-0.5"
                    style={{ fontFamily: fonts.heading }}
                  >
                    {member.name}
                  </h3>
                  <p className="text-sm mb-2" style={{ color: colors.primary }}>
                    {member.title}
                  </p>
                  {member.specialties && (
                    <p className="text-xs opacity-50">{member.specialties}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="px-6 py-20 md:py-28" style={{ backgroundColor: colors.secondary + "08" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: fonts.heading }}
            >
              Client Love
            </h2>
            <p className="text-lg opacity-60 max-w-xl mx-auto">
              Hear what our clients have to say
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="rounded-2xl p-6 md:p-8 border transition-all hover:shadow-lg"
                style={{
                  borderColor: colors.text + "10",
                  backgroundColor: colors.background,
                }}
              >
                <StarRating rating={t.rating} />
                <p className="mt-4 mb-6 opacity-70 leading-relaxed italic">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: colors.primary }}
                  >
                    {t.authorName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.authorName}</p>
                    {t.service && (
                      <p className="text-xs opacity-50">{t.service}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking CTA Section */}
      <section id="booking" className="px-6 py-20 md:py-28">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="text-3xl md:text-5xl font-bold mb-6"
            style={{ fontFamily: fonts.heading }}
          >
            {bookingCtaTitle}
          </h2>
          <p className="text-lg opacity-60 mb-10 max-w-xl mx-auto">
            {bookingCtaSubtitle}
          </p>
          <a
            href={ctaUrl}
            className="inline-block px-10 py-4 rounded-xl text-white font-semibold text-lg transition-all hover:opacity-90 hover:shadow-xl hover:-translate-y-0.5"
            style={{ backgroundColor: colors.secondary }}
          >
            {bookingCtaButtonText}
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer
        id="contact"
        className="px-6 py-16 border-t"
        style={{ borderColor: colors.text + "10", backgroundColor: colors.accent + "04" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            {/* Contact Info */}
            <div>
              <div className="flex items-center gap-3 mb-6">
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
                <span
                  className="text-lg font-bold"
                  style={{ fontFamily: fonts.heading }}
                >
                  {brandName}
                </span>
              </div>
              <div className="space-y-3 text-sm opacity-70">
                {contactAddress && <p>{contactAddress}</p>}
                {contactPhone && <p>{contactPhone}</p>}
                {contactEmail && <p>{contactEmail}</p>}
              </div>
            </div>

            {/* Hours */}
            <div>
              <h3
                className="font-semibold mb-4"
                style={{ fontFamily: fonts.heading }}
              >
                Hours
              </h3>
              <div className="space-y-2 text-sm opacity-70">
                {hours.map((h, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{h.day}</span>
                    <span>{h.hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Social & Map */}
            <div>
              <h3
                className="font-semibold mb-4"
                style={{ fontFamily: fonts.heading }}
              >
                Follow Us
              </h3>
              <div className="flex gap-3 mb-6">
                {socialLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-semibold transition-all hover:opacity-80"
                    style={{ backgroundColor: colors.primary }}
                  >
                    {link.platform.charAt(0)}
                  </a>
                ))}
              </div>
              {/* Map placeholder */}
              <div
                className="w-full h-32 rounded-xl flex items-center justify-center text-sm opacity-40 border border-dashed"
                style={{ borderColor: colors.text + "20" }}
              >
                Map Embed
              </div>
            </div>
          </div>

          <div
            className="pt-8 border-t text-center text-sm opacity-40"
            style={{ borderColor: colors.text + "10" }}
          >
            {footerText}
          </div>
        </div>
      </footer>
    </div>
  );
}
