"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ResumoMes } from "@/app/api/resumo/route";
import { useReleituraAutomatica } from "@/hooks/useReleituraAutomatica";

export interface UseResumoMensal {
  meses: ResumoMes[];
  consolidado: ResumoMes | null;
  /** Há requisição em curso — serve à barra de progresso. */
  loading: boolean;
  /** true quando a tela deve mostrar esqueleto. Ver a nota em `useBets`. */
  mostrarEsqueleto: boolean;
  erro: string | null;
  isMock: boolean;
  recarregar: () => void;
}

export function useResumoMensal(): UseResumoMensal {
  const [meses, setMeses] = useState<ResumoMes[]>([]);
  const [consolidado, setConsolidado] = useState<ResumoMes | null>(null);
  const [loading, setLoading] = useState(true);
  const [primeiraCarga, setPrimeiraCarga] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [nonce, setNonce] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const recarregar = useCallback(() => setNonce((n) => n + 1), []);

  // Mesma releitura de fundo do useBets: silenciosa, e sem apagar a tela se
  // falhar.
  const silenciosaRef = useRef(false);
  const releituraSilenciosa = useCallback(() => {
    silenciosaRef.current = true;
    setNonce((n) => n + 1);
  }, []);
  useReleituraAutomatica(releituraSilenciosa);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const silenciosa = silenciosaRef.current;
    silenciosaRef.current = false;

    async function carregar() {
      if (!silenciosa) {
        setLoading(true);
        setErro(null);
      }
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
          if (silenciosa) return;
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
        if (silenciosa) return;
        setErro("Não foi possível falar com o servidor. Verifique sua conexão.");
        setMeses([]);
        setConsolidado(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setPrimeiraCarga(false);
        }
      }
    }

    carregar();
    return () => controller.abort();
  }, [nonce]);

  return {
    meses,
    consolidado,
    loading,
    mostrarEsqueleto: loading && primeiraCarga,
    erro,
    isMock,
    recarregar,
  };
}
