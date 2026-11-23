import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  UNIDADE_MAXIMA,
  casasDaOdd,
  formatarDecimal,
  formatarInteiro,
  formatarTaxa,
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

/**
 * A guarda da convenção (#126).
 *
 * O módulo promete uma coisa: a decisão de separador, milhar e moeda mora em
 * `LOCALE_DOS_NUMEROS`, e nenhum outro arquivo de `src` escreve separador à
 * mão. A promessa sozinha não basta — o comentário do topo do arquivo dizia
 * exatamente isso desde o começo, e mesmo assim 22 sítios nasceram fora dele.
 *
 * O que estes testes **não** fazem: simular outro locale. Não dá para trocar
 * uma constante do próprio módulo sob teste, e inventar um módulo só para
 * tornar isso possível seria desenhar o código em função do teste. O que eles
 * fazem é impedir a volta do padrão que criou o problema, e cada um diz o que
 * prova.
 */
describe("a convenção de formatação", () => {
  const CLASSIFICACAO = {
    // Escrevem número para o visitante ler.
    formatarReais: "escreve",
    formatarReaisComSinal: "escreve",
    formatarPorcentagem: "escreve",
    formatarTaxa: "escreve",
    formatarDecimal: "escreve",
    formatarInteiro: "escreve",
    formatarOdd: "escreve",
    formatarOddExata: "escreve",
    formatarOddJusta: "escreve",
    formatarUnidades: "escreve",
    formatarUnidadesSemSinal: "escreve",
    escreverUnidade: "escreve",
    // Lê o que o visitante digitou.
    lerNumeroBR: "lê",
    // Carregam a decisão de formato.
    LOCALE_DOS_NUMEROS: "decide",
    LOCALE_DE_ENTRADA: "decide",
    FORMATO_REAIS_COM_SINAL: "decide",
    FORMATO_ROI: "decide",
    FORMATO_TAXA: "decide",
    casasDaOdd: "decide",
    // Não encostam em separador.
    corDoValor: "não formata",
    varDoValor: "não formata",
    ehZero: "não formata",
    UNIDADE_MINIMA: "não formata",
    UNIDADE_MAXIMA: "não formata",
    tamanhoDoValor: "não formata",
    tempoRelativo: "não formata",
    percentuaisRedondos: "não formata",
  } as const;

  it("todo export do módulo está classificado acima", async () => {
    // Export novo sem classificação deixa isto vermelho ANTES de qualquer
    // asserção de formato. É o que impede a guarda de envelhecer calada
    // enquanto o módulo cresce — quem acrescenta função tem de dizer se ela
    // escreve número, e aí esbarra nas regras.
    const exportados = Object.keys(await import("./format")).sort();
    expect(exportados).toEqual(Object.keys(CLASSIFICACAO).sort());
  });

  it("o separador derivado é o mesmo que o Intl usa", () => {
    // `formatarDecimal` escreve com a constante derivada do locale;
    // `formatarReais` vai pelo Intl direto. Se os dois discordassem, a mesma
    // tela diria "1,50" num cartão e "R$ 1.50" no outro. Vale em qualquer
    // locale, não só no de hoje — é comparação entre os dois caminhos, não
    // contra um literal.
    const doIntl = formatarReais(1.5).slice(-3, -2);
    const daConstante = formatarDecimal(1.5, 2).slice(-3, -2);
    expect(daConstante).toBe(doIntl);
  });

  it("nenhum arquivo de src escreve o separador à mão", () => {
    // Varredura de texto, e vale dizer o que ela é: prova que ninguém voltou a
    // escrever `.replace(".", "…")` com literal, não que uma função honre a
    // constante. É modesto, e é exatamente a regressão que aconteceu 22 vezes.
    //
    // Os dois sítios legítimos passam porque não usam literal: o `DECIMAL`
    // deste módulo e o `FORMATO_DO_EXCEL.decimal` do csv.ts, que é de
    // propósito um formato à parte.
    const culpados: string[] = [];
    const andar = (dir: string) => {
      for (const item of readdirSync(dir, { withFileTypes: true })) {
        const caminho = join(dir, item.name);
        if (item.isDirectory()) andar(caminho);
        else if (/\.tsx?$/.test(item.name) && !item.name.includes(".test.")) {
          if (readFileSync(caminho, "utf8").includes('replace(".", "')) {
            culpados.push(caminho);
          }
        }
      }
    };
    andar("src");
    expect(culpados).toEqual([]);
  });

  it("formatarTaxa devolve o mesmo que o toFixed(1) que estava espalhado", () => {
    // As dez telas que montavam a taxa à mão foram trocadas por esta função,
    // que passou a usar Intl. A troca só é segura porque `taxaDeAcerto` já
    // devolve uma casa — sem meio caminho, os dois arredondamentos coincidem.
    // Esta é a asserção que prende essa condição: se alguém passar a chamar
    // `formatarTaxa` com valor cru, a diferença aparece aqui.
    for (let g = 0; g <= 60; g++) {
      for (let r = 0; r <= 60; r++) {
        const finalizadas = g + r;
        const taxa =
          finalizadas === 0 ? 0 : Number.parseFloat(((g / finalizadas) * 100).toFixed(1));
        expect(formatarTaxa(taxa)).toBe(`${taxa.toFixed(1).replace(".", ",")}%`);
      }
    }
  });

  it("o zero das unidades é decidido por valor, não por texto", () => {
    // Antes, `formatarUnidades` comparava o texto contra "0,00": o separador
    // estava no fluxo de controle, e trocá-lo faria o zero voltar a receber
    // sinal. As bordas abaixo são as mesmas de `ehZero`.
    expect(formatarUnidades(0)).toBe("0,00u");
    expect(formatarUnidades(-0)).toBe("0,00u");
    expect(formatarUnidades(0.004)).toBe("0,00u");
    expect(formatarUnidades(-0.004)).toBe("0,00u");
    expect(formatarUnidades(0.005)).toBe("+0,01u");
    expect(formatarUnidades(-0.005)).toBe("-0,01u");
    for (const u of [0, -0, 0.0049, -0.0049, 0.005, -0.005, 1, -1, 1000, -1000]) {
      expect(
        formatarUnidades(u).startsWith("+") || formatarUnidades(u).startsWith("-")
      ).toBe(!ehZero(u));
    }
  });

  it("casasDaOdd é regra de domínio, sem separador dentro", () => {
    // O CSV depende disto para decidir as casas da coluna Odd sem reusar a
    // formatação da tela — era por aí que ele viraria de carona no dia em que
    // a página mudasse de separador.
    expect(casasDaOdd(2)).toBe(2);
    expect(casasDaOdd(1.85)).toBe(2);
    expect(casasDaOdd(1.875)).toBe(3);
    expect(casasDaOdd(2.781)).toBe(3);
  });
});
