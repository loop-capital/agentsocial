"use client";

import { useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

/* ------------------------------------------------------------------ */
/*  Route Configuration                                                */
/* ------------------------------------------------------------------ */

/** Routes that are ALWAYS public (no auth needed) */
const PUBLIC_PATHS = new Set([
  "/",
  "/privacy",
  "/terms",
  "/compare",
  "/case-studies",
  "/agents/register",
  "/chat-widget",
]);

/** Route prefixes that are always public */
const PUBLIC_PREFIXES = [
  "/landing/",
];

/** Routes that ALWAYS require authentication */
const PROTECTED_PATHS = [
  "/social",
  "/gbp",
  "/settings",
  "/profile",
  "/booking",
  "/websites",
  "/preview",
  "/content",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  return false;
}

function isProtectedPath(pathname: string): boolean {
  for (const prefix of PROTECTED_PATHS) {
    if (pathname.startsWith(prefix)) return true;
  }
  return false;
}

/* ------------------------------------------------------------------ */
/*  Loading UI                                                         */
/* ------------------------------------------------------------------ */

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 text-sm">Loading…</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  RouteGuard Component                                               */
/* ------------------------------------------------------------------ */

interface RouteGuardProps {
  children: ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    const isPublic = isPublicPath(pathname);
    const isProtected = isProtectedPath(pathname);

    // If on a protected route and not authenticated → redirect to home
    if (isProtected && !isAuthenticated) {
      const redirectUrl = `/?redirect=${encodeURIComponent(pathname)}`;
      router.replace(redirectUrl);
    }

    // Optional: if authenticated and on login-only pages → redirect to dashboard
    // (not implemented to keep flexibility)
  }, [isLoading, isAuthenticated, pathname, router]);

  // Show loading while auth state resolves
  if (isLoading) {
    return <LoadingFallback />;
  }

  // On protected route without auth → still show loading to avoid flash
  if (isProtectedPath(pathname) && !isAuthenticated) {
    return <LoadingFallback />;
  }

  return <>{children}</>;
}
