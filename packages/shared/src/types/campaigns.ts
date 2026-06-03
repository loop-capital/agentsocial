// ─── Rebooking Campaign Types ──────────────────────────────────────────────
// Automated SMS/email reminders to book next appointment

// ─── Enums ──────────────────────────────────────────────────────────────────

export type CampaignType = "rebooking" | "birthday" | "winback" | "custom";

export type CampaignStatus = "active" | "paused" | "draft" | "completed" | "archived";

export type CampaignMessageStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "booked"
  | "failed"
  | "opted_out";

export type TriggerEventType =
  | "appointment_completed"
  | "days_since_visit"
  | "birthday"
  | "first_visit_anniversary"
  | "no_show"
  | "custom";

// ─── Campaign Trigger ───────────────────────────────────────────────────────

export interface CampaignTrigger {
  eventType: TriggerEventType;
  delayDays: number;         // days after trigger event to send message
  maxPerCustomer: number;    // max messages per customer per campaign run
  timeOfDay: string;         // HH:mm local time to send (e.g., "10:00")
  daysOfWeek: number[];       // 0=Sun, 1=Mon, ... 6=Sat
}

// ─── Campaign ────────────────────────────────────────────────────────────────

export interface Campaign {
  id: string;
  brandId: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  template: string;           // message body with {{name}}, {{service}}, etc.
  subject?: string;           // email subject (optional, for email channel)
  channel: "sms" | "email" | "both";
  triggers: CampaignTrigger[];
  stats: CampaignStats;
  createdAt: string;
  updatedAt: string;
}

// ─── Campaign Message ────────────────────────────────────────────────────────

export interface CampaignMessage {
  id: string;
  campaignId: string;
  brandId: string;
  recipientName: string;
  recipientPhone: string | null;
  recipientEmail: string | null;
  channel: "sms" | "email";
  status: CampaignMessageStatus;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  bookedAt: string | null;
  content: string;            // rendered message content
  errorMessage: string | null;
  createdAt: string;
}

// ─── Campaign Stats ──────────────────────────────────────────────────────────

export interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  booked: number;
  failed: number;
  optedOut: number;
  openRate: number;
  clickRate: number;
  bookRate: number;
  revenue: number;
  roi: number;                 // revenue / (cost * 100) — cost in cents per message
}

// ─── Create/Update Inputs ────────────────────────────────────────────────────

export interface CreateCampaignInput {
  brandId: string;
  name: string;
  type: CampaignType;
  template: string;
  subject?: string;
  channel: "sms" | "email" | "both";
  triggers: CampaignTrigger[];
}

export interface UpdateCampaignInput {
  name?: string;
  type?: CampaignType;
  status?: CampaignStatus;
  template?: string;
  subject?: string;
  channel?: "sms" | "email" | "both";
  triggers?: CampaignTrigger[];
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface CampaignListParams {
  brandId: string;
  status?: CampaignStatus;
  type?: CampaignType;
  limit?: number;
  offset?: number;
}

export interface CampaignMessageListParams {
  campaignId: string;
  status?: CampaignMessageStatus;
  limit?: number;
  offset?: number;
}