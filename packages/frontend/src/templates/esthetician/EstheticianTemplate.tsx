"use client";

import React, { useState } from "react";
import type {
  ServiceItem,
  Testimonial,
  SocialLink,
  BusinessHours,
  GalleryItem,
  FAQItem,
  ProcessStep,
} from "../types";

export interface EstheticianConfig {
  brandName: string;
  tagline?: string;
  logoUrl?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  trustBadges?: { icon: string; label: string; value: string }[];
  services?: ServiceItem[];
  processSteps?: ProcessStep[];
  beforeAfterGallery?: GalleryItem[];
  productsCarried?: { name: string; description?: string; imageUrl?: string }[];
  aboutName?: string;
  aboutTitle?: string;
  aboutPhotoUrl?: string;
  aboutCredentials?: string[];
  aboutBio?: string;
  aboutEducation?: string[];
  testimonials?: Testimonial[];
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  hours?: BusinessHours[];
  faqItems?: FAQItem[];
  socialLinks?: SocialLink[];
  footerTagline?: string;
  customCss?: string;
}

interface EstheticianTemplateProps {
  config: EstheticianConfig;
}

/* ─── Color Palette ─── */
const COLORS = {
  bg: "#F9F7F4",
  primary: "#8B9D83",
  secondary: "#D4A574",
  accent: "#C4A77D",
  text: "#3D3D3D",
  muted: "#A0A0A0",
  white: "#FFFFFF",
  dark: "#1A1A1A",
};

/* ─── Icon helpers ─── */
function StarIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function LicenseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ProductsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

/* ─── Defaults ─── */
const defaultTrustBadges = [
  { icon: "license", label: "Licensed Esthetician", value: "State Certified" },
  { icon: "star", label: "Client Rating", value: "5.0 Stars" },
  { icon: "clock", label: "Experience", value: "8+ Years" },
  { icon: "products", label: "Products", value: "Professional Grade" },
];

const defaultServices: ServiceItem[] = [
  {
    name: "Custom Facial",
    description: "A personalized treatment designed for your unique skin concerns. Includes deep cleanse, exfoliation, extractions, and targeted mask.",
    price: "$125",
    imageUrl: "https://picsum.photos/seed/facial1/400/300",
  },
  {
    name: "Chemical Peel",
    description: "Medical-grade exfoliation to reveal brighter, smoother skin. Reduces fine lines, hyperpigmentation, and acne scars.",
    price: "$150",
    imageUrl: "https://picsum.photos/seed/peel1/400/300",
  },
  {
    name: "Microneedling",
    description: "Collagen induction therapy that minimizes pores, fine lines, and scarring for visibly firmer, rejuvenated skin.",
    price: "$275",
    imageUrl: "https://picsum.photos/seed/micro1/400/300",
  },
  {
    name: "Dermaplaning",
    description: "Gentle exfoliation removing dead skin cells and peach fuzz for instantly smoother texture and brighter complexion.",
    price: "$95",
    imageUrl: "https://picsum.photos/seed/derma1/400/300",
  },
  {
    name: "Waxing",
    description: "Professional hair removal using premium hard and soft wax for sensitive areas. Long-lasting, smooth results.",
    price: "$35+",
    imageUrl: "https://picsum.photos/seed/wax1/400/300",
  },
  {
    name: "Lash & Brow Tinting",
    description: "Semi-permanent tint to enhance your natural lashes and brows. Opens up the eyes without daily makeup.",
    price: "$45",
    imageUrl: "https://picsum.photos/seed/tint1/400/300",
  },
];

const defaultProcessSteps: ProcessStep[] = [
  {
    title: "Consultation",
    description: "We discuss your skin history, concerns, and goals. Every treatment begins with understanding your unique skin.",
    icon: "consult",
  },
  {
    title: "Skin Analysis",
    description: "Using advanced diagnostic tools, we assess your skin type, hydration levels, and underlying conditions.",
    icon: "analyze",
  },
  {
    title: "Treatment",
    description: "A customized procedure performed with clinical precision using medical-grade products and techniques.",
    icon: "treat",
  },
  {
    title: "Home Care Plan",
    description: "Personalized product recommendations and routines to maintain and enhance your results between visits.",
    icon: "care",
  },
];

