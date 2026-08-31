import React from "react";
import { normalizarTexto } from "@/lib/texto";

interface SportBadgeProps {
  sport?: string;
  className?: string;
}

interface RegraEsporte {
  padroes: string[];
  rotulo: string;
  estilo: string;
  ponto: string;
}

/**
 * Ordem importa: padrão específico antes de genérico.
 * "corrida de cavalos" precisa vir antes de "corrida", que identificava F1.
 */
const REGRAS: RegraEsporte[] = [
  {
    padroes: ["corrida de cavalo", "turfe", "jockey", "galope"],
    rotulo: "Turfe",
    estilo: "bg-[#92400E]/10 text-[#92400E] border-[#92400E]/25",
    ponto: "bg-[#92400E]",
  },
  {
    padroes: ["futebol americano", "nfl"],
    rotulo: "NFL",
    estilo: "bg-[#7F1D1D]/10 text-[#7F1D1D] border-[#7F1D1D]/25",
    ponto: "bg-[#7F1D1D]",
  },
  {
    padroes: ["futebol", "soccer", "football"],
    rotulo: "Futebol",
    estilo: "bg-[#2D8659]/10 text-[#2D8659] border-[#2D8659]/25",
    ponto: "bg-[#2D8659]",
  },
  {
    padroes: ["nba", "basquete", "basket", "ncaa"],
    rotulo: "Basquete",
    estilo: "bg-[#EA580C]/10 text-[#EA580C] border-[#EA580C]/25",
    ponto: "bg-[#EA580C]",
  },
  {
    padroes: ["tenis", "tennis", "atp", "wta"],
    rotulo: "Tênis",
    estilo: "bg-[#65A30D]/10 text-[#4D7C0F] border-[#65A30D]/25",
    ponto: "bg-[#65A30D]",
  },
  {
    padroes: ["esports", "e-sports", "cs2", "csgo", "counter", "lol", "league of legends", "valorant", "dota"],
    rotulo: "eSports",
    estilo: "bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/25",
    ponto: "bg-[#7C3AED]",
  },
  {
    padroes: ["mma", "ufc", "boxe", "boxing", "luta"],
    rotulo: "MMA / Luta",
    estilo: "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/25",
    ponto: "bg-[#DC2626]",
  },
  {
    padroes: ["volei", "volleyball"],
    rotulo: "Vôlei",
    estilo: "bg-[#0284C7]/10 text-[#0284C7] border-[#0284C7]/25",
    ponto: "bg-[#0284C7]",
  },
  {
    padroes: ["hoquei", "hockey", "nhl"],
    rotulo: "NHL",
    estilo: "bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/25",
    ponto: "bg-[#0F766E]",
  },
  {
    padroes: ["beisebol", "baseball", "mlb"],
    rotulo: "MLB",
    estilo: "bg-[#1E40AF]/10 text-[#1E40AF] border-[#1E40AF]/25",
    ponto: "bg-[#1E40AF]",
  },
  {
    padroes: ["f1", "formula", "nascar", "automobilismo", "corrida"],
    rotulo: "Fórmula 1",
    estilo: "bg-[#475569]/10 text-[#334155] border-[#475569]/25",
    ponto: "bg-[#334155]",
  },
];

export function SportBadge({ sport = "Futebol", className = "" }: SportBadgeProps) {
  const nome = (sport || "").trim();
  if (!nome) return null;

  const alvo = normalizarTexto(nome);
  const regra = REGRAS.find((r) => r.padroes.some((p) => alvo.includes(p)));

  const rotulo = regra?.rotulo ?? nome;
  const estilo = regra?.estilo ?? "bg-[#6B645A]/10 text-[#1A1715] border-black/10";
  const ponto = regra?.ponto ?? "bg-[#6B645A]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-tight border transition-all whitespace-nowrap ${estilo} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ponto}`} />
      <span>{rotulo}</span>
    </span>
  );
}
