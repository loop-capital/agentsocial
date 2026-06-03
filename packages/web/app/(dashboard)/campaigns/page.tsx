"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Send,
  Mail,
  MessageSquare,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Clock,
  MoreHorizontal,
  Plus,
  Copy,
  Pause,
  Play,
  Archive,
  Loader2,
  AlertCircle,
  ChevronRight,
  X,
  Search,
  Filter,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Eye,
  MousePointerClick,
  CalendarCheck,
} from "lucide-react";
import { StatCard } from "../../../components/ui/stat-card";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type CampaignType = "rebooking" | "birthday" | "winback" | "custom";
type CampaignStatus = "active" | "paused" | "draft" | "completed" | "archived";
type CampaignMessageStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "booked"
  | "failed"
  | "opted_out";

interface CampaignTrigger {
  eventType: string;
  delayDays: number;
  maxPerCustomer: number;
  timeOfDay: string;
  daysOfWeek: number[];
}

interface CampaignStats {
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
}

interface Campaign {
  id: string;
  brandId: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  template: string;
  subject?: string;
  channel: "sms" | "email" | "both";
  triggers: CampaignTrigger[];
  stats: CampaignStats;
  createdAt: string;
  updatedAt: string;
}

interface CampaignMessage {
  id: string;
  campaignId: string;
  brandId: string;
  recipientName: string;
  recipientPhone: string | null;
  recipientEmail: string | null;
  channel: "sms" | "email";
  status: CampaignMessageStatus;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  bookedAt: string | null;
  content: string;
  errorMessage: string | null;
  createdAt: string;
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

function formatPercent(value: number): string {
  if (value === 0) return "0%";
  return `${(value * 100).toFixed(1)}%`;
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

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: "Active", color: "bg-green-100 text-green-700", icon: <Play className="w-3 h-3" /> },
  paused: { label: "Paused", color: "bg-yellow-100 text-yellow-700", icon: <Pause className="w-3 h-3" /> },
  draft: { label: "Draft", color: "bg-gray-100 text-gray-700", icon: <Clock className="w-3 h-3" /> },
  completed: { label: "Completed", color: "bg-blue-100 text-blue-700", icon: <CheckCircle2 className="w-3 h-3" /> },
  archived: { label: "Archived", color: "bg-gray-100 text-gray-500", icon: <Archive className="w-3 h-3" /> },
};

const TYPE_CONFIG: Record<CampaignType, { label: string; emoji: string; description: string }> = {
  rebooking: { label: "Rebooking", emoji: "💇", description: "Remind clients to book their next appointment" },
  birthday: { label: "Birthday", emoji: "🎂", description: "Special offers for client birthdays" },
  winback: { label: "Win-back", emoji: "🌟", description: "Re-engage clients who haven't visited recently" },
  custom: { label: "Custom", emoji: "✨", description: "Custom campaign type" },
};

const CHANNEL_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  sms: { label: "SMS", icon: <MessageSquare className="w-4 h-4" /> },
  email: { label: "Email", icon: <Mail className="w-4 h-4" /> },
  both: { label: "SMS + Email", icon: <Send className="w-4 h-4" /> },
};

const MESSAGE_STATUS_CONFIG: Record<CampaignMessageStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-gray-100 text-gray-700" },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-700" },
  delivered: { label: "Delivered", color: "bg-blue-100 text-blue-800" },
  opened: { label: "Opened", color: "bg-purple-100 text-purple-700" },
  clicked: { label: "Clicked", color: "bg-indigo-100 text-indigo-700" },
  booked: { label: "Booked", color: "bg-green-100 text-green-700" },
  failed: { label: "Failed", color: "bg-red-100 text-red-700" },
  opted_out: { label: "Opted Out", color: "bg-gray-100 text-gray-500" },
};

const DAYS_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── Create Campaign Modal ────────────────────────────────────────────────────

function CreateCampaignModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    type: CampaignType;
    template: string;
    subject?: string;
    channel: "sms" | "email" | "both";
    triggers: CampaignTrigger[];
  }) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<CampaignType>("rebooking");
  const [template, setTemplate] = useState("");
  const [subject, setSubject] = useState("");
  const [channel, setChannel] = useState<"sms" | "email" | "both">("sms");
  const [delayDays, setDelayDays] = useState(3);
  const [timeOfDay, setTimeOfDay] = useState("10:00");
  const [maxPerCustomer, setMaxPerCustomer] = useState(1);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !template.trim()) return;
    setCreating(true);
    try {
      onCreate({
        name,
        type,
        template,
        subject: subject || undefined,
        channel,
        triggers: [
          {
            eventType: type === "rebooking" ? "appointment_completed" : type === "birthday" ? "birthday" : "days_since_visit",
            delayDays,
            maxPerCustomer,
            timeOfDay,
            daysOfWeek: [1, 2, 3, 4, 5],
          },
        ],
      });
      onClose();
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Create Campaign</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Campaign Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 3-Day Rebooking Reminder"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Campaign Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(TYPE_CONFIG) as [CampaignType, typeof TYPE_CONFIG[CampaignType]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setType(key)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    type === key
                      ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-lg mb-1">{cfg.emoji}</div>
                  <div className="text-xs font-medium text-gray-900">{cfg.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Channel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
            <div className="grid grid-cols-3 gap-2">
              {(["sms", "email", "both"] as const).map((ch) => (
                <button
                  key={ch}
                  onClick={() => setChannel(ch)}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-sm transition-all ${
                    channel === ch
                      ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {CHANNEL_CONFIG[ch].icon}
                  <span className="font-medium text-gray-900">{CHANNEL_CONFIG[ch].label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Email Subject (only for email/both) */}
          {(channel === "email" || channel === "both") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., We'd love to see you again!"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Message Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message Template</label>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="Hi {{name}}! It's been a few days since your {{service}} appointment. Book your next visit at {{bookingLink}}"
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
            <div className="mt-1 text-xs text-gray-400">
              Available variables: {`{{name}}, {{service}}, {{bookingLink}}`}
            </div>
          </div>

          {/* Trigger Settings */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="text-sm font-medium text-gray-700">Trigger Settings</div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Delay (days)</label>
                <input
                  type="number"
                  min={0}
                  max={90}
                  value={delayDays}
                  onChange={(e) => setDelayDays(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Send Time</label>
                <input
                  type="time"
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max / Customer</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={maxPerCustomer}
                  onChange={(e) => setMaxPerCustomer(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="text-xs text-gray-400">
              Trigger: {TYPE_CONFIG[type]?.description}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || !template.trim() || creating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Campaign
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Campaign Detail View ─────────────────────────────────────────────────────

function CampaignDetailView({
  campaign,
  messages,
  onBack,
  onStatusChange,
}: {
  campaign: Campaign;
  messages: CampaignMessage[];
  onBack: () => void;
  onStatusChange: (id: string, status: CampaignStatus) => void;
}) {
  const stats = campaign.stats;
  const typeConfig = TYPE_CONFIG[campaign.type];
  const statusConfig = STATUS_CONFIG[campaign.status];
  const channelConfig = CHANNEL_CONFIG[campaign.channel];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronRight className="w-5 h-5 text-gray-500 rotate-180" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{typeConfig.emoji}</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                  {statusConfig.icon}
                  {statusConfig.label}
                </span>
                <span className="text-sm text-gray-500">
                  via {channelConfig.label}
                </span>
                <span className="text-sm text-gray-400">•</span>
                <span className="text-sm text-gray-500">{typeConfig.label}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {campaign.status === "active" && (
            <button
              onClick={() => onStatusChange(campaign.id, "paused")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
          )}
          {campaign.status === "paused" && (
            <button
              onClick={() => onStatusChange(campaign.id, "active")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              Resume
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Messages Sent"
          value={stats.sent.toLocaleString()}
          icon={<Send className="w-5 h-5" />}
          change={stats.sent > 0 ? `${formatPercent(stats.clickRate)} CTR` : "No data"}
          changeType={stats.clickRate > 0.1 ? "positive" : "neutral"}
        />
        <StatCard
          label="Bookings"
          value={stats.booked.toLocaleString()}
          icon={<CalendarCheck className="w-5 h-5" />}
          change={stats.sent > 0 ? `${formatPercent(stats.bookRate)} book rate` : "No data"}
          changeType={stats.bookRate > 0.1 ? "positive" : "neutral"}
        />
        <StatCard
          label="Revenue"
          value={formatCurrency(stats.revenue)}
          icon={<DollarSign className="w-5 h-5" />}
          change={`$${stats.booked > 0 ? Math.round(stats.revenue / stats.booked) : 0} avg/book`}
          changeType="positive"
        />
        <StatCard
          label="ROI"
          value={`${stats.roi.toFixed(1)}x`}
          icon={<TrendingUp className="w-5 h-5" />}
          change={stats.roi > 3 ? "Strong" : stats.roi > 1.5 ? "Good" : "Needs work"}
          changeType={stats.roi > 3 ? "positive" : stats.roi > 1.5 ? "neutral" : "negative"}
        />
      </div>

      {/* Performance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-500" />
            Performance Funnel
          </h2>
          <div className="space-y-3">
            {[
              { label: "Sent", value: stats.sent, icon: <Send className="w-4 h-4 text-blue-500" /> },
              { label: "Delivered", value: stats.delivered, icon: <CheckCircle2 className="w-4 h-4 text-blue-600" /> },
              { label: "Opened", value: stats.opened, icon: <Eye className="w-4 h-4 text-purple-500" /> },
              { label: "Clicked", value: stats.clicked, icon: <MousePointerClick className="w-4 h-4 text-indigo-500" /> },
              { label: "Booked", value: stats.booked, icon: <CalendarCheck className="w-4 h-4 text-green-500" /> },
            ].map((step) => {
              const pct = stats.sent > 0 ? (step.value / stats.sent) * 100 : 0;
              return (
                <div key={step.label} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-600 flex items-center gap-1.5">
                    {step.icon}
                    {step.label}
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <div className="w-16 text-right text-sm font-medium text-gray-900">
                    {step.value.toLocaleString()}
                  </div>
                  <div className="w-12 text-right text-xs text-gray-500">
                    {pct.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
          {stats.failed > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-sm text-red-600">
              <XCircle className="w-4 h-4" />
              {stats.failed.toLocaleString()} failed deliveries
              {stats.optedOut > 0 && <span className="text-gray-500">• {stats.optedOut} opted out</span>}
            </div>
          )}
        </div>

        {/* Campaign Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign Details</h2>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Message Template</div>
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-800 whitespace-pre-line">
                {campaign.template}
              </div>
            </div>
            {campaign.subject && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Email Subject</div>
                <div className="text-sm text-gray-800">{campaign.subject}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-gray-500 mb-1">Triggers</div>
              <div className="space-y-2">
                {campaign.triggers.map((trigger, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">
                      {trigger.eventType === "appointment_completed" && "After appointment"}
                      {trigger.eventType === "days_since_visit" && "After days since last visit"}
                      {trigger.eventType === "birthday" && "On birthday"}
                      {trigger.eventType === "first_visit_anniversary" && "First visit anniversary"}
                      {trigger.eventType === "no_show" && "After no-show"}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">{trigger.delayDays}d delay</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">{trigger.timeOfDay}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">Max {trigger.maxPerCustomer}/customer</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-sm">
              <div className="text-gray-500">Created {formatDate(campaign.createdAt)}</div>
              <div className="text-gray-500">Updated {timeAgo(campaign.updatedAt)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-500" />
          Recent Messages
          <span className="text-sm font-normal text-gray-500">({messages.length})</span>
        </h2>
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Send className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No messages sent yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Recipient</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Channel</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Sent</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Booked</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg) => {
                  const msgStatus = MESSAGE_STATUS_CONFIG[msg.status] ?? { label: msg.status, color: "bg-gray-100 text-gray-700" };
                  return (
                    <tr key={msg.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-gray-900">{msg.recipientName}</div>
                        <div className="text-xs text-gray-500">
                          {msg.recipientPhone || msg.recipientEmail || "—"}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 text-gray-600">
                          {msg.channel === "sms" ? <MessageSquare className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
                          {msg.channel === "sms" ? "SMS" : "Email"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${msgStatus.color}`}>
                          {msgStatus.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-500 text-xs">
                        {msg.sentAt ? timeAgo(msg.sentAt) : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-xs">
                        {msg.bookedAt ? (
                          <span className="text-green-600 font-medium">Yes</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [messages, setMessages] = useState<CampaignMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">("all");

  const BRAND_ID = "00000000-0000-0000-0000-000000000000";

  // ─── Data Fetching ──────────────────────────────────────────────────────────

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await api.campaigns.list(BRAND_ID);
      const data = (res as any).data || res;
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (campaignId: string) => {
    try {
      const res = await api.campaigns.getMessages(campaignId);
      const data = (res as any).data || res;
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      // Non-critical — messages panel may be empty
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    if (selectedCampaign) {
      fetchMessages(selectedCampaign.id);
    }
  }, [selectedCampaign, fetchMessages]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleSelectCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
  };

  const handleStatusChange = async (campaignId: string, newStatus: CampaignStatus) => {
    try {
      await api.campaigns.update(campaignId, { status: newStatus });
      // Optimistically update local state
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaignId ? { ...c, status: newStatus } : c))
      );
      if (selectedCampaign?.id === campaignId) {
        setSelectedCampaign((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateCampaign = async (data: {
    name: string;
    type: CampaignType;
    template: string;
    subject?: string;
    channel: "sms" | "email" | "both";
    triggers: CampaignTrigger[];
  }) => {
    try {
      await api.campaigns.create({
        brandId: BRAND_ID,
        ...data,
      });
      await fetchCampaigns();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDuplicateCampaign = async (campaign: Campaign) => {
    try {
      await api.campaigns.create({
        brandId: BRAND_ID,
        name: `${campaign.name} (Copy)`,
        type: campaign.type,
        template: campaign.template,
        subject: campaign.subject,
        channel: campaign.channel,
        triggers: campaign.triggers,
      });
      await fetchCampaigns();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleArchiveCampaign = async (campaignId: string) => {
    await handleStatusChange(campaignId, "archived");
  };

  // ─── Aggregated Stats ───────────────────────────────────────────────────────

  const aggregatedStats = campaigns.reduce(
    (acc, c) => ({
      totalSent: acc.totalSent + c.stats.sent,
      totalBooked: acc.totalBooked + c.stats.booked,
      totalRevenue: acc.totalRevenue + c.stats.revenue,
      totalClicked: acc.totalClicked + c.stats.clicked,
      avgRoi: 0, // calculated below
    }),
    { totalSent: 0, totalBooked: 0, totalRevenue: 0, totalClicked: 0, avgRoi: 0 }
  );
  aggregatedStats.avgRoi =
    campaigns.length > 0
      ? campaigns.reduce((sum, c) => sum + c.stats.roi, 0) / campaigns.length
      : 0;

  // ─── Filtered Campaigns ──────────────────────────────────────────────────────

  const filteredCampaigns =
    statusFilter === "all"
      ? campaigns
      : campaigns.filter((c) => c.status === statusFilter);

  // ─── Loading / Error ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error && campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-gray-500">{error}</p>
        <button
          onClick={() => { setLoading(true); setError(null); fetchCampaigns(); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // ─── Campaign Detail ─────────────────────────────────────────────────────────

  if (selectedCampaign) {
    return (
      <div className="space-y-6 p-6">
        <CampaignDetailView
          campaign={selectedCampaign}
          messages={messages}
          onBack={() => setSelectedCampaign(null)}
          onStatusChange={handleStatusChange}
        />
      </div>
    );
  }

  // ─── Campaign List ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rebooking Campaigns</h1>
          <p className="text-sm text-gray-500 mt-1">
            Automated SMS & email reminders to keep clients coming back
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Sent"
          value={aggregatedStats.totalSent.toLocaleString()}
          icon={<Send className="w-5 h-5" />}
          change="Across all campaigns"
          changeType="neutral"
        />
        <StatCard
          label="Bookings"
          value={aggregatedStats.totalBooked.toLocaleString()}
          icon={<CalendarCheck className="w-5 h-5" />}
          change={aggregatedStats.totalSent > 0
            ? `${((aggregatedStats.totalBooked / aggregatedStats.totalSent) * 100).toFixed(1)}% book rate`
            : "No data"}
          changeType="positive"
        />
        <StatCard
          label="Revenue"
          value={formatCurrency(aggregatedStats.totalRevenue)}
          icon={<DollarSign className="w-5 h-5" />}
          change={`$${aggregatedStats.totalBooked > 0 ? Math.round(aggregatedStats.totalRevenue / aggregatedStats.totalBooked) : 0} avg/book`}
          changeType="positive"
        />
        <StatCard
          label="Avg ROI"
          value={`${aggregatedStats.avgRoi.toFixed(1)}x`}
          icon={<TrendingUp className="w-5 h-5" />}
          change={aggregatedStats.avgRoi > 3 ? "Strong" : aggregatedStats.avgRoi > 1.5 ? "Good" : "Needs work"}
          changeType={aggregatedStats.avgRoi > 3 ? "positive" : aggregatedStats.avgRoi > 1.5 ? "neutral" : "negative"}
        />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2">
        {(["all", "active", "paused", "draft", "completed"] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === filter
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {filter === "all" ? "All" : STATUS_CONFIG[filter]?.label ?? filter}
          </button>
        ))}
      </div>

      {/* Campaign Cards */}
      {filteredCampaigns.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Send className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No campaigns yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Create your first rebooking campaign to start bringing clients back
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCampaigns.map((campaign) => {
            const typeConfig = TYPE_CONFIG[campaign.type];
            const statusConfig = STATUS_CONFIG[campaign.status];
            const channelConfig = CHANNEL_CONFIG[campaign.channel];

            return (
              <div
                key={campaign.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-200 transition-colors cursor-pointer"
                onClick={() => handleSelectCampaign(campaign)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{typeConfig.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          {channelConfig.icon}
                          {channelConfig.label}
                        </span>
                        <span>•</span>
                        <span>{typeConfig.label}</span>
                        <span>•</span>
                        <span>Updated {timeAgo(campaign.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {campaign.status === "active" && (
                      <button
                        onClick={() => handleStatusChange(campaign.id, "paused")}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Pause campaign"
                      >
                        <Pause className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                    {campaign.status === "paused" && (
                      <button
                        onClick={() => handleStatusChange(campaign.id, "active")}
                        className="p-1.5 hover:bg-green-50 rounded-lg transition-colors"
                        title="Resume campaign"
                      >
                        <Play className="w-4 h-4 text-green-600" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDuplicateCampaign(campaign)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Duplicate campaign"
                    >
                      <Copy className="w-4 h-4 text-gray-500" />
                    </button>
                    {campaign.status !== "archived" && (
                      <button
                        onClick={() => handleArchiveCampaign(campaign.id)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Archive campaign"
                      >
                        <Archive className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Mini Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <div className="text-xs text-gray-500">Sent</div>
                    <div className="text-sm font-semibold text-gray-900">{campaign.stats.sent.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Clicked</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {campaign.stats.clicked.toLocaleString()}
                      <span className="text-xs text-gray-400 ml-1">
                        ({formatPercent(campaign.stats.clickRate)})
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Booked</div>
                    <div className="text-sm font-semibold text-green-600">
                      {campaign.stats.booked.toLocaleString()}
                      <span className="text-xs text-gray-400 ml-1">
                        ({formatPercent(campaign.stats.bookRate)})
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Revenue</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(campaign.stats.revenue)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">ROI</div>
                    <div className={`text-sm font-semibold ${campaign.stats.roi > 3 ? "text-green-600" : campaign.stats.roi > 1.5 ? "text-gray-900" : "text-yellow-600"}`}>
                      {campaign.stats.roi.toFixed(1)}x
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Campaign Modal */}
      <CreateCampaignModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateCampaign}
      />
    </div>
  );
}