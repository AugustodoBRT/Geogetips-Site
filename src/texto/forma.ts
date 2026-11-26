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

/**
 * Uma frase com marcação no meio, como **dado**.
 *
 * Nasceu em `/adms`, onde o escopo é "Assertividade e lucro por unidade de
 * **todos os meses**. A taxa considera apenas apostas finalizadas." — com o
 * nome do período em negrito no meio da frase.
 *
 * ## Por que não partir a frase em "antes" e "depois"
 *
 * Porque trava a ordem das palavras. Em português o período vem depois da
 * preposição; noutro idioma pode vir antes, ou a frase pode se reorganizar
 * inteira. Duas entradas chamadas "antes" e "depois" obrigam a tradução a
 * caber na gramática do português, que é exatamente o que esta issue existe
 * para desfazer.
 *
 * ## Por que dado, e não JSX
 *
 * Para o dicionário continuar `.ts` e cair no `include: ["src/**\/*.test.ts"]`
 * do vitest. Entrada com JSX dentro mudaria a extensão do arquivo e o tiraria
 * da suíte de unidade — e é na suíte de unidade que mora a trava que prova
 * que a frase não mudou.
 *
 * Quem decide **como** o trecho forte aparece é a tela, não o dicionário.
 */
export type Trecho = string | { forte: string };
