import { expect, type Locator, type Page, test } from "@playwright/test";

/**
 * O card clicável sobe no hover.
 *
 * O efeito é uma classe (`hover:-translate-y-1`), e classe perde para estilo
 * inline. O framer anima `y` e `scale` escrevendo `transform` direto no style
 * do elemento — então basta pôr a animação de entrada no próprio botão para o
 * hover morrer em silêncio. Foi o que aconteceu em Adms: a mesma classe de
 * Estatísticas, e o card parado, só com a sombra mudando.
 *
 * Nada disso aparece em tsc, lint ou teste de unidade. Só medindo na tela.
 */

/** Quanto o elemento está deslocado no eixo y, em pixels. */
async function deslocamentoY(alvo: Locator) {
  return alvo.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42);
}

async function confereQueSobe(page: Page, card: Locator) {
  await expect(card).toBeVisible({ timeout: 15_000 });
  // Espera a entrada em cascata assentar antes de medir o repouso.
  await expect.poll(() => deslocamentoY(card)).toBe(0);

  await card.hover();
  await expect.poll(() => deslocamentoY(card)).toBeLessThan(-2);

  // Tirar o mouse devolve o card ao lugar.
  await page.mouse.move(0, 0);
  await expect.poll(() => deslocamentoY(card)).toBe(0);
}

test("o card de Estatísticas sobe no hover", async ({ page }) => {
  await page.goto("/estatisticas");
  await confereQueSobe(
    page,
    page.getByRole("button", { name: "Ver todas as casas em detalhe" })
  );
});

test("o card do adm sobe no hover, como o de Estatísticas", async ({ page }) => {
  await page.goto("/adms");
  await confereQueSobe(
    page,
    page.getByRole("button", { name: /^Ver o desempenho de / }).first()
  );
});
