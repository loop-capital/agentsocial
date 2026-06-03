import { eq, and, ilike, sql, desc } from "drizzle-orm";
import { db, profiles, gbpReviews, brands } from "../db/index.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ProfileData {
  id: string;
  brandId: string;
  slug: string;
  businessName: string;
  category: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  websiteUrl: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  hours: Record<string, unknown>;
  photos: string[];
  services: ServiceItem[];
  ratingAvg: number;
  reviewCount: number;
  theme: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceItem {
  name: string;
  description?: string;
  price?: string;
  duration?: string;
}

export interface ReviewAggregate {
  id: string;
  reviewerName: string | null;
  reviewerPhotoUrl: string | null;
  starRating: number | null;
  comment: string | null;
  replyComment: string | null;
  createTime: Date | null;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_PROFILES: Record<string, ProfileData> = {
  "pleij-salon": {
    id: "mock-1",
    brandId: "mock-brand-1",
    slug: "pleij-salon",
    businessName: "Pleij Salon",
    category: "Hair Salon",
    description: "Austin's premier hair salon offering expert cuts, color, and styling in a relaxing modern atmosphere. Our talented stylists bring 15+ years of combined experience to every appointment.",
    phone: "(512) 555-0199",
    email: "hello@pleijsalon.com",
    websiteUrl: "https://pleijsalon.com",
    address: "1234 South Congress Ave",
    city: "Austin",
    state: "TX",
    zip: "78704",
    latitude: 30.2507,
    longitude: -97.7494,
    hours: {
      monday: "9:00 AM - 7:00 PM",
      tuesday: "9:00 AM - 7:00 PM",
      wednesday: "9:00 AM - 8:00 PM",
      thursday: "9:00 AM - 8:00 PM",
      friday: "9:00 AM - 7:00 PM",
      saturday: "10:00 AM - 5:00 PM",
      sunday: "Closed",
    },
    photos: [
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800",
      "https://images.unsplash.com/photo-1595476108010-76e2e5e2874a?w=800",
    ],
    services: [
      { name: "Women's Haircut", description: "Precision cut tailored to your face shape and lifestyle", price: "$65+", duration: "60 min" },
      { name: "Men's Haircut", description: "Classic and modern cuts with hot towel finish", price: "$35+", duration: "30 min" },
      { name: "Color & Highlights", description: "Full color, partial or full highlights with premium products", price: "$120+", duration: "90 min" },
      { name: "Blowout & Style", description: "Wash, blow-dry, and style for any occasion", price: "$45+", duration: "45 min" },
      { name: "Balayage", description: "Hand-painted highlights for a natural sun-kissed look", price: "$180+", duration: "120 min" },
      { name: "Keratin Treatment", description: "Smooth frizz and add shine for up to 6 months", price: "$250+", duration: "150 min" },
    ],
    ratingAvg: 47, // stored as basis points / 10 = 4.7 stars
    reviewCount: 124,
    theme: "modern",
    isPublished: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2025-05-01"),
  },
};

const MOCK_REVIEWS: Record<string, ReviewAggregate[]> = {
  "pleij-salon": [
    {
      id: "r1",
      reviewerName: "Sarah M.",
      reviewerPhotoUrl: null,
      starRating: 5,
      comment: "Absolutely love this salon! My balayage came out perfect. The staff is so friendly and the atmosphere is amazing.",
      replyComment: "Thank you Sarah! We're thrilled you love your new look. 💕",
      createTime: new Date("2025-04-28"),
    },
    {
      id: "r2",
      reviewerName: "Jessica T.",
      reviewerPhotoUrl: null,
      starRating: 5,
      comment: "Best haircut I've ever had. Period.",
      replyComment: null,
      createTime: new Date("2025-04-15"),
    },
    {
      id: "r3",
      reviewerName: "Amanda K.",
      reviewerPhotoUrl: null,
      starRating: 4,
      comment: "Great experience overall. The keratin treatment was worth every penny. Only wish they had weekend evening hours.",
      replyComment: "Thanks Amanda! We're considering extending Saturday hours. 🙏",
      createTime: new Date("2025-03-22"),
    },
  ],
};

const isMockMode = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes("localhost");

// ─── Helper: slug generation ───────────────────────────────────────────────

export function generateSlug(businessName: string): string {
  return businessName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ─── Get profile by slug ───────────────────────────────────────────────────

export async function getProfileBySlug(slug: string): Promise<ProfileData | null> {
  // Mock fallback
  if (isMockMode) {
    return MOCK_PROFILES[slug] || null;
  }

  const [row] = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.slug, slug), eq(profiles.isPublished, true)))
    .limit(1);

  if (!row) return null;

  return {
    ...row,
    hours: (row.hours as Record<string, unknown>) || {},
    photos: (row.photos as string[]) || [],
    services: (row.services as ServiceItem[]) || [],
    ratingAvg: row.ratingAvg ?? 0,
    reviewCount: row.reviewCount ?? 0,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
  };
}

// ─── Get reviews for a profile slug ────────────────────────────────────────

