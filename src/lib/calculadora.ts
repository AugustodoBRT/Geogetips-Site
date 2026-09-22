/**
 * As contas da calculadora de valor esperado (#71).
 *
 * Tudo aqui é função pura sobre número: a tela só lê os campos, chama estas
 * funções e desenha o resultado. É onde um engano vira conselho errado para
 * quem vai apostar, então cada conta tem teste ao lado.
 *
 * O método de tirar a margem é o proporcional: a margem da casa é repartida
 * entre os resultados na proporção da probabilidade de cada um. É o mais usado
 * e o mais simples de conferir à mão. Existem métodos que pesam mais a margem
 * nas zebras (Shin, potência); ficam de fora de propósito, porque mudam pouco
 * nos mercados de dois ou três resultados e deixariam a tela mais difícil.
 */

/** Maior odd que a calculadora aceita. Acima disto é quase sempre erro de digitação. */
const ODD_MAXIMA = 1000;

/**
 * Lê uma odd digitada: "1,85", "1.85" e "1.850" são todas 1,85.
 *
 * Não usa `lerNumeroBR` de propósito. Lá, "1.850" é mil oitocentos e cinquenta
 * (ponto de milhar), que é o certo para dinheiro e o errado para odd: casa de
 * aposta escreve odd com três casas, e quem cola "1.850" quer 1,85. Odd não
 * tem milhar, então aqui ponto e vírgula são sempre a vírgula decimal.
 *
 * Devolve `null` para o que não é odd: vazio, texto, mais de um separador, ou
 * valor fora de (1, ODD_MAXIMA]. Odd 1 não paga nada e não entra na conta.
 */
export function lerOdd(texto: string): number | null {
  const n = lerDecimal(texto);
  if (n === null || n <= 1 || n > ODD_MAXIMA) return null;
  return n;
}

/** Lê uma porcentagem digitada ("4,5", "4.5%"), entre 0 e 100 exclusive. */
export function lerPorcentagem(texto: string): number | null {
  const n = lerDecimal(texto.replace("%", ""));
  if (n === null || n <= 0 || n >= 100) return null;
  return n;
}

function lerDecimal(texto: string): number | null {
  const limpo = texto.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(limpo)) return null;
  const n = Number.parseFloat(limpo);
  return Number.isFinite(n) ? n : null;
}

/**
 * A margem da casa num mercado: quanto a soma das probabilidades implícitas
 * passa de 100%. Odds 1,90 e 1,90 somam 105,26%, então a margem é 5,26%.
 *
 * Em fração: 0,0526. Negativa quando as odds vêm de casas diferentes e somam
 * menos de 100% — é aí que existe surebet.
 */
export function margem(odds: readonly number[]): number {
  return odds.reduce((acc, o) => acc + 1 / o, 0) - 1;
}

/**
 * Probabilidade justa de cada resultado, sem a margem da casa.
 *
 * Proporcional: cada probabilidade implícita (1 / odd) é dividida pela soma de
 * todas. As justas somam exatamente 1.
 */
export function probabilidadesJustas(odds: readonly number[]): number[] {
  const soma = odds.reduce((acc, o) => acc + 1 / o, 0);
  return odds.map((o) => 1 / o / soma);
}

/**
 * Valor esperado de apostar numa odd, dada a probabilidade real do resultado,
 * em fração do valor apostado: 0,05 é ganhar, em média, 5 centavos por real.
 */
export function valorEsperado(odd: number, probabilidade: number): number {
  return odd * probabilidade - 1;
}

/**
 * Fração da banca que o critério de Kelly manda apostar, com Kelly inteiro.
 *
 * f = (p × odd − 1) / (odd − 1): o valor esperado dividido pelo lucro que a
 * odd paga por real. É a stake que mais faz a banca crescer no longo prazo,
 * desde que a probabilidade esteja certa. Aqui ela é estimada pela casa de
 * referência, e por isso a tela aplica só uma fração do Kelly.
 *
 * Zero quando não há valor esperado positivo: Kelly nunca manda apostar sem
 * valor.
 */
export function kelly(odd: number, probabilidade: number): number {
  const ev = valorEsperado(odd, probabilidade);
  return ev > 0 ? ev / (odd - 1) : 0;
}

/**
 * As frações de Kelly que a tela oferece. Um quarto é o padrão: Kelly inteiro
 * com probabilidade estimada faz a banca oscilar demais, e meio erro na
 * estimativa já transforma a stake certa em excesso.
 */
export const FRACOES_DE_KELLY = [
  { valor: 0.125, rotulo: "1/8" },
  { valor: 0.25, rotulo: "1/4" },
  { valor: 0.5, rotulo: "1/2" },
  { valor: 1, rotulo: "Inteiro" },
] as const;

export const FRACAO_DE_KELLY_PADRAO = 0.25;

/** Banca de 100 unidades: 1u é 1% da banca, e a stake em unidades é a porcentagem. */
export const BANCA_PADRAO_EM_UNIDADES = 100;

/**
 * Stake acima de 5% da banca numa aposta só. Com um quarto de Kelly, isso pede
 * valor esperado de dois dígitos, que quase sempre é odd digitada errada ou
 * mercado que a casa ainda vai corrigir. A tela mostra, mas pede para conferir.
 */
export const STAKE_ALTA = 0.05;

export interface Stake {
  /** Kelly inteiro, em fração da banca. */
  kellyInteiro: number;
  /** A stake com a fração escolhida, em fração da banca: 0,0114 é 1,14%. */
  fracaoDaBanca: number;
  /** A mesma stake em unidades, numa banca do tamanho informado. */
  unidades: number;
}

