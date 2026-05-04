"use client";

import { useState } from "react";
import { Camera, ThumbsUp, Music } from "lucide-react";

interface BrowserConnectModalProps {
  open: boolean;
  onClose: () => void;
  brandId: string;
  onSuccess: () => void;
}

const platforms = [
  { id: "instagram" as const, name: "Instagram", icon: Camera, color: "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500" },
  { id: "facebook" as const, name: "Facebook", icon: ThumbsUp, color: "bg-blue-600" },
  { id: "tiktok" as const, name: "TikTok", icon: Music, color: "bg-black" },
];

export function BrowserConnectModal({ open, onClose, brandId, onSuccess }: BrowserConnectModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<"instagram" | "facebook" | "tiktok">("instagram");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleConnect = async () => {
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/v1/channels/browser-connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          platform: selectedPlatform,
          username,
          password,
          name: `${selectedPlatform} (${username})`,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to connect");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Connect Social Account</h2>
          <p className="text-sm text-gray-500">Log in with your username and password. No business verification needed.</p>
        </div>

        <div className="grid gap-4">
          {/* Platform selection */}
          <div className="grid grid-cols-3 gap-2">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              return (
                <button
                  key={platform.id}
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors ${
                    selectedPlatform === platform.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className={`rounded-full p-2 text-white ${platform.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium">{platform.name}</span>
                </button>
              );
            })}
          </div>

          {/* Credentials */}
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">Username</label>
            <input
              id="username"
              type="text"
              placeholder={`${selectedPlatform} username`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Connecting..." : `Connect ${selectedPlatform}`}
          </button>

          <p className="text-xs text-gray-400 text-center">
            We encrypt and securely store your credentials. You can disconnect at any time.
          </p>
        </div>
      </div>
    </div>
  );
}
