import { describe, expect, it } from "vitest";
import { calcularRoi, computeStatsFromBets, mediaDeOdd, taxaDeAcerto } from "./stats";
import type { BetItem, BetResult } from "./types";

/**
 * As contas que o site promete.
 *
 * O link da planilha aparece em todas as telas de dados de propósito: qualquer
 * um confere linha a linha. Estes testes existem para que a conferência não
 * dependa de alguém lembrar de fazê-la.
 *
 * A regra que mais dói se quebrar é a diferença entre os dois denominadores:
 * **anuladas e pendentes entram no investido do ROI e ficam fora da taxa de
 * acerto**. Trocar um pelo outro não derruba o site nem quebra o build — só
 * publica número errado.
 */

let sequencia = 0;

function aposta(parcial: Partial<BetItem> & { resultado: BetResult }): BetItem {
  sequencia += 1;
  return {
    id: `t${sequencia}`,
    data: "10/09/2026",
    esporte: "Futebol",
    tipster: "Manel",
    partida: "A x B",
    tip: "Over 2.5",
    casa: "Bet365",
    odd: 2,
    valor: 100,
    unidades: 1,
    lucro: 0,
    ...parcial,
  };
}

/** Um green, um red, uma anulada e uma pendente — as quatro de uma vez. */
function carteiraCompleta(): BetItem[] {
  return [
    aposta({ resultado: "GREEN", valor: 100, lucro: 100, odd: 2 }),
    aposta({ resultado: "RED", valor: 100, lucro: -100, odd: 3 }),
    aposta({ resultado: "VOID", valor: 100, lucro: 0, odd: 1.5 }),
    aposta({ resultado: "PENDENTE", valor: 100, lucro: 0, odd: 4 }),
  ];
}

describe("taxaDeAcerto", () => {
  it("divide pelos finalizados, não pelo total", () => {
    expect(taxaDeAcerto(1, 1)).toBe(50);
    expect(taxaDeAcerto(3, 1)).toBe(75);
  });

  it("devolve 0 quando nada finalizou, em vez de dividir por zero", () => {
    expect(taxaDeAcerto(0, 0)).toBe(0);
  });

  it("arredonda para uma casa", () => {
    expect(taxaDeAcerto(1, 2)).toBe(33.3);
  });
});

describe("calcularRoi", () => {
  it("põe anuladas e pendentes no investido", () => {
    // Lucro 0 sobre 400 investidos. Se o denominador fossem só as finalizadas,
    // daria 0% sobre 200 — mesmo resultado por acaso, então o caso seguinte é
    // que separa os dois.
    expect(calcularRoi(carteiraCompleta())).toBe(0);
  });

  it("não infla o ROI ignorando o que ainda não resolveu", () => {
    const bets = [
      aposta({ resultado: "GREEN", valor: 100, lucro: 50 }),
      aposta({ resultado: "PENDENTE", valor: 100, lucro: 0 }),
    ];
    // 50 de lucro sobre 200 investidos = 25%. Tirar a pendente do denominador
    // daria 50% — o dobro, e seria o número que o grupo não reconhece.
    expect(calcularRoi(bets)).toBe(25);
  });

  it("devolve 0 sem investimento, em vez de NaN", () => {
    expect(calcularRoi([])).toBe(0);
    expect(calcularRoi([aposta({ resultado: "VOID", valor: 0, lucro: 0 })])).toBe(0);
  });

  it("aceita prejuízo", () => {
    const bets = [aposta({ resultado: "RED", valor: 200, lucro: -50 })];
    expect(calcularRoi(bets)).toBe(-25);
  });
});

describe("mediaDeOdd", () => {
  it("tira a média com duas casas", () => {
    expect(mediaDeOdd(carteiraCompleta())).toBe(2.63);
  });

  it("devolve 0 para lista vazia", () => {
    expect(mediaDeOdd([])).toBe(0);
  });
});

