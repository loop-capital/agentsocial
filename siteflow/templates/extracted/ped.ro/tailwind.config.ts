import type { Config } from 'tailwindcss'

const config: Config = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#5E6AD2',
          secondary: 'black',
          accent: '#F58116',
          background: 'var(--gray-1)',
          foreground: '#EDEDF0',
          muted: '#6B6D76',
          border: '#2A2A32',
        },
      },
      fontFamily: {
        heading: ['var(--font-editorial-new)'],
        body: ['var(--font-editorial-new)'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
    },
  },
}

export default config
