import { describe, expect, it } from "vitest";
import { apostasParaCsv, celula, nomeDoArquivo, numero } from "./csv";
import type { BetItem } from "./types";

function aposta(parcial: Partial<BetItem>): BetItem {
  return {
    id: "x",
    data: "03/09/2026",
    esporte: "Futebol",
    tipster: "Manel",
    partida: "Internacional x Gremio",
    tip: "Gremio para se classificar",
    casa: "7Games",
    odd: 2.24,
    valor: 100,
    unidades: 1,
    resultado: "GREEN",
    lucro: 124,
    ...parcial,
  };
}

describe("celula", () => {
  it("deixa o texto comum como está", () => {
    expect(celula("Betano")).toBe("Betano");
  });

  it("põe aspas no que tem separador, aspas ou quebra de linha", () => {
    expect(celula("a;b")).toBe('"a;b"');
    expect(celula('o "lance"')).toBe('"o ""lance"""');
    expect(celula("linha 1\nlinha 2")).toBe('"linha 1\nlinha 2"');
  });

  // O Excel leria como fórmula.
  it("desarma o que o Excel leria como fórmula", () => {
    expect(celula("+2.5 gols")).toBe("'+2.5 gols");
    expect(celula("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(celula("-1 handicap")).toBe("'-1 handicap");
    expect(celula("@x")).toBe("'@x");
  });

  // Parte das planilhas pula a tabulação e o retorno de carro do começo e lê o
  // resto como fórmula. É a lista da OWASP.
  it("desarma também a tabulação e o retorno de carro no começo", () => {
    expect(celula("\t=1+1")).toBe("'\t=1+1");
    expect(celula("\r=1+1")).toBe('"\'\r=1+1"');
  });
});

describe("numero", () => {
  it("usa vírgula decimal e não põe milhar", () => {
    expect(numero(1234.5)).toBe("1234,50");
    expect(numero(-50)).toBe("-50,00");
  });
});

describe("apostasParaCsv", () => {
  it("escreve a odd como a planilha, com a terceira casa quando existe", () => {
    const csv = apostasParaCsv(
      [aposta({ odd: 2.625 }), aposta({ odd: 1.9 })],
      (r) => r,
      100
    );
    const [, primeira, segunda] = csv.slice(1).split("\r\n");
    expect(primeira.split(";")[6]).toBe("2,625");
    expect(segunda.split(";")[6]).toBe("1,90");
  });

  it("abre com BOM e cabeçalho, uma linha por aposta, fim de linha do Windows", () => {
    const csv = apostasParaCsv([aposta({})], (r) => r, 100);
    expect(csv.startsWith("﻿Data;Esporte;Adm;")).toBe(true);
    const linhas = csv.slice(1).split("\r\n");
    expect(linhas).toHaveLength(3);
    expect(linhas[2]).toBe("");
    expect(linhas[1]).toBe(
      "03/09/2026;Futebol;Manel;Internacional x Gremio;Gremio para se classificar;7Games;2,24;100,00;GREEN;124,00;1,00;1,24"
    );
  });

  it("valores em reais seguem a unidade do visitante; unidades, não", () => {
    const csv = apostasParaCsv(
      [aposta({ resultado: "RED", lucro: -100 })],
      (r) => r / 5,
      100
    );
    const colunas = csv.split("\r\n")[1].split(";");
    expect(colunas[7]).toBe("20,00");
    expect(colunas[9]).toBe("-20,00");
    expect(colunas[10]).toBe("1,00");
    expect(colunas[11]).toBe("-1,00");
  });

  it("recorte vazio sai só com o cabeçalho", () => {
    expect(apostasParaCsv([], (r) => r, 100).split("\r\n")).toHaveLength(2);
  });
});

describe("nomeDoArquivo", () => {
  it("diz a aba, o resultado e as datas", () => {
    expect(nomeDoArquivo("Setembro26", "TODAS", "", "")).toBe("geogetips-setembro26.csv");
    expect(nomeDoArquivo("Setembro26", "TODAS", "", "", "sigma")).toBe(
      "geogetips-sigma-setembro26.csv"
    );
    expect(nomeDoArquivo("TODOS", "GREEN", "", "")).toBe("geogetips-geral-green.csv");
    expect(nomeDoArquivo("Setembro26", "RED", "2026-09-01", "2026-09-15")).toBe(
      "geogetips-setembro26-red-2026-09-01-a-2026-09-15.csv"
    );
    expect(nomeDoArquivo("Setembro26", "TODAS", "2026-09-03", "2026-09-03")).toBe(
      "geogetips-setembro26-2026-09-03.csv"
    );
    expect(nomeDoArquivo("Setembro26", "TODAS", "2026-09-03", "")).toBe(
      "geogetips-setembro26-desde-2026-09-03.csv"
    );
    expect(nomeDoArquivo("Setembro26", "TODAS", "", "2026-09-03")).toBe(
      "geogetips-setembro26-ate-2026-09-03.csv"
    );
  });
});
