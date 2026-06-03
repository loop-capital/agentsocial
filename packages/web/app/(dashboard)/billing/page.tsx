"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Check,
  X,
  Crown,
  Zap,
  Building2,
  CreditCard,
  ArrowRight,
  ArrowDown,
  Loader2,
  Shield,
  Star,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TierLimit {
  postsPerMonth: number;
  socialAccounts: number;
  gbpLocations: number;
  brands: number;
  competitors: number;
  apiAccess: boolean;
  prioritySupport: boolean;
  whiteLabelReports: boolean;
}

interface ServiceTier {
  id: "core" | "pro" | "elite";
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  limits: TierLimit;
  popular?: boolean;
}

interface Subscription {
  id: string;
  brandId: string;
  tierId: "core" | "pro" | "elite";
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
}

// ─── Tier Styling ──────────────────────────────────────────────────────────────

const TIER_ICONS: Record<string, React.ElementType> = {
  core: Zap,
  pro: Crown,
  elite: Building2,
};

const TIER_ACCENT: Record<string, { border: string; bg: string; ring: string; button: string; badge: string; icon: string }> = {
  core: {
    border: "border-gray-200",
    bg: "bg-white",
    ring: "",
    button: "bg-gray-800 hover:bg-gray-900 text-white",
    badge: "bg-gray-100 text-gray-700",
    icon: "text-gray-500",
  },
  pro: {
    border: "border-blue-400",
    bg: "bg-blue-50/50",
    ring: "ring-2 ring-blue-400",
    button: "bg-blue-600 hover:bg-blue-700 text-white",
    badge: "bg-blue-100 text-blue-700",
    icon: "text-blue-500",
  },
  elite: {
    border: "border-purple-400",
    bg: "bg-purple-50/50",
    ring: "",
    button: "bg-purple-600 hover:bg-purple-700 text-white",
    badge: "bg-purple-100 text-purple-700",
    icon: "text-purple-500",
  },
};

const TIER_ORDER: ("core" | "pro" | "elite")[] = ["core", "pro", "elite"];

function tierRank(id: string): number {
  return TIER_ORDER.indexOf(id as any);
}

// ─── Comparison Helper ─────────────────────────────────────────────────────────

