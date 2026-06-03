"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Globe,
  RefreshCw,
  Trash2,
  Plus,
  Loader2,
  Check,
  Link2,
  AlertCircle,
  Music2,
  Building2,
  ChevronRight,
  Settings,
} from "lucide-react";
import { api } from "../../../lib/api";

// Platform icons - not all in lucide-react
const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  facebook: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  instagram: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E4405F" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5"/>
      <circle cx="12" cy="12" r="5"/>
      <circle cx="17.5" cy="6.5" r="1.5" fill="#E4405F" stroke="none"/>
    </svg>
  ),
  twitter: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DA1F2">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  linkedin: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#0A66C2">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  tiktok: <Music2 size={20} />,
};

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "#1877F2",
  instagram: "#E4405F",
  twitter: "#1DA1F2",
  linkedin: "#0A66C2",
  tiktok: "#000000",
};

const PLATFORM_NAMES: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "Twitter / X",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
};

type Channel = {
  id: string;
  brand_id: string;
  platform: string;
  name: string;
  account_id: string;
  status: string;
  follower_count: number | null;
  settings: Record<string, unknown>;
  created_at: string;
};

type Brand = {
  id: string;
  name: string;
  logo_url: string | null;
  timezone: string;
  channels: Channel[];
  created_at: string;
};

