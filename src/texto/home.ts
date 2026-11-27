/**
 * O texto de `src/app/page.tsx`, a home.
 *
 * Quarenta e três entradas, seis delas montadas, tiradas das 372 linhas de
 * `src/app/page.tsx`.
 *
 * É a última rota do site a entrar na camada de texto, e a primeira que não é
 * tela de dados: quase tudo aqui é prosa de captação, escrita para convencer,
 * e não rótulo de número.
 *
 * ## O que esta seção não cobre
 *
 * **O título do hero.** "Suas apostas merecem / matemática de verdade." mora em
 * `TITULO_DA_HOME`, em `src/lib/constants.ts`, porque sai em dois lugares: aqui
 * e na imagem de preview de link (`src/app/opengraph-image.tsx`). É o mesmo
 * caso que `src/lib/perguntas.ts` já era antes desta issue — texto que ficou
 * fora do componente por ter dois consumidores —, e a decisão sobre ele é da
 * #151, junto com os outros catorze arquivos de `src/lib`.
 *
 * **Três componentes**, que trazem texto próprio e não recebem literal nenhum
 * da página: `Telegram` (o bloco de conversão inteiro, que é o maior pedaço de
 * texto desta tela), `CarrosselProfundidade` (o contador "01 / 05") e
 * `animacoes` (`TextoQueCai`, `Revelar`, `EntradaSequencial`, que só embrulham).
 *
 * ## Rótulo que também é valor, outra vez
 *
 * A prévia do Painel desenha uma barra de endereço falsa com `/painel` escrito
 * dentro. O mesmo `/painel` é o `href` do botão "Ver os resultados", vinte
 * linhas acima. Um é texto na tela, o outro é destino — e a #128 **renomeia as
 * rotas**, pondo-as sob um segmento de idioma e com nome em inglês. No dia em
 * que `/painel` virar outra coisa, os dois mudam, e só um deles dá erro se
 * ficar para trás: o `href` quebra o link, a barra falsa continua mentindo
 * calada. Por isso o texto está aqui, e o `href` continua no JSX, onde o Next
 * o confere.
 *
 * ## O plural que **não** pode usar a `contagem`
 *
 * A faixa de números escreve "5 dias com aposta" — mas o número e a palavra
 * moram em elementos diferentes: o número vai num `<span>` com fonte mono e
 * peso forte, e a palavra é nó de texto irmão. `contagem` de `forma.ts`
 * devolveria os dois juntos numa string só, e o número perderia a fonte e o
 * peso. É a mesma palavra, o mesmo plural, e a função certa é outra: aqui só o
 * substantivo é texto, e ele escolhe o plural sozinho.
 *
 * Vale para `numeros.dias` e para mais nada nesta tela.
 *
 * ## O ramo que ninguém vê
 *
 * A prévia do Painel tem duas saídas: com números da planilha, e sem. O "sem"
 * escreve "—", "histórico completo", "sobre apostas finalizadas" e "lucro sobre
 * o total apostado", e só aparece quando a leitura da planilha falha —
 * `carregarResumo` devolve `null` e a home deixa de afirmar número nenhum.
 *
 * No modo demonstração a planilha nunca falha, então a suíte de tela **não
 * alcança esse ramo**. As quatro entradas estão travadas no teste de unidade, e
 * é lá que elas vão ficar vermelhas.
 *
 * ## Três repetições que ficam
 *
 * "Taxa de Acerto" já está em `painel.ts` e em `apostas.ts`, e "odd média" nos
 * dois últimos: a prévia desta tela é um retrato do Painel, então repete os
 * rótulos dele de propósito. Ficam separadas porque são telas diferentes com
 * ciclos diferentes — mudar o Painel não deve mexer na vitrine sem alguém
 * decidir isso.
 */

