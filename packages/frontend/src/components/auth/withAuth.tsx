"use client";

import { useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface WithAuthOptions {
  /** Redirect unauthenticated users to this path */
  redirectTo?: string;
  /** Show loading fallback while auth state is resolving */
  loadingFallback?: ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Loading Spinner                                                    */
/* ------------------------------------------------------------------ */

function DefaultLoadingFallback() {
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
/*  withAuth HOC                                                       */
/* ------------------------------------------------------------------ */

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const { redirectTo = "/", loadingFallback = <DefaultLoadingFallback /> } = options;

  function AuthenticatedComponent(props: P) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(pathname)}`;
        router.replace(redirectUrl);
      }
    }, [isLoading, isAuthenticated, router, pathname]);

    if (isLoading) {
      return <>{loadingFallback}</>;
    }

    if (!isAuthenticated) {
      return <>{loadingFallback}</>;
    }

    return <Component {...props} />;
  }

  AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name || "Component"})`;
  return AuthenticatedComponent;
}

/* ------------------------------------------------------------------ */
/*  AuthGuard component (for JSX use)                                */
/* ------------------------------------------------------------------ */

interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string;
  loadingFallback?: ReactNode;
}

export function AuthGuard({
  children,
  redirectTo = "/",
  loadingFallback = <DefaultLoadingFallback />,
}: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(pathname)}`;
      router.replace(redirectUrl);
    }
  }, [isLoading, isAuthenticated, router, pathname, redirectTo]);

  if (isLoading) return <>{loadingFallback}</>;
  if (!isAuthenticated) return <>{loadingFallback}</>;

  return <>{children}</>;
}
