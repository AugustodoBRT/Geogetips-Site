/**
 * O nome de cada rota: o título que vai no metadado e o que vai no `<h1>`.
 *
 * Mora aqui, e não na tela, pelo mesmo motivo que o texto do FAQ mora em
 * `src/lib/perguntas.ts`: **sai em dois lugares**. Cada rota escrevia o próprio
 * título duas vezes — uma no `metadata` do seu `layout.tsx` e outra no `<h1>`
 * da página — e nada ligava as duas. É o mesmo defeito que criou o
 * `TITULO_DA_HOME`, multiplicado por sete.
 *
 * ## O que entra aqui, e o que não entra
 *
 * Este é o primeiro pedaço da camada de texto da #127, e a fronteira dela é:
 * **aqui entra só o que a pessoa lê.**
 *
 * O **caminho** da rota não entra. Ele é identificador — viaja no endereço, no
 * sitemap e no canonical —, e quem decide o que fazer com ele é a #128. Separar
 * as duas coisas é a regra que o resto desta issue segue, e começa aqui.
 *
 * Os **nomes curtos** — os do menu, os do rodapé e os dos atalhos do 404 —
 * também ficam para depois. Hoje `/perguntas` aparece como "FAQ" no menu e como
 * "Perguntas frequentes" no rodapé e no 404; decidir se isso vira um nome só é
 * decisão de produto, e decisão de produto não entra no trabalho que está
 * provando a forma.
 *
 * ## Nada muda na tela
 *
 * Os valores abaixo são, caractere a caractere, os que já estavam no código.
 *
 * Em `estatisticas` o `<h1>` escrevia `&amp;` e o metadado escrevia `&`. Não era
 * divergência de saída: o JSX resolve a entidade em tempo de compilação, então
 * os dois sempre renderizaram o mesmo `&`. A divergência era de código-fonte, e
 * some junto.
 */

const ROTAS = {
  home: {
    titulo: "GeogeTips — Matemática para ganhar",
    descricao:
      "Histórico aberto de apostas esportivas: cada uma planilhada, com ROI, " +
      "taxa de acerto e evolução da banca. Grupo gratuito no Telegram.",
  },
  painel: {
    titulo: "Painel de Performance",
    descricao:
      "Lucro, ROI, taxa de acerto e evolução da banca do GeogeTips, calculados a partir da planilha pública de apostas.",
  },
  apostas: {
    titulo: "Feed de Apostas",
    descricao:
      "Todas as apostas do GeogeTips em ordem cronológica, com odd, casa, valor e resultado. Filtre por data, esporte, casa e faixa de odd.",
  },
  historico: {
    titulo: "Histórico Mês a Mês",
    descricao:
      "Resultado, ROI e taxa de acerto de cada mês do GeogeTips lado a lado, incluindo os meses negativos.",
  },
  adms: {
    titulo: "Performance dos Adms",
    descricao:
      "Taxa de acerto, volume, ROI e lucro em unidades de cada adm do GeogeTips.",
  },
  estatisticas: {
    titulo: "Estatísticas & Padrões",
    descricao:
      "Distribuição de resultados, médias de odd e lucro por esporte e por casa de apostas no GeogeTips.",
  },
  perguntas: {
    titulo: "Perguntas frequentes",
    descricao:
      "Como o lucro, o ROI, a taxa de acerto e a maior queda do GeogeTips são calculados, e o que perguntam antes de entrar no grupo.",
  },
  calculadora: {
    titulo: "Calculadora de valor esperado",
    descricao:
      "Odd justa, hold, surebet e múltiplas: descubra se uma odd paga mais do que a probabilidade real justifica, e quanto apostar nela pelo critério de Kelly.",
  },
} as const;

/**
 * O acessador.
 *
 * Existe para ser **a única linha desta seção que a #128 vai mexer**: quando
 * houver um segundo idioma, é aqui que ele é escolhido, e nenhuma das dez telas
 * que consomem isto muda. Uma constante importada direto não daria essa
 * fronteira — daria um idioma por processo, e cinco das sete rotas de página
 * são componentes de cliente, que não enxergam a requisição.
 */
export function textoDasRotas() {
  return ROTAS;
}
