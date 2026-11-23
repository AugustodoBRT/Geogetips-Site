import { describe, expect, it } from "vitest";
import {
  doISO,
  inicioDeHoje,
  isoDoTimestamp,
  MS_POR_DIA,
  paraISO,
  parseDateTimestamp,
  rotuloDoPeriodo,
  timestampDoISO,
} from "./date";

/**
 * Datas vêm da planilha como texto em "DD/MM/YYYY", digitadas por gente. O
 * conversor precisa aguentar o que aparecer sem inventar data — inventar é
 * pior que recusar, porque uma data errada reordena o feed em silêncio.
 */

describe("parseDateTimestamp", () => {
  it("lê o padrão do grupo", () => {
    expect(parseDateTimestamp("14/09/2026")).toBe(Date.UTC(2026, 8, 14));
  });

  it("ordena o mais recente primeiro", () => {
    const antes = parseDateTimestamp("01/09/2026");
    const depois = parseDateTimestamp("30/09/2026");
    expect(depois).toBeGreaterThan(antes);
  });

  it("não se engana entre dia e mês", () => {
    // Dia 3 de fevereiro, não 2 de março.
    expect(parseDateTimestamp("03/02/2026")).toBe(Date.UTC(2026, 1, 3));
  });

  it("devolve 0 em vez de data inventada", () => {
    expect(parseDateTimestamp("")).toBe(0);
    expect(parseDateTimestamp("—")).toBe(0);
    expect(parseDateTimestamp("14/09")).toBe(0);
    expect(parseDateTimestamp("amanhã")).toBe(0);
    expect(parseDateTimestamp("aa/bb/cccc")).toBe(0);
  });

  it("aceita dia e mês com um dígito", () => {
    expect(parseDateTimestamp("1/9/2026")).toBe(Date.UTC(2026, 8, 1));
  });
});

describe("paraISO", () => {
  it("entrega o formato que input[type=date] aceita", () => {
    expect(paraISO("14/09/2026")).toBe("2026-09-14");
  });

  it("completa com zero à esquerda", () => {
    expect(paraISO("1/9/2026")).toBe("2026-09-01");
  });

  it("devolve vazio para entrada inválida", () => {
    expect(paraISO("")).toBe("");
    expect(paraISO("—")).toBe("");
    expect(paraISO("14/09")).toBe("");
  });
});

describe("timestampDoISO", () => {
  it("volta para a meia-noite UTC do dia", () => {
    expect(timestampDoISO("2026-09-14")).toBe(Date.UTC(2026, 8, 14));
  });

  it("devolve 0 para entrada inválida", () => {
    expect(timestampDoISO("")).toBe(0);
    expect(timestampDoISO("2026-09")).toBe(0);
  });
});

describe("doISO", () => {
  it("volta para o padrão do grupo", () => {
    expect(doISO("2026-09-14")).toBe("14/09/2026");
  });

  it("devolve o que recebeu quando não reconhece", () => {
    expect(doISO("")).toBe("");
    expect(doISO("qualquer coisa")).toBe("qualquer coisa");
  });
});

describe("ida e volta", () => {
  it("atravessa os dois conversores sem perder o dia", () => {
    const original = "14/09/2026";
    expect(doISO(paraISO(original))).toBe(original);
    expect(timestampDoISO(paraISO(original))).toBe(parseDateTimestamp(original));
  });
});

describe("inicioDeHoje", () => {
  it("ainda é o dia 30 às 23h de São Paulo", () => {
    // 01/10 02:00 UTC = 30/09 23:00 em São Paulo. Sem o fuso, o servidor já
    // teria virado o dia e trataria uma aposta de 01/10 como se fosse de hoje.
    expect(inicioDeHoje(new Date("2026-10-01T02:00:00Z"))).toBe(Date.UTC(2026, 8, 30));
  });

  it("vira o dia à meia-noite de São Paulo", () => {
    expect(inicioDeHoje(new Date("2026-10-01T03:00:00Z"))).toBe(Date.UTC(2026, 9, 1));
  });

  it("é comparável com o que parseDateTimestamp devolve", () => {
    // Os dois representam meia-noite UTC de uma data. Se divergissem, a
    // comparação de "futuro" erraria por um dia inteiro.
    expect(inicioDeHoje(new Date("2026-09-14T12:00:00Z"))).toBe(
      parseDateTimestamp("14/09/2026")
    );
  });
});

