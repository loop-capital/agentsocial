'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/admin/Sidebar';
import { mockReports, getReportById, getReportsByPatternGroup, mockAttorneys, Report } from '@/lib/mockData';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  validated: 'bg-teal-50 text-teal-700 border-teal-200',
  dismissed: 'bg-charcoal-50 text-charcoal-400 border-charcoal-200',
  matched: 'bg-blue-50 text-blue-700 border-blue-200',
  settled: 'bg-green-50 text-green-700 border-green-200',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending Validation',
  validated: 'Validated',
  dismissed: 'Dismissed',
  matched: 'Matched to Attorney',
  settled: 'Settled',
};

export default function ReportDetailPage() {
  const params = useParams();
  const reportId = params.id as string;
  const [report, setReport] = useState<Report | undefined>(() => getReportById(reportId));
  const [patternReports, setPatternReports] = useState(() => 
    report?.pattern_group_id ? getReportsByPatternGroup(report.pattern_group_id) : []
  );

  if (!report) {
    return (
      <div className="min-h-screen bg-charcoal-50">
        <Sidebar />
        <div className="ml-64 p-8">
          <div className="max-w-4xl mx-auto text-center py-20">
            <p className="text-charcoal-400 text-lg">Report not found</p>
            <Link 
              href="/admin/reports" 
              className="inline-block mt-4 text-teal-600 hover:text-teal-700 font-medium"
            >
              ← Back to Reports
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleValidate = () => {
    const updated = { ...report, status: 'validated' as const };
    setReport(updated);
  };

  const handleDismiss = () => {
    const updated = { ...report, status: 'dismissed' as const };
    setReport(updated);
  };

  const handleMatch = () => {
    const updated = { ...report, status: 'matched' as const, attorney_id: 'att-001' };
    setReport(updated);
  };

  const assignedAttorney = report.attorney_id 
    ? mockAttorneys.find(a => a.id === report.attorney_id) 
    : null;

  return (
    <div className="min-h-screen bg-charcoal-50">
      <Sidebar />
      
      <div className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/reports"
                className="text-charcoal-400 hover:text-charcoal transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-charcoal">Report {report.id}</h1>
                <p className="text-charcoal-400">Submitted {new Date(report.created_at).toLocaleString()}</p>
              </div>
            </div>
            
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusColors[report.status]}`}>
              {statusLabels[report.status]}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Message Content */}
              <div className="bg-white rounded-xl border border-charcoal-100 p-6">
                <h2 className="text-lg font-semibold text-charcoal mb-4">Message Content</h2>
                <div className="bg-charcoal-50 rounded-lg p-4">
                  <p className="text-charcoal-600 whitespace-pre-wrap">{report.message_body}</p>
                </div>
              </div>

              {/* Sender Info */}
              <div className="bg-white rounded-xl border border-charcoal-100 p-6">
                <h2 className="text-lg font-semibold text-charcoal mb-4">Sender Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-charcoal-400 mb-1">Phone Number</p>
                    <p className="text-charcoal font-medium">{report.sender_phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-charcoal-400 mb-1">Received At</p>
                    <p className="text-charcoal font-medium">{new Date(report.received_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-charcoal-400 mb-1">Source</p>
                    <p className="text-charcoal font-medium capitalize">{report.source}</p>
                  </div>
                  <div>
                    <p className="text-sm text-charcoal-400 mb-1">Report ID</p>
                    <p className="text-charcoal font-medium">{report.id}</p>
                  </div>
                </div>
              </div>

              {/* Reporter Info */}
              <div className="bg-white rounded-xl border border-charcoal-100 p-6">
                <h2 className="text-lg font-semibold text-charcoal mb-4">Reporter Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-charcoal-400 mb-1">Name</p>
                    <p className="text-charcoal font-medium">{report.reporter_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-charcoal-400 mb-1">Email</p>
                    <p className="text-charcoal font-medium">{report.reporter_email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-charcoal-400 mb-1">Phone</p>
                    <p className="text-charcoal font-medium">{report.reporter_phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Evidence Chain */}
              <div className="bg-white rounded-xl border border-charcoal-100 p-6">
                <h2 className="text-lg font-semibold text-charcoal mb-4">Evidence Chain</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-charcoal">Report Received</p>
                      <p className="text-sm text-charcoal-400">{new Date(report.created_at).toLocaleString()} via {report.source}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      report.spam_score >= 50 ? 'bg-teal-50 text-teal-500' : 'bg-charcoal-50 text-charcoal-400'
                    }`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-charcoal">Spam Analysis</p>
                      <p className="text-sm text-charcoal-400">Spam Score: {report.spam_score}/100 {report.is_tcpa_violation && '— TCPA violation detected'}</p>
                    </div>
                  </div>

                  {report.status !== 'pending' && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-charcoal">Status Updated</p>
                        <p className="text-sm text-charcoal-400 capitalize">Changed to {report.status.replace('_', ' ')}</p>
                      </div>
                    </div>
                  )}

                  {assignedAttorney && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-charcoal">Attorney Assigned</p>
                        <p className="text-sm text-charcoal-400">{assignedAttorney.name} ({assignedAttorney.firm_name})</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Pattern Group */}
              {patternReports.length > 1 && (
                <div className="bg-white rounded-xl border border-charcoal-100 p-6">
                  <h2 className="text-lg font-semibold text-charcoal mb-4">Pattern Group</h2>
                  <p className="text-sm text-charcoal-400 mb-4">
                    This report is part of a pattern group with {patternReports.length - 1} other similar reports:
                  </p>
                  
                  <div className="space-y-2">
                    {patternReports.filter(r => r.id !== report.id).map((r) => (
                      <Link
                        key={r.id}
                        href={`/admin/reports/${r.id}`}
                        className="block p-3 bg-charcoal-50 rounded-lg hover:bg-charcoal-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-charcoal">{r.id}</span>
                          <span className="text-xs text-charcoal-400">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-charcoal-400 truncate mt-1">{r.sender_phone}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Actions */}
            <div className="space-y-6">
              {/* Spam Score */}
              <div className="bg-white rounded-xl border border-charcoal-100 p-6">
                <h2 className="text-sm font-semibold text-charcoal-400 uppercase tracking-wider mb-4">Spam Score</h2>
                <div className="flex items-center justify-center">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${
                    report.spam_score >= 80 ? 'border-coral-500 bg-coral-50' :
                    report.spam_score >= 50 ? 'border-yellow-500 bg-yellow-50' :
                    'border-charcoal-200 bg-charcoal-50'
                  }`}>
                    <span className={`text-3xl font-bold ${
                      report.spam_score >= 80 ? 'text-coral-500' :
                      report.spam_score >= 50 ? 'text-yellow-600' :
                      'text-charcoal-400'
                    }`}>
                      {report.spam_score}
                    </span>
                  </div>
                </div>
                
                {report.is_tcpa_violation && (
                  <div className="mt-4 p-3 bg-coral-50 rounded-lg border border-coral-200">
                    <p className="text-sm text-coral-700 font-medium text-center">
                      TCPA Violation Detected
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl border border-charcoal-100 p-6">
                <h2 className="text-sm font-semibold text-charcoal-400 uppercase tracking-wider mb-4">Actions</h2>
                <div className="space-y-3">
                  {report.status === 'pending' && (
                    <>
                      <button
                        onClick={handleValidate}
                        className="w-full py-2.5 px-4 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Validate Report
                      </button>
                      
                      <button
                        onClick={handleDismiss}
                        className="w-full py-2.5 px-4 bg-charcoal-100 text-charcoal-600 rounded-lg hover:bg-charcoal-200 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Dismiss Report
                      </button>
                    </>
                  )}
                  
                  {report.status === 'validated' && (
                    <button
                      onClick={handleMatch}
                      className="w-full py-2.5 px-4 bg-coral-500 text-white rounded-lg hover:bg-coral-600 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                      Match to Attorney
                    </button>
                  )}
                  
                  {report.status === 'matched' && assignedAttorney && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-700 font-medium">Assigned to:</p>
                      <p className="text-blue-600">{assignedAttorney.name}</p>
                      <p className="text-xs text-blue-500">{assignedAttorney.firm_name}</p>
                    </div>
                  )}
                  
                  {report.status === 'settled' && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-700 font-medium text-center">
                        ✓ Case Settled
                      </p>
                    </div>
                  )}
                  
                  {report.status === 'dismissed' && (
                    <div className="p-3 bg-charcoal-50 rounded-lg border border-charcoal-200">
                      <p className="text-sm text-charcoal-400 font-medium text-center">
                        Report Dismissed
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
