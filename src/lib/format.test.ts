import { describe, expect, it } from "vitest";
import {
  UNIDADE_MAXIMA,
  formatarInteiro,
  corDoValor,
  ehZero,
  formatarOdd,
  formatarOddExata,
  formatarOddJusta,
  formatarPorcentagem,
  formatarReais,
  formatarReaisComSinal,
  formatarUnidades,
  formatarUnidadesSemSinal,
  lerNumeroBR,
  tamanhoDoValor,
  tempoRelativo,
  varDoValor,
} from "./format";

/**
 * Como o número aparece na tela.
 *
 * Erro aqui não quebra conta nenhuma — só faz o site parecer de outro país, ou
 * estourar o cartão. Os dois são visíveis para qualquer visitante.
 *
 * O espaço que o Intl põe entre "R$" e o valor é **não separável** (U+00A0), e
 * não o espaço comum. Por isso as comparações abaixo usam  : escrever um
 * espaço normal aqui faria o teste falhar por um motivo invisível na tela.
 */

describe("formatarReais", () => {
  it("usa o padrão brasileiro", () => {
    expect(formatarReais(9.22)).toBe("R$ 9,22");
    expect(formatarReais(11771.29)).toBe("R$ 11.771,29");
  });

  it("mostra centavo mesmo em valor redondo", () => {
    expect(formatarReais(100)).toBe("R$ 100,00");
  });
});

describe("formatarReaisComSinal", () => {
  it("põe o sinal sempre, inclusive no positivo", () => {
    // Num painel de resultado, "R$ 9,22" e "+R$ 9,22" contam histórias
    // diferentes: o sinal é a informação.
    expect(formatarReaisComSinal(9.22)).toBe("+R$ 9,22");
    expect(formatarReaisComSinal(-9.22)).toBe("-R$ 9,22");
  });
});

describe("formatarInteiro", () => {
  it("separa o milhar", () => {
    // A home mostrava "+R$ 39.867,60" ao lado de "1970 green".
    expect(formatarInteiro(1970)).toBe("1.970");
    expect(formatarInteiro(758)).toBe("758");
  });

  it("não deixa casa decimal aparecer numa contagem", () => {
    expect(formatarInteiro(1970.4)).toBe("1.970");
  });
});

describe("formatarOddExata e formatarOddJusta", () => {
  it("a odd digitada sai com a terceira casa só quando ela existe", () => {
    expect(formatarOddExata(2)).toBe("2,00");
    expect(formatarOddExata(1.85)).toBe("1,85");
    expect(formatarOddExata(1.875)).toBe("1,875");
  });

  it("a odd justa sai sempre com três casas", () => {
    expect(formatarOddJusta(2.7811)).toBe("2,781");
    expect(formatarOddJusta(2)).toBe("2,000");
  });
});

describe("formatarOdd", () => {
  it("usa vírgula e duas casas", () => {
    expect(formatarOdd(1.72)).toBe("1,72");
    expect(formatarOdd(2)).toBe("2,00");
  });
});

describe("formatarUnidades", () => {
  it("marca o positivo e fecha com u", () => {
    expect(formatarUnidades(2.5)).toBe("+2,50u");
    expect(formatarUnidades(-1.25)).toBe("-1,25u");
  });

  it("zero sai sem sinal, como nos reais", () => {
    expect(formatarUnidades(0)).toBe("0,00u");
    expect(formatarUnidades(-0.001)).toBe("0,00u");
    expect(formatarUnidades(0.004)).toBe("0,00u");
  });
});

describe("zero em reais", () => {
  // O dia só com pendentes aparecia "+R$ 0,00" no feed, e um zero negativo de
  // soma de ponto flutuante sairia "-R$ 0,00".
  it("sai sem sinal, inclusive o zero negativo e o que arredonda para zero", () => {
    expect(formatarReaisComSinal(0)).toMatch(/^R\$\s0,00$/);
    expect(formatarReaisComSinal(-0)).toMatch(/^R\$\s0,00$/);
    expect(formatarReaisComSinal(-0.001)).toMatch(/^R\$\s0,00$/);
    expect(formatarReaisComSinal(-0.01)).toMatch(/^-R\$\s0,01$/);
  });

  it("corDoValor não pinta o zero", () => {
    // A casa que só tem aposta pendente, o adm que empatou e o mês em
    // andamento apareciam em verde em toda lista do site.
    expect(corDoValor(0)).toBe("text-[var(--text)]");
    expect(corDoValor(-0)).toBe("text-[var(--text)]");
    expect(corDoValor(-0.004)).toBe("text-[var(--text)]");
    expect(corDoValor(12)).toBe("text-[var(--green)]");
    expect(corDoValor(-12)).toBe("text-[var(--red)]");
  });

  it("varDoValor não pinta o zero, e usa o cinza das marcas", () => {
    // O gráfico do Painel pinta por atributo do SVG: a bolinha do dia em que o
    // acumulado volta ao empate saía verde sobre a linha do zero.
    expect(varDoValor(0)).toBe("var(--text-3)");
    expect(varDoValor(-0)).toBe("var(--text-3)");
    expect(varDoValor(-0.004)).toBe("var(--text-3)");
    expect(varDoValor(12)).toBe("var(--green)");
    expect(varDoValor(-12)).toBe("var(--red)");
  });

  it("formatarPorcentagem marca o sinal, menos no zero", () => {
    expect(formatarPorcentagem(9.69)).toBe("+9,69%");
    expect(formatarPorcentagem(-9.17)).toBe("-9,17%");
    expect(formatarPorcentagem(3.5)).toBe("+3,50%");
    expect(formatarPorcentagem(0)).toBe("0,00%");
    expect(formatarPorcentagem(-0)).toBe("0,00%");
  });

  it("ehZero vale até meio centavo", () => {
    expect(ehZero(0)).toBe(true);
    expect(ehZero(-0.004)).toBe(true);
    expect(ehZero(0.005)).toBe(false);
    expect(ehZero(-12)).toBe(false);
  });
});

