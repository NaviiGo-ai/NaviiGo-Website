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
        brand: {
          primary: 'rgb(var(--accent-primary-rgb) / <alpha-value>)',
          secondary: 'rgb(var(--accent-secondary-rgb) / <alpha-value>)',
        },
      colors: {
        primary: '#0066CC',
        secondary: '#FF9900',
        surface: {
          DEFAULT: 'rgba(255,255,255,0.80)',
          strong: 'rgba(255,255,255,0.95)',
        },
      },
      transitionTimingFunction: {
        motion: 'var(--motion-ease)',
      },
      transitionDuration: {
        motion: 'var(--motion-duration)',
      },
      boxShadow: {
        glass: '0 8px 30px rgba(0, 0, 0, 0.08)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
        mono: ['var(--font-geist-mono)', ...defaultTheme.fontFamily.mono],
      },
      animation: {
        aurora: "aurora 60s linear infinite",
      },
      keyframes: {
        aurora: {
          from: {
            backgroundPosition: "50% 50%, 50% 50%",
          },
          to: {
            backgroundPosition: "350% 50%, 350% 50%",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
