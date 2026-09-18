import { expect, type Locator, type Page, test } from "@playwright/test";

/**
 * Os dias do feed de Apostas, que recolhem e expandem.
 *
 * O cabeçalho do dia é o que fica à vista quando ele está recolhido, então o
 * que precisa ser protegido é que ele diga a verdade: a contagem do cabeçalho é
 * o número de cartões que aparecem ao abrir. E que abrir um dia abre só aquele.
 */

function cabecalhos(page: Page) {
  return page.locator("main h2 > button[aria-expanded]");
}

function cartoes(page: Page) {
  return page.getByRole("button", { name: /^Ver detalhes: / });
}

/** O número entre parênteses no cabeçalho: "(3 apostas)" → 3. */
async function contagemDoCabecalho(cabecalho: Locator) {
  const texto = (await cabecalho.textContent()) ?? "";
  return Number(texto.match(/\((\d+) apostas?\)/)?.[1]);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/apostas");
  await expect(cartoes(page).first()).toBeVisible({ timeout: 15_000 });
});

test("o feed não tem mais Top Adms", async ({ page }) => {
  await expect(page.getByText(/Top Adms/)).toHaveCount(0);
});

test("recolher tudo deixa só os dias, e cada dia abre com a contagem que promete", async ({
  page,
}) => {
  const dias = cabecalhos(page);
  expect(await dias.count()).toBeGreaterThan(1);

  await page.getByRole("button", { name: "Recolher tudo" }).click();
  await expect(cartoes(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Recolher tudo" })).toBeDisabled();

  // Abre o segundo dia, e só ele.
  const segundo = dias.nth(1);
  await segundo.click();
  await expect(segundo).toHaveAttribute("aria-expanded", "true");
  await expect(dias.first()).toHaveAttribute("aria-expanded", "false");
  await expect(cartoes(page)).toHaveCount(await contagemDoCabecalho(segundo));

  // Clicar de novo fecha.
  await segundo.click();
  await expect(cartoes(page)).toHaveCount(0);
});

test("expandir tudo abre todas as apostas do filtro", async ({ page }) => {
  await page.getByRole("button", { name: "Recolher tudo" }).click();
  await expect(cartoes(page)).toHaveCount(0);

  await page.getByRole("button", { name: "Expandir tudo" }).click();
  await expect(page.getByRole("button", { name: "Expandir tudo" })).toBeDisabled();

  // A soma dos cabeçalhos é o total de cartões — nenhum dia esconde aposta.
  let soma = 0;
  for (const cabecalho of await cabecalhos(page).all()) {
    soma += await contagemDoCabecalho(cabecalho);
  }
  await expect(cartoes(page)).toHaveCount(soma);
});

test("o dia recolhe e expande pelo teclado", async ({ page }) => {
  const primeiro = cabecalhos(page).first();
  await expect(primeiro).toHaveAttribute("aria-expanded", "true");

  await primeiro.focus();
  await page.keyboard.press("Enter");
  await expect(primeiro).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("Enter");
  await expect(primeiro).toHaveAttribute("aria-expanded", "true");
});

test("o cartão da aposta sobe no hover", async ({ page }) => {
  // Mesmo defeito de Adms: o framer escrevia `transform` inline no cartão, e o
  // hover:-translate-y-0.5 nunca vencia. Ver e2e/pulinho.spec.ts.
  const cartao = cartoes(page).first();
  const deslocamentoY = () =>
    cartao.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42);

  await expect.poll(deslocamentoY).toBe(0);
  await cartao.hover();
  await expect.poll(deslocamentoY).toBeLessThan(-1);
});
