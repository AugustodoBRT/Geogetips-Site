"use client";

import { ArrowLeftRight, X } from "lucide-react";

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
  "bg-[var(--bg)] border border-tinta/[0.06] rounded-full px-2.5 py-1 text-xs font-semibold text-[var(--text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] cursor-pointer hover:border-[color:color-mix(in_srgb,var(--accent)_60%,transparent)] transition-colors";

/**
 * Intervalo de datas, aberto dos dois lados.
 *
 * Só "de" filtra tudo a partir daquele dia; só "até" filtra tudo antes dele; os
 * dois iguais dão um único dia. Por isso substitui o antigo seletor de dia sem
 * perder nada — e o `max`/`min` cruzado impede escolher um fim anterior ao
 * começo, que devolveria lista vazia sem explicar o motivo.
 *
 * O cruzamento vale para o calendário, mas não para quem digita a data direto
 * no campo: aí dá para pôr 15/09 até 10/09, e a tela respondia "Nenhuma aposta
 * corresponde aos filtros" — verdade, e inútil. Invertido, o filtro diz o que
 * houve e oferece trocar as pontas.
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
  const invertido = de !== "" && ate !== "" && de > ate;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
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

      {invertido && (
        <button
          type="button"
          onClick={() => onChange(ate, de)}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-[color:color-mix(in_srgb,var(--amber)_45%,transparent)] bg-[var(--amber-soft)] text-[10.5px] font-semibold text-[var(--amber)] hover:border-[var(--amber)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors"
        >
          <ArrowLeftRight className="w-3 h-3" aria-hidden="true" />A data inicial está
          depois da final — trocar
        </button>
      )}

      {ativo && (
        <button
          type="button"
          onClick={() => onChange("", "")}
          aria-label="Limpar intervalo de datas"
          title="Limpar intervalo de datas"
          className="w-[24px] h-[24px] rounded-full border border-tinta/[0.1] text-[var(--text-2)] hover:text-[var(--red)] hover:border-[color:color-mix(in_srgb,var(--red)_40%,transparent)] flex items-center justify-center transition-colors"
        >
          <X className="w-3 h-3" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
