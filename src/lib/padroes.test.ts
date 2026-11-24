import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ADM_GERAL,
  ESPORTE_PADRAO,
  OUTROS_ESPORTES,
  SEM_CASA,
  SEM_DATA,
} from "./padroes";

/**
 * As sentinelas (#127).
 *
 * Dois trabalhos. O primeiro é a trava: estes cinco valores atravessam a
 * planilha, a agregação e a tela, e trocar um deles muda comportamento sem
 * mudar nada visível. O segundo é a cerca: o caminho de dados não pode voltar
 * a escrever o literal, nem passar a importar texto de tela.
 */

/**
 * Onde as sentinelas nascem e são comparadas. São estes quatro, e só.
 *
 * A cerca **não** alcança os arquivos de tela, e é de propósito: lá as mesmas
 * palavras aparecem legitimamente como texto. `apostas/page.tsx` escreve "—"
 * em cinco lugares como "não há valor", e `SportBadge` tem `rotulo: "Futebol"`
 * no catálogo. Varrer ali daria alarme falso, e alarme falso treina gente a
 * ignorar alarme.
 */
const CAMINHO_DE_DADOS = [
  "src/lib/sheets.ts",
  "src/lib/stats.ts",
  "src/lib/date.ts",
  "src/lib/endereco.ts",
];

/** Sem comentário: `endereco.ts` cita "Futebol,NFL" num docblock de exemplo. */
function codigoSemComentario(caminho: string): string {
  return readFileSync(caminho, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "");
}

describe("sentinelas", () => {
  it("valem exatamente o que o código já escrevia", () => {
    // A trava. Trocar qualquer uma destas linhas é mudar o que a planilha
    // preenche e o que o código compara ao mesmo tempo — e tem de ser decisão,
    // não efeito colateral de uma tradução.
    expect({ SEM_DATA, ESPORTE_PADRAO, ADM_GERAL, SEM_CASA, OUTROS_ESPORTES }).toEqual({
      SEM_DATA: "—",
      ESPORTE_PADRAO: "Futebol",
      ADM_GERAL: "Geral",
      SEM_CASA: "Sem Casa",
      OUTROS_ESPORTES: "Outros",
    });
  });

  it("o caminho de dados lê a constante, e não o literal", () => {
    const culpados: string[] = [];
    let arquivosLidos = 0;

    for (const caminho of CAMINHO_DE_DADOS) {
      const codigo = codigoSemComentario(caminho);
      expect(codigo.length, `${caminho} veio vazio`).toBeGreaterThan(100);
      arquivosLidos += 1;

      for (const valor of [
        SEM_DATA,
        ESPORTE_PADRAO,
        ADM_GERAL,
        SEM_CASA,
        OUTROS_ESPORTES,
      ]) {
        if (codigo.includes(`"${valor}"`)) culpados.push(`${caminho}: "${valor}"`);
      }
    }

    // Sem este guarda, uma lista de arquivos vazia passaria o laço inteiro.
    expect(arquivosLidos).toBe(CAMINHO_DE_DADOS.length);
    expect(culpados).toEqual([]);
  });

  it("o caminho de dados não importa texto de tela", () => {
    // A inversão que a #127 existe para evitar: `src/texto/` é o que a pessoa
    // lê, e quem lê a planilha não pode depender disso. Se um dia precisar,
    // é sinal de que a decisão de texto subiu para o lugar errado.
    for (const caminho of CAMINHO_DE_DADOS) {
      const codigo = codigoSemComentario(caminho);
      expect(codigo, `${caminho} importa de @/texto`).not.toMatch(/from ["']@\/texto/);
    }
  });
});
