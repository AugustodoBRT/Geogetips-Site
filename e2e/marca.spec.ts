import { expect, type Page, test } from "@playwright/test";

/**
 * A marca, o G orbital (#64).
 *
 * É um SVG que pinta com os tokens do tema, e é aí que ela pode quebrar sem
 * ninguém ver: um hexadecimal que escape para dentro dela e o G fica preto no
 * tema escuro.
 */

async function coresDaMarca(page: Page) {
  return page.evaluate(() => {
    const svg = document.querySelector("nav a[href='/'] svg");
    const traco = svg?.querySelector("path");
    const no = svg?.querySelector("circle");
    if (!traco || !no) return null;
    return { traco: getComputedStyle(traco).stroke, no: getComputedStyle(no).fill };
  });
}

test("a marca da barra acompanha o tema", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");

  // O desenho é enfeite: quem lê a tela ouve o nome, não "imagem".
  await expect(
    page.getByRole("link", { name: "GeogeTips", exact: true }).first()
  ).toBeVisible();

  expect(await coresDaMarca(page)).toEqual({
    traco: "rgb(22, 19, 31)",
    no: "rgb(107, 63, 228)",
  });

  await page.getByRole("button", { name: "Tema escuro" }).click();
  expect(await coresDaMarca(page)).toEqual({
    traco: "rgb(238, 235, 245)",
    no: "rgb(155, 124, 246)",
  });
});

test("o ícone da aba sai", async ({ request }) => {
  const resposta = await request.get("/icon");
  expect(resposta.ok()).toBe(true);
  expect(resposta.headers()["content-type"]).toContain("image/png");
  expect((await resposta.body()).length).toBeGreaterThan(300);
});
