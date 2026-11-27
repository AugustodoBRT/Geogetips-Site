import { contagem, type Periodo, type Trecho } from "./forma";

/**
 * O texto da tela do Painel.
 *
 * Oitenta e seis entradas, tiradas de três arquivos: as 1513 linhas de
 * `src/app/painel/page.tsx`, as 278 de `components/BlocoDeRisco.tsx` e as 313
 * de `components/CalendarioDeLucro.tsx`. Uma delas é lista de sete pares — os
 * dias da semana —, então as oitenta e seis somam noventa e nove frases. Nove
 * são montadas por ternário porque mudam quando há intervalo de datas na tela.
 *
 * Os dois blocos entraram aqui, e não em arquivo próprio, porque aparecem **só
 * nesta tela**: a regra que este diretório segue é um arquivo por tela, e
 * `controles.ts` e `telegram.ts` são arquivo próprio justamente por serem o
 * contrário — texto que aparece em várias.
 *
 * ## Quando a entrada recebe número e quando recebe texto já formatado
 *
 * Recebe **número** a frase que tem palavra no plural: só ela precisa escolher
 * entre "1 aposta" e "2 apostas", e é `contagem` quem decide. Recebe **texto**
 * a que só emenda um valor já pronto — `dias.valor` com "3 de 5", `fase.entre`
 * com "1,00u". Formatar dinheiro, porcentagem e unidade é de `lib/format.ts`, e
 * não deste diretório.
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
 * **Quatro grafias de "maior queda", e agora todas neste arquivo.** O selo do
 * gráfico escreve "maior queda" em minúscula, o `title` dele "Maior queda de um
 * pico...", o `aria-label` da curva "Maior queda: ", e o cartão do bloco
 * Atenção "Maior queda" — que a tela imprime em caixa alta por CSS, "MAIOR
 * QUEDA". Com o bloco aqui dentro, as quatro ficaram visíveis de uma vez em
 * `grafico` e `risco`; antes a última morava noutro arquivo e a divergência não
 * aparecia a quem lesse só este. Quem uniformizar muda a saída de pelo menos
 * uma, e mexe em `e2e/risco.spec.ts`, que acha o selo pelo `title`.
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

/**
 * Os dois fins do nome acessível de um dia do calendário.
 *
 * Ficam fora do dicionário porque **duas** entradas dele os usam: `calendario.dia`
 * os cola no fim da frase, e `calendario.hoje` sai sozinho na célula que não é
 * link. Uma fonte só para cada um, e não uma cópia em cada lugar.
 */
