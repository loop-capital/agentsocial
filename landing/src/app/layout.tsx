import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AgentSocial — AI-Powered Social Media Management",
  description:
    "Schedule, publish, and manage your social media presence across all platforms with AI-powered tools.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <nav style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 2rem",
          borderBottom: "1px solid #eee",
          background: "#fff",
        }}>
          <a href="/" style={{ fontWeight: 700, fontSize: "1.25rem", color: "#111", textDecoration: "none" }}>
            AgentSocial
          </a>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <a href="/terms" style={{ color: "#555", textDecoration: "none", fontSize: "0.9rem" }}>Terms</a>
            <a href="/privacy" style={{ color: "#555", textDecoration: "none", fontSize: "0.9rem" }}>Privacy</a>
          </div>
        </nav>
        {children}
        <footer style={{
          borderTop: "1px solid #eee",
          padding: "2rem",
          textAlign: "center",
          color: "#888",
          fontSize: "0.85rem",
        }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <a href="/terms" style={{ color: "#555", textDecoration: "none", margin: "0 1rem" }}>Terms of Service</a>
            <a href="/privacy" style={{ color: "#555", textDecoration: "none", margin: "0 1rem" }}>Privacy Policy</a>
          </div>
          <p>© {new Date().getFullYear()} AgentSocial. All rights reserved.</p>
          <p style={{ marginTop: "0.5rem" }}>Contact: support@getagentsocial.com</p>
        </footer>
      </body>
    </html>
  );
}
