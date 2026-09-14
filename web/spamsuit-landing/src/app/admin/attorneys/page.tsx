'use client'

import { useState } from 'react'

const mockAttorneys = [
  { id: '1', name: 'Sarah Mitchell', firm: 'Mitchell & Associates', state: 'OH', specialty: ['tcpa', 'consumer'], cases_accepted: 47, cases_won: 38, total_recovered: 2450000, status: 'active', fee_pct: 33.3, our_pct: 25 },
  { id: '2', name: 'David Chen', firm: 'Pacific Consumer Law', state: 'CA', specialty: ['tcpa', 'fcc'], cases_accepted: 112, cases_won: 95, total_recovered: 8900000, status: 'active', fee_pct: 33.3, our_pct: 25 },
  { id: '3', name: 'Maria Rodriguez', firm: 'Rodriguez Legal Group', state: 'FL', specialty: ['tcpa', 'class_action'], cases_accepted: 23, cases_won: 18, total_recovered: 1200000, status: 'approved', fee_pct: 33.3, our_pct: 25 },
  { id: '4', name: 'James Wright', firm: 'Wright TCPA Partners', state: 'TX', specialty: ['tcpa'], cases_accepted: 89, cases_won: 72, total_recovered: 5600000, status: 'active', fee_pct: 40, our_pct: 20 },
  { id: '5', name: 'Lisa Park', firm: 'Park & Kim LLC', state: 'NY', specialty: ['tcpa', 'data_privacy'], cases_accepted: 0, cases_won: 0, total_recovered: 0, status: 'pending', fee_pct: 33.3, our_pct: 25 },
]

const statusColors: Record<string, string> = {
  active: 'bg-teal-100 text-teal-700',
  approved: 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
  suspended: 'bg-red-100 text-red-700',
}

export default function AttorneysPage() {
  const [showAdd, setShowAdd] = useState(false)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Attorneys</h1>
          <p className="text-charcoal-400 mt-1">{mockAttorneys.length} attorneys in network</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-teal-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-teal-600 transition"
        >
          + Add Attorney
        </button>
      </div>

      {showAdd && (
        <div className="bg-white border border-charcoal-100 rounded-xl p-6 mb-8">
          <h3 className="font-semibold mb-4">Add New Attorney</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <input placeholder="Full Name" className="border border-charcoal-200 rounded-lg px-4 py-2.5" />
            <input placeholder="Firm Name" className="border border-charcoal-200 rounded-lg px-4 py-2.5" />
            <input placeholder="Email" className="border border-charcoal-200 rounded-lg px-4 py-2.5" />
            <input placeholder="Phone" className="border border-charcoal-200 rounded-lg px-4 py-2.5" />
            <input placeholder="Bar Number" className="border border-charcoal-200 rounded-lg px-4 py-2.5" />
            <input placeholder="State" className="border border-charcoal-200 rounded-lg px-4 py-2.5" />
          </div>
          <div className="flex gap-3 mt-4">
            <button className="bg-teal-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-teal-600">Save</button>
            <button onClick={() => setShowAdd(false)} className="border border-charcoal-200 px-5 py-2 rounded-lg font-semibold hover:bg-charcoal-50">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-charcoal-100 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-charcoal-50 border-b border-charcoal-100">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-semibold text-charcoal-400">Attorney</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-charcoal-400">State</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-charcoal-400">Cases</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-charcoal-400">Won</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-charcoal-400">Recovered</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-charcoal-400">Our %</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-charcoal-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {mockAttorneys.map((att) => (
              <tr key={att.id} className="border-b border-charcoal-50 hover:bg-charcoal-50/50">
                <td className="px-6 py-4">
                  <div className="font-semibold text-charcoal">{att.name}</div>
                  <div className="text-sm text-charcoal-400">{att.firm}</div>
                </td>
                <td className="px-6 py-4 text-charcoal-600">{att.state}</td>
                <td className="px-6 py-4 text-charcoal-600">{att.cases_accepted}</td>
                <td className="px-6 py-4 text-charcoal-600">{att.cases_won}</td>
                <td className="px-6 py-4 text-teal-600 font-semibold">
                  ${att.total_recovered.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-charcoal-600">{att.our_pct}%</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[att.status]}`}>
                    {att.status}
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