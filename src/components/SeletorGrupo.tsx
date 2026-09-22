"use client";

import { Clock3 } from "lucide-react";
import { doISO } from "@/lib/date";
import { type Grupo, grupoDoId, type IdGrupo, ultimoDiaVisivel } from "@/lib/grupos";

/**
 * Qual grupo a tela mostra: o gratuito ou o GeogeTips - Sigma (#72).
 *
 * Só aparece com mais de um grupo configurado. Enquanto a planilha do Sigma
 * não existir, o servidor oferece um grupo só e a tela fica como sempre foi.
 */
export function SeletorGrupo({
  grupos,
  grupo,
  onChange,
}: {
  grupos: readonly Grupo[];
  grupo: IdGrupo;
  onChange: (grupo: IdGrupo) => void;
}) {
  if (grupos.length < 2) return null;
  return (
    // biome-ignore lint/a11y/useSemanticElements: o que a regra pede no lugar é <fieldset>, que traz borda, margem e padding do navegador; aqui é uma barra de botões, como a de visualização ao lado.
    <div
      role="group"
      aria-label="Grupo"
      className="inline-flex items-center bg-[var(--bg-card)] border border-tinta/[0.12] rounded-full p-0.5 shadow-sm"
    >
      {grupos.map((g) => (
        <button
          key={g.id}
          type="button"
          aria-pressed={grupo === g.id}
          title={g.nome}
          onClick={() => onChange(g.id)}
          className={`px-3 py-1.5 min-h-[28px] rounded-full text-xs font-bold transition-colors ${
            grupo === g.id
              ? "bg-[var(--accent)] text-[var(--sobre-cor)]"
              : "text-[var(--text-2)] hover:text-[var(--accent)]"
          }`}
        >
          {g.curto}
        </button>
      ))}
    </div>
  );
}

/**
 * O aviso do atraso público, quando o grupo na tela tem um.
 *
 * Sem ele, quem compara o Sigma com o canal pago veria as apostas mais
 * recentes "faltando" e acharia que o site está atrasado por defeito.
 */
export function AvisoAtraso({ grupo }: { grupo: IdGrupo }) {
  const { nome, atrasoDias } = grupoDoId(grupo);
  if (atrasoDias <= 0) return null;

  const limite = new Date(ultimoDiaVisivel(atrasoDias));
  const iso = `${limite.getFullYear()}-${String(limite.getMonth() + 1).padStart(2, "0")}-${String(limite.getDate()).padStart(2, "0")}`;

  return (
    <div
      role="note"
      className="bg-[var(--accent-soft)] border border-[color:color-mix(in_srgb,var(--accent)_20%,transparent)] rounded-2xl px-5 py-4 flex items-start gap-3"
    >
      <Clock3
        className="w-4 h-4 text-[var(--accent)] mt-0.5 shrink-0"
        aria-hidden="true"
      />
      <p className="text-[13px] text-[var(--text-2)] leading-relaxed">
        <strong className="text-[var(--text)]">
          Resultados do {nome} com {atrasoDias} dias de atraso.
        </strong>{" "}
        Cada aposta aparece aqui {atrasoDias} dias depois da data do jogo, para as
        entradas do grupo não circularem de graça. Hoje o site mostra as apostas até{" "}
        <strong className="text-[var(--text)]">{doISO(iso)}</strong>.
      </p>
    </div>
  );
}
