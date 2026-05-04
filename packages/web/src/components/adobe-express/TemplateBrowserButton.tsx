"use client";

import React, { useState } from "react";
import { LayoutTemplate, Loader2 } from "lucide-react";
import { useCCEverywhere } from "./CCEverywhereProvider";

interface TemplateBrowserButtonProps {
  onTemplateSelected?: () => void;
  disabled?: boolean;
}

export default function TemplateBrowserButton({
  onTemplateSelected,
  disabled = false,
}: TemplateBrowserButtonProps) {
  const { module, isReady } = useCCEverywhere();
  const [isOpening, setIsOpening] = useState(false);

  const handleClick = () => {
    if (!module || !isReady) return;

    setIsOpening(true);

    module.startFromContent(
      {
        query: "social media",
      },
      {
        onPublish: () => {
          setIsOpening(false);
          onTemplateSelected?.();
        },
        onCancel: () => {
          setIsOpening(false);
        },
        onError: () => {
          setIsOpening(false);
        },
        onClose: () => {
          setIsOpening(false);
        },
      }
    );
  };

  return (
    <button
      className="btn btn-secondary"
      onClick={handleClick}
      disabled={disabled || !isReady || isOpening}
      title="Browse Adobe Express templates"
    >
      {isOpening ? <Loader2 size={13} className="animate-spin" /> : <LayoutTemplate size={13} />}
      {isOpening ? "Opening..." : "Browse Templates"}
    </button>
  );
}
