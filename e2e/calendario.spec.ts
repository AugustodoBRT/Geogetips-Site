import { expect, type Page, test } from "@playwright/test";

/**
 * O calendário de lucro por dia do Painel (#67).
 *
 * A grade e as somas estão em lib/calendario.test.ts. Aqui: os dias fecham com
 * o total do mês, o clique num dia abre o feed com as apostas dele, e o
 * intervalo do Painel apaga os dias de fora. O contraste das células entra na
 * auditoria do Painel em tema.spec.ts, nos dois temas.
 */

const calendario = (page: Page) => page.getByRole("region", { name: "Lucro por dia" });

/** "+R$ 1.234,56" → 1234.56, com sinal. */
function reais(texto: string): number {
  const m = texto.match(/([+-])?R\$\s*([\d.]+,\d{2})/);
  if (!m) throw new Error(`sem valor em "${texto}"`);
  const n = Number(m[2].replace(/\./g, "").replace(",", "."));
  return m[1] === "-" ? -n : n;
}

test("os dias somam o total do mês", async ({ page }) => {
  await page.goto("/painel");
  const dias = calendario(page).getByRole("link");
  await expect(dias.first()).toBeVisible({ timeout: 15_000 });

  const rotulos = await dias.evaluateAll((els) =>
    els.map((e) => e.getAttribute("aria-label") ?? "")
  );
  const soma = rotulos.reduce((acc, r) => acc + reais(r), 0);
  const total = await calendario(page)
    .getByText(/^Total de /)
    .textContent();
  expect(Math.round(soma * 100)).toBe(Math.round(reais(total ?? "") * 100));
});

test("tocar num dia abre o feed com as apostas dele", async ({ page }) => {
  await page.goto("/painel");
  const dia = calendario(page).getByRole("link").first();
  await expect(dia).toBeVisible({ timeout: 15_000 });
  const rotulo = (await dia.getAttribute("aria-label")) ?? "";
  const data = rotulo.slice(0, 10);
  const apostas = Number(rotulo.match(/em (\d+) aposta/)?.[1]);
  const [d, m, a] = data.split("/");

  await dia.click();
  await expect(page).toHaveURL(
    new RegExp(`/apostas\\?.*de=${a}-${m}-${d}&ate=${a}-${m}-${d}`)
  );
  await expect(page.getByText(`(dia ${data})`)).toBeVisible();
  await expect(
    page.getByRole("button", { name: new RegExp(`${data}.*\\(${apostas} apostas?\\)`) })
  ).toBeVisible();
});

test("com intervalo no Painel, os dias de fora ficam sem cor", async ({ page }) => {
  await page.goto("/painel");
  const primeiro = calendario(page).getByRole("link").first();
  await expect(primeiro).toBeVisible({ timeout: 15_000 });
  const data = ((await primeiro.getAttribute("aria-label")) ?? "").slice(0, 10);
  const [d, m, a] = data.split("/");
  const iso = `${a}-${m}-${d}`;

  await page.goto(`/painel?de=${iso}&ate=${iso}`);
  await expect(calendario(page).locator(`td[data-dia="${iso}"]`)).not.toHaveAttribute(
    "data-fora",
    /.*/
  );
  await expect(calendario(page).locator("td[data-fora]").first()).toBeVisible();
  await expect(calendario(page)).toContainText(
    "fora do período escolhido aparecem sem cor"
  );
});
