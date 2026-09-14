import { Metadata } from "next";
import ProfessionalProfileTemplate, {
  generateJsonLd,
  type ProfessionalProfileConfig,
} from "@/templates/profile/ProfessionalProfileTemplate";

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_PROFILES: Record<string, ProfessionalProfileConfig> = {
  "pleij-salon": {
    brandName: "Pleij Salon",
    slug: "pleij-salon",
    category: "Hair Salon",
    description:
      "Austin's premier hair salon offering expert cuts, color, and styling in a relaxing modern atmosphere. Our talented stylists bring 15+ years of combined experience to every appointment.",
    phone: "(512) 555-0199",
    email: "hello@pleijsalon.com",
    websiteUrl: "https://pleijsalon.com",
    address: "1234 South Congress Ave",
    city: "Austin",
    state: "TX",
    zip: "78704",
    latitude: 30.2507,
    longitude: -97.7494,
    hoursMap: {
      Monday: "9:00 AM - 7:00 PM",
      Tuesday: "9:00 AM - 7:00 PM",
      Wednesday: "9:00 AM - 8:00 PM",
      Thursday: "9:00 AM - 8:00 PM",
      Friday: "9:00 AM - 7:00 PM",
      Saturday: "10:00 AM - 5:00 PM",
      Sunday: "Closed",
    },
    photos: [
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800",
      "https://images.unsplash.com/photo-1595476108010-76e2e5e2874a?w=800",
    ],
    services: [
      {
        name: "Women's Haircut",
        description: "Precision cut tailored to your face shape and lifestyle",
        price: "$65+",
        duration: "60 min",
      },
      {
        name: "Men's Haircut",
        description: "Classic and modern cuts with hot towel finish",
        price: "$35+",
        duration: "30 min",
      },
      {
        name: "Color & Highlights",
        description: "Full color, partial or full highlights with premium products",
        price: "$120+",
        duration: "90 min",
      },
      {
        name: "Blowout & Style",
        description: "Wash, blow-dry, and style for any occasion",
        price: "$45+",
        duration: "45 min",
      },
      {
        name: "Balayage",
        description: "Hand-painted highlights for a natural sun-kissed look",
        price: "$180+",
        duration: "120 min",
      },
      {
        name: "Keratin Treatment",
        description: "Smooth frizz and add shine for up to 6 months",
        price: "$250+",
        duration: "150 min",
      },
    ],
    ratingAvg: 4.7,
    reviewCount: 124,
    reviews: [
      {
        id: "r1",
        reviewerName: "Sarah M.",
        starRating: 5,
        comment:
          "Absolutely love this salon! My balayage came out perfect. The staff is so friendly and the atmosphere is amazing.",
        replyComment: "Thank you Sarah! We're thrilled you love your new look. 💕",
        createTime: "2025-04-28",
      },
      {
        id: "r2",
        reviewerName: "Jessica T.",
        starRating: 5,
        comment: "Best haircut I've ever had. Period.",
        createTime: "2025-04-15",
      },
      {
        id: "r3",
        reviewerName: "Amanda K.",
        starRating: 4,
        comment:
          "Great experience overall. The keratin treatment was worth every penny. Only wish they had weekend evening hours.",
        replyComment: "Thanks Amanda! We're considering extending Saturday hours. 🙏",
        createTime: "2025-03-22",
      },
    ],
    theme: "modern",
    bookingUrl: "#booking",
    bookingButtonText: "Book Now",
  },
};

// ─── API Helper ─────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function fetchProfile(slug: string): Promise<ProfessionalProfileConfig | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/profiles/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const { data } = await res.json();
    return data;
  } catch {
    // Fall back to mock data
    return MOCK_PROFILES[slug] || null;
  }
}

async function fetchReviews(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/profiles/${slug}/reviews?limit=5`, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    const { data } = await res.json();
    return data;
  } catch {
    return MOCK_PROFILES[slug]?.reviews || [];
  }
}

// ─── Metadata ───────────────────────────────────────────────────────────────

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const profile = await fetchProfile(slug);
  if (!profile) {
    return { title: "Profile Not Found | GetUpLook" };
  }

  const normalizedRating =
    (profile.ratingAvg ?? 0) > 5 ? (profile.ratingAvg ?? 0) / 10 : (profile.ratingAvg ?? 0);
  const fullAddress = [profile.address, profile.city, profile.state, profile.zip]
    .filter(Boolean)
    .join(", ");

  return {
    title: `${profile.brandName} — ${profile.category} in ${profile.city || ""}${profile.state ? `, ${profile.state}` : ""} | GetUpLook`,
    description:
      profile.description ||
      `${profile.brandName} — ${profile.category} in ${fullAddress}. Book your appointment today!`,
    openGraph: {
      title: `${profile.brandName} — ${profile.category}`,
      description:
        profile.description ||
        `Find ${profile.brandName} on GetUpLook.${normalizedRating > 0 ? ` Rated ${normalizedRating.toFixed(1)}/5.` : ""}`,
      url: `https://getuplook.com/profile/${profile.slug}`,
      siteName: "GetUpLook",
      type: "website",
      images: profile.photos?.slice(0, 1) || [],
    },
    alternates: {
      canonical: `https://getuplook.com/profile/${profile.slug}`,
    },
  };
}

// ─── Static Params ──────────────────────────────────────────────────────────

export async function generateStaticParams() {
  // In production, fetch all published slugs from API
  // For now, use mock slugs
  return Object.keys(MOCK_PROFILES).map((slug) => ({ slug }));
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default async function ProfilePage({ params }: Props) {
  const { slug } = await params;

  let profile = await fetchProfile(slug);

  // Fallback to mock data
  if (!profile) {
    profile = MOCK_PROFILES[slug] || null;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
          <p className="text-gray-600 mb-8">
            The business profile you're looking for doesn't exist or has been removed.
          </p>
          <a
            href="https://getuplook.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors"
          >
            ← Back to GetUpLook
          </a>
        </div>
      </div>
    );
  }

  // Fetch reviews if not included in profile data
  if (!profile.reviews || profile.reviews.length === 0) {
    profile.reviews = await fetchReviews(slug);
  }

  const jsonLd = generateJsonLd(profile);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProfessionalProfileTemplate config={profile} />
    </>
  );
}