function formatLimit(value: number | boolean): string {
  if (value === Infinity || value === true) return "Unlimited";
  if (typeof value === "boolean") return value ? "✓" : "✗";
  return String(value);
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const [tiers, setTiers] = useState<ServiceTier[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    action: "upgrade" | "downgrade" | "cancel";
    tierId?: "core" | "pro" | "elite";
  } | null>(null);
  const [billingTab, setBillingTab] = useState<"plans" | "history">("plans");

  // Temp brand ID — will come from auth context
  const BRAND_ID = "00000000-0000-0000-0000-000000000000";

  const fetchTiers = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/billing/tiers`);
      if (!res.ok) throw new Error("Failed to fetch tiers");
      const data = await res.json();
      setTiers(data.tiers || []);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/billing/subscription?brand_id=${BRAND_ID}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setSubscription(data.subscription || null);
    } catch {
      // Not subscribed yet — that's fine
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchTiers(), fetchSubscription()]).finally(() => setLoading(false));
  }, [fetchTiers, fetchSubscription]);

  const handleTierChange = async (action: "upgrade" | "downgrade" | "cancel", targetTierId: "core" | "pro" | "elite") => {
    setProcessing(targetTierId);
    setError(null);
    try {
      const endpoint = action === "upgrade" ? "upgrade" : "downgrade";
      const res = await fetch(`${API_URL}/api/v1/billing/subscription/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ brand_id: BRAND_ID, target_tier_id: targetTierId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error?.message || `${action} failed`);
      }
      await fetchSubscription();
      setConfirmModal(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleCancel = async () => {
    setProcessing("cancel");
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/billing/subscription/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ brand_id: BRAND_ID }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error?.message || "Cancel failed");
      }
      await fetchSubscription();
      setConfirmModal(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  };

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  const currentTierId = subscription?.tierId || "core";
  const isActive = subscription?.status === "active" || subscription?.status === "trialing";
  const currentTier = tiers.find((t) => t.id === currentTierId);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Plans</h1>
        <p className="text-gray-500 mt-1">Manage your subscription, upgrade or downgrade your plan</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline ml-2">Dismiss</button>
        </div>
      )}

      {/* Current Plan Banner */}
      {subscription && (
        <div className={`p-5 rounded-xl border-2 ${
          isActive
            ? "bg-green-50 border-green-300"
            : "bg-yellow-50 border-yellow-300"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className={isActive ? "text-green-600" : "text-yellow-600"} size={24} />
              <div>
                <div className="font-semibold text-gray-900">
                  Current plan: <span className="capitalize">{currentTierId}</span>
                  {subscription.cancelAtPeriodEnd && (
                    <span className="ml-2 text-sm text-orange-600 font-normal">
                      Cancels at end of period
                    </span>
                  )}
                </div>
                {subscription.trialEndsAt && (
                  <span className="text-sm text-gray-500">
                    Trial ends {new Date(subscription.trialEndsAt).toLocaleDateString()}
                  </span>
                )}
                {subscription.currentPeriodEnd && (
                  <span className="text-sm text-gray-500 ml-2">
                    Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            {isActive && currentTierId !== "core" && (
              <button
                onClick={() => setConfirmModal({ action: "cancel" })}
                className="text-sm text-red-600 hover:text-red-700 underline"
              >
                Cancel subscription
              </button>
            )}
          </div>
          {subscription.status === "past_due" && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <AlertTriangle size={14} /> Payment overdue. Update your payment method to restore access.
            </p>
          )}
          {/* Current Plan Features */}
          {currentTier && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span>📝 {currentTier.limits.postsPerMonth === Infinity ? "Unlimited" : currentTier.limits.postsPerMonth} posts/mo</span>
                <span>📱 {currentTier.limits.socialAccounts === Infinity ? "Unlimited" : currentTier.limits.socialAccounts} accounts</span>
                <span>📍 {currentTier.limits.gbpLocations === Infinity ? "Unlimited" : currentTier.limits.gbpLocations} GBP locations</span>
                {currentTier.limits.apiAccess && <span>🔑 API Access</span>}
                {currentTier.limits.prioritySupport && <span>⚡ Priority Support</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setBillingTab("plans")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            billingTab === "plans"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Plans & Tiers
        </button>
        <button
          onClick={() => setBillingTab("history")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            billingTab === "history"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Billing History
        </button>
      </div>

      {/* ─── Plans Tab ──────────────────────────────────────────────────────── */}
      {billingTab === "plans" && (
        <>
          {/* Tier Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier) => {
              const Icon = TIER_ICONS[tier.id] || Zap;
              const style = TIER_ACCENT[tier.id] || TIER_ACCENT.core;
              const isCurrent = currentTierId === tier.id;
              const rank = tierRank(tier.id);
              const currentRank = tierRank(currentTierId);
              const isUpgrade = rank > currentRank;
              const isDowngrade = rank < currentRank;
              const isProcessing = processing === tier.id;

              return (
                <div
                  key={tier.id}
                  className={`relative rounded-2xl border-2 p-6 transition-all ${style.border} ${style.bg} ${
                    tier.popular ? style.ring : ""
                  } ${isCurrent ? "opacity-95" : "hover:shadow-lg"}`}
                >
                  {/* Popular Badge */}
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center gap-1">
                      <Star size={12} /> Most Popular
                    </div>
                  )}

                  {/* Tier Header */}
                  <div className="flex items-center gap-2 mb-4">
                    <Icon size={24} className={style.icon} />
                    <h2 className="text-xl font-bold text-gray-900">{tier.name}</h2>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      ${tier.price === 0 ? "0" : (tier.price / 100).toFixed(0)}
                    </span>
                    <span className="text-gray-500">/mo</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 min-h-[160px]">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check size={16} className="text-green-500 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {isCurrent ? (
                    <div className="w-full py-2.5 px-4 rounded-lg bg-gray-100 text-gray-600 text-center font-medium">
                      Current Plan
                    </div>
                  ) : isUpgrade ? (
                    <button
                      onClick={() => setConfirmModal({ action: "upgrade", tierId: tier.id })}
                      disabled={isProcessing}
                      className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${style.button} disabled:opacity-50`}
                    >
                      {isProcessing ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          Upgrade <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  ) : isDowngrade ? (
                    <button
                      onClick={() => setConfirmModal({ action: "downgrade", tierId: tier.id })}
                      disabled={isProcessing}
                      className="w-full py-2.5 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          Downgrade <ArrowDown size={16} />
                        </>
                      )}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Feature Comparison Table */}
          <div className="mt-10">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Compare all features</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Feature</th>
                    {tiers.map((t) => (
                      <th key={t.id} className={`text-center py-3 px-4 font-semibold ${t.id === currentTierId ? "text-blue-600" : "text-gray-900"}`}>
                        {t.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Posts / month", key: "postsPerMonth" as const },
                    { label: "Social accounts", key: "socialAccounts" as const },
                    { label: "GBP locations", key: "gbpLocations" as const },
                    { label: "Brands", key: "brands" as const },
                    { label: "Competitor monitors", key: "competitors" as const },
                    { label: "API access", key: "apiAccess" as const },
                    { label: "Priority support", key: "prioritySupport" as const },
                    { label: "White-label reports", key: "whiteLabelReports" as const },
                  ].map((row) => (
                    <tr key={row.key} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-700">{row.label}</td>
                      {tiers.map((t) => {
                        const val = t.limits[row.key];
                        return (
                          <td key={t.id} className="text-center py-3 px-4">
                            {val === true ? (
                              <Check size={18} className="text-green-500 mx-auto" />
                            ) : val === false ? (
                              <X size={18} className="text-gray-300 mx-auto" />
                            ) : val === Infinity ? (
                              <span className="text-blue-600 font-medium">Unlimited</span>
                            ) : (
                              <span>{val}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Money-back guarantee */}
          <div className="mt-6 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
            <Shield size={16} />
            30-day money-back guarantee · No hidden fees · Cancel anytime
          </div>
        </>
      )}

      {/* ─── History Tab ────────────────────────────────────────────────────── */}
      {billingTab === "history" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h3>
          <div className="text-center py-8 text-gray-400">
            <CreditCard size={40} className="mx-auto mb-2 opacity-50" />
            <p>No billing history yet</p>
            <p className="text-sm mt-1">Your invoices will appear here once you subscribe to a paid plan</p>
          </div>
        </div>
      )}

      {/* ─── Upgrade/Downgrade Confirmation Modal ────────────────────────────── */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            {confirmModal.action === "cancel" ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle size={24} className="text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Cancel Subscription?</h3>
                </div>
                <p className="text-gray-600 mb-2">
                  You&apos;ll lose access to paid features at the end of your billing period.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-sm text-amber-800">
                  <Sparkles size={14} className="inline mr-1" />
                  <strong>Wait!</strong> Keep your plan and get 20% off your next 3 months. Contact support to apply this discount.
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmModal(null)}
                    className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Keep my plan
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={processing === "cancel"}
                    className="flex-1 py-2 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processing === "cancel" ? <Loader2 size={16} className="animate-spin" /> : null}
                    Cancel subscription
                  </button>
                </div>
              </>
            ) : (
              (() => {
                const targetTier = tiers.find((t) => t.id === confirmModal.tierId);
                const isUpgrade = confirmModal.action === "upgrade";
                if (!targetTier) return null;

                return (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg ${isUpgrade ? "bg-blue-100" : "bg-amber-100"}`}>
                        {isUpgrade ? (
                          <ArrowRight size={24} className="text-blue-600" />
                        ) : (
                          <ArrowDown size={24} className="text-amber-600" />
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {isUpgrade ? "Upgrade" : "Downgrade"} to {targetTier.name}?
                      </h3>
                    </div>
                    <p className="text-gray-600 mb-4">
                      {isUpgrade
                        ? `You'll be charged a prorated amount for the remainder of your billing period.`
                        : `Downgrades take effect at the end of your current billing period. You'll retain access to your current plan until then.`}
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">New plan</span>
                        <span className="font-medium">{targetTier.name} — ${(targetTier.price / 100).toFixed(0)}/mo</span>
                      </div>
                      {isUpgrade && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Prorated charge</span>
                          <span className="font-medium text-blue-600">Applied immediately</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setConfirmModal(null)}
                        className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleTierChange(confirmModal.action, confirmModal.tierId!)}
                        disabled={processing === confirmModal.tierId}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2 ${
                          isUpgrade
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-amber-600 text-white hover:bg-amber-700"
                        }`}
                      >
                        {processing === confirmModal.tierId ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : null}
                        {isUpgrade ? "Confirm Upgrade" : "Confirm Downgrade"}
                      </button>
                    </div>
                  </>
                );
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
}