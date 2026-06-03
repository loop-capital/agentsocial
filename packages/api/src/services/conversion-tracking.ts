// ─── Conversion Tracking Service ──────────────────────────────────────────────
//
// Tracks booking CTA impressions, clicks, form starts, and completed bookings.
// Supports source attribution (organic, chat_widget, gbp, ad, referral).
// Provides aggregated funnel stats, source breakdowns, and trend data.
// Uses mock data in dev mode; production uses Drizzle ORM + PostgreSQL.

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConversionEventType =
  | "booking_cta_impression"
  | "booking_cta_click"
  | "booking_form_start"
  | "booking_completed";

export type ConversionSource =
  | "organic"
  | "chat_widget"
  | "gbp"
  | "ad"
  | "referral";

export interface ConversionEvent {
  id: string;
  brandId: string;
  sessionId: string | null;
  eventType: ConversionEventType;
  source: ConversionSource;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface TrackEventInput {
  brandId: string;
  sessionId?: string;
  eventType: ConversionEventType;
  source: ConversionSource;
  metadata?: Record<string, unknown>;
}

export interface FunnelStats {
  impressions: number;
  clicks: number;
  formStarts: number;
  bookings: number;
  impressionToClickRate: number;
  clickToFormStartRate: number;
  formStartToBookingRate: number;
  overallConversionRate: number;
}

export interface SourceBreakdown {
  source: ConversionSource;
  label: string;
  impressions: number;
  clicks: number;
  bookings: number;
  conversionRate: number;
}

export interface TrendDataPoint {
  date: string;
  impressions: number;
  clicks: number;
  formStarts: number;
  bookings: number;
}

export interface ConversionStatsResponse {
  funnel: FunnelStats;
  sources: SourceBreakdown[];
  trend: TrendDataPoint[];
  period: {
    start: string;
    end: string;
    range: string;
  };
}

// ─── Source Labels ────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<ConversionSource, string> = {
  organic: "Organic Search",
  chat_widget: "Chat Widget",
  gbp: "Google Business Profile",
  ad: "Paid Ad",
  referral: "Referral",
};

// ─── Seeded Random (deterministic mock data) ──────────────────────────────────

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

// ─── In-Memory Store (dev mode) ──────────────────────────────────────────────

const eventStore: ConversionEvent[] = [];
let idCounter = 0;

// ─── Track Event ─────────────────────────────────────────────────────────────

/** Record a conversion event. Called from the widget JS or server-side. */
export async function trackEvent(input: TrackEventInput): Promise<ConversionEvent> {
  const event: ConversionEvent = {
    id: `conv-${Date.now()}-${++idCounter}`,
    brandId: input.brandId,
    sessionId: input.sessionId ?? null,
    eventType: input.eventType,
    source: input.source,
    metadata: input.metadata ?? {},
    createdAt: new Date(),
  };

  // In production, insert into conversion_events table via Drizzle:
  // const [row] = await db.insert(conversionEvents).values({ ... }).returning();
  eventStore.push(event);

  return event;
}

// ─── Funnel Stats ─────────────────────────────────────────────────────────────

/** Get aggregated funnel conversion stats for a brand and date range. */
export async function getFunnelStats(
  brandId: string,
  period?: string
): Promise<FunnelStats> {
  const range = period ?? "30d";

  // Check if we have real events for this brand
  const brandEvents = eventStore.filter(
    (e) => e.brandId === brandId
  );

  if (brandEvents.length >= 10) {
    // Use real data if we have enough events
    const impressions = brandEvents.filter((e) => e.eventType === "booking_cta_impression").length;
    const clicks = brandEvents.filter((e) => e.eventType === "booking_cta_click").length;
    const formStarts = brandEvents.filter((e) => e.eventType === "booking_form_start").length;
    const bookings = brandEvents.filter((e) => e.eventType === "booking_completed").length;

    return {
      impressions,
      clicks,
      formStarts,
      bookings,
      impressionToClickRate: impressions > 0 ? clicks / impressions : 0,
      clickToFormStartRate: clicks > 0 ? formStarts / clicks : 0,
      formStartToBookingRate: formStarts > 0 ? bookings / formStarts : 0,
      overallConversionRate: impressions > 0 ? bookings / impressions : 0,
    };
  }

  // Fallback to mock data
  const seed = `${brandId}-${range}`;
  const impressions = 4200 + Math.floor(seededRandom(seed, 10) * 2400);
  const clicks = Math.floor(impressions * (0.13 + seededRandom(seed, 11) * 0.07));
  const formStarts = Math.floor(clicks * (0.55 + seededRandom(seed, 12) * 0.15));
  const bookings = Math.floor(formStarts * (0.50 + seededRandom(seed, 13) * 0.20));

  return {
    impressions,
    clicks,
    formStarts,
    bookings,
    impressionToClickRate: impressions > 0 ? clicks / impressions : 0,
    clickToFormStartRate: clicks > 0 ? formStarts / clicks : 0,
    formStartToBookingRate: formStarts > 0 ? bookings / formStarts : 0,
    overallConversionRate: impressions > 0 ? bookings / impressions : 0,
  };
}

// ─── Source Breakdown ──────────────────────────────────────────────────────────

