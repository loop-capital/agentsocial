import type { Config } from 'tailwindcss'

const config: Config = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#000000',
          secondary: 'rgba(255, 255, 255, 0.6)',
          accent: 'rgba(0, 0, 0, 0.65)',
          background: '#C7F8FB',
          foreground: 'text',
          muted: '#6B6D76',
          border: '#2A2A32',
        },
      },
      fontFamily: {
        heading: ['system-ui'],
        body: ['system-ui'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
    },
  },
}

export default config
