"use client";

import { useState, useEffect, useMemo } from "react";
import { SportBadge } from "@/components/SportBadge";
import { BookieBadge } from "@/components/BookieBadge";
import { BetItem } from "@/lib/types";
import {
  TrendingUp,
  Activity,
  Clock,
  Layers,
  RefreshCw,
  Award,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Link from "next/link";

interface DayPoint {
  date: string;
  timestamp: number;
  dayProfit: number;
  cumProfit: number;
  greens: number;
  reds: number;
  total: number;
}

export default function PainelPage() {
  const [period, setPeriod] = useState<"7D" | "30D" | "90D" | "120D" | "Tudo">("30D");
  const [tabs, setTabs] = useState<string[]>([
    "Agosto26",
    "Julho26",
    "Junho26",
    "Maio26",
    "Abril26",
  ]);
  const [activeTab, setActiveTab] = useState<string>("Agosto26");
  const [selectedDay, setSelectedDay] = useState<string>("TODOS");
  const [stats, setStats] = useState<any>(null);
  const [allBets, setAllBets] = useState<BetItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  // Dynamic period options: 30D, 90D, 120D, Tudo for all tabs; 7D, 30D, 90D, Tudo for single month
  const availablePeriods: readonly ("7D" | "30D" | "90D" | "120D" | "Tudo")[] = useMemo(() => {
    if (activeTab === "TODOS") {
      return ["30D", "90D", "120D", "Tudo"] as const;
    }
    return ["7D", "30D", "90D", "Tudo"] as const;
  }, [activeTab]);

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

  async function loadData(tab: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/bets?tab=${encodeURIComponent(tab)}`);
      const json = await res.json();
      if (json.success) {
        setStats(json.stats);
        if (Array.isArray(json.tabs)) setTabs(json.tabs);
        if (Array.isArray(json.data)) {
          setAllBets(json.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSelectedDay("TODOS");
    if (activeTab === "TODOS") {
      setPeriod("Tudo");
    } else {
      setPeriod("30D");
    }
    loadData(activeTab);
  }, [activeTab]);

  // Extract unique available days for the current tab
  const availableDays = useMemo(() => {
    const dates = Array.from(new Set(allBets.map((b) => b.data))).filter(
      (d) => d && d !== "—"
    );
    dates.sort((a, b) => parseDateTimestamp(b) - parseDateTimestamp(a));
    return dates;
  }, [allBets]);

  // Aggregate daily points in ascending chronological order (oldest to newest)
  const allDailyPoints: DayPoint[] = useMemo(() => {
    if (!allBets || allBets.length === 0) return [];

    const map = new Map<
      string,
      { timestamp: number; dayProfit: number; greens: number; reds: number; total: number }
    >();

    allBets.forEach((b) => {
      if (!b.data || b.data === "—") return;
      const ts = parseDateTimestamp(b.data);
      const current = map.get(b.data) || {
        timestamp: ts,
        dayProfit: 0,
        greens: 0,
        reds: 0,
        total: 0,
      };
      current.dayProfit += b.lucro;
      current.total += 1;
      if (b.resultado === "GREEN") current.greens += 1;
      if (b.resultado === "RED") current.reds += 1;
      map.set(b.data, current);
    });

    // Sort ascending by timestamp
    const sorted = Array.from(map.entries()).sort(
      (a, b) => a[1].timestamp - b[1].timestamp
    );

    let runningCum = 0;
    return sorted.map(([date, d]) => {
      runningCum += d.dayProfit;
      return {
        date,
        timestamp: d.timestamp,
        dayProfit: parseFloat(d.dayProfit.toFixed(2)),
        cumProfit: parseFloat(runningCum.toFixed(2)),
        greens: d.greens,
        reds: d.reds,
        total: d.total,
      };
    });
  }, [allBets]);

  // Filter points according to selected period (or if a specific day is selected, focus on it)
  const chartPoints = useMemo(() => {
    if (allDailyPoints.length === 0) return [];
    if (selectedDay !== "TODOS") {
      // Return up to the selected day
      const targetTs = parseDateTimestamp(selectedDay);
      const filtered = allDailyPoints.filter((p) => p.timestamp <= targetTs);
      return filtered.length > 0 ? filtered : allDailyPoints;
    }
    if (period === "7D") return allDailyPoints.slice(-7);
    if (period === "30D") return allDailyPoints.slice(-30);
    if (period === "90D") return allDailyPoints.slice(-90);
    if (period === "120D") return allDailyPoints.slice(-120);
    return allDailyPoints;
  }, [allDailyPoints, period, selectedDay]);

  // Calculate coordinates for SVG rendering
  const chartData = useMemo(() => {
    if (chartPoints.length === 0) return null;

    const padLeft = 65;
    const padRight = 25;
    const padTop = 25;
    const padBottom = 35;
    const width = 800;
    const height = 240;
    const drawW = width - padLeft - padRight;
    const drawH = height - padTop - padBottom;

    const profits = chartPoints.map((p) => p.cumProfit);
    const minVal = Math.min(0, ...profits);
    const maxVal = Math.max(100, ...profits);
    const range = maxVal - minVal || 1;
    const yMin = minVal - range * 0.05;
    const yMax = maxVal + range * 0.08;
    const yRange = yMax - yMin || 1;

    const points = chartPoints.map((p, i) => {
      const x = padLeft + (i / Math.max(chartPoints.length - 1, 1)) * drawW;
      const y = padTop + drawH - ((p.cumProfit - yMin) / yRange) * drawH;
      return { ...p, x, y };
    });

    const linePath = `M ${points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ")}`;
    const areaPath = `M ${points[0].x.toFixed(1)},${padTop + drawH} L ${points
      .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" L ")} L ${points[points.length - 1].x.toFixed(1)},${padTop + drawH} Z`;

    const zeroY = padTop + drawH - ((0 - yMin) / yRange) * drawH;

    // Period Gain
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const periodGain = lastPoint.cumProfit - (firstPoint.cumProfit - firstPoint.dayProfit);

    return {
      width,
      height,
      padLeft,
      padRight,
      padTop,
      padBottom,
      drawW,
      drawH,
      yMin,
      yMax,
      zeroY,
      points,
      linePath,
      areaPath,
      periodGain,
    };
  }, [chartPoints]);

  // Current scope bets (all bets in month or filtered by selectedDay)
  const scopedBets = useMemo(() => {
    if (selectedDay === "TODOS") return allBets;
    return allBets.filter((b) => b.data === selectedDay);
  }, [allBets, selectedDay]);

  const totalLucro = useMemo(() => {
    return scopedBets.reduce((acc, b) => acc + b.lucro, 0);
  }, [scopedBets]);

  const totalBets = scopedBets.length;
  const greens = scopedBets.filter((b) => b.resultado === "GREEN").length;
  const reds = scopedBets.filter((b) => b.resultado === "RED").length;
  const pendentes = scopedBets.filter((b) => b.resultado === "PENDENTE").length;
  const taxaAcerto =
    greens + reds > 0 ? Math.round((greens / (greens + reds)) * 100) : 0;

  const sports = stats?.sports ?? [];
  const tipsters = stats?.tipsters ?? [];
  const recentBets = scopedBets.slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header with Month & Day Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl sm:text-4xl text-[#1A1715] tracking-tight">
              Painel de Performance
            </h1>
            <span className="px-2.5 py-0.5 bg-[#2D8659]/10 text-[#2D8659] text-xs font-bold rounded-full">
              Live Data
            </span>
          </div>
          <p className="text-sm text-[#6B645A] mt-1 font-sans">
            Métricas consolidadas, evolução real da banca e atividades da aba{" "}
            <span className="font-semibold text-[#1A1715]">{activeTab}</span>
            {selectedDay !== "TODOS" && (
              <span> (Filtrado para o dia <strong>{selectedDay}</strong>)</span>
            )}.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Day of Month Selector */}
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="bg-white border border-black/[0.12] rounded-full px-4 py-2 text-xs font-bold text-[#1A1715] outline-none cursor-pointer shadow-xs hover:border-black/30 transition-all"
          >
            <option value="TODOS">Mês Completo ({allBets.length} tips)</option>
            {availableDays.map((day) => {
              const count = allBets.filter((b) => b.data === day).length;
              return (
                <option key={day} value={day}>
                  Dia {day} ({count} {count === 1 ? "tip" : "tips"})
                </option>
              );
            })}
          </select>

          {/* Month / Tab Selector */}
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
            onClick={() => loadData(activeTab)}
            disabled={loading}
            title="Recarregar dados"
            className="p-2 bg-white border border-black/[0.12] rounded-full text-[#6B645A] hover:text-[#1A1715] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 4 Wide KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-black/[0.07] rounded-2xl p-5 shadow-xs hover:border-black/20 transition-all space-y-3">
          <div className="flex items-center justify-between text-[#9E9689]">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {selectedDay === "TODOS" ? "Lucro Acumulado" : `Lucro em ${selectedDay}`}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#2D8659]/10 text-[#2D8659] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`font-serif text-3xl sm:text-4xl tracking-tight leading-none ${
              totalLucro >= 0 ? "text-[#2D8659]" : "text-[#C23B22]"
            }`}
          >
            {totalLucro >= 0 ? "+" : ""}R${" "}
            {totalLucro.toFixed(2).replace(".", ",")}
          </div>
          <div className="text-xs font-medium text-[#6B645A] pt-1 border-t border-black/[0.04]">
            {selectedDay === "TODOS"
              ? `Resultado total em ${activeTab}`
              : `Resultado obtido no dia ${selectedDay}`}
          </div>
        </div>

        <div className="bg-white border border-black/[0.07] rounded-2xl p-5 shadow-xs hover:border-black/20 transition-all space-y-3">
          <div className="flex items-center justify-between text-[#9E9689]">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Total de Apostas
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#1A1715]/5 text-[#1A1715] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-3xl sm:text-4xl text-[#1A1715] tracking-tight leading-none">
            {totalBets}
          </div>
          <div className="text-xs font-medium text-[#6B645A] pt-1 border-t border-black/[0.04]">
            {greens} Green · {reds} Red
          </div>
        </div>

        <div className="bg-white border border-black/[0.07] rounded-2xl p-5 shadow-xs hover:border-black/20 transition-all space-y-3">
          <div className="flex items-center justify-between text-[#9E9689]">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Taxa de Assertividade
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#2D8659]/10 text-[#2D8659] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-3xl sm:text-4xl text-[#1A1715] tracking-tight leading-none">
            {taxaAcerto}%
          </div>
          <div className="text-xs font-medium text-[#2D8659] pt-1 border-t border-black/[0.04]">
            Das apostas finalizadas
          </div>
        </div>

        <div className="bg-white border border-black/[0.07] rounded-2xl p-5 shadow-xs hover:border-black/20 transition-all space-y-3">
          <div className="flex items-center justify-between text-[#9E9689]">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Apostas Pendentes
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#B8860B]/10 text-[#B8860B] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-3xl sm:text-4xl text-[#B8860B] tracking-tight leading-none">
            {pendentes}
          </div>
          <div className="text-xs font-medium text-[#B8860B] pt-1 border-t border-black/[0.04]">
            Aguardando resultado oficial
          </div>
        </div>
      </div>

      {/* Middle Section: Real Dynamic Chart (8 cols) + Sport Breakdown (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Real Chart Box */}
        <div className="lg:col-span-8 bg-white border border-black/[0.07] rounded-2xl p-6 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-[#1A1715] tracking-tight">
                  Evolução da Banca ({activeTab === "TODOS" ? "Geral" : activeTab})
                </h2>
                {chartData && (
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
                      chartData.periodGain >= 0
                        ? "bg-[#2D8659]/10 text-[#2D8659]"
                        : "bg-[#C23B22]/10 text-[#C23B22]"
                    }`}
                  >
                    {chartData.periodGain >= 0 ? "+" : ""}R${" "}
                    {chartData.periodGain.toFixed(2).replace(".", ",")} ({period})
                  </span>
                )}
              </div>
              <p className="text-xs text-[#9E9689] mt-0.5">
                {hoveredPoint ? (
                  <span className="text-[#1A1715] font-medium">
                    Dia <strong>{hoveredPoint.date}</strong>: Acumulado{" "}
                    <strong className={hoveredPoint.cumProfit >= 0 ? "text-[#2D8659]" : "text-[#C23B22]"}>
                      {hoveredPoint.cumProfit >= 0 ? "+" : ""}R$ {hoveredPoint.cumProfit.toFixed(2).replace(".", ",")}
                    </strong>{" "}
                    ({hoveredPoint.dayProfit >= 0 ? "+" : ""}R$ {hoveredPoint.dayProfit.toFixed(2).replace(".", ",")} no dia · {hoveredPoint.total} tips)
                  </span>
                ) : (
                  "Curva real calculada a partir de cada palpite registrado"
                )}
              </p>
            </div>

            <div className="flex items-center gap-1 bg-[#F7F5F0] p-1 rounded-full border border-black/[0.06] shrink-0">
              {availablePeriods.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPeriod(p);
                    setSelectedDay("TODOS");
                    setHoveredPoint(null);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                    period === p && selectedDay === "TODOS"
                      ? "bg-white text-[#1A1715] shadow-xs font-bold"
                      : "text-[#6B645A] hover:text-[#1A1715]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Canvas Area */}
          <div className="h-56 sm:h-60 w-full relative">
            {!chartData || chartData.points.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-[#9E9689]">
                Carregando dados da curva da banca...
              </div>
            ) : (
              <svg
                viewBox={`0 0 ${chartData.width} ${chartData.height}`}
                className="w-full h-full cursor-crosshair overflow-visible select-none"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const mouseX = ((e.clientX - rect.left) / rect.width) * chartData.width;
                  let closest = chartData.points[0];
                  let minDiff = Infinity;
                  for (const p of chartData.points) {
                    const diff = Math.abs(p.x - mouseX);
                    if (diff < minDiff) {
                      minDiff = diff;
                      closest = p;
                    }
                  }
                  setHoveredPoint(closest);
                }}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <defs>
                  <linearGradient id="realChartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2D8659" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#2D8659" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid line: Max */}
                <line
                  x1={chartData.padLeft}
                  y1={chartData.padTop}
                  x2={chartData.width - chartData.padRight}
                  y2={chartData.padTop}
                  stroke="rgba(0,0,0,0.05)"
                  strokeDasharray="4 4"
                />
                <text
                  x={chartData.padLeft - 8}
                  y={chartData.padTop + 4}
                  textAnchor="end"
                  className="text-[9.5px] font-mono fill-[#9E9689]"
                >
                  R$ {chartData.yMax > 1000 ? `${(chartData.yMax / 1000).toFixed(1)}k` : chartData.yMax.toFixed(0)}
                </text>

                {/* Grid line: Zero Baseline */}
                {chartData.zeroY >= chartData.padTop &&
                  chartData.zeroY <= chartData.height - chartData.padBottom && (
                    <>
                      <line
                        x1={chartData.padLeft}
                        y1={chartData.zeroY}
                        x2={chartData.width - chartData.padRight}
                        y2={chartData.zeroY}
                        stroke="rgba(0,0,0,0.12)"
                        strokeWidth="1"
                      />
                      <text
                        x={chartData.padLeft - 8}
                        y={chartData.zeroY + 3.5}
                        textAnchor="end"
                        className="text-[9.5px] font-mono font-bold fill-[#9E9689]"
                      >
                        R$ 0
                      </text>
                    </>
                  )}

                {/* Grid line: Bottom */}
                <line
                  x1={chartData.padLeft}
                  y1={chartData.height - chartData.padBottom}
                  x2={chartData.width - chartData.padRight}
                  y2={chartData.height - chartData.padBottom}
                  stroke="rgba(0,0,0,0.05)"
                />

                {/* Gradient Area */}
                <path d={chartData.areaPath} fill="url(#realChartGrad)" />

                {/* Main Stroke Line */}
                <path
                  d={chartData.linePath}
                  fill="none"
                  stroke="#2D8659"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points on Line (Subtle dots) */}
                {chartData.points.map((p) => (
                  <circle
                    key={p.date}
                    cx={p.x}
                    cy={p.y}
                    r={chartData.points.length > 20 ? 1.5 : 3}
                    fill={p.cumProfit >= 0 ? "#2D8659" : "#C23B22"}
                    opacity={chartData.points.length > 20 ? 0.6 : 0.8}
                  />
                ))}

                {/* X-Axis Date Labels */}
                {chartData.points.length > 0 && (
                  <>
                    <text
                      x={chartData.points[0].x}
                      y={chartData.height - 12}
                      textAnchor="start"
                      className="text-[10px] font-mono fill-[#9E9689]"
                    >
                      {chartData.points[0].date}
                    </text>

                    {chartData.points.length > 2 && (
                      <text
                        x={chartData.points[Math.floor(chartData.points.length / 2)].x}
                        y={chartData.height - 12}
                        textAnchor="middle"
                        className="text-[10px] font-mono fill-[#9E9689]"
                      >
                        {chartData.points[Math.floor(chartData.points.length / 2)].date}
                      </text>
                    )}

                    <text
                      x={chartData.points[chartData.points.length - 1].x}
                      y={chartData.height - 12}
                      textAnchor="end"
                      className="text-[10px] font-mono fill-[#9E9689]"
                    >
                      {chartData.points[chartData.points.length - 1].date}
                    </text>
                  </>
                )}

                {/* Hover Interaction Guide */}
                {hoveredPoint && (
                  <>
                    {/* Vertical guide line */}
                    <line
                      x1={hoveredPoint.x}
                      y1={chartData.padTop}
                      x2={hoveredPoint.x}
                      y2={chartData.height - chartData.padBottom}
                      stroke="#1A1715"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                      opacity="0.35"
                    />

                    {/* Outer ring */}
                    <circle
                      cx={hoveredPoint.x}
                      cy={hoveredPoint.y}
                      r="7"
                      fill="none"
                      stroke="#2D8659"
                      strokeWidth="2"
                      opacity="0.4"
                    />

                    {/* Center dot */}
                    <circle
                      cx={hoveredPoint.x}
                      cy={hoveredPoint.y}
                      r="4"
                      fill="#2D8659"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                  </>
                )}
              </svg>
            )}
          </div>
        </div>

        {/* Breakdown by Sport */}
        <div className="lg:col-span-4 bg-white border border-black/[0.07] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base font-bold text-[#1A1715] tracking-tight mb-1">
              Lucro por Esporte
            </h2>
            <p className="text-xs text-[#9E9689] mb-3">
              Distribuição por modalidades cadastradas
            </p>

            <div className="divide-y divide-black/[0.05] max-h-[220px] overflow-y-auto pr-1">
              {sports.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#9E9689]">
                  Carregando modalidades...
                </div>
              ) : (
                sports.map((sport: any) => (
                  <div
                    key={sport.esporte}
                    className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <SportBadge sport={sport.esporte} />
                      <div className="text-[11px] text-[#9E9689]">
                        {sport.apostas} tips · {sport.taxaAcerto}% acerto
                      </div>
                    </div>
                    <div
                      className={`font-mono text-xs font-bold ${
                        sport.lucro >= 0 ? "text-[#2D8659]" : "text-[#C23B22]"
                      }`}
                    >
                      {sport.lucro >= 0 ? "+" : ""}R${" "}
                      {sport.lucro.toFixed(2).replace(".", ",")}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link
            href="/estatisticas"
            className="w-full py-2 bg-[#F7F5F0] hover:bg-[#EFECE6] text-[#1A1715] text-xs font-semibold rounded-xl text-center transition-colors flex items-center justify-center gap-1"
          >
            <span>Ver Estatísticas Completas</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Bottom Section: Recent Activity Stream (6 cols) + Top Tipsters Leaderboard (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Bets Stream */}
        <div className="lg:col-span-7 bg-white border border-black/[0.07] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1A1715] tracking-tight">
                Últimas Apostas Registradas
              </h2>
              <p className="text-xs text-[#9E9689]">
                {selectedDay === "TODOS"
                  ? "Atividade recente capturada do bot"
                  : `Apostas cadastradas no dia ${selectedDay}`}
              </p>
            </div>

            <Link
              href="/apostas"
              className="text-xs font-bold text-[#C7522A] hover:underline flex items-center gap-1"
            >
              <span>Ver todas</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {recentBets.map((bet) => {
              const isGreen = bet.resultado === "GREEN";
              const isRed = bet.resultado === "RED";

              return (
                <div
                  key={bet.id}
                  className="p-3 bg-[#FAF8F5] rounded-xl border border-black/[0.04] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <SportBadge sport={bet.esporte} />
                    <div className="min-w-0">
                      <div className="font-bold text-[#1A1715] truncate">
                        {bet.partida}
                      </div>
                      <div className="text-[11px] text-[#6B645A] truncate flex items-center gap-1.5 mt-0.5">
                        <span>{bet.tip}</span>
                        <span>·</span>
                        <strong className="font-mono">@{bet.odd}</strong>
                        {bet.casa && <BookieBadge bookie={bet.casa} className="scale-90 origin-left" />}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                      className={`font-mono font-bold text-xs ${
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
              );
            })}
          </div>
        </div>

        {/* Top Tipsters Box */}
        <div className="lg:col-span-5 bg-white border border-black/[0.07] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1A1715] tracking-tight">
                Ranking de Tipsters ({activeTab})
              </h2>
              <p className="text-xs text-[#9E9689]">
                Quem mais gerou retorno na aba ativa
              </p>
            </div>

            <Link
              href="/tipsters"
              className="text-xs font-bold text-[#C7522A] hover:underline flex items-center gap-1"
            >
              <span>Detalhes</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {tipsters.slice(0, 4).map((t: any, idx: number) => (
              <div
                key={t.nome}
                className="p-3.5 bg-[#FAF8F5] rounded-xl border border-black/[0.04] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-[#9E9689] w-4">
                    #{idx + 1}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.avatarColor} text-white font-bold text-xs flex items-center justify-center`}
                  >
                    {t.initial}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1A1715]">
                      {t.nome}
                    </div>
                    <div className="text-[10.5px] text-[#9E9689]">
                      {t.totalApostas} tips · {t.taxaAcerto}% acerto
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-mono text-xs font-bold ${
                      t.lucroUnidades >= 0 ? "text-[#2D8659]" : "text-[#C23B22]"
                    }`}
                  >
                    {t.lucroUnidades >= 0 ? "+" : ""}
                    {t.lucroUnidades}u
                  </div>
                  <div className="text-[10px] text-[#9E9689] uppercase tracking-wider">
                    Unidades
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
