import { expect, test } from "@playwright/test";

/**
 * O teste do véu fantasma.
 *
 * Este arquivo existe por causa de um defeito específico, que apareceu três
 * vezes no site e foi encontrado das três vezes clicando à mão: o véu de tela
 * cheia de uma sobreposição ficava preso no DOM com opacidade 0 — invisível — e
 * **engolia todo clique da página**. Quem fechava o detalhe de uma aposta não
 * conseguia mais navegar, e nada no console dizia por quê.
 *
 * A causa era `AnimatePresence` recebendo dois elementos dentro de um fragmento
 * sem `key`. O sintoma, porém, é o que importa aqui, e o sintoma se verifica
 * sozinho: **depois de fechar, o próximo clique tem de chegar ao seu alvo.**
 */

test("o detalhe da aposta abre, fecha e devolve o clique à página", async ({
  page,
}) => {
  await page.goto("/apostas");

  const primeira = page.locator("main button").filter({ hasText: /x / }).first();
  await primeira.waitFor({ state: "visible", timeout: 15_000 });
  await primeira.click();

  const dialogo = page.getByRole("dialog");
  await expect(dialogo).toBeVisible();
  // O foco entra no diálogo: quem navega por teclado não fica preso atrás dele.
  await expect(dialogo).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialogo).toBeHidden();

  // Nada de tela cheia pode sobrar no DOM depois da saída.
  await expect(page.locator(".fixed.inset-0")).toHaveCount(0);

  // E o teste que de fato importa: o clique seguinte chega ao link.
  await page.getByRole("link", { name: "Painel", exact: true }).first().click();
  await expect(page).toHaveURL(/\/painel$/);
});

test("o menu do celular abre, fecha e devolve o clique à página", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/apostas");

  await page.getByRole("button", { name: "Abrir menu" }).click();
  const menu = page.locator("#menu-mobile");
  await expect(menu).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(page.locator(".fixed.inset-0")).toHaveCount(0);

  // O foco volta para o botão que abriu — senão o teclado fica perdido no topo
  // da página depois de fechar.
  await expect(page.getByRole("button", { name: "Abrir menu" })).toBeFocused();

  // O conteúdo atrás do menu volta a receber clique.
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await expect(menu).toBeVisible();
  await page.getByRole("link", { name: "Adms", exact: true }).first().click();
  await expect(page).toHaveURL(/\/adms$/);
});
