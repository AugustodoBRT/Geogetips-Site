import { expect, test } from "@playwright/test";
import { semRolagemSuave } from "./ajudantes";

/**
 * O carrossel de profundidade da home, na tela larga.
 *
 * O primeiro card voltava, apagado, depois da vez dele (#59): a 50% da
 * rolagem estava com opacidade 0,29, e a 95% com 0,93, escondido atrás do card
 * ativo. Só aparece com a rolagem andando de verdade — a opacidade roda numa
 * animação do navegador presa à rolagem, e nenhuma leitura estática da página
 * pega isso.
 */
test("no centro da vez de cada card, só ele está visível", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await semRolagemSuave(page);

  const carrossel = page.locator("main .sticky:visible").locator("xpath=..");
  await expect(carrossel).toHaveCount(1);
  const cards = carrossel.locator("article");
  const titulos = await cards.locator("h3").allTextContents();
  expect(titulos.length).toBeGreaterThan(1);

  for (const [i, titulo] of titulos.entries()) {
    // A vez de cada card é uma fatia igual da rolagem; o centro dela é onde
    // ele está sozinho, sem nenhuma troca em andamento.
    const progresso = (i + 0.5) / titulos.length;
    await carrossel.evaluate((el, p) => {
      const topo = el.getBoundingClientRect().top + window.scrollY;
      const altura = el.getBoundingClientRect().height;
      window.scrollTo(0, topo + (altura - window.innerHeight) * p);
    }, progresso);

    await expect
      .poll(() =>
        cards.evaluateAll((todos) =>
          todos
            .filter((a) => Number(getComputedStyle(a).opacity) > 0.05)
            .map((a) => a.querySelector("h3")?.textContent)
        )
      )
      .toEqual([titulo]);
  }
});
