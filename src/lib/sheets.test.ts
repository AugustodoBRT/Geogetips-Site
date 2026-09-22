import { describe, expect, it } from "vitest";
import {
  descobrirAbas,
  linhasParaBets,
  ordenarApostas,
  parseCurrency,
  parseOdd,
  parseResultado,
} from "./sheets";
import type { BetItem } from "./types";

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

  it("guarda a odd com três casas, como a planilha escreve", () => {
    // Dez apostas da planilha têm odd como 2,625. Com duas casas, o feed, o
    // detalhe e o CSV mostravam "2,63".
    const [bet] = linhasParaBets("Setembro26", [
      linha({ [DATA]: "14/09/2026", [PARTIDA]: "A x B", [ODD]: "2,625" }),
    ]);
    expect(bet.odd).toBe(2.625);
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

describe("ordenarApostas", () => {
  const HOJE = new Date("2026-09-14T12:00:00Z");

  function aposta(data: string, resultado: BetItem["resultado"], id: string): BetItem {
    return {
      id,
      data,
      esporte: "Futebol",
      tipster: "Manel",
      partida: "A x B",
      tip: "Campeão",
      casa: "Bet365",
      odd: 5,
      valor: 100,
      unidades: 1,
      resultado,
      lucro: 0,
    };
  }

  it("manda a pendente de data futura para o fim", () => {
    // Era o defeito: "Longo Prazo - Libertadores + Brasileirão", lançada com a
    // data da final, ficava acima das apostas do dia. Quem abria o feed lia a
    // primeira linha como a mais recente, e não era.
    const ordenadas = ordenarApostas(
      [
        aposta("20/12/2026", "PENDENTE", "longo-prazo"),
        aposta("14/09/2026", "GREEN", "hoje"),
        aposta("13/09/2026", "RED", "ontem"),
      ],
      HOJE
    );
    expect(ordenadas.map((b) => b.id)).toEqual(["hoje", "ontem", "longo-prazo"]);
  });

  it("entre as de longo prazo, a que resolve antes vem primeiro", () => {
    const ordenadas = ordenarApostas(
      [
        aposta("20/12/2026", "PENDENTE", "dezembro"),
        aposta("01/11/2026", "PENDENTE", "novembro"),
      ],
      HOJE
    );
    expect(ordenadas.map((b) => b.id)).toEqual(["novembro", "dezembro"]);
  });

  it("devolve a aposta ao lugar cronológico quando o resultado sai", () => {
    // Deixa de ser pendente: volta a ser notícia, e notícia vai para o topo.
    const ordenadas = ordenarApostas(
      [aposta("20/12/2026", "GREEN", "resolvida"), aposta("14/09/2026", "GREEN", "hoje")],
      HOJE
    );
    expect(ordenadas.map((b) => b.id)).toEqual(["resolvida", "hoje"]);
  });

  it("não trata a aposta de hoje como futura", () => {
    const ordenadas = ordenarApostas(
      [
        aposta("13/09/2026", "GREEN", "ontem"),
        aposta("14/09/2026", "PENDENTE", "hoje-pendente"),
      ],
      HOJE
    );
    expect(ordenadas.map((b) => b.id)).toEqual(["hoje-pendente", "ontem"]);
  });

  it("mantém o desempate dentro do mesmo dia", () => {
    const ordenadas = ordenarApostas(
      [
        aposta("14/09/2026", "GREEN", "primeira"),
        aposta("14/09/2026", "GREEN", "segunda"),
      ],
      HOJE
    );
    expect(ordenadas.map((b) => b.id)).toEqual(["segunda", "primeira"]);
  });

  it("aguenta lista vazia", () => {
    expect(ordenarApostas([], HOJE)).toEqual([]);
  });
});

describe("descobrirAbas", () => {
  const HOJE = new Date("2026-09-14T12:00:00Z");

  /** Sondagem falsa: existe só o que estiver nesta lista. */
  function comAbas(existentes: string[]) {
    const vistas: string[] = [];
    const sondar = async (aba: string) => {
      vistas.push(aba);
      return existentes.includes(aba);
    };
    return { sondar, vistas };
  }

  it("encontra todos os meses seguidos, sem teto fixo", async () => {
    // O grupo começou em agosto de 2025: são catorze meses. A versão anterior
    // sondava dezoito fixos e, a partir de fevereiro de 2027, teria deixado o
    // mês mais antigo cair fora da janela sem avisar ninguém.
    const meses = [
      "Setembro26",
      "Agosto26",
      "Julho26",
      "Junho26",
      "Maio26",
      "Abril26",
      "Março26",
      "Fevereiro26",
      "Janeiro26",
      "Dezembro25",
      "Novembro25",
      "Outubro25",
      "Setembro25",
      "Agosto25",
    ];
    const { sondar } = comAbas(meses);
    expect(await descobrirAbas(sondar, HOJE)).toEqual(meses);
  });

  it("não perde o histórico quando passa de dezoito meses", async () => {
    // O caso que a #10 descreve: com dois anos de planilha, o teto antigo
    // cortava os seis meses mais antigos.
    // Vinte e quatro meses seguidos, contados para trás a partir de setembro
    // de 2026 — que é onde o relógio deste teste está.
    const vinteEQuatro = [
      "Setembro26",
      "Agosto26",
      "Julho26",
      "Junho26",
      "Maio26",
      "Abril26",
      "Março26",
      "Fevereiro26",
      "Janeiro26",
      "Dezembro25",
      "Novembro25",
      "Outubro25",
      "Setembro25",
      "Agosto25",
      "Julho25",
      "Junho25",
      "Maio25",
      "Abril25",
      "Março25",
      "Fevereiro25",
      "Janeiro25",
      "Dezembro24",
      "Novembro24",
      "Outubro24",
    ];
    const { sondar } = comAbas(vinteEQuatro);
    const achadas = await descobrirAbas(sondar, HOJE);
    expect(achadas).toEqual(vinteEQuatro);
  });

  it("para depois de três meses vazios seguidos", async () => {
    const { sondar, vistas } = comAbas(["Setembro26", "Agosto26"]);
    expect(await descobrirAbas(sondar, HOJE)).toEqual(["Setembro26", "Agosto26"]);
    // Sondou o lote inteiro em paralelo, mas parou de aceitar no terceiro
    // vazio: não saiu varrendo dez anos para trás.
    expect(vistas.length).toBeLessThanOrEqual(12);
  });

  it("atravessa um buraco de um mês só", async () => {
    // Mês sem aposta nenhuma não pode cortar o histórico no meio.
    const { sondar } = comAbas(["Setembro26", "Julho26", "Junho26"]);
    expect(await descobrirAbas(sondar, HOJE)).toEqual([
      "Setembro26",
      "Julho26",
      "Junho26",
    ]);
  });

  it("aguenta o mês atual ainda não existir", async () => {
    // Nos primeiros dias do mês a aba nova às vezes ainda não foi criada.
    const { sondar } = comAbas(["Agosto26", "Julho26"]);
    expect(await descobrirAbas(sondar, HOJE)).toEqual(["Agosto26", "Julho26"]);
  });

  it("devolve lista vazia quando não existe aba nenhuma", async () => {
    const { sondar } = comAbas([]);
    expect(await descobrirAbas(sondar, HOJE)).toEqual([]);
  });

  it("não varre para sempre se a sondagem disser sim para tudo", async () => {
    // Trava de segurança: sondagem quebrada não pode virar varredura infinita.
    const vistas: string[] = [];
    const sondar = async (aba: string) => {
      vistas.push(aba);
      return true;
    };
    const achadas = await descobrirAbas(sondar, HOJE);
    expect(achadas).toHaveLength(120);
    expect(vistas).toHaveLength(120);
  });
});
