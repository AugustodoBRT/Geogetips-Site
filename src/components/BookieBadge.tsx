import React from "react";
import { normalizarTexto } from "@/lib/texto";

interface BookieBadgeProps {
  bookie?: string;
  className?: string;
}

interface Regra {
  /** Trechos que identificam a casa. Testados como substring do nome normalizado. */
  padroes: string[];
  rotulo: string;
  classes: string;
  /** Monograma no círculo. Omitir para badges com marca desenhada à parte. */
  inicial?: string;
  marca?: React.ReactNode;
}

/**
 * Ordem importa: a primeira regra que casar vence, então os padrões mais
 * específicos vêm antes dos mais genéricos. "betpix365" precisa ser testado
 * antes de "365", e "betnacional" antes de "ona".
 */
const REGRAS: Regra[] = [
  {
    padroes: ["betpix", "pixbet", "pix"],
    rotulo: "BetPix365",
    classes: "bg-[#00A896] text-white",
    inicial: "P",
  },
  {
    padroes: ["betnacional", "bet nacional", "nacional"],
    rotulo: "Betnacional",
    classes: "bg-[#EAB308] text-black",
    inicial: "N",
  },
  {
    padroes: ["bet365"],
    rotulo: "Bet365",
    classes: "bg-[#007B40] text-[#FFDF1B]",
    marca: (
      <>
        <span className="text-white font-black text-[9.5px]">bet</span>
        <span className="font-black text-[#FFDF1B]">365</span>
      </>
    ),
  },
  {
    padroes: ["betano"],
    rotulo: "Betano",
    classes: "bg-[#E85D04] text-white",
    inicial: "B",
  },
  {
    padroes: ["novibet", "novi"],
    rotulo: "Novibet",
    classes: "bg-[#E63946] text-white",
    inicial: "N",
  },
  {
    padroes: ["sportingbet", "sporting"],
    rotulo: "Sportingbet",
    classes: "bg-[#0055B8] text-white",
    inicial: "S",
  },
  {
    padroes: ["lottu", "lotto"],
    rotulo: "Lottu",
    classes: "bg-[#6B21A8] text-white",
    inicial: "L",
  },
  {
    padroes: ["ona bet", "onabet"],
    rotulo: "Ona Bet",
    classes: "bg-[#F97316] text-white",
    inicial: "O",
  },
  {
    padroes: ["aposta ganha", "apostaganha"],
    rotulo: "Aposta Ganha",
    classes: "bg-[#16A34A] text-white",
    inicial: "A",
  },
  {
    padroes: ["esporte da sorte", "esportes da sorte", "esportedasorte"],
    rotulo: "Esportes da Sorte",
    classes: "bg-[#1D4ED8] text-white",
    inicial: "E",
  },
  {
    padroes: ["7games", "7k"],
    rotulo: "7Games",
    classes: "bg-[#D97706] text-white",
    inicial: "7",
  },
  {
    padroes: ["superbet"],
    rotulo: "Superbet",
    classes: "bg-[#E11D48] text-white",
    inicial: "S",
  },
  {
    padroes: ["kto"],
    rotulo: "KTO",
    classes: "bg-[#B91C1C] text-white",
    inicial: "K",
  },
  {
    padroes: ["estrelabet", "estrela"],
    rotulo: "EstrelaBet",
    classes: "bg-[#CA8A04] text-black",
    inicial: "E",
  },
  {
    padroes: ["betfair"],
    rotulo: "Betfair",
    classes: "bg-[#1E3A8A] text-[#FACC15]",
    inicial: "F",
  },
  {
    padroes: ["stake"],
    rotulo: "Stake",
    classes: "bg-[#0F172A] text-white",
    inicial: "S",
  },
];

const BASE =
  "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-tight shadow-sm whitespace-nowrap";

export function encontrarCasa(bookie: string): Regra | undefined {
  const alvo = normalizarTexto(bookie);
  return REGRAS.find((r) => r.padroes.some((p) => alvo.includes(p)));
}

export function BookieBadge({ bookie = "", className = "" }: BookieBadgeProps) {
  if (!bookie.trim()) return null;

  const regra = encontrarCasa(bookie);

  if (!regra) {
    return (
      <span
        className={`${BASE} bg-[#EFECE6] text-[#1A1715] ${className}`}
        title={bookie}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#6B645A]" />
        <span>{bookie}</span>
      </span>
    );
  }

  return (
    <span className={`${BASE} ${regra.classes} ${className}`} title={regra.rotulo}>
      {regra.marca ?? (
        <>
          <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-black">
            {regra.inicial}
          </span>
          <span>{regra.rotulo}</span>
        </>
      )}
    </span>
  );
}
