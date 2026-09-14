/**
 * Tokens de movimento do site.
 *
 * O site tem duas superfícies com ritmos diferentes, e misturá-las é o erro
 * fácil:
 *
 * - **Telas de dados** (painel, apostas, adms, estatísticas, histórico) são
 *   ferramenta de consulta. Quem abre quer o número, não o espetáculo: o
 *   movimento fica abaixo de 300 ms e serve só para explicar de onde a coisa
 *   veio.
 * - **Home** é vitrine de captação, vista uma vez. Ali a entrada pode demorar
 *   quase um segundo, porque ela própria é parte do argumento.
 *
 * Interação repetida dezenas de vezes por sessão — filtro, ordenação, seletor
 * de dia, campo de unidade — **não anima**. Movimento em coisa frequente vira
 * atrito, e o instantâneo é a resposta certa.
 */

/**
 * Curva de desaceleração padrão. Sai rápido e assenta devagar, o que dá a
 * sensação de resposta imediata mesmo em animação longa.
 *
 * As curvas prontas do CSS (`ease`, `ease-in-out`) são fracas demais para
 * leitura em tela: não têm contraste entre início e fim, e o movimento fica
 * com cara de rascunho.
 */
export const SAIDA_SUAVE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Durações em segundos, por papel. */
export const DURACAO = {
  /** Retorno de toque, troca de ícone, realce de foco. */
  toque: 0.12,
  /** Padrão das telas de dados. */
  painel: 0.2,
  /** Chegada do conteúdo depois do esqueleto. */
  conteudo: 0.26,
  /** Sobreposições: modal, menu do celular, lista suspensa. */
  sobreposicao: 0.22,
  /** Home e outras superfícies de vitrine. */
  vitrine: 0.95,
} as const;

/**
 * Mola de produção: desacelera até parar sem passar do ponto.
 * Repique acima de zero lê como brincadeira — reservado para contexto lúdico,
 * que não é o caso de um painel de resultados.
 */
export const MOLA = { type: "spring", duration: 0.45, bounce: 0 } as const;

/** Mola curta, para sobreposições que precisam chegar rápido. */
export const MOLA_CURTA = { type: "spring", stiffness: 420, damping: 34 } as const;

/**
 * A chegada de um bloco de conteúdo depois do esqueleto **não usa nada daqui**:
 * é a classe `animate-entrada` do Tailwind, definida em `tailwind.config.ts`.
 *
 * Duas razões. Um componente React embrulhando o conteúdo acrescenta uma `div`
 * entre a grade e os filhos, e `col-span` deixa de valer para quem está dentro.
 * E animação de CSS roda sem JavaScript — o conteúdo entra igual mesmo se o
 * pacote não carregar.
 *
 * Sem `filter: blur` nesses blocos, apesar de ser a receita mais bonita para
 * elemento pequeno: desfocar um bloco grande custa caro em aparelho fraco, e
 * `filter` cria bloco de contenção, o que quebraria qualquer `position: fixed`
 * lá dentro. O desfoque fica para as sobreposições, abaixo.
 */

/**
 * Entrada de sobreposição pequena — modal, menu, lista suspensa.
 *
 * Aqui o desfoque compensa: o elemento parece entrar em foco em vez de
 * simplesmente aparecer, e isso é barato numa caixa de algumas centenas de
 * pixels.
 *
 * A saída é mais discreta que a entrada de propósito. Quando algo sai, a
 * atenção de quem olha já foi para outro lugar; repetir a mesma distância na
 * volta faz o elemento disputar atenção que ele não deveria ter.
 */
export const ENTRADA_SOBREPOSICAO = {
  initial: { opacity: 0, y: 8, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -4, filter: "blur(2px)" },
} as const;

/** Véu escuro das sobreposições: só opacidade, sem deslocamento. */
export const VEU = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: DURACAO.toque },
} as const;
