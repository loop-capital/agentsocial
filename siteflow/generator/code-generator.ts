import * as fs from 'fs';
import * as path from 'path';
import { DesignSystem, GeneratedPage, GeneratedSite, BrandConfig } from './types';

/**
 * Code Generator for SiteFlow
 * Takes a design system JSON and generates React/Next.js components
 * Uses shadcn/ui style patterns with Tailwind CSS
 */

function sanitizeComponentName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[0-9]/, '_$&');
}

function extractColorValue(colors: any[], fallback: string): string {
  if (!colors || colors.length === 0) return fallback;
  const val = typeof colors[0] === 'object' ? colors[0].value : colors[0];
  if (!val || val === 'inherit' || val === 'initial' || val === 'unset' || val === 'transparent') return fallback;
  if (val.includes('gradient')) return fallback;
  return val;
}

function extractFontFamily(families: string[] | undefined, fallback: string): string {
  if (!families || families.length === 0) return fallback;
  const font = families[0];
  if (!font || font.includes('var(')) return fallback;
  return font.replace(/"/g, '').split(',')[0].trim();
}

function generateCSSVariables(ds: DesignSystem, brand?: BrandConfig): string {
  const colors = ds.colors;
  const primary = brand?.colors?.primary || extractColorValue(colors.primary, '#5E6AD2');
  const secondary = brand?.colors?.secondary || extractColorValue(colors.secondary, '#8B8D98');
  const accent = brand?.colors?.accent || extractColorValue(colors.accent, '#F58116');
  const bg = brand?.colors?.background || extractColorValue(colors.background, '#0A0A0F');
  const fg = brand?.colors?.foreground || extractColorValue(colors.foreground, '#EDEDF0');
  const muted = extractColorValue(colors.muted, '#6B6D76');
  const border = extractColorValue(colors.border, '#2A2A32');
  const headingFont = brand?.fonts?.heading || extractFontFamily(ds.typography?.families?.heading, 'Inter');
  const bodyFont = brand?.fonts?.body || extractFontFamily(ds.typography?.families?.body, 'Inter');
  const monoFont = brand?.fonts?.mono || extractFontFamily(ds.typography?.families?.mono, 'monospace');

  return `:root {
  /* Brand Colors */
  --color-primary: ${primary};
  --color-secondary: ${secondary};
  --color-accent: ${accent};
  --color-background: ${bg};
  --color-foreground: ${fg};
  --color-muted: ${muted};
  --color-border: ${border};
  
  /* Typography */
  --font-heading: ${headingFont};
  --font-body: ${bodyFont};
  --font-mono: ${monoFont};
  
  /* Spacing Scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;
  --space-24: 6rem;
  
  /* Radii */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --shadow-glow: 0 0 20px var(--color-primary);
}

.dark {
  --color-background: ${bg};
  --color-foreground: ${fg};
}

* {
  border-color: var(--color-border);
}

body {
  background-color: var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-body), system-ui, sans-serif;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading), system-ui, sans-serif;
}
`;
}

function generateTailwindConfig(ds: DesignSystem, brand?: BrandConfig): string {
  const colors = ds.colors;
  const primary = brand?.colors?.primary || extractColorValue(colors.primary, '#5E6AD2');
  const secondary = brand?.colors?.secondary || extractColorValue(colors.secondary, '#8B8D98');
  const accent = brand?.colors?.accent || extractColorValue(colors.accent, '#F58116');
  const bg = brand?.colors?.background || extractColorValue(colors.background, '#0A0A0F');
  const fg = brand?.colors?.foreground || extractColorValue(colors.foreground, '#EDEDF0');
  const muted = extractColorValue(colors.muted, '#6B6D76');
  const border = extractColorValue(colors.border, '#2A2A32');
  const headingFont = brand?.fonts?.heading || extractFontFamily(ds.typography?.families?.heading, 'Inter');
  const bodyFont = brand?.fonts?.body || extractFontFamily(ds.typography?.families?.body, 'Inter');
  const monoFont = brand?.fonts?.mono || extractFontFamily(ds.typography?.families?.mono, 'monospace');

  return `import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '${primary}',
          secondary: '${secondary}',
          accent: '${accent}',
          background: '${bg}',
          foreground: '${fg}',
          muted: '${muted}',
          border: '${border}',
        },
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        border: 'var(--color-border)',
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--color-muted)',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          foreground: '#ffffff',
        },
        card: {
          DEFAULT: 'var(--color-background)',
          foreground: 'var(--color-foreground)',
        },
      },
      fontFamily: {
        heading: ['${headingFont}', 'system-ui', 'sans-serif'],
        body: ['${bodyFont}', 'system-ui', 'sans-serif'],
        mono: ['${monoFont}', 'monospace'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        glow: 'var(--shadow-glow)',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
    },
  },
  plugins: [],
}

export default config
`;
}

function generateLandingPage(ds: DesignSystem, brand?: BrandConfig): GeneratedPage {
  const brandName = brand?.name || ds.site_name;
  const tagline = brand?.tagline || ds.design_philosophy || 'Build something amazing';
  const compName = `${sanitizeComponentName(brandName)}LandingPage`;

  const code = `'use client'

import React from 'react'
import Link from 'next/link'

export default function ${compName}() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary" />
              <span className="font-heading text-xl font-semibold">${brandName}</span>
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
              ${tagline}
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              ${brand?.description || 'The platform that helps teams build, ship, and grow faster than ever before.'}
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
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Join thousands of teams already using ${brandName}.</p>
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
              <span className="font-heading font-semibold">${brandName}</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2025 ${brandName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
`;

  return {
    page: 'landing',
    componentName: compName,
    code,
    filePath: `pages/${compName}.tsx`,
  };
}

function generateAboutPage(ds: DesignSystem, brand?: BrandConfig): GeneratedPage {
  const brandName = brand?.name || ds.site_name;
  const compName = `${sanitizeComponentName(brandName)}AboutPage`;

  const code = `'use client'

import React from 'react'

export default function ${compName}() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="max-w-3xl">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold">
            About ${brandName}
          </h1>
          <p className="mt-6 text-xl text-muted-foreground">
            ${brand?.description || 'We believe in building tools that empower creators and teams to do their best work.'}
          </p>
        </div>
        
        <div className="mt-20 grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-heading text-2xl font-bold">Our Story</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Founded with a vision to transform how teams collaborate, ${brandName} has grown from a small 
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
`;

  return {
    page: 'about',
    componentName: compName,
    code,
    filePath: `pages/${compName}.tsx`,
  };
}

function generatePricingPage(ds: DesignSystem, brand?: BrandConfig): GeneratedPage {
  const brandName = brand?.name || ds.site_name;
  const compName = `${sanitizeComponentName(brandName)}PricingPage`;

  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      description: 'Perfect for individuals and small projects.',
      features: ['Up to 3 projects', 'Basic analytics', 'Community support', '1GB storage'],
      cta: 'Get Started',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '$19',
      period: '/month',
      description: 'For growing teams who need more power.',
      features: ['Unlimited projects', 'Advanced analytics', 'Priority support', '100GB storage', 'Custom domains', 'Team collaboration'],
      cta: 'Start Free Trial',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For organizations with advanced needs.',
      features: ['Everything in Pro', 'SSO & SAML', 'Dedicated support', 'Unlimited storage', 'SLA guarantee', 'Custom integrations'],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ];

  const code = `'use client'

import React from 'react'

export default function ${compName}() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="font-heading text-4xl sm:text-5xl font-bold">Simple, transparent pricing</h1>
          <p className="mt-4 text-lg text-muted-foreground">Choose the plan that fits your needs.</p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto">
          ${plans.map(plan => `
          <div className="${plan.highlighted ? 'ring-2 ring-primary' : 'border border-border'} rounded-2xl bg-card p-8 flex flex-col">
            <h3 className="font-heading text-lg font-semibold">${plan.name}</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-heading text-4xl font-bold">${plan.price}</span>
              ${plan.period ? `<span className="text-muted-foreground">${plan.period}</span>` : ''}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">${plan.description}</p>
            <ul className="mt-6 space-y-3 flex-1">
              ${plan.features.map(f => `<li className="flex items-center gap-3 text-sm"><div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="h-2 w-2 rounded-full bg-primary" /></div>${f}</li>`).join('\n              ')}
            </ul>
            <button className="mt-8 w-full rounded-lg ${plan.highlighted ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border border-border hover:bg-card/80'} px-4 py-3 text-sm font-medium transition-colors">
              ${plan.cta}
            </button>
          </div>`).join('\n          ')}
        </div>
      </div>
    </div>
  )
}
`;

  return {
    page: 'pricing',
    componentName: compName,
    code,
    filePath: `pages/${compName}.tsx`,
  };
}

