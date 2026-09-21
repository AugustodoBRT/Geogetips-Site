"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BetItem } from "@/lib/types";
import type { BetStats } from "@/lib/stats";
import { abaDoMesAtual, abasRecentes } from "@/lib/constants";
import { useReleituraAutomatica } from "@/hooks/useReleituraAutomatica";

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
  /** Há requisição em curso — serve à barra de progresso. */
  loading: boolean;
  /**
   * true quando a tela deve mostrar esqueleto em vez do conteúdo.
   *
   * Há dois tipos de espera, e tratá-los igual é o que faz o painel piscar à
   * toa:
   *
   * - **Não há o que mostrar** — primeira carga, ou troca de aba. Aqui o
   *   esqueleto é obrigatório. Segurar os números de julho embaixo de um
   *   cabeçalho que já diz agosto seria mostrar dado errado num site cuja
   *   promessa inteira é bater com a planilha linha a linha.
   * - **Já há o que mostrar** — botão de atualizar, mesma aba. Os números
   *   continuam certos até chegar a resposta, então ficam onde estão e só a
   *   barra de progresso avisa que há leitura em curso. Apagar a tela para
   *   redesenhar quase o mesmo número é perda pura para quem está lendo.
   */
  mostrarEsqueleto: boolean;
  /** Mensagem de erro da API, ou null. */
  erro: string | null;
  /** true quando a API está servindo dados de demonstração. */
  isMock: boolean;
  /** ISO de quando o servidor montou a resposta, ou null. */
  lidoEm: string | null;
  recarregar: () => void;
}

/**
 * Fonte única de dados das páginas que leem uma aba.
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
  // Aba a que os dados em memória pertencem. null enquanto nada chegou.
  // Vive em estado (a tela precisa reagir) e em ref (o efeito precisa ler sem
  // se declarar dependente dela, senão cada leitura dispararia a seguinte).
  const [abaCarregada, setAbaCarregada] = useState<string | null>(null);
  const abaCarregadaRef = useRef<string | null>(null);
  const registrarAba = useCallback((aba: string | null) => {
    abaCarregadaRef.current = aba;
    setAbaCarregada(aba);
  }, []);
  const [erro, setErro] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [lidoEm, setLidoEm] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const [nonce, setNonce] = useState(0);
  // Aba que o servidor escolheu no lugar da pedida. Guardada para que alinhar
  // o seletor a ela não dispare uma segunda leitura do mesmo dado.
  const abaJaCarregada = useRef<string | null>(null);

  const recarregar = useCallback(() => setNonce((n) => n + 1), []);

  // Releitura de fundo: sem barra de progresso e sem apagar a tela se falhar.
  // A próxima leitura consome a marca e volta ao normal.
  const silenciosaRef = useRef(false);
  const releituraSilenciosa = useCallback(() => {
    silenciosaRef.current = true;
    setNonce((n) => n + 1);
  }, []);
  useReleituraAutomatica(releituraSilenciosa);

  useEffect(() => {
    // Consumida logo na entrada: se o efeito saísse cedo sem lê-la, a marca
    // ficaria de pé e a próxima leitura pedida à mão sairia sem barra.
    const silenciosa = silenciosaRef.current;
    silenciosaRef.current = false;

    if (abaJaCarregada.current === activeTab) {
      abaJaCarregada.current = null;
      return;
    }
    // Trocou de aba: o que está na tela é de outro mês e sai agora. Numa
    // releitura da mesma aba os dados ficam onde estão — ver `mostrarEsqueleto`.
    if (abaCarregadaRef.current !== null && abaCarregadaRef.current !== activeTab) {
      setBets([]);
      setStats(null);
      setLidoEm(null);
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    async function carregar() {
      if (!silenciosa) {
        setLoading(true);
        setErro(null);
      }

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
          // Uma releitura de fundo que falha não derruba o que já está na tela:
          // os números de um minuto atrás continuam certos até a próxima.
          if (silenciosa) return;
          setErro(json?.error || `A planilha não respondeu (HTTP ${res.status}).`);
          setBets([]);
          setStats(null);
          setLidoEm(null);
          registrarAba(null);
          return;
        }

        setIsMock(Boolean(json.isMock));
        setLidoEm(typeof json.lidoEm === "string" ? json.lidoEm : null);
        // A aba servida pode não ser a pedida: no começo do mês o servidor
        // devolve a mais recente no lugar da que ainda não existe.
        registrarAba(typeof json.activeTab === "string" ? json.activeTab : activeTab);
        setStats(json.stats ?? null);
        setBets(Array.isArray(json.data) ? json.data : []);
        if (Array.isArray(json.tabs) && json.tabs.length > 0) setTabs(json.tabs);
        // No começo do mês a aba nova ainda não existe e o servidor responde com
        // a mais recente. O seletor passa a mostrar a aba que está de fato na tela.
        if (typeof json.activeTab === "string" && json.activeTab !== activeTab) {
          abaJaCarregada.current = json.activeTab;
          setActiveTab(json.activeTab);
        }
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        if (silenciosa) return;
        setErro("Não foi possível falar com o servidor. Verifique sua conexão.");
        setBets([]);
        setStats(null);
        setLidoEm(null);
        registrarAba(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    carregar();
    return () => controller.abort();
  }, [activeTab, onlyStats, nonce, registrarAba]);

  return {
    bets,
    stats,
    tabs,
    activeTab,
    setActiveTab,
    loading,
    mostrarEsqueleto: loading && abaCarregada !== activeTab,
    erro,
    isMock,
    lidoEm,
    recarregar,
  };
}
