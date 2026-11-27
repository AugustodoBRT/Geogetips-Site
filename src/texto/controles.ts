import type { Trecho } from "./forma";

/**
 * O texto dos controles que aparecem em mais de uma tela.
 *
 * Vinte e duas entradas, seis delas montadas, tiradas de cinco componentes de
 * `src/components`.
 *
 * É o irmão de `moldura.ts`: lá mora o que toda tela tem em volta — menu,
 * rodapé, atalho —, e aqui o que várias telas têm **dentro**, para recortar o
 * que elas mostram. A conta de quem usa o quê, hoje:
 *
 * | controle | telas |
 * |---|---|
 * | `SeletorGrupo` | painel, apostas, adms, estatísticas, histórico |
 * | `SeletorAba` | painel, apostas, adms, estatísticas |
 * | `SeletorUnidade` | painel, apostas, estatísticas, histórico |
 * | `FiltroPeriodo` | painel, apostas |
 * | `SeletorMultiplo` | apostas |
 *
 * Por isso a extração destes cinco é a primeira que precisou de um retrato em
 * **cinco rotas**: mudar uma palavra aqui muda cinco telas de uma vez.
 *
 * ## O que fica de fora, e por quê
 *
 * **`Dialogo` não entra, porque não tem texto.** O `aria-label` dele vem de
 * quem o abre — hoje `adms.ts`, `estatisticas.ts` e o `DetalheAposta`. Foi
 * conferido arquivo por arquivo: ele é moldura de acessibilidade, não texto.
 *
 * **O nome dos grupos não entra.** "Canal gratuito", "Grátis",
 * "GeogeTips - Sigma" e "Sigma" moram em `src/lib/grupos.ts`, junto do `id`
 * que vai ao endereço e do atraso em dias. É o mesmo caso dos catorze arquivos
 * de `src/lib`, e é da #151. O `SeletorGrupo` recebe o catálogo pronto; o que
 * ele escreve de seu é o nome da barra de botões.
 *
 * **O rótulo da aba agregada tem dois donos, e os dois ficam.** O seletor
 * escreve "Todos os Meses (Geral)" na opção; `rotuloDaAba`, em
 * `src/lib/constants.ts`, devolve "Geral" para a mesma aba, e é esse que vira
 * título de tela e nome de arquivo CSV. Duas palavras para a mesma coisa, em
 * dois lugares, de propósito: uma é opção de menu e a outra é rótulo curto.
 * Quem unificar decide pelos dois.
 *
 * ## Dois plurais sem singular, preservados
 *
 * `grupo.atraso` escreve "com 3 dias de atraso" e "3 dias depois da data do
 * jogo". Com um dia só, diria "1 dias" nas duas. Hoje não acontece — o único
 * grupo com atraso tem três —, mas o texto não tem defesa nenhuma contra isso,
 * e trocar para `contagem` mudaria a saída no dia em que acontecesse. Fica
 * como está, com teste, e o conserto é a #159.
 *
 * ## Uma frase com dois destaques de cores diferentes
 *
 * `unidade.simulacao` abre com um aviso em âmbar e tem, no meio, um segundo
 * destaque com a ênfase comum. É o caso que o `papel` de `forma.ts` existe
 * para resolver, e trouxe o quarto deles: `aviso`.
 *
 * Já `grupo.atraso` tem dois destaques com o **mesmo** desenho, e por isso
 * nenhum dos dois leva papel — a regra do `forma.ts` vale aqui tal como está
 * escrita lá.
 */

