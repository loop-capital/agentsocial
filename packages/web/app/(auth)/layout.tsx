"use client";

import { usePathname } from "next/navigation";
import { AuthProvider, ProtectedRoute, useAuth } from "../../src/lib/auth";

function AuthPageGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  // Onboarding requires an authenticated session.
  const requiresAuth = pathname === "/onboarding";
  // Login/register are public, but authenticated users should go to the dashboard.
  const publicOnly = pathname === "/login" || pathname === "/register";

  if (requiresAuth) {
    return <ProtectedRoute>{children}</ProtectedRoute>;
  }

  if (publicOnly && isAuthenticated && !isLoading) {
    // Handled at page level to avoid replacing during SSR/hydration mismatch.
    return <>{children}</>;
  }

  return <>{children}</>;
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthPageGuard>{children}</AuthPageGuard>
    </AuthProvider>
  );
}
