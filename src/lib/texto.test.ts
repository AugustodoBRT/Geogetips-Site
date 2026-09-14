import { describe, expect, it } from "vitest";
import { normalizarTexto } from "./texto";

/**
 * É esta função que casa o nome da casa vindo da planilha com o registro das
 * 99 logos. Quem digita escreve "Betão", "BETAO" ou " betao " na mesma semana,
 * e as três precisam encontrar a mesma pílula — senão a casa aparece em cinza,
 * sem logo, como se fosse desconhecida.
 */
describe("normalizarTexto", () => {
  it("ignora caixa", () => {
    expect(normalizarTexto("BET365")).toBe(normalizarTexto("bet365"));
  });

  it("ignora acento", () => {
    expect(normalizarTexto("Betão")).toBe("betao");
    expect(normalizarTexto("Esportes da Sorte é")).toBe("esportes da sorte e");
  });

  it("ignora espaço nas pontas", () => {
    expect(normalizarTexto("  Betano  ")).toBe("betano");
  });

  it("junta as três coisas", () => {
    expect(normalizarTexto("  BETÃO ")).toBe(normalizarTexto("betao"));
  });

  it("preserva o espaço do meio, que faz parte do nome", () => {
    // "Aposta Ganha" e "ApostaGanha" são casas diferentes no registro.
    expect(normalizarTexto("Aposta Ganha")).toBe("aposta ganha");
  });

  it("aguenta texto vazio", () => {
    expect(normalizarTexto("")).toBe("");
    expect(normalizarTexto("   ")).toBe("");
  });
});
