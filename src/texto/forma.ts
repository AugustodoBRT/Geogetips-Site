import { formatarInteiro } from "@/lib/format";

/**
 * Os primitivos da camada de texto (#127).
 *
 * Aqui mora o que mais de uma seção do dicionário precisa. Hoje é um só, e
 * isso é de propósito: o `knip` reclama de export sem consumidor, e essa regra
 * está certa — ela proíbe inventar estrutura antes de haver quem a use.
 */

/**
 * Contagem com a palavra no número certo: `(1, "mês", "meses")` → "1 mês".
 *
 * ## Por que a regra é `n === 1`, e não `Intl.PluralRules`
 *
 * Porque a biblioteca mudaria a tela. Conferido:
 *
 * ```
 * new Intl.PluralRules("pt-BR").select(0)  →  "one"
 * new Intl.PluralRules("pt-PT").select(0)  →  "other"
 * new Intl.PluralRules("en-US").select(0)  →  "other"
 * ```
 *
 * Pela regra do CLDR, **zero é singular em português do Brasil** — então um
 * dicionário movido a `Intl` escreveria "0 aposta" onde este site escreve
 * "0 apostas". Esta função congela a semântica de hoje de propósito, e a troca
 * é decisão da #128, com saída visível mudando no caso zero.
 *
 * ## O teto que isto tem
 *
 * Duas formas. Português e inglês têm duas, então a #128 cabe. Russo ou árabe
 * exigiriam trocar a assinatura — e é o dia em que uma biblioteca com ICU passa
 * a se pagar.
 */
export function contagem(n: number, uma: string, varias: string): string {
  return `${formatarInteiro(n)} ${n === 1 ? uma : varias}`;
}
