"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import {
  Search,
  LayoutGrid,
  List,
  Flame,
  X,
  Copy,
  Check,
  Award,
  Layers,
} from "lucide-react";
import { BetItem, BetResult } from "@/lib/types";
import { SportBadge } from "@/components/SportBadge";
import { BookieBadge } from "@/components/BookieBadge";
import { SeletorAba } from "@/components/SeletorAba";
import { AvisoErro, AvisoMock } from "@/components/AvisoDados";
import { SkeletonLinhas } from "@/components/Skeleton";
import { useBets } from "@/hooks/useBets";
import { SecaoTelegram } from "@/components/Telegram";
import { LinkPlanilha } from "@/components/LinkPlanilha";
import { useUnidade } from "@/hooks/useUnidade";
import { SeletorUnidade } from "@/components/SeletorUnidade";
import { parseDateTimestamp } from "@/lib/date";
import { calcularRoi, taxaDeAcerto } from "@/lib/stats";
import { formatarOdd, formatarReais, formatarReaisComSinal } from "@/lib/format";

export default function ApostasPage() {
  const {
    bets,
    tabs,
    activeTab,
    setActiveTab,
    loading,
    erro,
    isMock,
    recarregar,
  } = useBets();

  const { converter } = useUnidade();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"TODAS" | BetResult>("TODAS");
  const [sportFilter, setSportFilter] = useState("TODOS");
  const [bookieFilter, setBookieFilter] = useState("TODAS");
  const [dayFilter, setDayFilter] = useState("TODOS");
  const [oddRangeFilter, setOddRangeFilter] = useState<
    "TODAS" | "BAIXA" | "MEDIA" | "ALTA"
  >("TODAS");

  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [selectedBet, setSelectedBet] = useState<BetItem | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDayFilter("TODOS");
  }, [activeTab]);

  // Listas de filtro em ordem alfabética, para o usuário achar o item
  const sports = useMemo(
    () =>
      Array.from(new Set(bets.map((b) => b.esporte)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "pt-BR")),
    [bets]
  );

  const bookies = useMemo(
    () =>
      Array.from(new Set(bets.map((b) => b.casa)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "pt-BR")),
    [bets]
  );

  const availableDays = useMemo(() => {
    const dates = Array.from(new Set(bets.map((b) => b.data))).filter(
      (d) => d && d !== "—"
    );
    dates.sort((a, b) => parseDateTimestamp(b) - parseDateTimestamp(a));
    return dates;
  }, [bets]);

  const filteredBets = useMemo(() => {
    const termo = search.toLowerCase();
    return bets.filter((bet) => {
      const matchesSearch =
        termo === "" ||
        bet.partida.toLowerCase().includes(termo) ||
        bet.tip.toLowerCase().includes(termo) ||
        bet.casa.toLowerCase().includes(termo) ||
        bet.tipster.toLowerCase().includes(termo);

      const matchesStatus =
        statusFilter === "TODAS" || bet.resultado === statusFilter;
      const matchesSport = sportFilter === "TODOS" || bet.esporte === sportFilter;
      const matchesBookie = bookieFilter === "TODAS" || bet.casa === bookieFilter;
      const matchesDay = dayFilter === "TODOS" || bet.data === dayFilter;

      let matchesOdd = true;
      if (oddRangeFilter === "BAIXA") matchesOdd = bet.odd < 1.8;
      else if (oddRangeFilter === "MEDIA")
        matchesOdd = bet.odd >= 1.8 && bet.odd <= 3.0;
      else if (oddRangeFilter === "ALTA") matchesOdd = bet.odd > 3.0;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesSport &&
        matchesBookie &&
        matchesOdd &&
        matchesDay
      );
    });
  }, [
    bets,
    search,
    statusFilter,
    sportFilter,
    bookieFilter,
    dayFilter,
    oddRangeFilter,
  ]);

  const resumo = useMemo(() => {
    const greens = filteredBets.filter((b) => b.resultado === "GREEN").length;
    const reds = filteredBets.filter((b) => b.resultado === "RED").length;
    const pendentes = filteredBets.filter((b) => b.resultado === "PENDENTE").length;
    const voids = filteredBets.filter((b) => b.resultado === "VOID").length;
    const lucro = converter(filteredBets.reduce((acc, b) => acc + b.lucro, 0));
    const odd =
      filteredBets.length > 0
        ? filteredBets.reduce((acc, b) => acc + b.odd, 0) / filteredBets.length
        : 0;
    return {
      greens,
      reds,
      pendentes,
      voids,
      lucro,
      odd,
      taxa: taxaDeAcerto(greens, reds),
      // razão: independe da unidade escolhida
      roi: calcularRoi(filteredBets),
    };
  }, [filteredBets, converter]);

  const currentStreak = useMemo(() => {
    let streak = 0;
    for (const b of bets.filter(
      (x) => x.resultado === "GREEN" || x.resultado === "RED"
    )) {
      if (b.resultado === "GREEN") streak++;
      else break;
    }
    return streak;
  }, [bets]);

  const topAdms = useMemo(() => {
    const map = new Map<
      string,
      { total: number; greens: number; reds: number; profit: number }
    >();
    bets.forEach((b) => {
      const cur = map.get(b.tipster) || { total: 0, greens: 0, reds: 0, profit: 0 };
      cur.total += 1;
      cur.profit += b.lucro;
      if (b.resultado === "GREEN") cur.greens += 1;
      if (b.resultado === "RED") cur.reds += 1;
      map.set(b.tipster, cur);
    });

    return Array.from(map.entries())
      .map(([nome, d]) => ({
        nome,
        total: d.total,
        profit: d.profit,
        // Mesma definição da página de Adms: pendente não conta como perdida.
        winRate: taxaDeAcerto(d.greens, d.reds),
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 4);
  }, [bets]);

  const topBookies = useMemo(() => {
    const map = new Map<string, number>();
    bets.forEach((b) => {
      if (b.casa) map.set(b.casa, (map.get(b.casa) || 0) + 1);
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

  const groupedByDate = useMemo(() => {
    const map = new Map<string, BetItem[]>();
    filteredBets.forEach((bet) => {
      const list = map.get(bet.data) || [];
      list.push(bet);
      map.set(bet.data, list);
    });
    return Array.from(map.entries()).sort(
      (a, b) => parseDateTimestamp(b[0]) - parseDateTimestamp(a[0])
    );
  }, [filteredBets]);

  const fecharDetalhe = useCallback(() => setSelectedBet(null), []);

  async function handleCopyBet(bet: BetItem) {
    const texto = `${bet.partida} - ${bet.tip} @${formatarOdd(bet.odd)} (${bet.casa})`;
    try {
      await navigator.clipboard.writeText(texto);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponível (contexto inseguro ou permissão negada)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1A1715] tracking-tight">
            Feed de Apostas
          </h1>
          <p className="text-sm text-[#6B645A] mt-1 font-sans">
            Feed cronológico lido da aba{" "}
            <span className="font-semibold text-[#1A1715]">{activeTab}</span>.
          </p>
          <LinkPlanilha className="mt-2" />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div
            className="flex items-center bg-white border border-black/[0.12] rounded-full p-0.5 shadow-sm"
            role="group"
            aria-label="Modo de visualização"
          >
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              aria-pressed={viewMode === "cards"}
              aria-label="Visualizar em cartões"
              className={`p-1.5 rounded-full transition-all ${
                viewMode === "cards"
                  ? "bg-[#1A1715] text-white"
                  : "text-[#6B645A] hover:text-[#1A1715]"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              aria-pressed={viewMode === "table"}
              aria-label="Visualizar em tabela"
              className={`p-1.5 rounded-full transition-all ${
                viewMode === "table"
                  ? "bg-[#1A1715] text-white"
                  : "text-[#6B645A] hover:text-[#1A1715]"
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <SeletorAba
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            onRecarregar={recarregar}
            loading={loading}
            id="seletor-apostas"
          />
        </div>
      </div>

      {(isMock || erro) && (
        <div className="space-y-4 mb-6">
          {isMock && <AvisoMock />}
          {erro && <AvisoErro mensagem={erro} onTentarNovamente={recarregar} />}
        </div>
      )}

      <div className="mb-6">
        <SeletorUnidade />
      </div>

      {/* Resumo do filtro atual */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-black/[0.07] rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-[#9E9689] uppercase tracking-wider">
            Lucro do Filtro
          </div>
          <div
            className={`font-mono text-xl sm:text-2xl font-bold mt-1 tracking-tight ${
              resumo.lucro >= 0 ? "text-[#2D8659]" : "text-[#C23B22]"
            }`}
          >
            <NumberFlow
              value={resumo.lucro}
              locales="pt-BR"
              format={{ style: "currency", currency: "BRL", signDisplay: "always" }}
            />
          </div>
        </div>

        <div className="bg-white border border-black/[0.07] rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-[#9E9689] uppercase tracking-wider">
            Green / Red
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold mt-1 tracking-tight">
            <span className="text-[#2D8659]">{resumo.greens}</span>{" "}
            <span className="text-[#9E9689] font-normal text-sm">/</span>{" "}
            <span className="text-[#C23B22]">{resumo.reds}</span>
            {resumo.voids > 0 && (
              <span className="text-[#6B645A] text-sm font-normal">
                {" "}· {resumo.voids} void
              </span>
            )}
          </div>
        </div>

        <div className="bg-white border border-black/[0.07] rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-[#9E9689] uppercase tracking-wider">
            Taxa Parcial
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-[#1A1715] mt-1 tracking-tight">
            {resumo.greens + resumo.reds > 0 ? (
              <NumberFlow value={resumo.taxa} locales="pt-BR" suffix="%" />
            ) : (
              "—"
            )}
          </div>
        </div>

        <div className="bg-white border border-black/[0.07] rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-[#9E9689] uppercase tracking-wider">
            ROI do Filtro
          </div>
          <div
            className={`font-mono text-xl sm:text-2xl font-bold mt-1 tracking-tight ${
              resumo.roi >= 0 ? "text-[#2D8659]" : "text-[#C23B22]"
            }`}
          >
            {resumo.greens + resumo.reds > 0 ? (
              <NumberFlow
                value={resumo.roi}
                locales="pt-BR"
                format={{ signDisplay: "always", maximumFractionDigits: 2 }}
                suffix="%"
              />
            ) : (
              "—"
            )}
          </div>
          <div className="text-[10.5px] text-[#9E9689] mt-0.5">
            odd média {resumo.odd > 0 ? formatarOdd(resumo.odd) : "—"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          {/* Filtros */}
          <div className="bg-white border border-black/[0.07] rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search
                  className="w-4 h-4 text-[#9E9689] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <label htmlFor="busca-apostas" className="sr-only">
                  Buscar apostas
                </label>
                <input
                  id="busca-apostas"
                  type="search"
                  placeholder="Buscar partida, mercado, casa, adm..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#F7F5F0] border border-black/[0.06] rounded-full pl-9 pr-3.5 py-1.5 text-xs text-[#1A1715] placeholder:text-[#9E9689] outline-none focus:border-[#C7522A] transition-colors"
                />
              </div>

              <div
                className="flex items-center gap-1 flex-wrap"
                role="group"
                aria-label="Filtrar por resultado"
              >
                {(["TODAS", "GREEN", "RED", "VOID", "PENDENTE"] as const).map((status) => {
                  const isActive = statusFilter === status;
                  const rotulos = {
                    TODAS: "Todas",
                    GREEN: "Green",
                    RED: "Red",
                    VOID: "Void",
                    PENDENTE: "Pendente",
                  } as const;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      aria-pressed={isActive}
                      className={`px-3 py-1.5 text-[11px] font-semibold rounded-full border transition-all ${
                        isActive
                          ? "bg-[#1A1715] text-white border-[#1A1715]"
                          : "bg-white text-[#6B645A] border-black/[0.08] hover:border-black/20 hover:text-[#1A1715]"
                      }`}
                    >
                      {rotulos[status]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/[0.05]">
              <div className="flex items-center gap-2 flex-wrap">
                <label htmlFor="filtro-dia" className="sr-only">
                  Filtrar por dia
                </label>
                <select
                  id="filtro-dia"
                  value={dayFilter}
                  onChange={(e) => setDayFilter(e.target.value)}
                  className="bg-[#F7F5F0] border border-black/[0.06] rounded-full px-3 py-1 text-xs font-bold text-[#1A1715] outline-none focus-visible:ring-2 focus-visible:ring-[#C7522A] cursor-pointer hover:border-black/20 transition-colors"
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

                <label htmlFor="filtro-esporte" className="sr-only">
                  Filtrar por esporte
                </label>
                <select
                  id="filtro-esporte"
                  value={sportFilter}
                  onChange={(e) => setSportFilter(e.target.value)}
                  className="bg-[#F7F5F0] border border-black/[0.06] rounded-full px-3 py-1 text-xs font-semibold text-[#6B645A] outline-none focus-visible:ring-2 focus-visible:ring-[#C7522A] cursor-pointer hover:border-black/20 transition-colors"
                >
                  <option value="TODOS">Todos os Esportes</option>
                  {sports.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <label htmlFor="filtro-casa" className="sr-only">
                  Filtrar por casa de apostas
                </label>
                <select
                  id="filtro-casa"
                  value={bookieFilter}
                  onChange={(e) => setBookieFilter(e.target.value)}
                  className="bg-[#F7F5F0] border border-black/[0.06] rounded-full px-3 py-1 text-xs font-semibold text-[#6B645A] outline-none focus-visible:ring-2 focus-visible:ring-[#C7522A] cursor-pointer hover:border-black/20 transition-colors"
                >
                  <option value="TODAS">Todas as Casas</option>
                  {bookies.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className="flex items-center gap-1"
                role="group"
                aria-label="Filtrar por faixa de odd"
              >
                <span className="text-[11px] font-medium text-[#9E9689] mr-1">
                  Odd:
                </span>
                {(
                  [
                    { label: "Todas", val: "TODAS" },
                    { label: "< 1,8", val: "BAIXA" },
                    { label: "1,8 – 3,0", val: "MEDIA" },
                    { label: "> 3,0", val: "ALTA" },
                  ] as const
                ).map((range) => (
                  <button
                    key={range.val}
                    type="button"
                    onClick={() => setOddRangeFilter(range.val)}
                    aria-pressed={oddRangeFilter === range.val}
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

          {/* Feed */}
          {loading ? (
            <SkeletonLinhas quantidade={6} altura="h-20" />
          ) : erro ? null : filteredBets.length === 0 ? (
            <div className="bg-white border border-black/[0.07] rounded-2xl p-16 text-center">
              <p className="text-sm font-medium text-[#9E9689]">
                {bets.length === 0
                  ? `Nenhuma aposta registrada na aba ${activeTab}.`
                  : "Nenhuma aposta corresponde aos filtros."}
              </p>
            </div>
          ) : viewMode === "cards" ? (
            <div className="space-y-6">
              {groupedByDate.map(([date, dayBets]) => {
                const lucroDia = dayBets.reduce((acc, b) => acc + b.lucro, 0);
                return (
                  <motion.section key={date} layout className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xs font-mono font-bold text-[#1A1715]">
                        {date}
                      </h2>
                      <span className="text-[11px] text-[#9E9689]">
                        ({dayBets.length}{" "}
                        {dayBets.length === 1 ? "aposta" : "apostas"})
                      </span>
                      <div className="flex-1 h-px bg-black/[0.06]" />
                      <span
                        className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          lucroDia >= 0
                            ? "bg-[#2D8659]/10 text-[#2D8659]"
                            : "bg-[#C23B22]/10 text-[#C23B22]"
                        }`}
                      >
                        {formatarReaisComSinal(converter(lucroDia))}
                      </span>
                    </div>

                    <AnimatePresence mode="popLayout" initial={false}>
                      {dayBets.map((bet) => {
                        const isGreen = bet.resultado === "GREEN";
                        const isRed = bet.resultado === "RED";
                        const isVoid = bet.resultado === "VOID";

                        return (
                          <motion.button
                            key={bet.id}
                            layout
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ duration: 0.2 }}
                            type="button"
                            onClick={() => setSelectedBet(bet)}
                            aria-label={`Ver detalhes: ${bet.partida}, ${bet.tip}`}
                            className="w-full text-left bg-white border border-black/[0.07] rounded-xl overflow-hidden shadow-sm hover:border-black/25 hover:shadow-card focus-visible:ring-2 focus-visible:ring-[#C7522A] transition-colors cursor-pointer grid grid-cols-[5px_1fr] group mb-2"
                          >
                            <div
                              className={
                                isGreen
                                  ? "bg-[#2D8659]"
                                  : isRed
                                  ? "bg-[#C23B22]"
                                  : isVoid
                                  ? "bg-[#9E9689]"
                                  : "bg-[#B8860B]"
                              }
                            />

                            <div className="p-3.5 sm:p-4 space-y-2 min-w-0">
                              {/* Linha 1 — quebra no mobile em vez de ser cortada */}
                              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                                <SportBadge sport={bet.esporte} />
                                <span className="text-[13.5px] font-bold text-[#1A1715] tracking-tight group-hover:text-[#C7522A] transition-colors min-w-0 flex-1 truncate">
                                  {bet.partida}
                                </span>
                                <BookieBadge bookie={bet.casa} />
                              </div>

                              {/* Linha 2 — odd, valor, status e lucro sempre visíveis */}
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-1.5 border-t border-black/[0.04]">
                                {/* No mobile a tip ocupa a linha inteira; a
                                    partir de sm divide espaço com o resto. */}
                                <span className="text-xs text-[#6B645A] font-medium w-full sm:w-auto sm:min-w-0 sm:flex-1 truncate">
                                  {bet.tip}
                                </span>

                                {bet.tipster && bet.tipster !== "Geral" && (
                                  <span className="text-[10px] text-[#9E9689] px-1.5 py-0.5 bg-[#F7F5F0] rounded shrink-0">
                                    {bet.tipster}
                                  </span>
                                )}

                                <span className="text-xs font-mono font-bold text-[#1A1715] bg-[#F7F5F0] px-2 py-0.5 rounded border border-black/[0.04] shrink-0">
                                  @{formatarOdd(bet.odd)}
                                </span>

                                <span className="text-xs font-mono text-[#6B645A] shrink-0">
                                  {formatarReais(converter(bet.valor))}
                                </span>

                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider shrink-0 ${
                                    isGreen
                                      ? "bg-[#2D8659]/10 text-[#2D8659]"
                                      : isRed
                                      ? "bg-[#C23B22]/10 text-[#C23B22]"
                                      : isVoid
                                      ? "bg-[#6B645A]/10 text-[#6B645A]"
                                      : "bg-[#B8860B]/10 text-[#B8860B]"
                                  }`}
                                >
                                  {bet.resultado}
                                </span>

                                <span
                                  className={`font-mono text-xs font-bold shrink-0 ${
                                    isGreen
                                      ? "text-[#2D8659]"
                                      : isRed
                                      ? "text-[#C23B22]"
                                      : "text-[#9E9689]"
                                  }`}
                                >
                                  {bet.resultado === "PENDENTE" || isVoid
                                    ? "—"
                                    : formatarReaisComSinal(converter(bet.lucro))}
                                </span>
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </AnimatePresence>
                  </motion.section>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <caption className="sr-only">
                    Apostas registradas na aba {activeTab}
                  </caption>
                  <thead className="bg-[#FAF8F5] border-b border-black/[0.06] text-[#9E9689] uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th scope="col" className="py-3 px-4">
                        Data
                      </th>
                      <th scope="col" className="py-3 px-3">
                        Esporte
                      </th>
                      <th scope="col" className="py-3 px-4">
                        Partida / Mercado
                      </th>
                      <th scope="col" className="py-3 px-3">
                        Casa
                      </th>
                      <th scope="col" className="py-3 px-3 text-right">
                        Odd
                      </th>
                      <th scope="col" className="py-3 px-3 text-right">
                        Valor
                      </th>
                      <th scope="col" className="py-3 px-3 text-center">
                        Status
                      </th>
                      <th scope="col" className="py-3 px-4 text-right">
                        Lucro
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.05]">
                    {filteredBets.map((bet) => {
                      const isGreen = bet.resultado === "GREEN";
                      const isRed = bet.resultado === "RED";
                      const isVoid = bet.resultado === "VOID";
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
                          <td className="py-2.5 px-4 max-w-xs">
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
                            {formatarOdd(bet.odd)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-right text-[#6B645A] whitespace-nowrap">
                            {formatarReais(converter(bet.valor))}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                                isGreen
                                  ? "bg-[#2D8659]/10 text-[#2D8659]"
                                  : isRed
                                  ? "bg-[#C23B22]/10 text-[#C23B22]"
                                  : isVoid
                                  ? "bg-[#6B645A]/10 text-[#6B645A]"
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
                            {bet.resultado === "PENDENTE" || isVoid
                              ? "—"
                              : formatarReaisComSinal(converter(bet.lucro))}
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

        {/* Coluna lateral */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
          <div className="bg-white border border-black/[0.07] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#9E9689]">
                Momento Atual
              </h2>
              <Flame className="w-4 h-4 text-[#C7522A]" aria-hidden="true" />
            </div>

            <div className="flex items-center gap-3">
              <motion.div
                key={currentStreak}
                initial={{ scale: 0.85 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 18 }}
                className="w-12 h-12 rounded-xl bg-[#C7522A]/10 text-[#C7522A] flex items-center justify-center font-bold text-base gap-1 shrink-0"
              >
                <Flame className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
                <span className="font-mono text-lg">{currentStreak}</span>
              </motion.div>
              <div>
                <p className="text-sm font-bold text-[#1A1715]">
                  {currentStreak > 0
                    ? `${currentStreak} ${
                        currentStreak === 1
                          ? "green consecutivo"
                          : "greens consecutivos"
                      }`
                    : "Em busca do próximo green"}
                </p>
                <p className="text-xs text-[#6B645A]">
                  {resumo.pendentes}{" "}
                  {resumo.pendentes === 1
                    ? "aposta em aberto"
                    : "apostas em aberto"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-black/[0.07] rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#9E9689]">
                Top Adms ({activeTab})
              </h2>
              <Award className="w-4 h-4 text-[#2D8659]" aria-hidden="true" />
            </div>

            <div className="divide-y divide-black/[0.05]">
              {topAdms.length === 0 ? (
                <p className="text-xs text-[#9E9689] py-2">
                  Sem adms nesta aba.
                </p>
              ) : (
                topAdms.map((adm, i) => (
                  <div
                    key={adm.nome}
                    className="py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-xs font-bold text-[#9E9689] w-4 shrink-0">
                        #{i + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#1A1715] truncate">
                          {adm.nome}
                        </div>
                        <div className="text-[10.5px] text-[#9E9689]">
                          {adm.total} tips ·{" "}
                          {adm.winRate.toFixed(1).replace(".", ",")}% acerto
                        </div>
                      </div>
                    </div>

                    <span
                      className={`font-mono text-xs font-bold shrink-0 ${
                        adm.profit >= 0 ? "text-[#2D8659]" : "text-[#C23B22]"
                      }`}
                    >
                      {formatarReaisComSinal(converter(adm.profit))}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-black/[0.07] rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#9E9689]">
                Concentração por Casa
              </h2>
              <Layers className="w-4 h-4 text-[#6B645A]" aria-hidden="true" />
            </div>

            <div className="space-y-2.5">
              {topBookies.length === 0 ? (
                <p className="text-xs text-[#9E9689]">Sem casas nesta aba.</p>
              ) : (
                topBookies.map((b) => (
                  <div key={b.casa} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold gap-2">
                      <span className="text-[#1A1715] truncate">{b.casa}</span>
                      <span className="font-mono text-[#6B645A] text-[11px] shrink-0">
                        {b.count} tips
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#EFECE6] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-[#1A1715]"
                        initial={{ width: "0%" }}
                        animate={{ width: `${b.percent}%` }}
                        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <SecaoTelegram />
      </div>

      <DetalheAposta
        bet={selectedBet}
        onFechar={fecharDetalhe}
        onCopiar={handleCopyBet}
        copiado={copied}
        converter={converter}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

interface DetalheApostaProps {
  bet: BetItem | null;
  onFechar: () => void;
  onCopiar: (bet: BetItem) => void;
  copiado: boolean;
  converter: (v: number) => number;
}

function DetalheAposta({
  bet,
  onFechar,
  onCopiar,
  copiado,
  converter,
}: DetalheApostaProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const focoAnterior = useRef<HTMLElement | null>(null);

  // onFechar muda de identidade a cada render do pai. Guardar numa ref evita
  // que o efeito abaixo reexecute e desfaça a própria trava de scroll.
  const fecharRef = useRef(onFechar);
  useEffect(() => {
    fecharRef.current = onFechar;
  }, [onFechar]);

  const aberto = Boolean(bet);

  useEffect(() => {
    if (!aberto) return;

    focoAnterior.current = document.activeElement as HTMLElement;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        fecharRef.current();
        return;
      }
      // Mantém o foco preso dentro do diálogo
      if (e.key === "Tab" && dialogRef.current) {
        const focaveis = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focaveis.length === 0) return;
        const primeiro = focaveis[0];
        const ultimo = focaveis[focaveis.length - 1];

        if (e.shiftKey && document.activeElement === primeiro) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primeiro.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => dialogRef.current?.focus());

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflowAnterior;
      focoAnterior.current?.focus?.();
    };
  }, [aberto]);

  // Sem AnimatePresence aqui de propósito: com ela, o overlay de tela cheia
  // ficava no DOM com opacity 0 após fechar e engolia todos os cliques da
  // página. Desmontar direto é determinístico; a animação de entrada continua.
  if (!bet) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.16 }}
      onClick={onFechar}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-detalhe-aposta"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
        className="bg-white border border-black/[0.1] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 outline-none max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                bet.resultado === "GREEN"
                  ? "bg-[#2D8659]/10 text-[#2D8659]"
                  : bet.resultado === "RED"
                  ? "bg-[#C23B22]/10 text-[#C23B22]"
                  : "bg-[#B8860B]/10 text-[#B8860B]"
              }`}
            >
              {bet.resultado}
            </span>
            <span className="text-xs text-[#9E9689] font-mono truncate">
              ID: {bet.id}
            </span>
          </div>

          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar detalhes"
            className="p-1 rounded-full text-[#6B645A] hover:bg-[#EFECE6] focus-visible:ring-2 focus-visible:ring-[#C7522A] transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-[11px] font-semibold text-[#9E9689] uppercase tracking-wider">
              Partida / Confronto
            </div>
            <h2
              id="titulo-detalhe-aposta"
              className="text-base font-bold text-[#1A1715] mt-0.5"
            >
              {bet.partida}
            </h2>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-[#9E9689] uppercase tracking-wider">
              Mercado / Tip
            </div>
            <p className="text-sm font-medium text-[#6B645A] mt-0.5 bg-[#FAF8F5] p-3 rounded-xl border border-black/[0.04]">
              {bet.tip}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-[#F7F5F0] rounded-xl text-center">
              <div className="text-[10px] uppercase tracking-wider text-[#9E9689] font-bold">
                Odd
              </div>
              <div className="font-mono text-base font-bold text-[#1A1715] mt-0.5">
                {formatarOdd(bet.odd)}
              </div>
            </div>

            <div className="p-3 bg-[#F7F5F0] rounded-xl text-center">
              <div className="text-[10px] uppercase tracking-wider text-[#9E9689] font-bold">
                Valor
              </div>
              <div className="font-mono text-base font-bold text-[#1A1715] mt-0.5">
                {formatarReais(bet.valor)}
              </div>
              <div className="text-[10px] text-[#9E9689] mt-0.5">
                {bet.unidades.toFixed(2).replace(".", ",")}u
              </div>
            </div>

            <div className="p-3 bg-[#F7F5F0] rounded-xl text-center">
              <div className="text-[10px] uppercase tracking-wider text-[#9E9689] font-bold">
                Lucro / Perda
              </div>
              <div
                className={`font-mono text-base font-bold mt-0.5 ${
                  bet.lucro >= 0 ? "text-[#2D8659]" : "text-[#C23B22]"
                }`}
              >
                {bet.resultado === "PENDENTE"
                  ? "—"
                  : formatarReaisComSinal(bet.lucro)}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-[#6B645A] pt-2 gap-2">
            <div className="flex items-center gap-2">
              <span>Esporte:</span>
              <SportBadge sport={bet.esporte} />
            </div>
            <div className="flex items-center gap-2">
              <span>Casa:</span>
              <BookieBadge bookie={bet.casa} />
            </div>
            <span>
              Adm: <strong className="text-[#1A1715]">{bet.tipster}</strong>
            </span>
            <span>
              Data: <strong className="text-[#1A1715]">{bet.data}</strong>
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between">
          <button
            type="button"
            onClick={() => onCopiar(bet)}
            className="px-4 py-2 bg-[#F7F5F0] text-[#1A1715] text-xs font-semibold rounded-full hover:bg-[#EFECE6] focus-visible:ring-2 focus-visible:ring-[#C7522A] transition-all flex items-center gap-1.5"
          >
            {copiado ? (
              <Check className="w-3.5 h-3.5 text-[#2D8659]" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiado ? "Copiado!" : "Copiar tip"}</span>
          </button>

          <button
            type="button"
            onClick={onFechar}
            className="px-5 py-2 bg-[#1A1715] text-white text-xs font-semibold rounded-full hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#C7522A] transition-all"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
