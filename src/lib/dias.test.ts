import { describe, expect, it } from "vitest";
import { agruparPorDia, diasAbertosDeSaida } from "./dias";
import { ordenarApostas } from "./sheets";
import type { BetItem, BetResult } from "./types";

/**
 * Os dias do feed de Apostas.
 *
 * O cabeçalho do dia é o que fica à vista quando ele está recolhido, então a
 * contagem e o resultado dele precisam bater com as apostas que ele esconde. E
 * a ordem dos dias não pode desfazer a regra das apostas de longo prazo.
 */

let sequencia = 0;

function aposta(data: string, resultado: BetResult = "GREEN", lucro = 0): BetItem {
  sequencia += 1;
  return {
    id: `d${sequencia}`,
    data,
    esporte: "Futebol",
    tipster: "Manel",
    partida: "A x B",
    tip: "Over 2.5",
    casa: "Bet365",
    odd: 2,
    valor: 100,
    unidades: 1,
    lucro,
    resultado,
  };
}

function nVezes(n: number, data: string) {
  return Array.from({ length: n }, () => aposta(data));
}

describe("agruparPorDia", () => {
  it("soma a contagem e o resultado de cada dia", () => {
    const dias = agruparPorDia([
      aposta("17/09/2026", "GREEN", 90),
      aposta("17/09/2026", "RED", -100),
      aposta("16/09/2026", "GREEN", 50),
    ]);

    expect(dias.map((d) => [d.data, d.apostas.length, d.lucro])).toEqual([
      ["17/09/2026", 2, -10],
      ["16/09/2026", 1, 50],
    ]);
  });

  it("mantém as apostas de longo prazo no fim, como o servidor as entrega", () => {
    // 18/09/2026 é "hoje": a pendente do dia 30 é de longo prazo.
    const hoje = new Date("2026-09-18T12:00:00-03:00");
    const ordenadas = ordenarApostas(
      [aposta("30/09/2026", "PENDENTE"), aposta("16/09/2026"), aposta("17/09/2026")],
      hoje
    );

    // Ordenar os dias por data poria o 30/09 primeiro. Não pode.
    expect(agruparPorDia(ordenadas).map((d) => d.data)).toEqual([
      "17/09/2026",
      "16/09/2026",
      "30/09/2026",
    ]);
  });

  it("não inventa dia quando não há aposta", () => {
    expect(agruparPorDia([])).toEqual([]);
  });
});

describe("diasAbertosDeSaida", () => {
  it("abre os primeiros dias até somar o limite, sem cortar um dia ao meio", () => {
    const dias = agruparPorDia([
      ...nVezes(60, "17/09/2026"),
      ...nVezes(50, "16/09/2026"),
      ...nVezes(40, "15/09/2026"),
    ]);

    // 60 não chega a 100, então o 16 entra inteiro (110); o 15 fica fechado.
    expect([...diasAbertosDeSaida(dias, 100)]).toEqual(["17/09/2026", "16/09/2026"]);
  });

  it("abre o primeiro dia mesmo que sozinho passe do limite", () => {
    const dias = agruparPorDia([
      ...nVezes(300, "17/09/2026"),
      ...nVezes(5, "16/09/2026"),
    ]);

    expect([...diasAbertosDeSaida(dias, 100)]).toEqual(["17/09/2026"]);
  });

  it("abre tudo quando o recorte inteiro cabe no limite", () => {
    const dias = agruparPorDia([...nVezes(3, "17/09/2026"), ...nVezes(2, "16/09/2026")]);

    expect(diasAbertosDeSaida(dias, 100).size).toBe(2);
  });

  it("não abre nada quando não há dia", () => {
    expect(diasAbertosDeSaida([], 100).size).toBe(0);
  });
});
