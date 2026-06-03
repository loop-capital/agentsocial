"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  Megaphone,
  TrendingUp,
  Target,
  MousePointerClick,
  CreditCard,
  Plus,
  Loader2,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Circle,
  ChevronRight,
  X,
  ArrowUpRight,
  Pause,
  Play,
  Shield,
  Zap,
  Crown,
  Info,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { StatCard } from "@/components/ui/stat-card";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdMgmtTier {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  platforms: string[];
}

interface AdMgmtService {
  id: string;
  brand_id: string;
  tier: string;
  tier_name: string;
  status: "onboarding" | "active" | "paused" | "cancelled";
  ad_spend_budget: number;
  target_area: string;
  business_categories: string[];
  platforms: string[];
  monthly_fee: number;
  created_at: string;
  activated_at: string | null;
}

interface AdMgmtMetrics {
  total_ad_spend: number;
  total_revenue: number;
  roas: number;
  conversions: number;
  management_fee: number;
  total_cost: number;
  period: string;
}

interface WeeklyTrendPoint {
  week: string;
  spend: number;
  revenue: number;
  conversions: number;
}

interface ChecklistStep {
  id: string;
  step: string;
  label: string;
  description: string;
  completed: boolean;
  action_url?: string;
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
    active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    paused: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    onboarding: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    completed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };
  return (
    <span
      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
        styles[status] || "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Custom Chart Tooltip ─────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} style={{ color: entry.color }} className="flex items-center gap-1">
          <span className="font-medium">
            {entry.dataKey === "spend" ? "Ad Spend" : "Revenue"}:
          </span>{" "}
          ${entry.value.toFixed(0)}
        </p>
      ))}
    </div>
  );
}

// ─── Default Tiers (fallback) ─────────────────────────────────────────────────

const DEFAULT_TIERS: AdMgmtTier[] = [
  {
    id: "starter",
    name: "Starter",
    price: 149,
    description: "Essential ad management for small businesses",
    features: [
      "Google Ads management",
      "Basic campaign setup",
      "Monthly performance report",
      "Up to $2,000/mo ad spend",
    ],
    platforms: ["google_ads"],
  },
  {
    id: "growth",
    name: "Growth",
    price: 249,
    description: "Full-service ad management across platforms",
    features: [
      "Google Ads + Meta Ads management",
      "A/B testing & optimization",
      "Weekly performance reports",
      "Up to $10,000/mo ad spend",
      "Dedicated ad specialist",
    ],
    platforms: ["google_ads", "meta_ads"],
  },
  {
    id: "scale",
    name: "Scale",
    price: 399,
    description: "Maximum ad performance for growing businesses",
    features: [
      "Google Ads + Meta Ads management",
      "Advanced A/B testing & optimization",
      "Real-time dashboards & reports",
      "Unlimited ad spend",
      "Dedicated ad strategist",
      "Priority support",
    ],
    platforms: ["google_ads", "meta_ads"],
  },
];

// ─── Tier Selection Modal ─────────────────────────────────────────────────────

