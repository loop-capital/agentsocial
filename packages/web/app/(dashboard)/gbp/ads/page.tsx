"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  MousePointerClick,
  Target,
  TrendingUp,
  Plus,
  Loader2,
  AlertCircle,
  BarChart3,
  ExternalLink,
  Plug,
  Unplug,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { StatCard } from "@/components/ui/stat-card";
import { api } from "../../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdAccount {
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

interface Campaign {
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

interface AdStats {
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function platformLabel(platform: string): string {
  return platform === "google_ads" ? "Google Ads" : "Meta Ads";
}

function platformIcon(platform: string) {
  if (platform === "google_ads") {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#4285F4" />
        <path d="M2 17l10 5 10-5" fill="#34A853" />
        <path d="M2 12l10 5 10-5" fill="#FBBC05" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.008 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.47h-2.796v8.385C19.612 22.954 24 17.99 24 12z" />
    </svg>
  );
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    paused: "bg-yellow-100 text-yellow-700",
    completed: "bg-blue-100 text-blue-700",
    draft: "bg-gray-100 text-gray-600",
    connected: "bg-green-100 text-green-700",
    disconnected: "bg-red-100 text-red-700",
    error: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Custom Chart Tooltip ─────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-900 mb-1">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} style={{ color: entry.color }} className="flex items-center gap-1">
          <span className="font-medium">{entry.name === "spend" ? "Ad Spend" : "Revenue"}:</span>
          ${entry.value.toFixed(2)}
        </p>
      ))}
    </div>
  );
}

// ─── Connect Modal ────────────────────────────────────────────────────────────

