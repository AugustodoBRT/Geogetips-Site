import { expect, test } from "@playwright/test";

/**
 * O bloco de risco do Painel (#68).
 *
 * As contas estão em lib/risco.test.ts. Aqui: o bloco aparece, a maior queda
 * dele é a mesma do rótulo do gráfico quando os dois olham o mesmo trecho, e a
 * data do pior dia leva ao feed daquele dia. O contraste do bloco já é medido
 * pela auditoria do Painel em tema.spec.ts, nos dois temas.
 */

const centavos = (texto: string) => Number(texto.replace(/\D/g, ""));

test("a maior queda do bloco é a mesma do gráfico quando a janela cobre a aba", async ({
  page,
}) => {
  await page.goto("/painel?janela=Tudo");
  const bloco = page.getByRole("region", { name: "Risco" });
  await expect(bloco.getByText("Maior queda")).toBeVisible({ timeout: 15_000 });

  const valorDoBloco = bloco
    .locator("div")
    .filter({ has: page.locator("dt", { hasText: "Maior queda" }) })
    .locator("dd span")
    .first();

  const rotuloDoGrafico = page.getByTitle(/Maior queda de um pico/);
  if ((await rotuloDoGrafico.count()) === 0) {
    // Curva que só subiu: nenhum dos dois tem queda para mostrar.
    await expect(valorDoBloco).toHaveText("Nenhuma");
    return;
  }
  const doGrafico = centavos((await rotuloDoGrafico.textContent()) ?? "");
  expect(doGrafico).toBeGreaterThan(0);
  expect(centavos((await valorDoBloco.textContent()) ?? "")).toBe(doGrafico);
});

test("a data do pior dia abre o feed daquele dia", async ({ page }) => {
  await page.goto("/painel");
  const bloco = page.getByRole("region", { name: "Risco" });
  const pior = bloco
    .locator("div")
    .filter({ has: page.locator("dt", { hasText: "Pior dia" }) })
    .getByRole("link");
  await expect(pior).toBeVisible({ timeout: 15_000 });
  const data = (await pior.textContent()) ?? "";
  const [d, m, a] = data.split("/");

  await pior.click();
  await expect(page).toHaveURL(
    new RegExp(`/apostas\\?.*de=${a}-${m}-${d}&ate=${a}-${m}-${d}`)
  );
  await expect(page.getByText(`(dia ${data})`)).toBeVisible();
});
