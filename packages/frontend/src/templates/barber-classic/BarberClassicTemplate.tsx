"use client";

import React from "react";
import type {
  ServiceItem,
  TeamMember,
  Testimonial,
  SocialLink,
  BusinessHours,
} from "../types";

export interface BarberClassicConfig {
  brandName: string;
  tagline?: string;
  logoUrl?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  services?: ServiceItem[];
  craftTitle?: string;
  craftStory?: string;
  craftImageUrl?: string;
  team?: TeamMember[];
  pricingItems?: { name: string; price: string; description?: string }[];
  testimonials?: Testimonial[];
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  hours?: BusinessHours[];
  socialLinks?: SocialLink[];
  footerText?: string;
  walkInsWelcome?: boolean;
  customCss?: string;
}

interface BarberClassicTemplateProps {
  config: BarberClassicConfig;
}

/* ─── Color Palette ─── */
const COLORS = {
  charcoal: "#1A1A1A",
  darkWood: "#3D2914",
  gold: "#C9A84C",
  cream: "#F5F0E8",
  red: "#8B0000",
  white: "#FFFFFF",
  muted: "#A0A0A0",
  chalk: "#E8E4DC",
};

/* ─── Service Icons (SVG) ─── */
function HaircutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
      <path d="M6 4l3 16M18 4l-3 16M8 4h8M7 20h10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function BeardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
      <path d="M4 10c0 4.418 3.582 9 8 9s8-4.582 8-9" strokeLinecap="round"/>
      <path d="M8 10v2c0 2.21 1.79 4 4 4s4-1.79 4-4v-2" strokeLinecap="round"/>
      <path d="M8 6h8" strokeLinecap="round"/>
    </svg>
  );
}
function TowelIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
      <rect x="6" y="3" width="12" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 8h12M6 13h12M6 18h12" strokeLinecap="round"/>
    </svg>
  );
}
function ColorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="6" cy="12" r="1" fill="currentColor"/>
      <circle cx="10" cy="8" r="1" fill="currentColor"/>
      <circle cx="14" cy="14" r="1" fill="currentColor"/>
      <circle cx="18" cy="10" r="1" fill="currentColor"/>
    </svg>
  );
}

/* ─── Barber Pole SVG ─── */
function BarberPole({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 200" className={className} fill="none">
      <rect x="20" y="10" width="20" height="180" rx="10" fill={COLORS.white} stroke={COLORS.muted} strokeWidth="1"/>
      <path d="M20 30c10 0 10 10 20 10s10-10 20-10" stroke={COLORS.red} strokeWidth="6" fill="none"/>
      <path d="M20 60c10 0 10 10 20 10s10-10 20-10" stroke={COLORS.charcoal} strokeWidth="6" fill="none"/>
      <path d="M20 90c10 0 10 10 20 10s10-10 20-10" stroke={COLORS.red} strokeWidth="6" fill="none"/>
      <path d="M20 120c10 0 10 10 20 10s10-10 20-10" stroke={COLORS.charcoal} strokeWidth="6" fill="none"/>
      <path d="M20 150c10 0 10 10 20 10s10-10 20-10" stroke={COLORS.red} strokeWidth="6" fill="none"/>
      <rect x="18" y="5" width="24" height="8" rx="2" fill={COLORS.gold}/>
      <rect x="18" y="187" width="24" height="8" rx="2" fill={COLORS.gold}/>
    </svg>
  );
}

/* ─── Default Data ─── */
const defaultServices: ServiceItem[] = [
  { name: "Haircut", description: "Classic cuts to modern fades. Tailored to your face shape and style.", price: "$35", icon: "haircut" },
  { name: "Beard Trim", description: "Precision shaping and sculpting. Keep your beard sharp and defined.", price: "$25", icon: "beard" },
  { name: "Hot Towel Shave", description: "The ultimate straight-razor experience. Relax, unwind, emerge refined.", price: "$40", icon: "towel" },
  { name: "Grey Blending", description: "Subtle color restoration. Look distinguished, not dyed.", price: "$45", icon: "color" },
];

