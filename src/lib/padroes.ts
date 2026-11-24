/**
 * Os valores que o código **escreve e depois compara**.
 *
 * Eles parecem texto de tela, e não são: a planilha vem com célula vazia, o
 * código preenche com um padrão, e mais adiante **outro trecho compara contra
 * esse mesmo padrão** para decidir o que fazer. Traduzir um deles sem trocar a
 * comparação quebra comportamento — sem erro, sem teste vermelho e sem
 * diferença visível na tela, que é a pior combinação possível.
 *
 * Por isso eles moram aqui, e **não** em `src/texto/`. A fronteira da #127 é
 * essa: `src/texto/` é o que a pessoa lê; este arquivo é o que o código
 * compara. Quando a virada de idioma vier, `src/texto/` se traduz inteiro e
 * este arquivo **não se traduz**.
 *
 * ## Módulo folha, de propósito
 *
 * Não importa nada, e não pode passar a importar. `src/lib/date.ts` é
 * consumido por componentes de cliente, e o comentário de topo dele explica
 * por que: eles não podem alcançar `sheets.ts`, que puxa `fs` e `googleapis`.
 * Uma dependência aqui atravessaria essa fronteira por tabela.
 *
 * ## As duas armadilhas que este arquivo existe para evitar
 *
 * **O mesmo texto em dois papéis.** Nem toda aparição destas palavras é
 * sentinela:
 *
 * - `"—"` é sentinela em cinco lugares — a data que não deu para ler. Nos
 *   outros dez é texto de tela, o travessão de "não há valor" que aparece em
 *   "odd média —" e no ROI sem apostas. Só os cinco primeiros são daqui.
 * - `"Geral"` é sentinela quando é o adm que a planilha não informou. Em
 *   `constants.ts`, `rotuloDaAba` devolve "Geral" para o agregado de todos os
 *   meses — mesma palavra, papel sem relação nenhuma, e essa é texto de tela.
 * - `"Futebol"` é sentinela quando é o esporte que a planilha não informou. Em
 *   `SportBadge`, o `rotulo: "Futebol"` do catálogo é o que o selo escreve, e
 *   se traduz.
 *
 * **O que NÃO está aqui, e por quê.** `sheets.ts` também escreve
 * `"Aposta Registrada"` e `"Aposta"` quando partida e tip vêm vazias — e esses
 * dois **nunca são comparados**. São texto de tela puro, e congelá-los aqui
 * seria torná-los intraduzíveis por engano. Mas também não cabem em
 * `src/texto/` ainda: quem os escreve é o caminho de dados, que não pode
 * importar texto. O conserto certo é a camada de dados parar de escrever texto
 * de tela e a própria tela decidir o que mostrar com o campo vazio — e isso
 * muda o formato da resposta da API, então é trabalho próprio.
 */

/** A data que não deu para ler. Escrita por `sheets.ts`, lida por `date.ts`. */
export const SEM_DATA = "—";

/** O esporte que a planilha não informou. */
export const ESPORTE_PADRAO = "Futebol";

/** O adm que a planilha não informou. A tela esconde o selo quando é este. */
export const ADM_GERAL = "Geral";

/** A casa que a planilha não informou. Vira chave de agrupamento em `stats.ts`. */
export const SEM_CASA = "Sem Casa";

/** O balde de esportes sem classificação, em `stats.ts`. Nasce como chave. */
export const OUTROS_ESPORTES = "Outros";
