// ─── Rebooking Campaigns Service ──────────────────────────────────────────────
//
// Provides campaign management, stats, and message tracking for automated
// SMS/email rebooking reminders. Uses mock data in dev mode.

import type {
  Campaign,
  CampaignMessage,
  CampaignStats,
  CampaignStatus,
  CampaignType,
  CampaignMessageStatus,
  CampaignTrigger,
  CreateCampaignInput,
  UpdateCampaignInput,
} from "@agentsocial/shared";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_TRIGGERS: Record<string, CampaignTrigger[]> = {
  rebooking: [
    {
      eventType: "appointment_completed",
      delayDays: 3,
      maxPerCustomer: 1,
      timeOfDay: "10:00",
      daysOfWeek: [1, 2, 3, 4, 5],
    },
  ],
  birthday: [
    {
      eventType: "birthday",
      delayDays: 7,
      maxPerCustomer: 1,
      timeOfDay: "09:00",
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    },
  ],
  winback: [
    {
      eventType: "days_since_visit",
      delayDays: 0,
      maxPerCustomer: 2,
      timeOfDay: "11:00",
      daysOfWeek: [1, 2, 3, 4, 5],
    },
    {
      eventType: "days_since_visit",
      delayDays: 30,
      maxPerCustomer: 1,
      timeOfDay: "11:00",
      daysOfWeek: [1, 2, 3, 4, 5],
    },
  ],
};

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: "camp-rebook-001",
    brandId: "00000000-0000-0000-0000-000000000000",
    name: "Rebooking Reminder",
    type: "rebooking",
    status: "active",
    template:
      "Hi {{name}}! 💇 It's been a few days since your {{service}} appointment. We'd love to see you again — book your next visit at {{bookingLink}}",
    channel: "sms",
    triggers: MOCK_TRIGGERS.rebooking,
    stats: {
      sent: 847,
      delivered: 812,
      opened: 0,
      clicked: 289,
      booked: 134,
      failed: 23,
      optedOut: 12,
      openRate: 0,           // N/A for SMS
      clickRate: 0.341,
      bookRate: 0.158,
      revenue: 134 * 95,     // avg booking value ~$95
      roi: 4.2,
    },
    createdAt: "2025-11-15T10:00:00Z",
    updatedAt: "2026-05-01T14:30:00Z",
  },
  {
    id: "camp-bday-002",
    brandId: "00000000-0000-0000-0000-000000000000",
    name: "Birthday Offer",
    type: "birthday",
    status: "active",
    template:
      "🎂 Happy Birthday, {{name}}! Celebrate with 20% off your next service. Book your appointment: {{bookingLink}}",
    subject: "🎂 A special birthday treat from us!",
    channel: "both",
    triggers: MOCK_TRIGGERS.birthday,
    stats: {
      sent: 156,
      delivered: 148,
      opened: 112,
      clicked: 67,
      booked: 38,
      failed: 5,
      optedOut: 3,
      openRate: 0.757,
      clickRate: 0.453,
      bookRate: 0.244,
      revenue: 38 * 120,
      roi: 6.1,
    },
    createdAt: "2025-12-01T09:00:00Z",
    updatedAt: "2026-04-20T11:00:00Z",
  },
  {
    id: "camp-winback-003",
    brandId: "00000000-0000-0000-0000-000000000000",
    name: "Win-back Inactive Clients",
    type: "winback",
    status: "paused",
    template:
      "Hey {{name}}, we miss you! 🌟 It's been a while since your last visit. Come back and enjoy 15% off with code COMEBACK15. Book now: {{bookingLink}}",
    subject: "We miss you, {{name}}! Here's 15% off your next visit",
    channel: "both",
    triggers: MOCK_TRIGGERS.winback,
    stats: {
      sent: 312,
      delivered: 295,
      opened: 98,
      clicked: 42,
      booked: 18,
      failed: 14,
      optedOut: 27,
      openRate: 0.332,
      clickRate: 0.135,
      bookRate: 0.058,
      revenue: 18 * 85,
      roi: 1.8,
    },
    createdAt: "2026-01-10T08:00:00Z",
    updatedAt: "2026-03-15T16:00:00Z",
  },
];