const defaultBeforeAfter: GalleryItem[] = [
  {
    src: "https://picsum.photos/seed/ba1/600/400",
    caption: "Acne Treatment — 12 Weeks",
    category: "Acne",
    clientName: "Client A",
    service: "Custom Facial Series",
  },
  {
    src: "https://picsum.photos/seed/ba2/600/400",
    caption: "Chemical Peel Results",
    category: "Brightening",
    clientName: "Client B",
    service: "Chemical Peel",
  },
  {
    src: "https://picsum.photos/seed/ba3/600/400",
    caption: "Microneedling Transformation",
    category: "Anti-Aging",
    clientName: "Client C",
    service: "Microneedling",
  },
];

const defaultProducts = [
  { name: "Image Skincare", description: "Clinical-grade formulations" },
  { name: "EltaMD", description: "Dermatologist-recommended sun care" },
  { name: "Obagi Medical", description: "Prescription-strength skincare" },
  { name: "DMK", description: "Paramedical skin revision" },
  { name: "PCA Skin", description: "Professional chemical peels" },
  { name: "SkinCeuticals", description: "Advanced antioxidant science" },
];

const defaultTestimonials: Testimonial[] = [
  {
    quote: "After years of struggling with adult acne, I finally have clear skin. The personalized approach made all the difference.",
    authorName: "Sarah M.",
    rating: 5,
    service: "Custom Facial Series",
  },
  {
    quote: "My skin has never looked this radiant. The chemical peel transformed my complexion in just one session.",
    authorName: "Jennifer K.",
    rating: 5,
    service: "Chemical Peel",
  },
  {
    quote: "Professional, knowledgeable, and genuinely caring. I trust her completely with my skin.",
    authorName: "Amanda R.",
    rating: 5,
    service: "Microneedling",
  },
];

const defaultHours: BusinessHours[] = [
  { day: "Tuesday - Friday", hours: "10:00 AM - 7:00 PM" },
  { day: "Saturday", hours: "9:00 AM - 5:00 PM" },
  { day: "Sunday - Monday", hours: "Closed" },
];

const defaultFAQ: FAQItem[] = [
  {
    question: "How should I prepare for my facial?",
    answer: "Avoid retinoids and exfoliating products 48 hours before. Arrive with clean skin, no makeup. Bring a list of current skincare products.",
  },
  {
    question: "Are there any contraindications for treatments?",
    answer: "Please inform us if you are pregnant, using Accutane, have active cold sores, or recent cosmetic injections. Some treatments may need to be postponed.",
  },
  {
    question: "Is there downtime after chemical peels or microneedling?",
    answer: "Mild redness and peeling for 3-7 days is normal. We recommend scheduling these treatments when you have minimal social commitments.",
  },
  {
    question: "What home care products do you recommend?",
    answer: "After each treatment, you'll receive a personalized home care plan with product recommendations tailored to your skin type and goals.",
  },
  {
    question: "Do you offer package pricing?",
    answer: "Yes, we offer treatment series at discounted rates. Ask about our 3-session and 6-session packages for maximum results.",
  },
];

const defaultSocialLinks: SocialLink[] = [
  { platform: "Instagram", url: "#" },
  { platform: "Facebook", url: "#" },
];

