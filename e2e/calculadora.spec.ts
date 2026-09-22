import { expect, type Page, test } from "@playwright/test";
import { textosSemContraste } from "./ajudantes";

/**
 * A calculadora de valor esperado (#71).
 *
 * As contas estão testadas em lib/calculadora.test.ts; aqui se confere o que só
 * quebra na tela: campo que não chega à conta, resultado que não aparece, modo
 * que não vai para o endereço. E que a página continua escondida enquanto não
 * se decide se ela será aberta a todos.
 */

const resultado = (page: Page) => page.getByRole("region", { name: "Resultado" });

async function preencher(page: Page, campos: Record<string, string>) {
  for (const [rotulo, valor] of Object.entries(campos)) {
    await page.getByLabel(rotulo, { exact: true }).fill(valor);
  }
}

test("fica fora do menu, do rodapé, do sitemap e da busca", async ({ page, request }) => {
  await page.goto("/calculadora");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/
  );
  await expect(page.locator('a[href="/calculadora"]')).toHaveCount(0);

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("/calculadora");
});

test("odd justa: 1,90 contra 1,90 e 2,10 encontrada dá +5%", async ({ page }) => {
  await page.goto("/calculadora");
  await expect(resultado(page)).toContainText("Preencha as odds");

  await preencher(page, {
    "Odd analisada": "1,90",
    "Odd contrária": "1,90",
    "Odd encontrada": "2,10",
  });
  await expect(resultado(page)).toContainText("Aposta de valor");
  await expect(resultado(page)).toContainText("+5,00%");
  await expect(resultado(page)).toContainText("2,00");
  await expect(resultado(page)).toContainText("5,26%");
});

// Casa escreve odd com três casas. Lida como dinheiro, "1.850" seria 1.850.
test("odd com três casas e ponto é lida como decimal", async ({ page }) => {
  await page.goto("/calculadora");
  await preencher(page, {
    "Odd analisada": "1.850",
    "Odd contrária": "1.850",
    "Odd encontrada": "1.950",
  });
  await expect(resultado(page)).toContainText("Sem valor");
  await expect(resultado(page)).toContainText("-2,50%");
});

test("odd inválida avisa no campo e não calcula", async ({ page }) => {
  await page.goto("/calculadora");
  await preencher(page, {
    "Odd analisada": "abc",
    "Odd contrária": "1,90",
    "Odd encontrada": "2,10",
  });
  await expect(page.getByLabel("Odd analisada", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true"
  );
  await expect(page.getByText("Use um número maior que 1")).toBeVisible();
  await expect(resultado(page)).toContainText("Preencha as odds");
});

test("mercado de 3 resultados pede duas odds contrárias", async ({ page }) => {
  await page.goto("/calculadora");
  await page.getByRole("button", { name: "3 resultados (1X2)" }).click();
  await preencher(page, {
    "Odd analisada": "2,00",
    "Odd contrária 1": "3,40",
    "Odd contrária 2": "3,60",
    "Odd encontrada": "2,50",
  });
  await expect(resultado(page)).toContainText("+16,62%");
  await expect(resultado(page)).toContainText("2,14");
});

test("hold: o modo vai para o endereço e volta depois de recarregar", async ({ page }) => {
  await page.goto("/calculadora");
  await page.getByRole("button", { name: "Hold", exact: true }).click();
  await expect(page).toHaveURL(/\?modo=hold$/);

  await preencher(page, {
    "Odd de referência": "1,90",
    "Hold (margem da casa)": "4",
    "Odd encontrada": "2,10",
  });
  await expect(resultado(page)).toContainText("1,98");
  await expect(resultado(page)).toContainText("+6,28%");

  await page.reload();
  await expect(page.getByRole("button", { name: "Hold", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
});

test("surebet divide o valor, ou avisa quando não existe", async ({ page }) => {
  await page.goto("/calculadora?modo=surebet");
  await preencher(page, {
    "Odd do resultado 1": "2,10",
    "Odd do resultado 2": "2,10",
  });
  await expect(resultado(page)).toContainText("+5,00%");
  await expect(resultado(page).getByRole("table")).toContainText("R$ 50,00");

  await preencher(page, { "Odd do resultado 1": "1,90", "Odd do resultado 2": "1,90" });
  await expect(resultado(page)).toContainText("Não há surebet");
  await expect(resultado(page)).toContainText("105,26%");
});

test("múltiplas: exemplo, seleção nova e remoção", async ({ page }) => {
  await page.goto("/calculadora?modo=multipla");
  await page.getByText("Como usar").click();
  await page.getByRole("button", { name: "Preencher com o exemplo" }).click();
  await expect(resultado(page)).toContainText("+7,29%");
  await expect(resultado(page)).toContainText("4,29");

  await page.getByRole("button", { name: "Adicionar seleção" }).click();
  await expect(page.getByRole("group", { name: "Seleção 3", exact: true })).toBeVisible();
  // Seleção vazia: a conta espera por ela.
  await expect(resultado(page)).toContainText("Preencha as odds");

  await page.getByRole("button", { name: "Remover a seleção 3" }).click();
  await expect(resultado(page)).toContainText("+7,29%");
});

for (const tema of ["claro", "escuro"] as const) {
  test(`nenhum texto abaixo do contraste mínimo no tema ${tema}`, async ({ browser }) => {
    // Três auditorias de contraste na mesma página passam dos 30 s padrão.
    test.setTimeout(90_000);
    const contexto = await browser.newContext({ reducedMotion: "reduce" });
    const page = await contexto.newPage();
    await page.addInitScript((v) => localStorage.setItem("geogetips-tema", v), tema);

    // Com aposta de valor, sem valor e com erro no campo, para medir as três cores.
    await page.goto("/calculadora", { waitUntil: "networkidle" });
    await preencher(page, {
      "Odd analisada": "1,90",
      "Odd contrária": "1,90",
      "Odd encontrada": "2,10",
    });
    await page.getByText("Como usar").click();
    expect(await textosSemContraste(page)).toEqual([]);

    await preencher(page, { "Odd encontrada": "1,80" });
    await expect(resultado(page)).toContainText("Sem valor");
    await preencher(page, { "Odd analisada": "x" });
    expect(await textosSemContraste(page)).toEqual([]);

    await page.getByRole("button", { name: "Surebet", exact: true }).click();
    await preencher(page, { "Odd do resultado 1": "2,10", "Odd do resultado 2": "2,10" });
    expect(await textosSemContraste(page)).toEqual([]);
    await contexto.close();
  });
}
