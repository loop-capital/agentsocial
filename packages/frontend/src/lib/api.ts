const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('***');
  } catch {
    return null;
  }
}

function buildHeaders(options?: RequestInit): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: buildHeaders(options),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || body.message || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const contentApi = {
  templates: (params?: { category?: string; platform?: string }) => {
    const qs = params
      ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString()
      : '';
    return apiFetch(`/content/templates${qs}`);
  },
  template: (id: string) => apiFetch(`/content/templates/${id}`),
  generate: (data: {
    topic: string;
    platform: string;
    tone?: string;
    length?: 'short' | 'medium' | 'long';
    includeHashtags?: boolean;
    includeImagePrompt?: boolean;
    brandId: string;
  }) => apiFetch('/content/generate', { method: 'POST', body: JSON.stringify(data) }),
  generateFromTemplate: (data: {
    templateId: string;
    variables?: Record<string, string>;
    platform: string;
    brandId: string;
  }) => apiFetch('/content/generate-from-template', { method: 'POST', body: JSON.stringify(data) }),
  extractContent: (data: {
    type: 'youtube' | 'audio' | 'article' | 'pdf' | 'text';
    url?: string;
    text?: string;
    brandId: string;
  }) => apiFetch('/content/extract', { method: 'POST', body: JSON.stringify(data) }),
  bulkGenerate: (data: {
    source: { type: string; url?: string; text?: string; brandId: string };
    platforms: string[];
    brandVoice?: string;
    brandId: string;
  }) => apiFetch('/content/bulk-generate', { method: 'POST', body: JSON.stringify(data) }),
  smartSchedule: (data: {
    platforms: string[];
    existingPosts?: Array<{ postId: string; platform: string; scheduledAt: string }>;
    after?: string;
  }) => apiFetch('/content/smart-schedule', { method: 'POST', body: JSON.stringify(data) }),
  weekSchedule: (data: {
    platforms: string[];
    postsPerWeek?: number;
    existingPosts?: Array<{ postId: string; platform: string; scheduledAt: string }>;
  }) => apiFetch('/content/week-schedule', { method: 'POST', body: JSON.stringify(data) }),
  peakHours: (platform?: string) => {
    const qs = platform ? `?platform=${platform}` : '';
    return apiFetch(`/content/peak-hours${qs}`);
  },
  platforms: () => apiFetch('/content/platforms'),
};

export const socialApi = {
  platforms: () => apiFetch('/social/platforms'),
  accounts: (brandId: string) => apiFetch(`/social/accounts?brandId=${brandId}`),
  connectAccount: (brandId: string, data: any) =>
    apiFetch(`/social/accounts?brandId=${brandId}`, { method: 'POST', body: JSON.stringify({ ...data, brandId }) }),
  disconnectAccount: (brandId: string, id: string) =>
    apiFetch(`/social/accounts/${id}?brandId=${brandId}`, { method: 'DELETE' }),
  posts: (brandId: string, qs?: string) => apiFetch(`/social/posts?brandId=${brandId}${qs ? `&${qs}` : ''}`),
  post: (brandId: string, id: string) => apiFetch(`/social/posts/${id}?brandId=${brandId}`),
  createPost: (brandId: string, data: any) =>
    apiFetch(`/social/posts?brandId=${brandId}`, { method: 'POST', body: JSON.stringify({ ...data, brandId }) }),
  updatePost: (brandId: string, id: string, data: any) =>
    apiFetch(`/social/posts/${id}?brandId=${brandId}`, { method: 'PUT', body: JSON.stringify({ ...data, brandId }) }),
  deletePost: (brandId: string, id: string) =>
    apiFetch(`/social/posts/${id}?brandId=${brandId}`, { method: 'DELETE' }),
  analytics: (brandId: string) => apiFetch(`/social/analytics?brandId=${brandId}`),
};

export const landingPagesApi = {
  get: (slug: string) => apiFetch(`/landing-pages/${slug}`),
  list: (brandId: string) => apiFetch(`/landing-pages?brandId=${brandId}`),
  create: (data: Record<string, unknown>) => apiFetch('/landing-pages', { method: 'POST', body: JSON.stringify(data) }),
  update: (slug: string, data: Record<string, unknown>) => apiFetch(`/landing-pages/${slug}`, { method: 'PUT', body: JSON.stringify(data) }),
  publish: (slug: string) => apiFetch(`/landing-pages/${slug}/publish`, { method: 'POST' }),
  unpublish: (slug: string) => apiFetch(`/landing-pages/${slug}/unpublish`, { method: 'POST' }),
};
