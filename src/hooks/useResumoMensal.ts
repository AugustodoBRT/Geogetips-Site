"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ResumoMes } from "@/app/api/resumo/route";

export interface UseResumoMensal {
  meses: ResumoMes[];
  consolidado: ResumoMes | null;
  loading: boolean;
  erro: string | null;
  isMock: boolean;
  recarregar: () => void;
}

export function useResumoMensal(): UseResumoMensal {
  const [meses, setMeses] = useState<ResumoMes[]>([]);
  const [consolidado, setConsolidado] = useState<ResumoMes | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [nonce, setNonce] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const recarregar = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    async function carregar() {
      setLoading(true);
      setErro(null);
      try {
        const res = await fetch("/api/resumo", {
          signal: controller.signal,
          // O servidor já revalida por conta própria; sem isto o navegador
          // pode segurar números velhos por minutos num painel de resultados.
          cache: "no-store",
        });
        const json = await res.json();
        if (controller.signal.aborted) return;

        if (!res.ok || !json.success) {
          setErro(json?.error || `A planilha não respondeu (HTTP ${res.status}).`);
          setMeses([]);
          setConsolidado(null);
          return;
        }

        setIsMock(Boolean(json.isMock));
        setMeses(Array.isArray(json.meses) ? json.meses : []);
        setConsolidado(json.consolidado ?? null);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        setErro("Não foi possível falar com o servidor. Verifique sua conexão.");
        setMeses([]);
        setConsolidado(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    carregar();
    return () => controller.abort();
  }, [nonce]);

  return { meses, consolidado, loading, erro, isMock, recarregar };
}
