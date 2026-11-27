import { describe, expect, it } from "vitest";
import { textoDasApostas } from "./apostas";
import type { Periodo, Trecho } from "./forma";

/**
 * A trava do texto de `/apostas` (#127).
 *
 * Os textos esperados aqui **foram lidos da tela rodando**, com
 * `NEXT_PUBLIC_USE_MOCK=1`, antes da extração: um retrato de vinte estados, com
 * o `innerText` do `main#conteudo` e a varredura de `aria-label`, `title`,
 * `placeholder`, `caption`, `option` e `.sr-only` em cada um. Não são o que eu
 * acho que a tela dizia — são o que ela dizia.
 *
 * Três entradas o retrato **não** alcançou, e por isso elas estão travadas
 * aqui e em nenhum outro lugar:
 *
 * - `vazio.naAba`, que precisa de uma aba sem aposta nenhuma — no modo
 *   demonstração toda aba válida devolve as mesmas onze apostas
 *   (`src/app/api/bets/route.ts`);
 * - `mais.rotulo` e `mais.quantos`, que só aparecem acima de cem apostas.
 *
 * E uma saída que o retrato não viu: `resumo.oddMedia` com travessão, porque
 * nenhum dos vinte recortes chegou a odd média zero.
 */

const T = textoDasApostas();

/** O `Trecho[]` do jeito que a tela o lê em voz alta: só o texto, em ordem. */
const corrido = (partes: readonly Trecho[]) =>
  partes.map((p) => (typeof p === "string" ? p : p.forte)).join("");

/** Só os trechos destacados, para provar quais são e quantos. */
const destaques = (partes: readonly Trecho[]) =>
  partes.filter((p): p is Exclude<Trecho, string> => typeof p !== "string");

const MES: Periodo = { prefixo: "de", nome: "Agosto26" };
const TODAS: Periodo = { prefixo: "de", nome: "todos os meses" };