function generateContactPage(ds: DesignSystem, brand?: BrandConfig): GeneratedPage {
  const brandName = brand?.name || ds.site_name;
  const compName = `${sanitizeComponentName(brandName)}ContactPage`;

  const code = `'use client'

import React from 'react'

export default function ${compName}() {
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
                  <p className="text-sm text-muted-foreground">hello@${brandName.toLowerCase().replace(/[^a-z]/g, '')}.com</p>
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
`;

  return {
    page: 'contact',
    componentName: compName,
    code,
    filePath: `pages/${compName}.tsx`,
  };
}

export function generateSite(ds: DesignSystem, outputDir: string, brand?: BrandConfig): GeneratedSite {
  const brandName = brand?.name || ds.site_name;
  
  const pages: GeneratedPage[] = [
    generateLandingPage(ds, brand),
    generateAboutPage(ds, brand),
    generatePricingPage(ds, brand),
    generateContactPage(ds, brand),
  ];

  const cssVariables = generateCSSVariables(ds, brand);
  const tailwindConfig = generateTailwindConfig(ds, brand);

  // Write files
  const siteDir = path.join(outputDir, sanitizeComponentName(brandName));
  fs.mkdirSync(siteDir, { recursive: true });
  fs.mkdirSync(path.join(siteDir, 'pages'), { recursive: true });
  fs.mkdirSync(path.join(siteDir, 'styles'), { recursive: true });

  for (const page of pages) {
    fs.writeFileSync(path.join(siteDir, page.filePath), page.code);
  }

  fs.writeFileSync(path.join(siteDir, 'styles', 'globals.css'), cssVariables);
  fs.writeFileSync(path.join(siteDir, 'tailwind.config.ts'), tailwindConfig);

  // package.json for the generated site
  const pkg = {
    name: `${sanitizeComponentName(brandName)}-site`,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
    },
    dependencies: {
      next: '^14',
      react: '^18',
      'react-dom': '^18',
    },
    devDependencies: {
      typescript: '^5',
      tailwindcss: '^3',
      '@types/node': '^20',
      '@types/react': '^18',
    },
  };
  fs.writeFileSync(path.join(siteDir, 'package.json'), JSON.stringify(pkg, null, 2));

  // next.config.js
  fs.writeFileSync(
    path.join(siteDir, 'next.config.js'),
    `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
}

module.exports = nextConfig
`
  );

  const result: GeneratedSite = {
    brand: brand || {
      name: ds.site_name,
      tagline: ds.design_philosophy,
      description: '',
      colors: {
        primary: extractColorValue(ds.colors.primary, '#5E6AD2'),
        secondary: extractColorValue(ds.colors.secondary, '#8B8D98'),
        accent: extractColorValue(ds.colors.accent, '#F58116'),
        background: extractColorValue(ds.colors.background, '#0A0A0F'),
        foreground: extractColorValue(ds.colors.foreground, '#EDEDF0'),
      },
      fonts: {
        heading: extractFontFamily(ds.typography?.families?.heading, 'Inter'),
        body: extractFontFamily(ds.typography?.families?.body, 'Inter'),
        mono: extractFontFamily(ds.typography?.families?.mono, 'monospace'),
      },
    },
    baseTemplate: ds.site_name,
    pages,
    cssVariables,
    tailwindConfig,
  };

  // Save design-system.json
  fs.writeFileSync(
    path.join(siteDir, 'design-system.json'),
    JSON.stringify(result, null, 2)
  );

  console.log(`✅ Generated site: ${brandName}`);
  console.log(`   Pages: ${pages.map(p => p.page).join(', ')}`);
  console.log(`   Output: ${siteDir}`);

  return result;
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const templateArg = args.find(a => a.startsWith('--template='))?.split('=')[1];
  const outputArg = args.find(a => a.startsWith('--output='))?.split('=')[1] || './generated';

  if (!templateArg) {
    console.log('Usage: npx tsx generator/code-generator.ts --template=stripe.com [--output=./generated]');
    process.exit(1);
  }

  const dsPath = path.join(__dirname, '..', 'templates', 'extracted', templateArg, 'design-system.json');
  if (!fs.existsSync(dsPath)) {
    console.error(`Design system not found: ${dsPath}`);
    process.exit(1);
  }

  const ds: DesignSystem = JSON.parse(fs.readFileSync(dsPath, 'utf8'));
  generateSite(ds, outputArg);
}
