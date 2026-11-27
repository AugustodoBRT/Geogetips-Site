import type { BetResult } from "@/lib/types";
import { contagem, type Periodo, type Trecho } from "./forma";

/**
 * O texto de `src/app/apostas/page.tsx`.
 *
 * Cinquenta e duas entradas, onze delas montadas, tiradas das 1161 linhas de
 * `src/app/apostas/page.tsx`.
 *
 * É a seção mais amarrada à suíte de tela: **dez** arquivos de `e2e/` acham
 * botão, campo, cartão ou grupo por um rótulo que está aqui, e só o prefixo
 * "Ver detalhes: " responde por seis deles. Quase toda tradução daqui quebra
 * barulhento, que é o caso fácil — o silêncio desta tela está nas chaves, não
 * nos rótulos.
 *
 * ## O que esta seção **não** cobre
 *
 * A tela de apostas, essa não sai do português com este arquivo. A página
 * monta dez componentes que trazem texto próprio, e nenhum deles passa um
 * literal pela página — na árvore do JSX são tags de uma linha, então varredura
 * por string não os encontra:
 *
 * | componente | o que ainda escreve em português |
 * |---|---|
 * | `Telegram` | o maior bloco da tela: título, parágrafo, três linhas e dois botões |
 * | `DetalheAposta` | o diálogo inteiro, que é o que o cartão existe para abrir — inclusive o "Copiado!" que esta página acende pelo booleano `copied` |
 * | `FiltroPeriodo` | "Data inicial", "Data final", "Limpar intervalo de datas" e a frase do intervalo invertido |
 * | `SeletorMultiplo` | "{n} {substantivo}" e "Limpar filtro de {substantivo}", montadas com o substantivo que vem daqui |
 * | `SportBadge` | onze rótulos de esporte do catálogo |
 * | `BookieBadge` | o nome da casa do catálogo, e "— casa ainda não cadastrada" |
 * | `SeletorAba`, `SeletorGrupo`, `SeletorUnidade`, `AvisoDados` | os rótulos de cada controle |
 *
 * Os dois selos merecem o detalhe, porque é fácil tomá-los por dado: o valor da
 * planilha entra neles como **padrão de busca** e o que sai na tela é o rótulo
 * do catálogo. A planilha escreve `NBA` e o cartão desenha "Basquete";
 * `src/lib/padroes.ts` já registra que esses rótulos se traduzem e os padrões
 * não.
 *
 * Fica fora também o texto que a página copia para a área de transferência —
 * `"{partida} - {tip} @{odd} ({casa})"`. O código escreve o " - ", a arroba e
 * os parênteses, e alguém lê aquilo no Telegram; mas não vai à tela nem ao
 * áudio, que é o critério desta camada. Igual ao `CABECALHO` do CSV, em
 * `src/lib/csv.ts`: quem decidir que o critério é "o código escreve e alguém
 * lê" decide pelos dois juntos.
 *
 * ## Rótulo que também é valor
 *
 * **Dois mapas de valor para rótulo**, a mesma forma das janelas do Painel. Os
 * cinco rótulos do filtro de resultado e os quatro das faixas de odd: a chave é
 * código — estado, comparação e `?resultado=green` / `?odd=baixa` no endereço —
 * e só o lado direito é texto. Os dois são indexados pela união de tipos da
 * tela, então valor novo sem rótulo não compila.
 *
 * Quatro chaves do primeiro mapa vêm de `BetResult`, que é o vocabulário da
 * planilha: renomear uma delas não compila. A quinta, `TODAS`, é invenção
 * local, e é a **quebra calada** desta tela — `nomeDoArquivo`, em
 * `src/lib/csv.ts`, recebe o filtro como `string` e compara contra a palavra
 * `"TODAS"` escrita à mão. Renomear a sentinela compila, e o arquivo baixado
 * sem filtro passa a ganhar sufixo, sem erro e sem teste vermelho. Está na
 * #155; o mapa daqui não conserta, só deixa de espalhar mais uma cópia.
 *
 * **Homógrafo de dado**, o mesmo que `painel.ts` registra. Os botões de filtro
 * escrevem "Green", "Red", "Void" e "Pendente"; a pílula do cartão e a célula
 * da tabela escrevem `bet.resultado` **cru** — `GREEN`, `RED`, `VOID`,
 * `PENDENTE`, em caixa alta, como a planilha manda. Usar uma entrada daqui numa
 * comparação (`bet.resultado === T.resultado.rotulos.GREEN`) faz a contagem de
 * greens virar zero e o filtro devolver lista vazia, sem erro nenhum — com a
 * tela escrevendo "Nenhuma aposta corresponde aos filtros." como se fosse
 * resposta legítima.
 *
 * **"tabela" no endereço.** O estado se chama `"table"`, o endereço carrega
 * `?vista=tabela` e o rótulo falado diz "Visualizar em tabela": três grafias do
 * mesmo conceito no mesmo arquivo. Só a terceira é texto. Quem traduzir o
 * rótulo e, por coerência, o valor do endereço, derruba todo `?vista=tabela` já
 * compartilhado — a tela abre em cartões e não há erro.
 *
 * ## Os números que os rótulos repetem à mão
 *
 * "< 1,8", "1,8 – 3,0" e "> 3,0" escrevem os limiares que o filtro compara como
 * `1.8` e `3.0`. Nada liga os dois: mudar o limiar sem mudar o rótulo deixa a
 * tela prometendo uma faixa que o código não aplica, e não quebra nada.
 *
 * São também os únicos números desta tela que não saem de `LOCALE_DOS_NUMEROS`,
 * de `src/lib/format.ts` — a vírgula decimal deles está escrita na string. Na
 * virada de idioma, a tela mostraria "$1.8" ao lado de "< 1,8" se a chave do
 * `format.ts` virar e estes quatro rótulos ficarem.
 *
 * ## Três travessões, e um que não pode vir daqui
 *
 * `resumo.semValor` é o "não há o que calcular" dos cartões de taxa e de ROI,
 * mais a odd média zerada. `linha.semLucro` é o "esta aposta não tem lucro para
 * mostrar", da pendente e da anulada, nos cartões e na tabela. Os dois são o
 * mesmo glifo com razões diferentes, e ficam separados para a #128 poder
 * traduzir um sem o outro.
 *
 * O terceiro é o `SEM_DATA` de `src/lib/padroes.ts`, e é **sentinela**: uma
 * aposta com data ilegível abre um dia cujo cabeçalho se chama "—". Quem der ao
 * cabeçalho do dia a entrada de "sem valor" quebra a comparação de `padroes.ts`
 * sem erro.
 *
 * ## Duas inconsistências preservadas de propósito
 *
 * **O título do CSV não tem singular.** Com uma aposta no filtro, a dica do
 * mouse diz "Baixar as 1 apostas do filtro". Medido, não suposto. A entrada
 * fica como está — este trabalho promete não mudar saída — e o conserto é a
 * #156, com `contagem` de `forma.ts` à mão.
 *
 * **Três grafias de "void" na mesma tela.** O rodapé do cartão Green/Red
 * escreve "void" em minúscula, o botão de filtro "Void", e a pílula "VOID"
 * (essa é dado). Uniformizar muda a saída de pelo menos uma.
 *
 * ## Duas repetições que ficam
 *
 * "Taxa de Acerto" também está em `painel.ts`, e os oito cabeçalhos da tabela
 * quase repetem as doze colunas do `CABECALHO` de `src/lib/csv.ts` com outros
 * nomes — "Partida / Mercado" ali é "Partida" e "Tip" aqui, "Valor" é "Valor
 * (R$)", "Status" é "Resultado". Oito rótulos num dicionário e doze noutro
 * lugar, descrevendo as mesmas apostas: quem mudar um nome decide pelos dois.
 * O CSV mora em `src/lib`, e por isso é da #151.
 *
 * ## O `%` que fica no JSX
 *
 * A taxa e o ROI saem de `NumeroAnimado` com `suffix="%"`. Fica lá, como no
 * Painel: é a unidade do `FORMATO_TAXA` e do `FORMATO_ROI`, de `format.ts`, e
 * não rótulo desta tela. O `"%"` que está num dicionário é outro — o da
 * calculadora, que a própria tela desenha dentro do campo.
 */

