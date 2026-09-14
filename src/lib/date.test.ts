import { describe, expect, it } from "vitest";
import { doISO, inicioDeHoje, paraISO, parseDateTimestamp, timestampDoISO } from "./date";

/**
 * Datas vêm da planilha como texto em "DD/MM/YYYY", digitadas por gente. O
 * conversor precisa aguentar o que aparecer sem inventar data — inventar é
 * pior que recusar, porque uma data errada reordena o feed em silêncio.
 */

describe("parseDateTimestamp", () => {
  it("lê o padrão do grupo", () => {
    expect(parseDateTimestamp("14/09/2026")).toBe(new Date(2026, 8, 14).getTime());
  });

  it("ordena o mais recente primeiro", () => {
    const antes = parseDateTimestamp("01/09/2026");
    const depois = parseDateTimestamp("30/09/2026");
    expect(depois).toBeGreaterThan(antes);
  });

  it("não se engana entre dia e mês", () => {
    // Dia 3 de fevereiro, não 2 de março.
    expect(parseDateTimestamp("03/02/2026")).toBe(new Date(2026, 1, 3).getTime());
  });

  it("devolve 0 em vez de data inventada", () => {
    expect(parseDateTimestamp("")).toBe(0);
    expect(parseDateTimestamp("—")).toBe(0);
    expect(parseDateTimestamp("14/09")).toBe(0);
    expect(parseDateTimestamp("amanhã")).toBe(0);
    expect(parseDateTimestamp("aa/bb/cccc")).toBe(0);
  });

  it("aceita dia e mês com um dígito", () => {
    expect(parseDateTimestamp("1/9/2026")).toBe(new Date(2026, 8, 1).getTime());
  });
});

describe("paraISO", () => {
  it("entrega o formato que input[type=date] aceita", () => {
    expect(paraISO("14/09/2026")).toBe("2026-09-14");
  });

  it("completa com zero à esquerda", () => {
    expect(paraISO("1/9/2026")).toBe("2026-09-01");
  });

  it("devolve vazio para entrada inválida", () => {
    expect(paraISO("")).toBe("");
    expect(paraISO("—")).toBe("");
    expect(paraISO("14/09")).toBe("");
  });
});

describe("timestampDoISO", () => {
  it("volta para timestamp local", () => {
    expect(timestampDoISO("2026-09-14")).toBe(new Date(2026, 8, 14).getTime());
  });

  it("devolve 0 para entrada inválida", () => {
    expect(timestampDoISO("")).toBe(0);
    expect(timestampDoISO("2026-09")).toBe(0);
  });
});

describe("doISO", () => {
  it("volta para o padrão do grupo", () => {
    expect(doISO("2026-09-14")).toBe("14/09/2026");
  });

  it("devolve o que recebeu quando não reconhece", () => {
    expect(doISO("")).toBe("");
    expect(doISO("qualquer coisa")).toBe("qualquer coisa");
  });
});

describe("ida e volta", () => {
  it("atravessa os dois conversores sem perder o dia", () => {
    const original = "14/09/2026";
    expect(doISO(paraISO(original))).toBe(original);
    expect(timestampDoISO(paraISO(original))).toBe(parseDateTimestamp(original));
  });
});

describe("inicioDeHoje", () => {
  it("ainda é o dia 30 às 23h de São Paulo", () => {
    // 01/10 02:00 UTC = 30/09 23:00 em São Paulo. Sem o fuso, o servidor já
    // teria virado o dia e trataria uma aposta de 01/10 como se fosse de hoje.
    expect(inicioDeHoje(new Date("2026-10-01T02:00:00Z"))).toBe(
      new Date(2026, 8, 30).getTime()
    );
  });

  it("vira o dia à meia-noite de São Paulo", () => {
    expect(inicioDeHoje(new Date("2026-10-01T03:00:00Z"))).toBe(
      new Date(2026, 9, 1).getTime()
    );
  });

  it("é comparável com o que parseDateTimestamp devolve", () => {
    // Os dois representam meia-noite local de uma data. Se divergissem, a
    // comparação de "futuro" erraria por um dia inteiro.
    expect(inicioDeHoje(new Date("2026-09-14T12:00:00Z"))).toBe(
      parseDateTimestamp("14/09/2026")
    );
  });
});
