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
  };
  return <span className={`inline-block w-2 h-2 rounded-full mr-2 ${colors[status] || 'bg-gray-400'}`} />;
}

function AccountsInner() {
  const searchParams = useSearchParams();
  const brandId = searchParams.get('brandId') || 'demo-brand-id';

  const [accounts, setAccounts] = useState<any[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('');

  useEffect(() => {
    Promise.all([
      socialApi.accounts(brandId).catch(() => ({ accounts: [] })),
      socialApi.platforms().catch(() => ({ platforms: [] })),
    ])
      .then(([a, pl]) => {
        setAccounts(a.accounts || []);
        setPlatforms(pl.platforms || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [brandId]);

  async function disconnect(id: string) {
    if (!confirm('Disconnect this account?')) return;
    try {
      await socialApi.disconnectAccount(brandId, id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function connectFromPostiz() {
    if (!selectedPlatform) return;
    const pl = platforms.find((p) => p.id === selectedPlatform);
    if (!pl) return;
    try {
      const res = await socialApi.connectAccount(brandId, {
        platform: pl.identifier,
        postizAccountId: pl.id,
        name: pl.name,
        picture: pl.picture,
        profile: pl.profile,
      });
      setAccounts((prev) => [res.account, ...prev]);
      setShowAdd(false);
      setSelectedPlatform('');
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (error) return <div className="p-10 text-center text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Connected Accounts</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
        >
          {showAdd ? 'Cancel' : '+ Connect Account'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Link a Postiz Account</h3>
          <p className="text-sm text-gray-500 mb-4">
            Select an existing Postiz integration to link to this brand. Connect accounts directly in Postiz UI first.
          </p>
          <div className="flex gap-3">
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select platform...</option>
              {platforms.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.identifier})</option>
              ))}
            </select>
            <button
              onClick={connectFromPostiz}
              disabled={!selectedPlatform}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              Connect
            </button>
          </div>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="text-5xl mb-4">🔗</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No connected accounts</h2>
          <p className="text-gray-500 mb-6">Connect social accounts via Postiz to start scheduling posts.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
          >
            Connect Account
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {accounts.map((a) => (
            <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {a.picture ? (
                  <img src={a.picture} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">🌐</div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{a.name}</p>
                  <p className="text-xs text-gray-500">
                    <StatusDot status={a.status} />
                    {a.platform} {a.profile ? `· ${a.profile}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => disconnect(a.id)}
                className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                Disconnect
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AccountsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <AccountsInner />
    </Suspense>
  );
}
