import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentSocial — AI Social Media Management",
  description: "Schedule, publish, and analyze social media content with AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}