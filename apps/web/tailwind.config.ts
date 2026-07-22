import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

// CSS variables hold bare OKLCH triples (see src/styles/globals.css) so
// Tailwind's opacity modifiers (`bg-input/30`) can inject `<alpha-value>`.
function withOpacity(cssVar: string): string {
  return `oklch(var(${cssVar}) / <alpha-value>)`;
}

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: withOpacity('--border'),
        input: withOpacity('--input'),
        ring: withOpacity('--ring'),
        background: withOpacity('--background'),
        foreground: withOpacity('--foreground'),
        primary: {
          DEFAULT: withOpacity('--primary'),
          foreground: withOpacity('--primary-foreground'),
        },
        secondary: {
          DEFAULT: withOpacity('--secondary'),
          foreground: withOpacity('--secondary-foreground'),
        },
        destructive: {
          DEFAULT: withOpacity('--destructive'),
        },
        muted: {
          DEFAULT: withOpacity('--muted'),
          foreground: withOpacity('--muted-foreground'),
        },
        accent: {
          DEFAULT: withOpacity('--accent'),
          foreground: withOpacity('--accent-foreground'),
        },
        popover: {
          DEFAULT: withOpacity('--popover'),
          foreground: withOpacity('--popover-foreground'),
        },
        card: {
          DEFAULT: withOpacity('--card'),
          foreground: withOpacity('--card-foreground'),
        },
        chart: {
          1: withOpacity('--chart-1'),
          2: withOpacity('--chart-2'),
          3: withOpacity('--chart-3'),
          4: withOpacity('--chart-4'),
          5: withOpacity('--chart-5'),
        },
        sidebar: {
          DEFAULT: withOpacity('--sidebar'),
          foreground: withOpacity('--sidebar-foreground'),
          primary: withOpacity('--sidebar-primary'),
          'primary-foreground': withOpacity('--sidebar-primary-foreground'),
          accent: withOpacity('--sidebar-accent'),
          'accent-foreground': withOpacity('--sidebar-accent-foreground'),
          border: withOpacity('--sidebar-border'),
          ring: withOpacity('--sidebar-ring'),
        },
      },
      borderRadius: {
        sm: 'calc(var(--radius) * 0.6)',
        md: 'calc(var(--radius) * 0.8)',
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) * 1.4)',
        '2xl': 'calc(var(--radius) * 1.8)',
        '3xl': 'calc(var(--radius) * 2.2)',
        '4xl': 'calc(var(--radius) * 2.6)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
