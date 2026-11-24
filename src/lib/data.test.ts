import { describe, expect, it } from "vitest";
import { apostasDemonstracaoSigma } from "./data";

/**
 * O que importa aqui não é o conteúdo da demonstração — é a fronteira do dia.
 *
 * As duas apostas recentes do Sigma existem para o atraso de 3 dias do grupo
 * pago ter o que esconder, e a suíte de tela confere exatamente isso. Se a data
 * delas sair do relógio do processo em vez do dia do grupo, elas caem do outro
 * lado da fronteira e o teste de tela passa a depender da hora e do fuso em que
 * a bateria roda. Era o caso antes da #124.
 */
describe("datas da demonstração do Sigma", () => {
  // 02:00 UTC do dia 1º = 23h do dia 30 em São Paulo. Para o grupo ainda é dia
  // 30, e é essa a data que a aposta de "hoje" tem de levar. Com o relógio do
  // processo, um servidor em UTC já teria virado o mês aqui.
  const REF = new Date("2026-10-01T02:00:00Z");

  it("a aposta de hoje leva o dia do grupo, não o do processo", () => {
    const hoje = apostasDemonstracaoSigma(REF).find((b) => b.id === "sigma-hoje");
    expect(hoje?.data).toBe("30/09/2026");
  });

  it("a de ontem é o dia anterior ao do grupo", () => {
    const ontem = apostasDemonstracaoSigma(REF).find((b) => b.id === "sigma-ontem");
    expect(ontem?.data).toBe("29/09/2026");
  });

  it("não depende do fuso do processo", () => {
    const antes = process.env.TZ;
    try {
      process.env.TZ = "Pacific/Kiritimati"; // UTC+14
      const leste = apostasDemonstracaoSigma(REF).find((b) => b.id === "sigma-hoje");
      const localLeste = new Date(2026, 8, 30).getTime();
      process.env.TZ = "Pacific/Midway"; // UTC-11
      const oeste = apostasDemonstracaoSigma(REF).find((b) => b.id === "sigma-hoje");
      const localOeste = new Date(2026, 8, 30).getTime();

      // O controle negativo que faltava aqui, e que o date.test.ts tem: prova
      // que trocar TZ faz efeito neste executor. Sem ele, no dia em que a troca
      // deixar de pegar — pool em worker thread, contêiner sem tzdata, versão
      // nova do Node — este teste viraria o primeiro do arquivo escrito duas
      // vezes, verde e sem guardar nada.
      expect(localLeste).not.toBe(localOeste);

      expect(leste?.data).toBe("30/09/2026");
      expect(oeste?.data).toBe("30/09/2026");
    } finally {
      process.env.TZ = antes;
    }
  });
});
