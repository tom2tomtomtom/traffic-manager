import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // AIDEN Design System Colors
      colors: {
        // Blacks (primary backgrounds)
        'black-ink': '#050505',
        'black-deep': '#0a0a0a',
        'black-card': '#0f0f0f',
        'black-elevated': '#141414',

        // Primary accent (action color)
        'red-hot': '#ff2e2e',
        'red-dim': '#cc2424',

        // Secondary accent
        'orange-accent': '#ff6b00',
        'orange-dim': '#cc5500',

        // Status colors
        'yellow-electric': '#ffeb00',
        'green-success': '#00ff88',
        'blue-info': '#0088ff',

        // Text colors
        'white-full': '#ffffff',
        'white-muted': '#a0a0a0',
        'white-dim': '#666666',

        // Border colors
        'border-subtle': '#1a1a1a',
        'border-medium': '#2a2a2a',
        'border-strong': '#3a3a3a',
      },

      // AIDEN Typography
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },

      // CRITICAL: Sharp corners only (AIDEN brutalist design)
      borderRadius: {
        DEFAULT: '0',
        none: '0',
        sm: '0',
        md: '0',
        lg: '0',
        xl: '0',
        '2xl': '0',
        '3xl': '0',
        full: '0',
      },

      // Grid background pattern
      backgroundImage: {
        'grid-pattern': `
          linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'grid-size': '24px 24px',
      },

      // Animation for processing states
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

export default config
