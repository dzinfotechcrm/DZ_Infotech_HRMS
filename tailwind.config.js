/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          900: '#0D1B2A',
          800: '#1B2A3B',
          700: '#1E3A5F',
          600: '#1D4ED8',
          500: '#3B82F6',
          100: '#DBEAFE',
          50: '#EFF6FF',
        },
        accent: {
          600: '#0D9488',
          500: '#14B8A6',
          100: '#CCFBF1',
        },
        success: {
          600: '#16A34A',
          100: '#DCFCE7',
        },
        warning: {
          600: '#D97706',
          100: '#FEF3C7',
        },
        danger: {
          600: '#DC2626',
          100: '#FEE2E2',
        },
        neutral: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
      boxShadow: {
        soft: '0 10px 30px rgba(15, 23, 42, 0.08)',
      },
      borderRadius: {
        xl: '0.9rem',
      },
    },
  },
  plugins: [],
};
