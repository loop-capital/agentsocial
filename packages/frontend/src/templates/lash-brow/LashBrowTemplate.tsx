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

export interface LashBrowConfig {
  brandName: string;
  tagline?: string;
  logoUrl?: string;
  darkMode?: boolean;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  portfolioCta?: string;
  stats?: { label: string; value: string }[];
  services?: ServiceItem[];
  portfolioGallery?: GalleryItem[];
  beforeAfterGallery?: GalleryItem[];
  processSteps?: ProcessStep[];
  policies?: { title: string; description: string; icon?: string }[];
  aboutName?: string;
  aboutTitle?: string;
  aboutPhotoUrl?: string;
  aboutBio?: string;
  aboutCertifications?: string[];
  aboutInstagram?: string;
  testimonials?: Testimonial[];
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  hours?: BusinessHours[];
  aftercareItems?: { title: string; description: string }[];
  socialLinks?: SocialLink[];
  footerTagline?: string;
  customCss?: string;
}

interface LashBrowTemplateProps {
  config: LashBrowConfig;
}

/* ─── Color Palettes ─── */
const LIGHT_COLORS = {
  bg: "#FFFFFF",
  surface: "#FAFAFA",
  primary: "#D4A5A5",
  secondary: "#8B6B8B",
  accent: "#C9A84C",
  text: "#1A1A1A",
  muted: "#888888",
  border: "rgba(212,165,165,0.2)",
};

const DARK_COLORS = {
  bg: "#1A1A1A",
  surface: "#252525",
  primary: "#D4A5A5",
  secondary: "#8B6B8B",
  accent: "#C9A84C",
  text: "#FFFFFF",
  muted: "#A0A0A0",
  border: "rgba(212,165,165,0.15)",
};

/* ─── Icon helpers ─── */
function EyeIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  );
}

function AwardIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="2" y="2" width="20" height="20" rx="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
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

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

/* ─── Defaults ─── */
const defaultStats = [
  { label: "Instagram Followers", value: "12.4K" },
  { label: "Clients Served", value: "2,800+" },
  { label: "5-Star Reviews", value: "340" },
  { label: "Years Certified", value: "6" },
];

const defaultServices: ServiceItem[] = [
  {
    name: "Classic Lashes",
    description: "One extension per natural lash. The perfect everyday enhancement for a natural, polished look.",
    price: "$150",
    imageUrl: "https://picsum.photos/seed/classic/400/300",
  },
  {
    name: "Volume Lashes",
    description: "Hand-crafted fans for a dramatic, fluffy look. Maximum fullness with ultra-lightweight extensions.",
    price: "$195",
    imageUrl: "https://picsum.photos/seed/volume/400/300",
  },
  {
    name: "Hybrid Lashes",
    description: "The best of both worlds — a mix of classic and volume for texture, depth, and dimension.",
    price: "$175",
    imageUrl: "https://picsum.photos/seed/hybrid/400/300",
  },
  {
    name: "Brow Lamination",
    description: "Restructure brow hairs for a fuller, more defined shape. Lasts 6-8 weeks with proper care.",
    price: "$85",
    imageUrl: "https://picsum.photos/seed/browlam/400/300",
  },
  {
    name: "Brow Shaping",
    description: "Precision mapping and sculpting with waxing and tweezing for your ideal brow arch.",
    price: "$45",
    imageUrl: "https://picsum.photos/seed/browshape/400/300",
  },
  {
    name: "Lash Lift & Tint",
    description: "Enhance your natural lashes with a curl and deep black tint. No extensions needed.",
    price: "$95",
    imageUrl: "https://picsum.photos/seed/lashlift/400/300",
  },
];

