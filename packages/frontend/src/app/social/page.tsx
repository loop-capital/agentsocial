'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { socialApi } from '@/lib/api';

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-500',
    disconnected: 'bg-gray-400',
    error: 'bg-red-500',
    pending: 'bg-yellow-500',
    scheduled: 'bg-blue-500',
    published: 'bg-green-500',
    draft: 'bg-gray-400',
  };
  return (
    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${colors[status] || colors.draft}`} />
  );
}

function SocialHubInner() {
  const searchParams = useSearchParams();
  const brandId = searchParams.get('brandId') || 'demo-brand-id';

  const [accounts, setAccounts] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      socialApi.accounts(brandId).catch(() => ({ accounts: [] })),
      socialApi.posts(brandId, 'limit=5').catch(() => ({ posts: [] })),
      socialApi.platforms().catch(() => ({ platforms: [] })),
    ])
      .then(([a, p, pl]) => {
        setAccounts(a.accounts || []);
        setPosts(p.posts || []);
        setPlatforms(pl.platforms || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [brandId]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (error) return <div className="p-10 text-center text-red-600">Error: {error}</div>;

  const activeAccounts = accounts.filter((a) => a.status === 'active');
  const upcoming = posts.filter((p) => p.status === 'scheduled');
  const published = posts.filter((p) => p.status === 'published');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Social Hub</h1>
        <Link
          href={`/social/posts/new?brandId=${brandId}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
        >
          + New Post
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Connected Accounts</p>
          <p className="text-2xl font-bold text-gray-900">{activeAccounts.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Scheduled Posts</p>
          <p className="text-2xl font-bold text-gray-900">{upcoming.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Published Posts</p>
          <p className="text-2xl font-bold text-gray-900">{published.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Available Platforms</p>
          <p className="text-2xl font-bold text-gray-900">{platforms.length}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Accounts</h2>
          {activeAccounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-3">No connected accounts yet.</p>
              <Link href={`/social/accounts?brandId=${brandId}`} className="text-teal-600 hover:underline text-sm font-medium">
                Connect an account →
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {activeAccounts.slice(0, 5).map((a) => (
                <li key={a.id} className="flex items-center gap-3">
                  <StatusDot status={a.status} />
                  <span className="font-medium text-gray-900">{a.name}</span>
                  <span className="text-xs text-gray-400 uppercase">{a.platform}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href={`/social/accounts?brandId=${brandId}`} className="mt-4 inline-block text-sm text-teal-600 hover:underline font-medium">
            Manage accounts →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Posts</h2>
          {upcoming.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-3">Nothing scheduled.</p>
              <Link href={`/social/posts/new?brandId=${brandId}`} className="text-teal-600 hover:underline text-sm font-medium">
                Schedule a post →
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {upcoming.slice(0, 5).map((p) => (
                <li key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <StatusDot status={p.status} />
                    <span className="truncate text-gray-700">{p.content}</span>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {p.scheduled_at ? new Date(p.scheduled_at).toLocaleDateString() : 'Draft'}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href={`/social/posts?brandId=${brandId}`} className="mt-4 inline-block text-sm text-teal-600 hover:underline font-medium">
            View all posts →
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Platforms</h2>
        <div className="flex flex-wrap gap-2">
          {platforms.length === 0 ? (
            <p className="text-sm text-gray-500">Postiz is currently unreachable. Check the API connection.</p>
          ) : (
            platforms.map((pl) => (
              <span key={pl.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm">
                <img src={pl.picture} alt="" className="w-4 h-4 rounded-full" />
                {pl.name}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function SocialHubPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <SocialHubInner />
    </Suspense>
  );
}

SocialHubPage.authRequired = true;
