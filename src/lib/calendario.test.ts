import { describe, expect, it } from "vitest";
import {
  compacto,
  mesDaAba,
  mesesComAposta,
  mesmoMes,
  montarMes,
  nomeDoMes,
} from "./calendario";
import type { BetItem, BetResult } from "./types";

/** "Hoje" é 21/09/2026. */
const REF = new Date("2026-09-21T15:00:00-03:00");

let sequencia = 0;

function aposta(data: string, resultado: BetResult, lucro = 0): BetItem {
  sequencia += 1;
  return {
    id: `c${sequencia}`,
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

describe("montarMes", () => {
  // Setembro de 2026 começa numa terça: domingo e segunda da primeira semana
  // são de agosto.
  it("abre a grade no dia da semana certo e fecha a última semana", () => {
    const mes = montarMes([], { ano: 2026, mes: 9 }, REF);
    expect(mes.semanas[0].slice(0, 2)).toEqual([null, null]);
    expect(mes.semanas[0][2]?.dia).toBe(1);
    expect(mes.semanas.every((s) => s.length === 7)).toBe(true);
    const dias = mes.semanas.flat().filter((d) => d !== null);
    expect(dias).toHaveLength(30);
    expect(dias[29]?.data).toBe("30/09/2026");
    expect(dias[29]?.iso).toBe("2026-09-30");
  });

  it("dá conta de fevereiro, de 28 e de 29 dias", () => {
    const dias = (ano: number) =>
      montarMes([], { ano, mes: 2 }, REF)
        .semanas.flat()
        .filter((d) => d !== null).length;
    expect(dias(2026)).toBe(28);
    expect(dias(2028)).toBe(29);
  });

  it("soma cada dia e marca hoje e o futuro", () => {
    const mes = montarMes(
      [
        aposta("03/09/2026", "GREEN", 120),
        aposta("03/09/2026", "RED", -50),
        aposta("05/09/2026", "RED", -100),
        aposta("21/09/2026", "PENDENTE"),
        aposta("25/09/2026", "PENDENTE"),
        aposta("03/08/2026", "GREEN", 999),
      ],
      { ano: 2026, mes: 9 },
      REF
    );
    const dia = (d: number) => mes.semanas.flat().find((x) => x?.dia === d);
    expect(dia(3)).toMatchObject({ lucro: 70, apostas: 2, futuro: false });
    expect(dia(4)).toMatchObject({ lucro: 0, apostas: 0 });
    expect(dia(21)).toMatchObject({ hoje: true, futuro: false, apostas: 1 });
    expect(dia(25)).toMatchObject({ futuro: true, apostas: 1 });

    // O total é a soma dos dias já vividos: a pendente de amanhã fica fora.
    expect(mes.lucro).toBe(-30);
    expect(mes.apostas).toBe(4);
    expect(mes.diasComAposta).toBe(3);
  });
});

describe("mesesComAposta", () => {
  it("lista os meses com aposta em dia vivido, em ordem", () => {
    expect(
      mesesComAposta(
        [
          aposta("10/09/2026", "GREEN", 10),
          aposta("30/12/2026", "PENDENTE"),
          aposta("28/08/2026", "RED", -10),
          aposta("11/09/2026", "RED", -10),
          aposta("—", "GREEN", 10),
        ],
        REF
      )
    ).toEqual([
      { ano: 2026, mes: 8 },
      { ano: 2026, mes: 9 },
    ]);
  });
});

describe("nomes e abas", () => {
  it("escreve o mês por extenso", () => {
    expect(nomeDoMes({ ano: 2026, mes: 3 })).toBe("março de 2026");
  });

  it("tira o mês do nome da aba", () => {
    expect(mesDaAba("Setembro26")).toEqual({ ano: 2026, mes: 9 });
    expect(mesDaAba("TODOS")).toBeNull();
  });

  it("compara meses", () => {
    expect(mesmoMes({ ano: 2026, mes: 9 }, { ano: 2026, mes: 9 })).toBe(true);
    expect(mesmoMes({ ano: 2026, mes: 9 }, { ano: 2025, mes: 9 })).toBe(false);
    expect(mesmoMes(null, { ano: 2026, mes: 9 })).toBe(false);
  });
});

describe("compacto", () => {
  it("cabe numa célula", () => {
    expect(compacto(459.4)).toBe("+459");
    expect(compacto(-969)).toBe("-969");
    expect(compacto(-2340)).toBe("-2,3k");
    expect(compacto(12000)).toBe("+12k");
    expect(compacto(999.6)).toBe("+1k");
    expect(compacto(0)).toBe("0");
  });
});
