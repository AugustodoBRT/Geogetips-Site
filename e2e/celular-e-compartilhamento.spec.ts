import { expect, test } from "@playwright/test";

/**
 * O celular e o link compartilhado, os dois lugares onde o site é visto de
 * relance: cinco números que pediam uma tela de rolagem, um carrossel de quatro
 * telas para cinco cartões, e a imagem do link na fonte errada.
 */

const CELULAR = { width: 375, height: 812 };

test("no celular os indicadores do Painel ficam dois por linha", async ({ page }) => {
  await page.setViewportSize(CELULAR);
  await page.goto("/painel");

  const kpis = page.getByRole("region", { name: "Indicadores do período" });
  await expect(kpis).toBeVisible({ timeout: 15_000 });

  const caixas = await kpis
    .locator(":scope > div")
    .evaluateAll((els) =>
      els
        .map((e) => e.getBoundingClientRect())
        .map((r) => ({ y: Math.round(r.top), w: Math.round(r.width) }))
    );
  expect(caixas).toHaveLength(5);
  // Os dois primeiros lado a lado, na mesma altura.
  expect(caixas[0].y).toBe(caixas[1].y);
  // O quinto ocupa a linha inteira.
  expect(caixas[4].w).toBeGreaterThan(caixas[0].w * 1.8);

  // E nenhum número passa da borda do cartão.
  const vazam = await kpis.evaluate(
    (secao) =>
      [...secao.querySelectorAll(":scope > div")].filter(
        (c) => c.scrollWidth > c.clientWidth + 1
      ).length
  );
  expect(vazam).toBe(0);
});

test("no celular as funcionalidades da home são uma lista, sem carrossel preso", async ({
  page,
}) => {
  await page.setViewportSize(CELULAR);
  await page.goto("/");

  const titulo = page.getByRole("heading", { name: /Tudo que você precisa/ });
  await titulo.scrollIntoViewIfNeeded();
  await expect(titulo).toBeVisible();

  // O carrossel de profundidade prende a área na tela com `sticky`; a lista não.
  await expect(page.locator("main .sticky")).toHaveCount(0);
  // Os cinco cartões estão lá, todos legíveis.
  for (const nome of [
    "Registro automático",
    "Planilha Sincronizada",
    "Análise por Adm",
    "Gestão de Banca",
    "Estatísticas Completas",
  ]) {
    await expect(page.getByRole("heading", { name: nome })).toBeVisible();
  }
});

test("a imagem de compartilhamento sai", async ({ request }) => {
  const resposta = await request.get("/opengraph-image");
  expect(resposta.ok()).toBe(true);
  expect(resposta.headers()["content-type"]).toContain("image/png");
  expect((await resposta.body()).length).toBeGreaterThan(10_000);
});
