"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { SportBadge } from "@/components/SportBadge";
import { BookieBadge } from "@/components/BookieBadge";
import { SeletorAba } from "@/components/SeletorAba";
import { AvisoErro, AvisoMock } from "@/components/AvisoDados";
import { SkeletonKpis, SkeletonLinhas } from "@/components/Skeleton";
import { useBets } from "@/hooks/useBets";
import { SecaoTelegram } from "@/components/Telegram";
import { LinkPlanilha } from "@/components/LinkPlanilha";
import { useUnidade } from "@/hooks/useUnidade";
import { SeletorUnidade } from "@/components/SeletorUnidade";
import { parseDateTimestamp } from "@/lib/date";
import { ABA_TODOS } from "@/lib/constants";
import {
  formatarOdd,
  formatarReais,
  formatarReaisComSinal,
  formatarUnidades,
  tamanhoDoValor,
} from "@/lib/format";
import { calcularRoi, taxaDeAcerto } from "@/lib/stats";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Layers,
  Percent,
  ArrowUpRight,
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

/** Quantos dias de calendário cada intervalo cobre. `Tudo` não tem limite. */
const DIAS_DO_PERIODO = {
  "7D": 7,
  "30D": 30,
  "90D": 90,
  "120D": 120,
  Tudo: null,
} as const;