const defaultTeam: TeamMember[] = [
  { name: "Marcus Cole", title: "Master Barber", specialties: "Master of Fades, Classic Cuts", photoUrl: "https://images.unsplash.com/photo-1503951914875-bef6dd2f97a3?w=400&h=400&fit=crop&crop=face", bio: "15 years of craft. Marcus believes every cut tells a story." },
  { name: "Derek Vance", title: "Beard Sculptor", specialties: "Beard Sculpting, Straight Razor", photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face", bio: "The beard is a canvas. Derek is the artist." },
  { name: "James 'Smokey' Reed", title: "Senior Barber", specialties: "Hot Towel Shaves, Grey Blending", photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face", bio: "Old-school technique with modern sensibility." },
];

const defaultPricing = [
  { name: "The Classic Cut", price: "$35", description: "Scissor or clipper cut, styled finish" },
  { name: "Fade / Taper", price: "$40", description: "Precision fade with lineup" },
  { name: "Beard Trim & Shape", price: "$25", description: "Sculpted to complement your jawline" },
  { name: "Hot Towel Straight Razor Shave", price: "$40", description: "Full face, hot towels, aftershave balm" },
  { name: "Haircut & Beard Combo", price: "$55", description: "The complete grooming package" },
  { name: "Grey Blending Treatment", price: "$45", description: "Subtle, natural-looking color restoration" },
  { name: "Buzz Cut", price: "$25", description: "One length all over, neck cleanup" },
  { name: "Kids Cut (12 & under)", price: "$25", description: "Patient, skilled cuts for young gents" },
];

const defaultTestimonials: Testimonial[] = [
  { quote: "Best fade I've ever had. Marcus knows exactly how to shape it to my head. Walk out feeling like a new man every time.", authorName: "Tyler R.", rating: 5, service: "Fade" },
  { quote: "The hot towel shave is a religious experience. Derek's attention to detail is unreal. This is what grooming should be.", authorName: "David M.", rating: 5, service: "Straight Razor Shave" },
  { quote: "Finally found a place that treats the beard with respect. The atmosphere, the craft, the conversation — it's all top tier.", authorName: "Andre K.", rating: 5, service: "Beard Trim" },
];

const defaultHours: BusinessHours[] = [
  { day: "Monday - Friday", hours: "9:00 AM - 8:00 PM" },
  { day: "Saturday", hours: "8:00 AM - 6:00 PM" },
  { day: "Sunday", hours: "10:00 AM - 4:00 PM" },
];

const defaultSocialLinks: SocialLink[] = [
  { platform: "Instagram", url: "#" },
  { platform: "Facebook", url: "#" },
  { platform: "Yelp", url: "#" },
];

/* ─── Component ─── */
export default function BarberClassicTemplate({ config }: BarberClassicTemplateProps) {
  const {
    brandName = "The Gentlemen's Chair",
    tagline = "Est. 1987",
    logoUrl,
    heroTitle = "THE ART OF GROOMING",
    heroSubtitle = "Where tradition meets precision. Every cut is craftsmanship.",
    heroImageUrl = "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1600&h=900&fit=crop",
    ctaText = "Book a Cut",
    ctaUrl = "#booking",
    services = defaultServices,
    craftTitle = "THE CRAFT",
    craftStory = "Since 1987, we've upheld the barber's oath: every man who sits in our chair leaves sharper than he arrived. We don't just cut hair — we study the architecture of the face, the grain of the beard, the way light hits a fade. Our tools are vintage. Our technique is timeless. Our standards are uncompromising.",
    craftImageUrl = "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&h=600&fit=crop",
    team = defaultTeam,
    pricingItems = defaultPricing,
    testimonials = defaultTestimonials,
    contactPhone = "(555) 287-1955",
    contactEmail = "hello@gentlemenschair.com",
    contactAddress = "442 Mulberry Street, Downtown",
    hours = defaultHours,
    socialLinks = defaultSocialLinks,
    footerText = "© 2026 The Gentlemen's Chair. All rights reserved.",
    walkInsWelcome = true,
    customCss,
  } = config;

  const navItems = [
    { label: "Services", href: "#services" },
    { label: "Barbers", href: "#barbers" },
    { label: "Pricing", href: "#pricing" },
    { label: "Contact", href: "#contact" },
  ];

  const serviceIcons: Record<string, React.ReactNode> = {
    haircut: <HaircutIcon />,
    beard: <BeardIcon />,
    towel: <TowelIcon />,
    color: <ColorIcon />,
  };

  return (
    <div className="min-h-screen antialiased bg-[#1A1A1A] text-white" style={customCss ? undefined : undefined}>
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}

      {/* ─── Navigation ─── */}
      <nav className="sticky top-0 z-50 w-full bg-[#1A1A1A]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={brandName} className="h-10 w-auto" />
            ) : (
              <div className="h-10 w-10 rounded-sm bg-[#C9A84C] flex items-center justify-center text-[#1A1A1A] font-bold text-lg font-serif">
                G
              </div>
            )}
            <div className="leading-none">
              <span className="block text-lg font-bold tracking-wide uppercase" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}>
                {brandName}
              </span>
              {tagline && <span className="block text-[10px] text-[#A0A0A0] tracking-[0.2em] uppercase">{tagline}</span>}
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className="text-sm font-medium text-[#F5F0E8] hover:text-[#C9A84C] transition-colors tracking-wide uppercase">
                {item.label}
              </a>
            ))}
            <a
              href={ctaUrl}
              className="px-6 py-2.5 bg-[#C9A84C] text-[#1A1A1A] text-sm font-bold tracking-wide uppercase hover:bg-[#F5F0E8] transition-colors"
            >
              Book Now
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-[#F5F0E8]" aria-label="Menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative w-full min-h-[600px] md:min-h-[750px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImageUrl} alt="Barbershop" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A1A]/60 via-[#1A1A1A]/40 to-[#1A1A1A]" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="h-px w-12 bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs tracking-[0.3em] uppercase">Traditional Barbering</span>
            <div className="h-px w-12 bg-[#C9A84C]" />
          </div>
          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-none tracking-tight"
            style={{ fontFamily: "'Bebas Neue', 'Oswald', Impact, sans-serif", letterSpacing: "0.02em" }}
          >
            {heroTitle}
          </h1>
          <p className="text-base md:text-lg text-[#A0A0A0] mb-10 max-w-xl mx-auto leading-relaxed font-light">
            {heroSubtitle}
          </p>
          <a
            href={ctaUrl}
            className="inline-block px-10 py-4 bg-[#C9A84C] text-[#1A1A1A] text-sm font-bold tracking-[0.15em] uppercase hover:bg-[#F5F0E8] transition-all hover:shadow-xl hover:shadow-[#C9A84C]/20"
          >
            {ctaText}
          </a>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-[10px] text-[#A0A0A0] tracking-[0.2em] uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-[#C9A84C] to-transparent" />
        </div>
      </section>

      {/* ─── Services ─── */}
      <section id="services" className="px-6 py-20 md:py-28 bg-[#1A1A1A]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#C9A84C] text-xs tracking-[0.3em] uppercase block mb-3">What We Do</span>
            <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tight" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}>
              Our Services
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="group border border-white/10 p-8 hover:border-[#C9A84C]/50 transition-all hover:-translate-y-1 bg-[#1A1A1A]"
              >
                <div className="text-[#C9A84C] mb-5">
                  {serviceIcons[service.icon || ""] || <HaircutIcon />}
                </div>
                <h3 className="text-lg font-bold uppercase tracking-wide mb-2" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}>
                  {service.name}
                </h3>
                <p className="text-sm text-[#A0A0A0] mb-4 leading-relaxed">{service.description}</p>
                {service.price && (
                  <span className="text-[#C9A84C] font-bold text-sm tracking-wide">{service.price}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── The Craft ─── */}
      <section className="px-6 py-20 md:py-28 bg-[#3D2914]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <span className="text-[#C9A84C] text-xs tracking-[0.3em] uppercase block mb-3">Since 1987</span>
              <h2
                className="text-4xl md:text-5xl font-bold uppercase tracking-tight mb-6"
                style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}
              >
                {craftTitle}
              </h2>
              <p className="text-[#F5F0E8]/80 leading-relaxed mb-6 text-base">
                {craftStory}
              </p>
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-[#C9A84C]/30" />
                <span className="text-[#C9A84C] text-xs tracking-[0.2em] uppercase">Precision. Tradition. Respect.</span>
                <div className="h-px flex-1 bg-[#C9A84C]/30" />
              </div>
            </div>
            <div className="order-1 md:order-2 relative">
              <img src={craftImageUrl} alt="The Craft" className="w-full aspect-[4/3] object-cover border border-[#C9A84C]/20" />
              <div className="absolute -bottom-4 -right-4 w-full h-full border border-[#C9A84C]/30 -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Barbers ─── */}
      <section id="barbers" className="px-6 py-20 md:py-28 bg-[#1A1A1A]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#C9A84C] text-xs tracking-[0.3em] uppercase block mb-3">The Team</span>
            <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tight" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}>
              Meet Your Barbers
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((member, idx) => (
              <div key={idx} className="group text-center">
                <div className="relative mb-5 overflow-hidden border border-white/10">
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    className="w-full aspect-square object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent opacity-60" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-wide mb-1" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}>
                  {member.name}
                </h3>
                <p className="text-[#C9A84C] text-sm font-medium mb-1">{member.title}</p>
                {member.specialties && (
                  <p className="text-[#A0A0A0] text-xs tracking-wide uppercase mb-3">{member.specialties}</p>
                )}
                <a
                  href={`#booking?barber=${encodeURIComponent(member.name)}`}
                  className="inline-block px-5 py-2 border border-[#C9A84C] text-[#C9A84C] text-xs font-bold tracking-[0.15em] uppercase hover:bg-[#C9A84C] hover:text-[#1A1A1A] transition-all"
                >
                  Book with {member.name.split(" ")[0]}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing Board ─── */}
      <section id="pricing" className="px-6 py-20 md:py-28 bg-[#0D0D0D]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#C9A84C] text-xs tracking-[0.3em] uppercase block mb-3">Straightforward</span>
            <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tight" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}>
              The Board
            </h2>
          </div>

          <div className="border-4 border-[#3D2914] p-1 bg-[#0D0D0D]">
            <div className="border border-[#C9A84C]/20 p-6 md:p-10">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold uppercase tracking-[0.2em] text-[#E8E4DC]" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}>
                  {brandName}
                </h3>
                <p className="text-[#A0A0A0] text-xs tracking-widest uppercase mt-1">Price List</p>
              </div>

              <div className="space-y-0">
                {pricingItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-baseline justify-between py-4 border-b border-dashed border-[#F5F0E8]/10 last:border-b-0"
                  >
                    <div className="flex-1">
                      <span className="text-[#E8E4DC] font-medium text-sm uppercase tracking-wide">{item.name}</span>
                      {item.description && (
                        <span className="block text-[#A0A0A0] text-xs mt-0.5">{item.description}</span>
                      )}
                    </div>
                    <div className="ml-4 flex items-baseline gap-1">
                      <span className="text-[#C9A84C] font-bold text-lg">{item.price}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-[#C9A84C]/20 text-center">
                <p className="text-[#A0A0A0] text-xs tracking-widest uppercase">Cash & Card Accepted • Walk-ins Welcome</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="px-6 py-20 md:py-28 bg-[#1A1A1A]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#C9A84C] text-xs tracking-[0.3em] uppercase block mb-3">Word on the Street</span>
            <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tight" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}>
              Client Reviews
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div key={idx} className="border border-white/10 p-8 bg-[#1A1A1A] hover:border-[#C9A84C]/30 transition-all">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className={`w-4 h-4 ${i < (t.rating || 5) ? "text-[#C9A84C]" : "text-[#3D2914]"}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-[#F5F0E8]/80 text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#3D2914] flex items-center justify-center text-[#C9A84C] text-xs font-bold">
                    {t.authorName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#F5F0E8]">{t.authorName}</p>
                    {t.service && <p className="text-xs text-[#A0A0A0]">{t.service}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Visit Us ─── */}
      <section id="contact" className="px-6 py-20 md:py-28 bg-[#3D2914]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-[#C9A84C] text-xs tracking-[0.3em] uppercase block mb-3">Find Us</span>
              <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tight mb-8" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}>
                Visit Us
              </h2>

              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 border border-[#C9A84C]/30 flex items-center justify-center text-[#C9A84C] shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-[#A0A0A0] uppercase tracking-wider mb-1">Address</p>
                    <p className="text-[#F5F0E8] text-sm">{contactAddress}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 border border-[#C9A84C]/30 flex items-center justify-center text-[#C9A84C] shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-[#A0A0A0] uppercase tracking-wider mb-1">Phone</p>
                    <p className="text-[#F5F0E8] text-sm">{contactPhone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 border border-[#C9A84C]/30 flex items-center justify-center text-[#C9A84C] shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-[#A0A0A0] uppercase tracking-wider mb-1">Email</p>
                    <p className="text-[#F5F0E8] text-sm">{contactEmail}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#C9A84C]/20 pt-6">
                <p className="text-xs text-[#A0A0A0] uppercase tracking-wider mb-3">Hours</p>
                <div className="space-y-2">
                  {hours.map((h, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-[#A0A0A0]">{h.day}</span>
                      <span className="text-[#F5F0E8]">{h.hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <BarberPole className="w-16 h-48 md:w-20 md:h-56" />
              {walkInsWelcome && (
                <div className="mt-6 px-6 py-3 border-2 border-[#8B0000] text-[#8B0000] text-xs font-bold tracking-[0.2em] uppercase">
                  Walk-ins Welcome
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="px-6 py-12 bg-[#0D0D0D] border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt={brandName} className="h-8 w-auto" />
              ) : (
                <div className="h-8 w-8 rounded-sm bg-[#C9A84C] flex items-center justify-center text-[#1A1A1A] font-bold text-sm">G</div>
              )}
              <span className="text-sm font-bold uppercase tracking-wide">{brandName}</span>
            </div>

            <div className="flex items-center gap-4">
              {socialLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 border border-white/10 flex items-center justify-center text-[#A0A0A0] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-all text-xs font-bold uppercase"
                >
                  {link.platform.charAt(0)}
                </a>
              ))}
            </div>

            <p className="text-xs text-[#A0A0A0]">{footerText}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
