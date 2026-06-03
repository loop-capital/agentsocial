// ─── Landing Pages Service ────────────────────────────────────────────────────
//
// CRUD operations for DFY ad landing pages.
// Each landing page belongs to a brand, uses a template, and tracks conversions.

import { db, landingPages } from "../db/index.js";
import { eq, and, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TemplateType = "salon_promo" | "new_client" | "service_highlight";
export type UrgencyType = "countdown" | "limited_spots" | "seasonal";

export interface LandingPage {
  id: string;
  brandId: string;
  slug: string;
  title: string;
  templateType: TemplateType;
  headline: string;
  subheadline: string | null;
  offerText: string | null;
  originalPrice: string | null;
  salePrice: string | null;
  ctaText: string;
  ctaUrl: string | null;
  businessName: string;
  businessCategory: string | null;
  phone: string | null;
  address: string | null;
  reviews: ReviewItem[];
  features: FeatureItem[];
  urgencyType: UrgencyType | null;
  urgencyConfig: UrgencyConfig | null;
  isPublished: boolean;
  publishedAt: Date | null;
  conversionTrackingEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewItem {
  name: string;
  rating: number;
  text: string;
  date?: string;
  avatar?: string;
}

export interface FeatureItem {
  icon?: string;
  title: string;
  description?: string;
}

export interface UrgencyConfig {
  countdownEndsAt?: string;
  countdownLabel?: string;
  spotsRemaining?: number;
  spotsTotal?: number;
  seasonalLabel?: string;
  seasonalExpiry?: string;
}

export interface CreateLandingPageInput {
  brandId: string;
  title: string;
  templateType: TemplateType;
  headline: string;
  subheadline?: string;
  offerText?: string;
  originalPrice?: string;
  salePrice?: string;
  ctaText?: string;
  ctaUrl?: string;
  businessName: string;
  businessCategory?: string;
  phone?: string;
  address?: string;
  reviews?: ReviewItem[];
  features?: FeatureItem[];
  urgencyType?: UrgencyType;
  urgencyConfig?: UrgencyConfig;
  conversionTrackingEnabled?: boolean;
}

export interface UpdateLandingPageInput extends Partial<CreateLandingPageInput> {}

// ─── Slug Generation ─────────────────────────────────────────────────────────

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80) + "-" + nanoid(6);
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function listLandingPages(brandId: string) {
  const rows = await db
    .select()
    .from(landingPages)
    .where(eq(landingPages.brandId, brandId))
    .orderBy(desc(landingPages.createdAt));
  return rows;
}

export async function getLandingPage(slug: string) {
  const rows = await db
    .select()
    .from(landingPages)
    .where(eq(landingPages.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export async function getLandingPageById(id: string) {
  const rows = await db
    .select()
    .from(landingPages)
    .where(eq(landingPages.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function createLandingPage(input: CreateLandingPageInput) {
  const slug = generateSlug(input.title);
  const row = await db.insert(landingPages).values({
    brandId: input.brandId,
    slug,
    title: input.title,
    templateType: input.templateType,
    headline: input.headline,
    subheadline: input.subheadline ?? null,
    offerText: input.offerText ?? null,
    originalPrice: input.originalPrice ?? null,
    salePrice: input.salePrice ?? null,
    ctaText: input.ctaText ?? "Book Now",
    ctaUrl: input.ctaUrl ?? null,
    businessName: input.businessName,
    businessCategory: input.businessCategory ?? null,
    phone: input.phone ?? null,
    address: input.address ?? null,
    reviews: input.reviews ?? [],
    features: input.features ?? [],
    urgencyType: input.urgencyType ?? null,
    urgencyConfig: input.urgencyConfig ?? {},
    conversionTrackingEnabled: input.conversionTrackingEnabled ?? true,
  }).returning();
  return row[0];
}

export async function updateLandingPage(slug: string, input: UpdateLandingPageInput) {
  // Build update object from provided fields
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (input.title !== undefined) updates.title = input.title;
  if (input.templateType !== undefined) updates.templateType = input.templateType;
  if (input.headline !== undefined) updates.headline = input.headline;
  if (input.subheadline !== undefined) updates.subheadline = input.subheadline;
  if (input.offerText !== undefined) updates.offerText = input.offerText;
  if (input.originalPrice !== undefined) updates.originalPrice = input.originalPrice;
  if (input.salePrice !== undefined) updates.salePrice = input.salePrice;
  if (input.ctaText !== undefined) updates.ctaText = input.ctaText;
  if (input.ctaUrl !== undefined) updates.ctaUrl = input.ctaUrl;
  if (input.businessName !== undefined) updates.businessName = input.businessName;
  if (input.businessCategory !== undefined) updates.businessCategory = input.businessCategory;
  if (input.phone !== undefined) updates.phone = input.phone;
  if (input.address !== undefined) updates.address = input.address;
  if (input.reviews !== undefined) updates.reviews = input.reviews;
  if (input.features !== undefined) updates.features = input.features;
  if (input.urgencyType !== undefined) updates.urgencyType = input.urgencyType;
  if (input.urgencyConfig !== undefined) updates.urgencyConfig = input.urgencyConfig;
  if (input.conversionTrackingEnabled !== undefined) updates.conversionTrackingEnabled = input.conversionTrackingEnabled;

  const row = await db
    .update(landingPages)
    .set(updates)
    .where(eq(landingPages.slug, slug))
    .returning();
  return row[0] ?? null;
}

export async function deleteLandingPage(slug: string) {
  const row = await db
    .delete(landingPages)
    .where(eq(landingPages.slug, slug))
    .returning();
  return row[0] ?? null;
}

// ─── Publish / Unpublish ──────────────────────────────────────────────────────

export async function publishLandingPage(slug: string) {
  const row = await db
    .update(landingPages)
    .set({
      isPublished: true,
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(landingPages.slug, slug))
    .returning();
  return row[0] ?? null;
}

export async function unpublishLandingPage(slug: string) {
  const row = await db
    .update(landingPages)
    .set({
      isPublished: false,
      updatedAt: new Date(),
    })
    .where(eq(landingPages.slug, slug))
    .returning();
  return row[0] ?? null;
}