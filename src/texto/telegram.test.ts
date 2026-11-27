import { describe, expect, it } from "vitest";
import { textoDoTelegram } from "./telegram";

/**
 * A trava do bloco do Telegram (#127).
 *
 * Os textos esperados foram lidos do site rodando, antes da extração: seis
 * retratos do `body` inteiro — a home em quatro larguras e a tela de apostas
 * em duas —, com o texto, os atributos e a estrutura de cada um.
 *
 * O `body`, e não o `main`, porque o botão mora no cabeçalho. As quatro
 * larguras caem dos dois lados dos cortes em que o rótulo curto aparece e
 * some.
 */

const T = textoDoTelegram();

describe("texto do Telegram", () => {
  it("o botão tem um rótulo inteiro e um curto, e os dois moram juntos", () => {
    expect(T.botao).toBe("Entrar no grupo grátis");
    expect(T.botaoCurto).toBe("Grupo grátis");
    // São o mesmo botão: o curto é o que cabe no cabeçalho. Se um dia
    // deixarem de falar da mesma coisa, é defeito, não escolha.
    expect(T.botaoCurto.length).toBeLessThan(T.botao.length);
  });

  it("a faixa de conversão sai como a tela escrevia", () => {
    expect(T.secao.selo).toBe("Grupo gratuito");
    expect(T.secao.titulo).toEqual(["Os números estão abertos.", "O grupo também."]);
    expect(T.secao.texto).toBe(
      "Tudo que você vê neste site sai das mesmas entradas que são enviadas no " +
        "canal. Entre, acompanhe por alguns dias e confira os resultados na planilha " +
        "antes de decidir qualquer coisa."
    );
    expect(T.secao.planilha).toBe("Conferir a planilha");
    expect(T.secao.rodape).toBe(
      "@vemproGeogeTips · planilha aberta em modo somente leitura · 18+"
    );
  });

  it("as três promessas saem na ordem em que a faixa as lista", () => {
    expect(T.secao.beneficios).toEqual([
      "As entradas chegam no Telegram, na hora em que saem",
      "Cada aposta vira linha na planilha — inclusive as que dão red",
      "Entrada gratuita, sem cadastro",
    ]);
  });

  it("a chamada da lista de espera recebe o nome do grupo de fora", () => {
    // O nome vem do catálogo de `lib/grupos.ts`, que é da #151.
    expect(T.secao.listaDeEspera("GeogeTips - Sigma")).toBe(
      "O GeogeTips - Sigma, nosso grupo pago, está chegando."
    );
    expect(T.secao.entrarNaLista).toBe("Entrar na lista de espera");
  });

  it("nenhuma entrada de texto começa ou termina com espaço", () => {
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
    varrer(T, "telegram");
    expect(sobrando).toEqual([]);
  });
});
