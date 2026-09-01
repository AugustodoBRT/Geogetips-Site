"use client";

import { motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { PieChart, BarChart2, Hash, Layers } from "lucide-react";
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
import { formatarReaisComSinal } from "@/lib/format";

const RAIO = 48;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

export default function EstatisticasPage() {
  const {
    stats,
    tabs,
    activeTab,
    setActiveTab,
    loading,
    erro,
    isMock,
    recarregar,
  } = useBets({ onlyStats: true });

  const { converter } = useUnidade();

  const totalBets = stats?.totalBets ?? 0;
  const greens = stats?.greens ?? 0;
  const reds = stats?.reds ?? 0;
  const pendings = stats?.pendings ?? 0;
  const voids = stats?.voids ?? 0;

  // Denominador seguro só para as proporções do donut
  const base = totalBets || 1;
  const pct = (n: number) => Math.round((n / base) * 100);

  const sports = stats?.sports ?? [];
  const bookies = stats?.bookies ?? [];

  // Escala pelo maior |lucro| do conjunto, em vez de um teto fixo de 600
  const maiorLucroAbs = Math.max(...sports.map((s) => Math.abs(s.lucro)), 1);

  const segmentos = [
    { chave: "green", valor: greens, cor: "var(--green)", offset: 0 },
    { chave: "red", valor: reds, cor: "var(--red)", offset: greens },
    { chave: "pend", valor: pendings, cor: "var(--amber)", offset: greens + reds },
    {
      chave: "void",
      valor: voids,
      cor: "var(--text-3)",
      offset: greens + reds + pendings,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl sm:text-4xl text-[var(--text)] tracking-tight">
              Estatísticas &amp; Padrões
            </h1>
            <span className="px-2.5 py-0.5 bg-[var(--green)]/10 text-[var(--green)] text-xs font-bold rounded-full">
              Analytics
            </span>
          </div>
          <p className="text-sm text-[var(--text-2)] mt-1 font-sans">
            Distribuição de resultados, médias de odd e concentração por casa na aba{" "}
            <span className="font-semibold text-[var(--text)]">{activeTab}</span>.
          </p>
          <LinkPlanilha className="mt-2" />
        </div>

        <SeletorAba
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          onRecarregar={recarregar}
          loading={loading}
          id="seletor-estatisticas"
        />
      </div>

      {isMock && <AvisoMock />}
      {erro && <AvisoErro mensagem={erro} onTentarNovamente={recarregar} />}

      <SeletorUnidade />

      {loading ? (
        <SkeletonLinhas quantidade={2} altura="h-72" />
      ) : erro ? null : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Donut de distribuição */}
            <div className="lg:col-span-7 bg-white border border-black/[0.07] rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[var(--text)] tracking-tight">
                    Distribuição de Resultados ({activeTab})
                  </h2>
                  <p className="text-xs text-[var(--text-3)]">
                    Proporção entre Green, Red e Pendentes
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[var(--green)]/10 text-[var(--green)] flex items-center justify-center">
                  <PieChart className="w-4 h-4" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-2">
                <div className="w-40 h-40 relative shrink-0">
                  <svg
                    viewBox="0 0 120 120"
                    className="w-full h-full -rotate-90"
                    role="img"
                    aria-label={`${greens} green, ${reds} red, ${pendings} pendentes, ${voids} anuladas, de ${totalBets} apostas`}
                  >
                    <circle
                      cx="60"
                      cy="60"
                      r={RAIO}
                      fill="none"
                      stroke="var(--bg-tinted)"
                      strokeWidth="12"
                    />
                    {segmentos.map((seg) =>
                      seg.valor > 0 ? (
                        <motion.circle
                          key={seg.chave}
                          cx="60"
                          cy="60"
                          r={RAIO}
                          fill="none"
                          stroke={seg.cor}
                          strokeWidth="12"
                          // Sem strokeLinecap="round": as pontas arredondadas de
                          // três segmentos adjacentes se sobrepunham e distorciam
                          // as fatias pequenas.
                          strokeDasharray={`${(seg.valor / base) * CIRCUNFERENCIA} ${CIRCUNFERENCIA}`}
                          strokeDashoffset={`-${(seg.offset / base) * CIRCUNFERENCIA}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.4 }}
                        />
                      ) : null
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-serif text-3xl text-[var(--text)] tracking-tight leading-none">
                      <NumberFlow value={totalBets} locales="pt-BR" />
                    </span>
                    <span className="text-[10.5px] uppercase tracking-wider text-[var(--text-3)] font-bold mt-1">
                      Apostas
                    </span>
                  </div>
                </div>

                <div className="space-y-3 w-full sm:w-auto">
                  {[
                    { rotulo: "Green (Vitórias)", n: greens, cor: "var(--green)" },
                    { rotulo: "Red (Perdas)", n: reds, cor: "var(--red)" },
                    { rotulo: "Pendente", n: pendings, cor: "var(--amber)" },
                    ...(voids > 0
                      ? [{ rotulo: "Void (anulada)", n: voids, cor: "var(--text-3)" }]
                      : []),
                  ].map((linha) => (
                    <div
                      key={linha.rotulo}
                      className="p-3 rounded-xl border flex items-center justify-between gap-6"
                      style={{
                        backgroundColor: `${linha.cor}0F`,
                        borderColor: `${linha.cor}26`,
                      }}
                    >
                      <div className="flex items-center gap-2 text-xs font-bold text-[var(--text)]">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: linha.cor }}
                        />
                        <span>{linha.rotulo}</span>
                      </div>
                      <span
                        className="font-mono font-bold text-xs"
                        style={{ color: linha.cor }}
                      >
                        {linha.n} ({pct(linha.n)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Médias de odd — agora calculadas, não digitadas */}
            <div className="lg:col-span-5 bg-white border border-black/[0.07] rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[var(--text)] tracking-tight">
                    Médias de Odd ({activeTab})
                  </h2>
                  <p className="text-xs text-[var(--text-3)]">
                    Comparativo entre apostas ganhas e perdidas
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[var(--text)]/5 text-[var(--text)] flex items-center justify-center">
                  <Hash className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-3">
                {[
                  {
                    titulo: "Apostas com GREEN",
                    sub: `${greens} ${greens === 1 ? "tip acertada" : "tips acertadas"}`,
                    valor: stats?.oddMediaGreen ?? 0,
                    cor: "var(--green)",
                  },
                  {
                    titulo: "Apostas com RED",
                    sub: `${reds} ${reds === 1 ? "tip perdida" : "tips perdidas"}`,
                    valor: stats?.oddMediaRed ?? 0,
                    cor: "var(--red)",
                  },
                  {
                    titulo: "Média Geral",
                    sub: `${totalBets} ${totalBets === 1 ? "tip no total" : "tips no total"}`,
                    valor: stats?.oddMediaGeral ?? 0,
                    cor: "var(--accent)",
                  },
                ].map((bloco) => (
                  <div
                    key={bloco.titulo}
                    className="p-4 rounded-xl border flex items-center justify-between"
                    style={{
                      backgroundColor: `${bloco.cor}0F`,
                      borderColor: `${bloco.cor}26`,
                    }}
                  >
                    <div>
                      <div
                        className="text-xs font-bold"
                        style={{ color: bloco.cor }}
                      >
                        {bloco.titulo}
                      </div>
                      <div className="text-[11px] text-[var(--text-3)] mt-0.5 font-medium">
                        {bloco.sub}
                      </div>
                    </div>
                    <div
                      className="font-mono text-2xl font-bold"
                      style={{ color: bloco.cor }}
                    >
                      {bloco.valor > 0 ? (
                        <NumberFlow
                          value={bloco.valor}
                          locales="pt-BR"
                          format={{
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }}
                        />
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lucro por modalidade */}
            <div className="bg-white border border-black/[0.07] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[var(--text)] tracking-tight">
                    Lucro por Modalidade Esportiva
                  </h2>
                  <p className="text-xs text-[var(--text-3)]">
                    Rentabilidade por esporte na aba {activeTab}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center">
                  <BarChart2 className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-4">
                {sports.length === 0 ? (
                  <p className="text-xs text-[var(--text-3)]">
                    Sem dados de categoria na aba.
                  </p>
                ) : (
                  sports.map((sport) => {
                    const positivo = sport.lucro >= 0;
                    const largura =
                      (Math.abs(sport.lucro) / maiorLucroAbs) * 100;
                    return (
                      <div key={sport.esporte} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-semibold gap-3">
                          <SportBadge sport={sport.esporte} />
                          <span
                            className={`font-mono flex items-baseline gap-2 ${
                              positivo ? "text-[var(--green)]" : "text-[var(--red)]"
                            }`}
                          >
                            {formatarReaisComSinal(converter(sport.lucro))}
                            <span className="text-[10.5px] text-[var(--text-3)] font-medium">
                              ROI {sport.roi >= 0 ? "+" : ""}
                              {sport.roi.toFixed(1).replace(".", ",")}%
                            </span>
                          </span>
                        </div>
                        <div className="h-2 bg-[var(--bg-tinted)] rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${
                              positivo ? "bg-[var(--green)]" : "bg-[var(--red)]"
                            }`}
                            initial={{ width: "0%" }}
                            animate={{ width: `${Math.max(largura, 2)}%` }}
                            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Casas */}
            <div className="bg-white border border-black/[0.07] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[var(--text)] tracking-tight">
                    Top Casas de Apostas
                  </h2>
                  <p className="text-xs text-[var(--text-3)]">
                    Volume de apostas por plataforma cadastrada
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[var(--text)]/5 text-[var(--text)] flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-3.5">
                {bookies.length === 0 ? (
                  <p className="text-xs text-[var(--text-3)]">Sem dados de casas na aba.</p>
                ) : (
                  bookies.map((b) => (
                    <div key={b.casa} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-semibold gap-3">
                        <BookieBadge bookie={b.casa} />
                        <span className="font-mono text-[var(--text-2)] text-xs">
                          {b.apostas} {b.apostas === 1 ? "aposta" : "apostas"}
                        </span>
                      </div>
                      <div className="h-2 bg-[var(--bg-tinted)] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-[var(--text)]"
                          initial={{ width: "0%" }}
                          animate={{ width: `${b.percentual}%` }}
                          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
      <SecaoTelegram />
    </div>
  );
}
