import { rotuloDaAba } from "./constants";
import type { BetItem } from "./types";

/**
 * O recorte do feed em CSV (#69).
 *
 * No formato que o Excel brasileiro abre com dois cliques: ponto e vírgula
 * entre as colunas (a vírgula é o decimal), BOM no começo para os acentos não
 * virarem "Ã©", e quebra de linha do Windows. O Google Sheets lê igual.
 */

const BOM = "﻿";
const SEPARADOR = ";";

/**
 * Uma célula de texto pronta para o CSV.
 *
 * Aspas quando o texto tem separador, aspas ou quebra de linha, com as aspas
 * de dentro dobradas. E um apóstrofo na frente do que começa com `=`, `+`, `-`
 * ou `@`: o Excel leria como fórmula, e "+2.5 gols" viraria erro na célula, ou
 * coisa pior se alguém escrevesse uma fórmula de propósito numa tip.
 */
export function celula(texto: string): string {
  const seguro = /^[=+\-@]/.test(texto) ? `'${texto}` : texto;
  return /[";\r\n]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
}

/** Número com vírgula decimal e sem milhar, que o Excel em português lê como número. */
export function numero(valor: number, casas = 2): string {
  return valor.toFixed(casas).replace(".", ",");
}

const CABECALHO = [
  "Data",
  "Esporte",
  "Adm",
  "Partida",
  "Tip",
  "Casa",
  "Odd",
  "Valor (R$)",
  "Resultado",
  "Lucro (R$)",
  "Unidades apostadas",
  "Lucro em unidades",
];

/**
 * As apostas em CSV, na ordem em que vieram.
 *
 * `converter` passa os reais para a unidade do visitante, como na tela: quem
 * escolheu R$ 20 por unidade baixa a planilha em R$ 20. As colunas em
 * unidades não mudam com ela.
 */
export function apostasParaCsv(
  bets: readonly BetItem[],
  converter: (reais: number) => number,
  valorDaUnidade: number
): string {
  const linhas = bets.map((b) =>
    [
      celula(b.data),
      celula(b.esporte),
      celula(b.tipster),
      celula(b.partida),
      celula(b.tip),
      celula(b.casa),
      numero(b.odd),
      numero(converter(b.valor)),
      b.resultado,
      numero(converter(b.lucro)),
      numero(b.valor / valorDaUnidade),
      numero(b.lucro / valorDaUnidade),
    ].join(SEPARADOR)
  );
  return `${BOM}${[CABECALHO.join(SEPARADOR), ...linhas].join("\r\n")}\r\n`;
}

/**
 * Nome do arquivo pelo recorte: `geogetips-setembro26-green-2026-09-01-a-2026-09-15.csv`.
 *
 * Só o que ajuda a achar o arquivo depois na pasta de downloads: aba, resultado
 * e datas. Casa, esporte e adm iriam deixar o nome gigante.
 */
export function nomeDoArquivo(
  aba: string,
  resultado: string,
  de: string,
  ate: string
): string {
  const partes = ["geogetips", rotuloDaAba(aba).toLowerCase()];
  if (resultado && resultado !== "TODAS") partes.push(resultado.toLowerCase());
  if (de && ate) partes.push(de === ate ? de : `${de}-a-${ate}`);
  else if (de) partes.push(`desde-${de}`);
  else if (ate) partes.push(`ate-${ate}`);
  return `${partes.join("-")}.csv`;
}
