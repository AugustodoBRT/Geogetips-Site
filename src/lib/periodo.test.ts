import { describe, expect, it } from "vitest";
import { periodoDoHistorico } from "./periodo";
import type { BetItem } from "./types";

/** "Hoje" é 21/09/2026. */
const REF = new Date("2026-09-21T15:00:00-03:00");

function aposta(data: string): BetItem {
  return {
    id: data,
    data,
    esporte: "Futebol",
    tipster: "Manel",
    partida: "A x B",
    tip: "Over 2.5",
    casa: "Bet365",
    odd: 2,
    valor: 100,
    unidades: 1,
    resultado: "GREEN",
    lucro: 100,
  };
}

describe("periodoDoHistorico", () => {
  it("acha o primeiro dia e conta os dias com aposta", () => {
    expect(
      periodoDoHistorico(
        [
          aposta("20/09/2026"),
          aposta("20/09/2026"),
          aposta("02/04/2026"),
          aposta("15/05/2026"),
        ],
        REF
      )
    ).toEqual({ primeiroDia: "02/04/2026", desde: "abril de 2026", diasComAposta: 3 });
  });

  // Campeão do campeonato é lançado com a data do evento, meses à frente.
  it("não conta aposta de longo prazo nem data ilegível", () => {
    expect(
      periodoDoHistorico([aposta("30/12/2026"), aposta("—"), aposta("21/09/2026")], REF)
    ).toEqual({ primeiroDia: "21/09/2026", desde: "setembro de 2026", diasComAposta: 1 });
  });

  it("sem aposta com data, não afirma período nenhum", () => {
    expect(periodoDoHistorico([], REF)).toBeNull();
    expect(periodoDoHistorico([aposta("30/12/2026")], REF)).toBeNull();
  });
});
