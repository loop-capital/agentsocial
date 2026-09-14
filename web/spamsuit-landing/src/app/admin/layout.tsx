'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/reports', label: 'Reports', icon: '📨' },
  { href: '/admin/cases', label: 'Cases', icon: '⚖️' },
  { href: '/admin/attorneys', label: 'Attorneys', icon: '👨‍⚖️' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-charcoal-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-charcoal-100 p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-lg text-charcoal">SpamSuit</span>
            <p className="text-xs text-charcoal-400">Admin</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map(item => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-charcoal-400 hover:bg-charcoal-50 hover:text-charcoal-600'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-8 pt-8 border-t border-charcoal-100">
          <Link href="/" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-charcoal-400 hover:bg-charcoal-50 hover:text-charcoal-600 transition">
            ← Back to Site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}