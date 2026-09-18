"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import NumberFlow from "@number-flow/react";
import { Search, LayoutGrid, List, Award } from "lucide-react";
import type { BetItem, BetResult } from "@/lib/types";
import { SportBadge } from "@/components/SportBadge";
import { BookieBadge } from "@/components/BookieBadge";
import { SeletorAba } from "@/components/SeletorAba";
import { AvisoErro, AvisoMock } from "@/components/AvisoDados";
import { SkeletonLinhas } from "@/components/Skeleton";
import { BarraDeProgresso } from "@/components/BarraDeProgresso";
import { useBets } from "@/hooks/useBets";
import { SecaoTelegram } from "@/components/Telegram";
import { LinkPlanilha } from "@/components/LinkPlanilha";
import { useUnidade } from "@/hooks/useUnidade";
import { SeletorUnidade } from "@/components/SeletorUnidade";
import { paraISO, parseDateTimestamp, rotuloDoPeriodo, timestampDoISO } from "@/lib/date";
import { SeletorMultiplo } from "@/components/SeletorMultiplo";
import { FiltroPeriodo } from "@/components/FiltroPeriodo";
import { calcularRoi, taxaDeAcerto } from "@/lib/stats";
import { rotuloDaAba, trechoDaAba } from "@/lib/constants";
import {
  formatarInteiro,
  formatarOdd,
  formatarReais,
  formatarReaisComSinal,
} from "@/lib/format";

/**
 * Quantas apostas o feed desenha por vez.
 *
 * Sem limite, Abril26 punha 2.452 linhas na tela de uma vez: 44.753 nós no DOM
 * e 665.421 px de altura, cerca de 800 telas de rolagem. Renderizar em blocos
 * derruba isso para a ordem de 2 mil nós e é o que devolve a fluidez à busca.
 */
const APOSTAS_POR_BLOCO = 100;

/**
 * O detalhe da aposta só desce quando alguém abre uma.
 *
 * São cerca de 230 linhas de diálogo que a maior parte das visitas nunca vê —
 * quem entra para conferir o resultado do dia rola o feed e sai. Fora do
 * pacote inicial, a primeira pintura da tela chega antes.
 *
 * `ssr: false` porque o diálogo nunca existe na primeira pintura: ele depende
 * de um clique, e renderizá-lo no servidor seria trabalho jogado fora.
 */
const DetalheAposta = dynamic(
  () => import("@/components/DetalheAposta").then((m) => m.DetalheAposta),
  { ssr: false }
);

