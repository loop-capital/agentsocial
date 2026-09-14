'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/admin/Sidebar';
import ReportsTable from '@/components/admin/ReportsTable';
import { mockReports } from '@/lib/mockData';

type StatusFilter = 'all' | 'pending' | 'validated' | 'dismissed' | 'matched' | 'settled';

export default function ReportsPage() {
  const [reports, setReports] = useState(mockReports);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReports = reports.filter((report) => {
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesSearch = 
      searchQuery === '' || 
      report.sender_phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.message_body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reporter_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reporter_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const handleValidate = (id: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'validated' as const } : r));
  };

  const handleDismiss = (id: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'dismissed' as const } : r));
  };

  const handleMatch = (id: string) => {
    // In a real app, open a modal to select attorney
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'matched' as const, attorney_id: 'att-001' } : r));
  };

  const statusOptions: { value: StatusFilter; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: reports.length },
    { value: 'pending', label: 'Pending', count: reports.filter(r => r.status === 'pending').length },
    { value: 'validated', label: 'Validated', count: reports.filter(r => r.status === 'validated').length },
    { value: 'matched', label: 'Matched', count: reports.filter(r => r.status === 'matched').length },
    { value: 'settled', label: 'Settled', count: reports.filter(r => r.status === 'settled').length },
    { value: 'dismissed', label: 'Dismissed', count: reports.filter(r => r.status === 'dismissed').length },
  ];

  return (
    <div className="min-h-screen bg-charcoal-50">
      <Sidebar />
      
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-charcoal">Reports</h1>
              <p className="text-charcoal-400">Manage and review spam reports</p>
            </div>
            <Link
              href="/admin"
              className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors text-sm font-medium"
            >
              Back to Dashboard
            </Link>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-charcoal-100 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <svg 
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-400" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth={1.5} 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by sender, message, or reporter..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setStatusFilter(option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === option.value
                        ? 'bg-teal-500 text-white'
                        : 'bg-charcoal-50 text-charcoal-600 hover:bg-charcoal-100'
                    }`}
                  >
                    {option.label}
                    <span className="ml-2 text-xs opacity-75">({option.count})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reports Table */}
          <ReportsTable 
            reports={filteredReports}
            showActions={true}
            onValidate={handleValidate}
            onDismiss={handleDismiss}
            onMatch={handleMatch}
          />

          <div className="mt-4 text-sm text-charcoal-400">
            Showing {filteredReports.length} of {reports.length} reports
          </div>
        </div>
      </div>
    </div>
  );
}
