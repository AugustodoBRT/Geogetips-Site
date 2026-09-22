import { describe, expect, it } from "vitest";
import {
  calcularMultipla,
  calcularOddJusta,
  calcularPorHold,
  calcularSurebet,
  kelly,
  lerOdd,
  lerPorcentagem,
  margem,
  probabilidadesJustas,
  stakeDeKelly,
  valorEsperado,
} from "./calculadora";

describe("lerOdd", () => {
  it("aceita vírgula e ponto como decimal", () => {
    expect(lerOdd("1,85")).toBe(1.85);
    expect(lerOdd("1.85")).toBe(1.85);
    expect(lerOdd(" 2,5 ")).toBe(2.5);
    expect(lerOdd("12")).toBe(12);
  });

  // Em lerNumeroBR "1.850" é milhar. Em odd, é o jeito como a casa escreve 1,85.
  it("lê odd com três casas como decimal, e não como milhar", () => {
    expect(lerOdd("1.850")).toBe(1.85);
    expect(lerOdd("1,850")).toBe(1.85);
  });

  it("recusa o que não é odd", () => {
    expect(lerOdd("")).toBeNull();
    expect(lerOdd("abc")).toBeNull();
    expect(lerOdd("1.2.3")).toBeNull();
    expect(lerOdd("1")).toBeNull();
    expect(lerOdd("0,5")).toBeNull();
    expect(lerOdd("-2")).toBeNull();
    expect(lerOdd("1001")).toBeNull();
  });
});

describe("lerPorcentagem", () => {
  it("lê com ou sem o símbolo", () => {
    expect(lerPorcentagem("4,5")).toBe(4.5);
    expect(lerPorcentagem("4.5%")).toBe(4.5);
  });

  it("recusa zero, cem e texto", () => {
    expect(lerPorcentagem("0")).toBeNull();
    expect(lerPorcentagem("100")).toBeNull();
    expect(lerPorcentagem("x")).toBeNull();
  });
});

describe("margem e probabilidades", () => {
  it("1,90 contra 1,90 tem margem de 5,26%", () => {
    expect(margem([1.9, 1.9])).toBeCloseTo(0.05263, 5);
  });

  it("as probabilidades justas somam 1", () => {
    const p = probabilidadesJustas([2, 3.4, 3.6]);
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });

  it("valor esperado é odd vezes probabilidade, menos 1", () => {
    expect(valorEsperado(2.1, 0.5)).toBeCloseTo(0.05, 10);
    expect(valorEsperado(1.9, 0.5)).toBeCloseTo(-0.05, 10);
  });
});

describe("calcularOddJusta", () => {
  it("mercado de dois resultados", () => {
    const r = calcularOddJusta(1.9, [1.9], 2.1);
    expect(r.oddJusta).toBeCloseTo(2, 10);
    expect(r.probabilidadeJusta).toBeCloseTo(0.5, 10);
    expect(r.payout).toBeCloseTo(0.95, 10);
    expect(r.valorEsperado).toBeCloseTo(0.05, 10);
  });

  it("mercado de três resultados, o exemplo da tela", () => {
    const r = calcularOddJusta(2, [3.4, 3.6], 2.5);
    expect(r.margem).toBeCloseTo(0.0719, 4);
    expect(r.oddJusta).toBeCloseTo(2.1438, 4);
    expect(r.valorEsperado).toBeCloseTo(0.1662, 4);
  });

  it("odd encontrada abaixo da justa dá valor negativo", () => {
    expect(calcularOddJusta(1.9, [1.9], 1.95).valorEsperado).toBeLessThan(0);
  });
});

describe("calcularPorHold", () => {
  it("o exemplo da tela: 1,90 com 4% de margem", () => {
    const r = calcularPorHold(1.9, 4, 2.1);
    expect(r.oddJusta).toBeCloseTo(1.976, 10);
    expect(r.valorEsperado).toBeCloseTo(2.1 / 1.976 - 1, 10);
  });

  // A margem que o modo "Odd justa" mostra, digitada aqui, tem de dar a mesma
  // odd justa. Senão os dois modos se contradizem na mesma tela.
  it("bate com o modo Odd justa quando recebe a margem que ele calculou", () => {
    const justa = calcularOddJusta(1.9, [1.9], 2.1);
    const hold = calcularPorHold(1.9, justa.margem * 100, 2.1);
    expect(hold.oddJusta).toBeCloseTo(justa.oddJusta, 10);
  });
});