const defaultPortfolio: GalleryItem[] = [
  { src: "https://picsum.photos/seed/lash1/400/400", caption: "Volume Set", category: "Lashes", clientName: "Jessica", service: "Volume Lashes" },
  { src: "https://picsum.photos/seed/lash2/400/400", caption: "Hybrid Set", category: "Lashes", clientName: "Maria", service: "Hybrid Lashes" },
  { src: "https://picsum.photos/seed/brow1/400/400", caption: "Brow Lamination", category: "Brows", clientName: "Taylor", service: "Brow Lamination" },
  { src: "https://picsum.photos/seed/lash3/400/400", caption: "Classic Set", category: "Lashes", clientName: "Alex", service: "Classic Lashes" },
  { src: "https://picsum.photos/seed/brow2/400/400", caption: "Brow Shaping", category: "Brows", clientName: "Jordan", service: "Brow Shaping" },
  { src: "https://picsum.photos/seed/trans1/400/400", caption: "Full Transformation", category: "Transformations", clientName: "Casey", service: "Hybrid + Brow" },
];

const defaultBeforeAfter: GalleryItem[] = [
  { src: "https://picsum.photos/seed/balash1/600/400", caption: "Volume Lashes — Before & After", category: "Lashes" },
  { src: "https://picsum.photos/seed/babrow1/600/400", caption: "Brow Lamination — Before & After", category: "Brows" },
];

const defaultProcessSteps: ProcessStep[] = [
  { title: "Consultation", description: "We discuss your desired look, eye shape, and lifestyle to design the perfect set.", icon: "" },
  { title: "Design", description: "Custom mapping and lash/brow design tailored to your unique features and preferences.", icon: "" },
  { title: "Application", description: "Relax in a comfortable setting while your artist crafts your look with precision and care.", icon: "" },
  { title: "Aftercare", description: "Receive detailed care instructions and product recommendations for lasting results.", icon: "" },
];

const defaultPolicies = [
  { title: "No Mascara", description: "Avoid wearing mascara to your appointment. It weakens the bond and shortens wear time.", icon: "eye" },
  { title: "Patch Test Required", description: "New clients must complete a patch test 48 hours before first application for safety.", icon: "check" },
  { title: "Fill Schedule", description: "Book fills every 2-3 weeks to maintain fullness. After 4 weeks, a full set is required.", icon: "clock" },
  { title: "Cancellation Policy", description: "Please cancel or reschedule at least 24 hours in advance. Late cancellations incur a 50% fee.", icon: "heart" },
];

const defaultTestimonials: Testimonial[] = [
  { quote: "I've been getting lashes here for 2 years and would never go anywhere else. The retention is incredible and they always look perfect.", authorName: "Jessica M.", rating: 5, service: "Volume Lashes" },
  { quote: "My brows have never looked better. The lamination changed my entire face — I get compliments everywhere I go.", authorName: "Taylor R.", rating: 5, service: "Brow Lamination" },
  { quote: "So professional, so clean, and the results are always flawless. Best lash artist in the city, hands down.", authorName: "Maria K.", rating: 5, service: "Hybrid Lashes" },
];

const defaultHours: BusinessHours[] = [
  { day: "Tuesday - Friday", hours: "9:00 AM - 7:00 PM" },
  { day: "Saturday", hours: "8:00 AM - 5:00 PM" },
  { day: "Sunday - Monday", hours: "Closed" },
];

const defaultAftercare = [
  { title: "First 24 Hours", description: "Avoid water, steam, and sweat. No showering, swimming, or gym for the first day." },
  { title: "Daily Care", description: "Brush lashes gently each morning. Avoid oil-based products around the eye area." },
  { title: "Sleep Smart", description: "Sleep on your back or use a silk pillowcase to prevent friction and premature shedding." },
  { title: "Cleaning", description: "Use a lash-safe cleanser 2-3 times per week. Clean lashes last longer and look fuller." },
];

const defaultSocialLinks: SocialLink[] = [
  { platform: "Instagram", url: "#" },
  { platform: "TikTok", url: "#" },
  { platform: "Facebook", url: "#" },
];

