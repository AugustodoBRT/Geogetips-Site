import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#F7F5F0",
          card: "#FFFFFF",
          tinted: "#EFECE6",
          warm: "#F0EDE5",
        },
        text: {
          DEFAULT: "#1A1715",
          2: "#6B645A",
          3: "#9E9689",
        },
        accent: {
          DEFAULT: "#C7522A",
          hover: "#B3461F",
          soft: "rgba(199,82,42,0.08)",
          mid: "rgba(199,82,42,0.15)",
        },
        green: {
          DEFAULT: "#2D8659",
          soft: "rgba(45,134,89,0.08)",
        },
        red: {
          DEFAULT: "#C23B22",
          soft: "rgba(194,59,34,0.08)",
        },
        amber: {
          DEFAULT: "#B8860B",
          soft: "rgba(184,134,11,0.08)",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "DM Serif Display", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "SF Mono", "monospace"],
      },
      borderRadius: {
        pill: "100px",
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.05)",
        card: "0 2px 12px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
