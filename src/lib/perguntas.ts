import { PLANILHA_URL, TELEGRAM_URL, VALOR_UNIDADE } from "./constants";

/**
 * O texto da página de perguntas (#66).
 *
 * Mora aqui, e não na página, porque sai em dois lugares: na tela e nos dados
 * estruturados que o Google lê. Escrito uma vez só, os dois não se desencontram.
 *
 * As respostas são texto puro, sem marcação, justamente por causa dos dados
 * estruturados. Quando uma resposta precisa de link, ele vai em `acao`, e a
 * tela o desenha depois do texto.
 *
 * As definições do método repetem o que `src/lib/stats.ts` calcula. Mudou a
 * conta lá, muda o texto aqui: o teste ao lado confere as frases que não podem
 * ficar para trás.
 */

export interface Acao {
  rotulo: string;
  href: string;
}

export interface Pergunta {
  /** Âncora na página: outras telas apontam para cá (`/perguntas#roi`). */
  id: string;
  pergunta: string;
  /** Um parágrafo por item. */
  resposta: string[];
  acao?: Acao;
}

/** Um termo do método: o nome curto na tela, e a pergunta nos dados estruturados. */
export interface Termo extends Pergunta {
  termo: string;
}

const UNIDADE = `R$ ${VALOR_UNIDADE.toFixed(2).replace(".", ",")}`;

const PLANILHA: Acao = { rotulo: "Abrir a planilha pública", href: PLANILHA_URL };

export const METODO: Termo[] = [
  {
    id: "lucro",
    termo: "Lucro",
    pergunta: "Como o lucro é calculado?",
    resposta: [
      "O lucro de cada aposta vem da própria planilha. Numa green, é o valor apostado vezes a odd, menos o valor apostado. Numa red, é o valor apostado, negativo. Void e pendente valem zero.",
      "O lucro de um período é a soma do lucro de todas as apostas dele.",
    ],
  },
  {
    id: "unidade",
    termo: "Unidade",
    pergunta: "Quanto vale uma unidade?",
    resposta: [
      `Uma unidade (1u) vale ${UNIDADE}. Cada aposta tem o próprio valor, e em unidades ele é o valor dividido por ${VALOR_UNIDADE.toFixed(0)}.`,
      "O quadro “Quanto vale 1 unidade para você?”, no Painel e em Apostas, refaz as contas em reais para a sua banca. Com a unidade em R$ 20, uma aposta de R$ 100 aparece como R$ 20, e o lucro dela encolhe na mesma proporção.",
    ],
  },
  {
    id: "roi",
    termo: "ROI",
    pergunta: "Como o ROI é calculado?",
    resposta: [
      "ROI é o lucro dividido pelo total apostado. É a medida que diz quanto cada real apostado rendeu, e é a que serve para comparar períodos, adms e grupos.",
      "O total apostado inclui as apostas anuladas e as pendentes, do mesmo jeito que a planilha calcula. Por isso, enquanto há pendentes, o ROI fica um pouco mais perto de zero do que vai ficar quando elas se resolverem.",
    ],
  },
  {
    id: "taxa-de-acerto",
    termo: "Taxa de acerto",
    pergunta: "Como a taxa de acerto é calculada?",
    resposta: [
      "É o número de greens dividido pelo número de apostas decididas, ou seja, greens mais reds. Voids e pendentes ficam de fora.",
      "Sozinha, ela não diz se um grupo ganha dinheiro. Acertar 35% em odds perto de 4 rende mais do que acertar 60% em odds perto de 1,5. Quem diz isso é o ROI.",
    ],
  },
  {
    id: "maior-queda",
    termo: "Maior queda",
    pergunta: "O que é a maior queda?",
    resposta: [
      "É a maior distância entre um ponto alto da curva de lucro acumulado, fechada dia a dia, e o ponto mais baixo que veio depois dele.",
      "Responde quanto a banca chegou a devolver antes de voltar a subir. Lucro e ROI dizem aonde o grupo chegou; a maior queda diz quanto se sofreu no caminho.",
    ],
  },
  {
    id: "void-e-pendente",
    termo: "Void e pendente",
    pergunta: "O que são apostas void e pendentes?",
    resposta: [
      "Void é a aposta anulada pela casa, por jogo cancelado ou mercado invalidado. O valor volta, o lucro é zero e ela não conta nem como acerto nem como erro.",
      "Pendente é a aposta que ainda espera o resultado. Apostas de longo prazo, como campeão de campeonato, ficam pendentes até o evento acontecer e aparecem no fim do feed.",
    ],
  },
];