/**
 * A stake recomendada: a fração escolhida do Kelly, em porcentagem da banca e
 * em unidades. Com a banca de 100u, 1,14% da banca são 1,14u.
 */
export function stakeDeKelly(
  odd: number,
  probabilidade: number,
  fracaoDeKelly: number,
  bancaEmUnidades: number
): Stake {
  const kellyInteiro = kelly(odd, probabilidade);
  const fracaoDaBanca = kellyInteiro * fracaoDeKelly;
  return { kellyInteiro, fracaoDaBanca, unidades: fracaoDaBanca * bancaEmUnidades };
}

export interface ResultadoOddJusta {
  /** Margem da casa de referência, em fração. */
  margem: number;
  /** Quanto a casa de referência devolve do apostado: 1 / (1 + margem). */
  payout: number;
  probabilidadeJusta: number;
  oddJusta: number;
  /** Valor esperado da odd encontrada, em fração. */
  valorEsperado: number;
}

/**
 * Modo "Odd justa": o mercado inteiro de uma casa de referência (a odd do
 * resultado analisado e as dos outros resultados) dá a probabilidade justa;
 * a odd encontrada em outra casa é comparada com ela.
 */
export function calcularOddJusta(
  analisada: number,
  contrarias: readonly number[],
  encontrada: number
): ResultadoOddJusta {
  const odds = [analisada, ...contrarias];
  const m = margem(odds);
  const probabilidadeJusta = probabilidadesJustas(odds)[0];
  return {
    margem: m,
    payout: 1 / (1 + m),
    probabilidadeJusta,
    oddJusta: 1 / probabilidadeJusta,
    valorEsperado: valorEsperado(encontrada, probabilidadeJusta),
  };
}

/**
 * Modo "Hold": quando só se conhece a odd de um lado e a margem que a casa
 * de referência costuma cobrar.
 *
 * É a mesma conta do modo "Odd justa", com a margem informada em vez de
 * calculada: a odd justa é a odd vezes (1 + margem). Por isso a margem que o
 * primeiro modo mostra pode ser digitada aqui e dá a mesma odd justa.
 */
export function calcularPorHold(
  oddBase: number,
  holdPorcentagem: number,
  encontrada: number
): Omit<ResultadoOddJusta, "payout" | "margem"> {
  const oddJusta = oddBase * (1 + holdPorcentagem / 100);
  const probabilidadeJusta = 1 / oddJusta;
  return {
    probabilidadeJusta,
    oddJusta,
    valorEsperado: valorEsperado(encontrada, probabilidadeJusta),
  };
}

interface ApostaDaSurebet {
  odd: number;
  /** Quanto apostar neste resultado, em reais, arredondado ao centavo. */
  valor: number;
  /** Quanto volta se este resultado sair. */
  retorno: number;
}

export interface ResultadoSurebet {
  apostas: ApostaDaSurebet[];
  /** Menor retorno entre os resultados: é o que está garantido. */
  retornoGarantido: number;
  /** Retorno garantido menos o investido. Negativo quando não há surebet. */
  lucro: number;
  /** Lucro sobre o investido, em fração. */
  roi: number;
  ehSurebet: boolean;
}

/**
 * Modo "Surebet": divide o investimento entre todos os resultados, cada um em
 * uma casa, para o retorno ser o mesmo saia o que sair.
 *
 * O valor de cada resultado é proporcional a 1 / odd. Arredondado ao centavo,
 * o retorno varia alguns centavos de um resultado para outro; o garantido é
 * o menor deles, e é esse que a tela mostra como lucro.
 */
export function calcularSurebet(
  investimento: number,
  odds: readonly number[]
): ResultadoSurebet {
  const soma = odds.reduce((acc, o) => acc + 1 / o, 0);
  const apostas = odds.map((odd) => {
    const valor = centavos((investimento * (1 / odd)) / soma);
    return { odd, valor, retorno: centavos(valor * odd) };
  });
  const investido = apostas.reduce((acc, a) => acc + a.valor, 0);
  const retornoGarantido = Math.min(...apostas.map((a) => a.retorno));
  const lucro = centavos(retornoGarantido - investido);
  return {
    apostas,
    retornoGarantido,
    lucro,
    roi: investido > 0 ? lucro / investido : 0,
    ehSurebet: soma < 1 && lucro > 0,
  };
}

export interface SelecaoDaMultipla {
  analisada: number;
  contrarias: readonly number[];
}

export interface ResultadoMultipla {
  /** Odd justa de cada seleção, na ordem em que vieram. */
  oddsJustas: number[];
  oddJusta: number;
  probabilidadeJusta: number;
  valorEsperado: number;
}

/**
 * Modo "Múltiplas": a odd justa de cada seleção, como no modo "Odd justa",
 * multiplicadas, contra a odd que a casa paga pela múltipla.
 *
 * Multiplicar supõe seleções independentes, de jogos diferentes. Na mesma
 * partida (criar aposta) os resultados se puxam, e a conta deixa de valer —
 * a tela avisa.
 */
export function calcularMultipla(
  selecoes: readonly SelecaoDaMultipla[],
  oddMultipla: number
): ResultadoMultipla {
  const oddsJustas = selecoes.map(
    (s) => 1 / probabilidadesJustas([s.analisada, ...s.contrarias])[0]
  );
  const oddJusta = oddsJustas.reduce((acc, o) => acc * o, 1);
  const probabilidadeJusta = 1 / oddJusta;
  return {
    oddsJustas,
    oddJusta,
    probabilidadeJusta,
    valorEsperado: valorEsperado(oddMultipla, probabilidadeJusta),
  };
}

function centavos(valor: number): number {
  return Math.round(valor * 100) / 100;
}
