import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GetUpLook vs Zoca — The Better Choice for Salons & Spas',
  description: 'Compare GetUpLook (powered by AgentSocial) vs Zoca for salon and spa marketing. Real paid ads, AI chat widget, transparent pricing, and no contracts. Starting at $49/mo.',
  openGraph: {
    title: 'GetUpLook vs Zoca — Stop Paying for Free Listings',
    description: 'Zoca charges $299/mo but runs zero paid ads. GetUpLook includes real Google Ads, AI chat, review management, and transparent pricing from $49/mo.',
    url: 'https://getuplook.com/compare',
    siteName: 'GetUpLook',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GetUpLook vs Zoca — The Better Choice for Salons & Spas',
    description: 'Stop paying for free listings. GetUpLook includes real paid ads, AI chat, and transparent pricing.',
  },
  alternates: {
    canonical: 'https://getuplook.com/compare',
  },
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}