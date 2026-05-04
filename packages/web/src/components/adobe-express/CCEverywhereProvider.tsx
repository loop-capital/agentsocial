"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import type { CCEverywhereInstance, CCEverywhereModule } from "./types";

interface CCEverywhereContextValue {
  instance: CCEverywhereInstance | null;
  module: CCEverywhereModule | null;
  isReady: boolean;
  isLoading: boolean;
  error: Error | null;
}

const CCEverywhereContext = createContext<CCEverywhereContextValue>({
  instance: null,
  module: null,
  isReady: false,
  isLoading: true,
  error: null,
});

export function useCCEverywhere() {
  return useContext(CCEverywhereContext);
}

const SDK_URL = "https://cc-embed.adobe.com/sdk/v4/CCEverywhere.js";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

interface CCEverywhereProviderProps {
  children: React.ReactNode;
}

export default function CCEverywhereProvider({ children }: CCEverywhereProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const instanceRef = useRef<CCEverywhereInstance | null>(null);

  const initSdk = useCallback(async () => {
    try {
      setIsLoading(true);
      await loadScript(SDK_URL);

      const clientId = process.env.NEXT_PUBLIC_ADOBE_CLIENT_ID;
      const appName = process.env.NEXT_PUBLIC_ADOBE_APP_NAME;

      if (!clientId || !appName) {
        throw new Error(
          "Missing Adobe Express SDK environment variables: NEXT_PUBLIC_ADOBE_CLIENT_ID and NEXT_PUBLIC_ADOBE_APP_NAME"
        );
      }

      if (typeof window === "undefined" || !window.CCEverywhere) {
        throw new Error("Adobe Express SDK (window.CCEverywhere) not available after script load");
      }

      const instance = await window.CCEverywhere.initialize({
        clientId,
        appName,
      });

      instanceRef.current = instance;
      setIsReady(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initSdk();
  }, [initSdk]);

  const value: CCEverywhereContextValue = {
    instance: instanceRef.current,
    module: instanceRef.current?.module ?? null,
    isReady,
    isLoading,
    error,
  };

  return (
    <CCEverywhereContext.Provider value={value}>
      {children}
    </CCEverywhereContext.Provider>
  );
}
