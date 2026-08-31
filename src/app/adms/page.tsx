"use client";

import { motion } from "framer-motion";
import { Award } from "lucide-react";
import { SportBadge } from "@/components/SportBadge";
import { SeletorAba } from "@/components/SeletorAba";
import { AvisoErro, AvisoMock } from "@/components/AvisoDados";
import { SkeletonLinhas } from "@/components/Skeleton";
import { useBets } from "@/hooks/useBets";
import { SecaoTelegram } from "@/components/Telegram";
import { LinkPlanilha } from "@/components/LinkPlanilha";
import { formatarUnidades } from "@/lib/format";

export default function AdmsPage() {
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

  const adms = stats?.tipsters ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl sm:text-4xl text-[var(--text)] tracking-tight">
              Performance dos Adms
            </h1>
            <span className="px-2.5 py-0.5 bg-[var(--green)]/10 text-[var(--green)] text-xs font-bold rounded-full">
              Ranking
            </span>
          </div>
          <p className="text-sm text-[var(--text-2)] mt-1 font-sans">
            Assertividade e lucro por unidade calculados da aba{" "}
            <span className="font-semibold text-[var(--text)]">{activeTab}</span>. A taxa
            considera apenas apostas finalizadas.
          </p>
          <LinkPlanilha className="mt-2" />
        </div>

        <SeletorAba
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          onRecarregar={recarregar}
          loading={loading}
          id="seletor-adms"
        />
      </div>

      {isMock && <AvisoMock />}
      {erro && <AvisoErro mensagem={erro} onTentarNovamente={recarregar} />}

      {loading ? (
        <SkeletonLinhas quantidade={4} altura="h-52" />
      ) : erro ? null : adms.length === 0 ? (
        <div className="bg-white border border-black/[0.07] rounded-2xl p-16 text-center text-[var(--text-3)]">
          <p className="text-sm font-medium">
            Nenhum adm com dados na aba {activeTab}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adms.map((adm, index) => {
            const isProfitable = adm.lucroUnidades > 0;
            return (
              <motion.div
                key={adm.nome}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: Math.min(index * 0.05, 0.3) }}
                className="bg-white border border-black/[0.07] rounded-2xl p-6 shadow-sm transition-colors space-y-5 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${adm.avatarColor} text-white font-bold text-lg flex items-center justify-center shadow-sm shrink-0`}
                    >
                      {adm.initial}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-bold text-[var(--text)] tracking-tight">
                          {adm.nome}
                        </span>
                        {index === 0 && adm.totalApostas >= 3 && (
                          <span className="px-2 py-0.5 bg-[var(--green)]/10 text-[var(--green)] text-[10.5px] font-bold rounded-full flex items-center gap-1">
                            <Award className="w-3 h-3" /> Top #1
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        {adm.esportes.map((sp) => (
                          <SportBadge
                            key={sp}
                            sport={sp}
                            className="scale-90 origin-left"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-mono text-xl font-bold ${
                        isProfitable ? "text-[var(--green)]" : "text-[var(--red)]"
                      }`}
                    >
                      {formatarUnidades(adm.lucroUnidades)}
                    </span>
                    <div className="text-[10px] text-[var(--text-3)] uppercase tracking-wider font-semibold">
                      Lucro Líquido
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-[var(--bg-soft)] p-3 rounded-xl border border-black/[0.04] text-center">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[var(--text-3)] font-semibold">
                      Acerto
                    </div>
                    <div className="font-mono text-base font-bold text-[var(--text)] mt-0.5">
                      {adm.taxaAcerto.toFixed(1).replace(".", ",")}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[var(--text-3)] font-semibold">
                      Volume
                    </div>
                    <div className="font-mono text-base font-bold text-[var(--text)] mt-0.5">
                      {adm.totalApostas} tips
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[var(--text-3)] font-semibold">
                      ROI
                    </div>
                    <div
                      className={`font-mono text-base font-bold mt-0.5 ${
                        adm.roi >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
                      }`}
                    >
                      {adm.roi >= 0 ? "+" : ""}
                      {adm.roi.toFixed(1).replace(".", ",")}%
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-semibold text-[var(--text-3)]">
                    <span>Taxa de vitória</span>
                    <span>{adm.taxaAcerto.toFixed(1).replace(".", ",")}%</span>
                  </div>
                  <div
                    className="h-2 bg-[var(--bg-tinted)] rounded-full overflow-hidden"
                    role="img"
                    aria-label={`Taxa de vitória de ${adm.nome}: ${adm.taxaAcerto.toFixed(1)} por cento`}
                  >
                    <motion.div
                      className={`h-full rounded-full ${
                        adm.taxaAcerto >= 60
                          ? "bg-[var(--green)]"
                          : adm.taxaAcerto >= 45
                          ? "bg-[var(--amber)]"
                          : "bg-[var(--red)]"
                      }`}
                      initial={{ width: "0%" }}
                      animate={{ width: `${Math.min(adm.taxaAcerto, 100)}%` }}
                      transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      <SecaoTelegram />
    </div>
  );
}
