import { describe, expect, it } from "vitest";
import { linhasParaBets, parseCurrency, parseOdd, parseResultado } from "./sheets";

/**
 * A fronteira entre a planilha e o site.
 *
 * Tudo que chega aqui é texto digitado por gente, em coluna de planilha, sem
 * validação nenhuma do outro lado. Cada função abaixo tem a mesma obrigação:
 * entender o que dá para entender e, no que não der, cair num padrão seguro em
 * vez de produzir número errado.
 */

describe("parseResultado", () => {
  it("reconhece as quatro categorias", () => {
    expect(parseResultado("GREEN")).toBe("GREEN");
    expect(parseResultado("RED")).toBe("RED");
    expect(parseResultado("VOID")).toBe("VOID");
    expect(parseResultado("")).toBe("PENDENTE");
  });

  it("trata anulada e seus sinônimos como VOID", () => {
    // Estes cinco aparecem na planilha e significam a mesma coisa: stake
    // devolvida. Cair em RED tiraria dinheiro do grupo no papel.
    for (const palavra of [
      "VOID",
      "ANULADA",
      "ANULADO",
      "CANCELADO",
      "REEMBOLSADA",
      "DEVOLVIDO",
    ]) {
      expect(parseResultado(palavra)).toBe("VOID");
      expect(parseResultado(palavra.toLowerCase())).toBe("VOID");
    }
  });

  it("não deixa REEMBOLSADA cair em RED por conter a sílaba errada", () => {
    // A ordem das checagens importa: VOID é testado antes de tudo.
    expect(parseResultado("Reembolsada pela casa")).toBe("VOID");
    expect(parseResultado("Jogo cancelado")).toBe("VOID");
  });

  it("classifica HALF pelo sinal, não pela palavra LOST", () => {
    // "HALF LOST" contém LOST. Sem o desvio, cairia em RED por acidente — e o
    // lucro real vem da coluna LUCRO de qualquer jeito.
    expect(parseResultado("HALF WON")).toBe("GREEN");
    expect(parseResultado("HALF WIN")).toBe("GREEN");
    expect(parseResultado("HALF LOST")).toBe("RED");
  });

  it("aceita as variações de escrita que aparecem na planilha", () => {
    expect(parseResultado("win")).toBe("GREEN");
    expect(parseResultado("Ganha")).toBe("GREEN");
    expect(parseResultado("loss")).toBe("RED");
    expect(parseResultado("Perdida")).toBe("RED");
  });

  it("no que não reconhece, assume pendente", () => {
    // Pendente é o padrão seguro: não entra na taxa de acerto e não inventa
    // lucro nenhum.
    expect(parseResultado("aguardando")).toBe("PENDENTE");
    expect(parseResultado("???")).toBe("PENDENTE");
  });
});

describe("parseCurrency", () => {
  it("lê o formato brasileiro com milhar e centavo", () => {
    expect(parseCurrency("R$ 150,00")).toBe(150);
    expect(parseCurrency("R$11.771,29")).toBe(11771.29);
  });

  it("entende prejuízo", () => {
    expect(parseCurrency("-R$ 50,00")).toBe(-50);
    expect(parseCurrency("-R$160,00")).toBe(-160);
  });

  it("devolve 0 para célula vazia ou texto", () => {
    expect(parseCurrency("")).toBe(0);
    expect(parseCurrency("—")).toBe(0);
  });
});

describe("parseOdd", () => {
  it("aceita vírgula e ponto", () => {
    expect(parseOdd("2,50")).toBe(2.5);
    expect(parseOdd("1.85")).toBe(1.85);
  });

  it("cai em 1.0 quando não dá para ler", () => {
    // 1.0 é o neutro: não multiplica lucro nenhum para cima.
    expect(parseOdd("")).toBe(1);
    expect(parseOdd("n/a")).toBe(1);
  });
});

