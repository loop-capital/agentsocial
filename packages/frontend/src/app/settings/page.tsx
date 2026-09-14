"use client";

import { useState } from "react";
import {
  Plus,
  RefreshCw,
  Trash2,
  ExternalLink,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Copy,
  Key,
  Clock,
  Globe,
} from "lucide-react";
import { PlatformBadge } from "../../../src/components/ui/platform-badge";
import { MOCK_CHANNELS } from "../../../src/lib/mock-data";

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E4405F",
  twitter: "#1DA1F2",
  facebook: "#1877F2",
  linkedin: "#0A66C2",
  tiktok: "#000000",
  pinterest: "#BD081C",
  youtube: "#FF0000",
  threads: "#000000",
};

const POSTING_SCHEDULE = [
  { day: "Monday", enabled: true, times: ["09:00", "12:00", "17:00"] },
  { day: "Tuesday", enabled: true, times: ["09:00", "12:00", "17:00"] },
  { day: "Wednesday", enabled: true, times: ["09:00", "12:00", "17:00"] },
  { day: "Thursday", enabled: true, times: ["09:00", "12:00", "17:00"] },
  { day: "Friday", enabled: true, times: ["09:00", "12:00"] },
  { day: "Saturday", enabled: false, times: [] },
  { day: "Sunday", enabled: false, times: [] },
];

const MOCK_API_KEYS = [
  { id: "key1", name: "Production API Key", prefix: "as_prod", created: "2026-01-15", lastUsed: "2026-04-23" },
  { id: "key2", name: "Development API Key", prefix: "as_dev", created: "2026-03-01", lastUsed: "2026-04-20" },
];

function maskKey(key: string): string {
  return key.slice(0, 8) + "•".repeat(20) + key.slice(-4);
}

