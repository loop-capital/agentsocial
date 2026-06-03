"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  DollarSign,
  Star,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  MessageSquare,
  UserPlus,
  Loader2,
  X,
  Save,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";
import { StatCard } from "../../../components/ui/stat-card";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AccountManager {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  assignedBrands: string[];
  createdAt: string;
}

interface ManagerDashboardSummary {
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
}

interface ClientAccount {
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
}

interface ActivityEntry {
  id: string;
  type: string;
  description: string;
  brandId: string;
  brandName: string;
  timestamp: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
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

function tierColor(tier: string): string {
  switch (tier) {
    case "enterprise": return "#7c3aed";
    case "pro": return "#2563eb";
    case "growth": return "#059669";
    case "starter": return "#6b7280";
    default: return "#6b7280";
  }
}

function tierBgColor(tier: string): string {
  switch (tier) {
    case "enterprise": return "rgba(124,58,237,0.1)";
    case "pro": return "rgba(37,99,235,0.1)";
    case "growth": return "rgba(5,150,105,0.1)";
    case "starter": return "rgba(107,114,128,0.1)";
    default: return "rgba(107,114,128,0.1)";
  }
}

function statusColor(status: string): string {
  switch (status) {
    case "active": return "#059669";
    case "onboarding": return "#2563eb";
    case "at_risk": return "#dc2626";
    case "churned": return "#6b7280";
    case "paused": return "#d97706";
    default: return "#6b7280";
  }
}

function statusBgColor(status: string): string {
  switch (status) {
    case "active": return "rgba(5,150,105,0.1)";
    case "onboarding": return "rgba(37,99,235,0.1)";
    case "at_risk": return "rgba(220,38,38,0.1)";
    case "churned": return "rgba(107,114,128,0.1)";
    case "paused": return "rgba(217,119,6,0.1)";
    default: return "rgba(107,114,128,0.1)";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "at_risk": return "At Risk";
    default: return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function activityIcon(type: string) {
  switch (type) {
    case "review_alert": return <AlertCircle size={14} style={{ color: "#dc2626" }} />;
    case "assignment": return <UserPlus size={14} style={{ color: "#2563eb" }} />;
    case "note": return <MessageSquare size={14} style={{ color: "#059669" }} />;
    case "tier_change": return <TrendingUp size={14} style={{ color: "#d97706" }} />;
    case "status_change": return <CheckCircle2 size={14} style={{ color: "#059669" }} />;
    case "message": return <MessageSquare size={14} style={{ color: "#2563eb" }} />;
    default: return <Info size={14} style={{ color: "#6b7280" }} />;
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ManagerPortalPage() {
  const [dashboard, setDashboard] = useState<{
    manager: AccountManager;
    summary: ManagerDashboardSummary;
    clients: ClientAccount[];
    recentActivity: ActivityEntry[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<ClientAccount | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.manager.dashboard();
      setDashboard(data as any);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const fetchClients = useCallback(async () => {
    try {
      const filters: Record<string, string> = {};
      if (filterTier !== "all") filters.tier = filterTier;
      if (filterStatus !== "all") filters.status = filterStatus;
      if (searchQuery) filters.search = searchQuery;

      const res = await api.manager.getClients(filters);
      const data = (res as any).data || res;
      if (dashboard) {
        setDashboard({ ...dashboard, clients: Array.isArray(data) ? data : [] });
      }
    } catch {
      // silently ignore filter errors — keep existing data
    }
  }, [filterTier, filterStatus, searchQuery, dashboard]);

  useEffect(() => {
    if (!loading && dashboard) {
      fetchClients();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTier, filterStatus]);

  const handleSelectClient = (client: ClientAccount) => {
    setSelectedClient(client);
    setNotesText(client.managerNotes);
    setEditingNotes(false);
  };

  const handleSaveNotes = async () => {
    if (!selectedClient) return;
    try {
      setSavingNotes(true);
      await api.manager.updateNotes(selectedClient.brandId, notesText);
      setSelectedClient({ ...selectedClient, managerNotes: notesText });
      setEditingNotes(false);
    } catch {
      // Could add toast notification here
    } finally {
      setSavingNotes(false);
    }
  };

  const handleAssignManager = async (brandId: string) => {
    try {
      const managerId = dashboard?.manager.id || "mgr-001";
      await api.manager.assignClient(brandId, managerId);
      // Refresh dashboard
      fetchDashboard();
    } catch {
      // Could add toast notification here
    }
  };

  // ─── Loading State ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent)" }} />
          <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>Loading manager dashboard…</p>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <AlertCircle size={32} style={{ color: "var(--danger)" }} />
          <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>
            {error || "Failed to load dashboard"}
          </p>
        </div>
      </div>
    );
  }

  const { manager, summary, clients, recentActivity } = dashboard;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
          Account Manager Portal
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
          Welcome back, {manager.name} · {manager.role.replace("_", " ")}
        </p>
      </div>

      {/* Stats Overview */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "1rem",
        marginBottom: "2rem",
      }}>
        <StatCard
          label="Total Clients"
          value={String(summary.totalClients)}
          change={`${summary.activeClients} active, ${summary.onboardingClients} onboarding`}
          changeType="neutral"
          icon={<Users size={18} />}
        />
        <StatCard
          label="Monthly Recurring Revenue"
          value={formatCurrency(summary.totalMrr)}
          change={`${summary.mrrChange > 0 ? "+" : ""}${summary.mrrChange}%`}
          changeType={summary.mrrChange >= 0 ? "positive" : "negative"}
          icon={<DollarSign size={18} />}
        />
        <StatCard
          label="Avg Satisfaction"
          value={`${summary.avgSatisfaction.toFixed(1)}★`}
          change={`${summary.satisfactionChange > 0 ? "+" : ""}${summary.satisfactionChange}`}
          changeType={summary.satisfactionChange >= 0 ? "positive" : "negative"}
          icon={<Star size={18} />}
        />
        <StatCard
          label="Churn Rate"
          value={`${(summary.churnRate * 100).toFixed(1)}%`}
          change={`${summary.churnChange > 0 ? "+" : ""}${(summary.churnChange * 100).toFixed(1)}%`}
          changeType={summary.churnChange <= 0 ? "positive" : "negative"}
          icon={<AlertTriangle size={18} />}
        />
      </div>

      {/* Main Content: Client List + Detail */}
      <div style={{ display: "grid", gridTemplateColumns: selectedClient ? "1fr 1fr" : "1fr", gap: "1.5rem", alignItems: "start" }}>

        {/* ─── Client List Panel ──────────────────────────────────────────────── */}
        <div style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}>
          {/* Search & Filters */}
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search clients…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem 0.5rem 2.25rem",
                  background: "var(--input-bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.5rem 0.75rem",
                background: showFilters ? "var(--accent)" : "var(--input-bg)",
                color: showFilters ? "#fff" : "var(--text-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                fontSize: "0.8125rem",
              }}
            >
              <Filter size={14} />
              Filters
            </button>
          </div>

          {/* Filter Row */}
          {showFilters && (
            <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                style={{
                  padding: "0.375rem 0.625rem",
                  background: "var(--input-bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  fontSize: "0.8125rem",
                }}
              >
                <option value="all">All Tiers</option>
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: "0.375rem 0.625rem",
                  background: "var(--input-bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  fontSize: "0.8125rem",
                }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="onboarding">Onboarding</option>
                <option value="at_risk">At Risk</option>
                <option value="paused">Paused</option>
                <option value="churned">Churned</option>
              </select>
            </div>
          )}

          {/* Client Rows */}
          <div style={{ maxHeight: "600px", overflowY: "auto" }}>
            {clients.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                <Users size={32} style={{ margin: "0 auto 0.75rem", opacity: 0.5 }} />
                <p>No clients match your filters</p>
              </div>
            ) : (
              clients.map((client) => (
                <button
                  key={client.brandId}
                  onClick={() => handleSelectClient(client)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    width: "100%",
                    padding: "0.875rem 1.25rem",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    background: selectedClient?.brandId === client.brandId ? "var(--accent-light)" : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedClient?.brandId !== client.brandId) {
                      e.currentTarget.style.background = "var(--hover-bg)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedClient?.brandId !== client.brandId) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  {/* Business Name + Tier */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)" }}>
                        {client.businessName}
                      </span>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "0.125rem 0.5rem",
                          borderRadius: "999px",
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: tierColor(client.tier),
                          background: tierBgColor(client.tier),
                        }}
                      >
                        {client.tier}
                      </span>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "0.125rem 0.5rem",
                          borderRadius: "999px",
                          fontSize: "0.6875rem",
                          fontWeight: 500,
                          color: statusColor(client.status),
                          background: statusBgColor(client.status),
                        }}
                      >
                        {client.status === "at_risk" && <AlertTriangle size={10} style={{ marginRight: "0.25rem" }} />}
                        {statusLabel(client.status)}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      <span>{formatCurrency(client.subscription.mrr)}/mo</span>
                      <span>{formatNumber(client.metrics.totalFollowers)} followers</span>
                      <span>{client.metrics.engagementRate.toFixed(1)}% eng.</span>
                    </div>
                  </div>
                  {/* MRR + Arrow */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--text-muted)" }}>
                    <ChevronRight size={16} />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ─── Client Detail Panel ──────────────────────────────────────────────── */}
        {selectedClient ? (
          <div style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}>
            {/* Detail Header */}
            <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                  {selectedClient.businessName}
                </h2>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: tierColor(selectedClient.tier), background: tierBgColor(selectedClient.tier), padding: "0.125rem 0.5rem", borderRadius: "999px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {selectedClient.tier}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: statusColor(selectedClient.status), background: statusBgColor(selectedClient.status), padding: "0.125rem 0.5rem", borderRadius: "999px", fontWeight: 500 }}>
                    {statusLabel(selectedClient.status)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.25rem" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Detail Body */}
            <div style={{ padding: "1.25rem", maxHeight: "calc(600px - 3.5rem)", overflowY: "auto" }}>

              {/* Key Metrics Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <div style={{ background: "var(--input-bg)", borderRadius: "var(--radius-md)", padding: "0.75rem", textAlign: "center" }}>
                  <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Followers</div>
                  <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)" }}>{formatNumber(selectedClient.metrics.totalFollowers)}</div>
                  <div style={{ fontSize: "0.6875rem", color: selectedClient.metrics.followersGrowth >= 0 ? "#059669" : "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.125rem" }}>
                    {selectedClient.metrics.followersGrowth >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {Math.abs(selectedClient.metrics.followersGrowth).toFixed(1)}%
                  </div>
                </div>
                <div style={{ background: "var(--input-bg)", borderRadius: "var(--radius-md)", padding: "0.75rem", textAlign: "center" }}>
                  <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Eng. Rate</div>
                  <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)" }}>{selectedClient.metrics.engagementRate.toFixed(1)}%</div>
                  <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{selectedClient.metrics.postsPublished} posts this mo.</div>
                </div>
                <div style={{ background: "var(--input-bg)", borderRadius: "var(--radius-md)", padding: "0.75rem", textAlign: "center" }}>
                  <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Impressions</div>
                  <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)" }}>{formatNumber(selectedClient.metrics.impressionsThisMonth)}</div>
                  <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>avg {formatNumber(selectedClient.metrics.avgReachPerPost)}/post</div>
                </div>
              </div>

              {/* Subscription & GBP */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Subscription & GBP
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div style={{ background: "var(--input-bg)", borderRadius: "var(--radius-md)", padding: "0.75rem" }}>
                    <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Plan</div>
                    <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)" }}>{selectedClient.subscription.plan}</div>
                    <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{formatCurrency(selectedClient.subscription.mrr)}/mo</div>
                  </div>
                  <div style={{ background: "var(--input-bg)", borderRadius: "var(--radius-md)", padding: "0.75rem" }}>
                    <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>GBP Status</div>
                    <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: selectedClient.gbpStatus.connected ? "#059669" : "#dc2626" }}>
                      {selectedClient.gbpStatus.connected ? "Connected" : "Not Connected"}
                    </div>
                    {selectedClient.gbpStatus.connected && (
                      <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                        {selectedClient.gbpStatus.averageRating.toFixed(1)}★ · {selectedClient.gbpStatus.totalReviews} reviews · {Math.round(selectedClient.gbpStatus.responseRate * 100)}% response
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Manager Notes */}
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <h3 style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Manager Notes
                  </h3>
                  {!editingNotes ? (
                    <button
                      onClick={() => setEditingNotes(true)}
                      style={{
                        background: "none",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-md)",
                        padding: "0.25rem 0.625rem",
                        fontSize: "0.75rem",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                  ) : (
                    <div style={{ display: "flex", gap: "0.375rem" }}>
                      <button
                        onClick={handleSaveNotes}
                        disabled={savingNotes}
                        style={{
                          background: "var(--accent)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "var(--radius-md)",
                          padding: "0.25rem 0.625rem",
                          fontSize: "0.75rem",
                          cursor: savingNotes ? "wait" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                      >
                        {savingNotes ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        Save
                      </button>
                      <button
                        onClick={() => { setEditingNotes(false); setNotesText(selectedClient.managerNotes); }}
                        style={{
                          background: "none",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-md)",
                          padding: "0.25rem 0.625rem",
                          fontSize: "0.75rem",
                          color: "var(--text-secondary)",
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                {editingNotes ? (
                  <textarea
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    style={{
                      width: "100%",
                      minHeight: "100px",
                      padding: "0.75rem",
                      background: "var(--input-bg)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-primary)",
                      fontSize: "0.8125rem",
                      resize: "vertical",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                  />
                ) : (
                  <div style={{
                    padding: "0.75rem",
                    background: "var(--input-bg)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.8125rem",
                    color: selectedClient.managerNotes ? "var(--text-primary)" : "var(--text-muted)",
                    fontStyle: selectedClient.managerNotes ? "normal" : "italic",
                    minHeight: "60px",
                  }}>
                    {selectedClient.managerNotes || "No notes yet. Click Edit to add notes."}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              {!selectedClient.managerId && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <button
                    onClick={() => handleAssignManager(selectedClient.brandId)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem 1rem",
                      background: "var(--accent)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer",
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                    }}
                  >
                    <UserPlus size={14} />
                    Assign to Me
                  </button>
                </div>
              )}

              {/* Recent Activity for this client */}
              <div>
                <h3 style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Recent Activity
                </h3>
                {recentActivity
                  .filter((a) => a.brandId === selectedClient.brandId)
                  .slice(0, 5)
                  .map((activity) => (
                    <div key={activity.id} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", padding: "0.5rem 0", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ marginTop: "0.125rem" }}>{activityIcon(activity.type)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.8125rem", color: "var(--text-primary)" }}>{activity.description}</div>
                        <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <Clock size={10} />
                          {timeAgo(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                {recentActivity.filter((a) => a.brandId === selectedClient.brandId).length === 0 && (
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontStyle: "italic" }}>No recent activity for this client.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "400px",
            color: "var(--text-muted)",
          }}>
            <Users size={48} style={{ marginBottom: "1rem", opacity: 0.4 }} />
            <p style={{ fontSize: "0.9375rem", fontWeight: 500 }}>Select a client to view details</p>
            <p style={{ fontSize: "0.8125rem", marginTop: "0.25rem" }}>Click on any client from the list to see their full profile</p>
          </div>
        )}
      </div>

      {/* ─── Recent Activity (Full) ────────────────────────────────────────── */}
      <div style={{ marginTop: "2rem" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem" }}>
          Recent Activity
        </h2>
        <div style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}>
          {recentActivity.map((activity, idx) => (
            <div
              key={activity.id}
              style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "flex-start",
                padding: "0.875rem 1.25rem",
                borderBottom: idx < recentActivity.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--input-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                {activityIcon(activity.type)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>{activity.description}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.125rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>{activity.brandName}</span>
                  <span>·</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.125rem" }}>
                    <Clock size={10} />
                    {timeAgo(activity.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}