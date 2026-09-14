"use client";

import React, { useState, useRef, useEffect } from "react";
import type {
  ServiceItem,
  TeamMember,
  Testimonial,
  SocialLink,
  BusinessHours,
  GalleryItem,
  ProcessStep,
} from "../types";

export interface BarberUrbanConfig {
  brandName: string;
  tagline?: string;
  logoUrl?: string;
  heroTitle?: string;
  heroTagline?: string;
  heroImageUrl?: string;
  primaryCtaText?: string;
  primaryCtaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  services?: ServiceItem[];
  gallery?: GalleryItem[];
  processSteps?: ProcessStep[];
  team?: TeamMember[];
  products?: { name: string; price: string; imageUrl?: string; label?: string }[];
  instagramPhotos?: string[];
  bookingPhone?: string;
  bookingFormUrl?: string;
  testimonials?: Testimonial[];
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  hours?: BusinessHours[];
  socialLinks?: SocialLink[];
  footerText?: string;
  customCss?: string;
}

interface BarberUrbanTemplateProps {
  config: BarberUrbanConfig;
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
  darkGrey: "#2A2A2A",
};

/* ─── Service Icons ─── */
function HaircutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-7 h-7">
      <path d="M6 4l3 16M18 4l-3 16M8 4h8M7 20h10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function BeardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-7 h-7">
      <path d="M4 10c0 4.418 3.582 9 8 9s8-4.582 8-9" strokeLinecap="round"/>
      <path d="M8 10v2c0 2.21 1.79 4 4 4s4-1.79 4-4v-2" strokeLinecap="round"/>
      <path d="M8 6h8" strokeLinecap="round"/>
    </svg>
  );
}
function ColorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-7 h-7">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="6" cy="12" r="1" fill="currentColor"/>
      <circle cx="10" cy="8" r="1" fill="currentColor"/>
      <circle cx="14" cy="14" r="1" fill="currentColor"/>
      <circle cx="18" cy="10" r="1" fill="currentColor"/>
    </svg>
  );
}
function SkinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-7 h-7">
      <circle cx="12" cy="12" r="9" strokeLinecap="round"/>
      <path d="M8 14s1.5 2 4 2 4-2 4-2" strokeLinecap="round"/>
      <circle cx="9" cy="9" r="1" fill="currentColor"/>
      <circle cx="15" cy="9" r="1" fill="currentColor"/>
    </svg>
  );
}
function WashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-7 h-7">
      <path d="M12 3c-4.97 0-9 4.03-9 9 0 4.97 9 9 9 9s9-4.03 9-9c0-4.97-4.03-9-9-9z" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 8v8M8 12h8" strokeLinecap="round"/>
    </svg>
  );
}
function ProductIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-7 h-7">
      <rect x="6" y="3" width="12" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 8h12M6 13h12M6 18h12" strokeLinecap="round"/>
    </svg>
  );
}

