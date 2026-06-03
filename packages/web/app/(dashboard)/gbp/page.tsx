"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Star,
  MessageSquare,
  Send,
  ExternalLink,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GbpAccount {
  id: string;
  brand_id: string;
  account_name: string;
  location_id: string;
  status: string;
  review_count: number;
  average_rating: number;
  response_rate: number;
  created_at: string;
}

interface Review {
  id: string;
  account_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  status: "new" | "replied" | "archived";
  reply_text: string | null;
  created_at: string;
}

interface SolicitationStats {
  sent: number;
  opened: number;
  clicked: number;
  reviewed: number;
  open_rate: number;
  click_rate: number;
  review_rate: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ratingStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`w-4 h-4 ${i < Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
    />
  ));
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function GbpDashboardPage() {
  const [accounts, setAccounts] = useState<GbpAccount[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [solStats, setSolStats] = useState<SolicitationStats | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Temp brand ID — will be replaced with auth context
  const BRAND_ID = "00000000-0000-0000-0000-000000000000";

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await api.gbp.listAccounts(BRAND_ID);
      const data = (res as any).data || res;
      setAccounts(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) {
        setSelectedAccount(data[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSolicitationStats = useCallback(async () => {
    try {
      const res = await api.gbp.solicitationStats(BRAND_ID);
      setSolStats((res as any).data || res);
    } catch {
      // Non-critical — dashboard still works without it
    }
  }, []);

  const fetchReviews = useCallback(async () => {
    if (!selectedAccount) return;
    try {
      const res = await api.gbp.getReviews(selectedAccount, 5);
      const data = (res as any).data || res;
      setReviews(Array.isArray(data) ? data : []);
    } catch {
      // Reviews are optional on dashboard
    }
  }, [selectedAccount]);

  useEffect(() => {
    fetchAccounts();
    fetchSolicitationStats();
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [selectedAccount]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error && accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-gray-500">{error}</p>
        <button
          onClick={() => { setLoading(true); setError(null); fetchAccounts(); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // ─── Computed stats ─────────────────────────────────────────────────────────

  const totalReviews = accounts.reduce((s, a) => s + a.review_count, 0);
  const avgRating =
    accounts.length > 0
      ? accounts.reduce((s, a) => s + a.average_rating * a.review_count, 0) / Math.max(totalReviews, 1)
      : 0;
  const avgResponseRate =
    accounts.length > 0
      ? accounts.reduce((s, a) => s + a.response_rate, 0) / accounts.length
      : 0;
  const newReviews = reviews.filter((r) => r.status === "new").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Google Business Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your reviews, reputation & visibility</p>
        </div>
        <Link
          href="/gbp/reviews"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Manage Reviews
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Reviews"
          value={totalReviews.toString()}
          icon={<Star className="w-5 h-5" />}
          change={newReviews > 0 ? `${newReviews} new` : undefined}
          changeType={newReviews > 0 ? "positive" : "neutral"}
        />
        <StatCard
          label="Average Rating"
          value={avgRating.toFixed(1)}
          icon={<Star className="w-5 h-5 text-yellow-400" />}
          change={avgRating >= 4.5 ? "Excellent" : avgRating >= 4 ? "Good" : undefined}
          changeType={avgRating >= 4 ? "positive" : "neutral"}
        />
        <StatCard
          label="Response Rate"
          value={`${Math.round(avgResponseRate * 100)}%`}
          icon={<MessageSquare className="w-5 h-5" />}
          change={avgResponseRate >= 0.8 ? "Great" : undefined}
          changeType={avgResponseRate >= 0.8 ? "positive" : "neutral"}
        />
        <StatCard
          label="Review Solicitations"
          value={solStats?.sent?.toString() ?? "—"}
          icon={<Send className="w-5 h-5" />}
          change={
            solStats
              ? `${Math.round(solStats.review_rate * 100)}% converted`
              : undefined
          }
          changeType="positive"
        />
      </div>

      {/* Account Selector + Recent Reviews */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Accounts List */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-indigo-500" />
              Connected Accounts
            </h2>
            <div className="space-y-3">
              {accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => setSelectedAccount(account.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedAccount === account.id
                      ? "border-indigo-300 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium text-gray-900">{account.account_name}</div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      {ratingStars(account.average_rating)}
                      {account.average_rating.toFixed(1)}
                    </span>
                    <span>{account.review_count} reviews</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-500" />
                Recent Reviews
              </h2>
              <Link
                href="/gbp/reviews"
                className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No reviews yet for this account</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className={`p-3 rounded-lg border ${
                      review.status === "new"
                        ? "border-yellow-300 bg-yellow-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{review.reviewer_name}</span>
                        <span className="flex items-center gap-0.5">
                          {ratingStars(review.rating)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {review.status === "new" && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                            New
                          </span>
                        )}
                        {review.status === "replied" && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                        <span className="text-xs text-gray-400">{timeAgo(review.created_at)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Solicitation Stats */}
      {solStats && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            Review Solicitation Funnel
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Sent", value: solStats.sent, rate: null },
              { label: "Opened", value: solStats.opened, rate: solStats.open_rate },
              { label: "Clicked", value: solStats.clicked, rate: solStats.click_rate },
              { label: "Reviews", value: solStats.reviewed, rate: solStats.review_rate },
            ].map((step) => (
              <div key={step.label} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{step.value}</div>
                <div className="text-sm text-gray-500">{step.label}</div>
                {step.rate !== null && (
                  <div className="text-xs text-indigo-600 mt-1">{(step.rate * 100).toFixed(0)}%</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {accounts.length === 0 && !error && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Star className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No GBP Accounts Connected</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Connect your Google Business Profile to start managing reviews, track your reputation,
            and send review solicitations to your customers.
          </p>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <Plus className="w-5 h-5" />
            Connect Google Business Profile
          </button>
        </div>
      )}
    </div>
  );
}