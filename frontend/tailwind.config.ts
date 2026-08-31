import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Aerodex Brand
        aero: {
          primary:   "#2456E8", // deep royal blue
          primary2:  "#1A3FB5", // darker shade
          sky:       "#38B6FF", // cyan-blue accent
          sky2:      "#00D4FF", // bright sky
          bg:        "#F0F4FF", // soft lavender white page bg
          surface:   "#FFFFFF",
          dark:      "#0D1B3E", // main dark text
          mid:       "#3A4F7A", // secondary text
          muted:     "#8A99BB", // muted text
          border:    "#DDE4F5", // subtle borders
          drop:      "#12B76A", // price drop green
          rise:      "#F04438", // price rise red
          stable:    "#6172A0", // stable gray-blue
          badge:     "#EBF1FF", // light badge bg
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "aero-gradient": "linear-gradient(135deg, #2456E8 0%, #38B6FF 100%)",
        "aero-dark":     "linear-gradient(135deg, #0D1B3E 0%, #1A3FB5 100%)",
        "aero-card":     "linear-gradient(180deg, #FFFFFF 0%, #F6F9FF 100%)",
      },
      boxShadow: {
        "aero-sm":  "0 1px 4px rgba(36,86,232,0.08)",
        "aero-md":  "0 4px 20px rgba(36,86,232,0.12)",
        "aero-lg":  "0 8px 40px rgba(36,86,232,0.16)",
        "aero-glow":"0 0 30px rgba(56,182,255,0.30)",
      },
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.4" },
        },
        "counter-up": {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up":    "fade-up 0.5s ease-out both",
        "pulse-dot":  "pulse-dot 1.5s ease-in-out infinite",
        "counter-up": "counter-up 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
