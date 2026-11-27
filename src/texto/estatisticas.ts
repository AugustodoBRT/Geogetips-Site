import { contagem, type Periodo, type Trecho } from "./forma";

/**
 * O texto da tela de Estatísticas.
 *
 * Cinquenta entradas em 700 linhas: a rosca de distribuição, as médias de odd,
 * os dois cartões de Top, e os dois diálogos de detalhe com uma tabela cada.
 *
 * ## Três inconsistências preservadas de propósito
 *
 * **"anuladas" contra "Void (anulada)".** O `aria-label` da rosca diz
 * "anuladas"; a legenda logo ao lado dela diz "Void (anulada)". É a mesma
 * divergência que `/adms` tem entre a barra e o selo, aqui com a terceira
 * grafia da mesma palavra.
 *
 * **As duas telas ordenam os quatro resultados de jeitos diferentes.** Aqui a
 * legenda e a fala concordam: green, red, pendente, void. Em `/adms` a barra e
 * os selos também concordam entre si — mas na outra ordem, com void em terceiro
 * e pendente em quarto. Dentro de cada tela está coerente; entre as duas, não.
 * Quem uniformizar muda a saída de uma delas.
 *
 * **A rosca falada não tem singular.** O total sai sempre com "apostas" colado:
 * com uma aposta só, ela diz "de 1 apostas". É audível e só audível, porque o
 * número no meio da rosca é um número solto e o rótulo "Apostas" ali é
 * cabeçalho, não contagem. A barra equivalente de `/adms` faz o singular.
 *
 * As três ficam como estão: consertar muda a saída, e este trabalho promete não
 * mudar nenhuma. Ficam escritas aqui, onde aparecem, cada uma com um teste que
 * torna o conserto uma decisão com vermelho junto.
 */

const ESTATISTICAS = {
  selo: "Análises",

  /** A frase com o período em negrito no meio. Ver `Trecho`, em forma.ts. */
  escopo: (p: Periodo): Trecho[] => [
    `Distribuição de resultados, médias de odd e lucro por esporte e por casa ${p.prefixo} `,
    { forte: p.nome },
    ".",
  ],

  distribuicao: {
    titulo: (aba: string) => `Distribuição de Resultados (${aba})`,

    /**
     * A frase muda com o dado: sem nenhuma anulada, a rosca não desenha a
     * quarta fatia, e prometer quatro proporções seria descrever uma rosca que
     * não está ali.
     */
    descricao: (temAnuladas: boolean) =>
      temAnuladas
        ? "Proporção entre Green, Red, Pendentes e Anuladas"
        : "Proporção entre Green, Red e Pendentes",

    /**
     * A rosca falada: os quatro números e o total numa frase só.
     *
     * Diz "anuladas" onde a legenda diz "Void (anulada)", e o total não tem
     * singular — as duas coisas estão no topo do arquivo.
     */
    aria: (d: {
      greens: string;
      reds: string;
      pendentes: string;
      anuladas: string;
      total: string;
    }) =>
      `${d.greens} green, ${d.reds} red, ${d.pendentes} pendentes, ` +
      `${d.anuladas} anuladas, de ${d.total} apostas`,

    /** O rótulo sob o número no meio da rosca. Cabeçalho, não contagem. */
    total: "Apostas",

    /** Os quatro rótulos da legenda, na ordem em que ela os desenha. */
    legenda: {
      green: "Green (Vitórias)",
      red: "Red (Perdas)",
      pendente: "Pendente",
      void: "Void (anulada)",
    },

    /** O valor de uma linha da legenda: "423 (38%)". */
    linha: (n: string, porcento: number) => `${n} (${porcento}%)`,
  },

  odds: {
    titulo: (aba: string) => `Médias de Odd (${aba})`,
    descricao: "Comparativo entre apostas ganhas e perdidas",

    /**
     * Os três blocos, cada um com o rótulo e a contagem embaixo.
     *
     * "tip" e não "aposta" de propósito: é a palavra que o grupo usa, e ela já
     * aparece assim no cabeçalho curto das tabelas desta tela.
     */
    green: "Apostas com GREEN",
    greenSub: (n: number) => contagem(n, "tip acertada", "tips acertadas"),
    red: "Apostas com RED",
    redSub: (n: number) => contagem(n, "tip perdida", "tips perdidas"),
    geral: "Média Geral",
    geralSub: (n: number) => contagem(n, "tip no total", "tips no total"),

    /** Quando não há odd para mostrar. Travessão, como o resto do site. */
    semValor: "—",
  },

  esportes: {
    aria: "Ver todos os esportes em detalhe",
    titulo: "Top Esportes",
    descricao: (p: Periodo) => `Rentabilidade por esporte ${p.prefixo} ${p.nome}`,
    vazio: "Sem dados de categoria neste período.",
    roi: (roi: string) => `ROI ${roi}`,
  },

  casas: {
    aria: "Ver todas as casas em detalhe",
    titulo: "Top Casas",
    descricao: "Lucro e ROI por casa — a barra mostra o volume",
    vazio: "Sem dados de casas neste período.",
    linha: (d: { apostas: number; roi: string }) =>
      `${contagem(d.apostas, "aposta", "apostas")} · ROI ${d.roi}`,
  },

  /**
   * O que as duas tabelas de detalhe dizem igual.
   *
   * Compartilhado porque é a mesma coluna nas duas, e não por economia: o dia
   * em que "Resultado" mudar de palavra, tem de mudar nas duas juntas, ou a
   * tabela de esportes e a de casas passam a chamar a mesma coisa de dois
   * nomes. As colunas que **diferem** ficam com cada uma.
   */
  tabela: {
    /**
     * "Tips" no celular, "Apostas" acima dele.
     *
     * O cabeçalho por extenso mandava na largura da coluna, e a tabela precisa
     * caber na caixa do diálogo sem rolagem lateral. "Tips" é a palavra que o
     * resto do site já usa para a mesma coisa.
     */
    apostasCurto: "Tips",
    apostas: "Apostas",
    roi: "ROI",
    resultado: "Resultado",
    fechar: "Fechar",
  },

  detalheDosEsportes: {
    rotulo: (p: Periodo) => `Todos os esportes ${p.prefixo} ${p.nome}`,
    titulo: "Todos os esportes",
    resumo: (n: number, p: Periodo) =>
      `${contagem(n, "modalidade", "modalidades")} ${p.prefixo} ${p.nome}`,
    esporte: "Esporte",
    acerto: "Acerto",
  },

  detalheDasCasas: {
    rotulo: (p: Periodo) => `Todas as casas ${p.prefixo} ${p.nome}`,
    titulo: "Todas as casas",
    resumo: (n: number, p: Periodo) =>
      `${contagem(n, "casa", "casas")} ${p.prefixo} ${p.nome}`,
    casa: "Casa",
    apostado: "Apostado",
  },
} as const;

/** O acessador. É a única linha desta seção que a #128 vai mexer. */
export function textoDasEstatisticas() {
  return ESTATISTICAS;
}
