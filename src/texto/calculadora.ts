import type { Trecho } from "./forma";

/**
 * O texto da calculadora de valor esperado (#71).
 *
 * A maior tela do site e a última da #127: noventa e oito entradas — chaves que
 * carregam texto, sem contar os grupos —, doze frases com trecho destacado no
 * meio e quatro modos que compartilham dois blocos de campos.
 *
 * ## Rótulo que também é valor, outra vez
 *
 * O modo vai para o endereço — `/calculadora?modo=hold` — e volta por
 * `escolher()`. Os quatro `id` são valor e os quatro rótulos são texto, como as
 * janelas do Painel. Aqui a separação já existia no código (`MODOS` tinha `id`
 * e `rotulo` lado a lado); o que mudou é que só o rótulo saiu, e o mapa é
 * indexado pelo próprio tipo `Modo`, então modo sem rótulo não compila.
 *
 * ## O que ficou de fora, e por quê
 *
 * `FRACOES_DE_KELLY` e `PASSOS_DA_SUREBET`, em `lib/calculadora.ts`, carregam
 * um `rotulo` cada: "1/8", "1/4", "1/2", "Inteiro", "Centavo", "R$ 1", "R$ 5".
 * São texto de interface morando numa biblioteca de contas, e **não** saíram
 * daqui. Tirá-los pede mudar o tipo das duas constantes, que é mudança de
 * código e não de texto, e `src/lib` tem catorze arquivos no mesmo caso — vale
 * decidir a forma uma vez, para os catorze. Está na #151.
 *
 * ## Duas repetições de propósito
 *
 * **"Onde você vai apostar" é um bloco só, usado por três modos.** A descrição
 * é compartilhada entre "Odd justa" e "Hold" porque ali é literalmente o mesmo
 * bloco com o mesmo campo; "Múltiplas" tem a sua, porque fala da odd total.
 *
 * **"Casa de referência" é o mesmo título com descrições diferentes.** Em "Odd
 * justa" ele pede as odds de todos os resultados; em "Hold", uma odd e a
 * margem. Mesmo título, trabalhos diferentes — por isso o título está uma vez
 * e cada modo traz a sua descrição.
 */

