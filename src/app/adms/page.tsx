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
import { formatarInteiro, formatarUnidades } from "@/lib/format";
import { trechoDaAba } from "@/lib/constants";

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
  const trecho = trechoDaAba(activeTab);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl sm:text-4xl text-[var(--text)] tracking-tight">
              Performance dos Adms
            </h1>
            {!erro && !isMock && !loading && (
              <span className="px-2.5 py-0.5 bg-[var(--green-soft)] text-[var(--green)] text-xs font-bold rounded-full">
                Ranking
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--text-2)] mt-1 font-sans">
            Assertividade e lucro por unidade calculados {trecho.prefixo}{" "}
            <span className="font-semibold text-[var(--text)]">{trecho.nome}</span>. A taxa
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
            Nenhum adm com dados {trecho.prefixo} {trecho.nome}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adms.map((adm, index) => {
            const isProfitable = adm.lucroUnidades >= 0;
            const total = adm.totalApostas || 1;
            const fatias = [
              { rotulo: "green", n: adm.greens, cor: "var(--green)" },
              { rotulo: "red", n: adm.reds, cor: "var(--red)" },
              { rotulo: "void", n: adm.voids, cor: "var(--text-3)" },
              { rotulo: "pendente", n: adm.pendentes, cor: "var(--accent)" },
            ].filter((f) => f.n > 0);
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
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-[var(--text)] tracking-tight">
                        {adm.nome}
                      </span>
                      {index === 0 && adm.totalApostas >= 3 && (
                        <span className="px-2 py-0.5 bg-[var(--green-soft)] text-[var(--green)] text-[10.5px] font-bold rounded-full flex items-center gap-1">
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
                      {formatarInteiro(adm.totalApostas)} tips
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
                      {adm.roi.toFixed(2).replace(".", ",")}%
                    </div>
                  </div>
                </div>

                {/*
                  Antes daqui saía uma régua de "ponto de equilíbrio": 100 / odd
                  média, marcada sobre a taxa de acerto. A conta só fecha quando
                  toda entrada usa a MESMA stake e a MESMA odd — aqui a stake
                  varia por aposta, então a marca sugeria um limiar que não
                  existe. Quem responde "esse adm está no lucro?" é o ROI, logo
                  acima, que já pesa cada entrada pelo valor apostado.

                  No lugar entrou a composição das tips, que não depende de
                  staking nenhum e explica a taxa de acerto: 0% em 11 tips muda
                  de sentido quando várias ainda estão pendentes.
                */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-3)]">
                    <span>Composição das tips</span>
                    {adm.oddMedia > 0 && (
                      <span className="font-normal">
                        odd média {adm.oddMedia.toFixed(2).replace(".", ",")}
                      </span>
                    )}
                  </div>

                  <div
                    className="h-2 bg-[var(--bg-tinted)] rounded-full overflow-hidden flex"
                    role="img"
                    aria-label={`${adm.nome}: ${formatarInteiro(adm.greens)} green, ${formatarInteiro(
                      adm.reds
                    )} red, ${formatarInteiro(adm.voids)} anuladas e ${formatarInteiro(
                      adm.pendentes
                    )} pendentes, de ${formatarInteiro(adm.totalApostas)} tips`}
                  >
                    {fatias.map((f) => (
                      <div
                        key={f.rotulo}
                        className="h-full transition-[width] duration-500 ease-out"
                        style={{ width: `${(f.n / total) * 100}%`, background: f.cor }}
                      />
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[var(--text-3)] font-medium">
                    {fatias.map((f) => (
                      <span key={f.rotulo} className="flex items-center gap-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: f.cor }}
                          aria-hidden="true"
                        />
                        {formatarInteiro(f.n)} {f.rotulo}
                        {f.n > 1 ? "s" : ""}
                      </span>
                    ))}
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
