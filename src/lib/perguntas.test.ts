import { describe, expect, it } from "vitest";
import { dadosEstruturados, jsonParaScript, METODO, PERGUNTAS } from "./perguntas";

describe("perguntas", () => {
  it("cada item tem âncora própria, sem repetir", () => {
    const ids = [...METODO, ...PERGUNTAS].map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z-]+$/);
  });

  // As outras telas apontam para estas âncoras. Renomear uma quebraria o link
  // sem erro nenhum.
  it("mantém as âncoras que o resto do site usa", () => {
    const ids = METODO.map((t) => t.id);
    expect(ids).toContain("roi");
    expect(ids).toContain("maior-queda");
  });

  // O texto repete a conta de stats.ts. Se a conta mudar e o texto não, a
  // página passa a explicar um número que o site não calcula mais.
  it("descreve o ROI e a taxa de acerto do jeito que o site calcula", () => {
    const roi = METODO.find((t) => t.id === "roi")?.resposta.join(" ") ?? "";
    expect(roi).toContain("anuladas e as pendentes");

    const taxa = METODO.find((t) => t.id === "taxa-de-acerto")?.resposta.join(" ") ?? "";
    expect(taxa).toContain("Voids e pendentes ficam de fora");
  });

  it("não afirma que o grupo não tem canal pago", () => {
    const texto = [...METODO, ...PERGUNTAS]
      .flatMap((p) => p.resposta)
      .join(" ")
      .toLowerCase();
    expect(texto).not.toMatch(/não (existe|há|temos) (grupo|canal) pago/);
  });

  it("monta os dados estruturados com todas as perguntas", () => {
    const dados = dadosEstruturados() as {
      "@type": string;
      mainEntity: { name: string; acceptedAnswer: { text: string } }[];
    };
    expect(dados["@type"]).toBe("FAQPage");
    expect(dados.mainEntity).toHaveLength(METODO.length + PERGUNTAS.length);
    expect(dados.mainEntity[0].name).toBe(METODO[0].pergunta);
    expect(dados.mainEntity[0].acceptedAnswer.text).toContain(METODO[0].resposta[1]);
  });

  it("escapa o que fecharia a tag de script", () => {
    const texto = jsonParaScript({ a: "</script><b>" });
    expect(texto).not.toContain("<");
    expect(JSON.parse(texto)).toEqual({ a: "</script><b>" });
  });
});
