"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BetItem } from "@/lib/types";
import type { BetStats } from "@/lib/stats";
import { abaDoMesAtual, abasRecentes } from "@/lib/constants";

interface UseBetsOptions {
  /** Não baixa o array de apostas — para telas que só mostram agregados. */
  onlyStats?: boolean;
}

export interface UseBetsResult {
  bets: BetItem[];
  stats: BetStats | null;
  tabs: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  loading: boolean;
  /** Mensagem de erro da API, ou null. */
  erro: string | null;
  /** true quando a API está servindo dados de demonstração. */
  isMock: boolean;
  /** ISO de quando o servidor montou a resposta, ou null. */
  lidoEm: string | null;
  recarregar: () => void;
}

/**
 * Fonte única de dados das quatro páginas.
 *
 * Cada troca de aba aborta a requisição anterior — sem isso, uma resposta lenta
 * de um mês pode chegar depois e sobrescrever a do mês que já está selecionado.
 */
export function useBets({ onlyStats = false }: UseBetsOptions = {}): UseBetsResult {
  const [activeTab, setActiveTab] = useState<string>(abaDoMesAtual());
  const [tabs, setTabs] = useState<string[]>(abasRecentes());
  const [bets, setBets] = useState<BetItem[]>([]);
  const [stats, setStats] = useState<BetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [lidoEm, setLidoEm] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const [nonce, setNonce] = useState(0);

  const recarregar = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    async function carregar() {
      setLoading(true);
      setErro(null);

      try {
        const params = new URLSearchParams({ tab: activeTab });
        if (onlyStats) params.set("only", "stats");

        const res = await fetch(`/api/bets?${params}`, {
          signal: controller.signal,
          // O servidor já revalida por conta própria; sem isto o navegador
          // pode segurar números velhos por minutos num painel de resultados.
          cache: "no-store",
        });
        const json = await res.json();

        if (controller.signal.aborted) return;

        if (!res.ok || !json.success) {
          setErro(json?.error || `A planilha não respondeu (HTTP ${res.status}).`);
          setBets([]);
          setStats(null);
          setLidoEm(null);
          return;
        }

        setIsMock(Boolean(json.isMock));
        setLidoEm(typeof json.lidoEm === "string" ? json.lidoEm : null);
        setStats(json.stats ?? null);
        setBets(Array.isArray(json.data) ? json.data : []);
        if (Array.isArray(json.tabs) && json.tabs.length > 0) setTabs(json.tabs);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        setErro("Não foi possível falar com o servidor. Verifique sua conexão.");
        setBets([]);
        setStats(null);
        setLidoEm(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    carregar();
    return () => controller.abort();
  }, [activeTab, onlyStats, nonce]);

  return {
    bets,
    stats,
    tabs,
    activeTab,
    setActiveTab,
    loading,
    erro,
    isMock,
    lidoEm,
    recarregar,
  };
}
