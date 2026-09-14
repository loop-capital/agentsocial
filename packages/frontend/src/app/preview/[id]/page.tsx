import React from 'react';
import { notFound } from 'next/navigation';
import LandingPageTemplate from '@/templates/landing/LandingPageTemplate';
import LinkInBioTemplate from '@/templates/linkinbio/LinkInBioTemplate';
import CampaignTemplate from '@/templates/campaign/CampaignTemplate';
import PortfolioTemplate from '@/templates/portfolio/PortfolioTemplate';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

const templateMap: Record<string, React.FC<any>> = {
  'templates/landing/LandingPageTemplate': LandingPageTemplate,
  'templates/linkinbio/LinkInBioTemplate': LinkInBioTemplate,
  'templates/campaign/CampaignTemplate': CampaignTemplate,
  'templates/portfolio/PortfolioTemplate': PortfolioTemplate,
};

interface PreviewPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ brandId?: string }>;
}

async function getWebsite(id: string, brandId: string) {
  try {
    const res = await fetch(`${API_BASE}/websites/${id}?brandId=${brandId}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  return [{ id: 'demo' }];
}

export default async function PreviewPage({ params, searchParams }: PreviewPageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const brandId = sp.brandId || 'demo-brand-id';

  const data = await getWebsite(id, brandId);
  if (!data?.website) return notFound();

  const website = data.website;
  const TemplateComponent = templateMap[website.component_path] || LandingPageTemplate;

  return <TemplateComponent config={website.config || {}} />;
}
