/**
 * O texto da moldura: o menu, o rodapé e o atalho de pular para o conteúdo.
 *
 * É o que aparece em **toda** tela, e por isso vive longe de todas elas.
 *
 * ## Por que os nomes curtos não estão em `rotas.ts`
 *
 * Parecem o mesmo assunto, e não são. `rotas.ts` guarda como **a página se
 * chama** — o título que vai no metadado e no `<h1>`. Aqui estão os nomes que
 * **a moldura usa** para listar destinos, que é outra coisa: nem toda rota tem
 * um (a calculadora fica fora do menu de propósito), e uma delas tem dois.
 *
 * Juntar os dois num registro só forçaria campos opcionais em todas as
 * entradas para acomodar duas exceções. A moldura tem a sua lista.
 */

const MOLDURA = {
  /** O nome curto de cada destino — o que cabe num menu. */
  rotas: {
    home: "Início",
    painel: "Painel",
    apostas: "Apostas",
    historico: "Histórico",
    adms: "Adms",
    estatisticas: "Estatísticas",
    /**
     * `/perguntas` é a única rota com **dois** nomes curtos: "FAQ" no menu e
     * "Perguntas frequentes" no rodapé e nos atalhos do 404. Para as outras
     * cinco, o nome curto é a mesma palavra em três cópias.
     *
     * Está preservado assim de propósito. A decisão de produto já foi tomada —
     * em 24/11/2026, fica **um nome só, "FAQ"** —, mas aplicá-la muda o que o
     * visitante lê em dois lugares, e esta extração promete não mudar nada.
     * Sai em trabalho próprio, com as duas asserções de `e2e/` que prendem o
     * texto de hoje mudando junto, como evidência.
     *
     * Quando isso acontecer, estes dois campos viram um.
     */
    perguntas: {
      menu: "FAQ",
      lista: "Perguntas frequentes",
    },
  },

  /** O que o leitor de tela ouve da navegação, e o e2e cobra pelo papel. */
  navegacao: {
    principal: "Navegação principal",
    menu: "Menu",
    abrir: "Abrir menu",
    fechar: "Fechar menu",
  },

  /** O primeiro link da página, que só aparece com o foco. */
  pularParaConteudo: "Pular para o conteúdo",
} as const;

/** O acessador. É a única linha desta seção que a #128 vai mexer. */
export function textoDaMoldura() {
  return MOLDURA;
}
