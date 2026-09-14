"use client";

import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  creativeApi,
  GenerateImageRequest,
  GeneratedImage,
  CreativeProvider,
  ImageSize,
  ImageQuality,
  ImageStyle,
} from "./creative-api";

interface BatchJob {
  id: string;
  prompt: string;
  status: "pending" | "generating" | "done" | "error";
  result?: GeneratedImage;
  error?: string;
}

export interface BatchGenerationUIProps {
  /** Initial prompts (one per line) */
  initialPrompts?: string;
  /** Called when batch completes */
  onComplete?: (images: GeneratedImage[]) => void;
}

export default function BatchGenerationUI({
  initialPrompts = "",
  onComplete,
}: BatchGenerationUIProps) {
  const [rawInput, setRawInput] = useState(initialPrompts);
  const [provider, setProvider] = useState<CreativeProvider>("auto");
  const [size, setSize] = useState<ImageSize>("1024x1024");
  const [quality, setQuality] = useState<ImageQuality>("standard");
  const [style, setStyle] = useState<ImageStyle>("vivid");
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [running, setRunning] = useState(false);
  const abortRef = useRef(false);

  const providerOptions = [
    { value: "auto" as const, label: "Auto (best available)" },
    { value: "openai" as const, label: "OpenAI DALL-E 3" },
    { value: "adobe" as const, label: "Adobe Firefly" },
    { value: "pollinations" as const, label: "Pollinations (Free)" },
    { value: "midjourney" as const, label: "Midjourney" },
  ];

  const prompts = rawInput
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const completedCount = jobs.filter((j) => j.status === "done").length;
  const errorCount = jobs.filter((j) => j.status === "error").length;
  const progress = jobs.length > 0 ? Math.round((completedCount / jobs.length) * 100) : 0;

  const handleStart = useCallback(async () => {
    if (prompts.length === 0) return;
    abortRef.current = false;
    setRunning(true);

    // Initialize jobs
    const initialJobs: BatchJob[] = prompts.map((prompt, i) => ({
      id: `job-${Date.now()}-${i}`,
      prompt,
      status: "pending",
    }));
    setJobs(initialJobs);

    const results: GeneratedImage[] = [];

    // Process sequentially (respect provider concurrency limits)
    for (let i = 0; i < initialJobs.length; i++) {
      if (abortRef.current) break;

      setJobs((prev) =>
        prev.map((j, idx) => (idx === i ? { ...j, status: "generating" } : j))
      );

      const request: GenerateImageRequest = {
        prompt: initialJobs[i].prompt,
        provider,
        size,
        quality,
        style,
      };

      try {
        const res = await creativeApi.generate(request);
        if (res.success && res.data) {
          results.push(res.data);
          setJobs((prev) =>
            prev.map((j, idx) =>
              idx === i ? { ...j, status: "done", result: res.data } : j
            )
          );
        } else {
          setJobs((prev) =>
            prev.map((j, idx) =>
              idx === i
                ? { ...j, status: "error", error: res.error || "Unknown error" }
                : j
            )
          );
        }
      } catch (err: any) {
        setJobs((prev) =>
          prev.map((j, idx) =>
            idx === i
              ? { ...j, status: "error", error: err.message || "Network error" }
              : j
          )
        );
      }
    }

    setRunning(false);
    onComplete?.(results);
  }, [prompts, provider, size, quality, style, onComplete]);

  const handleAbort = useCallback(() => {
    abortRef.current = true;
    setRunning(false);
  }, []);

  const handleClear = useCallback(() => {
    setRawInput("");
    setJobs([]);
  }, []);

  const handleDownloadAll = useCallback(async () => {
    const done = jobs.filter((j) => j.status === "done" && j.result);
    for (const job of done) {
      if (!job.result) continue;
      try {
        const res = await fetch(job.result.url);
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `batch-${job.id}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      } catch {
        window.open(job.result!.url, "_blank");
      }
    }
  }, [jobs]);

  const handleCopyUrls = useCallback(() => {
    const urls = jobs
      .filter((j) => j.status === "done" && j.result)
      .map((j) => j.result!.url)
      .join("\n");
    navigator.clipboard.writeText(urls).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = urls;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    });
  }, [jobs]);

  return (
    <div className="space-y-6 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>Batch Image Generation</CardTitle>
          <CardDescription>
            Enter one prompt per line. Each line will generate one image.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="batch-prompts">Prompts ({prompts.length} lines)</Label>
            <Textarea
              id="batch-prompts"
              placeholder={`A serene mountain lake at sunset\nA futuristic city skyline at night\nA cozy cottage in autumn forest\nMinimalist product photography on white`}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              className="min-h-[160px] font-mono text-sm resize-y"
              disabled={running}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label>Provider</Label>
              <Select value={provider} onValueChange={(v: string) => setProvider(v as CreativeProvider)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {providerOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Size</Label>
              <Select value={size} onValueChange={(v: string) => setSize(v as ImageSize)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Label>Quality</Label>
              <Select value={quality} onValueChange={(v: string) => setQuality(v as ImageQuality)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="hd">HD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Style</Label>
              <Select value={style} onValueChange={(v: string) => setStyle(v as ImageStyle)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vivid">Vivid</SelectItem>
                  <SelectItem value="natural">Natural</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{prompts.length} prompts</Badge>
              {completedCount > 0 && (
                <Badge variant="outline" className="text-green-600">{completedCount} done</Badge>
              )}
              {errorCount > 0 && (
                <Badge variant="destructive">{errorCount} failed</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleClear} disabled={running}>
                Clear
              </Button>
              {running ? (
                <Button variant="destructive" size="sm" onClick={handleAbort}>
                  Stop
                </Button>
              ) : (
                <Button
                  onClick={handleStart}
                  disabled={prompts.length === 0}
                >
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Start Batch
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      {jobs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Progress</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleCopyUrls} disabled={completedCount === 0}>
                  Copy URLs
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDownloadAll} disabled={completedCount === 0}>
                  Download All
                </Button>
              </div>
            </div>
            <Progress value={progress} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {completedCount} / {jobs.length} complete ({progress}%)
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="shrink-0">
                    {job.status === "pending" && (
                      <div className="h-5 w-5 rounded-full border-2 border-muted" />
                    )}
                    {job.status === "generating" && (
                      <svg className="h-5 w-5 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    {job.status === "done" && (
                      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {job.status === "error" && (
                      <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">{job.prompt}</p>
                    {job.error && (
                      <p className="text-xs text-red-500">{job.error}</p>
                    )}
                  </div>
                  {job.result && (
                    <div className="shrink-0 flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{job.result.size}</Badge>
                      <a
                        href={job.result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        View
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
