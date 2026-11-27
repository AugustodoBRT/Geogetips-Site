import { describe, expect, it } from "vitest";
import { textoDaCalculadora } from "./calculadora";
import type { Trecho } from "./forma";

/**
 * A trava da calculadora (#127).
 *
 * As frases esperadas aqui foram lidas da calculadora rodando, antes da
 * extração. Não são o que eu acho que a frase diz — são o que ela dizia.
 *
 * É a tela com mais frase montada do site, e três delas mudam de forma no meio:
 * a da surebet sem lucro ganha e perde dois pedaços com o arredondamento, a do
 * lucro garantido ganha e perde dois com o máximo e o total apostado, e a do
 * resumo do celular ganha as unidades só quando há banca.
 */

const T = textoDaCalculadora();

/** O `Trecho[]` do jeito que a tela o lê em voz alta: só o texto, em ordem. */
const corrido = (partes: readonly Trecho[]) =>
  partes.map((p) => (typeof p === "string" ? p : p.forte)).join("");

const destaques = (partes: readonly Trecho[]) =>
  partes.filter((p): p is Exclude<Trecho, string> => typeof p !== "string");

describe("texto da calculadora", () => {
  it("o veredito diz o retorno e o piso da odd, com os dois destacados", () => {
    const partes = T.veredito.frase({
      aposta: "R$ 100,00",
      retorno: "R$ 105,00",
      oddJusta: "2,000",
    });
    expect(corrido(partes)).toBe(
      "Valor esperado. A cada R$ 100,00 apostados nessa odd, o retorno médio é de " +
        "R$ 105,00. Tem valor qualquer odd acima de 2,000."
    );
    expect(destaques(partes)).toEqual([{ forte: "R$ 105,00" }, { forte: "2,000" }]);
  });

  it("a linha da stake junta a porcentagem, os reais e a unidade", () => {
    expect(
      corrido(
        T.stake.linha({
          daBanca: "1,14%",
          emReais: "R$ 113,64",
          unidade: "R$ 100,00",
        })
      )
    ).toBe("1,14% da banca · R$ 113,64 com 1u = R$ 100,00");

    expect(T.stake.kelly("1/4")).toBe("Kelly 1/4");
    expect(T.stake.kelly("inteiro")).toBe("Kelly inteiro");
  });

  it("a frase da odd que falta troca só o nome do campo", () => {
    expect(
      corrido(T.faltaAOdd.frase({ campo: T.faltaAOdd.aEncontrada, oddJusta: "2,000" }))
    ).toBe("Falta a odd encontrada. Qualquer odd acima de 2,000 tem valor.");

    expect(
      corrido(T.faltaAOdd.frase({ campo: T.faltaAOdd.aDaMultipla, oddJusta: "4,33" }))
    ).toBe("Falta a odd da múltipla. Qualquer odd acima de 4,33 tem valor.");
  });

  it("a surebet sem lucro ganha e perde dois pedaços com o arredondamento", () => {
    expect(
      corrido(
        T.surebet.semLucro({
          soma: "98,82%",
          investimento: "R$ 20,00",
          arredondado: true,
        })
      )
    ).toBe(
      "As odds somam 98,82% de probabilidade, então a surebet existe. Mas, com " +
        "R$ 20,00 e as apostas arredondadas, o arredondamento come o lucro inteiro. " +
        "Aumente o investimento ou arredonde ao centavo."
    );

    // Sem arredondamento os dois pedaços somem, e a frase continua inteira.
    expect(
      corrido(
        T.surebet.semLucro({
          soma: "99,50%",
          investimento: "R$ 10,00",
          arredondado: false,
        })
      )
    ).toBe(
      "As odds somam 99,50% de probabilidade, então a surebet existe. Mas, com " +
        "R$ 10,00, o arredondamento come o lucro inteiro. Aumente o investimento."
    );
  });

  it("a frase de não haver surebet pinta só a perda", () => {
    const partes = T.surebet.naoHa({ soma: "111,11%", perda: "R$ 10,00" });
    expect(corrido(partes)).toBe(
      "As odds somam 111,11% de probabilidade. Para existir surebet, a soma precisa " +
        "ficar abaixo de 100%. Dividindo o valor entre os resultados, você perderia " +
        "R$ 10,00 saia o que sair."
    );

    // Dois destaques, e só o segundo é a perda: sem o papel os dois sairiam da
    // mesma cor e a frase deixaria de distinguir a soma do dinheiro perdido.
    expect(destaques(partes)).toEqual([
      { forte: "111,11%" },
      { forte: "R$ 10,00", papel: "perda" },
    ]);
  });

  it("o lucro garantido tem quatro formas, conforme o arredondamento", () => {
    const lucro = (temMaximo: boolean, temInvestido: boolean) =>
      corrido(
        T.surebet.lucro({
          lucro: "R$ 2,47",
          maximo: "R$ 3,10",
          temMaximo,
          investido: "R$ 99,00",
          temInvestido,
        })
      );

    expect(lucro(false, false)).toBe("Lucro garantido de R$ 2,47, saia o que sair.");
    expect(lucro(true, false)).toBe(
      "Lucro garantido de R$ 2,47, saia o que sair, e de até R$ 3,10, conforme o resultado."
    );
    expect(lucro(false, true)).toBe(
      "Lucro garantido de R$ 2,47, saia o que sair. Com o arredondamento, o total " +
        "apostado é de R$ 99,00."
    );
    expect(lucro(true, true)).toBe(
      "Lucro garantido de R$ 2,47, saia o que sair, e de até R$ 3,10, conforme o " +
        "resultado. Com o arredondamento, o total apostado é de R$ 99,00."
    );
  });

  it("o resumo do celular só mostra as unidades quando há banca", () => {
    // Esta é a região que o retrato de tela não pega: ela é `lg:hidden`, e o
    // navegador da suíte abre em 1280 px.
    expect(T.resumo.comValor({ valor: "+5,00%", unidades: "1,14u" })).toBe(
      "+5,00% de valor · 1,14u"
    );
    expect(T.resumo.comValor({ valor: "+5,00%", unidades: "" })).toBe("+5,00% de valor");
    expect(T.resumo.semValor("-2,50%")).toBe("Sem valor: -2,50%");
    expect(T.surebet.resumo.comLucro({ roi: "+2,47%", lucro: "R$ 2,47" })).toBe(
      "Surebet de +2,47%: R$ 2,47 garantidos"
    );
  });

  it("os modos são um mapa de valor para rótulo", () => {
    // A chave é o que vai ao endereço como ?modo=…; só o lado direito é texto.
    expect(Object.keys(T.modos)).toEqual(["justa", "hold", "surebet", "multipla"]);
    expect(T.modos.justa).toBe("Odd justa");
    expect(T.modos.multipla).toBe("Múltiplas");
  });

  it("há um aviso de erro para cada tipo de campo", () => {
    // A chave é o `TipoDeCampo` de lib/digitacao.ts: tipo sem aviso não compila,
    // e aqui fica a prova de que nenhum dos quatro sumiu.
    expect(Object.keys(T.campo.erro)).toEqual([
      "odd",
      "porcentagem",
      "reais",
      "unidades",
    ]);
    expect(T.campo.erro.odd).toBe("Use um número maior que 1, como 1,85.");
  });

  it("os rótulos numerados contam a partir de um", () => {
    expect(T.mercado.contraria).toBe("Odd contrária");
    expect(T.mercado.contrariaNumerada(1)).toBe("Odd contrária 1");
    expect(T.mercado.quantos(8)).toBe("8 resultados");
    expect(T.surebet.odd(2)).toBe("Odd do resultado 2");
    expect(T.multipla.selecao(3)).toBe("Seleção 3");
    expect(T.multipla.remover(3)).toBe("Remover a seleção 3");
    expect(T.multipla.resultadosDaSelecao(2)).toBe("Resultados do mercado da seleção 2");
  });

  it("a odd justa da seleção sai com o número destacado, e em minúscula na lista", () => {
    expect(corrido(T.multipla.oddJustaDaSelecao("1,95"))).toBe("Odd justa 1,95");
    expect(destaques(T.multipla.oddJustaDaSelecao("1,95"))).toEqual([{ forte: "1,95" }]);
    expect(T.multipla.oddJustaNaLista("1,95")).toBe("odd justa 1,95");
  });

  it("o bloco de onde apostar é um só, com duas descrições", () => {
    // "Odd justa" e "Hold" compartilham a descrição porque é o mesmo bloco com
    // o mesmo campo; "Múltiplas" tem a sua, porque fala da odd total.
    expect(T.onde.descricao).not.toBe(T.onde.descricaoDaMultipla);
    expect(T.onde.descricao).toContain("pelo mesmo resultado");
    expect(T.onde.descricaoDaMultipla).toContain("pela múltipla");

    // "Casa de referência" é o mesmo título com trabalhos diferentes.
    expect(T.referencia.descricaoDaJusta).not.toBe(T.referencia.descricaoDoHold);
  });

  it("as aspas curvas das duas citações continuam curvas", () => {
    // As duas ajudas citam o nome de um modo. Aspas retas aqui mudariam a tela.
    expect(T.hold.ajuda1).toContain("“Odd justa”");
    expect(T.multipla.ajuda1).toContain("“Odd justa”");
  });

  it("a ajuda do modo Odd justa destaca a palavra que é o ponto dela", () => {
    expect(corrido(T.justa.ajuda1())).toBe(
      "Pegue as odds de todos os resultados de um mercado numa casa de margem baixa, " +
        "que serve de referência. A calculadora tira a margem dela e chega à " +
        "probabilidade real de cada resultado."
    );
    expect(destaques(T.justa.ajuda1())).toEqual([{ forte: "todos" }]);
  });
});
