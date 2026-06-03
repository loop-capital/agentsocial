"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Copy,
  CheckCircle2,
  Settings,
  BarChart3,
  Users,
  Clock,
  Loader2,
  Code,
  Palette,
  Sparkles,
  Phone,
  Mail,
  ArrowRight,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { api } from "../../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WidgetConfig {
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
}

interface ChatSession {
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
}

interface ChatMessage {
  id: string;
  session_id: string;
  sender: string;
  content: string;
  message_type: string;
  created_at: string;
}

interface WidgetAnalytics {
  total_conversations: number;
  active_conversations: number;
  leads_captured: number;
  avg_response_time_seconds: number;
  conversations_by_day: Array<{ date: string; count: number }>;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

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

const BRAND_ID = "00000000-0000-0000-0000-000000000000";

// ─── Embed Code ───────────────────────────────────────────────────────────────

function generateEmbedCode(config: WidgetConfig): string {
  return `<!-- AgentSocial Chat Widget -->
<script>
  (function() {
    var s = document.createElement('script');
    s.src = 'https://cdn.agentsocial.io/widget.js';
    s.setAttribute('data-widget-id', '${config.id}');
    s.setAttribute('data-brand-id', '${config.brand_id}');
    s.setAttribute('data-position', '${config.position}');
    s.setAttribute('data-color', '${config.brand_color}');
    s.setAttribute('data-greeting', '${config.greeting_message.replace(/'/g, "\\'")}');
    s.async = true;
    document.head.appendChild(s);
  })();
</script>`;
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = "overview" | "configure" | "transcripts";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GbpWidgetPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [analytics, setAnalytics] = useState<WidgetAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // Config form state
  const [brandColor, setBrandColor] = useState("");
  const [greeting, setGreeting] = useState("");
  const [position, setPosition] = useState("bottom-right");
  const [autoResponse, setAutoResponse] = useState(true);
  const [autoResponseMsg, setAutoResponseMsg] = useState("");
  const [enabled, setEnabled] = useState(true);

  // Session detail state
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionMessages, setSessionMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await api.gbp.getWidgetConfig(BRAND_ID);
      const data = (res as any).data || res;
      setConfig(data);
      setBrandColor(data.brand_color || "#4F46E5");
      setGreeting(data.greeting_message || "");
      setPosition(data.position || "bottom-right");
      setAutoResponse(data.auto_response_enabled ?? true);
      setAutoResponseMsg(data.auto_response_message || "");
      setEnabled(data.enabled ?? true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await api.gbp.getWidgetSessions(BRAND_ID);
      const data = (res as any).data || res;
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      // Non-critical
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await api.gbp.getWidgetAnalytics(BRAND_ID);
      setAnalytics((res as any).data || res);
    } catch {
      // Non-critical
    }
  }, []);

  const fetchMessages = useCallback(async (sessionId: string) => {
    setMessagesLoading(true);
    try {
      const res = await api.gbp.getWidgetSessionMessages(sessionId);
      const data = (res as any).data || res;
      setSessionMessages(Array.isArray(data) ? data : []);
    } catch {
      setSessionMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchSessions();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchMessages(selectedSession);
    }
  }, [selectedSession]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.gbp.updateWidgetConfig(BRAND_ID, {
        brand_color: brandColor,
        greeting_message: greeting,
        position,
        auto_response_enabled: autoResponse,
        auto_response_message: autoResponseMsg,
        enabled,
      });
      const data = (res as any).data || res;
      setConfig(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyEmbed = () => {
    if (!config) return;
    navigator.clipboard.writeText(generateEmbedCode(config));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Loading State ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error && !config) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <MessageSquare className="w-12 h-12 text-red-400" />
        <p className="text-gray-500">{error}</p>
        <button
          onClick={() => { setLoading(true); setError(null); fetchConfig(); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Chat Widget</h1>
          <p className="text-sm text-gray-500 mt-1">
            Embed an AI-powered chat widget on your website
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
            config?.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config?.enabled ? "bg-green-500" : "bg-gray-400"}`} />
            {config?.enabled ? "Active" : "Disabled"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-3">
        {([
          { key: "overview" as Tab, label: "Overview", icon: BarChart3 },
          { key: "configure" as Tab, label: "Configure", icon: Settings },
          { key: "transcripts" as Tab, label: "Transcripts", icon: MessageSquare },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition-colors ${
              activeTab === tab.key
                ? "bg-indigo-100 text-indigo-700 font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <OverviewTab
          analytics={analytics}
          sessions={sessions}
          config={config}
          copied={copied}
          onCopy={handleCopyEmbed}
          onSelectSession={(id) => {
            setSelectedSession(id);
            setActiveTab("transcripts");
          }}
        />
      )}

      {activeTab === "configure" && config && (
        <ConfigureTab
          brandColor={brandColor}
          setBrandColor={setBrandColor}
          greeting={greeting}
          setGreeting={setGreeting}
          position={position}
          setPosition={setPosition}
          autoResponse={autoResponse}
          setAutoResponse={setAutoResponse}
          autoResponseMsg={autoResponseMsg}
          setAutoResponseMsg={setAutoResponseMsg}
          enabled={enabled}
          setEnabled={setEnabled}
          saving={saving}
          onSave={handleSave}
        />
      )}

      {activeTab === "transcripts" && (
        <TranscriptsTab
          sessions={sessions}
          selectedSession={selectedSession}
          setSelectedSession={setSelectedSession}
          sessionMessages={sessionMessages}
          messagesLoading={messagesLoading}
        />
      )}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  analytics,
  sessions,
  config,
  copied,
  onCopy,
  onSelectSession,
}: {
  analytics: WidgetAnalytics | null;
  sessions: ChatSession[];
  config: WidgetConfig | null;
  copied: boolean;
  onCopy: () => void;
  onSelectSession: (id: string) => void;
}) {
  const embedCode = config ? generateEmbedCode(config) : "";

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Conversations"
          value={analytics?.total_conversations?.toString() ?? "—"}
          icon={<MessageSquare className="w-5 h-5" />}
          change={analytics?.active_conversations ? `${analytics.active_conversations} active` : undefined}
          changeType="positive"
        />
        <StatCard
          label="Leads Captured"
          value={analytics?.leads_captured?.toString() ?? "—"}
          icon={<Users className="w-5 h-5" />}
          change="leads from chat"
          changeType="positive"
        />
        <StatCard
          label="Avg Response Time"
          value={analytics ? `${analytics.avg_response_time_seconds}s` : "—"}
          icon={<Clock className="w-5 h-5" />}
          change="auto-reply"
          changeType="neutral"
        />
        <StatCard
          label="Conversion Rate"
          value={
            analytics && analytics.total_conversations > 0
              ? `${Math.round((analytics.leads_captured / analytics.total_conversations) * 100)}%`
              : "—"
          }
          icon={<BarChart3 className="w-5 h-5" />}
          change="of chats → leads"
          changeType="positive"
        />
      </div>

      {/* Embed Code */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Code className="w-5 h-5 text-indigo-500" />
            Embed Code
          </h2>
          <button
            onClick={onCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Code
              </>
            )}
          </button>
        </div>
        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto">
          <code>{embedCode}</code>
        </pre>
        <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
          <ExternalLink className="w-3 h-3" />
          Paste this snippet before the closing &lt;/body&gt; tag on your website
        </p>
      </div>

      {/* Conversations by Day Chart */}
      {analytics?.conversations_by_day && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            Conversations (Last 7 Days)
          </h2>
          <div className="flex items-end gap-2 h-40">
            {analytics.conversations_by_day.map((day, i) => {
              const maxCount = Math.max(...analytics.conversations_by_day.map((d) => d.count), 1);
              const heightPct = (day.count / maxCount) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500 font-medium">{day.count}</span>
                  <div
                    className="w-full bg-indigo-400 rounded-t-md transition-all hover:bg-indigo-500"
                    style={{ height: `${Math.max(heightPct, 4)}%` }}
                  />
                  <span className="text-xs text-gray-400">
                    {new Date(day.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-500" />
          Recent Conversations
        </h2>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No conversations yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sessions.slice(0, 5).map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className="w-full flex items-center justify-between py-3 hover:bg-gray-50 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    session.source === "sms" ? "bg-green-500" : "bg-indigo-500"
                  }`}>
                    {session.visitor_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {session.visitor_name || "Anonymous"}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="flex items-center gap-0.5">
                        {session.source === "sms" ? <Phone className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                        {session.source.toUpperCase()}
                      </span>
                      <span>{timeAgo(session.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {session.lead_captured && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                      Lead
                    </span>
                  )}
                  {session.status === "active" && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                      Active
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Configure Tab ────────────────────────────────────────────────────────────

function ConfigureTab({
  brandColor,
  setBrandColor,
  greeting,
  setGreeting,
  position,
  setPosition,
  autoResponse,
  setAutoResponse,
  autoResponseMsg,
  setAutoResponseMsg,
  enabled,
  setEnabled,
  saving,
  onSave,
}: {
  brandColor: string;
  setBrandColor: (v: string) => void;
  greeting: string;
  setGreeting: (v: string) => void;
  position: string;
  setPosition: (v: string) => void;
  autoResponse: boolean;
  setAutoResponse: (v: boolean) => void;
  autoResponseMsg: string;
  setAutoResponseMsg: (v: string) => void;
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Widget Toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Widget Status</h2>
            <p className="text-sm text-gray-500 mt-0.5">Enable or disable the chat widget on your website</p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? "bg-indigo-600" : "bg-gray-300"
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`} />
          </button>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-indigo-500" />
          Appearance
        </h2>
        <div className="space-y-4">
          {/* Brand Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="#4F46E5"
              />
            </div>
          </div>

          {/* Greeting Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Greeting Message</label>
            <textarea
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Hi there! 👋 How can we help you today?"
            />
          </div>

          {/* Widget Position */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Widget Position</label>
            <div className="flex gap-2">
              {[
                { value: "bottom-right", label: "Bottom Right" },
                { value: "bottom-left", label: "Bottom Left" },
                { value: "center-right", label: "Center Right" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPosition(opt.value)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    position === opt.value
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Auto Response */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          AI Auto-Response
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Enable Auto-Response</p>
              <p className="text-xs text-gray-500">Automatically reply to visitors using AI</p>
            </div>
            <button
              onClick={() => setAutoResponse(!autoResponse)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoResponse ? "bg-indigo-600" : "bg-gray-300"
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                autoResponse ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </div>

          {autoResponse && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Auto-Response Message</label>
              <textarea
                value={autoResponseMsg}
                onChange={(e) => setAutoResponseMsg(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Thanks for reaching out! We'll get back to you as soon as possible."
              />
              <p className="text-xs text-gray-400 mt-1">This message is sent immediately when a visitor starts a chat.</p>
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Widget Preview</h2>
        <div className="bg-gray-50 rounded-lg p-6 min-h-[240px] relative overflow-hidden">
          {/* Mock website background */}
          <div className="space-y-3 opacity-30">
            <div className="h-4 bg-gray-300 rounded w-3/4" />
            <div className="h-4 bg-gray-300 rounded w-1/2" />
            <div className="h-4 bg-gray-300 rounded w-2/3" />
          </div>
          {/* Chat bubble */}
          <div className={`absolute ${
            position === "bottom-right" ? "bottom-4 right-4" :
            position === "bottom-left" ? "bottom-4 left-4" :
            "bottom-4 right-4"
          }`}>
            <div className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white text-xl" style={{ backgroundColor: brandColor }}>
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
          {/* Greeting preview */}
          <div className={`absolute ${
            position === "bottom-right" ? "bottom-20 right-4" :
            position === "bottom-left" ? "bottom-20 left-4" :
            "bottom-20 right-4"
          } bg-white rounded-xl shadow-xl border border-gray-200 p-3 max-w-[200px]`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-gray-500">Online</span>
            </div>
            <p className="text-sm text-gray-700">{greeting || "Hi there! 👋"}</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          Save Configuration
        </button>
      </div>
    </div>
  );
}

// ─── Transcripts Tab ──────────────────────────────────────────────────────────

function TranscriptsTab({
  sessions,
  selectedSession,
  setSelectedSession,
  sessionMessages,
  messagesLoading,
}: {
  sessions: ChatSession[];
  selectedSession: string | null;
  setSelectedSession: (id: string | null) => void;
  sessionMessages: ChatMessage[];
  messagesLoading: boolean;
}) {
  const selectedSessionData = sessions.find((s) => s.id === selectedSession);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sessions List */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversations</h2>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No conversations yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setSelectedSession(session.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedSession === session.id
                    ? "border-indigo-300 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      session.source === "sms" ? "bg-green-500" : "bg-indigo-500"
                    }`}>
                      {session.visitor_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {session.visitor_name || "Anonymous"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {session.source.toUpperCase()} · {timeAgo(session.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {session.lead_captured && (
                      <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">Lead</span>
                    )}
                    {session.status === "active" && (
                      <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">Active</span>
                    )}
                  </div>
                </div>
                {session.visitor_phone && (
                  <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {session.visitor_phone}
                  </div>
                )}
                {session.visitor_email && (
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {session.visitor_email}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat Transcript */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
        {selectedSession ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedSessionData?.visitor_name || "Anonymous"}
                </h2>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {selectedSessionData?.visitor_phone && (
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedSessionData.visitor_phone}</span>
                  )}
                  {selectedSessionData?.visitor_email && (
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedSessionData.visitor_email}</span>
                  )}
                </div>
              </div>
              {selectedSessionData?.lead_captured && (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Lead Captured
                </span>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-4 max-h-[500px] overflow-y-auto">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
              ) : sessionMessages.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No messages in this conversation</p>
                </div>
              ) : (
                sessionMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "visitor" ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      msg.sender === "visitor"
                        ? "bg-gray-100 text-gray-900 rounded-bl-md"
                        : msg.sender === "bot"
                        ? "bg-indigo-600 text-white rounded-br-md"
                        : "bg-green-100 text-green-800 rounded-br-md"
                    } ${msg.message_type === "lead_capture" ? "bg-green-100 text-green-800 border border-green-200" : ""}`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${
                        msg.sender === "visitor" ? "text-gray-400" : msg.sender === "bot" ? "text-indigo-200" : "text-green-500"
                      }`}>
                        {msg.sender === "bot" ? "🤖 AI" : msg.sender === "agent" ? "👤 Agent" : ""}{" "}
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">Select a conversation</p>
            <p className="text-sm">Choose a conversation from the list to view the transcript</p>
          </div>
        )}
      </div>
    </div>
  );
}