import { formatarInteiro } from "@/lib/format";

/**
 * Os primitivos da camada de texto (#127).
 *
 * Aqui mora o que mais de uma seção do dicionário precisa, e **só** depois de
 * haver mais de uma: o `knip` reclama de export sem consumidor, e essa regra
 * está certa — ela proíbe inventar estrutura antes de existir quem a use.
 *
 * `contagem` nasceu no Histórico, o `Trecho` em Adms, e o `Periodo` subiu para
 * cá quando a segunda tela precisou do mesmo tipo.
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
 *
 * ## O `papel`, e por que ele não é estilo
 *
 * Sem papel é o destaque comum da tela — o que `/adms` e `/estatisticas` já
 * desenham com `font-semibold text-[var(--text)]`.
 *
 * O Painel precisou de mais, porque a frase dele tem **dois** trechos
 * destacados e a tela os desenha diferente: o nome do período com esse mesmo
 * destaque, e o intervalo de datas dentro de um `<strong>`, que tem outro peso
 * e outra cor. O `papel` diz **qual trecho é qual**; continua sendo a tela que
 * decide como cada um aparece. É a diferença entre dizer "isto é ênfase" e
 * dizer "isto é negrito" — a primeira sobrevive à troca de idioma.
 *
 * - `recorte`: o intervalo de datas que estreita a frase.
 * - `valor`: um número cujo sinal a tela pinta, e que por isso ela não pode
 *   receber já formatado numa string junto do resto.
 * - `perda`: um valor que a frase diz que se perde. Nasceu na calculadora, na
 *   frase que tem dois números destacados — a soma das probabilidades, que sai
 *   neutra, e o dinheiro que se perderia, que sai em vermelho.
 *
 * Frase com um destaque só não precisa de papel: quem desenha é o ponto de
 * chamada, e ele decide sozinho. O papel existe para a frase que tem **dois**
 * destaques e os desenha diferente.
 */
export type Trecho = string | { forte: string; papel?: "recorte" | "valor" | "perda" };

/**
 * O período que a tela está olhando, do jeito que `trechoDaAba` o devolve.
 *
 * Duas partes, e não uma frase pronta, porque o agregado não é um mês: o
 * consolidado vira "de todos os meses" e um mês vira "de Novembro26". Quem
 * monta a frase é cada seção do dicionário.
 *
 * Estava escrito à mão em Adms. Subiu para cá na segunda tela que precisou
 * dele, em vez de virar a terceira cópia do mesmo par de campos.
 */
export type Periodo = { prefixo: string; nome: string };
