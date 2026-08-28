"use client";

import { useState, useEffect, useMemo } from "react";
import { BetItem, BetResult } from "@/lib/types";
import { MOCK_BETS } from "@/lib/data";
import { SportBadge } from "@/components/SportBadge";
import { BookieBadge } from "@/components/BookieBadge";
import {
  Search,
  SlidersHorizontal,
  RefreshCw,
  LayoutGrid,
  List,
  Flame,
  TrendingUp,
  X,
  Copy,
  Check,
  Award,
  Layers,
  ArrowUpRight,
} from "lucide-react";

export default function ApostasPage() {
  const [bets, setBets] = useState<BetItem[]>(MOCK_BETS);
  const [tabs, setTabs] = useState<string[]>([
    "Agosto26",
    "Julho26",
    "Junho26",
    "Maio26",
    "Abril26",
  ]);
  const [activeTab, setActiveTab] = useState<string>("Agosto26");
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"TODAS" | BetResult>("TODAS");
  const [sportFilter, setSportFilter] = useState("TODOS");
  const [bookieFilter, setBookieFilter] = useState("TODAS");
  const [dayFilter, setDayFilter] = useState("TODOS");
  const [oddRangeFilter, setOddRangeFilter] = useState<"TODAS" | "BAIXA" | "MEDIA" | "ALTA">("TODAS");

  // View mode: 'cards' or 'table'
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Selected bet for detail drawer
  const [selectedBet, setSelectedBet] = useState<BetItem | null>(null);
  const [copied, setCopied] = useState(false);

  async function fetchBets(tabName: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/bets?tab=${encodeURIComponent(tabName)}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setBets(json.data);
        if (Array.isArray(json.tabs) && json.tabs.length > 0) {
          setTabs(json.tabs);
        }
      }
    } catch (err) {
      console.error("Failed to load real bets:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setDayFilter("TODOS");
    fetchBets(activeTab);
  }, [activeTab]);

  // Unique lists for select options
  const sports = useMemo(() => {
    return Array.from(new Set(bets.map((b) => b.esporte))).filter(Boolean);
  }, [bets]);

  const bookies = useMemo(() => {
    return Array.from(new Set(bets.map((b) => b.casa))).filter(Boolean);
  }, [bets]);

  const availableDays = useMemo(() => {
    const dates = Array.from(new Set(bets.map((b) => b.data))).filter((d) => d && d !== "—");
    dates.sort((a, b) => parseDateTimestamp(b) - parseDateTimestamp(a));
    return dates;
  }, [bets]);

  // Filtered bets
  const filteredBets = useMemo(() => {
    return bets.filter((bet) => {
      const matchesSearch =
        search === "" ||
        bet.partida.toLowerCase().includes(search.toLowerCase()) ||
        bet.tip.toLowerCase().includes(search.toLowerCase()) ||
        bet.casa.toLowerCase().includes(search.toLowerCase()) ||
        bet.tipster.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "TODAS" || bet.resultado === statusFilter;

      const matchesSport =
        sportFilter === "TODOS" || bet.esporte === sportFilter;

      const matchesBookie =
        bookieFilter === "TODAS" || bet.casa === bookieFilter;

      const matchesDay =
        dayFilter === "TODOS" || bet.data === dayFilter;

      let matchesOdd = true;
      if (oddRangeFilter === "BAIXA") {
        matchesOdd = bet.odd < 1.8;
      } else if (oddRangeFilter === "MEDIA") {
        matchesOdd = bet.odd >= 1.8 && bet.odd <= 3.0;
      } else if (oddRangeFilter === "ALTA") {
        matchesOdd = bet.odd > 3.0;
      }

      return matchesSearch && matchesStatus && matchesSport && matchesBookie && matchesOdd && matchesDay;
    });
  }, [bets, search, statusFilter, sportFilter, bookieFilter, dayFilter, oddRangeFilter]);

  // Aggregate stats from filtered list
  const totalProfit = useMemo(() => {
    return filteredBets.reduce((acc, b) => acc + b.lucro, 0);
  }, [filteredBets]);

  const greenCount = useMemo(() => {
    return filteredBets.filter((b) => b.resultado === "GREEN").length;
  }, [filteredBets]);

  const redCount = useMemo(() => {
    return filteredBets.filter((b) => b.resultado === "RED").length;
  }, [filteredBets]);

  const pendingCount = useMemo(() => {
    return filteredBets.filter((b) => b.resultado === "PENDENTE").length;
  }, [filteredBets]);

  const avgOdd = useMemo(() => {
    if (filteredBets.length === 0) return "0.00";
    const sum = filteredBets.reduce((acc, b) => acc + b.odd, 0);
    return (sum / filteredBets.length).toFixed(2);
  }, [filteredBets]);

  // Streak calculation (consecutive greens in latest finalized bets)
  const currentStreak = useMemo(() => {
    let streak = 0;
    const finalized = bets.filter((b) => b.resultado === "GREEN" || b.resultado === "RED");
    for (const b of finalized) {
      if (b.resultado === "GREEN") {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [bets]);

  // Top tipsters in current tab
  const topTipsters = useMemo(() => {
    const map = new Map<string, { total: number; greens: number; profit: number }>();
    bets.forEach((b) => {
      const cur = map.get(b.tipster) || { total: 0, greens: 0, profit: 0 };
      cur.total += 1;
      cur.profit += b.lucro;
      if (b.resultado === "GREEN") cur.greens += 1;
      map.set(b.tipster, cur);
    });

    return Array.from(map.entries())
      .map(([nome, data]) => ({
        nome,
        total: data.total,
        profit: data.profit,
        winRate: data.total > 0 ? Math.round((data.greens / data.total) * 100) : 0,
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 4);
  }, [bets]);

  // Top bookies in current tab
  const topBookies = useMemo(() => {
    const map = new Map<string, number>();
    bets.forEach((b) => {
      if (b.casa) {
        map.set(b.casa, (map.get(b.casa) || 0) + 1);
      }
    });
    const max = Math.max(...Array.from(map.values()), 1);
    return Array.from(map.entries())
      .map(([casa, count]) => ({
        casa,
        count,
        percent: Math.round((count / max) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [bets]);

  function parseDateTimestamp(dateStr: string): number {
    if (!dateStr || dateStr === "—") return 0;
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day).getTime();
      }
    }
    return 0;
  }

  // Group bets by Date, sorted descending (newest dates always at top)
  const groupedByDate = useMemo(() => {
    const map = new Map<string, BetItem[]>();
    filteredBets.forEach((bet) => {
      const list = map.get(bet.data) || [];
      list.push(bet);
      map.set(bet.data, list);
    });

    const entries = Array.from(map.entries());
    entries.sort((a, b) => parseDateTimestamp(b[0]) - parseDateTimestamp(a[0]));
    return entries;
  }, [filteredBets]);

  function handleCopyBet(bet: BetItem) {
    const text = `${bet.partida} - ${bet.tip} @${bet.odd.toFixed(2)} (${bet.casa})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl sm:text-4xl text-[#1A1715] tracking-tight">
              Feed de Apostas
            </h1>
            <span className="px-2.5 py-0.5 bg-[#2D8659]/10 text-[#2D8659] text-xs font-bold rounded-full">
              Live Sheets
            </span>
          </div>
          <p className="text-sm text-[#6B645A] mt-1 font-sans">
            Feed cronológico lido em tempo real da aba{" "}
            <span className="font-semibold text-[#1A1715]">{activeTab}</span>.
          </p>
        </div>

        {/* Tab / Month Selector & View Toggle */}
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

          {/* View Mode Toggle: Cards vs Table */}
          <div className="flex items-center bg-white border border-black/[0.12] rounded-full p-0.5 shadow-xs">
            <button
              onClick={() => setViewMode("cards")}
              title="Modo Cartões"
              className={`p-1.5 rounded-full transition-all ${
                viewMode === "cards"
                  ? "bg-[#1A1715] text-white"
                  : "text-[#6B645A] hover:text-[#1A1715]"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              title="Modo Tabela Compacta"
              className={`p-1.5 rounded-full transition-all ${
                viewMode === "table"
                  ? "bg-[#1A1715] text-white"
                  : "text-[#6B645A] hover:text-[#1A1715]"
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => fetchBets(activeTab)}
            disabled={loading}
            title="Recarregar dados da planilha"
            className="p-2 bg-white border border-black/[0.12] rounded-full text-[#6B645A] hover:text-[#1A1715] hover:border-black/30 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-black/[0.07] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-[#9E9689] uppercase tracking-wider">
            Lucro do Filtro
          </div>
          <div
            className={`font-mono text-xl sm:text-2xl font-bold mt-1 tracking-tight ${
              totalProfit >= 0 ? "text-[#2D8659]" : "text-[#C23B22]"
            }`}
          >
            {totalProfit >= 0 ? "+" : ""}R${" "}
            {totalProfit.toFixed(2).replace(".", ",")}
          </div>
        </div>

        <div className="bg-white border border-black/[0.07] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-[#9E9689] uppercase tracking-wider">
            Green / Red
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-[#1A1715] mt-1 tracking-tight">
            <span className="text-[#2D8659]">{greenCount}</span>{" "}
            <span className="text-[#9E9689] font-normal text-sm">/</span>{" "}
            <span className="text-[#C23B22]">{redCount}</span>
          </div>
        </div>

        <div className="bg-white border border-black/[0.07] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-[#9E9689] uppercase tracking-wider">
            Taxa Parcial
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-[#1A1715] mt-1 tracking-tight">
            {greenCount + redCount > 0
              ? `${((greenCount / (greenCount + redCount)) * 100).toFixed(1)}%`
              : "—"}
          </div>
        </div>

        <div className="bg-white border border-black/[0.07] rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-[#9E9689] uppercase tracking-wider">
            Odd Média
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-[#1A1715] mt-1 tracking-tight">
            {avgOdd.replace(".", ",")}
          </div>
        </div>
      </div>

      {/* Split Screen Grid (65% Feed + 35% Insights Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Main Column: Feed (7 of 12 cols = ~60-65%) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Toolbar & Filters */}
          <div className="bg-white border border-black/[0.07] rounded-2xl p-4 shadow-xs space-y-3">
            {/* Top row: Search and Status pills */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-[#9E9689] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar partida, mercado, casa, tipster..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#F7F5F0] border border-black/[0.06] rounded-full pl-9 pr-3.5 py-1.5 text-xs text-[#1A1715] placeholder:text-[#9E9689] outline-none focus:border-[#C7522A] transition-colors"
                />
              </div>

              {/* Status Pills */}
              <div className="flex items-center gap-1 flex-wrap">
                {(["TODAS", "GREEN", "RED", "PENDENTE"] as const).map((status) => {
                  const isActive = statusFilter === status;
                  return (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1.5 text-[11px] font-semibold rounded-full border transition-all ${
                        isActive
                          ? "bg-[#1A1715] text-white border-[#1A1715]"
                          : "bg-white text-[#6B645A] border-black/[0.08] hover:border-black/20 hover:text-[#1A1715]"
                      }`}
                    >
                      {status === "TODAS"
                        ? "Todas"
                        : status === "GREEN"
                        ? "Green"
                        : status === "RED"
                        ? "Red"
                        : "Pendente"}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom row: Secondary dropdowns & Odd ranges */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/[0.05]">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Day of Month Selector */}
                <select
                  value={dayFilter}
                  onChange={(e) => setDayFilter(e.target.value)}
                  className="bg-[#F7F5F0] border border-black/[0.06] rounded-full px-3 py-1 text-xs font-bold text-[#1A1715] outline-none cursor-pointer hover:border-black/20 transition-colors"
                >
                  <option value="TODOS">Todos os Dias ({bets.length})</option>
                  {availableDays.map((day) => {
                    const count = bets.filter((b) => b.data === day).length;
                    return (
                      <option key={day} value={day}>
                        Dia {day} ({count} {count === 1 ? "tip" : "tips"})
                      </option>
                    );
                  })}
                </select>

                <select
                  value={sportFilter}
                  onChange={(e) => setSportFilter(e.target.value)}
                  className="bg-[#F7F5F0] border border-black/[0.06] rounded-full px-3 py-1 text-xs font-semibold text-[#6B645A] outline-none cursor-pointer hover:border-black/20 transition-colors"
                >
                  <option value="TODOS">Todos os Esportes</option>
                  {sports.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <select
                  value={bookieFilter}
                  onChange={(e) => setBookieFilter(e.target.value)}
                  className="bg-[#F7F5F0] border border-black/[0.06] rounded-full px-3 py-1 text-xs font-semibold text-[#6B645A] outline-none cursor-pointer hover:border-black/20 transition-colors"
                >
                  <option value="TODAS">Todas as Casas</option>
                  {bookies.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Odd Range Filter Pills */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-medium text-[#9E9689] mr-1">
                  Odd:
                </span>
                {(
                  [
                    { label: "Todas", val: "TODAS" },
                    { label: "< 1.8", val: "BAIXA" },
                    { label: "1.8 - 3.0", val: "MEDIA" },
                    { label: "> 3.0", val: "ALTA" },
                  ] as const
                ).map((range) => (
                  <button
                    key={range.val}
                    onClick={() => setOddRangeFilter(range.val)}
                    className={`px-2 py-0.5 text-[10.5px] font-semibold rounded-full border transition-all ${
                      oddRangeFilter === range.val
                        ? "bg-[#C7522A] text-white border-[#C7522A]"
                        : "bg-white text-[#6B645A] border-black/[0.08] hover:border-black/20"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Feed Content */}
          {loading ? (
            <div className="bg-white border border-black/[0.07] rounded-2xl p-12 text-center text-[#9E9689]">
              <RefreshCw className="w-7 h-7 mx-auto mb-3 animate-spin text-[#C7522A]" />
              <p className="text-sm font-medium">
                Carregando apostas da aba {activeTab}...
              </p>
            </div>
          ) : groupedByDate.length === 0 ? (
            <div className="bg-white border border-black/[0.07] rounded-2xl p-12 text-center text-[#9E9689]">
              <SlidersHorizontal className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">
                Nenhuma aposta encontrada com os filtros selecionados.
              </p>
            </div>
          ) : viewMode === "cards" ? (
            /* Cards View (Redesigned 2-line harmonious cards) */
            <div className="space-y-6">
              {groupedByDate.map(([data, dayBets]) => {
                const dayProfit = dayBets.reduce((acc, b) => acc + b.lucro, 0);

                return (
                  <div key={data} className="space-y-2.5">
                    {/* Date Header */}
                    <div className="flex items-center gap-3 px-1">
                      <span className="text-xs font-bold text-[#1A1715] tracking-tight">
                        {data}
                      </span>
                      <span className="text-[11px] font-medium text-[#9E9689]">
                        ({dayBets.length} {dayBets.length === 1 ? "aposta" : "apostas"})
                      </span>
                      <div className="flex-1 h-px bg-black/[0.06]" />
                      <span
                        className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          dayProfit >= 0
                            ? "bg-[#2D8659]/[0.08] text-[#2D8659]"
                            : "bg-[#C23B22]/[0.08] text-[#C23B22]"
                        }`}
                      >
                        {dayProfit >= 0 ? "+" : ""}R${" "}
                        {dayProfit.toFixed(2).replace(".", ",")}
                      </span>
                    </div>

                    {/* Cards */}
                    <div className="space-y-2">
                      {dayBets.map((bet) => {
                        const isGreen = bet.resultado === "GREEN";
                        const isRed = bet.resultado === "RED";

                        return (
                          <div
                            key={bet.id}
                            onClick={() => setSelectedBet(bet)}
                            className="bg-white border border-black/[0.07] rounded-xl overflow-hidden shadow-xs hover:border-black/25 hover:shadow-card transition-all cursor-pointer grid grid-cols-[5px_1fr] group"
                          >
                            {/* Stripe */}
                            <div
                              className={`w-[5px] ${
                                isGreen
                                  ? "bg-[#2D8659]"
                                  : isRed
                                  ? "bg-[#C23B22]"
                                  : "bg-[#B8860B]"
                              }`}
                            />

                            <div className="p-3.5 sm:p-4 space-y-2">
                              {/* Line 1: Sport Badge + Match Name + Bookie Badge + Odd + Stake */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <SportBadge sport={bet.esporte} />
                                  <span className="text-[13.5px] font-bold text-[#1A1715] truncate tracking-tight group-hover:text-[#C7522A] transition-colors">
                                    {bet.partida}
                                  </span>
                                  <BookieBadge bookie={bet.casa} />
                                </div>

                                {/* Compact Odd & Stake Block */}
                                <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
                                  <span className="font-bold text-[#1A1715] bg-[#F7F5F0] px-2 py-0.5 rounded border border-black/[0.04]">
                                    @{bet.odd.toFixed(2).replace(".", ",")}
                                  </span>
                                  <span className="text-[#6B645A] font-medium hidden sm:inline-block">
                                    R$ {bet.valor.toFixed(2).replace(".", ",")}
                                  </span>
                                </div>
                              </div>

                              {/* Line 2: Tip/Market description + Tipster Badge + Status & Profit */}
                              <div className="flex items-center justify-between gap-3 pt-1 border-t border-black/[0.04]">
                                <div className="flex items-center gap-2 min-w-0 text-xs text-[#6B645A]">
                                  <span className="truncate font-medium">{bet.tip}</span>
                                  {bet.tipster && bet.tipster !== "Geral" && (
                                    <span className="shrink-0 text-[10px] text-[#9E9689] px-1.5 py-0.2 bg-[#F7F5F0] rounded">
                                      {bet.tipster}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                                      isGreen
                                        ? "bg-[#2D8659]/10 text-[#2D8659]"
                                        : isRed
                                        ? "bg-[#C23B22]/10 text-[#C23B22]"
                                        : "bg-[#B8860B]/10 text-[#B8860B]"
                                    }`}
                                  >
                                    {bet.resultado}
                                  </span>

                                  <span
                                    className={`font-mono text-xs font-bold min-w-[65px] text-right ${
                                      isGreen
                                        ? "text-[#2D8659]"
                                        : isRed
                                        ? "text-[#C23B22]"
                                        : "text-[#9E9689]"
                                    }`}
                                  >
                                    {isGreen
                                      ? `+R$ ${bet.lucro.toFixed(2).replace(".", ",")}`
                                      : isRed
                                      ? `-R$ ${Math.abs(bet.lucro).toFixed(2).replace(".", ",")}`
                                      : "—"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View (Compact Density) */
            <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] border-b border-black/[0.06] text-[#9E9689] uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-3">Esporte</th>
                      <th className="py-3 px-4">Partida / Mercado</th>
                      <th className="py-3 px-3">Casa</th>
                      <th className="py-3 px-3 text-right">Odd</th>
                      <th className="py-3 px-3 text-right">Valor</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Lucro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.05]">
                    {filteredBets.map((bet) => {
                      const isGreen = bet.resultado === "GREEN";
                      const isRed = bet.resultado === "RED";

                      return (
                        <tr
                          key={bet.id}
                          onClick={() => setSelectedBet(bet)}
                          className="hover:bg-[#FAF8F5] cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 px-4 font-mono text-[11px] text-[#6B645A] whitespace-nowrap">
                            {bet.data}
                          </td>
                          <td className="py-2.5 px-3">
                            <SportBadge sport={bet.esporte} />
                          </td>
                          <td className="py-2.5 px-4 max-w-xs truncate">
                            <div className="font-bold text-[#1A1715] truncate">
                              {bet.partida}
                            </div>
                            <div className="text-[11px] text-[#6B645A] truncate">
                              {bet.tip}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <BookieBadge bookie={bet.casa} />
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-right text-[#1A1715]">
                            {bet.odd.toFixed(2).replace(".", ",")}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-right text-[#6B645A]">
                            R$ {bet.valor.toFixed(2).replace(".", ",")}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                                isGreen
                                  ? "bg-[#2D8659]/10 text-[#2D8659]"
                                  : isRed
                                  ? "bg-[#C23B22]/10 text-[#C23B22]"
                                  : "bg-[#B8860B]/10 text-[#B8860B]"
                              }`}
                            >
                              {bet.resultado}
                            </span>
                          </td>
                          <td
                            className={`py-2.5 px-4 font-mono font-bold text-right whitespace-nowrap ${
                              isGreen
                                ? "text-[#2D8659]"
                                : isRed
                                ? "text-[#C23B22]"
                                : "text-[#9E9689]"
                            }`}
                          >
                            {isGreen
                              ? `+R$ ${bet.lucro.toFixed(2).replace(".", ",")}`
                              : isRed
                              ? `-R$ ${Math.abs(bet.lucro).toFixed(2).replace(".", ",")}`
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Insights Column (4 of 12 cols = ~35-40%) - Sticky */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
          {/* Card 1: Streak & Momentum */}
          <div className="bg-white border border-black/[0.07] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#9E9689]">
                Momento Atual
              </span>
              <Flame className="w-4 h-4 text-[#C7522A]" />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#C7522A]/10 text-[#C7522A] flex items-center justify-center font-bold text-base gap-1 shrink-0">
                <Flame className="w-5 h-5 text-[#C7522A]" strokeWidth={2} />
                <span className="font-mono text-lg">{currentStreak}</span>
              </div>
              <div>
                <div className="text-sm font-bold text-[#1A1715]">
                  {currentStreak > 0
                    ? `${currentStreak} Greens Consecutivos`
                    : "Em busca do próximo Green"}
                </div>
                <div className="text-xs text-[#6B645A]">
                  {pendingCount} apostas em andamento hoje
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Top Tipsters Ranking */}
          <div className="bg-white border border-black/[0.07] rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#9E9689]">
                Top Tipsters ({activeTab})
              </span>
              <Award className="w-4 h-4 text-[#2D8659]" />
            </div>

            <div className="divide-y divide-black/[0.05]">
              {topTipsters.map((tipster, i) => (
                <div key={tipster.nome} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#9E9689] w-4">
                      #{i + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-[#1A1715]">
                        {tipster.nome}
                      </div>
                      <div className="text-[10.5px] text-[#9E9689]">
                        {tipster.total} tips · {tipster.winRate}% win
                      </div>
                    </div>
                  </div>

                  <span
                    className={`font-mono text-xs font-bold ${
                      tipster.profit >= 0 ? "text-[#2D8659]" : "text-[#C23B22]"
                    }`}
                  >
                    {tipster.profit >= 0 ? "+" : ""}R${" "}
                    {tipster.profit.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Top Bookies Volume */}
          <div className="bg-white border border-black/[0.07] rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#9E9689]">
                Concentração por Casa
              </span>
              <Layers className="w-4 h-4 text-[#6B645A]" />
            </div>

            <div className="space-y-2.5">
              {topBookies.map((b) => (
                <div key={b.casa} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#1A1715]">{b.casa}</span>
                    <span className="font-mono text-[#6B645A] text-[11px]">
                      {b.count} tips
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#EFECE6] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#1A1715]"
                      style={{ width: `${b.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal / Drawer of Selected Bet Details */}
      {selectedBet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-black/[0.1] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                    selectedBet.resultado === "GREEN"
                      ? "bg-[#2D8659]/10 text-[#2D8659]"
                      : selectedBet.resultado === "RED"
                      ? "bg-[#C23B22]/10 text-[#C23B22]"
                      : "bg-[#B8860B]/10 text-[#B8860B]"
                  }`}
                >
                  {selectedBet.resultado}
                </span>
                <span className="text-xs text-[#9E9689] font-mono">
                  ID: {selectedBet.id}
                </span>
              </div>

              <button
                onClick={() => setSelectedBet(null)}
                className="p-1 rounded-full text-[#6B645A] hover:bg-[#EFECE6] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-semibold text-[#9E9689] uppercase tracking-wider">
                  Partida / Confronto
                </div>
                <div className="text-base font-bold text-[#1A1715] mt-0.5">
                  {selectedBet.partida}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-[#9E9689] uppercase tracking-wider">
                  Mercado / Tip
                </div>
                <div className="text-sm font-medium text-[#6B645A] mt-0.5 bg-[#FAF8F5] p-3 rounded-xl border border-black/[0.04]">
                  {selectedBet.tip}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[#F7F5F0] rounded-xl text-center">
                  <div className="text-[10px] uppercase tracking-wider text-[#9E9689] font-bold">
                    Odd
                  </div>
                  <div className="font-mono text-base font-bold text-[#1A1715] mt-0.5">
                    {selectedBet.odd.toFixed(2).replace(".", ",")}
                  </div>
                </div>

                <div className="p-3 bg-[#F7F5F0] rounded-xl text-center">
                  <div className="text-[10px] uppercase tracking-wider text-[#9E9689] font-bold">
                    Valor
                  </div>
                  <div className="font-mono text-base font-bold text-[#1A1715] mt-0.5">
                    R$ {selectedBet.valor.toFixed(2).replace(".", ",")}
                  </div>
                </div>

                <div className="p-3 bg-[#F7F5F0] rounded-xl text-center">
                  <div className="text-[10px] uppercase tracking-wider text-[#9E9689] font-bold">
                    Lucro / Perda
                  </div>
                  <div
                    className={`font-mono text-base font-bold mt-0.5 ${
                      selectedBet.lucro >= 0 ? "text-[#2D8659]" : "text-[#C23B22]"
                    }`}
                  >
                    {selectedBet.lucro >= 0 ? "+" : ""}R${" "}
                    {selectedBet.lucro.toFixed(2).replace(".", ",")}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-[#6B645A] pt-2 gap-2">
                <div className="flex items-center gap-2">
                  <span>Esporte:</span>
                  <SportBadge sport={selectedBet.esporte} />
                </div>
                <div className="flex items-center gap-2">
                  <span>Casa:</span>
                  <BookieBadge bookie={selectedBet.casa} />
                </div>
                <span>
                  Tipster: <strong className="text-[#1A1715]">{selectedBet.tipster}</strong>
                </span>
                <span>
                  Data: <strong className="text-[#1A1715]">{selectedBet.data}</strong>
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between">
              <button
                onClick={() => handleCopyBet(selectedBet)}
                className="px-4 py-2 bg-[#F7F5F0] text-[#1A1715] text-xs font-semibold rounded-full hover:bg-[#EFECE6] transition-all flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#2D8659]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copiado!" : "Copiar Tip"}</span>
              </button>

              <button
                onClick={() => setSelectedBet(null)}
                className="px-5 py-2 bg-[#1A1715] text-white text-xs font-semibold rounded-full hover:opacity-90 transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
