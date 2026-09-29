/**
 * Business Profile Type Definition
 *
 * Shared shape used by salon voice-agent profiles.
 */

export interface BusinessProfile {
  id: string;
  name: string;
  dba?: string;
  phone: string;
  address: string;
  website?: string;
  google_maps_url?: string;

  brand_tone?: string;
  greeting_style?: string;
  agent_name?: string;
  agent_persona?: string;

  service_categories?: string[];
  services?: Array<{
    name: string;
    category?: string;
    price_range?: string;
    duration?: number;
    popular?: boolean;
    description?: string;
  }>;

  stylists?: Array<{
    name: string;
    specialties?: string[];
    available_days?: string[];
    bio?: string;
    senior?: boolean;
  }>;

  hours?: Record<string, string>;

  cancellation_policy?: string;
  parking_info?: string;
  new_client_offer?: string;
  special_notes?: string;

  policies?: Array<{
    title: string;
    content: string;
    priority?: string;
  }>;

  faqs?: Array<{
    q: string;
    a: string;
    triggers?: string[];
  }>;

  transfer_rules?: {
    complaint?: boolean;
    complex_consultation?: boolean;
    vip_client?: boolean;
    pricing_dispute?: boolean;
    emergency?: boolean;
    custom?: Array<{ trigger: string; reason: string }>;
  };

  max_call_minutes?: number;
  silence_timeout_seconds?: number;

  voice_id?: string;
  voice_stability?: number;
  voice_similarity_boost?: number;
  voice_style?: number;

  campaigns?: {
    rebooking?: {
      days_after_appointment?: number;
      message_template?: string;
    };
    review_request?: {
      days_after_appointment?: number;
      message_template?: string;
    };
  };

  agentsocial_api_url?: string;
  agentsocial_api_key?: string;
  twilio_phone_number?: string;
  transfer_phone_number?: string;
}
