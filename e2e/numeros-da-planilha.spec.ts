import { expect, type Page, test } from "@playwright/test";

/**
 * Números que precisam bater com a planilha também na escrita (#87).
 *
 * As contas estão nos testes de unidade (format, sheets, csv, planilhaPublica).
 * Aqui fica o que só a tela mostra: o zero sem sinal e sem cor de ganho, o
 * cartão sem red dizendo "Nenhuma", as casas decimais dos cartões animados e as
 * janelas do gráfico medidas só até hoje.
 */

/** O texto que o leitor de tela lê de um cartão de KPI: o valor por extenso. */
function valorDoCartao(page: Page, regiao: string, rotulo: string) {
  return page
    .getByRole("region", { name: regiao })
    .locator("div")
    .filter({ has: page.getByText(rotulo, { exact: true }) })
    .locator(".sr-only")
    .first();
}

test("o dia só com pendentes sai sem sinal e sem cor de lucro", async ({ page }) => {
  await page.goto("/apostas?resultado=pendente");
  const cabecalhos = page.locator("main h2 button[aria-expanded]");
  await expect(cabecalhos.first()).toBeVisible({ timeout: 15_000 });

  const selos = cabecalhos.locator("span.rounded-full");
  const quantos = await selos.count();
  expect(quantos).toBeGreaterThan(0);
  for (let i = 0; i < quantos; i++) {
    const selo = selos.nth(i);
    await expect(selo).toHaveText(/^R\$\s0,00$/);
    await expect(selo).not.toHaveClass(/green|red/);
  }
  // O resumo do filtro também: pendente não deu lucro nem prejuízo.
  await expect(page.getByText("Lucro do Filtro").locator("..")).toContainText(/R\$\s0,00/);
  await expect(page.getByText("Lucro do Filtro").locator("..")).not.toContainText("+R$");
});

test("sem red no recorte, a maior red diz Nenhuma", async ({ page }) => {
  // 27/08 só tem greens no modo demonstração.
  await page.goto("/painel?de=2026-08-27&ate=2026-08-27");
  const bloco = page.getByRole("region", { name: "Atenção" });
  const red = bloco.locator("div").filter({ has: page.locator("dt", { hasText: "Maior red" }) });
  await expect(red.locator("dd span").first()).toHaveText("Nenhuma", { timeout: 15_000 });
  await expect(red).toContainText("Nenhuma red neste recorte");
  await expect(bloco).not.toContainText(/\+R\$\s0,00/);
});

test("ROI com duas casas e taxa com uma, também nos cartões animados", async ({ page }) => {
  // 24/08: uma green, uma red e uma anulada. Taxa de 50% e ROI de 1,8%, que
  // saíam "50%" e "+1,8%" ao lado das tabelas com "50,0%" e "+1,80%".
  await page.goto("/painel?de=2026-08-24&ate=2026-08-24");
  await expect(valorDoCartao(page, "Indicadores do período", "ROI")).toHaveText("+1,80%", {
    timeout: 15_000,
  });
  await expect(
    valorDoCartao(page, "Indicadores do período", "Taxa de Acerto")
  ).toHaveText("50,0%");
});

test("aposta de longo prazo não estica as janelas do gráfico", async ({ page }) => {
  // Uma aposta de campeão em dezembro, pendente, no meio do mês de demonstração.
  await page.route((url) => url.pathname === "/api/bets", async (rota) => {
    const resposta = await rota.fetch();
    const json = await resposta.json();
    if (Array.isArray(json.data) && json.data.length > 0) {
      json.data.push({
        ...json.data[0],
        id: "longo-prazo",
        data: "20/12/2026",
        partida: "Campeão do Brasileirão",
        resultado: "PENDENTE",
        lucro: 0,
      });
    }
    await rota.fulfill({ response: resposta, json });
  });
  await page.goto("/painel");
  const evolucao = page.getByRole("region", { name: /Evolução da Banca/ });
  await expect(evolucao.getByRole("img")).toBeVisible({ timeout: 15_000 });
  // As apostas vividas cobrem 23/08 a 27/08: nenhuma janela menor que isso.
  // Contando dezembro, 7D, 30D e 90D apareciam, e desenhavam o mesmo que Tudo.
  await expect(evolucao.getByRole("button")).toHaveText(["Tudo"]);
});