describe("computeStatsFromBets", () => {
  it("separa os quatro resultados", () => {
    const s = computeStatsFromBets(carteiraCompleta());
    expect(s.totalBets).toBe(4);
    expect(s.greens).toBe(1);
    expect(s.reds).toBe(1);
    expect(s.voids).toBe(1);
    expect(s.pendings).toBe(1);
  });

  it("mantém os dois denominadores separados no mesmo conjunto", () => {
    const s = computeStatsFromBets(carteiraCompleta());
    // Taxa: 1 green de 2 finalizadas. Anulada e pendente fora.
    expect(taxaDeAcerto(s.greens, s.reds)).toBe(50);
    // Investido: as quatro.
    expect(s.totalApostado).toBe(400);
  });

  it("soma o lucro com sinal", () => {
    const s = computeStatsFromBets([
      aposta({ resultado: "GREEN", lucro: 120 }),
      aposta({ resultado: "RED", lucro: -80 }),
    ]);
    expect(s.totalLucro).toBe(40);
  });

  it("não deixa anulada nem pendente virar maior green ou maior red", () => {
    const s = computeStatsFromBets([
      aposta({ resultado: "GREEN", lucro: 10 }),
      aposta({ resultado: "RED", lucro: -5 }),
      aposta({ resultado: "VOID", lucro: 0 }),
      aposta({ resultado: "PENDENTE", lucro: 0 }),
    ]);
    expect(s.maiorGreen).toBe(10);
    expect(s.maiorRed).toBe(-5);
  });

  it("agrupa por adm sem misturar quem é quem", () => {
    const s = computeStatsFromBets([
      aposta({ tipster: "Manel", resultado: "GREEN", lucro: 100 }),
      aposta({ tipster: "Manel", resultado: "RED", lucro: -100 }),
      aposta({ tipster: "Augusto", resultado: "GREEN", lucro: 200 }),
    ]);
    const manel = s.tipsters.find((t) => t.nome === "Manel");
    const augusto = s.tipsters.find((t) => t.nome === "Augusto");
    expect(manel?.totalApostas).toBe(2);
    expect(manel?.taxaAcerto).toBe(50);
    expect(augusto?.totalApostas).toBe(1);
    expect(augusto?.taxaAcerto).toBe(100);
  });

  it("conta anulada e pendente do adm sem pôr na taxa dele", () => {
    const s = computeStatsFromBets([
      aposta({ tipster: "Manel", resultado: "GREEN", lucro: 100 }),
      aposta({ tipster: "Manel", resultado: "VOID", lucro: 0 }),
      aposta({ tipster: "Manel", resultado: "PENDENTE", lucro: 0 }),
    ]);
    const manel = s.tipsters[0];
    expect(manel.totalApostas).toBe(3);
    expect(manel.voids).toBe(1);
    expect(manel.pendentes).toBe(1);
    // Uma finalizada, e ela foi green.
    expect(manel.taxaAcerto).toBe(100);
  });

  it("agrupa por esporte e por casa", () => {
    const s = computeStatsFromBets([
      aposta({ esporte: "Futebol", casa: "Bet365", resultado: "GREEN", lucro: 50 }),
      aposta({ esporte: "Futebol", casa: "Betano", resultado: "RED", lucro: -50 }),
      aposta({ esporte: "NBA", casa: "Bet365", resultado: "GREEN", lucro: 30 }),
    ]);
    const futebol = s.sports.find((e) => e.esporte === "Futebol");
    expect(futebol?.apostas).toBe(2);
    expect(futebol?.taxaAcerto).toBe(50);
    const bet365 = s.bookies.find((b) => b.casa === "Bet365");
    expect(bet365?.apostas).toBe(2);
    expect(bet365?.lucro).toBe(80);
    // ROI da casa na mesma definição do resto do site.
    expect(bet365?.roi).toBe(40);
  });

  it("aguenta lista vazia sem estourar", () => {
    const s = computeStatsFromBets([]);
    expect(s.totalBets).toBe(0);
    expect(s.totalLucro).toBe(0);
    expect(s.totalApostado).toBe(0);
    expect(s.tipsters).toEqual([]);
  });
});
