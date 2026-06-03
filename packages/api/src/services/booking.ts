// ─── Booking CTA & Conversion Tracking Service ─────────────────────────────────
//
// Provides booking configuration, conversion funnel stats, source attribution,
// and revenue summaries for salon/spa businesses.
// Uses mock data in dev mode; production would integrate with booking providers.

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface BookingConfig {
  brandId: string;
  ctaText: string;
  ctaColor: string;
  ctaLinkUrl: string;
  enabledSources: ("gbp" | "website_widget" | "direct_link")[];
  widgetPosition: "bottom_right" | "bottom_left" | "center" | "inline";
  showOnPages: "all" | "homepage_only" | string[];
  autoOpenDelay: number; // seconds, 0 = no auto-open
  updatedAt: Date;
}

export interface ConversionFunnelStep {
  step: "views" | "clicks" | "bookings" | "revenue";
  label: string;
  value: number;
  rate?: number; // conversion rate from previous step
}

export interface ConversionStats {
  period: { start: string; end: string; range: string };
  funnel: ConversionFunnelStep[];
  views: number;
  clicks: number;
  bookings: number;
  revenue: number;
  viewToClickRate: number;
  clickToBookingRate: number;
  overallConversionRate: number;
  avgBookingValue: number;
  trend: {
    views: number;       // % change vs previous period
    clicks: number;
    bookings: number;
    revenue: number;
  };
}

export interface BookingSourceStats {
  source: string;
  label: string;
  bookings: number;
  revenue: number;
  percentage: number;
}

export interface BookingSourceBreakdown {
  sources: BookingSourceStats[];
  totalBookings: number;
  totalRevenue: number;
}

export interface RecentBooking {
  id: string;
  customerName: string;
  service: string;
  source: "gbp" | "website_widget" | "direct_link";
  amount: number;
  status: "confirmed" | "pending" | "completed" | "cancelled" | "no_show";
  bookedAt: string;
}

export interface RevenueSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  lastMonth: number;
  monthOverMonthChange: number; // percentage
  projectedThisMonth: number;
  avgPerBooking: number;
  totalBookingsThisMonth: number;
}

// ─── Default Config ────────────────────────────────────────────────────────────

const DEFAULT_BOOKING_CONFIG: Omit<BookingConfig, "brandId" | "updatedAt"> = {
  ctaText: "Book Now",
  ctaColor: "#4F46E5", // indigo-600
  ctaLinkUrl: "/book",
  enabledSources: ["gbp", "website_widget", "direct_link"],
  widgetPosition: "bottom_right",
  showOnPages: "all",
  autoOpenDelay: 0,
};

// In-memory config store (dev mode; production uses DB)
const configStore = new Map<string, BookingConfig>();

// ─── Mock Data Generators ─────────────────────────────────────────────────────

const MOCK_CUSTOMER_NAMES = [
  "Sarah Johnson", "Emily Chen", "Maria Garcia", "Aisha Patel",
  "Rachel Kim", "Nicole Brown", "Jessica Martinez", "Taylor Wilson",
  "Danielle Lee", "Michelle Thompson", "Laura Davis", "Ashley Anderson",
];

const MOCK_SERVICES = [
  "Haircut & Blowout", "Balayage Color", "Deep Conditioning Treatment",
  "Gel Manicure", "Spa Pedicure", "Bridal Hair & Makeup",
  "Keratin Treatment", "Full Body Massage", "Facial Treatment",
  "Eyebrow Wax & Tint", "Updo Styling", "Root Touch-Up",
];

const MOCK_SOURCES: Array<{ source: "gbp" | "website_widget" | "direct_link"; label: string; weight: number }> = [
  { source: "gbp", label: "Google Business Profile", weight: 0.45 },
  { source: "website_widget", label: "Website Widget", weight: 0.35 },
  { source: "direct_link", label: "Direct Link", weight: 0.20 },
];

const MOCK_SERVICE_PRICES: Record<string, number> = {
  "Haircut & Blowout": 75,
  "Balayage Color": 185,
  "Deep Conditioning Treatment": 65,
  "Gel Manicure": 45,
  "Spa Pedicure": 55,
  "Bridal Hair & Makeup": 250,
  "Keratin Treatment": 200,
  "Full Body Massage": 95,
  "Facial Treatment": 85,
  "Eyebrow Wax & Tint": 30,
  "Updo Styling": 90,
  "Root Touch-Up": 110,
};

