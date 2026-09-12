import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './Frontend/app/**/*.{js,ts,jsx,tsx,mdx}',
    './Frontend/components/**/*.{js,ts,jsx,tsx,mdx}',
    './Frontend/lib/**/*.{js,ts,jsx,tsx,mdx}',
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
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
          '50': '#FDFBF7',
          '100': '#F5EDE4',
          '200': '#E8DCCC',
          '300': '#D6C7B2',
          '400': '#A99B8A',
          '500': '#6B6259',
          '600': '#57504A',
          '700': '#443E39',
          '800': '#322E2A',
          '900': '#24211E',
          '950': '#17150F',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        // ── Soul of India palette ────────────────────────────────────────────
        // Each family is a full 50–950 ramp so the semantic classes used across
        // the app (bg-saffron-500, text-jungle-green-700, border-temple-red-200…)
        // actually resolve. 500 is the brand anchor; tints run to white, shades
        // to black, giving every ramp one consistent lightness ladder.
        saffron: {
          '50': '#fff8f1',
          '100': '#fff1e2',
          '200': '#ffe0c2',
          '300': '#ffce9d',
          '400': '#ffb870',
          '500': '#ff9933',
          '600': '#db842c',
          '700': '#b36b24',
          '800': '#8c541c',
          '900': '#6b4015',
          '950': '#4d2e0f',
        },
        marigold: {
          '50': '#fffbee',
          '100': '#fff6dc',
          '200': '#ffecb5',
          '300': '#ffe188',
          '400': '#ffd451',
          '500': '#ffc107',
          '600': '#dba606',
          '700': '#b38705',
          '800': '#8c6a04',
          '900': '#6b5103',
          '950': '#4d3a02',
        },
        'jungle-green': {
          '50': '#f0f7f3',
          '100': '#e2efe7',
          '200': '#c0dccd',
          '300': '#9bc7ae',
          '400': '#6dae89',
          '500': '#2e8b57',
          '600': '#28784b',
          '700': '#20613d',
          '800': '#194c30',
          '900': '#133a25',
          '950': '#0e2a1a',
        },
        'temple-red': {
          '50': '#faf0f0',
          '100': '#f4e0e0',
          '200': '#e8bdbd',
          '300': '#da9595',
          '400': '#c96464',
          '500': '#b22222',
          '600': '#991d1d',
          '700': '#7d1818',
          '800': '#621313',
          '900': '#4b0e0e',
          '950': '#350a0a',
        },
        'deep-sea': {
          '50': '#edf5f8',
          '100': '#dbeaf0',
          '200': '#b3d2df',
          '300': '#85b7cc',
          '400': '#4d96b4',
          '500': '#006994',
          '600': '#005a7f',
          '700': '#004a68',
          '800': '#003a51',
          '900': '#002c3e',
          '950': '#00202c',
        },
        indigo: {
          '50': '#f2edf6',
          '100': '#e6dbee',
          '200': '#c9b3da',
          '300': '#a985c3',
          '400': '#814da8',
          '500': '#4b0082',
          '600': '#410070',
          '700': '#35005b',
          '800': '#290048',
          '900': '#200037',
          '950': '#170027',
        },
        'warm-ivory': '#FFF8F0',
        'deep-charcoal': '#2D2D2D',
        sidebar: {
          DEFAULT: 'var(--sidebar)',
          foreground: 'var(--sidebar-foreground)',
          primary: 'var(--sidebar-primary)',
          'primary-foreground': 'var(--sidebar-primary-foreground)',
          accent: 'var(--sidebar-accent)',
          'accent-foreground': 'var(--sidebar-accent-foreground)',
          border: 'var(--sidebar-border)',
          ring: 'var(--sidebar-ring)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Lato', ...defaultTheme.fontFamily.sans],
        serif: ['var(--font-serif)', 'Playfair Display', ...defaultTheme.fontFamily.serif],
        mono: ['var(--font-mono)', ...defaultTheme.fontFamily.mono],
      },
      borderRadius: ({ theme }) => ({
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      }),
      boxShadow: ({ theme }) => ({
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
      }),
            container: {
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
        },
        center: true,
      },
      animation: {
        'fade-up': 'fade-up var(--duration-normal) ease-out',
        'slide-up': 'slide-up var(--duration-normal) ease-out',
        'scale-in': 'scale-in var(--duration-normal) ease-out',
        'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        aurora: "aurora 60s linear infinite",
        shimmer: "shimmer 1.5s infinite linear",
      },
      transitionDuration: {
        '150': 'var(--duration-fast)',
        '300': 'var(--duration-normal)',
        '500': 'var(--duration-slow)',
      },
      transitionTimingFunction: {
        'in': 'var(--ease-in)',
        'out': 'var(--ease-out)',
        'in-out': 'var(--ease-in-out)',
      },
      keyframes: {
        aurora: {
          from: { backgroundPosition: "50% 50%, 50% 50%" },
          to: { backgroundPosition: "350% 50%, 350% 50%" },
        },
        shimmer: {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(100%)" },
        },
        'fade-up': {
          from: {
            opacity: '0',
            transform: 'translateY(20px)'
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        'slide-up': {
          from: {
            opacity: '0',
            transform: 'translateY(30px)'
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        'scale-in': {
          from: {
            opacity: '0',
            transform: 'scale(0.95)'
          },
          to: {
            opacity: '1',
            transform: 'scale(1)'
          }
        },
        'pulse-subtle': {
          '0%, 100%': {
            opacity: '1'
          },
          '50%': {
            opacity: '0.8'
          }
        }
      },
    },
  },
  plugins: [],
};

export default config;
