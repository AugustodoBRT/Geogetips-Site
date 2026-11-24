import { describe, expect, it } from "vitest";
// Caminho relativo, e não o alias `@/`: o vitest.config.mts não declara
// `resolve.alias`, e todos os testes deste repositório importam assim.
import sitemap from "../app/sitemap";
import { SITE_URL } from "../lib/constants";
import { textoDasRotas } from "./rotas";

/**
 * O dicionário de nomes de rota (#127, primeiro pedaço).
 *
 * Dois trabalhos aqui. O primeiro é a trava: este PR afirma que **nenhum
 * caractere muda na tela**, e a única forma de uma afirmação dessas valer
 * alguma coisa é estar escrita num teste. O segundo é amarrar o dicionário ao
 * sitemap, porque as duas listas de rota precisam dizer a mesma coisa e nada as
 * obrigava a isso.
 */

/**
 * De caminho para chave do dicionário.
 *
 * Mora no teste de propósito: o caminho é identificador e a chave é semântica,
 * e é justamente por não serem a mesma coisa que o dicionário não é indexado
 * por caminho. Na #128 os caminhos mudam e as chaves ficam — e então é esta
 * tabela que vai precisar de uma linha, não o dicionário.
 */
const CHAVE_DO_CAMINHO = {
  "/": "home",
  "/painel": "painel",
  "/apostas": "apostas",
  "/historico": "historico",
  "/adms": "adms",
  "/estatisticas": "estatisticas",
  "/perguntas": "perguntas",
} as const;

function caminhosDoSitemap(): string[] {
  return sitemap().map((p) => p.url.replace(SITE_URL, "") || "/");
}

describe("nomes de rota", () => {
  it("toda rota do sitemap tem nome no dicionário", () => {
    const caminhos = caminhosDoSitemap();

    // Sem este guarda, um sitemap vazio passaria o laço inteiro sem conferir
    // nada — e "o teste passou" diria o contrário do que aconteceu.
    expect(caminhos.length).toBeGreaterThan(0);

    for (const caminho of caminhos) {
      const chave = CHAVE_DO_CAMINHO[caminho as keyof typeof CHAVE_DO_CAMINHO];
      expect(chave, `o sitemap tem ${caminho} e o dicionário não`).toBeDefined();
      expect(textoDasRotas()[chave].titulo.length).toBeGreaterThan(0);
      expect(textoDasRotas()[chave].descricao.length).toBeGreaterThan(0);
    }
  });

  it("a calculadora tem nome e fica fora do sitemap, de propósito", () => {
    // O comentário de topo de calculadora/page.tsx explica: enquanto não se
    // decide se ela é aberta ou exclusiva do canal pago, a página existe só
    // para quem tem o endereço — fora do menu, fora do sitemap, com noindex.
    // e2e/calculadora.spec.ts cobra a mesma coisa pelo outro lado.
    expect(textoDasRotas().calculadora.titulo).toBe("Calculadora de valor esperado");
    expect(caminhosDoSitemap()).not.toContain("/calculadora");
  });

  it("os nomes são, caractere a caractere, os que já estavam no código", () => {
    // A trava. Este PR move texto de lugar e promete que a tela não muda; sem
    // esta asserção a promessa não é verificável, e a hora de traduzir qualquer
    // uma destas linhas é a #128, de propósito e com este teste vermelho junto.
    expect(textoDasRotas()).toEqual({
      home: {
        titulo: "GeogeTips — Matemática para ganhar",
        descricao:
          "Histórico aberto de apostas esportivas: cada uma planilhada, com ROI, taxa de acerto e evolução da banca. Grupo gratuito no Telegram.",
      },
      painel: {
        titulo: "Painel de Performance",
        descricao:
          "Lucro, ROI, taxa de acerto e evolução da banca do GeogeTips, calculados a partir da planilha pública de apostas.",
      },
      apostas: {
        titulo: "Feed de Apostas",
        descricao:
          "Todas as apostas do GeogeTips em ordem cronológica, com odd, casa, valor e resultado. Filtre por data, esporte, casa e faixa de odd.",
      },
      historico: {
        titulo: "Histórico Mês a Mês",
        descricao:
          "Resultado, ROI e taxa de acerto de cada mês do GeogeTips lado a lado, incluindo os meses negativos.",
      },
      adms: {
        titulo: "Performance dos Adms",
        descricao:
          "Taxa de acerto, volume, ROI e lucro em unidades de cada adm do GeogeTips.",
      },
      estatisticas: {
        titulo: "Estatísticas & Padrões",
        descricao:
          "Distribuição de resultados, médias de odd e lucro por esporte e por casa de apostas no GeogeTips.",
      },
      perguntas: {
        titulo: "Perguntas frequentes",
        descricao:
          "Como o lucro, o ROI, a taxa de acerto e a maior queda do GeogeTips são calculados, e o que perguntam antes de entrar no grupo.",
      },
      calculadora: {
        titulo: "Calculadora de valor esperado",
        descricao:
          "Odd justa, hold, surebet e múltiplas: descubra se uma odd paga mais do que a probabilidade real justifica, e quanto apostar nela pelo critério de Kelly.",
      },
    });
  });
});
