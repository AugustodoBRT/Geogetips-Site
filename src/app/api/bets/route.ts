import { NextRequest, NextResponse } from "next/server";
import {
  getAvailableTabs,
  getBetsFromTab,
  computeStatsFromBets,
  USANDO_MOCK,
} from "@/lib/sheets";
import { abaDoMesAtual, abasRecentes } from "@/lib/constants";
import { MOCK_BETS } from "@/lib/data";

export const revalidate = 15;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") || abaDoMesAtual();
  // Tipsters e Estatísticas só precisam de stats — evita mandar o array inteiro
  const onlyStats = searchParams.get("only") === "stats";

  if (USANDO_MOCK) {
    const stats = computeStatsFromBets(MOCK_BETS);
    return NextResponse.json({
      success: true,
      isMock: true,
      activeTab: tab,
      tabs: abasRecentes(),
      count: MOCK_BETS.length,
      stats,
      data: onlyStats ? [] : MOCK_BETS,
    });
  }

  try {
    const [tabs, bets] = await Promise.all([
      getAvailableTabs(),
      getBetsFromTab(tab),
    ]);

    return NextResponse.json({
      success: true,
      isMock: false,
      activeTab: tab,
      tabs,
      count: bets.length,
      stats: computeStatsFromBets(bets),
      data: onlyStats ? [] : bets,
    });
  } catch (error) {
    const mensagem =
      error instanceof Error ? error.message : "Erro desconhecido ao ler a planilha.";
    console.error("API /api/bets falhou:", mensagem);

    // Falha vira falha. Dado inventado nunca é servido como se fosse real.
    return NextResponse.json(
      {
        success: false,
        isMock: false,
        activeTab: tab,
        error: mensagem,
      },
      { status: 503 }
    );
  }
}