function TierSelectModal({
  open,
  onClose,
  onSelect,
  tiers,
  currentTier,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (tierId: string) => void;
  tiers: AdMgmtTier[];
  currentTier?: string;
}) {
  if (!open) return null;
  const tierIcons: Record<string, React.ReactNode> = {
    starter: <Zap className="w-6 h-6 text-blue-500" />,
    growth: <TrendingUp className="w-6 h-6 text-purple-500" />,
    scale: <Crown className="w-6 h-6 text-amber-500" />,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Choose Your Plan
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-6 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <strong>Transparent pricing:</strong> Ad spend is billed directly by Google/Meta — we never
            mark up your ad costs. You only pay our management fee.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((tier) => {
            const isCurrent = currentTier === tier.id;
            return (
              <div
                key={tier.id}
                className={`relative rounded-xl border-2 p-5 transition-all ${
                  isCurrent
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600"
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Current Plan
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  {tierIcons[tier.id] || <Megaphone className="w-6 h-6 text-indigo-500" />}
                  <h4 className="font-bold text-gray-900 dark:text-gray-100">{tier.name}</h4>
                </div>
                <div className="mb-1">
                  <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    ${tier.price}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">/mo</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {tier.description}
                </p>
                <ul className="space-y-2 mb-5">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => onSelect(tier.id)}
                  disabled={isCurrent}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isCurrent
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {isCurrent ? "Current Plan" : "Select"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ad management is <strong className="text-indigo-600 dark:text-indigo-400">included in Elite ($499/mo)</strong>{" "}
            along with multi-location support, priority support, and a dedicated account manager.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Cancel Confirmation Modal ─────────────────────────────────────────────────

function CancelModal({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Cancel Ad Management?
          </h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Your campaigns will be paused and you&apos;ll lose access to performance dashboards. You can
          re-enroll at any time, but campaign data may not be preserved.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Keep Service
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Cancelling..." : "Cancel Service"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdManagementPage() {
  const BRAND_ID = "00000000-0000-0000-0000-000000000000";

  const [service, setService] = useState<AdMgmtService | null>(null);
  const [tiers, setTiers] = useState<AdMgmtTier[]>(DEFAULT_TIERS);
  const [metrics, setMetrics] = useState<AdMgmtMetrics | null>(null);
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrendPoint[]>([]);
  const [checklist, setChecklist] = useState<ChecklistStep[]>([]);
  const [completionPct, setCompletionPct] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [period, setPeriod] = useState<string>("30d");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [showTierModal, setShowTierModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // ─── Data fetching ──────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tiersRes, serviceRes] = await Promise.all([
        api.adManagement.getTiers(),
        api.adManagement.getService(BRAND_ID),
      ]);
      const tiersData = (tiersRes as any).tiers || tiersRes;
      if (Array.isArray(tiersData) && tiersData.length > 0) {
        setTiers(tiersData);
      }

      const serviceData = (serviceRes as any).service ?? (serviceRes as any).data ?? serviceRes;
      setService(serviceData && typeof serviceData === "object" && "id" in serviceData ? serviceData : null);

      if (serviceData && serviceData.status === "active") {
        const [metricsRes, reportRes, campaignsRes] = await Promise.all([
          api.adManagement.getMetrics(BRAND_ID, period),
          api.adManagement.getReport(BRAND_ID, period),
          api.gbp.ads.listCampaigns(BRAND_ID),
        ]);
        const metricsData = (metricsRes as any).metrics ?? metricsRes;
        setMetrics(metricsData && typeof metricsData === "object" ? metricsData : null);

        const reportData = (reportRes as any).report ?? reportRes;
        if (reportData?.weekly_trend) {
          setWeeklyTrend(reportData.weekly_trend);
        }

        const campaignsData = (campaignsRes as any).data || campaignsRes;
        setCampaigns(Array.isArray(campaignsData) ? campaignsData : []);
      }

      if (serviceData && serviceData.status === "onboarding") {
        const checklistRes = await api.adManagement.getSetupChecklist(BRAND_ID);
        const checklistData = (checklistRes as any).checklist ?? checklistRes;
        setChecklist(Array.isArray(checklistData) ? checklistData : []);
        const pctData = (checklistRes as any).completion_percentage;
        setCompletionPct(typeof pctData === "number" ? pctData : 0);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load ad management data");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePeriodChange = async (newPeriod: string) => {
    setPeriod(newPeriod);
    try {
      const [metricsRes, reportRes] = await Promise.all([
        api.adManagement.getMetrics(BRAND_ID, newPeriod),
        api.adManagement.getReport(BRAND_ID, newPeriod),
      ]);
      const metricsData = (metricsRes as any).metrics ?? metricsRes;
      setMetrics(metricsData && typeof metricsData === "object" ? metricsData : null);
      const reportData = (reportRes as any).report ?? reportRes;
      if (reportData?.weekly_trend) {
        setWeeklyTrend(reportData.weekly_trend);
      }
    } catch {
      // silently ignore period change errors
    }
  };

  // ─── Actions ────────────────────────────────────────────────────────────

  const handleEnroll = async (tierId: string) => {
    setActionLoading(true);
    try {
      const res = await api.adManagement.enroll({
        brandId: BRAND_ID,
        tier: tierId,
      });
      const serviceData = (res as any).service ?? res;
      setService(serviceData);
      setShowTierModal(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to enroll");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpgrade = async (tierId: string) => {
    setActionLoading(true);
    try {
      const res = await api.adManagement.updateService({
        brandId: BRAND_ID,
        tier: tierId,
      });
      const serviceData = (res as any).service ?? res;
      setService(serviceData);
      setShowTierModal(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to upgrade");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePause = async () => {
    setActionLoading(true);
    try {
      if (service?.status === "active") {
        await api.adManagement.cancel(BRAND_ID);
      }
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to pause");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      await api.adManagement.activate(BRAND_ID);
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to resume");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await api.adManagement.cancel(BRAND_ID);
      setShowCancelModal(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to cancel");
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Loading / Error ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error && !service) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-gray-500 dark:text-gray-400">{error}</p>
        <button
          onClick={() => fetchData()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // ─── Render: No Service (Get Started) ────────────────────────────────────

  if (!service) {
    const tierIcons: Record<string, React.ReactNode> = {
      starter: <Zap className="w-8 h-8 text-blue-500" />,
      growth: <TrendingUp className="w-8 h-8 text-purple-500" />,
      scale: <Crown className="w-8 h-8 text-amber-500" />,
    };

    return (
      <div className="space-y-6">
        {/* Hero */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Megaphone className="w-6 h-6" />
              <h2 className="text-sm font-medium uppercase tracking-wider opacity-80">
                Ad Management
              </h2>
            </div>
            <h1 className="text-3xl font-bold mb-3">
              Get Started with Professional Ad Management
            </h1>
            <p className="text-indigo-100 mb-6 text-lg">
              Let our experts manage your Google & Meta ads. Better targeting, higher ROAS, and
              transparent pricing — no hidden markups.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTierModal(true)}
                className="px-6 py-3 bg-white text-indigo-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Choose a Plan
              </button>
              <button className="px-6 py-3 border-2 border-white/40 text-white rounded-lg font-medium hover:bg-white/10 transition-colors">
                Start 14-Day Free Trial
              </button>
            </div>
          </div>
        </div>

        {/* Transparency note */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              Transparent pricing — no ad spend markup
            </p>
            <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
              Ad spend is billed directly by Google and Meta. You pay their rates, not a penny more.
              Our fee covers strategy, management, optimization, and reporting only.
            </p>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  {tierIcons[tier.id] || <Megaphone className="w-8 h-8 text-indigo-500" />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">{tier.name}</h3>
                  <div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      ${tier.price}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">/mo</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{tier.description}</p>
              <ul className="space-y-2 mb-6">
                {tier.features.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleEnroll(tier.id)}
                disabled={actionLoading}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Enrolling..." : "Get Started"}
              </button>
            </div>
          ))}
        </div>

        {/* Elite callout */}
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Ad management is{" "}
            <strong className="text-indigo-600 dark:text-indigo-400">included in Elite ($499/mo)</strong>{" "}
            along with multi-location management, priority support, and a dedicated account manager.{" "}
            <a href="/billing" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              View Elite plan →
            </a>
          </p>
        </div>

        <TierSelectModal
          open={showTierModal}
          onClose={() => setShowTierModal(false)}
          onSelect={handleEnroll}
          tiers={tiers}
        />
      </div>
    );
  }

  // ─── Render: Onboarding ─────────────────────────────────────────────────

  if (service.status === "onboarding") {
    const completedCount = checklist.filter((s) => s.completed).length;
    const totalCount = checklist.length || 6;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Ad Management Setup
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Complete these steps to activate your ad management service
            </p>
          </div>
          {statusBadge(service.status)}
        </div>

        {/* Service info */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {service.tier_name} Plan
              </h2>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
              ${service.monthly_fee}/mo
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {service.platforms.map((p) => (
              <div
                key={p}
                className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-600 dark:text-gray-400"
              >
                {platformIcon(p)}
                {platformLabel(p)}
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Setup Progress
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {completedCount} of {totalCount} steps completed
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${completionPct || (completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Checklist */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-200 dark:divide-gray-700">
          {checklist.length > 0 ? (
            checklist.map((step) => (
              <div
                key={step.id}
                className="flex items-start gap-4 p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                {step.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-300 dark:text-gray-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3
                    className={`font-medium ${
                      step.completed
                        ? "text-gray-400 dark:text-gray-500 line-through"
                        : "text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {step.label}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {step.description}
                  </p>
                </div>
                {step.action_url && !step.completed && (
                  <a
                    href={step.action_url}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                  >
                    Start
                    <ChevronRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Loading checklist...
              </p>
            </div>
          )}
        </div>

        {/* Activate button (when all steps done) */}
        {completionPct === 100 && (
          <div className="flex justify-end">
            <button
              onClick={async () => {
                setActionLoading(true);
                try {
                  await api.adManagement.activate(BRAND_ID);
                  await fetchData();
                } catch (err: any) {
                  setError(err.message);
                } finally {
                  setActionLoading(false);
                }
              }}
              disabled={actionLoading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Activate Service
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── Render: Cancelled ──────────────────────────────────────────────────

  if (service.status === "cancelled") {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Ad Management Cancelled
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Your ad management service has been cancelled. You can re-enroll at any time to resume
            campaign management and performance tracking.
          </p>
          <button
            onClick={() => setShowTierModal(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Re-enroll Now
          </button>
        </div>

        <TierSelectModal
          open={showTierModal}
          onClose={() => setShowTierModal(false)}
          onSelect={handleEnroll}
          tiers={tiers}
        />
      </div>
    );
  }

  // ─── Render: Active / Paused Dashboard ──────────────────────────────────

  const isPaused = service.status === "paused";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            Ad Management
            {statusBadge(service.status)}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isPaused
              ? "Your ad management service is paused. Resume to continue campaign optimization."
              : "Monitor and manage your ad performance across platforms."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPaused ? (
            <button
              onClick={handleResume}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              Resume Service
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowTierModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <ArrowUpRight className="w-4 h-4" />
                Upgrade
              </button>
              <button
                onClick={handlePause}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 border border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
            </>
          )}
        </div>
      </div>

      {/* Paused banner */}
      {isPaused && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
              Service Paused
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-0.5">
              Your ad campaigns are not being actively managed. Resume to continue optimization and
              reporting.
            </p>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            label="Total Ad Spend"
            value={formatCurrency(metrics.total_ad_spend)}
            icon={<DollarSign className="w-5 h-5" />}
            change={period === "7d" ? "Last 7 days" : period === "90d" ? "Last 90 days" : "Last 30 days"}
            changeType="neutral"
          />
          <StatCard
            label="Revenue from Ads"
            value={formatCurrency(metrics.total_revenue)}
            icon={<TrendingUp className="w-5 h-5" />}
            change={`${metrics.roas.toFixed(1)}x ROAS`}
            changeType={metrics.roas >= 3 ? "positive" : "negative"}
          />
          <StatCard
            label="ROAS"
            value={`${metrics.roas.toFixed(1)}x`}
            icon={<Target className="w-5 h-5" />}
            change="Return on ad spend"
            changeType={metrics.roas >= 3 ? "positive" : "negative"}
          />
          <StatCard
            label="Conversions"
            value={formatNumber(metrics.conversions)}
            icon={<MousePointerClick className="w-5 h-5" />}
            change="Total conversions"
            changeType="neutral"
          />
          <StatCard
            label="Management Fee"
            value={formatCurrency(metrics.management_fee)}
            icon={<CreditCard className="w-5 h-5" />}
            change={`${service.tier_name} plan`}
            changeType="neutral"
          />
          <StatCard
            label="Your Total Cost"
            value={formatCurrency(metrics.total_cost)}
            icon={<DollarSign className="w-5 h-5" />}
            change="Fee + Ad spend"
            changeType="neutral"
          />
        </div>
      )}

      {/* Performance Trend Chart */}
      {weeklyTrend.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              Performance Trend
            </h2>
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
              {(["7d", "30d", "90d"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePeriodChange(p)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    period === p
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm font-medium"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {p === "7d" ? "7D" : p === "30d" ? "30D" : "90D"}
                </button>
              ))}
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrend} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  tickFormatter={(val: number) => `$${val}`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  formatter={(value: string) =>
                    value === "spend" ? "Ad Spend" : "Revenue"
                  }
                />
                <Bar dataKey="spend" fill="#6366f1" radius={[4, 4, 0, 0]} name="spend" />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Campaign Performance Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Campaign Performance
        </h2>
        {campaigns.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No campaigns found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Campaign data will appear once your ads are running
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-3 font-medium text-gray-500 dark:text-gray-400">
                    Campaign
                  </th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 dark:text-gray-400">
                    Platform
                  </th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="text-right py-3 px-3 font-medium text-gray-500 dark:text-gray-400">
                    Spend
                  </th>
                  <th className="text-right py-3 px-3 font-medium text-gray-500 dark:text-gray-400">
                    Conversions
                  </th>
                  <th className="text-right py-3 px-3 font-medium text-gray-500 dark:text-gray-400">
                    Revenue
                  </th>
                  <th className="text-right py-3 px-3 font-medium text-gray-500 dark:text-gray-400">
                    ROAS
                  </th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {campaign.name}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {campaign.objective}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        {platformIcon(campaign.platform)}
                        <span className="text-gray-600 dark:text-gray-400">
                          {platformLabel(campaign.platform)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">{statusBadge(campaign.status)}</td>
                    <td className="py-3 px-3 text-right font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(campaign.spend)}
                    </td>
                    <td className="py-3 px-3 text-right text-gray-600 dark:text-gray-400">
                      {formatNumber(campaign.conversions)}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(campaign.revenue)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`font-bold ${
                          campaign.roas >= 4
                            ? "text-green-600 dark:text-green-400"
                            : campaign.roas >= 3
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
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

      {/* Service Info Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-indigo-500" />
          Service Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Current Plan</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {service.tier_name} — ${service.monthly_fee}/mo
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Platforms</p>
            <div className="flex items-center gap-2 mt-1">
              {service.platforms.map((p) => (
                <span
                  key={p}
                  className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300"
                >
                  {platformIcon(p)}
                  {platformLabel(p)}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Target Area</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {service.target_area || "Not set"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Ad Budget</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {service.ad_spend_budget ? formatCurrency(service.ad_spend_budget) : "Not set"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowTierModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Upgrade Plan
          </button>
          {!isPaused && (
            <button
              onClick={handlePause}
              disabled={actionLoading}
              className="px-4 py-2 border border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm font-medium hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
            >
              Pause Service
            </button>
          )}
          <button
            onClick={() => setShowCancelModal(true)}
            className="px-4 py-2 text-red-600 dark:text-red-400 text-sm hover:underline"
          >
            Cancel Service
          </button>
        </div>
      </div>

      {/* Modals */}
      <TierSelectModal
        open={showTierModal}
        onClose={() => setShowTierModal(false)}
        onSelect={service ? handleUpgrade : handleEnroll}
        tiers={tiers}
        currentTier={service?.tier}
      />
      <CancelModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        loading={actionLoading}
      />
    </div>
  );
}