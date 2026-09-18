import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    // lib e hooks também montam classes. Fora daqui, o avatar dos adms (em
    // lib/stats.ts) nunca teve o gradiente gerado, e o maior degrau de
    // tamanhoDoValor (em lib/format.ts) perdia o sm:text-xl.
    "./src/lib/**/*.{js,ts,jsx,tsx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx}",
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
        // Barra de progresso indeterminada: a peça tem um terço da largura da
        // pista e a atravessa. Só `transform` — animar `left` ou `width`
        // forçaria o navegador a recalcular layout a cada quadro.
        progresso: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(300%)" },
        },
        // Barras de dado crescendo até o valor. A largura fica parada e quem
        // se move é a escala: `width` animada refaz o layout a cada quadro, e
        // há dezenas dessas barras numa tela de estatísticas.
        "surgir-x": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        "surgir-y": {
          "0%": { transform: "scaleY(0)" },
          "100%": { transform: "scaleY(1)" },
        },
        // Chegada de conteúdo quando o esqueleto sai. Curta: quem está ali já
        // esperou pelo dado, e movimento longo depois da espera é castigo em
        // cima de castigo.
        entrada: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // Só opacidade, para elemento que tem hover com `transform`. Animação
        // ganha de classe na cascata enquanto roda — e, com `both`, depois dela
        // também: a `entrada` deixaria o translateY(0) final grudado e o card
        // nunca subiria no hover. Sem transform aqui, não há o que disputar.
        aparecer: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s ease-in-out infinite",
        progresso: "progresso 1.1s cubic-bezier(0.65, 0, 0.35, 1) infinite",
        "surgir-x": "surgir-x 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "surgir-y": "surgir-y 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        entrada: "entrada 0.26s cubic-bezier(0.16, 1, 0.3, 1) both",
        aparecer: "aparecer 0.2s ease-out both",
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
