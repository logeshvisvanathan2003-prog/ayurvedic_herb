/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4a7c59',
          dark: '#2e5e3e',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#1a1a0e',
          foreground: '#f5f0e8',
        },
        gold: {
          DEFAULT: '#b9b04a',
          dark: '#8a8030',
        },
        cream: '#f5f0e8',
        background: '#fafaf5',
      },
      fontFamily: {
        heading: ['Syne', 'sans-serif'],
        display: ['DM Serif Display', 'serif'],
        body: ['Space Grotesk', 'sans-serif'],
      },
      animation: {
        'marquee': 'marquee 28s linear infinite',
        'marquee-reverse': 'marquee-reverse 28s linear infinite',
        'float': 'float 4s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'fade-up': 'fade-up 0.8s ease forwards',
        'slide-up': 'slide-up 1s cubic-bezier(0.22,1,0.36,1) forwards',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-reverse': {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'pulse-dot': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.4)', opacity: '0.7' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(40px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(100%)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
