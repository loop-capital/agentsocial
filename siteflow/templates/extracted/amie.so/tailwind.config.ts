import type { Config } from 'tailwindcss'

const config: Config = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#5E6AD2',
          secondary: '#8B8D98',
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
