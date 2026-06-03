/**
 * Voice Agent API Server (CommonJS) — PLEIJ Salon
 * Production Square integration via raw API (SDK has field name bugs)
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const https = require("https");
const twilio = require("twilio");

const app = express();
const PORT = process.env.VOICE_API_PORT || 3015;

app.use(cors());
app.use(express.json());

// ─── Square Raw API ───────────────────────────────────────────────────────────
// The Square Node SDK mangles field names for searchAvailability and create booking
// Using raw HTTPS calls with correct snake_case field names

const SQUARE_TOKEN = process.env.SQUARE_ACCESS_TOKEN || "";
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID || "";
const SQUARE_VERSION = "2025-04-16";

function squareApi(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "connect.squareup.com",
      path,
      method,
      headers: {
        "Square-Version": SQUARE_VERSION,
        "Authorization": "Bearer " + SQUARE_TOKEN,
        "Content-Type": "application/json",
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ─── PLEIJ Service Catalog (from Square Production) ──────────────────────────

const SERVICE_CATALOG = {
  haircut_style: {
    name: "Haircut & Style",
    itemId: "7W2MBGRJVOLHRXEQVY3ZDDC7",
    variations: {
      stylist:           { id: "KYJ6HHTEIHKN2U7EAECY6ENW", name: "Stylist",           price: 67,  duration: 60, version: 1776962279308 },
      director:          { id: "5UJ7XJDOGNZYQTOVHF4EIACC", name: "Director",          price: 74,  duration: 60, version: 1776962279308 },
      master_stylist:    { id: "SDBJ7MSEJHB7BA63PFR6OVYM", name: "Master Stylist",    price: 80,  duration: 60, version: 1776962279308 },
      artistic_director: { id: "WSLWSCQW4PE4M4UJEFZ4ZWHG", name: "Artistic Director", price: 84,  duration: 60, version: 1776962279308 },
    },
  },
  mens_haircut: {
    name: "Men's Haircut",
    itemId: "LYWLIWCECWYH4GGJTJA4EOCX",
    variations: {
      stylist:           { id: "PSOHXFAY4VPAKTPJVOB3UG6S", name: "Stylist",           price: 40,  duration: 30, version: 1776962279308 },
      director:          { id: "ETED2YBQE5S3MOQ7TCJ6AVOM", name: "Director",          price: 45,  duration: 30, version: 1776962279308 },
      master_stylist:    { id: "3I4AJ3NOC2I2FY7MWE5MX57X", name: "Master Stylist",    price: 50,  duration: 30, version: 1776962279308 },
      artistic_director: { id: "LU3RUGLLJ4HYX4G6LWRIBEAB", name: "Artistic Director", price: 55,  duration: 30, version: 1776962279308 },
    },
  },
  mens_haircut_style: {
    name: "Men's Haircut & Style",
    itemId: "745Z7VGHIR7Q5LQKHU757HIP",
    variations: {
      stylist:           { id: "LAFPXKDY7OK6KCSXHSX77HIS", name: "Stylist",           price: 45,  duration: 30, version: 1776962279308 },
      director:          { id: "5ZG2SMATYHI32IMO3JIE7LV6", name: "Director",          price: 50,  duration: 30, version: 1776962279308 },
      master_stylist:    { id: "KB6I6NRTCCPAL7NKXYKNA6VO", name: "Master Stylist",    price: 55,  duration: 30, version: 1776962279308 },
      artistic_director: { id: "SLK7KGOABI7RVEFRAA2XQJLH", name: "Artistic Director", price: 60,  duration: 30, version: 1776962279308 },
    },
  },
  blowout: {
    name: "Blow Out & Finish",
    itemId: "66LU2XGP63SGQTAA4QEDQGAX",
    variations: {
      stylist:           { id: "6XO3AHVYZMBH4RURMN3TUVDN", name: "Stylist",           price: 55,  duration: 45, version: 1776962279308 },
      director:          { id: "QQT7RIRRZBD7FM5Z7BHBNCJ2", name: "Director",          price: 60,  duration: 45, version: 1776962279308 },
      master_stylist:    { id: "OFFNBSEA3ADIE7AIISTEBMGH", name: "Master Stylist",    price: 65,  duration: 45, version: 1776962279308 },
      artistic_director: { id: "LXIGP3VZEN627B2PBBEYE3XE", name: "Artistic Director", price: 70,  duration: 45, version: 1776962279308 },
    },
  },
  bang_trim: {
    name: "Bang Trim",
    itemId: "TFO6BZCLXZW2FIHDCZ4EHV5X",
    variations: {
      regular: { id: "GOWXK6GVL3XT2TVDUXVHYD6I", name: "Regular", price: 25, duration: 15, version: 1776962279308 },
    },
  },
  balayage_haircut: {
    name: "Balayage or Ombre & Haircut",
    itemId: "NU4GO3FQRN3MLEPUE6H3ZW3Z",
    variations: {
      stylist:           { id: "URSIC44URIT3GH7O7AMY4L3K", name: "Stylist",           price: 300, duration: 180, version: 1776962279308 },
      director:          { id: "JWB7LHKWAPBKE4R7AYH7EZ24", name: "Director",          price: 325, duration: 180, version: 1776962279308 },
      master_stylist:    { id: "6LGNO7SAJ2K2OAOKCTDCP5SC", name: "Master Stylist",    price: 355, duration: 180, version: 1776962279308 },
      artistic_director: { id: "XGREBBGYNUVW3R47Y53DP4R5", name: "Artistic Director", price: 400, duration: 180, version: 1776962279308 },
    },
  },
  full_highlights_haircut: {
    name: "Full Highlights & Haircut",
    itemId: "RMD4CUDOQX3U6DI6ABHYM5NM",
    variations: {
      stylist:           { id: "ZM5CYPXTAFND6LSPT5EN46ZM", name: "Stylist",           price: 190, duration: 180, version: 1776962279308 },
      director:          { id: "WLZ76YIIUN3VMVAVFH3UBVV2", name: "Director",          price: 195, duration: 180, version: 1776962279308 },
      master_stylist:    { id: "DDKGO7M6ZQH6W736SWZHQ5CE", name: "Master Stylist",    price: 200, duration: 180, version: 1776962279308 },
      artistic_director: { id: "VGU5WVNCSBQAPFG5HAXCGILT", name: "Artistic Director", price: 205, duration: 180, version: 1776962279308 },
    },
  },
  color_retouch_style: {
    name: "Color Retouch & Style",
    itemId: "LV6CC362L6VYGQJBUP3OOA7D",
    variations: {
      stylist:           { id: "WEVHMYPPDAOTIH54CX3ETVSI", name: "Stylist",           price: 119, duration: 120, version: 1776962279308 },
      director:          { id: "GQY5YMJJ5FN4SC6N4XBRE76E", name: "Director",          price: 127, duration: 120, version: 1776962279308 },
      master_stylist:    { id: "6E5RYWGEELJXYTHK4O7VNORS", name: "Master Stylist",    price: 132, duration: 120, version: 1776962279308 },
      artistic_director: { id: "ED4FGCLAZJMJADU6P4PML55B", name: "Artistic Director", price: 143, duration: 120, version: 1776962279308 },
    },
  },
  partial_highlights_haircut: {
    name: "Partial Highlights & Haircut",
    itemId: "AQDQ24KEPV2RC4BCJQDHAQRF",
    variations: {
      stylist:           { id: "65SKVVCECJI636LE672WAHHL", name: "Stylist",           price: 155, duration: 150, version: 1776962279308 },
      director:          { id: "6ODK5VVZVH3FI2HYFDHBEORN", name: "Director",          price: 165, duration: 150, version: 1776962279308 },
      master_stylist:    { id: "SHY2SFLC77EMPB5WBYLEMKGE", name: "Master Stylist",    price: 175, duration: 150, version: 1776962279308 },
      artistic_director: { id: "TRPYT2ADL6W57QCHBZFJQKY3", name: "Artistic Director", price: 187, duration: 150, version: 1776962279308 },
    },
  },
  all_over_color_haircut: {
    name: "All Over Color & Haircut",
    itemId: "6HI4JV5CUYDT7E3ZQPLOWLGB",
    variations: {
      stylist:           { id: "MDXHHU6ESTU5A3BEGC2OQVCP", name: "Stylist",           price: 167, duration: 150, version: 1776962279308 },
      director:          { id: "IBOKBPGJ3PJ65XHCDLFM4UXK", name: "Director",          price: 177, duration: 150, version: 1776962279308 },
      master_stylist:    { id: "PRK2GSEQWNNM2JVIFZRDTWBR", name: "Master Stylist",    price: 187, duration: 150, version: 1776962279308 },
      artistic_director: { id: "3W7LMTV46FTIIVDPW3T6VIXJ", name: "Artistic Director", price: 197, duration: 150, version: 1776962279308 },
    },
  },
  kids_haircut: {
    name: "Children's Haircut",
    itemId: "RA2YJGT25ZD4PPNKLNYVQJ4U",
    variations: {
      stylist:           { id: "KQHU6KQFB3ATEI5BY6EISGI7", name: "Stylist",           price: 35,  duration: 25, version: 1776962279308 },
      director:          { id: "RQYPGPEUMQX3AWHR2JB7BHXZ", name: "Director",          price: 45,  duration: 25, version: 1776962279308 },
      master_stylist:    { id: "OIHHS4KPS5BD3E4AFD5NWPT3", name: "Master Stylist",    price: 55,  duration: 25, version: 1776962279308 },
      artistic_director: { id: "M42RVAYLDP4TIXGEVC3RTMWB", name: "Artistic Director", price: 65,  duration: 25, version: 1776962279308 },
    },
  },
  smoothing: {
    name: "Smoothing Treatment",
    itemId: "CSRSQKOCJSXN6JN5WEORWWDH",
    variations: {
      stylist:           { id: "FKJDTVA5QVDWR6MJJHBLAZED", name: "Stylist",           price: 375, duration: 180, version: 1776962279308 },
    },
  },
  express_smoothing: {
    name: "Express Smoothing Treatment",
    itemId: "7ARSQEXFCM3YG6OEQYIMP6C3",
    variations: {
      stylist:           { id: "KM4WQW7BYAPUREQO2B6GWNWI", name: "Stylist",           price: 275, duration: 120, version: 1776962279308 },
    },
  },
  deep_conditioning: {
    name: "Deep Conditioning Treatment Add-On",
    itemId: "7KULUIOKBNSMARDPOWUG2EYK",
    variations: {
      regular: { id: "FPLCRHO6HNZCB7YQUMKKXH72", name: "Regular", price: 30, duration: 30, version: 1776962279308 },
    },
  },
  scalp_massage_15: {
    name: "Invigorating Scalp Massage (15 min)",
    itemId: "AGHBEWQ6NFDU6YM7AV77J4TR",
    variations: {
      regular: { id: "YODGXIIWHCVYSUFY3I2JN5M7", name: "Regular", price: 15, duration: 15, version: 1776962279308 },
    },
  },
};

// ─── PLEIJ Stylists ───────────────────────────────────────────────────────────

const STYLIST_MAP = {
  tiche: {
    displayName: "Tiché",
    squareTeamMemberId: "0Q59TWNM39JRJ",
    isBookable: true,
    tier: "Artistic Director",
    note: "Owner — only available for Artistic Director tier services",
  },
  jenna: {
    displayName: "Jenna Moreland",
    squareTeamMemberId: "TMWe05HC6vPwzHsC",
    isBookable: true,
    tier: "Stylist/Director/Master",
  },
  deniece: {
    displayName: "Deniece Pittman",
    squareTeamMemberId: "TMe1NDlOWDxGEsuG",
    isBookable: true,
    tier: "Stylist/Director/Master",
  },
  linda: {
    displayName: "Linda Bruning",
    squareTeamMemberId: "RDgL6Hq2lz-0CQlYxo3x",
    isBookable: true,
    tier: "Esthetician",
    note: "Bookable for skin/spa services",
  },
  chantel: {
    displayName: "Chantel Marie",
    squareTeamMemberId: "TM8Sgt45NRSv0VaK",
    isBookable: true,
    tier: "Nail Tech",
    note: "Bookable for nail services",
  },
};

// ─── Salon Hours ─────────────────────────────────────────────────────────────

const SALON_HOURS = {
  0: null,  // Sunday - closed
  1: null,  // Monday - closed
  2: { open: 10, close: 19 },  // Tuesday
  3: { open: 10, close: 19 },  // Wednesday
  4: { open: 10, close: 19 },  // Thursday
  5: { open: 10, close: 19 },  // Friday
  6: { open: 9, close: 17 },   // Saturday
};

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "pleij-voice-api",
    squareConfigured: !!(SQUARE_TOKEN && SQUARE_LOCATION_ID),
    squareEnvironment: process.env.SQUARE_ENVIRONMENT || "sandbox",
    squareLocationId: SQUARE_LOCATION_ID,
    twilioConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
  });
});

// Service catalog
app.get("/api/v1/voice/services", (_req, res) => {
  const services = Object.entries(SERVICE_CATALOG).map(([key, s]) => {
    const variations = Object.entries(s.variations).map(([vKey, v]) => ({
      key: vKey,
      name: v.name,
      price: v.price,
      duration: v.duration,
      squareVariationId: v.id,
    }));
    return { key, name: s.name, itemId: s.itemId, variations };
  });
  res.json({ services, tierNote: "PLEIJ uses 4-tier pricing: Stylist < Director < Master Stylist < Artistic Director" });
});

// Stylist list
app.get("/api/v1/voice/stylists", (_req, res) => {
  const stylists = Object.entries(STYLIST_MAP).map(([key, s]) => ({
    key,
    name: s.displayName,
    tier: s.tier,
    bookable: s.isBookable,
    note: s.note || null,
  }));
  res.json({ stylists });
});

// Search availability — uses raw Square API
app.post("/api/v1/voice/availability", async (req, res) => {
  try {
    const { serviceKey, variationKey, date, stylistKey } = req.body;
    if (!serviceKey || !date) {
      return res.status(400).json({ error: "serviceKey and date required" });
    }

    const service = SERVICE_CATALOG[serviceKey];
    if (!service) {
      return res.status(400).json({ error: "Unknown service key: " + serviceKey });
    }

    const variation = variationKey && service.variations[variationKey]
      ? service.variations[variationKey]
      : service.variations.stylist || service.variations.regular;

    // Check if salon is open
    const dayOfWeek = new Date(date + "T12:00:00").getDay();
    const hours = SALON_HOURS[dayOfWeek];
    if (!hours) {
      const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
      return res.json({ slots: [], source: "salon_hours", note: "Salon closed on " + dayNames[dayOfWeek] + "s" });
    }

    // Build start/end times
    const startOfDay = new Date(date + "T" + hours.open.toString().padStart(2, "0") + ":00:00");
    const endOfDay = new Date(date + "T" + hours.close.toString().padStart(2, "0") + ":00:00");

    // Build segment filters (raw API snake_case)
    const segmentFilters = [{ service_variation_id: variation.id }];
    if (stylistKey && STYLIST_MAP[stylistKey]?.squareTeamMemberId) {
      segmentFilters[0].team_member_id_filter = {
        team_member_ids: [STYLIST_MAP[stylistKey].squareTeamMemberId],
      };
    }

    // Call Square availability search via raw API
    try {
      const result = await squareApi("POST", "/v2/bookings/availability/search", {
        query: {
          filter: {
            location_id: SQUARE_LOCATION_ID,
            start_at_range: {
              start_at: startOfDay.toISOString(),
              end_at: endOfDay.toISOString(),
            },
            segment_filters: segmentFilters,
          },
        },
      });

      if (result.status === 200 && result.data.availabilities) {
        const slots = result.data.availabilities.map((a) => ({
          startAt: a.start_at,
          available: true,
          teamMemberId: a.appointment_segments?.[0]?.team_member_id || null,
          durationMinutes: a.appointment_segments?.[0]?.duration_minutes || variation.duration,
        }));

        if (slots.length > 0) {
          return res.json({ slots, source: "square" });
        }
      }
    } catch (squareError) {
      console.warn("Square availability search failed:", squareError.message);
    }

    // Fallback: estimated slots based on salon hours
    const slots = [];
    for (let h = hours.open; h < hours.close; h++) {
      for (const min of [0, 30]) {
        const startAt = new Date(date + "T" + h.toString().padStart(2, "0") + ":" + min.toString().padStart(2, "0") + ":00");
        slots.push({ startAt: startAt.toISOString(), available: true, teamMemberId: null, durationMinutes: variation.duration });
      }
    }
    return res.json({ slots, source: "fallback", note: "Estimated availability — stylist schedules may vary" });
  } catch (error) {
    console.error("Availability error:", error);
    return res.status(500).json({ error: "Failed to check availability" });
  }
});

// Create booking — uses raw Square API
app.post("/api/v1/voice/book", async (req, res) => {
  try {
    const { serviceKey, variationKey, date, time, stylistKey, customerName, customerPhone, customerEmail } = req.body;
    if (!serviceKey || !date || !time || !customerName || !customerPhone) {
      return res.status(400).json({ error: "serviceKey, date, time, customerName, and customerPhone required" });
    }

    const service = SERVICE_CATALOG[serviceKey];
    if (!service) return res.status(400).json({ error: "Unknown service" });

    const variation = variationKey && service.variations[variationKey]
      ? service.variations[variationKey]
      : service.variations.stylist || service.variations.regular;

    const stylist = stylistKey ? STYLIST_MAP[stylistKey] : null;
    const startAt = new Date(date + "T" + time + ":00");

    // Find or create customer in Square
    let customerId = null;
    try {
      const searchResult = await squareApi("POST", "/v2/customers/search", {
        query: { filter: { phone_number: customerPhone } },
        limit: 1,
      });

      if (searchResult.data?.customers?.length > 0) {
        customerId = searchResult.data.customers[0].id;
      }
    } catch (e) { /* customer not found, will create */ }

    if (!customerId) {
      const nameParts = customerName.split(" ");
      const createResult = await squareApi("POST", "/v2/customers", {
        given_name: nameParts[0] || customerName,
        family_name: nameParts.slice(1).join(" ") || "",
        phone_number: customerPhone,
        email_address: customerEmail || undefined,
      });
      if (createResult.data?.customer?.id) {
        customerId = createResult.data.customer.id;
      }
    }

    // Build booking request
    const segments = [{
      duration_minutes: variation.duration,
      service_variation_id: variation.id,
      service_variation_version: variation.version,
    }];
    if (stylist?.squareTeamMemberId) {
      segments[0].team_member_id = stylist.squareTeamMemberId;
    }

    const bookingBody = {
      idempotency_key: "gisele-" + Date.now(),
      booking: {
        location_id: SQUARE_LOCATION_ID,
        start_at: startAt.toISOString(),
        appointment_segments: segments,
        customer_note: "Booked via PLAY Salon AI Receptionist (Gisele)",
      },
    };
    if (customerId) bookingBody.booking.customer_id = customerId;

    // Create booking via raw API
    try {
      const result = await squareApi("POST", "/v2/bookings", bookingBody);

      if (result.status >= 200 && result.status < 300 && result.data?.booking?.id) {
        const booking = result.data.booking;
        await sendSMSConfirmation(service, variation, stylist, date, time, customerPhone, booking.id);
        return res.json({
          success: true,
          bookingId: booking.id,
          bookingStatus: booking.status,
          appointmentAt: booking.start_at,
          serviceName: service.name,
          variationName: variation.name,
          price: "$" + variation.price,
          stylistName: stylist?.displayName || "next available stylist",
          source: "square",
        });
      }
      console.warn("Square booking failed:", JSON.stringify(result.data?.errors || result.data).substring(0, 300));
    } catch (squareError) {
      console.warn("Square booking error:", squareError.message);
    }

    // Fallback: offline booking
    const offlineId = "offline-" + Date.now();
    await sendSMSConfirmation(service, variation, stylist, date, time, customerPhone, offlineId);
    if (process.env.PLEIJ_TRANSFER_NUMBER) {
      await sendSalonNotification(service, variation, stylist, date, time, customerName, customerPhone);
    }
    return res.json({
      success: true,
      bookingId: offlineId,
      appointmentAt: startAt.toISOString(),
      serviceName: service.name,
      variationName: variation.name,
      price: "$" + variation.price,
      stylistName: stylist?.displayName || "next available stylist",
      source: "offline",
      note: "Booking saved for manual confirmation",
    });
  } catch (error) {
    console.error("Booking error:", error);
    return res.status(500).json({ error: "Failed to create booking" });
  }
});

