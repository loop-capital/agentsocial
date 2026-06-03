/**
 * Voice Agent API Server
 * 
 * Provides webhook endpoints for Dograh to call during voice conversations.
 * Handles availability checks, booking creation, and SMS confirmations.
 * 
 * Port: 3015 (exposed as 3015:3015)
 */

import express from "express";
import cors from "cors";
import {
  handleAvailabilityCheck,
  handleCreateBooking,
  syncSquareCatalog,
  SERVICE_CATALOG,
  STYLIST_MAP,
} from "./square-booking.js";

const app = express();
const PORT = process.env.VOICE_API_PORT || 3015;

app.use(cors());
app.use(express.json());

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "pleij-voice-api",
    squareConfigured: !!(process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID),
    twilioConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
  });
});

// ─── Availability Check ───────────────────────────────────────────────────────

app.post("/api/v1/voice/availability", async (req, res) => {
  try {
    const { serviceKey, date, stylistKey } = req.body;
    
    if (!serviceKey || !date) {
      res.status(400).json({ error: "serviceKey and date required" });
      return;
    }

    const result = await handleAvailabilityCheck({ serviceKey, date, stylistKey });
    res.json(result);
  } catch (error: any) {
    console.error("Availability check error:", error?.message || error);
    res.status(500).json({ error: "Failed to check availability" });
  }
});

// ─── Create Booking ───────────────────────────────────────────────────────────

app.post("/api/v1/voice/book", async (req, res) => {
  try {
    const { serviceKey, date, time, stylistKey, customerName, customerPhone, customerEmail } = req.body;
    
    if (!serviceKey || !date || !time || !customerName || !customerPhone) {
      res.status(400).json({ 
        error: "serviceKey, date, time, customerName, and customerPhone required" 
      });
      return;
    }

    const result = await handleCreateBooking({
      serviceKey,
      date,
      time,
      stylistKey,
      customerName,
      customerPhone,
      customerEmail,
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    console.error("Booking creation error:", error?.message || error);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// ─── Service Catalog (for Dograh to reference) ───────────────────────────────

app.get("/api/v1/voice/services", (_req, res) => {
  const services = Object.entries(SERVICE_CATALOG).map(([key, s]) => ({
    key,
    name: s.name,
    duration: s.duration,
    price: s.price,
  }));
  res.json({ services });
});

// ─── Stylist List ─────────────────────────────────────────────────────────────

app.get("/api/v1/voice/stylists", (_req, res) => {
  const stylists = Object.entries(STYLIST_MAP).map(([key, s]) => ({
    key,
    name: s.displayName,
  }));
  res.json({ stylists });
});

// ─── Catalog Sync ────────────────────────────────────────────────────────────

app.post("/api/v1/voice/sync", async (_req, res) => {
  try {
    const result = await syncSquareCatalog();
    res.json(result);
  } catch (error: any) {
    console.error("Catalog sync error:", error?.message || error);
    res.status(500).json({ error: "Failed to sync catalog" });
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🎙️ PLEIJ Voice API running on port ${PORT}`);
  console.log(`   Square: ${process.env.SQUARE_ACCESS_TOKEN ? "configured" : "not configured"}`);
  console.log(`   Twilio: ${process.env.TWILIO_ACCOUNT_SID ? "configured" : "not configured"}`);
});