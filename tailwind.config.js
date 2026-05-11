/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Neo-Brutalism Core Palette */
        'neo-cream':     '#FFFDF5',
        'neo-accent':    '#FF6B6B',
        'neo-secondary': '#FFD93D',
        'neo-muted':     '#C4B5FD',
        'neo-black':     '#000000',

        /* Legacy aliases — kept so existing className references still work */
        paper:  '#FFFDF5',
        ink:    '#000000',
        divider:'#000000',
        muted:  '#FFFDF5',
        primary: {
          50:  '#fff0f0',
          100: '#ffdddd',
          200: '#ffc0c0',
          300: '#ff9494',
          400: '#ff6b6b',
          500: '#FF6B6B',
          600: '#e55a5a',
          700: '#c73f3f',
          800: '#a53434',
          900: '#882e2e',
        },
        newsprint: {
          red: '#FF6B6B',
        },
      },

      fontFamily: {
        sans:  ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body:  ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:  ['"Space Grotesk"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },

      boxShadow: {
        /* Hard offset shadows — the Neo-Brutalism signature */
        'neo-sm':    '4px 4px 0px 0px #000000',
        'neo':       '8px 8px 0px 0px #000000',
        'neo-lg':    '12px 12px 0px 0px #000000',
        'neo-xl':    '16px 16px 0px 0px #000000',
        'neo-white': '8px 8px 0px 0px #FFFFFF',
        'neo-accent':'8px 8px 0px 0px #FF6B6B',
        'neo-sec':   '8px 8px 0px 0px #FFD93D',
      },

      borderWidth: {
        '3': '3px',
        '6': '6px',
      },

      animation: {
        'spin-slow':    'spin-slow 10s linear infinite',
        'bounce-in':    'bounce-in 0.4s ease-out forwards',
        'neo-marquee':  'neo-marquee 20s linear infinite',
        'neo-stamp':    'neo-stamp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },

      keyframes: {
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        'bounce-in': {
          '0%':   { transform: 'scale(0.9) translateY(8px)', opacity: '0' },
          '60%':  { transform: 'scale(1.05) translateY(-2px)', opacity: '1' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
        'neo-marquee': {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'neo-stamp': {
          '0%':   { transform: 'scale(1.5) rotate(-5deg)', opacity: '0' },
          '60%':  { transform: 'scale(0.95) rotate(1deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
      },

      transitionDuration: {
        '100': '100ms',
        '200': '200ms',
      },
    },
  },
  plugins: [],
}
