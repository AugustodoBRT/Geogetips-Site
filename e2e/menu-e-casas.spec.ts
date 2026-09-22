import { expect, test } from "@playwright/test";

/**
 * Menu, links para a própria página, casas para o leitor de tela e o resto do
 * lote de interface da varredura de 22/09 (#88).
 */

test("o menu do celular fecha ao tocar na página em que se está", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/painel");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  const menu = page.locator("#menu-mobile");
  await expect(menu).toBeVisible();
  await menu.getByRole("link", { name: "Painel" }).click();
  await expect(menu).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Abrir menu" })).toBeVisible();
});

test("com o menu aberto, alargar a tela fecha o menu e devolve a rolagem", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/apostas");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await expect(page.locator("#menu-mobile")).toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");

  await page.setViewportSize({ width: 1024, height: 800 });
  await expect(page.locator("#menu-mobile")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("");
});

for (const onde of ["menu", "rodapé"] as const) {
  test(`o link da própria página no ${onde} recomeça a tela sem filtro`, async ({
    page,
  }) => {
    await page.goto("/apostas?resultado=green");
    const green = page.getByRole("button", { name: "Green", exact: true });
    await expect(green).toHaveAttribute("aria-pressed", "true", { timeout: 15_000 });

    const lugar =
      onde === "menu"
        ? page.getByRole("navigation", { name: "Navegação principal" })
        : page.getByRole("navigation", { name: "Rodapé" });
    await lugar.getByRole("link", { name: "Apostas" }).click();

    // Endereço e tela concordam: antes, o endereço ficava limpo e o filtro, ligado.
    await expect(page).toHaveURL(/\/apostas$/);
    await expect(
      page
        .getByRole("group", { name: "Filtrar por resultado" })
        .getByRole("button", { name: "Todas", exact: true })
    ).toHaveAttribute("aria-pressed", "true", { timeout: 15_000 });
    await expect(green).toHaveAttribute("aria-pressed", "false");
  });
}

test("a casa com logo tem nome para o leitor de tela", async ({ page }) => {
  await page.goto("/apostas");
  // Barcelona x Real Madrid é na Bet365, que tem logo.
  await page
    .getByRole("button", { name: /Ver detalhes: Barcelona x Real Madrid/ })
    .click();
  const dialogo = page.getByRole("dialog");
  await expect(dialogo).toBeVisible();
  // Antes o detalhe se lia "Casa:" e mais nada.
  expect(await dialogo.ariaSnapshot()).toMatch(/Casa:\s*Bet365/);
});

test("o dia de hoje é anunciado no calendário também quando tem aposta", async ({
  page,
}) => {
  const hoje = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
  await page.route(
    (url) => url.pathname === "/api/bets",
    async (rota) => {
      const resposta = await rota.fetch();
      const json = await resposta.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        json.data.unshift({ ...json.data[0], id: "de-hoje", data: hoje, lucro: 50 });
      }
      await rota.fulfill({ response: resposta, json });
    }
  );
  await page.goto("/painel");
  const calendario = page.getByRole("region", { name: "Lucro por dia" });
  await expect(
    calendario.getByRole("link", { name: new RegExp(`^${hoje}: .*, hoje`) })
  ).toBeVisible({
    timeout: 15_000,
  });
});

test("Ver todas das Últimas Apostas leva o intervalo do Painel", async ({ page }) => {
  await page.goto("/painel?de=2026-08-24&ate=2026-08-26");
  const ultimas = page.getByRole("region", { name: "Últimas Apostas Registradas" });
  const link = ultimas.getByRole("link", { name: "Ver todas" });
  await expect(link).toHaveAttribute("href", /de=2026-08-24&ate=2026-08-26/, {
    timeout: 15_000,
  });
  await link.click();
  await expect(page).toHaveURL(/\/apostas\?.*de=2026-08-24&ate=2026-08-26/);
  await expect(page.getByRole("heading", { name: "Feed de Apostas" })).toBeVisible();
  await expect(page.getByRole("main")).toContainText(
    /Feed cronológico de \S+ \(24\/08\/2026 a 26\/08\/2026\)\./
  );
});

test("a unidade escolhida numa aba vale nas outras abertas", async ({ context }) => {
  const a = await context.newPage();
  const b = await context.newPage();
  await a.goto("/painel");
  await b.goto("/apostas");
  await expect(b.locator("#campo-unidade")).toHaveValue("100");

  await a
    .getByRole("group", { name: "Valores sugeridos" })
    .getByRole("button", { name: "10", exact: true })
    .click();
  await expect(b.locator("#campo-unidade")).toHaveValue("10");
});

test("o link do Sigma antes de ele existir segue no esqueleto até o gratuito chegar", async ({
  page,
}) => {
  await page.route(
    (url) => url.pathname === "/api/resumo",
    async (rota) => {
      if (new URL(rota.request().url()).searchParams.get("grupo") === "sigma") {
        await rota.fulfill({
          status: 404,
          json: { success: false, isMock: false, grupoIndisponivel: true, error: "x" },
        });
        return;
      }
      // A leitura do gratuito demora: é nela que a tela vazia aparecia.
      await new Promise((r) => setTimeout(r, 1500));
      await rota.continue();
    }
  );
  await page.goto("/historico?grupo=sigma");
  const vazio = page.getByText("Nenhum mês encontrado na planilha.");
  for (let i = 0; i < 6; i++) {
    await expect(vazio).toHaveCount(0);
    await page.waitForTimeout(200);
  }
  await expect(page.getByRole("table")).toBeVisible({ timeout: 15_000 });
});

test("a página que não existe oferece os seis destinos do menu", async ({ page }) => {
  await page.goto("/nao-existe");
  const atalhos = page
    .getByRole("navigation", { name: "Atalhos do site" })
    .getByRole("link");
  await expect(atalhos).toHaveCount(6);
  await expect(atalhos.filter({ hasText: "Adms" })).toHaveAttribute("href", "/adms");
  await expect(atalhos.filter({ hasText: "Perguntas frequentes" })).toHaveAttribute(
    "href",
    "/perguntas"
  );
});
