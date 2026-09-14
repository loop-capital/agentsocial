"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  creativeApi,
  GenerateImageRequest,
  GeneratedImage,
  CreativeProvider,
  ImageSize,
  ImageQuality,
  ImageStyle,
  getStoredSettings,
} from "./creative-api";

interface PromptTemplate {
  label: string;
  prompt: string;
  category: string;
}

const PROMPT_TEMPLATES: PromptTemplate[] = [
  { label: "Social Media Hero", category: "Marketing", prompt: "A vibrant, eye-catching social media banner with modern typography and bold colors, professional marketing design" },
  { label: "Product Showcase", category: "Marketing", prompt: "Clean product photography on a minimal white background, soft studio lighting, commercial quality" },
  { label: "Abstract Background", category: "Design", prompt: "Abstract geometric gradient background, soft pastel colors, smooth transitions, minimalist design" },
  { label: "Portrait Photo", category: "Photography", prompt: "Professional headshot portrait, natural lighting, neutral background, confident expression" },
  { label: "Food Photography", category: "Photography", prompt: "Gourmet food photography, overhead shot, rustic wooden table, natural lighting, appetizing presentation" },
  { label: "Tech Illustration", category: "Illustration", prompt: "Flat vector illustration of modern technology concept, clean lines, vibrant colors, minimal style" },
  { label: "Nature Landscape", category: "Nature", prompt: "Stunning landscape photography, golden hour lighting, dramatic sky, serene atmosphere, high resolution" },
  { label: "Office Workspace", category: "Business", prompt: "Modern minimalist office workspace, natural light through windows, clean desk setup, plants" },
];

export interface ImageGenerationUIProps {
  /** Initial prompt value */
  initialPrompt?: string;
  /** Called when an image is successfully generated */
  onImageGenerated?: (image: GeneratedImage) => void;
  /** Called when user wants to use an image in a site/template */
  onUseImage?: (image: GeneratedImage) => void;
  /** Show compact mode (sidebar) */
  compact?: boolean;
}

