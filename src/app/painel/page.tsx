"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { NumeroAnimado } from "@/components/NumeroAnimado";
import { SportBadge } from "@/components/SportBadge";
import { BookieBadge } from "@/components/BookieBadge";
import { SeletorAba } from "@/components/SeletorAba";
import { AvisoErro, AvisoMock } from "@/components/AvisoDados";
import { SkeletonKpis, SkeletonLinhas } from "@/components/Skeleton";
import { BarraDeProgresso } from "@/components/BarraDeProgresso";
import { BlocoDeRisco } from "@/components/BlocoDeRisco";
import { useBets } from "@/hooks/useBets";
import { useEstadoNaUrl } from "@/hooks/useEstadoNaUrl";
import { SecaoTelegram } from "@/components/Telegram";
import { LinkPlanilha } from "@/components/LinkPlanilha";
import { useUnidade } from "@/hooks/useUnidade";
import { SeletorUnidade } from "@/components/SeletorUnidade";
import { FiltroPeriodo } from "@/components/FiltroPeriodo";
import { paraISO, parseDateTimestamp, rotuloDoPeriodo, timestampDoISO } from "@/lib/date";
import { ABA_TODOS, rotuloDaAba, trechoDaAba } from "@/lib/constants";
import {
  abaDoEndereco,
  abaParaEndereco,
  comAba,
  escolher,
  lerData,
} from "@/lib/endereco";
import {
  formatarInteiro,
  formatarOdd,
  formatarReais,
  formatarReaisComSinal,
  formatarUnidades,
  tamanhoDoValor,
  tempoRelativo,
} from "@/lib/format";
import { calcularRoi, computeStatsFromBets, taxaDeAcerto } from "@/lib/stats";
import { maiorQueda } from "@/lib/risco";
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
    mostrarEsqueleto,
    erro,
    isMock,
    lidoEm,
    recarregar,
  } = useBets();

  const { converter } = useUnidade();

  const [period, setPeriod] = useState<"7D" | "30D" | "90D" | "120D" | "Tudo">("30D");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [hoveredPoint, setHoveredPoint] = useState<
    (DayPoint & { x: number; y: number }) | null
  >(null);

  // Sem isto o selo diria "agora" indefinidamente numa aba deixada aberta.
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  // A aba que chegou pelo endereço, com o intervalo e a janela junto.
  const abaDoLink = useRef<string | null>(null);

  useEffect(() => {
    // Trocar de aba volta intervalo e janela ao padrão — menos quando a aba veio
    // do endereço, que trouxe os dois junto e seriam apagados aqui.
    if (abaDoLink.current === activeTab) {
      abaDoLink.current = null;
      return;
    }
    setDe("");
    setAte("");
    setHoveredPoint(null);
    setPeriod(activeTab === ABA_TODOS ? "Tudo" : "30D");
  }, [activeTab]);

  const periodoAtivo = de !== "" || ate !== "";
  const periodo = rotuloDoPeriodo(de, ate);

  // Extract unique available days for the current tab
  const availableDays = useMemo(() => {
    const dates = Array.from(new Set(allBets.map((b) => b.data))).filter(
      (d) => d && d !== "—"
    );
    dates.sort((a, b) => parseDateTimestamp(b) - parseDateTimestamp(a));
    return dates;
  }, [allBets]);

  /**
   * Quantos dias de calendário a aba cobre, da primeira aposta à última.
   */
  const diasDaAba = useMemo(() => {
    if (availableDays.length === 0) return 0;
    const maisNovo = parseDateTimestamp(availableDays[0]);
    const maisAntigo = parseDateTimestamp(availableDays[availableDays.length - 1]);
    return Math.round((maisNovo - maisAntigo) / 86_400_000) + 1;
  }, [availableDays]);

  /**
   * As janelas que fazem diferença nesta aba.
   *
   * Janela maior que o próprio recorte desenha exatamente o mesmo traço que
   * "Tudo": numa aba de mês, 30D, 90D e Tudo eram três botões para o mesmo
   * gráfico — três jeitos de não mudar nada. Só entra janela menor que o
   * intervalo coberto pela aba; "Tudo" fica sempre.
   */
  const availablePeriods: readonly ("7D" | "30D" | "90D" | "120D" | "Tudo")[] = useMemo(
    () => [
      ...(["7D", "30D", "90D", "120D"] as const).filter(
        (j) => DIAS_DO_PERIODO[j] < diasDaAba
      ),
      "Tudo" as const,
    ],
    [diasDaAba]
  );

  // A janela escolhida pode não existir na aba nova (ou some quando a aba
  // encolhe); sem isto o botão pressionado sumia da tela e o gráfico ficava
  // preso numa janela que ninguém conseguia mais trocar.
  //
  // Só depois que a aba tem dados: antes deles `diasDaAba` é 0, toda janela
  // ficaria "grande demais", e a tela abria em "Tudo" antes de saber o que a
  // aba cobre — trocando o padrão de 30D por acidente.
  useEffect(() => {
    if (diasDaAba > 0 && !availablePeriods.includes(period)) setPeriod("Tudo");
  }, [availablePeriods, period, diasDaAba]);

  // A janela que a aba escolhe sozinha — e que por isso não vai ao endereço.
  // Não é sempre 30D: num mês de 21 dias a janela de 30 não existe, a tela cai
  // em "Tudo" por conta própria, e tratar isso como escolha da pessoa sujava o
  // endereço com "janela=Tudo" em quem só abriu o Painel.
  const janelaPadrao =
    activeTab === ABA_TODOS || !availablePeriods.includes("30D") ? "Tudo" : "30D";

  // Aba, intervalo e janela no endereço: o Painel de Abril26 com a janela de
  // 7 dias vira um link que abre exatamente isso. Só escreve com os dados na
  // tela: antes deles a aba ainda não sabe quais janelas tem, e o endereço
  // piscaria com um padrão errado.
  useEstadoNaUrl(
    {
      aba: abaParaEndereco(activeTab),
      de,
      ate,
      janela: period === janelaPadrao ? "" : period,
    },
    (lidos) => {
      const aba = abaDoEndereco(lidos.aba);
      if (aba && aba !== activeTab) {
        abaDoLink.current = aba;
        setActiveTab(aba);
      }
      setDe(lerData(lidos.de));
      setAte(lerData(lidos.ate));
      const janela = escolher(lidos.janela, [
        "7D",
        "30D",
        "90D",
        "120D",
        "Tudo",
      ] as const);
      if (janela) setPeriod(janela);
    },
    !loading
  );

  // Extremos da aba, para o calendário não abrir em dia sem aposta nenhuma.
  const limitesDeData = useMemo(() => {
    if (availableDays.length === 0) return { min: undefined, max: undefined };
    return {
      min: paraISO(availableDays[availableDays.length - 1]) || undefined,
      max: paraISO(availableDays[0]) || undefined,
    };
  }, [availableDays]);

  // Aggregate daily points in ascending chronological order (oldest to newest)
  const allDailyPoints: DayPoint[] = useMemo(() => {
    if (!allBets || allBets.length === 0) return [];

    const map = new Map<
      string,
      {
        timestamp: number;
        dayProfit: number;
        greens: number;
        reds: number;
        total: number;
      }
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
    // A planilha traz apostas pendentes de jogos que ainda vão acontecer. Elas
    // não podem entrar na curva: têm lucro 0 e desenhariam uma reta plana no
    // futuro, como se a banca tivesse parado de crescer.
    const fimDeHoje = new Date();
    fimDeHoje.setHours(23, 59, 59, 999);
    const ateHoje = allDailyPoints.filter((p) => p.timestamp <= fimDeHoje.getTime());

    // Intervalo escolhido à mão vence a janela: são dois controles do mesmo
    // eixo, e deixar os dois valendo ao mesmo tempo é o que confunde. Por isso
    // os botões de janela também somem da tela enquanto há intervalo.
    if (periodoAtivo) {
      const deTs = timestampDoISO(de);
      const ateTs = timestampDoISO(ate);
      return ateHoje.filter(
        (p) => (!deTs || p.timestamp >= deTs) && (!ateTs || p.timestamp <= ateTs)
      );
    }

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
  }, [allDailyPoints, period, periodoAtivo, de, ate]);

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

    // Com um único ponto a divisão dá 0 e ele encostaria na borda esquerda,
    // como se o gráfico estivesse cortado. Centralizar deixa claro que é um
    // dia só — acontece todo começo de mês com o intervalo curto.
    const umPontoSo = chartPoints.length === 1;
    const points = chartPoints.map((p, i) => {
      const x = umPontoSo
        ? padLeft + drawW / 2
        : padLeft + (i / Math.max(chartPoints.length - 1, 1)) * drawW;
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
    const periodGain =
      lastPoint.cumProfit - (firstPoint.cumProfit - firstPoint.dayProfit);

    // Maior queda de um pico até o vale seguinte. É a métrica de risco que
    // falta quando só se olha lucro e ROI: diz quanto a banca chegou a
    // devolver antes de recuperar.
    //
    // A conta é a mesma do bloco de risco (lib/risco.ts), partindo de onde a
    // curva estava na véspera da janela. Antes o pico começava no primeiro
    // ponto, e um primeiro dia negativo não contava como queda.
    const drawdown = maiorQueda(
      points.map((p) => p.cumProfit),
      firstPoint.cumProfit - firstPoint.dayProfit
    ).valor;

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
  const chartKey = `${activeTab}-${period}-${de}-${ate}-${chartPoints.length}-${
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

  /**
   * O recorte que vale para a tela inteira.
   *
   * Antes isto era um dia só, e dois blocos — Top Esportes e Ranking de
   * Adms — ficavam de fora com uma nota explicando a contradição: num dia com
   * três apostas, a distribuição vira um esporte só. Com intervalo a objeção
   * cai, quinze dias têm volume de sobra, e a tela inteira passa a dizer a
   * mesma coisa.
   */
  const scopedBets = useMemo(() => {
    if (!periodoAtivo) return allBets;
    const deTs = timestampDoISO(de);
    const ateTs = timestampDoISO(ate);
    return allBets.filter((b) => {
      const ts = parseDateTimestamp(b.data);
      if (ts === 0) return false;
      if (deTs && ts < deTs) return false;
      if (ateTs && ts > ateTs) return false;
      return true;
    });
  }, [allBets, periodoAtivo, de, ate]);

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

  /**
   * Esportes e adms saem do recorte, não da aba inteira.
   *
   * O servidor manda os agregados da aba prontos, e eles continuam valendo
   * quando não há intervalo. Com intervalo é preciso recalcular — e sai de
   * graça, porque esta tela já baixa todas as apostas para desenhar o gráfico.
   */
  const statsDoRecorte = useMemo(
    () => (periodoAtivo ? computeStatsFromBets(scopedBets) : null),
    [periodoAtivo, scopedBets]
  );
  const sports = statsDoRecorte?.sports ?? stats?.sports ?? [];
  const tipsters = statsDoRecorte?.tipsters ?? stats?.tipsters ?? [];
  // Oito no Painel: é um resumo, e o caminho para a lista inteira está no
  // rodapé do bloco.
  const casas = (statsDoRecorte?.bookies ?? stats?.bookies ?? []).slice(0, 8);
  const recentBets = scopedBets.slice(0, 6);
  const trecho = trechoDaAba(activeTab);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <BarraDeProgresso ativo={loading} />
      {/* Header with Month & Day Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        {/* min-w-0: sem isso o parágrafo cresce ao filtrar um dia e espreme os
            filtros até quebrarem em duas linhas. Quem reflui é o texto. */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl sm:text-4xl text-[var(--text)] tracking-tight">
              Painel de Performance
            </h1>
            {/* Só afirma "ao vivo" quando a leitura realmente veio da planilha */}
            {/* Afirmar "ao vivo" sem dizer de quando é o dado era a única
                informação não auditável de uma página que vive de auditoria. */}
            {!erro && !isMock && !loading && (
              <span
                className="px-2.5 py-0.5 bg-[var(--green-soft)] text-[var(--green)] text-xs font-bold rounded-full"
                title={
                  lidoEm
                    ? `Leitura da planilha em ${new Date(lidoEm).toLocaleString("pt-BR")}`
                    : undefined
                }
              >
                Atualizado{lidoEm ? ` · ${tempoRelativo(lidoEm, agora)}` : ""}
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--text-2)] mt-1 font-sans">
            Métricas consolidadas, evolução real da banca e atividades {trecho.prefixo}{" "}
            <span className="font-semibold text-[var(--text)]">{trecho.nome}</span>
            {periodo && (
              <span>
                {" "}
                (<strong>{periodo}</strong>)
              </span>
            )}
            .
          </p>
          <LinkPlanilha className="mt-2" />
        </div>

        {/* Controles de tamanho fixo: nunca encolhem nem quebram a partir de sm.
            Abaixo disso o cabeçalho já empilha e a quebra é bem-vinda. */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap sm:shrink-0">
          {/* Substituiu o antigo seletor de dia. Um dia continua possível —
              é `de` igual a `até` —, e o intervalo cobre o que aquele não
              cobria: a quinzena, a semana, os últimos dez dias. */}
          <FiltroPeriodo
            de={de}
            ate={ate}
            onChange={(novoDe, novoAte) => {
              setDe(novoDe);
              setAte(novoAte);
              setHoveredPoint(null);
            }}
            min={limitesDeData.min}
            max={limitesDeData.max}
          />

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

      {/* 5 KPIs.
          <section> com nome acessível vira marco de navegação. Antes os cinco
          blocos eram div solta e não havia como pular entre eles com leitor de
          tela. */}
      {mostrarEsqueleto ? (
        <SkeletonKpis quantidade={5} grade="cinco" />
      ) : (
        // Duas colunas já no celular: um por linha, os cinco números custavam
        // quase uma tela inteira de rolagem antes do gráfico. O quinto ocupa a
        // linha toda até o `lg`, onde a grade fecha em três e depois em cinco.
        <section
          aria-label="Indicadores do período"
          className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 animate-entrada"
        >
          <div className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-4 sm:p-5 shadow-sm transition-all space-y-3 min-w-0">
            <div className="flex items-center justify-between text-[var(--text-3)]">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {periodoAtivo ? "Lucro no Período" : "Lucro Acumulado"}
              </span>
              <div
                className={`hidden sm:flex w-8 h-8 rounded-lg items-center justify-center ${
                  totalLucro >= 0
                    ? "bg-[var(--green-soft)] text-[var(--green)]"
                    : "bg-[var(--red-soft)] text-[var(--red)]"
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
                formatarReaisComSinal(totalLucro),
                true
              )} tracking-tight leading-none ${
                totalLucro >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
              }`}
            >
              <NumeroAnimado
                value={totalLucro}
                locales="pt-BR"
                format={{
                  style: "currency",
                  currency: "BRL",
                  signDisplay: "always",
                }}
              />
            </div>
            <div className="text-xs font-medium text-[var(--text-2)] pt-1 border-t border-tinta/[0.04]">
              {periodoAtivo
                ? `Resultado ${periodo}`
                : activeTab === ABA_TODOS
                  ? "Resultado de todos os meses"
                  : `Resultado total em ${activeTab}`}
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-4 sm:p-5 shadow-sm transition-all space-y-3 min-w-0">
            <div className="flex items-center justify-between text-[var(--text-3)]">
              <span className="text-[11px] font-bold uppercase tracking-wider">ROI</span>
              <div className="hidden sm:flex w-8 h-8 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`font-serif ${tamanhoDoValor(
                `${roi.toFixed(2)}%`,
                true
              )} tracking-tight leading-none ${
                roi >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
              }`}
            >
              <NumeroAnimado
                value={roi}
                locales="pt-BR"
                format={{ signDisplay: "always", maximumFractionDigits: 2 }}
                suffix="%"
              />
            </div>
            {/* O ROI daqui conta anuladas e pendentes no investido, como a
                planilha. Quem compara com outro grupo precisa saber disso, e a
                explicação mora em /perguntas. */}
            <div className="text-xs font-medium text-[var(--text-2)] pt-1 border-t border-tinta/[0.04]">
              <Link
                href="/perguntas#roi"
                className="inline-block py-[5px] -my-[5px] underline decoration-dotted decoration-tinta/30 underline-offset-2 hover:text-[var(--accent)] hover:decoration-[var(--accent)] transition-colors"
              >
                Lucro sobre o total apostado
              </Link>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-4 sm:p-5 shadow-sm transition-all space-y-3 min-w-0">
            <div className="flex items-center justify-between text-[var(--text-3)]">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Total de Apostas
              </span>
              <div className="hidden sm:flex w-8 h-8 rounded-lg bg-[var(--text-soft)] text-[var(--text)] items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`font-serif ${tamanhoDoValor(
                String(totalBets),
                true
              )} text-[var(--text)] tracking-tight leading-none`}
            >
              <NumeroAnimado value={totalBets} locales="pt-BR" />
            </div>
            <div className="text-xs font-medium text-[var(--text-2)] pt-1 border-t border-tinta/[0.04]">
              {formatarInteiro(greens)} Green · {formatarInteiro(reds)} Red
              {voids > 0 && ` · ${formatarInteiro(voids)} Void`}
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-4 sm:p-5 shadow-sm transition-all space-y-3 min-w-0">
            <div className="flex items-center justify-between text-[var(--text-3)]">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Taxa de Acerto
              </span>
              <div className="hidden sm:flex w-8 h-8 rounded-lg bg-[var(--green-soft)] text-[var(--green)] items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="font-serif text-2xl sm:text-4xl text-[var(--text)] tracking-tight leading-none">
              <NumeroAnimado value={taxaAcerto} locales="pt-BR" suffix="%" />
            </div>
            <div className="text-xs font-medium text-[var(--text-2)] pt-1 border-t border-tinta/[0.04]">
              Das apostas finalizadas
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-4 sm:p-5 shadow-sm transition-all space-y-3 min-w-0 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-[var(--text-3)]">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Apostas Pendentes
              </span>
              <div
                className={`hidden sm:flex w-8 h-8 rounded-lg items-center justify-center ${
                  pendentes > 0
                    ? "bg-[var(--amber-soft)] text-[var(--amber)]"
                    : "bg-[var(--text-soft)] text-[var(--text-3)]"
                }`}
              >
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`font-serif text-2xl sm:text-4xl tracking-tight leading-none ${
                pendentes > 0 ? "text-[var(--amber)]" : "text-[var(--text)]"
              }`}
            >
              <NumeroAnimado value={pendentes} locales="pt-BR" />
            </div>
            {/* Zero pendência é a situação boa, não um alerta — âmbar só quando há. */}
            <div
              className={`text-xs font-medium pt-1 border-t border-tinta/[0.04] ${
                pendentes > 0 ? "text-[var(--amber)]" : "text-[var(--text-2)]"
              }`}
            >
              {pendentes > 0
                ? "Aguardando resultado oficial"
                : "Tudo com resultado lançado"}
            </div>
          </div>
        </section>
      )}

      {/* Middle Section: Real Dynamic Chart (8 cols) + Sport Breakdown (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Real Chart Box */}
        <section
          aria-labelledby="titulo-evolucao"
          className="lg:col-span-8 bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2
                  id="titulo-evolucao"
                  className="text-base font-bold text-[var(--text)] tracking-tight"
                >
                  Evolução da Banca ({rotuloDaAba(activeTab)})
                </h2>
                {chartData && (
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
                      chartData.periodGain >= 0
                        ? "bg-[var(--green-soft)] text-[var(--green)]"
                        : "bg-[var(--red-soft)] text-[var(--red)]"
                    }`}
                  >
                    <NumeroAnimado
                      value={chartData.periodGain}
                      locales="pt-BR"
                      format={{
                        style: "currency",
                        currency: "BRL",
                        signDisplay: "always",
                      }}
                    />{" "}
                    ({periodoAtivo ? periodo : period})
                  </span>
                )}
                {/* Maior queda de pico a vale. Lucro e ROI dizem onde a banca
                    chegou; isto diz quanto ela chegou a devolver no caminho. */}
                {chartData && chartData.drawdown > 0 && (
                  <span
                    className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--text-soft)] text-[var(--text-2)]"
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
                    <strong
                      className={
                        hoveredPoint.cumProfit >= 0
                          ? "text-[var(--green)]"
                          : "text-[var(--red)]"
                      }
                    >
                      {formatarReaisComSinal(hoveredPoint.cumProfit)}
                    </strong>{" "}
                    ({formatarReaisComSinal(hoveredPoint.dayProfit)} no dia ·{" "}
                    {hoveredPoint.total} tips)
                  </span>
                ) : (
                  "Curva real calculada a partir de cada aposta registrada"
                )}
              </p>
            </div>

            {/* Some enquanto há intervalo: janela e intervalo comandam o mesmo
                eixo, e deixar os dois na tela ao mesmo tempo é o que faz o
                visitante escolher combinação que se contradiz.

                Sai do DOM em vez de levar `hidden`: o atributo vale
                `display: none`, e a classe `flex` do Tailwind ganha dele na
                cascata — os botões continuariam na tela, que foi exatamente o
                que aconteceu na primeira tentativa. */}
            {!periodoAtivo && (
              <div className="flex items-center gap-1 bg-[var(--bg)] p-1 rounded-full border border-tinta/[0.06] shrink-0">
                {availablePeriods.map((p) => (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={period === p}
                    onClick={() => {
                      setPeriod(p);
                      setHoveredPoint(null);
                    }}
                    className={`px-3 py-1 min-h-[24px] text-xs font-semibold rounded-full transition-all ${
                      period === p
                        ? "bg-[var(--accent)] text-[var(--sobre-cor)] shadow-sm font-bold"
                        : "text-[var(--text-2)] hover:text-[var(--accent)]"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
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
                aria-label={`Evolução da banca ${trecho.prefixo} ${trecho.nome}, de ${
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
                    <stop
                      offset={chartData.pctZero}
                      stopColor="var(--green)"
                      stopOpacity="0.02"
                    />
                    <stop
                      offset={chartData.pctZero}
                      stopColor="var(--red)"
                      stopOpacity="0.02"
                    />
                    <stop offset="1" stopColor="var(--red)" stopOpacity="0.22" />
                  </linearGradient>
                </defs>

                {/* Grid line: Max */}
                <line
                  x1={chartData.padLeft}
                  y1={chartData.padTop}
                  x2={chartData.width - chartData.padRight}
                  y2={chartData.padTop}
                  stroke="rgb(var(--tinta-rgb) / 0.05)"
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
                        stroke="rgb(var(--tinta-rgb) / 0.12)"
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
                  stroke="rgb(var(--tinta-rgb) / 0.05)"
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
                    r={
                      chartData.points.length === 1
                        ? 5
                        : chartData.points.length > 20
                          ? 1.5
                          : 3
                    }
                    fill={p.cumProfit >= 0 ? "var(--green)" : "var(--red)"}
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{
                      opacity: chartData.points.length > 20 ? 0.6 : 0.8,
                      scale: 1,
                    }}
                    transition={{
                      duration: 0.25,
                      delay: 0.15 + (i / Math.max(chartData.points.length - 1, 1)) * 0.75,
                    }}
                  />
                ))}

                {/* X-Axis Date Labels */}
                {chartData.points.length > 0 && (
                  <>
                    <text
                      x={chartData.points[0].x}
                      y={chartData.height - 12}
                      textAnchor={chartData.points.length > 1 ? "start" : "middle"}
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

                    {chartData.points.length > 1 && (
                      <text
                        x={chartData.points[chartData.points.length - 1].x}
                        y={chartData.height - 12}
                        textAnchor="end"
                        className="text-[10px] font-mono fill-[var(--text-3)]"
                      >
                        {chartData.points[chartData.points.length - 1].date}
                      </text>
                    )}
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
        </section>

        {/* Breakdown by Sport */}
        <section
          aria-labelledby="titulo-esportes"
          className="lg:col-span-4 bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="flex items-start justify-between gap-3 mb-1">
              <h2
                id="titulo-esportes"
                className="text-base font-bold text-[var(--text)] tracking-tight"
              >
                Top Esportes
              </h2>
              <Link
                href={comAba("/estatisticas", activeTab)}
                className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1 shrink-0 py-[5px] -my-[5px]"
              >
                <span>Detalhes</span>
                <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
              </Link>
            </div>
            {/* Este bloco já ficou fora do filtro, quando o filtro era um dia
                só: num dia com três apostas a distribuição virava um esporte
                só, e era preciso um texto avisando que ali não seguia o resto
                da tela. Com intervalo a objeção caiu, e a nota some junto. */}
            <p className="text-xs text-[var(--text-3)] mb-3">
              {periodoAtivo
                ? `Distribuição ${periodo}`
                : "Distribuição por modalidades cadastradas"}
            </p>

            <div className="divide-y divide-tinta/[0.05] max-h-[220px] overflow-y-auto pr-1">
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
                        {formatarInteiro(sport.apostas)} tips ·{" "}
                        {sport.taxaAcerto.toFixed(1).replace(".", ",")}% acerto
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
        </section>
      </div>

      {/* Risco: o tamanho das fases ruins, logo abaixo da curva que as mostra.
          Segue o recorte da tela, como os blocos ao redor. */}
      <BlocoDeRisco
        bets={scopedBets}
        converter={converter}
        aba={activeTab}
        recorte={`${trecho.prefixo} ${trecho.nome}${periodo ? ` (${periodo})` : ""}`}
        carregando={loading}
      />

      {/* Top Casas.
          Pergunta gêmea da de esporte, e por um motivo que esporte não tem:
          casa limita conta boa. Quando isso acontece, o resultado do grupo muda
          sem nada mudar na estratégia — e o Painel é onde se olha primeiro.

          Fica logo abaixo do gráfico, ao lado da irmã: as duas respondem "de
          onde veio o resultado", e separá-las obrigava a rolar a tela inteira
          para comparar.

          Largura inteira com a lista em duas colunas: são oito casas, e numa
          coluna só a linha ficaria com meio metro de espaço vazio entre o nome
          e o valor. */}
      <section
        aria-labelledby="titulo-casas"
        className="bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-6 shadow-sm space-y-4"
      >
        <div>
          <div className="flex items-start justify-between gap-3 mb-1">
            <h2
              id="titulo-casas"
              className="text-base font-bold text-[var(--text)] tracking-tight"
            >
              Top Casas
            </h2>
            <Link
              href={comAba("/estatisticas", activeTab)}
              className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1 shrink-0 py-[5px] -my-[5px]"
            >
              <span>Ver todas</span>
              <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
          <p className="text-xs text-[var(--text-3)]">
            {periodoAtivo ? `As mais usadas ${periodo}` : "As mais usadas na aba ativa"}
          </p>
        </div>

        {casas.length === 0 ? (
          loading ? (
            <SkeletonLinhas quantidade={4} altura="h-9" />
          ) : (
            <p className="text-center text-xs text-[var(--text-3)] py-6">
              Sem casas nesta aba.
            </p>
          )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
            {casas.map((b) => (
              <div
                key={b.casa}
                className="py-2.5 flex items-center justify-between gap-3 border-b border-tinta/[0.05]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <BookieBadge bookie={b.casa} />
                  <span className="text-[11px] text-[var(--text-3)] whitespace-nowrap">
                    {formatarInteiro(b.apostas)} tips · ROI {b.roi >= 0 ? "+" : ""}
                    {b.roi.toFixed(2).replace(".", ",")}%
                  </span>
                </div>
                <span
                  className={`font-mono text-xs font-bold shrink-0 ${
                    b.lucro >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
                  }`}
                >
                  {formatarReaisComSinal(converter(b.lucro))}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bottom Section: Recent Activity Stream (6 cols) + Top Adms Leaderboard (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Bets Stream */}
        <section
          aria-labelledby="titulo-ultimas"
          className="lg:col-span-7 bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2
                id="titulo-ultimas"
                className="text-base font-bold text-[var(--text)] tracking-tight"
              >
                Últimas Apostas Registradas
              </h2>
              <p className="text-xs text-[var(--text-3)]">
                {periodoAtivo
                  ? `Apostas registradas ${periodo}`
                  : "As entradas mais recentes da aba"}
              </p>
            </div>

            <Link
              href={comAba("/apostas", activeTab)}
              className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1 py-[5px] -my-[5px]"
            >
              <span>Ver todas</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {recentBets.length === 0 ? (
              loading ? (
                <SkeletonLinhas quantidade={4} altura="h-14" />
              ) : (
                <p className="text-center text-xs text-[var(--text-3)] py-6">
                  {periodoAtivo ? `Sem apostas ${periodo}.` : "Sem apostas nesta aba."}
                </p>
              )
            ) : (
              recentBets.map((bet) => {
                const isGreen = bet.resultado === "GREEN";
                const isRed = bet.resultado === "RED";
                const isVoid = bet.resultado === "VOID";

                return (
                  <div
                    key={bet.id}
                    className="p-3 bg-[var(--bg-soft)] rounded-xl border border-tinta/[0.04] flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs"
                  >
                    {/* Duas linhas, e a tip com a segunda inteira.
                        Antes tudo dividia uma linha só: o selo de resultado e o
                        lucro, que não encolhem, ficavam com 161 px dos 290 do
                        cartão, e sobravam 49 px para partida, tip, odd e
                        escudo. A tip aparecia como "J…". Agora o que não
                        encolhe fica em cima, e a tip começa embaixo com a
                        largura do cartão. */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <SportBadge sport={bet.esporte} />
                      <span className="font-bold text-[var(--text)] truncate">
                        {bet.partida}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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

                    {/* `truncate` num container flex não trunca: recorta os
                        filhos sem reticências. Por isso só o texto da tip
                        encolhe; odd e escudo não cedem espaço. */}
                    <div className="w-full text-[11px] text-[var(--text-2)] flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{bet.tip}</span>
                      <span className="shrink-0">·</span>
                      <strong className="font-mono shrink-0">
                        @{formatarOdd(bet.odd)}
                      </strong>
                      {bet.casa && (
                        <BookieBadge
                          bookie={bet.casa}
                          className="scale-90 origin-left shrink-0"
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Top Adms Box */}
        <section
          aria-labelledby="titulo-ranking"
          className="lg:col-span-5 bg-[var(--bg-card)] border border-tinta/[0.07] rounded-2xl p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2
                id="titulo-ranking"
                className="text-base font-bold text-[var(--text)] tracking-tight"
              >
                Ranking de Adms ({rotuloDaAba(activeTab)})
              </h2>
              <p className="text-xs text-[var(--text-3)]">
                {periodoAtivo
                  ? `Quem mais gerou retorno ${periodo}`
                  : "Quem mais gerou retorno na aba ativa"}
              </p>
            </div>

            <Link
              href={comAba("/adms", activeTab)}
              className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1 py-[5px] -my-[5px]"
            >
              <span>Detalhes</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {tipsters.length === 0 ? (
              loading ? (
                <SkeletonLinhas quantidade={3} altura="h-14" />
              ) : (
                <p className="text-center text-xs text-[var(--text-3)] py-6">
                  Sem adms nesta aba.
                </p>
              )
            ) : (
              tipsters.slice(0, 4).map((t, idx) => (
                <div
                  key={t.nome}
                  className="p-3.5 bg-[var(--bg-soft)] rounded-xl border border-tinta/[0.04] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[var(--text-3)] w-4">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-[var(--text)]">{t.nome}</div>
                      <div className="text-[10.5px] text-[var(--text-3)]">
                        {formatarInteiro(t.totalApostas)} tips ·{" "}
                        {t.taxaAcerto.toFixed(1).replace(".", ",")}% acerto
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
              ))
            )}
          </div>
        </section>
      </div>

      <SecaoTelegram />
    </div>
  );
}
