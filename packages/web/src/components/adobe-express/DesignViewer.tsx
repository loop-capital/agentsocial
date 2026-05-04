"use client";

import React, { useState } from "react";
import { Eye, Loader2 } from "lucide-react";
import { useCCEverywhere } from "./CCEverywhereProvider";

interface DesignViewerProps {
  imageAsset?: string; // base64 or URL
  disabled?: boolean;
}

export default function DesignViewer({ imageAsset, disabled = false }: DesignViewerProps) {
  const { module, isReady } = useCCEverywhere();
  const [isViewing, setIsViewing] = useState(false);

  const handleClick = () => {
    if (!module || !isReady || !imageAsset) return;

    setIsViewing(true);

    const isUrl = imageAsset.startsWith("http");

    module.viewDesign(
      {
        asset: imageAsset,
        assetType: isUrl ? "url" : "base64",
        exportConfig: {
          target: "Host",
          format: "png",
        },
      },
      {
        onPublish: () => {
          setIsViewing(false);
        },
        onCancel: () => {
          setIsViewing(false);
        },
        onError: () => {
          setIsViewing(false);
        },
        onClose: () => {
          setIsViewing(false);
        },
      }
    );
  };

  return (
    <button
      className="btn btn-secondary"
      onClick={handleClick}
      disabled={disabled || !isReady || isViewing || !imageAsset}
      title="Preview design in Adobe Express"
    >
      {isViewing ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
      {isViewing ? "Loading..." : "Preview Design"}
    </button>
  );
}
