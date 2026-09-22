import { type NextRequest, NextResponse } from "next/server";
import {
  getAvailableTabs,
  getBetsFromTab,
  gruposDisponiveis,
  USANDO_MOCK,
} from "@/lib/sheets";
import { computeStatsFromBets } from "@/lib/stats";
import { apostasDemonstracaoSigma, MOCK_RESUMO_MESES } from "@/lib/data";
import { abaDoMesAtual, ordemDaAba, reaisParaUnidades } from "@/lib/constants";
import { aplicarAtraso, GRUPO_PADRAO } from "@/lib/grupos";
import type { BetItem } from "@/lib/types";

/**
 * Com o grupo no endereço (#72), a rota passou a ler `request` e virou
 * dinâmica, como a /api/bets: este valor fica pela consistência. A frescura
 * de verdade vem da leitura da planilha, que se revalida sozinha.
 */
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

function resumir(
  aba: string,
  bets: Parameters<typeof computeStatsFromBets>[0]
): ResumoMes {
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
    roi: somaApostado > 0 ? parseFloat(((somaLucro / somaApostado) * 100).toFixed(2)) : 0,
    taxaAcerto:
      finalizadas > 0 ? parseFloat(((somaGreens / finalizadas) * 100).toFixed(1)) : 0,
    // Média ponderada pelo volume de cada mês, não média das médias
    oddMedia: totalApostas > 0 ? parseFloat((totalOdds / totalApostas).toFixed(2)) : 0,
    somaOdds: parseFloat(totalOdds.toFixed(2)),
  };
}

/** As apostas agrupadas pela aba do mês da data delas, para o demonstrativo do Sigma. */
function porAbaDoMes(bets: readonly BetItem[]): Map<string, BetItem[]> {
  const abas = new Map<string, BetItem[]>();
  for (const b of bets) {
    const [, mes, ano] = b.data.split("/").map(Number);
    const aba = abaDoMesAtual(new Date(ano, mes - 1, 15));
    abas.set(aba, [...(abas.get(aba) ?? []), b]);
  }
  return abas;
}

/**
 * Um resumo por aba mensal, para comparar meses lado a lado.
 * Devolve só agregados — o array de apostas fica de fora de propósito.
 *
 * Cada grupo tem o seu (`?grupo=sigma`), com o atraso público aplicado antes
 * da soma: o mês corrente do grupo pago não pode contar as apostas que ainda
 * não apareceram no resto do site.
 */
export async function GET(request: NextRequest) {
  const idPedido = new URL(request.url).searchParams.get("grupo") || GRUPO_PADRAO;
  const grupo = gruposDisponiveis().find((g) => g.id === idPedido);
  if (!grupo) {
    return NextResponse.json(
      {
        success: false,
        isMock: false,
        error: `Grupo indisponível: "${idPedido}".`,
        grupoIndisponivel: true,
      },
      { status: 404 }
    );
  }

  const sobreGrupos = { grupo: grupo.id, grupos: gruposDisponiveis() };

  if (USANDO_MOCK && grupo.id === "sigma") {
    const visiveis = aplicarAtraso(apostasDemonstracaoSigma(), grupo.atrasoDias);
    const meses = Array.from(porAbaDoMes(visiveis))
      .map(([aba, bets]) => resumir(aba, bets))
      .sort((a, b) => b.ordem - a.ordem);
    return NextResponse.json({
      success: true,
      isMock: true,
      ...sobreGrupos,
      meses,
      consolidado: consolidar(meses),
    });
  }

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
          finalizadas > 0 ? parseFloat(((m.greens / finalizadas) * 100).toFixed(1)) : 0,
      };
    }).sort((a, b) => b.ordem - a.ordem);

    return NextResponse.json({
      success: true,
      isMock: true,
      ...sobreGrupos,
      meses,
      consolidado: consolidar(meses),
    });
  }

  try {
    const tabs = (await getAvailableTabs(grupo.id)).filter(
      (t) => !t.toLowerCase().includes("resumo") && !t.toLowerCase().includes("config")
    );

    const porMes = await Promise.all(
      tabs.map(async (aba) =>
        resumir(aba, aplicarAtraso(await getBetsFromTab(aba, grupo.id), grupo.atrasoDias))
      )
    );

    // Mais recente primeiro; abas fora do padrão mês+ano vão para o fim
    porMes.sort((a, b) => b.ordem - a.ordem);

    return NextResponse.json({
      success: true,
      isMock: false,
      ...sobreGrupos,
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
