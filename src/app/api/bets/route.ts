import { NextRequest, NextResponse } from "next/server";
import { getAvailableTabs, getBetsFromTab, computeStatsFromBets } from "@/lib/sheets";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "Agosto26";

    const [tabs, bets] = await Promise.all([
      getAvailableTabs(),
      getBetsFromTab(tab),
    ]);

    const stats = computeStatsFromBets(bets);

    return NextResponse.json({
      success: true,
      activeTab: tab,
      tabs,
      count: bets.length,
      stats,
      data: bets,
    });
  } catch (error) {
    console.error("API /api/bets error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bets from Google Sheets" },
      { status: 500 }
    );
  }
}
