'use client'

import React from 'react'
import Link from 'next/link'

export default function AcmeCorpLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary" />
              <span className="font-heading text-xl font-semibold">AcmeCorp</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
              <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
              <Link href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
            </div>
            <div className="flex items-center gap-4">
              <button className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Log in
              </button>
              <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight">
              Welcome to AcmeCorp
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              AcmeCorp helps teams build faster and smarter.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <button className="rounded-lg bg-primary px-8 py-4 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-all hover:shadow-glow">
                Get Started Free
              </button>
              <button className="rounded-lg border border-border bg-card px-8 py-4 text-base font-medium hover:bg-card/80 transition-colors">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--color-primary)/20%,transparent)]" />
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold">Everything you need</h2>
            <p className="mt-4 text-muted-foreground">Powerful features designed for modern teams.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Lightning Fast', desc: 'Built for performance with edge caching and global CDN.' },
              { title: 'Collaborative', desc: 'Real-time collaboration for teams of any size.' },
              { title: 'Secure', desc: 'Enterprise-grade security with SOC 2 compliance.' },
              { title: 'Customizable', desc: 'Tailor every aspect to match your brand.' },
              { title: 'Analytics', desc: 'Deep insights into usage and performance.' },
              { title: 'Integrations', desc: 'Connect with 100+ tools you already use.' },
            ].map((feature, i) => (
              <div key={i} className="group rounded-2xl border border-border bg-card p-6 hover:border-primary/50 transition-all hover:shadow-lg">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <div className="h-5 w-5 rounded bg-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-primary/10 border border-primary/20 p-12 lg:p-20 text-center">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold">Ready to get started?</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Join thousands of teams already using AcmeCorp.</p>
            <button className="mt-8 rounded-lg bg-primary px-8 py-4 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-all hover:shadow-glow">
              Start Building Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-primary" />
              <span className="font-heading font-semibold">AcmeCorp</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2025 AcmeCorp. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
