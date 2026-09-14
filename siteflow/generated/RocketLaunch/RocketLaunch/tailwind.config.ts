import type { Config } from 'tailwindcss'

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
          primary: '#FF5733',
          secondary: '#1A1A2E',
          accent: '#FF8C42',
          background: '#0F0F23',
          foreground: '#F5F5F5',
          muted: '#1A1A2E99',
          border: '#1A1A2E33',
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
        heading: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['monospace', 'monospace'],
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
