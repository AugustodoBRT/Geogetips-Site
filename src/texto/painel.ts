import { contagem, type Periodo, type Trecho } from "./forma";

/**
 * O texto da tela do Painel.
 *
 * Quarenta e nove entradas, tiradas das 1513 linhas de
 * `src/app/painel/page.tsx`, nove delas montadas por ternário porque a frase
 * muda quando há intervalo de datas na tela.
 *
 * ## O que esta tela tem e as outras não tinham
 *
 * **Rótulo que também é valor.** As cinco janelas do gráfico — `7D`, `30D`,
 * `90D`, `120D` e `Tudo` — são ao mesmo tempo o que se lê no botão e a chave
 * que o código compara, guarda em estado e **escreve no endereço** como
 * `?janela=Tudo`. Quatro delas são iguais em qualquer idioma; `Tudo` não é. Por
 * isso os rótulos moram em `grafico.janelas`, um mapa de **valor para rótulo**:
 * a chave fica no código, e só o lado direito viaja. Quem traduzir os dois
 * juntos quebra todo link já compartilhado — e quebra calado, porque
 * `escolher()` devolve `undefined` e a tela abre na janela que ela mesma
 * escolheu, sem erro nenhum.
 *
 * O mapa é indexado pela própria união de tipos da tela, então acrescentar uma
 * janela sem acrescentar o rótulo não compila. É a trava que um `?? chave`
 * não daria.
 *
 * **Homógrafo de dado.** O rodapé do cartão de apostas escreve "Green", "Red" e
 * "Void" com inicial maiúscula; a planilha escreve `GREEN`, `RED` e `VOID`, e
 * esses chegam à tela crus, como valor de `bet.resultado`. São palavras
 * parecidas com papéis opostos: as daqui são interface e estão neste arquivo,
 * as da planilha são dado e não entram. Usar uma entrada daqui numa comparação
 * — `bet.resultado === T.…` — faz a contagem de greens virar zero sem erro.
 *
 * ## Três inconsistências preservadas de propósito
 *
 * **Três grafias de "maior queda" na mesma seção.** O selo escreve "maior
 * queda" em minúscula, o `title` dele "Maior queda de um pico...", e o
 * `aria-label` do gráfico "Maior queda: ". O bloco Atenção, logo abaixo,
 * escreve "MAIOR QUEDA". Quem uniformizar muda a saída de pelo menos uma, e
 * mexe em `e2e/risco.spec.ts`, que acha o selo pelo `title`.
 *
 * **"Top Esportes" e "Top Casas" existem também em `estatisticas.ts`.** Os
 * mesmos dois títulos, em dois dicionários, para duas telas que mostram a mesma
 * coisa com profundidades diferentes. Ficam repetidos porque unificar agora
 * significaria uma seção comum sem terceiro consumidor; o dia em que uma mudar,
 * as duas têm de mudar.
 *
 * **`esportes.linha` e `ranking.linha` são a mesma frase.** "4 apostas · 75,0%
 * acerto", nos dois. Não foram compartilhadas: descrevem sujeitos diferentes —
 * uma modalidade e uma pessoa — e a frase igual é coincidência de hoje, não um
 * mesmo rótulo em dois lugares. `adms.ts` tem a terceira, com ROI no fim. Quem
 * unificar decide pelas três de uma vez.
 */

/**
 * O recorte que vale para a tela inteira: a aba, e o intervalo quando há um.
 *
 * `comIntervalo` vem separado de `intervalo` de propósito. Hoje os dois dizem a
 * mesma coisa — `rotuloDoPeriodo` devolve string vazia exatamente quando `de` e
 * `ate` estão vazios (`lib/date.ts`) —, e dava para inferir um do outro. Mas o
 * JSX decidia por `periodoAtivo`, e esta extração promete não mudar saída
 * nenhuma: manter o mesmo booleano deixa a promessa conferível, em vez de
 * apoiá-la numa equivalência que pode deixar de valer.
 */
