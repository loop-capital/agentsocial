/**
 * Square Bookings Integration for Dograh Voice Agent
 * 
 * Provides real-time availability checking and appointment booking
 * through the Square Appointments API.
 * 
 * Requires: Square account onboarded to Appointments
 * ENV: SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID, SQUARE_ENVIRONMENT
 */

import { SquareClient, SquareEnvironment } from "square";
import twilio from "twilio";

// ─── Config ───────────────────────────────────────────────────────────────────

const SQUARE_TOKEN = process.env.SQUARE_ACCESS_TOKEN || "";
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID || "";
const SQUARE_ENV = process.env.SQUARE_ENVIRONMENT === "production"
  ? SquareEnvironment.Production
  : SquareEnvironment.Sandbox;

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER || "";

const SALON_NAME = "PLEIJ";
const SALON_PHONE = process.env.PLEIJ_TRANSFER_NUMBER || "";

// ─── Clients ──────────────────────────────────────────────────────────────────

const square = new SquareClient({
  token: SQUARE_TOKEN,
  environment: SQUARE_ENV,
});

// ─── PLEIJ Service Catalog ────────────────────────────────────────────────────

// These map our salon services to Square catalog item IDs
// We'll populate these after syncing with Square catalog
const SERVICE_CATALOG: Record<string, {
  name: string;
  duration: number;  // minutes
  price: string;
  squareVariationId?: string;  // Square catalog item variation ID
}> = {
  "women_haircut":     { name: "Women Haircut",        duration: 45,  price: "$55-$85" },
  "men_haircut":       { name: "Men Haircut",          duration: 30,  price: "$35-$45" },
  "balayage":          { name: "Balayage",             duration: 180, price: "$180-$250" },
  "single_process":   { name: "Single Process Color",  duration: 120, price: "$120-$160" },
  "keratin":           { name: "Keratin Treatment",    duration: 120, price: "$200-$350" },
  "highlights":        { name: "Highlights",           duration: 150, price: "$150-$200" },
  "root_touchup":      { name: "Root Touch-Up",        duration: 60,  price: "$80-$110" },
  "blowout":           { name: "Blowout",              duration: 30,  price: "$35-$55" },
  "updo":              { name: "Updo/Special Event",   duration: 60,  price: "$75-$120" },
  "bang_trim":         { name: "Bang Trim",            duration: 15,  price: "$15-$20" },
  "kids_cut":          { name: "Kids Cut",             duration: 25,  price: "$25-$35" },
  "gloss":             { name: "Gloss Treatment",      duration: 30,  price: "$50-$75" },
  "olaplex":           { name: "Olaplex Treatment",    duration: 30,  price: "$40-$75" },
  "deep_conditioning": { name: "Deep Conditioning",    duration: 30,  price: "$30-$50" },
  "scalp_treatment":   { name: "Scalp Treatment",      duration: 30,  price: "$40-$60" },
};

// ─── Stylist → Square Team Member Mapping ─────────────────────────────────────

const STYLIST_MAP: Record<string, {
  displayName: string;
  squareTeamMemberId?: string;  // Populated after sync
}> = {
  "ashley":  { displayName: "Ashley (Senior)" },
  "jessica": { displayName: "Jessica (Senior)" },
  "morgan":  { displayName: "Morgan" },
};

// ─── Availability ─────────────────────────────────────────────────────────────

export interface AvailabilitySlot {
  startAt: string;
  available: boolean;
  stylistName?: string;
  teamMemberId?: string;
}

/**
 * Search for available booking slots for a given service and date range.
 * 
 * @param serviceKey - Key from SERVICE_CATALOG (e.g. "women_haircut")
 * @param date - ISO date string (e.g. "2026-05-28")
 * @param stylistKey - Optional stylist key from STYLIST_MAP
 */