/* ─── Before/After Slider ─── */
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
          <svg className="w-4 h-4 text-[#1A1A1A]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
        <span className="text-xs font-medium text-[#1A1A1A]">{caption}</span>
      </div>
    </div>
  );
}

/* ─── Service Card with Add-to-Booking toggle ─── */
function ServiceCard({ service, dark }: { service: ServiceItem; dark: boolean }) {
  const [added, setAdded] = useState(false);
  const c = dark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <div
      className="group rounded-xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{ borderColor: c.border, backgroundColor: dark ? DARK_COLORS.surface : "#FFFFFF" }}
    >
      {service.imageUrl && (
        <div className="relative aspect-[4/3] overflow-hidden">
          <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {service.price && (
            <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: "#C9A84C", color: "#1A1A1A" }}>
              {service.price}
            </div>
          )}
        </div>
      )}
      <div className="p-5">
        <h3 className="text-lg font-bold mb-1" style={{ color: c.text, fontFamily: "'Montserrat', sans-serif" }}>{service.name}</h3>
        <p className="text-sm leading-relaxed mb-4" style={{ color: c.muted }}>{service.description}</p>
        <button
          onClick={() => setAdded(!added)}
          className="w-full py-2.5 rounded-full text-sm font-semibold transition-all border-2 flex items-center justify-center gap-2"
          style={{
            borderColor: added ? "#C9A84C" : c.primary,
            backgroundColor: added ? "#C9A84C" : "transparent",
            color: added ? "#1A1A1A" : c.primary,
          }}
        >
          {added ? (
            <>
              <CheckIcon /> Added to Booking
            </>
          ) : (
            <>+ Add to Booking</>
          )}
        </button>
      </div>
    </div>
  );
}

