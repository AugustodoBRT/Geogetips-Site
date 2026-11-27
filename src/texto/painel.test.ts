import { describe, expect, it } from "vitest";
import { textoDoPainel } from "./painel";
import type { Trecho } from "./forma";

/**
 * A trava da tela do Painel (#127).
 *
 * As duas frases com trecho destacado no meio são conferidas contra o que a
 * tela escreveu de verdade: os textos esperados aqui foram lidos do Painel
 * rodando com `NEXT_PUBLIC_USE_MOCK=1`, antes da extração. Não são o que eu
 * acho que a frase diz — são o que ela dizia.
 */

const T = textoDoPainel();

/** O `Trecho[]` do jeito que a tela o lê em voz alta: só o texto, em ordem. */
const corrido = (partes: readonly Trecho[]) =>
  partes.map((p) => (typeof p === "string" ? p : p.forte)).join("");

const MES: Recorte = {
  aba: { prefixo: "de", nome: "Novembro26" },
  rotulo: "Novembro26",
  todasAsAbas: false,
  comIntervalo: false,
  intervalo: "",
};
const COM_INTERVALO: Recorte = {
  ...MES,
  comIntervalo: true,
  intervalo: "24/08/2026 a 26/08/2026",
};
const TODAS: Recorte = {
  aba: { prefixo: "de", nome: "todos os meses" },
  rotulo: "Geral",
  todasAsAbas: true,
  comIntervalo: false,
  intervalo: "",
};

/** O mesmo formato que `src/texto/painel.ts` recebe. Não é exportado de lá. */
type Recorte = {
  aba: { prefixo: string; nome: string };
  rotulo: string;
  todasAsAbas: boolean;
  comIntervalo: boolean;
  intervalo: string;
};

