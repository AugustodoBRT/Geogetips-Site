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
 * O grupo sobrevive: ele não é recorte, é de qual canal são os resultados, e o
 * resto do site leva ele junto de propósito (ver `comAba`). Sem isto, quem
 * estava no GeogeTips - Sigma voltava para o gratuito só de clicar no nome da
 * página em que já estava.
 *
 * Quando o grupo é a única coisa no endereço não há o que recomeçar, e a
 * navegação é só barrada: deixá-la seguir limparia o endereço e a tela
 * continuaria no Sigma, que é o desencontro que este arquivo existe para
 * evitar.
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
  const grupo = new URLSearchParams(search).get("grupo");
  const alvo = grupo ? `${href}?grupo=${encodeURIComponent(grupo)}` : href;
  if (alvo !== pathname + search) window.location.assign(alvo);
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