export default function SettingsPage() {
  const [channels, setChannels] = useState(MOCK_CHANNELS);
  const [postingSchedule, setPostingSchedule] = useState(POSTING_SCHEDULE);
  const [apiKeys] = useState(MOCK_API_KEYS);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [activeSection, setActiveSection] = useState<"accounts" | "schedule" | "api">("accounts");

  const toggleReveal = (keyId: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(keyId)) next.delete(keyId);
      else next.add(keyId);
      return next;
    });
  };

  const toggleDay = (day: string) => {
    setPostingSchedule((prev) =>
      prev.map((d) => (d.day === day ? { ...d, enabled: !d.enabled } : d))
    );
  };

  const disconnectChannel = (id: string) => {
    if (!confirm("Disconnect this channel? You will need to reconnect to post again.")) return;
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, status: "disconnected" as const } : ch))
    );
  };

  const reconnectChannel = (id: string) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, status: "connected" as const } : ch))
    );
  };

  const connectedCount = channels.filter((ch) => ch.status === "connected").length;

  const sections = [
    { key: "accounts" as const, label: "Connected Accounts", count: connectedCount },
    { key: "schedule" as const, label: "Posting Schedule", count: null },
    { key: "api" as const, label: "API Keys", count: apiKeys.length },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your connected accounts, posting schedule, and API access</p>
        </div>
      </div>

      {/* Section Nav */}
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-default)", paddingBottom: "0" }}>
        {sections.map((section) => (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key)}
            style={{
              padding: "0.625rem 1rem",
              border: "none",
              background: "none",
              fontSize: "0.875rem",
              fontWeight: activeSection === section.key ? 600 : 400,
              color: activeSection === section.key ? "var(--color-primary)" : "var(--text-secondary)",
              cursor: "pointer",
              borderBottom: `2px solid ${activeSection === section.key ? "var(--color-primary)" : "transparent"}`,
              marginBottom: -1,
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
            }}
          >
            {section.label}
            {section.count !== null && (
              <span style={{
                background: activeSection === section.key ? "var(--color-primary-light)" : "var(--bg-hover)",
                color: activeSection === section.key ? "var(--color-primary)" : "var(--text-muted)",
                fontSize: "0.75rem",
                fontWeight: 600,
                padding: "0.1rem 0.4rem",
                borderRadius: "var(--radius-full)",
              }}>
                {section.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── Connected Accounts ────────────────────────── */}
      {activeSection === "accounts" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              {connectedCount} of {channels.length} accounts connected. Connect all your platforms to start posting.
            </p>
            <button className="btn btn-secondary btn-sm">
              <Plus size={14} /> Connect New Account
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {channels.map((channel) => {
              const color = PLATFORM_COLORS[channel.platform] ?? "#6b7280";
              return (
                <div
                  key={channel.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "1rem 1.25rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-md)",
                    transition: "border-color 0.15s",
                  }}
                >
                  {/* Platform Icon */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "var(--radius-md)",
                      background: `${color}14`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: "1.25rem" }}>
                      {channel.platform === "instagram" && "📸"}
                      {channel.platform === "twitter" && "🐦"}
                      {channel.platform === "facebook" && "📘"}
                      {channel.platform === "linkedin" && "💼"}
                      {channel.platform === "tiktok" && "🎵"}
                      {channel.platform === "pinterest" && "📌"}
                      {channel.platform === "youtube" && "▶️"}
                      {channel.platform === "threads" && "🧵"}
                    </span>
                  </div>

                  {/* Account Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                      <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        {channel.name}
                      </span>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          padding: "0.15rem 0.5rem",
                          borderRadius: "var(--radius-full)",
                          background: channel.status === "connected" ? "var(--color-success-bg)" : "var(--color-neutral-bg)",
                          color: channel.status === "connected" ? "var(--color-success)" : "var(--color-neutral)",
                        }}
                      >
                        {channel.status === "connected" ? (
                          <><CheckCircle size={10} /> Connected</>
                        ) : (
                          <><XCircle size={10} /> Disconnected</>
                        )}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                      {channel.followers.toLocaleString()} followers
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "0.375rem", flexShrink: 0 }}>
                    {channel.status === "connected" ? (
                      <>
                        <button className="btn btn-ghost btn-sm" disabled>
                          <Eye size={13} /> View
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: "var(--color-danger)" }}
                          onClick={() => disconnectChannel(channel.id)}
                        >
                          <Trash2 size={13} /> Disconnect
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => reconnectChannel(channel.id)}
                      >
                        <RefreshCw size={13} /> Reconnect
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Channel Summary */}
          <div style={{
            marginTop: "1rem",
            padding: "0.875rem 1rem",
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.8125rem",
            color: "var(--text-muted)",
          }}>
            <Globe size={14} />
            All platforms support text, image, and video posts. Links are supported on all except TikTok.
            <a href="#" style={{ color: "var(--color-primary)", marginLeft: "0.25rem", textDecoration: "none" }}>
              Learn more <ExternalLink size={11} style={{ display: "inline" }} />
            </a>
          </div>
        </div>
      )}

      {/* ─── Posting Schedule ──────────────────────────── */}
      {activeSection === "schedule" && (
        <div>
          <div style={{ marginBottom: "1rem" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              Set your default posting schedule. Posts will be queued for these times unless overridden per post.
            </p>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Weekly Schedule</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                <Clock size={13} />
                Times shown in your local timezone (America/New_York)
              </div>
            </div>

            <div>
              {postingSchedule.map((day) => (
                <div
                  key={day.day}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "0.875rem 1.25rem",
                    borderBottom: "1px solid var(--border-default)",
                  }}
                >
                  {/* Toggle */}
                  <label style={{ display: "flex", alignItems: "center", cursor: "pointer", minWidth: 120 }}>
                    <input
                      type="checkbox"
                      checked={day.enabled}
                      onChange={() => toggleDay(day.day)}
                      style={{ accentColor: "#3b82f6", width: 16, height: 16, marginRight: "0.625rem" }}
                    />
                    <span style={{
                      fontSize: "0.875rem",
                      fontWeight: day.enabled ? 600 : 400,
                      color: day.enabled ? "var(--text-primary)" : "var(--text-muted)",
                    }}>
                      {day.day}
                    </span>
                  </label>

                  {/* Times */}
                  <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                    {day.enabled ? (
                      day.times.map((time) => (
                        <span
                          key={time}
                          style={{
                            padding: "0.25rem 0.625rem",
                            background: "var(--color-primary-light)",
                            color: "var(--color-primary)",
                            borderRadius: "var(--radius-full)",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                          }}
                        >
                          {time}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                        No posts scheduled
                      </span>
                    )}
                  </div>

                  {/* Add Time */}
                  {day.enabled && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ marginLeft: "auto", fontSize: "0.75rem" }}
                      onClick={() => {
                        const newTime = prompt("Enter time (HH:MM):", "14:00");
                        if (!newTime) return;
                        setPostingSchedule((prev) =>
                          prev.map((d) =>
                            d.day === day.day
                              ? { ...d, times: [...d.times, newTime].sort() }
                              : d
                          )
                        );
                      }}
                    >
                      <Plus size={12} /> Add time
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ padding: "1rem 1.25rem", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button className="btn btn-secondary btn-sm">
                <RefreshCw size={13} /> Reset to Defaults
              </button>
              <button className="btn btn-primary btn-sm">
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── API Keys ──────────────────────────────────── */}
      {activeSection === "api" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                API keys allow you to programmatically access AgentSocial from your own applications.
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--color-danger)" }}>
                Keep your API keys secret. Do not share them in client-side code.
              </p>
            </div>
            <button className="btn btn-primary btn-sm">
              <Plus size={14} /> Generate New Key
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {apiKeys.map((key) => (
              <div
                key={key.id}
                style={{
                  padding: "1rem 1.25rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: "var(--radius-md)",
                    background: "var(--color-primary-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Key size={16} color="var(--color-primary)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                      {key.name}
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                      {revealedKeys.has(key.id) ? maskKey(key.prefix + "xxxxxk42") : maskKey(key.prefix + "xxxxxk42")}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.375rem" }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => toggleReveal(key.id)}
                      title={revealedKeys.has(key.id) ? "Hide key" : "Reveal key"}
                    >
                      {revealedKeys.has(key.id) ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        navigator.clipboard.writeText(key.prefix + "xxxxxxxxxxxxxxxxxxxx");
                      }}
                      title="Copy key"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: "var(--color-danger)" }}
                      onClick={() => {
                        if (!confirm(`Delete "${key.name}"? This cannot be undone.`)) return;
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.625rem", paddingTop: "0.625rem", borderTop: "1px solid var(--border-default)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  <span>Created: {key.created}</span>
                  <span>Last used: {key.lastUsed}</span>
                </div>
              </div>
            ))}
          </div>

          {/* API Docs Link */}
          <div style={{
            marginTop: "1rem",
            padding: "1rem",
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.25rem" }}>API Documentation</div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                Learn how to integrate AgentSocial with your own applications using our REST API.
              </div>
            </div>
            <a href="#" style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "var(--color-primary)", fontSize: "0.875rem", textDecoration: "none", fontWeight: 500 }}>
              Read docs <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
