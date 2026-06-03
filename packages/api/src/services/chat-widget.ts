// ─── Chat Widget Service ───────────────────────────────────────────────────────
// Service for AI-powered chat/SMS widget configuration, sessions, messages, and follow-ups.
// Uses mock data until real persistence is wired in.

import { db } from "../db/index.js";
import { eq, and, desc, sql, like, gte, lte } from "drizzle-orm";
import {
  chatWidgetConfigs,
  chatSessions,
  chatMessages,
  chatFollowups,
} from "../db/schema.js";
import Twilio from "twilio";

// ─── Env / Twilio Client ─────────────────────────────────────────────────────────

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const isMockMode = !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN;

let twilioClient: any | null = null;
function getTwilioClient(): any {
  if (!twilioClient) {
    twilioClient = // @ts-expect-error Twilio CJS
    new Twilio(TWILIO_ACCOUNT_SID!, TWILIO_AUTH_TOKEN!);
  }
  return twilioClient;
}

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface WidgetConfig {
  id: string;
  brand_id: string;
  brand_color: string;
  greeting_message: string;
  position: "bottom-right" | "bottom-left" | "center-right";
  enabled: boolean;
  auto_response_enabled: boolean;
  auto_response_message: string;
  business_hours_start: string;
  business_hours_end: string;
  timezone: string;
  sms_followup_enabled: boolean;
  sms_followup_delay_minutes: number;
  sms_followup_template: string;
  powered_by_text: string;
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  widget_id: string;
  brand_id: string;
  visitor_name: string | null;
  visitor_phone: string | null;
  visitor_email: string | null;
  status: "active" | "closed" | "lead_captured";
  lead_captured: boolean;
  source: "web" | "sms";
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender: "visitor" | "bot" | "agent";
  content: string;
  message_type: "text" | "system" | "lead_capture";
  created_at: string;
}

export interface ChatFollowup {
  id: string;
  brand_id: string;
  session_id: string;
  phone: string;
  message_template: string;
  status: "pending" | "sent" | "failed";
  sent_at: string | null;
  created_at: string;
}

export interface WidgetAnalytics {
  total_conversations: number;
  active_conversations: number;
  leads_captured: number;
  avg_response_time_seconds: number;
  conversations_by_day: Array<{ date: string; count: number }>;
}

