'use client';

import Link from 'next/link';
import { Report } from '@/lib/mockData';

interface ReportsTableProps {
  reports: Report[];
  showActions?: boolean;
  onValidate?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onMatch?: (id: string) => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  validated: 'bg-teal-50 text-teal-700 border-teal-200',
  dismissed: 'bg-charcoal-50 text-charcoal-400 border-charcoal-200',
  matched: 'bg-blue-50 text-blue-700 border-blue-200',
  settled: 'bg-green-50 text-green-700 border-green-200',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  validated: 'Validated',
  dismissed: 'Dismissed',
  matched: 'Matched',
  settled: 'Settled',
};

export default function ReportsTable({ 
  reports, 
  showActions = false,
  onValidate,
  onDismiss,
  onMatch,
}: ReportsTableProps) {
  if (reports.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-charcoal-100">
        <p className="text-charcoal-400">No reports found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-charcoal-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-charcoal-50 border-b border-charcoal-100">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-400 uppercase tracking-wider">ID</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-400 uppercase tracking-wider">Sender</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-400 uppercase tracking-wider">Message</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-400 uppercase tracking-wider">Score</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-400 uppercase tracking-wider">Status</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-400 uppercase tracking-wider">Date</th>
              {showActions && (
                <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-400 uppercase tracking-wider">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal-100">
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-charcoal-50 transition-colors">
                <td className="py-3 px-4">
                  <Link 
                    href={`/admin/reports/${report.id}`}
                    className="text-teal-600 hover:text-teal-700 font-medium text-sm"
                  >
                    {report.id}
                  </Link>
                </td>
                <td className="py-3 px-4 text-sm text-charcoal-600">
                  {report.sender_phone}
                </td>
                <td className="py-3 px-4 text-sm text-charcoal-600 max-w-xs truncate">
                  {report.message_body}
                </td>
                <td className="py-3 px-4">
                  <span className={`text-sm font-medium ${
                    report.spam_score >= 80 ? 'text-coral-500' : 
                    report.spam_score >= 50 ? 'text-yellow-600' : 'text-charcoal-400'
                  }`}>
                    {report.spam_score}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[report.status]}`}>
                    {statusLabels[report.status]}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-charcoal-400">
                  {new Date(report.created_at).toLocaleDateString()}
                </td>
                {showActions && (
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => onValidate?.(report.id)}
                            className="px-3 py-1 text-xs font-medium bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors"
                          >
                            Validate
                          </button>
                          <button
                            onClick={() => onDismiss?.(report.id)}
                            className="px-3 py-1 text-xs font-medium bg-charcoal-100 text-charcoal-600 rounded hover:bg-charcoal-200 transition-colors"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                      {report.status === 'validated' && (
                        <button
                          onClick={() => onMatch?.(report.id)}
                          className="px-3 py-1 text-xs font-medium bg-coral-500 text-white rounded hover:bg-coral-600 transition-colors"
                        >
                          Match to Attorney
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
