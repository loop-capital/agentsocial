'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { siteflowApi, Website } from '@/lib/siteflow';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    published: 'bg-green-100 text-green-700',
    deploying: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.draft}`}>
      {status}
    </span>
  );
}

function WebsiteListInner() {
  const searchParams = useSearchParams();
  const brandId = searchParams.get('brandId') || 'demo-brand-id';
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    siteflowApi.listWebsites(brandId)
      .then((data) => setWebsites(data.websites || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [brandId]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this website?')) return;
    try {
      await siteflowApi.deleteWebsite(id, brandId);
      setWebsites((prev) => prev.filter((w) => w.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleDeploy(id: string) {
    try {
      const res = await siteflowApi.deployWebsite(id, brandId);
      alert(`Deployed! URL: ${res.url}`);
      setWebsites((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status: 'published', url: res.url } : w))
      );
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (error) return <div className="p-10 text-center text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Websites</h1>
        <Link
          href={`/websites/new?brandId=${brandId}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
        >
          + New Website
        </Link>
      </div>

      {websites.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="text-5xl mb-4">🌐</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No websites yet</h2>
          <p className="text-gray-500 mb-6">Create your first landing page, link-in-bio, or portfolio site.</p>
          <Link
            href={`/websites/new?brandId=${brandId}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
          >
            Create Website
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {websites.map((w) => (
            <div key={w.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 bg-gradient-to-br from-teal-50 to-coral-50 flex items-center justify-center">
                <span className="text-4xl">
                  {w.template_category === 'landing' && '🚀'}
                  {w.template_category === 'linkinbio' && '🔗'}
                  {w.template_category === 'campaign' && '⏳'}
                  {w.template_category === 'portfolio' && '🎨'}
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 truncate">{w.name}</h3>
                  <StatusBadge status={w.status} />
                </div>
                <p className="text-sm text-gray-500 mb-1">{w.template_name || w.template_slug}</p>
                {w.url && (
                  <a href={w.url} target="_blank" rel="noopener noreferrer" className="text-sm text-teal-600 hover:underline truncate block">
                    {w.url}
                  </a>
                )}
                <div className="flex gap-2 mt-4">
                  <Link
                    href={`/websites/edit/${w.id}?brandId=${brandId}`}
                    className="flex-1 text-center px-3 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeploy(w.id)}
                    className="flex-1 text-center px-3 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    Deploy
                  </button>
                  <button
                    onClick={() => handleDelete(w.id)}
                    className="px-3 py-2 text-sm font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WebsitesPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <WebsiteListInner />
    </Suspense>
  );
}
