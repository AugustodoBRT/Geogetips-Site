"use client";

import { useState, useEffect } from "react";
import { SportBadge } from "@/components/SportBadge";
import { BookieBadge } from "@/components/BookieBadge";
import { PieChart, BarChart2, Hash, Layers, RefreshCw, TrendingUp, Percent } from "lucide-react";

export default function EstatisticasPage() {
  const [tabs, setTabs] = useState<string[]>([
    "Agosto26",
    "Julho26",
    "Junho26",
    "Maio26",
    "Abril26",
  ]);
  const [activeTab, setActiveTab] = useState<string>("Agosto26");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  async function loadStats(tab: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/bets?tab=${encodeURIComponent(tab)}`);
      const json = await res.json();
      if (json.success) {
        setStats(json.stats);
        if (Array.isArray(json.tabs)) setTabs(json.tabs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats(activeTab);
  }, [activeTab]);

  const totalBets = stats?.totalBets || 1;
  const greens = stats?.greens || 0;
  const reds = stats?.reds || 0;
  const pendings = stats?.pendings || 0;

  const greenPct = Math.round((greens / totalBets) * 100);
  const redPct = Math.round((reds / totalBets) * 100);
  const pendingPct = Math.round((pendings / totalBets) * 100);

  const sports = stats?.sports || [];
  const bookies = stats?.bookies || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header with Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl sm:text-4xl text-[#1A1715] tracking-tight">
              Estatísticas & Padrões
            </h1>
            <span className="px-2.5 py-0.5 bg-[#2D8659]/10 text-[#2D8659] text-xs font-bold rounded-full">
              Analytics
            </span>
          </div>
          <p className="text-sm text-[#6B645A] mt-1 font-sans">
            Distribuição de resultados, médias de odds e concentração por casa na aba{" "}
            <span className="font-semibold text-[#1A1715]">{activeTab}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="bg-white border border-black/[0.12] rounded-full px-4 py-2 text-xs font-bold text-[#1A1715] outline-none cursor-pointer shadow-xs hover:border-black/30 transition-all"
          >
            <option value="TODOS">Todos os Meses (Geral)</option>
            {tabs.map((tab) => (
              <option key={tab} value={tab}>
                Aba: {tab}
              </option>
            ))}
          </select>

          <button
            onClick={() => loadStats(activeTab)}
            disabled={loading}
            title="Recarregar"
            className="p-2 bg-white border border-black/[0.12] rounded-full text-[#6B645A] hover:text-[#1A1715] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Top 2 Analytics Cards: Donut + Odds Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Distribution Donut Card (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-black/[0.07] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1A1715] tracking-tight">
                Distribuição de Resultados ({activeTab})
              </h2>
              <p className="text-xs text-[#9E9689]">
                Proporção entre Green, Red e Pendentes
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#2D8659]/10 text-[#2D8659] flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-2">
            <div className="w-40 h-40 relative">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke="#EFECE6"
                  strokeWidth="12"
                />
                {/* Green */}
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke="#2D8659"
                  strokeWidth="12"
                  strokeDasharray={`${(greens / totalBets) * 301.6} 301.6`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
                {/* Red */}
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke="#C23B22"
                  strokeWidth="12"
                  strokeDasharray={`${(reds / totalBets) * 301.6} 301.6`}
                  strokeDashoffset={`-${(greens / totalBets) * 301.6}`}
                  strokeLinecap="round"
                />
                {/* Pending */}
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke="#B8860B"
                  strokeWidth="12"
                  strokeDasharray={`${(pendings / totalBets) * 301.6} 301.6`}
                  strokeDashoffset={`-${((greens + reds) / totalBets) * 301.6}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-serif text-3xl text-[#1A1715] tracking-tight leading-none">
                  {stats?.totalBets ?? 0}
                </span>
                <span className="text-[10.5px] uppercase tracking-wider text-[#9E9689] font-bold mt-1">
                  Apostas
                </span>
              </div>
            </div>

            <div className="space-y-3 w-full sm:w-auto">
              <div className="p-3 bg-[#2D8659]/[0.06] rounded-xl border border-[#2D8659]/15 flex items-center justify-between gap-6">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1A1715]">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#2D8659]" />
                  <span>Green (Vitórias)</span>
                </div>
                <span className="font-mono font-bold text-xs text-[#2D8659]">
                  {greens} ({greenPct}%)
                </span>
              </div>

              <div className="p-3 bg-[#C23B22]/[0.06] rounded-xl border border-[#C23B22]/15 flex items-center justify-between gap-6">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1A1715]">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#C23B22]" />
                  <span>Red (Perdas)</span>
                </div>
                <span className="font-mono font-bold text-xs text-[#C23B22]">
                  {reds} ({redPct}%)
                </span>
              </div>

              <div className="p-3 bg-[#B8860B]/[0.06] rounded-xl border border-[#B8860B]/15 flex items-center justify-between gap-6">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1A1715]">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#B8860B]" />
                  <span>Pendente</span>
                </div>
                <span className="font-mono font-bold text-xs text-[#B8860B]">
                  {pendings} ({pendingPct}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Odds Comparison Stack (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-black/[0.07] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1A1715] tracking-tight">
                Médias de Odd ({activeTab})
              </h2>
              <p className="text-xs text-[#9E9689]">
                Comparativo entre apostas ganhas e perdidas
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#1A1715]/5 text-[#1A1715] flex items-center justify-center">
              <Hash className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-[#2D8659]/[0.06] rounded-xl border border-[#2D8659]/15 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#2D8659]">
                  Apostas com GREEN
                </div>
                <div className="text-[11px] text-[#9E9689] mt-0.5 font-medium">
                  {greens} tips acertadas
                </div>
              </div>
              <div className="font-mono text-2xl font-bold text-[#2D8659]">
                1,82
              </div>
            </div>

            <div className="p-4 bg-[#C23B22]/[0.06] rounded-xl border border-[#C23B22]/15 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#C23B22]">
                  Apostas com RED
                </div>
                <div className="text-[11px] text-[#9E9689] mt-0.5 font-medium">
                  {reds} tips perdidas
                </div>
              </div>
              <div className="font-mono text-2xl font-bold text-[#C23B22]">
                2,35
              </div>
            </div>

            <div className="p-4 bg-[#C7522A]/[0.06] rounded-xl border border-[#C7522A]/15 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#C7522A]">
                  Média Geral
                </div>
                <div className="text-[11px] text-[#9E9689] mt-0.5 font-medium">
                  {stats?.totalBets ?? 0} tips no total
                </div>
              </div>
              <div className="font-mono text-2xl font-bold text-[#C7522A]">
                1,98
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 2 Cards: Sports Breakdown + Bookies Volume */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lucro por Esporte Bars */}
        <div className="bg-white border border-black/[0.07] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1A1715] tracking-tight">
                Lucro por Modalidade Esportiva
              </h2>
              <p className="text-xs text-[#9E9689]">
                Rentabilidade por esporte na aba {activeTab}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#C7522A]/10 text-[#C7522A] flex items-center justify-center">
              <BarChart2 className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-4">
            {sports.length === 0 ? (
              <p className="text-xs text-[#9E9689]">Sem dados de categoria na aba.</p>
            ) : (
              sports.map((sport: any) => (
                <div key={sport.esporte} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <SportBadge sport={sport.esporte} />
                    <span
                      className={`font-mono ${
                        sport.lucro >= 0 ? "text-[#2D8659]" : "text-[#C23B22]"
                      }`}
                    >
                      {sport.lucro >= 0 ? "+" : ""}R${" "}
                      {sport.lucro.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                  <div className="h-2 bg-[#EFECE6] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#C7522A]"
                      style={{
                        width: `${Math.min(Math.max((sport.lucro / 600) * 100, 5), 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Casas Bars */}
        <div className="bg-white border border-black/[0.07] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1A1715] tracking-tight">
                Top Casas de Apostas
              </h2>
              <p className="text-xs text-[#9E9689]">
                Volume de palpites por plataforma cadastrada
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#1A1715]/5 text-[#1A1715] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-3.5">
            {bookies.length === 0 ? (
              <p className="text-xs text-[#9E9689]">Sem dados de casas na aba.</p>
            ) : (
              bookies.map((b: any) => (
                <div key={b.casa} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <BookieBadge bookie={b.casa} />
                    <span className="font-mono text-[#6B645A] text-xs">
                      {b.apostas} apostas
                    </span>
                  </div>
                  <div className="h-2 bg-[#EFECE6] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#1A1715]"
                      style={{ width: `${b.percentual}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
