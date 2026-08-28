import React from "react";

interface SportBadgeProps {
  sport?: string;
  className?: string;
}

export function SportBadge({ sport = "Futebol", className = "" }: SportBadgeProps) {
  const s = (sport || "").toLowerCase().trim();

  let label = sport || "Futebol";
  let badgeStyle = "bg-[#2D8659]/10 text-[#2D8659] border-[#2D8659]/25";
  let dotColor = "bg-[#2D8659]";

  if (s.includes("futebol") || s.includes("soccer") || s.includes("football")) {
    label = "Futebol";
    badgeStyle = "bg-[#2D8659]/10 text-[#2D8659] border-[#2D8659]/25";
    dotColor = "bg-[#2D8659]";
  } else if (s.includes("nba") || s.includes("basquete") || s.includes("basket")) {
    label = "Basquete";
    badgeStyle = "bg-[#EA580C]/10 text-[#EA580C] border-[#EA580C]/25";
    dotColor = "bg-[#EA580C]";
  } else if (s.includes("tênis") || s.includes("tenis") || s.includes("tennis") || s.includes("atp") || s.includes("wta")) {
    label = "Tênis";
    badgeStyle = "bg-[#65A30D]/10 text-[#4D7C0F] border-[#65A30D]/25";
    dotColor = "bg-[#65A30D]";
  } else if (s.includes("esport") || s.includes("cs") || s.includes("lol") || s.includes("game")) {
    label = "eSports";
    badgeStyle = "bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/25";
    dotColor = "bg-[#7C3AED]";
  } else if (s.includes("mma") || s.includes("ufc") || s.includes("boxe") || s.includes("luta")) {
    label = "MMA / Luta";
    badgeStyle = "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/25";
    dotColor = "bg-[#DC2626]";
  } else if (s.includes("volei") || s.includes("vôlei") || s.includes("volleyball")) {
    label = "Vôlei";
    badgeStyle = "bg-[#0284C7]/10 text-[#0284C7] border-[#0284C7]/25";
    dotColor = "bg-[#0284C7]";
  } else if (s.includes("f1") || s.includes("formula") || s.includes("corrida") || s.includes("nascar")) {
    label = "Fórmula 1";
    badgeStyle = "bg-[#475569]/10 text-[#334155] border-[#475569]/25";
    dotColor = "bg-[#334155]";
  } else if (s) {
    label = sport;
    badgeStyle = "bg-[#6B645A]/10 text-[#1A1715] border-black/10";
    dotColor = "bg-[#6B645A]";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-tight border transition-all whitespace-nowrap ${badgeStyle} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span>{label}</span>
    </span>
  );
}
