import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Sem paleta aqui de propósito: as cores do site moram em
      // src/app/globals.css como CSS variables, e o código as consome
      // via `-[var(--token)]`. Uma segunda lista aqui já existiu, ficou
      // desatualizada e virou armadilha — quem escrevesse `bg-accent`
      // recebia a cor antiga. Para trocar a paleta, edite só o :root.
      fontFamily: {
        serif: ["var(--font-serif)", "DM Serif Display", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "SF Mono", "monospace"],
      },
      borderRadius: {
        pill: "100px",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s ease-in-out infinite",
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
