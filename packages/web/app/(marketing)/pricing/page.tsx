import type { Metadata } from "next";
import Link from "next/link";
import { PricingPageClient } from "./pricing-client";

export const metadata: Metadata = {
  title: "Pricing — AgentSocial | Salon & Beauty Business Plans",
  description:
    "Transparent pricing for AgentSocial. Core, Pro, Elite plans and Voice AI add-on for salons and beauty businesses. Start your 14-day free trial today.",
  openGraph: {
    title: "Pricing — AgentSocial",
    description:
      "AI-powered social media, review management, and website building for salons. From $49/mo. No contracts. Cancel anytime.",
    url: "https://agentsocial.io/pricing",
    siteName: "AgentSocial",
    type: "website",
  },
};

export default function PricingPage() {
  return <PricingPageClient />;
}