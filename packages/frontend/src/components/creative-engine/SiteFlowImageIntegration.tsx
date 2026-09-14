"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export interface TemplateSlot {
  id: string;
  label: string;
  prompt: string;
  size: ImageSize;
  /** Optional fixed provider for this slot */
  provider?: CreativeProvider;
}

export interface SiteFlowImageIntegrationProps {
  /** Template slots that need images */
  slots: TemplateSlot[];
  /** Site / template name */
  siteName: string;
  /** Called when all images generated */
  onComplete?: (images: Record<string, GeneratedImage>) => void;
  /** Called when a single image is generated (for live preview) */
  onSlotImage?: (slotId: string, image: GeneratedImage) => void;
}

interface SlotStatus {
  id: string;
  status: "pending" | "generating" | "done" | "error";
  result?: GeneratedImage;
  error?: string;
  regenerated: number;
}

export default function SiteFlowImageIntegration({
  slots,
  siteName,
  onComplete,
  onSlotImage,
}: SiteFlowImageIntegrationProps) {
  const [statuses, setStatuses] = useState<SlotStatus[]>(() =>
    slots.map((s) => ({
      id: s.id,
      status: "pending",
      regenerated: 0,
    }))
  );
  const [running, setRunning] = useState(false);

  const doneCount = statuses.filter((s) => s.status === "done").length;
  const progress = slots.length > 0 ? Math.round((doneCount / slots.length) * 100) : 0;

  const generateSlot = useCallback(
    async (slot: TemplateSlot, globalProvider: CreativeProvider = "auto"): Promise<GeneratedImage | null> => {
      const request: GenerateImageRequest = {
        prompt: slot.prompt,
        provider: slot.provider || globalProvider,
        size: slot.size,
      };

      const res = await creativeApi.generate(request);
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.error || "Generation failed");
    },
    []
  );

  const handleGenerateAll = useCallback(async () => {
    setRunning(true);
    const results: Record<string, GeneratedImage> = {};

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      setStatuses((prev) =>
        prev.map((s) => (s.id === slot.id ? { ...s, status: "generating" } : s))
      );

      try {
        const image = await generateSlot(slot);
        if (image) {
          results[slot.id] = image;
          setStatuses((prev) =>
            prev.map((s) =>
              s.id === slot.id ? { ...s, status: "done", result: image } : s
            )
          );
          onSlotImage?.(slot.id, image);
        }
      } catch (err: any) {
        setStatuses((prev) =>
          prev.map((s) =>
            s.id === slot.id
              ? { ...s, status: "error", error: err.message || "Failed" }
              : s
          )
        );
      }
    }

    setRunning(false);
    onComplete?.(results);
  }, [slots, generateSlot, onComplete, onSlotImage]);

  const handleRegenerate = useCallback(
    async (slot: TemplateSlot) => {
      setStatuses((prev) =>
        prev.map((s) =>
          s.id === slot.id
            ? { ...s, status: "generating", regenerated: s.regenerated + 1 }
            : s
        )
      );

      try {
        const image = await generateSlot(slot);
        if (image) {
          setStatuses((prev) =>
            prev.map((s) =>
              s.id === slot.id ? { ...s, status: "done", result: image } : s
            )
          );
          onSlotImage?.(slot.id, image);
        }
      } catch (err: any) {
        setStatuses((prev) =>
          prev.map((s) =>
            s.id === slot.id
              ? { ...s, status: "error", error: err.message || "Failed" }
              : s
          )
        );
      }
    },
    [generateSlot, onSlotImage]
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>SiteFlow Image Generation</CardTitle>
              <CardDescription>
                Auto-generating images for <strong>{siteName}</strong> template slots.
              </CardDescription>
            </div>
            <Badge variant="secondary">{slots.length} slots</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Progress value={progress} className="h-2 w-64" />
              <p className="text-xs text-muted-foreground">
                {doneCount} / {slots.length} complete ({progress}%)
              </p>
            </div>
            <Button
              onClick={handleGenerateAll}
              disabled={running || slots.length === 0}
            >
              {running ? (
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
                  Generate All
                </>
              )}
            </Button>
          </div>

          <div className="space-y-3">
            {statuses.map((status) => {
              const slot = slots.find((s) => s.id === status.id)!;
              return (
                <div
                  key={status.id}
                  className="flex items-start gap-4 rounded-lg border p-4"
                >
                  {/* Thumbnail */}
                  <div className="shrink-0">
                    {status.result ? (
                      <div className="relative h-20 w-20 rounded-md overflow-hidden bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={status.result.url}
                          alt={slot.label}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="h-20 w-20 rounded-md bg-muted flex items-center justify-center">
                        <svg
                          className="h-8 w-8 text-muted-foreground opacity-50"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{slot.label}</p>
                      {status.status === "done" && (
                        <Badge variant="outline" className="text-green-600 text-[10px]">
                          Done
                        </Badge>
                      )}
                      {status.status === "generating" && (
                        <Badge variant="secondary" className="text-[10px]">
                          Generating…
                        </Badge>
                      )}
                      {status.status === "error" && (
                        <Badge variant="destructive" className="text-[10px]">
                          Failed
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {slot.prompt}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Badge variant="outline" className="text-[10px]">
                        {slot.size}
                      </Badge>
                      {slot.provider && (
                        <Badge variant="outline" className="text-[10px]">
                          {slot.provider}
                        </Badge>
                      )}
                      {status.regenerated > 0 && (
                        <Badge variant="secondary" className="text-[10px]">
                          Regenerated ×{status.regenerated}
                        </Badge>
                      )}
                    </div>
                    {status.error && (
                      <p className="text-xs text-red-500">{status.error}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex flex-col gap-2">
                    {status.result && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => handleRegenerate(slot)}
                          disabled={status.status === "generating"}
                        >
                          <svg
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          Regenerate
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8" asChild>
                          <a href={status.result.url} target="_blank" rel="noopener noreferrer">
                            <svg
                              className="h-4 w-4 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            Preview
                          </a>
                        </Button>
                      </>
                    )}
                    {!status.result && status.status !== "generating" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => handleRegenerate(slot)}
                      >
                        <svg
                          className="h-4 w-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        Generate
                      </Button>
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