/** Get conversion stats broken down by source. */
export async function getSourceBreakdown(
  brandId: string,
  period?: string
): Promise<SourceBreakdown[]> {
  const range = period ?? "30d";
  const seed = `${brandId}-src-${range}`;

  const sourceWeights: Record<ConversionSource, { impW: number; clickW: number; bookW: number }> = {
    organic: { impW: 0.35, clickW: 0.30, bookW: 0.32 },
    chat_widget: { impW: 0.25, clickW: 0.28, bookW: 0.30 },
    gbp: { impW: 0.20, clickW: 0.22, bookW: 0.20 },
    ad: { impW: 0.15, clickW: 0.16, bookW: 0.12 },
    referral: { impW: 0.05, clickW: 0.04, bookW: 0.06 },
  };

  const totalImpressions = 4200 + Math.floor(seededRandom(seed, 20) * 2400);

  return (Object.entries(sourceWeights) as [ConversionSource, typeof sourceWeights[ConversionSource]][]).map(
    ([source, weights], i) => {
      const impressions = Math.floor(totalImpressions * weights.impW + seededRandom(seed, 30 + i) * 100);
      const clicks = Math.floor(impressions * (0.12 + seededRandom(seed, 40 + i) * 0.10));
      const bookings = Math.floor(clicks * (0.30 + seededRandom(seed, 50 + i) * 0.15));

      return {
        source,
        label: SOURCE_LABELS[source],
        impressions,
        clicks,
        bookings,
        conversionRate: impressions > 0 ? bookings / impressions : 0,
      };
    }
  );
}

// ─── Trend Data ───────────────────────────────────────────────────────────────

/** Get daily/weekly trend data for the conversion funnel. */
export async function getTrendData(
  brandId: string,
  period?: string
): Promise<TrendDataPoint[]> {
  const range = period ?? "30d";
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  const seed = `${brandId}-trend-${range}`;

  const points: TrendDataPoint[] = [];
  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(Date.now() - d * 86400000);
    const dateStr = date.toISOString().split("T")[0];
    const daySeed = seededRandom(seed, d + 100);

    // Simulate a slight upward trend
    const trendFactor = 1 + ((days - d) / days) * 0.15;
    const dayImpressions = Math.floor((120 + daySeed * 80) * trendFactor);
    const dayClicks = Math.floor(dayImpressions * (0.13 + seededRandom(seed, d + 200) * 0.05));
    const dayFormStarts = Math.floor(dayClicks * (0.55 + seededRandom(seed, d + 300) * 0.10));
    const dayBookings = Math.floor(dayFormStarts * (0.50 + seededRandom(seed, d + 400) * 0.15));

    points.push({
      date: dateStr,
      impressions: dayImpressions,
      clicks: dayClicks,
      formStarts: dayFormStarts,
      bookings: dayBookings,
    });
  }

  return points;
}

// ─── Full Stats Response ──────────────────────────────────────────────────────

/** Get the full conversion stats response (funnel + sources + trend). */
export async function getConversionStats(
  brandId: string,
  period?: string
): Promise<ConversionStatsResponse> {
  const range = period ?? "30d";
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;

  const [funnel, sources, trend] = await Promise.all([
    getFunnelStats(brandId, range),
    getSourceBreakdown(brandId, range),
    getTrendData(brandId, range),
  ]);

  return {
    funnel,
    sources,
    trend,
    period: {
      start: new Date(Date.now() - days * 86400000).toISOString(),
      end: new Date().toISOString(),
      range,
    },
  };
}

// ─── Recent Conversion Events ─────────────────────────────────────────────────

/** Get recent conversion events for the dashboard table. */
export async function getRecentConversionEvents(
  brandId: string,
  limit: number = 20
): Promise<ConversionEvent[]> {
  // Check real data first
  const brandEvents = eventStore
    .filter((e) => e.brandId === brandId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);

  if (brandEvents.length > 0) {
    return brandEvents;
  }

  // Fallback to mock data
  const seed = `${brandId}-recent`;
  const eventTypes: ConversionEventType[] = [
    "booking_cta_impression",
    "booking_cta_click",
    "booking_form_start",
    "booking_completed",
  ];
  const sources: ConversionSource[] = ["organic", "chat_widget", "gbp", "ad", "referral"];

  return Array.from({ length: limit }, (_, i) => {
    const eventSeed = seededRandom(seed, i);
    const typeIdx = Math.floor(eventSeed * eventTypes.length);
    // Weight: more impressions than clicks, more clicks than bookings
    const weightedRoll = eventSeed;
    let eventType: ConversionEventType;
    if (weightedRoll < 0.45) eventType = "booking_cta_impression";
    else if (weightedRoll < 0.70) eventType = "booking_cta_click";
    else if (weightedRoll < 0.85) eventType = "booking_form_start";
    else eventType = "booking_completed";

    const sourceIdx = Math.floor(seededRandom(seed, i + 50) * sources.length);

    return {
      id: `conv-mock-${brandId.slice(0, 4)}-${(i + 1).toString().padStart(3, "0")}`,
      brandId,
      sessionId: seededRandom(seed, i + 100) > 0.3 ? `sess-${Math.floor(seededRandom(seed, i + 200) * 10000)}` : null,
      eventType,
      source: sources[sourceIdx],
      metadata: {
        page: seededRandom(seed, i + 150) > 0.5 ? "/book" : "/",
        userAgent: "Mozilla/5.0",
        referrer: sources[sourceIdx] === "referral" ? "https://example.com" : null,
      },
      createdAt: new Date(Date.now() - i * 3600000 * seededRandom(seed, i + 300)),
    };
  });
}