const MOCK_MESSAGES: CampaignMessage[] = [
  // Rebooking campaign messages
  {
    id: "msg-001",
    campaignId: "camp-rebook-001",
    brandId: "00000000-0000-0000-0000-000000000000",
    recipientName: "Sarah Johnson",
    recipientPhone: "+1-555-0101",
    recipientEmail: "sarah.j@email.com",
    channel: "sms",
    status: "booked",
    sentAt: "2026-05-11T15:00:00Z",
    deliveredAt: "2026-05-11T15:01:00Z",
    openedAt: null,
    clickedAt: "2026-05-11T15:45:00Z",
    bookedAt: "2026-05-11T16:20:00Z",
    content: "Hi Sarah! 💇 It's been a few days since your Haircut & Blowout appointment. We'd love to see you again — book your next visit at https://book.agentsocial.app/s/abc123",
    errorMessage: null,
    createdAt: "2026-05-11T14:55:00Z",
  },
  {
    id: "msg-002",
    campaignId: "camp-rebook-001",
    brandId: "00000000-0000-0000-0000-000000000000",
    recipientName: "Emily Chen",
    recipientPhone: "+1-555-0102",
    recipientEmail: "emily.c@email.com",
    channel: "sms",
    status: "clicked",
    sentAt: "2026-05-10T15:00:00Z",
    deliveredAt: "2026-05-10T15:01:00Z",
    openedAt: null,
    clickedAt: "2026-05-10T16:30:00Z",
    bookedAt: null,
    content: "Hi Emily! 💇 It's been a few days since your Balayage Color appointment. We'd love to see you again — book your next visit at https://book.agentsocial.app/s/def456",
    errorMessage: null,
    createdAt: "2026-05-10T14:55:00Z",
  },
  {
    id: "msg-003",
    campaignId: "camp-rebook-001",
    brandId: "00000000-0000-0000-0000-000000000000",
    recipientName: "Maria Garcia",
    recipientPhone: "+1-555-0103",
    recipientEmail: "maria.g@email.com",
    channel: "sms",
    status: "sent",
    sentAt: "2026-05-09T15:00:00Z",
    deliveredAt: "2026-05-09T15:01:00Z",
    openedAt: null,
    clickedAt: null,
    bookedAt: null,
    content: "Hi Maria! 💇 It's been a few days since your Gel Manicure appointment. We'd love to see you again — book your next visit at https://book.agentsocial.app/s/ghi789",
    errorMessage: null,
    createdAt: "2026-05-09T14:55:00Z",
  },
  {
    id: "msg-004",
    campaignId: "camp-rebook-001",
    brandId: "00000000-0000-0000-0000-000000000000",
    recipientName: "Aisha Patel",
    recipientPhone: "+1-555-0104",
    recipientEmail: null,
    channel: "sms",
    status: "failed",
    sentAt: null,
    deliveredAt: null,
    openedAt: null,
    clickedAt: null,
    bookedAt: null,
    content: "Hi Aisha! 💇 It's been a few days since your Facial Treatment appointment. We'd love to see you again — book your next visit at https://book.agentsocial.app/s/jkl012",
    errorMessage: "Phone number opted out",
    createdAt: "2026-05-08T14:55:00Z",
  },
  // Birthday campaign messages
  {
    id: "msg-005",
    campaignId: "camp-bday-002",
    brandId: "00000000-0000-0000-0000-000000000000",
    recipientName: "Rachel Kim",
    recipientPhone: "+1-555-0201",
    recipientEmail: "rachel.k@email.com",
    channel: "email",
    status: "booked",
    sentAt: "2026-05-08T09:00:00Z",
    deliveredAt: "2026-05-08T09:02:00Z",
    openedAt: "2026-05-08T10:15:00Z",
    clickedAt: "2026-05-08T10:20:00Z",
    bookedAt: "2026-05-08T10:45:00Z",
    content: "🎂 Happy Birthday, Rachel! Celebrate with 20% off your next service. Book your appointment: https://book.agentsocial.app/b/mno345",
    errorMessage: null,
    createdAt: "2026-05-08T08:55:00Z",
  },
  {
    id: "msg-006",
    campaignId: "camp-bday-002",
    brandId: "00000000-0000-0000-0000-000000000000",
    recipientName: "Nicole Brown",
    recipientPhone: "+1-555-0202",
    recipientEmail: "nicole.b@email.com",
    channel: "email",
    status: "opened",
    sentAt: "2026-05-05T09:00:00Z",
    deliveredAt: "2026-05-05T09:01:00Z",
    openedAt: "2026-05-05T12:30:00Z",
    clickedAt: null,
    bookedAt: null,
    content: "🎂 Happy Birthday, Nicole! Celebrate with 20% off your next service. Book your appointment: https://book.agentsocial.app/b/pqr678",
    errorMessage: null,
    createdAt: "2026-05-05T08:55:00Z",
  },
  // Winback campaign messages
  {
    id: "msg-007",
    campaignId: "camp-winback-003",
    brandId: "00000000-0000-0000-0000-000000000000",
    recipientName: "Jessica Martinez",
    recipientPhone: "+1-555-0301",
    recipientEmail: "jess.m@email.com",
    channel: "email",
    status: "opted_out",
    sentAt: "2026-03-01T11:00:00Z",
    deliveredAt: "2026-03-01T11:01:00Z",
    openedAt: "2026-03-01T14:00:00Z",
    clickedAt: null,
    bookedAt: null,
    content: "Hey Jessica, we miss you! 🌟 It's been a while since your last visit. Come back and enjoy 15% off with code COMEBACK15. Book now: https://book.agentsocial.app/w/stu901",
    errorMessage: null,
    createdAt: "2026-03-01T10:55:00Z",
  },
];