/* ─── Before/After Slider Component ─── */
function BeforeAfterSlider({ beforeSrc, afterSrc, caption }: { beforeSrc: string; afterSrc: string; caption: string }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const x = ((clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, x)));
  };

  return (
    <div
      className="relative w-full aspect-[3/2] overflow-hidden rounded-lg cursor-ew-resize select-none group"
      onMouseMove={handleMove}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onTouchMove={handleMove}
      onTouchEnd={() => setIsDragging(false)}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        setSliderPosition(Math.max(0, Math.min(100, x)));
      }}
    >
      <img src={beforeSrc} alt="After" className="absolute inset-0 w-full h-full object-cover" />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img src={afterSrc} alt="Before" className="absolute inset-0 w-full h-full object-cover" style={{ width: `${100 / (sliderPosition / 100 || 0.01)}%` }} />
      </div>
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
        style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-[#3D3D3D]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
        <span className="text-xs font-medium text-[#3D3D3D]">{caption}</span>
      </div>
    </div>
  );
}

/* ─── FAQ Accordion ─── */
function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="border border-[#C4A77D]/20 rounded-lg overflow-hidden bg-white">
          <button
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#F9F7F4] transition-colors"
          >
            <span className="text-sm font-medium text-[#3D3D3D] pr-4">{item.question}</span>
            <span className={`shrink-0 text-[#8B9D83] transition-transform duration-200 ${openIndex === idx ? "rotate-180" : ""}`}>
              <ChevronDownIcon />
            </span>
          </button>
          {openIndex === idx && (
            <div className="px-6 pb-4 text-sm text-[#A0A0A0] leading-relaxed">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Main Component ─── */
export default function EstheticianTemplate({ config }: EstheticianTemplateProps) {
  const {
    brandName = "Serene Skin Studio",
    tagline = "Clinical Skincare by a Licensed Esthetician",
    logoUrl,
    heroTitle = "Reveal Your Best Skin",
    heroSubtitle = "Personalized clinical skincare treatments designed for your unique complexion. Experience the difference of expert care.",
    heroImageUrl = "https://picsum.photos/seed/esthetician-hero/1600/900",
    ctaText = "Book a Consultation",
    ctaUrl = "#booking",
    trustBadges = defaultTrustBadges,
    services = defaultServices,
    processSteps = defaultProcessSteps,
    beforeAfterGallery = defaultBeforeAfter,
    productsCarried = defaultProducts,
    aboutName = "Alexandra Chen",
    aboutTitle = "Licensed Esthetician",
    aboutPhotoUrl = "https://picsum.photos/seed/esthetician/400/500",
    aboutCredentials = ["Licensed Esthetician — State Board Certified", "Advanced Chemical Peel Certification", "Microneedling Specialist"],
    aboutBio = "With over 8 years of clinical skincare experience, I believe that beautiful skin is healthy skin. Every treatment is customized to your unique needs using medical-grade products and evidence-based techniques. My mission is to help you feel confident in your own skin.",
    aboutEducation = ["B.S. Biology — University of Washington", "Esthetics License — Aveda Institute", "Advanced Paramedical Training — DMK"],
    testimonials = defaultTestimonials,
    contactPhone = "(555) 234-5678",
    contactEmail = "hello@sereneskinstudio.com",
    contactAddress = "1420 Medical Center Drive, Suite 300",
    hours = defaultHours,
    faqItems = defaultFAQ,
    socialLinks = defaultSocialLinks,
    footerTagline = "Skincare is healthcare",
    customCss,
  } = config;

  const navItems = [
    { label: "Services", href: "#services" },
    { label: "Results", href: "#results" },
    { label: "About", href: "#about" },
    { label: "Book", href: "#booking" },
  ];

  const iconMap: Record<string, React.ReactNode> = {
    license: <LicenseIcon />,
    star: <StarIcon />,
    clock: <ClockIcon />,
    products: <ProductsIcon />,
  };

  return (
    <div className="min-h-screen antialiased" style={{ backgroundColor: COLORS.bg, color: COLORS.text, fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif" }}>
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}

      {/* ─── Navigation ─── */}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-md border-b" style={{ backgroundColor: "rgba(249,247,244,0.95)", borderColor: "rgba(196,167,125,0.15)" }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={brandName} className="h-10 w-auto" />
            ) : (
              <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: COLORS.primary }}>
                {brandName.charAt(0)}
              </div>
            )}
            <div className="leading-tight">
              <span className="block text-base font-semibold tracking-wide" style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}>
                {brandName}
              </span>
              {tagline && <span className="block text-[11px] tracking-wide" style={{ color: COLORS.muted }}>{tagline}</span>}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: COLORS.text }}>
                {item.label}
              </a>
            ))}
            <a
              href={ctaUrl}
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: COLORS.primary }}
            >
              Book Now
            </a>
          </div>

          <button className="md:hidden p-2" style={{ color: COLORS.text }} aria-label="Menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative w-full overflow-hidden" style={{ backgroundColor: COLORS.bg }}>
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-10" style={{ backgroundColor: COLORS.secondary }} />
                <span className="text-xs tracking-[0.2em] uppercase" style={{ color: COLORS.accent }}>Clinical Skincare</span>
              </div>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-normal mb-6 leading-[1.1]"
                style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif", color: COLORS.text }}
              >
                {heroTitle}
              </h1>
              <p className="text-base md:text-lg mb-8 leading-relaxed max-w-lg" style={{ color: COLORS.muted }}>
                {heroSubtitle}
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href={ctaUrl}
                  className="inline-block px-8 py-3.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-all hover:shadow-lg"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  {ctaText}
                </a>
                <a
                  href="#services"
                  className="inline-block px-8 py-3.5 rounded-full text-sm font-semibold border hover:bg-white/50 transition-all"
                  style={{ borderColor: COLORS.accent, color: COLORS.text }}
                >
                  Explore Services
                </a>
              </div>
            </div>
            <div className="order-1 lg:order-2 relative">
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
                <img src={heroImageUrl} alt={brandName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-tr from-[#8B9D83]/10 to-transparent" />
              </div>
              <div className="absolute -bottom-4 -right-4 w-full h-full rounded-2xl -z-10" style={{ border: `2px solid ${COLORS.accent}` }} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust Badges ─── */}
      <section className="py-10 md:py-14" style={{ backgroundColor: "rgba(139,157,131,0.06)" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {trustBadges.map((badge, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(139,157,131,0.12)", color: COLORS.primary }}>
                  {iconMap[badge.icon] || <StarIcon />}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{badge.value}</p>
                  <p className="text-xs" style={{ color: COLORS.muted }}>{badge.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Services ─── */}
      <section id="services" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs tracking-[0.2em] uppercase block mb-3" style={{ color: COLORS.accent }}>Treatments</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal" style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif", color: COLORS.text }}>
              Services Menu
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="group rounded-xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-white"
                style={{ borderColor: "rgba(196,167,125,0.15)" }}
              >
                {service.imageUrl && (
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold" style={{ color: COLORS.text }}>{service.name}</h3>
                    {service.price && (
                      <span className="text-sm font-bold" style={{ color: COLORS.primary }}>{service.price}</span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: COLORS.muted }}>{service.description}</p>
                  <a
                    href={`#booking?service=${encodeURIComponent(service.name)}`}
                    className="text-sm font-medium hover:underline transition-all inline-flex items-center gap-1"
                    style={{ color: COLORS.primary }}
                  >
                    Book This Treatment
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Process ─── */}
      <section className="py-20 md:py-28" style={{ backgroundColor: "rgba(139,157,131,0.04)" }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs tracking-[0.2em] uppercase block mb-3" style={{ color: COLORS.accent }}>The Experience</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal" style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif", color: COLORS.text }}>
              The Process
            </h2>
          </div>
          <div className="relative">
            <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px" style={{ backgroundColor: "rgba(139,157,131,0.2)" }} />
            <div className="space-y-12">
              {processSteps.map((step, idx) => (
                <div key={idx} className="relative flex gap-6 md:gap-8">
                  <div className="relative z-10 shrink-0">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-white text-lg font-bold" style={{ backgroundColor: COLORS.primary }}>
                      {idx + 1}
                    </div>
                  </div>
                  <div className="pt-2">
                    <h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.text, fontFamily: "'Cormorant Garamond', serif" }}>{step.title}</h3>
                    <p className="text-sm leading-relaxed max-w-lg" style={{ color: COLORS.muted }}>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Before/After ─── */}
      <section id="results" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs tracking-[0.2em] uppercase block mb-3" style={{ color: COLORS.accent }}>Transformations</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal" style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif", color: COLORS.text }}>
              Before & After
            </h2>
            <p className="mt-4 text-sm max-w-lg mx-auto" style={{ color: COLORS.muted }}>
              Real results from real clients. Drag the slider to see the transformation.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {beforeAfterGallery.map((item, idx) => (
              <div key={idx}>
                <BeforeAfterSlider
                  beforeSrc={`${item.src}?before`}
                  afterSrc={`${item.src}?after`}
                  caption={item.caption || ""}
                />
                <div className="mt-3 text-center">
                  <p className="text-xs font-medium" style={{ color: COLORS.text }}>{item.service}</p>
                  <p className="text-xs" style={{ color: COLORS.muted }}>{item.clientName}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Products ─── */}
      <section className="py-20 md:py-28" style={{ backgroundColor: COLORS.white }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-xs tracking-[0.2em] uppercase block mb-3" style={{ color: COLORS.accent }}>Professional Lines</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal" style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif", color: COLORS.text }}>
              Products I Carry
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {productsCarried.map((product, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-5 rounded-lg border transition-all hover:shadow-md"
                style={{ borderColor: "rgba(196,167,125,0.2)", backgroundColor: COLORS.bg }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(139,157,131,0.1)", color: COLORS.primary }}>
                  <span className="text-sm font-bold">{product.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: COLORS.text }}>{product.name}</p>
                  {product.description && <p className="text-xs" style={{ color: COLORS.muted }}>{product.description}</p>}
                </div>
              </div>
            ))}
          </div>
          <p className="text-center mt-8 text-sm" style={{ color: COLORS.muted }}>
            Ask me about personalized product recommendations during your consultation.
          </p>
        </div>
      </section>

      {/* ─── About ─── */}
      <section id="about" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="relative">
              <div className="rounded-2xl overflow-hidden aspect-[3/4]">
                <img src={aboutPhotoUrl} alt={aboutName} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-4 -right-4 w-full h-full rounded-2xl -z-10" style={{ border: `2px solid ${COLORS.accent}` }} />
            </div>
            <div>
              <span className="text-xs tracking-[0.2em] uppercase block mb-3" style={{ color: COLORS.accent }}>About</span>
              <h2 className="text-3xl md:text-4xl font-normal mb-2" style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif", color: COLORS.text }}>
                {aboutName}
              </h2>
              <p className="text-sm font-medium mb-6" style={{ color: COLORS.primary }}>{aboutTitle}</p>
              <p className="text-sm leading-relaxed mb-8" style={{ color: COLORS.muted }}>{aboutBio}</p>

              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: COLORS.text }}>Certifications</p>
                <div className="flex flex-wrap gap-2">
                  {aboutCredentials.map((cred, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: "rgba(139,157,131,0.1)", color: COLORS.primary }}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {cred}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: COLORS.text }}>Education & Training</p>
                <ul className="space-y-2">
                  {aboutEducation.map((edu, idx) => (
                    <li key={idx} className="text-sm flex items-center gap-2" style={{ color: COLORS.muted }}>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS.accent }} />
                      {edu}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-20 md:py-28" style={{ backgroundColor: "rgba(139,157,131,0.04)" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs tracking-[0.2em] uppercase block mb-3" style={{ color: COLORS.accent }}>Reviews</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal" style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif", color: COLORS.text }}>
              Client Experiences
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="p-8 rounded-xl border bg-white transition-all hover:shadow-lg"
                style={{ borderColor: "rgba(196,167,125,0.15)" }}
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} style={{ color: i < (t.rating || 5) ? COLORS.secondary : "#E5E5E5" }}>
                      <StarIcon />
                    </span>
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-6 italic" style={{ color: COLORS.text }}>"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: COLORS.primary }}>
                    {t.authorName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: COLORS.text }}>{t.authorName}</p>
                    {t.service && <p className="text-xs" style={{ color: COLORS.muted }}>{t.service}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Booking CTA ─── */}
      <section id="booking" className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal mb-4" style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif", color: COLORS.text }}>
              Ready for Your Skin Transformation?
            </h2>
            <p className="text-sm" style={{ color: COLORS.muted }}>
              Book a complimentary consultation to discuss your skincare goals.
            </p>
          </div>
          <div className="rounded-2xl p-8 md:p-10 border" style={{ backgroundColor: COLORS.white, borderColor: "rgba(196,167,125,0.15)" }}>
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: COLORS.text }}>Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all" style={{ borderColor: "rgba(196,167,125,0.2)", color: COLORS.text }} placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: COLORS.text }}>Email</label>
                  <input type="email" className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all" style={{ borderColor: "rgba(196,167,125,0.2)", color: COLORS.text }} placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: COLORS.text }}>Phone</label>
                <input type="tel" className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all" style={{ borderColor: "rgba(196,167,125,0.2)", color: COLORS.text }} placeholder="(555) 000-0000" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: COLORS.text }}>Skin Concerns</label>
                <select className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all" style={{ borderColor: "rgba(196,167,125,0.2)", color: COLORS.text }}>
                  <option>Select your primary concern</option>
                  <option>Acne / Breakouts</option>
                  <option>Aging / Fine Lines</option>
                  <option>Hyperpigmentation</option>
                  <option>Sensitivity / Rosacea</option>
                  <option>Dryness / Dehydration</option>
                  <option>Uneven Texture</option>
                  <option>General Maintenance</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: COLORS.text }}>Preferred Date</label>
                <input type="date" className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all" style={{ borderColor: "rgba(196,167,125,0.2)", color: COLORS.text }} />
              </div>
              <button
                type="submit"
                className="w-full py-4 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-all hover:shadow-lg"
                style={{ backgroundColor: COLORS.primary }}
              >
                Request Consultation
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 md:py-28" style={{ backgroundColor: "rgba(139,157,131,0.04)" }}>
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs tracking-[0.2em] uppercase block mb-3" style={{ color: COLORS.accent }}>Questions</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal" style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif", color: COLORS.text }}>
              Frequently Asked
            </h2>
          </div>
          <FAQAccordion items={faqItems} />
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-16" style={{ backgroundColor: COLORS.dark, color: COLORS.white }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                {logoUrl ? (
                  <img src={logoUrl} alt={brandName} className="h-8 w-auto" />
                ) : (
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: COLORS.primary }}>
                    {brandName.charAt(0)}
                  </div>
                )}
                <span className="font-semibold">{brandName}</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                {tagline}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: COLORS.accent }}>Contact</p>
              <div className="space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                <p>{contactPhone}</p>
                <p>{contactEmail}</p>
                <p>{contactAddress}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: COLORS.accent }}>Hours</p>
              <div className="space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                {hours.map((h, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{h.day}</span>
                    <span>{h.hours}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: COLORS.accent }}>Follow</p>
              <div className="flex gap-3">
                {socialLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full border flex items-center justify-center text-xs font-medium hover:bg-white/10 transition-all"
                    style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}
                  >
                    {link.platform.charAt(0)}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              © {new Date().getFullYear()} {brandName}. All rights reserved.
            </p>
            <p className="text-xs italic" style={{ color: COLORS.accent }}>
              {footerTagline}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
