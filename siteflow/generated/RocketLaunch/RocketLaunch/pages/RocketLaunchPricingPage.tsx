'use client'

import React from 'react'

export default function RocketLaunchPricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="font-heading text-4xl sm:text-5xl font-bold">Simple, transparent pricing</h1>
          <p className="mt-4 text-lg text-muted-foreground">Choose the plan that fits your needs.</p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto">
          
          <div className="border border-border rounded-2xl bg-card p-8 flex flex-col">
            <h3 className="font-heading text-lg font-semibold">Starter</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-heading text-4xl font-bold">Free</span>
              
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Perfect for individuals and small projects.</p>
            <ul className="mt-6 space-y-3 flex-1">
              <li className="flex items-center gap-3 text-sm"><div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="h-2 w-2 rounded-full bg-primary" /></div>Up to 3 projects</li>
              <li className="flex items-center gap-3 text-sm"><div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="h-2 w-2 rounded-full bg-primary" /></div>Basic analytics</li>
              <li className="flex items-center gap-3 text-sm"><div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="h-2 w-2 rounded-full bg-primary" /></div>Community support</li>
              <li className="flex items-center gap-3 text-sm"><div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="h-2 w-2 rounded-full bg-primary" /></div>1GB storage</li>
            </ul>
            <button className="mt-8 w-full rounded-lg border border-border hover:bg-card/80 px-4 py-3 text-sm font-medium transition-colors">
              Get Started
            </button>
          </div>
          
          <div className="ring-2 ring-primary rounded-2xl bg-card p-8 flex flex-col">
            <h3 className="font-heading text-lg font-semibold">Pro</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-heading text-4xl font-bold">$19</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">For growing teams who need more power.</p>
            <ul className="mt-6 space-y-3 flex-1">
              <li className="flex items-center gap-3 text-sm"><div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="h-2 w-2 rounded-full bg-primary" /></div>Unlimited projects</li>
              <li className="flex items-center gap-3 text-sm"><div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="h-2 w-2 rounded-full bg-primary" /></div>Advanced analytics</li>
              <li className="flex items-center gap-3 text-sm"><div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="h-2 w-2 rounded-full bg-primary" /></div>Priority support</li>
              <li className="flex items-center gap-3 text-sm"><div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="h-2 w-2 rounded-full bg-primary" /></div>100GB storage</li>
              <li className="flex items-center gap-3 text-sm"><div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="h-2 w-2 rounded-full bg-primary" /></div>Custom domains</li>
              <li className="flex items-center gap-3 text-sm"><div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="h-2 w-2 rounded-full bg-primary" /></div>Team collaboration</li>
            </ul>
            <button className="mt-8 w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-3 text-sm font-medium transition-colors">
              Start Free Trial
            </button>
          </div>
          
          <div className="border border-border rounded-2xl bg-card p-8 flex flex-col">
            <h3 className="font-heading text-lg font-semibold">Enterprise</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-heading text-4xl font-bold">Custom</span>
              
            </div>
            <p className="mt-2 text-sm text-muted-foreground">For organizations with advanced needs.</p>
            <ul className="mt-6 space-y-3 flex-1">
              <li className="flex items-center gap-3 text-sm"><div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="h-2 w-2 rounded-full bg-primary" /></div>Everything in Pro</li>
              <li className="flex items-center gap-3 text-sm"><div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="h-2 w-2 rounded-full bg-primary" /></div>SSO & SAML</li>
              <li className="flex items-center gap-3 text-sm"><div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="h-2 w-2 rounded-full bg-primary" /></div>Dedicated support</li>
              <li className="flex items-center gap-3 text-sm"><div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="h-2 w-2 rounded-full bg-primary" /></div>Unlimited storage</li>
              <li className="flex items-center gap-3 text-sm"><div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="h-2 w-2 rounded-full bg-primary" /></div>SLA guarantee</li>
              <li className="flex items-center gap-3 text-sm"><div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="h-2 w-2 rounded-full bg-primary" /></div>Custom integrations</li>
            </ul>
            <button className="mt-8 w-full rounded-lg border border-border hover:bg-card/80 px-4 py-3 text-sm font-medium transition-colors">
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
