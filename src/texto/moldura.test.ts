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

  it("perguntas ainda tem dois nomes, e isso está aqui de propósito", () => {
    // A decisão de produto de 24/11 é um nome só, "FAQ". Aplicá-la muda o que
    // o visitante lê no rodapé e no 404, e esta extração promete não mudar
    // nada — então os dois continuam, e este teste é o que torna a unificação
    // uma mudança deliberada em vez de um efeito colateral.
    expect(T.rotas.perguntas.menu).toBe("FAQ");
    expect(T.rotas.perguntas.lista).toBe("Perguntas frequentes");
    expect(T.rotas.perguntas.menu).not.toBe(T.rotas.perguntas.lista);
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
