"use client";

import React, { useState } from "react";
import { Pencil, Loader2 } from "lucide-react";
import { useCCEverywhere } from "./CCEverywhereProvider";
import type { PublishParams } from "./types";

interface ImageEditorButtonProps {
  imageAsset?: string; // base64 or URL
  onEdited?: (asset: ArrayBuffer | undefined) => void;
  disabled?: boolean;
}

export default function ImageEditorButton({
  imageAsset,
  onEdited,
  disabled = false,
}: ImageEditorButtonProps) {
  const { module, isReady } = useCCEverywhere();
  const [isEditing, setIsEditing] = useState(false);

  const handleClick = () => {
    if (!module || !isReady || !imageAsset) return;

    setIsEditing(true);

    const isUrl = imageAsset.startsWith("http");

    module.editImage(
      {
        asset: imageAsset,
        assetType: isUrl ? "url" : "base64",
        exportConfig: {
          target: "Host",
          format: "png",
        },
      },
      {
        onPublish: (publishParams: PublishParams) => {
          setIsEditing(false);
          onEdited?.(publishParams.asset);
        },
        onCancel: () => {
          setIsEditing(false);
        },
        onError: () => {
          setIsEditing(false);
        },
        onClose: () => {
          setIsEditing(false);
        },
      }
    );
  };

  return (
    <button
      className="btn btn-secondary"
      onClick={handleClick}
      disabled={disabled || !isReady || isEditing || !imageAsset}
      title="Edit image in Adobe Express"
    >
      {isEditing ? <Loader2 size={13} className="animate-spin" /> : <Pencil size={13} />}
      {isEditing ? "Editing..." : "Edit Image"}
    </button>
  );
}