export async function getProfileReviews(
  slug: string,
  page: number = 1,
  limit: number = 20
): Promise<{ reviews: ReviewAggregate[]; total: number }> {
  // Mock fallback
  if (isMockMode) {
    const reviews = MOCK_REVIEWS[slug] || [];
    return { reviews, total: reviews.length };
  }

  // Look up profile first
  const [profile] = await db
    .select({ id: profiles.id, brandId: profiles.brandId })
    .from(profiles)
    .where(eq(profiles.slug, slug))
    .limit(1);

  if (!profile) return { reviews: [], total: 0 };

  // Fetch GBP reviews for the brand
  const offset = (page - 1) * limit;
  const reviews = await db
    .select({
      id: gbpReviews.id,
      reviewerName: gbpReviews.reviewerName,
      reviewerPhotoUrl: gbpReviews.reviewerPhotoUrl,
      starRating: gbpReviews.starRating,
      comment: gbpReviews.comment,
      replyComment: gbpReviews.replyComment,
      createTime: gbpReviews.createTime,
    })
    .from(gbpReviews)
    .where(eq(gbpReviews.brandId, profile.brandId))
    .orderBy(desc(gbpReviews.createTime))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(gbpReviews)
    .where(eq(gbpReviews.brandId, profile.brandId));

  return {
    reviews: reviews.map((r) => ({
      ...r,
      reviewerName: r.reviewerName ?? null,
      reviewerPhotoUrl: r.reviewerPhotoUrl ?? null,
      starRating: r.starRating ?? null,
      comment: r.comment ?? null,
      replyComment: r.replyComment ?? null,
      createTime: r.createTime ?? null,
    })),
    total: count,
  };
}

// ─── Get services for a profile ─────────────────────────────────────────────

export async function getProfileServices(
  slug: string
): Promise<ServiceItem[]> {
  if (isMockMode) {
    return MOCK_PROFILES[slug]?.services || [];
  }

  const [row] = await db
    .select({ services: profiles.services })
    .from(profiles)
    .where(eq(profiles.slug, slug))
    .limit(1);

  return (row?.services as ServiceItem[]) || [];
}

// ─── Update profile ─────────────────────────────────────────────────────────

export async function updateProfile(
  slug: string,
  data: Partial<Omit<ProfileData, "id" | "brandId" | "createdAt">>,
  userId: string
): Promise<ProfileData | null> {
  if (isMockMode) {
    const existing = MOCK_PROFILES[slug];
    if (!existing) return null;
    Object.assign(existing, { ...data, updatedAt: new Date() });
    return existing;
  }

  // Check ownership: user must own the brand
  const [profile] = await db
    .select({
      id: profiles.id,
      brandId: profiles.brandId,
    })
    .from(profiles)
    .where(eq(profiles.slug, slug))
    .limit(1);

  if (!profile) return null;

  const [brand] = await db
    .select({ userId: brands.userId })
    .from(brands)
    .where(eq(brands.id, profile.brandId))
    .limit(1);

  if (!brand || brand.userId !== userId) return null;

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.businessName !== undefined) updateData.businessName = data.businessName;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.websiteUrl !== undefined) updateData.websiteUrl = data.websiteUrl;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.state !== undefined) updateData.state = data.state;
  if (data.zip !== undefined) updateData.zip = data.zip;
  if (data.latitude !== undefined) updateData.latitude = data.latitude;
  if (data.longitude !== undefined) updateData.longitude = data.longitude;
  if (data.hours !== undefined) updateData.hours = data.hours;
  if (data.photos !== undefined) updateData.photos = data.photos;
  if (data.services !== undefined) updateData.services = data.services;
  if (data.theme !== undefined) updateData.theme = data.theme;
  if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;

  const [updated] = await db
    .update(profiles)
    .set(updateData)
    .where(eq(profiles.slug, slug))
    .returning();

  return {
    ...updated,
    hours: (updated.hours as Record<string, unknown>) || {},
    photos: (updated.photos as string[]) || [],
    services: (updated.services as ServiceItem[]) || [],
    ratingAvg: updated.ratingAvg ?? 0,
    reviewCount: updated.reviewCount ?? 0,
    latitude: updated.latitude ?? null,
    longitude: updated.longitude ?? null,
  };
}

// ─── Get profiles by category ──────────────────────────────────────────────

export async function getProfilesByCategory(
  category: string,
  page: number = 1,
  limit: number = 20
): Promise<{ profiles: ProfileData[]; total: number }> {
  if (isMockMode) {
    const filtered = Object.values(MOCK_PROFILES).filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
    return { profiles: filtered, total: filtered.length };
  }

  const offset = (page - 1) * limit;
  const rows = await db
    .select()
    .from(profiles)
    .where(and(ilike(profiles.category, category), eq(profiles.isPublished, true)))
    .orderBy(desc(profiles.ratingAvg))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(profiles)
    .where(and(ilike(profiles.category, category), eq(profiles.isPublished, true)));

  return {
    profiles: rows.map((row) => ({
      ...row,
      hours: (row.hours as Record<string, unknown>) || {},
      photos: (row.photos as string[]) || [],
      services: (row.services as ServiceItem[]) || [],
      ratingAvg: row.ratingAvg ?? 0,
      reviewCount: row.reviewCount ?? 0,
      latitude: row.latitude ?? null,
      longitude: row.longitude ?? null,
    })),
    total: count,
  };
}