describe("calcularSurebet", () => {
  it("divide para o retorno ser igual e mostra o lucro garantido", () => {
    const r = calcularSurebet(100, [2.1, 2.1]);
    expect(r.apostas.map((a) => a.valor)).toEqual([50, 50]);
    expect(r.retornoGarantido).toBe(105);
    expect(r.lucro).toBe(5);
    expect(r.roi).toBeCloseTo(0.05, 10);
    expect(r.ehSurebet).toBe(true);
  });

  it("avisa quando não há surebet", () => {
    const r = calcularSurebet(100, [1.9, 1.9]);
    expect(r.lucro).toBe(-5);
    expect(r.ehSurebet).toBe(false);
  });

  it("três resultados, com odds diferentes, dão retornos iguais ao centavo", () => {
    const r = calcularSurebet(1000, [3.2, 3.5, 3.4]);
    const retornos = r.apostas.map((a) => a.retorno);
    expect(Math.max(...retornos) - Math.min(...retornos)).toBeLessThanOrEqual(0.05);
    expect(r.apostas.reduce((acc, a) => acc + a.valor, 0)).toBeCloseTo(1000, 1);
    expect(r.ehSurebet).toBe(true);
  });
});

describe("calcularMultipla", () => {
  it("multiplica as odds justas das seleções", () => {
    const r = calcularMultipla(
      [
        { analisada: 1.9, contrarias: [1.9] },
        { analisada: 1.9, contrarias: [1.9] },
      ],
      3.85
    );
    expect(r.oddsJustas[0]).toBeCloseTo(2, 10);
    expect(r.oddJusta).toBeCloseTo(4, 10);
    expect(r.probabilidadeJusta).toBeCloseTo(0.25, 10);
    expect(r.valorEsperado).toBeCloseTo(3.85 / 4 - 1, 10);
  });

  it("aceita seleção de três resultados junto com seleção de dois", () => {
    const r = calcularMultipla(
      [
        { analisada: 2, contrarias: [3.4, 3.6] },
        { analisada: 1.9, contrarias: [1.9] },
      ],
      5
    );
    expect(r.oddJusta).toBeCloseTo(2.1438 * 2, 3);
  });
});

describe("kelly", () => {
  it("é o valor esperado dividido pelo lucro que a odd paga", () => {
    // Probabilidade real de 50% numa odd 2,10: EV de 5%, e a odd paga 1,10
    // por real. Kelly inteiro: 0,05 / 1,10 = 4,55% da banca.
    expect(kelly(2.1, 0.5)).toBeCloseTo(0.05 / 1.1, 10);
  });

  it("não manda apostar sem valor esperado positivo", () => {
    expect(kelly(1.9, 0.5)).toBe(0);
    expect(kelly(2, 0.5)).toBe(0);
  });

  it("confere com o modo odd justa num 1X2", () => {
    // 2,62 / 3,80 / 2,40 na referência dão odd justa de 2,781 para o
    // primeiro resultado. Encontrada a 3,00: Kelly inteiro de 3,94%.
    const r = calcularOddJusta(2.62, [3.8, 2.4], 3);
    expect(r.oddJusta).toBeCloseTo(2.781, 3);
    expect(kelly(3, r.probabilidadeJusta)).toBeCloseTo(0.03935, 4);
  });
});

describe("stakeDeKelly", () => {
  it("aplica a fração e passa para unidades da banca", () => {
    const s = stakeDeKelly(2.1, 0.5, 0.25, 100);
    expect(s.kellyInteiro).toBeCloseTo(0.04545, 5);
    // Um quarto de Kelly: 1,14% da banca, que numa banca de 100u são 1,14u.
    expect(s.fracaoDaBanca).toBeCloseTo(0.01136, 5);
    expect(s.unidades).toBeCloseTo(1.136, 3);
  });

  it("numa banca menor em unidades, a mesma porcentagem é menos unidade", () => {
    expect(stakeDeKelly(2.1, 0.5, 0.25, 50).unidades).toBeCloseTo(0.568, 3);
  });

  it("é zero sem valor", () => {
    expect(stakeDeKelly(1.8, 0.5, 1, 100)).toEqual({
      kellyInteiro: 0,
      fracaoDaBanca: 0,
      unidades: 0,
    });
  });
});
