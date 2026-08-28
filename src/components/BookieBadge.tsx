import React from "react";

interface BookieBadgeProps {
  bookie?: string;
  className?: string;
}

export function BookieBadge({ bookie = "", className = "" }: BookieBadgeProps) {
  const b = (bookie || "").toLowerCase().trim();

  if (!bookie) return null;

  // 1. BETANO (Laranja Betano)
  if (b.includes("betano") || b.includes("betao")) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-tight bg-[#E85D04] text-white shadow-xs whitespace-nowrap ${className}`}
      >
        <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-black">
          B
        </span>
        <span>Betano</span>
      </span>
    );
  }

  // 2. BET365 (Verde escuro com detalhe amarelo)
  if (b.includes("bet365") || b.includes("365")) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-tight bg-[#007B40] text-[#FFDF1B] shadow-xs whitespace-nowrap ${className}`}
      >
        <span className="text-white font-black text-[9.5px]">bet</span>
        <span className="font-black text-[#FFDF1B]">365</span>
      </span>
    );
  }

  // 3. NOVIBET (Vermelho / Coral)
  if (b.includes("novibet") || b.includes("novi")) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-tight bg-[#E63946] text-white shadow-xs whitespace-nowrap ${className}`}
      >
        <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-black">
          N
        </span>
        <span>Novibet</span>
      </span>
    );
  }

  // 4. SPORTINGBET (Azul Royal)
  if (b.includes("sportingbet") || b.includes("sporting")) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-tight bg-[#0055B8] text-white shadow-xs whitespace-nowrap ${className}`}
      >
        <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-black">
          S
        </span>
        <span>Sportingbet</span>
      </span>
    );
  }

  // 5. BETPIX365 / BETPIX (Turquesa / Teal)
  if (b.includes("betpix") || b.includes("pix")) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-tight bg-[#00A896] text-white shadow-xs whitespace-nowrap ${className}`}
      >
        <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-black">
          P
        </span>
        <span>{bookie}</span>
      </span>
    );
  }

  // 6. LOTTU / LOTTOLAND (Roxo / Violeta)
  if (b.includes("lottu") || b.includes("lotto")) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-tight bg-[#6B21A8] text-white shadow-xs whitespace-nowrap ${className}`}
      >
        <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-black">
          L
        </span>
        <span>Lottu</span>
      </span>
    );
  }

  // 7. ONA / ONA BET (Laranja Quente)
  if (b.includes("ona")) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-tight bg-[#F97316] text-white shadow-xs whitespace-nowrap ${className}`}
      >
        <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-black">
          O
        </span>
        <span>Ona Bet</span>
      </span>
    );
  }

  // 8. APOSTA GANHA (Verde Bandeira)
  if (b.includes("aposta ganha") || b.includes("apostaganha")) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-tight bg-[#16A34A] text-white shadow-xs whitespace-nowrap ${className}`}
      >
        <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-black">
          AG
        </span>
        <span>Aposta Ganha</span>
      </span>
    );
  }

  // 9. ESPORTES DA SORTE (Azul Royal Profundo)
  if (b.includes("esporte da sorte") || b.includes("esportes da sorte")) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-tight bg-[#1D4ED8] text-white shadow-xs whitespace-nowrap ${className}`}
      >
        <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-black">
          EDS
        </span>
        <span>Esportes da Sorte</span>
      </span>
    );
  }

  // 10. 7GAMES / 7K BET (Dourado / Âmbar)
  if (b.includes("7games") || b.includes("7k")) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-tight bg-[#D97706] text-white shadow-xs whitespace-nowrap ${className}`}
      >
        <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-black">
          7
        </span>
        <span>{bookie}</span>
      </span>
    );
  }

  // 11. SUPERBET (Vermelho Carmesim)
  if (b.includes("superbet") || b.includes("super")) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-tight bg-[#E11D48] text-white shadow-xs whitespace-nowrap ${className}`}
      >
        <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-black">
          S
        </span>
        <span>Superbet</span>
      </span>
    );
  }

  // 12. KTO (Vermelho Escuro)
  if (b.includes("kto")) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-tight bg-[#B91C1C] text-white shadow-xs whitespace-nowrap ${className}`}
      >
        <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-black">
          K
        </span>
        <span>KTO</span>
      </span>
    );
  }

  // 13. ESTRELABET (Dourado / Amarelo Estrela)
  if (b.includes("estrela") || b.includes("estrelabet")) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-tight bg-[#CA8A04] text-black shadow-xs whitespace-nowrap ${className}`}
      >
        <span className="w-3.5 h-3.5 rounded-full bg-black/20 flex items-center justify-center text-[9px] font-black">
          ★
        </span>
        <span>EstrelaBet</span>
      </span>
    );
  }

  // 14. BETFAIR (Amarelo Ouro)
  if (b.includes("betfair")) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-tight bg-[#EAB308] text-black shadow-xs whitespace-nowrap ${className}`}
      >
        <span className="w-3.5 h-3.5 rounded-full bg-black/20 flex items-center justify-center text-[9px] font-black">
          BF
        </span>
        <span>Betfair</span>
      </span>
    );
  }

  // 15. BETNACIONAL (Azul Marinho com Amarelo)
  if (b.includes("betnacional") || b.includes("nacional")) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-tight bg-[#1E3A8A] text-[#FACC15] shadow-xs whitespace-nowrap ${className}`}
      >
        <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-black text-white">
          BN
        </span>
        <span>Betnacional</span>
      </span>
    );
  }

  // 16. STAKE (Grafite / Slate Escuro)
  if (b.includes("stake")) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-tight bg-[#0F172A] text-white shadow-xs whitespace-nowrap ${className}`}
      >
        <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-black">
          S
        </span>
        <span>Stake</span>
      </span>
    );
  }

  // DEFAULT / OUTRAS CASAS (Pílula neutra elegante)
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold tracking-tight bg-[#EFECE6] text-[#1A1715] border border-black/10 whitespace-nowrap ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[#6B645A]" />
      <span>{bookie}</span>
    </span>
  );
}
