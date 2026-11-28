/**
 * O texto dos dois selos: o do esporte e o da casa.
 *
 * Doze entradas, tiradas das 138 linhas de `components/SportBadge.tsx` e das
 * 1019 de `components/BookieBadge.tsx`. Onze são rótulos de esporte; a décima
 * segunda é uma frase do selo de casa.
 *
 * Os selos aparecem em cinco lugares — `/apostas`, `/painel`, `/estatisticas`,
 * `/adms` e o diálogo de `DetalheAposta` —, então são arquivo próprio, como
 * `controles.ts` e `telegram.ts`, e não seção de uma tela.
 *
 * ## Por que estes dois arquivos somam 1157 linhas e entregam doze entradas
 *
 * Porque quase tudo neles é **dado**, e dado não entra aqui. Cada selo tem
 * duas metades:
 *
 * - o valor que vem da planilha entra como **padrão de busca** — "nba",
 *   "corrida de cavalo", "bet365" —, e é comparado;
 * - o que sai na tela é o **rótulo do catálogo** — "Basquete", "Turfe" —, e é
 *   lido.
 *
 * Só a segunda metade é texto. A planilha escreve `NBA` e o cartão desenha
 * "Basquete": traduzir o padrão junto com o rótulo faria o selo parar de casar
 * e cair no caminho de reserva, que escreve o valor cru da planilha. Sem erro,
 * sem teste vermelho, e com a tela parecendo quase certa. `src/lib/padroes.ts`
 * registra essa mesma fronteira do outro lado.
 *
 * **A ordem das regras também é busca, não texto.** Em `SportBadge`, "corrida
 * de cavalo" precisa vir antes de "corrida", que identifica a Fórmula 1. A
 * ordem fica lá, com os padrões; aqui os rótulos são um mapa, sem ordem.
 *
 * ## "Futebol" é rótulo aqui e sentinela em `padroes.ts`
 *
 * `ESPORTE_PADRAO` vale "Futebol" e é o que `sheets.ts` escreve quando a
 * planilha não informa o esporte. O rótulo da regra do futebol também é
 * "Futebol" — mesma palavra, dois papéis sem relação.
 *
 * O da sentinela **não** se traduz; este se traduz. E o mecanismo sobrevive à
 * tradução porque quem casa é o padrão `"futebol"`, que fica no componente: a
 * aposta sem esporte continua caindo na regra certa, e o selo passa a escrever
 * "Football". `padroes.ts` já nomeia esse par no comentário dele.
 *
 * ## Os 99 nomes de casa não vêm para cá
 *
 * "bet365", "Betano", "KTO" são **nomes próprios**: uma marca se escreve igual
 * em qualquer idioma. Trazê-los para um dicionário de tradução seria convidar
 * a traduzir o que não pode mudar. Ficam no registro de `BookieBadge`, junto
 * das cores e das logos, que são da mesma natureza.
 *
 * Pelo mesmo motivo fica lá a lista de palavras que o monograma ignora — "de",
 * "da", "do", "na", "e", que fazem "Rei do Pitaco" virar "RP". É gramática
 * portuguesa aplicada a nomes de marca brasileiros, e os nomes não mudam com o
 * idioma da interface.
 *
 * Do selo de casa vem uma frase só, e é a única que fala do **estado** em vez
 * de dizer um nome: a casa que ainda não está no registro.
 *
 * ## A trava
 *
 * `esportes` é indexado pela união `EsporteDoSelo`, e cada regra do catálogo
 * carrega a sua chave. Regra sem rótulo não compila, e rótulo com a chave
 * errada também não — é a mesma trava de `grafico.janelas`, no Painel.
 *
 * ## Oito rótulos que a suíte de tela não alcança
 *
 * O mock tem três esportes: Futebol, NBA e Tênis. Turfe, NFL, eSports,
 * MMA / Luta, Vôlei, NHL, MLB e Fórmula 1 não aparecem em retrato nenhum, e
 * ficaram travados na suíte de unidade, conferidos letra por letra contra o
 * catálogo de antes.
 */

/** A chave de cada regra do catálogo de esportes, em `SportBadge`. */
export type EsporteDoSelo =
  | "turfe"
  | "nfl"
  | "futebol"
  | "basquete"
  | "tenis"
  | "esports"
  | "luta"
  | "volei"
  | "nhl"
  | "mlb"
  | "formula1";

const SELOS = {
  /**
   * O rótulo de cada regra do catálogo: mapa de **chave para texto**.
   *
   * Sem ordem de propósito — a ordem é da busca, e fica com os padrões.
   */
  esportes: {
    turfe: "Turfe",
    nfl: "NFL",
    futebol: "Futebol",
    basquete: "Basquete",
    tenis: "Tênis",
    esports: "eSports",
    luta: "MMA / Luta",
    volei: "Vôlei",
    nhl: "NHL",
    mlb: "MLB",
    formula1: "Fórmula 1",
  } as const satisfies Record<EsporteDoSelo, string>,

  /**
   * O `title` da casa que ainda não está no registro.
   *
   * O nome vem da planilha e entra cru: é o que torna evidente que falta
   * cadastrar, em vez de inventar uma cor.
   */
  casaNaoCadastrada: (casa: string) => `${casa} — casa ainda não cadastrada`,
} as const;

/** O acessador. É a única linha desta seção que a #128 vai mexer. */
export function textoDosSelos() {
  return SELOS;
}
