import { expect, test } from "@playwright/test";

/**
 * O recorte por adm no feed.
 *
 * O que precisa ser protegido é simples e é o que o visitante faz: escolher um
 * adm e ver a lista encolher. Contagem que não bate, ou pílula que marca sem
 * filtrar, é defeito que passa por tsc e por lint sem reclamar.
 */
test("escolher um adm encolhe o feed", async ({ page }) => {
  await page.goto("/apostas");

  // O rodapé "Exibindo N de M" só aparece acima de cem apostas, e o modo
  // demonstração tem onze — então quem conta aqui são as linhas do feed.
  const linhas = page.locator("main button").filter({ hasText: /@\d/ });
  await expect(linhas.first()).toBeVisible({ timeout: 15_000 });
  const antes = await linhas.count();

  await page.getByRole("button", { name: "Todos os Adms" }).click();
  const lista = page.getByRole("group", { name: "Todos os Adms" });
  await expect(lista).toBeVisible();

  const primeiro = lista.locator("label").first();
  await expect(primeiro).toBeVisible();
  const nome = ((await primeiro.textContent()) ?? "").replace(/\d+$/, "").trim();
  await primeiro.click();

  // A lista encolhe: é a prova de que o recorte pegou de verdade, e não só de
  // que a pílula ficou marcada.
  await expect(linhas).not.toHaveCount(antes, { timeout: 10_000 });
  expect(await linhas.count()).toBeGreaterThan(0);

  // E o nome do adm vira o rótulo da pílula.
  await expect(page.getByRole("button", { name: "Todos os Adms" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: nome, exact: true })).toBeVisible();
});
