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
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
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
    "Odd analisada": "0,95",
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
  await page.getByLabel("Resultados do mercado", { exact: true }).selectOption("3");
  await preencher(page, {
    "Odd analisada": "2,00",
    "Odd contrária 1": "3,40",
    "Odd contrária 2": "3,60",
    "Odd encontrada": "2,50",
  });
  await expect(resultado(page)).toContainText("+16,62%");
  await expect(resultado(page)).toContainText("2,14");
});

test("hold: o modo vai para o endereço e volta depois de recarregar", async ({
  page,
}) => {
  await page.goto("/calculadora");
  await page.getByRole("button", { name: "Hold", exact: true }).click();
  await expect(page).toHaveURL(/\?modo=hold$/);

  await preencher(page, {
    "Odd de referência": "1,90",
    "Hold (margem da casa)": "4",
    "Odd encontrada": "2,10",
  });
  await expect(resultado(page)).toContainText("1,976");
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
  await expect(resultado(page)).toContainText("4,288");

  await page.getByRole("button", { name: "Adicionar seleção" }).click();
  await expect(page.getByRole("group", { name: "Seleção 3", exact: true })).toBeVisible();
  // Seleção vazia: a conta espera por ela.
  await expect(resultado(page)).toContainText("Preencha as odds");

  await page.getByRole("button", { name: "Remover a seleção 3" }).click();
  await expect(resultado(page)).toContainText("+7,29%");
});