const CONTROLES = {
  /**
   * O intervalo de datas, aberto dos dois lados.
   *
   * "De" e "até" são palavras soltas em volta dos campos, e não um rótulo
   * partido ao meio: o `<label>` de cada campo é o `sr-only` ao lado, que diz
   * a coisa inteira. Em outro idioma as duas podem virar uma só, ou nenhuma.
   */
  periodo: {
    de: "De",
    ate: "até",
    dataInicial: "Data inicial",
    dataFinal: "Data final",

    /**
     * O que o filtro diz quando alguém digita um fim anterior ao começo.
     *
     * O calendário impede, mas digitar direto no campo não — e a tela
     * respondia "Nenhuma aposta corresponde aos filtros", que é verdade e
     * inútil. Esta frase é a correção disso, e também é o botão que troca as
     * pontas: ela tem de continuar legível como ação.
     */
    invertido: "A data inicial está depois da final — trocar",

    /** Sai duas vezes no mesmo botão: `aria-label` e `title`. */
    limpar: "Limpar intervalo de datas",
  },

  /**
   * O filtro de várias opções, hoje só na tela de apostas.
   *
   * O substantivo — "esportes", "casas", "adms" — vem de quem usa o
   * componente, e está em `apostas.ts`. Estas duas frases o recebem pronto:
   * a de baixo monta "2 casas" e a de cima "Limpar filtro de casas". Quem
   * traduzir mexe nos dois arquivos, e é por isso que os dois dizem isso.
   */
  multiplo: {
    varios: (d: { quantas: number; substantivo: string }) =>
      `${d.quantas} ${d.substantivo}`,
    limpar: (substantivo: string) => `Limpar filtro de ${substantivo}`,

    /**
     * Quando não há opção nenhuma para marcar.
     *
     * A suíte de tela não alcança: as opções saem de todas as apostas da aba,
     * e no modo demonstração toda aba tem apostas. Travada no teste.
     */
    vazio: "Nada para filtrar neste período.",
  },

  aba: {
    /** O `<label>` do `<select>`, só no áudio. */
    rotulo: "Selecionar mês",
    /** A opção do agregado. Ver o topo do arquivo: há outra palavra para ela. */
    todas: "Todos os Meses (Geral)",
    /** `aria-label` e `title` do botão de recarregar. */
    recarregar: "Recarregar dados",
  },

  grupo: {
    /** O nome da barra de botões, só no áudio. O rótulo de cada um vem do catálogo. */
    aria: "Grupo",

    /**
     * O aviso de que o grupo mostrado atrasa o que publica.
     *
     * Dois destaques com o mesmo desenho, e por isso sem papel: a abertura e a
     * data limite. Sem este aviso, quem compara o site com o canal acha que
     * está faltando aposta por defeito.
     */
    atraso: (d: { grupo: string; dias: number; ate: string }): Trecho[] => [
      { forte: `Resultados do ${d.grupo} com ${d.dias} dias de atraso.` },
      ` Cada aposta aparece aqui ${d.dias} dias depois da data do jogo, para as ` +
        "entradas do grupo não circularem de graça. Hoje o site mostra as apostas até ",
      { forte: d.ate },
      ".",
    ],
  },

  unidade: {
    titulo: "Quanto vale 1 unidade para você?",
    explicacao: (unidade: string) =>
      `A unidade do grupo é ${unidade}. Coloque a sua e todos os valores passam ` +
      "para a sua banca — o ROI e a taxa de acerto não mudam.",

    /** O nome da fileira de atalhos de valor, só no áudio. */
    sugeridos: "Valores sugeridos",
    /** O `<label>` do campo, só no áudio. */
    rotuloDoCampo: "Valor de 1 unidade em reais",

    /**
     * O "R$" desenhado dentro do campo, antes do número.
     *
     * Entra no dicionário pelo mesmo motivo que o "%" da calculadora: é
     * símbolo que **a tela desenha**, e não unidade que o `format.ts` acrescenta
     * ao formatar. O `%` do `NumeroAnimado`, que é do formato, continua no JSX.
     */
    moeda: "R$",

    /** `aria-label` e `title` do botão que volta à unidade do grupo. */
    restaurar: "Voltar para a unidade do grupo",

    /**
     * A recusa, que o `role="status"` anuncia sem roubar o foco do campo.
     *
     * O "1.000" do fim é exemplo de ponto como separador de milhar, e é a
     * resposta ao defeito que o componente documenta: `parseFloat("1.000")`
     * devolvia 1. O exemplo só funciona em idioma que separe milhar com ponto.
     */
    recusado: (d: { minimo: string; maximo: string }) =>
      `Valor não aceito. Use algo entre ${d.minimo} e ${d.maximo} — o ponto pode ` +
      "separar o milhar, como em 1.000.",

    /**
     * O aviso de que o recálculo é simulação, com **dois** destaques de cores
     * diferentes: a abertura em âmbar e, no meio, a ênfase comum.
     */
    simulacao: (d: { original: string; escolhida: string }): Trecho[] => [
      { forte: "Simulação aproximada, não resultado exato.", papel: "aviso" },
      ` O histórico real foi operado a ${d.original} por unidade, e o recálculo ` +
        `para ${d.escolhida} apenas escala os valores proporcionalmente. Ele `,
      { forte: "não considera limites de aposta nem a liquidez" },
      " de cada mercado: em stakes maiores a casa pode não aceitar o valor cheio, e " +
        "odds altas costumam cair conforme o volume entra. Trate como ordem de grandeza.",
    ],
  },
} as const;

/** O acessador. É a única linha desta seção que a #128 vai mexer. */
export function textoDosControles() {
  return CONTROLES;
}
