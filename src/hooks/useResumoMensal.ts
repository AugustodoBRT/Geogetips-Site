"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ResumoMes } from "@/app/api/resumo/route";
import { useReleituraAutomatica } from "@/hooks/useReleituraAutomatica";
import { GRUPO_PADRAO, GRUPOS, type Grupo, type IdGrupo } from "@/lib/grupos";

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
  /** O grupo na tela e os que o servidor oferece. Ver `useBets`. */
  grupo: IdGrupo;
  trocarGrupo: (grupo: IdGrupo) => void;
  grupos: Grupo[];
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
  const [grupo, setGrupo] = useState<IdGrupo>(GRUPO_PADRAO);
  const [grupos, setGrupos] = useState<Grupo[]>([GRUPOS[0]]);
  // Outro grupo é outro histórico: o esqueleto volta até ele chegar, como na
  // primeira carga, em vez de mostrar os meses do grupo anterior.
  const trocarGrupo = useCallback((novo: IdGrupo) => {
    setGrupo(novo);
    setPrimeiraCarga(true);
  }, []);

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
    // Voltou ao gratuito: sem isto, a leitura seguinte saía sem esqueleto e a
    // tela dizia "Nenhum mês encontrado na planilha" até ela chegar.
    let trocouDeGrupo = false;

    async function carregar() {
      if (!silenciosa) {
        setLoading(true);
        setErro(null);
      }
      try {
        const endereco =
          grupo === GRUPO_PADRAO ? "/api/resumo" : `/api/resumo?grupo=${grupo}`;
        const res = await fetch(endereco, {
          signal: controller.signal,
          // O servidor já revalida por conta própria; sem isto o navegador
          // pode segurar números velhos por minutos num painel de resultados.
          cache: "no-store",
        });
        const json = await res.json();
        if (controller.signal.aborted) return;

        if (!res.ok || !json.success) {
          // Link do Sigma antes de o grupo existir: volta ao gratuito.
          if (json?.grupoIndisponivel && grupo !== GRUPO_PADRAO) {
            trocouDeGrupo = true;
            setGrupo(GRUPO_PADRAO);
            return;
          }
          if (silenciosa) return;
          setErro(json?.error || `A planilha não respondeu (HTTP ${res.status}).`);
          setMeses([]);
          setConsolidado(null);
          return;
        }

        setIsMock(Boolean(json.isMock));
        if (Array.isArray(json.grupos) && json.grupos.length > 0) setGrupos(json.grupos);
        setMeses(Array.isArray(json.meses) ? json.meses : []);
        setConsolidado(json.consolidado ?? null);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        if (silenciosa) return;
        setErro("Não foi possível falar com o servidor. Verifique sua conexão.");
        setMeses([]);
        setConsolidado(null);
      } finally {
        if (!controller.signal.aborted && !trocouDeGrupo) {
          setLoading(false);
          setPrimeiraCarga(false);
        }
      }
    }

    carregar();
    return () => controller.abort();
  }, [nonce, grupo]);

  return {
    meses,
    consolidado,
    loading,
    mostrarEsqueleto: loading && primeiraCarga,
    erro,
    isMock,
    recarregar,
    grupo,
    trocarGrupo,
    grupos,
  };
}
