import { NextResponse } from "next/server";
import { getAvailableTabs, getBetsFromTab, USANDO_MOCK } from "@/lib/sheets";
import { computeStatsFromBets } from "@/lib/stats";
import { MOCK_RESUMO_MESES } from "@/lib/data";
import { ordemDaAba, reaisParaUnidades } from "@/lib/constants";

export const revalidate = 60;

export interface ResumoMes {
  aba: string;
  ordem: number;
  apostas: number;
  greens: number;
  reds: number;
  pendentes: number;
  voids: number;
  lucro: number;
  unidades: number;
  apostado: number;
  roi: number;
  taxaAcerto: number;
  oddMedia: number;
  /** Soma das odds do mês, para a média do consolidado sair exata. */
  somaOdds: number;
}

function resumir(aba: string, bets: Parameters<typeof computeStatsFromBets>[0]): ResumoMes {
  const s = computeStatsFromBets(bets);
  return {
    aba,
    ordem: ordemDaAba(aba),
    apostas: s.totalBets,
    greens: s.greens,
    reds: s.reds,
    pendentes: s.pendings,
    voids: s.voids,
    lucro: s.totalLucro,
    unidades: s.totalUnidades,
    apostado: s.totalApostado,
    roi: s.roi,
    taxaAcerto: s.taxaAcerto,
    oddMedia: s.oddMediaGeral,
    somaOdds: s.somaOdds,
  };
}

/** ROI e taxa do período vêm da soma, nunca da média dos meses. */
function consolidar(meses: ResumoMes[]): ResumoMes {
  const somaLucro = meses.reduce((acc, m) => acc + m.lucro, 0);
  const somaApostado = meses.reduce((acc, m) => acc + m.apostado, 0);
  const somaGreens = meses.reduce((acc, m) => acc + m.greens, 0);
  const somaReds = meses.reduce((acc, m) => acc + m.reds, 0);
  const finalizadas = somaGreens + somaReds;
  const totalApostas = meses.reduce((acc, m) => acc + m.apostas, 0);
  const totalOdds = meses.reduce((acc, m) => acc + m.somaOdds, 0);

  return {
    aba: "Consolidado",
    ordem: 0,
    apostas: totalApostas,
    greens: somaGreens,
    reds: somaReds,
    pendentes: meses.reduce((acc, m) => acc + m.pendentes, 0),
    voids: meses.reduce((acc, m) => acc + m.voids, 0),
    lucro: parseFloat(somaLucro.toFixed(2)),
    unidades: reaisParaUnidades(somaLucro),
    apostado: parseFloat(somaApostado.toFixed(2)),
    roi:
      somaApostado > 0
        ? parseFloat(((somaLucro / somaApostado) * 100).toFixed(2))
        : 0,
    taxaAcerto:
      finalizadas > 0
        ? parseFloat(((somaGreens / finalizadas) * 100).toFixed(1))
        : 0,
    // Média ponderada pelo volume de cada mês, não média das médias
    oddMedia:
      totalApostas > 0 ? parseFloat((totalOdds / totalApostas).toFixed(2)) : 0,
    somaOdds: parseFloat(totalOdds.toFixed(2)),
  };
}

/**
 * Um resumo por aba mensal, para comparar meses lado a lado.
 * Devolve só agregados — o array de apostas fica de fora de propósito.
 */
export async function GET() {
  if (USANDO_MOCK) {
    const meses: ResumoMes[] = MOCK_RESUMO_MESES.map((m) => {
      const finalizadas = m.greens + m.reds;
      return {
        ...m,
        ordem: ordemDaAba(m.aba),
        unidades: reaisParaUnidades(m.lucro),
        roi: parseFloat(((m.lucro / m.apostado) * 100).toFixed(2)),
        somaOdds: parseFloat((m.oddMedia * m.apostas).toFixed(2)),
        taxaAcerto:
          finalizadas > 0
            ? parseFloat(((m.greens / finalizadas) * 100).toFixed(1))
            : 0,
      };
    }).sort((a, b) => b.ordem - a.ordem);

    return NextResponse.json({
      success: true,
      isMock: true,
      meses,
      consolidado: consolidar(meses),
    });
  }

  try {
    const tabs = (await getAvailableTabs()).filter(
      (t) => !t.toLowerCase().includes("resumo") && !t.toLowerCase().includes("config")
    );

    const porMes = await Promise.all(
      tabs.map(async (aba) => resumir(aba, await getBetsFromTab(aba)))
    );

    // Mais recente primeiro; abas fora do padrão mês+ano vão para o fim
    porMes.sort((a, b) => b.ordem - a.ordem);

    return NextResponse.json({
      success: true,
      isMock: false,
      meses: porMes,
      consolidado: consolidar(porMes),
    });
  } catch (error) {
    const mensagem =
      error instanceof Error ? error.message : "Erro desconhecido ao ler a planilha.";
    console.error("API /api/resumo falhou:", mensagem);
    return NextResponse.json(
      { success: false, isMock: false, error: mensagem },
      { status: 503 }
    );
  }
}
