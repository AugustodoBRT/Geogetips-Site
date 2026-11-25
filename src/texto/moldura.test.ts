import { describe, expect, it } from "vitest";
import { textoDaMoldura } from "./moldura";

/**
 * A trava da moldura (#127).
 *
 * O menu e o rodapé aparecem em toda tela, e o leitor de tela depende dos
 * rótulos de navegação — que ninguém vê e nenhuma conferência visual cobre.
 */

const T = textoDaMoldura();

describe("texto da moldura", () => {
  it("os nomes curtos são os que já estavam no menu e no rodapé", () => {
    expect(T.rotas.home).toBe("Início");
    expect(T.rotas.painel).toBe("Painel");
    expect(T.rotas.apostas).toBe("Apostas");
    expect(T.rotas.historico).toBe("Histórico");
    expect(T.rotas.adms).toBe("Adms");
    expect(T.rotas.estatisticas).toBe("Estatísticas");
  });

  it("perguntas tem um nome curto só, e é FAQ", () => {
    // Era a única rota com dois: "FAQ" no menu e "Perguntas frequentes" no
    // rodapé e no 404. Decisão de 24/11/2026.
    expect(T.rotas.perguntas).toBe("FAQ");
  });

  it("nenhuma rota tem dois nomes curtos", () => {
    // A forma do registro é o que impede a divergência de voltar: cada rota
    // tem uma string, não um objeto com variantes. Se alguém precisar de uma
    // segunda grafia, esbarra aqui antes de ela chegar à tela.
    for (const [rota, nome] of Object.entries(T.rotas)) {
      expect(typeof nome, `${rota} deixou de ser um nome só`).toBe("string");
    }
  });

  it("os rótulos de navegação são os que o e2e cobra pelo papel", () => {
    expect(T.navegacao.principal).toBe("Navegação principal");
    expect(T.navegacao.menu).toBe("Menu");
    expect(T.navegacao.abrir).toBe("Abrir menu");
    expect(T.navegacao.fechar).toBe("Fechar menu");
    expect(T.pularParaConteudo).toBe("Pular para o conteúdo");
  });

  it("abrir e fechar não podem ser o mesmo texto", () => {
    // O botão troca de rótulo conforme o menu está aberto ou fechado. Se os
    // dois virassem a mesma frase, quem ouve a tela perderia a única pista de
    // que o clique fez alguma coisa — e nenhum teste de tela acusaria.
    expect(T.navegacao.abrir).not.toBe(T.navegacao.fechar);
  });

  it("nenhuma entrada está vazia", () => {
    let folhas = 0;
    const andar = (valor: unknown, caminho: string) => {
      if (typeof valor === "string") {
        folhas += 1;
        expect(valor.length, `${caminho} está vazia`).toBeGreaterThan(0);
        return;
      }
      for (const [chave, dentro] of Object.entries(valor as object)) {
        andar(dentro, `${caminho}.${chave}`);
      }
    };
    andar(T, "moldura");
    expect(folhas).toBeGreaterThan(10);
  });
});
