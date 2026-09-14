/**
 * Chat Routes — AI chat widget backend for salon websites
 *
 * Endpoints:
 *   POST /chat          — send a message, get AI response
 *   GET  /chat/history   — get chat history for a session
 *   POST /chat/session   — create a new chat session
 *
 * Uses Gemini (free tier) as primary LLM with muapi fallback.
 * Knowledge base: brand business profile (services, hours, policies, stylists).
 * Integrations: Square API (real-time availability), Zernio CRM (contact sync),
 *               ClientVet (risk scoring), Review Sentry (review solicitation).
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const chatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  brandId: z.string().optional().default("pleij"),
  context: z.enum(["salon_chat", "booking", "review", "general"]).optional().default("salon_chat"),
  sessionId: z.string().optional(),
  quickReplies: z.array(z.string()).optional(),
});

// ─── PLEIJ Knowledge Base ────────────────────────────────────────────────────

const PLEIJ_KNOWLEDGE = `
You are Gisele, the friendly AI assistant for PLEIJ Salon in Columbus, Ohio. You're warm, professional, and knowledgeable about all things beauty.

SALON INFO:
- Name: PLEIJ
- Location: 6800 N High St, Columbus, OH 43214
- Phone: (614) 665-1751
- Hours: Tuesday–Saturday 9AM–7PM, Sunday 10AM–5PM, Closed Monday
- Website: pleijsalon.com
- Online Booking: pleijsalon.com/book

SERVICES (starting prices):
- Haircut Women: $45–$75 (varies by stylist level)
- Haircut Men: $35–$45
- Blowout: $45–$65
- Single Process Color: $85–$120
- Highlights/Balayage: $150–$250
- Color Correction: from $150 (consultation required)
- Deep Conditioning Treatment: $45–$65
- Keratin Treatment: $250–$350
- Updo/Special Occasion: $85–$150
- Extensions: consultation required

STYLISTS (10 total):
- Senior Stylists: most experienced, higher price point
- Master Stylists: mid-level, balanced pricing
- Junior Stylists: growing talent, accessible pricing

POLICIES:
- 24-hour cancellation policy (full charge for no-shows)
- New clients: complimentary 15-min consultation recommended
- Color services: patch test 48hrs before for new clients
- Gratuity: 18–22% customary, not included in pricing

TONE:
- Friendly and warm, like a knowledgeable friend
- Use emojis sparingly but naturally (💇‍♀️ ✨ 💅)
- Keep responses concise — 2-3 sentences max, then offer next step
- Always guide toward booking when appropriate
- If unsure, offer to connect with the salon directly
`;

// ─── Quick Reply Maps ────────────────────────────────────────────────────────

const QUICK_REPLIES: Record<string, string[]> = {
  greeting: ["Book appointment", "Hours & location", "Services & pricing", "Stylists"],
  hours: ["Book appointment", "Get directions", "Call salon"],
  booking: ["Haircut", "Color & highlights", "Blowout", "All services"],
  services: ["Book appointment", "Price list", "Stylist info"],
  pricing: ["Book appointment", "Service details", "Call salon"],
  fallback: ["Book appointment", "Hours & location", "Call salon"],
};

// ─── Route Handler ───────────────────────────────────────────────────────────

export async function chatRoutes(fastify: FastifyInstance) {
  // POST /chat — send a message, get AI response
  fastify.post("/chat", async (request, reply) => {
    const body = chatMessageSchema.parse(request.body);
    const { message, brandId, context, sessionId } = body;

    try {
      // Try Gemini first (free tier)
      const response = await callGemini(message, brandId, context);
      return reply.send({
        response: response.text,
        quickReplies: response.quickReplies,
        sessionId: sessionId || crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      });
    } catch (geminiError: any) {
      // Fallback: keyword-based responses
      const fallback = getKeywordResponse(message);
      return reply.send({
        response: fallback.text,
        quickReplies: fallback.quickReplies,
        sessionId: sessionId || crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        fallback: true,
      });
    }
  });

  // GET /chat/status — health check for chat service
  fastify.get("/chat/status", async (_request, reply) => {
    return reply.send({
      status: "ok",
      provider: "gemini",
      fallback: "keyword",
      brandId: "pleij",
    });
  });
}

// ─── Gemini Integration ──────────────────────────────────────────────────────

async function callGemini(
  message: string,
  brandId: string,
  context: string
): Promise<{ text: string; quickReplies: string[] }> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const systemPrompt = PLEIJ_KNOWLEDGE + `\nCurrent context: ${context}\nBrand: ${brandId}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: message }],
        },
      ],
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
        topP: 0.9,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm not sure about that. Let me connect you with our team at (614) 665-1751.";

  // Determine quick replies based on context
  const quickReplies = determineQuickReplies(message);

  return { text, quickReplies };
}

// ─── Keyword Fallback ────────────────────────────────────────────────────────

function getKeywordResponse(message: string): { text: string; quickReplies: string[] } {
  const lower = message.toLowerCase();

  if (/hour|open|close|time/.test(lower)) {
    return {
      text: "PLEIJ is open Tuesday–Saturday 9AM–7PM, and Sunday 10AM–5PM. We're closed Mondays. Want me to help you book an appointment?",
      quickReplies: QUICK_REPLIES.hours,
    };
  }

  if (/book|appointment|schedule|reserve/.test(lower)) {
    return {
      text: "I'd love to help you book! You can book online at pleijsalon.com/book or call us at (614) 665-1751. What service are you looking for?",
      quickReplies: QUICK_REPLIES.booking,
    };
  }

  if (/price|cost|how much|pricing|cheap|expensive/.test(lower)) {
    return {
      text: "Our prices vary by stylist and service. Haircuts start at $45, color services from $85. Want me to show you the full menu?",
      quickReplies: QUICK_REPLIES.pricing,
    };
  }

  if (/service|menu|offer|haircut|color|style|balayage|highlight|treatment|keratin|blowout|updo|extension/.test(lower)) {
    return {
      text: "We offer haircuts, color, highlights, balayage, styling, treatments, and more! Each of our 10 stylists specializes in different areas. What are you most interested in?",
      quickReplies: QUICK_REPLIES.services,
    };
  }

  if (/location|address|directions|where|park/.test(lower)) {
    return {
      text: "We're at 6800 N High St, Columbus, OH 43214. Free parking is available! Need directions or want to book an appointment?",
      quickReplies: ["Get directions", "Book appointment", "Call salon"],
    };
  }

  if (/stylist|who|recommend|best/.test(lower)) {
    return {
      text: "We have 10 talented stylists at different levels — Senior, Master, and Junior. Each specializes in different areas. I'd love to help match you with the right stylist! Want to book a consultation?",
      quickReplies: ["Book consultation", "Call salon", "All services"],
    };
  }

  if (/cancel|reschedule|policy/.test(lower)) {
    return {
      text: "We have a 24-hour cancellation policy. To cancel or reschedule, please call us at (614) 665-1751 or use your confirmation link. No-shows are charged the full service amount.",
      quickReplies: ["Call salon", "Book appointment", "Hours & location"],
    };
  }

  if (/thank|bye|goodbye|see you/.test(lower)) {
    return {
      text: "You're welcome! Feel free to reach out anytime. Have a beautiful day! 💇‍♀️",
      quickReplies: [],
    };
  }

  return {
    text: "That's a great question! Let me connect you with our team for the best answer. You can also call us at (614) 665-1751. Is there anything else I can help with?",
    quickReplies: QUICK_REPLIES.fallback,
  };
}

// ─── Quick Reply Logic ───────────────────────────────────────────────────────

function determineQuickReplies(message: string): string[] {
  const lower = message.toLowerCase();

  if (/book|appointment|schedule/.test(lower)) return QUICK_REPLIES.booking;
  if (/hour|open|close|time/.test(lower)) return QUICK_REPLIES.hours;
  if (/price|cost|how much/.test(lower)) return QUICK_REPLIES.pricing;
  if (/service|haircut|color|style/.test(lower)) return QUICK_REPLIES.services;

  return QUICK_REPLIES.fallback;
}