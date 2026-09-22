import { expect, type Page, test } from "@playwright/test";
import { textosSemContraste } from "./ajudantes";

/**
 * Perguntas frequentes e o método dos números (#66).
 *
 * A página é texto do servidor, e quebra de jeitos que não dão erro: a âncora
 * que o Painel usa deixar de existir, os dados estruturados saírem inválidos,
 * ou uma resposta fechada esconder texto de contraste baixo.
 */

async function abrirTodas(page: Page) {
  await page.evaluate(() => {
    for (const d of document.querySelectorAll("details")) d.open = true;
  });
}

test("a página abre com o método e as perguntas, legível sem JavaScript", async ({
  browser,
}) => {
  // Sem movimento: a rolagem suave do site, com a pergunta abaixo da dobra,
  // deixava o alvo deslizando quando o clique chegava, e o Playwright esperava
  // até o fim do teste pelo elemento parar.
  const contexto = await browser.newContext({
    javaScriptEnabled: false,
    reducedMotion: "reduce",
  });
  const page = await contexto.newPage();
  await page.goto("/perguntas");

  await expect(
    page.getByRole("heading", { level: 1, name: "Perguntas frequentes" })
  ).toBeVisible();
  await expect(page.locator("#roi")).toContainText("anuladas e as pendentes");

  // <details> abre sem script nenhum.
  const pergunta = page.getByText("De onde vêm os números?");
  await pergunta.click();
  await expect(page.getByText("Nenhum número é digitado à mão aqui.")).toBeVisible();
  await contexto.close();
});

test("os dados estruturados são um FAQPage válido, com todas as perguntas", async ({
  page,
}) => {
  await page.goto("/perguntas");
  const json = await page.locator('script[type="application/ld+json"]').textContent();
  const dados = JSON.parse(json ?? "{}");
  expect(dados["@type"]).toBe("FAQPage");

  const titulos = await page.locator("dt, summary").count();
  expect(dados.mainEntity).toHaveLength(titulos);
  for (const q of dados.mainEntity) {
    expect(q["@type"]).toBe("Question");
    expect(q.acceptedAnswer.text.length).toBeGreaterThan(20);
  }
});

test("o ROI do Painel leva à explicação dele", async ({ page }) => {
  await page.goto("/painel");
  await page.getByRole("link", { name: "Lucro sobre o total apostado" }).click();
  await expect(page).toHaveURL(/\/perguntas#roi$/);
  await expect(page.locator("#roi")).toBeInViewport();
});

test("menu, rodapé e home apontam para a página", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("navigation", { name: "Navegação principal" }).getByRole("link", {
      name: "FAQ",
    })
  ).toHaveAttribute("href", "/perguntas");
  await expect(
    page.getByRole("contentinfo").getByRole("link", { name: "Perguntas frequentes" })
  ).toHaveAttribute("href", "/perguntas");
  await expect(
    page.getByRole("link", { name: "Outras dúvidas frequentes" })
  ).toHaveAttribute("href", "/perguntas");

  await page.goto("/perguntas");
  await expect(
    page.getByRole("navigation", { name: "Navegação principal" }).getByRole("link", {
      name: "FAQ",
    })
  ).toHaveAttribute("aria-current", "page");
});

for (const tema of ["claro", "escuro"] as const) {
  test(`nenhum texto abaixo do contraste mínimo no tema ${tema}`, async ({ browser }) => {
    const contexto = await browser.newContext({ reducedMotion: "reduce" });
    const page = await contexto.newPage();
    await page.addInitScript((v) => localStorage.setItem("geogetips-tema", v), tema);
    await page.goto("/perguntas", { waitUntil: "networkidle" });
    await abrirTodas(page);
    await page.waitForTimeout(300);
    expect(await textosSemContraste(page)).toEqual([]);
    await contexto.close();
  });
}
