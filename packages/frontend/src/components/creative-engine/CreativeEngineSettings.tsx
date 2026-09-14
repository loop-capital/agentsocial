"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  getStoredSettings,
  saveSettings,
  UserCreativeSettings,
  CreativeProvider,
  ImageSize,
  ImageStyle,
  ProviderConfig,
  creativeApi,
} from "./creative-api";

export interface CreativeEngineSettingsProps {
  onSettingsChange?: (settings: UserCreativeSettings) => void;
}

export default function CreativeEngineSettings({ onSettingsChange }: CreativeEngineSettingsProps) {
  const [settings, setSettings] = useState<UserCreativeSettings>(getStoredSettings);
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  // Load providers on mount
  useEffect(() => {
    creativeApi.providers().then((res) => {
      if (res.success && res.data) setProviders(res.data);
    }).catch(() => {
      // Fallback to static provider list if API unavailable
      setProviders([
        { name: 'openai', enabled: true, requiresApiKey: true, apiKeyLabel: 'OPENAI_API_KEY', description: 'DALL-E 3 — Best balance of quality and cost', costPerImage: '$0.04–$0.08', maxConcurrent: 5 },
        { name: 'adobe', enabled: true, requiresApiKey: true, apiKeyLabel: 'Adobe Client ID + Secret', description: 'Adobe Firefly — Premium quality, brand-safe', costPerImage: '$0.02–$0.10', maxConcurrent: 3 },
        { name: 'pollinations', enabled: true, requiresApiKey: false, description: 'Pollinations — Free, fast, good for drafts', costPerImage: 'Free', maxConcurrent: 10 },
        { name: 'midjourney', enabled: false, requiresApiKey: true, apiKeyLabel: 'MIDJOURNEY_API_KEY', description: 'Midjourney — Artistic, stylized', costPerImage: 'Varies', maxConcurrent: 2 },
      ]);
    });
  });

  const updateSettings = useCallback(
    (patch: Partial<UserCreativeSettings> | ((prev: UserCreativeSettings) => UserCreativeSettings)) => {
      setSettings((prev) => {
        const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
        saveSettings(next);
        onSettingsChange?.(next);
        return next;
      });
    },
    [onSettingsChange]
  );

  const updateApiKey = useCallback(
    (key: keyof UserCreativeSettings["apiKeys"], value: string) => {
      updateSettings((prev) => ({
        ...prev,
        apiKeys: { ...prev.apiKeys, [key]: value },
      }));
    },
    [updateSettings]
  );

  const updatePreference = useCallback(
    <K extends keyof UserCreativeSettings["preferences"]>(key: K, value: UserCreativeSettings["preferences"][K]) => {
      updateSettings((prev) => ({
        ...prev,
        preferences: { ...prev.preferences, [key]: value },
      }));
    },
    [updateSettings]
  );

  const handleSave = useCallback(() => {
    setLoading(true);
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setLoading(false);
  }, [settings]);

  const providerOptions: { value: CreativeProvider; label: string }[] = [
    { value: "auto", label: "Auto (best available)" },
    { value: "openai", label: "OpenAI DALL-E 3" },
    { value: "adobe", label: "Adobe Firefly" },
    { value: "pollinations", label: "Pollinations (Free)" },
    { value: "midjourney", label: "Midjourney" },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Creative Engine Settings
          </CardTitle>
          <CardDescription>
            Configure API keys, default provider, and image generation preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Keys */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">API Keys</h3>
            {providers
              .filter((p) => p.requiresApiKey)
              .map((provider) => {
                const keyName = provider.name === "adobe" ? "adobeClientId" : provider.name;
                const isAdobe = provider.name === "adobe";
                const visible = showKeys[provider.name];

                return (
                  <div key={provider.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`key-${provider.name}`} className="flex items-center gap-2">
                        {provider.name === "openai" && (
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.282 9.821a5.985 5.985 0 00-.516-4.91 6.046 6.046 0 00-6.51-2.9A6.065 6.065 0 009.795 1.08a6.057 6.057 0 00-5.95 3.739 6.045 6.045 0 00-2.9 6.509 6.057 6.057 0 00.07 11.498 6.044 6.044 0 006.51 2.9A6.058 6.058 0 0014.22 22.92a6.046 6.046 0 005.95-3.737 6.053 6.053 0 002.9-6.51 6.056 6.056 0 00.212-2.852z"/></svg>
                        )}
                        {provider.name === "adobe" && (
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M13.966 22.624l-1.69-4.281H8.122l3.892-9.144 5.662 13.425h-3.71zm-7.732 0H0L8.122 0h5.877L8.234 22.624zM24 22.624h-6.234L14.89 14.37h4.99L24 22.624z"/></svg>
                        )}
                        {provider.name === "midjourney" && (
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6z"/></svg>
                        )}
                        {provider.name.charAt(0).toUpperCase() + provider.name.slice(1)}{" "}
                        {isAdobe ? "Client ID" : "API Key"}
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowKeys((prev) => ({ ...prev, [provider.name]: !prev[provider.name] }))}
                      >
                        {visible ? "Hide" : "Show"}
                      </Button>
                    </div>
                    <Input
                      id={`key-${provider.name}`}
                      type={visible ? "text" : "password"}
                      placeholder={`Enter ${provider.apiKeyLabel}`}
                      value={(settings.apiKeys as any)[keyName] || ""}
                      onChange={(e) => updateApiKey(keyName as any, e.target.value)}
                    />
                    {isAdobe && (
                      <>
                        <Label htmlFor="key-adobe-secret">Adobe Client Secret</Label>
                        <Input
                          id="key-adobe-secret"
                          type={visible ? "text" : "password"}
                          placeholder="Enter Adobe Client Secret"
                          value={settings.apiKeys.adobeClientSecret || ""}
                          onChange={(e) => updateApiKey("adobeClientSecret", e.target.value)}
                        />
                      </>
                    )}
                    <p className="text-xs text-muted-foreground">{provider.description}</p>
                  </div>
                );
              })}
          </div>

          <Separator />

          {/* Default Provider */}
          <div className="space-y-3">
            <Label htmlFor="default-provider">Default Provider</Label>
            <Select
              value={settings.defaultProvider}
              onValueChange={(v: string) => updateSettings({ defaultProvider: v as CreativeProvider })}
            >
              <SelectTrigger id="default-provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {providerOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              The provider used when none is specified. "Auto" picks the best available based on your API keys.
            </p>
          </div>

          <Separator />

          {/* Preferences */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Preferences</h3>

            <div className="space-y-3">
              <Label htmlFor="default-size">Default Image Size</Label>
              <Select
                value={settings.preferences.defaultImageSize}
                onValueChange={(v: string) => updatePreference("defaultImageSize", v as ImageSize)}
              >
                <SelectTrigger id="default-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1024x1024">1024 × 1024 (Square)</SelectItem>
                  <SelectItem value="1792x1024">1792 × 1024 (Landscape)</SelectItem>
                  <SelectItem value="1024x1792">1024 × 1792 (Portrait)</SelectItem>
                  <SelectItem value="512x512">512 × 512 (Small)</SelectItem>
                  <SelectItem value="256x256">256 × 256 (Thumbnail)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="default-style">Default Style</Label>
              <Select
                value={settings.preferences.defaultStyle}
                onValueChange={(v: string) => updatePreference("defaultStyle", v as ImageStyle)}
              >
                <SelectTrigger id="default-style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vivid">Vivid — Hyper-real and dramatic</SelectItem>
                  <SelectItem value="natural">Natural — Less hyper-real looking</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="save-cloudinary">Save to Cloudinary</Label>
                <p className="text-xs text-muted-foreground">Automatically upload generated images to Cloudinary CDN</p>
              </div>
              <Switch
                id="save-cloudinary"
                checked={settings.preferences.saveToCloudinary}
                onCheckedChange={(v) => updatePreference("saveToCloudinary", v)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={loading} className="min-w-[100px]">
              {loading ? "Saving…" : saved ? "Saved!" : "Save Settings"}
            </Button>
            {saved && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                Saved
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Provider Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Provider Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {providers.map((p) => {
              const hasKey =
                p.name === "openai"
                  ? !!settings.apiKeys.openai
                  : p.name === "adobe"
                  ? !!(settings.apiKeys.adobeClientId && settings.apiKeys.adobeClientSecret)
                  : p.name === "midjourney"
                  ? !!settings.apiKeys.midjourney
                  : true;

              return (
                <div key={p.name} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${p.enabled && hasKey ? "bg-green-500" : "bg-gray-300"}`} />
                    <div>
                      <p className="text-sm font-medium capitalize">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{p.costPerImage}</Badge>
                    {p.requiresApiKey && !hasKey && (
                      <p className="text-xs text-amber-600 mt-1">API key required</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
