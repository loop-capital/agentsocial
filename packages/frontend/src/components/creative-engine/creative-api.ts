/**
 * Creative Engine Frontend API Client
 * Communicates with /api/creative/* Fastify routes
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('***');
  } catch {
    return null;
  }
}

function getStoredSettings() {
  if (typeof window === 'undefined') return getDefaultSettings();
  try {
    const raw = localStorage.getItem('creative-engine-settings');
    return raw ? { ...getDefaultSettings(), ...JSON.parse(raw) } : getDefaultSettings();
  } catch {
    return getDefaultSettings();
  }
}

function saveSettings(settings: any) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('creative-engine-settings', JSON.stringify(settings));
}

function getDefaultSettings() {
  return {
    defaultProvider: 'auto',
    apiKeys: {},
    preferences: {
      defaultImageSize: '1024x1024',
      defaultStyle: 'vivid',
      saveToCloudinary: true,
    },
  };
}

async function apiFetch(path: string, options?: RequestInit): Promise<any> {
  const userSettings = getStoredSettings();
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  // Inject JWT auth token
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Inject API keys from user settings
  if (userSettings.apiKeys.openai) headers['x-openai-key'] = userSettings.apiKeys.openai;
  if (userSettings.apiKeys.adobeClientId) headers['x-adobe-client-id'] = userSettings.apiKeys.adobeClientId;
  if (userSettings.apiKeys.adobeClientSecret) headers['x-adobe-client-secret'] = userSettings.apiKeys.adobeClientSecret;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const body = await res.json().catch(() => ({ error: res.statusText }));

  if (!res.ok) {
    throw new Error(body.error || body.message || `HTTP ${res.status}`);
  }

  return body;
}

export type CreativeProvider = 'openai' | 'adobe' | 'pollinations' | 'midjourney' | 'auto';

export type ImageSize = '1024x1024' | '1792x1024' | '1024x1792' | '512x512' | '256x256';
export type ImageQuality = 'standard' | 'hd';
export type ImageStyle = 'vivid' | 'natural';

export interface GenerateImageRequest {
  prompt: string;
  provider?: CreativeProvider;
  size?: ImageSize;
  quality?: ImageQuality;
  style?: ImageStyle;
  brandId?: string;
}

export interface GeneratedImage {
  url: string;
  provider: CreativeProvider;
  prompt: string;
  size: ImageSize;
  format: 'png' | 'jpg' | 'webp';
  metadata: {
    generationTime: number;
    cost?: number;
    providerResponseId?: string;
  };
}

export interface ProviderConfig {
  name: CreativeProvider;
  enabled: boolean;
  requiresApiKey: boolean;
  apiKeyLabel?: string;
  description: string;
  costPerImage: string;
  maxConcurrent: number;
}

export interface UserCreativeSettings {
  defaultProvider: CreativeProvider;
  apiKeys: {
    openai?: string;
    adobeClientId?: string;
    adobeClientSecret?: string;
    midjourney?: string;
  };
  preferences: {
    defaultImageSize: ImageSize;
    defaultStyle: ImageStyle;
    saveToCloudinary: boolean;
  };
}

export interface EstimateResponse {
  estimatedCost: number;
  provider: CreativeProvider;
  prompt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  provider?: string;
  fallbackTo?: string;
}

export const creativeApi = {
  /** POST /api/creative/generate */
  generate: (req: GenerateImageRequest): Promise<ApiResponse<GeneratedImage>> =>
    apiFetch('/api/creative/generate', { method: 'POST', body: JSON.stringify(req) }),

  /** POST /api/creative/generate-batch */
  generateBatch: (requests: GenerateImageRequest[]): Promise<ApiResponse<GeneratedImage[]>> =>
    apiFetch('/api/creative/generate-batch', { method: 'POST', body: JSON.stringify({ requests }) }),

  /** GET /api/creative/providers */
  providers: (): Promise<ApiResponse<ProviderConfig[]>> =>
    apiFetch('/api/creative/providers'),

  /** POST /api/creative/estimate */
  estimate: (req: GenerateImageRequest): Promise<ApiResponse<EstimateResponse>> =>
    apiFetch('/api/creative/estimate', { method: 'POST', body: JSON.stringify(req) }),
};
