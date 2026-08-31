"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { VALOR_UNIDADE } from "@/lib/constants";

const CHAVE = "geogetips:unidade";

interface UnidadeContexto {
  /** Valor em reais de 1u para quem está lendo o site. */
  unidade: number;
  definirUnidade: (valor: number) => void;
  restaurarPadrao: () => void;
  /** true quando o visitante escolheu uma unidade diferente da do grupo. */
  personalizada: boolean;
  /**
   * Converte um valor em reais da planilha (base R$ 100,00) para a banca de
   * quem está lendo. ROI e taxa de acerto são razões e NÃO passam por aqui.
   */
  converter: (valorEmReais: number) => number;
}

const Ctx = createContext<UnidadeContexto | null>(null);

function valido(n: number): boolean {
  return Number.isFinite(n) && n > 0;
}

export function UnidadeProvider({ children }: { children: React.ReactNode }) {
  // Começa sempre na unidade do grupo para que servidor e cliente rendam igual;
  // a preferência salva entra depois da hidratação.
  const [unidade, setUnidade] = useState<number>(VALOR_UNIDADE);

  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(CHAVE);
      if (salvo) {
        const n = parseFloat(salvo);
        if (valido(n)) setUnidade(n);
      }
    } catch {
      // localStorage indisponível (aba privada, storage bloqueado)
    }
  }, []);

  const definirUnidade = useCallback((valor: number) => {
    if (!valido(valor)) return;
    setUnidade(valor);
    try {
      window.localStorage.setItem(CHAVE, String(valor));
    } catch {
      // segue funcionando na sessão mesmo sem conseguir persistir
    }
  }, []);

  const restaurarPadrao = useCallback(() => {
    setUnidade(VALOR_UNIDADE);
    try {
      window.localStorage.removeItem(CHAVE);
    } catch {
      // nada a fazer
    }
  }, []);

  const valor = useMemo<UnidadeContexto>(() => {
    const fator = unidade / VALOR_UNIDADE;
    return {
      unidade,
      definirUnidade,
      restaurarPadrao,
      personalizada: unidade !== VALOR_UNIDADE,
      converter: (v: number) => parseFloat((v * fator).toFixed(2)),
    };
  }, [unidade, definirUnidade, restaurarPadrao]);

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useUnidade(): UnidadeContexto {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useUnidade precisa estar dentro de <UnidadeProvider>");
  }
  return ctx;
}
