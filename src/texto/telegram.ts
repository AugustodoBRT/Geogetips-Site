/**
 * O texto do bloco do Telegram: o botão e a faixa de conversão.
 *
 * Dez entradas, tiradas das 161 linhas de `src/components/Telegram.tsx`. Duas
 * delas são listas — o título em duas linhas e as três promessas —, então as
 * dez somam treze frases.
 *
 * É o texto mais visto do site. A faixa fecha a home e as cinco telas de
 * dados, e o botão mora no cabeçalho, que aparece em todas elas — então é o
 * único bloco desta issue cujo retrato precisou medir o `body`, e não o
 * `main`.
 *
 * ## Por que os dois rótulos do botão moram juntos
 *
 * O mesmo botão tem dois rótulos: "Entrar no grupo grátis" quase sempre, e
 * "Grupo grátis" no cabeçalho, que a navegação passa por prop porque ali não
 * cabe a frase inteira. Os dois ficam aqui, e não um aqui e outro em
 * `moldura.ts`: são o mesmo botão dizendo a mesma coisa em dois tamanhos, e
 * separá-los faria o dia da tradução ter de descobrir que existe um segundo.
 *
 * ## Uma frase que sai em dois lugares
 *
 * `botao` é o rótulo padrão de `BotaoTelegram` **e** o texto do botão grande
 * da faixa, que é outro elemento com a mesma palavra. Uma entrada só, de
 * propósito: é a mesma ação, e vê-las divergirem seria defeito, não escolha.
 *
 * ## O que não entra
 *
 * O nome do grupo pago na chamada da lista de espera — "GeogeTips - Sigma" —
 * vem de `src/lib/grupos.ts`, com o `id` que vai ao endereço. É da #151.
 * Também ficam fora os endereços (`TELEGRAM_URL`, `PLANILHA_URL`,
 * `URL_LISTA_DE_ESPERA`) e o arroba do rodapé, que é identificador de conta e
 * não texto: ele está **dentro** da frase do rodapé porque a frase inteira é
 * uma linha só de crédito, e partir isso para proteger um arroba custaria mais
 * do que vale.
 */

const TELEGRAM = {
  /** O rótulo do botão, e o do botão grande da faixa. Ver o topo do arquivo. */
  botao: "Entrar no grupo grátis",
  /** O mesmo botão, onde a frase inteira não cabe: o cabeçalho. */
  botaoCurto: "Grupo grátis",

  secao: {
    selo: "Grupo gratuito",

    /**
     * O título em duas linhas, com `<br>` entre elas.
     *
     * Duas entradas pelo mesmo motivo do título da home: a quebra é decisão de
     * desenho, e cada idioma precisa poder decidi-la de novo.
     */
    titulo: ["Os números estão abertos.", "O grupo também."],

    texto:
      "Tudo que você vê neste site sai das mesmas entradas que são enviadas no " +
      "canal. Entre, acompanhe por alguns dias e confira os resultados na planilha " +
      "antes de decidir qualquer coisa.",

    /** As três promessas, na ordem em que a faixa as lista. */
    beneficios: [
      "As entradas chegam no Telegram, na hora em que saem",
      "Cada aposta vira linha na planilha — inclusive as que dão red",
      "Entrada gratuita, sem cadastro",
    ],

    planilha: "Conferir a planilha",

    /**
     * A chamada da lista de espera, que só aparece quando a página do grupo
     * pago existe. O nome do grupo vem do catálogo, em `lib/grupos.ts`.
     */
    listaDeEspera: (grupo: string) => `O ${grupo}, nosso grupo pago, está chegando.`,
    entrarNaLista: "Entrar na lista de espera",

    /** A linha de crédito do fim, com o arroba e o aviso de idade. */
    rodape: "@vemproGeogeTips · planilha aberta em modo somente leitura · 18+",
  },
} as const;

/** O acessador. É a única linha desta seção que a #128 vai mexer. */
export function textoDoTelegram() {
  return TELEGRAM;
}
