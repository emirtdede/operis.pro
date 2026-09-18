import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"], [data-theme="black"]'],
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "rgb(var(--canvas-rgb, 20 21 23) / <alpha-value>)",
        surface: "rgb(var(--surface-rgb, 29 30 33) / <alpha-value>)",
        elevated: "rgb(var(--elevated-rgb, 38 40 45) / <alpha-value>)",
        primary: {
          DEFAULT: "var(--accent)",
          contrast: "var(--accent-contrast)",
          hover: "var(--accent-hover)",
        },
        content: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        line: {
          subtle: "var(--border-subtle)",
          strong: "var(--border-strong)",
        },
        state: {
          success: "var(--success)",
          warning: "var(--warning)",
          danger: "var(--danger)",
        },
        ring: {
          focus: "var(--focus-ring)",
        },
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "Oxygen",
          "Ubuntu",
          "Cantarell",
          "sans-serif",
        ],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', "-apple-system", "sans-serif"],
      },
      maxWidth: {
        container: "1280px",
        content: "860px",
      },
      borderRadius: {
        surface: "12px",
        pill: "9999px",
      },
      animation: {
        shimmer: "shimmer-slide 3s ease-in-out infinite",
        radar: "radar-sweep 6s linear infinite",
        "pulse-subtle": "pulse-subtle 3s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 0deg, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

export default config;
