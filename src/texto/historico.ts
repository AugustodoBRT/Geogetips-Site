import { formatarDecimal, formatarInteiro, formatarUnidades } from "@/lib/format";
import { contagem } from "./forma";

/**
 * O texto da tela de Histórico.
 *
 * Primeira tela inteira extraída na #127, e serve de molde para as outras: o
 * JSX não escreve mais frase, não decide mais plural e não cola mais pedaço.
 *
 * ## As regras que esta seção estabelece
 *
 * **Entrada fixa é string. Entrada montada é função.** Com um buraco, o
 * parâmetro é posicional; com dois ou mais, é um objeto nomeado — assim o
 * compilador cobra todos os valores e ninguém troca a ordem por engano.
 *
 * **A entrada recebe número e chama o `format.ts` por dentro.** O JSX não
 * formata mais nada antes de passar, e por isso a decisão de separador decimal
 * continua inteira na #126, num lugar só.
 *
 * **A entrada nasce pronta.** Sem `.toLowerCase()` do lado de fora, sem
 * `first-letter:uppercase`, sem concatenação na tela.
 *
 * ## Uma inconsistência que foi preservada de propósito
 *
 * O cartão escreve "1 mês" e o `aria-label` das barras escreve "1 meses": lá a
 * contagem nunca teve plural. Está errado para quem ouve a tela, e **continua
 * errado aqui**, porque consertar mudaria a saída — e este trabalho promete não
 * mudar nenhuma. A extração grava a inconsistência de hoje na estrutura, onde
 * ela fica visível; consertá-la é decisão própria, com teste vermelho junto.
 */

/** O que separa os itens da lista no `aria-label` das barras. */
const SEPARADOR_DA_LISTA = ", ";

const HISTORICO = {
  selo: "Consolidado",
  escopo:
    "Todos os meses da planilha lado a lado, incluindo os negativos. O ROI é recalculado sobre a soma do período — não é a média dos ROIs mensais.",
  /** O mesmo texto no `aria-label` e no `title` do botão, como já era. */
  recarregar: "Recarregar dados",
  vazio: "Nenhum mês encontrado na planilha.",

  consolidado: {
    rotulo: "Resultado Consolidado",
    legenda: (d: { unidades: number; meses: number }) =>
      `${formatarUnidades(d.unidades)} em ${contagem(d.meses, "mês", "meses")}`,
    /** O sufixo âmbar. O espaço da frente continua no JSX, como `{" "}`. */
    emAndamento: (mes: string) => `· ${mes} em andamento`,
  },

  roi: {
    rotulo: "ROI do Período",
    legenda: "Sobre a soma de tudo que foi apostado",
  },

  apostas: {
    rotulo: "Apostas",
    /** O ramo do Void sai do JSX e vem para cá, inteiro. */
    legenda: (d: { greens: number; reds: number; voids: number }) => {
      const base = `${formatarInteiro(d.greens)} Green · ${formatarInteiro(d.reds)} Red`;
      return d.voids > 0 ? `${base} · ${formatarInteiro(d.voids)} Void` : base;
    },
  },

  taxa: {
    rotulo: "Taxa de Acerto",
    legenda: (negativos: number) =>
      negativos === 0
        ? "Nenhum mês negativo"
        : contagem(negativos, "mês negativo", "meses negativos"),
  },

  barras: {
    titulo: "Resultado por mês",
    sub: "Barras acima da linha são lucro, abaixo são prejuízo",
    parcial: "parcial",
    /**
     * A lista falada, em três entradas: invólucro, item e separador.
     *
     * Eram uma só, montada com `.map().join(", ")` dentro do template do JSX —
     * e o `", "` não existia como texto em lugar nenhum, o que o tornava
     * intraduzível sem alguém notar que ele estava lá.
     */
    aria: {
      involucro: (d: { meses: number; lista: string }) =>
        `Resultado de ${d.meses} meses: ${d.lista}`,
      item: (d: { mes: string; unidades: number }) =>
        `${d.mes} ${formatarDecimal(d.unidades, 2)} unidades`,
      separador: SEPARADOR_DA_LISTA,
    },
  },

  tabela: {
    legenda: "Resultados por mês: apostas, greens, reds, resultado e ROI",
    colunas: {
      mes: "Mês",
      apostas: "Apostas",
      green: "Green",
      red: "Red",
      acerto: "Acerto",
      odd: "Odd méd.",
      resultado: "Resultado",
      roi: "ROI",
    },
    irParaPainel: (mes: string) => `Abrir o Painel de ${mes}`,
    emAndamento: "em andamento",
    /** O travessão de "não há valor". Não é a sentinela de `lib/padroes.ts`. */
    semValor: "—",
    total: "Total",
  },
} as const;

/** O acessador. É a única linha desta seção que a #128 vai mexer. */
export function textoDoHistorico() {
  return HISTORICO;
}
