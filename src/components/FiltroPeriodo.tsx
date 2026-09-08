"use client";

import { X } from "lucide-react";

interface FiltroPeriodoProps {
  /** Datas em "YYYY-MM-DD" — o formato que input[type=date] fala. */
  de: string;
  ate: string;
  onChange: (de: string, ate: string) => void;
  /** Limites da aba carregada, para o calendário não oferecer dia vazio. */
  min?: string;
  max?: string;
  className?: string;
}

const CAMPO =
  "bg-[var(--bg)] border border-black/[0.06] rounded-full px-2.5 py-1 text-xs font-semibold text-[var(--text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] cursor-pointer hover:border-[var(--accent)]/60 transition-colors";

/**
 * Intervalo de datas, aberto dos dois lados.
 *
 * Só "de" filtra tudo a partir daquele dia; só "até" filtra tudo antes dele; os
 * dois iguais dão um único dia. Por isso substitui o antigo seletor de dia sem
 * perder nada — e o `max`/`min` cruzado impede escolher um fim anterior ao
 * começo, que devolveria lista vazia sem explicar o motivo.
 */
export function FiltroPeriodo({
  de,
  ate,
  onChange,
  min,
  max,
  className = "",
}: FiltroPeriodoProps) {
  const ativo = de !== "" || ate !== "";

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className="text-[11px] font-medium text-[var(--text-3)]">De</span>
      <label htmlFor="periodo-de" className="sr-only">
        Data inicial
      </label>
      <input
        id="periodo-de"
        type="date"
        value={de}
        min={min}
        max={ate || max}
        onChange={(ev) => onChange(ev.target.value, ate)}
        className={CAMPO}
      />

      <span className="text-[11px] font-medium text-[var(--text-3)]">até</span>
      <label htmlFor="periodo-ate" className="sr-only">
        Data final
      </label>
      <input
        id="periodo-ate"
        type="date"
        value={ate}
        min={de || min}
        max={max}
        onChange={(ev) => onChange(de, ev.target.value)}
        className={CAMPO}
      />

      {ativo && (
        <button
          type="button"
          onClick={() => onChange("", "")}
          aria-label="Limpar intervalo de datas"
          title="Limpar intervalo de datas"
          className="w-5 h-5 rounded-full border border-black/[0.1] text-[var(--text-2)] hover:text-[var(--red)] hover:border-[var(--red)]/40 flex items-center justify-center transition-colors"
        >
          <X className="w-3 h-3" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
