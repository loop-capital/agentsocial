import { Metadata } from "next";
import LandingPageClient from "./LandingPageClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/landing-pages/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return { title: "Landing Page" };
    const { data } = await res.json();
    return {
      title: `${data.headline} | ${data.businessName}`,
      description: data.subheadline || data.offerText || data.headline,
      openGraph: {
        title: data.headline,
        description: data.subheadline || data.offerText,
        type: "website",
      },
    };
  } catch {
    return { title: "Landing Page" };
  }
}

export default async function LandingPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <LandingPageClient slug={slug} />
  );
}