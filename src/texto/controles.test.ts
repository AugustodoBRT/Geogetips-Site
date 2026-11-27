import { describe, expect, it } from "vitest";
import { textoDosControles } from "./controles";
import type { Trecho } from "./forma";

/**
 * A trava dos controles compartilhados (#127).
 *
 * Os textos esperados aqui foram lidos das telas rodando, com
 * `NEXT_PUBLIC_USE_MOCK=1`, antes da extração: treze estados em cinco rotas,
 * com o texto, os atributos e a estrutura do `main` em cada um. Não são o que
 * eu acho que os controles diziam — são o que eles diziam.
 *
 * Uma entrada o retrato não alcançou: `multiplo.vazio`, que precisa de uma aba
 * sem opção nenhuma para filtrar. As opções saem de todas as apostas da aba, e
 * no modo demonstração toda aba tem apostas.
 */

const T = textoDosControles();

const corrido = (partes: readonly Trecho[]) =>
  partes.map((p) => (typeof p === "string" ? p : p.forte)).join("");

const destaques = (partes: readonly Trecho[]) =>
  partes.filter((p): p is Exclude<Trecho, string> => typeof p !== "string");

describe("texto dos controles", () => {
  it("o filtro de período nomeia os dois campos e a inversão", () => {
    expect([T.periodo.de, T.periodo.ate]).toEqual(["De", "até"]);
    expect([T.periodo.dataInicial, T.periodo.dataFinal]).toEqual([
      "Data inicial",
      "Data final",
    ]);
    expect(T.periodo.invertido).toBe("A data inicial está depois da final — trocar");
    expect(T.periodo.limpar).toBe("Limpar intervalo de datas");
  });

  it("o seletor múltiplo monta as duas frases com o substantivo de fora", () => {
    // O substantivo vem de quem usa o componente — hoje `apostas.ts`.
    expect(T.multiplo.varios({ quantas: 2, substantivo: "casas" })).toBe("2 casas");
    expect(T.multiplo.limpar("esportes")).toBe("Limpar filtro de esportes");
    expect(T.multiplo.vazio).toBe("Nada para filtrar neste período.");
  });

  it("o seletor de mês tem a opção do agregado e o botão de recarregar", () => {
    expect(T.aba.rotulo).toBe("Selecionar mês");
    // "Todos os Meses (Geral)" aqui, e "Geral" em `rotuloDaAba`, de
    // `src/lib/constants.ts`: duas palavras para a mesma aba, de propósito.
    expect(T.aba.todas).toBe("Todos os Meses (Geral)");
    expect(T.aba.recarregar).toBe("Recarregar dados");
  });

  it("o aviso de atraso sai como a tela escrevia, com dois destaques iguais", () => {
    const frase = T.grupo.atraso({
      grupo: "GeogeTips - Sigma",
      dias: 3,
      ate: "24/11/2026",
    });
    expect(corrido(frase)).toBe(
      "Resultados do GeogeTips - Sigma com 3 dias de atraso. Cada aposta aparece " +
        "aqui 3 dias depois da data do jogo, para as entradas do grupo não circularem " +
        "de graça. Hoje o site mostra as apostas até 24/11/2026."
    );
    // Dois destaques, e nenhum leva papel: a tela desenha os dois igual.
    expect(destaques(frase)).toEqual([
      { forte: "Resultados do GeogeTips - Sigma com 3 dias de atraso." },
      { forte: "24/11/2026" },
    ]);
    expect(T.grupo.aria).toBe("Grupo");
  });

  it("o aviso de atraso continua sem singular, como a tela media", () => {
    // Preservado de propósito: hoje o único grupo com atraso tem três dias, e
    // trocar para `contagem` mudaria a saída no dia em que fosse um. O
    // conserto é a #159, e este teste é o que fica vermelho quando ele chegar.
    const umDia = corrido(T.grupo.atraso({ grupo: "Sigma", dias: 1, ate: "24/11/2026" }));
    expect(umDia).toContain("com 1 dias de atraso");
    expect(umDia).toContain("aqui 1 dias depois");
  });

  it("o seletor de unidade explica a troca e nomeia cada campo", () => {
    expect(T.unidade.titulo).toBe("Quanto vale 1 unidade para você?");
    expect(T.unidade.explicacao("R$ 100,00")).toBe(
      "A unidade do grupo é R$ 100,00. Coloque a sua e todos os valores passam " +
        "para a sua banca — o ROI e a taxa de acerto não mudam."
    );
    expect(T.unidade.sugeridos).toBe("Valores sugeridos");
    expect(T.unidade.rotuloDoCampo).toBe("Valor de 1 unidade em reais");
    expect(T.unidade.restaurar).toBe("Voltar para a unidade do grupo");
    // O símbolo que a tela desenha dentro do campo, como o "%" da calculadora.
    expect(T.unidade.moeda).toBe("R$");
  });

  it("a recusa diz os limites e dá o exemplo do ponto de milhar", () => {
    expect(T.unidade.recusado({ minimo: "R$ 0,01", maximo: "R$ 1.000.000,00" })).toBe(
      "Valor não aceito. Use algo entre R$ 0,01 e R$ 1.000.000,00 — o ponto pode " +
        "separar o milhar, como em 1.000."
    );
  });

  it("o aviso de simulação tem dois destaques, e só o primeiro leva papel", () => {
    const frase = T.unidade.simulacao({
      original: "R$ 100,00",
      escolhida: "R$ 250,00",
    });
    expect(corrido(frase)).toBe(
      "Simulação aproximada, não resultado exato. O histórico real foi operado a " +
        "R$ 100,00 por unidade, e o recálculo para R$ 250,00 apenas escala os valores " +
        "proporcionalmente. Ele não considera limites de aposta nem a liquidez de cada " +
        "mercado: em stakes maiores a casa pode não aceitar o valor cheio, e odds " +
        "altas costumam cair conforme o volume entra. Trate como ordem de grandeza."
    );
    // A abertura sai em âmbar e o do meio na ênfase comum: é para isso que o
    // `papel` existe, e por isso o quarto deles entrou em `forma.ts`.
    expect(destaques(frase)).toEqual([
      { forte: "Simulação aproximada, não resultado exato.", papel: "aviso" },
      { forte: "não considera limites de aposta nem a liquidez" },
    ]);
  });

  it("nenhuma entrada de texto começa ou termina com espaço", () => {
    // Menos as que montam frase em volta de um valor, que precisam do espaço
    // nas pontas — essas são `Trecho[]` e saem na varredura como função.
    const sobrando: string[] = [];
    const varrer = (valor: unknown, caminho: string) => {
      if (typeof valor === "string") {
        if (valor !== valor.trim()) sobrando.push(`${caminho}: ${JSON.stringify(valor)}`);
      } else if (valor && typeof valor === "object" && !Array.isArray(valor)) {
        for (const [k, v] of Object.entries(valor)) varrer(v, `${caminho}.${k}`);
      }
    };
    varrer(T, "controles");
    expect(sobrando).toEqual([]);
  });
});