export const PERGUNTAS: Pergunta[] = [
  {
    id: "de-onde-vem",
    pergunta: "De onde vêm os números?",
    resposta: [
      "De uma planilha pública no Google Sheets, que qualquer pessoa pode abrir. Cada aposta enviada no canal é registrada nela automaticamente por um bot, com partida, mercado, casa, odd e valor.",
      "O site lê essa planilha e faz as contas. Nenhum número é digitado à mão aqui.",
    ],
    acao: PLANILHA,
  },
  {
    id: "atualizacao",
    pergunta: "Com que frequência o site atualiza?",
    resposta: [
      "As telas releem a planilha sozinhas a cada minuto enquanto estão abertas. Um resultado lançado na planilha costuma aparecer no site em um ou dois minutos.",
      "O selo “Atualizado”, no Painel, diz há quanto tempo foi a última leitura.",
    ],
  },
  {
    id: "conferir",
    pergunta: "Dá para conferir aposta por aposta?",
    resposta: [
      "Sim. Toda tela de números tem o link para a planilha original, e o feed de Apostas tem busca e filtros por dia, adm, casa, esporte, resultado e faixa de odd.",
    ],
    acao: { rotulo: "Ir para o feed de Apostas", href: "/apostas" },
  },
  {
    id: "adm",
    pergunta: "O que é um adm?",
    resposta: [
      "É quem envia as entradas no canal. Cada aposta registra o adm que a enviou, e a tela Adms mostra o resultado de cada um separadamente, por casa e por esporte.",
    ],
    acao: { rotulo: "Ver os adms", href: "/adms" },
  },
  {
    id: "travas",
    pergunta: "O que são as travas de segurança?",
    resposta: [
      `O bot lê o limite informado em cada entrada e sinaliza quando a casa aceita menos do que a unidade recomendada (base 1u = ${UNIDADE}).`,
    ],
  },
  {
    id: "como-entrar",
    pergunta: "Como eu entro no grupo?",
    resposta: [
      "Pelo Telegram: é só abrir o canal @vemproGeogeTips e entrar. Não existe cadastro no site.",
    ],
    acao: { rotulo: "Abrir o canal no Telegram", href: TELEGRAM_URL },
  },
  {
    id: "pago",
    pergunta: "O grupo é pago?",
    resposta: [
      "Hoje a entrada é pelo canal gratuito no Telegram. Um canal pago está em preparação e, quando abrir, vai ser anunciado no canal e aqui no site.",
    ],
  },
  {
    id: "banca",
    pergunta: "Preciso de muita banca para acompanhar?",
    resposta: [
      "Não existe valor mínimo. O quadro “Quanto vale 1 unidade para você?” mostra o histórico inteiro na escala da sua banca.",
      "O que importa é a unidade ser uma parte pequena da banca, para ela aguentar as fases ruins. A maior queda, no gráfico do Painel, mostra o tamanho das fases ruins que já aconteceram.",
    ],
  },
  {
    id: "garantia",
    pergunta: "Resultado passado garante lucro no futuro?",
    resposta: [
      "Não. O histórico mostra o que aconteceu, com os meses negativos incluídos, mas não promete o que vai acontecer. Apostas envolvem risco de perda financeira.",
      "Aposte apenas o que você pode perder e nunca para recuperar prejuízo.",
    ],
  },
  {
    id: "casa-de-apostas",
    pergunta: "O GeogeTips é uma casa de apostas?",
    resposta: [
      "Não. O GeogeTips registra e analisa as entradas enviadas no canal. Não somos casa de apostas, não intermediamos apostas e não garantimos retorno.",
    ],
  },
  {
    id: "ajuda",
    pergunta: "E se o jogo deixar de ser diversão?",
    resposta: [
      "Procure ajuda. O Jogadores Anônimos tem grupos de apoio gratuitos, e o CVV atende pelo telefone 188, a qualquer hora. Apostas são proibidas para menores de 18 anos.",
    ],
    acao: { rotulo: "Jogadores Anônimos", href: "https://jogadoresanonimos.com.br" },
  },
];

/**
 * Os dados estruturados da página, no formato `FAQPage` do schema.org.
 *
 * Método e perguntas entram juntos: para o buscador, "como o ROI é calculado?"
 * é uma pergunta como as outras.
 */
export function dadosEstruturados(): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [...METODO, ...PERGUNTAS].map((p) => ({
      "@type": "Question",
      name: p.pergunta,
      acceptedAnswer: { "@type": "Answer", text: p.resposta.join("\n\n") },
    })),
  };
}

/**
 * JSON pronto para ir dentro de `<script type="application/ld+json">`.
 *
 * `<` escapado: um "</script>" dentro de uma resposta fecharia a tag no meio e
 * o resto viraria HTML da página.
 */
export function jsonParaScript(dados: object): string {
  return JSON.stringify(dados).replace(/</g, "\\u003c");
}
