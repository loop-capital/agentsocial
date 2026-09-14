// SiteFlow API client — talks to Fastify backend
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

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: buildHeaders(options),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface Template {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  preview_image: string;
  component_path: string;
  default_config: Record<string, any>;
  tags: string[];
  is_active: boolean;
  sort_order: number;
}

export interface Website {
  id: string;
  brand_id: string;
  template_id: string;
  name: string;
  config: Record<string, any>;
  status: string;
  url?: string;
  custom_domain?: string;
  created_at: string;
  updated_at: string;
  template_name?: string;
  template_slug?: string;
  template_category?: string;
  component_path?: string;
}

export const siteflowApi = {
  // Templates
  listTemplates: (category?: string) =>
    api<{ templates: Template[] }>(`/templates${category ? `?category=${category}` : ''}`),

  // Websites
  listWebsites: (brandId: string) => api<{ websites: Website[] }>(`/websites?brandId=${brandId}`),

  getWebsite: (id: string, brandId: string) =>
    api<{ website: Website }>(`/websites/${id}?brandId=${brandId}`),

  createWebsite: (body: { brandId: string; templateId: string; name: string; config?: Record<string, any> }) =>
    api<{ website: Website }>('/websites', { method: 'POST', body: JSON.stringify(body) }),

  updateWebsite: (id: string, body: { brandId: string; config?: Record<string, any>; status?: string; customDomain?: string; name?: string }) =>
    api<{ website: Website }>(`/websites/${id}?brandId=${body.brandId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  deleteWebsite: (id: string, brandId: string) =>
    api<void>(`/websites/${id}?brandId=${brandId}`, { method: 'DELETE' }),

  deployWebsite: (id: string, brandId: string) =>
    api<{ deploymentId: string; status: string; url: string; message: string }>(`/websites/${id}/deploy?brandId=${brandId}`, { method: 'POST' }),

  exportWebsite: (id: string, brandId: string) =>
    api<{ downloadUrl: string; message: string }>(`/websites/${id}/export?brandId=${brandId}`, { method: 'POST' }),
};
