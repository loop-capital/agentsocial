'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import StatCard from '@/components/admin/StatCard';
import ReportsTable from '@/components/admin/ReportsTable';
import PatternGroups from '@/components/admin/PatternGroups';
import { mockReports, mockPatternGroups, getReportStats } from '@/lib/mockData';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    validated: 0,
    matched: 0,
    settled: 0,
    potential_class_action: 0,
  });
  const [reports, setReports] = useState(mockReports.slice(0, 10));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const loadData = async () => {
      setIsLoading(true);
      
      // In a real app, fetch from API
      // const response = await fetch('/api/reports?limit=50');
      // const data = await response.json();
      
      // For now, use mock data
      setStats(getReportStats());
      setReports(mockReports.slice(0, 10));
      setIsLoading(false);
    };

    loadData();
  }, []);

  const handleValidate = (id: string) => {
    console.log('Validate report:', id);
    // In a real app, call API
  };

  const handleDismiss = (id: string) => {
    console.log('Dismiss report:', id);
    // In a real app, call API
  };

  const handleMatch = (id: string) => {
    console.log('Match report to attorney:', id);
    // In a real app, call API
  };

  return (
    <div className="min-h-screen bg-charcoal-50">
      <Sidebar />
      
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-charcoal">Dashboard</h1>
            <p className="text-charcoal-400">Overview of spam reports and case management</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            <StatCard
              title="Total Reports"
              value={stats.total}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              }
              color="charcoal"
              change="+12%"
              changeType="positive"
            />
            <StatCard
              title="Pending Validation"
              value={stats.pending}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              color="coral"
            />
            <StatCard
              title="Validated"
              value={stats.validated}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              color="teal"
            />
            <StatCard
              title="Matched to Attorney"
              value={stats.matched}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              }
              color="teal"
            />
            <StatCard
              title="Settled"
              value={stats.settled}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
              }
              color="teal"
            />
            <StatCard
              title="Class Action Candidates"
              value={stats.potential_class_action}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              }
              color="coral"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Reports */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-charcoal">Recent Reports</h2>
                <a 
                  href="/admin/reports" 
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  View all →
                </a>
              </div>
              <ReportsTable 
                reports={reports} 
                showActions={true}
                onValidate={handleValidate}
                onDismiss={handleDismiss}
                onMatch={handleMatch}
              />
            </div>

            {/* Pattern Groups */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-charcoal">Pattern Groups</h2>
              </div>
              <PatternGroups groups={mockPatternGroups} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