const HOME = {
  /** O selo acima do título, com os quatro assuntos separados por ponto médio. */
  selo: "Análise · Dados · Apostas · Resultados",

  /** O parágrafo que explica o site numa frase. */
  chamada:
    "O GeogeTips transforma dados brutos em decisões inteligentes. Registre, " +
    "acompanhe e analise cada aposta com a clareza de quem usa números — não achismo.",

  /** O segundo botão do hero. O primeiro é o do Telegram, e é do componente. */
  verResultados: "Ver os resultados",

  /** A linha miúda embaixo dos botões. */
  promessa: "Entrada gratuita pelo Telegram · resultados abertos na planilha pública",

  /**
   * A faixa de cinco números, que só aparece quando há dado real.
   *
   * Em cada par, o número vai num elemento próprio e aqui fica só a palavra ao
   * lado dele — ver o topo do arquivo sobre `dias`.
   */
  numeros: {
    apostas: (desde: string) => `apostas registradas desde ${desde}`,
    /** Sem período legível, a frase encurta em vez de inventar uma data. */
    apostasSemPeriodo: "apostas registradas",
    dias: (dias: number) => (dias === 1 ? "dia com aposta" : "dias com aposta"),
    acerto: "taxa de acerto",
    roi: "de ROI",
    /** O único "número" desta faixa que não é medido: é promessa, não medida. */
    bot: "24/7",
    botRotulo: "bot automático",
  },

  /**
   * A prévia do Painel: uma janela falsa com três cartões.
   *
   * Cada cartão tem duas saídas — com dado da planilha e sem. As quatro do
   * "sem" não aparecem na suíte de tela; ver o topo do arquivo.
   */
  previa: {
    /** O que a barra de endereço falsa escreve. Ver o topo do arquivo. */
    endereco: "/painel",

    lucro: {
      titulo: "Lucro Acumulado",
      unidades: (unidades: string) => `${unidades}u acumuladas`,
      semDado: "histórico completo",
    },
    acerto: {
      titulo: "Taxa de Acerto",
      placar: (d: { greens: string; reds: string }) =>
        `${d.greens} green · ${d.reds} red`,
      semDado: "sobre apostas finalizadas",
    },
    roi: {
      titulo: "ROI",
      oddMedia: (odd: string) => `odd média ${odd}`,
      semDado: "lucro sobre o total apostado",
    },

    /** Sem planilha não há número: o traço, como no Painel e no Histórico. */
    semValor: "—",
  },

  funcionalidades: {
    selo: "Funcionalidades",

    /**
     * O título em duas linhas, com `<br>` entre elas.
     *
     * Duas entradas, e não uma frase com marcação dentro: a quebra é decisão de
     * desenho, e cada idioma precisa poder decidi-la de novo — a frase pode ter
     * outro comprimento e querer quebrar noutro ponto, ou não quebrar. Quem
     * traduzir mexe nas duas e escolhe onde parte.
     */
    titulo: ["Tudo que você precisa,", "nada que não precisa."],

    /**
     * Os cinco cartões. A ordem, o ícone e a cor ficam na página: são desenho.
     * Aqui mora só o que se lê.
     */
    registro: {
      titulo: "Registro automático",
      texto:
        "Cada entrada enviada no canal vira uma linha na planilha automaticamente, " +
        "com partida, mercado, odd e valor. Sem digitação manual e sem esquecer nenhuma.",
    },
    planilha: {
      titulo: "Planilha Sincronizada",
      texto:
        "A planilha no Google Sheets continua viva e é a fonte de tudo que aparece " +
        "aqui — aberta para conferência linha a linha.",
    },
    adms: {
      titulo: "Análise por Adm",
      texto:
        "Descubra quem realmente coloca dinheiro no seu bolso e quem dá prejuízo, " +
        "com acerto, volume e ROI de cada um.",
    },
    banca: {
      titulo: "Gestão de Banca",
      /** O único cartão com valor dentro: a unidade do grupo, já formatada. */
      texto: (unidade: string) =>
        `Controle por unidades (1u = ${unidade}), com travas de segurança e limites ` +
        "máximos. Ajuste a unidade para a sua banca e veja o histórico na sua escala.",
    },
    estatisticas: {
      titulo: "Estatísticas Completas",
      texto:
        "Lucro por esporte, casa, odds médias e ROI real — mês a mês, incluindo os " +
        "meses negativos.",
    },
  },

  passos: {
    selo: "Como Funciona",
    titulo: "Três passos. Sem complicação.",

    /** Os três, na ordem em que a página os numera. O numeral é desenho. */
    entrada: {
      titulo: "A entrada chega",
      texto: "O adm envia a aposta no canal do Telegram, com a casa, o mercado e a odd.",
    },
    registro: {
      titulo: "Entra na planilha",
      texto:
        "Toda entrada é registrada na hora — green, red ou anulada. Nada fica de fora.",
    },
    conferencia: {
      titulo: "Você confere",
      texto:
        "Os números deste site saem dessa planilha, que fica aberta para consulta a " +
        "qualquer momento.",
    },

    link: "Outras dúvidas frequentes",
  },
} as const;

/** O acessador. É a única linha desta seção que a #128 vai mexer. */
export function textoDaHome() {
  return HOME;
}
