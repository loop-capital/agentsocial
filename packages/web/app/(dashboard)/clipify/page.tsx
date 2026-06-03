"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  Film,
  Scissors,
  Play,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Wand2,
  Video,
  Link as LinkIcon,
} from "lucide-react";

interface VideoSource {
  id: string;
  title: string | null;
  status: string;
  sourceType: string;
  sourceUrl: string | null;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
  createdAt: string;
}

interface Clip {
  id: string;
  title: string | null;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  format: string;
  style: string;
  whyFunny: string | null;
  status: string;
  outputUrl: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
}

interface SourceWithClips {
  source: VideoSource;
  clips: Clip[];
}

export default function ClipifyPage() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const [sources, setSources] = useState<SourceWithClips[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [sourceType, setSourceType] = useState<"upload" | "youtube" | "url">("upload");
  const [settings, setSettings] = useState({
    format: "9:16" as "9:16" | "16:9" | "1:1",
    style: "opus" as "opus" | "karaoke" | "minimal",
    reframeMode: "center-crop" as "pan" | "split-screen" | "center-crop",
    maxClips: 5,
    language: "en",
  });
  const [error, setError] = useState<string | null>(null);
  const [renderingClip, setRenderingClip] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/clipify/sources`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch sources");
      const data = await res.json();

      // Fetch clips for each source
      const withClips = await Promise.all(
        data.map(async (source: VideoSource) => {
          const clipsRes = await fetch(`${API_URL}/api/v1/clipify/sources/${source.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!clipsRes.ok) return { source, clips: [] };
          const sourceData = await clipsRes.json();
          return { source: sourceData.source, clips: sourceData.clips };
        })
      );

      setSources(withClips);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    fetchSources();
    const interval = setInterval(fetchSources, 10000); // Poll for status updates
    return () => clearInterval(interval);
  }, [fetchSources]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;
      const file = acceptedFiles[0];
      if (!file.type.startsWith("video/")) {
        setError("Please upload a video file");
        return;
      }

      setUploading(true);
      setError(null);

      try {
        // First create the source
        const createRes = await fetch(`${API_URL}/api/v1/clipify/sources`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: file.name,
            sourceType: "upload",
            ...settings,
          }),
        });

        if (!createRes.ok) throw new Error("Failed to create source");
        const { source } = await createRes.json();

        // Upload the file
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch(`${API_URL}/api/v1/clipify/sources/${source.id}/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Failed to upload");

        fetchSources();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [token, API_URL, settings, fetchSources]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "video/*": [] },
    disabled: uploading,
  });

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    setUploading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/v1/clipify/sources`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceUrl: urlInput,
          sourceType: sourceType === "youtube" ? "youtube" : "url",
          title: urlInput,
          ...settings,
        }),
      });

      if (!res.ok) throw new Error("Failed to create source");
      setUrlInput("");
      fetchSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add URL");
    } finally {
      setUploading(false);
    }
  };

  const deleteSource = async (id: string) => {
    if (!confirm("Delete this source and all its clips?")) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/clipify/sources/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      fetchSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const deleteClip = async (id: string) => {
    if (!confirm("Delete this clip?")) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/clipify/clips/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      fetchSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const reRenderClip = async (id: string) => {
    setRenderingClip(id);
    try {
      const res = await fetch(`${API_URL}/api/v1/clipify/clips/${id}/render`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to start render");
      fetchSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Render failed");
    } finally {
      setRenderingClip(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle size={16} className="text-green-500" />;
      case "pending":
      case "transcribing":
      case "finding_moments":
      case "rendering":
        return <Loader2 size={16} className="text-blue-500 animate-spin" />;
      case "failed":
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Scissors size={28} className="text-blue-500" />
          <h1 className="text-2xl font-bold">Clipify</h1>
        </div>
        <p className="text-gray-500">
          Turn long videos into social-ready short clips. Auto-transcribe, find the best moments, reframe, and caption.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Dropzone */}
        <div className="lg:col-span-2">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
          >
            <input {...getInputProps()} />
            <Upload size={40} className="mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-medium mb-1">
              {isDragActive ? "Drop video here" : "Drop a video or click to upload"}
            </p>
            <p className="text-sm text-gray-500">MP4, MOV, AVI up to 50MB</p>
            {uploading && (
              <div className="mt-3 flex items-center justify-center gap-2 text-blue-600">
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </div>
            )}
          </div>

          {/* URL Input */}
          <div className="mt-4 flex gap-2">
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as any)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="youtube">YouTube</option>
              <option value="url">Direct URL</option>
            </select>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste video URL..."
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
            />
            <button
              onClick={handleUrlSubmit}
              disabled={uploading || !urlInput.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : "Add"}
            </button>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Wand2 size={16} />
            Settings
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">Format</label>
              <div className="flex gap-2">
                {(["9:16", "16:9", "1:1"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setSettings((s) => ({ ...s, format: f }))}
                    className={`px-3 py-1.5 rounded text-xs font-medium ${
                      settings.format === f
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">Caption Style</label>
              <select
                value={settings.style}
                onChange={(e) => setSettings((s) => ({ ...s, style: e.target.value as any }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="opus">Opus (word-by-word)</option>
                <option value="karaoke">Karaoke (chunked)</option>
                <option value="minimal">Minimal (clean)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">Reframe Mode</label>
              <select
                value={settings.reframeMode}
                onChange={(e) => setSettings((s) => ({ ...s, reframeMode: e.target.value as any }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="center-crop">Center Crop</option>
                <option value="pan">Face Pan</option>
                <option value="split-screen">Split Screen</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">Max Clips</label>
              <input
                type="range"
                min={1}
                max={10}
                value={settings.maxClips}
                onChange={(e) => setSettings((s) => ({ ...s, maxClips: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="text-right text-xs text-gray-500">{settings.maxClips} clips</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sources List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 size={32} className="mx-auto animate-spin text-gray-400" />
          </div>
        ) : sources.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Film size={48} className="mx-auto mb-3 opacity-50" />
            <p>No videos yet. Upload or paste a URL to get started.</p>
          </div>
        ) : (
          sources.map(({ source, clips }) => (
            <div key={source.id} className="bg-white rounded-xl border overflow-hidden">
              {/* Source Header */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedSource(expandedSource === source.id ? null : source.id)}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(source.status)}
                  <div>
                    <h3 className="font-medium">{source.title || "Untitled"}</h3>
                    <p className="text-sm text-gray-500">
                      {source.sourceType === "upload" ? "Uploaded" : source.sourceType} ·{" "}
                      {source.durationSeconds ? formatDuration(source.durationSeconds) : "Unknown duration"} ·{" "}
                      {clips.length} clips
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full capitalize">
                    {source.status}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSource(source.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                  {expandedSource === source.id ? (
                    <ChevronUp size={18} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-400" />
                  )}
                </div>
              </div>

              {/* Clips */}
              {expandedSource === source.id && (
                <div className="border-t">
                  {clips.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      {source.status === "complete" ? (
                        "No clips found in this video"
                      ) : source.status === "failed" ? (
                        "Processing failed"
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 size={16} className="animate-spin" />
                          Processing...
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {clips.map((clip) => (
                        <div key={clip.id} className="border rounded-lg overflow-hidden">
                          {/* Thumbnail / Video */}
                          <div className="aspect-[9/16] bg-gray-900 relative flex items-center justify-center">
                            {clip.status === "complete" ? (
                              <video
                                src={`${API_URL}/api/v1/clipify/clips/${clip.id}/video`}
                                className="w-full h-full object-cover"
                                controls
                                preload="metadata"
                              />
                            ) : (
                              <div className="text-center text-gray-500">
                                {clip.status === "rendering" ? (
                                  <Loader2 size={32} className="animate-spin mx-auto mb-2" />
                                ) : (
                                  <Film size={32} className="mx-auto mb-2 opacity-50" />
                                )}
                                <p className="text-sm">{clip.status}</p>
                              </div>
                            )}
                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                              {formatDuration(clip.durationSeconds)}
                            </div>
                          </div>

                          {/* Info */}
                          <div className="p-3">
                            <h4 className="font-medium text-sm mb-1">{clip.title || "Untitled clip"}</h4>
                            {clip.whyFunny && (
                              <p className="text-xs text-gray-500 mb-2">{clip.whyFunny}</p>
                            )}
                            <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                              <span className="px-1.5 py-0.5 bg-gray-100 rounded">{clip.format}</span>
                              <span className="px-1.5 py-0.5 bg-gray-100 rounded">{clip.style}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {clip.status === "complete" && (
                                <>
                                  <a
                                    href={`${API_URL}/api/v1/clipify/clips/${clip.id}/video`}
                                    download
                                    className="p-1.5 text-gray-500 hover:text-blue-600"
                                    title="Download"
                                  >
                                    <Download size={16} />
                                  </a>
                                  <button
                                    onClick={() => reRenderClip(clip.id)}
                                    disabled={renderingClip === clip.id}
                                    className="p-1.5 text-gray-500 hover:text-blue-600 disabled:opacity-50"
                                    title="Re-render"
                                  >
                                    {renderingClip === clip.id ? (
                                      <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                      <RefreshCw size={16} />
                                    )}
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => deleteClip(clip.id)}
                                className="p-1.5 text-gray-500 hover:text-red-500 ml-auto"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
