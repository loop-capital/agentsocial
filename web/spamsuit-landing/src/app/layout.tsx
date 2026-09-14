import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SpamSuit — Report Spam Texts, Get Paid',
  description: 'Each unwanted text could be worth $500-$1,500. Report your spam. We handle the rest.',
  openGraph: {
    title: 'SpamSuit — Report Spam Texts, Get Paid',
    description: 'Each unwanted text could be worth $500-$1,500. Report your spam. We handle the rest.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-white text-charcoal antialiased`}>
        {children}
      </body>
    </html>
  )
}