export default function ImageGenerationUI({
  initialPrompt = "",
  onImageGenerated,
  onUseImage,
  compact = false,
}: ImageGenerationUIProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [provider, setProvider] = useState<CreativeProvider>("auto");
  const [size, setSize] = useState<ImageSize>("1024x1024");
  const [quality, setQuality] = useState<ImageQuality>("standard");
  const [style, setStyle] = useState<ImageStyle>("vivid");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GeneratedImage[]>([]);
  const [estimate, setEstimate] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [showTemplates, setShowTemplates] = useState(false);
  const [saveToCloud, setSaveToCloud] = useState(true);

  const userSettings = getStoredSettings();

  // Derive provider options from stored settings
  const providerOptions: { value: CreativeProvider; label: string }[] = [
    { value: "auto", label: "Auto (best available)" },
    { value: "openai", label: "OpenAI DALL-E 3" },
    { value: "adobe", label: "Adobe Firefly" },
    { value: "pollinations", label: "Pollinations (Free)" },
    { value: "midjourney", label: "Midjourney" },
  ];

  useEffect(() => {
    setProvider(userSettings.defaultProvider);
    setSize(userSettings.preferences.defaultImageSize);
    setStyle(userSettings.preferences.defaultStyle);
    setSaveToCloud(userSettings.preferences.saveToCloudinary);
  }, []);

  // Estimate cost when prompt or provider changes
  useEffect(() => {
    if (!prompt.trim()) {
      setEstimate(null);
      return;
    }
    const timer = setTimeout(() => {
      creativeApi
        .estimate({ prompt, provider, size, quality, style })
        .then((res) => {
          if (res.success && res.data) setEstimate(res.data.estimatedCost);
        })
        .catch(() => setEstimate(null));
    }, 500);
    return () => clearTimeout(timer);
  }, [prompt, provider, size, quality, style]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);

    const request: GenerateImageRequest = {
      prompt: prompt.trim(),
      provider,
      size,
      quality,
      style,
    };

    try {
      const res = await creativeApi.generate(request);
      if (res.success && res.data) {
        setGenerated((prev) => [res.data!, ...prev]);
        onImageGenerated?.(res.data);
      } else {
        setError(res.error || "Generation failed");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. The provider may be unavailable — try switching to Pollinations (free).");
    } finally {
      setLoading(false);
    }
  }, [prompt, provider, size, quality, style, onImageGenerated]);

  const handleDownload = useCallback(async (url: string, filename?: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename || `generated-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      // Fallback: open in new tab
      window.open(url, "_blank");
    }
  }, []);

  const handleCopyUrl = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  }, []);

  const applyTemplate = useCallback((template: PromptTemplate) => {
    setPrompt(template.prompt);
    setShowTemplates(false);
  }, []);

  const categories = ["All", ...Array.from(new Set(PROMPT_TEMPLATES.map((t) => t.category)))];
  const filteredTemplates =
    activeCategory === "All" ? PROMPT_TEMPLATES : PROMPT_TEMPLATES.filter((t) => t.category === activeCategory);

  return (
    <div className={compact ? "space-y-4" : "space-y-6 max-w-5xl"}>
      {/* Generation Form */}
      <Card>
        <CardHeader className={compact ? "pb-3" : ""}>
          <CardTitle className={compact ? "text-base" : "text-lg"}>
            {compact ? "Generate Image" : "Image Generator"}
          </CardTitle>
          {!compact && (
            <CardDescription>
              Describe the image you want to create. Select a provider, size, and style.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="prompt">Prompt</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplates((v) => !v)}
              >
                {showTemplates ? "Hide Templates" : "Templates"}
              </Button>
            </div>
            <Textarea
              id="prompt"
              placeholder="A serene mountain lake at sunset with vibrant orange and purple reflections..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[80px] resize-y"
            />
          </div>

          {/* Templates */}
          {showTemplates && (
            <div className="rounded-lg border bg-muted/50 p-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    variant={activeCategory === cat ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredTemplates.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className="text-left rounded-md border bg-background p-2.5 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t.label}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {t.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Options Row */}
          <div className={`grid gap-3 ${compact ? "grid-cols-1" : "grid-cols-2 md:grid-cols-4"}`}>
            <div className="space-y-1.5">
              <Label htmlFor="provider">Provider</Label>
              <Select value={provider} onValueChange={(v: string) => setProvider(v as CreativeProvider)}>
                <SelectTrigger id="provider">
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
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="size">Size</Label>
              <Select value={size} onValueChange={(v: string) => setSize(v as ImageSize)}>
                <SelectTrigger id="size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1024x1024">1024 × 1024</SelectItem>
                  <SelectItem value="1792x1024">1792 × 1024</SelectItem>
                  <SelectItem value="1024x1792">1024 × 1792</SelectItem>
                  <SelectItem value="512x512">512 × 512</SelectItem>
                  <SelectItem value="256x256">256 × 256</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quality">Quality</Label>
              <Select value={quality} onValueChange={(v: string) => setQuality(v as ImageQuality)}>
                <SelectTrigger id="quality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="hd">HD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="style">Style</Label>
              <Select value={style} onValueChange={(v: string) => setStyle(v as ImageStyle)}>
                <SelectTrigger id="style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vivid">Vivid</SelectItem>
                  <SelectItem value="natural">Natural</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {estimate !== null && (
                <Badge variant="secondary">Est. ~${estimate.toFixed(2)}</Badge>
              )}
              {error && (
                <Badge variant="destructive" className="max-w-xs whitespace-normal">
                  {error}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="save-cloud"
                  checked={saveToCloud}
                  onCheckedChange={setSaveToCloud}
                />
                <Label htmlFor="save-cloud" className="text-xs text-muted-foreground cursor-pointer">
                  Save to Cloudinary
                </Label>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="min-w-[120px]"
              >
                {loading ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating…
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gallery */}
      {generated.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold">Generated Images</h3>
            <Button variant="ghost" size="sm" onClick={() => setGenerated([])}>
              Clear All
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {generated.map((img, idx) => (
              <Card key={`${img.url}-${idx}`} className="overflow-hidden group">
                <div className="relative aspect-square bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.prompt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownload(img.url, `creative-${Date.now()}.png`)}
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCopyUrl(img.url)}
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy URL
                      </Button>
                    </div>
                    {onUseImage && (
                      <Button size="sm" variant="default" onClick={() => onUseImage(img)}>
                        Use in Site
                      </Button>
                    )}
                  </div>
                </div>
                <CardContent className="p-3 space-y-1.5">
                  <p className="text-xs text-muted-foreground line-clamp-2">{img.prompt}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {img.provider}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {img.size}
                    </Badge>
                    {img.metadata.cost !== undefined && (
                      <Badge variant="secondary" className="text-[10px]">
                        ${img.metadata.cost.toFixed(3)}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
