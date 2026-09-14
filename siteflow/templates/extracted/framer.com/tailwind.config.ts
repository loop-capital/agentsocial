import type { Config } from 'tailwindcss'

const config: Config = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#5E6AD2',
          secondary: '#09f',
          accent: '#F58116',
          background: 'initial}ol.framer-text{--list-style-type:decimal}ul.framer-text,ol.framer-text{padding-inline-start:0',
          foreground: 'var(--framer-link-current-text-decoration-style,var(--framer-link-text-decoration-style,var(--framer-text-decoration-style,solid)))var(--framer-link-current-text-decoration,var(--framer-link-text-decoration,var(--framer-text-decoration,none)))var(--framer-link-current-text-decoration-color,var(--framer-link-text-decoration-color,var(--framer-text-decoration-color,currentcolor)))var(--framer-link-current-text-decoration-thickness,var(--framer-link-text-decoration-thickness,var(--framer-text-decoration-thickness,auto)))',
          muted: '#6B6D76',
          border: '1px',
        },
      },
      fontFamily: {
        heading: ['"Open Runde", "Open Runde Placeholder", sans-serif'],
        body: ['"Open Runde", "Open Runde Placeholder", sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '10px',
      },
    },
  },
}

export default config
