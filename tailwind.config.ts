import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Webnova Brand Colors
        "wn-midnight": "#0F172A",
        "wn-blue": "#2563EB",
        "wn-cyan": "#06B6D4",
        "wn-green": "#22C55E",
        "wn-orange": "#F97316",
        "wn-red": "#DC2626",
        "wn-slate": "#1E293B",
        "wn-gray": "#64748B",
        "wn-light": "#F8FAFC",
        // Dark mode surfaces
        "dark-bg": "#020617",
        "dark-surface": "#0F172A",
        "dark-card": "#111827",
      },
      fontFamily: {
        sans: ["Inter", "SF Pro Display", "Helvetica Neue", "Arial", "sans-serif"],
      },
      fontSize: {
        "dashboard-heading": ["36px", { lineHeight: "1.2" }],
        "h1": ["32px", { lineHeight: "1.2" }],
        "h2": ["24px", { lineHeight: "1.2" }],
        "h3": ["20px", { lineHeight: "1.2" }],
        "body": ["16px", { lineHeight: "1.6" }],
        "small": ["14px", { lineHeight: "1.6" }],
        "caption": ["12px", { lineHeight: "1.6" }],
      },
      borderRadius: {
        "card": "16px",
        "btn": "10px",
        "input": "10px",
      },
      boxShadow: {
        "card": "0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)",
        "card-hover": "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
        "wn-glow": "0 0 20px rgba(37,99,235,0.15)",
      },
      animation: {
        "count-up": "countUp 1s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-in": "slideIn 0.3s ease-out",
      },
      keyframes: {
        countUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