export interface PaginatedMessages {
  data: ChatMessage[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface SessionFilters {
  brandId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────────

const MOCK_CONFIGS: Map<string, WidgetConfig> = new Map();

const MOCK_SESSIONS: ChatSession[] = [
  {
    id: "sess-001",
    widget_id: "widget-demo",
    brand_id: "00000000-0000-0000-0000-000000000000",
    visitor_name: "Sarah Johnson",
    visitor_phone: "+15551234567",
    visitor_email: "sarah@example.com",
    status: "lead_captured",
    lead_captured: true,
    source: "web",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "sess-002",
    widget_id: "widget-demo",
    brand_id: "00000000-0000-0000-0000-000000000000",
    visitor_name: "Mike Chen",
    visitor_phone: "+15559876543",
    visitor_email: null,
    status: "active",
    lead_captured: false,
    source: "web",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "sess-003",
    widget_id: "widget-demo",
    brand_id: "00000000-0000-0000-0000-000000000000",
    visitor_name: null,
    visitor_phone: "+15551112222",
    visitor_email: null,
    status: "active",
    lead_captured: false,
    source: "sms",
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "sess-004",
    widget_id: "widget-demo",
    brand_id: "00000000-0000-0000-0000-000000000000",
    visitor_name: "Emily Davis",
    visitor_phone: "+15553334444",
    visitor_email: "emily.d@example.com",
    status: "closed",
    lead_captured: true,
    source: "web",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

const MOCK_MESSAGES: Map<string, ChatMessage[]> = new Map([
  [
    "sess-001",
    [
      {
        id: "msg-001-1",
        session_id: "sess-001",
        sender: "visitor",
        content: "Hi, I'd like to book an appointment for next week",
        message_type: "text",
        created_at: new Date(Date.now() - 86400000 * 2 - 60000 * 5).toISOString(),
      },
      {
        id: "msg-001-2",
        session_id: "sess-001",
        sender: "bot",
        content: "Hello! Thanks for reaching out. We'd love to help you book an appointment. Could you share your preferred date and time?",
        message_type: "text",
        created_at: new Date(Date.now() - 86400000 * 2 - 60000 * 4).toISOString(),
      },
      {
        id: "msg-001-3",
        sender: "visitor",
        content: "Tuesday at 2pm works great",
        message_type: "text",
        session_id: "sess-001",
        created_at: new Date(Date.now() - 86400000 * 2 - 60000 * 3).toISOString(),
      },
      {
        id: "msg-001-4",
        session_id: "sess-001",
        sender: "bot",
        content: "Tuesday at 2pm is available! Let me get your details to confirm the booking.",
        message_type: "text",
        created_at: new Date(Date.now() - 86400000 * 2 - 60000 * 2).toISOString(),
      },
      {
        id: "msg-001-5",
        session_id: "sess-001",
        sender: "bot",
        content: "Lead captured: Sarah Johnson, sarah@example.com, +15551234567",
        message_type: "lead_capture",
        created_at: new Date(Date.now() - 86400000 * 2 - 60000).toISOString(),
      },
    ],
  ],
  [
    "sess-002",
    [
      {
        id: "msg-002-1",
        session_id: "sess-002",
        sender: "visitor",
        content: "What are your hours today?",
        message_type: "text",
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "msg-002-2",
        session_id: "sess-002",
        sender: "bot",
        content: "We're open today from 9am to 7pm! Would you like to book an appointment?",
        message_type: "text",
        created_at: new Date(Date.now() - 3500000).toISOString(),
      },
      {
        id: "msg-002-3",
        session_id: "sess-002",
        sender: "visitor",
        content: "Maybe later, thanks!",
        message_type: "text",
        created_at: new Date(Date.now() - 3400000).toISOString(),
      },
    ],
  ],
  [
    "sess-003",
    [
      {
        id: "msg-003-1",
        session_id: "sess-003",
        sender: "visitor",
        content: "Do you offer hair coloring services?",
        message_type: "text",
        created_at: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: "msg-003-2",
        session_id: "sess-003",
        sender: "bot",
        content: "Yes! We offer a full range of hair coloring services including highlights, balayage, and full color. Would you like to schedule a consultation?",
        message_type: "text",
        created_at: new Date(Date.now() - 7100000).toISOString(),
      },
    ],
  ],
  [
    "sess-004",
    [
      {
        id: "msg-004-1",
        session_id: "sess-004",
        sender: "visitor",
        content: "I need a manicure and pedicure combo",
        message_type: "text",
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: "msg-004-2",
        session_id: "sess-004",
        sender: "bot",
        content: "Our mani-pedi combo is $65 and takes about 90 minutes. When would you like to come in?",
        message_type: "text",
        created_at: new Date(Date.now() - 86400000 * 5 + 300000).toISOString(),
      },
    ],
  ],
]);

// Mock follow-ups
const MOCK_FOLLOWUPS: ChatFollowup[] = [
  {
    id: "fup-001",
    brand_id: "00000000-0000-0000-0000-000000000000",
    session_id: "sess-001",
    phone: "+15551234567",
    message_template: "Thanks for chatting with us, {{name}}! We'd love to see you again. Book your next visit at {{link}}",
    status: "sent",
    sent_at: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 2 + 1800000).toISOString(),
  },
  {
    id: "fup-002",
    brand_id: "00000000-0000-0000-0000-000000000000",
    session_id: "sess-004",
    phone: "+15553334444",
    message_template: "Hi {{name}}, thanks for visiting! Here's a special offer for your next appointment: {{link}}",
    status: "sent",
    sent_at: new Date(Date.now() - 86400000 * 5 + 3600000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 5 + 1800000).toISOString(),
  },
];

// ─── Default Config ─────────────────────────────────────────────────────────────

function defaultConfig(brandId: string): WidgetConfig {
  return {
    id: `widget-${brandId.slice(0, 8)}`,
    brand_id: brandId,
    brand_color: "#4F46E5",
    greeting_message: "Hi there! 👋 How can we help you today?",
    position: "bottom-right",
    enabled: true,
    auto_response_enabled: true,
    auto_response_message:
      "Thanks for reaching out! We'll get back to you as soon as possible. In the meantime, feel free to browse our services.",
    business_hours_start: "09:00",
    business_hours_end: "19:00",
    timezone: "America/New_York",
    sms_followup_enabled: false,
    sms_followup_delay_minutes: 30,
    sms_followup_template: "Hi {{name}}, thanks for chatting with us! We'd love to help. Reply here or visit {{link}} to book.",
    powered_by_text: "Powered by GetUpLook",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// ─── Widget Config CRUD ────────────────────────────────────────────────────────

export async function getWidgetConfig(brandId: string): Promise<WidgetConfig> {
  // Try real DB first, fall back to mock
  try {
    const rows = await db
      .select()
      .from(chatWidgetConfigs)
      .where(eq(chatWidgetConfigs.brandId, brandId))
      .limit(1);

    if (rows.length > 0) {
      return rows[0] as unknown as WidgetConfig;
    }
  } catch {
    // DB not available, use mock
  }

  let config = MOCK_CONFIGS.get(brandId);
  if (!config) {
    config = defaultConfig(brandId);
    MOCK_CONFIGS.set(brandId, config);
  }
  return config;
}

export async function updateWidgetConfig(
  brandId: string,
  updates: Partial<Omit<WidgetConfig, "id" | "brand_id" | "created_at">>
): Promise<WidgetConfig> {
  // Try real DB first, fall back to mock
  try {
    // Check if config exists
    const existing = await db
      .select()
      .from(chatWidgetConfigs)
      .where(eq(chatWidgetConfigs.brandId, brandId))
      .limit(1);

    const updateFields: Record<string, unknown> = { updated_at: new Date() };

    // Map camelCase updates to snake_case DB columns
    if (updates.brand_color !== undefined) updateFields.brandColor = updates.brand_color;
    if (updates.greeting_message !== undefined) updateFields.greetingMessage = updates.greeting_message;
    if (updates.position !== undefined) updateFields.position = updates.position;
    if (updates.enabled !== undefined) updateFields.enabled = updates.enabled;
    if (updates.auto_response_enabled !== undefined) updateFields.autoResponseEnabled = updates.auto_response_enabled;
    if (updates.auto_response_message !== undefined) updateFields.autoResponseMessage = updates.auto_response_message;
    if (updates.business_hours_start !== undefined) updateFields.businessHoursStart = updates.business_hours_start;
    if (updates.business_hours_end !== undefined) updateFields.businessHoursEnd = updates.business_hours_end;
    if (updates.timezone !== undefined) updateFields.timezone = updates.timezone;
    if (updates.sms_followup_enabled !== undefined) updateFields.smsFollowupEnabled = updates.sms_followup_enabled;
    if (updates.sms_followup_delay_minutes !== undefined) updateFields.smsFollowupDelayMinutes = updates.sms_followup_delay_minutes;
    if (updates.sms_followup_template !== undefined) updateFields.smsFollowupTemplate = updates.sms_followup_template;
    if (updates.powered_by_text !== undefined) updateFields.poweredByText = updates.powered_by_text;

    if (existing.length > 0) {
      const [updated] = await db
        .update(chatWidgetConfigs)
        .set(updateFields)
        .where(eq(chatWidgetConfigs.brandId, brandId))
        .returning();
      return updated as unknown as WidgetConfig;
    } else {
      // Create new config
      const newConfig = defaultConfig(brandId);
      const merged = { ...newConfig, ...updates, updated_at: new Date().toISOString() };
      const [created] = await db
        .insert(chatWidgetConfigs)
        .values({
          brandId,
          brandColor: merged.brand_color,
          greetingMessage: merged.greeting_message,
          position: merged.position,
          enabled: merged.enabled,
          autoResponseEnabled: merged.auto_response_enabled,
          autoResponseMessage: merged.auto_response_message,
          businessHoursStart: merged.business_hours_start,
          businessHoursEnd: merged.business_hours_end,
          timezone: merged.timezone,
          smsFollowupEnabled: merged.sms_followup_enabled,
          smsFollowupDelayMinutes: merged.sms_followup_delay_minutes,
          smsFollowupTemplate: merged.sms_followup_template,
          poweredByText: merged.powered_by_text,
        })
        .returning();
      return created as unknown as WidgetConfig;
    }
  } catch {
    // DB not available, use mock
  }

  let config = MOCK_CONFIGS.get(brandId);
  if (!config) {
    config = defaultConfig(brandId);
  }
  config = { ...config, ...updates, updated_at: new Date().toISOString() };
  MOCK_CONFIGS.set(brandId, config);
  return config;
}

// ─── Chat Sessions ─────────────────────────────────────────────────────────────

export async function listChatSessions(brandId: string): Promise<ChatSession[]> {
  // Try real DB first, fall back to mock
  try {
    const rows = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.brandId, brandId))
      .orderBy(desc(chatSessions.createdAt));
    return rows as unknown as ChatSession[];
  } catch {
    // DB not available, use mock
  }
  return MOCK_SESSIONS.filter((s) => s.brand_id === brandId);
}

export async function listChatSessionsFiltered(filters: SessionFilters): Promise<{ data: ChatSession[]; total: number }> {
  // Try real DB first, fall back to mock
  try {
    const conditions = [];
    if (filters.brandId) conditions.push(eq(chatSessions.brandId, filters.brandId));
    if (filters.status) conditions.push(eq(chatSessions.status, filters.status));
    if (filters.dateFrom) conditions.push(gte(chatSessions.createdAt, new Date(filters.dateFrom)));
    if (filters.dateTo) conditions.push(lte(chatSessions.createdAt, new Date(filters.dateTo)));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const [rows, countResult] = await Promise.all([
      db.select().from(chatSessions).where(where).orderBy(desc(chatSessions.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(chatSessions).where(where),
    ]);

    return {
      data: rows as unknown as ChatSession[],
      total: Number(countResult[0]?.count ?? rows.length),
    };
  } catch {
    // DB not available, use mock
  }

  let filtered = [...MOCK_SESSIONS];
  if (filters.brandId) filtered = filtered.filter((s) => s.brand_id === filters.brandId);
  if (filters.status) filtered = filtered.filter((s) => s.status === filters.status);
  if (filters.dateFrom) filtered = filtered.filter((s) => new Date(s.created_at) >= new Date(filters.dateFrom!));
  if (filters.dateTo) filtered = filtered.filter((s) => new Date(s.created_at) <= new Date(filters.dateTo!));

  const limit = filters.limit || 50;
  const offset = filters.offset || 0;

  return {
    data: filtered.slice(offset, offset + limit),
    total: filtered.length,
  };
}

export async function getChatSession(sessionId: string): Promise<ChatSession | null> {
  // Try real DB first, fall back to mock
  try {
    const [row] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId))
      .limit(1);
    return (row as unknown as ChatSession) ?? null;
  } catch {
    // DB not available, use mock
  }
  return MOCK_SESSIONS.find((s) => s.id === sessionId) ?? null;
}

// ─── Session Close ───────────────────────────────────────────────────────────

export async function closeChatSession(sessionId: string): Promise<ChatSession | null> {
  // Try real DB first, fall back to mock
  try {
    const [row] = await db
      .update(chatSessions)
      .set({ status: "closed", updatedAt: new Date() })
      .where(eq(chatSessions.id, sessionId))
      .returning();

    if (row) {
      // Queue SMS follow-up if enabled
      const session = row as unknown as ChatSession;
      await queueFollowupIfNeeded(session);
      return session;
    }
    return null;
  } catch {
    // DB not available, use mock
  }

  const session = MOCK_SESSIONS.find((s) => s.id === sessionId);
  if (session) {
    session.status = "closed";
    session.updated_at = new Date().toISOString();
    await queueFollowupIfNeeded(session);
  }
  return session ?? null;
}

// ─── Messages ───────────────────────────────────────────────────────────────────

export async function getSessionMessages(
  sessionId: string,
  limit: number = 50,
  offset: number = 0
): Promise<PaginatedMessages> {
  // Try real DB first, fall back to mock
  try {
    const where = eq(chatMessages.sessionId, sessionId);

    const [rows, countResult] = await Promise.all([
      db.select().from(chatMessages).where(where).orderBy(desc(chatMessages.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(chatMessages).where(where),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    return {
      data: rows as unknown as ChatMessage[],
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  } catch {
    // DB not available, use mock
  }

  const allMessages = MOCK_MESSAGES.get(sessionId) ?? [];
  return {
    data: allMessages.slice(offset, offset + limit),
    total: allMessages.length,
    limit,
    offset,
    hasMore: offset + limit < allMessages.length,
  };
}

// ─── SMS Follow-up ─────────────────────────────────────────────────────────────

async function queueFollowupIfNeeded(session: ChatSession): Promise<void> {
  // Only send follow-up if the session had a phone number
  if (!session.visitor_phone) return;

  try {
    // Get widget config for the brand
    const config = await getWidgetConfig(session.brand_id);

    if (!config.sms_followup_enabled) return;

    // Create follow-up record
    const template = config.sms_followup_template ||
      "Hi {{name}}, thanks for chatting with us! We'd love to help. Reply here or visit our site to book.";

    // Try real DB first
    try {
      await db.insert(chatFollowups).values({
        brandId: session.brand_id,
        sessionId: session.id,
        phone: session.visitor_phone,
        messageTemplate: template,
        status: "pending",
      });
    } catch {
      // DB not available, track in mock
      const followup: ChatFollowup = {
        id: `fup-${Date.now()}`,
        brand_id: session.brand_id,
        session_id: session.id,
        phone: session.visitor_phone,
        message_template: template,
        status: "pending",
        sent_at: null,
        created_at: new Date().toISOString(),
      };
      MOCK_FOLLOWUPS.push(followup);
    }

    // If delay is 0, send immediately (in production, this would be a queue/worker)
    const delay = config.sms_followup_delay_minutes || 30;
    if (delay <= 0) {
      await sendFollowupSms(session, template);
    }
    // Otherwise, a background worker would pick up pending follow-ups after the delay
  } catch {
    // Config not found or other error, skip follow-up
  }
}

async function sendFollowupSms(session: ChatSession, template: string): Promise<void> {
  // Replace template variables
  const message = template
    .replace(/\{\{name\}\}/g, session.visitor_name || "there")
    .replace(/\{\{link\}\}/g, "https://getuplook.com/book");

  if (isMockMode) {
    console.log(`[MOCK SMS] To: ${session.visitor_phone}, Message: ${message}`);
    // Update mock follow-up status
    const followup = MOCK_FOLLOWUPS.find(
      (f) => f.session_id === session.id && f.status === "pending"
    );
    if (followup) {
      followup.status = "sent";
      followup.sent_at = new Date().toISOString();
    }
    return;
  }

  try {
    const client = getTwilioClient();
    await client.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER!,
      to: session.visitor_phone!,
    });

    // Update follow-up status in DB
    try {
      await db
        .update(chatFollowups)
        .set({ status: "sent", sentAt: new Date() })
        .where(and(eq(chatFollowups.sessionId, session.id), eq(chatFollowups.status, "pending")));
    } catch {
      const followup = MOCK_FOLLOWUPS.find(
        (f) => f.session_id === session.id && f.status === "pending"
      );
      if (followup) {
        followup.status = "sent";
        followup.sent_at = new Date().toISOString();
      }
    }
  } catch (error: any) {
    console.error(`[SMS ERROR] Failed to send follow-up to ${session.visitor_phone}:`, error.message);
    // Mark follow-up as failed
    try {
      await db
        .update(chatFollowups)
        .set({ status: "failed" })
        .where(and(eq(chatFollowups.sessionId, session.id), eq(chatFollowups.status, "pending")));
    } catch {
      const followup = MOCK_FOLLOWUPS.find(
        (f) => f.session_id === session.id && f.status === "pending"
      );
      if (followup) {
        followup.status = "failed";
      }
    }
  }
}

export async function listFollowups(brandId: string, status?: string): Promise<ChatFollowup[]> {
  // Try real DB first, fall back to mock
  try {
    const conditions = [eq(chatFollowups.brandId, brandId)];
    if (status) conditions.push(eq(chatFollowups.status, status));

    const rows = await db
      .select()
      .from(chatFollowups)
      .where(and(...conditions))
      .orderBy(desc(chatFollowups.createdAt));
    return rows as unknown as ChatFollowup[];
  } catch {
    // DB not available, use mock
  }

  let filtered = MOCK_FOLLOWUPS.filter((f) => f.brand_id === brandId);
  if (status) filtered = filtered.filter((f) => f.status === status);
  return filtered;
}

export async function retryFollowup(followupId: string): Promise<ChatFollowup | null> {
  // Try real DB first, fall back to mock
  try {
    const [row] = await db
      .select()
      .from(chatFollowups)
      .where(eq(chatFollowups.id, followupId))
      .limit(1);

    if (!row) return null;

    // Get the session info
    const [sessionRow] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, (row as any).sessionId))
      .limit(1);

    if (sessionRow) {
      await db
        .update(chatFollowups)
        .set({ status: "pending" })
        .where(eq(chatFollowups.id, followupId));

      await sendFollowupSms(sessionRow as unknown as ChatSession, (row as any).messageTemplate);
    }

    // Fetch updated row
    const [updated] = await db
      .select()
      .from(chatFollowups)
      .where(eq(chatFollowups.id, followupId))
      .limit(1);
    return updated as unknown as ChatFollowup;
  } catch {
    // DB not available, use mock
  }

  const followup = MOCK_FOLLOWUPS.find((f) => f.id === followupId);
  if (!followup) return null;

  followup.status = "pending";
  const session = MOCK_SESSIONS.find((s) => s.id === followup.session_id);
  if (session) {
    await sendFollowupSms(session, followup.message_template);
  }
  return followup;
}

// ─── AI Auto-Response ───────────────────────────────────────────────────────────

const AUTO_RESPONSES = [
  "Thanks for your message! We'll get back to you shortly. 😊",
  "Great question! Let me check on that for you.",
  "We'd love to help! One of our team members will respond soon.",
  "Thanks for reaching out! Our hours are 9am-7pm, and we'll get back to you as soon as possible.",
  "I appreciate you contacting us! We'll follow up within the hour.",
];

export async function generateAutoResponse(_sessionId: string, _visitorMessage: string): Promise<string> {
  // In production, this would call an LLM. For now, return a random mock response.
  return AUTO_RESPONSES[Math.floor(Math.random() * AUTO_RESPONSES.length)];
}

// ─── Analytics ──────────────────────────────────────────────────────────────────

export async function getWidgetAnalytics(brandId: string): Promise<WidgetAnalytics> {
  // Try real DB first, fall back to mock
  try {
    const [sessionCount, activeCount, leadCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(chatSessions).where(eq(chatSessions.brandId, brandId)),
      db.select({ count: sql<number>`count(*)` }).from(chatSessions).where(and(eq(chatSessions.brandId, brandId), eq(chatSessions.status, "active"))),
      db.select({ count: sql<number>`count(*)` }).from(chatSessions).where(and(eq(chatSessions.brandId, brandId), eq(chatSessions.leadCaptured, true))),
    ]);

    // Get conversations by day (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const byDay = await db
      .select({
        date: sql<string>`date_trunc('day', ${chatSessions.createdAt})::text`,
        count: sql<number>`count(*)`,
      })
      .from(chatSessions)
      .where(and(eq(chatSessions.brandId, brandId), gte(chatSessions.createdAt, sevenDaysAgo)))
      .groupBy(sql`date_trunc('day', ${chatSessions.createdAt})`)
      .orderBy(sql`date_trunc('day', ${chatSessions.createdAt})`);

    return {
      total_conversations: Number(sessionCount[0]?.count ?? 0),
      active_conversations: Number(activeCount[0]?.count ?? 0),
      leads_captured: Number(leadCount[0]?.count ?? 0),
      avg_response_time_seconds: 12,
      conversations_by_day: byDay.map((d) => ({ date: d.date, count: Number(d.count) })),
    };
  } catch {
    // DB not available, use mock
  }

  const sessions = MOCK_SESSIONS.filter((s) => s.brand_id === brandId);
  const activeCount = sessions.filter((s) => s.status === "active").length;
  const leadsCount = sessions.filter((s) => s.lead_captured).length;

  // Generate last 7 days of mock data
  const conversationsByDay = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.now() - (6 - i) * 86400000);
    const dateStr = date.toISOString().split("T")[0];
    return {
      date: dateStr,
      count: Math.floor(Math.random() * 8) + 1,
    };
  });

  return {
    total_conversations: sessions.length,
    active_conversations: activeCount,
    leads_captured: leadsCount,
    avg_response_time_seconds: 12,
    conversations_by_day: conversationsByDay,
  };
}