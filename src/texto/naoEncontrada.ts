/**
 * O texto do 404.
 *
 * A tela inteira vem para cá de uma vez, e não só os nomes dos atalhos: são
 * 74 linhas, e deixar metade extraída obrigaria a abrir o arquivo duas vezes
 * na mesma issue.
 *
 * O comentário de topo de `src/app/not-found.tsx` explica por que esta página
 * existe — sem ela o Next responde "This page could not be found", em inglês.
 * Vale lembrar disso aqui porque, no dia da virada, **é o único arquivo do
 * site cujo motivo de existir muda de sentido**: a tela padrão em inglês deixa
 * de ser o problema. O teste que guarda isso, em
 * `e2e/celular-e-visual.spec.ts`, já carrega o aviso.
 *
 * Os **nomes** dos atalhos não estão aqui: são nomes de rota, e moram em
 * `moldura.ts` junto com os do menu e os do rodapé. Aqui está só o que é
 * próprio desta tela — inclusive a frase de cada atalho, que descreve o
 * destino e só existe nela.
 */

const NAO_ENCONTRADA = {
  /** O `metadata.title`. O e2e cobra por `toHaveTitle`. */
  titulo: "Página não encontrada",
  selo: "Erro 404",
  cabecalho: "Esta página não existe.",
  texto:
    "O endereço pode ter mudado, ou o link que te trouxe até aqui está errado. Os números continuam todos no lugar — é só escolher por onde entrar.",

  atalhos: {
    aria: "Atalhos do site",
    /** Uma frase por destino, dizendo o que se acha lá. */
    painel: "Lucro, ROI e evolução da banca",
    apostas: "O feed, dia a dia",
    historico: "Todos os meses lado a lado",
    adms: "O resultado de cada adm",
    estatisticas: "Por esporte e por casa",
    perguntas: "Como cada número é calculado",
  },

  voltar: "Voltar para o início",
} as const;

/** O acessador. É a única linha desta seção que a #128 vai mexer. */
export function textoDaPaginaNaoEncontrada() {
  return NAO_ENCONTRADA;
}
