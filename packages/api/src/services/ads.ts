// ─── Ads Integration Service ──────────────────────────────────────────────────
// Provides mock + real ad account management, campaign data, and spend/revenue
// aggregation for Google Ads and Meta Ads connected to salon/spa businesses.

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdAccount {
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
}

export interface Campaign {
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
}

export interface AdStats {
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
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_AD_ACCOUNTS: AdAccount[] = [
  {
    id: "adacct_google_001",
    brand_id: "00000000-0000-0000-0000-000000000000",
    platform: "google_ads",
    account_name: "Luxe Beauty Bar — Google Ads",
    account_id: "123-456-7890",
    status: "connected",
    currency: "USD",
    timezone: "America/New_York",
    connected_at: "2025-01-15T10:30:00Z",
    last_synced_at: "2025-05-11T08:00:00Z",
  },
  {
    id: "adacct_meta_001",
    brand_id: "00000000-0000-0000-0000-000000000000",
    platform: "meta_ads",
    account_name: "Luxe Beauty Bar — Meta Ads",
    account_id: "act_987654321",
    status: "connected",
    currency: "USD",
    timezone: "America/New_York",
    connected_at: "2025-02-20T14:15:00Z",
    last_synced_at: "2025-05-11T07:45:00Z",
  },
];

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: "camp_google_001",
    ad_account_id: "adacct_google_001",
    platform: "google_ads",
    name: "Summer Highlights Promo",
    status: "active",
    objective: "CONVERSIONS",
    budget_daily: 25,
    budget_lifetime: null,
    spend: 847.5,
    impressions: 42300,
    clicks: 1680,
    conversions: 67,
    cost_per_click: 0.5,
    cost_per_conversion: 12.65,
    roas: 4.8,
    revenue: 4068,
    start_date: "2025-04-01",
    end_date: null,
    created_at: "2025-03-28T09:00:00Z",
  },
  {
    id: "camp_google_002",
    ad_account_id: "adacct_google_001",
    platform: "google_ads",
    name: "Brand Awareness — Local Search",
    status: "active",
    objective: "BRAND_AWARENESS",
    budget_daily: 15,
    budget_lifetime: null,
    spend: 412.3,
    impressions: 28900,
    clicks: 890,
    conversions: 23,
    cost_per_click: 0.46,
    cost_per_conversion: 17.92,
    roas: 3.2,
    revenue: 1319.36,
    start_date: "2025-03-15",
    end_date: null,
    created_at: "2025-03-12T11:00:00Z",
  },
  {
    id: "camp_google_003",
    ad_account_id: "adacct_google_001",
    platform: "google_ads",
    name: "Bridal Package Spring",
    status: "completed",
    objective: "CONVERSIONS",
    budget_daily: 30,
    budget_lifetime: 2700,
    spend: 2150.0,
    impressions: 86000,
    clicks: 3240,
    conversions: 142,
    cost_per_click: 0.66,
    cost_per_conversion: 15.14,
    roas: 5.1,
    revenue: 10965,
    start_date: "2025-02-01",
    end_date: "2025-04-30",
    created_at: "2025-01-25T10:00:00Z",
  },
  {
    id: "camp_meta_001",
    ad_account_id: "adacct_meta_001",
    platform: "meta_ads",
    name: "Instagram Reels — Hair Transformations",
    status: "active",
    objective: "REACH",
    budget_daily: 20,
    budget_lifetime: null,
    spend: 620.0,
    impressions: 51600,
    clicks: 2060,
    conversions: 52,
    cost_per_click: 0.3,
    cost_per_conversion: 11.92,
    roas: 5.6,
    revenue: 3472,
    start_date: "2025-04-15",
    end_date: null,
    created_at: "2025-04-10T13:00:00Z",
  },
  {
    id: "camp_meta_002",
    ad_account_id: "adacct_meta_001",
    platform: "meta_ads",
    name: "Facebook Local — Spa Day Promo",
    status: "active",
    objective: "TRAFFIC",
    budget_daily: 18,
    budget_lifetime: null,
    spend: 538.2,
    impressions: 35880,
    clicks: 1790,
    conversions: 41,
    cost_per_click: 0.3,
    cost_per_conversion: 13.13,
    roas: 4.1,
    revenue: 2206.62,
    start_date: "2025-03-20",
    end_date: null,
    created_at: "2025-03-18T09:30:00Z",
  },
  {
    id: "camp_meta_003",
    ad_account_id: "adacct_meta_001",
    platform: "meta_ads",
    name: "Retargeting — Past Clients",
    status: "paused",
    objective: "CONVERSIONS",
    budget_daily: 10,
    budget_lifetime: null,
    spend: 245.8,
    impressions: 12290,
    clicks: 490,
    conversions: 28,
    cost_per_click: 0.5,
    cost_per_conversion: 8.78,
    roas: 6.2,
    revenue: 1523.96,
    start_date: "2025-05-01",
    end_date: null,
    created_at: "2025-04-28T16:00:00Z",
  },
];

