/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#067069',
          'teal-dark': '#04524d',
          'teal-bright': '#0a8f86',
          gold: '#f8bb00',
          'gold-dark': '#c99400',
        },
        // Delivery-partner-only accent — separate from the three job-type
        // colors below, so anything that belongs to the partner's own
        // identity (availability, earnings, the partner tab bar) reads as
        // distinct from "this is a marketplace/food/laundry job".
        partner: {
          DEFAULT: '#e07a2e',
          dark: '#b85f1f',
          bright: '#f2954f',
        },
        neutral: {
          50: '#fafafa',
          100: '#f2f2f0',
          200: '#e4e4e1',
          300: '#c9c9c4',
          400: '#a3a39c',
          500: '#7a7a72',
          600: '#5c5c56',
          700: '#42423e',
          800: '#2e2e2b',
          900: '#1c1c1a',
          950: '#121211',
        },
        accent: {
          green: '#1a9c5c',
          orange: '#e07a2e',
          blue: '#3b82c4',
          purple: '#8b5cf6',
          red: '#d64545',
        },
        laundry: {
          DEFAULT: '#1290c9',
          dark: '#0d6e99',
          bright: '#2fa8de',
        },
        success: '#1a9c5c',
        warning: '#e0a300',
        error: '#d64545',
        info: '#3b82c4',
        'on-brand': '#ffffff',
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.6)',
          strong: 'rgba(255, 255, 255, 0.78)',
          border: 'rgba(255, 255, 255, 0.5)',
          dark: 'rgba(28, 28, 26, 0.55)',
          'dark-strong': 'rgba(28, 28, 26, 0.72)',
          'dark-border': 'rgba(255, 255, 255, 0.08)',
        },
      },
      fontFamily: {
        sans: ['Fredoka_400Regular'],
        medium: ['Fredoka_500Medium'],
        semibold: ['Fredoka_600SemiBold'],
        bold: ['Fredoka_700Bold'],
      },
      fontSize: {
        display: ['32px', { lineHeight: '40px' }],
        h1: ['24px', { lineHeight: '32px' }],
        h2: ['20px', { lineHeight: '28px' }],
        'card-title': ['17px', { lineHeight: '24px' }],
        'body-lg': ['16px', { lineHeight: '24px' }],
        body: ['15px', { lineHeight: '21px' }],
        caption: ['13px', { lineHeight: '18px' }],
        overline: ['11px', { lineHeight: '14px', letterSpacing: '0.8px' }],
      },
      borderRadius: {
        card: '20px',
        glass: '22px',
        tile: '24px',
        pill: '999px',
      },
      boxShadow: {
        soft: '0 2px 12px rgba(28, 28, 26, 0.06)',
        card: '0 4px 20px rgba(28, 28, 26, 0.08)',
        raised: '0 8px 28px rgba(28, 28, 26, 0.12)',
        glass: '0 8px 32px rgba(28, 28, 26, 0.10)',
      },
    },
  },
  plugins: [],
};