export async function searchAvailability(
  serviceKey: string,
  date: string,
  stylistKey?: string
): Promise<AvailabilitySlot[]> {
  const service = SERVICE_CATALOG[serviceKey];
  if (!service) throw new Error(`Unknown service: ${serviceKey}`);

  // Build the start-at range: the requested date from 10am to 7pm
  const startOfDay = new Date(`${date}T10:00:00`);
  const endOfDay = new Date(`${date}T19:00:00`);

  const segmentFilter: any = {
    serviceVariationId: service.squareVariationId,
  };

  if (stylistKey && STYLIST_MAP[stylistKey]?.squareTeamMemberId) {
    segmentFilter.teamMemberIdFilter = {
      teamMemberIds: [STYLIST_MAP[stylistKey].squareTeamMemberId!],
      anyTeamMember: false,
    };
  }

  try {
    const result = await square.bookings.searchAvailability({
      query: {
        filter: {
          locationId: SQUARE_LOCATION_ID,
          startAtRange: {
            startAt: startOfDay.toISOString(),
            endAt: endOfDay.toISOString(),
          },
          segmentFilters: [segmentFilter],
        },
      },
    });

    const availabilities = result.data?.availabilities || [];
    return availabilities
      .filter((a: any) => a.available)
      .map((a: any) => ({
        startAt: a.startAt,
        available: true,
        stylistName: a.appointmentSegments?.[0]?.teamMemberId 
          ? getStylistBySquareId(a.appointmentSegments[0].teamMemberId)
          : undefined,
        teamMemberId: a.appointmentSegments?.[0]?.teamMemberId,
      }));
  } catch (error: any) {
    console.error("Square availability search failed:", error?.message || error);
    throw error;
  }
}

// ─── Book Appointment ─────────────────────────────────────────────────────────

export interface BookingRequest {
  serviceKey: string;
  date: string;          // ISO date: "2026-05-28"
  time: string;          // Time: "14:00"
  stylistKey?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
}

export interface BookingResult {
  success: boolean;
  bookingId?: string;
  appointmentAt?: string;
  serviceName?: string;
  stylistName?: string;
  error?: string;
}

/**
 * Create a booking in Square Appointments.
 */
export async function createBooking(req: BookingRequest): Promise<BookingResult> {
  const service = SERVICE_CATALOG[req.serviceKey];
  if (!service) return { success: false, error: `Unknown service: ${req.serviceKey}` };

  const startAt = new Date(`${req.date}T${req.time}:00`);

  const appointmentSegment: any = {
    serviceVariationId: service.squareVariationId,
    durationMinutes: service.duration,
  };

  if (req.stylistKey && STYLIST_MAP[req.stylistKey]?.squareTeamMemberId) {
    appointmentSegment.teamMemberId = STYLIST_MAP[req.stylistKey].squareTeamMemberId;
  }

  try {
    const result = await square.bookings.create({
      booking: {
        locationId: SQUARE_LOCATION_ID,
        startAt: startAt.toISOString(),
        appointmentSegments: [appointmentSegment],
        customerNote: `Booked via ${SALON_NAME} AI Receptionist`,
      },
    });

    const booking = result.data?.booking;
    if (!booking?.id) {
      return { success: false, error: "No booking ID returned from Square" };
    }

    // Send SMS confirmation
    await sendBookingConfirmation(req, booking.id);

    return {
      success: true,
      bookingId: booking.id,
      appointmentAt: booking.startAt || startAt.toISOString(),
      serviceName: service.name,
      stylistName: req.stylistKey ? STYLIST_MAP[req.stylistKey]?.displayName : undefined,
    };
  } catch (error: any) {
    console.error("Square booking creation failed:", error?.message || error);
    return { success: false, error: error?.message || "Booking failed" };
  }
}

// ─── Cancel Booking ───────────────────────────────────────────────────────────

export async function cancelBooking(bookingId: string): Promise<boolean> {
  try {
    await square.bookings.cancel({ bookingId });
    return true;
  } catch (error: any) {
    console.error("Square booking cancellation failed:", error?.message || error);
    return false;
  }
}

// ─── SMS Confirmation ──────────────────────────────────────────────────────────

