import { lerOdd, lerPorcentagem } from "./calculadora";
import { formatarOddExata, lerNumeroBR } from "./format";

/**
 * O que se digita nos campos da calculadora, arrumado tecla a tecla (#82).
 *
 * Cada tipo de campo tem duas funções: a que limpa o texto enquanto a pessoa
 * digita, e a que o deixa no formato final quando ela sai do campo. A primeira
 * nunca muda o valor, só a escrita: "1.85" vira "1,85", letra não entra, e a
 * odd não passa de três casas. A segunda só age quando o valor é válido; o
 * que não é fica como está, para o aviso de erro apontar o que foi digitado.
 */

/**
 * Número com vírgula decimal: odd e porcentagem.
 *
 * Aqui o ponto é sempre a vírgula. Odd não tem milhar, e casa de aposta
 * escreve "1.850" querendo 1,85 (é o mesmo motivo de `lerOdd`). Zero à
 * esquerda sai ("01,85" → "1,85"), e uma vírgula no começo ganha o zero
 * (",5" → "0,5").
 */
export function digitandoDecimal(texto: string, casas: number, inteiros: number): string {
  const s = texto.replace(/\./g, ",").replace(/[^\d,]/g, "");
  const i = s.indexOf(",");
  let inteira = (i === -1 ? s : s.slice(0, i))
    .replace(/^0+(?=\d)/, "")
    .slice(0, inteiros);
  if (i === -1) return inteira;
  if (inteira === "") inteira = "0";
  const fracao = s
    .slice(i + 1)
    .replace(/,/g, "")
    .slice(0, casas);
  return `${inteira},${fracao}`;
}

/**
 * Valor em reais ou em unidades, que pode ter milhar.
 *
 * Os pontos ficam como a pessoa escreveu, e quem decide se são milhar ou
 * decimal é `lerNumeroBR`, pelas mesmas regras do campo de unidade do Painel.
 * Depois da vírgula, no máximo duas casas.
 */
export function digitandoValor(texto: string): string {
  const s = texto.replace(/[^\d.,]/g, "");
  const i = s.indexOf(",");
  if (i === -1) return s;
  const fracao = s
    .slice(i + 1)
    .replace(/[.,]/g, "")
    .slice(0, 2);
  return `${s.slice(0, i)},${fracao}`;
}

/** Odd com duas casas, ou três quando a terceira existe: "2" → "2,00", "1,875" fica. */
export function oddAoSair(texto: string): string {
  const odd = lerOdd(texto);
  return odd === null ? texto : formatarOddExata(odd);
}

const CURTO = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const REAIS = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Porcentagem sem zero sobrando: "4,50" → "4,5", "4,0" → "4". */
export function porcentagemAoSair(texto: string): string {
  const n = lerPorcentagem(texto);
  return n === null ? texto : CURTO.format(n);
}

/** Reais com milhar e centavos: "1000" → "1.000,00". */
export function reaisAoSair(texto: string): string {
  const n = lerNumeroBR(texto);
  return n === null ? texto : REAIS.format(n);
}

/** Unidades com milhar e sem zero sobrando: "1000" → "1.000", "100,50" → "100,5". */
export function unidadesAoSair(texto: string): string {
  const n = lerNumeroBR(texto);
  return n === null ? texto : CURTO.format(n);
}

export type TipoDeCampo = "odd" | "porcentagem" | "reais" | "unidades";

/** As duas funções de cada tipo de campo. */
export const DIGITACAO: Record<
  TipoDeCampo,
  { digitando: (texto: string) => string; aoSair: (texto: string) => string }
> = {
  // Odd até 1000 (o teto de `lerOdd`): quatro dígitos antes da vírgula.
  odd: { digitando: (t) => digitandoDecimal(t, 3, 4), aoSair: oddAoSair },
  porcentagem: { digitando: (t) => digitandoDecimal(t, 2, 2), aoSair: porcentagemAoSair },
  reais: { digitando: digitandoValor, aoSair: reaisAoSair },
  unidades: { digitando: digitandoValor, aoSair: unidadesAoSair },
};
