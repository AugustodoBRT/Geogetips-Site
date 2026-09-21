"use client";

import { useSyncExternalStore } from "react";

const CONSULTA = "(prefers-reduced-motion: reduce)";

function assinar(avisar: () => void) {
  const mq = window.matchMedia(CONSULTA);
  mq.addEventListener("change", avisar);
  return () => mq.removeEventListener("change", avisar);
}

/**
 * Se a pessoa pediu menos movimento no aparelho — sem quebrar a hidratação.
 *
 * O `useReducedMotion` do framer lê a preferência já no primeiro render do
 * navegador. O servidor não sabe dela e desenha a versão animada; com
 * "reduzir movimento" ligado, o navegador desenhava a estática, o React
 * acusava a diferença (erro #418) e jogava fora o HTML do servidor para
 * montar a página inteira de novo. Na remontagem o `<html>` perdia o
 * `data-tema` e o site voltava para o claro.
 *
 * Aqui a hidratação usa o mesmo `false` do servidor, e o valor real entra no
 * render seguinte. Quem pediu menos movimento vê a versão animada por um
 * quadro, com a opacidade inicial — o mesmo que todo mundo vê antes do JS.
 */
export function useSemMovimento(): boolean {
  return useSyncExternalStore(
    assinar,
    () => window.matchMedia(CONSULTA).matches,
    () => false
  );
}
