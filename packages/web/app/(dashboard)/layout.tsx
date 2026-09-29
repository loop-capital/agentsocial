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
  type LucideIcon,
  Palette,
  Inbox,
  Building2,
  LayoutTemplate,
  Eye,
  Link2,
  Globe,
  CreditCard,
  Scissors,
  Star,
  MessageSquare,
  MessageCircle,
  CalendarCheck,
  Send,
  Megaphone,
  DollarSign,
  Users,
  Shield,
  Mic,
  PenSquare,
  ListTodo,
} from "lucide-react";
import { useState } from "react";
import CCEverywhereProvider from "../../src/components/adobe-express/CCEverywhereProvider";
import { AuthProvider, ProtectedRoute, useAuth } from "../../src/lib/auth";

type NavItem = { href: string; label: string; icon: LucideIcon };

// Grouped by the customer's workflow: plan → create → publish → engage → grow.
const navSections: Array<{ label: string | null; items: NavItem[] }> = [
  { label: null, items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  {
    label: "Plan",
    items: [
      { href: "/ai-planner", label: "AI Planner", icon: Sparkles },
      { href: "/content-calendar", label: "Content Calendar", icon: Calendar },
    ],
  },
  {
    label: "Create",
    items: [
      { href: "/create-post", label: "Create Post", icon: PenSquare },
      { href: "/clipify", label: "Video Clips", icon: Scissors },
      { href: "/create-express", label: "Design Studio", icon: Palette },
    ],
  },
  {
    label: "Publish",
    items: [
      { href: "/queue", label: "Queue", icon: ListTodo },
      { href: "/posts", label: "All Posts", icon: FileText },
      { href: "/channels", label: "Channels", icon: Globe },
    ],
  },
  {
    label: "Engage",
    items: [
      { href: "/inbox", label: "Inbox", icon: Inbox },
      { href: "/gbp", label: "Google Business", icon: Star },
      { href: "/gbp/reviews", label: "Reviews", icon: MessageSquare },
      { href: "/review-sentry", label: "Review Requests", icon: Send },
      { href: "/gbp/widget", label: "Chat Widget", icon: MessageCircle },
      { href: "/voice", label: "Voice AI", icon: Mic },
    ],
  },
  {
    label: "Grow",
    items: [
      { href: "/analytics", label: "Analytics", icon: BarChart2 },
      { href: "/competitors", label: "Competitors", icon: Eye },
      { href: "/campaigns", label: "Campaigns", icon: Megaphone },
      { href: "/ad-management", label: "Ads", icon: DollarSign },
      { href: "/gbp/ads", label: "Local Ads", icon: Megaphone },
      { href: "/gbp/landing-pages", label: "Landing Pages", icon: LayoutTemplate },
    ],
  },
  {
    label: "Clients",
    items: [
      { href: "/clientvet", label: "ClientVet", icon: Shield },
      { href: "/gbp/booking", label: "Bookings", icon: CalendarCheck },
    ],
  },
  {
    label: "Brand",
    items: [
      { href: "/brand", label: "Brand Hub", icon: Building2 },
      { href: "/manager", label: "Accounts", icon: Users },
      { href: "/billing", label: "Billing", icon: CreditCard },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

const bottomNavItems: NavItem[] = [];

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const allHrefs = navSections.flatMap((sec) => sec.items.map((i) => i.href));
  const isActive = (href: string) => {
    if (pathname !== href && !pathname.startsWith(href + "/")) return false;
    // Prefer the longest matching href so parent links don't stay lit on child pages
    return !allHrefs.some((h) => h.length > href.length && (pathname === h || pathname.startsWith(h + "/")));
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
          {navSections.map((section, si) => (
            <div key={section.label ?? `s${si}`} style={{ marginTop: section.label ? 14 : 0 }}>
              {section.label && (
                <div
                  style={{
                    padding: "0 12px 4px",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                  }}
                >
                  {section.label}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link ${active ? "active" : ""}`}
                    onClick={() => setSidebarOpen(false)}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="nav-icon">
                      <Icon size={18} strokeWidth={active ? 2.5 : 1.75} />
                    </span>
                    {item.label}
                    {active && <ChevronRight size={14} style={{ marginLeft: "auto", opacity: 0.5 }} />}
                  </Link>
                );
              })}
            </div>
          ))}
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
