"use client";

import { useEffect, useRef } from "react";

/**
 * Relê os dados sozinho, no mesmo ritmo em que o servidor revalida.
 *
 * Deixei o Painel aberto 75 s na varredura: zero leituras novas. O selo
 * envelhecia com honestidade ("há 5 min"), mas os números só mudavam
 * recarregando — num site cujo trunfo é mostrar a planilha ao vivo.
 *
 * Duas regras de educação:
 *
 * - **aba em segundo plano não lê nada.** Ninguém está olhando, e cada leitura
 *   custa uma ida à planilha. Ao voltar para a aba, se já passou do intervalo,
 *   lê na hora — é quando a pessoa mais espera o número novo.
 * - **quem chama decide se a leitura aparece.** Os hooks de dados usam a forma
 *   silenciosa: sem barra de progresso a cada minuto, e sem apagar a tela se
 *   uma releitura de fundo falhar.
 */
export function useReleituraAutomatica(reler: () => void, intervaloMs = 60_000) {
  const relerRef = useRef(reler);
  useEffect(() => {
    relerRef.current = reler;
  }, [reler]);

  useEffect(() => {
    let ultima = Date.now();

    function talvezReler() {
      if (document.visibilityState !== "visible") return;
      // Uma folga de 1 s para o timer e o evento de visibilidade não lerem em
      // dobro quando caem no mesmo instante.
      if (Date.now() - ultima < intervaloMs - 1000) return;
      ultima = Date.now();
      relerRef.current();
    }

    const id = window.setInterval(talvezReler, intervaloMs);
    document.addEventListener("visibilitychange", talvezReler);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", talvezReler);
    };
  }, [intervaloMs]);
}
