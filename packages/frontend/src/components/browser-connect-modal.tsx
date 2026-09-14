'use client';

import React, { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = 'instagram' | 'facebook' | 'tiktok';

interface PlatformInfo {
  id: Platform;
  name: string;
  icon: string;
  supportsImages: boolean;
  supportsVideos: boolean;
  supportsText: boolean;
  supportsLinks: boolean;
  requiresMedia: boolean;
  maxCaptionLength: number;
  description: string;
}

interface BrowserChannel {
  id: string;
  brandId: string;
  platform: string;
  name: string;
  authMethod: string;
  status: string;
  lastUsedAt: string | null;
  lastError: string | null;
  createdAt: string;
}

interface BrowserConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandId: string;
  onChannelConnected?: (channel: BrowserChannel) => void;
  apiBaseUrl?: string;
}

// ─── Platform Config ───────────────────────────────────────────────────────────

const PLATFORMS: Record<Platform, PlatformInfo> = {
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    supportsImages: true,
    supportsVideos: true,
    supportsText: false,
    supportsLinks: false,
    requiresMedia: true,
    maxCaptionLength: 2200,
    description: 'Post photos and videos to your Instagram feed or stories.',
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    icon: '👤',
    supportsImages: true,
    supportsVideos: true,
    supportsText: true,
    supportsLinks: true,
    requiresMedia: false,
    maxCaptionLength: 63206,
    description: 'Share posts, links, photos, and videos to your Facebook profile or page.',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    supportsImages: false,
    supportsVideos: true,
    supportsText: true,
    supportsLinks: false,
    requiresMedia: true,
    maxCaptionLength: 2200,
    description: 'Upload videos to TikTok. Note: TikTok only supports video content.',
  },
};

// ─── API Helpers ───────────────────────────────────────────────────────────────

const DEFAULT_API_BASE = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:3001`
  : 'http://localhost:3001';

async function fetchSupportedPlatforms(apiBase: string): Promise<PlatformInfo[]> {
  const res = await fetch(`${apiBase}/v1/channels/browser-supported`);
  if (!res.ok) throw new Error('Failed to fetch platforms');
  const data = await res.json();
  return data.platforms;
}

async function connectBrowserChannel(
  apiBase: string,
  payload: {
    brandId: string;
    platform: Platform;
    username: string;
    password: string;
    name: string;
    pageId?: string;
  }
): Promise<BrowserChannel> {
  const res = await fetch(`${apiBase}/v1/channels/browser-connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to connect channel');
  return data;
}

async function fetchBrowserChannels(
  apiBase: string,
  brandId: string
): Promise<BrowserChannel[]> {
  const res = await fetch(`${apiBase}/v1/channels/browser?brandId=${brandId}`);
  if (!res.ok) throw new Error('Failed to fetch channels');
  const data = await res.json();
  return data.channels || [];
}