describe("isoDoTimestamp", () => {
  it("é o caminho de volta de timestampDoISO", () => {
    expect(isoDoTimestamp(timestampDoISO("2026-09-14"))).toBe("2026-09-14");
  });

  it("preenche mês e dia com zero à esquerda", () => {
    expect(isoDoTimestamp(Date.UTC(2026, 0, 3))).toBe("2026-01-03");
  });
});

/**
 * A invariante que o resto do site assume, e que a #124 já havia quebrado em
 * dois lugares antes de existir guarda: os timestamps são meia-noite **UTC**, e
 * não meia-noite no fuso de quem roda.
 *
 * Isto só cobra alguma coisa porque a suíte roda com `TZ=Asia/Tokyo`
 * (vitest.config.mts). Um `new Date(ano, mes, dia)` ali devolve 15h UTC do dia
 * anterior, que não é múltiplo de um dia — então qualquer volta ao acessor
 * local fica vermelha aqui. Rodar a suíte em UTC esconderia tudo isso, e é
 * por isso que o fuso dela não é UTC nem São Paulo.
 */
describe("a convenção de meia-noite UTC", () => {
  it("parseDateTimestamp cai exatamente na meia-noite UTC", () => {
    expect(parseDateTimestamp("14/09/2026") % MS_POR_DIA).toBe(0);
  });

  it("timestampDoISO cai exatamente na meia-noite UTC", () => {
    expect(timestampDoISO("2026-09-14") % MS_POR_DIA).toBe(0);
  });

  it("inicioDeHoje cai exatamente na meia-noite UTC", () => {
    expect(inicioDeHoje(new Date("2026-09-14T12:00:00Z")) % MS_POR_DIA).toBe(0);
  });

  it("a distância entre dois dias é um número inteiro de dias", () => {
    // É o que deixa `diasDaAba` e a janela do gráfico fazerem conta de dia sem
    // arredondar: com meia-noite local e horário de verão no meio, não dava.
    const de = parseDateTimestamp("01/09/2026");
    const ate = parseDateTimestamp("30/09/2026");
    expect((ate - de) / MS_POR_DIA).toBe(29);
  });

  it("não se desloca com o fuso do processo", () => {
    const antes = process.env.TZ;
    const instante = new Date("2026-09-14T12:00:00Z");
    try {
      process.env.TZ = "Pacific/Kiritimati"; // UTC+14
      const leste = inicioDeHoje(instante);
      const localLeste = new Date(2026, 8, 14).getTime();

      process.env.TZ = "Pacific/Midway"; // UTC-11
      const oeste = inicioDeHoje(instante);
      const localOeste = new Date(2026, 8, 14).getTime();

      // Primeiro: prova que trocar TZ aqui faz efeito de verdade. Sem esta
      // linha, o teste passaria mesmo num ambiente que ignora a troca — e aí
      // ele ficaria verde sem guardar nada, que é o pior resultado possível.
      expect(localLeste).not.toBe(localOeste);

      expect(leste).toBe(oeste);
      expect(leste).toBe(Date.UTC(2026, 8, 14));
    } finally {
      process.env.TZ = antes;
    }
  });
});

describe("rotuloDoPeriodo", () => {
  it("descreve o intervalo fechado", () => {
    expect(rotuloDoPeriodo("2026-09-01", "2026-09-15")).toBe("01/09/2026 a 15/09/2026");
  });

  it("chama de dia quando as pontas são iguais", () => {
    // É o que substitui o antigo seletor de dia do painel.
    expect(rotuloDoPeriodo("2026-09-14", "2026-09-14")).toBe("dia 14/09/2026");
  });

  it("aceita intervalo aberto de um lado só", () => {
    expect(rotuloDoPeriodo("2026-09-14", "")).toBe("a partir de 14/09/2026");
    expect(rotuloDoPeriodo("", "2026-09-14")).toBe("até 14/09/2026");
  });

  it("devolve vazio quando não há intervalo", () => {
    // Quem chama decide o que mostrar no lugar; a função não inventa texto.
    expect(rotuloDoPeriodo("", "")).toBe("");
  });
});