function seededRandom(seed: string, index: number): number {
  const str = `${seed}-${index}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return (Math.abs(hash) % 10000) / 10000;
}

function pickRandom<T>(arr: T[], seed: string, index: number): T {
  return arr[Math.floor(seededRandom(seed, index) * arr.length)];
}

// ─── Booking Config ────────────────────────────────────────────────────────────

/** Get the booking CTA configuration for a brand. */
export async function getBookingConfig(brandId: string): Promise<BookingConfig> {
  const existing = configStore.get(brandId);
  if (existing) return existing;

  // Return default config
  return {
    ...DEFAULT_BOOKING_CONFIG,
    brandId,
    updatedAt: new Date(),
  };
}

/** Update the booking CTA configuration for a brand. */
export async function updateBookingConfig(
  brandId: string,
  updates: Partial<Omit<BookingConfig, "brandId" | "updatedAt">>
): Promise<BookingConfig> {
  const existing = configStore.get(brandId) ?? await getBookingConfig(brandId);

  const updated: BookingConfig = {
    ...existing,
    ...updates,
    brandId,
    updatedAt: new Date(),
  };

  configStore.set(brandId, updated);
  return updated;
}

// ─── Conversion Stats ─────────────────────────────────────────────────────────

/** Get conversion funnel stats for a brand. */
export async function getConversionStats(brandId: string, period?: string): Promise<ConversionStats> {
  const range = period ?? "30d";
  const seed = `${brandId}-${range}`;

  // Generate realistic mock numbers
  const views = 3200 + Math.floor(seededRandom(seed, 1) * 1800);
  const clicks = Math.floor(views * (0.12 + seededRandom(seed, 2) * 0.06));
  const bookings = Math.floor(clicks * (0.28 + seededRandom(seed, 3) * 0.12));
  const avgValue = 75 + Math.floor(seededRandom(seed, 4) * 80);
  const revenue = bookings * avgValue;

  return {
    period: {
      start: new Date(Date.now() - 30 * 86400000).toISOString(),
      end: new Date().toISOString(),
      range,
    },
    funnel: [
      { step: "views", label: "Profile Views", value: views, rate: undefined },
      { step: "clicks", label: "CTA Clicks", value: clicks, rate: clicks / views },
      { step: "bookings", label: "Bookings", value: bookings, rate: bookings / clicks },
      { step: "revenue", label: "Revenue", value: revenue, rate: undefined },
    ],
    views,
    clicks,
    bookings,
    revenue,
    viewToClickRate: clicks / views,
    clickToBookingRate: bookings / clicks,
    overallConversionRate: bookings / views,
    avgBookingValue: avgValue,
    trend: {
      views: 8.5 + seededRandom(seed, 5) * 7,
      clicks: 12.3 + seededRandom(seed, 6) * 8,
      bookings: 15.2 + seededRandom(seed, 7) * 10,
      revenue: 18.7 + seededRandom(seed, 8) * 12,
    },
  };
}

// ─── Source Breakdown ──────────────────────────────────────────────────────────

/** Get booking source attribution breakdown. */
export async function getSourceBreakdown(brandId: string): Promise<BookingSourceBreakdown> {
  const seed = `${brandId}-sources`;
  const totalBookings = 45 + Math.floor(seededRandom(seed, 0) * 35);

  const sources: BookingSourceStats[] = MOCK_SOURCES.map((s, i) => {
    const bookings = Math.floor(totalBookings * s.weight + seededRandom(seed, i + 1) * 5);
    const avgValue = 75 + Math.floor(seededRandom(seed, i + 10) * 80);
    return {
      source: s.source,
      label: s.label,
      bookings,
      revenue: bookings * avgValue,
      percentage: s.weight,
    };
  });

  // Recalculate percentages based on actual bookings
  const total = sources.reduce((s, x) => s + x.bookings, 0);
  sources.forEach((s) => {
    s.percentage = total > 0 ? s.bookings / total : 0;
  });

  return {
    sources,
    totalBookings: total,
    totalRevenue: sources.reduce((s, x) => s + x.revenue, 0),
  };
}

// ─── Recent Bookings ───────────────────────────────────────────────────────────

/** Get a list of recent bookings. */
export async function getRecentBookings(brandId: string, limit: number = 10): Promise<RecentBooking[]> {
  const seed = `${brandId}-bookings`;
  const statuses: RecentBooking["status"][] = ["confirmed", "pending", "completed", "cancelled", "no_show"];

  return Array.from({ length: limit }, (_, i) => {
    const service = pickRandom(MOCK_SERVICES, seed, i);
    const source = pickRandom(MOCK_SOURCES, seed, i + 100);
    const statusWeights: RecentBooking["status"][] = [
      "completed", "completed", "completed", "confirmed", "confirmed",
      "pending", "cancelled", "no_show",
    ];

    return {
      id: `bkg-${brandId.slice(0, 4)}-${(i + 1).toString().padStart(3, "0")}`,
      customerName: pickRandom(MOCK_CUSTOMER_NAMES, seed, i + 200),
      service,
      source: source.source,
      amount: MOCK_SERVICE_PRICES[service] ?? 80,
      status: pickRandom(statusWeights, seed, i + 300),
      bookedAt: new Date(Date.now() - i * 86400000 * seededRandom(seed, i + 400)).toISOString(),
    };
  });
}

// ─── Revenue Summary ───────────────────────────────────────────────────────────

/** Get revenue summary for a brand. */
export async function getRevenueSummary(brandId: string): Promise<RevenueSummary> {
  const seed = `${brandId}-revenue`;
  const today = 280 + Math.floor(seededRandom(seed, 0) * 520);
  const thisWeek = today * (4 + seededRandom(seed, 1) * 2);
  const thisMonth = thisWeek * (3.5 + seededRandom(seed, 2) * 1.5);
  const lastMonth = thisMonth * (0.85 + seededRandom(seed, 3) * 0.3);
  const totalBookingsThisMonth = Math.floor(thisMonth / (75 + seededRandom(seed, 4) * 80));

  return {
    today: Math.round(today * 100) / 100,
    thisWeek: Math.round(thisWeek * 100) / 100,
    thisMonth: Math.round(thisMonth * 100) / 100,
    lastMonth: Math.round(lastMonth * 100) / 100,
    monthOverMonthChange: ((thisMonth - lastMonth) / lastMonth) * 100,
    projectedThisMonth: Math.round(thisMonth * 1.1 * 100) / 100,
    avgPerBooking: Math.round((thisMonth / totalBookingsThisMonth) * 100) / 100,
    totalBookingsThisMonth,
  };
}