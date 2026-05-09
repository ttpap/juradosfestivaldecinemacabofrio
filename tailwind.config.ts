import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0fafa',
          100: '#cceeee',
          200: '#99dddd',
          300: '#66cccc',
          400: '#33bbbb',
          500: '#1b8a8a',
          600: '#156b6b',
          700: '#0f4d4d',
          800: '#0a3333',
          900: '#051a1a',
        },
        gold: {
          400: '#f0c060',
          500: '#d4a850',
          600: '#b88a30',
        },
        ocean: {
          950: '#040d18',
          900: '#06111e',
          800: '#0c1c2e',
          700: '#122540',
          600: '#1a3050',
          500: '#1e3a5a',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'float-up': 'floatUp linear infinite',
        'twinkle': 'twinkle ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        floatUp: {
          '0%': { transform: 'translateY(105vh) rotate(-6deg)', opacity: '0' },
          '5%': { opacity: '1' },
          '95%': { opacity: '1' },
          '100%': { transform: 'translateY(-10vh) rotate(6deg)', opacity: '0' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.08' },
          '50%': { opacity: '0.55' },
        },
      },
    },
  },
  plugins: [],
}

export default config
