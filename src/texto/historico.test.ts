import { describe, expect, it } from "vitest";
import { contagem } from "./forma";
import { textoDoHistorico } from "./historico";

/**
 * A trava da tela de Histórico (#127).
 *
 * A extração promete que nenhum caractere muda na tela, e promessa dessas só
 * vale escrita. Aqui cada entrada montada é chamada com valores de mentira e
 * comparada com a string que o JSX produzia antes — inclusive as seis que só
 * existem no áudio, onde conferência visual não cobre nada.
 */

const T = textoDoHistorico();

describe("texto do histórico", () => {
  it("as frases montadas saem como o JSX escrevia", () => {
    expect(T.consolidado.legenda({ unidades: 4.61, meses: 3 })).toBe("+4,61u em 3 meses");
    expect(T.consolidado.legenda({ unidades: -1.5, meses: 1 })).toBe("-1,50u em 1 mês");
    expect(T.consolidado.emAndamento("ago/26")).toBe("· ago/26 em andamento");

    expect(T.apostas.legenda({ greens: 5, reds: 3, voids: 0 })).toBe("5 Green · 3 Red");
    expect(T.apostas.legenda({ greens: 5, reds: 3, voids: 1 })).toBe(
      "5 Green · 3 Red · 1 Void"
    );

    expect(T.taxa.legenda(0)).toBe("Nenhum mês negativo");
    expect(T.taxa.legenda(1)).toBe("1 mês negativo");
    expect(T.taxa.legenda(4)).toBe("4 meses negativos");

    expect(T.tabela.irParaPainel("set/26")).toBe("Abrir o Painel de set/26");
  });

  it("a lista falada das barras monta invólucro, item e separador", () => {
    const itens = [
      T.barras.aria.item({ mes: "ago/26", unidades: 4.61 }),
      T.barras.aria.item({ mes: "set/26", unidades: -1.5 }),
    ];
    expect(itens).toEqual(["ago/26 4,61 unidades", "set/26 -1,50 unidades"]);

    expect(
      T.barras.aria.involucro({
        meses: itens.length,
        lista: itens.join(T.barras.aria.separador),
      })
    ).toBe("Resultado de 2 meses: ago/26 4,61 unidades, set/26 -1,50 unidades");
  });

  it("o aria das barras continua sem plural, como já era", () => {
    // Está errado para quem ouve — o cartão diz "1 mês" e isto diz "1 meses" —
    // e continua errado de propósito: consertar mudaria a saída, e esta issue
    // promete não mudar nenhuma. A asserção existe para o conserto ser uma
    // decisão com teste vermelho junto, e não um efeito colateral.
    expect(T.barras.aria.involucro({ meses: 1, lista: "ago/26 4,61 unidades" })).toBe(
      "Resultado de 1 meses: ago/26 4,61 unidades"
    );
    expect(contagem(1, "mês", "meses")).toBe("1 mês");
  });

  it("as entradas fixas são as que já estavam na tela", () => {
    expect(T.selo).toBe("Consolidado");
    expect(T.recarregar).toBe("Recarregar dados");
    expect(T.vazio).toBe("Nenhum mês encontrado na planilha.");
    expect(T.escopo).toBe(
      "Todos os meses da planilha lado a lado, incluindo os negativos. O ROI é recalculado sobre a soma do período — não é a média dos ROIs mensais."
    );
    expect(T.consolidado.rotulo).toBe("Resultado Consolidado");
    expect(T.roi.rotulo).toBe("ROI do Período");
    expect(T.roi.legenda).toBe("Sobre a soma de tudo que foi apostado");
    expect(T.apostas.rotulo).toBe("Apostas");
    expect(T.taxa.rotulo).toBe("Taxa de Acerto");
    expect(T.barras.titulo).toBe("Resultado por mês");
    expect(T.barras.sub).toBe("Barras acima da linha são lucro, abaixo são prejuízo");
    expect(T.barras.parcial).toBe("parcial");
    expect(T.tabela.legenda).toBe(
      "Resultados por mês: apostas, greens, reds, resultado e ROI"
    );
    expect(Object.values(T.tabela.colunas)).toEqual([
      "Mês",
      "Apostas",
      "Green",
      "Red",
      "Acerto",
      "Odd méd.",
      "Resultado",
      "ROI",
    ]);
    expect(T.tabela.emAndamento).toBe("em andamento");
    expect(T.tabela.semValor).toBe("—");
    expect(T.tabela.total).toBe("Total");
    expect(T.barras.aria.separador).toBe(", ");
  });

  it("nenhuma entrada do dicionário é vazia", () => {
    // Pega a entrada que alguém apaga pela metade: uma string vazia renderiza
    // nada e não quebra teste nenhum, o que é o jeito mais silencioso de um
    // rótulo sumir da tela.
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
    andar(T, "historico");
    expect(folhas).toBeGreaterThan(25);
  });
});
