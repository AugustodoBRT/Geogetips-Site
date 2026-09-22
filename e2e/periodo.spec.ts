import { expect, test } from "@playwright/test";

/**
 * Desde quando o histórico existe, na faixa de números da home (#70).
 *
 * A conta está em lib/periodo.test.ts. Aqui: a frase aparece, e já no HTML que
 * o servidor manda — é ele que o buscador e o preview de link leem.
 */

test("a home diz desde quando o histórico existe e quantos dias teve aposta", async ({
  page,
  request,
}) => {
  const html = await (await request.get("/")).text();
  expect(html).toMatch(/apostas registradas desde [a-zç]+ de \d{4}/);

  await page.goto("/");
  // O número e o texto moram no mesmo elemento, em nós separados.
  await expect(
    page.getByText(/apostas registradas desde [a-zç]+ de \d{4}/)
  ).toBeVisible();
  const dias = page.getByText(/\d+\s*dias? com aposta/);
  await expect(dias).toBeVisible();
  expect(Number((await dias.textContent())?.replace(/\D/g, ""))).toBeGreaterThan(0);
});
