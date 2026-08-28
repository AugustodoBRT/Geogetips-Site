"use client";

import { useState, useEffect } from "react";
import { TipsterStat } from "@/lib/types";
import { MOCK_TIPSTERS } from "@/lib/data";
import { SportBadge } from "@/components/SportBadge";
import { Award, RefreshCw, Trophy, TrendingUp, Activity, CheckCircle2 } from "lucide-react";

export default function TipstersPage() {
  const [tipsters, setTipsters] = useState<TipsterStat[]>(MOCK_TIPSTERS);
  const [tabs, setTabs] = useState<string[]>([
    "Agosto26",
    "Julho26",
    "Junho26",
    "Maio26",
    "Abril26",
  ]);
  const [activeTab, setActiveTab] = useState<string>("Agosto26");
  const [loading, setLoading] = useState<boolean>(true);

  async function loadTipsters(tab: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/bets?tab=${encodeURIComponent(tab)}`);
      const json = await res.json();
      if (json.success && json.stats?.tipsters) {
        setTipsters(json.stats.tipsters);
        if (Array.isArray(json.tabs)) setTabs(json.tabs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTipsters(activeTab);
  }, [activeTab]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header with Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl sm:text-4xl text-[#1A1715] tracking-tight">
              Performance dos Tipsters
            </h1>
            <span className="px-2.5 py-0.5 bg-[#2D8659]/10 text-[#2D8659] text-xs font-bold rounded-full">
              Ranking Oficial
            </span>
          </div>
          <p className="text-sm text-[#6B645A] mt-1 font-sans">
            Métricas individuais de assertividade e lucro por unidade calculadas da aba{" "}
            <span className="font-semibold text-[#1A1715]">{activeTab}</span>.
          </p>
        </div>

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

          <button
            onClick={() => loadTipsters(activeTab)}
            disabled={loading}
            title="Recarregar"
            className="p-2 bg-white border border-black/[0.12] rounded-full text-[#6B645A] hover:text-[#1A1715] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tipsters Grid in 2 columns */}
      {loading ? (
        <div className="bg-white border border-black/[0.07] rounded-2xl p-16 text-center text-[#9E9689]">
          <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-[#C7522A]" />
          <p className="text-sm font-medium">Calculando performance dos tipsters...</p>
        </div>
      ) : tipsters.length === 0 ? (
        <div className="bg-white border border-black/[0.07] rounded-2xl p-16 text-center text-[#9E9689]">
          <p className="text-sm font-medium">Nenhum tipster com dados na aba {activeTab}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tipsters.map((tipster, index) => {
            const isProfitable = tipster.lucroUnidades > 0;
            return (
              <div
                key={tipster.nome}
                className="bg-white border border-black/[0.07] rounded-2xl p-6 shadow-xs hover:border-black/20 hover:shadow-card transition-all space-y-5 flex flex-col justify-between"
              >
                {/* Top Profile */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tipster.avatarColor} text-white font-bold text-lg flex items-center justify-center shadow-xs shrink-0`}
                    >
                      {tipster.initial}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-[#1A1715] tracking-tight">
                          {tipster.nome}
                        </span>
                        {index === 0 && tipster.totalApostas >= 3 && (
                          <span className="px-2 py-0.5 bg-[#2D8659]/10 text-[#2D8659] text-[10.5px] font-bold rounded-full flex items-center gap-1">
                            <Award className="w-3 h-3" /> Top #1
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        {tipster.esportes.length > 0 ? (
                          tipster.esportes.map((sp) => (
                            <SportBadge key={sp} sport={sp} className="scale-90 origin-left" />
                          ))
                        ) : (
                          <SportBadge sport="Futebol" className="scale-90 origin-left" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-mono text-xl font-bold ${
                        isProfitable ? "text-[#2D8659]" : "text-[#C23B22]"
                      }`}
                    >
                      {isProfitable ? "+" : ""}
                      {tipster.lucroUnidades}u
                    </span>
                    <div className="text-[10px] text-[#9E9689] uppercase tracking-wider font-semibold">
                      Lucro Líquido
                    </div>
                  </div>
                </div>

                {/* 3 Metric Stats Blocks */}
                <div className="grid grid-cols-3 gap-2 bg-[#FAF8F5] p-3 rounded-xl border border-black/[0.04] text-center">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#9E9689] font-semibold">
                      Acerto
                    </div>
                    <div className="font-mono text-base font-bold text-[#1A1715] mt-0.5">
                      {tipster.taxaAcerto}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#9E9689] font-semibold">
                      Volume
                    </div>
                    <div className="font-mono text-base font-bold text-[#1A1715] mt-0.5">
                      {tipster.totalApostas} tips
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#9E9689] font-semibold">
                      Status
                    </div>
                    <div
                      className={`text-xs font-bold mt-1 ${
                        isProfitable ? "text-[#2D8659]" : "text-[#C23B22]"
                      }`}
                    >
                      {isProfitable ? "Lucrativo" : "Em ajuste"}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-semibold text-[#9E9689]">
                    <span>Taxa de Vitória</span>
                    <span>{tipster.taxaAcerto}%</span>
                  </div>
                  <div className="h-2 bg-[#EFECE6] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        tipster.taxaAcerto >= 60
                          ? "bg-[#2D8659]"
                          : tipster.taxaAcerto >= 45
                          ? "bg-[#B8860B]"
                          : "bg-[#C23B22]"
                      }`}
                      style={{ width: `${Math.min(tipster.taxaAcerto, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
