import { expect, type Page, test } from "@playwright/test";

/**
 * O que a revisão da main já mesclada encontrou (#93): zero pintado de verde,
 * "1 tips" e o grupo perdido no link da própria página.
 */

/** O bloco do valor de um cartão de KPI, pelo rótulo dele. */
function cartao(page: Page, regiao: string, rotulo: string) {
  return page
    .getByRole("region", { name: regiao })
    .locator("div")
    .filter({ has: page.getByText(rotulo, { exact: true }) })
    .first();
}

test("no Painel, o período sem aposta não sai em verde", async ({ page }) => {
  // Um dia sem aposta nenhuma: lucro e ROI fecham em zero.
  await page.goto("/painel?de=2026-09-02&ate=2026-09-02");
  const lucro = cartao(page, "Indicadores do período", "Lucro no Período");
  await expect(lucro).toBeVisible({ timeout: 15_000 });
  await expect(lucro.locator(".sr-only").first()).toHaveText(/^R\$\s0,00$/);

  // O valor, o fundo do ícone e a seta: nenhum dos três pode dizer lucro.
  const cores = await lucro.evaluate((c) =>
    [...c.querySelectorAll("div, span")]
      .map((e) => e.className)
      .filter((n) => typeof n === "string" && /green|red/.test(n))
  );
  expect(cores).toEqual([]);

  const roi = cartao(page, "Indicadores do período", "ROI");
  await expect(roi.locator(".sr-only").first()).toHaveText("0,00%");
  const coresRoi = await roi.evaluate((c) =>
    [...c.querySelectorAll("div, span")]
      .map((e) => e.className)
      .filter((n) => typeof n === "string" && /text-\[var\(--(green|red)\)\]/.test(n))
  );
  expect(coresRoi).toEqual([]);
});

test("no Histórico, o mês que fechou em zero não sai em verde nem com sinal", async ({
  page,
}) => {
  await page.route(
    (url) => url.pathname === "/api/resumo",
    async (rota) => {
      const resposta = await rota.fetch();
      const json = await resposta.json();
      if (Array.isArray(json.meses) && json.meses.length > 0) {
        json.meses[0] = { ...json.meses[0], lucro: 0, unidades: 0, roi: 0 };
      }
      await rota.fulfill({ response: resposta, json });
    }
  );
  await page.goto("/historico");
  const linha = page.getByRole("table").locator("tbody tr").first();
  await expect(linha).toBeVisible({ timeout: 15_000 });

  // Resultado e ROI são as duas últimas colunas do corpo da tabela.
  const celulas = linha.locator("td");
  const resultado = celulas.nth(5);
  const roi = celulas.nth(6);
  await expect(resultado).toHaveText(/^R\$\s0,00$/);
  await expect(roi).toHaveText("0,00%");
  await expect(resultado).not.toHaveClass(/green|red/);
  await expect(roi).not.toHaveClass(/green|red/);
});

test("o link da própria página não devolve quem está no Sigma para o gratuito", async ({
  page,
}) => {
  await page.goto("/historico?grupo=sigma");
  const sigma = page.getByRole("group", { name: "Grupo" }).getByRole("button", {
    name: "Sigma",
  });
  await expect(sigma).toHaveAttribute("aria-pressed", "true", { timeout: 15_000 });

  await page
    .getByRole("navigation", { name: "Navegação principal" })
    .getByRole("link", { name: "Histórico" })
    .click();

  // O grupo não é recorte: ele fica, e a tela continua no Sigma.
  await expect(page).toHaveURL(/\/historico\?grupo=sigma$/);
  await expect(sigma).toHaveAttribute("aria-pressed", "true", { timeout: 15_000 });
});

test("o logo fecha o menu do celular na própria home", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await expect(page.locator("#menu-mobile")).toBeVisible();

  await page
    .getByRole("navigation", { name: "Navegação principal" })
    .getByRole("link", { name: "GeogeTips" })
    .click();
  await expect(page.locator("#menu-mobile")).toHaveCount(0);
  // E a página volta a rolar.
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("");
});

test("uma aposta só não vira '1 tips' nas listas", async ({ page }) => {
  await page.goto("/painel");
  const casas = page.getByRole("region", { name: "Top Casas" });
  await expect(casas).toContainText("1 aposta ·", { timeout: 15_000 });
  for (const regiao of ["Top Casas", "Top Esportes", "Ranking de Adms"]) {
    await expect(
      page.getByRole("region", { name: new RegExp(regiao) })
    ).not.toContainText("1 tips");
  }
});
