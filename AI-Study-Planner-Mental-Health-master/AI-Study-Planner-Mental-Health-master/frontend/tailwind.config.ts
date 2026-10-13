import type { Config } from "tailwindcss";

const lavenderPalette = {
  50: "var(--primary-50)", 100: "var(--primary-100)", 200: "var(--primary-200)",
  300: "var(--primary-300)", 400: "var(--primary-400)", 500: "var(--primary-500)",
  600: "var(--primary-600)", 700: "var(--primary-700)", 800: "var(--primary-800)",
  900: "var(--primary-900)", 950: "var(--primary-900)",
};
const neutralPalette = {
  50: "hsl(var(--background))", 100: "hsl(var(--muted))", 200: "hsl(var(--border))",
  300: "var(--primary-300)", 400: "var(--primary-400)", 500: "hsl(var(--muted-foreground))",
  600: "hsl(var(--muted-foreground))", 700: "hsl(var(--foreground))",
  800: "hsl(var(--foreground))", 900: "hsl(var(--foreground))", 950: "hsl(var(--foreground))",
};
const peachPalette = {
  50: "var(--accent-50)", 100: "var(--accent-100)", 200: "var(--accent-200)",
  300: "var(--accent-300)", 400: "var(--accent-400)", 500: "var(--accent-500)",
  600: "var(--accent-600)", 700: "var(--accent-700)", 800: "var(--accent-800)",
  900: "var(--accent-900)", 950: "var(--accent-900)",
};
const sagePalette = {
  50: "var(--success-50)", 100: "var(--success-100)", 200: "var(--success-200)",
  300: "var(--success-300)", 400: "var(--success-400)", 500: "var(--success-500)",
  600: "var(--success-600)", 700: "var(--success-700)", 800: "var(--success-800)",
  900: "var(--success-900)", 950: "var(--success-900)",
};
const raspberryPalette = {
  50: "var(--error-50)", 100: "var(--error-100)", 200: "var(--error-200)",
  300: "var(--error-300)", 400: "var(--error-400)", 500: "var(--error-500)",
  600: "var(--error-600)", 700: "var(--error-700)", 800: "var(--error-800)",
  900: "var(--error-900)", 950: "var(--error-900)",
};

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: neutralPalette,
        slate: neutralPalette,
        zinc: neutralPalette,
        neutral: neutralPalette,
        stone: neutralPalette,
        blue: lavenderPalette,
        indigo: lavenderPalette,
        purple: lavenderPalette,
        violet: lavenderPalette,
        cyan: lavenderPalette,
        sky: lavenderPalette,
        fuchsia: lavenderPalette,
        pink: lavenderPalette,
        rose: raspberryPalette,
        red: raspberryPalette,
        green: sagePalette,
        emerald: sagePalette,
        teal: sagePalette,
        lime: sagePalette,
        orange: peachPalette,
        amber: peachPalette,
        yellow: peachPalette,
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "var(--primary-700)",
          foreground: "hsl(var(--primary-foreground))",
          50: "var(--primary-50)",
          100: "var(--primary-100)",
          200: "var(--primary-200)",
          300: "var(--primary-300)",
          400: "var(--primary-400)",
          500: "var(--primary-500)",
          600: "var(--primary-600)",
          700: "var(--primary-700)",
          800: "var(--primary-800)",
          900: "var(--primary-900)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent-hsl))",
          foreground: "hsl(var(--accent-foreground))",
          50: "var(--accent-50)",
          100: "var(--accent-100)",
          200: "var(--accent-200)",
          300: "var(--accent-300)",
          400: "var(--accent-400)",
          500: "var(--accent-500)",
          600: "var(--accent-600)",
          700: "var(--accent-700)",
          800: "var(--accent-800)",
          900: "var(--accent-900)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        error: {
          DEFAULT: "hsl(var(--error))",
          foreground: "hsl(var(--error-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        field: "var(--radius-field)",
        button: "var(--radius-button)",
        card: "var(--radius-card)",
        pill: "9999px",
        lg: "var(--radius-card)",
        md: "var(--radius-field)",
        sm: "4px",
        xl: "var(--radius-card)",
        "2xl": "var(--radius-card)",
      },
      fontFamily: {
        sans: ["Arial", "Liberation Sans", "Helvetica Neue", "Helvetica", "sans-serif"],
        heading: ["var(--font-poppins)", "Segoe UI", "system-ui", "-apple-system", "Arial", "sans-serif"],
      },
      boxShadow: {
        DEFAULT: "var(--shadow-soft)",
        soft: "var(--shadow-soft)",
        sm: "var(--shadow-soft)",
        md: "var(--shadow-soft)",
        lg: "var(--shadow-soft)",
        xl: "var(--shadow-soft)",
        "2xl": "var(--shadow-soft)",
      },
    },
  },
  plugins: [],
};

export default config;