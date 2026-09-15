import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Nenhum teste toca no DOM: o que está sob teste são as contas, e elas são
    // funções puras de propósito — `src/lib/stats.ts` existe separado da API
    // justamente para o cliente e o servidor somarem do mesmo jeito.
    environment: "node",
    include: ["src/**/*.test.ts"],

    coverage: {
      provider: "v8",
      reporter: ["text-summary", "text"],

      // A cobertura mede `src/lib`, e só. Componente de tela não entra: quem
      // cobre isso é o Playwright, e misturar os dois num número só daria uma
      // média que não quer dizer nada sobre nenhum dos dois.
      include: ["src/lib/**/*.ts"],
      exclude: [
        // Dado de demonstração, não lógica.
        "src/lib/data.ts",
        // Listas de constantes: cores da marca, endereços, metadados.
        "src/lib/cores.ts",
        "src/lib/movimento.ts",
        "src/lib/metadados.ts",
        // Leitura de rede. O que dá para testar aqui são os parsers, e eles
        // estão cobertos; o resto pede a planilha no ar.
        "src/lib/sheets.ts",
        "src/lib/planilhaPublica.ts",
      ],

      // Trava de catraca, não meta: os números estão logo abaixo do que a
      // suíte cobre hoje. Servem para avisar quando alguém acrescenta regra de
      // cálculo sem teste — não para virar um alvo a ser perseguido.
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
  },
});