describe("linhasParaBets", () => {
  /** Linha na ordem das colunas B..L da planilha. */
  function linha(campos: Partial<Record<number, string>>): string[] {
    const l = Array(11).fill("");
    for (const [i, v] of Object.entries(campos)) l[Number(i)] = v as string;
    return l;
  }

  const DATA = 0;
  const PARTIDA = 3;
  const VALOR = 6;
  const ODD = 7;
  const RESULTADO = 8;
  const LUCRO = 9;
  const ID = 10;

  it("zera o lucro de uma anulada, mesmo com valor na coluna", () => {
    // A regra é da planilha: stake devolvida, lucro zero. Se a coluna LUCRO
    // vier preenchida por engano, o VOID vence.
    const [bet] = linhasParaBets("Setembro26", [
      linha({
        [DATA]: "14/09/2026",
        [PARTIDA]: "A x B",
        [VALOR]: "R$ 100,00",
        [ODD]: "2,00",
        [RESULTADO]: "ANULADA",
        [LUCRO]: "R$ 100,00",
      }),
    ]);
    expect(bet.resultado).toBe("VOID");
    expect(bet.lucro).toBe(0);
    // Mas o valor continua investido — é o que entra no ROI.
    expect(bet.valor).toBe(100);
  });

  it("calcula o lucro quando a coluna vem vazia", () => {
    const bets = linhasParaBets("Setembro26", [
      linha({
        [DATA]: "14/09/2026",
        [PARTIDA]: "A x B",
        [VALOR]: "R$ 100,00",
        [ODD]: "2,50",
        [RESULTADO]: "GREEN",
      }),
      linha({
        [DATA]: "14/09/2026",
        [PARTIDA]: "C x D",
        [VALOR]: "R$ 100,00",
        [ODD]: "2,50",
        [RESULTADO]: "RED",
      }),
    ]);
    // Escolhidos pelo resultado, não pela posição: as duas são do mesmo dia,
    // e o desempate por posição as devolve na ordem inversa da planilha.
    const green = bets.find((b) => b.resultado === "GREEN");
    const red = bets.find((b) => b.resultado === "RED");
    // Green: valor × (odd − 1) = 100 × 1,5. É o lucro líquido, sem a stake.
    expect(green?.lucro).toBe(150);
    // Red: perde o que apostou, e nada além disso.
    expect(red?.lucro).toBe(-100);
  });

  it("prefere a coluna LUCRO ao próprio cálculo", () => {
    // A planilha é a fonte da verdade; o cálculo é só rede de segurança.
    const [bet] = linhasParaBets("Setembro26", [
      linha({
        [DATA]: "14/09/2026",
        [PARTIDA]: "A x B",
        [VALOR]: "R$ 100,00",
        [ODD]: "2,00",
        [RESULTADO]: "GREEN",
        [LUCRO]: "R$ 73,50",
      }),
    ]);
    expect(bet.lucro).toBe(73.5);
  });

  it("mostra a mais recente primeiro, inclusive dentro do mesmo dia", () => {
    // A planilha é crescente. Ordenar só por data preservava a ordem dela, e
    // "Últimas Apostas Registradas" mostrava as PRIMEIRAS do dia.
    const bets = linhasParaBets("Setembro26", [
      linha({ [DATA]: "14/09/2026", [PARTIDA]: "primeira do dia", [ID]: "1" }),
      linha({ [DATA]: "14/09/2026", [PARTIDA]: "segunda do dia", [ID]: "2" }),
      linha({ [DATA]: "13/09/2026", [PARTIDA]: "dia anterior", [ID]: "3" }),
    ]);
    expect(bets.map((b) => b.id)).toEqual(["2", "1", "3"]);
  });

  it("ignora linha sem data e sem partida", () => {
    const bets = linhasParaBets("Setembro26", [
      linha({}),
      linha({ [DATA]: "14/09/2026", [PARTIDA]: "A x B", [ID]: "1" }),
    ]);
    expect(bets).toHaveLength(1);
  });

  it("preenche o que falta em vez de deixar campo vazio na tela", () => {
    const [bet] = linhasParaBets("Setembro26", [
      linha({ [DATA]: "14/09/2026", [PARTIDA]: "A x B" }),
    ]);
    expect(bet.esporte).toBe("Futebol");
    expect(bet.tipster).toBe("Geral");
    expect(bet.casa).toBe("Sem Casa");
    expect(bet.resultado).toBe("PENDENTE");
    // Sem RECORD_ID na planilha, o id sai da aba e da linha.
    expect(bet.id).toBe("Setembro26-4");
  });

  it("converte o valor em unidades na base do grupo", () => {
    const [bet] = linhasParaBets("Setembro26", [
      linha({
        [DATA]: "14/09/2026",
        [PARTIDA]: "A x B",
        [VALOR]: "R$ 250,00",
      }),
    ]);
    expect(bet.unidades).toBe(2.5);
  });
});