type Recorte = {
  /** A aba dentro de uma frase. É o `trechoDaAba`, de `lib/constants.ts`. */
  aba: Periodo;
  /** O rótulo curto da aba, para título entre parênteses: "Geral" ou "Agosto26". */
  rotulo: string;
  /** Verdadeiro na aba que agrega todos os meses. */
  todasAsAbas: boolean;
  /** O `periodoAtivo` do JSX: há intervalo de datas na tela. */
  comIntervalo: boolean;
  /** O intervalo em palavras, ou vazio. É o `rotuloDoPeriodo`, de `lib/date.ts`. */
  intervalo: string;
};

const PAINEL = {
  /** O selo que só aparece quando a leitura veio mesmo da planilha. */
  selo: {
    rotulo: "Atualizado",
    desde: (relativo: string) => ` · ${relativo}`,
    titulo: (data: string) => `Leitura da planilha em ${data}`,
  },

  /**
   * A frase do cabeçalho, com **dois** trechos destacados de jeitos diferentes.
   *
   * O nome do período leva o destaque comum; o intervalo leva o papel
   * `recorte`, que esta tela desenha com `<strong>`. Ver `Trecho`, em forma.ts.
   *
   * `/apostas` tem a mesma frase na forma — "Feed cronológico de **Agosto26**
   * (24/08 a 26/08)." — e lá o parêntese **não** tem destaque nenhum. É a mesma
   * divergência de duas telas que o resto deste arquivo registra; quem extrair
   * `/apostas` encontra o outro lado dela.
   */
  escopo: (r: Recorte): Trecho[] => [
    `Métricas consolidadas, evolução real da banca e atividades ${r.aba.prefixo} `,
    { forte: r.aba.nome },
    ...(r.comIntervalo
      ? ([" (", { forte: r.intervalo, papel: "recorte" }, ")"] as Trecho[])
      : []),
    ".",
  ],

  /** O recorte que o bloco Atenção recebe já em palavras. */
  recorteDoRisco: (r: Recorte) =>
    r.comIntervalo ? `${r.aba.nome} (${r.intervalo})` : r.aba.nome,

  indicadores: {
    /**
     * O nome da região dos cinco cartões, e só no áudio.
     *
     * Sete arquivos de `e2e/` acham o Painel por este nome. Traduzir sem mexer
     * neles derruba a suíte da tela inteira — quebra larga, mas barulhenta, que
     * é o contrário das outras travas deste arquivo.
     */
    aria: "Indicadores do período",

    lucro: {
      titulo: (r: Recorte) => (r.comIntervalo ? "Lucro no Período" : "Lucro Acumulado"),
      rodape: (r: Recorte) =>
        r.comIntervalo
          ? `Resultado ${r.intervalo}`
          : r.todasAsAbas
            ? "Resultado de todos os meses"
            : `Resultado total em ${r.aba.nome}`,
    },

    roi: {
      titulo: "ROI",
      /** Leva a `/perguntas#roi`: o ROI daqui conta anuladas e pendentes. */
      rodape: "Lucro sobre o total apostado",
    },

    apostas: {
      titulo: "Total de Apostas",

      /**
       * "3 Green · 2 Red", com " · 1 Void" só quando há anulada.
       *
       * As três palavras são interface, e não os valores `GREEN`/`RED`/`VOID`
       * da planilha — ver o topo do arquivo.
       */
      rodape: (d: { greens: string; reds: string; voids: string; temVoids: boolean }) =>
        `${d.greens} Green · ${d.reds} Red${d.temVoids ? ` · ${d.voids} Void` : ""}`,
    },

    acerto: {
      titulo: "Taxa de Acerto",
      rodape: "Das apostas finalizadas",
    },

    pendentes: {
      titulo: "Apostas Pendentes",
      /** Zero pendência é a situação boa, e por isso tem frase própria. */
      rodape: (tem: boolean) =>
        tem ? "Aguardando resultado oficial" : "Tudo com resultado lançado",
    },
  },

  grafico: {
    titulo: (r: Recorte) => `Evolução da Banca (${r.rotulo})`,

    /** O que vem depois do valor no selo: espaço, e a janela entre parênteses. */
    seloDaJanela: (janela: string) => ` (${janela})`,

    queda: (valor: string) => `maior queda ${valor}`,
    tituloDaQueda: "Maior queda de um pico até o vale seguinte dentro da janela exibida",

    /**
     * A frase do ponto apontado na curva, com dois trechos destacados.
     *
     * O dia leva o destaque comum; o acumulado leva o papel `valor`, porque a
     * tela pinta esse número pelo sinal e não pode recebê-lo colado numa string
     * com o resto da frase.
     */
    ponto: (d: {
      dia: string;
      acumulado: string;
      noDia: string;
      apostas: number;
    }): Trecho[] => [
      "Dia ",
      { forte: d.dia },
      ": Acumulado ",
      { forte: d.acumulado, papel: "valor" },
      ` (${d.noDia} no dia · ${contagem(d.apostas, "aposta", "apostas")})`,
    ],

    /** O que o parágrafo diz enquanto ninguém aponta a curva. */
    semPonto: "Curva real calculada a partir de cada aposta registrada",

    vazio: "Sem apostas com data neste período.",

    /** A curva inteira numa frase, para quem não a vê. */
    aria: (d: {
      aba: Periodo;
      primeiroDia: string;
      ultimoDia: string;
      resultado: string;
      queda: string;
    }) =>
      `Evolução da banca ${d.aba.prefixo} ${d.aba.nome}, de ${d.primeiroDia} a ` +
      `${d.ultimoDia}. Resultado do período: ${d.resultado}. Maior queda: ${d.queda}.`,

    eixo: {
      milhar: (valor: string) => `R$ ${valor} mil`,
      exato: (valor: string) => `R$ ${valor}`,
      zero: "R$ 0",
    },

    /**
     * Os rótulos das janelas: mapa de **valor para rótulo**.
     *
     * A chave é código — estado, comparação e `?janela=` no endereço. Só o lado
     * direito é texto. Ver o topo do arquivo.
     */
    janelas: {
      "7D": "7D",
      "30D": "30D",
      "90D": "90D",
      "120D": "120D",
      Tudo: "Tudo",
    },
  },

  esportes: {
    titulo: "Top Esportes",
    link: "Detalhes",
    descricao: (r: Recorte) =>
      r.comIntervalo
        ? `Distribuição ${r.intervalo}`
        : "Distribuição por modalidades cadastradas",
    vazio: "Sem modalidades neste período.",
    linha: (d: { apostas: number; acerto: string }) =>
      `${contagem(d.apostas, "aposta", "apostas")} · ${d.acerto} acerto`,
  },

  casas: {
    titulo: "Top Casas",
    link: "Ver todas",
    descricao: (r: Recorte) =>
      r.comIntervalo
        ? `As mais usadas ${r.intervalo}`
        : `As mais usadas em ${r.aba.nome}`,
    vazio: "Sem casas neste período.",
    linha: (d: { apostas: number; roi: string }) =>
      `${contagem(d.apostas, "aposta", "apostas")} · ROI ${d.roi}`,
  },

  ultimas: {
    titulo: "Últimas Apostas Registradas",
    link: "Ver todas",
    descricao: (r: Recorte) =>
      r.comIntervalo
        ? `Apostas registradas ${r.intervalo}`
        : `As entradas mais recentes ${r.aba.prefixo} ${r.aba.nome}`,
    vazio: (r: Recorte) =>
      r.comIntervalo ? `Sem apostas ${r.intervalo}.` : "Sem apostas neste período.",
    /** Pendente e anulada não têm lucro para mostrar. Travessão, como o resto. */
    semLucro: "—",
  },

  ranking: {
    titulo: (r: Recorte) => `Ranking de Adms (${r.rotulo})`,
    link: "Detalhes",
    descricao: (r: Recorte) =>
      r.comIntervalo
        ? `Quem mais gerou retorno ${r.intervalo}`
        : `Quem mais gerou retorno em ${r.aba.nome}`,
    vazio: "Sem adms neste período.",
    linha: (d: { apostas: number; acerto: string }) =>
      `${contagem(d.apostas, "aposta", "apostas")} · ${d.acerto} acerto`,
    unidades: "Unidades",
  },
} as const;

/** O acessador. É a única linha desta seção que a #128 vai mexer. */
export function textoDoPainel() {
  return PAINEL;
}
