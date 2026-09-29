import Fastify from "fastify";
import cors from "@fastify/cors";

const server = Fastify({ logger: true });

await server.register(cors, { origin: true });

// ─── Muse Health Check ─────────────────────────────────────────────────────
server.get("/muse/health", async () => ({
  status: "connected",
  version: "1.0.0",
  salon: "PLEIJ Salon",
  capabilities: ["booking", "availability_check", "service_inquiry", "pricing"]
}));

// ─── Muse Query Endpoint ───────────────────────────────────────────────────
server.post("/muse/query", async (request) => {
  const { intent } = request.body as any;
  
  switch (intent) {
    case "get_services":
      return {
        success: true,
        data: {
          services: [
            { name: "Haircut", duration: 45, price: "$45+" },
            { name: "Color & Highlights", duration: 120, price: "$120+" },
            { name: "Balayage", duration: 180, price: "$200+" },
            { name: "Extensions", duration: 240, price: "$300+" },
            { name: "Treatments", duration: 60, price: "$60+" },
            { name: "Bridal Styling", duration: 120, price: "$150+" }
          ]
        }
      };
      
    case "get_hours":
      return {
        success: true,
        data: {
          hours: {
            monday: "9:00-19:00",
            tuesday: "9:00-19:00",
            wednesday: "9:00-19:00",
            thursday: "9:00-19:00",
            friday: "9:00-19:00",
            saturday: "9:00-17:00",
            sunday: "closed"
          }
        }
      };
      
    case "get_location":
      return {
        success: true,
        data: {
          name: "PLEIJ Salon",
          address: "1279 Polaris Parkway, Columbus, OH 43240",
          phone: "614-665-1751",
          website: "https://pleijsalon.com"
        }
      };
      
    case "check_availability":
      return {
        success: true,
        data: {
          available_slots: [
            { date: "2026-09-28", time: "10:00", duration: 60 },
            { date: "2026-09-28", time: "14:00", duration: 60 },
            { date: "2026-09-29", time: "11:00", duration: 60 },
          ]
        }
      };
      
    case "book_appointment":
      return {
        success: true,
        requires_approval: true,
        message: "Booking request received. Awaiting confirmation.",
        data: { booking_id: "pleij_" + Date.now() }
      };
      
    default:
      return { success: false, message: "Unknown intent: " + intent };
  }
});

// ─── Salon Data Endpoint ────────────────────────────────────────────────────
server.get("/muse/salon/:id", async (request) => {
  const { id } = request.params as { id: string };
  return {
    id,
    name: "PLEIJ Salon",
    industry: "hair salon",
    location: {
      address: "1279 Polaris Parkway, Columbus, OH 43240",
      city: "Columbus",
      state: "OH",
      zip: "43240"
    },
    contact: {
      phone: "614-665-1751",
      email: "info@pleijsalon.com",
      website: "https://pleijsalon.com"
    },
    hours: {
      monday: "9:00-19:00",
      tuesday: "9:00-19:00",
      wednesday: "9:00-19:00",
      thursday: "9:00-19:00",
      friday: "9:00-19:00",
      saturday: "9:00-17:00",
      sunday: "closed"
    },
    services: [
      { name: "Haircut", duration: 45, price: "$45+", category: "cuts" },
      { name: "Color & Highlights", duration: 120, price: "$120+", category: "color" },
      { name: "Balayage", duration: 180, price: "$200+", category: "color" },
      { name: "Extensions", duration: 240, price: "$300+", category: "extensions" },
      { name: "Treatments", duration: 60, price: "$60+", category: "treatments" },
      { name: "Bridal Styling", duration: 120, price: "$150+", category: "events" }
    ],
    booking: {
      requires_approval: true,
      advance_notice_hours: 24,
      cancellation_policy: "24 hours notice required"
    }
  };
});

// ─── Start Server ──────────────────────────────────────────────────────────
const PORT = process.env.MUSE_PORT || 3456;

server.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`🎭 Muse connector running on http://localhost:${PORT}`);
  console.log(`📍 PLEIJ Salon endpoints ready`);
});
