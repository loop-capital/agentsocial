/**
 * Dograh API Integration
 * Creates and manages voice agents in Dograh platform
 */

const DOGRAH_API_URL = process.env.DOGRAH_API_URL || 'http://localhost:8000';

interface CreateAgentPayload {
  name: string;
  description: string;
  type: 'inbound' | 'outbound';
  system_prompt: string;
  voice_provider: string;
  voice_id: string;
  stt_provider: string;
  llm_provider: string;
  llm_model: string;
  telephony_provider?: string;
  phone_number?: string;
  webhook_url?: string;
  max_duration_minutes?: number;
  silence_timeout_seconds?: number;
  transfer_number?: string;
  functions?: Record<string, unknown>;
}

class DograhClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = DOGRAH_API_URL;
    this.apiKey = process.env.DOGRAH_API_KEY || '';
  }

  private async request(method: string, path: string, body?: unknown) {
    const res = await fetch(`${this.baseUrl}/api/v1${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Dograh API error: ${res.status} ${error}`);
    }

    return res.json();
  }

  // Create a new voice agent
  async createAgent(payload: CreateAgentPayload) {
    return this.request('POST', '/agents', payload);
  }

  // List all agents
  async listAgents() {
    return this.request('GET', '/agents');
  }

  // Get agent details
  async getAgent(id: string) {
    return this.request('GET', `/agents/${id}`);
  }

  // Update agent
  async updateAgent(id: string, payload: Partial<CreateAgentPayload>) {
    return this.request('PATCH', `/agents/${id}`, payload);
  }

  // Delete agent
  async deleteAgent(id: string) {
    return this.request('DELETE', `/agents/${id}`);
  }

  // Start a test web call
  async startTestCall(agentId: string) {
    return this.request('POST', `/agents/${agentId}/test-call`);
  }

  // Connect telephony (Twilio)
  async connectTwilio(agentId: string, config: {
    account_sid: string;
    auth_token: string;
    phone_number: string;
  }) {
    return this.request('POST', `/agents/${agentId}/telephony/twilio`, config);
  }

  // Get call recordings
  async getRecordings(agentId: string, params?: { limit?: number; offset?: number }) {
    const query = params ? `?limit=${params.limit || 50}&offset=${params.offset || 0}` : '';
    return this.request('GET', `/agents/${agentId}/recordings${query}`);
  }

  // Get call analytics
  async getAnalytics(agentId: string, params?: { start_date?: string; end_date?: string }) {
    const query = params ? `?start_date=${params.start_date}&end_date=${params.end_date}` : '';
    return this.request('GET', `/agents/${agentId}/analytics${query}`);
  }
}

export const dograh = new DograhClient();
export type { CreateAgentPayload };