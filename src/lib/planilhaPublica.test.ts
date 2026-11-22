import { afterEach, describe, expect, it, vi } from "vitest";
import { lerAbaPublica, pertenceAoMes } from "./planilhaPublica";

/**
 * A leitura pública não erra em aba inexistente: o gviz devolve a primeira aba
 * da planilha no lugar. `pertenceAoMes` é o que separa a aba pedida dessa
 * aba-fallback, e um engano aqui faz um mês inteiro sumir ou aparecer em dobro.
 */

/** Uma linha como o gviz devolve: coluna A vazia, a data na B. */
function linha(data: string): string[] {
  return ["", data, "Futebol", "Adm", "A x B"];
}

describe("pertenceAoMes", () => {
  it("reconhece a aba pelo mês das datas", () => {
    const linhas = [linha("01/10/2026"), linha("02/10/2026")];
    expect(pertenceAoMes(linhas, 10, 26)).toBe(true);
    expect(pertenceAoMes(linhas, 9, 26)).toBe(false);
  });

  // A aba guarda aposta de longo prazo com a data do evento. Olhando só a
  // primeira linha, Outubro26 que começasse por um campeão de dezembro seria
  // dada como inexistente, e o mês sumiria do site.
  it("não se engana com uma aposta de longo prazo na primeira linha", () => {
    const linhas = [linha("20/12/2026"), linha("01/10/2026"), linha("01/10/2026")];
    expect(pertenceAoMes(linhas, 10, 26)).toBe(true);
  });

  // Nos primeiros dias do mês a aba tem poucas linhas, e as de longo prazo
  // podem ser a maioria. Elas não votam: contando, o mês sumia do site pelo
  // motivo contrário.
  it("aceita a aba em que as de longo prazo são a maioria", () => {
    const linhas = [linha("01/10/2026"), linha("15/12/2026"), linha("20/12/2026")];
    expect(pertenceAoMes(linhas, 10, 26)).toBe(true);
  });

  it("recusa a aba que só tem aposta de mês que ainda vem", () => {
    // Sem nenhuma linha do próprio mês, não dá para afirmar que a aba é a certa.
    expect(pertenceAoMes([linha("20/12/2026")], 10, 26)).toBe(false);
  });

  it("continua recusando a aba-fallback, que é quase toda de outro mês", () => {
    const setembro = [linha("30/09/2026"), linha("30/09/2026"), linha("05/10/2026")];
    expect(pertenceAoMes(setembro, 10, 26)).toBe(false);
  });

  it("confere o ano junto com o mês", () => {
    expect(pertenceAoMes([linha("01/10/2025")], 10, 26)).toBe(false);
  });

  it("recusa a aba sem nenhuma data legível", () => {
    expect(pertenceAoMes([linha(""), linha("—")], 10, 26)).toBe(false);
  });
});

/**
 * As três causas de uma leitura não dar certo são coisas diferentes, e
 * devolver `null` para as três foi o que permitiu ao site acusar a causa
 * errada: em 01/10/2026 o antivírus interceptou o HTTPS e a tela mandou
 * conferir o compartilhamento de uma planilha que estava pública.
 */
describe("lerAbaPublica", () => {
  const PLANILHA = "planilha-de-teste";
  const CABECALHO = '"","DATA","ESPORTE"';
  const OUTUBRO = `${CABECALHO}\n"","05/10/2026","Futebol"`;

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Põe no lugar do fetch uma resposta pronta, ou um erro de rede. */
  function comResposta(r: { ok: boolean; status?: number; corpo?: string } | Error) {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        if (r instanceof Error) throw r;
        return {
          ok: r.ok,
          status: r.status ?? (r.ok ? 200 : 500),
          text: async () => r.corpo ?? "",
        } as Response;
      })
    );
  }

  it("devolve as linhas quando a aba é a pedida", async () => {
    comResposta({ ok: true, corpo: OUTUBRO });
    const r = await lerAbaPublica(PLANILHA, "Outubro26", { mes: 10, ano2: 26 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.aba).toBe("Outubro26");
      expect(r.linhas).toHaveLength(1);
    }
  });

  it("chama de 'não pública' o corpo em HTML, e só ele", async () => {
    // O gviz devolve a página de login em HTML quando a planilha é privada.
    comResposta({ ok: true, corpo: "<!DOCTYPE html><html><body>Entrar</body></html>" });
    const r = await lerAbaPublica(PLANILHA, "Outubro26");
    expect(r).toEqual({ ok: false, motivo: "nao-publica" });
  });

  it("chama de 'outro mês' a aba-fallback, que é resposta sobre a aba", async () => {
    // Pedimos novembro e o gviz devolveu a primeira aba, que é de outubro.
    comResposta({ ok: true, corpo: OUTUBRO });
    const r = await lerAbaPublica(PLANILHA, "Novembro26", { mes: 11, ano2: 26 });
    expect(r).toEqual({ ok: false, motivo: "outro-mes" });
  });

  it("chama de falha o HTTP ruim, e guarda o status", async () => {
    comResposta({ ok: false, status: 429 });
    const r = await lerAbaPublica(PLANILHA, "Outubro26");
    expect(r).toEqual({ ok: false, motivo: "falhou", detalhe: "HTTP 429" });
  });

  it("não deixa o erro de rede escapar: ele vira falha com a causa", async () => {
    // O caso de 01/10/2026, em uma linha de teste.
    comResposta(new Error("unable to verify the first certificate"));
    const r = await lerAbaPublica(PLANILHA, "Outubro26");
    expect(r).toEqual({
      ok: false,
      motivo: "falhou",
      detalhe: "unable to verify the first certificate",
    });
  });

  it("não confunde falha de rede com aba inexistente", async () => {
    // A distinção que o `catch { return false }` apagava.
    comResposta(new Error("getaddrinfo ENOTFOUND"));
    const r = await lerAbaPublica(PLANILHA, "Novembro26", { mes: 11, ano2: 26 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).not.toBe("outro-mes");
  });
});
