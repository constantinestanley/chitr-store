import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#5B2D8E',
          dark:    '#3A1A5C',
          mid:     '#7B52AB',
          light:   '#EDE7F6',
        },
        amber: {
          DEFAULT: '#FF6F00',
          light:   '#FFF3E0',
        },
        teal: {
          DEFAULT: '#00897B',
          light:   '#E0F2F1',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body:    ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':      'fadeIn 0.5s ease-in-out',
        'slide-up':     'slideUp 0.4s ease-out',
        'bid-flash':    'bidFlash 0.6s ease-in-out',
        'pulse-slow':   'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:  { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        bidFlash: { '0%,100%': { background: 'transparent' }, '50%': { background: '#FFF3E0' } },
      },
    },
  },
  plugins: [],
}

export default config
