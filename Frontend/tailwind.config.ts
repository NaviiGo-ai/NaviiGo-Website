import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: '#EC6426',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#632713',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
          '50': '#FDFBF7',
          '100': '#FAF6F0',
          '200': '#F5EDE4',
          '300': '#EAE3DA',
          '400': '#A99B8A',
          '500': '#6B6259',
          '600': '#57504A',
          '700': '#443E39',
          '800': '#322E2A',
          '900': '#24323A',
          '950': '#161412',
        },
        accent: {
          DEFAULT: '#F8A91F',
          foreground: '#24323A',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',

        /* ── Verified Naviigo Authentic Palette ───────────────── */
        naviigo: {
          orange: '#EC6426',
          yellow: '#F8A91F',
          brown: '#632713',
          cream: '#FDE3CF',
          teal: '#00666A',
          text: '#24323A',
        },

        /* ── Tactile Paper & Material Surface System ─────────── */
        paper: {
          light: '#FDFBF7',
          warm: '#FAF6F0',
          cream: '#FDE3CF',
          bone: '#F5EDE4',
          muted: '#EAE3DA',
          dark: '#161412',
          charcoal: '#201D1A',
        },

        /* ── Semantic Brand Tokens ───────────────────────────── */
        brand: {
          primary: '#EC6426',
          secondary: '#F8A91F',
          tertiary: '#632713',
          canvas: '#FDE3CF',
          teal: '#00666A',
          text: '#24323A',
        },

        /* Backward compatibility tokens */
        'warm-ivory': {
          DEFAULT: '#FAF6F0',
          '50': '#FDFBF7',
          '100': '#FAF6F0',
          '200': '#F5EDE4',
          '300': '#E8DCCC',
          '400': '#D6C7B2',
          '500': '#FAF6F0',
          '600': '#EAE3DA',
          '700': '#D9D1C8',
          '800': '#C8BFB6',
          '900': '#B7ADA6',
          '950': '#9C928B',
        },
        'deep-charcoal': {
          DEFAULT: '#24323A',
          '50': '#3A3A3A',
          '100': '#343434',
          '200': '#2E2E2E',
          '300': '#292929',
          '400': '#282828',
          '500': '#24323A',
          '600': '#201D1A',
          '700': '#1A1816',
          '800': '#161412',
          '900': '#111111',
          '950': '#0D0C0B',
        },
        saffron: {
          DEFAULT: '#EC6426',
          '50': '#FFF8F1',
          '100': '#FFF1E2',
          '200': '#FFE0C2',
          '300': '#FFCE9D',
          '400': '#F8A91F',
          '500': '#EC6426',
          '600': '#D4541C',
          '700': '#B34112',
          '800': '#8C310D',
          '900': '#632713',
          '950': '#4D1D0D',
        },
        stone: {
          DEFAULT: '#8E8D8A',
          '50': '#F0EFEC',
          '100': '#E2E1DD',
          '200': '#C9C8C4',
          '300': '#B1AFA9',
          '400': '#989691',
          '500': '#8E8D8A',
          '600': '#72716F',
          '700': '#565554',
          '800': '#3B3A38',
          '900': '#1F1E1C',
          '950': '#0F0E0D',
        },
      },
      fontFamily: {
        display: ['var(--font-epilogue)', 'Epilogue', ...defaultTheme.fontFamily.sans],
        epilogue: ['var(--font-epilogue)', 'Epilogue', ...defaultTheme.fontFamily.sans],
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', ...defaultTheme.fontFamily.sans],
        serif: ['var(--font-epilogue)', 'Epilogue', ...defaultTheme.fontFamily.serif],
        mono: ['var(--font-mono)', ...defaultTheme.fontFamily.mono],
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(36, 50, 58, 0.05)',
        md: '0 4px 6px -1px rgba(36, 50, 58, 0.08), 0 2px 4px -2px rgba(36, 50, 58, 0.05)',
        lg: '0 10px 15px -3px rgba(36, 50, 58, 0.08), 0 4px 6px -4px rgba(36, 50, 58, 0.04)',
        xl: '0 20px 25px -5px rgba(36, 50, 58, 0.1), 0 8px 10px -6px rgba(36, 50, 58, 0.05)',
        '2xl': '0 25px 50px -12px rgba(36, 50, 58, 0.18)',
        paper: '0 1px 3px rgba(36, 50, 58, 0.06), 0 12px 24px -4px rgba(99, 39, 19, 0.06)',
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(32px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;