const APOSTAS = {
  /**
   * O subtítulo, com o nome do período destacado no meio.
   *
   * É a frase irmã do `escopo` do Painel, e o outro lado da divergência que
   * `painel.ts` manda quem extrair esta tela encontrar: lá o intervalo de datas
   * vai dentro de um `<strong>`, aqui o parêntese **não** leva destaque nenhum.
   * Um destaque só, então sem `papel` — quem desenha é a tela.
   *
   * O intervalo chega como string, e vazio quer dizer "sem intervalo". Aqui não
   * há booleano separado, ao contrário do Painel: o JSX desta tela já decidia
   * pela própria string (`{periodo && ...}`), e manter isso deixa a promessa de
   * não mudar saída conferível.
   */
  escopo: (p: Periodo, intervalo: string): Trecho[] => [
    `Feed cronológico ${p.prefixo} `,
    { forte: p.nome },
    intervalo ? ` (${intervalo})` : "",
    ".",
  ],

  csv: {
    rotulo: "Baixar CSV",
    /**
     * A dica do mouse do botão, com a contagem já formatada.
     *
     * Sem singular de propósito — ver o topo do arquivo e a #156. "Excel" e
     * "Google Sheets" são nomes de produto e não se traduzem.
     */
    titulo: (apostas: string) =>
      `Baixar as ${apostas} apostas do filtro, para abrir no Excel ou no Google Sheets`,
  },

  /**
   * Os dois botões de vista, que são só ícone: o rótulo falado é o único nome
   * que eles têm. "tabela" aqui é texto; o `?vista=tabela` do endereço não é.
   */
  vista: {
    aria: "Modo de visualização",
    cartoes: "Visualizar em cartões",
    tabela: "Visualizar em tabela",
  },

  resumo: {
    /** Os quatro rótulos saem em caixa alta por CSS, e não na string. */
    lucro: "Lucro do Filtro",
    greenRed: "Green / Red",
    acerto: "Taxa de Acerto",
    roi: "ROI do Filtro",

    /** O que se emenda ao Green/Red quando há anulada: " · 2 void". */
    voids: (voids: string) => ` · ${voids} void`,

    oddMedia: (odd: string) => `odd média ${odd}`,

    /** Sem aposta decidida não há taxa nem ROI, e a odd média pode ser zero. */
    semValor: "—",
  },

  busca: {
    /** O rótulo do campo, só no áudio. Três arquivos de `e2e/` acham o campo por ele. */
    rotulo: "Buscar apostas",
    /**
     * A dica dentro do campo.
     *
     * As quatro palavras são os quatro campos que o índice de busca concatena,
     * na mesma ordem — partida, tip, casa e adm. Nada liga as duas listas: campo
     * novo no índice sem palavra nova aqui deixa a frase mentindo por omissão.
     */
    dica: "Buscar partida, mercado, casa, adm...",
  },

  resultado: {
    aria: "Filtrar por resultado",

    /**
     * Mapa de **valor para rótulo**. A chave é o estado, a comparação contra
     * `bet.resultado` e o `?resultado=` do endereço em minúsculas. Ver o topo
     * do arquivo: quatro chaves vêm da planilha, e a quinta é a sentinela que
     * atravessa até o nome do arquivo baixado.
     */
    rotulos: {
      TODAS: "Todas",
      GREEN: "Green",
      RED: "Red",
      VOID: "Void",
      PENDENTE: "Pendente",
    } as const satisfies Record<"TODAS" | BetResult, string>,
  },

  /**
   * O que cada seletor múltiplo escreve quando nada está marcado, e o
   * substantivo com que o componente monta as frases dele.
   *
   * O `vazio` sai em dois papéis — rótulo do botão e nome da lista aberta —, e
   * o `substantivo` entra no meio de "2 casas" e de "Limpar filtro de casas",
   * que moram no `SeletorMultiplo`. A frase está partida entre dois arquivos
   * até aquele componente ser extraído; as duas metades têm de virar juntas.
   *
   * As três entradas de `vazio` são inteiras, e não "Todos os" mais a palavra,
   * porque a concordância de gênero é gramática do português: em inglês as três
   * viram a mesma forma.
   */
  filtros: {
    esportes: {
      vazio: "Todos os Esportes",
      substantivo: "esportes",
    },
    casas: {
      vazio: "Todas as Casas",
      substantivo: "casas",
    },
    adms: {
      vazio: "Todos os Adms",
      substantivo: "adms",
    },
  },

  odd: {
    aria: "Filtrar por faixa de odd",
    /** Com os dois-pontos dentro da string: noutro idioma a pontuação pode mudar. */
    rotulo: "Odd:",

    /**
     * Mapa de **valor para rótulo**, com os limiares escritos à mão nos
     * rótulos — ver o topo do arquivo. O travessão de "1,8 – 3,0" é meia-risca,
     * não hífen. A ordem dos botões é do ponto de chamada, não deste mapa.
     */
    faixas: {
      TODAS: "Todas",
      BAIXA: "< 1,8",
      MEDIA: "1,8 – 3,0",
      ALTA: "> 3,0",
    },
  },

  /**
   * O cabeçalho de cada dia e o botão que abre e fecha todos.
   *
   * O botão alterna entre duas ações e `e2e/dias.spec.ts` prova isso lendo o
   * rótulo dele em oito asserções: as duas entradas têm de mudar juntas.
   */
  dias: {
    expandir: "Expandir tudo",
    recolher: "Recolher tudo",
    /** "(3 apostas)", com os parênteses. O ternário de plural estava no JSX. */
    contagem: (apostas: number) => `(${contagem(apostas, "aposta", "apostas")})`,
  },

  /** As duas ausências são frases separadas: uma fala da aba, a outra do filtro. */
  vazio: {
    naAba: (p: Periodo) => `Nenhuma aposta registrada ${p.prefixo} ${p.nome}.`,
    nosFiltros: "Nenhuma aposta corresponde aos filtros.",
  },

  /**
   * A linha de uma aposta, nos cartões e na tabela.
   *
   * O prefixo "Ver detalhes: " é o seletor de seis arquivos de `e2e/`, sempre
   * por expressão ancorada. Mudar o texto derruba a suíte de cinco telas — é
   * quebra larga, mas barulhenta.
   */
  linha: {
    aria: (d: { partida: string; tip: string }) => `Ver detalhes: ${d.partida}, ${d.tip}`,
    /** A arroba antes da odd, que é notação e não palavra. */
    odd: (odd: string) => `@${odd}`,
    /** Pendente e anulada não têm lucro para mostrar. Não é o `SEM_DATA`. */
    semLucro: "—",
  },

  tabela: {
    /** A tabela inteira numa frase, para quem não a vê. */
    legenda: (p: Periodo) => `Apostas registradas ${p.prefixo} ${p.nome}`,

    /** Os oito cabeçalhos, na ordem das colunas. Caixa alta por CSS. */
    data: "Data",
    esporte: "Esporte",
    partida: "Partida / Mercado",
    casa: "Casa",
    odd: "Odd",
    valor: "Valor",
    status: "Status",
    lucro: "Lucro",
  },

  /**
   * O rodapé que só aparece na tabela, acima de cem apostas.
   *
   * É o único texto desta seção que a suíte de tela não alcança: o modo
   * demonstração tem onze apostas, e `e2e/filtro-de-adm.spec.ts` registra em
   * comentário que por isso conta cartões em vez de ler esta frase.
   */
  mais: {
    rotulo: (quantas: number) => `Mostrar mais ${quantas}`,
    quantos: (d: { exibindo: string; total: string }) =>
      `Exibindo ${d.exibindo} de ${d.total} apostas`,
  },
} as const;

/** O acessador. É a única linha desta seção que a #128 vai mexer. */
export function textoDasApostas() {
  return APOSTAS;
}
