"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Check,
  Copy,
  Key,
  RefreshCw,
  Trash2,
  Plus,
  Loader2,
  // Social platform icons replaced with inline SVGs. Using text labels instead.
  Music2,
  Globe,
  Building2,
  Save,
} from "lucide-react";
import { api } from "../../../lib/api";

const PLATFORMS = [
  { id: "twitter", name: "Twitter / X", color: "#1DA1F2", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>, comingSoon: false },
  { id: "instagram", name: "Instagram", color: "#E4405F", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>, comingSoon: true },
  { id: "facebook", name: "Facebook", color: "#1877F2", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>, comingSoon: true },
  { id: "linkedin", name: "LinkedIn", color: "#0A66C2", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>, comingSoon: false },
  { id: "tiktok", name: "TikTok", color: "#000000", icon: <Music2 size={18} /> },
];

type Brand = {
  id: string;
  name: string;
  logo_url: string | null;
  timezone: string;
  created_at: string;
};

type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  permissions: string[];
  created_at: string;
  expires_at: string | null;
};

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Dubai",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export default function SettingsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [brandName, setBrandName] = useState("");
  const [brandTimezone, setBrandTimezone] = useState("UTC");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"brand" | "social" | "api-keys">("brand");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Social accounts state
  const [connectedChannels, setConnectedChannels] = useState<Map<string, { id: string; name: string }>>(new Map());
  const [socialLoading, setSocialLoading] = useState<Record<string, boolean>>({});

  // API keys state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatingKey, setGeneratingKey] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);

  const loadBrands = useCallback(async () => {
    try {
      const res = await api.brands.list();
      const list = res.data || [];
      setBrands(list);
      if (list.length > 0) {
        const first = list[0];
        setSelectedBrandId(first.id);
        setBrandName(first.name);
        setBrandTimezone(first.timezone || "UTC");
      }
    } catch (e) {
      console.error("Failed to load brands:", e);
      setError("Failed to load brand settings");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadApiKeys = useCallback(async () => {
    // TODO: Add GET /auth/api-keys endpoint to API
    // For now, mock empty list
    setApiKeys([]);
  }, []);

  const loadConnectedChannels = useCallback(async () => {
    if (!selectedBrandId) return;
    try {
      const res = await api.channels.list(selectedBrandId);
      const map = new Map<string, { id: string; name: string }>();
      (res.data || []).forEach((ch) => {
        map.set(ch.platform, { id: ch.id, name: ch.name });
      });
      setConnectedChannels(map);
    } catch (e) {
      console.error("Failed to load channels:", e);
    }
  }, [selectedBrandId]);

  useEffect(() => {
    loadBrands();
    loadApiKeys();
  }, [loadBrands, loadApiKeys]);

  useEffect(() => {
    if (activeTab === "social") {
      loadConnectedChannels();
    }
  }, [activeTab, loadConnectedChannels]);

  const handleBrandChange = (brandId: string) => {
    const brand = brands.find((b) => b.id === brandId);
    if (brand) {
      setSelectedBrandId(brand.id);
      setBrandName(brand.name);
      setBrandTimezone(brand.timezone || "UTC");
    }
  };

  const handleSaveBrand = async () => {
    if (!selectedBrandId) return;
    setSaving(true);
    setError(null);
    try {
      await api.brands.update(selectedBrandId, {
        name: brandName,
        timezone: brandTimezone,
      });
      setSuccessMsg("Brand settings saved successfully");
      setTimeout(() => setSuccessMsg(null), 3000);
      // Refresh brands list
      await loadBrands();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save brand settings");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) return;
    setGeneratingKey(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"}/api/v1/auth/api-keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ name: newKeyName, permissions: ["read", "write"] }),
      });
      if (!res.ok) throw new Error("Failed to generate API key");
      const data = await res.json() as { id: string; name: string; key: string; prefix: string; permissions: string[]; created_at: string; expires_at: string | null };
      setNewKeyValue(data.key);
      setApiKeys((prev) => [
        ...prev,
        {
          id: data.id,
          name: data.name,
          prefix: data.prefix,
          permissions: data.permissions,
          created_at: data.created_at,
          expires_at: data.expires_at,
        },
      ]);
      setNewKeyName("");
      setSuccessMsg("API key generated — copy it now, it won't be shown again");
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate API key");
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setSuccessMsg("Copied to clipboard");
    setTimeout(() => setSuccessMsg(null), 2000);
  };

  const handleConnect = async (platformId: string) => {
    if (!selectedBrandId) return;
    setSocialLoading((prev) => ({ ...prev, [platformId]: true }));
    setError(null);
    try {
      const res = await api.channels.oauthConnect(platformId, selectedBrandId);
      window.location.href = res.authorization_url;
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to connect ${platformId}`);
      setSocialLoading((prev) => ({ ...prev, [platformId]: false }));
    }
  };

  const handleDisconnect = async (platformId: string) => {
    const channel = connectedChannels.get(platformId);
    if (!channel) return;
    setSocialLoading((prev) => ({ ...prev, [platformId]: true }));
    setError(null);
    try {
      await api.channels.disconnect(channel.id);
      setSuccessMsg(`${PLATFORMS.find((p) => p.id === platformId)?.name || platformId} disconnected`);
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadConnectedChannels();
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to disconnect ${platformId}`);
    } finally {
      setSocialLoading((prev) => ({ ...prev, [platformId]: false }));
    }
  };

  const handleRevokeKey = (id: string) => {
    if (!confirm("Revoke this API key? Any integrations using it will stop working.")) return;
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
    setSuccessMsg("API key revoked");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", color: "#888" }}>
        <Loader2 size={20} style={{ animation: "spin 1s linear infinite", display: "inline-block", marginRight: 8 }} />
        Loading settings...
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your account, brands, and connected channels</p>
      </div>

      {error && (
        <div style={{ background: "#2d1a1a", border: "1px solid #c0392b", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1rem", color: "#e74c3c" }}>
          {error}
        </div>
      )}

      {successMsg && (
        <div style={{ background: "#1a2d1a", border: "1px solid #27ae60", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1rem", color: "#2ecc71" }}>
          ✓ {successMsg}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "1.5rem" }}>
        {/* Sidebar Nav */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {(["brand", "social", "api-keys"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? "#1e1e1e" : "transparent",
                border: "none",
                color: activeTab === tab ? "#fff" : "#888",
                padding: "0.6rem 0.75rem",
                borderRadius: "6px",
                textAlign: "left",
                cursor: "pointer",
                fontSize: "0.9rem",
                textTransform: "capitalize",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              {tab === "brand" && <Building2 size={16} />}
              {tab === "social" && <Globe size={16} />}
              {tab === "api-keys" && <Key size={16} />}
              {tab === "api-keys" ? "API Keys" : tab === "brand" ? "Brand" : "Social Accounts"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* ── Brand Tab ── */}
          {activeTab === "brand" && (
            <>
              <div className="card">
                <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1.5rem", color: "#fff" }}>
                  Brand Settings
                </h2>

                {brands.length > 1 && (
                  <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                    <label className="form-label">Select Brand</label>
                    <select
                      className="form-input"
                      value={selectedBrandId}
                      onChange={(e) => handleBrandChange(e.target.value)}
                      style={{ maxWidth: "300px" }}
                    >
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Brand Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Your brand name"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Timezone</label>
                    <select
                      className="form-input"
                      value={brandTimezone}
                      onChange={(e) => setBrandTimezone(e.target.value)}
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={handleSaveBrand}
                  disabled={saving || !selectedBrandId}
                  style={{ marginTop: "1rem" }}
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>

              {brands.length === 0 && (
                <div className="card">
                  <p style={{ color: "#888" }}>No brands yet.{" "}
                    <a href="/onboarding" style={{ color: "var(--color-primary)" }}>Complete onboarding</a>{" "}
                    to create your first brand.
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── Social Accounts Tab ── */}
          {activeTab === "social" && (
            <div className="card">
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1.5rem", color: "#fff" }}>
                Connected Channels
              </h2>

              {brands.length === 0 ? (
                <p style={{ color: "#888", fontSize: "0.875rem" }}>
                  No brands yet.{" "}
                  <a href="/onboarding" style={{ color: "var(--color-primary)" }}>Complete onboarding</a>{" "}
                  to create your first brand.
                </p>
              ) : (
                <>
                  <p style={{ color: "#888", fontSize: "0.875rem", marginBottom: "1rem" }}>
                    Social account connections are managed per brand. Select a brand first, then connect your accounts.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
                    {PLATFORMS.map((platform) => {
                      const connected = connectedChannels.get(platform.id);
                      return (
                        <div
                          key={platform.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "1rem",
                            background: "#181818",
                            borderRadius: "8px",
                            border: "1px solid #2a2a2a",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 8,
                                background: `${platform.color}15`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: platform.color,
                              }}
                            >
                              {platform.icon}
                            </div>
                            <div>
                              <div style={{ fontWeight: 500, color: "#fff" }}>{platform.name}</div>
                              {connected ? (
                                <span style={{ fontSize: "0.75rem", color: "#2ecc71" }}>
                                  Connected as {connected.name}
                                </span>
                              ) : platform.comingSoon ? (
                                <span style={{ fontSize: "0.75rem", color: "#888", background: "rgba(255,255,255,0.06)", padding: "0.125rem 0.5rem", borderRadius: 4 }}>
                                  Coming in Phase 2
                                </span>
                              ) : (
                                <span style={{ fontSize: "0.75rem", color: "#555" }}>Not connected</span>
                              )}
                            </div>
                          </div>

                          {connected ? (
                            <button
                              className="btn btn-danger"
                              onClick={() => handleDisconnect(platform.id)}
                              disabled={socialLoading[platform.id]}
                              style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}
                            >
                              {socialLoading[platform.id] ? (
                                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                              ) : (
                                "Disconnect"
                              )}
                            </button>
                          ) : (
                            <button
                              className="btn btn-primary"
                              onClick={() => handleConnect(platform.id)}
                              disabled={platform.comingSoon || socialLoading[platform.id] || !selectedBrandId}
                              style={{ padding: "0.4rem 1rem", fontSize: "0.85rem", opacity: platform.comingSoon ? 0.5 : 1 }}
                            >
                              {socialLoading[platform.id] ? (
                                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                              ) : (
                                "+ Connect"
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── API Keys Tab ── */}
          {activeTab === "api-keys" && (
            <div className="card">
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem", color: "#fff" }}>
                API Keys
              </h2>
              <p style={{ color: "#666", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                Use API keys to access AgentSocial programmatically. Keys are shown only once at creation.
              </p>

              {/* Generate new key */}
              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  marginBottom: "1.5rem",
                  padding: "1rem",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <input
                  type="text"
                  className="form-input"
                  placeholder="Key name (e.g. 'Zapier Integration')"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleGenerateKey}
                  disabled={generatingKey || !newKeyName.trim()}
                >
                  {generatingKey ? (
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <>
                      <Plus size={16} />
                      Generate Key
                    </>
                  )}
                </button>
              </div>

              {/* Newly created key alert */}
              {newKeyValue && (
                <div
                  style={{
                    background: "rgba(37,99,235,0.1)",
                    border: "1px solid rgba(37,99,235,0.3)",
                    borderRadius: 8,
                    padding: "1rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <p style={{ color: "#fff", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                    Your new API key (copy it now — it won&apos;t be shown again):
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      background: "#0f0f0f",
                      padding: "0.75rem 1rem",
                      borderRadius: 6,
                      fontFamily: "monospace",
                      fontSize: "0.875rem",
                      color: "#fff",
                    }}
                  >
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{newKeyValue}</span>
                    <button
                      onClick={() => handleCopyKey(newKeyValue)}
                      style={{ background: "none", border: "none", color: "#888", cursor: "pointer", padding: "0.25rem" }}
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Keys list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {apiKeys.length === 0 ? (
                  <p style={{ color: "#555", fontSize: "0.85rem" }}>No API keys yet. Generate one above to get started.</p>
                ) : (
                  apiKeys.map((key) => (
                    <div
                      key={key.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.875rem 1rem",
                        background: "rgba(255,255,255,0.03)",
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500, color: "#fff", fontSize: "0.875rem" }}>
                          {key.name}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#666", marginTop: "0.25rem" }}>
                          {key.prefix}*** · {key.permissions.join(", ")} · Created{" "}
                          {new Date(key.created_at).toLocaleDateString()}
                          {key.expires_at && ` · Expires ${new Date(key.expires_at).toLocaleDateString()}`}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRevokeKey(key.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#e74c3c",
                          cursor: "pointer",
                          padding: "0.375rem",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div className="card" style={{ border: "1px solid #3a1a1a" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem", color: "#e74c3c" }}>Danger Zone</h2>
            <p style={{ color: "#666", marginBottom: "1rem", fontSize: "0.85rem" }}>
              Deleting your account removes all data. This cannot be undone.
            </p>
            <button className="btn btn-danger">Delete Account</button>
          </div>
        </div>
      </div>
    </div>
  );
}
