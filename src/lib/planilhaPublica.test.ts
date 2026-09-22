import { describe, expect, it } from "vitest";
import { pertenceAoMes } from "./planilhaPublica";

/**
 * A leitura pública não erra em aba inexistente: o gviz devolve a primeira aba
 * da planilha no lugar. `pertenceAoMes` é o que separa a aba pedida dessa
 * aba-fallback, e um engano aqui faz um mês inteiro sumir ou aparecer em dobro.
 */

/** Uma linha como o gviz devolve: coluna A vazia, a data na B. */
function linha(data: string): string[] {
  return ["", data, "Futebol", "Adm", "A x B"];
}

describe("pertenceAoMes", () => {
  it("reconhece a aba pelo mês das datas", () => {
    const linhas = [linha("01/10/2026"), linha("02/10/2026")];
    expect(pertenceAoMes(linhas, 10, 26)).toBe(true);
    expect(pertenceAoMes(linhas, 9, 26)).toBe(false);
  });

  // A aba guarda aposta de longo prazo com a data do evento. Olhando só a
  // primeira linha, Outubro26 que começasse por um campeão de dezembro seria
  // dada como inexistente, e o mês sumiria do site.
  it("não se engana com uma aposta de longo prazo na primeira linha", () => {
    const linhas = [linha("20/12/2026"), linha("01/10/2026"), linha("01/10/2026")];
    expect(pertenceAoMes(linhas, 10, 26)).toBe(true);
  });

  it("continua recusando a aba-fallback, que é quase toda de outro mês", () => {
    const setembro = [linha("30/09/2026"), linha("30/09/2026"), linha("05/10/2026")];
    expect(pertenceAoMes(setembro, 10, 26)).toBe(false);
  });

  it("confere o ano junto com o mês", () => {
    expect(pertenceAoMes([linha("01/10/2025")], 10, 26)).toBe(false);
  });

  it("recusa a aba sem nenhuma data legível", () => {
    expect(pertenceAoMes([linha(""), linha("—")], 10, 26)).toBe(false);
  });
});
