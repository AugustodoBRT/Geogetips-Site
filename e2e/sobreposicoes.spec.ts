import { expect, type Page, test } from "@playwright/test";

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

/**
 * O véu cobre a janela inteira, do topo ao pé.
 *
 * Em Adms e Estatísticas o véu começava 30 pixels abaixo do topo: filho do
 * contêiner da página, herdava o `margin-top` do `space-y-8` dele, e sobrava uma
 * faixa clara em cima, com o menu metade escurecido. Parecia tela cortada. Em
 * Apostas não acontecia, porque lá o contêiner não tem `space-y` — o defeito
 * dependia de onde o diálogo era aberto, e por isso cada diálogo confere.
 */
async function confereQueOVeuCobreATela(page: Page) {
  const veu = await page.getByRole("dialog").locator("..").boundingBox();
  const janela = page.viewportSize();
  expect(veu?.y).toBe(0);
  expect(veu?.height).toBe(janela?.height);
}

test("o detalhe da aposta abre, fecha e devolve o clique à página", async ({ page }) => {
  await page.goto("/apostas");

  const primeira = page.locator("main button").filter({ hasText: /x / }).first();
  await primeira.waitFor({ state: "visible", timeout: 15_000 });
  await primeira.click();

  const dialogo = page.getByRole("dialog");
  await expect(dialogo).toBeVisible();
  // O foco entra no diálogo: quem navega por teclado não fica preso atrás dele.
  await expect(dialogo).toBeFocused();
  await confereQueOVeuCobreATela(page);

  await page.keyboard.press("Escape");
  await expect(dialogo).toBeHidden();

  // Nada de tela cheia pode sobrar no DOM depois da saída.
  await expect(page.locator(".fixed.inset-0")).toHaveCount(0);

  // E o teste que de fato importa: o clique seguinte chega ao link.
  await page.getByRole("link", { name: "Painel", exact: true }).first().click();
  await expect(page).toHaveURL(/\/painel$/);
});

test("o menu do celular abre, fecha e devolve o clique à página", async ({ page }) => {
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

test("os cards de Estatísticas abrem o detalhe completo", async ({ page }) => {
  await page.goto("/estatisticas");

  const card = page.getByRole("button", { name: "Ver todas as casas em detalhe" });
  await expect(card).toBeVisible({ timeout: 15_000 });

  await card.click();

  const dialogo = page.getByRole("dialog");
  await expect(dialogo).toBeVisible();
  await expect(dialogo).toBeFocused();
  await confereQueOVeuCobreATela(page);

  // O diálogo lista as casas com as colunas que o card não tem espaço para
  // mostrar. Ele também deixa de cortar em oito — mas isso a demonstração não
  // consegue provar, porque tem menos de oito casas; quem prova é a planilha
  // real, onde o card mostra 8 e o diálogo, 32.
  await expect(dialogo.getByRole("columnheader", { name: "Apostado" })).toBeVisible();
  await expect(dialogo.getByRole("columnheader", { name: "ROI" })).toBeVisible();
  expect(await dialogo.locator("tbody tr").count()).toBeGreaterThan(0);

  await page.keyboard.press("Escape");
  await expect(dialogo).toBeHidden();
  await expect(page.locator(".fixed.inset-0")).toHaveCount(0);

  // O foco volta ao card que abriu — senão quem navega por teclado fica perdido
  // no topo da página.
  await expect(card).toBeFocused();

  // E o clique seguinte chega ao seu alvo.
  await page.getByRole("link", { name: "Painel", exact: true }).first().click();
  await expect(page).toHaveURL(/\/painel$/);
});

test("o card do adm abre o detalhe por casa e por esporte", async ({ page }) => {
  await page.goto("/adms");

  const card = page.getByRole("button", { name: /^Ver o desempenho de / }).first();
  await expect(card).toBeVisible({ timeout: 15_000 });
  await card.click();

  const dialogo = page.getByRole("dialog");
  await expect(dialogo).toBeVisible();
  await expect(dialogo).toBeFocused();
  await confereQueOVeuCobreATela(page);

  // As duas listas: é a resposta para "de onde veio o resultado deste adm".
  await expect(dialogo.getByText("Por casa")).toBeVisible();
  await expect(dialogo.getByText("Por esporte")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialogo).toBeHidden();
  await expect(page.locator(".fixed.inset-0")).toHaveCount(0);
  await expect(card).toBeFocused();

  await page.getByRole("link", { name: "Painel", exact: true }).first().click();
  await expect(page).toHaveURL(/\/painel$/);
});