function ConnectModal({
  open,
  onClose,
  onConnect,
}: {
  open: boolean;
  onClose: () => void;
  onConnect: (platform: "google_ads" | "meta_ads") => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect Ad Account</h3>
        <p className="text-sm text-gray-500 mb-6">
          Select a platform to connect your ad account. You&apos;ll be redirected to authorize access.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => onConnect("google_ads")}
            className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#4285F4" />
                <path d="M2 17l10 5 10-5" fill="#34A853" />
                <path d="M2 12l10 5 10-5" fill="#FBBC05" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900">Google Ads</div>
              <div className="text-xs text-gray-500">Search, Display, YouTube & more</div>
            </div>
          </button>
          <button
            onClick={() => onConnect("meta_ads")}
            className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.008 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.47h-2.796v8.385C19.612 22.954 24 17.99 24 12z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900">Meta Ads</div>
              <div className="text-xs text-gray-500">Facebook & Instagram advertising</div>
            </div>
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdsDashboardPage() {
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<AdStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConnect, setShowConnect] = useState(false);

  const BRAND_ID = "00000000-0000-0000-0000-000000000000";

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [accountsRes, campaignsRes, statsRes] = await Promise.all([
        api.gbp.ads.listAccounts(BRAND_ID),
        api.gbp.ads.listCampaigns(BRAND_ID),
        api.gbp.ads.getStats(BRAND_ID),
      ]);
      const accountsData = (accountsRes as any).data || accountsRes;
      const campaignsData = (campaignsRes as any).data || campaignsRes;
      const statsData = (statsRes as any).data || statsRes;
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
      setCampaigns(Array.isArray(campaignsData) ? campaignsData : []);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleConnect = async (platform: "google_ads" | "meta_ads") => {
    try {
      await api.gbp.ads.connectAccount({
        brandId: BRAND_ID,
        platform,
        accountId: `demo_${platform}_${Date.now()}`,
        accountName: platform === "google_ads" ? "Google Ads Account" : "Meta Ads Account",
      });
      setShowConnect(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      await api.gbp.ads.disconnectAccount(accountId);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error && accounts.length === 0 && !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-gray-500">{error}</p>
        <button
          onClick={() => { setLoading(true); setError(null); fetchData(); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ads Integrations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track ad performance alongside your Google Business Profile data
          </p>
        </div>
        <button
          onClick={() => setShowConnect(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Connect Ad Account
        </button>
      </div>

      {/* Connect Modal */}
      <ConnectModal
        open={showConnect}
        onClose={() => setShowConnect(false)}
        onConnect={handleConnect}
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Ad Spend"
            value={formatCurrency(stats.total_spend)}
            icon={<DollarSign className="w-5 h-5" />}
            change={`${stats.average_roas.toFixed(1)}x ROAS`}
            changeType={stats.average_roas >= 3 ? "positive" : "negative"}
          />
          <StatCard
            label="Ad Revenue"
            value={formatCurrency(stats.total_revenue)}
            icon={<TrendingUp className="w-5 h-5" />}
            change={`${((stats.total_revenue / Math.max(stats.total_spend, 1) - 1) * 100).toFixed(0)}% ROI`}
            changeType="positive"
          />
          <StatCard
            label="Total Clicks"
            value={formatNumber(stats.total_clicks)}
            icon={<MousePointerClick className="w-5 h-5" />}
            change={`$${stats.average_cpc.toFixed(2)} avg CPC`}
            changeType="neutral"
          />
          <StatCard
            label="Conversions"
            value={formatNumber(stats.total_conversions)}
            icon={<Target className="w-5 h-5" />}
            change={`$${stats.average_cpa.toFixed(2)} avg CPA`}
            changeType="neutral"
          />
        </div>
      )}

      {/* Connected Ad Accounts */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plug className="w-5 h-5 text-indigo-500" />
          Connected Ad Accounts
        </h2>
        {accounts.length === 0 ? (
          <div className="text-center py-8">
            <ExternalLink className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No ad accounts connected yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Connect Google Ads or Meta Ads to start tracking performance
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    {platformIcon(account.platform)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{account.account_name}</div>
                    <div className="flex items-center gap-3 mt-0.5 text-sm text-gray-500">
                      <span>{platformLabel(account.platform)}</span>
                      <span>·</span>
                      <span>ID: {account.account_id}</span>
                      <span>·</span>
                      {statusBadge(account.status)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {account.last_synced_at && (
                    <span className="text-xs text-gray-400">
                      Last synced: {new Date(account.last_synced_at).toLocaleDateString()}
                    </span>
                  )}
                  <button
                    onClick={() => handleDisconnect(account.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Unplug className="w-3.5 h-3.5" />
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spend Trend Chart */}
      {stats && stats.spend_trend.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            Ad Spend & Revenue Trend
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.spend_trend}>
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  tickFormatter={(val: string) => {
                    const d = new Date(val);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  tickFormatter={(val: number) => `$${val}`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="spend"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#spendGradient)"
                  name="spend"
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                  name="revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Platform Breakdown */}
      {stats && stats.platform_breakdown.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Breakdown</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.platform_breakdown.map((pb) => (
              <div key={pb.platform} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  {platformIcon(pb.platform)}
                  <span className="font-medium text-gray-900">{platformLabel(pb.platform)}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-500">Spend</div>
                    <div className="font-semibold text-gray-900">{formatCurrency(pb.spend)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Revenue</div>
                    <div className="font-semibold text-gray-900">{formatCurrency(pb.revenue)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Clicks</div>
                    <div className="font-semibold text-gray-900">{formatNumber(pb.clicks)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Conversions</div>
                    <div className="font-semibold text-gray-900">{formatNumber(pb.conversions)}</div>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">ROAS</span>
                      <span className={`font-bold ${pb.roas >= 4 ? "text-green-600" : pb.roas >= 3 ? "text-yellow-600" : "text-red-600"}`}>
                        {pb.roas.toFixed(1)}x
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campaign Performance Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign Performance</h2>
        {campaigns.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No campaigns found</p>
            <p className="text-sm text-gray-400 mt-1">
              Connect an ad account to see campaign data
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Campaign</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Platform</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Status</th>
                  <th className="text-right py-3 px-3 font-medium text-gray-500">Spend</th>
                  <th className="text-right py-3 px-3 font-medium text-gray-500">Clicks</th>
                  <th className="text-right py-3 px-3 font-medium text-gray-500">Conversions</th>
                  <th className="text-right py-3 px-3 font-medium text-gray-500">Revenue</th>
                  <th className="text-right py-3 px-3 font-medium text-gray-500">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-medium text-gray-900">{campaign.name}</div>
                      <div className="text-xs text-gray-400">{campaign.objective}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        {platformIcon(campaign.platform)}
                        <span className="text-gray-600">{platformLabel(campaign.platform)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">{statusBadge(campaign.status)}</td>
                    <td className="py-3 px-3 text-right font-medium text-gray-900">
                      {formatCurrency(campaign.spend)}
                    </td>
                    <td className="py-3 px-3 text-right text-gray-600">
                      {formatNumber(campaign.clicks)}
                    </td>
                    <td className="py-3 px-3 text-right text-gray-600">
                      {formatNumber(campaign.conversions)}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-gray-900">
                      {formatCurrency(campaign.revenue)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className={`font-bold ${
                        campaign.roas >= 4 ? "text-green-600" : campaign.roas >= 3 ? "text-yellow-600" : "text-red-600"
                      }`}>
                        {campaign.roas.toFixed(1)}x
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Connect Buttons (shown when no accounts) */}
      {accounts.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BarChart3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Ad Accounts Connected</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Connect Google Ads or Meta Ads to track ad spend, conversions, and ROAS alongside your
            Google Business Profile data.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => handleConnect("google_ads")}
              className="flex items-center gap-2 px-5 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#4285F4" />
                <path d="M2 17l10 5 10-5" fill="#34A853" />
                <path d="M2 12l10 5 10-5" fill="#FBBC05" />
              </svg>
              Connect Google Ads
            </button>
            <button
              onClick={() => handleConnect("meta_ads")}
              className="flex items-center gap-2 px-5 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.008 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.47h-2.796v8.385C19.612 22.954 24 17.99 24 12z" />
              </svg>
              Connect Meta Ads
            </button>
          </div>
        </div>
      )}
    </div>
  );
}