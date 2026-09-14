// Shared types for all Website Builder templates

export interface TemplateColors {
  primary: string;     // Teal #2A9D8F
  secondary: string;   // Coral #E76F51
  background: string;  // White #FFFFFF
  text: string;        // Charcoal #1A1A1A
  accent: string;      // Additional accent
}

export interface TemplateFonts {
  heading: string;     // Serif, e.g. 'Playfair Display'
  body: string;        // Sans-serif, e.g. 'Inter'
}

export interface ServiceItem {
  name: string;
  description: string;
  price?: string;
  icon?: string;
  imageUrl?: string;
  duration?: string;
}

export interface TeamMember {
  name: string;
  title: string;
  specialties?: string;
  bio?: string;
  photoUrl?: string;
  certifications?: string[];
}

export interface Testimonial {
  quote: string;
  authorName: string;
  authorPhotoUrl?: string;
  rating?: number;     // 1-5
  service?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface BusinessHours {
  day: string;
  hours: string;
}

export interface GalleryItem {
  src: string;
  caption?: string;
  category?: string;
  clientName?: string;
  service?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ProcessStep {
  title: string;
  description: string;
  icon?: string;
}
