import { describe, expect, it } from "vitest";
import {
  aplicarAtraso,
  ehGrupo,
  GRUPO_PADRAO,
  grupoDoId,
  grupoParaEndereco,
  ultimoDiaVisivel,
} from "./grupos";
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

describe("grupos", () => {
  it("o gratuito é o padrão e não tem atraso; o Sigma tem três dias", () => {
    expect(GRUPO_PADRAO).toBe("gratis");
    expect(grupoDoId("gratis").atrasoDias).toBe(0);
    expect(grupoDoId("sigma")).toMatchObject({
      nome: "GeogeTips - Sigma",
      atrasoDias: 3,
    });
  });

  it("reconhece só os grupos que existem", () => {
    expect(ehGrupo("sigma")).toBe(true);
    expect(ehGrupo("vip")).toBe(false);
    expect(ehGrupo(undefined)).toBe(false);
  });

  it("o padrão não vai para o endereço", () => {
    expect(grupoParaEndereco("gratis")).toBe("");
    expect(grupoParaEndereco("sigma")).toBe("sigma");
  });
});

describe("atraso público", () => {
  it("com três dias, no dia 21 aparece até o dia 18", () => {
    expect(ultimoDiaVisivel(3, REF)).toBe(new Date(2026, 8, 18).getTime());
  });

  it("tira do recorte o que ainda está dentro do atraso", () => {
    const visiveis = aplicarAtraso(
      [
        aposta("21/09/2026"),
        aposta("19/09/2026"),
        aposta("18/09/2026"),
        aposta("01/09/2026"),
        aposta("30/12/2026"),
        aposta("—"),
      ],
      3,
      REF
    );
    expect(visiveis.map((b) => b.data)).toEqual(["18/09/2026", "01/09/2026"]);
  });

  // Aposta de amanhã, lançada hoje, também espera: a data é a do jogo.
  it("aposta com data futura nunca aparece antes da hora", () => {
    expect(aplicarAtraso([aposta("22/09/2026")], 3, REF)).toEqual([]);
  });

  it("sem atraso, devolve tudo como veio", () => {
    const todas = [aposta("21/09/2026"), aposta("—")];
    expect(aplicarAtraso(todas, 0, REF)).toEqual(todas);
  });
});
