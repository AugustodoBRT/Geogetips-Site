"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";

/**
 * Recomeça a tela quando o link é para a página em que a pessoa já está, com
 * um recorte no endereço.
 *
 * O Next não remonta a página quando o caminho é o mesmo. Em
 * `/apostas?resultado=green`, clicar em "Apostas" no menu levava o endereço
 * para `/apostas`, e a tela continuava filtrada: recarregar ou compartilhar o
 * link dava outra coisa. Aqui essa navegação vira uma carga nova, que abre a
 * tela no padrão, com tela e endereço concordando.
 *
 * Clique com tecla (nova aba, nova janela) e botão do meio seguem o caminho de
 * sempre.
 */
function recomecarSeForAMesmaPagina(e: MouseEvent<HTMLAnchorElement>, href: string) {
  if (e.defaultPrevented || e.button !== 0) return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const { pathname, search } = window.location;
  if (pathname !== href || search === "") return;
  e.preventDefault();
  window.location.assign(href);
}

type LinkInternoProps = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

/** `Link` do Next para os destinos do menu e do rodapé. Ver `recomecarSeForAMesmaPagina`. */
export function LinkInterno({ href, onClick, ...resto }: LinkInternoProps) {
  return (
    <Link
      href={href}
      onClick={(e) => {
        onClick?.(e);
        recomecarSeForAMesmaPagina(e, href);
      }}
      {...resto}
    />
  );
}
