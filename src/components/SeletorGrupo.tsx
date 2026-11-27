"use client";

import { Clock3 } from "lucide-react";
import { doISO, isoDoTimestamp } from "@/lib/date";
import { type Grupo, grupoDoId, type IdGrupo, ultimoDiaVisivel } from "@/lib/grupos";
import { textoDosControles } from "@/texto/controles";

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
      aria-label={textoDosControles().grupo.aria}
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

  // `isoDoTimestamp` e não acessor local: `ultimoDiaVisivel` devolve meia-noite
  // UTC, e `getDate()` aqui mostraria o dia anterior para quem lê a oeste de
  // Greenwich. Ver a convenção no topo de lib/date.ts.
  const iso = isoDoTimestamp(ultimoDiaVisivel(atrasoDias));

  return (
    <div
      role="note"
      className="bg-[var(--accent-soft)] border border-[color:color-mix(in_srgb,var(--accent)_20%,transparent)] rounded-2xl px-5 py-4 flex items-start gap-3"
    >
      <Clock3
        className="w-4 h-4 text-[var(--accent)] mt-0.5 shrink-0"
        aria-hidden="true"
      />
      {/* Dois destaques com o mesmo desenho, e por isso sem papel: o
          dicionário diz quais trechos são fortes, e esta tela os desenha
          igual. */}
      <p className="text-[13px] text-[var(--text-2)] leading-relaxed">
        {textoDosControles()
          .grupo.atraso({ grupo: nome, dias: atrasoDias, ate: doISO(iso) })
          .map((parte, i) =>
            typeof parte === "string" ? (
              parte
            ) : (
              // biome-ignore lint/suspicious/noArrayIndexKey: a frase é fixa
              <strong key={i} className="text-[var(--text)]">
                {parte.forte}
              </strong>
            )
          )}
      </p>
    </div>
  );
}