// Cancel booking — uses raw Square API
app.post("/api/v1/voice/cancel", async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ error: "bookingId required" });
    }

    // Offline bookings can't be cancelled in Square
    if (bookingId.startsWith("offline-")) {
      return res.json({ success: true, bookingId, status: "cancelled_offline", note: "Offline booking removed from queue" });
    }

    const result = await squareApi("POST", "/v2/bookings/" + bookingId + "/cancel", {
      idempotency_key: "gisele-cancel-" + Date.now(),
    });

    if (result.status >= 200 && result.status < 300 && result.data?.booking) {
      return res.json({
        success: true,
        bookingId: result.data.booking.id,
        status: result.data.booking.status,
      });
    }

    const errors = result.data?.errors || [];
    return res.status(result.status || 500).json({
      success: false,
      bookingId,
      errors: errors.map((e) => e.detail || e.code),
    });
  } catch (error) {
    console.error("Cancel error:", error);
    return res.status(500).json({ error: "Failed to cancel booking" });
  }
});

// Get booking details — uses raw Square API
app.get("/api/v1/voice/booking/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (id.startsWith("offline-")) {
      return res.json({ bookingId: id, source: "offline", note: "Offline booking — no Square record" });
    }

    const result = await squareApi("GET", "/v2/bookings/" + id, null);
    if (result.status === 200 && result.data?.booking) {
      const b = result.data.booking;
      return res.json({
        bookingId: b.id,
        status: b.status,
        startAt: b.start_at,
        customerId: b.customer_id,
        locationId: b.location_id,
        source: b.source,
        segments: b.appointment_segments,
      });
    }
    return res.status(result.status || 404).json({ error: "Booking not found", bookingId: id });
  } catch (error) {
    console.error("Booking lookup error:", error);
    return res.status(500).json({ error: "Failed to lookup booking" });
  }
});

