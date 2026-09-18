import type { Page } from "@playwright/test";

/**
 * Desliga a rolagem suave do site durante o teste.
 *
 * Com `scroll-behavior: smooth`, a página ainda desliza quando o Playwright leva
 * o mouse ao ponto que calculou — e o mouse cai em outro lugar. Aconteceu uma
 * vez em 31 execuções, com a suíte inteira rodando em paralelo: o cartão foi
 * parar embaixo do menu fixo e o hover não o alcançou. O que se mede aqui é o
 * hover, não a rolagem.
 */
export async function semRolagemSuave(page: Page) {
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
  });
}
