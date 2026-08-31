"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { RefreshCw, TrendingUp, Percent, Layers, Activity } from "lucide-react";
import { AvisoErro, AvisoMock } from "@/components/AvisoDados";
import { SkeletonKpis, SkeletonLinhas } from "@/components/Skeleton";
import { SeletorUnidade } from "@/components/SeletorUnidade";
import { SecaoTelegram } from "@/components/Telegram";
import { LinkPlanilha } from "@/components/LinkPlanilha";
import { useResumoMensal } from "@/hooks/useResumoMensal";
import { useUnidade } from "@/hooks/useUnidade";
import { abaCurta } from "@/lib/constants";
import { formatarOdd, formatarReaisComSinal, formatarUnidades } from "@/lib/format";

export default function HistoricoPage() {
  const { meses, consolidado, loading, erro, isMock, recarregar } = useResumoMensal();
  const { converter } = useUnidade();

  // Do mais antigo para o mais recente, que é como se lê um gráfico de evolução
  const cronologico = useMemo(() => [...meses].reverse(), [meses]);

  const maiorAbs = useMemo(
    () => Math.max(...cronologico.map((m) => Math.abs(m.lucro)), 1),
    [cronologico]
  );

  const mesesNegativos = meses.filter((m) => m.lucro < 0).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl sm:text-4xl text-[#1A1715] tracking-tight">
              Histórico Mês a Mês
            </h1>
            <span className="px-2.5 py-0.5 bg-[#2D8659]/10 text-[#2D8659] text-xs font-bold rounded-full">
              Consolidado
            </span>
          </div>
          <p className="text-sm text-[#6B645A] mt-1 font-sans max-w-2xl">
            Todos os meses da planilha lado a lado, incluindo os negativos. O ROI é
            recalculado sobre a soma do período — não é a média dos ROIs mensais.
          </p>
          <LinkPlanilha className="mt-2" />
        </div>

        <button
          type="button"
          onClick={recarregar}
          disabled={loading}
          aria-label="Recarregar dados"
          title="Recarregar dados"
          className="p-2 bg-white border border-black/[0.12] rounded-full text-[#6B645A] hover:text-[#1A1715] focus-visible:ring-2 focus-visible:ring-[#C7522A] transition-all disabled:opacity-50 shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {isMock && <AvisoMock />}
      {erro && <AvisoErro mensagem={erro} onTentarNovamente={recarregar} />}

      <SeletorUnidade />

      {loading ? (
        <>
          <SkeletonKpis quantidade={4} />
          <SkeletonLinhas quantidade={2} altura="h-64" />
        </>
      ) : erro ? null : meses.length === 0 ? (
        <div className="bg-white border border-black/[0.07] rounded-2xl p-16 text-center text-[#9E9689]">
          <p className="text-sm font-medium">Nenhum mês encontrado na planilha.</p>
        </div>
      ) : (
        <>
          {/* Consolidado */}
          {consolidado && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-black/[0.07] rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-[#9E9689]">
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    Resultado Consolidado
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[#2D8659]/10 text-[#2D8659] flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div
                  className={`font-serif text-3xl sm:text-4xl tracking-tight leading-none ${
                    consolidado.lucro >= 0 ? "text-[#2D8659]" : "text-[#C23B22]"
                  }`}
                >
                  <NumberFlow
                    value={converter(consolidado.lucro)}
                    locales="pt-BR"
                    format={{
                      style: "currency",
                      currency: "BRL",
                      signDisplay: "always",
                    }}
                  />
                </div>
                <div className="text-xs font-medium text-[#6B645A] pt-1 border-t border-black/[0.04]">
                  {formatarUnidades(consolidado.unidades)} em{" "}
                  {meses.length} {meses.length === 1 ? "mês" : "meses"}
                </div>
              </div>

              <div className="bg-white border border-black/[0.07] rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-[#9E9689]">
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    ROI do Período
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[#C7522A]/10 text-[#C7522A] flex items-center justify-center">
                    <Percent className="w-4 h-4" />
                  </div>
                </div>
                <div
                  className={`font-serif text-3xl sm:text-4xl tracking-tight leading-none ${
                    consolidado.roi >= 0 ? "text-[#2D8659]" : "text-[#C23B22]"
                  }`}
                >
                  <NumberFlow
                    value={consolidado.roi}
                    locales="pt-BR"
                    format={{ signDisplay: "always", maximumFractionDigits: 2 }}
                    suffix="%"
                  />
                </div>
                <div className="text-xs font-medium text-[#6B645A] pt-1 border-t border-black/[0.04]">
                  Sobre a soma de tudo que foi apostado
                </div>
              </div>

              <div className="bg-white border border-black/[0.07] rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-[#9E9689]">
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    Apostas
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[#1A1715]/5 text-[#1A1715] flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-serif text-3xl sm:text-4xl text-[#1A1715] tracking-tight leading-none">
                  <NumberFlow value={consolidado.apostas} locales="pt-BR" />
                </div>
                <div className="text-xs font-medium text-[#6B645A] pt-1 border-t border-black/[0.04]">
                  {consolidado.greens} Green · {consolidado.reds} Red
                  {consolidado.voids > 0 && ` · ${consolidado.voids} Void`}
                </div>
              </div>

              <div className="bg-white border border-black/[0.07] rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-[#9E9689]">
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    Taxa de Acerto
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[#2D8659]/10 text-[#2D8659] flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-serif text-3xl sm:text-4xl text-[#1A1715] tracking-tight leading-none">
                  <NumberFlow
                    value={consolidado.taxaAcerto}
                    locales="pt-BR"
                    suffix="%"
                  />
                </div>
                <div className="text-xs font-medium text-[#6B645A] pt-1 border-t border-black/[0.04]">
                  {mesesNegativos === 0
                    ? "Nenhum mês negativo"
                    : `${mesesNegativos} ${
                        mesesNegativos === 1 ? "mês negativo" : "meses negativos"
                      }`}
                </div>
              </div>
            </div>
          )}

          {/* Barras mensais */}
          <div className="bg-white border border-black/[0.07] rounded-2xl p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-base font-bold text-[#1A1715] tracking-tight">
                Resultado por mês
              </h2>
              <p className="text-xs text-[#9E9689]">
                Barras acima da linha são lucro, abaixo são prejuízo
              </p>
            </div>

            <div className="overflow-x-auto">
              <div
                className="flex items-stretch gap-3 min-w-min"
                role="img"
                aria-label={`Resultado de ${cronologico.length} meses: ${cronologico
                  .map((m) => `${abaCurta(m.aba)} ${m.unidades.toFixed(2)} unidades`)
                  .join(", ")}`}
              >
                {cronologico.map((m, i) => {
                  const positivo = m.lucro >= 0;
                  const altura = (Math.abs(m.lucro) / maiorAbs) * 100;
                  return (
                    <div
                      key={m.aba}
                      className="flex flex-col items-center gap-2 min-w-[64px] flex-1"
                    >
                      {/* metade de cima: lucro */}
                      <div className="h-[90px] w-full flex flex-col justify-end">
                        {positivo && (
                          <motion.div
                            className="w-full rounded-t-md bg-[#2D8659]"
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(altura, 2)}%` }}
                            transition={{
                              duration: 0.6,
                              delay: i * 0.05,
                              ease: [0.32, 0.72, 0, 1],
                            }}
                          />
                        )}
                      </div>

                      <div className="w-full h-px bg-black/[0.12]" />

                      {/* metade de baixo: prejuízo */}
                      <div className="h-[90px] w-full">
                        {!positivo && (
                          <motion.div
                            className="w-full rounded-b-md bg-[#C23B22]"
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(altura, 2)}%` }}
                            transition={{
                              duration: 0.6,
                              delay: i * 0.05,
                              ease: [0.32, 0.72, 0, 1],
                            }}
                          />
                        )}
                      </div>

                      <div className="text-center">
                        <div className="text-[10.5px] font-mono font-bold text-[#6B645A] whitespace-nowrap">
                          {abaCurta(m.aba)}
                        </div>
                        <div
                          className={`text-[10px] font-mono font-bold whitespace-nowrap ${
                            positivo ? "text-[#2D8659]" : "text-[#C23B22]"
                          }`}
                        >
                          {formatarUnidades(m.unidades)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Resultados por mês: apostas, greens, reds, resultado e ROI
                </caption>
                <thead className="bg-[#FAF8F5] border-b border-black/[0.06] text-[#9E9689] uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th scope="col" className="py-3 px-4">Mês</th>
                    <th scope="col" className="py-3 px-3 text-right">Apostas</th>
                    <th scope="col" className="py-3 px-3 text-right">Green</th>
                    <th scope="col" className="py-3 px-3 text-right">Red</th>
                    <th scope="col" className="py-3 px-3 text-right">Acerto</th>
                    <th scope="col" className="py-3 px-3 text-right">Odd méd.</th>
                    <th scope="col" className="py-3 px-4 text-right">Resultado</th>
                    <th scope="col" className="py-3 px-4 text-right">ROI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.05]">
                  {meses.map((m) => (
                    <tr key={m.aba} className="hover:bg-[#FAF8F5] transition-colors">
                      <th
                        scope="row"
                        className="py-3 px-4 font-bold text-[#1A1715] whitespace-nowrap"
                      >
                        {m.aba}
                      </th>
                      <td className="py-3 px-3 font-mono text-right text-[#6B645A]">
                        {m.apostas}
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-[#2D8659] font-bold">
                        {m.greens}
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-[#C23B22] font-bold">
                        {m.reds}
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-[#6B645A]">
                        {m.taxaAcerto.toFixed(1).replace(".", ",")}%
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-[#6B645A]">
                        {m.oddMedia > 0 ? formatarOdd(m.oddMedia) : "—"}
                      </td>
                      <td
                        className={`py-3 px-4 font-mono text-right font-bold whitespace-nowrap ${
                          m.lucro >= 0 ? "text-[#2D8659]" : "text-[#C23B22]"
                        }`}
                      >
                        {formatarReaisComSinal(converter(m.lucro))}
                      </td>
                      <td
                        className={`py-3 px-4 font-mono text-right font-bold whitespace-nowrap ${
                          m.roi >= 0 ? "text-[#2D8659]" : "text-[#C23B22]"
                        }`}
                      >
                        {m.roi >= 0 ? "+" : ""}
                        {m.roi.toFixed(2).replace(".", ",")}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                {consolidado && (
                  <tfoot className="bg-[#FAF8F5] border-t-2 border-black/[0.1]">
                    <tr>
                      <th scope="row" className="py-3 px-4 font-bold text-[#1A1715]">
                        Total
                      </th>
                      <td className="py-3 px-3 font-mono text-right font-bold text-[#1A1715]">
                        {consolidado.apostas}
                      </td>
                      <td className="py-3 px-3 font-mono text-right font-bold text-[#2D8659]">
                        {consolidado.greens}
                      </td>
                      <td className="py-3 px-3 font-mono text-right font-bold text-[#C23B22]">
                        {consolidado.reds}
                      </td>
                      <td className="py-3 px-3 font-mono text-right font-bold text-[#1A1715]">
                        {consolidado.taxaAcerto.toFixed(1).replace(".", ",")}%
                      </td>
                      <td className="py-3 px-3 font-mono text-right font-bold text-[#1A1715]">
                        {consolidado.oddMedia > 0
                          ? formatarOdd(consolidado.oddMedia)
                          : "—"}
                      </td>
                      <td
                        className={`py-3 px-4 font-mono text-right font-bold whitespace-nowrap ${
                          consolidado.lucro >= 0 ? "text-[#2D8659]" : "text-[#C23B22]"
                        }`}
                      >
                        {formatarReaisComSinal(converter(consolidado.lucro))}
                      </td>
                      <td
                        className={`py-3 px-4 font-mono text-right font-bold whitespace-nowrap ${
                          consolidado.roi >= 0 ? "text-[#2D8659]" : "text-[#C23B22]"
                        }`}
                      >
                        {consolidado.roi >= 0 ? "+" : ""}
                        {consolidado.roi.toFixed(2).replace(".", ",")}%
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}

      <SecaoTelegram />
    </div>
  );
}
