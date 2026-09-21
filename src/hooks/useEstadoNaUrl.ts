"use client";

import { useEffect, useRef, useState } from "react";
import { escreverConsulta, lerConsulta } from "@/lib/endereco";

/**
 * Espelha o estado da tela no endereço — e o endereço no estado, ao abrir.
 *
 * Sem isto, filtrar por Green, ir ao Painel e voltar perdia o filtro, e não
 * havia como mandar para alguém "as greens de setembro". Com isto, cada
 * recorte tem endereço: voltar pelo navegador devolve a tela como estava,
 * recarregar não perde nada e o link compartilhado abre o mesmo recorte.
 *
 * Três decisões que não aparecem no código:
 *
 * - **`history.replaceState`, e não `pushState`.** Cada filtro trocado não vira
 *   um passo no "voltar" — senão, depois de mexer em cinco filtros, seriam
 *   cinco toques para sair da página. O endereço atual é que vai sendo
 *   atualizado, e é ele que o "voltar" devolve.
 * - **Nada de `useSearchParams`.** Ele exige uma fronteira de Suspense acima da
 *   página, e neste projeto fronteira de Suspense adiada congela a rota no
 *   esqueleto (#17). O endereço é lido direto de `window.location`, uma vez,
 *   depois da hidratação — antes disso servidor e cliente precisam desenhar
 *   igual.
 * - **Só escreve depois de ler.** Na montagem, o primeiro efeito de escrita
 *   ainda veria os valores padrão e apagaria do endereço o recorte que a
 *   pessoa acabou de abrir. `pronto` segura a escrita até o recorte lido estar
 *   aplicado.
 *
 * `valores` é o estado já em texto, com "" para o que está no padrão;
 * `aplicar` recebe o que o endereço trouxe, uma vez, e cabe a quem chama
 * validar cada campo.
 */
export function useEstadoNaUrl(
  valores: Record<string, string>,
  aplicar: (lidos: Record<string, string>) => void
) {
  const [pronto, setPronto] = useState(false);
  const aplicarRef = useRef(aplicar);
  aplicarRef.current = aplicar;

  useEffect(() => {
    const lidos = lerConsulta(window.location.search);
    if (Object.keys(lidos).length > 0) aplicarRef.current(lidos);
    setPronto(true);
  }, []);

  const consulta = escreverConsulta(valores);

  useEffect(() => {
    if (!pronto) return;
    const { pathname, search, hash } = window.location;
    if (search === consulta) return;
    window.history.replaceState(
      window.history.state,
      "",
      `${pathname}${consulta}${hash}`
    );
  }, [pronto, consulta]);
}
