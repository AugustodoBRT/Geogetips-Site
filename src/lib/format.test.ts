import { describe, expect, it } from "vitest";
import {
  formatarInteiro,
  formatarOdd,
  formatarReais,
  formatarReaisComSinal,
  formatarUnidades,
  tamanhoDoValor,
  tempoRelativo,
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
    expect(formatarUnidades(0)).toBe("+0,00u");
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
