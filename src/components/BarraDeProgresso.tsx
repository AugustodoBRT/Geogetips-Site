"use client";

import { useEffect, useState } from "react";
import { useSemMovimento } from "@/hooks/useSemMovimento";

/**
 * Fio de progresso logo abaixo do topo, enquanto há leitura da planilha em
 * curso.
 *
 * O esqueleto cobre a primeira carga, quando a tela ainda está vazia. Ele não
 * cobre o segundo caso: trocar de aba ou mandar recarregar com a tela **já
 * cheia de números**. Ali o conteúdo antigo continua no lugar — de propósito,
 * para não piscar — e sem este fio nada diz que o pedido saiu. Em rede ruim a
 * pessoa clica de novo achando que não pegou.
 *
 * É indeterminado porque a leitura não informa progresso: não há porcentagem
 * honesta para mostrar, e inventar uma seria mentir sobre o que o site sabe.
 *
 * Sem `AnimatePresence`: entrada e saída saem de transição de CSS comandada por
 * estado, que o navegador consegue interromper no meio se a próxima leitura
 * começar antes de a anterior terminar de sumir.
 */
export function BarraDeProgresso({ ativo }: { ativo: boolean }) {
  const semMovimento = useSemMovimento();
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    if (ativo) {
      setMontado(true);
      return;
    }
    // Espera o esmaecimento terminar antes de tirar do DOM. Sem isto a barra
    // sumiria de estalo no fim de cada leitura.
    const t = setTimeout(() => setMontado(false), 220);
    return () => clearTimeout(t);
  }, [ativo]);

  if (!montado) return null;

  return (
    <div
      role="progressbar"
      aria-label="Carregando dados da planilha"
      className={`fixed top-16 left-0 right-0 z-40 h-[2px] overflow-hidden bg-[var(--accent-soft)] pointer-events-none transition-opacity duration-200 ${
        ativo ? "opacity-100" : "opacity-0"
      }`}
    >
      {semMovimento ? (
        // Quem pediu menos movimento continua precisando saber que há algo em
        // curso: o fio aparece inteiro e parado, em vez de atravessar a tela.
        <div className="h-full w-full bg-[var(--accent)] opacity-60" />
      ) : (
        <div className="h-full w-1/3 bg-[var(--accent)] animate-progresso" />
      )}
    </div>
  );
}
