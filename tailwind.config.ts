import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        display: ['Sora', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        accent: '#8b5cf6',
        'accent-blue': '#3b82f6',
        'accent-emerald': '#10b981',
        'bg-dark': '#05060a',
        'card-dark': '#0b0d14',
      },
    },
  },
} satisfies Config;