describe("texto do painel", () => {
  it("a frase do cabeçalho sai como a tela escrevia, com e sem intervalo", () => {
    expect(corrido(T.escopo(MES))).toBe(
      "Métricas consolidadas, evolução real da banca e atividades de Novembro26."
    );
    expect(corrido(T.escopo(COM_INTERVALO))).toBe(
      "Métricas consolidadas, evolução real da banca e atividades de Novembro26 " +
        "(24/08/2026 a 26/08/2026)."
    );
    expect(corrido(T.escopo(TODAS))).toBe(
      "Métricas consolidadas, evolução real da banca e atividades de todos os meses."
    );
  });

  it("os dois trechos destacados do cabeçalho têm papéis diferentes", () => {
    // A tela desenha os dois de jeitos diferentes — o nome com o destaque
    // comum, o intervalo com <strong>. Sem o papel, um dos dois muda de peso e
    // de cor. Ver o topo de forma.ts.
    expect(T.escopo(COM_INTERVALO).filter((p) => typeof p !== "string")).toEqual([
      { forte: "Novembro26" },
      { forte: "24/08/2026 a 26/08/2026", papel: "recorte" },
    ]);

    // Sem intervalo existe um destaque só, e nenhum parêntese solto.
    expect(T.escopo(MES).filter((p) => typeof p !== "string")).toEqual([
      { forte: "Novembro26" },
    ]);
  });

  it("a frase do ponto apontado na curva sai como a tela escrevia", () => {
    const partes = T.grafico.ponto({
      dia: "25/08/2026",
      acumulado: "+R$ 289,50",
      noDia: "+R$ 335,00",
      apostas: 2,
    });
    expect(corrido(partes)).toBe(
      "Dia 25/08/2026: Acumulado +R$ 289,50 (+R$ 335,00 no dia · 2 apostas)"
    );

    // O acumulado é o trecho que a tela pinta pelo sinal.
    expect(partes.filter((p) => typeof p !== "string")).toEqual([
      { forte: "25/08/2026" },
      { forte: "+R$ 289,50", papel: "valor" },
    ]);

    // Uma aposta só não vira "1 apostas".
    expect(
      corrido(
        T.grafico.ponto({
          dia: "23/08/2026",
          acumulado: "-R$ 50,00",
          noDia: "-R$ 50,00",
          apostas: 1,
        })
      )
    ).toBe("Dia 23/08/2026: Acumulado -R$ 50,00 (-R$ 50,00 no dia · 1 aposta)");
  });

  it("o rodapé do lucro escolhe entre três frases", () => {
    expect(T.indicadores.lucro.rodape(COM_INTERVALO)).toBe(
      "Resultado 24/08/2026 a 26/08/2026"
    );
    expect(T.indicadores.lucro.rodape(TODAS)).toBe("Resultado de todos os meses");
    expect(T.indicadores.lucro.rodape(MES)).toBe("Resultado total em Novembro26");

    // O intervalo ganha das outras duas, inclusive na aba agregada.
    expect(
      T.indicadores.lucro.rodape({
        ...TODAS,
        comIntervalo: true,
        intervalo: "dia 25/08/2026",
      })
    ).toBe("Resultado dia 25/08/2026");
  });

  it("o rodapé das apostas só fala de Void quando há anulada", () => {
    expect(
      T.indicadores.apostas.rodape({
        greens: "3",
        reds: "2",
        voids: "1",
        temVoids: true,
      })
    ).toBe("3 Green · 2 Red · 1 Void");

    expect(
      T.indicadores.apostas.rodape({
        greens: "423",
        reds: "280",
        voids: "0",
        temVoids: false,
      })
    ).toBe("423 Green · 280 Red");
  });

  it("o título do lucro e o das pendentes trocam de frase, não de palavra", () => {
    expect(T.indicadores.lucro.titulo(MES)).toBe("Lucro Acumulado");
    expect(T.indicadores.lucro.titulo(COM_INTERVALO)).toBe("Lucro no Período");
    expect(T.indicadores.pendentes.rodape(true)).toBe("Aguardando resultado oficial");
    expect(T.indicadores.pendentes.rodape(false)).toBe("Tudo com resultado lançado");
  });

  it("a curva inteira numa frase, para quem não a vê", () => {
    expect(
      T.grafico.aria({
        aba: { prefixo: "de", nome: "Novembro26" },
        primeiroDia: "24/08/2026",
        ultimoDia: "26/08/2026",
        resultado: "+R$ 239,50",
        queda: "R$ 100,00",
      })
    ).toBe(
      "Evolução da banca de Novembro26, de 24/08/2026 a 26/08/2026. " +
        "Resultado do período: +R$ 239,50. Maior queda: R$ 100,00."
    );
  });

  it("as três grafias de maior queda continuam três", () => {
    // Uniformizar muda a saída e mexe em e2e/risco.spec.ts, que acha o selo
    // pelo title. Fica escrito aqui para o conserto ter vermelho junto.
    expect(T.grafico.queda("R$ 100,00")).toBe("maior queda R$ 100,00");
    expect(T.grafico.tituloDaQueda).toBe(
      "Maior queda de um pico até o vale seguinte dentro da janela exibida"
    );
    expect(
      T.grafico.aria({
        aba: { prefixo: "de", nome: "Geral" },
        primeiroDia: "01/08/2026",
        ultimoDia: "31/08/2026",
        resultado: "+R$ 1,00",
        queda: "R$ 2,00",
      })
    ).toContain("Maior queda: R$ 2,00.");
  });

  it("as janelas do gráfico são um mapa de valor para rótulo", () => {
    // A chave vai ao endereço como ?janela=…; só o lado direito é texto. Hoje os
    // cinco coincidem, e é essa coincidência que esconde a armadilha: a #128
    // muda "Tudo" à direita e **não** pode mudar a chave, ou todo link já
    // compartilhado deixa de ser reconhecido, sem erro nenhum.
    expect(Object.keys(T.grafico.janelas)).toEqual(["7D", "30D", "90D", "120D", "Tudo"]);
    expect(T.grafico.janelas.Tudo).toBe("Tudo");
    expect(T.grafico.seloDaJanela(T.grafico.janelas["30D"])).toBe(" (30D)");
  });

  it("as frases que mudam com o intervalo mudam todas as seis", () => {
    expect(T.esportes.descricao(MES)).toBe("Distribuição por modalidades cadastradas");
    expect(T.esportes.descricao(COM_INTERVALO)).toBe(
      "Distribuição 24/08/2026 a 26/08/2026"
    );

    expect(T.casas.descricao(MES)).toBe("As mais usadas em Novembro26");
    expect(T.casas.descricao(COM_INTERVALO)).toBe(
      "As mais usadas 24/08/2026 a 26/08/2026"
    );

    expect(T.ultimas.descricao(MES)).toBe("As entradas mais recentes de Novembro26");
    expect(T.ultimas.descricao(COM_INTERVALO)).toBe(
      "Apostas registradas 24/08/2026 a 26/08/2026"
    );

    expect(T.ranking.descricao(MES)).toBe("Quem mais gerou retorno em Novembro26");
    expect(T.ranking.descricao(COM_INTERVALO)).toBe(
      "Quem mais gerou retorno 24/08/2026 a 26/08/2026"
    );

    expect(T.ultimas.vazio(MES)).toBe("Sem apostas neste período.");
    expect(T.ultimas.vazio(COM_INTERVALO)).toBe("Sem apostas 24/08/2026 a 26/08/2026.");

    expect(T.risco.recorte(MES)).toBe("Novembro26");
    expect(T.risco.recorte(COM_INTERVALO)).toBe("Novembro26 (24/08/2026 a 26/08/2026)");
  });

  it("os títulos entre parênteses usam o rótulo curto da aba", () => {
    expect(T.grafico.titulo(MES)).toBe("Evolução da Banca (Novembro26)");
    expect(T.grafico.titulo(TODAS)).toBe("Evolução da Banca (Geral)");
    expect(T.ranking.titulo(TODAS)).toBe("Ranking de Adms (Geral)");
  });

  it("as linhas de resumo trazem o singular e o separador", () => {
    expect(T.esportes.linha({ apostas: 4, acerto: "75,0%" })).toBe(
      "4 apostas · 75,0% acerto"
    );
    expect(T.esportes.linha({ apostas: 1, acerto: "0,0%" })).toBe(
      "1 aposta · 0,0% acerto"
    );
    expect(T.casas.linha({ apostas: 2, roi: "-100,00%" })).toBe(
      "2 apostas · ROI -100,00%"
    );
    expect(T.casas.linha({ apostas: 1, roi: "0,00%" })).toBe("1 aposta · ROI 0,00%");
    expect(T.ranking.linha({ apostas: 2, acerto: "100,0%" })).toBe(
      "2 apostas · 100,0% acerto"
    );
  });

  it("o selo de leitura diz de quando é o dado", () => {
    expect(T.selo.rotulo).toBe("Atualizado");
    expect(T.selo.desde("agora")).toBe(" · agora");
    expect(T.selo.titulo("26/11/2026, 23:10:00")).toBe(
      "Leitura da planilha em 26/11/2026, 23:10:00"
    );
  });

  it("o eixo do gráfico escreve mil só acima de mil", () => {
    expect(T.grafico.eixo.milhar("1,3")).toBe("R$ 1,3 mil");
    expect(T.grafico.eixo.exato("316")).toBe("R$ 316");
    expect(T.grafico.eixo.zero).toBe("R$ 0");
  });

  // O bloco Atenção. Os valores de exemplo são os que o Painel escreveu de
  // verdade, no retrato tirado antes da extração.

  it("o bloco Atenção abre com o recorte da tela na frase", () => {
    const R = T.risco;
    expect(R.titulo).toBe("Atenção");
    expect(R.descricao("Novembro26")).toBe(
      "Como a banca se comportou durante Novembro26: o tamanho das fases boas e " +
        "ruins; não só aonde o grupo chegou."
    );
    expect(R.descricao("Novembro26 (dia 25/08/2026)")).toBe(
      "Como a banca se comportou durante Novembro26 (dia 25/08/2026): o tamanho das " +
        "fases boas e ruins; não só aonde o grupo chegou."
    );
    expect(R.vazio).toBe("Sem apostas fechadas neste recorte.");
  });

  it("a fase da curva é a mesma frase para a queda e para a alta", () => {
    const F = T.risco.fase;
    // Queda: do pico ao vale. Medido no Painel em 1440 px.
    expect(F.entre({ valor: "1,00u", de: "25/08", ate: "26/08" })).toBe(
      "1,00u, de 25/08 a 26/08"
    );
    // Alta: do vale ao pico. A mesma frase, com as pontas trocadas pelo
    // componente — é o que esta entrada única existe para registrar.
    expect(F.entre({ valor: "5,11u", de: "23/08", ate: "27/08" })).toBe(
      "5,11u, de 23/08 a 27/08"
    );
    expect(F.doInicio({ valor: "3,35u", ate: "25/08" })).toBe(
      "3,35u, do início até 25/08"
    );
    expect(F.doInicio({ valor: "1,25u", ate: "24/08" })).toBe(
      "1,25u, do início até 24/08"
    );
  });

  it("os oito cartões do bloco têm rótulo e frase de ausência", () => {
    const R = T.risco;
    expect(R.queda.rotulo).toBe("Maior queda");
    expect(R.queda.vazio).toBe("A curva não caiu neste recorte");
    expect(R.alta.rotulo).toBe("Maior alta");
    expect(R.alta.vazio).toBe("A curva não subiu neste recorte");
    expect(R.piorDia).toBe("Pior dia");
    expect(R.melhorDia).toBe("Melhor dia");
    expect(R.red.rotulo).toBe("Maior red");
    expect(R.red.vazio).toBe("Nenhuma red neste recorte");
    expect(R.green.rotulo).toBe("Maior green");
    expect(R.green.vazio).toBe("Nenhuma green neste recorte");
    expect(R.dias.rotulo).toBe("Dias no verde");
    expect(R.porDia.rotulo).toBe("Apostas por dia");
    // Uma palavra para as quatro ausências de valor. Ver o topo da seção.
    expect(R.nenhuma).toBe("Nenhuma");
    // E uma para os dois cartões que medem uma aposta, não um dia.
    expect(R.umaAposta).toBe("numa aposta só");
  });

  it("as contagens do bloco trazem o singular", () => {
    const R = T.risco;
    expect(R.apostasDoDia(2)).toBe(" · 2 apostas");
    expect(R.apostasDoDia(1)).toBe(" · 1 aposta");
    expect(R.porDia.media(5)).toBe("média em 5 dias com aposta");
    expect(R.porDia.media(1)).toBe("média em 1 dia com aposta");
  });

  it("os dias no verde contam o vermelho e, só quando há, o zero", () => {
    const D = T.risco.dias;
    expect(D.valor({ verde: "3", total: "5" })).toBe("3 de 5");
    expect(D.vermelho("2")).toBe("2 no vermelho");
    expect(D.vermelho("0")).toBe("0 no vermelho");
    // Este ramo a suíte de tela não alcança: o mock não tem dia que feche
    // exatamente em zero. A frase foi conferida contra o componente de antes,
    // que escrevia `, ${formatarInteiro(...)} no zero`.
    expect(D.zero("1")).toBe(", 1 no zero");
  });

  // O calendário de lucro por dia.

  it("o calendário abre com o título e a chamada do toque", () => {
    const C = T.calendario;
    expect(C.titulo).toBe("Lucro por dia");
    expect(C.descricao).toBe(
      "Cada dia do mês, com os ruins à vista. Toque num dia para ver as apostas dele."
    );
    expect(C.legenda("agosto de 2026")).toBe("Lucro por dia em agosto de 2026");
    // Ramos que a suíte de tela não alcança: as setas só existem com dois
    // meses de aposta, e o vazio só num grupo sem aposta nenhuma. Os três
    // foram conferidos contra o componente de antes.
    expect(C.anterior).toBe("Mês anterior");
    expect(C.proximo).toBe("Próximo mês");
    expect(C.vazio).toBe("Sem apostas com data neste período.");
  });

  it("os sete dias da semana trazem a abreviação e o nome, na ordem", () => {
    expect(T.calendario.semana).toEqual([
      { curto: "Dom", nome: "domingo" },
      { curto: "Seg", nome: "segunda-feira" },
      { curto: "Ter", nome: "terça-feira" },
      { curto: "Qua", nome: "quarta-feira" },
      { curto: "Qui", nome: "quinta-feira" },
      { curto: "Sex", nome: "sexta-feira" },
      { curto: "Sáb", nome: "sábado" },
    ]);
  });

  it("o nome acessível de um dia diz valor, contagem e o que o distingue", () => {
    const C = T.calendario;
    expect(C.unidades("0,50u")).toBe("(0,50u)");
    expect(C.apostas(2)).toBe("2 apostas");
    expect(C.apostas(1)).toBe("1 aposta");

    const dia = {
      data: "23/08/2026",
      reais: "-R$ 50,00",
      unidades: "(0,50u)",
      apostas: 2,
      hoje: false,
      fora: false,
    };
    expect(C.dia(dia)).toBe("23/08/2026: -R$ 50,00 (0,50u) em 2 apostas");
    expect(C.dia({ ...dia, fora: true })).toBe(
      "23/08/2026: -R$ 50,00 (0,50u) em 2 apostas, fora do período escolhido"
    );
    expect(C.dia({ ...dia, apostas: 1 })).toBe(
      "23/08/2026: -R$ 50,00 (0,50u) em 1 aposta"
    );
    // "hoje" a suíte de tela não alcança: as apostas do mock são de agosto.
    expect(C.dia({ ...dia, hoje: true })).toBe(
      "23/08/2026: -R$ 50,00 (0,50u) em 2 apostas, hoje"
    );
    expect(C.dia({ ...dia, hoje: true, fora: true })).toBe(
      "23/08/2026: -R$ 50,00 (0,50u) em 2 apostas, hoje, fora do período escolhido"
    );
    // Os dois fins vêm das mesmas entradas que a célula sem link usa.
    expect(C.hoje).toBe(", hoje");
    expect(C.fora).toBe(", fora do período escolhido");
  });

  it("o rodapé do mês destaca o resultado e avisa do intervalo", () => {
    const total = {
      mes: "agosto de 2026",
      reais: "+R$ 461,00",
      unidades: "(4,61u)",
      apostas: 11,
      dias: 5,
      comIntervalo: false,
    };
    expect(corrido(T.calendario.total(total))).toBe(
      "Total de agosto de 2026: +R$ 461,00 (4,61u) · 11 apostas em 5 dias."
    );
    expect(corrido(T.calendario.total({ ...total, comIntervalo: true }))).toBe(
      "Total de agosto de 2026: +R$ 461,00 (4,61u) · 11 apostas em 5 dias. Os dias " +
        "fora do período escolhido aparecem sem cor."
    );
    expect(corrido(T.calendario.total({ ...total, apostas: 1, dias: 1 }))).toBe(
      "Total de agosto de 2026: +R$ 461,00 (4,61u) · 1 aposta em 1 dia."
    );
    // O destaque é um só, e é o resultado: a tela o pinta pelo sinal.
    const fortes = T.calendario
      .total(total)
      .filter((p) => typeof p !== "string")
      .map((p) => (typeof p === "string" ? p : p.forte));
    expect(fortes).toEqual(["+R$ 461,00"]);
  });

  it("nenhuma entrada de texto começa ou termina com espaço", () => {
    // As funções ficam de fora: há emenda que precisa do espaço nas pontas,
    // como `selo.desde` e `risco.apostasDoDia`. O que esta varredura protege é
    // a entrada fixa, onde espaço sobrando é sempre engano.
    const sobrando: string[] = [];
    const varrer = (valor: unknown, caminho: string) => {
      if (typeof valor === "string") {
        if (valor !== valor.trim()) sobrando.push(`${caminho}: ${JSON.stringify(valor)}`);
      } else if (Array.isArray(valor)) {
        for (const [i, v] of valor.entries()) varrer(v, `${caminho}[${i}]`);
      } else if (valor && typeof valor === "object") {
        for (const [k, v] of Object.entries(valor)) varrer(v, `${caminho}.${k}`);
      }
    };
    varrer(T, "painel");
    expect(sobrando).toEqual([]);
  });
});
