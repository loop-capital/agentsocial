"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "2rem",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "#fff",
              marginBottom: "0.5rem",
            }}
          >
            Welcome back
          </h1>
          <p style={{ color: "#888" }}>Sign in to your AgentSocial account</p>
        </div>

        <div className="card">
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p
                style={{
                  color: "#ef4444",
                  fontSize: "0.875rem",
                  margin: 0,
                }}
              >
                {error}
              </p>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "0.875rem",
              }}
              disabled={isLoading}
            >
              {isLoading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p
          style={{
            textAlign: "center",
            color: "#666",
            marginTop: "1.5rem",
            fontSize: "0.875rem",
          }}
        >
          Don&apos;t have an account?{" "}
          <Link href="/register" style={{ color: "#2563eb" }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
