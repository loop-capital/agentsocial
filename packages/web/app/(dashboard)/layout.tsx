"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  BarChart2,
  Calendar,
  Settings,
  HelpCircle,
  LogOut,
  Search,
  Bell,
  Menu,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import CCEverywhereProvider from "../../src/components/adobe-express/CCEverywhereProvider";
import { AuthProvider, ProtectedRoute, useAuth } from "../../src/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/posts", label: "Posts", icon: FileText },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/create-express", label: "Adobe Express", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

const bottomNavItems = [
  { href: "/help", label: "Help & Support", icon: HelpCircle },
];

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="dashboard-layout">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 35,
            display: "none",
          }}
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`} aria-label="Main navigation">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">AS</div>
          AgentSocial
        </div>

        {/* Mobile close */}
        <button
          className="sidebar-mobile-close"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
          style={{
            display: "none",
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
          }}
        >
          <X size={20} />
        </button>

        {/* Main Nav */}
        <nav className="sidebar-nav" aria-label="Primary">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive(item.href) ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                <span className="nav-icon">
                  <Icon size={18} strokeWidth={isActive(item.href) ? 2.5 : 1.75} />
                </span>
                {item.label}
                {isActive(item.href) && (
                  <ChevronRight size={14} style={{ marginLeft: "auto", opacity: 0.5 }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Nav */}
        <div className="sidebar-footer">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="sidebar-link"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-icon">
                  <Icon size={18} strokeWidth={1.75} />
                </span>
                {item.label}
              </Link>
            );
          })}
          <button
            className="sidebar-link"
            style={{ width: "100%", textAlign: "left" }}
            onClick={logout}
          >
            <span className="nav-icon">
              <LogOut size={18} strokeWidth={1.75} />
            </span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        {/* Top Bar */}
        <header className="topbar">
          {/* Mobile hamburger */}
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            style={{
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              border: "none",
              background: "transparent",
              color: "var(--text-secondary)",
              cursor: "pointer",
              borderRadius: "var(--radius-md)",
              marginRight: "0.25rem",
            }}
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          <div className="topbar-search" role="search">
            <Search size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <input
              type="search"
              placeholder="Search posts, analytics..."
              aria-label="Search"
            />
          </div>

          {/* Actions */}
          <div className="topbar-actions">
            <button className="topbar-btn" aria-label="Notifications">
              <Bell size={18} />
              <span className="notification-dot" aria-label="3 unread notifications" />
            </button>
            <div
              className="topbar-avatar"
              role="button"
              tabIndex={0}
              aria-label="User menu"
              title={user?.name || "User"}
            >
              {user?.name
                ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "?"}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <CCEverywhereProvider>
          <DashboardShell>{children}</DashboardShell>
        </CCEverywhereProvider>
      </ProtectedRoute>
    </AuthProvider>
  );
}
