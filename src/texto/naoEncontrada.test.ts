import { describe, expect, it } from "vitest";
import { textoDaPaginaNaoEncontrada } from "./naoEncontrada";

/**
 * A trava do 404 (#127).
 *
 * Três destas entradas têm testemunha no `e2e/celular-e-visual.spec.ts`: o
 * título, o cabeçalho e o "Voltar para o início". As outras seis — uma frase
 * por atalho — não têm nenhuma, e é aqui que elas ficam presas.
 */

const N = textoDaPaginaNaoEncontrada();

describe("texto do 404", () => {
  it("é o que a tela já dizia", () => {
    expect(N.titulo).toBe("Página não encontrada");
    expect(N.selo).toBe("Erro 404");
    expect(N.cabecalho).toBe("Esta página não existe.");
    expect(N.texto).toBe(
      "O endereço pode ter mudado, ou o link que te trouxe até aqui está errado. Os números continuam todos no lugar — é só escolher por onde entrar."
    );
    expect(N.atalhos.aria).toBe("Atalhos do site");
    expect(N.voltar).toBe("Voltar para o início");
  });

  it("cada atalho tem a sua frase, e nenhuma se repete", () => {
    const frases = [
      N.atalhos.painel,
      N.atalhos.apostas,
      N.atalhos.historico,
      N.atalhos.adms,
      N.atalhos.estatisticas,
      N.atalhos.perguntas,
    ];
    expect(frases).toEqual([
      "Lucro, ROI e evolução da banca",
      "O feed, dia a dia",
      "Todos os meses lado a lado",
      "O resultado de cada adm",
      "Por esporte e por casa",
      "Como cada número é calculado",
    ]);

    // Copiar e colar uma entrada é o jeito mais fácil de dois atalhos passarem
    // a dizer a mesma coisa, e isso não quebra nada nem aparece num diff curto.
    expect(new Set(frases).size).toBe(frases.length);
  });
});
