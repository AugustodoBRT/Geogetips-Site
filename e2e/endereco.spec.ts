import { expect, type Page, test } from "@playwright/test";

/**
 * O recorte no endereço, e a leitura que se refaz sozinha.
 *
 * Na varredura, filtrar por Green, ir ao Painel e voltar perdia o filtro; e o
 * Painel aberto por 75 s não fez nenhuma leitura nova. Os dois defeitos só
 * aparecem com tempo e com navegação — nenhum teste de tela estático pega.
 */

async function esperarFeed(page: Page) {
  await expect(page.getByRole("button", { name: /^Ver detalhes: / }).first()).toBeVisible(
    {
      timeout: 15_000,
    }
  );
}

test("voltar do navegador devolve o filtro que estava na tela", async ({ page }) => {
  await page.goto("/apostas");
  await esperarFeed(page);

  const green = page.getByRole("button", { name: "Green", exact: true });
  await green.click();
  await expect(page).toHaveURL(/resultado=green/);

  await page.getByRole("link", { name: "Painel", exact: true }).first().click();
  await expect(page).toHaveURL(/\/painel/);
  await page.goBack();

  await esperarFeed(page);
  await expect(page.getByRole("button", { name: "Green", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
});

test("o link com recorte abre o mesmo recorte", async ({ page }) => {
  await page.goto("/apostas?resultado=red&vista=tabela&q=milao");

  await expect(page.getByRole("button", { name: "Red", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
    { timeout: 15_000 }
  );
  await expect(
    page.getByRole("button", { name: "Visualizar em tabela" })
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Buscar apostas")).toHaveValue("milao");
});

test("endereço com valor inválido abre no padrão, sem quebrar", async ({ page }) => {
  await page.goto("/apostas?resultado=xyz&de=2026-02-31&odd=muito&aba=Xyz");
  await esperarFeed(page);

  await expect(
    page.getByRole("button", { name: "Todas", exact: true }).first()
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#periodo-de")).toHaveValue("");
  // E o endereço é reescrito sem o lixo.
  await expect(page).not.toHaveURL(/xyz|muito|2026-02-31/);
});

test("o Painel guarda o intervalo no endereço", async ({ page }) => {
  await page.goto("/painel");
  const de = page.locator("#periodo-de");
  await expect(page.getByRole("region", { name: "Indicadores do período" })).toBeVisible({
    timeout: 15_000,
  });
  const ultimo = await page.locator("#periodo-ate").getAttribute("max");
  test.skip(!ultimo, "a aba não trouxe datas");

  await de.fill(ultimo as string);
  await expect(page).toHaveURL(new RegExp(`de=${ultimo}`));

  await page.reload();
  await expect(page.locator("#periodo-de")).toHaveValue(ultimo as string, {
    timeout: 15_000,
  });
});

test("a linha do Histórico abre o Painel daquele mês", async ({ page }) => {
  await page.goto("/historico");
  const mes = page.locator("tbody th a").first();
  await expect(mes).toBeVisible({ timeout: 15_000 });

  await mes.click();
  await expect(page).toHaveURL(/\/painel/);
  await expect(page.getByRole("region", { name: "Indicadores do período" })).toBeVisible({
    timeout: 15_000,
  });
});

test("o Painel relê a planilha sozinho a cada minuto, só com a aba à vista", async ({
  page,
}) => {
  await page.clock.install();
  let leituras = 0;
  page.on("request", (r) => {
    if (r.url().includes("/api/bets")) leituras++;
  });

  await page.goto("/painel");
  await expect(page.getByRole("region", { name: "Indicadores do período" })).toBeVisible({
    timeout: 15_000,
  });
  const inicial = leituras;

  // Um minuto com a aba à vista: uma leitura nova.
  await page.clock.runFor(61_000);
  await expect.poll(() => leituras).toBe(inicial + 1);

  // Aba em segundo plano: o minuto passa e ninguém lê nada.
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.runFor(61_000);
  expect(leituras).toBe(inicial + 1);

  // De volta à vista, com o minuto vencido: lê na hora.
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => leituras).toBe(inicial + 2);
});

test("abrir o Painel não suja o endereço com a janela que a aba escolheu sozinha", async ({
  page,
}) => {
  // Num mês curto a janela de 30 dias não existe, e a tela cai em "Tudo" por
  // conta própria. Isso não é escolha da pessoa: o endereço tem de ficar limpo.
  await page.goto("/painel");
  await expect(page.getByRole("region", { name: "Indicadores do período" })).toBeVisible({
    timeout: 15_000,
  });
  await page.waitForTimeout(800);
  await expect(page).toHaveURL(/\/painel$/);
});
