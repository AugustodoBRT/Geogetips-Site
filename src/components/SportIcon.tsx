import React from "react";
import { Gamepad2, Swords, Flag, Trophy } from "lucide-react";

interface SportIconProps {
  sport?: string;
  className?: string;
}

export function SportIcon({ sport = "Futebol", className = "w-4 h-4" }: SportIconProps) {
  const s = (sport || "").toLowerCase().trim();

  // 1. FUTEBOL (Bola com pentágono central e costuras reais)
  if (s.includes("futebol") || s.includes("soccer") || s.includes("football")) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <circle cx="12" cy="12" r="10" />
        <polygon points="12,7 15.5,9.5 14.2,13.5 9.8,13.5 8.5,9.5" />
        <line x1="12" y1="7" x2="12" y2="2" />
        <line x1="15.5" y1="9.5" x2="20.5" y2="7.5" />
        <line x1="14.2" y1="13.5" x2="18.2" y2="18.2" />
        <line x1="9.8" y1="13.5" x2="5.8" y2="18.2" />
        <line x1="8.5" y1="9.5" x2="3.5" y2="7.5" />
      </svg>
    );
  }

  // 2. BASQUETE / NBA (Bola com costuras curvas clássicas da NBA)
  if (s.includes("nba") || s.includes("basquete") || s.includes("basket")) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="2" x2="12" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M4.93 4.93a10 10 0 0 1 0 14.14" />
        <path d="M19.07 4.93a10 10 0 0 0 0 14.14" />
      </svg>
    );
  }

  // 3. TÊNIS (Bola com as duas costuras curvas características de tênis)
  if (s.includes("tênis") || s.includes("tenis") || s.includes("tennis") || s.includes("atp") || s.includes("wta")) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M18.36 5.64A9 9 0 0 0 5.64 18.36" />
        <path d="M18.36 18.36A9 9 0 0 0 5.64 5.64" />
      </svg>
    );
  }

  // 4. ESPORTS / GAMES (Controle Gamer)
  if (s.includes("esport") || s.includes("cs") || s.includes("lol") || s.includes("game")) {
    return <Gamepad2 className={className} strokeWidth={1.75} />;
  }

  // 5. MMA / BOXE / UFC (Espadas / Combate)
  if (s.includes("mma") || s.includes("ufc") || s.includes("boxe") || s.includes("luta")) {
    return <Swords className={className} strokeWidth={1.75} />;
  }

  // 6. VÔLEI (Bola de vôlei com gomos triplos)
  if (s.includes("volei") || s.includes("vôlei") || s.includes("volleyball")) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 12a10 10 0 0 0 8.66-5" />
        <path d="M12 12a10 10 0 0 0-8.66 5" />
        <path d="M12 12v10" />
      </svg>
    );
  }

  // 7. CORRIDA / F1
  if (s.includes("f1") || s.includes("formula") || s.includes("corrida") || s.includes("nascar")) {
    return <Flag className={className} strokeWidth={1.75} />;
  }

  // DEFAULT: Troféu
  return <Trophy className={className} strokeWidth={1.75} />;
}
