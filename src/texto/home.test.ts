import { describe, expect, it } from "vitest";
import { textoDaHome } from "./home";

/**
 * A trava do texto da home (#127).
 *
 * Os textos longos desta tela são montados por concatenação no dicionário, e
 * concatenação perde espaço calada. Quem provou que nenhuma perdeu foi o
 * retrato: o texto da home, os atributos, a estrutura inteira do `main` e o
 * HTML que o servidor manda saíram idênticos antes e depois da extração. Estes
 * testes são o que segura isso daqui para a frente.
 *
 * Quatro entradas o retrato **não** alcançou, porque dependem de a planilha
 * falhar e no modo demonstração ela sempre responde — `previa.*.semDado` e
 * `previa.semValor`. Essas foram conferidas caractere a caractere contra o
 * código da `main`, e é aqui que elas ficam travadas.
 */

const T = textoDaHome();

describe("texto da home", () => {
  it("o hero sai como a tela escrevia", () => {
    expect(T.selo).toBe("Análise · Dados · Apostas · Resultados");
    expect(T.chamada).toBe(
      "O GeogeTips transforma dados brutos em decisões inteligentes. Registre, " +
        "acompanhe e analise cada aposta com a clareza de quem usa números — não achismo."
    );
    expect(T.verResultados).toBe("Ver os resultados");
    expect(T.promessa).toBe(
      "Entrada gratuita pelo Telegram · resultados abertos na planilha pública"
    );
  });

  it("a faixa de números traz só a palavra, e não o número", () => {
    // O número mora num <span> com fonte mono e peso forte, e a palavra é nó de
    // texto irmão. Por isso `dias` não usa a `contagem` de forma.ts: ela
    // devolveria os dois juntos e o número perderia a fonte.
    expect(T.numeros.dias(1)).toBe("dia com aposta");
    expect(T.numeros.dias(5)).toBe("dias com aposta");
    expect(T.numeros.dias(0)).toBe("dias com aposta");
    expect(T.numeros.apostas("agosto de 2026")).toBe(
      "apostas registradas desde agosto de 2026"
    );
    expect(T.numeros.apostasSemPeriodo).toBe("apostas registradas");
    expect(T.numeros.acerto).toBe("taxa de acerto");
    expect(T.numeros.roi).toBe("de ROI");
    expect(T.numeros.bot).toBe("24/7");
    expect(T.numeros.botRotulo).toBe("bot automático");
  });

  it("a prévia do Painel repete os rótulos dele, de propósito", () => {
    expect(T.previa.lucro.titulo).toBe("Lucro Acumulado");
    expect(T.previa.acerto.titulo).toBe("Taxa de Acerto");
    expect(T.previa.roi.titulo).toBe("ROI");
    expect(T.previa.lucro.unidades("4,61")).toBe("4,61u acumuladas");
    expect(T.previa.acerto.placar({ greens: "5", reds: "3" })).toBe("5 green · 3 red");
    expect(T.previa.roi.oddMedia("2,28")).toBe("odd média 2,28");
  });

  it("o ramo sem planilha, que a suíte de tela não alcança, fica travado aqui", () => {
    expect(T.previa.semValor).toBe("—");
    expect(T.previa.lucro.semDado).toBe("histórico completo");
    expect(T.previa.acerto.semDado).toBe("sobre apostas finalizadas");
    expect(T.previa.roi.semDado).toBe("lucro sobre o total apostado");
  });

  it("o endereço desenhado na barra falsa é o mesmo caminho do botão", () => {
    // Um é texto na tela, o outro é o href de "Ver os resultados". A #128
    // renomeia as rotas: no dia em que /painel virar outra coisa, os dois
    // mudam, e só o href dá erro se ficar para trás.
    expect(T.previa.endereco).toBe("/painel");
  });

  it("o título das funcionalidades vem em duas linhas, para quebrar onde quiser", () => {
    expect(T.funcionalidades.selo).toBe("Funcionalidades");
    expect(T.funcionalidades.titulo).toEqual([
      "Tudo que você precisa,",
      "nada que não precisa.",
    ]);
  });

  it("os cinco cartões saem inteiros, sem espaço perdido na emenda", () => {
    const f = T.funcionalidades;
    expect(f.registro.titulo).toBe("Registro automático");
    expect(f.registro.texto).toBe(
      "Cada entrada enviada no canal vira uma linha na planilha automaticamente, " +
        "com partida, mercado, odd e valor. Sem digitação manual e sem esquecer nenhuma."
    );
    expect(f.planilha.titulo).toBe("Planilha Sincronizada");
    expect(f.planilha.texto).toBe(
      "A planilha no Google Sheets continua viva e é a fonte de tudo que aparece " +
        "aqui — aberta para conferência linha a linha."
    );
    expect(f.adms.titulo).toBe("Análise por Adm");
    expect(f.adms.texto).toBe(
      "Descubra quem realmente coloca dinheiro no seu bolso e quem dá prejuízo, " +
        "com acerto, volume e ROI de cada um."
    );
    expect(f.estatisticas.titulo).toBe("Estatísticas Completas");
    expect(f.estatisticas.texto).toBe(
      "Lucro por esporte, casa, odds médias e ROI real — mês a mês, incluindo os " +
        "meses negativos."
    );
  });

  it("o cartão da banca recebe a unidade já formatada", () => {
    expect(T.funcionalidades.banca.titulo).toBe("Gestão de Banca");
    expect(T.funcionalidades.banca.texto("R$ 100,00")).toBe(
      "Controle por unidades (1u = R$ 100,00), com travas de segurança e limites " +
        "máximos. Ajuste a unidade para a sua banca e veja o histórico na sua escala."
    );
  });

  it("os três passos saem na ordem e inteiros", () => {
    expect(T.passos.selo).toBe("Como Funciona");
    expect(T.passos.titulo).toBe("Três passos. Sem complicação.");
    expect([
      T.passos.entrada.titulo,
      T.passos.registro.titulo,
      T.passos.conferencia.titulo,
    ]).toEqual(["A entrada chega", "Entra na planilha", "Você confere"]);
    expect(T.passos.entrada.texto).toBe(
      "O adm envia a aposta no canal do Telegram, com a casa, o mercado e a odd."
    );
    expect(T.passos.registro.texto).toBe(
      "Toda entrada é registrada na hora — green, red ou anulada. Nada fica de fora."
    );
    expect(T.passos.conferencia.texto).toBe(
      "Os números deste site saem dessa planilha, que fica aberta para consulta a " +
        "qualquer momento."
    );
    expect(T.passos.link).toBe("Outras dúvidas frequentes");
  });

  it("nenhuma entrada de texto começa ou termina com espaço", () => {
    // A emenda de duas linhas é onde o espaço some ou dobra, e nenhuma destas
    // frases deveria carregar espaço nas pontas — as que precisam de espaço no
    // meio o têm dentro da própria string.
    const sobrando: string[] = [];
    const varrer = (valor: unknown, caminho: string) => {
      if (typeof valor === "string") {
        if (valor !== valor.trim()) sobrando.push(`${caminho}: ${JSON.stringify(valor)}`);
      } else if (Array.isArray(valor)) {
        valor.forEach((v, i) => varrer(v, `${caminho}[${i}]`));
      } else if (valor && typeof valor === "object") {
        for (const [k, v] of Object.entries(valor)) varrer(v, `${caminho}.${k}`);
      }
    };
    varrer(T, "home");
    expect(sobrando).toEqual([]);
  });
});
