import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AgentSocial — AI Social Media Management",
  description: "Schedule, publish, and analyze social media content with AI",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  );
}
