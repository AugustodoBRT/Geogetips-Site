import { inicioDeHoje, parseDateTimestamp } from "./date";
import type { BetItem } from "./types";

/**
 * As medidas de risco do Painel (#68).
 *
 * Lucro e ROI dizem aonde o grupo chegou. Isto diz quanto se sofreu no
 * caminho, que é a pergunta de quem pensa em acompanhar: quanta banca é
 * preciso para atravessar a fase ruim sem quebrar.
 *
 * Tudo em reais na escala da planilha (1u = R$ 100). Quem mostra na unidade do
 * visitante é a tela, com `converter` — as contas aqui não mudam com ela.
 */

/** Um dia fechado: a data como a planilha escreve, o resultado e o volume. */
export interface DiaFechado {
  data: string;
  lucro: number;
  apostas: number;
}

export interface Queda {
  /** Quanto a curva caiu, do pico ao vale. Zero quando ela nunca caiu. */
  valor: number;
  /** Índice do pico na série; -1 quando o pico é o ponto de partida. */
  inicio: number;
  /** Índice do vale na série; -1 quando não houve queda. */
  fim: number;
}

/**
 * A maior queda de uma curva acumulada, de um pico até o vale seguinte.
 *
 * `inicial` é onde a curva estava antes do primeiro ponto — zero no começo
 * do histórico, ou o acumulado até a véspera numa janela do meio. Sem ele, um
 * primeiro dia negativo passava em branco: o pico começava nele mesmo, e a
 * queda que ele representa não contava.
 */
export function maiorQueda(acumulado: readonly number[], inicial = 0): Queda {
  let pico = inicial;
  let indicePico = -1;
  const maior: Queda = { valor: 0, inicio: -1, fim: -1 };
  acumulado.forEach((ponto, i) => {
    if (ponto > pico) {
      pico = ponto;
      indicePico = i;
    }
    const queda = pico - ponto;
    if (queda > maior.valor) {
      maior.valor = queda;
      maior.inicio = indicePico;
      maior.fim = i;
    }
  });
  return maior;
}

/**
 * Os dias já vividos, do mais antigo ao mais novo, com o resultado de cada um.
 *
 * Dia futuro fica de fora: é aposta de longo prazo, pendente e com lucro zero,
 * e contaria como dia parado. Data que não se lê também.
 */
export function diasFechados(
  bets: readonly BetItem[],
  ref: Date = new Date()
): DiaFechado[] {
  const hoje = inicioDeHoje(ref);
  const porDia = new Map<string, DiaFechado & { ts: number }>();
  for (const b of bets) {
    const ts = parseDateTimestamp(b.data);
    if (ts === 0 || ts > hoje) continue;
    const dia = porDia.get(b.data) ?? { data: b.data, lucro: 0, apostas: 0, ts };
    dia.lucro += b.lucro;
    dia.apostas += 1;
    porDia.set(b.data, dia);
  }
  return Array.from(porDia.values())
    .sort((a, b) => a.ts - b.ts)
    .map(({ data, lucro, apostas }) => ({ data, lucro: arredondar(lucro), apostas }));
}

/**
 * A maior sequência de um resultado, aposta a aposta, na ordem da planilha.
 *
 * As apostas chegam do servidor da mais nova para a mais antiga, com a posição
 * na planilha desempatando dentro do dia (`ordenarApostas`). Virar a lista e
 * reordenar por data, de forma estável, devolve a ordem em que foram lançadas.
 * Void e pendente não entram e não quebram a sequência: uma anulada no meio de
 * cinco reds não fez ninguém ganhar nada.
 */
export function maiorSequencia(
  bets: readonly BetItem[],
  resultado: "GREEN" | "RED",
  ref: Date = new Date()
): number {
  const hoje = inicioDeHoje(ref);
  const cronologica = [...bets]
    .reverse()
    .map((b) => ({ b, ts: parseDateTimestamp(b.data) }))
    .filter(({ ts }) => ts > 0 && ts <= hoje)
    .sort((x, y) => x.ts - y.ts)
    .map(({ b }) => b)
    .filter((b) => b.resultado === "GREEN" || b.resultado === "RED");

  let atual = 0;
  let maior = 0;
  for (const b of cronologica) {
    atual = b.resultado === resultado ? atual + 1 : 0;
    if (atual > maior) maior = atual;
  }
  return maior;
}

export interface Risco {
  maiorQueda: { valor: number; pico: string | null; vale: string | null };
  maiorSequenciaDeReds: number;
  maiorSequenciaDeGreens: number;
  melhorDia: DiaFechado | null;
  piorDia: DiaFechado | null;
  /** Lucro da melhor e da pior aposta sozinha. */
  maiorGreen: number;
  maiorRed: number;
  diasComAposta: number;
  diasNoVerde: number;
  diasNoVermelho: number;
  mediaDeApostasPorDia: number;
}

/** Todas as medidas de risco de um recorte de apostas. */
export function calcularRisco(bets: readonly BetItem[], ref: Date = new Date()): Risco {
  const dias = diasFechados(bets, ref);

  let acumulado = 0;
  const curva = dias.map((d) => {
    acumulado += d.lucro;
    return acumulado;
  });
  const queda = maiorQueda(curva);

  const decididas = bets.filter((b) => b.resultado === "GREEN" || b.resultado === "RED");
  const lucros = decididas.map((b) => b.lucro);

  let melhorDia: DiaFechado | null = null;
  let piorDia: DiaFechado | null = null;
  for (const d of dias) {
    if (!melhorDia || d.lucro > melhorDia.lucro) melhorDia = d;
    if (!piorDia || d.lucro < piorDia.lucro) piorDia = d;
  }

  const apostasNosDias = dias.reduce((acc, d) => acc + d.apostas, 0);

  return {
    maiorQueda: {
      valor: arredondar(queda.valor),
      // Pico no ponto de partida: a curva caiu já no primeiro dia, antes de
      // subir. Não há dia para apontar como pico.
      pico: queda.inicio >= 0 ? dias[queda.inicio].data : null,
      vale: queda.fim >= 0 ? dias[queda.fim].data : null,
    },
    maiorSequenciaDeReds: maiorSequencia(bets, "RED", ref),
    maiorSequenciaDeGreens: maiorSequencia(bets, "GREEN", ref),
    melhorDia,
    piorDia,
    maiorGreen: lucros.length > 0 ? Math.max(...lucros, 0) : 0,
    maiorRed: lucros.length > 0 ? Math.min(...lucros, 0) : 0,
    diasComAposta: dias.length,
    diasNoVerde: dias.filter((d) => d.lucro > 0).length,
    diasNoVermelho: dias.filter((d) => d.lucro < 0).length,
    mediaDeApostasPorDia: dias.length > 0 ? apostasNosDias / dias.length : 0,
  };
}

function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}
