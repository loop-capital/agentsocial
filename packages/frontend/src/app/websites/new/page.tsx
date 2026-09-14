'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { siteflowApi, Template } from '@/lib/siteflow';

function NewWebsiteInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const brandId = searchParams.get('brandId') || 'demo-brand-id';

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [siteName, setSiteName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    siteflowApi.listTemplates()
      .then((data) => {
        setTemplates(data.templates || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  async function handleCreate() {
    if (!selectedTemplate || !siteName.trim()) return;
    setCreating(true);
    try {
      const res = await siteflowApi.createWebsite({
        brandId,
        templateId: selectedTemplate.id,
        name: siteName.trim(),
        config: {},
      });
      router.push(`/websites/edit/${res.website.id}?brandId=${brandId}`);
    } catch (err: any) {
      alert(err.message);
      setCreating(false);
    }
  }

  if (loading) return <div className="p-10 text-center">Loading templates...</div>;
  if (error) return <div className="p-10 text-center text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href={`/websites?brandId=${brandId}`} className="text-gray-500 hover:text-gray-700">← Back</Link>
        <h1 className="text-3xl font-bold text-gray-900">New Website</h1>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Site Name</label>
        <input
          type="text"
          value={siteName}
          onChange={(e) => setSiteName(e.target.value)}
          placeholder="My Awesome Site"
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
        />
      </div>

      <h2 className="text-xl font-semibold text-gray-900">Choose a Template</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTemplate(t)}
            className={`text-left rounded-xl border-2 p-4 transition-all hover:shadow-md ${
              selectedTemplate?.id === t.id
                ? 'border-teal-500 bg-teal-50'
                : 'border-gray-100 bg-white'
            }`}
          >
            <div className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg mb-4 flex items-center justify-center text-4xl">
              {t.category === 'landing' && '🚀'}
              {t.category === 'linkinbio' && '🔗'}
              {t.category === 'campaign' && '⏳'}
              {t.category === 'portfolio' && '🎨'}
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{t.name}</h3>
            <p className="text-sm text-gray-500 line-clamp-2">{t.description}</p>
            <div className="flex gap-2 mt-3">
              {t.tags?.slice(0, 2).map((tag) => (
                <span key={tag} className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">{tag}</span>
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleCreate}
          disabled={!selectedTemplate || !siteName.trim() || creating}
          className="px-8 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? 'Creating...' : 'Continue →'}
        </button>
      </div>
    </div>
  );
}

export default function NewWebsitePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <NewWebsiteInner />
    </Suspense>
  );
}
