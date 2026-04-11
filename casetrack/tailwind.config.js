/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}', './lib/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#0a0d14',
        surface:  '#111520',
        surface2: '#171d2e',
        border:   '#1e2740',
        accent:   '#e8c547',
        accent2:  '#4e9af1',
        danger:   '#f1654e',
        success:  '#4ecf8a',
        warning:  '#f1a94e',
        muted:    '#6b7494',
      },
      fontFamily: {
        sans:  ['DM Sans', 'sans-serif'],
        mono:  ['DM Mono', 'monospace'],
        display: ['Syne', 'sans-serif'],
      },
      animation: {
        'flash': 'flash 2.5s ease forwards',
        'pulse-dot': 'pulseDot 1.5s infinite',
        'slide-in': 'slideIn 0.2s ease',
        'fade-in': 'fadeIn 0.15s ease',
      },
      keyframes: {
        flash:    { '0%': { backgroundColor: 'rgba(232,197,71,.2)' }, '100%': { backgroundColor: 'transparent' } },
        pulseDot: { '0%,100%': { opacity: '1' }, '50%': { opacity: '.3' } },
        slideIn:  { from: { transform: 'translateY(-8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        fadeIn:   { from: { opacity: '0' }, to: { opacity: '1' } },
      },
    },
  },
  plugins: [],
}
