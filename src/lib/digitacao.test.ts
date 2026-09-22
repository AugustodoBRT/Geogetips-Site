import { describe, expect, it } from "vitest";
import {
  DIGITACAO,
  digitandoDecimal,
  digitandoValor,
  oddAoSair,
  porcentagemAoSair,
  reaisAoSair,
  unidadesAoSair,
} from "./digitacao";

/**
 * Os campos da calculadora enquanto se digita (#82). Espaço não separável do
 * Intl não aparece aqui: nenhum destes formatos leva "R$".
 */

describe("digitandoDecimal", () => {
  const odd = (t: string) => digitandoDecimal(t, 3, 4);

  it("troca o ponto pela vírgula e deixa o resto como foi digitado", () => {
    expect(odd("1.85")).toBe("1,85");
    expect(odd("1.850")).toBe("1,850");
    expect(odd("2")).toBe("2");
    expect(odd("2,")).toBe("2,");
  });

  it("não deixa entrar letra, sinal nem segunda vírgula", () => {
    expect(odd("abc")).toBe("");
    expect(odd("1,8a5")).toBe("1,85");
    expect(odd("-2,10")).toBe("2,10");
    expect(odd("1,8,5")).toBe("1,85");
    expect(odd("1.8.5")).toBe("1,85");
  });

  it("para na terceira casa e no quarto dígito antes da vírgula", () => {
    expect(odd("1,8756")).toBe("1,875");
    expect(odd("123456")).toBe("1234");
  });

  it("tira zero à esquerda e completa a vírgula do começo", () => {
    expect(odd("01,85")).toBe("1,85");
    expect(odd("0,5")).toBe("0,5");
    expect(odd(",5")).toBe("0,5");
    expect(odd("0")).toBe("0");
  });

  it("vale para porcentagem com duas casas", () => {
    expect(digitandoDecimal("4.567", 2, 2)).toBe("4,56");
    expect(digitandoDecimal("123", 2, 2)).toBe("12");
  });
});

describe("digitandoValor", () => {
  it("deixa os pontos para quem lê decidir se são milhar", () => {
    expect(digitandoValor("1.000")).toBe("1.000");
    expect(digitandoValor("1.000,5")).toBe("1.000,5");
  });

  it("para na segunda casa depois da vírgula e tira o resto", () => {
    expect(digitandoValor("R$ 1.000,509")).toBe("1.000,50");
    expect(digitandoValor("100,5,0")).toBe("100,50");
    expect(digitandoValor("abc")).toBe("");
  });
});

describe("ao sair do campo", () => {
  it("odd com duas casas, ou três quando a terceira existe", () => {
    expect(oddAoSair("2")).toBe("2,00");
    expect(oddAoSair("2,1")).toBe("2,10");
    expect(oddAoSair("1,850")).toBe("1,85");
    expect(oddAoSair("1,875")).toBe("1,875");
  });

  it("odd inválida fica como foi digitada, para o erro apontar o que está lá", () => {
    expect(oddAoSair("1")).toBe("1");
    expect(oddAoSair("0,5")).toBe("0,5");
    expect(oddAoSair("")).toBe("");
  });

  it("porcentagem sem zero sobrando", () => {
    expect(porcentagemAoSair("4,50")).toBe("4,5");
    expect(porcentagemAoSair("4")).toBe("4");
    expect(porcentagemAoSair("0")).toBe("0");
  });

  it("reais com milhar e centavos", () => {
    expect(reaisAoSair("1000")).toBe("1.000,00");
    expect(reaisAoSair("1.000")).toBe("1.000,00");
    expect(reaisAoSair("99,9")).toBe("99,90");
    expect(reaisAoSair("")).toBe("");
  });

  it("unidades com milhar e sem zero sobrando", () => {
    expect(unidadesAoSair("100")).toBe("100");
    expect(unidadesAoSair("1000")).toBe("1.000");
    expect(unidadesAoSair("50,50")).toBe("50,5");
    expect(unidadesAoSair("x")).toBe("x");
  });
});

describe("DIGITACAO", () => {
  it("liga cada tipo de campo às suas duas funções", () => {
    expect(DIGITACAO.odd.digitando("1.8756")).toBe("1,875");
    expect(DIGITACAO.porcentagem.digitando("4.567")).toBe("4,56");
    expect(DIGITACAO.reais.aoSair("1000")).toBe("1.000,00");
    expect(DIGITACAO.unidades.aoSair("1000")).toBe("1.000");
  });
});
