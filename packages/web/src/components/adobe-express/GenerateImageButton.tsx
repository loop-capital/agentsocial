"use client";

import React, { useState } from "react";
import { Wand2, Loader2 } from "lucide-react";
import { useCCEverywhere } from "./CCEverywhereProvider";
import type { PublishParams } from "./types";

interface GenerateImageButtonProps {
  prompt: string;
  onGenerated?: (asset: ArrayBuffer | undefined) => void;
  disabled?: boolean;
}

export default function GenerateImageButton({
  prompt,
  onGenerated,
  disabled = false,
}: GenerateImageButtonProps) {
  const { module, isReady } = useCCEverywhere();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleClick = () => {
    if (!module || !isReady || !prompt.trim()) return;

    setIsGenerating(true);

    module.createImageFromText(
      {
        prompt: prompt.trim(),
        exportConfig: {
          target: "Host",
          format: "png",
        },
      },
      {
        onPublish: (publishParams: PublishParams) => {
          setIsGenerating(false);
          onGenerated?.(publishParams.asset);
        },
        onCancel: () => {
          setIsGenerating(false);
        },
        onError: () => {
          setIsGenerating(false);
        },
        onClose: () => {
          setIsGenerating(false);
        },
      }
    );
  };

  return (
    <button
      className="btn btn-secondary"
      onClick={handleClick}
      disabled={disabled || !isReady || isGenerating || !prompt.trim()}
      title="Generate image with AI"
    >
      {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
      {isGenerating ? "Generating..." : "Generate Image"}
    </button>
  );
}