// ─── In-memory store ──────────────────────────────────────────────────────────

const campaignStore = new Map<string, Campaign>();

// Initialize with mock data
MOCK_CAMPAIGNS.forEach((c) => campaignStore.set(c.id, { ...c }));

// ─── Service Functions ───────────────────────────────────────────────────────

/** List all campaigns for a brand. */
export async function listCampaigns(brandId: string, status?: CampaignStatus, type?: CampaignType): Promise<Campaign[]> {
  let campaigns = Array.from(campaignStore.values()).filter(
    (c) => c.brandId === brandId && c.status !== "archived"
  );

  if (status) campaigns = campaigns.filter((c) => c.status === status);
  if (type) campaigns = campaigns.filter((c) => c.type === type);

  return campaigns.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/** Get a single campaign by ID. */
export async function getCampaign(campaignId: string): Promise<Campaign | null> {
  return campaignStore.get(campaignId) ?? null;
}

/** Create a new campaign. */
export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  const id = `camp-${Date.now().toString(36)}`;

  const campaign: Campaign = {
    id,
    brandId: input.brandId,
    name: input.name,
    type: input.type,
    status: "draft",
    template: input.template,
    subject: input.subject,
    channel: input.channel,
    triggers: input.triggers,
    stats: {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      booked: 0,
      failed: 0,
      optedOut: 0,
      openRate: 0,
      clickRate: 0,
      bookRate: 0,
      revenue: 0,
      roi: 0,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  campaignStore.set(id, campaign);
  return campaign;
}

/** Update a campaign. */
export async function updateCampaign(campaignId: string, updates: UpdateCampaignInput): Promise<Campaign | null> {
  const existing = campaignStore.get(campaignId);
  if (!existing) return null;

  const updated: Campaign = {
    ...existing,
    ...updates,
    id: existing.id,
    brandId: existing.brandId,
    stats: existing.stats,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  campaignStore.set(campaignId, updated);
  return updated;
}

/** Get aggregated stats for a campaign. */
export async function getCampaignStats(campaignId: string): Promise<CampaignStats | null> {
  const campaign = campaignStore.get(campaignId);
  if (!campaign) return null;
  return campaign.stats;
}

/** List messages sent for a campaign. */
export async function getCampaignMessages(
  campaignId: string,
  status?: CampaignMessageStatus,
  limit: number = 50,
  offset: number = 0
): Promise<CampaignMessage[]> {
  let messages = MOCK_MESSAGES.filter((m) => m.campaignId === campaignId);

  if (status) messages = messages.filter((m) => m.status === status);

  // Sort by most recent first
  messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return messages.slice(offset, offset + limit);
}