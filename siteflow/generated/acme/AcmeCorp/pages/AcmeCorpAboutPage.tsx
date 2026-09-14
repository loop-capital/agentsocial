'use client'

import React from 'react'

export default function AcmeCorpAboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="max-w-3xl">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold">
            About AcmeCorp
          </h1>
          <p className="mt-6 text-xl text-muted-foreground">
            AcmeCorp helps teams build faster and smarter.
          </p>
        </div>
        
        <div className="mt-20 grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-heading text-2xl font-bold">Our Story</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Founded with a vision to transform how teams collaborate, AcmeCorp has grown from a small 
              side project to a platform trusted by thousands of companies worldwide. We are passionate 
              about design, engineering, and the intersection of both.
            </p>
          </div>
          <div>
            <h2 className="font-heading text-2xl font-bold">Our Mission</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              To create tools that are both powerful and delightful to use. We believe great software 
              should feel invisible—getting out of your way so you can focus on what matters most.
            </p>
          </div>
        </div>

        <div className="mt-20">
          <h2 className="font-heading text-2xl font-bold text-center mb-12">Values</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {['Craft', 'Simplicity', 'Trust', 'Growth'].map((value) => (
              <div key={value} className="rounded-xl border border-border bg-card p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 mx-auto mb-4" />
                <h3 className="font-heading font-semibold">{value}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
