'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Report {
  id: string
  sender_phone: string
  message_body: string
  received_at: string
  reporter_phone: string
  reporter_email: string
  status: 'pending' | 'validated' | 'matched' | 'settled'
  spam_score: number
  is_tcpa_violation: boolean
  case?: {
    id: string
    attorney_name: string
    attorney_firm: string
    status: string
    settlement_amount: number | null
    created_at: string
  }
}

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Under Review', color: 'text-amber-600', bg: 'bg-amber-50' },
  validated: { label: 'Validated', color: 'text-teal-600', bg: 'bg-teal-50' },
  matched: { label: 'Attorney Assigned', color: 'text-blue-600', bg: 'bg-blue-50' },
  settled: { label: 'Settlement Reached', color: 'text-green-600', bg: 'bg-green-50' },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
}

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [reports, setReports] = useState<Report[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [error, setError] = useState<string | null>(null)

  const potentialValue = reports.reduce((sum, r) => {
    if (r.status === 'settled') return sum + (r.case?.settlement_amount || 0)
    if (r.status === 'matched' || r.status === 'validated') return sum + 1500
    return sum + 500
  }, 0)

  const totalSettled = reports
    .filter(r => r.status === 'settled')
    .reduce((sum, r) => sum + (r.case?.settlement_amount || 0), 0)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setError(null)
    setHasSearched(true)
    setSelectedReport(null)

    try {
      const res = await fetch(`/api/reports?reporter_phone=${encodeURIComponent(searchQuery.trim())}`)
      if (!res.ok) throw new Error('Failed to fetch reports')
      const data = await res.json()
      setReports(data.reports || [])
    } catch (err) {
      setError('Unable to load your reports. Please try again.')
      setReports([])
    } finally {
      setIsSearching(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setReports([])
    setHasSearched(false)
    setSelectedReport(null)
    setError(null)
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-charcoal-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <span className="font-bold text-xl text-charcoal">SpamSuit</span>
          </div>
          <a href="/" className="text-teal-600 font-medium hover:text-teal-700">
            ← Back to Home
          </a>
        </div>
      </nav>

      {/* Hero / Search */}
      <section className="pt-32 pb-12 px-6 md:px-12 lg:px-24 bg-charcoal-50">
        <motion.div
          className="max-w-2xl mx-auto text-center"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-charcoal mb-4">
            Check Your Case Status
          </motion.h1>
          <motion.p variants={fadeUp} className="text-charcoal-400 text-lg mb-8">
            Enter your phone number or case number to view your reports
          </motion.p>

          <motion.form
            variants={fadeUp}
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
          >
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Your phone number (e.g., 555-123-4567)"
                className="w-full px-4 py-3.5 rounded-xl border border-charcoal-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
              />
              {hasSearched && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-300 hover:text-charcoal"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="btn-primary !py-3 !px-6 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Searching...
                </span>
              ) : (
                'Search'
              )}
            </button>
          </motion.form>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-coral-500 mt-4"
            >
              {error}
            </motion.p>
          )}
        </motion.div>
      </section>

      {/* Results */}
      <section className="py-12 px-6 md:px-12 lg:px-24">
        <div className="max-w-4xl mx-auto">
          {!hasSearched ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <p className="text-charcoal-400 text-lg">
                Enter your phone number above to check your report status
              </p>
            </motion.div>
          ) : isSearching ? (
            <div className="flex justify-center py-16">
              <div className="animate-pulse space-y-4 w-full max-w-lg">
                <div className="h-4 bg-charcoal-100 rounded w-3/4 mx-auto" />
                <div className="h-32 bg-charcoal-50 rounded-xl" />
                <div className="h-32 bg-charcoal-50 rounded-xl" />
              </div>
            </div>
          ) : reports.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-charcoal-50 rounded-2xl"
            >
              <div className="w-16 h-16 bg-coral-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-coral-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25m-2.25-2.25l-2.25 2.25m-2.25-2.25l-2.25-2.25M10.5 6.75a3 3 0 013-3h3a3 3 0 013 3m-9 3a3 3 0 013 3m3 3a3 3 0 01-3 3m3-3a3 3 0 01-3 3m-9 3a3 3 0 01-3-3m3 3a3 3 0 013 3m-3-3a3 3 0 013-3m3 3a3 3 0 01-3 3" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-charcoal mb-2">No Reports Found</h3>
              <p className="text-charcoal-400 max-w-md mx-auto mb-6">
                We couldn't find any reports associated with <strong>{searchQuery}</strong>.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="/" className="btn-primary !py-3 !px-6">
                  Report New Spam
                </a>
                <button onClick={clearSearch} className="btn-secondary !py-3 !px-6">
                  Try Different Number
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="visible"
            >
              {/* Summary Cards */}
              <motion.div variants={fadeUp} className="grid sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-teal-50 rounded-xl p-6">
                  <p className="text-teal-600 text-sm font-medium mb-1">Total Reports</p>
                  <p className="text-3xl font-bold text-charcoal">{reports.length}</p>
                </div>
                <div className="bg-coral-50 rounded-xl p-6">
                  <p className="text-coral-600 text-sm font-medium mb-1">Potential Value</p>
                  <p className="text-3xl font-bold text-charcoal">${potentialValue.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-6">
                  <p className="text-green-600 text-sm font-medium mb-1">Settled Amount</p>
                  <p className="text-3xl font-bold text-charcoal">${totalSettled.toLocaleString()}</p>
                </div>
              </motion.div>

              {/* Report List */}
              <motion.div variants={fadeUp}>
                <h2 className="text-xl font-bold text-charcoal mb-4">Your Reports</h2>
                <div className="space-y-4">
                  {reports.map((report) => (
                    <motion.div
                      key={report.id}
                      layoutId={report.id}
                      onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                      className={`bg-white border rounded-xl p-5 cursor-pointer transition-all hover:shadow-md ${
                        selectedReport?.id === report.id ? 'border-teal-500 ring-2 ring-teal-500/10' : 'border-charcoal-100'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-medium text-charcoal">Case #{report.id.slice(0, 8).toUpperCase()}</span>
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusLabels[report.status].bg} ${statusLabels[report.status].color}`}>
                              {statusLabels[report.status].label}
                            </span>
                          </div>
                          <p className="text-charcoal-400 text-sm truncate">
                            From: {report.sender_phone}
                          </p>
                          <p className="text-charcoal-300 text-xs mt-1">
                            {new Date(report.received_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-charcoal-400">
                            {report.status === 'settled' && report.case?.settlement_amount
                              ? `$${report.case.settlement_amount.toLocaleString()}`
                              : report.status === 'settled'
                              ? 'Completed'
                              : report.status === 'matched'
                              ? 'In Progress'
                              : report.status === 'validated'
                              ? '$1,500 potential'
                              : 'Under review'}
                          </span>
                          <svg
                            className={`w-5 h-5 text-charcoal-300 transition-transform ${
                              selectedReport?.id === report.id ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </div>
                      </div>

                      {/* Expanded Detail */}
                      <AnimatePresence>
                        {selectedReport?.id === report.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-5 mt-5 border-t border-charcoal-100">
                              {/* Message Preview */}
                              <div className="bg-charcoal-50 rounded-lg p-4 mb-5">
                                <p className="text-xs text-charcoal-400 mb-1">Message Content:</p>
                                <p className="text-charcoal-600 text-sm">{report.message_body || 'No message content recorded'}</p>
                              </div>

                              {/* Case Details */}
                              {report.case ? (
                                <div className="bg-teal-50 rounded-lg p-4">
                                  <div className="flex items-center gap-2 mb-3">
                                    <svg className="w-5 h-5 text-teal-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                    </svg>
                                    <span className="font-semibold text-charcoal">Attorney Information</span>
                                  </div>
                                  <div className="space-y-2 text-sm">
                                    <p><span className="text-charcoal-400">Attorney:</span> <span className="text-charcoal">{report.case.attorney_name}</span></p>
                                    <p><span className="text-charcoal-400">Firm:</span> <span className="text-charcoal">{report.case.attorney_firm}</span></p>
                                    <p><span className="text-charcoal-400">Case Status:</span> <span className="text-charcoal capitalize">{report.case.status}</span></p>
                                    {report.case.settlement_amount && (
                                      <p>
                                        <span className="text-charcoal-400">Settlement:</span>
                                        <span className="text-green-600 font-semibold"> ${report.case.settlement_amount.toLocaleString()}</span>
                                      </p>
                                    )}
                                    <p><span className="text-charcoal-400">Assigned:</span> <span className="text-charcoal">{new Date(report.case.created_at).toLocaleDateString()}</span></p>
                                  </div>
                                </div>
                              ) : report.status === 'validated' ? (
                                <div className="bg-amber-50 rounded-lg p-4">
                                  <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                    </svg>
                                    <div>
                                      <p className="font-medium text-charcoal mb-1">Looking for an Attorney</p>
                                      <p className="text-sm text-charcoal-400">
                                        Your report has been validated as a TCPA violation. We're matching you with a qualified attorney who handles these cases. You'll be notified when an attorney is assigned.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-charcoal-50 rounded-lg p-4">
                                  <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-teal-500 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                      <p className="font-medium text-charcoal mb-1">Validation in Progress</p>
                                      <p className="text-sm text-charcoal-400">
                                        Our team is reviewing your report to determine if it's a valid TCPA violation. This typically takes 1-2 business days.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* CTA */}
              <motion.div variants={fadeUp} className="mt-8 text-center">
                <p className="text-charcoal-400 mb-4">Have more spam to report?</p>
                <a href="/" className="btn-primary inline-block !py-3 !px-8">
                  Report More Spam
                </a>
              </motion.div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-charcoal text-white py-8 px-6 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-teal-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <span className="font-bold text-lg">SpamSuit</span>
          </div>
          <p className="text-charcoal-300 text-sm">
            © 2026 SpamSuit. Not legal advice.
          </p>
        </div>
      </footer>
    </main>
  )
}
