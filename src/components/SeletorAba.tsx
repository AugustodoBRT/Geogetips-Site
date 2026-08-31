"use client";

import { RefreshCw } from "lucide-react";
import { ABA_TODOS, ordemDaAba } from "@/lib/constants";

interface SeletorAbaProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
  onRecarregar: () => void;
  loading: boolean;
  id?: string;
}

/** Seletor de mês + botão de recarregar, com rótulos acessíveis. */
export function SeletorAba({
  tabs,
  activeTab,
  onChange,
  onRecarregar,
  loading,
  id = "seletor-aba",
}: SeletorAbaProps) {
  return (
    <div className="flex items-center gap-2.5">
      <label htmlFor={id} className="sr-only">
        Selecionar mês
      </label>
      <select
        id={id}
        value={activeTab}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white border border-black/[0.12] rounded-full px-4 py-2 text-xs font-bold text-[#1A1715] outline-none focus-visible:ring-2 focus-visible:ring-[#C7522A] cursor-pointer shadow-sm hover:border-black/30 transition-all"
      >
        <option value={ABA_TODOS}>Todos os Meses (Geral)</option>
        {[...tabs]
          .sort((a, b) => ordemDaAba(b) - ordemDaAba(a))
          .map((tab) => (
            <option key={tab} value={tab}>
              Aba: {tab}
            </option>
          ))}
      </select>

      <button
        type="button"
        onClick={onRecarregar}
        disabled={loading}
        aria-label="Recarregar dados"
        title="Recarregar dados"
        className="p-2 bg-white border border-black/[0.12] rounded-full text-[#6B645A] hover:text-[#1A1715] focus-visible:ring-2 focus-visible:ring-[#C7522A] transition-all disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}
