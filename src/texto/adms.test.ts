import { describe, expect, it } from "vitest";
import { textoDosAdms } from "./adms";

/**
 * A trava da tela de Adms (#127).
 *
 * A mais densa do site, e a que mais escreve para quem não enxerga: o cartão
 * inteiro é um botão com `aria-label`, e a barra de composição é um `role=img`
 * cuja frase é a única forma de ler aqueles quatro números sem ver a barra.
 */

const T = textoDosAdms();
const PERIODO = { prefixo: "de", nome: "todos os meses" };

describe("texto dos adms", () => {
  it("a frase de escopo mantém o período em negrito no meio", () => {
    // Três pedaços: o texto antes, o trecho forte, e o texto depois. A tela
    // decide como desenhar o forte; o dicionário só diz que ele existe.
    expect(T.escopo(PERIODO)).toEqual([
      "Assertividade e lucro por unidade de ",
      { forte: "todos os meses" },
      ". A taxa considera apenas apostas finalizadas.",
    ]);

    expect(T.escopo({ prefixo: "de", nome: "Setembro26" })[1]).toEqual({
      forte: "Setembro26",
    });
  });

  it("as frases montadas saem como o JSX escrevia", () => {
    expect(T.vazio(PERIODO)).toBe("Nenhum adm com dados de todos os meses.");
    expect(T.cartao.aria("MarceloTips")).toBe(
      "Ver o desempenho de MarceloTips por casa e por esporte"
    );
    expect(T.cartao.oddMedia("1,91")).toBe("odd média 1,91");
    expect(T.detalhe.rotulo("MarceloTips")).toBe(
      "Desempenho de MarceloTips por casa e por esporte"
    );
    expect(T.detalhe.resumo({ apostas: 11, periodo: PERIODO, unidades: 4.61 })).toBe(
      "11 apostas de todos os meses · +4,61u"
    );
    expect(T.detalhe.linha({ apostas: 1, acerto: "100,0%", roi: "+9,69%" })).toBe(
      "1 aposta · 100,0% acerto · ROI +9,69%"
    );
  });

  it("o volume e o resumo concordam no singular", () => {
    expect(T.cartao.apostas(1)).toBe("1 aposta");
    expect(T.cartao.apostas(11)).toBe("11 apostas");
    expect(T.detalhe.resumo({ apostas: 1, periodo: PERIODO, unidades: 0 })).toContain(
      "1 aposta de"
    );
  });

  it("a barra falada monta os cinco números numa frase só", () => {
    expect(
      T.cartao.ariaDaBarra({
        adm: "MarceloTips",
        greens: "5",
        reds: "3",
        anuladas: "1",
        pendentes: "2",
        total: 11,
      })
    ).toBe("MarceloTips: 5 green, 3 red, 1 anuladas e 2 pendentes, de 11 apostas");
  });

  it("o selo da fatia pluraliza com um 's' colado, como já fazia", () => {
    // O componente filtra as fatias zeradas antes de desenhar, então n é
    // sempre pelo menos 1 — e o `n > 1 ? "s" : ""` do JSX era isto.
    expect(T.cartao.fatia(1, T.cartao.fatias.green)).toBe("1 green");
    expect(T.cartao.fatia(3, T.cartao.fatias.green)).toBe("3 greens");
    expect(T.cartao.fatia(1, T.cartao.fatias.pendente)).toBe("1 pendente");
    expect(T.cartao.fatia(2, T.cartao.fatias.pendente)).toBe("2 pendentes");
  });

  it("a barra diz 'anuladas' onde o selo diz 'void', como já era", () => {
    // Mesma coisa, duas palavras, na mesma tela: quem enxerga lê uma e quem
    // ouve lê a outra. Está errado, e continua errado de propósito —
    // consertar mudaria a saída. A asserção faz do conserto uma decisão com
    // teste vermelho junto.
    const falada = T.cartao.ariaDaBarra({
      adm: "X",
      greens: "0",
      reds: "0",
      anuladas: "1",
      pendentes: "0",
      total: 1,
    });
    expect(falada).toContain("anuladas");
    expect(falada).not.toContain("void");
    expect(T.cartao.fatias.void).toBe("void");
  });

  it("as entradas fixas são as que já estavam na tela", () => {
    expect(T.selo).toBe("Ranking");
    expect(T.cartao.topo).toBe("Top #1");
    expect(T.cartao.lucro).toBe("Lucro Líquido");
    expect(T.cartao.acerto).toBe("Acerto");
    expect(T.cartao.volume).toBe("Volume");
    expect(T.cartao.roi).toBe("ROI");
    expect(T.cartao.composicao).toBe("Composição das tips");
    expect(Object.values(T.cartao.fatias)).toEqual(["green", "red", "void", "pendente"]);
    expect(T.detalhe.porCasa).toBe("Por casa");
    expect(T.detalhe.porEsporte).toBe("Por esporte");
    expect(T.detalhe.vazio).toBe("Nada neste período.");
    expect(T.detalhe.fechar).toBe("Fechar");
  });

  it("nenhuma entrada está vazia", () => {
    let folhas = 0;
    const andar = (valor: unknown, caminho: string) => {
      if (typeof valor === "function") {
        folhas += 1;
        return;
      }
      if (typeof valor === "string") {
        folhas += 1;
        expect(valor.length, `${caminho} está vazia`).toBeGreaterThan(0);
        return;
      }
      for (const [chave, dentro] of Object.entries(valor as object)) {
        andar(dentro, `${caminho}.${chave}`);
      }
    };
    andar(T, "adms");
    expect(folhas).toBeGreaterThan(20);
  });
});