const DIA_DE_HOJE = ", hoje";
const FORA_DO_PERIODO = ", fora do período escolhido";

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

  /**
   * O bloco Atenção: como a banca se comportou no caminho (#68, #80).
   *
   * ## Uma frase para as duas fases
   *
   * O cartão da maior queda escreve "1,00u, de 25/08 a 26/08", e o da maior
   * alta "5,11u, de 23/08 a 27/08". Mesma frase, com os mesmos papéis: um
   * valor, um começo e um fim. A queda vai do pico ao vale e a alta do vale ao
   * pico — mas isso é **qual ponta é qual**, decisão do componente, não do
   * texto. Por isso `fase` é uma entrada só, usada pelos dois.
   *
   * É o contrário do que este arquivo faz com `esportes.linha` e
   * `ranking.linha`: lá a frase igual descreve sujeitos diferentes — uma
   * modalidade e uma pessoa — e pode divergir sem que nada esteja errado. Aqui
   * o sujeito é o mesmo, um trecho da curva, dito duas vezes.
   *
   * ## As quatro vezes de "Nenhuma"
   *
   * Quatro cartões podem não ter o que mostrar — queda, alta, red e green —, e
   * os quatro escrevem a mesma palavra. Uma entrada só, de propósito: é a mesma
   * ausência. Quem precisar de palavra diferente por cartão parte a entrada, e
   * o teste que a trava avisa que havia quatro pontos de uso.
   *
   * ## Um ramo que a suíte de tela não alcança
   *
   * `dias.zero` só aparece com um dia de lucro exatamente zero no recorte, e o
   * mock não tem nenhum. Ficou travado na suíte de unidade, conferido letra por
   * letra contra o componente de antes.
   */
  risco: {
    titulo: "Atenção",

    /**
     * O recorte da tela em palavras, que a página calcula e passa por prop.
     *
     * Mora aqui, e não solto no alto do arquivo, porque é frase deste bloco e
     * de mais nenhum — mesmo sendo a página quem a monta.
     */
    recorte: (r: Recorte) =>
      r.comIntervalo ? `${r.aba.nome} (${r.intervalo})` : r.aba.nome,

    descricao: (recorte: string) =>
      `Como a banca se comportou durante ${recorte}: o tamanho das fases boas e ` +
      "ruins; não só aonde o grupo chegou.",

    vazio: "Sem apostas fechadas neste recorte.",

    /** O valor dos quatro cartões que podem não ter o que mostrar. */
    nenhuma: "Nenhuma",

    /** O trecho da curva, nos dois sentidos. Ver o topo desta seção. */
    fase: {
      entre: (d: { valor: string; de: string; ate: string }) =>
        `${d.valor}, de ${d.de} a ${d.ate}`,
      doInicio: (d: { valor: string; ate: string }) =>
        `${d.valor}, do início até ${d.ate}`,
    },

    queda: { rotulo: "Maior queda", vazio: "A curva não caiu neste recorte" },
    alta: { rotulo: "Maior alta", vazio: "A curva não subiu neste recorte" },

    piorDia: "Pior dia",
    melhorDia: "Melhor dia",
    /** O que vem depois da data, no cartão do pior e do melhor dia. */
    apostasDoDia: (apostas: number) => ` · ${contagem(apostas, "aposta", "apostas")}`,

    red: { rotulo: "Maior red", vazio: "Nenhuma red neste recorte" },
    green: { rotulo: "Maior green", vazio: "Nenhuma green neste recorte" },
    /** Red e green medem uma aposta, e não um dia como os cartões ao lado. */
    umaAposta: "numa aposta só",

    dias: {
      rotulo: "Dias no verde",
      valor: (d: { verde: string; total: string }) => `${d.verde} de ${d.total}`,
      vermelho: (dias: string) => `${dias} no vermelho`,
      /** Só quando há dia zerado no recorte. Ver o topo desta seção. */
      zero: (dias: string) => `, ${dias} no zero`,
    },

    porDia: {
      rotulo: "Apostas por dia",
      media: (dias: number) => `média em ${contagem(dias, "dia", "dias")} com aposta`,
    },
  },

  /**
   * O calendário de lucro por dia (#67).
   *
   * ## Os sete dias, com nome e abreviação no mesmo par
   *
   * A coluna escreve "DOM" e o `abbr` dela diz "domingo" — é o que faz um
   * leitor de tela ler o dia inteiro ao andar pelas colunas. Os dois ficam no
   * mesmo par porque são o mesmo dia em dois tamanhos; separá-los em duas
   * listas obrigaria a tradução a casar sete abreviações com sete nomes pela
   * ordem, de memória.
   *
   * Os nomes dos **meses** não estão aqui: saem de `nomeDoMes`, em
   * `lib/calendario.ts`, junto da conta que monta a grade. São da #151.
   *
   * ## "Sem apostas com data neste período." aparece duas vezes
   *
   * A mesma frase está em `grafico.vazio`, e não foi compartilhada: uma é a
   * curva sem ponto para desenhar, a outra é o calendário sem mês para abrir.
   * Hoje dizem a mesma coisa, e o calendário pode passar a dizer "neste mês"
   * sem que a curva mude. É a política que este arquivo já aplica às linhas de
   * esportes e de adms.
   *
   * ## Três ramos que a suíte de tela não alcança
   *
   * As setas só aparecem com dois meses de aposta, `hoje` só num dia de hoje
   * com aposta, e `vazio` só num grupo sem aposta nenhuma — e o mock não tem
   * nenhum dos três. Ficaram travados na suíte de unidade, conferidos letra por
   * letra contra o componente de antes.
   */
  calendario: {
    titulo: "Lucro por dia",
    descricao:
      "Cada dia do mês, com os ruins à vista. Toque num dia para ver as apostas dele.",
    vazio: "Sem apostas com data neste período.",

    anterior: "Mês anterior",
    proximo: "Próximo mês",

    /** A legenda da tabela, só no áudio. */
    legenda: (mes: string) => `Lucro por dia em ${mes}`,

    /** Os sete dias: a abreviação da coluna e o nome que o `abbr` dela diz. */
    semana: [
      { curto: "Dom", nome: "domingo" },
      { curto: "Seg", nome: "segunda-feira" },
      { curto: "Ter", nome: "terça-feira" },
      { curto: "Qua", nome: "quarta-feira" },
      { curto: "Qui", nome: "quinta-feira" },
      { curto: "Sex", nome: "sexta-feira" },
      { curto: "Sáb", nome: "sábado" },
    ],

    /** O resultado em unidades, entre parênteses: "(9,35u)". */
    unidades: (valor: string) => `(${valor})`,

    /**
     * A contagem escrita na célula, a partir de `sm`.
     *
     * Entrada própria, e não a mesma de `risco.apostasDoDia`: aquela já vem com
     * o separador ` · ` na frente, porque lá a contagem vem depois da data.
     */
    apostas: (apostas: number) => contagem(apostas, "aposta", "apostas"),

    hoje: DIA_DE_HOJE,
    fora: FORA_DO_PERIODO,

    /**
     * O dia inteiro numa frase, para quem não vê a célula.
     *
     * Os dois fins da frase são as entradas `hoje` e `fora`, e não cópias
     * delas: `hoje` sai também sozinho, na célula que não é link.
     */
    dia: (d: {
      data: string;
      reais: string;
      unidades: string;
      apostas: number;
      hoje: boolean;
      fora: boolean;
    }) =>
      `${d.data}: ${d.reais} ${d.unidades} em ` +
      `${contagem(d.apostas, "aposta", "apostas")}` +
      `${d.hoje ? DIA_DE_HOJE : ""}${d.fora ? FORA_DO_PERIODO : ""}`,

    /**
     * O rodapé do mês, com o resultado destacado.
     *
     * Um destaque só, e por isso sem papel: quem decide como ele aparece é a
     * tela, que o pinta pelo sinal.
     */
    total: (d: {
      mes: string;
      reais: string;
      unidades: string;
      apostas: number;
      dias: number;
      comIntervalo: boolean;
    }): Trecho[] => [
      `Total de ${d.mes}: `,
      { forte: d.reais },
      ` ${d.unidades} · ${contagem(d.apostas, "aposta", "apostas")} em ` +
        `${contagem(d.dias, "dia", "dias")}`,
      d.comIntervalo ? ". Os dias fora do período escolhido aparecem sem cor" : "",
      ".",
    ],
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
