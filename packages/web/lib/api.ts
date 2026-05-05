// API client for AgentSocial dashboard

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body && typeof body === 'object' && 'error' in body) {
        const e = (body as Record<string, unknown>).error;
        if (e && typeof e === 'object' && 'message' in e) {
          msg = String((e as Record<string, unknown>).message);
        }
      }
    } catch { /* ignore */ }
    throw new Error(msg);
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export const api = {
  auth: {
    me: () =>
      request<{ id: string; email: string; name: string }>("/api/v1/auth/me"),
    login: (email: string, password: string) =>
      request<{ token: string; user: { id: string; email: string; name: string } }>(
        "/api/v1/auth/login",
        { method: "POST", body: JSON.stringify({ email, password }) }
      ),
    register: (email: string, password: string, name: string) =>
      request<{ token: string; user: { id: string; email: string; name: string } }>(
        "/api/v1/auth/register",
        { method: "POST", body: JSON.stringify({ email, password, name }) }
      ),
  },

  brands: {
    list: () =>
      request<{
        data: Array<{
          id: string;
          name: string;
          logo_url: string | null;
          timezone: string;
          channels_count?: number;
          channels: Array<{ id: string; platform: string; name: string; status: string }>;
          created_at: string;
        }>;
      }>("/api/v1/brands"),

    get: (id: string) =>
      request<{
        id: string;
        name: string;
        logo_url: string | null;
        timezone: string;
        channels: Array<{ id: string; platform: string; name: string; status: string; follower_count: number | null }>;
        created_at: string;
      }>(`/api/v1/brands/${id}`),

    create: (name: string, timezone?: string) =>
      request<{ id: string; name: string; logo_url: string | null; timezone: string; created_at: string }>('/api/v1/brands', {
        method: 'POST',
        body: JSON.stringify({ name, timezone }),
      }),

    update: (id: string, data: { name?: string; timezone?: string; logo_url?: string }) =>
      request<{ id: string; name: string; logo_url: string | null; timezone: string; created_at: string }>(`/api/v1/brands/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  channels: {
    list: (brandId?: string) => {
      const path = brandId ? `/api/v1/channels?brand_id=${brandId}` : "/api/v1/channels";
      return request<{
        data: Array<{
          id: string;
          brand_id: string;
          platform: string;
          name: string;
          account_id: string;
          status: string;
          follower_count: number | null;
          settings: Record<string, unknown>;
          created_at: string;
        }>;
      }>(path);
    },

    connect: (brandId: string, platform: string) =>
      request<{ authorization_url: string; state: string; expires_at: string }>(
        "/api/v1/channels/connect",
        { method: "POST", body: JSON.stringify({ brand_id: brandId, platform }) }
      ),

    oauthConnect: (platform: string, brandId: string) =>
      request<{ authorization_url: string }>(
        `/api/v1/channels/${platform}/auth?brand_id=${brandId}`
      ),

    disconnect: (channelId: string) =>
      request<{ id: string; status: string }>(
        `/api/v1/channels/${channelId}/disconnect`,
        { method: "DELETE" }
      ),
  },

  apiKeys: {
    list: () =>
      request<{
        data: Array<{
          id: string;
          name: string;
          prefix: string;
          last_four: string;
          permissions: string[];
          last_used_at: string | null;
          expires_at: string | null;
          created_at: string;
        }>;
      }>("/api/v1/api-keys"),

    create: (name: string, options?: { permissions?: string[]; expires_in_days?: number }) =>
      request<{
        id: string;
        name: string;
        key: string;
        prefix: string;
        permissions: string[];
        expires_at: string | null;
        created_at: string;
      }>("/api/v1/api-keys", {
        method: "POST",
        body: JSON.stringify({
          name,
          permissions: options?.permissions,
          expires_in_days: options?.expires_in_days,
        }),
      }),

    delete: (id: string) =>
      request<void>(`/api/v1/api-keys/${id}`, { method: "DELETE" }),
  },

  posts: {
    list: (params?: { brand_id?: string; status?: string; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.brand_id) searchParams.set("brand_id", params.brand_id);
      if (params?.status) searchParams.set("status", params.status);
      if (params?.limit) searchParams.set("limit", String(params.limit));
      const qs = searchParams.toString();
      return request<{
        data: Array<{
          id: string;
          brand_id: string;
          content: string;
          status: string;
          scheduled_at: string | null;
          published_at: string | null;
          created_at: string;
          channels?: Array<{
            channel_id: string;
            platform: string;
            status: string;
            platform_post_id: string | null;
            platform_post_url: string | null;
            published_at: string | null;
          }>;
        }>;
        pagination: { limit: number; offset: number; total: number; has_more: boolean };
      }>(`/api/v1/posts${qs ? `?${qs}` : ""}`);
    },

    get: (id: string) =>
      request<{
        id: string;
        brand_id: string;
        content: string;
        status: string;
        channels: Array<{
          channel_id: string;
          platform: string;
          status: string;
          platform_post_id: string | null;
          platform_post_url: string | null;
          published_at: string | null;
        }>;
        scheduled_at: string | null;
        published_at: string | null;
        created_at: string;
      }>(`/api/v1/posts/${id}`),

    create: (data: {
      brand_id: string;
      content: string;
      channels: string[];
      scheduled_at?: string;
    }) =>
      request<{
        id: string;
        status: string;
        channels: Array<{ channel_id: string; platform: string; status: string }>;
      }>("/api/v1/posts", { method: "POST", body: JSON.stringify(data) }),

    publish: (id: string) =>
      request<{ id: string; status: string; published_at: string }>(
        `/api/v1/posts/${id}/publish`,
        { method: "POST" }
      ),

    cancel: (id: string) =>
      request<{ id: string; status: string }>(`/api/v1/posts/${id}/cancel`, {
        method: "POST",
      }),

    duplicate: (id: string) =>
      request<{ id: string; brand_id: string; content: string; status: string; created_at: string }>(`/api/v1/posts/${id}/duplicate`, {
        method: "POST",
      }),

    delete: (id: string) =>
      request<{ id: string; status: string; message: string }>(`/api/v1/posts/${id}`, { method: "DELETE" }),
  },

  analytics: {
    summary: (brandId: string, period?: string) => {
      const searchParams = new URLSearchParams();
      searchParams.set('brand_id', brandId);
      if (period) searchParams.set('period', period);
      return request<{
        period: { start: string | null; end: string | null; range: string };
        summary: {
          total_followers: number;
          followers_growth: number;
          followers_growth_percent: number;
          total_impressions: number;
          total_engagements: number;
          engagement_rate: number;
          posts_published: number;
          avg_posts_per_day: number;
        };
        daily_trend: Array<{
          date: string;
          impressions: number;
          engagements: number;
          followers: number;
        }>;
      }>(`/api/v1/analytics/dashboard?${searchParams.toString()}`);
    },

    dashboard: (brandId: string, channelId?: string) => {
      const searchParams = new URLSearchParams();
      searchParams.set("brand_id", brandId);
      if (channelId) searchParams.set("channel_id", channelId);
      return request<{
        summary: {
          total_followers: number;
          followers_growth: number;
          total_impressions: number;
          total_engagements: number;
          engagement_rate: number;
          posts_published: number;
        };
      }>(`/api/v1/analytics/dashboard?${searchParams.toString()}`);
    },

    sync: (brandId: string, channelId?: string) => {
      const searchParams: Record<string, string> = { brand_id: brandId };
      if (channelId) searchParams.channel_id = channelId;
      return request<{ queued: number; job_ids: string[] }>(
        "/api/v1/sync/sync-analytics",
        { method: "POST", body: JSON.stringify(searchParams) }
      );
    },
  },
};
