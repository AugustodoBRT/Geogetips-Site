import { describe, expect, it } from "vitest";
import {
  abaDoEndereco,
  abaParaEndereco,
  comAba,
  escolher,
  escreverConsulta,
  lerConsulta,
  lerData,
  lerLista,
} from "./endereco";

/**
 * O endereço é entrada de usuário: pode vir colado de uma conversa, editado à
 * mão ou de um mês que já não existe. O que se protege aqui é que nada disso
 * vire filtro inválido — a tela abre no padrão em vez de quebrar.
 */

const SETEMBRO = new Date("2026-09-20T12:00:00-03:00");

describe("lerConsulta e escreverConsulta", () => {
  it("vão e voltam sem perder nada", () => {
    const valores = { aba: "Abril26", resultado: "green", esporte: "Futebol,NFL" };
    expect(lerConsulta(escreverConsulta(valores))).toEqual(valores);
  });

  it("deixam de fora o que é padrão", () => {
    expect(escreverConsulta({ aba: "", resultado: "", q: "" })).toBe("");
    expect(escreverConsulta({ aba: "Abril26", q: "" })).toBe("?aba=Abril26");
  });

  it("escrevem acento e espaço de um jeito que volta igual", () => {
    const valores = { q: "Inter de Milão" };
    expect(lerConsulta(escreverConsulta(valores))).toEqual(valores);
  });
});

describe("lerLista", () => {
  it("separa por vírgula e descarta vazio", () => {
    expect(lerLista("Futebol, NFL,,")).toEqual(["Futebol", "NFL"]);
    expect(lerLista("")).toEqual([]);
    expect(lerLista(undefined)).toEqual([]);
  });
});

describe("escolher", () => {
  it("aceita só o que é permitido", () => {
    const resultados = ["GREEN", "RED"] as const;
    expect(escolher("GREEN", resultados)).toBe("GREEN");
    expect(escolher("green", resultados)).toBeUndefined();
    expect(escolher(undefined, resultados)).toBeUndefined();
  });
});

describe("lerData", () => {
  it("aceita data real no formato do campo", () => {
    expect(lerData("2026-09-15")).toBe("2026-09-15");
  });

  it("recusa forma errada e dia que não existe", () => {
    expect(lerData("15/09/2026")).toBe("");
    expect(lerData("2026-02-31")).toBe("");
    expect(lerData("2026-13-01")).toBe("");
    expect(lerData(undefined)).toBe("");
  });
});

describe("abas no endereço", () => {
  it("a do mês é padrão e não vai ao endereço", () => {
    expect(abaParaEndereco("Setembro26", SETEMBRO)).toBe("");
    expect(abaParaEndereco("Abril26", SETEMBRO)).toBe("Abril26");
  });

  it("só aceita aba que a API aceita", () => {
    expect(abaDoEndereco("Abril26")).toBe("Abril26");
    expect(abaDoEndereco("TODOS")).toBe("TODOS");
    expect(abaDoEndereco("Xyz")).toBeUndefined();
    expect(abaDoEndereco(undefined)).toBeUndefined();
  });

  it("comAba leva a aba escolhida no link, e nada quando é a do mês", () => {
    expect(comAba("/apostas", "Abril26", "gratis", SETEMBRO)).toBe(
      "/apostas?aba=Abril26"
    );
    expect(comAba("/apostas", "Setembro26", "gratis", SETEMBRO)).toBe("/apostas");
  });

  it("comAba leva o grupo junto, e nada quando é o gratuito", () => {
    expect(comAba("/apostas", "Setembro26", "sigma", SETEMBRO)).toBe(
      "/apostas?grupo=sigma"
    );
    expect(comAba("/apostas", "Abril26", "sigma", SETEMBRO)).toBe(
      "/apostas?aba=Abril26&grupo=sigma"
    );
  });
});
