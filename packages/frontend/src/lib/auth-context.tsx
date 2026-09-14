"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  brandId?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "agentsocial_auth";
const TOKEN_KEY = "agentsocial_token";

/* ------------------------------------------------------------------ */
/*  Helper: read stored auth                                           */
/* ------------------------------------------------------------------ */

function getStoredAuth(): { user: User | null; token: string | null } {
  if (typeof window === "undefined") return { user: null, token: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    const user = raw ? (JSON.parse(raw) as User) : null;
    return { user, token };
  } catch {
    return { user: null, token: null };
  }
}

function setStoredAuth(user: User | null, token: string | null) {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEY);
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* Initialise from storage */
  useEffect(() => {
    const { user: u, token: t } = getStoredAuth();
    setUser(u);
    setToken(t);
    setIsLoading(false);
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Login                                                            */
  /* ---------------------------------------------------------------- */

  const login = useCallback(
    async (email: string, password: string) => {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/v1";
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Login failed" }));
        throw new Error(body.error || body.message || `HTTP ${res.status}`);
      }

      const json = await res.json();
      const newToken = json.token || json.data?.token;
      const newUser = json.user || json.data?.user;

      if (!newToken || !newUser) {
        throw new Error("Invalid login response: missing token or user");
      }

      setUser(newUser);
      setToken(newToken);
      setStoredAuth(newUser, newToken);
    },
    []
  );

  /* ---------------------------------------------------------------- */
  /*  Logout                                                           */
  /* ---------------------------------------------------------------- */

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setStoredAuth(null, null);
    router.push("/");
  }, [router]);

  /* ---------------------------------------------------------------- */
  /*  Auth headers for API calls                                       */
  /* ---------------------------------------------------------------- */

  const getAuthHeaders = useCallback(() => {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }, [token]);

  /* ---------------------------------------------------------------- */
  /*  Sync logout across tabs                                          */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY || e.key === TOKEN_KEY) {
        const { user: u, token: t } = getStoredAuth();
        setUser(u);
        setToken(t);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value: AuthContextValue = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    getAuthHeaders,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
