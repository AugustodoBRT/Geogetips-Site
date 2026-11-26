import { describe, expect, it } from "vitest";
import { textoDasEstatisticas } from "./estatisticas";

/**
 * A trava da tela de Estatísticas (#127).
 *
 * A tela tem duas regiões que só existem no áudio — o `aria-label` da rosca e o
 * de cada cartão de Top — e seis contagens com plural. É onde uma extração
 * desatenta muda a saída sem aparecer em nenhuma captura de tela.
 */

const T = textoDasEstatisticas();
const PERIODO = { prefixo: "de", nome: "todos os meses" };

describe("texto das estatísticas", () => {
  it("a frase de escopo mantém o período em negrito no meio", () => {
    expect(T.escopo(PERIODO)).toEqual([
      "Distribuição de resultados, médias de odd e lucro por esporte e por casa de ",
      { forte: "todos os meses" },
      ".",
    ]);

    expect(T.escopo({ prefixo: "de", nome: "Setembro26" })[1]).toEqual({
      forte: "Setembro26",
    });
  });

  it("as frases montadas saem como o JSX escrevia", () => {
    expect(T.distribuicao.titulo("Geral")).toBe("Distribuição de Resultados (Geral)");
    expect(T.odds.titulo("Agosto26")).toBe("Médias de Odd (Agosto26)");
    expect(T.distribuicao.linha("423", 38)).toBe("423 (38%)");
    expect(T.esportes.descricao(PERIODO)).toBe(
      "Rentabilidade por esporte de todos os meses"
    );
    expect(T.esportes.roi("+9,69%")).toBe("ROI +9,69%");
    expect(T.casas.linha({ apostas: 11, roi: "+9,69%" })).toBe("11 apostas · ROI +9,69%");
    expect(T.detalheDosEsportes.rotulo(PERIODO)).toBe(
      "Todos os esportes de todos os meses"
    );
    expect(T.detalheDasCasas.rotulo(PERIODO)).toBe("Todas as casas de todos os meses");
  });

  it("a rosca descreve quatro fatias só quando a quarta existe", () => {
    // Sem nenhuma anulada a rosca não desenha a quarta fatia, e a frase não
    // pode prometer uma proporção que não está na tela.
    expect(T.distribuicao.descricao(true)).toBe(
      "Proporção entre Green, Red, Pendentes e Anuladas"
    );
    expect(T.distribuicao.descricao(false)).toBe(
      "Proporção entre Green, Red e Pendentes"
    );
  });

  it("a rosca falada monta os cinco números numa frase só", () => {
    expect(
      T.distribuicao.aria({
        greens: "423",
        reds: "280",
        pendentes: "11",
        anuladas: "7",
        total: "721",
      })
    ).toBe("423 green, 280 red, 11 pendentes, 7 anuladas, de 721 apostas");
  });

  it("a rosca falada não tem singular, como já era", () => {
    // Com uma aposta só ela diz "de 1 apostas". Está errado, e continua errado
    // de propósito — consertar mudaria a saída. A barra equivalente de /adms
    // faz o singular, então as duas telas discordam. A asserção faz do conserto
    // uma decisão com teste vermelho junto.
    const falada = T.distribuicao.aria({
      greens: "1",
      reds: "0",
      pendentes: "0",
      anuladas: "0",
      total: "1",
    });
    expect(falada).toContain("de 1 apostas");
    expect(falada).not.toContain("de 1 aposta,");
  });

  it("a rosca fala 'anuladas' onde a legenda escreve 'Void (anulada)'", () => {
    // Mesma coisa, duas grafias, na mesma tela: quem enxerga lê uma e quem ouve
    // lê a outra. É a mesma divergência que /adms tem entre a barra e o selo.
    const falada = T.distribuicao.aria({
      greens: "0",
      reds: "0",
      pendentes: "0",
      anuladas: "1",
      total: "1",
    });
    expect(falada).toContain("anuladas");
    expect(falada).not.toContain("Void");
    expect(T.distribuicao.legenda.void).toBe("Void (anulada)");
  });

  it("a legenda ordena green, red, pendente, void", () => {
    // A ordem é a mesma da fala desta tela, e **não** a de /adms, que põe void
    // em terceiro. Uniformizar as duas muda a saída de uma delas.
    expect(Object.values(T.distribuicao.legenda)).toEqual([
      "Green (Vitórias)",
      "Red (Perdas)",
      "Pendente",
      "Void (anulada)",
    ]);
  });

  it("as contagens de odd falam em 'tip', no singular e no plural", () => {
    expect(T.odds.greenSub(1)).toBe("1 tip acertada");
    expect(T.odds.greenSub(423)).toBe("423 tips acertadas");
    expect(T.odds.redSub(1)).toBe("1 tip perdida");
    expect(T.odds.redSub(280)).toBe("280 tips perdidas");
    expect(T.odds.geralSub(1)).toBe("1 tip no total");
    expect(T.odds.geralSub(721)).toBe("721 tips no total");
  });

  it("os resumos dos diálogos concordam no singular", () => {
    expect(T.detalheDosEsportes.resumo(1, PERIODO)).toBe(
      "1 modalidade de todos os meses"
    );
    expect(T.detalheDosEsportes.resumo(7, PERIODO)).toBe(
      "7 modalidades de todos os meses"
    );
    expect(T.detalheDasCasas.resumo(1, PERIODO)).toBe("1 casa de todos os meses");
    expect(T.detalheDasCasas.resumo(9, PERIODO)).toBe("9 casas de todos os meses");
    expect(T.casas.linha({ apostas: 1, roi: "0,0%" })).toBe("1 aposta · ROI 0,0%");
  });

  it("as duas tabelas chamam a mesma coluna pelo mesmo nome", () => {
    // O cabeçalho curto e o longo são a razão de `tabela` existir: se um dia
    // "Resultado" mudar de palavra, muda nas duas juntas.
    expect(T.tabela.apostasCurto).toBe("Tips");
    expect(T.tabela.apostas).toBe("Apostas");
    expect(T.tabela.roi).toBe("ROI");
    expect(T.tabela.resultado).toBe("Resultado");
    expect(T.tabela.fechar).toBe("Fechar");
  });

  it("as entradas fixas são as que já estavam na tela", () => {
    expect(T.selo).toBe("Análises");
    expect(T.distribuicao.total).toBe("Apostas");
    expect(T.odds.descricao).toBe("Comparativo entre apostas ganhas e perdidas");
    expect(T.odds.green).toBe("Apostas com GREEN");
    expect(T.odds.red).toBe("Apostas com RED");
    expect(T.odds.geral).toBe("Média Geral");
    expect(T.odds.semValor).toBe("—");
    expect(T.esportes.aria).toBe("Ver todos os esportes em detalhe");
    expect(T.esportes.titulo).toBe("Top Esportes");
    expect(T.esportes.vazio).toBe("Sem dados de categoria neste período.");
    expect(T.casas.aria).toBe("Ver todas as casas em detalhe");
    expect(T.casas.titulo).toBe("Top Casas");
    expect(T.casas.descricao).toBe("Lucro e ROI por casa — a barra mostra o volume");
    expect(T.casas.vazio).toBe("Sem dados de casas neste período.");
    expect(T.detalheDosEsportes.titulo).toBe("Todos os esportes");
    expect(T.detalheDosEsportes.esporte).toBe("Esporte");
    expect(T.detalheDosEsportes.acerto).toBe("Acerto");
    expect(T.detalheDasCasas.titulo).toBe("Todas as casas");
    expect(T.detalheDasCasas.casa).toBe("Casa");
    expect(T.detalheDasCasas.apostado).toBe("Apostado");
  });

  it("nenhuma entrada está vazia", () => {
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
    andar(T, "estatisticas");
    expect(folhas).toBeGreaterThan(40);
  });
});