async function deleteBrowserChannel(
  apiBase: string,
  channelId: string
): Promise<void> {
  const res = await fetch(`${apiBase}/v1/channels/browser/${channelId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to delete channel');
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BrowserConnectModal({
  isOpen,
  onClose,
  brandId,
  onChannelConnected,
  apiBaseUrl = DEFAULT_API_BASE,
}: BrowserConnectModalProps) {
  const [activeTab, setActiveTab] = useState<'connect' | 'manage'>('connect');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('instagram');
  const [channels, setChannels] = useState<BrowserChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [channelName, setChannelName] = useState('');
  const [pageId, setPageId] = useState(''); // Facebook only

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMessage(null);
      setUsername('');
      setPassword('');
      setChannelName('');
      setPageId('');
      if (activeTab === 'manage') {
        loadChannels();
      }
    }
  }, [isOpen]);

  const loadChannels = useCallback(async () => {
    if (!brandId) return;
    setLoading(true);
    setError(null);
    try {
      const chs = await fetchBrowserChannels(apiBaseUrl, brandId);
      setChannels(chs);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, brandId]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!username || !password || !channelName) {
      setError('Username, password, and channel name are required.');
      return;
    }

    if (!brandId) {
      setError('Brand ID is required. Please select a brand first.');
      return;
    }

    setLoading(true);
    try {
      const channel = await connectBrowserChannel(apiBaseUrl, {
        brandId,
        platform: selectedPlatform,
        username,
        password,
        name: channelName,
        pageId: selectedPlatform === 'facebook' ? pageId : undefined,
      });
      setSuccessMessage(
        `${PLATFORMS[selectedPlatform].name} channel "${channelName}" connected successfully!`
      );
      onChannelConnected?.(channel);
      // Reset form
      setUsername('');
      setPassword('');
      setChannelName('');
      setPageId('');
      // Switch to manage tab after short delay
      setTimeout(() => {
        setActiveTab('manage');
        loadChannels();
      }, 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (channelId: string, channelName: string) => {
    if (!confirm(`Remove the "${channelName}" channel? This cannot be undone.`)) return;
    setLoading(true);
    setError(null);
    try {
      await deleteBrowserChannel(apiBaseUrl, channelId);
      setChannels(prev => prev.filter(c => c.id !== channelId));
      setSuccessMessage(`Channel "${channelName}" removed.`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const platform = PLATFORMS[selectedPlatform];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-gray-900 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="browser-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 id="browser-modal-title" className="text-lg font-semibold text-white">
            Connect Social Media Channel
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close modal"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => { setActiveTab('connect'); setError(null); setSuccessMessage(null); }}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'connect'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Connect New Channel
          </button>
          <button
            onClick={() => { setActiveTab('manage'); setError(null); setSuccessMessage(null); loadChannels(); }}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'manage'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Manage Channels
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Error / Success banners */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              ✓ {successMessage}
            </div>
          )}

          {/* ── Connect Tab ── */}
          {activeTab === 'connect' && (
            <form onSubmit={handleConnect} className="space-y-5">
              {/* Platform selector */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Platform
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(PLATFORMS) as Platform[]).map((p) => {
                    const info = PLATFORMS[p];
                    const isSelected = selectedPlatform === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setSelectedPlatform(p)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-center text-sm transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                            : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-xl">{info.icon}</span>
                        <span className="font-medium">{info.name}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-gray-500">{platform.description}</p>
              </div>

              {/* Platform features */}
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Capabilities
                </p>
                <div className="flex flex-wrap gap-2">
                  {platform.supportsImages && (
                    <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">📷 Images</span>
                  )}
                  {platform.supportsVideos && (
                    <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-400">🎬 Videos</span>
                  )}
                  {platform.supportsText && (
                    <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">📝 Text Posts</span>
                  )}
                  {platform.supportsLinks && (
                    <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-400">🔗 Links</span>
                  )}
                  {platform.requiresMedia && (
                    <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs text-orange-400">⚠️ Requires Media</span>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Max caption: {platform.maxCaptionLength.toLocaleString()} characters
                </p>
              </div>

              {/* Channel name */}
              <div>
                <label htmlFor="channel-name" className="mb-1.5 block text-sm font-medium text-gray-300">
                  Channel Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="channel-name"
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder={`e.g., ${platform.name} Business Account`}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-blue-500 focus:bg-white/10"
                  required
                />
              </div>

              {/* Username */}
              <div>
                <label htmlFor="channel-username" className="mb-1.5 block text-sm font-medium text-gray-300">
                  Username or Email <span className="text-red-400">*</span>
                </label>
                <input
                  id="channel-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={`Your ${platform.name} username or email`}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-blue-500 focus:bg-white/10"
                  required
                  autoComplete="off"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="channel-password" className="mb-1.5 block text-sm font-medium text-gray-300">
                  Password <span className="text-red-400">*</span>
                </label>
                <input
                  id="channel-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={`Your ${platform.name} password`}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-blue-500 focus:bg-white/10"
                  required
                  autoComplete="new-password"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Credentials are encrypted with XOR+Base64 before storage. Use a strong, unique password.
                </p>
              </div>

              {/* Facebook Page ID (conditional) */}
              {selectedPlatform === 'facebook' && (
                <div>
                  <label htmlFor="fb-page-id" className="mb-1.5 block text-sm font-medium text-gray-300">
                    Facebook Page ID <span className="text-gray-500">(optional)</span>
                  </label>
                  <input
                    id="fb-page-id"
                    type="text"
                    value={pageId}
                    onChange={(e) => setPageId(e.target.value)}
                    placeholder="Leave blank to post to your personal profile"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-blue-500 focus:bg-white/10"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    Find your Page ID at: facebook.com/[your-page]/about
                  </p>
                </div>
              )}

              {/* Privacy notice */}
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="text-xs text-amber-400/80">
                  <strong>⚠️ Browser Automation:</strong> This method uses a headless browser to log in to {platform.name} on your behalf.
                  {platform.requiresMedia
                    ? ' An image or video file is required for each post.'
                    : ' Both text and media posts are supported.'}
                  Platform terms of service may restrict automated access.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Connecting...
                  </span>
                ) : (
                  `Connect ${platform.name} Channel`
                )}
              </button>
            </form>
          )}

          {/* ── Manage Tab ── */}
          {activeTab === 'manage' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                Connected browser channels for brand <span className="font-mono text-white">{brandId}</span>
              </p>

              {loading && channels.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <svg className="h-6 w-6 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              ) : channels.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 py-10 text-center">
                  <p className="text-sm text-gray-500">No browser-connected channels yet.</p>
                  <button
                    onClick={() => setActiveTab('connect')}
                    className="mt-3 text-sm text-blue-400 hover:text-blue-300"
                  >
                    + Connect your first channel
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {channels.map((channel) => {
                    const pInfo = PLATFORMS[channel.platform as Platform] || {
                      icon: '❓',
                      name: channel.platform,
                    };
                    return (
                      <div
                        key={channel.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{pInfo.icon}</span>
                          <div>
                            <p className="font-medium text-white">{channel.name}</p>
                            <p className="text-xs text-gray-500">
                              {pInfo.name} ·{' '}
                              <span className={channel.status === 'active' ? 'text-green-400' : 'text-red-400'}>
                                {channel.status}
                              </span>
                              {channel.lastUsedAt && (
                                <> · Last used: {new Date(channel.lastUsedAt).toLocaleDateString()}</>
                              )}
                            </p>
                            {channel.lastError && (
                              <p className="mt-1 text-xs text-red-400/80">{channel.lastError}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(channel.id, channel.name)}
                          disabled={loading}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 transition-colors hover:border-red-500/60 hover:bg-red-500/20 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
