"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const CDN_URL = "https://cc-embed.adobe.com/sdk/v4/CCEverywhere.js";

interface AdobeExpressEditorProps {
  apiKey: string;
  appName?: string;
  onImageGenerated?: (imageUrl: string) => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    CCEverywhere: {
      initialize: (params: any, config: any) => Promise<any>;
    };
  }
}

export function AdobeExpressEditor({
  apiKey,
  appName = "AgentSocial",
  onImageGenerated,
  onError,
}: AdobeExpressEditorProps) {
  const [sdk, setSdk] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  // Load SDK
  useEffect(() => {
    if (window.CCEverywhere) {
      initializeSdk();
      return;
    }

    const script = document.createElement("script");
    script.src = CDN_URL;
    script.onload = () => initializeSdk();
    script.onerror = () => {
      const msg = "Failed to load Adobe Express SDK";
      setError(msg);
      setLoading(false);
      onError?.(msg);
    };
    document.head.appendChild(script);
    scriptRef.current = script;

    return () => {
      // Cleanup on unmount
      if (scriptRef.current) {
        scriptRef.current.remove();
      }
    };
  }, []);

  const initializeSdk = async () => {
    try {
      const cc = await window.CCEverywhere.initialize(
        {
          clientId: apiKey,
          appName,
        },
        {
          locale: "en-US",
          env: "prod",
        }
      );
      setSdk(cc);
      setLoading(false);
    } catch (e) {
      const msg = `SDK init failed: ${(e as Error).message}`;
      setError(msg);
      setLoading(false);
      onError?.(msg);
    }
  };

  const handleGenerateImage = useCallback(async () => {
    if (!sdk) return;

    try {
      const module = await sdk.createModule("generate-image", {
        outputParams: { outputType: "base64" },
      });

      module.on("complete", (result: any) => {
        if (result.assetUrl) {
          onImageGenerated?.(result.assetUrl);
        }
      });

      module.on("cancel", () => {
        console.log("User cancelled image generation");
      });

      module.on("error", (err: any) => {
        onError?.(`Generation error: ${err}`);
      });

      module.launch();
    } catch (e) {
      onError?.(`Failed to open generator: ${(e as Error).message}`);
    }
  }, [sdk, onImageGenerated, onError]);

  const handleEditImage = useCallback(async () => {
    if (!sdk) return;

    try {
      const module = await sdk.createModule("edit-image", {
        outputParams: { outputType: "base64" },
      });

      module.on("complete", (result: any) => {
        if (result.assetUrl) {
          onImageGenerated?.(result.assetUrl);
        }
      });

      module.on("cancel", () => console.log("User cancelled editing"));
      module.on("error", (err: any) => onError?.(`Edit error: ${err}`));

      module.launch();
    } catch (e) {
      onError?.(`Failed to open editor: ${(e as Error).message}`);
    }
  }, [sdk, onImageGenerated, onError]);

  const handleBrowseTemplates = useCallback(async () => {
    if (!sdk) return;

    try {
      const module = await sdk.createModule("template-browser", {
        outputParams: { outputType: "base64" },
      });

      module.on("complete", (result: any) => {
        if (result.assetUrl) {
          onImageGenerated?.(result.assetUrl);
        }
      });

      module.on("cancel", () => console.log("User cancelled template browse"));
      module.on("error", (err: any) => onError?.(`Template error: ${err}`));

      module.launch();
    } catch (e) {
      onError?.(`Failed to open templates: ${(e as Error).message}`);
    }
  }, [sdk, onImageGenerated, onError]);

  const handleQuickAction = useCallback(
    async (action: "resize" | "crop" | "remove-background") => {
      if (!sdk) return;

      try {
        const module = await sdk.createModule(`quick-action:${action}`, {
          outputParams: { outputType: "base64" },
        });

        module.on("complete", (result: any) => {
          if (result.assetUrl) {
            onImageGenerated?.(result.assetUrl);
          }
        });

        module.on("cancel", () => console.log(`User cancelled ${action}`));
        module.on("error", (err: any) => onError?.(`${action} error: ${err}`));

        module.launch();
      } catch (e) {
        onError?.(`Failed to open ${action}: ${(e as Error).message}`);
      }
    },
    [sdk, onImageGenerated, onError]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Loading Adobe Express...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Generate Image */}
        <button
          onClick={handleGenerateImage}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
            Generate with AI
          </span>
        </button>

        {/* Edit Image */}
        <button
          onClick={handleEditImage}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            Edit Photo
          </span>
        </button>

        {/* Templates */}
        <button
          onClick={handleBrowseTemplates}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
              />
            </svg>
          </div>
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
            Templates
          </span>
        </button>

        {/* Remove Background */}
        <button
          onClick={() => handleQuickAction("remove-background")}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-orange-300 dark:hover:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
              />
            </svg>
          </div>
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-orange-600 dark:group-hover:text-orange-400">
            Remove BG
          </span>
        </button>
      </div>
    </div>
  );
}
