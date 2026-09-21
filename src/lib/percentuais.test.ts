import { describe, expect, it } from "vitest";
import { percentuaisRedondos } from "./format";

/**
 * Num arquivo só dele, e não em format.test.ts, por um motivo prático: o #55
 * mexe no começo e no fim daquele arquivo, e os dois PRs escrevendo no mesmo
 * lugar entravam em conflito dependendo da ordem da mescla.
 */
describe("percentuaisRedondos", () => {
  it("fecha em 100 no caso que somava 101 na tela", () => {
    // Setembro26: 305 green, 623 red, 107 pendentes, 64 anuladas de 1.099.
    const p = percentuaisRedondos([305, 623, 107, 64]);
    expect(p.reduce((a, b) => a + b, 0)).toBe(100);
    // 27,75 · 56,69 · 9,74 · 5,82: os três pontos que sobram vão para as
    // maiores frações descartadas — 5,82 · 27,75 · 9,74, nesta ordem.
    expect(p).toEqual([28, 56, 10, 6]);
  });

  it("fecha em 100 com três terços", () => {
    const p = percentuaisRedondos([1, 1, 1]);
    expect(p.reduce((a, b) => a + b, 0)).toBe(100);
    expect(p).toEqual([34, 33, 33]);
  });

  it("dá zero quando não há nada", () => {
    expect(percentuaisRedondos([0, 0])).toEqual([0, 0]);
    expect(percentuaisRedondos([])).toEqual([]);
  });

  it("não inventa fatia para quem tem zero", () => {
    const p = percentuaisRedondos([10, 0]);
    expect(p).toEqual([100, 0]);
  });
});