describe("texto das apostas", () => {
  it("o subtítulo sai como a tela escrevia, nas quatro formas medidas", () => {
    expect(corrido(T.escopo(MES, ""))).toBe("Feed cronológico de Agosto26.");
    expect(corrido(T.escopo(MES, "24/08/2026 a 26/08/2026"))).toBe(
      "Feed cronológico de Agosto26 (24/08/2026 a 26/08/2026)."
    );
    expect(corrido(T.escopo(TODAS, ""))).toBe("Feed cronológico de todos os meses.");
    expect(corrido(T.escopo(TODAS, "dia 25/08/2026"))).toBe(
      "Feed cronológico de todos os meses (dia 25/08/2026)."
    );
  });

  it("o subtítulo tem um destaque só, o nome do período, e sem papel", () => {
    // É a divergência que `painel.ts` anuncia: lá o intervalo vai em <strong>,
    // aqui o parêntese sai sem destaque nenhum. Um destaque só não precisa de
    // papel — quem desenha é a tela.
    const comIntervalo = T.escopo(MES, "24/08/2026 a 26/08/2026");
    expect(destaques(comIntervalo)).toEqual([{ forte: "Agosto26" }]);
    expect(destaques(comIntervalo).every((d) => d.papel === undefined)).toBe(true);
    expect(destaques(T.escopo(TODAS, ""))).toEqual([{ forte: "todos os meses" }]);
  });

  it("o título do CSV continua sem singular, como a tela media", () => {
    // Preservado de propósito: este trabalho prometeu não mudar saída. O
    // conserto é a #156, e este teste é o que vai ficar vermelho quando ele
    // chegar — é a trava que torna o conserto uma decisão, e não um descuido.
    expect(T.csv.titulo("1")).toBe(
      "Baixar as 1 apostas do filtro, para abrir no Excel ou no Google Sheets"
    );
    expect(T.csv.titulo("0")).toBe(
      "Baixar as 0 apostas do filtro, para abrir no Excel ou no Google Sheets"
    );
    expect(T.csv.titulo("7")).toBe(
      "Baixar as 7 apostas do filtro, para abrir no Excel ou no Google Sheets"
    );
  });

  it("o rodapé do Green/Red emenda a anulada com espaço e ponto médio", () => {
    // " · 1 void": o espaço da frente vinha de um {" "} no JSX e o ponto médio
    // é U+00B7. "void" em minúscula aqui, "Void" no filtro, "VOID" na pílula —
    // as três grafias ficam, e o topo de apostas.ts diz por quê.
    expect(T.resumo.voids("1")).toBe(" · 1 void");
    expect(T.resumo.voids("1")).toContain("·");
    expect(T.resultado.rotulos.VOID).toBe("Void");
  });

  it("a odd média aceita o número e o travessão", () => {
    expect(T.resumo.oddMedia("2,10")).toBe("odd média 2,10");
    expect(T.resumo.oddMedia(T.resumo.semValor)).toBe("odd média —");
  });

  it("os cinco rótulos do filtro de resultado saem na forma medida", () => {
    // As chaves são o estado, a comparação contra `bet.resultado` e o
    // `?resultado=` do endereço. Só o lado direito é texto.
    expect(T.resultado.rotulos).toEqual({
      TODAS: "Todas",
      GREEN: "Green",
      RED: "Red",
      VOID: "Void",
      PENDENTE: "Pendente",
    });
  });

  it("os rótulos das faixas de odd trazem os limiares e a meia-risca", () => {
    expect(T.odd.faixas).toEqual({
      TODAS: "Todas",
      BAIXA: "< 1,8",
      MEDIA: "1,8 – 3,0",
      ALTA: "> 3,0",
    });
    // Meia-risca (U+2013), não hífen: os dois são indistinguíveis numa revisão.
    expect(T.odd.faixas.MEDIA).toContain("–");
    expect(T.odd.faixas.MEDIA).not.toContain("-");
    // Os números repetem à mão os limiares que o filtro compara como 1.8 e 3.0.
    // Nada liga os dois, e este teste não consegue ligar: os limiares moram na
    // página e não são exportados. Fica registrado no topo de apostas.ts.
    expect(T.odd.rotulo).toBe("Odd:");
  });

  it("a contagem do dia usa a função comum, com os parênteses", () => {
    expect(T.dias.contagem(1)).toBe("(1 aposta)");
    expect(T.dias.contagem(2)).toBe("(2 apostas)");
    expect(T.dias.contagem(3)).toBe("(3 apostas)");
    // Zero é plural em português do Brasil, e `contagem` congela isso de
    // propósito — ver `forma.ts`.
    expect(T.dias.contagem(0)).toBe("(0 apostas)");
  });

  it("as duas ausências são frases diferentes", () => {
    expect(T.vazio.naAba(MES)).toBe("Nenhuma aposta registrada de Agosto26.");
    expect(T.vazio.naAba(TODAS)).toBe("Nenhuma aposta registrada de todos os meses.");
    expect(T.vazio.nosFiltros).toBe("Nenhuma aposta corresponde aos filtros.");
  });

  it("a linha da aposta nomeia a partida e o mercado, e o retrato confere", () => {
    expect(T.linha.aria({ partida: "Palmeiras x Flamengo", tip: "Over 2.5 Gols" })).toBe(
      "Ver detalhes: Palmeiras x Flamengo, Over 2.5 Gols"
    );
    expect(T.linha.odd("2,10")).toBe("@2,10");
  });

  it("os dois travessões da tela são entradas separadas", () => {
    // Mesmo glifo, razões diferentes: um é "não há o que calcular" nos cartões
    // de taxa e de ROI, o outro é "esta aposta não tem lucro". Separados para a
    // #128 poder traduzir um sem o outro. O terceiro travessão da tela é o
    // `SEM_DATA` de `src/lib/padroes.ts`, que é sentinela e não vem daqui.
    expect(T.resumo.semValor).toBe("—");
    expect(T.linha.semLucro).toBe("—");
  });

  it("a tabela tem a legenda falada e os oito cabeçalhos na ordem das colunas", () => {
    expect(T.tabela.legenda({ prefixo: "de", nome: "Novembro26" })).toBe(
      "Apostas registradas de Novembro26"
    );
    expect([
      T.tabela.data,
      T.tabela.esporte,
      T.tabela.partida,
      T.tabela.casa,
      T.tabela.odd,
      T.tabela.valor,
      T.tabela.status,
      T.tabela.lucro,
    ]).toEqual([
      "Data",
      "Esporte",
      "Partida / Mercado",
      "Casa",
      "Odd",
      "Valor",
      "Status",
      "Lucro",
    ]);
  });

  it("o rodapé da tabela, que a suíte de tela não alcança, fica travado aqui", () => {
    expect(T.mais.rotulo(100)).toBe("Mostrar mais 100");
    expect(T.mais.quantos({ exibindo: "100", total: "2.452" })).toBe(
      "Exibindo 100 de 2.452 apostas"
    );
  });

  it("os três filtros múltiplos têm rótulo vazio e substantivo", () => {
    // O `vazio` sai em dois papéis dentro do SeletorMultiplo — rótulo do botão
    // e nome da lista aberta —, e o substantivo entra em "2 casas" e em
    // "Limpar filtro de casas", que ainda moram naquele componente.
    expect(T.filtros.esportes.vazio).toBe("Todos os Esportes");
    expect(T.filtros.casas.vazio).toBe("Todas as Casas");
    expect(T.filtros.adms.vazio).toBe("Todos os Adms");
    expect([
      T.filtros.esportes.substantivo,
      T.filtros.casas.substantivo,
      T.filtros.adms.substantivo,
    ]).toEqual(["esportes", "casas", "adms"]);
  });

  it("os rótulos que a suíte de tela segura estão escritos como ela os procura", () => {
    // Dez arquivos de `e2e/` acham elemento por estes textos. Mudar um aqui
    // sem mudar lá derruba a suíte — barulhento, que é o caso fácil; este
    // teste é a primeira linha vermelha, antes de a suíte rodar.
    expect(T.csv.rotulo).toBe("Baixar CSV");
    expect(T.busca.rotulo).toBe("Buscar apostas");
    expect(T.busca.dica).toBe("Buscar partida, mercado, casa, adm...");
    expect(T.dias.expandir).toBe("Expandir tudo");
    expect(T.dias.recolher).toBe("Recolher tudo");
    expect(T.resultado.aria).toBe("Filtrar por resultado");
    expect(T.odd.aria).toBe("Filtrar por faixa de odd");
    expect(T.vista.aria).toBe("Modo de visualização");
    expect(T.vista.cartoes).toBe("Visualizar em cartões");
    expect(T.vista.tabela).toBe("Visualizar em tabela");
    expect([T.resumo.lucro, T.resumo.greenRed, T.resumo.acerto, T.resumo.roi]).toEqual([
      "Lucro do Filtro",
      "Green / Red",
      "Taxa de Acerto",
      "ROI do Filtro",
    ]);
  });
});