const CALCULADORA = {
  /** Os dois parágrafos da página, em volta do componente. */
  pagina: {
    intro:
      "Descubra se uma odd paga mais do que a probabilidade real justifica, e quanto " +
      "apostar nela. A margem da casa sai da conta, o que sobra é a odd justa, e o " +
      "critério de Kelly diz a stake em unidades.",
    aviso:
      "A calculadora faz conta, não previsão. Valor esperado positivo quer dizer que a " +
      "odd paga mais do que a probabilidade estimada pela casa de referência, não que a " +
      "aposta vai dar green. Aposte apenas o que você pode perder.",
  },

  /**
   * Os rótulos dos quatro modos: mapa de **valor para rótulo**.
   *
   * A chave é o que vai ao endereço e volta dele. Ver o topo do arquivo.
   */
  modos: {
    justa: "Odd justa",
    hold: "Hold",
    surebet: "Surebet",
    multipla: "Múltiplas",
  },
  ariaDosModos: "Modo da calculadora",

  dados: { titulo: "Dados da aposta", limpar: "Limpar" },

  resultado: {
    titulo: "Resultado",
    espera: "Preencha as odds para ver o resultado.",
  },

  campo: {
    exemplo: (valor: string) => `ex.: ${valor}`,

    /**
     * O aviso de campo mal preenchido, um por tipo de campo.
     *
     * A chave é o `TipoDeCampo` de `lib/digitacao.ts`: tipo novo sem aviso não
     * compila.
     */
    erro: {
      odd: "Use um número maior que 1, como 1,85.",
      porcentagem: "Use uma porcentagem entre 0 e 100, como 4 ou 4,5.",
      reais: "Use um valor em reais, como 100 ou 1.000.",
      unidades: "Use um número de unidades maior que zero.",
    },

    /** Quando ainda não há odd para comparar. Travessão, como o resto do site. */
    semOdd: "—",
  },

  mercado: {
    quantos: (n: number) => `${n} resultados`,
    aria: "Resultados do mercado",
    analisada: "Odd analisada",
    /** Com dois resultados só há uma contrária, e ela não leva número. */
    contraria: "Odd contrária",
    contrariaNumerada: (i: number) => `Odd contrária ${i}`,
    encontrada: "Odd encontrada",
    oddJusta: "Odd justa",
  },

  ajuda: { titulo: "Como usar", exemplo: "Preencher com o exemplo" },

  veredito: {
    comValor: "Aposta de valor",
    semValor: "Sem valor",

    /** Dois valores destacados, os dois com o mesmo desenho. */
    frase: (d: { aposta: string; retorno: string; oddJusta: string }): Trecho[] => [
      `Valor esperado. A cada ${d.aposta} apostados nessa odd, o retorno médio é de `,
      { forte: d.retorno },
      ". Tem valor qualquer odd acima de ",
      { forte: d.oddJusta },
      ".",
    ],
  },

  stake: {
    titulo: "Stake recomendada",

    /**
     * "Kelly 1/4", "Kelly inteiro".
     *
     * A fração chega em minúscula porque o ponto de chamada a rebaixa — o
     * rótulo "Inteiro" vira "inteiro" no meio da frase. Enquanto os rótulos
     * estiverem em `lib/calculadora.ts` (ver o topo), é lá que essa maiúscula
     * mora.
     */
    kelly: (fracao: string) => `Kelly ${fracao}`,

    semBanca: "Informe o tamanho da banca em unidades para ver a stake.",

    linha: (d: { daBanca: string; emReais: string; unidade: string }): Trecho[] => [
      `${d.daBanca} da banca · `,
      { forte: d.emReais },
      ` com 1u = ${d.unidade}`,
    ],

    alta: (limite: string) =>
      `Mais de ${limite} da banca numa aposta só. Valor esperado desse tamanho ` +
      "costuma ser odd digitada errada ou mercado que a casa ainda vai corrigir: " +
      "confira antes.",

    zero: "Sem valor esperado positivo, o Kelly manda não apostar.",

    fracao: "Fração do Kelly",
    banca: "Banca",
    /** O "u" dentro do campo da banca, que o leitor de tela não anuncia. */
    sufixoDaBanca: "u",
    ajudaDaBanca:
      "Banca em unidades. Com 100u, 1u é 1% da banca. Um quarto do Kelly é o mais " +
      "usado: a probabilidade é estimada, e o Kelly inteiro faz a banca oscilar demais.",
  },

  /** A odd justa sozinha, enquanto falta a odd onde se vai apostar. */
  faltaAOdd: {
    titulo: "Odd justa",
    frase: (d: { campo: string; oddJusta: string }): Trecho[] => [
      `Falta ${d.campo}. Qualquer odd acima de `,
      { forte: d.oddJusta },
      " tem valor.",
    ],
    aEncontrada: "a odd encontrada",
    aDaMultipla: "a odd da múltipla",
  },

  /** A linha que só aparece no celular, entre os campos e o resultado. */
  resumo: {
    ver: "Ver resultado",
    comValor: (d: { valor: string; unidades: string }) =>
      d.unidades ? `${d.valor} de valor · ${d.unidades}` : `${d.valor} de valor`,
    semValor: (valor: string) => `Sem valor: ${valor}`,
  },

  detalhes: {
    oddJusta: "Odd justa",
    probabilidade: "Probabilidade",
    margem: "Margem da casa",
    payout: "Payout",
  },

  /** O bloco da odd onde se vai apostar. Três modos, dois textos. */
  onde: {
    titulo: "Onde você vai apostar",
    descricao:
      "A odd que outra casa paga pelo mesmo resultado. Tem valor quando passa da odd " +
      "justa.",
    descricaoDaMultipla:
      "A odd total que a casa paga pela múltipla. Tem valor quando passa da odd justa, " +
      "que é a das seleções multiplicadas.",
  },

  /** O bloco da casa que serve de referência. Mesmo título, dois trabalhos. */
  referencia: {
    titulo: "Casa de referência",
    descricaoDaJusta:
      "As odds de todos os resultados do mercado numa casa de margem baixa. A primeira " +
      "é a do resultado em que você quer apostar.",
    descricaoDoHold:
      "Para quando você só tem a odd de um lado: a odd do resultado e a margem que essa " +
      "casa costuma cobrar no mercado.",
  },

  justa: {
    /** O "todos" vai destacado, e é o ponto da frase. */
    ajuda1: (): Trecho[] => [
      "Pegue as odds de ",
      { forte: "todos" },
      " os resultados de um mercado numa casa de margem baixa, que serve de referência. " +
        "A calculadora tira a margem dela e chega à probabilidade real de cada resultado.",
    ],
    ajuda2:
      "Depois compare com a odd que você achou em outra casa. Se ela pagar mais que a " +
      "odd justa, a aposta tem valor.",
    ajuda3:
      "Exemplo com 1X2: casa de referência com 2,00 / 3,40 / 3,60 e 2,50 encontrada " +
      "para o mandante.",
  },

  hold: {
    base: "Odd de referência",
    margem: "Hold (margem da casa)",
    /** O "%" dentro do campo, que o leitor de tela não anuncia. */
    sufixo: "%",
    /** As aspas são curvas de propósito: é o nome de um modo citado na frase. */
    ajuda1:
      "A odd justa é a odd de referência mais a margem da casa. A margem que o modo " +
      "“Odd justa” mostra pode ser digitada aqui: com a mesma odd, as duas contas " +
      "chegam à mesma odd justa.",
    ajuda2: "Exemplo: odd de referência 1,90 com hold de 4% e 2,10 encontrada.",
  },

  surebet: {
    odds: {
      titulo: "Odds do mercado",
      descricao: "Uma odd por resultado, cada uma da casa que paga mais por ele.",
    },
    odd: (i: number) => `Odd do resultado ${i}`,

    investir: {
      titulo: "Quanto investir",
      descricao:
        "O total que você quer dividir entre os resultados. Aposta em reais redondos " +
        "chama menos a atenção da casa do que aposta quebrada em centavos.",
    },
    investimento: "Investimento total (R$)",
    arredondar: "Arredondar apostas",

    selo: {
      existe: "Surebet",
      semLucro: "Surebet sem lucro",
      naoHa: "Não há surebet",
    },

    /**
     * As odds fecham abaixo de 100%, mas o arredondamento come o lucro.
     *
     * Dois pedaços entram e saem com o arredondamento, no meio da frase: por
     * isso ela é uma lista, e não duas frases com um `se` em volta.
     */
    semLucro: (d: {
      soma: string;
      investimento: string;
      arredondado: boolean;
    }): Trecho[] => [
      "As odds somam ",
      { forte: d.soma },
      ` de probabilidade, então a surebet existe. Mas, com ${d.investimento}`,
      d.arredondado ? " e as apostas arredondadas" : "",
      ", o arredondamento come o lucro inteiro. Aumente o investimento",
      d.arredondado ? " ou arredonde ao centavo" : "",
      ".",
    ],

    /**
     * Dois números destacados e desenhados diferente: a soma sai neutra, o
     * dinheiro que se perderia sai em vermelho. É o caso do papel `perda`.
     */
    naoHa: (d: { soma: string; perda: string }): Trecho[] => [
      "As odds somam ",
      { forte: d.soma },
      " de probabilidade. Para existir surebet, a soma precisa ficar abaixo de 100%. " +
        "Dividindo o valor entre os resultados, você perderia ",
      { forte: d.perda, papel: "perda" },
      " saia o que sair.",
    ],

    lucro: (d: {
      lucro: string;
      maximo: string;
      temMaximo: boolean;
      investido: string;
      temInvestido: boolean;
    }): Trecho[] => [
      "Lucro garantido de ",
      { forte: d.lucro },
      ", saia o que sair",
      ...(d.temMaximo
        ? ([", e de até ", { forte: d.maximo }, ", conforme o resultado"] as Trecho[])
        : []),
      ".",
      ...(d.temInvestido
        ? ([
            " Com o arredondamento, o total apostado é de ",
            { forte: d.investido },
            ".",
          ] as Trecho[])
        : []),
    ],

    tabela: {
      legenda: "Quanto apostar em cada resultado",
      resultado: "Resultado",
      odd: "Odd",
      apostar: "Apostar",
      retorno: "Retorno",
    },

    resumo: {
      comLucro: (d: { roi: string; lucro: string }) =>
        `Surebet de ${d.roi}: ${d.lucro} garantidos`,
      semLucro: "Surebet sem lucro com este arredondamento",
      naoHa: "Não há surebet",
    },

    ajuda1:
      "Surebet é quando casas diferentes pagam tão bem os resultados de um mesmo " +
      "mercado que dá para apostar em todos e lucrar saia o que sair. Cada odd vem da " +
      "casa que paga mais por aquele resultado.",
    ajuda2:
      "A calculadora divide o investimento para o retorno ser igual em qualquer " +
      "resultado. Arredondado, o retorno varia um pouco de um resultado para outro; o " +
      "lucro garantido é o menor deles.",
    ajuda3: "Exemplo: R$ 100 em mais/menos, com 2,08 numa casa e 2,02 na outra.",
  },

  multipla: {
    selecoes: {
      titulo: "Seleções",
      descricao:
        "Para cada seleção, as odds de todos os resultados do mercado na casa de " +
        "referência. A primeira é a do resultado que entra na múltipla.",
    },

    /** O número da seleção. Sai duas vezes: na legenda falada e no rótulo visto. */
    selecao: (i: number) => `Seleção ${i}`,
    resultadosDaSelecao: (i: number) => `Resultados do mercado da seleção ${i}`,
    remover: (i: number) => `Remover a seleção ${i}`,

    /** A odd justa da seleção, no canto do campo. */
    oddJustaDaSelecao: (odd: string): Trecho[] => ["Odd justa ", { forte: odd }],

    adicionar: "Adicionar seleção",
    odd: "Odd da múltipla",

    /** A mesma odd justa na lista do resultado, agora em minúscula. */
    oddJustaNaLista: (odd: string) => `odd justa ${odd}`,

    /** As aspas são curvas de propósito, como no Hold. */
    ajuda1:
      "A calculadora acha a odd justa de cada seleção, como no modo “Odd justa”, e " +
      "multiplica. Depois compara com a odd que a casa paga pela múltipla.",
    ajuda2:
      "Vale para seleções de jogos diferentes: na mesma partida (criar aposta) os " +
      "resultados se influenciam, e multiplicar deixa de ser a conta certa.",
    ajuda3:
      "Exemplo: um mais/menos a 1,90 / 1,90 e um 1X2 a 2,00 / 3,40 / 3,60, pagos a 4,60.",
  },
} as const;

/** O acessador. É a única linha desta seção que a #128 vai mexer. */
export function textoDaCalculadora() {
  return CALCULADORA;
}