describe("formatarUnidadesSemSinal", () => {
  it("dá só o tamanho, porque o sinal já está no valor em reais ao lado", () => {
    expect(formatarUnidadesSemSinal(9.35)).toBe("9,35u");
    expect(formatarUnidadesSemSinal(-38.24)).toBe("38,24u");
    expect(formatarUnidadesSemSinal(0)).toBe("0,00u");
  });
});

describe("tamanhoDoValor", () => {
  it("encolhe a fonte conforme o valor cresce", () => {
    // O cartão tem largura fixa e o conversor de unidade deixa o valor crescer
    // sem limite. Encolher evita estouro sem quebrar linha no meio do dinheiro.
    const curto = tamanhoDoValor("+R$ 461,00");
    const medio = tamanhoDoValor("+R$ 38.898,40");
    const longo = tamanhoDoValor("+R$ 1.234.567,89");
    expect(curto).not.toBe(medio);
    expect(medio).not.toBe(longo);
  });

  it("devolve sempre um par de classes, base e sm", () => {
    for (const texto of ["R$ 1", "R$ 123.456,78", "R$ 12.345.678,90"]) {
      expect(tamanhoDoValor(texto)).toMatch(/^text-\S+ sm:text-\S+$/);
    }
  });
});

describe("tempoRelativo", () => {
  const agora = new Date("2026-09-14T12:00:00Z");

  it("não conta segundo, porque o cache não permite essa precisão", () => {
    // O carimbo diz quando o servidor montou a resposta, e ela vale até a
    // leitura expirar. Dizer "há 12 s" seria falsa precisão.
    expect(tempoRelativo("2026-09-14T11:59:30Z", agora)).toBe("agora");
    expect(tempoRelativo("2026-09-14T11:59:00Z", agora)).toBe("agora");
  });

  it("sobe os degraus de minuto, hora e dia", () => {
    expect(tempoRelativo("2026-09-14T11:55:00Z", agora)).toBe("há 5 min");
    expect(tempoRelativo("2026-09-14T09:00:00Z", agora)).toBe("há 3 h");
    expect(tempoRelativo("2026-09-12T12:00:00Z", agora)).toBe("há 2 d");
  });

  it("não volta no tempo quando o relógio do cliente está atrasado", () => {
    // O carimbo vem do servidor e o relógio é o do visitante: os dois podem
    // divergir. "há -2 min" seria absurdo na tela.
    expect(tempoRelativo("2026-09-14T12:05:00Z", agora)).toBe("agora");
  });
});

describe("lerNumeroBR", () => {
  /**
   * O campo de unidade lia "1.000" como 1 — mil reais viravam um real, e todo
   * valor do site aparecia cem vezes menor para quem digitou. Estes casos são
   * os que uma pessoa digita de verdade, em teclado de celular e de computador.
   */
  it.each([
    ["1.000", 1000],
    ["1.500,50", 1500.5],
    // 12.345.678 é milhar legítimo, mas passa do teto: recusado.
    ["12.345.678", null],
    ["1000,50", 1000.5],
    ["250", 250],
    ["1,5", 1.5],
    ["1.5", 1.5],
    ["12.34", 12.34],
    ["R$ 1.000", 1000],
    [" 80 ", 80],
    ["0,01", 0.01],
  ])("lê %s como %s", (texto, esperado) => {
    expect(lerNumeroBR(texto as string)).toBe(esperado);
  });

  it.each([["0"], ["-5"], ["abc"], [""], ["99999999999"], ["1e9"], ["0,001"]])(
    "recusa %s",
    (texto) => {
      expect(lerNumeroBR(texto)).toBeNull();
    }
  );

  it("recusa acima do teto e aceita o teto exato", () => {
    expect(lerNumeroBR("1.000.000")).toBe(UNIDADE_MAXIMA);
    expect(lerNumeroBR("1.000.001")).toBeNull();
  });
});

describe("tamanhoDoValor compacto", () => {
  it("desce um degrau na base e mantém o tamanho de sempre a partir de sm", () => {
    // O cartão de meia largura do celular tem ~130 px de miolo: "+R$ 12.212,95"
    // em text-2xl passava da borda.
    expect(tamanhoDoValor("+R$ 12.212,95", true)).toBe("text-xl sm:text-3xl");
    expect(tamanhoDoValor("1.099", true)).toBe("text-2xl sm:text-4xl");
    expect(tamanhoDoValor("+R$ 1.234.567,89", true)).toBe("text-lg sm:text-2xl");
    expect(tamanhoDoValor("+R$ 123.456.789,00", true)).toBe("text-base sm:text-xl");
  });

  it("sem o modo compacto, nada muda", () => {
    expect(tamanhoDoValor("+R$ 12.212,95")).toBe("text-2xl sm:text-3xl");
  });
});