function generateSpendTrend(): AdStats["spend_trend"] {
  const trend: AdStats["spend_trend"] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    // Simulate varying daily spend with a slight upward trend
    const baseSpend = 55 + i * 0.5;
    const dayOfWeek = date.getDay();
    const weekendBoost = dayOfWeek === 0 || dayOfWeek === 6 ? 15 : 0;
    const spend = parseFloat((baseSpend + weekendBoost + (Math.random() - 0.3) * 20).toFixed(2));
    const revenue = parseFloat((spend * (3.5 + Math.random() * 2.5)).toFixed(2));
    trend.push({ date: dateStr, spend, revenue });
  }
  return trend;
}

// ─── Ad Account Management ────────────────────────────────────────────────────

/** List connected ad accounts for a brand. */
export async function listAdAccounts(brandId: string): Promise<AdAccount[]> {
  // In production: query DB for connected ad accounts
  // For now: return mock data filtered by brandId
  return MOCK_AD_ACCOUNTS.filter(
    (a) => a.brand_id === brandId || brandId === "00000000-0000-0000-0000-000000000000"
  );
}

/** Connect an ad account for a brand. */
export async function connectAdAccount(input: {
  brandId: string;
  platform: "google_ads" | "meta_ads";
  accountId: string;
  accountName?: string;
  accessToken?: string;
  refreshToken?: string;
}): Promise<AdAccount> {
  // In production: store OAuth credentials and create ad account record
  const newAccount: AdAccount = {
    id: `adacct_${input.platform}_${Date.now().toString(36)}`,
    brand_id: input.brandId,
    platform: input.platform,
    account_name:
      input.accountName ||
      (input.platform === "google_ads" ? "Google Ads Account" : "Meta Ads Account"),
    account_id: input.accountId,
    status: "connected",
    currency: "USD",
    timezone: "America/New_York",
    connected_at: new Date().toISOString(),
    last_synced_at: null,
  };
  return newAccount;
}

/** Disconnect an ad account. */
export async function disconnectAdAccount(accountId: string): Promise<{ success: boolean }> {
  // In production: mark account as disconnected in DB, revoke tokens
  const account = MOCK_AD_ACCOUNTS.find((a) => a.id === accountId);
  if (!account) {
    throw new Error("Ad account not found");
  }
  return { success: true };
}

// ─── Campaign Data ────────────────────────────────────────────────────────────

/** List campaigns for a brand across all connected ad accounts. */
export async function listCampaigns(brandId: string): Promise<Campaign[]> {
  // In production: query campaigns from DB synced from ad platforms
  const accounts = await listAdAccounts(brandId);
  const accountIds = accounts.map((a) => a.id);
  return MOCK_CAMPAIGNS.filter((c) => accountIds.includes(c.ad_account_id));
}

// ─── Aggregated Stats ─────────────────────────────────────────────────────────

/** Get aggregated ad performance stats for a brand. */
export async function getAdStats(brandId: string): Promise<AdStats> {
  const campaigns = await listCampaigns(brandId);

  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);

  const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const avgCpa = totalConversions > 0 ? totalSpend / totalConversions : 0;

  // Platform breakdown
  const platformMap = new Map<string, { spend: number; revenue: number; clicks: number; conversions: number }>();
  for (const c of campaigns) {
    const existing = platformMap.get(c.platform) || { spend: 0, revenue: 0, clicks: 0, conversions: 0 };
    existing.spend += c.spend;
    existing.revenue += c.revenue;
    existing.clicks += c.clicks;
    existing.conversions += c.conversions;
    platformMap.set(c.platform, existing);
  }

  const platform_breakdown = Array.from(platformMap.entries()).map(([platform, data]) => ({
    platform: platform as "google_ads" | "meta_ads",
    ...data,
    roas: data.spend > 0 ? data.revenue / data.spend : 0,
  }));

  return {
    total_spend: parseFloat(totalSpend.toFixed(2)),
    total_revenue: parseFloat(totalRevenue.toFixed(2)),
    total_impressions: totalImpressions,
    total_clicks: totalClicks,
    total_conversions: totalConversions,
    average_roas: parseFloat(avgRoas.toFixed(2)),
    average_cpc: parseFloat(avgCpc.toFixed(2)),
    average_cpa: parseFloat(avgCpa.toFixed(2)),
    spend_trend: generateSpendTrend(),
    platform_breakdown,
  };
}