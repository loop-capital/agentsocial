'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function HomePage() {
  const [counter, setCounter] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCounter(prev => (prev + 1) % 100)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-8 md:px-12 lg:px-16">
        <div className="flex items-center space-x-8">
          <Link 
            href="/" 
            className="text-sm font-medium tracking-wide transition-opacity duration-200 hover:opacity-60"
          >
            Home
          </Link>
          <Link 
            href="/writing" 
            className="text-sm font-medium tracking-wide transition-opacity duration-200 hover:opacity-60"
          >
            Writing
          </Link>
          <Link 
            href="/speaking" 
            className="text-sm font-medium tracking-wide transition-opacity duration-200 hover:opacity-60"
          >
            Speaking
          </Link>
          <Link 
            href="/shooting" 
            className="text-sm font-medium tracking-wide transition-opacity duration-200 hover:opacity-60"
          >
            Shooting
          </Link>
        </div>
        
        {/* Counter/Brand Element */}
        <div className="text-sm font-mono tracking-wider text-gray-600">
          R{counter}/0
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-6 pb-16 md:px-12 lg:px-16">
        {/* Hero Section */}
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-16 text-5xl font-normal leading-tight tracking-tight md:text-6xl lg:text-7xl">
            <span className="font-serif">Pedro Duarte's</span>
            <br />
            <span className="font-serif">Personal Website</span>
          </h1>

          {/* Content */}
          <div className="max-w-2xl space-y-6 text-lg leading-relaxed text-gray-800">
            <p>
              Yo! I'm Pedro Duarte. I'm not sure how to intro myself anymore. My background 
              is in UI development, but I love everything related to product. In the last five 
              years I discovered my niche: helping early-stage tech startups flourish.
            </p>

            <p>
              I work at{' '}
              <Link 
                href="https://raycast.com" 
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-1 underline-offset-2 transition-all duration-200 hover:decoration-2"
              >
                Raycast
              </Link>
              . It's an app that you didn't think you needed, but once you try it, you can't 
              live without it. I wear many different hats. But my main focus is hyping the 
              product through content creation, brand awareness, community building and partnerships.
            </p>

            <p>
              Before that, I did basically the same thing for{' '}
              <Link 
                href="https://rainbow.me" 
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-1 underline-offset-2 transition-all duration-200 hover:decoration-2"
              >
                Rainbow
              </Link>
              , specifically for RainbowKit, a fun way to connect a web3 wallet, and{' '}
              <Link 
                href="https://modulz.app" 
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-1 underline-offset-2 transition-all duration-200 hover:decoration-2"
              >
                Modulz
              </Link>
              . Modulz is where it all started.
            </p>

            <p>
              There I co-created{' '}
              <Link 
                href="https://radix-ui.com" 
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-1 underline-offset-2 transition-all duration-200 hover:decoration-2"
              >
                Radix
              </Link>
              , a set of building blocks for your design system, with over 20M monthly downloads, 
              and{' '}
              <Link 
                href="https://stitches.dev" 
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-1 underline-offset-2 transition-all duration-200 hover:decoration-2"
              >
                Stitches
              </Link>
              , a CSS-in-JS library with an API that has inspired many others.
            </p>

            <p>
              I live in Barcelona with my family, but I was born in São Paulo. I moved to 
              Norwich when I was thirteen and then spent most of my life in London.
            </p>
          </div>

          {/* Social Links */}
          <div className="mt-16 flex flex-wrap gap-8">
            <Link
              href="https://x.com/peduarte"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center space-x-2 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <span className="text-sm font-medium tracking-wide">X</span>
              <span className="text-sm text-gray-600 transition-colors duration-200 group-hover:text-gray-900">
                @peduarte
              </span>
            </Link>
            
            <Link
              href="https://instagram.com/peduarte"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium tracking-wide transition-transform duration-200 hover:-translate-y-0.5"
            >
              Instagram
            </Link>
            
            <Link
              href="https://github.com/peduarte"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium tracking-wide transition-transform duration-200 hover:-translate-y-0.5"
            >
              GitHub
            </Link>
            
            <Link
              href="https://linkedin.com/in/peduarte"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium tracking-wide transition-transform duration-200 hover:-translate-y-0.5"
            >
              LinkedIn
            </Link>
            
            <Link
              href="https://bsky.app/profile/peduarte.bsky.social"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium tracking-wide transition-transform duration-200 hover:-translate-y-0.5"
            >
              Bluesky
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
