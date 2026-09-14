'use client'

import React from 'react'

export default function RocketLaunchContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="grid gap-16 lg:grid-cols-2 max-w-6xl mx-auto">
          <div>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold">Get in touch</h1>
            <p className="mt-4 text-lg text-muted-foreground">We would love to hear from you. Fill out the form and we will get back to you.</p>
            
            <div className="mt-12 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <div className="h-5 w-5 rounded bg-primary" />
                </div>
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">hello@rocketlaunch.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <div className="h-5 w-5 rounded bg-primary" />
                </div>
                <div>
                  <p className="font-medium">Office</p>
                  <p className="text-sm text-muted-foreground">San Francisco, CA</p>
                </div>
              </div>
            </div>
          </div>

          <form className="rounded-2xl border border-border bg-card p-8 space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">First name</label>
                <input type="text" className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="John" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last name</label>
                <input type="text" className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input type="email" className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <textarea rows={4} className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" placeholder="How can we help?" />
            </div>
            <button type="submit" className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
