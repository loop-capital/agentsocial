import type { Config } from 'tailwindcss'

const config: Config = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#5E6AD2',
          secondary: 'linear-gradient(138deg, rgba(32, 35, 91, 0.70) 22.00%, rgba(7, 9, 33, 0.70) 82.00%)',
          accent: '#F58116',
          background: '#0A0A0F',
          foreground: '#EDEDF0',
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