/* ─── Before/After Slider ─── */
function BeforeAfterSlider({ beforeImage, afterImage, clientName }: { beforeImage: string; afterImage: string; clientName?: string }) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, x)));
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (isDragging.current) handleMove(e.clientX); };
    const onUp = () => { isDragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] overflow-hidden cursor-ew-resize select-none border border-white/10"
      onMouseDown={(e) => { isDragging.current = true; handleMove(e.clientX); }}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchStart={(e) => handleMove(e.touches[0].clientX)}
    >
      {/* After (full) */}
      <img src={afterImage} alt="After" className="absolute inset-0 w-full h-full object-cover" />
      {/* Before (clipped) */}
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
        <img src={beforeImage} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
      </div>
      {/* Slider line */}
      <div className="absolute top-0 bottom-0 w-px bg-[#C9A84C]" style={{ left: `${sliderPos}%` }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#C9A84C] flex items-center justify-center">
          <svg className="w-4 h-4 text-[#1A1A1A]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7M15 5l7 7-7 7" />
          </svg>
        </div>
      </div>
      {/* Labels */}
      <div className="absolute top-4 left-4 px-3 py-1 bg-[#1A1A1A]/80 text-[10px] uppercase tracking-widest text-[#A0A0A0] border border-white/10">Before</div>
      <div className="absolute top-4 right-4 px-3 py-1 bg-[#1A1A1A]/80 text-[10px] uppercase tracking-widest text-[#C9A84C] border border-[#C9A84C]/30">After</div>
      {clientName && (
        <div className="absolute bottom-4 left-4 right-4 text-center">
          <p className="text-xs text-[#F5F0E8]/80 tracking-wide">{clientName}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Defaults ─── */
const defaultServices: ServiceItem[] = [
  { name: "Haircut", description: "Precision fades, textures, and classic cuts.", price: "$40", icon: "haircut" },
  { name: "Beard Design", description: "Shape, line, and sculpt. Your jawline deserves it.", price: "$30", icon: "beard" },
  { name: "Color", description: "Grey blending, highlights, and creative color.", price: "$55", icon: "color" },
  { name: "Skin Treatment", description: "Exfoliating facials and blackhead removal.", price: "$45", icon: "skin" },
  { name: "Hair Wash", description: "Relaxing scalp massage with premium products.", price: "$20", icon: "wash" },
  { name: "Products", description: "Pomades, clays, and oils. Take the vibe home.", price: "$25+", icon: "product" },
];

const defaultGallery: GalleryItem[] = [
  { src: "https://images.unsplash.com/photo-1622287162716-f311baa1a026?w=600&h=450&fit=crop", caption: "Before", clientName: "Marcus T.", service: "Fade & Beard" },
  { src: "https://images.unsplash.com/photo-1599351431613-18ef1fdd27e1?w=600&h=450&fit=crop", caption: "After", clientName: "Marcus T.", service: "Fade & Beard" },
  { src: "https://images.unsplash.com/photo-1503951914875-bef6dd2f97a3?w=600&h=450&fit=crop", caption: "Before", clientName: "Devon L.", service: "Texture Cut" },
  { src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=450&fit=crop", caption: "After", clientName: "Devon L.", service: "Texture Cut" },
];

const defaultProcess: ProcessStep[] = [
  { title: "Consult", description: "We study your hair type, lifestyle, and personal style. No guesswork.", icon: "01" },
  { title: "Craft", description: "Precision cutting, sculpting, and detailing. Every snip is intentional.", icon: "02" },
  { title: "Maintain", description: "Product recommendations and a custom regimen to keep the look fresh.", icon: "03" },
];

const defaultTeam: TeamMember[] = [
  { name: "Jake Ortiz", title: "Founder & Lead", specialties: "Fades, Design", photoUrl: "https://images.unsplash.com/photo-1503951914875-bef6dd2f97a3?w=400&h=400&fit=crop&crop=face" },
  { name: "Miles Chen", title: "Color Specialist", specialties: "Grey Blending, Creative", photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face" },
  { name: "Dante Brooks", title: "Beard Artist", specialties: "Sculpting, Straight Razor", photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face" },
  { name: "Rico Vega", title: "Texture Expert", specialties: "Curly, Waves, Long", photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face" },
];

const defaultProducts = [
  { name: "Matte Clay", price: "$24", imageUrl: "https://images.unsplash.com/photo-1608248543803-ba4f8c0d62bb?w=300&h=300&fit=crop", label: "Shop In Store" },
  { name: "Beard Oil", price: "$28", imageUrl: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=300&h=300&fit=crop", label: "Shop In Store" },
  { name: "Pomade", price: "$22", imageUrl: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=300&h=300&fit=crop", label: "Shop In Store" },
  { name: "Face Scrub", price: "$32", imageUrl: "https://images.unsplash.com/photo-1556228578-0d85b1b34d8f?w=300&h=300&fit=crop", label: "Shop In Store" },
];

const defaultInstagram = [
  "https://images.unsplash.com/photo-1622286342621-4e9ef6387da6?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1599351431202-6e0c46c1cd15?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1622287162716-f311baa1a026?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1620331311528-33d672c2db81?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1608248543803-ba4f8c0d62bb?w=300&h=300&fit=crop",
];

const defaultTestimonials: Testimonial[] = [
  { quote: "Jake doesn't just cut hair — he architects it. Best fade in the city, hands down.", authorName: "Tyler R.", rating: 5, service: "Fade" },
  { quote: "The whole vibe is unreal. Good music, great conversation, and you leave looking like money.", authorName: "Jordan K.", rating: 5, service: "Haircut & Beard" },
  { quote: "Miles fixed my grey blending after a bad box dye. Never trusting anyone else.", authorName: "Sean M.", rating: 5, service: "Color" },
];

const defaultHours: BusinessHours[] = [
  { day: "Mon - Fri", hours: "10:00 AM - 9:00 PM" },
  { day: "Saturday", hours: "9:00 AM - 8:00 PM" },
  { day: "Sunday", hours: "11:00 AM - 5:00 PM" },
];

const defaultSocialLinks: SocialLink[] = [
  { platform: "Instagram", url: "#" },
  { platform: "TikTok", url: "#" },
  { platform: "X", url: "#" },
];

/* ─── Component ─── */
export default function BarberUrbanTemplate({ config }: BarberUrbanTemplateProps) {
  const {
    brandName = "DEFINE.",
    tagline = "Urban Barbering",
    logoUrl,
    heroTitle = "DEFINE YOUR EDGE",
    heroTagline = "Precision cuts for the modern man. No appointments needed — just show up.",
    heroImageUrl = "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1600&h=900&fit=crop",
    primaryCtaText = "Book Now",
    primaryCtaUrl = "#booking",
    secondaryCtaText = "View Gallery",
    secondaryCtaUrl = "#gallery",
    services = defaultServices,
    gallery = defaultGallery,
    processSteps = defaultProcess,
    team = defaultTeam,
    products = defaultProducts,
    instagramPhotos = defaultInstagram,
    bookingPhone = "(555) 555-EDGE",
    bookingFormUrl = "#booking",
    testimonials = defaultTestimonials,
    contactPhone = "(555) 555-EDGE",
    contactEmail = "hello@definebarbers.com",
    contactAddress = "88 Industrial Ave, Brooklyn",
    hours = defaultHours,
    socialLinks = defaultSocialLinks,
    footerText = "© 2026 DEFINE. All rights reserved.",
    customCss,
  } = config;

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const serviceIcons: Record<string, React.ReactNode> = {
    haircut: <HaircutIcon />,
    beard: <BeardIcon />,
    color: <ColorIcon />,
    skin: <SkinIcon />,
    wash: <WashIcon />,
    product: <ProductIcon />,
  };

  const navItems = [
    { label: "Services", href: "#services" },
    { label: "Gallery", href: "#gallery" },
    { label: "Team", href: "#team" },
    { label: "Book", href: "#booking" },
  ];

  return (
    <div className="min-h-screen antialiased bg-[#1A1A1A] text-white">
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}

      {/* ─── Navigation ─── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#1A1A1A]/95 backdrop-blur-md border-b border-white/10" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={brandName} className="h-8 w-auto" />
            ) : (
              <span className="text-xl font-black tracking-tighter uppercase" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}>
                {brandName}
              </span>
            )}
            {tagline && !logoUrl && <span className="hidden sm:block text-[10px] text-[#A0A0A0] tracking-widest uppercase">{tagline}</span>}
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className="text-sm font-medium text-[#A0A0A0] hover:text-[#C9A84C] transition-colors tracking-wide uppercase">
                {item.label}
              </a>
            ))}
            <a href={primaryCtaUrl} className="px-5 py-2 bg-[#C9A84C] text-[#1A1A1A] text-xs font-bold tracking-[0.15em] uppercase hover:bg-[#F5F0E8] transition-colors">
              {primaryCtaText}
            </a>
          </div>

          {/* Mobile Hamburger */}
          <button className="md:hidden p-2 text-white" aria-label="Menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated gradient fallback */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] via-[#2A2A2A] to-[#3D2914]" />
        <div className="absolute inset-0 opacity-30">
          <img src={heroImageUrl} alt="Barbershop" className="w-full h-full object-cover" />
        </div>
        {/* Geometric overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(201,168,76,0.1) 35px, rgba(201,168,76,0.1) 36px)" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pt-20">
          <span className="text-[#C9A84C] text-xs tracking-[0.4em] uppercase block mb-6">Brooklyn's Finest</span>
          <h1
            className="text-6xl md:text-8xl lg:text-9xl font-black mb-6 leading-none tracking-tighter"
            style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}
          >
            {heroTitle}
          </h1>
          <p className="text-base md:text-lg text-[#A0A0A0] mb-10 max-w-lg mx-auto leading-relaxed font-light">
            {heroTagline}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={primaryCtaUrl} className="inline-block px-10 py-4 bg-[#C9A84C] text-[#1A1A1A] text-sm font-bold tracking-[0.15em] uppercase hover:bg-[#F5F0E8] transition-all hover:shadow-lg hover:shadow-[#C9A84C]/20">
              {primaryCtaText}
            </a>
            <a href={secondaryCtaUrl} className="inline-block px-10 py-4 border border-white/20 text-white text-sm font-bold tracking-[0.15em] uppercase hover:border-[#C9A84C] hover:text-[#C9A84C] transition-all">
              {secondaryCtaText}
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-px h-12 bg-gradient-to-b from-[#C9A84C] to-transparent" />
        </div>
      </section>

      {/* ─── Services Grid ─── */}
      <section id="services" className="px-6 py-20 md:py-28 bg-[#1A1A1A]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#C9A84C] text-xs tracking-[0.3em] uppercase block mb-3">Services</span>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}>
              The Menu
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10">
            {services.map((service, idx) => (
              <div key={idx} className="group bg-[#1A1A1A] p-8 hover:bg-[#2A2A2A] transition-all cursor-pointer">
                <div className="text-[#C9A84C] mb-4 group-hover:scale-110 transition-transform origin-left">
                  {serviceIcons[service.icon || ""] || <HaircutIcon />}
                </div>
                <h3 className="text-lg font-bold uppercase tracking-wide mb-2" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}>
                  {service.name}
                </h3>
                <p className="text-sm text-[#A0A0A0] mb-3 leading-relaxed">{service.description}</p>
                {service.price && (
                  <span className="text-[#C9A84C] text-sm font-medium tracking-wide">From {service.price}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Gallery / Before-After ─── */}
      <section id="gallery" className="px-6 py-20 md:py-28 bg-[#0D0D0D]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#C9A84C] text-xs tracking-[0.3em] uppercase block mb-3">Transformations</span>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}>
              The Work
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {gallery.length >= 2 && (
              <BeforeAfterSlider
                beforeImage={gallery[0].src}
                afterImage={gallery[1].src}
                clientName={gallery[0].clientName}
              />
            )}
            {gallery.length >= 4 && (
              <BeforeAfterSlider
                beforeImage={gallery[2].src}
                afterImage={gallery[3].src}
                clientName={gallery[2].clientName}
              />
            )}
          </div>
          {testimonials.length > 0 && (
            <div className="mt-10 grid md:grid-cols-3 gap-4">
              {testimonials.slice(0, 3).map((t, idx) => (
                <div key={idx} className="bg-[#1A1A1A] border border-white/10 p-5">
                  <p className="text-sm text-[#F5F0E8]/70 italic mb-3">"{t.quote}"</p>
                  <p className="text-xs text-[#C9A84C] uppercase tracking-wide">— {t.authorName}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── The Experience (3-step) ─── */}
      <section className="px-6 py-20 md:py-28 bg-[#1A1A1A]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#C9A84C] text-xs tracking-[0.3em] uppercase block mb-3">How It Works</span>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}>
              The Experience
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {processSteps.map((step, idx) => (
              <div key={idx} className="relative text-center">
                <span className="text-6xl font-black text-white/5 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}>
                  {step.icon}
                </span>
                <div className="relative z-10">
                  <div className="w-16 h-16 mx-auto mb-6 border border-[#C9A84C]/30 flex items-center justify-center text-[#C9A84C]">
                    <span className="text-xl font-bold" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}>{step.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-wide mb-3" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}>
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#A0A0A0] leading-relaxed">{step.description}</p>
                </div>
                {idx < processSteps.length - 1 && (
                  <div className="hidden md:block absolute top-12 right-0 translate-x-1/2 w-full h-px bg-gradient-to-r from-[#C9A84C]/30 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Team Showcase (Horizontal Scroll) ─── */}
      <section id="team" className="py-20 md:py-28 bg-[#2A2A2A]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-[#C9A84C] text-xs tracking-[0.3em] uppercase block mb-3">The Squad</span>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}>
                Meet the Team
              </h2>
            </div>
            <div className="hidden md:flex gap-2">
              <button className="w-10 h-10 border border-white/10 flex items-center justify-center text-[#A0A0A0] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-all" aria-label="Previous">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button className="w-10 h-10 border border-white/10 flex items-center justify-center text-[#A0A0A0] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-all" aria-label="Next">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
        {/* Horizontal scroll container */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-6 px-6 pb-4" style={{ width: "max-content" }}>
            {team.map((member, idx) => (
              <div key={idx} className="w-72 shrink-0 group">
                <div className="relative aspect-[3/4] overflow-hidden mb-4 border border-white/10">
                  <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent opacity-70" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-[#C9A84C] text-[10px] tracking-widest uppercase">{member.specialties}</p>
                  </div>
                </div>
                <h3 className="text-lg font-bold uppercase tracking-wide" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}>
                  {member.name}
                </h3>
                <p className="text-sm text-[#A0A0A0]">{member.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Products Wall ─── */}
      <section className="px-6 py-20 md:py-28 bg-[#1A1A1A]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#C9A84C] text-xs tracking-[0.3em] uppercase block mb-3">In Stock</span>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}>
              The Product Wall
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product, idx) => (
              <div key={idx} className="group relative border border-white/10 hover:border-[#C9A84C]/30 transition-all">
                <div className="aspect-square overflow-hidden bg-[#2A2A2A]">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                </div>
                {product.label && (
                  <div className="absolute top-3 left-3 px-2 py-1 bg-[#C9A84C] text-[#1A1A1A] text-[10px] font-bold tracking-wider uppercase">
                    {product.label}
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-sm font-bold uppercase tracking-wide mb-1" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}>
                    {product.name}
                  </h3>
                  <p className="text-[#C9A84C] text-sm font-medium">{product.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Instagram Feed ─── */}
      <section className="py-20 md:py-28 bg-[#0D0D0D]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-[#C9A84C] text-xs tracking-[0.3em] uppercase block mb-3">@define.barbers</span>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}>
              Follow the Fade
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10">
          {instagramPhotos.map((photo, idx) => (
            <a key={idx} href="#" className="relative aspect-square overflow-hidden group bg-[#1A1A1A]">
              <img src={photo} alt={`Instagram ${idx + 1}`} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
              <div className="absolute inset-0 bg-[#1A1A1A]/0 group-hover:bg-[#1A1A1A]/30 transition-all flex items-center justify-center">
                <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ─── Book Section ─── */}
      <section id="booking" className="px-6 py-20 md:py-28 bg-[#1A1A1A] border-t border-b border-white/10">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-[#C9A84C] text-xs tracking-[0.3em] uppercase block mb-3">Ready?</span>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}>
            Book Your Seat
          </h2>
          <p className="text-[#A0A0A0] mb-8 max-w-md mx-auto">
            Walk-ins are welcome, but booking guarantees your chair. Text us or use the form below.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a href={bookingFormUrl} className="inline-block px-10 py-4 bg-[#C9A84C] text-[#1A1A1A] text-sm font-bold tracking-[0.15em] uppercase hover:bg-[#F5F0E8] transition-all">
              {primaryCtaText}
            </a>
            <a href={`tel:${bookingPhone}`} className="inline-block px-10 py-4 border border-white/20 text-white text-sm font-bold tracking-[0.15em] uppercase hover:border-[#C9A84C] hover:text-[#C9A84C] transition-all">
              Text {bookingPhone}
            </a>
          </div>

          <p className="text-xs text-[#A0A0A0]">
            {contactAddress} • {contactPhone}
          </p>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="px-6 py-16 bg-[#0D0D0D]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <span className="text-2xl font-black tracking-tighter uppercase block mb-4" style={{ fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}>
                {brandName}
              </span>
              <p className="text-xs text-[#A0A0A0] leading-relaxed mb-4">
                {tagline || "Precision cuts for the modern man."}
              </p>
              <div className="flex gap-3">
                {socialLinks.map((link, idx) => (
                  <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 border border-white/10 flex items-center justify-center text-[#A0A0A0] hover:text-[#C9A84C] hover:border-[#C9A84C] transition-all text-xs">
                    {link.platform.charAt(0)}
                  </a>
                ))}
              </div>
            </div>

            {/* Hours */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#F5F0E8] mb-4">Hours</h4>
              <div className="space-y-2">
                {hours.map((h, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-[#A0A0A0]">{h.day}</span>
                    <span className="text-[#F5F0E8]">{h.hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#F5F0E8] mb-4">Contact</h4>
              <div className="space-y-2 text-xs text-[#A0A0A0]">
                <p>{contactAddress}</p>
                <p>{contactPhone}</p>
                <p>{contactEmail}</p>
              </div>
            </div>

            {/* Tagline */}
            <div className="flex items-end">
              <p className="text-[10px] text-[#A0A0A0] tracking-[0.3em] uppercase">
                Follow the Fade
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 text-center">
            <p className="text-xs text-[#A0A0A0]">{footerText}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