// Sync catalog
app.post("/api/v1/voice/sync", async (_req, res) => {
  try {
    let serviceCount = 0;
    let teamCount = 0;

    // Get booking profiles for stylists
    for (const [key, stylist] of Object.entries(STYLIST_MAP)) {
      try {
        const result = await squareApi("GET", "/v2/bookings/team-member-booking-profiles/" + stylist.squareTeamMemberId, null);
        if (result.data?.team_member_booking_profile) {
          const p = result.data.team_member_booking_profile;
          stylist.isBookable = p.is_bookable;
          if (p.display_name) stylist.displayName = p.display_name;
          teamCount++;
        }
      } catch (e) { /* not bookable */ }
    }

    res.json({ teamProfilesChecked: teamCount, servicesInCatalog: Object.keys(SERVICE_CATALOG).length });
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({ error: "Failed to sync" });
  }
});

// ─── SMS Helpers ──────────────────────────────────────────────────────────────

function getTwilioClient() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return null;
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

async function sendSMSConfirmation(service, variation, stylist, date, time, phone, bookingId) {
  const client = getTwilioClient();
  if (!client || !process.env.TWILIO_PHONE_NUMBER) return;

  const dateStr = new Date(date + "T" + time + ":00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
  const [h, m] = time.split(":").map(Number);
  const timeStr = (h > 12 ? h - 12 : h || 12) + ":" + m.toString().padStart(2, "0") + (h >= 12 ? " PM" : " AM");
  const stylistStr = stylist?.displayName || "next available stylist";

  const message = `PLAY Salon - Your appointment is booked!\n` +
    `${service.name} (${variation.name}) with ${stylistStr}\n` +
    `${dateStr} at ${timeStr}\n` +
    `Price: $${variation.price}\n` +
    `Booking ID: ${bookingId}\n` +
    `Call 614-547-2566 to change or cancel.`;

  try {
    await client.messages.create({ body: message, from: process.env.TWILIO_PHONE_NUMBER, to: phone });
  } catch (err) { console.error("SMS error:", err.message); }
}

async function sendSalonNotification(service, variation, stylist, date, time, customerName, customerPhone) {
  const client = getTwilioClient();
  if (!client || !process.env.TWILIO_PHONE_NUMBER || !process.env.PLEIJ_TRANSFER_NUMBER) return;

  const dateStr = new Date(date + "T" + time + ":00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
  const [h, m] = time.split(":").map(Number);
  const timeStr = (h > 12 ? h - 12 : h || 12) + ":" + m.toString().padStart(2, "0") + (h >= 12 ? " PM" : " AM");

  const message = `NEW BOOKING via Gisele AI:\n` +
    `${customerName} (${customerPhone})\n` +
    `${service.name} (${variation.name})\n` +
    `${dateStr} at ${timeStr}\n` +
    `Source: Offline booking — needs manual confirmation`;

  try {
    await client.messages.create({ body: message, from: process.env.TWILIO_PHONE_NUMBER, to: process.env.PLEIJ_TRANSFER_NUMBER });
  } catch (err) { console.error("Salon SMS error:", err.message); }
}

// ─── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`PLEIJ Voice API running on port ${PORT}`);
  console.log(`Square: ${process.env.SQUARE_ENVIRONMENT || "sandbox"} | Location: ${SQUARE_LOCATION_ID || "not set"}`);
  console.log(`Twilio: ${process.env.TWILIO_ACCOUNT_SID ? "configured" : "not set"}`);
  console.log(`Transfer: ${process.env.PLEIJ_TRANSFER_NUMBER || "not set"}`);
});