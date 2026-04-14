/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ITAC Brand Colors
        itac: {
          navy: '#021627',
          'navy-dark': '#0A1628',
          'navy-light': '#0f2035',
          blue: '#00A6FF',
          'blue-mid': '#166EB6',
          orange: '#FF5100',
          'orange-warm': '#EE7D20',
          'orange-hover': '#e04800',
          'text-light': '#F5F8FA',
          'text-muted': 'rgba(255,255,255,0.5)',
          'text-dark': '#1F2937',
          'text-navy': '#21324A',
          'surface-glass': 'rgba(255,255,255,0.04)',
          'card-blue': 'rgba(22, 110, 182, 0.1)',
          'card-orange': 'rgba(238, 125, 32, 0.1)',
        },
        // Keep semantic colors
        success: {
          light: '#4ade80',
          DEFAULT: '#22c55e',
          dark: '#16a34a',
        },
        warning: {
          light: '#fbbf24',
          DEFAULT: '#f59e0b',
          dark: '#d97706',
        },
        danger: {
          light: '#f87171',
          DEFAULT: '#ef4444',
          dark: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        heading: ['Syne', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'Monaco', 'Courier New', 'monospace'],
      },
      borderRadius: {
        'itac': '12px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'fade-out': 'fadeOut 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-out': 'slideOut 0.3s ease-in',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        bounce: 'bounce 1s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 166, 255, 0.3)',
        'glow-lg': '0 0 30px rgba(0, 166, 255, 0.5)',
      },
    },
  },
  plugins: [],
};
