import { expect, type Locator, type Page, test } from "@playwright/test";
import { semRolagemSuave } from "./ajudantes";

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

  // A soma dos cabeçalhos é o total de cartões — nenhum dia esconde aposta.
  let soma = 0;
  for (const cabecalho of await cabecalhos(page).all()) {
    soma += await contagemDoCabecalho(cabecalho);
  }
  await expect(cartoes(page)).toHaveCount(soma);
});

test("um botão só alterna entre recolher e expandir, conforme a ação anterior", async ({
  page,
}) => {
  const alternar = page.getByRole("button", { name: /^(Recolher|Expandir) tudo$/ });
  await expect(alternar).toHaveCount(1);

  // Mora na barra de filtros, ao lado da faixa de odd — sem linha própria.
  const barraDaOdd = page
    .getByRole("group", { name: "Filtrar por faixa de odd" })
    .locator("..");
  await expect(barraDaOdd.getByRole("button", { name: /tudo$/ })).toHaveCount(1);

  await expect(alternar).toHaveText("Recolher tudo");
  await alternar.click();
  await expect(cartoes(page)).toHaveCount(0);
  await expect(alternar).toHaveText("Expandir tudo");

  // Abrir um dia à mão não troca a oferta: a ação anterior foi recolher.
  await cabecalhos(page).first().click();
  await expect(alternar).toHaveText("Expandir tudo");

  await alternar.click();
  await expect(alternar).toHaveText("Recolher tudo");

  // E fechar um dia à mão também não.
  await cabecalhos(page).first().click();
  await expect(alternar).toHaveText("Recolher tudo");
});

test("clicar na setinha recolhe e expande o dia", async ({ page }) => {
  // A seta fica na borda esquerda de um botão da largura da tela. Com o
  // afundar de 3% que todo botão do site faz ao ser pressionado, essa borda
  // andava ~16 px para dentro entre o apertar e o soltar: o cursor sobre a seta
  // ficava fora do botão, e o clique ia para o elemento de fora.
  const primeiro = cabecalhos(page).first();
  const seta = primeiro.locator("svg").first();
  await expect(primeiro).toHaveAttribute("aria-expanded", "true");

  await seta.click();
  await expect(primeiro).toHaveAttribute("aria-expanded", "false");
  await seta.click();
  await expect(primeiro).toHaveAttribute("aria-expanded", "true");
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

  // Rolagem suave desligada: o porquê está em e2e/ajudantes.ts.
  await semRolagemSuave(page);
  await cartao.scrollIntoViewIfNeeded();
  await expect.poll(deslocamentoY).toBe(0);
  await cartao.hover();
  await expect.poll(deslocamentoY).toBeLessThan(-1);
});
