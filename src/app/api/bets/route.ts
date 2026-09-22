import { type NextRequest, NextResponse } from "next/server";
import {
  getAvailableTabs,
  getBetsFromTab,
  computeStatsFromBets,
  gruposDisponiveis,
  USANDO_MOCK,
} from "@/lib/sheets";
import { ABA_TODOS, abaDoMesAtual, abaValida, abasRecentes } from "@/lib/constants";
import { apostasDemonstracaoSigma, MOCK_BETS } from "@/lib/data";
import { aplicarAtraso, GRUPO_PADRAO } from "@/lib/grupos";

/**
 * Declarado por consistência, mas SEM efeito prático nesta rota: ela lê
 * searchParams de request.url, o que a torna dinâmica, e rota dinâmica não é
 * cacheada pelo segmento. O build confirma — /api/bets sai como ƒ (Dynamic)
 * com a coluna Revalidate vazia, enquanto /api/resumo sai como ○ com 1m.
 *
 * Quem realmente controla a frescura é o `next: { revalidate: 60 }` da leitura
 * da planilha em planilhaPublica.ts. Ao mudar um, mude o outro — o Next exige
 * literal aqui, então não dá para os dois saírem de uma constante só.
 */
export const revalidate = 60;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") || abaDoMesAtual();
  // Tipsters e Estatísticas só precisam de stats — evita mandar o array inteiro
  const onlyStats = searchParams.get("only") === "stats";

  // O grupo (#72). Só entram os que têm planilha: pedir o Sigma antes de ele
  // existir responde 404, e nunca os dados do gratuito com o nome do outro.
  const disponiveis = gruposDisponiveis();
  const idPedido = searchParams.get("grupo") || GRUPO_PADRAO;
  const grupo = disponiveis.find((g) => g.id === idPedido);
  if (!grupo) {
    return NextResponse.json(
      {
        success: false,
        isMock: false,
        activeTab: tab,
        error: `Grupo indisponível: "${idPedido}".`,
        grupoIndisponivel: true,
      },
      { status: 404 }
    );
  }
  // O que a resposta diz sobre os grupos: quais existem e qual veio.
  const sobreGrupos = { grupo: grupo.id, grupos: disponiveis };

  // Só o agregado ou um mês no padrão da planilha. Sem esta checagem qualquer
  // nome chegava ao gviz, que não erra em aba inexistente — devolve a primeira
  // aba. `?tab=Xyz` respondia 200 com os dados de Setembro26 rotulados como
  // "Xyz", e cada nome inventado abria uma entrada de cache e uma chamada ao
  // Google.
  if (!abaValida(tab)) {
    return NextResponse.json(
      { success: false, isMock: false, activeTab: tab, error: `Aba inválida: "${tab}".` },
      { status: 400 }
    );
  }

  if (USANDO_MOCK) {
    const bets = aplicarAtraso(
      grupo.id === "sigma" ? apostasDemonstracaoSigma() : MOCK_BETS,
      grupo.atrasoDias
    );
    return NextResponse.json({
      success: true,
      isMock: true,
      activeTab: tab,
      tabs: abasRecentes(),
      ...sobreGrupos,
      count: bets.length,
      stats: computeStatsFromBets(bets),
      lidoEm: new Date().toISOString(),
      data: onlyStats ? [] : bets,
    });
  }

  try {
    const tabs = await getAvailableTabs(grupo.id);
    let abaServida = tab;

    if (tab !== ABA_TODOS && !tabs.includes(tab)) {
      // A aba do mês só nasce quando o bot registra a primeira aposta. Nos
      // primeiros dias de cada mês o site inteiro abria em erro; agora mostra
      // o último mês com dados, e o activeTab da resposta diz qual é.
      if (tab === abaDoMesAtual() && tabs.length > 0) {
        abaServida = tabs[0];
      } else {
        return NextResponse.json(
          {
            success: false,
            isMock: false,
            activeTab: tab,
            error: `A aba "${tab}" não existe na planilha.`,
          },
          { status: 404 }
        );
      }
    }

    // O atraso sai aqui, no servidor, antes de qualquer conta: nem as apostas
    // nem os totais do grupo pago podem contar o que ainda está dentro dele.
    const bets = aplicarAtraso(
      await getBetsFromTab(abaServida, grupo.id),
      grupo.atrasoDias
    );

    return NextResponse.json({
      success: true,
      isMock: false,
      activeTab: abaServida,
      tabs,
      ...sobreGrupos,
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
