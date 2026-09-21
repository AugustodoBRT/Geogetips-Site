import { expect, type Page, test } from "@playwright/test";

/**
 * Resposta ao clique no menu com a rede lenta.
 *
 * Em Slow 3G, clicando antes de o Next terminar de buscar a tela, a página
 * antiga ficava ~2 s parada sem sinal nenhum (#17). Aqui a busca do Painel é
 * segurada de propósito — o prefetch e a navegação — para o clique cair
 * exatamente nesse vão.
 */

async function segurarOPainel(page: Page): Promise<() => void> {
  let soltar = () => {};
  const solto = new Promise<void>((resolver) => {
    soltar = resolver;
  });
  await page.route(/\/painel\?_rsc=/, async (rota) => {
    await solto;
    await rota.continue();
  });
  return soltar;
}

test("o link do menu acende no clique e apaga quando a tela chega", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const soltar = await segurarOPainel(page);
  await page.goto("/");

  const link = page
    .getByRole("navigation", { name: "Navegação principal" })
    .getByRole("link", { name: "Painel", exact: true });
  const ponto = link.locator('[data-indicador="navegacao"]');
  await expect(ponto).toHaveCSS("opacity", "0");

  await link.click();
  await expect(ponto).toHaveCSS("opacity", "1");
  // Ainda na tela antiga: o ponto é o único sinal de que o clique pegou.
  await expect(page).toHaveURL(/\/$/);

  soltar();
  await expect(page).toHaveURL(/\/painel$/);
  await expect(ponto).toHaveCSS("opacity", "0");
});

test("no celular, a linha do menu mostra o mesmo ponto", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const soltar = await segurarOPainel(page);
  await page.goto("/");

  await page.getByRole("button", { name: "Abrir menu" }).click();
  const link = page
    .getByRole("navigation", { name: "Menu" })
    .getByRole("link", { name: "Painel", exact: true });
  await link.click();
  await expect(link.locator('[data-indicador="navegacao"]')).toHaveCSS("opacity", "1");

  soltar();
  await expect(page).toHaveURL(/\/painel$/);
});