test("a stake de Kelly sai em unidades, e a fração e a banca ficam guardadas", async ({
  page,
}) => {
  await page.goto("/calculadora");
  await preencher(page, {
    "Odd analisada": "1,90",
    "Odd contrária": "1,90",
    "Odd encontrada": "2,10",
  });
  // Probabilidade de 50% numa odd 2,10: Kelly inteiro de 4,55% da banca, e um
  // quarto dele, o padrão, 1,14%. Com a banca de 100u, 1,14u.
  const stake = resultado(page)
    .getByRole("heading", { name: "Stake recomendada" })
    .locator("..")
    .locator("..");
  await expect(stake).toContainText("Kelly 1/4");
  await expect(stake).toContainText("1,14u");
  await expect(stake).toContainText("1,14% da banca");
  await expect(stake).toContainText(/R\$\s113,64 com 1u = R\$\s100,00/);

  await stake.getByRole("button", { name: "1/2" }).click();
  await expect(stake).toContainText("2,27u");
  await page.getByLabel("Banca", { exact: true }).fill("50");
  await expect(stake).toContainText("1,14u");
  await expect(stake).toContainText("2,27% da banca");

  await page.reload();
  await preencher(page, {
    "Odd analisada": "1,90",
    "Odd contrária": "1,90",
    "Odd encontrada": "2,10",
  });
  await expect(stake.getByRole("button", { name: "1/2" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(page.getByLabel("Banca", { exact: true })).toHaveValue("50");
});

test("sem valor, o Kelly manda não apostar; com valor alto demais, pede conferência", async ({
  page,
}) => {
  await page.goto("/calculadora");
  await preencher(page, {
    "Odd analisada": "1,90",
    "Odd contrária": "1,90",
    "Odd encontrada": "1,80",
  });
  await expect(resultado(page)).toContainText("o Kelly manda não apostar");
  await expect(resultado(page)).toContainText("0u");

  // EV de 50%: um quarto do Kelly dá 6,25% da banca.
  await preencher(page, { "Odd encontrada": "3,00" });
  await expect(resultado(page)).toContainText("6,25u");
  await expect(resultado(page)).toContainText("Mais de 5% da banca numa aposta só");
});

test("hold e múltiplas também dão a stake; surebet não, porque o valor é dividido", async ({
  page,
}) => {
  await page.goto("/calculadora?modo=hold");
  await preencher(page, {
    "Odd de referência": "2,00",
    "Hold (margem da casa)": "10",
    "Odd encontrada": "2,50",
  });
  // Odd justa 2,20, EV de 13,64%: Kelly inteiro de 9,09%, um quarto 2,27%.
  await expect(resultado(page)).toContainText("+13,64%");
  await expect(resultado(page)).toContainText("2,27u");

  await page.getByRole("button", { name: "Múltiplas", exact: true }).click();
  await page.getByText("Como usar").click();
  await page.getByRole("button", { name: "Preencher com o exemplo" }).click();
  await expect(resultado(page)).toContainText("Stake recomendada");

  await page.getByRole("button", { name: "Surebet", exact: true }).click();
  await preencher(page, { "Odd do resultado 1": "2,10", "Odd do resultado 2": "2,10" });
  await expect(resultado(page)).toContainText("Surebet");
  await expect(resultado(page)).not.toContainText("Stake recomendada");
});

test("odd justa vai até 8 resultados", async ({ page }) => {
  await page.goto("/calculadora");
  const seletor = page.getByLabel("Resultados do mercado", { exact: true });
  await expect(seletor.locator("option")).toHaveCount(7);
  await seletor.selectOption("8");

  // Oito resultados a 8,00 somam exatamente 100%: sem margem, a odd justa é
  // a própria 8,00, e 9,00 encontrada dá 12,5% de valor.
  await preencher(page, { "Odd analisada": "8" });
  for (let i = 1; i <= 7; i++) await preencher(page, { [`Odd contrária ${i}`]: "8" });
  await preencher(page, { "Odd encontrada": "9" });
  await expect(resultado(page)).toContainText("+12,50%");
  await expect(resultado(page)).toContainText("0,00%");
});

test("surebet vai até 4 resultados", async ({ page }) => {
  await page.goto("/calculadora?modo=surebet");
  const seletor = page.getByLabel("Resultados do mercado", { exact: true });
  await expect(seletor.locator("option")).toHaveCount(3);
  await seletor.selectOption("4");

  // Quatro resultados a 4,20 somam 95,24%: R$ 25,00 em cada, 5% de lucro.
  for (let i = 1; i <= 4; i++)
    await preencher(page, { [`Odd do resultado ${i}`]: "4,20" });
  await expect(resultado(page)).toContainText("+5,00%");
  await expect(resultado(page).getByRole("table").locator("tbody tr")).toHaveCount(4);
  await expect(resultado(page).getByRole("table")).toContainText("R$ 25,00");
});

test("a odd se arruma enquanto se digita e fica com duas ou três casas ao sair", async ({
  page,
}) => {
  await page.goto("/calculadora");
  const analisada = page.getByLabel("Odd analisada", { exact: true });
  const contraria = page.getByLabel("Odd contrária", { exact: true });

  // Ponto vira vírgula, letra não entra, e a quarta casa não cabe.
  await analisada.pressSequentially("1.8a756");
  await expect(analisada).toHaveValue("1,875");
  // Enter passa para o próximo campo, e sair do campo fecha o formato.
  await analisada.press("Enter");
  await expect(contraria).toBeFocused();
  await expect(analisada).toHaveValue("1,875");

  await contraria.pressSequentially("2");
  await contraria.press("Tab");
  await expect(contraria).toHaveValue("2,00");

  // Três casas com zero no fim viram duas: 1,850 é 1,85.
  await analisada.fill("1.850");
  await analisada.blur();
  await expect(analisada).toHaveValue("1,85");

  // Em reais, o milhar aparece ao sair.
  await page.getByRole("button", { name: "Surebet", exact: true }).click();
  const investimento = page.getByLabel("Investimento total (R$)", { exact: true });
  await investimento.fill("1000");
  await investimento.blur();
  await expect(investimento).toHaveValue("1.000,00");
});

test("com a referência completa, a odd justa aparece antes da odd encontrada", async ({
  page,
}) => {
  await page.goto("/calculadora");
  await preencher(page, { "Odd analisada": "1,90", "Odd contrária": "1,90" });
  await expect(resultado(page)).toContainText("Falta a odd encontrada");
  await expect(resultado(page)).toContainText("2,00");
  // E ao lado do campo da odd encontrada, para comparar de olho.
  await expect(
    page
      .getByRole("region", { name: "Dados da aposta" })
      .getByText("2,000", { exact: true })
  ).toBeVisible();

  await preencher(page, { "Odd encontrada": "2,10" });
  await expect(resultado(page)).toContainText("+5,00%");

  await page.getByRole("button", { name: "Limpar" }).click();
  await expect(page.getByLabel("Odd analisada", { exact: true })).toHaveValue("");
  await expect(resultado(page)).toContainText("Preencha as odds");
});

test("a lista diz só quantos resultados o mercado tem", async ({ page }) => {
  await page.goto("/calculadora");
  const opcoes = await page
    .getByLabel("Resultados do mercado", { exact: true })
    .locator("option")
    .allTextContents();
  expect(opcoes.slice(0, 2)).toEqual(["2 resultados", "3 resultados"]);
});

// Os campos aceitam três casas. Com a odd justa em duas, 2,781 aparecia como
// "2,78", e a tela dizia "Sem valor" para 2,78 e "tem valor acima de 2,78".
test("a odd justa sai com três casas, e 2,78 contra 2,781 não tem valor", async ({
  page,
}) => {
  await page.goto("/calculadora");
  await page.getByLabel("Resultados do mercado", { exact: true }).selectOption("3");
  await preencher(page, {
    "Odd analisada": "2,62",
    "Odd contrária 1": "3,80",
    "Odd contrária 2": "2,40",
    "Odd encontrada": "2,78",
  });
  await expect(resultado(page)).toContainText("Sem valor");
  await expect(resultado(page)).toContainText("acima de 2,781");
  await expect(resultado(page)).not.toContainText("acima de 2,78.");
});

test("hold mostra a margem e o payout", async ({ page }) => {
  await page.goto("/calculadora?modo=hold");
  await preencher(page, {
    "Odd de referência": "2,00",
    "Hold (margem da casa)": "10",
    "Odd encontrada": "2,50",
  });
  await expect(resultado(page)).toContainText("2,200");
  await expect(resultado(page)).toContainText("10,00%");
  await expect(resultado(page)).toContainText("90,9%");
});

test("surebet arredonda as apostas e mostra o lucro garantido e o máximo", async ({
  page,
}) => {
  await page.goto("/calculadora?modo=surebet");
  await preencher(page, { "Odd do resultado 1": "2,08", "Odd do resultado 2": "2,02" });
  await expect(resultado(page)).toContainText("R$ 2,47");

  await page.getByRole("button", { name: "R$ 5", exact: true }).click();
  const linhas = resultado(page).getByRole("table").locator("tbody tr");
  await expect(linhas.nth(0)).toContainText("R$ 50,00");
  await expect(linhas.nth(1)).toContainText("R$ 50,00");
  // Sai o primeiro, volta 104; sai o segundo, 101. Garantido é o menor.
  await expect(resultado(page)).toContainText(/Lucro garantido de R\$\s1,00/);
  await expect(resultado(page)).toContainText(/até R\$\s4,00/);
});

test("surebet que o arredondamento come tem a própria mensagem", async ({ page }) => {
  await page.goto("/calculadora?modo=surebet");
  // 2,001 e 2,000 somam 99,98%: existe. Com R$ 10, as apostas de R$ 5,00
  // voltam 10,01 e 10,00, e não sobra lucro.
  await preencher(page, {
    "Odd do resultado 1": "2,001",
    "Odd do resultado 2": "2,000",
    "Investimento total (R$)": "10",
  });
  await expect(resultado(page)).toContainText("Surebet sem lucro");
  await expect(resultado(page)).toContainText("a surebet existe");
  await expect(resultado(page)).not.toContainText("precisa ficar abaixo de 100%");
});

test("no celular, o resumo aparece logo depois dos campos e leva ao resultado", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/calculadora");
  await preencher(page, {
    "Odd analisada": "1,90",
    "Odd contrária": "1,90",
    "Odd encontrada": "2,10",
  });
  const resumo = page.getByRole("button", { name: /\+5,00% de valor · 1,14u/ });
  await expect(resumo).toBeVisible();
  await resumo.click();
  await expect(resultado(page).getByText("Stake recomendada")).toBeInViewport();

  // No computador o resultado já está ao lado, e o resumo não aparece.
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(resumo).toBeHidden();
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
    await preencher(page, { "Odd analisada": "0,5" });
    expect(await textosSemContraste(page)).toEqual([]);

    await page.getByRole("button", { name: "Surebet", exact: true }).click();
    await preencher(page, { "Odd do resultado 1": "2,10", "Odd do resultado 2": "2,10" });
    expect(await textosSemContraste(page)).toEqual([]);
    await contexto.close();
  });
}