export default function PainelPage() {
  const {
    bets: allBets,
    stats,
    tabs,
    activeTab,
    setActiveTab,
    loading,
    erro,
    isMock,
    recarregar,
  } = useBets();

  const { converter } = useUnidade();

  const [period, setPeriod] = useState<"7D" | "30D" | "90D" | "120D" | "Tudo">("30D");
  const [selectedDay, setSelectedDay] = useState<string>("TODOS");
  const [hoveredPoint, setHoveredPoint] = useState<(DayPoint & { x: number; y: number }) | null>(
    null
  );

  // Todas as abas cobrem período maior, então a janela padrão muda junto
  const availablePeriods: readonly ("7D" | "30D" | "90D" | "120D" | "Tudo")[] = useMemo(
    () =>
      activeTab === ABA_TODOS
        ? (["30D", "90D", "120D", "Tudo"] as const)
        : (["7D", "30D", "90D", "Tudo"] as const),
    [activeTab]
  );

  useEffect(() => {
    setSelectedDay("TODOS");
    setHoveredPoint(null);
    setPeriod(activeTab === ABA_TODOS ? "Tudo" : "30D");
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
      current.dayProfit += converter(b.lucro);
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
  }, [allBets, converter]);

  // Filter points according to selected period (or if a specific day is selected, focus on it)
  const chartPoints = useMemo(() => {
    if (allDailyPoints.length === 0) return [];
    if (selectedDay !== "TODOS") {
      // Return up to the selected day
      const targetTs = parseDateTimestamp(selectedDay);
      const filtered = allDailyPoints.filter((p) => p.timestamp <= targetTs);
      return filtered.length > 0 ? filtered : allDailyPoints;
    }
    // A planilha traz apostas pendentes de jogos que ainda vão acontecer. Elas
    // não podem entrar na curva: têm lucro 0 e desenhariam uma reta plana no
    // futuro, como se a banca tivesse parado de crescer.
    const fimDeHoje = new Date();
    fimDeHoje.setHours(23, 59, 59, 999);
    const ateHoje = allDailyPoints.filter((p) => p.timestamp <= fimDeHoje.getTime());

    const dias = DIAS_DO_PERIODO[period];
    if (dias === null || ateHoje.length === 0) return ateHoje;

    // A janela termina hoje — mas numa aba de mês passado "hoje" está fora dos
    // dados e o gráfico ficaria vazio, então ela para no último dia da aba.
    const fim = Math.min(fimDeHoje.getTime(), ateHoje[ateHoje.length - 1].timestamp);

    // Janela de calendário, não os N últimos registros: slice(-7) pegava os 7
    // últimos dias COM aposta, que em período parado alcançava semanas atrás
    // e, com pendentes no futuro, empurrava a janela para frente escondendo
    // dias que de fato aconteceram.
    const inicio = new Date(fim);
    inicio.setDate(inicio.getDate() - (dias - 1));
    inicio.setHours(0, 0, 0, 0);
    return ateHoje.filter((p) => p.timestamp >= inicio.getTime() && p.timestamp <= fim);
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
    // O piso evita que o eixo degenere quando o lucro é pequeno, mas precisa
    // acompanhar a unidade do visitante: em unidade de R$ 5 os valores caem
    // 20x e um piso fixo de R$ 100 achatava a curva inteira.
    const maxVal = Math.max(converter(100), ...profits);
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

    // Onde o zero cai dentro da área de desenho, em 0..1. É o ponto de corte do
    // gradiente que pinta a curva de verde acima e vermelho abaixo.
    const pctZero = Math.min(1, Math.max(0, (zeroY - padTop) / drawH));

    // Period Gain
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const periodGain = lastPoint.cumProfit - (firstPoint.cumProfit - firstPoint.dayProfit);

    // Maior queda de um pico até o vale seguinte. É a métrica de risco que
    // falta quando só se olha lucro e ROI: diz quanto a banca chegou a
    // devolver antes de recuperar.
    let pico = -Infinity;
    let drawdown = 0;
    for (const ponto of points) {
      if (ponto.cumProfit > pico) pico = ponto.cumProfit;
      const queda = pico - ponto.cumProfit;
      if (queda > drawdown) drawdown = queda;
    }

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
      pctZero,
      drawdown,
    };
  }, [chartPoints, converter]);

  // Re-triggers the draw-in animation only when the dataset itself changes
  // Inclui as pontas da janela: dois períodos podem ter a mesma quantidade de
  // pontos e, só pelo comprimento, a animação de entrada não re-disparava.
  const chartKey = `${activeTab}-${period}-${selectedDay}-${chartPoints.length}-${
    chartPoints[0]?.date ?? ""
  }-${chartPoints[chartPoints.length - 1]?.date ?? ""}`;

  /**
   * Ponto mais próximo do X apontado. Mouse e toque usam o mesmo caminho — antes
   * só havia onMouseMove, então no celular o gráfico não revelava valor nenhum.
   */
  const aproximar = useCallback(
    (svg: SVGSVGElement, clientX: number) => {
      if (!chartData) return;
      const rect = svg.getBoundingClientRect();
      const alvo = ((clientX - rect.left) / rect.width) * chartData.width;
      let maisPerto = chartData.points[0];
      let menorDif = Infinity;
      for (const ponto of chartData.points) {
        const dif = Math.abs(ponto.x - alvo);
        if (dif < menorDif) {
          menorDif = dif;
          maisPerto = ponto;
        }
      }
      setHoveredPoint(maisPerto);
    },
    [chartData]
  );

  // Current scope bets (all bets in month or filtered by selectedDay)
  const scopedBets = useMemo(() => {
    if (selectedDay === "TODOS") return allBets;
    return allBets.filter((b) => b.data === selectedDay);
  }, [allBets, selectedDay]);

  const totalLucro = useMemo(
    () => converter(scopedBets.reduce((acc, b) => acc + b.lucro, 0)),
    [scopedBets, converter]
  );

  const totalBets = scopedBets.length;
  const greens = scopedBets.filter((b) => b.resultado === "GREEN").length;
  const reds = scopedBets.filter((b) => b.resultado === "RED").length;
  const pendentes = scopedBets.filter((b) => b.resultado === "PENDENTE").length;
  const voids = scopedBets.filter((b) => b.resultado === "VOID").length;
  const taxaAcerto = taxaDeAcerto(greens, reds);
  // ROI é razão: não muda com a unidade do visitante
  const roi = useMemo(() => calcularRoi(scopedBets), [scopedBets]);

  const sports = stats?.sports ?? [];
  const tipsters = stats?.tipsters ?? [];
  const recentBets = scopedBets.slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header with Month & Day Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl sm:text-4xl text-[var(--text)] tracking-tight">
              Painel de Performance
            </h1>
            {/* Só afirma "ao vivo" quando a leitura realmente veio da planilha */}
            {!erro && !isMock && !loading && (
              <span className="px-2.5 py-0.5 bg-[var(--green)]/10 text-[var(--green)] text-xs font-bold rounded-full">
                Live Data
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--text-2)] mt-1 font-sans">
            Métricas consolidadas, evolução real da banca e atividades da aba{" "}
            <span className="font-semibold text-[var(--text)]">{activeTab}</span>
            {selectedDay !== "TODOS" && (
              <span> (Filtrado para o dia <strong>{selectedDay}</strong>)</span>
            )}.
          </p>
          <LinkPlanilha className="mt-2" />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <label htmlFor="seletor-dia" className="sr-only">
            Filtrar por dia
          </label>
          <select
            id="seletor-dia"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="bg-white border border-black/[0.12] rounded-full px-4 py-2 text-xs font-bold text-[var(--text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] cursor-pointer shadow-sm hover:border-[var(--accent)]/60 transition-all"
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

          <SeletorAba
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            onRecarregar={recarregar}
            loading={loading}
            id="seletor-painel"
          />
        </div>
      </div>

      {isMock && <AvisoMock />}
      {erro && <AvisoErro mensagem={erro} onTentarNovamente={recarregar} />}

      <SeletorUnidade />

      {/* 5 KPIs */}
      {loading ? (
        <SkeletonKpis quantidade={5} />
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="bg-white border border-black/[0.07] rounded-2xl p-5 shadow-sm transition-all space-y-3">
          <div className="flex items-center justify-between text-[var(--text-3)]">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {selectedDay === "TODOS" ? "Lucro Acumulado" : `Lucro em ${selectedDay}`}
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                totalLucro >= 0
                  ? "bg-[var(--green)]/10 text-[var(--green)]"
                  : "bg-[var(--red)]/10 text-[var(--red)]"
              }`}
            >
              {totalLucro >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
            </div>
          </div>
          <div
            className={`font-serif ${tamanhoDoValor(
              formatarReaisComSinal(totalLucro)
            )} tracking-tight leading-none ${
              totalLucro >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
            }`}
          >
            <NumberFlow
              value={totalLucro}
              locales="pt-BR"
              format={{
                style: "currency",
                currency: "BRL",
                signDisplay: "always",
              }}
            />
          </div>
          <div className="text-xs font-medium text-[var(--text-2)] pt-1 border-t border-black/[0.04]">
            {selectedDay === "TODOS"
              ? `Resultado total em ${activeTab}`
              : `Resultado obtido no dia ${selectedDay}`}
          </div>
        </div>

        <div className="bg-white border border-black/[0.07] rounded-2xl p-5 shadow-sm transition-all space-y-3">
          <div className="flex items-center justify-between text-[var(--text-3)]">
            <span className="text-[11px] font-bold uppercase tracking-wider">ROI</span>
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`font-serif ${tamanhoDoValor(
              `${roi.toFixed(2)}%`
            )} tracking-tight leading-none ${
              roi >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
            }`}
          >
            <NumberFlow
              value={roi}
              locales="pt-BR"
              format={{ signDisplay: "always", maximumFractionDigits: 2 }}
              suffix="%"
            />
          </div>
          <div className="text-xs font-medium text-[var(--text-2)] pt-1 border-t border-black/[0.04]">
            Lucro sobre o total apostado
          </div>
        </div>

        <div className="bg-white border border-black/[0.07] rounded-2xl p-5 shadow-sm transition-all space-y-3">
          <div className="flex items-center justify-between text-[var(--text-3)]">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Total de Apostas
            </span>
            <div className="w-8 h-8 rounded-lg bg-[var(--text)]/5 text-[var(--text)] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`font-serif ${tamanhoDoValor(
              String(totalBets)
            )} text-[var(--text)] tracking-tight leading-none`}
          >
            <NumberFlow value={totalBets} locales="pt-BR" />
          </div>
          <div className="text-xs font-medium text-[var(--text-2)] pt-1 border-t border-black/[0.04]">
            {greens} Green · {reds} Red{voids > 0 && ` · ${voids} Void`}
          </div>
        </div>

        <div className="bg-white border border-black/[0.07] rounded-2xl p-5 shadow-sm transition-all space-y-3">
          <div className="flex items-center justify-between text-[var(--text-3)]">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Taxa de Assertividade
            </span>
            <div className="w-8 h-8 rounded-lg bg-[var(--green)]/10 text-[var(--green)] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-3xl sm:text-4xl text-[var(--text)] tracking-tight leading-none">
            <NumberFlow value={taxaAcerto} locales="pt-BR" suffix="%" />
          </div>
          <div className="text-xs font-medium text-[var(--text-2)] pt-1 border-t border-black/[0.04]">
            Das apostas finalizadas
          </div>
        </div>

        <div className="bg-white border border-black/[0.07] rounded-2xl p-5 shadow-sm transition-all space-y-3">
          <div className="flex items-center justify-between text-[var(--text-3)]">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Apostas Pendentes
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                pendentes > 0
                  ? "bg-[var(--amber)]/10 text-[var(--amber)]"
                  : "bg-[var(--text)]/5 text-[var(--text-3)]"
              }`}
            >
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`font-serif text-3xl sm:text-4xl tracking-tight leading-none ${
              pendentes > 0 ? "text-[var(--amber)]" : "text-[var(--text)]"
            }`}
          >
            <NumberFlow value={pendentes} locales="pt-BR" />
          </div>
          {/* Zero pendência é a situação boa, não um alerta — âmbar só quando há. */}
          <div
            className={`text-xs font-medium pt-1 border-t border-black/[0.04] ${
              pendentes > 0 ? "text-[var(--amber)]" : "text-[var(--text-2)]"
            }`}
          >
            {pendentes > 0 ? "Aguardando resultado oficial" : "Tudo com resultado lançado"}
          </div>
        </div>
      </div>
      )}

      {/* Middle Section: Real Dynamic Chart (8 cols) + Sport Breakdown (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Real Chart Box */}
        <div className="lg:col-span-8 bg-white border border-black/[0.07] rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base font-bold text-[var(--text)] tracking-tight">
                  Evolução da Banca ({activeTab === ABA_TODOS ? "Geral" : activeTab})
                </h2>
                {chartData && (
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
                      chartData.periodGain >= 0
                        ? "bg-[var(--green)]/10 text-[var(--green)]"
                        : "bg-[var(--red)]/10 text-[var(--red)]"
                    }`}
                  >
                    <NumberFlow
                      value={chartData.periodGain}
                      locales="pt-BR"
                      format={{
                        style: "currency",
                        currency: "BRL",
                        signDisplay: "always",
                      }}
                    />{" "}
                    ({period})
                  </span>
                )}
                {/* Maior queda de pico a vale. Lucro e ROI dizem onde a banca
                    chegou; isto diz quanto ela chegou a devolver no caminho. */}
                {chartData && chartData.drawdown > 0 && (
                  <span
                    className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--text)]/[0.05] text-[var(--text-2)]"
                    title="Maior queda de um pico até o vale seguinte dentro da janela exibida"
                  >
                    maior queda {formatarReais(chartData.drawdown)}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-3)] mt-0.5">
                {hoveredPoint ? (
                  <span className="text-[var(--text)] font-medium">
                    Dia <strong>{hoveredPoint.date}</strong>: Acumulado{" "}
                    <strong className={hoveredPoint.cumProfit >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}>
                      {formatarReaisComSinal(hoveredPoint.cumProfit)}
                    </strong>{" "}
                    ({formatarReaisComSinal(hoveredPoint.dayProfit)} no dia · {hoveredPoint.total} tips)
                  </span>
                ) : (
                  "Curva real calculada a partir de cada aposta registrada"
                )}
              </p>
            </div>

            <div className="flex items-center gap-1 bg-[var(--bg)] p-1 rounded-full border border-black/[0.06] shrink-0">
              {availablePeriods.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={period === p && selectedDay === "TODOS"}
                  onClick={() => {
                    setPeriod(p);
                    setSelectedDay("TODOS");
                    setHoveredPoint(null);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                    period === p && selectedDay === "TODOS"
                      ? "bg-[var(--accent)] text-white shadow-sm font-bold"
                      : "text-[var(--text-2)] hover:text-[var(--accent)]"
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
              <div className="w-full h-full flex items-center justify-center">
                {loading ? (
                  <SkeletonLinhas quantidade={1} altura="h-48" />
                ) : (
                  <p className="text-xs text-[var(--text-3)]">
                    Sem apostas com data nesta aba.
                  </p>
                )}
              </div>
            ) : (
              <svg
                viewBox={`0 0 ${chartData.width} ${chartData.height}`}
                className="w-full h-full cursor-crosshair overflow-visible select-none touch-pan-y"
                role="img"
                aria-label={`Evolução da banca em ${activeTab}, de ${
                  chartPoints[0]?.date ?? ""
                } a ${chartPoints[chartPoints.length - 1]?.date ?? ""}. Resultado do período: ${formatarReaisComSinal(
                  chartData.periodGain
                )}. Maior queda: ${formatarReais(chartData.drawdown)}.`}
                onMouseMove={(e) => aproximar(e.currentTarget, e.clientX)}
                onMouseLeave={() => setHoveredPoint(null)}
                onTouchStart={(e) => aproximar(e.currentTarget, e.touches[0].clientX)}
                onTouchMove={(e) => aproximar(e.currentTarget, e.touches[0].clientX)}
                onTouchEnd={() => setHoveredPoint(null)}
              >
                <defs>
                  {/* Verde acima do zero, vermelho abaixo. O corte fica exatamente
                      na linha do zero — antes a curva era verde fixa e um mês no
                      prejuízo aparecia verde ao lado do próprio selo vermelho. */}
                  <linearGradient
                    id="realChartLinha"
                    gradientUnits="userSpaceOnUse"
                    x1="0"
                    y1={chartData.padTop}
                    x2="0"
                    y2={chartData.padTop + chartData.drawH}
                  >
                    <stop offset={chartData.pctZero} stopColor="var(--green)" />
                    <stop offset={chartData.pctZero} stopColor="var(--red)" />
                  </linearGradient>
                  <linearGradient
                    id="realChartGrad"
                    gradientUnits="userSpaceOnUse"
                    x1="0"
                    y1={chartData.padTop}
                    x2="0"
                    y2={chartData.padTop + chartData.drawH}
                  >
                    <stop offset="0" stopColor="var(--green)" stopOpacity="0.22" />
                    <stop offset={chartData.pctZero} stopColor="var(--green)" stopOpacity="0.02" />
                    <stop offset={chartData.pctZero} stopColor="var(--red)" stopOpacity="0.02" />
                    <stop offset="1" stopColor="var(--red)" stopOpacity="0.22" />
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
                  className="text-[9.5px] font-mono fill-[var(--text-3)]"
                >
                  {chartData.yMax >= 1000
                    ? `R$ ${(chartData.yMax / 1000).toFixed(1).replace(".", ",")} mil`
                    : `R$ ${Math.round(chartData.yMax)}`}
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
                        className="text-[9.5px] font-mono font-bold fill-[var(--text-3)]"
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
                <motion.path
                  key={`area-${chartKey}`}
                  d={chartData.areaPath}
                  fill="url(#realChartGrad)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.45 }}
                />

                {/* Main Stroke Line */}
                <motion.path
                  key={`line-${chartKey}`}
                  d={chartData.linePath}
                  fill="none"
                  stroke="url(#realChartLinha)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.9, ease: [0.32, 0.72, 0, 1] }}
                />

                {/* Data Points on Line (Subtle dots) */}
                {chartData.points.map((p, i) => (
                  <motion.circle
                    key={`${chartKey}-${p.date}`}
                    cx={p.x}
                    cy={p.y}
                    r={chartData.points.length > 20 ? 1.5 : 3}
                    fill={p.cumProfit >= 0 ? "var(--green)" : "var(--red)"}
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{
                      opacity: chartData.points.length > 20 ? 0.6 : 0.8,
                      scale: 1,
                    }}
                    transition={{
                      duration: 0.25,
                      delay:
                        0.15 +
                        (i / Math.max(chartData.points.length - 1, 1)) * 0.75,
                    }}
                  />
                ))}

                {/* X-Axis Date Labels */}
                {chartData.points.length > 0 && (
                  <>
                    <text
                      x={chartData.points[0].x}
                      y={chartData.height - 12}
                      textAnchor="start"
                      className="text-[10px] font-mono fill-[var(--text-3)]"
                    >
                      {chartData.points[0].date}
                    </text>

                    {chartData.points.length > 2 && (
                      <text
                        x={chartData.points[Math.floor(chartData.points.length / 2)].x}
                        y={chartData.height - 12}
                        textAnchor="middle"
                        className="text-[10px] font-mono fill-[var(--text-3)]"
                      >
                        {chartData.points[Math.floor(chartData.points.length / 2)].date}
                      </text>
                    )}

                    <text
                      x={chartData.points[chartData.points.length - 1].x}
                      y={chartData.height - 12}
                      textAnchor="end"
                      className="text-[10px] font-mono fill-[var(--text-3)]"
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
                      stroke="var(--text)"
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
                      stroke={hoveredPoint.cumProfit >= 0 ? "var(--green)" : "var(--red)"}
                      strokeWidth="2"
                      opacity="0.4"
                    />

                    {/* Center dot */}
                    <circle
                      cx={hoveredPoint.x}
                      cy={hoveredPoint.y}
                      r="4"
                      fill={hoveredPoint.cumProfit >= 0 ? "var(--green)" : "var(--red)"}
                      stroke="var(--bg-card)"
                      strokeWidth="2"
                    />
                  </>
                )}
              </svg>
            )}
          </div>
        </div>

        {/* Breakdown by Sport */}
        <div className="lg:col-span-4 bg-white border border-black/[0.07] rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base font-bold text-[var(--text)] tracking-tight mb-1">
              Lucro por Esporte
            </h2>
            <p className="text-xs text-[var(--text-3)] mb-3">
              Distribuição por modalidades cadastradas
            </p>

            <div className="divide-y divide-black/[0.05] max-h-[220px] overflow-y-auto pr-1">
              {sports.length === 0 ? (
                <div className="py-4">
                  {loading ? (
                    <SkeletonLinhas quantidade={3} altura="h-9" />
                  ) : (
                    <p className="text-center text-xs text-[var(--text-3)]">
                      Sem modalidades nesta aba.
                    </p>
                  )}
                </div>
              ) : (
                sports.map((sport) => (
                  <div
                    key={sport.esporte}
                    className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <SportBadge sport={sport.esporte} />
                      <div className="text-[11px] text-[var(--text-3)]">
                        {sport.apostas} tips · {sport.taxaAcerto.toFixed(1).replace(".", ",")}% acerto
                      </div>
                    </div>
                    <div
                      className={`font-mono text-xs font-bold ${
                        sport.lucro >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
                      }`}
                    >
                      {formatarReaisComSinal(converter(sport.lucro))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link
            href="/estatisticas"
            className="w-full py-2 bg-[var(--bg)] hover:bg-[var(--bg-tinted)] text-[var(--text)] text-xs font-semibold rounded-xl text-center transition-colors flex items-center justify-center gap-1"
          >
            <span>Ver Estatísticas Completas</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Bottom Section: Recent Activity Stream (6 cols) + Top Adms Leaderboard (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Bets Stream */}
        <div className="lg:col-span-7 bg-white border border-black/[0.07] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--text)] tracking-tight">
                Últimas Apostas Registradas
              </h2>
              <p className="text-xs text-[var(--text-3)]">
                {selectedDay === "TODOS"
                  ? "As entradas mais recentes da aba"
                  : `Apostas cadastradas no dia ${selectedDay}`}
              </p>
            </div>

            <Link
              href="/apostas"
              className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1"
            >
              <span>Ver todas</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {recentBets.map((bet) => {
              const isGreen = bet.resultado === "GREEN";
              const isRed = bet.resultado === "RED";
              const isVoid = bet.resultado === "VOID";

              return (
                <div
                  key={bet.id}
                  className="p-3 bg-[var(--bg-soft)] rounded-xl border border-black/[0.04] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <SportBadge sport={bet.esporte} />
                    <div className="min-w-0">
                      <div className="font-bold text-[var(--text)] truncate">
                        {bet.partida}
                      </div>
                      <div className="text-[11px] text-[var(--text-2)] truncate flex items-center gap-1.5 mt-0.5">
                        <span>{bet.tip}</span>
                        <span>·</span>
                        <strong className="font-mono">@{formatarOdd(bet.odd)}</strong>
                        {bet.casa && <BookieBadge bookie={bet.casa} className="scale-90 origin-left" />}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isGreen
                          ? "bg-[var(--green)]/10 text-[var(--green)]"
                          : isRed
                          ? "bg-[var(--red)]/10 text-[var(--red)]"
                          : isVoid
                          ? "bg-[var(--text-2)]/10 text-[var(--text-2)]"
                          : "bg-[var(--amber)]/10 text-[var(--amber)]"
                      }`}
                    >
                      {bet.resultado}
                    </span>
                    <span
                      className={`font-mono font-bold text-xs ${
                        isGreen
                          ? "text-[var(--green)]"
                          : isRed
                          ? "text-[var(--red)]"
                          : "text-[var(--text-3)]"
                      }`}
                    >
                      {bet.resultado === "PENDENTE" || isVoid
                        ? "—"
                        : formatarReaisComSinal(converter(bet.lucro))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Adms Box */}
        <div className="lg:col-span-5 bg-white border border-black/[0.07] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--text)] tracking-tight">
                Ranking de Adms ({activeTab})
              </h2>
              <p className="text-xs text-[var(--text-3)]">
                Quem mais gerou retorno na aba ativa
              </p>
            </div>

            <Link
              href="/adms"
              className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1"
            >
              <span>Detalhes</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {tipsters.slice(0, 4).map((t, idx) => (
              <div
                key={t.nome}
                className="p-3.5 bg-[var(--bg-soft)] rounded-xl border border-black/[0.04] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-[var(--text-3)] w-4">
                    #{idx + 1}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.avatarColor} text-white font-bold text-xs flex items-center justify-center`}
                  >
                    {t.initial}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[var(--text)]">
                      {t.nome}
                    </div>
                    <div className="text-[10.5px] text-[var(--text-3)]">
                      {t.totalApostas} tips · {t.taxaAcerto.toFixed(1).replace(".", ",")}% acerto
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-mono text-xs font-bold ${
                      t.lucroUnidades >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
                    }`}
                  >
                    {formatarUnidades(t.lucroUnidades)}
                  </div>
                  <div className="text-[10px] text-[var(--text-3)] uppercase tracking-wider">
                    Unidades
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <SecaoTelegram />
    </div>
  );
}
