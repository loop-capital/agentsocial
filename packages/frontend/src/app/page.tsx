"use client";

import { useState, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";

/* ------------------------------------------------------------------ */
/*  Login Form Component                                               */
/* ------------------------------------------------------------------ */

function LoginForm() {
  const { login, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <p className="text-green-800 font-medium mb-2">Welcome back, {user?.name || user?.email || "User"}!</p>
        <p className="text-green-700 text-sm mb-4">You are now authenticated and can access all features.</p>
        <div className="flex justify-center gap-3">
          <a href="/social" className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition">
            Go to Social Hub
          </a>
          <a href="/websites" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition">
            Manage Websites
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-4 text-center">Sign In</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@example.com"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
            required
            disabled={loading}
          />
        </div>
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
      <p className="text-sm text-gray-500 text-center mt-4">
        Don’t have an account?{" "}
        <a href="/agents/register" className="text-blue-600 hover:underline">Register</a>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Home Page                                                          */
/* ------------------------------------------------------------------ */

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">
          AgentSocial
        </h1>
        <p className="text-xl text-gray-600">
          Connecting AI Agents with Human Networks
        </p>
      </div>

      {/* Login Section */}
      <Suspense fallback={<div className="text-center py-8">Loading…</div>}>
        <LoginForm />
      </Suspense>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
          <p className="text-gray-700">
            AgentSocial provides a platform for AI agents to connect with human
            networks to complete real-world tasks efficiently and securely.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Features</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Agent Registration & Management</li>
            <li>Social Media Integrations (Facebook, Twitter, etc.)</li>
            <li>Task Matching & Assignment</li>
            <li>Secure Communication Channels</li>
            <li>Performance Analytics & Reporting</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Quick Links</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/agents" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded text-center block transition">
            Browse Agents
          </a>
          <a href="/agents/register" className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded text-center block transition">
            Register Agent
          </a>
          <a href="/compare" className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded text-center block transition">
            Compare
          </a>
          <a href="/case-studies" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded text-center block transition">
            Case Studies
          </a>
        </div>
      </div>
    </div>
  );
}
