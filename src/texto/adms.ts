import { formatarUnidades } from "@/lib/format";
import { contagem, type Periodo, type Trecho } from "./forma";

/**
 * O texto da tela de Adms.
 *
 * A mais densa do site: 26 entradas em 392 linhas, dez delas montadas. É
 * também a primeira que precisa do `Trecho` — a frase de escopo leva o nome do
 * período em negrito **no meio**, e partir isso em pedaços travaria a ordem das
 * palavras.
 *
 * ## Duas inconsistências preservadas de propósito
 *
 * **"anuladas" contra "void".** O `aria-label` da barra de composição diz
 * "anuladas" e o selo logo abaixo dela diz "void" — a mesma coisa, com duas
 * palavras, na mesma tela. Quem enxerga lê uma, quem ouve lê a outra.
 *
 * **O plural dos selos é um "s" colado.** "green" vira "greens", "pendente"
 * vira "pendentes". Funciona em português e em inglês, e quebra na primeira
 * língua que pluralize de outro jeito.
 *
 * As duas ficam como estão: consertar muda a saída, e este trabalho promete não
 * mudar nenhuma. Ficam escritas aqui, onde aparecem, em vez de escondidas no
 * meio do JSX.
 */

const ADMS = {
  selo: "Ranking",

  /** A frase com o período em negrito no meio. Ver `Trecho`, em forma.ts. */
  escopo: (p: Periodo): Trecho[] => [
    `Assertividade e lucro por unidade ${p.prefixo} `,
    { forte: p.nome },
    ". A taxa considera apenas apostas finalizadas.",
  ],

  vazio: (p: Periodo) => `Nenhum adm com dados ${p.prefixo} ${p.nome}.`,

  cartao: {
    aria: (adm: string) => `Ver o desempenho de ${adm} por casa e por esporte`,
    topo: "Top #1",
    lucro: "Lucro Líquido",
    acerto: "Acerto",
    volume: "Volume",
    roi: "ROI",
    apostas: (n: number) => contagem(n, "aposta", "apostas"),
    composicao: "Composição das tips",
    oddMedia: (odd: string) => `odd média ${odd}`,

    /**
     * A barra de composição falada. Cinco números numa frase só.
     *
     * Diz "anuladas" onde o selo abaixo diz "void" — ver o topo do arquivo.
     */
    ariaDaBarra: (d: {
      adm: string;
      greens: string;
      reds: string;
      anuladas: string;
      pendentes: string;
      total: number;
    }) =>
      `${d.adm}: ${d.greens} green, ${d.reds} red, ${d.anuladas} anuladas e ` +
      `${d.pendentes} pendentes, de ${contagem(d.total, "aposta", "apostas")}`,

    /** Os rótulos dos quatro selos, na ordem em que a barra os desenha. */
    fatias: {
      green: "green",
      red: "red",
      void: "void",
      pendente: "pendente",
    },

    /**
     * O selo de uma fatia: "3 greens", "1 pendente".
     *
     * O componente filtra as fatias com zero antes de desenhar, então `n` é
     * sempre pelo menos 1 — e o `n > 1 ? "s" : ""` que estava no JSX é um
     * plural comum escrito de outro jeito.
     */
    fatia: (n: number, rotulo: string) => contagem(n, rotulo, `${rotulo}s`),
  },

  detalhe: {
    rotulo: (adm: string) => `Desempenho de ${adm} por casa e por esporte`,
    resumo: (d: { apostas: number; periodo: Periodo; unidades: number }) =>
      `${contagem(d.apostas, "aposta", "apostas")} ${d.periodo.prefixo} ` +
      `${d.periodo.nome} · ${formatarUnidades(d.unidades)}`,
    porCasa: "Por casa",
    porEsporte: "Por esporte",
    vazio: "Nada neste período.",
    linha: (d: { apostas: number; acerto: string; roi: string }) =>
      `${contagem(d.apostas, "aposta", "apostas")} · ${d.acerto} acerto · ROI ${d.roi}`,
    fechar: "Fechar",
  },
} as const;

/** O acessador. É a única linha desta seção que a #128 vai mexer. */
export function textoDosAdms() {
  return ADMS;
}
