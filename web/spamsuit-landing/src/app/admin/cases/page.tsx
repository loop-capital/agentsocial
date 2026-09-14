'use client'

const mockCases = [
  { id: 'CS-001', attorney: 'Sarah Mitchell', violations: 24, victims: 18, estimated: 36000, settlement: null, status: 'in_progress', filed: '2026-03-15' },
  { id: 'CS-002', attorney: 'David Chen', violations: 156, victims: 89, estimated: 234000, settlement: 187000, status: 'settled', filed: '2025-11-20' },
  { id: 'CS-003', attorney: 'James Wright', violations: 42, victims: 31, estimated: 63000, settlement: null, status: 'open', filed: '2026-04-10' },
  { id: 'CS-004', attorney: 'Maria Rodriguez', violations: 312, victims: 204, estimated: 468000, settlement: null, status: 'in_progress', filed: '2026-01-08' },
  { id: 'CS-005', attorney: 'Sarah Mitchell', violations: 8, victims: 6, estimated: 12000, settlement: null, status: 'open', filed: '2026-04-12' },
]

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  settlement: 'bg-teal-100 text-teal-700',
  settled: 'bg-green-100 text-green-700',
  dismissed: 'bg-red-100 text-red-700',
}

const statusFilters = ['all', 'open', 'in_progress', 'settlement', 'settled', 'dismissed']

export default function CasesPage() {
  const stats = {
    total: mockCases.length,
    open: mockCases.filter(c => c.status === 'open').length,
    inProgress: mockCases.filter(c => c.status === 'in_progress').length,
    settled: mockCases.filter(c => c.status === 'settled').length,
    totalEstimated: mockCases.reduce((sum, c) => sum + c.estimated, 0),
    totalSettled: mockCases.filter(c => c.settlement).reduce((sum, c) => sum + (c.settlement || 0), 0),
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Cases</h1>
          <p className="text-charcoal-400 mt-1">Track active litigation and settlements</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-charcoal-100 rounded-xl p-5">
          <p className="text-sm text-charcoal-400">Active Cases</p>
          <p className="text-2xl font-bold text-charcoal">{stats.open + stats.inProgress}</p>
        </div>
        <div className="bg-white border border-charcoal-100 rounded-xl p-5">
          <p className="text-sm text-charcoal-400">Settled</p>
          <p className="text-2xl font-bold text-teal-500">{stats.settled}</p>
        </div>
        <div className="bg-white border border-charcoal-100 rounded-xl p-5">
          <p className="text-sm text-charcoal-400">Estimated Value</p>
          <p className="text-2xl font-bold text-charcoal">${stats.totalEstimated.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-charcoal-100 rounded-xl p-5">
          <p className="text-sm text-charcoal-400">Total Settled</p>
          <p className="text-2xl font-bold text-teal-500">${stats.totalSettled.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {statusFilters.map(f => (
          <button
            key={f}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize ${f === 'all' ? 'bg-charcoal text-white' : 'bg-charcoal-100 text-charcoal-400 hover:bg-charcoal-200'}`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Cases Table */}
      <div className="bg-white border border-charcoal-100 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-charcoal-50 border-b border-charcoal-100">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-semibold text-charcoal-400">Case ID</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-charcoal-400">Attorney</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-charcoal-400">Violations</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-charcoal-400">Victims</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-charcoal-400">Estimated</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-charcoal-400">Settlement</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-charcoal-400">Filed</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-charcoal-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {mockCases.map(c => (
              <tr key={c.id} className="border-b border-charcoal-50 hover:bg-charcoal-50/50 cursor-pointer">
                <td className="px-6 py-4 font-mono font-semibold text-teal-600">{c.id}</td>
                <td className="px-6 py-4 text-charcoal-600">{c.attorney}</td>
                <td className="px-6 py-4 text-charcoal-600">{c.violations}</td>
                <td className="px-6 py-4 text-charcoal-600">{c.victims}</td>
                <td className="px-6 py-4 font-semibold text-charcoal">${c.estimated.toLocaleString()}</td>
                <td className="px-6 py-4 font-semibold text-teal-600">
                  {c.settlement ? `$${c.settlement.toLocaleString()}` : '—'}
                </td>
                <td className="px-6 py-4 text-charcoal-400 text-sm">{c.filed}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[c.status]}`}>
                    {c.status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}