/* ─── Portfolio Lightbox ─── */
function PortfolioLightbox({ images, initialIndex, onClose, dark }: { images: GalleryItem[]; initialIndex: number; onClose: () => void; dark: boolean }) {
  const [current, setCurrent] = useState(initialIndex);
  const c = dark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.9)" }} onClick={onClose}>
      <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
        <img src={images[current].src} alt={images[current].caption} className="w-full rounded-lg" />
        <div className="absolute bottom-0 left-0 right-0 p-6 rounded-b-lg" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.8))" }}>
          <p className="text-white font-semibold">{images[current].clientName}</p>
          <p className="text-white/70 text-sm">{images[current].service}</p>
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        {images.length > 1 && (
          <>
            <button onClick={() => setCurrent((current - 1 + images.length) % images.length)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>
            <button onClick={() => setCurrent((current + 1) % images.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Aftercare Accordion ─── */
function AftercareAccordion({ items, dark }: { items: { title: string; description: string }[]; dark: boolean }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const c = dark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="rounded-lg overflow-hidden border" style={{ borderColor: c.border, backgroundColor: dark ? DARK_COLORS.surface : "#FFFFFF" }}>
          <button
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:opacity-80 transition-opacity"
          >
            <span className="text-sm font-semibold" style={{ color: c.text }}>{item.title}</span>
            <span className={`shrink-0 transition-transform duration-200 ${openIndex === idx ? "rotate-180" : ""}`} style={{ color: c.primary }}>
              <ChevronDownIcon />
            </span>
          </button>
          {openIndex === idx && (
            <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: c.muted }}>
              {item.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Main Component ─── */
export default function LashBrowTemplate({ config }: LashBrowTemplateProps) {
  const {
    brandName = "Lash & Brow Artistry",
    tagline = "Certified Lash & Brow Artist",
    logoUrl,
    darkMode = false,
    heroTitle = "Frame Your Beauty",
    heroSubtitle = "Precision lash extensions and brow artistry that elevates your natural features. Every set is custom-designed for your unique eye shape.",
    heroImageUrl = "https://picsum.photos/seed/lashhero/1600/900",
    ctaText = "Book Now",
    ctaUrl = "#booking",
    portfolioCta = "View Portfolio",
    stats = defaultStats,
    services = defaultServices,
    portfolioGallery = defaultPortfolio,
    beforeAfterGallery = defaultBeforeAfter,
    processSteps = defaultProcessSteps,
    policies = defaultPolicies,
    aboutName = "Mia Sterling",
    aboutTitle = "Certified Lash & Brow Artist",
    aboutPhotoUrl = "https://picsum.photos/seed/lashartist/400/500",
    aboutBio = "I'm Mia, a certified lash and brow artist with 6 years of experience creating custom looks that enhance your natural beauty. I trained under master artists in Los Angeles and specialize in volume techniques and brow architecture. My studio is a judgment-free zone where you can relax and leave feeling your most confident.",
    aboutCertifications = ["Classic & Volume Certified", "Brow Lamination Specialist", "Lash Lift & Tint Advanced"],
    aboutInstagram = "@miasterlinglashes",
    testimonials = defaultTestimonials,
    contactPhone = "(555) 876-5432",
    contactEmail = "hello@miasterlinglashes.com",
    contactAddress = "890 Beauty Lane, Suite 12",
    hours = defaultHours,
    aftercareItems = defaultAftercare,
    socialLinks = defaultSocialLinks,
    footerTagline = "Your eyes are the windows to your soul — let them shine",
    customCss,
  } = config;

  const [portfolioFilter, setPortfolioFilter] = useState("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const c = darkMode ? DARK_COLORS : LIGHT_COLORS;
  const filters = ["All", "Lashes", "Brows", "Transformations"];
  const filteredPortfolio = portfolioFilter === "All" ? portfolioGallery : portfolioGallery.filter((item) => item.category === portfolioFilter);

  const navItems = [
    { label: "Services", href: "#services" },
    { label: "Portfolio", href: "#portfolio" },
    { label: "Book", href: "#booking" },
  ];

  return (
    <div className="min-h-screen antialiased" style={{ backgroundColor: c.bg, color: c.text, fontFamily: "'Inter', 'Montserrat', system-ui, sans-serif" }}>
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}

      {/* ─── Navigation ─── */}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-md border-b" style={{ backgroundColor: darkMode ? "rgba(26,26,26,0.95)" : "rgba(255,255,255,0.95)", borderColor: c.border }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={brandName} className="h-10 w-auto" />
            ) : (
              <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: "#C9A84C" }}>
                {brandName.charAt(0)}
              </div>
            )}
            <span className="text-base font-bold tracking-wide" style={{ fontFamily: "'Montserrat', sans-serif" }}>{brandName}</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: c.text }}>
                {item.label}
              </a>
            ))}
            <a href={aboutInstagram ? `https://instagram.com/${aboutInstagram.replace("@", "")}` : "#"} target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity" style={{ color: c.text }}>
              <InstagramIcon />
            </a>
            <a
              href={ctaUrl}
              className="px-6 py-2.5 rounded-full text-sm font-bold transition-all hover:shadow-lg"
              style={{ backgroundColor: "#C9A84C", color: "#1A1A1A" }}
            >
              Book Now
            </a>
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <a href={aboutInstagram ? `https://instagram.com/${aboutInstagram.replace("@", "")}` : "#"} target="_blank" rel="noopener noreferrer" style={{ color: c.text }}>
              <InstagramIcon />
            </a>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2" style={{ color: c.text }} aria-label="Menu">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t px-6 py-4 space-y-3" style={{ borderColor: c.border, backgroundColor: c.bg }}>
            {navItems.map((item) => (
              <a key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium py-2" style={{ color: c.text }}>
                {item.label}
              </a>
            ))}
            <a href={ctaUrl} onClick={() => setMobileMenuOpen(false)} className="block text-center px-6 py-3 rounded-full text-sm font-bold" style={{ backgroundColor: "#C9A84C", color: "#1A1A1A" }}>
              Book Now
            </a>
          </div>
        )}
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative w-full overflow-hidden">
        <div className={`${darkMode ? "" : "relative"}`}>
          {!darkMode && (
            <div className="absolute inset-0">
              <img src={heroImageUrl} alt={brandName} className="w-full h-full object-cover opacity-20" />
              <div className="absolute inset-0" style={{ backgroundColor: "rgba(255,255,255,0.85)" }} />
            </div>
          )}
          {darkMode && (
            <div className="absolute inset-0">
              <img src={heroImageUrl} alt={brandName} className="w-full h-full object-cover opacity-30" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(26,26,26,0.3), rgba(26,26,26,0.9))" }} />
            </div>
          )}
          <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-32 lg:py-40 text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px w-12" style={{ backgroundColor: "#C9A84C" }} />
              <span className="text-xs tracking-[0.3em] uppercase" style={{ color: "#C9A84C" }}>Certified Artist</span>
              <div className="h-px w-12" style={{ backgroundColor: "#C9A84C" }} />
            </div>
            <h1
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.05]"
              style={{ fontFamily: "'Montserrat', 'Cormorant', sans-serif", color: c.text }}
            >
              {heroTitle}
            </h1>
            <p className="text-base md:text-lg mb-10 max-w-xl mx-auto leading-relaxed" style={{ color: c.muted }}>
              {heroSubtitle}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href={ctaUrl} className="inline-block px-10 py-4 rounded-full text-sm font-bold transition-all hover:shadow-xl hover:shadow-amber-400/20" style={{ backgroundColor: "#C9A84C", color: "#1A1A1A" }}>
                {ctaText}
              </a>
              <a href="#portfolio" className="inline-block px-10 py-4 rounded-full text-sm font-bold border-2 transition-all hover:opacity-80" style={{ borderColor: "#C9A84C", color: "#C9A84C" }}>
                {portfolioCta}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="py-10 md:py-14" style={{ backgroundColor: darkMode ? "#252525" : "#FAFAFA" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat, idx) => (
              <div key={idx}>
                <p className="text-2xl md:text-3xl font-bold mb-1" style={{ color: "#C9A84C", fontFamily: "'Montserrat', sans-serif" }}>{stat.value}</p>
                <p className="text-xs uppercase tracking-wider" style={{ color: c.muted }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Services ─── */}
      <section id="services" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs tracking-[0.3em] uppercase block mb-3" style={{ color: "#C9A84C" }}>Services</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif", color: c.text }}>
              The Menu
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, idx) => (
              <ServiceCard key={idx} service={service} dark={darkMode} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Portfolio ─── */}
      <section id="portfolio" className="py-20 md:py-28" style={{ backgroundColor: darkMode ? "#252525" : "#FAFAFA" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs tracking-[0.3em] uppercase block mb-3" style={{ color: "#C9A84C" }}>Portfolio</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6" style={{ fontFamily: "'Montserrat', sans-serif", color: c.text }}>
              My Work
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setPortfolioFilter(filter)}
                  className="px-5 py-2 rounded-full text-sm font-medium transition-all"
                  style={{
                    backgroundColor: portfolioFilter === filter ? "#C9A84C" : darkMode ? "#1A1A1A" : "#FFFFFF",
                    color: portfolioFilter === filter ? "#1A1A1A" : c.muted,
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPortfolio.map((item, idx) => (
              <div
                key={idx}
                className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group"
                onClick={() => {
                  const index = portfolioGallery.findIndex((p) => p.src === item.src);
                  setLightboxIndex(index >= 0 ? index : idx);
                }}
              >
                <img src={item.src} alt={item.caption} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <p className="text-white font-semibold text-sm">{item.clientName}</p>
                  <p className="text-white/70 text-xs">{item.service}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PortfolioLightbox
          images={portfolioGallery}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          dark={darkMode}
        />
      )}

      {/* ─── Before/After ─── */}
      <section className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs tracking-[0.3em] uppercase block mb-3" style={{ color: "#C9A84C" }}>Transformations</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif", color: c.text }}>
              Before & After
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {beforeAfterGallery.map((item, idx) => (
              <div key={idx}>
                <BeforeAfterSlider
                  beforeSrc={`${item.src}?before`}
                  afterSrc={`${item.src}?after`}
                  caption={item.caption || ""}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Process ─── */}
      <section className="py-20 md:py-28" style={{ backgroundColor: darkMode ? "#252525" : "#FAFAFA" }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs tracking-[0.3em] uppercase block mb-3" style={{ color: "#C9A84C" }}>The Experience</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif", color: c.text }}>
              What to Expect
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((step, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: "rgba(201,168,76,0.15)", color: "#C9A84C" }}>
                  {idx + 1}
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: c.text, fontFamily: "'Montserrat', sans-serif" }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: c.muted }}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Policies ─── */}
      <section className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs tracking-[0.3em] uppercase block mb-3" style={{ color: "#C9A84C" }}>Important</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif", color: c.text }}>
              Studio Policies
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {policies.map((policy, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl border transition-all hover:shadow-lg"
                style={{ borderColor: c.border, backgroundColor: darkMode ? DARK_COLORS.surface : "#FFFFFF" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(212,165,165,0.15)", color: "#D4A5A5" }}>
                    {idx === 0 ? <EyeIcon /> : idx === 1 ? <CheckIcon /> : idx === 2 ? <ClockIcon /> : <HeartIcon />}
                  </div>
                  <h3 className="text-base font-bold" style={{ color: c.text, fontFamily: "'Montserrat', sans-serif" }}>{policy.title}</h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: c.muted }}>{policy.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── About ─── */}
      <section className="py-20 md:py-28" style={{ backgroundColor: darkMode ? "#252525" : "#FAFAFA" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="relative">
              <div className="rounded-2xl overflow-hidden aspect-[3/4]">
                <img src={aboutPhotoUrl} alt={aboutName} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-4 -right-4 w-full h-full rounded-2xl -z-10 border-2" style={{ borderColor: "#C9A84C" }} />
            </div>
            <div>
              <span className="text-xs tracking-[0.3em] uppercase block mb-3" style={{ color: "#C9A84C" }}>Meet Your Artist</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: "'Montserrat', sans-serif", color: c.text }}>
                {aboutName}
              </h2>
              <p className="text-sm font-medium mb-6" style={{ color: "#D4A5A5" }}>{aboutTitle}</p>
              <p className="text-sm leading-relaxed mb-8" style={{ color: c.muted }}>{aboutBio}</p>

              <div className="mb-8">
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: c.text }}>Certifications</p>
                <div className="flex flex-wrap gap-2">
                  {aboutCertifications.map((cert, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: "rgba(212,165,165,0.15)", color: "#D4A5A5" }}>
                      <AwardIcon /> {cert}
                    </span>
                  ))}
                </div>
              </div>

              {aboutInstagram && (
                <a
                  href={`https://instagram.com/${aboutInstagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all hover:shadow-lg"
                  style={{ backgroundColor: "#C9A84C", color: "#1A1A1A" }}
                >
                  <InstagramIcon /> Follow My Work
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Reviews ─── */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs tracking-[0.3em] uppercase block mb-3" style={{ color: "#C9A84C" }}>Reviews</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif", color: c.text }}>
              Client Love
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="p-8 rounded-xl border transition-all hover:shadow-lg"
                style={{ borderColor: c.border, backgroundColor: darkMode ? DARK_COLORS.surface : "#FFFFFF" }}
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} style={{ color: i < (t.rating || 5) ? "#C9A84C" : "#E5E5E5" }}>
                      <StarIcon />
                    </span>
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-6" style={{ color: c.text }}>"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: "#D4A5A5" }}>
                    {t.authorName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: c.text }}>{t.authorName}</p>
                    {t.service && <p className="text-xs" style={{ color: c.muted }}>{t.service}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Booking ─── */}
      <section id="booking" className="py-20 md:py-28" style={{ backgroundColor: darkMode ? "#252525" : "#FAFAFA" }}>
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs tracking-[0.3em] uppercase block mb-3" style={{ color: "#C9A84C" }}>Booking</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4" style={{ fontFamily: "'Montserrat', sans-serif", color: c.text }}>
              Book Your Appointment
            </h2>
            <p className="text-sm" style={{ color: c.muted }}>A $25 non-refundable deposit is required to secure your spot.</p>
          </div>
          <div className="rounded-2xl p-8 md:p-10 border" style={{ backgroundColor: darkMode ? DARK_COLORS.bg : "#FFFFFF", borderColor: c.border }}>
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: c.text }}>Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all" style={{ borderColor: c.border, color: c.text, backgroundColor: c.bg }} placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: c.text }}>Phone</label>
                  <input type="tel" className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all" style={{ borderColor: c.border, color: c.text, backgroundColor: c.bg }} placeholder="(555) 000-0000" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: c.text }}>Email</label>
                <input type="email" className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all" style={{ borderColor: c.border, color: c.text, backgroundColor: c.bg }} placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: c.text }}>Service</label>
                <select className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all" style={{ borderColor: c.border, color: c.text, backgroundColor: c.bg }}>
                  <option>Select a service</option>
                  {services.map((s) => (
                    <option key={s.name}>{s.name} — {s.price}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: c.text }}>Preferred Date</label>
                <input type="date" className="w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all" style={{ borderColor: c.border, color: c.text, backgroundColor: c.bg }} />
              </div>
              <div className="flex items-start gap-2 pt-2">
                <input type="checkbox" id="deposit" className="mt-1" />
                <label htmlFor="deposit" className="text-xs" style={{ color: c.muted }}>
                  I understand a $25 deposit is required and will be applied to my service total.
                </label>
              </div>
              <button type="submit" className="w-full py-4 rounded-full text-sm font-bold transition-all hover:shadow-xl" style={{ backgroundColor: "#C9A84C", color: "#1A1A1A" }}>
                Book Appointment
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ─── Aftercare ─── */}
      <section className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs tracking-[0.3em] uppercase block mb-3" style={{ color: "#C9A84C" }}>Care Guide</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif", color: c.text }}>
              Aftercare
            </h2>
          </div>
          <AftercareAccordion items={aftercareItems} dark={darkMode} />
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-16" style={{ backgroundColor: "#1A1A1A", color: "#FFFFFF" }}>
        <div className="max-w-6xl mx-auto px-6">
          {/* Instagram Grid */}
          <div className="mb-12">
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="aspect-square rounded overflow-hidden">
                  <img src={`https://picsum.photos/seed/ig${idx}/200/200`} alt="Instagram" className="w-full h-full object-cover hover:opacity-80 transition-opacity" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                {logoUrl ? (
                  <img src={logoUrl} alt={brandName} className="h-8 w-auto" />
                ) : (
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: "#C9A84C" }}>
                    {brandName.charAt(0)}
                  </div>
                )}
                <span className="font-bold">{brandName}</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{tagline}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "#C9A84C" }}>Contact</p>
              <div className="space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                <p>{contactPhone}</p>
                <p>{contactEmail}</p>
                <p>{contactAddress}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "#C9A84C" }}>Hours</p>
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
              <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "#C9A84C" }}>Follow</p>
              <div className="flex gap-3">
                {socialLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full border flex items-center justify-center text-xs font-bold hover:bg-white/10 transition-all"
                    style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}
                  >
                    {link.platform === "Instagram" ? <InstagramIcon /> : link.platform.charAt(0)}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              © {new Date().getFullYear()} {brandName}. All rights reserved.
            </p>
            <p className="text-xs italic" style={{ color: "#C9A84C" }}>
              {footerTagline}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
