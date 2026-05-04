export enum SocialPlatform {
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  INSTAGRAM = 'instagram',
  LINKEDIN = 'linkedin',
  TIKTOK = 'tiktok',
}

// ── Content Templates ──────────────────────────────────────────────

export type TemplateCategory = 'hook' | 'cta' | 'story' | 'engagement' | 'promo';
export type ContentPlatform =
  | 'twitter'
  | 'linkedin'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'all';

export interface ContentTemplate {
  id: string;
  name: string;
  slug: string;
  category: TemplateCategory;
  platform: ContentPlatform;
  structure: {
    variables?: string[];
    sections?: string[];
    template?: string;
    [key: string]: any;
  };
  example_text: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── AI Content Generation ──────────────────────────────────────────

export interface GenerateContentRequest {
  topic: string;
  platform: Exclude<ContentPlatform, 'all'>;
  tone: string;
  length: 'short' | 'medium' | 'long';
  brandId?: string;
}

export interface GenerateContentResponse {
  text: string;
  hashtags: string[];
  imagePrompts: string[];
  platform: string;
  characterCount: number;
}

export interface GenerateFromTemplateRequest {
  templateId: string;
  variables?: Record<string, string>;
  platform: Exclude<ContentPlatform, 'all'>;
  tone?: string;
  brandId?: string;
}

// ── Social Post ────────────────────────────────────────────────────

export interface SocialPost {
  id: string;
  brand_id: string;
  postiz_post_id: string;
  content: string;
  platforms: Array<{ platform: string; integrationId?: string }>;
  scheduled_at: string | null;
  published_at: string | null;
  status: 'pending' | 'scheduled' | 'published' | 'error' | 'draft';
  state?: string;
  release_url?: string;
  media_urls: string[];
  created_at: string;
  updated_at: string;
}

// ── Analytics ─────────────────────────────────────────────────────

export interface PostAnalytics {
  post_id: string;
  brand_id: string;
  platform: string;
  impressions: number;
  engagement: number;
  clicks: number;
  shares: number;
  comments: number;
  likes: number;
  reach: number;
  recorded_at: string;
}

export interface SocialPlatformBase {
  id: string;
  name: string;
  platform: SocialPlatform;
  createdAt: string;
  updatedAt: string;
}

// SiteFlow types
export type WebsiteStatus = 'draft' | 'published' | 'deploying' | 'error';

export interface WebsiteConfig {
  brandName: string;
  tagline?: string;
  description?: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  logoUrl?: string;
  faviconUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  // Template-specific overrides
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  features?: Array<{
    title: string;
    description: string;
    icon?: string;
  }>;
  socialLinks?: Array<{
    platform: string;
    url: string;
  }>;
  bio?: string;
  avatarUrl?: string;
  gallery?: Array<{
    src: string;
    caption?: string;
  }>;
  countdownTarget?: string;
  countdownMessage?: string;
  signupHeading?: string;
  signupPlaceholder?: string;
  testimonials?: Array<{
    quote: string;
    author: string;
    role?: string;
  }>;
  aboutText?: string;
  contactEmail?: string;
  contactPhone?: string;
  footerText?: string;
  // Custom HTML/CSS for advanced users
  customCss?: string;
  customHeadHtml?: string;
  [key: string]: any;
}

export interface Template {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: 'landing' | 'linkinbio' | 'campaign' | 'portfolio';
  previewImage: string;
  componentPath: string;
  defaultConfig: WebsiteConfig;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Website {
  id: string;
  brandId: string;
  templateId: string;
  config: WebsiteConfig;
  status: WebsiteStatus;
  url?: string;
  customDomain?: string;
  vercelProjectId?: string;
  vercelDeploymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebsiteRequest {
  brandId: string;
  templateId: string;
  config: Partial<WebsiteConfig>;
}

export interface UpdateWebsiteRequest {
  config: Partial<WebsiteConfig>;
  status?: WebsiteStatus;
  customDomain?: string;
}

export interface DeployWebsiteResponse {
  deploymentId: string;
  status: WebsiteStatus;
  url: string;
  message: string;
}

export interface TemplateListResponse {
  templates: Template[];
}

export interface WebsiteListResponse {
  websites: Website[];
}