async function sendBookingConfirmation(req: BookingRequest, bookingId: string): Promise<void> {
  if (!TWILIO_SID || !TWILIO_AUTH || !TWILIO_PHONE) {
    console.warn("Twilio not configured — skipping SMS confirmation");
    return;
  }

  const service = SERVICE_CATALOG[req.serviceKey];
  const stylist = req.stylistKey ? STYLIST_MAP[req.stylistKey]?.displayName : "next available stylist";

  const dateStr = new Date(`${req.date}T${req.time}:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const timeStr = formatTime(req.time);

  const message = `✅ Appointment Confirmed at PLAY Salon!\n\n` +
    `📋 ${service?.name || "Service"}\n` +
    `👩‍🎨 ${stylist}\n` +
    `📅 ${dateStr} at ${timeStr}\n` +
    `📍 4170 N High St, Columbus, OH\n\n` +
    `Booking ID: ${bookingId}\n` +
    `To cancel, call us at ${SALON_PHONE}\n\n` +
    `First visit? Enjoy 20% off! 🎉`;

  try {
    const client = twilio(TWILIO_SID, TWILIO_AUTH);
    await client.messages.create({
      body: message,
      from: TWILIO_PHONE,
      to: req.customerPhone,
    });
    console.log(`SMS confirmation sent to ${req.customerPhone}`);
  } catch (error: any) {
    console.error("SMS confirmation failed:", error?.message || error);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStylistBySquareId(squareId: string): string | undefined {
  for (const [key, stylist] of Object.entries(STYLIST_MAP)) {
    if (stylist.squareTeamMemberId === squareId) return stylist.displayName;
  }
  return undefined;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// ─── Dograh Webhook Endpoints ─────────────────────────────────────────────────

/**
 * These functions are called by the Dograh voice agent workflow
 * via HTTP webhook during a call.
 * 
 * The booking node in Dograh will POST to our Express server,
 * which calls these functions.
 */

/**
 * Check availability - called by Dograh during booking flow
 * POST /api/v1/voice/availability
 * Body: { serviceKey, date, stylistKey? }
 */
export async function handleAvailabilityCheck(body: {
  serviceKey: string;
  date: string;
  stylistKey?: string;
}): Promise<{ slots: AvailabilitySlot[] }> {
  try {
    const slots = await searchAvailability(body.serviceKey, body.date, body.stylistKey);
    return { slots };
  } catch (error: any) {
    return { slots: [] };
  }
}

/**
 * Create booking - called by Dograh during booking flow
 * POST /api/v1/voice/book
 * Body: BookingRequest
 */
export async function handleCreateBooking(body: BookingRequest): Promise<BookingResult> {
  return createBooking(body);
}

// ─── Catalog Sync (run once to map Square IDs) ────────────────────────────────

/**
 * Sync Square catalog items and team members to our local mappings.
 * Run this once when setting up a new salon.
 */
export async function syncSquareCatalog(): Promise<{
  services: number;
  stylists: number;
}> {
  let serviceCount = 0;
  let stylistCount = 0;

  try {
    // Sync catalog items (services)
    const catalogResult = await square.catalog.list({
      types: "ITEM",
      locationId: SQUARE_LOCATION_ID,
    });

    for await (const item of catalogResult) {
      if (!item.itemData?.name) continue;
      const name = item.itemData.name.toLowerCase();
      
      for (const [key, service] of Object.entries(SERVICE_CATALOG)) {
        if (name.includes(service.name.toLowerCase())) {
          // Map the first variation ID
          const variation = item.itemData.variations?.[0];
          if (variation?.itemVariationData?.itemId) {
            SERVICE_CATALOG[key].squareVariationId = variation.id;
            serviceCount++;
          }
        }
      }
    }

    // Sync team members (stylists)
    const teamResult = await square.teamMembers.list({
      locationId: SQUARE_LOCATION_ID,
    });

    for await (const member of teamResult) {
      if (!member.givenName) continue;
      const name = member.givenName.toLowerCase();

      for (const [key, stylist] of Object.entries(STYLIST_MAP)) {
        if (name.includes(key) || stylist.displayName.toLowerCase().includes(name)) {
          STYLIST_MAP[key].squareTeamMemberId = member.id;
          stylistCount++;
        }
      }
    }

    console.log(`Synced ${serviceCount} services and ${stylistCount} stylists from Square`);
  } catch (error: any) {
    console.error("Square catalog sync failed:", error?.message || error);
  }

  return { services: serviceCount, stylists: stylistCount };
}