export default function ApostasPage() {
  const {
    bets,
    tabs,
    activeTab,
    setActiveTab,
    loading,
    mostrarEsqueleto,
    erro,
    isMock,
    recarregar,
  } = useBets();

  const { converter } = useUnidade();

  // `search` é o que está digitado; `buscaAplicada` é o que de fato filtra.
  // Sem essa separação, cada tecla refiltrava tudo e remontava a lista inteira
  // — medi entre 640 e 1.199 ms de interface travada por caractere.
  const [search, setSearch] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [statusFilter, setStatusFilter] = useState<"TODAS" | BetResult>("TODAS");
  // Listas vazias = sem filtro. Ver SeletorMultiplo para o porquê.
  const [sportsFilter, setSportsFilter] = useState<string[]>([]);
  const [bookiesFilter, setBookiesFilter] = useState<string[]>([]);
  const [admsFilter, setAdmsFilter] = useState<string[]>([]);
  // Intervalo em "YYYY-MM-DD"; string vazia deixa o lado em aberto.
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [oddRangeFilter, setOddRangeFilter] = useState<
    "TODAS" | "BAIXA" | "MEDIA" | "ALTA"
  >("TODAS");

  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [visiveis, setVisiveis] = useState(APOSTAS_POR_BLOCO);
  const [selectedBet, setSelectedBet] = useState<BetItem | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setBuscaAplicada(search), 250);
    return () => clearTimeout(id);
  }, [search]);

  // Trocar de aba zera os recortes presos ao mês anterior: as datas não
  // existem na aba nova e as casas/esportes podem não existir também.
  useEffect(() => {
    setDe("");
    setAte("");
    setSportsFilter([]);
    setBookiesFilter([]);
    setAdmsFilter([]);
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

  // O campo interno se chama `tipster` porque espelha a coluna da planilha. Na
  // tela é "adm", e é assim que o grupo fala.
  const adms = useMemo(
    () =>
      Array.from(new Set(bets.map((b) => b.tipster)))
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

  // Extremos da aba, para o calendário não abrir em dia sem aposta nenhuma.
  const limitesDeData = useMemo(() => {
    if (availableDays.length === 0) return { min: undefined, max: undefined };
    return {
      min: paraISO(availableDays[availableDays.length - 1]) || undefined,
      max: paraISO(availableDays[0]) || undefined,
    };
  }, [availableDays]);

  // Um Map em vez de um filter por opção: com 99 casas o segundo caminho
  // varria a lista inteira uma vez por linha do menu.
  const contagemPorEsporte = useMemo(() => {
    const m = new Map<string, number>();
    bets.forEach((b) => {
      if (b.esporte) m.set(b.esporte, (m.get(b.esporte) ?? 0) + 1);
    });
    return m;
  }, [bets]);

  const contagemPorCasa = useMemo(() => {
    const m = new Map<string, number>();
    bets.forEach((b) => {
      if (b.casa) m.set(b.casa, (m.get(b.casa) ?? 0) + 1);
    });
    return m;
  }, [bets]);

  const contagemPorAdm = useMemo(() => {
    const m = new Map<string, number>();
    bets.forEach((b) => {
      if (b.tipster) m.set(b.tipster, (m.get(b.tipster) ?? 0) + 1);
    });
    return m;
  }, [bets]);

  const filteredBets = useMemo(() => {
    const termo = buscaAplicada.toLowerCase();
    const deTs = timestampDoISO(de);
    const ateTs = timestampDoISO(ate);
    return bets.filter((bet) => {
      const matchesSearch =
        termo === "" ||
        bet.partida.toLowerCase().includes(termo) ||
        bet.tip.toLowerCase().includes(termo) ||
        bet.casa.toLowerCase().includes(termo) ||
        bet.tipster.toLowerCase().includes(termo);

      const matchesStatus = statusFilter === "TODAS" || bet.resultado === statusFilter;
      const matchesSport =
        sportsFilter.length === 0 || sportsFilter.includes(bet.esporte);
      const matchesBookie =
        bookiesFilter.length === 0 || bookiesFilter.includes(bet.casa);
      const matchesAdm = admsFilter.length === 0 || admsFilter.includes(bet.tipster);

      // Intervalo fechado dos dois lados quando ambos estão preenchidos.
      let matchesDay = true;
      if (deTs || ateTs) {
        const ts = parseDateTimestamp(bet.data);
        if (ts === 0) matchesDay = false;
        else if (deTs && ts < deTs) matchesDay = false;
        else if (ateTs && ts > ateTs) matchesDay = false;
      }

      let matchesOdd = true;
      if (oddRangeFilter === "BAIXA") matchesOdd = bet.odd < 1.8;
      else if (oddRangeFilter === "MEDIA") matchesOdd = bet.odd >= 1.8 && bet.odd <= 3.0;
      else if (oddRangeFilter === "ALTA") matchesOdd = bet.odd > 3.0;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesSport &&
        matchesBookie &&
        matchesAdm &&
        matchesOdd &&
        matchesDay
      );
    });
  }, [
    bets,
    buscaAplicada,
    statusFilter,
    sportsFilter,
    bookiesFilter,
    admsFilter,
    de,
    ate,
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

  // Volta ao primeiro bloco sempre que o recorte muda, senão o visitante
  // continuaria vendo 500 linhas depois de restringir o filtro.
  useEffect(() => {
    setVisiveis(APOSTAS_POR_BLOCO);
  }, [
    buscaAplicada,
    statusFilter,
    sportsFilter,
    bookiesFilter,
    admsFilter,
    de,
    ate,
    oddRangeFilter,
    activeTab,
  ]);

  /**
   * O que de fato vai para a tela. Os totais do resumo continuam saindo de
   * `filteredBets` — o recorte é do desenho, não da conta.
   */
  const betsVisiveis = useMemo(
    () => filteredBets.slice(0, visiveis),
    [filteredBets, visiveis]
  );
  const restantes = filteredBets.length - betsVisiveis.length;

  /** Frase curta do recorte de data, para o subtítulo dizer o que está na tela. */
  const periodo = rotuloDoPeriodo(de, ate);

  const trecho = trechoDaAba(activeTab);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, BetItem[]>();
    betsVisiveis.forEach((bet) => {
      const list = map.get(bet.data) || [];
      list.push(bet);
      map.set(bet.data, list);
    });
    return Array.from(map.entries()).sort(
      (a, b) => parseDateTimestamp(b[0]) - parseDateTimestamp(a[0])
    );
  }, [betsVisiveis]);

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
      <BarraDeProgresso ativo={loading} />
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="font-serif text-3xl sm:text-4xl text-[var(--text)] tracking-tight">
            Feed de Apostas
          </h1>
          <p className="text-sm text-[var(--text-2)] mt-1 font-sans">
            Feed cronológico lido {trecho.prefixo}{" "}
            <span className="font-semibold text-[var(--text)]">{trecho.nome}</span>
            {periodo && <span> ({periodo})</span>}.
          </p>
          <LinkPlanilha className="mt-2" />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* biome-ignore lint/a11y/useSemanticElements: o que a regra pede no lugar é <fieldset>, que traz borda, margem e padding do navegador e existe para agrupar campo de formulário — não uma barra de botões. */}
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
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--text-2)] hover:text-[var(--accent)]"
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
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--text-2)] hover:text-[var(--accent)]"
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
          <div className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider">
            Lucro do Filtro
          </div>
          <div
            className={`font-mono text-xl sm:text-2xl font-bold mt-1 tracking-tight ${
              resumo.lucro >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
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
          <div className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider">
            Green / Red
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold mt-1 tracking-tight">
            <span className="text-[var(--green)]">{formatarInteiro(resumo.greens)}</span>{" "}
            <span className="text-[var(--text-3)] font-normal text-sm">/</span>{" "}
            <span className="text-[var(--red)]">{formatarInteiro(resumo.reds)}</span>
            {resumo.voids > 0 && (
              <span className="text-[var(--text-2)] text-sm font-normal">
                {" "}
                · {formatarInteiro(resumo.voids)} void
              </span>
            )}
          </div>
        </div>

        <div className="bg-white border border-black/[0.07] rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider">
            Taxa de Acerto
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-[var(--text)] mt-1 tracking-tight">
            {resumo.greens + resumo.reds > 0 ? (
              <NumberFlow value={resumo.taxa} locales="pt-BR" suffix="%" />
            ) : (
              "—"
            )}
          </div>
        </div>

        <div className="bg-white border border-black/[0.07] rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider">
            ROI do Filtro
          </div>
          <div
            className={`font-mono text-xl sm:text-2xl font-bold mt-1 tracking-tight ${
              resumo.roi >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
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
          <div className="text-[10.5px] text-[var(--text-3)] mt-0.5">
            odd média {resumo.odd > 0 ? formatarOdd(resumo.odd) : "—"}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Filtros */}
        <div className="bg-white border border-black/[0.07] rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search
                className="w-4 h-4 text-[var(--text-3)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
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
                className="w-full bg-[var(--bg)] border border-black/[0.06] rounded-full pl-9 pr-3.5 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--text-3)] outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>

            {/* biome-ignore lint/a11y/useSemanticElements: o que a regra pede no
                  lugar é <fieldset>, que chega com borda, margem e padding do
                  navegador e existe para agrupar campo de formulário. Aqui é uma
                  barra de pílulas: trocar custaria regressão visual sem ganho de
                  leitura. */}
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
                        ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                        : "bg-white text-[var(--text-2)] border-black/[0.08] hover:border-[var(--accent)] hover:text-[var(--accent)]"
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
              <FiltroPeriodo
                de={de}
                ate={ate}
                onChange={(novoDe, novoAte) => {
                  setDe(novoDe);
                  setAte(novoAte);
                }}
                min={limitesDeData.min}
                max={limitesDeData.max}
              />

              <SeletorMultiplo
                rotuloVazio="Todos os Esportes"
                substantivo="esportes"
                opcoes={sports}
                selecionadas={sportsFilter}
                onChange={setSportsFilter}
                contagem={contagemPorEsporte}
              />

              <SeletorMultiplo
                rotuloVazio="Todas as Casas"
                substantivo="casas"
                opcoes={bookies}
                selecionadas={bookiesFilter}
                onChange={setBookiesFilter}
                contagem={contagemPorCasa}
              />

              <SeletorMultiplo
                rotuloVazio="Todos os Adms"
                substantivo="adms"
                opcoes={adms}
                selecionadas={admsFilter}
                onChange={setAdmsFilter}
                contagem={contagemPorAdm}
              />
            </div>

            {/* biome-ignore lint/a11y/useSemanticElements: o que a regra pede no
                  lugar é <fieldset>, que chega com borda, margem e padding do
                  navegador e existe para agrupar campo de formulário. Aqui é uma
                  barra de pílulas: trocar custaria regressão visual sem ganho de
                  leitura. */}
            <div
              className="flex items-center gap-1"
              role="group"
              aria-label="Filtrar por faixa de odd"
            >
              <span className="text-[11px] font-medium text-[var(--text-3)] mr-1">
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
                      ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                      : "bg-white text-[var(--text-2)] border-black/[0.08] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Top Adms em faixa, e não mais em coluna lateral.
              A lateral custava um terço da largura da tela para mostrar quatro
              linhas, e o feed — que é o assunto da página — ficava espremido em
              8/12 do começo ao fim da rolagem. Aqui o ranking continua visível
              sem cobrar largura de ninguém, e /adms segue sendo a tela completa
              do assunto. */}
        {topAdms.length > 0 && (
          <section
            aria-labelledby="titulo-top-adms"
            className="bg-white border border-black/[0.07] rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <h2
                id="titulo-top-adms"
                className="text-xs font-bold uppercase tracking-wider text-[var(--text-3)]"
              >
                Top Adms ({rotuloDaAba(activeTab)})
              </h2>
              <Award className="w-4 h-4 text-[var(--green)]" aria-hidden="true" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
              {topAdms.map((adm, i) => (
                <div key={adm.nome} className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-xs font-bold text-[var(--text-3)] shrink-0">
                    #{i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[var(--text)] truncate">
                      {adm.nome}
                    </div>
                    <div className="text-[10.5px] text-[var(--text-3)] whitespace-nowrap">
                      {formatarInteiro(adm.total)} tips ·{" "}
                      {adm.winRate.toFixed(1).replace(".", ",")}% acerto
                    </div>
                  </div>
                  <span
                    className={`font-mono text-xs font-bold shrink-0 ml-auto ${
                      adm.profit >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
                    }`}
                  >
                    {formatarReaisComSinal(converter(adm.profit))}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Feed */}
        {mostrarEsqueleto ? (
          <SkeletonLinhas quantidade={6} altura="h-20" />
        ) : erro ? null : filteredBets.length === 0 ? (
          <div className="bg-white border border-black/[0.07] rounded-2xl p-16 text-center">
            <p className="text-sm font-medium text-[var(--text-3)]">
              {bets.length === 0
                ? `Nenhuma aposta registrada ${trecho.prefixo} ${trecho.nome}.`
                : "Nenhuma aposta corresponde aos filtros."}
            </p>
          </div>
        ) : viewMode === "cards" ? (
          <div className="space-y-6 animate-entrada">
            {groupedByDate.map(([date, dayBets]) => {
              const lucroDia = dayBets.reduce((acc, b) => acc + b.lucro, 0);
              // Sem `layout` do framer: ela anima mudanças de tamanho por
              // transform, e ao mudar a altura das linhas a seção inteira
              // travou em scaleY(11.67) com translateY de 1504px — o feed
              // ficava esticado e ilegível. Mesmo motivo pelo qual o
              // AnimatePresence saiu das linhas.
              return (
                <section key={date} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xs font-mono font-bold text-[var(--text)]">
                      {date}
                    </h2>
                    <span className="text-[11px] text-[var(--text-3)]">
                      ({dayBets.length} {dayBets.length === 1 ? "aposta" : "apostas"})
                    </span>
                    <div className="flex-1 h-px bg-black/[0.06]" />
                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        lucroDia >= 0
                          ? "bg-[var(--green-soft)] text-[var(--green)]"
                          : "bg-[var(--red-soft)] text-[var(--red)]"
                      }`}
                    >
                      {formatarReaisComSinal(converter(lucroDia))}
                    </span>
                  </div>

                  {/* Sem AnimatePresence de propósito.
                        Com ela (mode="popLayout"), remover muitos itens de uma vez
                        — o que acontece a cada troca de filtro — deixava os antigos
                        presos no DOM e VISÍVEIS: o rodapé dizia "Exibindo 100" com
                        301 linhas na tela. Sair sem animação é determinístico; a
                        animação de entrada continua funcionando. */}
                  {dayBets.map((bet) => {
                    const isGreen = bet.resultado === "GREEN";
                    const isRed = bet.resultado === "RED";
                    const isVoid = bet.resultado === "VOID";

                    return (
                      <motion.button
                        key={bet.id}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        type="button"
                        onClick={() => setSelectedBet(bet)}
                        aria-label={`Ver detalhes: ${bet.partida}, ${bet.tip}`}
                        className="w-full text-left bg-white border border-black/[0.07] rounded-xl overflow-hidden shadow-sm focus-visible:ring-2 focus-visible:ring-[var(--accent)] cursor-pointer hover:-translate-y-0.5 hover:shadow-card active:translate-y-0 transition-[transform,box-shadow] duration-150 grid grid-cols-[5px_1fr] group mb-2"
                      >
                        <div
                          className={
                            isGreen
                              ? "bg-[var(--green)]"
                              : isRed
                                ? "bg-[var(--red)]"
                                : isVoid
                                  ? "bg-[var(--text-3)]"
                                  : "bg-[var(--amber)]"
                          }
                        />

                        <div className="p-3.5 sm:p-4 space-y-2 min-w-0">
                          {/* Linha 1 — quebra no mobile em vez de ser cortada */}
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                            <SportBadge sport={bet.esporte} />
                            <span className="text-[13.5px] font-bold text-[var(--text)] tracking-tight group-hover:text-[var(--accent)] transition-colors min-w-0 flex-1 truncate">
                              {bet.partida}
                            </span>
                            <BookieBadge bookie={bet.casa} />
                          </div>

                          {/* Linha 2 — odd, valor, status e lucro sempre visíveis */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-1.5 border-t border-black/[0.04]">
                            {/* No mobile a tip ocupa a linha inteira; a
                                    partir de sm divide espaço com o resto. */}
                            <span className="text-xs text-[var(--text-2)] font-medium w-full sm:w-auto sm:min-w-0 sm:flex-1 truncate">
                              {bet.tip}
                            </span>

                            {bet.tipster && bet.tipster !== "Geral" && (
                              <span className="text-[10px] text-[var(--text-3)] px-1.5 py-0.5 bg-[var(--bg)] rounded shrink-0">
                                {bet.tipster}
                              </span>
                            )}

                            <span className="text-xs font-mono font-bold text-[var(--text)] bg-[var(--bg)] px-2 py-0.5 rounded border border-black/[0.04] shrink-0">
                              @{formatarOdd(bet.odd)}
                            </span>

                            <span className="text-xs font-mono text-[var(--text-2)] shrink-0">
                              {formatarReais(converter(bet.valor))}
                            </span>

                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider shrink-0 ${
                                isGreen
                                  ? "bg-[var(--green-soft)] text-[var(--green)]"
                                  : isRed
                                    ? "bg-[var(--red-soft)] text-[var(--red)]"
                                    : isVoid
                                      ? "bg-[var(--text-2-soft)] text-[var(--text-2)]"
                                      : "bg-[var(--amber-soft)] text-[var(--amber)]"
                              }`}
                            >
                              {bet.resultado}
                            </span>

                            <span
                              className={`font-mono text-xs font-bold shrink-0 ${
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
                      </motion.button>
                    );
                  })}
                </section>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto animate-entrada">
              <table className="w-full text-left text-xs">
                <caption className="sr-only">
                  Apostas registradas {trecho.prefixo} {trecho.nome}
                </caption>
                <thead className="bg-[var(--bg-soft)] border-b border-black/[0.06] text-[var(--text-3)] uppercase tracking-wider text-[10px] font-bold">
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
                  {betsVisiveis.map((bet) => {
                    const isGreen = bet.resultado === "GREEN";
                    const isRed = bet.resultado === "RED";
                    const isVoid = bet.resultado === "VOID";
                    return (
                      <tr
                        key={bet.id}
                        onClick={() => setSelectedBet(bet)}
                        className="hover:bg-[var(--bg-soft)] cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-4 font-mono text-[11px] text-[var(--text-2)] whitespace-nowrap">
                          {bet.data}
                        </td>
                        <td className="py-2.5 px-3">
                          <SportBadge sport={bet.esporte} />
                        </td>
                        <td className="py-2.5 px-4 max-w-xs">
                          {/* A linha inteira abre o detalhe no clique, mas <tr>
                                não recebe foco: pelo teclado a tabela não abria
                                nada. O botão no nome da partida é esse caminho. */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBet(bet);
                            }}
                            className="block max-w-full text-left font-bold text-[var(--text)] truncate hover:text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
                          >
                            {bet.partida}
                          </button>
                          <div className="text-[11px] text-[var(--text-2)] truncate">
                            {bet.tip}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <BookieBadge bookie={bet.casa} />
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-right text-[var(--text)]">
                          {formatarOdd(bet.odd)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-right text-[var(--text-2)] whitespace-nowrap">
                          {formatarReais(converter(bet.valor))}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                              isGreen
                                ? "bg-[var(--green-soft)] text-[var(--green)]"
                                : isRed
                                  ? "bg-[var(--red-soft)] text-[var(--red)]"
                                  : isVoid
                                    ? "bg-[var(--text-2-soft)] text-[var(--text-2)]"
                                    : "bg-[var(--amber-soft)] text-[var(--amber)]"
                            }`}
                          >
                            {bet.resultado}
                          </span>
                        </td>
                        <td
                          className={`py-2.5 px-4 font-mono font-bold text-right whitespace-nowrap ${
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {restantes > 0 && (
          <div className="mt-5 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setVisiveis((v) => v + APOSTAS_POR_BLOCO)}
              className="px-6 py-2.5 bg-[var(--accent)] text-white text-sm font-bold rounded-full hover:bg-[var(--accent-hover)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-all"
            >
              Mostrar mais {Math.min(restantes, APOSTAS_POR_BLOCO)}
            </button>
            <p className="text-[11px] text-[var(--text-3)]">
              Exibindo {formatarInteiro(betsVisiveis.length)} de{" "}
              {formatarInteiro(filteredBets.length)} apostas
            </p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <SecaoTelegram />
      </div>

      {/* Sem AnimatePresence: o diálogo desmonta direto, e o porquê está em
          Dialogo.tsx — animar a saída deixava o véu preso no DOM engolindo
          clique, três vezes neste projeto. */}
      {selectedBet && (
        <DetalheAposta
          bet={selectedBet}
          onFechar={fecharDetalhe}
          onCopiar={handleCopyBet}
          copiado={copied}
          converter={converter}
        />
      )}
    </div>
  );
}
