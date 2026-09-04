import { NextRequest, NextResponse } from "next/server";
import {
  getAvailableTabs,
  getBetsFromTab,
  computeStatsFromBets,
  USANDO_MOCK,
} from "@/lib/sheets";
import { abaDoMesAtual, abasRecentes } from "@/lib/constants";
import { MOCK_BETS } from "@/lib/data";

/**
 * Precisa bater com o revalidate da leitura da planilha em planilhaPublica.ts.
 * Estava em 15 enquanto a leitura ficava em cache por 60: três de cada quatro
 * revalidações refaziam o trabalho e devolviam exatamente o mesmo dado.
 *
 * O Next exige um literal aqui, então não dá para importar a constante — se
 * mudar um dos dois, mude o outro.
 */
export const revalidate = 60;

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
      lidoEm: new Date().toISOString(),
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
      // Quando o servidor montou esta resposta. Vale até o cache expirar, então
      // a tela arredonda para "agora" abaixo de um minuto e meio.
      lidoEm: new Date().toISOString(),
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
