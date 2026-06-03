/**
 * AgentSocial API Client
 * Connects voice agent to the main AgentSocial backend
 */

const AGENTSOCIAL_API_URL = process.env.AGENTSOCIAL_API_URL || 'http://localhost:3001/api/v1';
const AGENTSOCIAL_API_KEY = process.env.AGENTSOCIAL_API_KEY || '';

interface LeadData {
  name?: string;
  phone: string;
  email?: string;
  source: 'voice_inbound' | 'voice_outbound' | 'sms';
  service_interest?: string;
  preferred_stylist?: string;
  preferred_date?: string;
  preferred_time?: string;
  notes?: string;
  salon_id: string;
  call_duration_seconds?: number;
  call_recording_url?: string;
  call_transcript?: string;
}

interface BookingData {
  lead_id: string;
  service_type: string;
  stylist_name?: string;
  date: string;
  time: string;
  duration_minutes: number;
  salon_id: string;
}

class AgentSocialClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = AGENTSOCIAL_API_URL;
    this.apiKey = AGENTSOCIAL_API_KEY;
  }

  private async request(method: string, path: string, body?: unknown) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`AgentSocial API error: ${res.status} ${error}`);
    }

    return res.json();
  }

  // Lead management
  async createLead(data: LeadData) {
    return this.request('POST', '/leads', data);
  }

  async getLead(id: string) {
    return this.request('GET', `/leads/${id}`);
  }

  async updateLead(id: string, data: Partial<LeadData>) {
    return this.request('PATCH', `/leads/${id}`, data);
  }

  // Booking management
  async createBooking(data: BookingData) {
    return this.request('POST', '/bookings', data);
  }

  async getBooking(id: string) {
    return this.request('GET', `/bookings/${id}`);
  }

  // Analytics
  async logCallEvent(data: {
    salon_id: string;
    call_type: 'inbound' | 'outbound';
    duration_seconds: number;
    outcome: 'booked' | 'no_answer' | 'transferred' | 'voicemail' | 'info_only';
    lead_id?: string;
    recording_url?: string;
    transcript?: string;
  }) {
    return this.request('POST', '/analytics/call', data);
  }

  // Campaigns
  async triggerCampaign(data: {
    type: 'rebooking' | 'review_request' | 'promo';
    salon_id: string;
    lead_id: string;
    template_id?: string;
  }) {
    return this.request('POST', '/campaigns/trigger', data);
  }
}

export const agentsocial = new AgentSocialClient();
export { LeadData, BookingData };