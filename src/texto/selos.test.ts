import { describe, expect, it } from "vitest";
import { type EsporteDoSelo, textoDosSelos } from "./selos";

/**
 * A trava dos dois selos (#127).
 *
 * Três rótulos foram lidos do site rodando, antes da extração — Futebol,
 * Basquete e Tênis, os três esportes que o mock tem. Os outros oito não
 * aparecem em tela nenhuma com esse dado, e foram conferidos letra por letra
 * contra o catálogo de antes, com `git show main:`.
 *
 * A frase da casa não cadastrada é medida: o mock aposta na BetPix365, que não
 * está no registro, então o retrato a pegou em todas as telas de dados.
 */

const T = textoDosSelos();

describe("texto dos selos", () => {
  it("os três esportes do mock saem como a tela escrevia", () => {
    // Medidos no retrato: a planilha escreve "Futebol", "NBA" e "Tênis".
    expect(T.esportes.futebol).toBe("Futebol");
    expect(T.esportes.basquete).toBe("Basquete");
    expect(T.esportes.tenis).toBe("Tênis");
  });

  it("os outros oito rótulos do catálogo seguem como estavam", () => {
    // Nenhum aparece com o dado do mock. Conferidos contra o componente de
    // antes, onde eram o campo `rotulo` de cada regra.
    expect(T.esportes.turfe).toBe("Turfe");
    expect(T.esportes.nfl).toBe("NFL");
    expect(T.esportes.esports).toBe("eSports");
    expect(T.esportes.luta).toBe("MMA / Luta");
    expect(T.esportes.volei).toBe("Vôlei");
    expect(T.esportes.nhl).toBe("NHL");
    expect(T.esportes.mlb).toBe("MLB");
    expect(T.esportes.formula1).toBe("Fórmula 1");
  });

  it("o catálogo tem onze rótulos, e são estas onze chaves", () => {
    // A trava de verdade é o tipo: `satisfies Record<EsporteDoSelo, string>`
    // no dicionário e `chave: EsporteDoSelo` em cada regra do componente, que
    // juntos não deixam uma regra ficar sem rótulo. Esta lista pega o outro
    // lado — rótulo que sobrou de uma regra apagada, que o tipo não vê.
    const chaves: EsporteDoSelo[] = [
      "turfe",
      "nfl",
      "futebol",
      "basquete",
      "tenis",
      "esports",
      "luta",
      "volei",
      "nhl",
      "mlb",
      "formula1",
    ];
    expect(Object.keys(T.esportes).sort()).toEqual([...chaves].sort());
  });

  it("a casa fora do registro leva o nome cru e o aviso", () => {
    // Medido: o mock aposta na BetPix365, que não está no registro.
    expect(T.casaNaoCadastrada("BetPix365")).toBe(
      "BetPix365 — casa ainda não cadastrada"
    );
    // O nome entra como veio da planilha, inclusive com grafia estranha: é o
    // que deixa evidente que falta cadastrar.
    expect(T.casaNaoCadastrada("casa nova")).toBe(
      "casa nova — casa ainda não cadastrada"
    );
  });

  it("o travessão do aviso é travessão, e não hífen", () => {
    // Um hífen aqui passaria despercebido na revisão e mudaria a tela.
    expect(T.casaNaoCadastrada("X")).toContain(" — ");
    expect(T.casaNaoCadastrada("X")).not.toContain(" - ");
  });

  it("nenhuma entrada de texto começa ou termina com espaço", () => {
    const sobrando: string[] = [];
    const varrer = (valor: unknown, caminho: string) => {
      if (typeof valor === "string") {
        if (valor !== valor.trim()) sobrando.push(`${caminho}: ${JSON.stringify(valor)}`);
      } else if (Array.isArray(valor)) {
        for (const [i, v] of valor.entries()) varrer(v, `${caminho}[${i}]`);
      } else if (valor && typeof valor === "object") {
        for (const [k, v] of Object.entries(valor)) varrer(v, `${caminho}.${k}`);
      }
    };
    varrer(T, "selos");
    expect(sobrando).toEqual([]);
  });
});
