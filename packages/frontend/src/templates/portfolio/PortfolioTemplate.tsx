"use client";

import React, { useState } from "react";
import type {
  TemplateColors,
  TemplateFonts,
  GalleryItem,
  ServiceItem,
  TeamMember,
  Testimonial,
  FAQItem,
  ProcessStep,
} from "../types";

export interface PortfolioConfig {
  brandName: string;
  tagline?: string;
  colors?: Partial<TemplateColors>;
  fonts?: Partial<TemplateFonts>;
  logoUrl?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  galleryImages?: GalleryItem[];
  galleryCategories?: string[];
  services?: ServiceItem[];
  team?: TeamMember[];
  processSteps?: ProcessStep[];
  testimonials?: Testimonial[];
  faqItems?: FAQItem[];
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  bookingCtaTitle?: string;
  bookingCtaSubtitle?: string;
  footerText?: string;
  customCss?: string;
}

interface PortfolioTemplateProps {
  config: PortfolioConfig;
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
          className={`w-4 h-4 ${i < rating ? "text-[#E9C46A]" : "text-gray-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function PortfolioTemplate({ config }: PortfolioTemplateProps) {
  const {
    brandName = "Luxe Beauty Collective",
    tagline = "Where artistry meets passion",
    colors: c = {},
    fonts: f = {},
    logoUrl,
    heroTitle = "Our Work Speaks For Itself",
    heroSubtitle = "Browse our portfolio of transformations and find your inspiration.",
    heroImageUrl = "https://picsum.photos/1600/900?random=50",
    galleryImages = [
      { src: "https://picsum.photos/400/500?random=51", caption: "Bridal Glam", category: "Makeup", clientName: "Emma", service: "Full Bridal Makeup" },
      { src: "https://picsum.photos/400/500?random=52", caption: "Balayage Transformation", category: "Hair", clientName: "Sophie", service: "Balayage + Cut" },
      { src: "https://picsum.photos/400/500?random=53", caption: "Gel Nail Art", category: "Nails", clientName: "Chloe", service: "Custom Nail Art" },
      { src: "https://picsum.photos/400/500?random=54", caption: "Acne Treatment Journey", category: "Skincare", clientName: "Olivia", service: "6-Week Treatment" },
      { src: "https://picsum.photos/400/500?random=55", caption: "Event Styling", category: "Hair", clientName: "Ava", service: "Updo + Extensions" },
      { src: "https://picsum.photos/400/500?random=56", caption: "Sculpted Nails", category: "Nails", clientName: "Lily", service: "Acrylic Sculpting" },
      { src: "https://picsum.photos/400/500?random=57", caption: "Glow Facial", category: "Skincare", clientName: "Grace", service: "HydraFacial" },
      { src: "https://picsum.photos/400/500?random=58", caption: "Smoky Eye", category: "Makeup", clientName: "Zoe", service: "Evening Makeup" },
      { src: "https://picsum.photos/400/500?random=59", caption: "Hair Color", category: "Hair", clientName: "Mia", service: "Fashion Color" },
    ],
    galleryCategories = ["All", "Hair", "Nails", "Makeup", "Skincare"],
    services = [
      { name: "Haircut & Style", description: "Precision cut, blowout, and styling", price: "$85+" },
      { name: "Color Service", description: "Full color, highlights, balayage", price: "$150+" },
      { name: "Manicure", description: "Classic, gel, or luxury spa manicure", price: "$35+" },
      { name: "Pedicure", description: "Classic, gel, or spa pedicure", price: "$50+" },
      { name: "Facial", description: "Customized facial for your skin type", price: "$95+" },
      { name: "Makeup Application", description: "Event, bridal, or photoshoot makeup", price: "$120+" },
      { name: "Hair Extensions", description: "Tape-in, sew-in, or fusion extensions", price: "$300+" },
      { name: "Lash Extensions", description: "Classic or volume lash sets", price: "$175+" },
    ],
    team = [
      {
        name: "Victoria Reed",
        title: "Master Stylist & Colorist",
        specialties: "Balayage, Color Correction, Bridal",
        bio: "With 15 years of experience, Victoria has styled for NYFW and celebrity clientele. Her passion is creating personalized color that enhances natural beauty.",
        photoUrl: "https://picsum.photos/400/500?random=61",
        certifications: ["Redken Certified", "Oribe Educator"],
      },
      {
        name: "Maya Johnson",
        title: "Nail Artist & Nail Educator",
        specialties: "Nail Art, Sculpted Acrylics, Nail Health",
        bio: "Maya combines technical precision with artistic flair. Her work has been featured in Nails Magazine and she regularly teaches advanced nail art workshops.",
        photoUrl: "https://picsum.photos/400/500?random=62",
        certifications: ["CND Certified", "Young Nails Educator"],
      },
      {
        name: "Dr. Priya Sharma",
        title: "Medical Esthetician",
        specialties: "Acne, Anti-Aging, Skin Treatments",
        bio: "Dr. Sharma brings medical-grade expertise to every facial. She specializes in corrective treatments and personalized skincare routines.",
        photoUrl: "https://picsum.photos/400/500?random=63",
        certifications: ["Licensed Esthetician", "PCA Skin Certified"],
      },
      {
        name: "Jordan Blake",
        title: "Makeup Artist",
        specialties: "Bridal, Editorial, Special Effects",
        bio: "Jordan's artistry has graced magazine covers and red carpets. Their approach blends classic technique with modern trends for stunning, camera-ready results.",
        photoUrl: "https://picsum.photos/400/500?random=64",
        certifications: ["MAC Pro Artist", "Kryolan Certified"],
      },
    ],
    processSteps = [
      { title: "Consultation", description: "We discuss your vision, assess your needs, and create a personalized plan.", icon: "💬" },
      { title: "Customize", description: "Your service is tailored specifically to your hair type, skin, and preferences.", icon: "✨" },
      { title: "Execute", description: "Our skilled professionals deliver exceptional results with premium products.", icon: "💎" },
      { title: "Maintain", description: "We provide aftercare guidance and schedule follow-ups to keep you looking great.", icon: "🌿" },
    ],
    testimonials = [
      { quote: "Victoria transformed my hair completely. I've never felt more confident!", authorName: "Samantha L.", rating: 5, service: "Balayage" },
      { quote: "The attention to detail is incredible. Maya's nail art is pure art.", authorName: "Nicole R.", rating: 5, service: "Nail Art" },
      { quote: "Dr. Sharma's facials have completely changed my skin. Worth every penny.", authorName: "Amanda T.", rating: 5, service: "Facial" },
      { quote: "Jordan did my wedding makeup and I felt like a princess. Thank you!", authorName: "Jessica M.", rating: 5, service: "Bridal Makeup" },
      { quote: "The entire team is so professional and welcoming. My go-to salon!", authorName: "Rachel H.", rating: 5, service: "Haircut" },
    ],
    faqItems = [
      { question: "Do I need to book a consultation first?", answer: "For color services and extensions, we recommend a free 15-minute consultation. Other services can be booked directly." },
      { question: "What products do you use?", answer: "We exclusively use premium, cruelty-free products from Oribe, Redken, PCA Skin, and CND." },
      { question: "Can I bring reference photos?", answer: "Absolutely! We encourage it. Bring photos that inspire you and we'll discuss how to achieve the look." },
      { question: "Do you offer gift cards?", answer: "Yes, gift cards are available in any denomination and never expire." },
      { question: "What's your cancellation policy?", answer: "We require 24 hours notice for cancellations. Late cancellations may incur a 50% service fee." },
      { question: "Do you accommodate allergies or sensitivities?", answer: "Yes, please inform us of any allergies when booking and we'll use hypoallergenic alternatives." },
    ],
    contactEmail = "hello@luxebeauty.com",
    contactPhone = "(555) 456-7890",
    contactAddress = "456 Glamour Ave, Los Angeles, CA 90210",
    bookingCtaTitle = "Ready to Get Started?",
    bookingCtaSubtitle = "Book your consultation today and let's create something beautiful together.",
    footerText = "© 2026 Luxe Beauty Collective. All rights reserved.",
    customCss,
  } = config;

  const colors = { ...defaultColors, ...c };
  const fonts = { ...defaultFonts, ...f };

  const [activeCategory, setActiveCategory] = useState("All");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const filteredImages = activeCategory === "All"
    ? galleryImages
    : galleryImages.filter((img) => img.category === activeCategory);

  const navItems = [
    { label: "Gallery", href: "#gallery" },
    { label: "Services", href: "#services" },
    { label: "Team", href: "#team" },
    { label: "Reviews", href: "#reviews" },
    { label: "FAQ", href: "#faq" },
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
              className="text-xl font-bold tracking-tight hidden sm:block"
              style={{ fontFamily: fonts.heading }}
            >
              {brandName}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium hover:opacity-70 transition-opacity"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#booking"
              className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: colors.secondary }}
            >
              Book Now
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative w-full min-h-[500px] md:min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImageUrl} alt="Portfolio hero" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ backgroundColor: colors.accent + "55" }} />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white">
          <h1
            className="text-4xl md:text-6xl font-bold mb-4"
            style={{ fontFamily: fonts.heading, textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}
          >
            {heroTitle}
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-xl mx-auto mb-8">
            {heroSubtitle}
          </p>
          <a
            href="#gallery"
            className="inline-block px-8 py-3.5 rounded-xl font-semibold transition-all hover:bg-white/20 border-2 border-white/50"
          >
            View Portfolio
          </a>
        </div>
      </section>

      {/* Filterable Gallery */}
      <section id="gallery" className="px-6 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: fonts.heading }}
            >
              Portfolio Gallery
            </h2>
            <p className="text-lg opacity-60">{tagline}</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {galleryCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-5 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  backgroundColor: activeCategory === cat ? colors.primary : colors.text + "08",
                  color: activeCategory === cat ? "#FFFFFF" : colors.text,
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredImages.map((img, idx) => (
              <div
                key={idx}
                className="group relative rounded-2xl overflow-hidden aspect-[4/5] cursor-pointer"
              >
                <img
                  src={img.src}
                  alt={img.caption || "Portfolio"}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex flex-col items-center justify-center p-4">
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 text-center text-white">
                    <p className="font-semibold text-lg mb-1">{img.caption}</p>
                    {img.clientName && <p className="text-sm opacity-80 mb-2">Client: {img.clientName}</p>}
                    {img.service && (
                      <p className="text-xs opacity-60 mb-3 px-3 py-1 rounded-full inline-block bg-white/20">
                        {img.service}
                      </p>
                    )}
                    <button
                      className="mt-2 px-5 py-2 rounded-lg text-sm font-medium text-white border border-white/50 hover:bg-white/20 transition-all"
                    >
                      View Details
                    </button>
                  </div>
                </div>
                <div
                  className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: colors.primary + "CC" }}
                >
                  {img.category}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Menu / Pricing */}
      <section id="services" className="px-6 py-20 md:py-28" style={{ backgroundColor: colors.primary + "06" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: fonts.heading }}
            >
              Services & Pricing
            </h2>
            <p className="text-lg opacity-60">Transparent pricing for premium results</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-4 px-5 rounded-xl border transition-all hover:shadow-md"
                style={{ borderColor: colors.text + "08", backgroundColor: colors.background }}
              >
                <div>
                  <p className="font-medium">{service.name}</p>
                  <p className="text-sm opacity-50">{service.description}</p>
                </div>
                <p
                  className="font-bold text-lg whitespace-nowrap ml-4"
                  style={{ color: colors.primary }}
                >
                  {service.price}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="px-6 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: fonts.heading }}
            >
              Meet The Artists
            </h2>
            <p className="text-lg opacity-60 max-w-xl mx-auto">
              Certified professionals passionate about their craft
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, idx) => (
              <div
                key={idx}
                className="group rounded-2xl overflow-hidden border transition-all hover:shadow-xl"
                style={{ borderColor: colors.text + "10" }}
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-lg mb-0.5" style={{ fontFamily: fonts.heading }}>
                    {member.name}
                  </h3>
                  <p className="text-sm mb-2" style={{ color: colors.primary }}>
                    {member.title}
                  </p>
                  <p className="text-sm opacity-60 mb-3 leading-relaxed">
                    {member.specialties}
                  </p>
                  <p className="text-xs opacity-50 leading-relaxed mb-4">
                    {member.bio}
                  </p>
                  {member.certifications && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {member.certifications.map((cert, cidx) => (
                        <span
                          key={cidx}
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: colors.primary + "10", color: colors.primary }}
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  )}
                  <a
                    href="#booking"
                    className="block w-full py-2.5 rounded-lg text-center text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: colors.secondary }}
                  >
                    Book with {member.name.split(" ")[0]}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="px-6 py-20 md:py-28" style={{ backgroundColor: colors.secondary + "06" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: fonts.heading }}
            >
              How It Works
            </h2>
            <p className="text-lg opacity-60">Your journey to beautiful results</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connector line */}
            <div
              className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-0.5"
              style={{ backgroundColor: colors.primary + "20" }}
            />
            {processSteps.map((step, idx) => (
              <div key={idx} className="text-center relative">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-sm relative z-10"
                  style={{ backgroundColor: colors.primary + "12" }}
                >
                  {step.icon}
                </div>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white mx-auto mb-3"
                  style={{ backgroundColor: colors.primary }}
                >
                  {idx + 1}
                </div>
                <h3
                  className="font-semibold text-lg mb-2"
                  style={{ fontFamily: fonts.heading }}
                >
                  {step.title}
                </h3>
                <p className="text-sm opacity-60 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Carousel */}
      <section id="reviews" className="px-6 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: fonts.heading }}
            >
              Client Stories
            </h2>
            <p className="text-lg opacity-60">Real experiences from real clients</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="rounded-2xl p-6 border transition-all hover:shadow-lg"
                style={{ borderColor: colors.text + "10" }}
              >
                <StarRating rating={t.rating} />
                <p className="mt-4 mb-6 opacity-70 italic leading-relaxed text-sm">
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
                    <p className="font-medium text-sm">{t.authorName}</p>
                    {t.service && <p className="text-xs opacity-50">{t.service}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="px-6 py-20 md:py-28" style={{ backgroundColor: colors.primary + "06" }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: fonts.heading }}
            >
              Questions? Answered.
            </h2>
            <p className="text-lg opacity-60">Everything you need to know</p>
          </div>
          <div className="space-y-3">
            {faqItems.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border overflow-hidden transition-all"
                style={{ borderColor: colors.text + "10", backgroundColor: colors.background }}
              >
                <button
                  className="w-full px-5 py-4 flex items-center justify-between text-left"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  <span className="font-medium text-sm pr-4">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 flex-shrink-0 transition-transform ${openFaq === idx ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-4 text-sm opacity-70 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / Booking */}
      <section id="contact" className="px-6 py-20 md:py-28">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2
                className="text-3xl md:text-4xl font-bold mb-4"
                style={{ fontFamily: fonts.heading }}
              >
                {bookingCtaTitle}
              </h2>
              <p className="text-lg opacity-60 mb-8 leading-relaxed">
                {bookingCtaSubtitle}
              </p>
              <div className="space-y-3 text-sm opacity-70">
                {contactAddress && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{contactAddress}</span>
                  </div>
                )}
                {contactPhone && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" style={{ color: colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href={`tel:${contactPhone}`} className="hover:opacity-80 transition-opacity">{contactPhone}</a>
                  </div>
                )}
                {contactEmail && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" style={{ color: colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a href={`mailto:${contactEmail}`} className="hover:opacity-80 transition-opacity">{contactEmail}</a>
                  </div>
                )}
              </div>
            </div>

            {/* Booking placeholder / Calendly embed area */}
            <div
              className="rounded-2xl p-8 border text-center"
              style={{ borderColor: colors.text + "10" }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: colors.primary + "12" }}
              >
                <svg className="w-8 h-8" style={{ color: colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-semibold mb-2">Book Your Appointment</p>
              <p className="text-sm opacity-50 mb-6">Calendly or booking widget embed placeholder</p>
              <a
                href="#booking"
                className="inline-block px-8 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90"
                style={{ backgroundColor: colors.secondary }}
              >
                Schedule Now
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t text-center" style={{ borderColor: colors.text + "10" }}>
        <p className="text-sm opacity-40">{footerText}</p>
      </footer>
    </div>
  );
}
