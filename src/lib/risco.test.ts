import { describe, expect, it } from "vitest";
import { calcularRisco, diasFechados, maiorAlta, maiorQueda } from "./risco";
import type { BetItem, BetResult } from "./types";

/**
 * As medidas de risco do Painel (#68).
 *
 * `ref` fixo: "hoje" é 21/09/2026, e aposta depois disso é de longo prazo.
 */
const REF = new Date("2026-09-21T15:00:00-03:00");

let sequencia = 0;

function aposta(data: string, resultado: BetResult, lucro = 0): BetItem {
  sequencia += 1;
  return {
    id: `r${sequencia}`,
    data,
    esporte: "Futebol",
    tipster: "Manel",
    partida: "A x B",
    tip: "Over 2.5",
    casa: "Bet365",
    odd: 2,
    valor: 100,
    unidades: 1,
    resultado,
    lucro,
  };
}

/**
 * O servidor manda as apostas da mais nova para a mais antiga, com a posição
 * na planilha desempatando dentro do dia. Escrever na ordem em que foram
 * lançadas e virar a lista reproduz isso.
 */
function comoOServidorManda(cronologica: BetItem[]): BetItem[] {
  return [...cronologica].reverse();
}

describe("maiorQueda", () => {
  it("acha o maior tombo de um pico ao vale seguinte", () => {
    expect(maiorQueda([100, 50, 150, 20, 80])).toEqual({ valor: 130, inicio: 2, fim: 3 });
  });

  // Com o pico começando no primeiro ponto, um primeiro dia negativo passava em
  // branco. O ponto de partida é zero, e cair dele também é queda.
  it("conta a queda do primeiro dia, a partir do ponto de partida", () => {
    expect(maiorQueda([-50, -80, 30])).toEqual({ valor: 80, inicio: -1, fim: 1 });
  });

  it("parte de onde a curva estava antes da janela", () => {
    expect(maiorQueda([90, 120], 100)).toEqual({ valor: 10, inicio: -1, fim: 0 });
  });

  it("é zero quando a curva só sobe", () => {
    expect(maiorQueda([10, 20, 30])).toEqual({ valor: 0, inicio: -1, fim: -1 });
    expect(maiorQueda([])).toEqual({ valor: 0, inicio: -1, fim: -1 });
  });
});

describe("maiorAlta", () => {
  it("acha a maior subida de um vale ao pico seguinte", () => {
    // Vale -80 no índice 2, pico 100 no índice 4: subiu 180. A subida de -50
    // a 30, antes dele, foi menor.
    expect(maiorAlta([-50, 30, -80, 40, 100, 60])).toEqual({
      valor: 180,
      inicio: 2,
      fim: 4,
    });
  });

  it("conta a subida do primeiro dia, a partir do ponto de partida", () => {
    expect(maiorAlta([50, 80, -30])).toEqual({ valor: 80, inicio: -1, fim: 1 });
  });

  it("parte de onde a curva estava antes da janela", () => {
    expect(maiorAlta([110, 90], 100)).toEqual({ valor: 10, inicio: -1, fim: 0 });
  });

  it("é zero quando a curva só cai", () => {
    expect(maiorAlta([-10, -20, -30])).toEqual({ valor: 0, inicio: -1, fim: -1 });
    expect(maiorAlta([])).toEqual({ valor: 0, inicio: -1, fim: -1 });
  });
});

describe("diasFechados", () => {
  it("soma cada dia, do mais antigo ao mais novo, sem futuro nem data ilegível", () => {
    const dias = diasFechados(
      [
        aposta("20/09/2026", "GREEN", 100),
        aposta("20/09/2026", "RED", -50),
        aposta("19/09/2026", "RED", -100),
        aposta("21/09/2026", "PENDENTE"),
        aposta("30/12/2026", "PENDENTE"),
        aposta("—", "GREEN", 999),
      ],
      REF
    );
    expect(dias).toEqual([
      { data: "19/09/2026", lucro: -100, apostas: 1 },
      { data: "20/09/2026", lucro: 50, apostas: 2 },
      { data: "21/09/2026", lucro: 0, apostas: 1 },
    ]);
  });
});

describe("calcularRisco", () => {
  it("junta tudo num recorte", () => {
    const risco = calcularRisco(
      comoOServidorManda([
        aposta("17/09/2026", "GREEN", 300),
        aposta("18/09/2026", "RED", -100),
        aposta("18/09/2026", "RED", -150),
        aposta("19/09/2026", "GREEN", 80),
        aposta("19/09/2026", "RED", -100),
        aposta("20/09/2026", "VOID"),
        aposta("21/09/2026", "GREEN", 120),
      ]),
      REF
    );

    // Curva: 300, 50, 30, 30, 150. Pico 300 no dia 17, vale 30 no dia 19.
    expect(risco.maiorQueda).toEqual({
      valor: 270,
      pico: "17/09/2026",
      vale: "19/09/2026",
    });
    // Do vale de 30 no dia 19 ao pico de 150 no dia 21. A subida do começo,
    // de 0 a 300 no dia 17, é maior: essa é a alta.
    expect(risco.maiorAlta).toEqual({ valor: 300, vale: null, pico: "17/09/2026" });
    expect(risco.melhorDia).toEqual({ data: "17/09/2026", lucro: 300, apostas: 1 });
    expect(risco.piorDia).toEqual({ data: "18/09/2026", lucro: -250, apostas: 2 });
    expect(risco.maiorGreen).toBe(300);
    expect(risco.maiorRed).toBe(-150);
    expect(risco.diasComAposta).toBe(5);
    expect(risco.diasNoVerde).toBe(2);
    expect(risco.diasNoVermelho).toBe(2);
    expect(risco.mediaDeApostasPorDia).toBeCloseTo(7 / 5, 10);
  });

  it("queda já no primeiro dia não tem dia de pico para apontar", () => {
    const risco = calcularRisco([aposta("20/09/2026", "RED", -100)], REF);
    expect(risco.maiorQueda).toEqual({ valor: 100, pico: null, vale: "20/09/2026" });
  });

  it("recorte vazio não inventa número", () => {
    expect(calcularRisco([], REF)).toEqual({
      maiorQueda: { valor: 0, pico: null, vale: null },
      maiorAlta: { valor: 0, vale: null, pico: null },
      melhorDia: null,
      piorDia: null,
      maiorGreen: 0,
      maiorRed: 0,
      diasComAposta: 0,
      diasNoVerde: 0,
      diasNoVermelho: 0,
      mediaDeApostasPorDia: 0,
    });
  });
});
