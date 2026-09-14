"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                AgentSocial
              </h2>
            </Link>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link href="/" className="text-gray-500 hover:text-gray-900 px-2 py-1 rounded transition">
              Home
            </Link>

            {/* Public pages */}
            <Link href="/compare" className="text-gray-500 hover:text-gray-900 px-2 py-1 rounded transition">
              Compare
            </Link>
            <Link href="/case-studies" className="text-gray-500 hover:text-gray-900 px-2 py-1 rounded transition">
              Case Studies
            </Link>
            <Link href="/agents/register" className="text-gray-500 hover:text-gray-900 px-2 py-1 rounded transition">
              Register Agent
            </Link>

            {/* Protected pages — only show when authenticated */}
            {isAuthenticated && (
              <>
                <Link href="/agents" className="text-gray-500 hover:text-gray-900 px-2 py-1 rounded transition">
                  Agents
                </Link>
                <Link href="/websites" className="text-gray-500 hover:text-gray-900 px-2 py-1 rounded transition">
                  Websites
                </Link>
                <Link href="/social" className="text-gray-500 hover:text-gray-900 px-2 py-1 rounded transition">
                  Social
                </Link>
                <Link href="/gbp" className="text-gray-500 hover:text-gray-900 px-2 py-1 rounded transition">
                  GBP
                </Link>
                <Link href="/booking" className="text-gray-500 hover:text-gray-900 px-2 py-1 rounded transition">
                  Booking
                </Link>
                <Link href="/settings" className="text-gray-500 hover:text-gray-900 px-2 py-1 rounded transition">
                  Settings
                </Link>
              </>
            )}

            <Link href="/chat-widget" className="text-gray-500 hover:text-gray-900 px-2 py-1 rounded transition">
              Chat Widget
            </Link>

            {/* Facebook connector always visible */}
            <Link href="/facebook" className="text-gray-500 hover:text-gray-900 px-2 py-1 rounded transition">
              Facebook Connector
            </Link>

            {/* Auth section */}
            <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-gray-600">
                    {user?.name || user?.email || "User"}
                  </span>
                  <button
                    onClick={logout}
                    className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1.5 rounded hover:bg-red-50 transition"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <Link
                  href="/"
                  className="text-sm text-white bg-blue-600 hover:bg-blue-700 font-medium px-4 py-1.5 rounded transition"
                >
                  Log In
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
