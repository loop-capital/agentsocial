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

  gbp: {
    listAccounts: (brandId: string) =>
      request<{
        data: Array<{
          id: string;
          brand_id: string;
          account_name: string;
          location_id: string;
          status: string;
          review_count: number;
          average_rating: number;
          response_rate: number;
          created_at: string;
        }>;
      }>(`/api/v1/gbp/?brandId=${brandId}`),

    getReviews: (accountId: string, limit = 10) =>
      request<{
        data: Array<{
          id: string;
          account_id: string;
          reviewer_name: string;
          rating: number;
          comment: string;
          status: "new" | "replied" | "archived";
          reply_text: string | null;
          created_at: string;
        }>;
      }>(`/api/v1/gbp/accounts/${accountId}/reviews?limit=${limit}`),

    aiSuggest: (accountId: string, reviewId: string) =>
      request<{ suggestion: string }>(
        `/api/v1/gbp/accounts/${accountId}/reviews/${reviewId}/ai-suggest`,
        { method: "POST" }
      ),

    solicitationStats: (brandId: string) =>
      request<{
        sent: number;
        opened: number;
        clicked: number;
        reviewed: number;
        open_rate: number;
        click_rate: number;
        review_rate: number;
      }>(`/api/v1/gbp/solicitations/stats?brandId=${brandId}`),

    // ─── Chat Widget ──────────────────────────────────────────────────────────

    getWidgetConfig: (brandId: string) =>
      request<{
        data: {
          id: string;
          brand_id: string;
          brand_color: string;
          greeting_message: string;
          position: string;
          enabled: boolean;
          auto_response_enabled: boolean;
          auto_response_message: string;
          business_hours_start: string;
          business_hours_end: string;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
      }>(`/api/v1/gbp/widget?brandId=${brandId}`),

    updateWidgetConfig: (brandId: string, config: Record<string, unknown>) =>
      request<{
        data: {
          id: string;
          brand_id: string;
          brand_color: string;
          greeting_message: string;
          position: string;
          enabled: boolean;
          auto_response_enabled: boolean;
          auto_response_message: string;
          business_hours_start: string;
          business_hours_end: string;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
      }>('/api/v1/gbp/widget', {
        method: 'PUT',
        body: JSON.stringify({ brandId, ...config }),
      }),

    getWidgetSessions: (brandId: string) =>
      request<{
        data: Array<{
          id: string;
          widget_id: string;
          brand_id: string;
          visitor_name: string | null;
          visitor_phone: string | null;
          visitor_email: string | null;
          status: string;
          lead_captured: boolean;
          source: string;
          created_at: string;
          updated_at: string;
        }>;
      }>(`/api/v1/gbp/widget/sessions?brandId=${brandId}`),

    getWidgetSessionMessages: (sessionId: string) =>
      request<{
        data: Array<{
          id: string;
          session_id: string;
          sender: string;
          content: string;
          message_type: string;
          created_at: string;
        }>;
      }>(`/api/v1/gbp/widget/sessions/${sessionId}/messages`),

    getWidgetAnalytics: (brandId: string) =>
      request<{
        data: {
          total_conversations: number;
          active_conversations: number;
          leads_captured: number;
          avg_response_time_seconds: number;
          conversations_by_day: Array<{ date: string; count: number }>;
        };
      }>(`/api/v1/gbp/widget/analytics?brandId=${brandId}`),

    // ─── Booking CTA & Conversion Tracking ─────────────────────────────────────

    getBookingConfig: (brandId: string) =>
      request<{
        data: {
          brandId: string;
          ctaText: string;
          ctaColor: string;
          ctaLinkUrl: string;
          enabledSources: ("gbp" | "website_widget" | "direct_link")[];
          widgetPosition: "bottom_right" | "bottom_left" | "center" | "inline";
          showOnPages: "all" | string[];
          autoOpenDelay: number;
          updatedAt: string;
        };
      }>(`/api/v1/gbp/booking/config?brandId=${brandId}`),

    updateBookingConfig: (brandId: string, updates: Record<string, unknown>) =>
      request<{
        data: {
          brandId: string;
          ctaText: string;
          ctaColor: string;
          ctaLinkUrl: string;
          enabledSources: ("gbp" | "website_widget" | "direct_link")[];
          widgetPosition: "bottom_right" | "bottom_left" | "center" | "inline";
          showOnPages: "all" | string[];
          autoOpenDelay: number;
          updatedAt: string;
        };
      }>('/api/v1/gbp/booking/config', {
        method: 'PUT',
        body: JSON.stringify({ brandId, ...updates }),
      }),

    getBookingStats: (brandId: string, period?: string) => {
      const params = new URLSearchParams({ brandId });
      if (period) params.set('period', period);
      return request<{
        data: {
          period: { start: string; end: string; range: string };
          funnel: Array<{ step: string; label: string; value: number; rate?: number }>;
          views: number;
          clicks: number;
          bookings: number;
          revenue: number;
          viewToClickRate: number;
          clickToBookingRate: number;
          overallConversionRate: number;
          avgBookingValue: number;
          trend: { views: number; clicks: number; bookings: number; revenue: number };
        };
      }>(`/api/v1/gbp/booking/stats?${params.toString()}`);
    },

    getRecentBookings: (brandId: string, limit?: number) => {
      const params = new URLSearchParams({ brandId });
      if (limit) params.set('limit', String(limit));
      return request<{
        data: Array<{
          id: string;
          customerName: string;
          service: string;
          source: "gbp" | "website_widget" | "direct_link";
          amount: number;
          status: "confirmed" | "pending" | "completed" | "cancelled" | "no_show";
          bookedAt: string;
        }>;
      }>(`/api/v1/gbp/booking/recent?${params.toString()}`);
    },

    // ─── Conversion Tracking ────────────────────────────────────────────────────

    trackConversionEvent: (params: {
      brandId: string;
      sessionId?: string;
      eventType: 'booking_cta_impression' | 'booking_cta_click' | 'booking_form_start' | 'booking_completed';
      source?: 'organic' | 'chat_widget' | 'gbp' | 'ad' | 'referral';
      metadata?: Record<string, unknown>;
    }) =>
      request<{
        data: {
          id: string;
          brandId: string;
          sessionId: string | null;
          eventType: string;
          source: string;
          metadata: Record<string, unknown>;
          createdAt: string;
        };
      }>('/api/v1/gbp/conversion/track', {
        method: 'POST',
        body: JSON.stringify(params),
      }),

    getConversionStats: (brandId: string, period?: string) => {
      const params = new URLSearchParams({ brandId });
      if (period) params.set('period', period);
      return request<{
        data: {
          funnel: {
            impressions: number;
            clicks: number;
            formStarts: number;
            bookings: number;
            impressionToClickRate: number;
            clickToFormStartRate: number;
            formStartToBookingRate: number;
            overallConversionRate: number;
          };
          sources: Array<{
            source: string;
            label: string;
            impressions: number;
            clicks: number;
            bookings: number;
            conversionRate: number;
          }>;
          trend: Array<{
            date: string;
            impressions: number;
            clicks: number;
            formStarts: number;
            bookings: number;
          }>;
          period: { start: string; end: string; range: string };
        };
      }>(`/api/v1/gbp/conversion/stats?${params.toString()}`);
    },

    getConversionTrend: (brandId: string, period?: string) => {
      const params = new URLSearchParams({ brandId });
      if (period) params.set('period', period);
      return request<{
        data: Array<{
          date: string;
          impressions: number;
          clicks: number;
          formStarts: number;
          bookings: number;
        }>;
      }>(`/api/v1/gbp/conversion/trend?${params.toString()}`);
    },

    // ─── Ads Integrations ────────────────────────────────────────────────────

    ads: {
      listAccounts: (brandId: string) =>
        request<{
          data: Array<{
            id: string;
            brand_id: string;
            platform: "google_ads" | "meta_ads";
            account_name: string;
            account_id: string;
            status: "connected" | "disconnected" | "error";
            currency: string;
            timezone: string;
            connected_at: string;
            last_synced_at: string | null;
          }>;
        }>(`/api/v1/gbp/ads/accounts?brandId=${brandId}`),

      connectAccount: (params: {
        brandId: string;
        platform: "google_ads" | "meta_ads";
        accountId: string;
        accountName?: string;
        accessToken?: string;
        refreshToken?: string;
      }) =>
        request<{
          data: {
            id: string;
            brand_id: string;
            platform: string;
            account_name: string;
            account_id: string;
            status: string;
            currency: string;
            timezone: string;
            connected_at: string;
            last_synced_at: string | null;
          };
        }>('/api/v1/gbp/ads/accounts', {
          method: 'POST',
          body: JSON.stringify(params),
        }),

      disconnectAccount: (accountId: string) =>
        request<{ data: { success: boolean } }>(
          `/api/v1/gbp/ads/accounts/${accountId}`,
          { method: 'DELETE' }
        ),

      listCampaigns: (brandId: string) =>
        request<{
          data: Array<{
            id: string;
            ad_account_id: string;
            platform: "google_ads" | "meta_ads";
            name: string;
            status: "active" | "paused" | "completed" | "draft";
            objective: string;
            budget_daily: number;
            budget_lifetime: number | null;
            spend: number;
            impressions: number;
            clicks: number;
            conversions: number;
            cost_per_click: number;
            cost_per_conversion: number;
            roas: number;
            revenue: number;
            start_date: string;
            end_date: string | null;
            created_at: string;
          }>;
        }>(`/api/v1/gbp/ads/campaigns?brandId=${brandId}`),

      getStats: (brandId: string) =>
        request<{
          data: {
            total_spend: number;
            total_revenue: number;
            total_impressions: number;
            total_clicks: number;
            total_conversions: number;
            average_roas: number;
            average_cpc: number;
            average_cpa: number;
            spend_trend: Array<{ date: string; spend: number; revenue: number }>;
            platform_breakdown: Array<{
              platform: "google_ads" | "meta_ads";
              spend: number;
              revenue: number;
              clicks: number;
              conversions: number;
              roas: number;
            }>;
          };
        }>(`/api/v1/gbp/ads/stats?brandId=${brandId}`),
    },
  },

  // ─── Account Manager ──────────────────────────────────────────────────────

  manager: {
    dashboard: () =>
      request<{
        manager: {
          id: string;
          name: string;
          email: string;
          role: string;
          avatarUrl: string | null;
          assignedBrands: string[];
          createdAt: string;
        };
        summary: {
          totalClients: number;
          totalMrr: number;
          avgSatisfaction: number;
          churnRate: number;
          activeClients: number;
          onboardingClients: number;
          atRiskClients: number;
          mrrChange: number;
          satisfactionChange: number;
          churnChange: number;
        };
        clients: Array<{
          brandId: string;
          businessName: string;
          tier: string;
          managerId: string | null;
          status: string;
          metrics: {
            totalFollowers: number;
            followersGrowth: number;
            impressionsThisMonth: number;
            engagementRate: number;
            postsPublished: number;
            avgReachPerPost: number;
          };
          subscription: {
            plan: string;
            mrr: number;
            startDate: string;
            nextBillingDate: string;
          };
          gbpStatus: {
            connected: boolean;
            averageRating: number;
            totalReviews: number;
            responseRate: number;
          };
          managerNotes: string;
          lastActivityAt: string;
          createdAt: string;
        }>;
        recentActivity: Array<{
          id: string;
          type: string;
          description: string;
          brandId: string;
          brandName: string;
          timestamp: string;
        }>;
      }>('/api/v1/manager/dashboard'),

    getClients: (filters?: { tier?: string; status?: string; search?: string }) => {
      const params = new URLSearchParams();
      if (filters?.tier) params.set('tier', filters.tier);
      if (filters?.status) params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);
      const qs = params.toString();
      return request<{
        data: Array<{
          brandId: string;
          businessName: string;
          tier: string;
          managerId: string | null;
          status: string;
          metrics: {
            totalFollowers: number;
            followersGrowth: number;
            impressionsThisMonth: number;
            engagementRate: number;
            postsPublished: number;
            avgReachPerPost: number;
          };
          subscription: {
            plan: string;
            mrr: number;
            startDate: string;
            nextBillingDate: string;
          };
          gbpStatus: {
            connected: boolean;
            averageRating: number;
            totalReviews: number;
            responseRate: number;
          };
          managerNotes: string;
          lastActivityAt: string;
          createdAt: string;
        }>;
      }>(`/api/v1/manager/clients${qs ? `?${qs}` : ''}`);
    },

    getClientDetail: (brandId: string) =>
      request<{
        data: {
          brandId: string;
          businessName: string;
          tier: string;
          managerId: string | null;
          status: string;
          metrics: {
            totalFollowers: number;
            followersGrowth: number;
            impressionsThisMonth: number;
            engagementRate: number;
            postsPublished: number;
            avgReachPerPost: number;
          };
          subscription: {
            plan: string;
            mrr: number;
            startDate: string;
            nextBillingDate: string;
          };
          gbpStatus: {
            connected: boolean;
            averageRating: number;
            totalReviews: number;
            responseRate: number;
          };
          managerNotes: string;
          lastActivityAt: string;
          createdAt: string;
        };
      }>(`/api/v1/manager/clients/${brandId}`),

    assignClient: (brandId: string, managerId: string) =>
      request<{
        data: {
          brandId: string;
          businessName: string;
          managerId: string;
        };
      }>(`/api/v1/manager/clients/${brandId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ managerId }),
      }),

    updateNotes: (brandId: string, notes: string) =>
      request<{
        data: {
          brandId: string;
          businessName: string;
          managerNotes: string;
        };
      }>(`/api/v1/manager/clients/${brandId}/notes`, {
        method: 'PUT',
        body: JSON.stringify({ notes }),
      }),
  },

  // ─── Rebooking Campaigns ──────────────────────────────────────────────────

  campaigns: {
    list: (brandId: string, params?: { status?: string; type?: string }) => {
      const searchParams = new URLSearchParams({ brandId });
      if (params?.status) searchParams.set('status', params.status);
      if (params?.type) searchParams.set('type', params.type);
      return request<{
        data: Array<{
          id: string;
          brandId: string;
          name: string;
          type: string;
          status: string;
          template: string;
          subject?: string;
          channel: string;
          triggers: Array<{
            eventType: string;
            delayDays: number;
            maxPerCustomer: number;
            timeOfDay: string;
            daysOfWeek: number[];
          }>;
          stats: {
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
            roi: number;
          };
          createdAt: string;
          updatedAt: string;
        }>;
      }>(`/api/v1/campaigns?${searchParams.toString()}`);
    },

    get: (campaignId: string) =>
      request<{
        data: {
          id: string;
          brandId: string;
          name: string;
          type: string;
          status: string;
          template: string;
          subject?: string;
          channel: string;
          triggers: Array<{
            eventType: string;
            delayDays: number;
            maxPerCustomer: number;
            timeOfDay: string;
            daysOfWeek: number[];
          }>;
          stats: {
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
            roi: number;
          };
          createdAt: string;
          updatedAt: string;
        };
      }>(`/api/v1/campaigns/${campaignId}`),

    create: (data: {
      brandId: string;
      name: string;
      type: string;
      template: string;
      subject?: string;
      channel: string;
      triggers: Array<{
        eventType: string;
        delayDays: number;
        maxPerCustomer: number;
        timeOfDay: string;
        daysOfWeek: number[];
      }>;
    }) =>
      request<{
        data: {
          id: string;
          brandId: string;
          name: string;
          type: string;
          status: string;
          template: string;
          subject?: string;
          channel: string;
          triggers: Array<{
            eventType: string;
            delayDays: number;
            maxPerCustomer: number;
            timeOfDay: string;
            daysOfWeek: number[];
          }>;
          stats: Record<string, number>;
          createdAt: string;
          updatedAt: string;
        };
      }>('/api/v1/campaigns', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (campaignId: string, updates: Record<string, unknown>) =>
      request<{
        data: {
          id: string;
          brandId: string;
          name: string;
          type: string;
          status: string;
          template: string;
          subject?: string;
          channel: string;
          triggers: unknown[];
          stats: Record<string, number>;
          createdAt: string;
          updatedAt: string;
        };
      }>(`/api/v1/campaigns/${campaignId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),

    getStats: (campaignId: string) =>
      request<{
        data: {
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
          roi: number;
        };
      }>(`/api/v1/campaigns/${campaignId}/stats`),

    getMessages: (campaignId: string, params?: { status?: string; limit?: number; offset?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.offset) searchParams.set('offset', String(params.offset));
      const qs = searchParams.toString();
      return request<{
        data: Array<{
          id: string;
          campaignId: string;
          brandId: string;
          recipientName: string;
          recipientPhone: string | null;
          recipientEmail: string | null;
          channel: string;
          status: string;
          sentAt: string | null;
          deliveredAt: string | null;
          openedAt: string | null;
          clickedAt: string | null;
          bookedAt: string | null;
          content: string;
          errorMessage: string | null;
          createdAt: string;
        }>;
      }>(`/api/v1/campaigns/${campaignId}/messages${qs ? `?${qs}` : ''}`);
    },
  },

  // ─── Landing Pages ────────────────────────────────────────────────────────
  landingPages: {
    list: (brandId: string) =>
      request<{ data: Array<{
        id: string;
        brandId: string;
        slug: string;
        title: string;
        templateType: string;
        headline: string;
        subheadline: string | null;
        offerText: string | null;
        originalPrice: string | null;
        salePrice: string | null;
        ctaText: string;
        ctaUrl: string | null;
        businessName: string;
        businessCategory: string | null;
        phone: string | null;
        address: string | null;
        isPublished: boolean;
        publishedAt: string | null;
        conversionTrackingEnabled: boolean;
        createdAt: string;
        updatedAt: string;
      }> }>(`/api/v1/landing-pages?brandId=${brandId}`),

    get: (slug: string) =>
      request<{ data: Record<string, unknown> }>(`/api/v1/landing-pages/${slug}`),

    create: (data: Record<string, unknown>) =>
      request<{ data: Record<string, unknown> }>('/api/v1/landing-pages', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (slug: string, data: Record<string, unknown>) =>
      request<{ data: Record<string, unknown> }>(`/api/v1/landing-pages/${slug}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (slug: string) =>
      request<{ data: { deleted: boolean; slug: string } }>(`/api/v1/landing-pages/${slug}`, {
        method: 'DELETE',
      }),

    publish: (slug: string) =>
      request<{ data: Record<string, unknown> }>(`/api/v1/landing-pages/${slug}/publish`, {
        method: 'POST',
      }),

    unpublish: (slug: string) =>
      request<{ data: Record<string, unknown> }>(`/api/v1/landing-pages/${slug}/unpublish`, {
        method: 'POST',
      }),
  },

  // ─── Ad Management Service ──────────────────────────────────────────────

  adManagement: {
    getTiers: () =>
      request<{
        tiers: Array<{
          id: string;
          name: string;
          price: number;
          description: string;
          features: string[];
          platforms: string[];
        }>;
      }>('/api/v1/ad-management/tiers'),

    getService: (brandId: string) =>
      request<{
        service: {
          id: string;
          brand_id: string;
          tier: string;
          tier_name: string;
          status: 'onboarding' | 'active' | 'paused' | 'cancelled';
          ad_spend_budget: number;
          target_area: string;
          business_categories: string[];
          platforms: string[];
          monthly_fee: number;
          created_at: string;
          activated_at: string | null;
        } | null;
      }>(`/api/v1/ad-management/service?brandId=${brandId}`),

    enroll: (params: {
      brandId: string;
      tier: string;
      adSpendBudget?: number;
      targetArea?: string;
      businessCategories?: string[];
    }) =>
      request<{
        service: {
          id: string;
          brand_id: string;
          tier: string;
          status: string;
          created_at: string;
        };
      }>('/api/v1/ad-management/service', {
        method: 'POST',
        body: JSON.stringify(params),
      }),

    updateService: (params: {
      brandId: string;
      tier?: string;
      adSpendBudget?: number;
      targetArea?: string;
      businessCategories?: string[];
    }) =>
      request<{
        service: Record<string, unknown>;
      }>('/api/v1/ad-management/service', {
        method: 'PUT',
        body: JSON.stringify(params),
      }),

    activate: (brandId: string) =>
      request<{
        service: Record<string, unknown>;
      }>('/api/v1/ad-management/service/activate', {
        method: 'POST',
        body: JSON.stringify({ brandId }),
      }),

    cancel: (brandId: string) =>
      request<{
        service: Record<string, unknown>;
      }>('/api/v1/ad-management/service/cancel', {
        method: 'POST',
        body: JSON.stringify({ brandId }),
      }),

    getMetrics: (brandId: string, period: string = '30d') =>
      request<{
        metrics: {
          total_ad_spend: number;
          total_revenue: number;
          roas: number;
          conversions: number;
          management_fee: number;
          total_cost: number;
          period: string;
        };
      }>(`/api/v1/ad-management/metrics?brandId=${brandId}&period=${period}`),

    getReport: (brandId: string, period: string = '30d') =>
      request<{
        report: {
          period: string;
          weekly_trend: Array<{
            week: string;
            spend: number;
            revenue: number;
            conversions: number;
          }>;
        };
      }>(`/api/v1/ad-management/report?brandId=${brandId}&period=${period}`),

    getSetupChecklist: (brandId: string) =>
      request<{
        checklist: Array<{
          id: string;
          step: string;
          label: string;
          description: string;
          completed: boolean;
          action_url?: string;
        }>;
        completion_percentage: number;
      }>(`/api/v1/ad-management/setup-checklist?brandId=${brandId}`),
  },
};
