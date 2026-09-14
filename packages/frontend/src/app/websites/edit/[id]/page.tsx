'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { siteflowApi, Website } from '@/lib/siteflow';
import LandingPageTemplate from '@/templates/landing/LandingPageTemplate';
import LinkInBioTemplate from '@/templates/linkinbio/LinkInBioTemplate';
import CampaignTemplate from '@/templates/campaign/CampaignTemplate';
import PortfolioTemplate from '@/templates/portfolio/PortfolioTemplate';

const templateMap: Record<string, React.FC<any>> = {
  'templates/landing/LandingPageTemplate': LandingPageTemplate,
  'templates/linkinbio/LinkInBioTemplate': LinkInBioTemplate,
  'templates/campaign/CampaignTemplate': CampaignTemplate,
  'templates/portfolio/PortfolioTemplate': PortfolioTemplate,
};

function ConfigField({ label, value, onChange, type = 'text' }: { label: string; value: any; onChange: (v: any) => void; type?: string }) {
  if (type === 'color') {
    return (
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 w-24">{label}</label>
        <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 rounded cursor-pointer border" />
        <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} className="flex-1 px-3 py-2 rounded border border-gray-200 text-sm" />
      </div>
    );
  }
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 outline-none text-sm"
      />
    </div>
  );
}

function EditWebsiteInner() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const brandId = searchParams.get('brandId') || 'demo-brand-id';
  const websiteId = params.id as string;

  const [website, setWebsite] = useState<Website | null>(null);
  const [config, setConfig] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    siteflowApi.getWebsite(websiteId, brandId)
      .then((data) => {
        setWebsite(data.website);
        setConfig(data.website.config || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [websiteId, brandId]);

  async function handleSave() {
    setSaving(true);
    try {
      await siteflowApi.updateWebsite(websiteId, { brandId, config });
      alert('Saved!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeploy() {
    setDeploying(true);
    try {
      const res = await siteflowApi.deployWebsite(websiteId, brandId);
      alert(`Deployed! URL: ${res.url}`);
      if (website) setWebsite({ ...website, status: 'published', url: res.url });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeploying(false);
    }
  }

  function updateField(path: string, value: any) {
    setConfig((prev) => {
      const next = { ...prev };
      const keys = path.split('.');
      let cur: any = next;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!cur[keys[i]]) cur[keys[i]] = {};
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  }

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!website) return <div className="p-10 text-center text-red-600">Website not found</div>;

  const TemplateComponent = templateMap[website.component_path || ''] || LandingPageTemplate;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/websites?brandId=${brandId}`} className="text-gray-500 hover:text-gray-700">← Back</Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit: {website.name}</h1>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${website.status === 'published' ? 'bg-green-100 text-green-700' : website.status === 'deploying' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
          {website.status}
        </span>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setPreviewMode(false)} className={`px-4 py-2 rounded-lg text-sm font-medium ${!previewMode ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Edit</button>
        <button onClick={() => setPreviewMode(true)} className={`px-4 py-2 rounded-lg text-sm font-medium ${previewMode ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Preview</button>
      </div>

      {previewMode ? (
        <div className="border rounded-xl overflow-hidden shadow-sm">
          <div className="bg-gray-50 px-4 py-2 border-b text-xs text-gray-500 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-2">Preview</span>
          </div>
          <TemplateComponent config={config} />
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold">Brand</h2>
            <ConfigField label="Brand Name" value={config.brandName} onChange={(v) => updateField('brandName', v)} />
            <ConfigField label="Tagline" value={config.tagline} onChange={(v) => updateField('tagline', v)} />
            <ConfigField label="Logo URL" value={config.logoUrl} onChange={(v) => updateField('logoUrl', v)} />
            <ConfigField label="Avatar URL" value={config.avatarUrl} onChange={(v) => updateField('avatarUrl', v)} />

            <h2 className="text-lg font-semibold pt-4 border-t">Colors</h2>
            <ConfigField label="Primary" value={config.colors?.primary} onChange={(v) => updateField('colors.primary', v)} type="color" />
            <ConfigField label="Secondary" value={config.colors?.secondary} onChange={(v) => updateField('colors.secondary', v)} type="color" />
            <ConfigField label="Background" value={config.colors?.background} onChange={(v) => updateField('colors.background', v)} type="color" />
            <ConfigField label="Text" value={config.colors?.text} onChange={(v) => updateField('colors.text', v)} type="color" />
            <ConfigField label="Accent" value={config.colors?.accent} onChange={(v) => updateField('colors.accent', v)} type="color" />

            <h2 className="text-lg font-semibold pt-4 border-t">Hero / Content</h2>
            <ConfigField label="Hero Title" value={config.heroTitle} onChange={(v) => updateField('heroTitle', v)} />
            <ConfigField label="Hero Subtitle" value={config.heroSubtitle} onChange={(v) => updateField('heroSubtitle', v)} />
            <ConfigField label="CTA Text" value={config.ctaText} onChange={(v) => updateField('ctaText', v)} />
            <ConfigField label="CTA URL" value={config.ctaUrl} onChange={(v) => updateField('ctaUrl', v)} />
            <ConfigField label="Hero Image URL" value={config.heroImageUrl} onChange={(v) => updateField('heroImageUrl', v)} />
            <ConfigField label="Bio" value={config.bio} onChange={(v) => updateField('bio', v)} />
            <ConfigField label="About Text" value={config.aboutText} onChange={(v) => updateField('aboutText', v)} />
            <ConfigField label="Contact Email" value={config.contactEmail} onChange={(v) => updateField('contactEmail', v)} />
            <ConfigField label="Footer Text" value={config.footerText} onChange={(v) => updateField('footerText', v)} />
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-4">Actions</h2>
              <div className="space-y-3">
                <button onClick={handleSave} disabled={saving} className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={handleDeploy} disabled={deploying} className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50">
                  {deploying ? 'Deploying...' : '🚀 Deploy to Vercel'}
                </button>
                {website.url && (
                  <a href={website.url} target="_blank" rel="noopener noreferrer" className="block w-full text-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                    Visit Live Site →
                  </a>
                )}
              </div>
            </div>

            <div className="border rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-2 border-b text-xs text-gray-500">Live Preview</div>
              <div className="max-h-[600px] overflow-y-auto">
                <TemplateComponent config={config} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditWebsitePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <EditWebsiteInner />
    </Suspense>
  );
}
