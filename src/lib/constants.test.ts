import { describe, expect, it } from "vitest";
import {
  ABA_TODOS,
  abaCurta,
  abaDoMesAtual,
  abaValida,
  abasRecentes,
  ordemDaAba,
  reaisParaUnidades,
  rotuloDaAba,
  trechoDaAba,
} from "./constants";

/**
 * O mês que o site considera "atual".
 *
 * A Vercel roda em UTC e o grupo vive em São Paulo. Sem cuidado, das 21h à
 * meia-noite do último dia do mês o servidor já acha que virou: pede a aba do
 * mês seguinte, que ainda não existe na planilha, e o site aparece vazio bem
 * na hora de maior movimento.
 *
 * Os testes abaixo usam instantes em UTC de propósito — é assim que o horário
 * chega em produção.
 */
describe("abaDoMesAtual", () => {
  it("ainda é setembro às 23h de São Paulo do dia 30", () => {
    // 01/10 02:00 UTC = 30/09 23:00 em São Paulo.
    expect(abaDoMesAtual(new Date("2026-10-01T02:00:00Z"))).toBe("Setembro26");
  });

  it("vira outubro à meia-noite de São Paulo", () => {
    // 01/10 03:00 UTC = 01/10 00:00 em São Paulo.
    expect(abaDoMesAtual(new Date("2026-10-01T03:00:00Z"))).toBe("Outubro26");
  });

  it("não se confunde na virada do ano", () => {
    expect(abaDoMesAtual(new Date("2027-01-01T02:00:00Z"))).toBe("Dezembro26");
    expect(abaDoMesAtual(new Date("2027-01-01T03:00:00Z"))).toBe("Janeiro27");
  });

  it("usa meio do mês sem surpresa", () => {
    expect(abaDoMesAtual(new Date("2026-09-14T12:00:00Z"))).toBe("Setembro26");
  });
});

describe("abasRecentes", () => {
  it("volta no tempo a partir do mês de São Paulo", () => {
    const abas = abasRecentes(3, new Date("2026-09-14T12:00:00Z"));
    expect(abas).toEqual(["Setembro26", "Agosto26", "Julho26"]);
  });

  it("atravessa a virada do ano para trás", () => {
    const abas = abasRecentes(3, new Date("2027-01-15T12:00:00Z"));
    expect(abas).toEqual(["Janeiro27", "Dezembro26", "Novembro26"]);
  });

  it("respeita o fuso também aqui", () => {
    // 23h do dia 30/09 em São Paulo: a lista começa em setembro, não outubro.
    const abas = abasRecentes(2, new Date("2026-10-01T02:00:00Z"));
    expect(abas[0]).toBe("Setembro26");
  });
});

describe("ordemDaAba", () => {
  it("ordena mês e ano de forma comparável", () => {
    expect(ordemDaAba("Janeiro27")).toBeGreaterThan(ordemDaAba("Dezembro26"));
    expect(ordemDaAba("Setembro26")).toBeGreaterThan(ordemDaAba("Agosto26"));
  });

  it("devolve 0 para nome fora do padrão", () => {
    expect(ordemDaAba("Resumo")).toBe(0);
    expect(ordemDaAba("")).toBe(0);
  });
});

describe("abaValida", () => {
  it("aceita o valor especial de todos os meses", () => {
    expect(abaValida(ABA_TODOS)).toBe(true);
  });

  it("aceita mês no padrão e recusa o resto", () => {
    expect(abaValida("Setembro26")).toBe(true);
    expect(abaValida("Xyz")).toBe(false);
    // A armadilha que isto protege: o gviz devolve a PRIMEIRA aba quando a
    // pedida não existe, então aba inválida precisa morrer antes da leitura.
    expect(abaValida("Config")).toBe(false);
  });
});

describe("rótulos de aba", () => {
  it("chama a visão agregada de Geral", () => {
    expect(rotuloDaAba(ABA_TODOS)).toBe("Geral");
    expect(rotuloDaAba("Setembro26")).toBe("Setembro26");
  });

  it("monta a frase certa para cada caso", () => {
    expect(trechoDaAba(ABA_TODOS)).toEqual({
      prefixo: "de",
      nome: "todos os meses",
    });
    expect(trechoDaAba("Setembro26")).toEqual({
      prefixo: "de",
      nome: "Setembro26",
    });
  });

  it("encurta o nome do mês", () => {
    expect(abaCurta("Setembro26")).toBe("set/26");
  });
});

describe("reaisParaUnidades", () => {
  it("usa 1u = R$ 100", () => {
    expect(reaisParaUnidades(250)).toBe(2.5);
    expect(reaisParaUnidades(-100)).toBe(-1);
    expect(reaisParaUnidades(0)).toBe(0);
  });
});