export default function ChannelsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [activeChannelId, setActiveChannelId] = useState<string>("");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<Record<string, boolean>>({});
  const [connecting, setConnecting] = useState<Record<string, boolean>>({});

  // Load all brands with their channels
  const loadBrands = useCallback(async () => {
    try {
      const res = await api.brands.list();
      const list = res.data || [];
      
      // Extract all channels with proper typing
      const allChannels: Channel[] = [];
      list.forEach((brand) => {
        (brand.channels || []).forEach((ch: any) => {
          allChannels.push({
            id: ch.id,
            brand_id: brand.id,
            platform: ch.platform,
            name: ch.name,
            account_id: ch.account_id || "",
            status: ch.status,
            follower_count: ch.follower_count || null,
            settings: ch.settings || {},
            created_at: ch.created_at,
          });
        });
      });
      
      setBrands(list.map((b: any) => ({
        id: b.id,
        name: b.name,
        logo_url: b.logo_url,
        timezone: b.timezone,
        channels: allChannels.filter((ch) => ch.brand_id === b.id),
        created_at: b.created_at,
      })));
      setChannels(allChannels);
      
      if (list.length > 0 && !selectedBrandId) {
        setSelectedBrandId(list[0].id);
      }
    } catch (e) {
      console.error("Failed to load brands:", e);
      setError("Failed to load channels");
    } finally {
      setLoading(false);
    }
  }, [selectedBrandId]);

  // Handle OAuth callback params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const errorMsg = params.get('error');
    if (connected) {
      setSuccessMsg(`${PLATFORM_NAMES[connected] || connected} account connected successfully!`);
      window.history.replaceState({}, '', window.location.pathname);
      loadBrands();
    }
    if (errorMsg) {
      setError(decodeURIComponent(errorMsg));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  // Filter channels by selected brand
  const filteredChannels = selectedBrandId
    ? channels.filter((ch) => ch.brand_id === selectedBrandId)
    : channels;

  // Group channels by platform
  const channelsByPlatform = filteredChannels.reduce((acc, ch) => {
    if (!acc[ch.platform]) acc[ch.platform] = [];
    acc[ch.platform].push(ch);
    return acc;
  }, {} as Record<string, Channel[]>);

  const handleConnect = async (platform: string) => {
    if (!selectedBrandId) {
      setError("Please select a brand first");
      return;
    }
    setConnecting((prev) => ({ ...prev, [platform]: true }));
    setError(null);
    try {
      const res = await api.channels.oauthConnect(platform, selectedBrandId);
      window.location.href = res.authorization_url;
    } catch (e: any) {
      setError(e.message || `Failed to connect ${platform}`);
      setConnecting((prev) => ({ ...prev, [platform]: false }));
    }
  };

  const handleConnectAllMeta = async () => {
    if (!selectedBrandId) {
      setError("Please select a brand first");
      return;
    }
    setConnecting((prev) => ({ ...prev, meta: true }));
    setError(null);
    try {
      // Connect Facebook first (which will also show connected Instagram pages)
      const res = await api.channels.oauthConnect("facebook", selectedBrandId);
      // Add a flag to indicate we want to connect both
      const url = new URL(res.authorization_url);
      url.searchParams.set("scope", "pages_manage_posts,pages_read_engagement,pages_show_list,instagram_basic,instagram_content_publish");
      window.location.href = url.toString();
    } catch (e: any) {
      setError(e.message || "Failed to connect Meta accounts");
      setConnecting((prev) => ({ ...prev, meta: false }));
    }
  };

  const handleSetActive = (channelId: string) => {
    setActiveChannelId(channelId);
    // Store in localStorage for persistence
    localStorage.setItem("active_channel_id", channelId);
    setSuccessMsg("Active account updated");
    setTimeout(() => setSuccessMsg(null), 2000);
  };

  // Load active channel from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("active_channel_id");
    if (saved) setActiveChannelId(saved);
  }, []);

  const handleDisconnect = async (channelId: string) => {
    setDisconnecting((prev) => ({ ...prev, [channelId]: true }));
    setError(null);
    try {
      await api.channels.disconnect(channelId);
      setSuccessMsg("Account disconnected");
      await loadBrands();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to disconnect");
    } finally {
      setDisconnecting((prev) => ({ ...prev, [channelId]: false }));
    }
  };

  const allPlatforms = ["facebook", "instagram", "twitter", "linkedin", "tiktok"];

  if (loading) {
    return (
      <div style={{ padding: "2rem", display: "flex", justifyContent: "center" }}>
        <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "#888" }} />
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem 2rem", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>
          Connected Accounts
        </h1>
        <p style={{ color: "#888", fontSize: "0.875rem" }}>
          Manage all your social media accounts across brands
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div style={{ background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: 8, padding: "1rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "#e74c3c" }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}
      {successMsg && (
        <div style={{ background: "rgba(46,204,113,0.1)", border: "1px solid rgba(46,204,113,0.3)", borderRadius: 8, padding: "1rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "#2ecc71" }}>
          <Check size={18} />
          {successMsg}
        </div>
      )}

      {/* Brand Selector + Meta Connect */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Building2 size={18} color="#888" />
              <span style={{ color: "#888", fontSize: "0.875rem" }}>Brand:</span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                onClick={() => setSelectedBrandId("")}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: 6,
                  border: "none",
                  background: selectedBrandId === "" ? "var(--color-primary)" : "#252525",
                  color: selectedBrandId === "" ? "#fff" : "#888",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                All Brands
              </button>
              {brands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => setSelectedBrandId(brand.id)}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: 6,
                    border: "none",
                    background: selectedBrandId === brand.id ? "var(--color-primary)" : "#252525",
                    color: selectedBrandId === brand.id ? "#fff" : "#888",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {brand.name}
                </button>
              ))}
            </div>
          </div>

          {/* Connect All via Meta */}
          <button
            className="btn btn-primary"
            onClick={handleConnectAllMeta}
            disabled={connecting["meta"] || !selectedBrandId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.85rem",
              background: "#1877F2",
            }}
          >
            {connecting["meta"] ? (
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5"/>
                  <circle cx="12" cy="12" r="5"/>
                  <circle cx="17.5" cy="6.5" r="1.5" fill="#fff" stroke="none"/>
                </svg>
                Connect All via Meta
              </>
            )}
          </button>
        </div>
      </div>

      {/* Connected Accounts by Platform */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {allPlatforms.map((platform) => {
          const platformChannels = channelsByPlatform[platform] || [];
          const platformName = PLATFORM_NAMES[platform] || platform;
          const platformColor = PLATFORM_COLORS[platform] || "#888";
          const icon = PLATFORM_ICONS[platform] || <Globe size={20} />;
          const isConnected = platformChannels.length > 0;

          return (
            <div key={platform} className="card">
              {/* Platform Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: platformChannels.length > 0 ? "1rem" : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: `${platformColor}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: platformColor,
                    }}
                  >
                    {icon}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#fff" }}>{platformName}</h3>
                      {isConnected && (
                        <span style={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          color: "#2ecc71",
                          background: "rgba(46,204,113,0.15)",
                          padding: "0.15rem 0.5rem",
                          borderRadius: 999,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}>
                          <Check size={11} /> Connected
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "#888" }}>
                      {isConnected
                        ? `${platformChannels.length} account${platformChannels.length !== 1 ? "s" : ""} connected`
                        : "Not connected"
                      }
                    </p>
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => handleConnect(platform)}
                  disabled={connecting[platform] || !selectedBrandId}
                  style={{ fontSize: "0.85rem" }}
                >
                  {connecting[platform] ? (
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <>
                      <Plus size={16} />
                      Connect
                    </>
                  )}
                </button>
              </div>

              {/* Accounts List */}
              {platformChannels.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {platformChannels.map((channel) => (
                    <div
                      key={channel.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.875rem 1rem",
                        background: "#181818",
                        borderRadius: 8,
                        border: "1px solid #2a2a2a",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            background: `${platformColor}15`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: platformColor,
                          }}
                        >
                          {icon}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, color: "#fff", fontSize: "0.875rem" }}>
                            {channel.name}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#666", marginTop: "0.125rem" }}>
                            {channel.status === "active" ? (
                              <span style={{ color: "#2ecc71", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                <Check size={12} /> Active
                              </span>
                            ) : (
                              <span style={{ color: "#e74c3c" }}>{channel.status}</span>
                            )}
                            {channel.follower_count !== null && (
                              <span style={{ marginLeft: "0.5rem" }}>· {channel.follower_count.toLocaleString()} followers</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {/* Active toggle */}
                        <button
                          onClick={() => handleSetActive(channel.id)}
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.25rem 0.5rem",
                            borderRadius: 4,
                            border: "none",
                            cursor: "pointer",
                            background: activeChannelId === channel.id ? "rgba(46,204,113,0.2)" : "#252525",
                            color: activeChannelId === channel.id ? "#2ecc71" : "#888",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                          title={activeChannelId === channel.id ? "Active account" : "Set as active"}
                        >
                          {activeChannelId === channel.id ? (
                            <>
                              <Check size={12} />
                              Active
                            </>
                          ) : (
                            "Set Active"
                          )}
                        </button>
                        {/* Brand badge */}
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#888",
                            background: "#252525",
                            padding: "0.25rem 0.5rem",
                            borderRadius: 4,
                          }}
                        >
                          {brands.find((b) => b.id === channel.brand_id)?.name || "Unknown"}
                        </span>
                        <button
                          onClick={() => handleDisconnect(channel.id)}
                          disabled={disconnecting[channel.id]}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#e74c3c",
                            cursor: "pointer",
                            padding: "0.375rem",
                            display: "flex",
                            alignItems: "center",
                            opacity: disconnecting[channel.id] ? 0.5 : 1,
                          }}
                        >
                          {disconnecting[channel.id] ? (
                            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#666",
                    fontSize: "0.875rem",
                    background: "#181818",
                    borderRadius: 8,
                  }}
                >
                  <Link2 size={24} style={{ marginBottom: "0.5rem", opacity: 0.5 }} />
                  <p>No {platformName} accounts connected</p>
                  <p style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
                    Click "Connect" to get started
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {channels.length === 0 && !loading && (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <Globe size={48} style={{ marginBottom: "1rem", opacity: 0.3, color: "#888" }} />
          <h3 style={{ color: "#fff", fontSize: "1.1rem", marginBottom: "0.5rem" }}>No Accounts Connected</h3>
          <p style={{ color: "#888", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
            Connect your social media accounts to start publishing content
          </p>
          <a href="/settings" className="btn btn-primary">
            <Settings size={16} />
            Go to Settings
          </a>
        </div>
      )}
    </div>
  );
}
