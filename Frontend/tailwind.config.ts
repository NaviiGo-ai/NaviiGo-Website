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
        saffron: '#FF9933',
        indigo: '#4B0082',
        marigold: '#FFC107',
        'warm-ivory': '#FFF8F0',
        'deep-charcoal': '#2D2D2D',
        'temple-red': '#B22222',
        'jungle-green': '#2E8B57',
        'deep-sea': '#006994',
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
      spacing: ({ theme }) => theme('spacing'),
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
        fade-up: {
          from: {
            opacity: 0,
            transform: 'translateY(20px)'
          },
          to: {
            opacity: 1,
            transform: 'translateY(0)'
          }
        },
        slide-up: {
          from: {
            opacity: 0,
            transform: 'translateY(30px)'
          },
          to: {
            opacity: 1,
            transform: 'translateY(0)'
          }
        },
        scale-in: {
          from: {
            opacity: 0,
            transform: 'scale(0.95)'
          },
          to: {
            opacity: 1,
            transform: 'scale(1)'
          }
        },
        pulse-subtle: {
          '0%, 100%': {
            opacity: 1
          },
          '50%': {
            opacity: 0.8
          }
        }
      },
    },
  },
  plugins: [],
};

export default config;
